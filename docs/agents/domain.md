# Domain docs

Use a single root `CONTEXT.md` for domain vocabulary and `docs/adr/` for decisions.

## Before exploring

Read `CONTEXT.md` when working with domain concepts. Read relevant ADRs under `docs/adr/` before changing behavior or architecture in their area. If these files do not exist, proceed without them. Create them when terms or decisions need recording, not as empty placeholders.

## Vocabulary

Use the terms defined in `CONTEXT.md` in issues, proposals, tests, and code. If a concept is absent, check existing code language before inventing a term.

## ADR conflicts

Call out a proposed change that contradicts an existing ADR, naming the ADR and the reason to revisit it.
