# 2026-07-05-moves-phase-workspace-v2-slice3 — One "Gate readiness" panel (Moves phase workspace v2, slice 3)

## Release ID

`2026-07-05-moves-phase-workspace-v2-slice3`

## Status

`candidate`

## Plain-English Summary

Third slice of the Moves phase-workspace redesign. Three panels used to describe the same idea — "what's left to finish this phase" — in three different boxes: "Gate criteria," "What We Need Before This Phase Is Final," and "Current-state readiness." They are now one panel, **"Gate readiness"**: the gate checks, the still-needed evidence, and the estate-derived readiness live under a single header. The panel auto-opens when there are hard gaps to clear.

No content is lost — the same criteria, evidence needs, and readiness instruments render; they're just consolidated into one place instead of three overlapping boxes.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace (`StrategicMovePhaseClient`) for all clients. Client-only render consolidation; no schema, route, or contract change.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - Renamed the gate panel to "Gate readiness" and folded the evidence-needs (`MoveEvidenceNeedsPanel` + review-feedback loop) and current-state-readiness (`CurrentStateReadinessPanel`) content into its body.
  - Removed the two now-redundant CollapsePanels (`needs-collapse`, `readiness-collapse`).
  - Auto-open the merged panel on hard gaps (`autoOpenPanel` "readiness" → "gate").

## QA / Validation

Overall status: **PASS** (static checks); live visual proof **not-run (browser MCP unavailable this session)**.

- `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- `npx eslint` on the changed file → **PASS** (exit 0).
- JSX balance verified: `<CollapsePanel>` count dropped from 8 to **6/6** (open=close); zero dangling `needs-collapse`/`readiness-collapse` references; one "Gate readiness" title.
- Post-deploy proof → **not-run (blocked)**: browser verification isn't available this session; confirm on next visual pass that a current phase shows a single "Gate readiness" panel containing the checks, evidence needs, and readiness.

## Rollout Plan

Merge to `main` → ACA image build → deploy to `ca-abarva-web-lab-eastus` → 100% traffic. Serialized after the slice-2 deploy to avoid overlapping revisions. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: web revision only.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes (deferred — browser MCP unavailable this session).

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. UI-only consolidation; nothing persisted differently.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Post-deploy: live screenshot of the single "Gate readiness" panel (next visual pass).

## Known Gaps

- Slice 3 of the v2 package. Still to come: Build-and-approve (approve triggers generation; no advance without a generated deliverable) + status-machine reconcile; AgentDock chat controls (pin/hide/expand); inline evidence upload; per-phase content depth (P3–P5); download/blob + doc-parsing backend.
- Browser-based visual verification is unavailable this session — the layout changes are verified structurally (JSX balance, tsc, eslint) and via deploy health, with visual confirmation deferred to the next interactive pass.
