# 2026-07-17-moves-p5-terminal-handoff-gate — Moves P5 Terminal Handoff Gate

## Release ID

`2026-07-17-moves-p5-terminal-handoff-gate`

## Status

`candidate`

## Plain-English Summary

Moves now has a real terminal P5 gate instead of stopping at P5 with no governed way to complete the lifecycle. The P5 Mobilize phase can approve the mobilization handoff, value-measurement contract, launch readiness, Tower cadence, and open-risk record, then hand the Move to Tower tracking.

## Layer Impact

- `global-control-lane`: Updates the shared Strategic Moves phase-gate contract, signed-in gate approval route, phase-capture gate records, and phase workspace terminal redirect behavior.

## Client Applicability

- All clients: Yes. This affects the shared Moves P0-P5 lifecycle.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds P5 → Tower as a governed terminal gate in `src/lib/programs/governance.ts`.
- Allows `/api/v1/programs/:programId/phase-gate-approval` to approve phase 5 and advance to terminal phase 6.
- Creates/signs all required phase gate records for P3, P4, and P5 instead of a single stale gate artifact.
- Uses signed phase-capture inputs as gate evidence for P2-P5 readiness checks where the old evaluator relied on hidden or legacy artifacts.
- Redirects the phase workspace to `/tower` after terminal P5 approval instead of `/phase/6`.
- Updates regression tests that previously encoded “no P5→Tower gate.”

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/governance-gates.test.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts src/__tests__/integration/programs/phase-capture-gate-routes.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/lib/programs/governance.ts 'src/app/api/v1/programs/[programId]/phase-capture/route.ts' 'src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts' src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/lib/programs/__tests__/governance-gates.test.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts src/__tests__/integration/programs/phase-capture-gate-routes.test.ts src/__tests__/integration/programs/full-lifecycle-crawl.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: Live signed-in Moves smoke through P5 after ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then run a signed-in Meridian disposable Move smoke from active phase gates through terminal P5 handoff.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Existing Moves advanced to terminal phase 6 remain audit records; the rollback only restores route/UI behavior.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Live proof bundle: Pending.

## Known Gaps

Board-grade deliverable generation still depends on the existing durable worker path. This release fixes the phase-gate lifecycle and terminal handoff contract; it does not claim Tower realized-value outcomes.
