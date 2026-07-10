# 2026-07-09-source-gate-contract-unification — Source Gate Contract Unification

## Release ID

`2026-07-09-source-gate-contract-unification`

## Status

`candidate`

## Plain-English Summary

Source stage advancement now uses one shared gate contract across the analytics canvas and the legacy Universal canvas. A stage advance must have both human confirmation keys and computed governance readiness. The pilot self-approval bypass is preserved only for computed-readiness blockers; it no longer bypasses missing human confirmations.

## Layer Impact

`global-control-lane`: Shared Source stage-gate validation changes for all tenants and both event canvases. This is a correctness change in API validation and client payload wiring, not a visual panel-porting change.

## Client Applicability

- All clients: Yes, when a user advances a Source event stage through the formal approval route or legacy stage route.
- Specific clients: Lakeshore exercises the analytics approval route today; non-Lakeshore tenants exercise the legacy Universal stage route today.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Existing `source_analytics` routing is unchanged.

## Changes Included

- Added `src/lib/source/gate-advance-contract.ts` as the shared two-signal gate evaluator.
- Updated `src/app/api/v1/source/events/[eventId]/approve/route.ts` so formal approvals also enforce computed readiness before stage advancement.
- Updated `src/app/api/v1/source/[eventId]/stage/route.ts` so legacy stage promotion also requires stage confirmation keys.
- Updated `src/components/source/canvas/UniversalCanvasShell.tsx` so Universal gate actions send per-stage confirmations.
- Updated `src/components/source/StageAdvanceButton.tsx` so the standalone stage control also sends per-stage confirmations and a human-readable reason.
- Added focused tests in `src/lib/source/__tests__/gate-advance-contract.test.ts`.

## QA / Validation

- Pass: `npx prettier --write` on all touched source/test files.
- Pass: `npx jest src/lib/source/__tests__/gate-advance-contract.test.ts src/lib/source/__tests__/approval-decision.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts --runInBand` — 3 suites, 27 tests passed. Jest emitted pre-existing duplicate manual mock warnings.
- Pass: `npx eslint` on touched files — 0 errors. Existing unused-symbol warnings remain in `UniversalCanvasShell.tsx`.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' npx tsc --noEmit --pretty false --incremental false`.
- Pass: `git diff --check`.
- Fail, pre-existing/stale assertion: `npx jest src/__tests__/integration/source/source-access-control-static.test.ts --runInBand` still expects `advancedToStage === "scope"` and dual `enteredStage: "strategy"/"scope"` strings in the approve route. `git show HEAD:src/app/api/v1/source/events/[eventId]/approve/route.ts` confirms those strings were absent before this change as well.
- Not run yet: live signed-in browser proof. Required after deploy before this can be called live-proven.

## Rollout Plan

Open PR, squash-merge to `main`, and let the repo-owned ACA main deploy workflow build and deploy the shared web image. No migration, worker job, feature flag, or env var change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR; deploy workflow owns ACA update and traffic.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes. Verify both analytics and Universal canvas stage advancement behavior.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data migration or schema rollback is involved.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local focused test output: 3 Source gate/approval suites passed locally; TypeScript, release check, and diff whitespace check passed.
- Live proof: pending deploy.

## Known Gaps

Panel parity, Value Proof navigation alignment, and broad `source_analytics` rollout remain out of scope for this release. Live browser proof is still required after deployment.
