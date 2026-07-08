# 2026-07-04-moves-what-changed — Moves client-final upload → What Changed (increment 9)

## Release ID

`2026-07-04-moves-what-changed`

## Status

`candidate`

## Plain-English Summary

Supports the consulting reality: AbarVa drafts, the client edits offline, then uploads the final version — and AbarVa shows **what changed** before carrying it forward. After a completed template is uploaded (the draft baseline), an "Upload final reviewed version" control appears; AbarVa reads both files **client-side** and shows a deterministic **What Changed** card — sections changed / added / removed, line counts, and which next-phase inputs to review — then asks the client to **confirm** before the change carries forward. No backend, no Claude, no persistence. Behind the same `moves_phase_workspace_v2` flag (Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): a pure text-diff (`computeWhatChanged`) + a `WhatChangedCard`, with the draft/final text read client-side in `StrategicMovePhaseClient` (the panel stays pure — chat-decoupling contract intact). Additive; **no persistence** (that is increment 10), no route/model change.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `src/lib/programs/phase-templates/what-changed.ts` — `computeWhatChanged(draft, final, impactedNextPhaseInputs)` (section + line diff; structural, not semantic).
- `WhatChangedCard.tsx` — renders the diff + impacted next-phase inputs + a client-confirm gate (with confirmed state).
- `MovePhaseWorkspacePanel.tsx` — "Upload final reviewed version" control (only after a draft upload exists) + the card.
- `StrategicMovePhaseClient.tsx` — reads draft text on the completed-template upload; a second file input reads the final; `computeWhatChanged` runs; confirm sets state.
- `index.ts`, tests. Proof: `proof/moves-what-changed-2026-07-04/what-changed-p3-render.html`.
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest 70/70 — **pass** (diff flags changed/added/removed sections + line counts; impacted next-phase only when changed; identical → no changes; card renders diff + impact + confirm; confirmed state; panel gates the final-upload on a prior draft).
- esbuild parse of the edited client — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Render proof screenshotted — **pass** (What changed vs. the draft: sections changed/added, Next phase to review, Confirm changes gate).
- Live signed-in Lakeshore proof — **run post-deploy** (upload a draft then a final, see What Changed; recorded in the PR).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increments 3–8.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand. Approved image digest: the `main-<sha>` the workflow builds.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — draft→final What Changed on the Lakeshore phase page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact (no persistence).

## Audit Evidence

- PR URL: (added on open). Tests: jest 70/70 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Proof: `proof/moves-what-changed-2026-07-04/what-changed-p3-render.html` + live signed-in screenshot.

## Known Gaps

- **Structural, not semantic:** the diff reports which sections/lines changed, not the *meaning* ("approach changed from X to Y"). Semantic summaries are a later, model-assisted step (increment 12).
- **Session-scoped:** the draft baseline is the completed-template upload made this session; a persistent prior-approved baseline is increment 10.
- **Confirmation is in-session:** "Confirm changes" records intent in the UI; carrying it forward on advance is wired when persistence lands (increment 10).
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
