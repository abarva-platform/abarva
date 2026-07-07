# 2026-06-05-source-redesign-spec-12-executive-decision — Source Executive Decision Page-1

## Release ID

`2026-06-05-source-redesign-spec-12-executive-decision`

## Status

`candidate`

## Plain-English Summary

Adds the redesigned Source Executive Decision workspace. When the decision brief has an authored recommendation, the stage now leads with a dark, page-1 executive summary showing the recommendation, savings, trade-off, dissent or open risks, and human approval state. When the recommendation is not authored, the stage stays calm and points the user to draft the decision brief instead of showing an empty board-facing answer.

## Layer Impact

- `global-control-lane`: changes shared Source canvas behavior for the Executive Decision stage.
- UI/read-model layer: uses existing Source artifact, gate, evidence, pricing, executive decision, and activity-log view models. No schema or tenant data migration is included.

## Client Applicability

- All clients: Source events using the 11-stage canvas receive the Executive Decision stage view.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- New `src/components/source/canvas/executive-decision/ExecutiveSummaryHeader.tsx`.
- New `src/components/source/canvas/executive-decision/ExecutiveDecisionStageView.tsx`.
- Updates `src/components/source/canvas/UniversalCanvasShell.tsx` to render the Executive Decision stage through the stage-specific view.
- Updates `src/__tests__/integration/source/source-event-canvas-render.test.tsx` with SSR coverage for authored/fallback Executive Decision behavior and d24 export anchors.

## QA / Validation

- Passed: `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx` (35 tests).
- Passed: `npx tsc --noEmit --skipLibCheck --pretty false`.
- Failed, then fixed record wording: `npm run release:check` initially required explicit pass/fail/not-run QA language in this release record.
- Passed: `git diff --check`.

## Rollout Plan

Merge to main through the standard PR flow, deploy to Vercel production, then run the Source post-deploy crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR to restore the prior Executive Decision document-tab canvas. No data migration rollback is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added after checks run.
- Production crawl output: to be added after deployment.

## Known Gaps

- This slice does not implement new approval-write APIs; approval state is read from existing gate/activity substrate.
- This slice does not add new artifact renderers beyond the existing d24 DOCX/PDF/HTML export surface.
