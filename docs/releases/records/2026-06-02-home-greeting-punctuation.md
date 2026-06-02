# 2026-06-02-home-greeting-punctuation — Home Greeting Punctuation

## Release ID

`2026-06-02-home-greeting-punctuation`

## Status

`candidate`

## Plain-English Summary

Home no longer adds an extra period when the signed-in user's greeting name already ends with punctuation. This fixes the Meridian greeting that rendered as `Good morning, Dr..`.

## Layer Impact

- `global-control-lane`: Updates shared Home brief copy composition for all clients.

## Client Applicability

- All clients: Greeting names are trimmed and sentence punctuation is applied once.
- Specific clients: Meridian Health benefits immediately for the `Dr.` greeting case.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-brief.ts`
- `src/lib/home/__tests__/home-brief.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/home/__tests__/home-brief.test.ts --runInBand`
- PASS: `npx eslint src/lib/home/home-brief.ts src/lib/home/__tests__/home-brief.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI passes. Vercel deploy updates `/home` greeting composition automatically. No migration or environment change is required.

## Rollback Plan

Revert the PR to restore the prior Home greeting formatter. No durable data rollback is required.

## Audit Evidence

Audit evidence will include the PR URL, local validation, CI checks, and production Home retest for Meridian.

## Known Gaps

This does not change how first names are sourced from Clerk or executive profiles. It only prevents duplicate sentence punctuation.
