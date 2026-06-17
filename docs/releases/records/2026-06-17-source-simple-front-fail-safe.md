# 2026-06-17-source-simple-front-fail-safe — Source Start Here fail-safe and sparse-state crash guard

## Release ID

`2026-06-17-source-simple-front-fail-safe`

## Status

`candidate`

## Plain-English Summary

This release makes the Source "Start here" simple front fail-safe. If the simple view cannot resolve or render for a sparse sourcing event, the full Source workspace remains available instead of blanking the entire Source surface. It also hardens the generated-document lookup so malformed or incomplete File Cabinet metadata cannot crash the client render.

## Layer Impact

- **Lane:** `global-control-lane`
- **UI/runtime:** Source event canvas rendering only. The feature remains gated by `source_simple_front`; this release does not enable the flag in production.
- **Data/model:** No assessment, gate, route, storage, or database logic changed. No migration.

## Client Applicability

- All clients: only if `source_simple_front` is enabled for them.
- Specific clients: none newly enrolled by this release.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_simple_front` remains the activation control.

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx` — wraps simple-front view-model resolution in a try/catch and renders the full workspace if the simple view is unavailable.
- `src/components/source/canvas/SimpleFrontErrorBoundary.tsx` — new client error boundary so simple-front render failures fall back to the workspace instead of the app-level surface error boundary.
- `src/components/source/canvas/SimpleStageFront.tsx` — guards nullable or malformed generated-artifact metadata while looking for the latest downloadable document.
- `src/components/ProductUsageTelemetry.tsx` — wraps the telemetry components that read URL search params in a local Suspense boundary, satisfying the Next 16 static build requirement without route-by-route wrappers.
- `src/app/intelligence/__tests__/page-corpus.test.tsx` — test-only import fix after the Intelligence page moved into `(maestro)`; included to unblock the production-readiness gate.
- Tests covering empty substrate state and malformed generated-artifact metadata.

## QA / Validation

- Focused Jest: `npx jest src/lib/source/__tests__/simple-front.test.ts src/__tests__/integration/source/source-simple-front.test.tsx src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand` — passed.
- TypeScript: `npx tsc --noEmit --pretty false` — only pre-existing optional-package errors remain (missing optional `@azure-rest/ai-document-intelligence`, missing optional `@axe-core/playwright`). New branch test typing issues were fixed; a stale Intelligence test import uncovered by CI was corrected.
- Intelligence focused test: `npx jest src/app/intelligence/__tests__/page-corpus.test.tsx --runInBand` — passed, 4 tests.
- Local production build: attempted; blocked by the isolated worktree's symlinked `node_modules` Turbopack root guard. CI uses a fresh `npm ci` install and is the authoritative build check for this PR.
- Focused ESLint on touched files after the CI repairs — passed.
- ESLint: `npx eslint src/components/source/canvas/ src/lib/source/ src/__tests__/integration/source/` — 0 errors; existing unrelated warnings remain in Source test/export files.
- Behavior tests: `npm run test:behaviors` — passed, 15 suites / 195 tests.
- Release check: `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.
- Whitespace: `git diff --check` — passed.
- Browser verification: pending. The `source_simple_front` flag remains disabled in production until a disposable SkyHarbor event is verified.

## Rollout Plan

1. Merge to `main`.
2. Allow the ACA main deploy to build a new revision.
3. Keep `source_simple_front` disabled until a live signed-in disposable event confirms Scope renders and the Start Here workflow works.
4. Re-enable the flag only after the live verification pass.

## Rollback Plan

- Fast rollback: keep or turn off `source_simple_front`; tenants see the advanced Source workspace.
- Code rollback: revert this PR. No database rollback is required.

## Audit Evidence

- PR: pending.
- Focused Jest output: passed locally on the S1-fix branch.
- Live root-cause probe: read-only SkyHarbor query found no generated artifacts with null `original_name` or null `created_at`; the fix still guards that nullable metadata path defensively.
- Screenshots/browser proof: pending.

## Known Gaps

- The exact live browser stack from the rolled-back revision was not available after traffic rollback and event archival. This release fixes a concrete nullable metadata crash vector and adds a fail-safe so future simple-front failures cannot blank the Source surface.
- The separate "other events return 404" symptom occurs before the simple front mounts, inside server-side event lookup/access resolution, and is not changed in this release.
