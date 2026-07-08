# 2026-07-04-moves-upload-classify — Moves completed-template upload → mapping (increment 8)

## Release ID

`2026-07-04-moves-upload-classify`

## Status

`candidate`

## Plain-English Summary

Closes the loop: after AbarVa gives you a template (increment 7) and you fill it in, you can **upload the completed template** and AbarVa shows **where it mapped** — what it found, which solution lanes it feeds, what it's used for in this Move, and what next-phase input it prepared. The template is inferred from the filename and mapped deterministically through the governed catalog (**no Claude, no heavy parser**). It is **Move-scoped by default** and explicitly **not added to enterprise context**. Behind the same `moves_phase_workspace_v2` flag (Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): deterministic template inference (`inferTemplateFromFilename`) + the existing `classifyUpload`, surfaced via `UploadMappingSummaryCard`. Upload state lives in `StrategicMovePhaseClient` (the panel stays pure — chat-decoupling contract intact). Additive; **no persistence** (that is increment 10), no route/model change.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `src/lib/programs/phase-templates/upload-inference.ts` — `inferTemplateFromFilename(filename, phase)` (matches the downloaded starter names) + `uploadCategoryForTemplate`.
- `MovePhaseWorkspacePanel.tsx` — "Upload a completed template" control + `UploadMappingSummaryCard` when a classification exists.
- `StrategicMovePhaseClient.tsx` — hidden file input + handler: infer template → `classifyUpload` → state → panel. File is not persisted (increment 10).
- `index.ts`, tests. Proof: `proof/moves-upload-classify-2026-07-04/upload-mapping-p3-render.html`.
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest 61/61 — **pass** (filename→template inference incl. "-final"/"-v2" suffixes and null-on-no-match; category selection; `classifyUpload` mapping is Move-scoped + `not_eligible` for promotion; panel renders the upload control + mapping summary).
- esbuild parse of the edited client — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Render proof screenshotted — **pass** (What AbarVa found / Mapped to lane / Used for / Next step + lane chips + Move-scoped + "not added to enterprise context").
- Live signed-in Lakeshore proof — **run post-deploy** (upload a P3 decision summary, see the mapping; recorded in the PR).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increments 3–7.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand. Approved image digest: the `main-<sha>` the workflow builds.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — upload a completed template on the Lakeshore phase page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact (no persistence).

## Audit Evidence

- PR URL: (added on open). Tests: jest 61/61 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Proof: `proof/moves-upload-classify-2026-07-04/upload-mapping-p3-render.html` + live signed-in screenshot.

## Known Gaps

- **No content extraction:** the mapping is deterministic from the *template* (which outputs it contributes to which lanes/phases), not from parsing the document's specific text. Extracting the *specific* decisions is a later step (Claude / increment 12).
- **Not persisted:** the classification is shown in-session, not stored (persistence is increment 10).
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
