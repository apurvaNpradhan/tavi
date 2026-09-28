#!/usr/bin/env bash
# Provisions Sentry alert rules from sentry/alerts.json via the Sentry REST API.
#
# Idempotent: a rule whose name already exists is updated in place, so editing the
# spec and re-running propagates the change. Detectors are matched through the
# workflow's own detectorIds first and by name second, so a run that failed
# halfway cannot leave a duplicate behind.
#
# Usage:
#   SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-alerts.sh
#   SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-alerts.sh --dry-run
#
# The token needs the alert-write scope (org:write also works).
# Generate one at https://sentry.io/settings/account/api/auth-tokens/
#
# Overrides, for a run against a different organization or region:
#   SENTRY_ORG, SENTRY_API_BASE, SENTRY_ALERTS_FILE, SENTRY_DRY_RUN=1
#
# The API details below were each learned from a failure; they are kept as
# comments so the next person does not rediscover them:
#   - `curl --fail-with-body` is used because plain `--fail` throws the error
#     body away, which is the part that explains the 400.
#   - Detectors are organization-scoped. POST to /projects/{project}/detectors/
#     returns 200, while PUT to the same path returns 404, so updates to a
#     project-scoped URL silently never worked.
#   - Monitors are resolved by slug on every run rather than cached, because the
#     ids do not exist until a cron job has reported a check-in for the first time.
#   - A workflow always needs `triggers`, with an empty conditions array for a
#     metric rule; omitting it is a 400.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")"
ALERTS_FILE="${SENTRY_ALERTS_FILE:-${CONFIG_DIR}/sentry/alerts.json}"
DEFAULT_FREQUENCY_MIN=30

# ---- output helpers ---------------------------------------------------------
# Defined before anything can fail, so the error path can use them.
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
  err "SENTRY_API_TOKEN is not set. Generate one at https://sentry.io/settings/account/api/auth-tokens/ with the alert-write scope."
  exit 1
fi
if [ ! -f "$ALERTS_FILE" ]; then
  err "Alerts config not found at $ALERTS_FILE"
  exit 1
fi
command -v jq >/dev/null || { err "jq is required"; exit 1; }

# ---- configuration ----------------------------------------------------------
# Organization, region and API base come from the spec, so the file is the single
# place a region migration has to be recorded. Each accepts an environment
# override for a one-off run against another organization.
if [ -n "${SENTRY_ORG:-}" ]; then
  ORG="$SENTRY_ORG"
else
  ORG=$(jq -er '.organization' "$ALERTS_FILE") || {
    err "missing or invalid \`organization\` in $ALERTS_FILE (or set SENTRY_ORG)"
    exit 1
  }
fi

REGION=$(jq -er '.region' "$ALERTS_FILE") || {
  err "missing or invalid \`region\` in $ALERTS_FILE"
  exit 1
}

if [ -n "${SENTRY_API_BASE:-}" ]; then
  API_BASE="$SENTRY_API_BASE"
else
  API_BASE=$(jq -er '.api_base' "$ALERTS_FILE") || {
    err "missing or invalid \`api_base\` in $ALERTS_FILE (or set SENTRY_API_BASE)"
    exit 1
  }
fi

# ---- API helpers ------------------------------------------------------------
# Prints the response body on success. On HTTP >= 400, prints the body and the
# transport diagnostics to stderr and returns 1.
api_call() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  local body_args=()
  if [ -n "$body" ]; then
    body_args+=(-d "$body")
  fi

  local tmp curl_err status
  tmp=$(mktemp)
  curl_err=$(mktemp)

  status=$(curl -sS --fail-with-body \
    -o "$tmp" \
    -w "%{http_code}" \
    -X "$method" \
    -H "Authorization: Bearer ${SENTRY_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "${body_args[@]}" \
    "$url" 2>"$curl_err") || {
    err "HTTP ${status:-?} from $method $url"
    err "Request body: $body"
    err "Response body:"
    [ -s "$tmp" ] && sed 's/^/  /' "$tmp" >&2 || echo "  (empty)" >&2
    # Only present when no HTTP response was produced at all: DNS, TLS, timeout.
    if [ -s "$curl_err" ]; then
      err "curl:"
      sed 's/^/  /' "$curl_err" >&2
    fi
    rm -f "$tmp" "$curl_err"
    return 1
  }

  rm -f "$curl_err"
  cat "$tmp"
  rm -f "$tmp"
}

# The `?query=` parameter is a tokenized search (`is:unresolved`,
# `project:foo`), not free text, so a name containing a colon parses as broken
# tokens. Fetching everything and filtering locally is both simpler and correct
# at this scale.
list_workflows() { api_call GET "${API_BASE}/organizations/${ORG}/workflows/"; }
list_monitors() { api_call GET "${API_BASE}/organizations/${ORG}/monitors/"; }
list_detectors() { api_call GET "${API_BASE}/organizations/${ORG}/detectors/"; }

