# 2026-07-03-moves-p0-treasury-pressure-fix — Moves P0 Treasury Pressure Fix

## Release ID

`2026-07-03-moves-p0-treasury-pressure-fix`

## Status

`candidate`

## Plain-English Summary

Fixes two Moves demo-readiness issues found during a live Industrial Demo pressure test. Kyriba / treasury Moves no longer show AP invoice exception evidence guidance, and the phase workspace now reads the P0 origination fields that were already saved under the Move charter scaffold.

## Layer Impact

- `global-control-lane`: shared Strategic Moves runtime and evidence-readiness presentation logic.
- `public-demo`: improves demo reliability for the Industrial Demo / Lakeshore Kyriba walkthrough.

## Client Applicability

- All clients: yes, because the Moves evidence guidance and P0 capture binding are shared.
- Specific clients: validated against Industrial Demo / Lakeshore pressure-test scenario.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts`
  - Adds treasury-specific evidence guidance for Kyriba, treasury, cash visibility, liquidity, bank connectivity, signer, payment control, and TMS Moves.
  - Restricts AP invoice guidance to invoice / AP / accounts payable / procurement / exception-style Moves.
  - Keeps generic finance Moves on generic evidence guidance unless they are explicitly AP/invoice-specific.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - Reads capture-card content from `engagements.charter.scaffold` as well as top-level charter keys.
- Focused regression tests for AP, treasury, generic finance, and nested P0 scaffold capture rendering.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx`
- Pass: `npx eslint src/lib/programs/evidence-readiness/move-evidence-need-packet.ts src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts src/components/strategic-moves/StrategicMovePhaseClient.tsx src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx`
- Live pre-fix pressure evidence captured under:
  - `reports/industrial-moves-promote-root-cause-2026-07-03T01-09-15-935Z`
  - `reports/industrial-moves-access-policy-probe-2026-07-03T01-11-39-669Z`
  - `reports/industrial-moves-cfo-ui-promote-2026-07-03T01-12-30-715Z`

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, rerun the signed-in Industrial Demo Moves pressure test and verify the P0 workspace shows treasury evidence guidance and 5/5 P0 capture from the saved charter scaffold.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA deploy workflow after merge.
- ACA runtime invariant: required before claiming production live.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the commit and redeploy the previous healthy ACA image through the repo-owned deploy workflow. No schema or data migration is included.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy proof: pending.
- Post-deploy signed-in browser proof: pending.

## Known Gaps

- The generic `AbarVa Agent Lakeshore Holdings Industries` saved auth state cannot create Moves because `can_create_programs` is false; demo recording should use a client persona with create permission, or the demo persona must be re-provisioned intentionally.
- The saved CIO auth state used in the local probe was no longer signed in.
