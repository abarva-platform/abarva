# 2026-07-06-source-approval-three-box-strategy-gate — approval page IS the strategy gate (3 confirmations)

## Release ID

`2026-07-06-source-approval-three-box-strategy-gate`

## Status

`candidate`

## Plain-English Summary

When strategy-at-P0 is on for a tenant, approval already advances the event straight to Scope
and waives the three GATE-STRATEGY criteria. But the approval page still showed a single
generic "I confirm this is my accountable human approval decision" checkbox, so the reviewer
never saw the strategy gate they were actually clearing — it was a silent waive.

This makes the gate visible: when `source_strategy_at_p0` is enabled, the approval card
renders the **three GATE-STRATEGY confirmations as explicit checkboxes** — Sponsor sign-off ·
Value target set · Archetype confirmed — and the Approve button is gated on all three (plus
the rationale). The audit note records that the three were confirmed, and the "what happens
next" copy now truthfully says the event advances to Scope. Tenants without the flag keep the
existing single accountable-decision confirm, unchanged.

## Layer Impact

- `global-control-lane`: shared approval component (`EventApprovalCard`). Behavior is
  conditional on the existing `source_strategy_at_p0` flag (passed in as
  `generateMemoOnApprove`): flag on → 3-box strategy gate; flag off → the current single
  confirm, byte-identical. No API contract change (the approve route already advances/waives
  server-side); the checkboxes are the client-side human gate, and the confirmation is folded
  into the audit `notes`.

## Client Applicability

- All clients: the component ships to all, but the 3-box gate only renders where
  `source_strategy_at_p0` is enabled.
- Specific clients: **Lakeshore** (the only tenant enrolled in the flag today) — sees the 3
  confirmations.
- Internal only: no
- Public/demo only: no
- Feature flag: gated by the existing `source_strategy_at_p0`.

## Changes Included

- `src/components/source/approval/EventApprovalCard.tsx` — 3-box strategy-gate confirmations
  (sponsor / value / archetype) gating Approve when the flag is on; audit-note composition;
  flag-aware "what happens next" copy. Single confirm preserved for non-flag tenants.
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx` — new test asserting
  the 3 boxes render and Approve is gated on all three.

## QA / Validation

- `npx jest src/components/source/approval` → **3 tests pass** (incl. the new 3-box test).
- `npx tsc --noEmit` (full project, exit-code gated) → **0 errors**. **pass.**
- `npx eslint` changed file → clean. **pass.**
- Live signed-in proof required on deploy: fresh Lakeshore event → approval page shows the 3
  confirmations, Approve stays disabled until all 3 + rationale, and approving lands on Scope.
  **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. ACA main deploy auto-runs; **pin 100% traffic to the new
revision** (deployment-churn guard — prior deploys created the revision but a competing
pipeline held traffic). No migration, no new flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — approval component only.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; **explicitly set traffic
  weight to the new revision** (do not assume the pipeline shifted it).
- Live signed-in proof required: yes — Lakeshore approval walk on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy. The card returns to the single confirm; no data/schema to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- The three confirmations are recorded in the approval `notes` (audit log), alongside the
  existing self-approval flag and lifecycle transition.

## Known Gaps

- The 3-box gate is client-side; the server still waives the criteria on approve regardless.
  A future hardening could require the three confirmations in the approve payload server-side.
