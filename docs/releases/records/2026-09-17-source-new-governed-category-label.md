# 2026-09-17-source-new-governed-category-label - Show The Governed Category Label

## Release ID

`2026-09-17-source-new-governed-category-label`

## Status

`candidate`

## Plain-English Summary

The Source New workspace showed an event's classified category by stripping underscores from the stored identifier, so a real event displayed `ams` rather than "Application Managed Services (AMS)". The governed category taxonomy already carries a label for every identifier it defines; the workspace now uses it.

A value recorded on the event that the taxonomy does not define is still shown — it is what the event holds — but it is marked as outside the governed categories instead of being presented as though it came from the dictionary. An event with no category recorded continues to read "Not established", which is a different statement from "the taxonomy does not know this category".

The event type in the page header is title-cased through the same module. It is not resolved to an archetype name: more than one archetype shares an event type, so naming one would assert an identity the column does not carry.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. No schema, migration, adapter or route change. The category taxonomy module is data and types only, with no I/O.

## Client Applicability

- All clients: Source New event workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts`: `sourceNewCategoryDisplay` resolves a category to its taxonomy label, an ungoverned-but-recorded value with a qualifying note, or "Not established"; `sourceNewEventTypeLabel` title-cases a recorded event type.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: the Intelligence view and page header read those functions.

The existing caveat that a category is not a benchmark, savings claim or supplier recommendation is unchanged.

## QA / Validation

- `src/lib/source/new-workspace` and `src/components/source/new-workspace`: 56 tests passed across 5 suites.
- Scoped ESLint clean; full-project `tsc --noEmit` clean.
- Signed-in acceptance on the deployed build: pending.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: An event classified into a governed category shows that category's taxonomy label in the Intelligence view; an event with no classification still reads "Not established".

## Rollback Plan

Revert this UI change through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, focused test output and CI to be added when available.

## Known Gaps

- Event types have no closed dictionary behind them, so the header shows a title-cased stored value rather than a governed label.
- No signed-in browser proof yet.
