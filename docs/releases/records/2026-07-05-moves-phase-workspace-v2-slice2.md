# 2026-07-05-moves-phase-workspace-v2-slice2 — Action-forward layout (Moves phase workspace v2, slice 2)

## Release ID

`2026-07-05-moves-phase-workspace-v2-slice2`

## Status

`candidate`

## Plain-English Summary

Second slice of the Moves phase-workspace redesign. The capture + Save→Approve→Advance workflow — the actual thing you do on a phase — used to sit eighth in the column, below the gate, evidence, readiness, and context panels, so you had to scroll past everything to reach the action. It now renders **first** and is **open by default** on the phase the Move is actually in. The action leads; the readiness and context follow.

No behavior change to the workflow itself — purely render order and default-open state.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace (`StrategicMovePhaseClient`) for all clients. Client-only render reorder; no schema, route, or contract change.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - Moved the "Capture details" panel (which holds the Save → Approve → Generate → Advance workflow) to the top of the canvas column, directly under "what we know so far."
  - Default-open the capture panel on the current phase (`openPanels.capture = isCurrentPhase`) so the action buttons are visible without scrolling.

## QA / Validation

Overall status: **PASS** (static checks); live visual proof **not-run (blocked on deploy)**.

- `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- `npx eslint` on the changed file → **PASS**.
- JSX balance verified: 8 `<CollapsePanel>` open = 8 close; `capture-collapse` renders once, now ahead of the gate/upload panels.
- Post-deploy proof → **not-run (blocked on deploy)**: open a current phase and confirm the capture + workflow is the first thing visible, no scrolling to the action.

## Rollout Plan

Merge to `main` → ACA image build → deploy to `ca-abarva-web-lab-eastus` → 100% traffic → verify the action is action-forward live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: web revision only.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — the workflow is visible first on a current phase.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. UI-only render-order change; nothing persisted differently.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Post-deploy: live screenshot of a phase with the action at the top.

## Known Gaps

- Slice 2 of the v2 package. Still to come: merge the three redundant readiness panels (Gate criteria / What We Need / Current-state readiness) into one; Build-and-approve; AgentDock chat controls; inline evidence upload; per-phase content depth (P3–P5); download/blob + doc-parsing backend.