find_detector_by_name() {
  local name="$1" response
  response=$(list_detectors) || return 1
  echo "$response" | jq -r --arg name "$name" '.[] | select(.name == $name) | .id' | head -n1
}

# Prints the matching workflow as compact JSON, or nothing.
#
# Returns non-zero when the lookup itself failed, which callers must distinguish
# from "no match": treating a failed lookup as no match creates a duplicate rule.
find_existing_workflow() {
  local name="$1" response
  response=$(list_workflows) || return 1
  echo "$response" | jq -c --arg name "$name" '.[] | select(.name == $name)' | head -n1
}

# POST when no id is given, PUT otherwise. Prints the resulting id.
create_or_update_workflow() {
  local body="$1" id="${2:-}"
  local method=POST
  local url="${API_BASE}/organizations/${ORG}/workflows/"

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

create_or_update_detector() {
  local body="$1" id="${2:-}"
  local method=POST
  local url="${API_BASE}/organizations/${ORG}/detectors/"

  if [ -n "$id" ]; then
    method=PUT
    url="${url}${id}/"
  fi

  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] would $method $url" >&2
    echo "$body" | jq . >&2
    echo "stub-detector-id"
    return 0
  fi

  local resp
  resp=$(api_call "$method" "$url" "$body") || return 1
  echo "$resp" | jq -r '.id // empty'
}

# ---- validation -------------------------------------------------------------
COUNT=$(jq '.alerts | length' "$ALERTS_FILE")
info "Reading $COUNT alert(s) from $ALERTS_FILE"
[ "$DRY_RUN" = "1" ] && info "DRY RUN: no changes will be made"
info "Organization: $ORG, Region: $REGION"

# Every alert needs a name, and finding that out halfway through leaves the org
# in a partially applied state.
if jq -r '.alerts[] | .name | select(. == null or . == "")' "$ALERTS_FILE" | grep -q .; then
  err "One or more alerts in $ALERTS_FILE have a missing name. Fix and retry."
  exit 1
fi

# ---- main loop --------------------------------------------------------------
APPLIED=0
ERRORS=0

