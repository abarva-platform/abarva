# 2026-06-02-home-hero-measure — Home Hero Measure

## Release ID

`2026-06-02-home-hero-measure`

## Status

`candidate`

## Plain-English Summary

Home now gives the executive greeting sentence enough desktop width so the Apex message does not leave `today` stranded on a second line. The text still wraps naturally on smaller screens.

## Layer Impact

- `global-control-lane`: Updates the shared Home visual layout for all clients.

## Client Applicability

- All clients: Home hero typography uses a wider desktop measure and neutral letter spacing.
- Specific clients: Apex Retail visibly benefits because `One decision needs review today.` fits the intended desktop line.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/home/ImpactInsightsHome.tsx`
- `src/components/home/__tests__/ImpactInsightsHome.copy.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/components/home/__tests__/ImpactInsightsHome.copy.test.ts --runInBand`
- PASS: `npx eslint src/components/home/ImpactInsightsHome.tsx src/components/home/__tests__/ImpactInsightsHome.copy.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI passes. Vercel deploy updates `/home`. No migration or environment change is required.

## Rollback Plan

Revert the PR to restore the prior Home hero measure. No durable data rollback is required.

## Audit Evidence

Audit evidence will include the PR URL, local validation, CI checks, and production visual retest for the Apex Home hero.

## Known Gaps

This is a CSS/layout polish change only. It does not add screenshot-based visual regression coverage; production visual confirmation remains part of rollout evidence.
