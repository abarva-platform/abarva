# 2026-06-16-source-compact-gate-panel — Source compact gate panel

## Release ID

`2026-06-16-source-compact-gate-panel`

## Status

`candidate`

## Plain-English Summary

The Source gate panel now presents gate readiness as one clean criteria list instead of repeating the same blockers across multiple panels. Each row shows a status dot, criterion title, one actionable gap line, a quiet owner chip, and one action. Manual approval reasons appear only after a user clicks Mark met on a single row.

## Layer Impact

- `global-control-lane`: Source canvas presentation changes for the shared Source workflow. This is a render-only refactor; gate assessment, persistence, routes, and data-plane logic are unchanged.

## Client Applicability

- All clients: Any client using the Source event canvas receives the compact gate panel.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Source canvas surfaces and flags; no new flag.

## Changes Included

- Modified `src/components/source/canvas/workspace-tabs/GateTab.tsx`.
- Updated `src/__tests__/integration/source/source-canvas-gate-tab.test.tsx`.
- Removed the standalone blocker-summary rendering path from the gate tab.
- Collapsed per-criterion approval textarea behind row-level Mark met.
- Collapsed multi-input criteria into an expandable count line.

## QA / Validation

- `npx jest src/__tests__/integration/source/source-canvas-gate-tab.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/workspace-tabs/GateTab.tsx src/__tests__/integration/source/source-canvas-gate-tab.test.tsx` passed.
- `npx eslint src/components/source/ src/__tests__/integration/source/source-canvas-gate-tab.test.tsx` passed with existing Source-directory warnings and no errors.
- `npm run test:behaviors` passed: 15 suites, 195 tests.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- `git diff --check` passed.
- `npx tsc --noEmit` was run; it failed only on pre-existing missing optional modules outside this slice: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. A touched-file type scan showed no `GateTab` or focused test errors.
- Browser proof is required before final release completion.

## Rollout Plan

Merge to `main`; the next Azure Container Apps main deploy picks up the render-only Source canvas change. No migration or manual data operation is required.

## Rollback Plan

Revert the PR to restore the prior gate panel rendering. Because no schema, route, or assessment logic changes are included, rollback is a UI-only revert.

## Audit Evidence

- PR and CI after this branch is opened.
- Focused Jest and ESLint logs.
- Browser screenshots from a SkyHarbor Scope gate showing one list, row-level approval reason disclosure, and collapsed multi-input details.

## Known Gaps

The broader Source workspace and approval surfaces still need their own compact UX passes. This release only refactors the Source gate panel rendering.