for i in $(seq 0 $((COUNT - 1))); do
  ALERT=$(jq -c ".alerts[$i]" "$ALERTS_FILE")
  NAME=$(echo "$ALERT" | jq -r '.name')
  KIND=$(echo "$ALERT" | jq -r '.kind')

  echo
  info "==== $NAME ($KIND) ===="

  if ! EXISTING=$(find_existing_workflow "$NAME"); then
    err "  failed to look up existing workflow — skipping"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  EXISTING_ID=""
  if [ -n "$EXISTING" ]; then
    EXISTING_ID=$(echo "$EXISTING" | jq -r '.id // empty')
    info "  existing workflow id $EXISTING_ID — will update"
  fi

  case "$KIND" in
    issue)
      # The top-level `projects` array has to be forwarded onto the workflow, or
      # the rule silently applies organization-wide.
      WORKFLOW=$(echo "$ALERT" | jq --arg org "$ORG" --argjson freq "$DEFAULT_FREQUENCY_MIN" '
        {
          name:           .workflow.name,
          enabled:        (.workflow.enabled // true),
          organizationId: $org,
          projects:       (.projects // []),
          config:         ((.workflow.config // {}) + {frequency: $freq}),
          triggers:       .workflow.triggers,
          actionFilters:  .workflow.actionFilters
        }
        | if (.triggers // {}).actions == [] then del(.triggers.actions) else . end
        | if (.triggers // {}).conditions | not then del(.triggers) else . end
        | if (.actionFilters // []) == [] then del(.actionFilters) else . end
      ')

      if NEW_ID=$(create_or_update_workflow "$WORKFLOW" "$EXISTING_ID") && [ -n "$NEW_ID" ]; then
        if [ -n "$EXISTING_ID" ]; then ok "Updated workflow $NEW_ID"; else ok "Created workflow $NEW_ID"; fi
        APPLIED=$((APPLIED + 1))
      else
        ERRORS=$((ERRORS + 1))
      fi
      ;;

    metric)
      HAS_SLUGS=$(echo "$ALERT" | jq -r '.detector_slugs | length > 0')
      HAS_INLINE_DETECTOR=$(echo "$ALERT" | jq -r '.detector | type == "object"')
      DETECTOR_IDS='[]'

      if [ "$HAS_SLUGS" = "true" ]; then
        # Monitors created by Sentry.captureCheckIn, referenced by slug.
        #
        # Declared as an array so ${#SLUGS[@]} works under `set -u`: reading a
        # scalar with array syntax aborts the script.
        mapfile -t SLUGS < <(echo "$ALERT" | jq -r '.detector_slugs[]')

        RESP=$(list_monitors) || {
          err "Monitor lookup failed for '$NAME'"
          ERRORS=$((ERRORS + 1))
          continue
        }

        RESOLVED=()
        MISSING=()
        for slug in "${SLUGS[@]}"; do
          id=$(echo "$RESP" | jq -r --arg slug "$slug" '.[] | select(.slug == $slug) | .id' | head -n1)
          if [ -z "$id" ] || [ "$id" = "null" ]; then
            MISSING+=("$slug")
          else
            info "  resolved '$slug' -> id $id"
            RESOLVED+=("$id")
          fi
        done

        # Partial resolution is a normal rollout state (a job that has not run
        # yet), not a pass: report it so a re-run is not mistaken for success.
        if [ "${#MISSING[@]}" -gt 0 ]; then
          err "Monitors not found for '$NAME' (${#MISSING[@]} of ${#SLUGS[@]} missing): ${MISSING[*]}. Has each job reported a check-in? Skipping."
          ERRORS=$((ERRORS + 1))
          continue
        fi

        DETECTOR_IDS=$(printf '%s\n' "${RESOLVED[@]}" | jq -R . | jq -s .)
      fi

      if [ "$HAS_INLINE_DETECTOR" = "true" ]; then
        PROJECT=$(echo "$ALERT" | jq -r '.project')
        DETECTOR=$(echo "$ALERT" | jq --arg org "$ORG" --arg project "$PROJECT" '
          .detector + {organizationId: $org, projectId: $project}
        ')
        DETECTOR_NAME=$(echo "$DETECTOR" | jq -r '.name')

        # The workflow's detectorIds is authoritative when the workflow exists,
        # but a failed run can leave an orphaned detector, so fall back to a name
        # lookup to stay idempotent.
        EXISTING_DET_ID=""
        if [ -n "$EXISTING_ID" ]; then
          EXISTING_DET_ID=$(echo "$EXISTING" | jq -r '.detectorIds[0] // empty')
        fi

        if [ -z "$EXISTING_DET_ID" ]; then
          # A failed lookup must skip the alert rather than fall through to the
          # POST path, which would create a duplicate detector.
          if ! EXISTING_DET_ID=$(find_detector_by_name "$DETECTOR_NAME"); then
            err "  failed to look up existing detector '$DETECTOR_NAME' — skipping"
            ERRORS=$((ERRORS + 1))
            continue
          fi
        fi

        if NEW_DET_ID=$(create_or_update_detector "$DETECTOR" "$EXISTING_DET_ID") && [ -n "$NEW_DET_ID" ]; then
          if [ -n "$EXISTING_DET_ID" ]; then ok "Updated detector $NEW_DET_ID"; else ok "Created detector $NEW_DET_ID"; fi
          DETECTOR_IDS=$(echo "$DETECTOR_IDS" | jq --arg id "$NEW_DET_ID" '. + [$id]')
        else
          ERRORS=$((ERRORS + 1))
          continue
        fi
      fi

      # A metric workflow still needs `triggers`, with empty conditions: the
      # detector drives the firing, but the API rejects the payload without it.
      WORKFLOW=$(echo "$ALERT" | jq --arg org "$ORG" --argjson freq "$DEFAULT_FREQUENCY_MIN" \
        --argjson detectors "$DETECTOR_IDS" '
        {
          name:           .workflow.name,
          enabled:        (.workflow.enabled // true),
          organizationId: $org,
          projects:       (.projects // []),
          config:         ((.workflow.config // {}) + {frequency: $freq}),
          detectorIds:    $detectors,
          triggers:       { logicType: "any-short", conditions: [] }
        }
      ')

      if NEW_ID=$(create_or_update_workflow "$WORKFLOW" "$EXISTING_ID") && [ -n "$NEW_ID" ]; then
        if [ -n "$EXISTING_ID" ]; then ok "Updated workflow $NEW_ID"; else ok "Created workflow $NEW_ID"; fi
        APPLIED=$((APPLIED + 1))
      else
        ERRORS=$((ERRORS + 1))
      fi
      ;;

    *)
      err "Unknown kind '$KIND' for '$NAME'"
      ERRORS=$((ERRORS + 1))
      ;;
  esac
done

echo
echo "-----------------------------------------------------------"
info "Done: $APPLIED applied (created or updated), $ERRORS failed"
[ "$DRY_RUN" = "1" ] && info "Re-run without --dry-run to apply"
[ "$ERRORS" -gt 0 ] && exit 1
exit 0
