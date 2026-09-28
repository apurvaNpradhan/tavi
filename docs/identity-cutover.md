# Tavi identity cutover

This source tree now uses Tavi-owned package names, environment keys, app
identifiers, callback schemes, local service names, and Sentry config targets.
The repository change does not update any live service or credential.

Before deploying or distributing this clone:

- Rename deployment environment variables from `CALLUS_*` to `TAVI_*` and
  update the deployment platform's secret and variable names. Values of
  credentials such as `AUTH_SECRET`, OAuth secrets, email API keys, Sentry
  tokens, and database credentials are not renamed or rotated by this change.
- Copy any local shared development vault from
  `~/.config/callus/dev.env` to `~/.config/tavi/dev.env` if you want the
  worktree setup script to reuse its existing values. The script's override
  key is now `TAVI_ENV_VAULT`; the file contents remain secret values, not app
  identity.
- Configure the OAuth provider's registered redirect URI for the new Tavi
  callback scheme (`tavi://`) and any changed API or web origin. The external
  OAuth client IDs and secrets remain as configured; verify whether they can be
  reused before distributing the app.
- Choose production iOS and Android identifiers. The source currently uses
  `com.tavi.app.dev`; signing, store listings, and registrations are external
  resources and need their own cutover.
- Point `DATABASE_URL` at the intended database. Local defaults now use a
  `tavi` database and do not migrate or rename an existing Callus database.
  Back up and plan any data migration before switching an installation.
- Create or select the Tavi Sentry organization and `tavi-api` / `tavi-web`
  projects before applying the checked-in alert and dashboard specs. The specs
  now target those names, but the Sentry provisioning scripts were not run and
  existing Callus Sentry resources are untouched.
- Update any device-auth configuration that refers to the pre-existing
  `callus-cli` client ID. That ID remains in the source because it is an
  externally registered OAuth client identifier.
- Update reverse-proxy integrations that send `x-callus-client-ip`; the API
  now reads the renamed `x-tavi-client-ip` header set by its Node transport.
- Update any trusted origins, DNS records, email sender domains, and other
  integrations that still use live Callus domains. No live domains or remote
  OAuth, Sentry, database, or email resources were changed.

The browser preference key and native secure-storage prefix also use the new
Tavi identity. Users of an installed Callus app may need to sign in again after
installing a Tavi build.

## Local data

A fresh Tavi checkout uses the `tavi` database configured in the local samples.
The identity cutover changes names and defaults, but does not copy or rename an
existing Callus database. Point `DATABASE_URL` at a fresh database for a clean
local Tavi instance, or plan and back up an intentional data migration before
reusing existing data. Applying migrations to an existing database can alter
its schema; review the migration sequence before connecting it.
