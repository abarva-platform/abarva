# 2026-09-19-source-new-file-detail - Source New File Detail View

## Release ID

`2026-09-19-source-new-file-detail`

## Status

`candidate`

## Plain-English Summary

Source New file selection now opens a defined detail view that shows the file's existing registry
metadata, version history fields, evidence references, approval/comment information, and authenticity
state. Missing registry fields remain explicitly blank as `Not recorded`; this release does not create
new metadata, run uploads, or change artifact authority.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source New presents more of the existing Source artifact projection in the Files
view. No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, schema, loader, or data-plane behavior
changes are included.

## Client Applicability

- All clients: applies to the shared Source New event workspace when the viewer already has access to
  the event and its file registry.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/backlog/source-product-backlog.md` records the narrow Source New F10 file claim.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` passes through existing artifact-registry fields
  already returned by the file-cabinet repository.
- `src/components/source/new-workspace/SourceNewFiles.tsx` renders grouped detail sections for preview
  metadata, version, evidence links, approvals/comments, and authenticity state.
- `src/components/source/new-workspace/SourceNewFiles.test.tsx` covers populated and missing metadata,
  action visibility, mobile detail behavior, keyboard access, and return-to-list position.

## QA / Validation

- `npx jest --runTestsByPath src/components/source/new-workspace/SourceNewFiles.test.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx src/app/(maestro)/source/new/[eventId]/page.test.tsx --runInBand`: passed after linking this clean worktree to the main local `node_modules`; 3 suites, 40 tests.
- `npx eslint src/components/source/new-workspace/SourceNewFiles.tsx src/components/source/new-workspace/SourceNewFiles.test.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx src/app/(maestro)/source/new/[eventId]/page.tsx src/app/(maestro)/source/new/[eventId]/page.test.tsx`: passed.

## Rollout Plan

Merge to main through PR review. The repo-owned ACA main deploy workflow builds and deploys the shared
web image from main. No migration, operator job, data-plane mutation, or feature-flag action is
required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: to be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed runtime state.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes before claiming live-proven; Anand's signed-in acceptance remains
  the gate.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. Since this is Layer 4 presentation
only, rollback does not require data repair or migration rollback.

## Audit Evidence

- PR URL: pending.
- Focused Jest output listed above.
- Live signed-in Source New mobile/desktop acceptance: pending after deploy.

## Known Gaps

This does not add upload authorization, preview rendering, comments persistence, artifact schema,
Moves authority reuse, or a popup file cabinet. The page can only show fields already present in the
Source artifact registry.
