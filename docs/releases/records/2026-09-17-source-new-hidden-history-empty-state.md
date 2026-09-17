# 2026-09-17-source-new-hidden-history-empty-state - "No Files" Must Mean No Files

## Release ID

`2026-09-17-source-new-hidden-history-empty-state`

## Status

`candidate`

## Plain-English Summary

The Source New file explorer hides superseded versions until the operator turns on "Older versions". A folder whose only contents were superseded versions therefore rendered "No files here yet" — a false statement about the cabinet, produced by a view setting rather than by the data. Such a folder now says that no current version is here and how many older versions the toggle is hiding.

The event lifecycle shown beside the event name was produced by title-casing whatever the lifecycle column held. It now resolves through the canonical lifecycle dictionary, and a value the dictionary does not define reads "Not recorded" instead of being dressed up as a state.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. No schema, migration, adapter or route change.

## Client Applicability

- All clients: Source New event workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/new-workspace/SourceNewFiles.tsx`: the empty state distinguishes an empty folder from a folder whose files the history toggle is hiding, and names the count.
- `src/lib/source/new-workspace/phase-state.ts`: `sourceNewLifecycleLabel` resolves through `SOURCE_LIFECYCLE_STATUS_LABELS`, keeping this workspace's own wording for the awaiting-intake and active states.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: uses that function in the header and the approvals view.

## QA / Validation

- `src/lib/source/new-workspace` and `src/components/source/new-workspace`: 61 tests passed across 5 suites.
- Mutation check: forcing the hidden-version count to zero fails the empty-state test.
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
- Live signed-in proof required: A folder holding only superseded versions reports the hidden count rather than "No files here yet"; an empty folder still reads empty; a waiting-state event shows its canonical lifecycle label.

## Rollback Plan

Revert this UI change through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, focused test output, mutation result and CI to be added when available.

## Known Gaps

- No signed-in browser proof yet.
