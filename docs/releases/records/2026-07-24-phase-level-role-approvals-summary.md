# 2026-07-24-phase-level-role-approvals-summary — Surface multi-role approver status at the phase gate

## Release ID

`2026-07-24-phase-level-role-approvals-summary`

## Status

`candidate`

## Plain-English Summary

`RoleApprovalsPanel.tsx` already gives a clear per-role (Business/Technology/Finance/Risk-security)
approval breakdown for a deliverable, but it only appears inside Files & Evidence — a user reading
the phase-level gate decision surface in the Moves phase workspace has no visibility into which
named roles have or haven't signed off, even though the gate-evaluation logic
(`governance.ts`'s `meetsApprovalBar()`) is silently gating advancement on exactly that data. This
change adds a condensed, read-only summary of role-approval status directly to the phase-level
decision surface, reusing the exact same API route `RoleApprovalsPanel` already calls — no new
data model, no change to gate-evaluation logic.

While building this, found and fixed a real correctness issue before it shipped: the plan (per
the `MOVES-UI-011` backlog entry) was to source role-gated deliverables via `getGateArtifacts()`,
but `operating_model_design` — a deliverable type that requires Business + Technology approval —
is flagged `gateArtifact: false` in the registry (it's a role-gated *working doc*, not a formal
gate artifact). Using `getGateArtifacts()` would have silently dropped it from the summary. The
implementation uses `getDeliverablesByPhase()` instead, matching how `governance.ts` actually
resolves role-approval requirements (by specific deliverable row, not by the `gateArtifact` flag).

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **UI-only, read-only, no schema or gate-logic change.** New file
  `src/components/strategic-moves/PhaseRoleApprovalsSummary.tsx` fetches the same
  `GET /api/v1/programs/:moveId/deliverables/:deliverableId/role-approvals` route
  `RoleApprovalsPanel.tsx` already calls, once per role-gated deliverable in the phase, and
  renders a condensed summary. `MovesPhaseStandaloneClient.tsx`: one new import, one new mount
  point (after the existing "Gate execution checklist" details block), plus supporting CSS.

## Client Applicability

- All clients: yes — shared Moves phase-workspace UI, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — read-only UI addition; renders nothing for the (large majority of) phases
  with no role-gated deliverables

## Changes Included

- `src/components/strategic-moves/PhaseRoleApprovalsSummary.tsx` (new) — resolves a phase's
  role-gated deliverable types via `getDeliverablesByPhase()` +
  `requiredApprovalRolesFor()`, matches them against the Move's real deliverables by `typeKey`,
  fetches role-approval status per matched deliverable, and renders a condensed
  `<details>`/pill summary matching the existing `.mxw-gate-detail` visual pattern
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — imports and mounts the new
  component; new `.mxw-role-approvals-*`/`.mxw-role-pill-*` CSS reusing existing design tokens
  (`--green`, `--amber`, `--line-2`, etc.)
- `src/components/strategic-moves/__tests__/PhaseRoleApprovalsSummary.test.tsx` (new) — 5
  assertions covering the empty cases, the multi-deliverable aggregation case (using real phase-3
  data), the in-flight state, and the fetch-failure fallback
- `docs/backlog/moves-product-backlog.md` — `MOVES-UI-011` updated from `Found, not fixed` to
  `Implemented`, documenting the `getGateArtifacts` → `getDeliverablesByPhase` correction

## QA / Validation

- `npx eslint` on both changed/new source files: clean
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`: no new errors (3
  pre-existing, unrelated missing-module errors in `src/components/home/*`)
- `npx jest src/components/strategic-moves/__tests__/PhaseRoleApprovalsSummary.test.tsx`: 5/5
  passing
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: 53/53
  passing (zero regressions from mounting the new component)
- `npx jest src/components/strategic-moves`: 151/151 real tests passing; 1 suite fails to even
  load due to a pre-existing, unrelated Clerk/`@clerk/backend` module-resolution error, confirmed
  present on a clean `origin/main` checkout before this change
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — takes effect for every Move's phase workspace immediately on deploy;
   renders nothing for phases with no role-gated deliverables (most phases).
3. Live signed-in verification: open a Move at a phase with role-gated deliverables (e.g. P3,
   which has `target_state_architecture` and `operating_model_design`) and confirm the "Approver
   status by role" summary appears with the correct per-role breakdown.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (client-rendered UI only)
- Feature/env flag update path: none
- Live signed-in proof required: yes — see Rollout Plan step 3

## Rollback Plan

Revert the merge commit. The change is additive (one new component, one new mount point, new
CSS classes); reverting removes the summary and restores the prior behavior (role-approval status
visible only in Files & Evidence). No data cleanup required.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `MOVES-UI-011` in `docs/backlog/moves-product-backlog.md`
- Test evidence: `npx jest src/components/strategic-moves` output captured in this session's
  validation pass (151/151 real tests passing)

## Known Gaps

- No live signed-in browser proof yet — pending the standard rollout verification step.
- Does not address the separately-flagged gap that `RoleApprovalsPanel.tsx`'s `approverName` field
  is free text, not tied to an authenticated user identity — that is coupled with `MOVES-UI-010`'s
  approver-identity work and out of scope here.
- Does not surface role-approval history (only the current latest decision per role) — that is
  `MOVES-UI-012`, explicitly deferred pending `MOVES-ARTIFACT-001`'s event-sourced lifecycle model.
