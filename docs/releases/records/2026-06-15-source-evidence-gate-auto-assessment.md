# 2026-06-15-source-evidence-gate-auto-assessment — Source Evidence Gate Auto-Assessment

## Release ID

`2026-06-15-source-evidence-gate-auto-assessment`

## Status

`candidate`

## Plain-English Summary

Source gate review now shows when a stage criterion can be auto-assessed from already-loaded evidence. The Gate tab adds a Stage Decision Status panel and per-criterion provenance badges so an operator can see which items are manually approved, evidence-ready, blocked by missing evidence, or still needing human review. This is a read-only display overlay; it does not write gate state, add migrations, or override human decisions.

## Layer Impact

- `global-control-lane`: shared Source canvas behavior changes for all Source events that render the universal gate checklist.
- `client-data-lane`: no schema, data, ingestion, or persistence changes. Existing evidence and criterion rows are only read.

## Client Applicability

- All clients: Source events using the universal canvas gate checklist.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `src/lib/source/canonical-specs/evidence-gate-map.ts` to map evidence requirements to gate criteria.
- Added `src/lib/source/gate-auto-assessment.ts` for pure read-side gate assessment and stage recommendations.
- Updated the Source universal canvas and Gate tab to render derived counts, Stage Decision Status, and provenance badges.
- Added focused unit/SSR tests for the evaluator and Gate tab rendering.
- No migrations, write-adapter changes, runtime provider changes, DNS, Vercel, Supabase, or account-shutdown changes.

## QA / Validation

- `npx jest src/lib/source/__tests__/gate-auto-assessment.test.ts src/__tests__/integration/source/source-canvas-gate-tab.test.tsx --runInBand` passed.
- `npx eslint src/lib/source/canonical-specs/evidence-gate-map.ts src/lib/source/canonical-specs/index.ts src/lib/source/gate-auto-assessment.ts src/lib/source/__tests__/gate-auto-assessment.test.ts src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/workspace-tabs/GateTab.tsx src/__tests__/integration/source/source-canvas-gate-tab.test.tsx` passed.
- `git diff --check` passed.
- `npx tsc --noEmit --pretty false` was run locally; the linked clean worktree reports only pre-existing missing optional dependency modules (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`), not errors in this slice.
- `npm run release:check -- --base origin/main --head HEAD` to be rerun after this record is included.

## Rollout Plan

Merge to `main`, allow CI to run, then deploy the updated Next.js image to Azure Container Apps through the normal control-lane deployment path. No data migration or manual data backfill is required.

## Rollback Plan

Revert the PR or roll Azure Container Apps traffic back to the prior known-good image. Because this is a read-only UI/library overlay, rollback has no data repair step.

## Audit Evidence

- PR diff for the Source canvas, Gate tab, evidence map, evaluator, and tests.
- CI logs for Jest, ESLint, Typecheck, release control, and browser verification.
- Browser screenshots from the SkyHarbor Source event showing auto-assessed and blocked criteria after deployment.

## Known Gaps

- Auto-assessment is not persisted as an audit record; that is Slice A2.
- Criteria without explicit evidence mappings remain manual and show `Needs human review`.
- This slice does not implement auto-drafting, approval routing, archetype-specific RFP branching, Source orchestrator bridging, or vendor response ingestion.
