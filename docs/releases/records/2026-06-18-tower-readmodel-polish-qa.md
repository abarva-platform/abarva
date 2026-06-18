# 2026-06-18-tower-readmodel-polish-qa — Tower Read-Model Polish QA

## Release ID

`2026-06-18-tower-readmodel-polish-qa`

## Status

`candidate`

## Plain-English Summary

This follow-up improves the AI Control Tower table readability after the Meridian and Lakeshore read-model deployment. The Tower data was live, but the active-canvas tables could visually squeeze long initiative, owner, and function labels together. This change gives Tower tables a stable table layout, clear cell padding, wrapped text, and horizontal scroll when the content is wider than the canvas.

It also aligns the Meridian post-deploy crawl persona with the product-visible client name, `Meridian Health`, so the browser harness no longer reports a false tenant-name mismatch when the app is rendering the canonical short name.

## Layer Impact

- `global-control-lane`: updates shared AI Control Tower presentation behavior for every tenant using the new Tower page.
- `client-data-lane`: updates the Meridian crawl expectation used to verify tenant-scoped read-model rollout.

## Client Applicability

- All clients: AI Control Tower table readability improvements.
- Specific clients: Meridian browser crawl expectation aligns to the live `Meridian Health` display name.
- Internal only: Post-deploy crawl harness metadata.
- Public/demo only: No.
- Feature flag: No new flag; this follows the already-live Tower route.

## Changes Included

- `src/components/tower/AiControlTowerPage.tsx`: adds table presentation classes and styles for Tower and Atlas mini tables.
- `src/lib/crawl/persona-switcher.ts`: updates `meridian-kiran` expected tenant display from `Meridian Health System` to `Meridian Health`.
- `docs/releases/records/2026-06-18-tower-readmodel-polish-qa.md`: this release record.

## QA / Validation

- Pass: `./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Pass: `./node_modules/.bin/eslint src/components/tower/AiControlTowerPage.tsx src/lib/crawl/persona-switcher.ts`
- Pass: `./node_modules/.bin/jest src/components/tower/__tests__/AiControlTowerPage.test.tsx --runInBand`
- Pending: `npm run release:check` after this release-record update.
- Pending: Browser crawl after deploy for Meridian and Lakeshore `/intelligence` and `/tower`.
- Pending: Deep click crawl after deploy across Intelligence tabs and Tower lenses.

## Rollout Plan

Merge to `codex/ai-control-tower-substrate`, build an ACR image from the merged commit, deploy to ACA lab as a new revision, shift traffic only after health passes, then run signed-in browser crawls.

## Rollback Plan

Move ACA traffic back to the last healthy read-model revision, `ca-abarva-web-lab-eastus--readmodel7c9c246b`.

## Audit Evidence

To be filled after PR, CI, image build, ACA revision, and browser crawl complete.

## Known Gaps

This does not change the underlying Meridian or Lakeshore data refresh. Blob staging, rich document parser/review, and embeddings/search refresh remain separate data-pipeline gates.
