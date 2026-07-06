# 2026-07-05-p0-workbench-polish — Tidy P0 workbench (dead build button + Discover evidence rail)

## Release ID

`2026-07-05-p0-workbench-polish`

## Status

`candidate`

## Plain-English Summary

Follow-on to the P0 gate-clarity parity change. The live retest confirmed P0 now shows the prominent gate panel ("To advance to P1 · 2 of 6 gate criteria met"), but surfaced two cosmetic blemishes: (1) a permanently-disabled "Build report" button appeared on P0's "Origination brief signed off" criterion — because the step builder tags any brief/report/charter-like criterion with a Build action, but P0 has no phase deliverable to build; and (2) the evidence rail showed Discover-phase needs (current-state process, systems, KPI, cost baseline) that are premature at Originate, where the job is to select the evidence family, not to cover evidence. This change removes both for P0 so the Originate workspace reads clean and focuses on its gate criteria.

## Layer Impact

- `global-control-lane`: `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — shared Move phase workspace. UX-only, P0-scoped: no P0 criterion gets a Build action; P0 shows no evidence-coverage rail. No schema/API/data change.

## Client Applicability

- All clients: Yes — every tenant's P0 Move workspace.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`:
  - `reportCrit` is `undefined` for P0 (`phaseNum === 0`), so no P0 gate criterion renders a "Build report" action (P0 has no deliverable; brief is approved via approve-brief).
  - `wbPackets` is empty for P0, so the workbench evidence rail does not show Discover-phase (P2) evidence needs at Originate.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Lint: `eslint StrategicMovePhaseClient.tsx` → **PASS** (clean).
- Pre-change live evidence: P0 workspace showed a disabled "Build report" button and evidence rail items "Current-state process / Systems landscape / KPI baseline / Cost baseline" (confirmed via live DOM read).
- Post-deploy live signed-in proof: **NOT-RUN (pending deploy)** — reopen a current-P0 Move; confirm no "Build report" button, no Discover-phase evidence rail, gate panel still shows "To advance to P1 · N of M met", no breakage.

## Known Gaps

- P0 still has no one-click "Approve brief & promote to P1" action (promotion via approve-brief / agent flow); dedicated button is a follow-up.
- Bringing P1 to the Evidence Workbench is a separate follow-up.
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
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the single-file change and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind. Blast radius is P0 current-phase Move workspaces only.

## Audit Evidence

- PR URL: (to be filled on open).
- Typecheck + lint: clean.
- Live pre/post captures of a P0 Move workspace on `app.abarva.ai`.
