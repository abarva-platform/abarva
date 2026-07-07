# 2026-06-04-source-redesign-spec-08-strategy-refit — Source Strategy Stage Refit

## Release ID

`2026-06-04-source-redesign-spec-08-strategy-refit`

## Status

`candidate`

## Plain-English Summary

The Source event Strategy stage now opens with a cleaner, decision-oriented view of what the stage produces: Sourcing Strategy Memo, Value Target Brief, and Archetype Decision Record. The stage keeps one obvious Next Move, uses CIO-facing gate labels, hides empty export actions until a document has an authored body, and keeps the existing governed document editor available below the stage output overview.

## Layer Impact

- `global-control-lane`: updates shared Source canvas UI behavior and deterministic stage-copy logic for all Source-enabled clients. No client data, schema, ingestion, or model-provider behavior changes.

## Client Applicability

- All clients: Source event canvases that render the Strategy stage receive the refit.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/components/source/canvas/strategy/StrategyStageView.tsx`.
- Updates `src/components/source/canvas/UniversalCanvasShell.tsx` to render the Strategy-specific view only for `stage=strategy`.
- Updates `src/lib/source/stage-next-move.ts` to use CIO-facing Strategy gate labels in the Next Move card while keeping canonical gate records unchanged.
- Extends SSR integration coverage in `src/__tests__/integration/source/source-event-canvas-render.test.tsx`.
- Updates `src/lib/source/__tests__/stage-next-move.test.ts` for the approved Strategy gate label.

## QA / Validation

- `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx src/lib/source/__tests__/stage-next-move.test.ts` — passed, 29/29 tests. Duplicate manual mock warnings are pre-existing.
- `npx playwright test tests/e2e/source/strategy-stage-refit.spec.ts --workers=1` — passed, 1/1 test.
- `npx eslint src/components/source/canvas/strategy/StrategyStageView.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/lib/source/stage-next-move.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx src/lib/source/__tests__/stage-next-move.test.ts tests/e2e/source/strategy-stage-refit.spec.ts --max-warnings 0` — passed.
- `npx tsc --noEmit --skipLibCheck --pretty false` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed.
- `git diff --check` — passed.
- PR CI, production deploy, and Source post-deploy crawl to be completed after PR creation/merge.

## Rollout Plan

Merge the PR to `main`, then deploy the exact merged SHA to Vercel production. Verify `https://app.abarva.ai` aliases to that deployment and run the Source post-deploy crawl against the production alias.

## Rollback Plan

Revert the PR and redeploy the previous known-good `main` SHA. This change has no migration or persistent data side effects.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3059
- Production deployment: to be added after merge/deploy.
- Post-deploy crawl artifacts: to be added after production verification.

## Known Gaps

- This slice does not replace the underlying artifact-generation route or model provider. The active program instruction remains OpenAI-only for future model/API wiring; this slice does not add or enable Claude/Anthropic paths.
