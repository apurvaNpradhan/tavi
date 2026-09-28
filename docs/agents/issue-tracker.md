# Issue tracker: local markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Triage state, when needed, is recorded as a `Status:` line near the top of each issue file.
- Comments and conversation history append under a `## Comments` heading.

## Publish to the issue tracker

Create a file under `.scratch/<feature-slug>/`, creating the directory if needed.

## Fetch a ticket or spec

Read the referenced markdown file. If only a feature name or issue number is given, locate it under `.scratch/`.

## Wayfinding operations

- Map: `.scratch/<effort>/map.md`, holding Notes, Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`. A `Type:` line records `research`, `prototype`, `grilling`, or `task`; `Status:` records `claimed` or `resolved`.
- Blocking: `Blocked by: NN, NN` near the top. A ticket is unblocked when each listed ticket is `resolved`.
- Frontier: scan child tickets for open, unblocked, unclaimed work; take the lowest number first.
- Claim: set `Status: claimed` and save before working.
- Resolve: append the answer under `## Answer`, set `Status: resolved`, then add a summary and link to the map's Decisions-so-far.
