# 2026-07-05-approve-advance-deadlock — Fix "Approve & advance" deadlock (report criterion)

## Release ID

`2026-07-05-approve-advance-deadlock`

## Status

`candidate`

## Plain-English Summary

Follow-up to the one-click "Approve & advance" collapse. Live check on a test P2 Move found the button permanently disabled: its "Complete first" pre-gate included the hard gate criterion "Discovery synthesis report signed off" — but that deliverable is produced BY the action (generate + sign-off). So the button was blocked by the very thing clicking it would create — a deadlock. This changes the button to gate only on "all inputs provided," and treats the remaining hard gate criteria as an informational "still needed to clear the gate" note (excluding the deliverable/report criterion, which the action produces). The server still enforces the full gate on advance; if evidence criteria are unmet the advance surfaces a clear error and the user provides them, then re-clicks (which skips regeneration because the deliverable is already signed off).

## Layer Impact

- `global-control-lane`: `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — the single-action gating in the Move phase workspace. Client-only; no schema/API/data change.

## Client Applicability

- All clients: Yes — every tenant's Move phase workspace single action.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `hardGateStillNeeded` = unmet hard criteria EXCLUDING the deliverable/report criterion (`/signed off|report|charter|deliverable/i`).
- "Approve & advance" button `disabled` no longer includes hard-criteria; gates on inputs provided + in-flight state only.
- The remaining gate criteria render as an informational "Still needed to clear the gate: …" note under the enabled button, not as a blocker.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Lint: `eslint` → **PASS** (0 errors; 1 pre-existing wbPackets warning).
- Pre-fix live evidence: on test P2 Move `e0e138d5`, the "Approve & advance to P3" button was disabled with "Complete first: Discovery synthesis report signed off; Baseline metrics…; Stakeholder map…" — deadlocked on the report criterion (confirmed via live DOM read).
- Post-deploy live proof: **REQUIRED** — confirm the button is enabled (inputs provided) with the informational note, then drive it: one click saves + generates (progress) + signs off + advances (or surfaces a clear gate error for missing evidence, with re-click skipping regeneration).

## Known Gaps

- Inputs-only pre-gate means a click with unmet evidence criteria will generate the (needed) deliverable then surface a server advance error; re-click after providing evidence skips regeneration. Acceptable; a per-criterion "user-providable vs action-produced" classification could refine the pre-gate later.
- No automated test; verified by live drive-through.

## Rollout Plan

Merge to `main` (after CI build green) → ACA main deploy → verify on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — one-click Approve & advance works end to end.

## Rollback Plan

Revert the single-file change and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind.

## Audit Evidence

- PR URL: (to be filled on open).
- Typecheck + lint: clean.
- Live pre/post captures on `app.abarva.ai` (test Move e0e138d5).
