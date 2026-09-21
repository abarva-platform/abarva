# 2026-09-21-t464-context-csv-upload-boundary — Context CSV Upload Boundary Test

## Release ID

`2026-09-21-t464-context-csv-upload-boundary`

## Status

`candidate`

## Plain-English Summary

Repairs the Admin context CSV upload route test so it asserts the full tenant-scoped
chunk row written by the current route. The test now proves the route uses the mocked
Postgres compatibility adapter and mocked object-storage adapter, and keeps the
tenant identifier strict rather than accepting a partial row shape.

## Layer Impact

Release lane: `internal-admin`.

Layer 2 / Source adapters: Test-only coverage for the structured upload adapter path.
The route and connector behavior are unchanged.

Layer 3 / Canonical enterprise model: Test-only coverage for the pending context chunk
rows and structured enterprise context promotion writes. No schema, migration, or
tenant data changes are included.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None.
- Internal only: Yes. This is CI/test coverage for the admin ingestion boundary.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts`
- `.github/workflows/unit-suites.yml`
- `docs/architecture/test-ci-coverage-census.json`

## QA / Validation

- Red baseline before repair:
  `npx jest --runTestsByPath src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand --no-coverage --ci`
  collected 8 tests, with 2 failures on stale strict chunk-row expectations.
- After the test repair:
  `npx jest --runTestsByPath src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand --no-coverage --ci`
  passed 8 of 8 tests.
- Boundary proof: the suite replaces `@/lib/data-plane/postgresCompat` and
  `@/lib/data-plane/objectStorage`; unexpected Postgres tables throw, the mocked
  object-storage adapter is asserted as called, and no live Postgres or blob write is
  reachable from the route test.
- Mutation proof: the exact chunk-row assertion now fails if the persisted top-level
  tenant key is removed or if the provenance tenant key is changed.
- CI wiring: `.github/workflows/unit-suites.yml` now runs the repaired route test
  by exact path while the sibling user-provisioning quarantine remains separate.
- Census refresh: `npm run audit:test-ci-coverage:write` updated the committed
  census to 2350 Jest files under `src/`, 1785 run by a workflow, 1782 run by a
  pull-request workflow, 565 run by no workflow, and confirmed the committed
  census matches this run.

## Rollout Plan

Merge to `main` through a pull request. This change is test-only; no manual data-plane
operation, migration, feature flag, or runtime command is part of rollout.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable to the test-only behavior change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable before merge.
- ACA runtime invariant: Not applicable unless the normal repo-owned main deploy runs
  after merge.
- Worker image invariant: Not applicable unless the normal repo-owned main deploy runs
  after merge.
- Feature/env flag update path: None.
- Live signed-in proof required: No. No product route, response, stored value, or UI
  behavior changes.

## Rollback Plan

Revert the pull request. Because no schema, data, runtime, or feature flag changed,
rollback is limited to removing the test and workflow ownership update.

## Audit Evidence

- Pull request: to be added when opened.
- Local focused red/green evidence is recorded in the PR description and this release
  record.
- CI evidence: to be added after the exact-path unit workflow step runs in GitHub.

## Known Gaps

This release does not change the upload route, database schema, object-storage
adapter, approval policy, or ingestion semantics. Signed-in acceptance and data-plane
readback are therefore out of scope for this test-only repair; the proof that belongs
to this change is the local route test, exact-path CI wiring, and census refresh.
