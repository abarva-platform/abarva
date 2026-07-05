# 2026-07-05-p0-gate-clarity — Bring P0 gate clarity to parity with P2–P5

## Release ID

`2026-07-05-p0-gate-clarity`

## Status

`candidate`

## Plain-English Summary

Audit of the Move phase workspaces (P0→P5) for "does a new user know what to do to complete this phase" found the gate-clarity panel — the prominent "N of M criteria met · what to complete first · advance to the next phase" surface — held for P2–P5 but broke at P0. P0's workspace showed chat + read-only capture cards, with its gate criteria buried in a collapsed "Gate readiness" panel rather than surfaced as the primary "what completes this phase" element. The criteria data already existed (governance `GATE_RULES` 0→1: seed recorded, value hypothesis, sponsor candidate, scope boundary, evidence family) — it just wasn't prominent.

This brings P0 to parity by rendering the Evidence Workbench (the same evidence-first surface P2–P5 use) for the current P0 phase, so its gate criteria and readiness are prominent. Because P0 capture is owned by the originate flow (the phase cards are read-only) and P0 has no phase deliverable to "build and approve" (it promotes via approve-brief), the Save→Build sequence is hidden for P0 and the in-workbench build/advance action stays gated to P2–P4 (no advance button on P0). P1 is intentionally unchanged — it keeps its chat-resident canvas and its own advance step.

## Layer Impact

- `global-control-lane`: `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — the shared Move phase workspace for all tenants. Read-path/UX only: extends `useWorkbench` to include the current P0 phase and hides the Save/Build sequence for P0. No schema/API/data change; P0 gate criteria come from the existing `move.gateCriteria` (`gateCriteriaForPhase(0)`).

## Client Applicability

- All clients: Yes — every tenant's P0 Move workspace gains the prominent gate clarity.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`:
  - `useWorkbench` now includes `phaseNum === 0` (current phase), so P0 renders the Evidence Workbench with the prominent gate-criteria panel ("To advance to P1", "N of M gate criteria met", per-criterion met/unmet).
  - The captureCards Save→Build "Phase workflow" sequence is hidden for P0 (`phaseNum !== 0`), since P0 capture is read-only (originate flow) and P0 has no phase deliverable. The in-workbench advance action remains gated to P2–P4, so P0 shows no build/advance button it cannot satisfy.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Lint: `eslint StrategicMovePhaseClient.tsx` → **PASS** (clean).
- Pre-change live evidence: P0 workspace (`/strategic-moves/{id}/phase/0`) showed capture pills + chat; gate criteria only in a collapsed "Gate readiness" panel; no prominent "N of M met / advance to P1" (unlike P2). Confirmed via live DOM read.
- Post-deploy live signed-in proof: **NOT-RUN (pending deploy)** — open a current-P0 Move on `app.abarva.ai`, confirm the workspace shows the prominent gate panel ("To advance to P1", N of M met, per-criterion status), read-only capture cards, no Save/Build step, and nothing visibly broken.

## Known Gaps

- P0 has no one-click "Approve brief & promote to P1" action in the workspace (advance stays gated to P2–P4); P0 promotion continues via the approve-brief path / agent flow. A dedicated P0 promote button wired to `/approve-brief` is a follow-up.
- P1 still lacks the Evidence Workbench (keeps its chat-resident canvas + captureCards advance). Bringing P1 to the workbench is a separate change (must also extend the advance action to P1 to avoid regressing its advance step).
- No automated test added; verified by typecheck + live render.

## Rollout Plan

Merge to `main` → ACA main deploy → `ca-abarva-web-lab-eastus` → shift traffic → verify a current-P0 Move workspace on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — P0 workspace renders the prominent gate clarity without breakage.

## Rollback Plan

Revert the single-file change to `StrategicMovePhaseClient.tsx` and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind. Blast radius is P0 current-phase Move workspaces only.

## Audit Evidence

- PR URL: (to be filled on open).
- Typecheck + lint: clean.
- Live pre/post captures of a P0 Move workspace on `app.abarva.ai`.
