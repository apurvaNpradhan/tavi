#!/usr/bin/env bash
# Provisions Sentry dashboards from sentry/dashboards.json via the Sentry REST API.
#
# Idempotent: a dashboard whose title already exists is updated in place. Filters
# set in the Sentry UI (projects, environment, period) are preserved by reading
# the current dashboard first and swapping only its widgets, so re-running this
# after a UI tweak does not reset it.
#
# Usage:
#   SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-dashboards.sh
#   SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-dashboards.sh --dry-run
#
# The token needs org:write.
# Generate one at https://sentry.io/settings/account/api/auth-tokens/
#
# Overrides, for a run against a different organization or region:
#   SENTRY_ORG, SENTRY_API_BASE, SENTRY_DASHBOARDS_FILE, SENTRY_DRY_RUN=1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")"
DASHBOARDS_FILE="${SENTRY_DASHBOARDS_FILE:-${CONFIG_DIR}/sentry/dashboards.json}"

# ---- output helpers ---------------------------------------------------------
if [ -t 1 ]; then
  C_RESET=$'\033[0m'
  C_INFO=$'\033[1;34m'
  C_OK=$'\033[1;32m'
  C_ERR=$'\033[1;31m'
else
  C_RESET=""; C_INFO=""; C_OK=""; C_ERR=""
fi
info() { printf '%s[info]%s %s\n' "$C_INFO" "$C_RESET" "$*"; }
ok()   { printf '%s[ok]%s   %s\n' "$C_OK"   "$C_RESET" "$*"; }
err()  { printf '%s[err]%s  %s\n' "$C_ERR"  "$C_RESET" "$*" >&2; }

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ] || [ "${SENTRY_DRY_RUN:-0}" = "1" ]; then
  DRY_RUN=1
fi

# ---- prerequisites ----------------------------------------------------------
if [ -z "${SENTRY_API_TOKEN:-}" ]; then
  err "SENTRY_API_TOKEN is not set. Generate one at https://sentry.io/settings/account/api/auth-tokens/ with the org:write scope."
  exit 1
fi
if [ ! -f "$DASHBOARDS_FILE" ]; then
  err "Dashboards config not found at $DASHBOARDS_FILE"
  exit 1
fi
command -v jq >/dev/null || { err "jq is required"; exit 1; }

# ---- configuration ----------------------------------------------------------
if [ -n "${SENTRY_ORG:-}" ]; then
  ORG="$SENTRY_ORG"
else
  ORG=$(jq -er '.organization' "$DASHBOARDS_FILE") || {
    err "missing or invalid \`organization\` in $DASHBOARDS_FILE (or set SENTRY_ORG)"
    exit 1
  }
fi

REGION=$(jq -er '.region' "$DASHBOARDS_FILE") || {
  err "missing or invalid \`region\` in $DASHBOARDS_FILE"
  exit 1
}

if [ -n "${SENTRY_API_BASE:-}" ]; then
  API_BASE="$SENTRY_API_BASE"
else
  API_BASE=$(jq -er '.api_base' "$DASHBOARDS_FILE") || {
    err "missing or invalid \`api_base\` in $DASHBOARDS_FILE (or set SENTRY_API_BASE)"
    exit 1
  }
fi

# ---- API helpers ------------------------------------------------------------
api_call() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  local body_args=()
  if [ -n "$body" ]; then
    body_args+=(-d "$body")
  fi

  local tmp status
  tmp=$(mktemp)

  status=$(curl -sS --fail-with-body \
    -o "$tmp" \
    -w "%{http_code}" \
    -X "$method" \
    -H "Authorization: Bearer ${SENTRY_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "${body_args[@]}" \
    "$url" 2>/dev/null) || {
    err "HTTP ${status:-?} from $method $url"
    err "Request body: $body"
    err "Response body:"
    [ -s "$tmp" ] && sed 's/^/  /' "$tmp" >&2 || echo "  (empty)" >&2
    rm -f "$tmp"
    return 1
  }

  cat "$tmp"
  rm -f "$tmp"
}

list_dashboards() { api_call GET "${API_BASE}/organizations/${ORG}/dashboards/"; }

# Prints the matching dashboard as compact JSON, or nothing.
#
# The list output is captured before filtering so its exit status survives: in a
# pipeline the jq side would swallow a failed api_call and the caller would read
# it as "no match", creating a duplicate dashboard.
find_dashboard_by_title() {
  local title="$1" response
  response=$(list_dashboards) || return 1
  echo "$response" | jq -c --arg title "$title" '.[] | select(.title == $title)' | head -n1
}

