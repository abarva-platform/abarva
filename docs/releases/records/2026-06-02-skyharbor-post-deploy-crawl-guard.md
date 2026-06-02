# 2026-06-02-skyharbor-post-deploy-crawl-guard - SkyHarbor Post-Deploy Crawl Guard

## Release ID

`2026-06-02-skyharbor-post-deploy-crawl-guard`

## Status

`candidate`

## Plain-English Summary

The production browser crawl now includes SkyHarbor Air personas and treats the known healthcare/Meridian bleed terms from the June 2 QA report as a P0 finding when they appear in SkyHarbor pages. This does not patch SkyHarbor data by hand; it makes the regression visible until SkyHarbor is erased and reloaded through the Azure-native uploader process.

## Layer Impact

`qa-validation-lane`: Expands the post-deploy crawl coverage and comparison rules used after main deployments.

`global-control-lane`: The crawl guard is shared release infrastructure. It does not change app routes, database schema, client data, or production rendering logic.

## Client Applicability

- All clients: Indirectly, through stronger post-deploy crawl coverage.
- Specific clients: SkyHarbor Air is now explicitly included in the standard crawl persona set.
- Internal only: Release operators and QA reviewers use the resulting crawl artifacts.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/crawl/persona-switcher.ts` adds SkyHarbor CTO and CIO personas to the standard crawl.
- `src/lib/crawl/baseline-compare.ts` adds SkyHarbor-specific P0 guards for the known healthcare bleed terms: Clinical care, ambient AI, MH-07, Innovaccer, and revenue cycle.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` pins the persona coverage and tenant-specific leak guard behavior.

## QA / Validation

- PASS: `npm ci`
- PASS: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- PASS: `npx eslint src/lib/crawl/persona-switcher.ts src/lib/crawl/baseline-compare.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- PASS: `git diff --check`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The next post-deploy crawl will log into SkyHarbor personas alongside Apex, Meridian, and FirstCapital and will fail with a P0 if the known healthcare/Meridian bleed terms appear on SkyHarbor pages.

## Rollback Plan

Revert the PR. That removes SkyHarbor from the standard crawl and removes the SkyHarbor-specific forbidden-term guard. No production data, migration, or runtime rollback is required.

## Audit Evidence

PR URL: https://github.com/anandsundaram-hash/abarva/pull/2826

CI run: To be added after CI completes.

Prior production crawl gap: Run `26822544693` completed with 0 P0, but covered only Apex, Meridian, and FirstCapital personas, not SkyHarbor.

## Known Gaps

This release does not reload SkyHarbor datasets, seed enterprise context, fix citation gaps, or remove raw internal IDs from user-facing copy. Those remain separate workstreams. SkyHarbor data should be erased and reloaded through the approved Azure-native uploader path rather than hand-patched in code.
