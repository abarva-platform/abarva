# 2026-07-04-moves-phase-workflow-checklist — Moves phase workflow checklist (increment 4)

## Release ID

`2026-07-04-moves-phase-workflow-checklist`

## Status

`candidate`

## Plain-English Summary

Makes the Moves phase workspace **workflow-driven, like a Stripe get-started checklist**. On the current phase, the workspace now leads with a "What to do next" card: an ordered task list — provide the evidence this phase needs, meet the gate criteria, then attest and advance — each with a real status and progress count, and the final "advance" step locked until the first two are done. Every status is computed from **real move state** (evidence-need coverage and gate criteria), never a guess and never from the AI. It renders above the existing guidance cards, behind the same `moves_phase_workspace_v2` flag (Lakeshore on). The chat pane is untouched — the phase is completable by following the checklist, without using chat.

## Layer Impact

- `global-control-lane` (flag-gated): a deterministic workflow model (`buildPhaseWorkflow`) + a presentational checklist, fed by real data the phase page already loads. Additive; no route/data/model change.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default; Lakeshore opt-in).

## Client Applicability

- All clients: no — off by default.
- Specific clients: **Lakeshore** (flag opt-in).
- Feature flag: `moves_phase_workspace_v2` (same flag as increment 3).

## Changes Included

- `src/lib/programs/phase-templates/phase-workflow.ts` — new deterministic `buildPhaseWorkflow` (structural inputs; no app-type or model coupling).
- `src/components/strategic-moves/phase-workspace/PhaseTaskChecklist.tsx` — new presentational checklist.
- `MovePhaseWorkspacePanel.tsx` — renders the checklist above the guidance when real signals are present.
- `StrategicMovePhaseClient.tsx` — passes real `evidenceNeedPackets` + `move.gateCriteria` (current phase only) into the panel.
- `styles.tsx`, `index.ts`, tests. Proof: `proof/moves-phase-workflow-p2-2026-07-04/phase-workflow-p2-render.html`.
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest 36/36 — **pass** (incl. 6 `buildPhaseWorkflow` unit tests: evidence/gate sequencing, hard-vs-soft gates, no-next-phase → Tower, no vacuous "done"; + checklist/panel render tests).
- esbuild parse of the edited client — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Render proof: real panel + checklist → static HTML, screenshotted — **pass** (progress bar + active/todo/locked states with real counts).
- Live signed-in Lakeshore proof on the P2 phase page — **run post-deploy** (captured after the new ACA revision is healthy; recorded in the PR).
- Full-project `tsc --noEmit` — **not run** here (red from an unrelated merge; does not block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increment 3.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand.
- Approved image digest: the `main-<sha>` image the workflow builds for this merge.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai` (new revision serving 100% traffic).
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — captured on the Lakeshore P2 page post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact.

## Audit Evidence

- PR URL: (added on open).
- Tests: jest 36/36 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Proof: `proof/moves-phase-workflow-p2-2026-07-04/phase-workflow-p2-render.html` + live signed-in screenshot.
- Report: `reports/moves-phase-workflow-checklist-implementation-2026-07-04.md`.

## Known Gaps

- The checklist actions render as status hints (they point to the existing workbench controls, which remain the single write path). Wiring click→action (scroll/trigger the real control) is the next step.
- Progress covers the two prerequisites (evidence + gate); per-session/per-capture granularity is a later refinement.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy or this change.
