# 2026-07-04-moves-template-download — Moves template starter download (increment 7)

## Release ID

`2026-07-04-moves-template-download`

## Status

`candidate`

## Plain-English Summary

Each phase template in the workspace now has a **"↓ Template"** button that downloads a ready-to-use starter document — a Markdown outline with the template's purpose, every section to complete, and prompts to guide the session. It's generated **client-side from the governed catalog** (no backend, no model), so the user can grab a template, fill it in, and upload it back. Behind the same `moves_phase_workspace_v2` flag (Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): a pure outline generator (`buildTemplateOutline`) + a client-side download helper + a per-template button. Additive; no route/data/model change.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `src/lib/programs/phase-templates/template-outline.ts` — `buildTemplateOutline(t)` (deterministic Markdown) + `templateOutlineFilename(t)`.
- `src/components/strategic-moves/phase-workspace/download.ts` — `downloadTextFile` (browser Blob download; SSR-safe no-op).
- `cards.tsx` — a "↓ Template" button per template row. `styles.tsx` — button style. `index.ts` — exports.
- Tests: `__tests__/template-outline.test.ts` + a card render assertion.
- No migrations, routes, scripts, or env changes. No `StrategicMovePhaseClient` edit (the card is already mounted).

## QA / Validation

- Jest 54/54 — **pass** (outline includes title/purpose/sections/prompts; no internal jargon; safe stable filename; every catalog template produces a non-trivial outline; card renders the download control).
- esbuild parse (cards/download/outline) — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Live signed-in Lakeshore proof — **run post-deploy** (download a template on the P2 page; recorded in the PR).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increments 3–6.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand. Approved image digest: the `main-<sha>` the workflow builds.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — download a template on the Lakeshore P2 page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact.

## Audit Evidence

- PR URL: (added on open). Tests: jest 54/54 + scoped tsc 0 + eslint 0 + esbuild parse 0.

## Known Gaps

- The starter is Markdown (universally openable); a formatted DOCX/XLSX export is a later refinement.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
