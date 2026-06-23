# 2026-06-23-moves-p0-gate-reconciliation — Moves P0 Gate Reconciliation

## Release ID

`2026-06-23-moves-p0-gate-reconciliation`

## Status

`candidate`

## Plain-English Summary

Approving a Move's P0 origination brief must create the same canonical gate record that deliverable generation checks. This fix stops the approval request update from prematurely moving the phase before the governed P0 close helper can sign the brief, evaluate the gate, and write the approved phase snapshot.

## Layer Impact

`global-control-lane`: shared Strategic Moves approval behavior. The change keeps P0 approval, phase advancement, and generation readiness aligned for every tenant.

## Client Applicability

- All clients: Strategic Moves P0 brief approvals.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/approval.ts`: P0 approval lifecycle sync no longer writes `current_phase` directly; `closeP0OnApproval` remains the single phase-transition path.
- `src/lib/programs/__tests__/approval.test.ts`: regression that the approval sync does not patch `current_phase`.
- `tests/e2e/moves-deliverable-redo.spec.ts`: strict locator fix for the live Moves click-through harness.

## QA / Validation

- `npx jest src/lib/programs/__tests__/approval.test.ts --runInBand` — pass, 31 tests.
- `E2E_BASE_URL=https://app.abarva.ai E2E_MOVE_ID=82d01ebb-d9f4-4f53-b2d3-c66f0ad8fcfd E2E_STORAGE_STATE=.auth/agent-meridian.json npx playwright test tests/e2e/moves-deliverable-redo.spec.ts --project=chromium --reporter=line` — pass, one expected artifact-url skip.
- Live diagnosis before the fix: `agent-meridian` approved the P0 brief, the UI moved to P1, but VNet DB proof showed `gates_passed=[]`, `phase_snapshots=[]`, and generation returned `generation_gate_blocked`.

## Rollout Plan

Merge to `main`; the repo-owned `aca-main-deploy` workflow builds and deploys the Azure Container Apps image. After deploy, create a fresh Meridian Move, approve the P0 brief through the live UI, confirm an approved phase-0 snapshot exists, then generate the P0/P1 artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: None outside the repo-owned ACA deploy.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: `app.abarva.ai` must serve the merged commit image.
- Worker image invariant: No worker-specific behavior changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — `agent-meridian` P0 approve -> phase snapshot -> generation unblocked.

## Rollback Plan

Revert this commit and redeploy the previous ACA image. Rollback would restore the prior split behavior, so prefer forward-fix if deploy verification finds an adjacent issue.

## Audit Evidence

- PR for this release.
- Focused Jest output for `approval.test.ts`.
- Live Playwright click-through output for `moves-deliverable-redo.spec.ts`.
- VNet-visible DB proof showing the pre-fix split state on Move `82d01ebb-d9f4-4f53-b2d3-c66f0ad8fcfd`.

## Known Gaps

The existing live proof Move already has the split state and should not be used as the post-fix proof. Post-deploy verification must create or use a fresh pending P0 Move so the fixed approval path can run from the start.
