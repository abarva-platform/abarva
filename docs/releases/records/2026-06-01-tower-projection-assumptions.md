# 2026-06-01-tower-projection-assumptions — Tower Projection Assumption Disclosure

## Release ID

`2026-06-01-tower-projection-assumptions`

## Status

`candidate`

## Plain-English Summary

Tower Move portfolio cards now label projected value as directional decision support and show the assumptions a human reviewer must validate before using the projection for funding, board, or phase-gate decisions.

## Layer Impact

`global-control-lane` — Tower control-plane UI only. No schema, ingestion, private data-plane, or tenant data changes.

## Client Applicability

- All clients: Tower users who can see Move portfolio cards with projected value.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/MovePortfolioCardPanel.tsx` adds the projected-value disclosure beside visible projected value chips.
- `src/__tests__/integration/tenant-empty-states.test.tsx` proves the disclosure appears only when projected value is present.

## QA / Validation

- Pass — `npx jest src/__tests__/integration/tenant-empty-states.test.tsx --runInBand`
- Pass — `npx eslint src/components/tower/MovePortfolioCardPanel.tsx src/__tests__/integration/tenant-empty-states.test.tsx`
- Pass — `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass — `npm run release:check -- --base origin/main --head HEAD`
- Pass — `git diff --check`

## Rollout Plan

Merge to `main`. The disclosure becomes visible with the normal Vercel deployment for the shared app/control plane.

## Rollback Plan

Revert the PR to remove the disclosure, test additions, and this release record. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2754
- CI checks: pending.
- Local validation output: focused Jest, ESLint, TypeScript, release check, and diff check passed.

## Known Gaps

This slice covers Move portfolio projected-value cards in Tower. Other projection and forecast surfaces still need their own assumption and confidence disclosure.
