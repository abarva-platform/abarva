# 2026-06-05-source-redesign-spec-10-responses-evaluation — Source Responses and Evaluation Workspace

## Release ID

`2026-06-05-source-redesign-spec-10-responses-evaluation`

## Status

`candidate`

## Plain-English Summary

Adds dedicated Source workspace views for the Responses and Evaluation stages. Responses now leads with vendor completeness, Q&A symmetry, and a governed disqualification decision point. Evaluation now leads with weighted scoring, first-class dissent, and a human-named BATNA so the product does not imply that AbarVa silently chooses the winner.

## Layer Impact

- `global-control-lane`: Updates shared Source event-canvas UI and server-to-client readiness binding.

## Client Applicability

- All clients: applies wherever the Source event canvas is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/components/source/canvas/responses/*`.
- Adds `src/components/source/canvas/evaluation/*`.
- Updates `src/components/source/canvas/UniversalCanvasShell.tsx` to route Responses and Evaluation document tabs to the new stage views.
- Updates `src/app/(maestro)/source/events/[eventId]/page.tsx` to build vendor response readiness server-side and pass it to the canvas.
- Extends `src/__tests__/integration/source/source-event-canvas-render.test.tsx` with Responses and Evaluation coverage.

## QA / Validation

- Pass: `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx`
- Pass: `npm test -- --runInBand src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts`
- Pass: `npx eslint src/app/(maestro)/source/events/[eventId]/page.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/responses/CompletenessMatrix.tsx src/components/source/canvas/responses/QnaSymmetryLog.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/evaluation/WeightedScorecardTable.tsx src/components/source/canvas/evaluation/DissentPanel.tsx src/components/source/canvas/evaluation/BatnaPanel.tsx src/components/source/canvas/evaluation/EvaluationStageView.tsx src/__tests__/integration/source/source-event-canvas-render.test.tsx`
- Pass: `npx tsc --noEmit --skipLibCheck --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to main after CI passes, then deploy to Vercel production and run the Source post-deploy crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR. The prior generic document-tab workspace will render again for Responses and Evaluation. No data migration is included.

## Audit Evidence

- PR and CI for this branch.
- Local SSR render tests proving the new stage controls render.
- Post-deploy crawl artifact after merge.

## Known Gaps

- This slice renders the governed Responses and Evaluation workspaces and binds the existing readiness model. It does not add a new live parser for every vendor response format.
- Full browser upload/download proof is currently covered for the d19 pricing workbook path by `2026-06-05-source-pricing-upload-download-proof`.
