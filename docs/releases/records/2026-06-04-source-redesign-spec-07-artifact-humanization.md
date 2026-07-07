# 2026-06-04-source-redesign-spec-07-artifact-humanization — Source Artifact Humanization

## Release ID

`2026-06-04-source-redesign-spec-07-artifact-humanization`

## Status

`candidate`

## Plain-English Summary

Source event document tiles now use buyer-readable artifact names and next-step copy instead of internal codes, database language, and authoring jargon. Download and export actions stay hidden until the selected artifact has authored body content, so operators no longer see export buttons for an empty document.

## Layer Impact

`global-control-lane`: Updates shared Source canvas presentation for the document workspace. No data model, adapter, migration, or auth behavior changed.

## Client Applicability

- All clients: Any client using the Source event canvas sees the humanized document shelf, artifact rows, status copy, and export gating.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: Humanizes artifact labels, status strips, required-to-advance tags, empty states, stored-document shelf copy, and export/download visibility.
- `src/lib/source/artifact-display-names.ts`: Adds display-name and display-status helpers for Source artifacts.
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: Updates focused SSR assertions for the Spec 7 language and export-gating contract.
- `tests/e2e/source/artifact-humanization.spec.ts`: Adds a focused Playwright guard that checks the Source document tab does not regress to backend-oriented copy.
- `docs/releases/records/2026-06-04-source-redesign-spec-07-artifact-humanization.md`: Release record for this candidate.

## QA / Validation

- PASS: `npx playwright test tests/e2e/source/artifact-humanization.spec.ts --workers=1` — 1 test passed.
- PASS: `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx` — 24 tests passed. Jest emitted existing duplicate manual mock warnings for markdown/GFM mocks.
- PASS: `npm test -- --runInBand src/__tests__/integration/source/source-artifact-status-strip.test.ts` — 2 tests passed. Jest emitted the same existing duplicate manual mock warnings.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `npx tsc --noEmit --skipLibCheck`.
- PASS: `npx eslint src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/lib/source/artifact-display-names.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx tests/e2e/source/artifact-humanization.spec.ts --max-warnings 0`.

## Rollout Plan

Merge the Spec 7 branch after review. The change is active on the next Vercel deployment because it is limited to Source canvas React rendering and a pure display helper.

## Rollback Plan

Revert this release candidate to restore the previous Source canvas document labels, shelf copy, status badges, and export-button behavior. No migration rollback or data repair is required.

## Audit Evidence

- Local focused SSR test output for `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx`.
- Local Playwright output for `npx playwright test tests/e2e/source/artifact-humanization.spec.ts --workers=1`.
- Local release-check output for `npm run release:check -- --base origin/main --head HEAD`.
- Contract references: `docs/build/source-design/03-build-specs.html` Spec 7, `docs/build/source-design/04-design-module-review.md` Spec 7 revisions, and `docs/build/source-design/06-strategy-screen.html`.

## Known Gaps

Author-mode role-specific display of raw artifact codes remains out of scope for this slice because `DocumentTab` does not receive user role context today. Raw codes remain available in tooltip/title attributes and test ids for support and QA traceability.
