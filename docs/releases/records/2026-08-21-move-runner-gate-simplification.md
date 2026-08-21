# 2026-08-21-move-runner-gate-simplification — Move Runner Gate Simplification

## Release ID

`2026-08-21-move-runner-gate-simplification`

## Status

`candidate`

## Plain-English Summary

Moves phase-gate approval now lets an authorized Move runner close P1-P5 when the hard gate evaluates cleanly, even if duplicate phase-capture text was not separately persisted. P0 origination capture remains blocking because it is the source record for chartering.

## Layer Impact

- Lane: `global-control-lane`.
- Product layer: Updates Strategic Moves gate approval behavior.
- Canonical/data layer: No schema change. Existing phase snapshot, engagement, and audit-log writers remain the authoritative persistence path.

## Client Applicability

- All clients: Yes, for users with Move gate-approval rights.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- P1-P5 phase-capture gaps are carried as soft audit context instead of blocking before hard-gate evaluation.
- P5 terminal readiness, Tower cadence, and open-risk checks can be satisfied by signed P5 handoff/value deliverables.
- Draft free text alone still cannot satisfy the P5 terminal gate.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts' --runInBand` — 10/10 tests passed.
- Pass: `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts --runInBand` — 28/28 tests passed.
- Pass: `npx tsc --noEmit`.
- Pass: `npx eslint 'src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts' 'src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts' src/lib/programs/governance.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through a PR to `main`; the repo-owned ACA main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, close a P5 gate with signed P5 deliverables and verify readback.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That restores the stricter duplicate phase-capture blocker.

## Audit Evidence

- PR: Pending.
- Local validation: route tests, governance evaluator tests, TypeScript, ESLint, and release check passed before PR.
- Runtime proof: Pending.

## Known Gaps

This does not weaken role permission checks. The caller still needs gate-approval permission, and hard-gate evaluation still blocks when required deliverables or evidence are missing.
