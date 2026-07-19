# 2026-07-18-source-fs-demo-shell-activation — Source FS Demo shell activation

## Release ID

`2026-07-18-source-fs-demo-shell-activation`

## Status

`candidate`

## Plain-English Summary

Fixes the Source event canvas so the already-built "Start here" simple front actually renders when its feature flag is enabled, then enrolls the First Capital / FS Demo tenant key in the Source simple-front and Workspace Explorer flags. This moves FS Demo off the legacy tabbed Source inner canvas and onto the calmer Source shell that matches the Moves operating model more closely.

## Layer Impact

- `global-control-lane`: Source event UI composition and static feature-flag registry only.
- Data/model: No schema, query, artifact, gate, evidence, chat, or export contract changes.

## Client Applicability

- All clients: no, except the render wiring makes the existing `source_simple_front` flag work correctly wherever enabled.
- Specific clients: First Capital / FS Demo (`arcturus`) is enrolled for `source_simple_front` and `workspace_explorer_source`.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_simple_front`, `workspace_explorer_source`.

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx` now renders `simpleFrontWorkspace ?? advancedWorkspace` instead of always hardcoding the legacy tabbed `EventWorkspace`.
- `src/lib/features/registry.ts` enrolls `arcturus` for the Source simple-front and Workspace Explorer flags.
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx` strengthens the simple-front assertion so legacy workspace tabs cannot remain in the server-rendered shell.

## QA / Validation

- Pass: targeted Source simple-front render test, `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --runTestsByPath -t "renders the simple Start here front"`.
- Pass: targeted Source Workspace Explorer render test, `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --runTestsByPath -t "declutters the canvas behind the Workspace Explorer flag"`.
- Pass: feature flag suite, `npx jest src/lib/features/__tests__/is-feature-enabled.test.ts --runInBand --runTestsByPath`.
- Pass: focused ESLint on touched Source shell / feature files completed with 0 errors and existing warnings only in `UniversalCanvasShell.tsx`.
- Pass: TypeScript, `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: release control, `npm run release:check`.
- Pass: whitespace, `git diff --check`.
- Blocked: full Source canvas integration file remains red on pre-existing render-copy expectations outside this slice; the changed simple-front and workspace-explorer cases pass.
- Not run yet: signed-in production browser proof after ACA deploy.
- Baseline note: before this fix, `source_simple_front` was computed in `UniversalCanvasShell` but not mounted in the return path, so the flag could be on without changing the visible event shell.

## Rollout Plan

Merge through PR to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned web image. No ad-hoc ACA mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: verify template image and 100% traffic revision match the deployed digest before claiming live.
- Worker image invariant: no worker image change.
- Feature/env flag update path: static registry change in this PR.
- Live signed-in proof required: yes, `app.abarva.ai/source/events/...` for FS Demo must show `source-simple-front` and not the legacy tab strip.

## Rollback Plan

Remove `arcturus` from `source_simple_front` / `workspace_explorer_source`, or revert this PR. The UI falls back to the existing advanced Source canvas; no database rollback is required.

## Audit Evidence

- PR: pending.
- Local validation: focused tests, lint, typecheck, whitespace, and release check listed above.
- Deploy proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

- This does not migrate Source to the Lakeshore-only `source_analytics` canvas.
- This does not retire the legacy advanced canvas for all tenants; it fixes and enables the already-built Source simple-front path for FS Demo.
