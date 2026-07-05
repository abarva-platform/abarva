# 2026-07-05-moves-phase-workspace-v2-slice1 — Truthful capture state + declutter (Moves phase workspace v2, slice 1)

## Release ID

`2026-07-05-moves-phase-workspace-v2-slice1`

## Status

`candidate`

## Plain-English Summary

First slice of the Moves phase-workspace redesign. Two fixes that make the workspace stop misrepresenting itself:

1. **Truthful capture state.** Every phase (P1–P5) rendered "0 of N captured / not captured" even when the inputs were saved — because the cards read the origination charter instead of the actual saved phase-capture. They now load the real capture values for the phase, so a phase with all inputs saved shows "N of N," not a false "0 of N."
2. **Declutter.** Removed the redundant inner labels that repeated the panel header (e.g. "P2 DISCOVER & DIAGNOSE · Gate criteria — 1 of 5 met" printed directly under a panel already titled "Gate criteria — 1 of 5 met"; same for the Artifacts panel).

Later slices carry the action-forward layout, the merged gate-readiness panel, Build-and-approve, and the AgentDock chat controls.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace (`StrategicMovePhaseClient`) for all clients. Client-only; no schema, route, or contract change. The capture values are read from the existing signed-in `GET /phase-capture` endpoint.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - Loads real phase-capture values (`GET /api/v1/programs/{id}/phase-capture?phase=N`) and derives `capturedSections` from them (charter carry as fallback), so the capture chips and `CharterWorkflow` seed reflect saved data. `CharterWorkflow` remounts (`key`) once the real state loads so its seeds are truthful.
  - Removed the redundant inner header labels on the Gate-criteria and Artifacts panels (they duplicated the collapsible panel header).

## QA / Validation

Overall status: **PASS** (static checks); live visual proof **not-run (blocked on deploy)** — localhost cannot reach the private Postgres.

- `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- `npx eslint` on the changed file → **PASS**.
- Live pre-fix evidence: `app.abarva.ai` Lakeshore Move `908c9bf8…` P2 showed "0 of 7 captured" while `GET /phase-capture?phase=2` returned `complete: true` with all 7 sections populated.
- Post-deploy proof → **not-run (blocked on deploy)**: reload a phase with saved inputs and confirm it shows "N of N," and that no panel prints a duplicated inner header.

## Rollout Plan

Merge to `main` → ACA image build → deploy to `ca-abarva-web-lab-eastus` → 100% traffic → verify a phase shows truthful capture state live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`); runbook `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: web revision only.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — a phase with saved inputs shows "N of N."

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. UI-only; nothing persisted differently.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Post-deploy: live screenshot of a phase showing truthful "N of N" capture.

## Known Gaps

- This is slice 1 of the phase-workspace v2 package. Still to come: action-forward layout, one merged gate-readiness panel, Build-and-approve (approve triggers generation; can't advance without a generated deliverable), AgentDock chat controls (pin/hide/expand), inline evidence upload, per-phase content depth (P3–P5 currently use generic capture), and the download/blob + doc-parsing backend fixes.
