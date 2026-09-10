# 2026-09-10-moves-current-state-review-visibility — Moves Review Approval Visibility Guard

## Release ID

`2026-09-10-moves-current-state-review-visibility`

## Status

`candidate`

## Plain-English Summary

The current-state evidence approval endpoint now confirms that the signed-in user can see the target Move before it changes an evidence review decision. This keeps review promotion scoped to visible, tenant-authorized Moves and prevents approval writes from relying only on a caller-supplied URL id.

## Layer Impact

Release lane: `client-data-lane`.

Layer 4 product route: hardens the Moves current-state review approval API before it calls the governed evidence-review mutation.

Layer 3 projection safety: preserves provenance integrity by preventing review decisions for non-visible Move ids from creating or changing committed evidence state.

## Client Applicability

All clients using Moves current-state evidence review.

## Changes Included

- `src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/route.ts`
- `src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__/route.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__/route.test.ts src/app/api/v1/programs/[programId]/current-state/ingest/__tests__/route.test.ts src/lib/programs/__tests__/current-state-doc-ingest.test.ts`

Result: 3 test suites passed, 21 tests passed.

## Rollout Plan

Merge through PR. The change becomes active with the normal Azure Container Apps main deploy workflow for the web runtime. No database migration is introduced by this release candidate.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deployment before claiming live.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun Moves current-state evidence approval smoke after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No schema rollback is required.

## Audit Evidence

- PR diff and CI result.
- Targeted route test output.
- Follow-up signed-in Moves smoke output after deployment.

## Known Gaps

This candidate does not apply or repair data-plane migrations. Live schema drift, if present, must be handled through the governed migration path.
