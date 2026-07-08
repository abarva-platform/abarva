# 2026-07-04-moves-phase-feedforward — Moves deterministic feed-forward Inputs Pack (increment 6)

## Release ID

`2026-07-04-moves-phase-feedforward`

## Status

`candidate`

## Plain-English Summary

Makes "a phase never starts blank" real. The current phase now shows a **"Prepared for [next phase]"** card that carries forward what the next phase will start with — derived entirely from the move's **real current-state state** (maturity, gaps, readiness, missing evidence, open gate criteria), not from Claude and not from fixture data. It's read-only (no DB write) and transition-aware: P2→P3, P3→P4, P4→P5, P5→Tower each carry the right sections. Anything not yet known shows as **"Needs confirmation"** — never invented. Behind the same `moves_phase_workspace_v2` flag (Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): a deterministic feed-forward adapter (`buildFeedForwardPack`) + a card, fed by real state the phase page already loads. Additive; **no DB migration, no model call**.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `src/lib/programs/phase-templates/feed-forward.ts` — transition-aware `buildFeedForwardPack(fromPhase, nextPhaseLabel, signals)` (pure, structural inputs; missing → "Needs confirmation").
- `NextPhaseFeedForwardCard.tsx` — renders the "Prepared for …" card (carry-forward bullets + named sections).
- `MovePhaseWorkspacePanel.tsx` — builds + renders the pack from real signals (hidden when blank).
- `StrategicMovePhaseClient.tsx` — maps real `recommendation` (maturity/gaps/whereToStart) + `readiness` (hard/soft gaps, coverage) + `evidenceNeedPackets` (missing) + `move.gateCriteria` (open) into the signals (current phase only).
- `index.ts`, tests. Proof: `proof/moves-phase-feedforward-2026-07-04/phase-feedforward-p2-render.html`.
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest 49/49 — **pass** (incl. feed-forward mapping tests for **P2→P3, P3→P4, P4→P5, P5→Tower**, a "missing → Needs confirmation, never fabricated" test, and card/panel render tests).
- esbuild parse of the edited client — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Render proof screenshotted — **pass** (the "Prepared for P3" card with Design inputs / Evidence gaps / Risks / Recommended focus, from real signals).
- Live signed-in Lakeshore proof on the P2 page — **run post-deploy** (recorded in the PR).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increments 3–5.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand. Approved image digest: the `main-<sha>` the workflow builds.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — the "Prepared for P3" card on the Lakeshore P2 page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact (read-only, no migration).

## Audit Evidence

- PR URL: (added on open). Tests: jest 49/49 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Proof: `proof/moves-phase-feedforward-2026-07-04/phase-feedforward-p2-render.html` + live signed-in screenshot.
- Report: `reports/moves-phase-feedforward-implementation-2026-07-04.md`.

## Known Gaps

- This is **Level 1** feed-forward (deterministic, read-only, derived from live state). **Level 2** — persisting an *approved* Inputs Pack as the next phase's source of truth — comes later, after the client-final/approval path is wired (needs DB + governance). Explicitly out of scope here.
- Downstream-decision sections (selected approach, workstreams, metrics) show "Needs confirmation" until later phases produce them — honest, not fabricated.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
