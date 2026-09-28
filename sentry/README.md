# Sentry configuration as code

Alert rules and dashboards live here so they are version-controlled and
reproducible, instead of existing only in the Sentry UI where nobody can review
a change to them.

## What is here

| File              | Contents                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `alerts.json`     | Four alert rules: a first-seen issue for each app, an API error spike, and API p95 latency.   |
| `dashboards.json` | Two dashboards — Backend Overview and Frontend Overview — with the widgets for those metrics. |

`scripts/provision-sentry-alerts.sh` and `scripts/provision-sentry-dashboards.sh`
apply them. Both are idempotent: a rule or dashboard whose name or title already
exists is updated in place, so editing a spec and re-running is the whole
workflow.

## Before you apply anything

The specs reference two Sentry projects by slug, and they have to exist first:

- `tavi-api` — the target of `SENTRY_DSN`, read by
  `apps/api/src/instrument.ts`
- `tavi-web` — the target of `VITE_SENTRY_DSN`, read by
  `apps/web/src/instrument.ts`

Rename them in both JSON files if your projects are called something else, and
keep the `project:` filters in `dashboards.json` in step with the `projects` in
`alerts.json`.

Set your organization slug and region in both files. `organization` is the org
slug, not its display name, and `region` is the migration point between Sentry
regions — a US account uses `https://us.sentry.io/api/0`, an EU account uses
`https://de.sentry.io/api/0`. Both accept an environment override
(`SENTRY_ORG`, `SENTRY_API_BASE`) for a one-off run, so you do not have to edit
the file to try it against a different org.

## Applying the alerts

```bash
# 1. Create a token with the alert-write scope at
#    https://sentry.io/settings/account/api/auth-tokens/

# 2. See what would change. A dry run still reads Sentry — it has to, to report
#    create-versus-update — so the token is required even here.
SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-alerts.sh --dry-run

# 3. Apply
SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-alerts.sh
```

Renaming a rule in `alerts.json` leaves the old one behind in Sentry rather than
deleting it. Rename only when you intend to remove the old rule by hand.

## Applying the dashboards

```bash
SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-dashboards.sh --dry-run
SENTRY_API_TOKEN=sntrys_... ./scripts/provision-sentry-dashboards.sh
```

An update swaps only the widgets. Filters, environment and period that someone
set in the UI are read back and preserved, so re-running after a UI tweak does
not reset them. The prebuilt Sentry dashboards are never touched.

## What is not wired

**Notifications.** Every rule is applied with an empty `actions` array, so
nothing is delivered until you choose a target per rule: Settings > Alerts >
[rule] > Actions. Alerts that fire into nowhere are worse than no alerts,
because the dashboard looks covered.

**Scheduled-job monitoring.** The template ships no scheduled jobs, so there is
no cron-missed rule. When you add one, have it call
`Sentry.captureCheckIn({ monitorSlug, status })` with a stable slug, then add an
alert of kind `metric` to `alerts.json` with a `detector_slugs` array in place of
the `detector` block:

```json
{
  "name": "Cron: missed check-in",
  "kind": "metric",
  "detector_slugs": ["cleanup-orphaned-uploads"],
  "workflow": { "name": "Cron: missed check-in", "enabled": true }
}
```

The script resolves each slug to a monitor id on every run, because the monitor
does not exist until the job has reported a check-in once. Until then the rule is
skipped with an error naming the missing slugs, rather than applied against a
detector that is not there.

**Release tagging.** Neither `Sentry.init` sets a `release`, so errors are not
grouped by version. Wiring it to the semantic-release version would let Sentry
answer "did this error start with the last deploy?", which is the question the
version actually exists for.

## Schema notes

**Issue rules** (`kind: "issue"`) trigger on event conditions such as
`first_seen_event` or `regression_event`. They carry a `projects` array, which
the script forwards onto the workflow — without that, the rule applies
organization-wide instead of to the named projects.

**Metric rules** (`kind: "metric"`) trigger on an aggregate (`count()`,
`p95(...)`, `failure_rate()`). Each one creates a Detector (the metric source)
and a Workflow (the alert) and links them through `detectorIds`. A metric
workflow still needs a `triggers` object with empty conditions; the API rejects
the payload without it even though the detector decides when it fires.

Transaction metrics use `dataset: events_analytics_platform` with
`is_transaction:true` in the query, not `dataset: transactions`, which Sentry is
migrating away from. Widgets that render a time series require `limit`, and the
API rejects anything above 10.

Sentry API references:

- <https://docs.sentry.io/api/monitors/create-an-alert-for-an-organization/>
- <https://docs.sentry.io/api/monitors/create-a-monitor-for-a-project/>
- <https://docs.sentry.io/api/dashboards/create-a-new-dashboard-for-an-organization/>
