# 2026-07-04-moves-advance-gate-button — P1–P4 "Advance gate" button in the Moves phase workspace

## Release ID

`2026-07-04-moves-advance-gate-button`

## Status

`candidate`

## Plain-English Summary

Third and final piece of the Moves phase-progression fix chain (after `2026-07-04-moves-phase-capture-key-alignment` and `2026-07-04-moves-phase-gate-deliverable`). Those two made Save persist and Approve sign off the gate deliverable — but the phase workspace still had **no button to actually advance the Move to the next phase**. Only P0 had an advance action ("Approve brief"); for P1–P5 the only path was asking the Nexus chat to advance. So a Move could be fully captured and approved and still sit at its phase in the UI.

This adds an **"Approve gate & advance to P{n+1}"** button (step 4) to the phase workspace for P1–P4. It runs the exact two governed calls a chat advance would: finalize the capture (mark the phase modules `completed`, which the gate-approval path requires) via `POST …/phase-capture {complete:true}`, then `POST …/phase-gate-approval`, and lands the operator on the next phase. The server still enforces the gate — a hard-gate failure is surfaced inline, nothing is bypassed. Client-only; no route or schema change.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace (`StrategicMovePhaseClient` / `CharterWorkflow`) for all clients. Adds a UI advance action; reuses the existing signed-in `phase-capture` and `phase-gate-approval` routes unchanged. Enabled only once the phase gate record is approved (signed off), for P1–P4.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — `CharterWorkflow` gains an `advanceGate` action + an "Advance gate — P{n} → P{n+1}" section (step 4), enabled when `approved` for phases 1–4. Surfaces `capture_incomplete` / hard-gate-blocked errors inline; navigates to `/strategic-moves/{id}/phase/{newPhase}` on success.

## QA / Validation

Overall status: **PASS** for static checks and the live underlying-sequence proof; the post-deploy button-click check is **not-run** (blocked on deploy — localhost cannot reach the private Postgres).

- `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- `npx eslint` on the changed file → **PASS** (clean).
- Manual live proof of the underlying two-call sequence (pre-button, `app.abarva.ai`, Lakeshore Move `908c9bf8…`) → **PASS**: `POST /phase-capture {phase:1, complete:true}` → `allSaved:true, missing:[]`; `POST /phase-gate-approval {phase:1}` → `approved:true, newPhase:2` (carried soft gap `baseline_captured`). The Move advanced P1→P2. The button performs exactly these calls.
- Post-deploy button-click proof → **not-run (blocked on deploy)**: after deploy, click "Approve gate & advance" on an approved phase and confirm navigation to the next phase.

## Rollout Plan

Merge to `main` → ACA image build → deploy to `ca-abarva-web-lab-eastus` → 100% traffic to the new revision → verify the button advances a Move live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`); runbook `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none new — reuses existing governed routes.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: web revision only.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — the button advances an approved P1 Move to P2.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. UI-only change; nothing persisted differently (the routes it calls are unchanged and already in production). No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Live pre-button proof: `phase-gate-approval` returning `newPhase:2` on Move `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`.
- Post-deploy: live signed-in screenshot of the button advancing P1→P2.

## Known Gaps

- P5 → Tower handoff is a separate action (not this button; the button covers P1–P4).
- Post-deploy button-click proof pending.
- Unchanged, by design: P2+ gates still require their real evidence-driven hard checks (discovery notes ingested, baseline attested, …) — the button surfaces those as blockers rather than bypassing them.
