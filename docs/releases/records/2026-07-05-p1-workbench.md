# 2026-07-05-p1-workbench — P1 gate-clarity parity (workbench for P1)

## Release ID

`2026-07-05-p1-workbench`

## Status

`candidate`

## Plain-English Summary

Completes the phase-gate completion-clarity uniformity across the whole Move lifecycle. P0 and P2–P5 already render the Evidence Workbench with the prominent gate panel ("N of M criteria met", "To advance to Pn"); P1 was the last phase still using the bare chat-resident canvas. This extends the workbench to the current P1 phase so it shows the same "what completes this phase" clarity. P1 has a charter deliverable, so its capture → build → advance sequence continues to render in the captureSlot exactly as before; the workbench only adds the gate-clarity panel on top. The in-workbench advance action stays gated to P2–P4, so P1's advance remains its single captureSlot control (no double advance).

## Layer Impact

- `global-control-lane`: `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — shared Move phase workspace. One-line change: `useWorkbench` now covers all current phases P0–P5. No schema/API/data change.

## Client Applicability

- All clients: Yes — every tenant's P1 Move workspace gains the gate-clarity panel.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: `useWorkbench = isCurrentPhase && phaseNum >= 0 && phaseNum <= 5` (was `((phaseNum >= 2 && phaseNum <= 5) || phaseNum === 0)`), adding the current P1 phase.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Post-deploy live signed-in proof: **NOT-RUN / BLOCKED this session** — the browser MCP disconnected, so P1's workbench render could not be click-verified (P0's workbench surfaced two cosmetic blemishes that were only caught live — dead build button + Discover-phase evidence rail — so P1 must be checked the same way before merge). **Do NOT merge/deploy until a current-P1 Move workspace is live-verified** (render prominent gate panel, capture→build→advance still works, no P1-specific blemish). CI build (this PR) is the interim signal.

## Known Gaps

- Live P1 verification pending (see QA). There are currently no Moves at P1 in the lab (2 at P0, 2 at P2) — a move must be promoted to P1 to verify, or verify during the P0→P5 recording walkthrough.
- P1 may need the same blemish cleanups P0 got (evidence-rail scope, build-action suppression) if its evidenceNeedPackets are Discover-oriented — check live.
- No automated test; verification is live render.

## Rollout Plan

Merge to `main` (ONLY after live P1 verification) → ACA main deploy → verify a current-P1 Move workspace on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — P1 workspace renders the gate panel and capture→advance works.

## Rollback Plan

Revert the one-line change and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind. Blast radius is P1 current-phase Move workspaces only.

## Audit Evidence

- PR URL: (to be filled on open).
- Typecheck: 0 errors.
- Live P1 capture: pending next session (browser).
