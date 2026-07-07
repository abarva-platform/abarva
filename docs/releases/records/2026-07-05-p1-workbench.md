# 2026-07-05-moves-workflow-clarity — P1 workbench parity + collapse to one "Approve & advance"

## Release ID

`2026-07-05-moves-workflow-clarity`

## Status

`candidate`

## Plain-English Summary

Two connected Move phase-workspace changes so the user provides inputs and makes decisions instead of operating the machinery:

1. **P1 gate-clarity parity.** P0 and P2–P5 already render the Evidence Workbench with the prominent gate panel; P1 was the last phase on the bare canvas. `useWorkbench` now covers all current phases P0–P5.

2. **Collapse `Save → Build → Advance` into one "Approve & advance".** Per the governing principle "the user provides inputs + makes decisions, never clicks Build," the three separate clicks (Save record, Build and approve, Advance) become a single action. The user fills the section inputs; one button then saves the record, generates the board-grade deliverable, signs it off, and advances — all as backend steps with live progress. There is no separate Save or Build button, and the per-criterion "Build report" action and the duplicate workbench advance button are removed; the gate panel stays read-only status (criteria met/unmet + Add evidence). P0 is unchanged (read-only originate, promotes via approve-brief). P5 stops at build + sign-off (terminal → Tower handoff), not an advance.

## Layer Impact

- `global-control-lane`: `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — shared Move phase workspace. UX + client-orchestration change; reuses existing routes (phase-capture, deliverables sign-off, generate-phase, phase-gate-approval). No schema/API/data change. The combined action threads the fresh `deliverableId` from `saveRecord`'s return through `buildAndApprove`/`approveRecord` so the one-click chain does not race React state; it is gated on all inputs provided AND no unmet hard gate criterion (same rule the server enforces), so a click never triggers a multi-minute generation only to be rejected.

## Client Applicability

- All clients: Yes — every tenant's Move phase workspaces (P1 clarity + the collapsed action on P1–P5).
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `useWorkbench = isCurrentPhase && phaseNum >= 0 && phaseNum <= 5` (adds current P1).
- `saveRecord` returns `{deliverableId, allSaved}`; `approveRecord`/`buildAndApprove` accept an optional deliverable id.
- New `completeAndAdvance`: save → build+sign-off → advance (P1–P4) / build-only (P5), id-threaded, hard-gate aware.
- captureCards: 3-step sequence + separate advance section replaced by one "Approve & advance to Pn" (P5: "Approve & finalize Tower handoff") with progress/error/blocker states; shown only for the current phase.
- Workbench gate steps: removed the "Build report" per-criterion action; nulled the workbench's own advance button. Removed now-unused helpers (canAdvance, canBuildApprove, reportCrit, hardBlockers, wbCanAdvance, savedCount).

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Lint: `eslint` → **PASS** (0 errors; 2 pre-existing warnings — one wbPackets exhaustive-deps, one now removed).
- CI production build: **required as pre-merge gate** (catches full-build issues tsc misses).
- Post-deploy live signed-in proof: **REQUIRED before this is "done"** — drive a test Move (e.g. a P2 move) through the single "Approve & advance": confirm one click saves + generates (progress) + signs off + advances, with no separate Save/Build buttons; confirm the disabled reasons ("Provide all N inputs", "Complete first: <hard criteria>") and P1 workbench render. Browser reconnected — this verification is now possible.

## Known Gaps

- P0 keeps its own path (no one-click promote button; approve-brief). P5's Tower-handoff-specific flow beyond build+sign-off is unchanged.
- Rich generation progress/blockers render in the captureSlot action; the gate panel no longer shows a "Complete first" note on an advance button (that clarity moved to the action's own disabled reason).
- No automated test; verified by live drive-through.

## Rollout Plan

Merge to `main` (after CI build green + live drive-through) → ACA main deploy → verify on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — one-click Approve & advance works end to end.

## Rollback Plan

Revert the single-file change and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind. Blast radius is the Move phase workspaces.

## Audit Evidence

- PR URL: #4479.
- Typecheck + lint: clean.
- Live drive-through capture: to be added on verification.