create_or_update_dashboard() {
  local body="$1" id="${2:-}"
  local method=POST
  local url="${API_BASE}/organizations/${ORG}/dashboards/"

  if [ -n "$id" ]; then
    method=PUT
    url="${url}${id}/"
  fi

  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] would $method $url" >&2
    echo "$body" | jq . >&2
    echo "stub-id"
    return 0
  fi

  local resp
  resp=$(api_call "$method" "$url" "$body") || return 1
  echo "$resp" | jq -r '.id // empty'
}

# ---- validation -------------------------------------------------------------
COUNT=$(jq '.dashboards | length' "$DASHBOARDS_FILE")
info "Reading $COUNT dashboard(s) from $DASHBOARDS_FILE"
[ "$DRY_RUN" = "1" ] && info "DRY RUN: no changes will be made"
info "Organization: $ORG, Region: $REGION"

if jq -r '.dashboards[] | select(.title == null or .title == "")' "$DASHBOARDS_FILE" | grep -q .; then
  err "One or more dashboards in $DASHBOARDS_FILE have a missing title. Fix and retry."
  exit 1
fi

# Fields the API requires that the spec does not repeat:
#   - `datasetSource: "user"` on every widget of a user-defined dashboard.
#   - `conditions: ""` on every query.
#   - `limit` on widgets that render a time series (line/bar/area). The API
#     rejects a widget without it, and rejects a value above 10, so 10 is used
#     everywhere. Tables accept it but do not need it, so they are left alone.
JQ_WIDGET_DEFAULTS='
  map(. + {datasetSource: "user"}
    + (if .displayType == "table" then {} else {limit: 10} end))
  | map(.queries = (.queries | map(. + {conditions: ""})))
'

# ---- main loop --------------------------------------------------------------
APPLIED=0
ERRORS=0

for i in $(seq 0 $((COUNT - 1))); do
  DASHBOARD=$(jq -c ".dashboards[$i]" "$DASHBOARDS_FILE")
  TITLE=$(echo "$DASHBOARD" | jq -r '.title')

  echo
  info "==== $TITLE ===="

  if ! EXISTING=$(find_dashboard_by_title "$TITLE"); then
    err "  failed to look up existing dashboard — skipping"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  EXISTING_ID=""
  if [ -n "$EXISTING" ]; then
    EXISTING_ID=$(echo "$EXISTING" | jq -r '.id // empty')
    info "  existing dashboard id $EXISTING_ID — will update widgets"
  fi

  if [ -n "$EXISTING_ID" ]; then
    # Merge into the existing dashboard so filters the maintainer set in the UI
    # survive a re-run; only the widgets come from the spec.
    BODY=$(echo "$DASHBOARD" | jq --argjson existing "$EXISTING" --argjson defaults "$JQ_WIDGET_DEFAULTS" '
      {
        title:        $existing.title,
        description:  ($existing.description // .description // null),
        widgets:      (.widgets | $defaults),
        projects:     ($existing.projects     // []),
        environment:  ($existing.environment  // []),
        period:       ($existing.period       // "24h"),
        start:        ($existing.start        // null),
        end:          ($existing.end          // null),
        filters:      ($existing.filters      // {}),
        utc:          ($existing.utc          // false),
        permissions:  ($existing.permissions  // null),
        is_favorited: ($existing.is_favorited // false)
      }
    ')
  else
    BODY=$(echo "$DASHBOARD" | jq --argjson defaults "$JQ_WIDGET_DEFAULTS" '
      {
        title:       .title,
        description: .description,
        widgets:     (.widgets | $defaults),
        projects:    [],
        environment: [],
        period:      "24h",
        filters:     {},
        utc:         false
      }
    ')
  fi

  if NEW_ID=$(create_or_update_dashboard "$BODY" "$EXISTING_ID") && [ -n "$NEW_ID" ]; then
    if [ -n "$EXISTING_ID" ]; then ok "Updated dashboard $NEW_ID"; else ok "Created dashboard $NEW_ID"; fi
    APPLIED=$((APPLIED + 1))
  else
    ERRORS=$((ERRORS + 1))
  fi
done

echo
echo "-----------------------------------------------------------"
info "Done: $APPLIED applied (created or updated), $ERRORS failed"
[ "$DRY_RUN" = "1" ] && info "Re-run without --dry-run to apply"
[ "$ERRORS" -gt 0 ] && exit 1
exit 0
