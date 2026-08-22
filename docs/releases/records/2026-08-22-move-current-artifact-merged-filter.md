# 2026-08-22-move-current-artifact-merged-filter — Moves Merged Current Artifact Filter

## Release ID

`2026-08-22-move-current-artifact-merged-filter`

## Status

`candidate`

## Plain-English Summary

Moves File Cabinet current-only results now apply the current-artifact epoch filter after merging generated artifacts with the move artifact vault. This prevents stale vault rows from reappearing after generated-artifact filtering has already identified a newer current P3 architecture anchor.

## Layer Impact

Layer 4 Products: Updates the Moves artifact-list API only. No tenant intake, source adapter, canonical model, data-plane loader, graph, migration, or registry behavior changes.

## Client Applicability

- All clients: Moves File Cabinet users.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Normalize Cabinet artifact titles for current-only comparison.
- Suppress older same-title/phase artifacts after both generated-artifact and vault rows are merged.
- Suppress stale P3 artifacts older than the newest target-architecture anchor.
- Add regression coverage for stale vault rows with mixed timestamp formats.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' --runInBand` — pass.
- `npx eslint 'src/app/api/v1/programs/[programId]/artifacts/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts'` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for current-only artifact listing.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in current-artifact API proof after deployment.

## Known Gaps

This change does not regenerate dependent P3 deliverables. It keeps older dependent P3 artifacts out of the current-only list until regenerated after the latest target-architecture anchor.
