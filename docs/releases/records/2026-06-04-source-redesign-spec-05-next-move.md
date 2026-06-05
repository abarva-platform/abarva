# 2026-06-04-source-redesign-spec-05-next-move — Source Stage Next Move Card

## Release ID

`2026-06-04-source-redesign-spec-05-next-move`

## Status

`candidate`

## Plain-English Summary

Source event stages now lead with a single “Next move” card instead of forcing users to infer the next action from document lists and gate tabs. The card is deterministic, uses the event’s current stage, artifacts, and gate state, and routes users to existing governed surfaces: documents, evidence, or the gate checklist.

## Layer Impact

- `global-control-lane`: Changes the shared Source event canvas for every client using Source.
- Runtime UI: Adds one presentational card and deterministic resolver. No schema, migration, or external service change.

## Client Applicability

- All clients: Yes, all Source event canvases receive the card.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/stage-next-move.ts`
- `src/components/source/canvas/StageNextMoveCard.tsx`
- `src/components/source/canvas/EventWorkspace.tsx`
- `src/components/source/canvas/UniversalCanvasShell.tsx`
- Focused resolver and render tests.

## QA / Validation

- Pass: `npm test -- --runInBand src/lib/source/__tests__/stage-next-move.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx src/__tests__/behaviors/source-language-canon.test.ts` (33/33).
- Pass: `npx eslint src/lib/source/stage-next-move.ts src/components/source/canvas/StageNextMoveCard.tsx src/components/source/canvas/EventWorkspace.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/lib/source/__tests__/stage-next-move.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx --max-warnings 0`.
- Pass: `npx tsc --noEmit --skipLibCheck --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Not run yet: post-deploy crawl; required after merge/deploy.

## Rollout Plan

Merge to `main`, deploy to Vercel production, and verify Source event surfaces on `https://app.abarva.ai`.

## Rollback Plan

Revert the PR or redeploy the prior Vercel production deployment. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI evidence: pending.
- Production crawl: pending.

## Known Gaps

This slice does not build new CMDB pulls, scoring, or attestation workflows. The card points to existing governed surfaces and later waves will deepen the stage-specific workflows.
