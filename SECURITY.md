# Security policy

## Reporting a vulnerability

Report security issues privately. Do not open a public issue, and do not put
details in a pull request.

Use [GitHub's private vulnerability reporting][gh-report], which notifies the
maintainers directly and keeps the discussion private until a fix ships.

<!--
Adopters: if you would rather be reached by email, add the address here and to
the enforcement section of CODE_OF_CONDUCT.md.
-->

Helpful things to include, as far as you have them:

- the affected version or commit
- the endpoint, file, or flow involved
- what an attacker gains, and the minimum privilege they need to do it
- a proof of concept, if you have one

## What to expect

- An acknowledgement within 3 days.
- An assessment of severity and scope, and whether the report reproduces,
  within 7 days.
- A fix released as soon as it is ready. Anything exploitable against a running
  instance takes priority over other work.
- Credit in the advisory, unless you would rather stay anonymous.

Please give us a chance to ship a fix before disclosing publicly. If you have a
deadline in mind, say so in the report and we will work to it.

## Supported versions

Fixes land on the latest release. Self-hosted instances should track the most
recent version; older versions do not receive backported patches.

| Version        | Supported |
| -------------- | --------- |
| Latest release | Yes       |
| Older releases | No        |

## Scope

In scope: the API (`apps/api`), the web app (`apps/web`), the shared packages
(`packages/*`), and the published Docker images.

Out of scope:

- findings that require an already-compromised host or database
- denial of service through sheer request volume
- missing hardening headers with no demonstrated impact
- vulnerabilities in third-party dependencies with no working path through this
  code. A pull request bumping the dependency is welcome and can be public.

Self-hosted instances are configured by their operator. A report that depends on
an insecure configuration is still useful when this repository's own defaults or
documentation lead operators there — say which default you followed.

## How authorization is meant to work

Worth knowing before you test, because a deviation is itself a finding:

- The API enforces authorization. Workspace procedures compose
  `authedProcedure` with `requireWorkspace(...)`, and the workspace is resolved
  from the resource rather than trusted from a client-supplied id.
- A procedure that does not compose `authedProcedure` is public by construction.
- UI capability checks are presentation only; they are never the enforcement
  point.

[gh-report]: https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability
