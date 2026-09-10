# 2026-09-10-moves-current-state-review-visibility — Moves Current-State Guard And Schema Readback

## Release ID

`2026-09-10-moves-current-state-review-visibility`

## Status

`candidate`

## Plain-English Summary

The current-state evidence approval endpoint now confirms that the signed-in user can see the target Move before it changes an evidence review decision. This keeps review promotion scoped to visible, tenant-authorized Moves and prevents approval writes from relying only on a caller-supplied URL id.

The release candidate also adds an idempotent schema repair and an exact readback verifier for the Moves current-state upload tables. The verifier checks the table names and columns that the live upload path needs instead of relying on aggregate migration-ledger or table-count signals.

## Layer Impact

Release lane: `client-data-lane`.

Layer 4 product route: hardens the Moves current-state review approval API before it calls the governed evidence-review mutation.

Layer 3 projection safety: preserves provenance integrity by preventing review decisions for non-visible Move ids from creating or changing committed evidence state. Adds an additive repair migration for current-state projection tables whose historical ledger entries can be present even when the physical objects are absent.

Operations proof: adds a named readback script that reports `GREEN` only when the exact Moves current-state objects exist with the required columns.

## Client Applicability

All clients using Moves current-state evidence review.

## Changes Included

- `src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/route.ts`
- `src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__/route.test.ts`
- `supabase/migrations/20260910143000_moves_current_state_schema_readback_repair.sql`
- `src/scripts/verify-moves-current-state-schema.ts`
- `src/scripts/verify-azure-postgres-schema.ts`
- `package.json`

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__/route.test.ts src/app/api/v1/programs/[programId]/current-state/ingest/__tests__/route.test.ts src/lib/programs/__tests__/current-state-doc-ingest.test.ts`

Result: 3 test suites passed, 21 tests passed.

- `npm run release:check -- --base origin/main --head HEAD`

Result: passed.

## Rollout Plan

Merge through PR. The route change becomes active with the normal Azure Container Apps main deploy workflow for the web runtime. The schema repair must be applied through the governed database migration lane, followed by `db:verify:moves-current-state-schema` through the private operator job before the end-to-end current-state smoke is rerun.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deployment before claiming live.
- Worker image invariant: required before running the private operator verification.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun Moves current-state upload, review, approval, and generation smoke after deployment and migration apply.

## Rollback Plan

Revert the route/script changes and redeploy through the repo-owned Azure Container Apps main deploy workflow if runtime behavior regresses. The migration is additive; rollback is forward-only through a reviewed repair migration if a schema issue is discovered.

## Audit Evidence

- PR diff and CI result.
- Targeted route test output.
- Governed migration run output.
- `db:verify:moves-current-state-schema` operator output.
- Follow-up signed-in Moves smoke output after deployment.

## Known Gaps

This candidate does not itself apply the data-plane migration. The end-to-end smoke remains blocked until the schema repair is merged, applied through the governed lane, and verified by exact readback.
