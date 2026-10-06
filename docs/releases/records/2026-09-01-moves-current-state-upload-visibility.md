# 2026-09-01-moves-current-state-upload-visibility - Moves Current-State Upload Visibility Guard

## Release ID

`2026-09-01-moves-current-state-upload-visibility`

## Status

`candidate`

## Plain-English Summary

Moves current-state upload routes now verify that the requested Move is visible to the signed-in tenant context before reading the uploaded file or writing current-state provenance. An inaccessible or missing Move now returns `404 not_found` before any parser, scanner, table writer, or evidence-ledger writer can run.

## Layer Impact

- `global-control-lane`: Tightens the shared Moves API boundary for current-state upload actions.
- Layer 4 Products: Moves current-state upload routes now require the same tenant-scoped Move visibility proof as sibling mutation routes.
- Layer 3 Canonical Enterprise Model: No schema or data changes. The change prevents new incorrectly lineaged current-state records from being written through an inaccessible Move URL.

## Client Applicability

- All clients: Yes, wherever Moves current-state upload routes are available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/current-state/ingest/route.ts`
- `src/app/api/v1/programs/[programId]/current-state/ingest-doc/route.ts`
- `src/app/api/v1/programs/[programId]/current-state/ingest/__tests__/route.test.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/api/v1/programs/[programId]/current-state/ingest/__tests__/route.test.ts' --runInBand` (3 tests).
- Pass: `npm test -- --runTestsByPath 'src/lib/programs/__tests__/current-state-ingest.test.ts' 'src/lib/programs/__tests__/current-state-doc-ingest.test.ts' --runInBand` (32 tests).
- Pass: `npm run release:check`.
- Failed, record corrected: `npm run release:check` initially flagged this release record for missing lane naming and concrete QA status.

## Rollout Plan

Merge through PR into `main`. The repo-owned ACA main deploy workflow will build and deploy the updated runtime image. No database migration, feature flag, or data-plane job is included in this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming the change is deployed.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, if claiming live behavior.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7309
- Focused route test output: passed locally.
- Parser/ingest regression output: passed locally.
- Release check output: passed locally.

## Known Gaps

This release does not apply pending lab database migrations and does not clean up any pre-existing current-state rows or evidence-ledger entries. Those remain governed data-plane operations.
