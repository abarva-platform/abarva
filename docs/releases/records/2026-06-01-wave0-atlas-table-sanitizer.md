# 2026-06-01-wave0-atlas-table-sanitizer — Wave 0 Atlas Table Sanitizer

## Release ID

`2026-06-01-wave0-atlas-table-sanitizer`

## Status

`candidate`

## Plain-English Summary

This follow-up release fixes the remaining Tower Atlas formatting issue found in the post-merge production retest. Atlas no longer preserves malformed `Option / Strength / Weakness / Fit` tables when ordinary decision prose has been forced into a comparison shape, and it no longer duplicates an existing `Next:` label.

## Layer Impact

Global control lane: changes shared Atlas Tower response formatting only. No database schema, migration, auth, routing, or client data-plane behavior changes.

## Client Applicability

- All clients: Tower Atlas answer formatting benefits all authenticated clients.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/agent/response-shape.ts`: repairs malformed option comparison tables into prose and strips duplicated `Next:` labels.
- `src/lib/agent/__tests__/response-shape-regression.test.ts`: adds production-retest regressions for the SkyHarbor malformed table and duplicated next-action label.

## QA / Validation

Current validation status:

- Passed: `npm test -- --runTestsByPath src/lib/agent/__tests__/response-shape-regression.test.ts src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/output-discipline/response-contract.test.ts --runInBand --no-cache`
- Passed: `npx eslint src/lib/agent/response-shape.ts src/lib/agent/__tests__/response-shape-regression.test.ts`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: local `npx tsx` probe for the production P1 malformed table shape. The table is removed, the dangling `before` tail is stripped, and the strongest row is preserved as prose.
- Not run yet: production browser retest of SkyHarbor Tower Atlas prompts P1 and P3 after merge/deploy.

## Rollout Plan

Merge to `main`, allow the normal Vercel production deployment, then retest the two affected SkyHarbor Tower prompts on `https://app.abarva.ai`.

## Rollback Plan

Revert the hotfix PR. The rollback only restores prior response-shaping behavior and has no migration or data rollback dependency.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production retest: pending.

## Known Gaps

The broad P3 integration red baseline remains separately baselined and is not part of this Wave 0 hotfix.
