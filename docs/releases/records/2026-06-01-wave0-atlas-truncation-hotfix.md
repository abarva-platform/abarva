# 2026-06-01-wave0-atlas-truncation-hotfix — Wave 0 Atlas Truncation Hotfix

## Release ID

`2026-06-01-wave0-atlas-truncation-hotfix`

## Status

`candidate`

## Plain-English Summary

This release tightens the Tower Atlas response shaper after the Wave 0 L6 retest found executive answers being compacted into malformed comparison tables and ending mid-thought. The fix keeps real comparison tables and vendor/path comparisons intact, but stops converting ordinary decision prose into synthetic comparison rows.

## Layer Impact

Global control lane: changes shared Atlas response formatting for Tower answers. No database schema, migration, auth, or client data-plane behavior changes.

## Client Applicability

- All clients: Tower Atlas answer formatting benefits all authenticated clients.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/agent/response-shape.ts`: adds stricter guards before synthetic comparison-table compaction, protects `vs.` while splitting sentences, and expands dangling-tail cleanup for incomplete `vs.` / `has no` fragments.
- `src/lib/agent/output-discipline/response-contract.ts`: prevents the paragraph repair pass from splitting inside inline `vs.` comparisons.
- `src/lib/agent/__tests__/response-shape-regression.test.ts`: adds regression coverage for the SkyHarbor P1 and P3 L6 retest failure patterns.

## QA / Validation

Current validation status:

- Passed: `npm test -- --runTestsByPath src/lib/agent/__tests__/response-shape-regression.test.ts --runInBand --no-cache`
- Passed: `npm test -- --runTestsByPath src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/output-discipline/response-contract.test.ts --runInBand --no-cache`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: local `npx tsx` probe for the SkyHarbor P1 and P3 retest shapes. P1 no longer creates a synthetic comparison table or breaks at `vs.`; P3 no longer creates a synthetic comparison table or truncates to `SkyHarbor has no.`
- Not run yet: browser retest of SkyHarbor Tower Atlas prompts P1 and P3. This requires a deployed PR preview after the hotfix PR is opened.

## Rollout Plan

Merge to `main`, allow the normal Vercel production deployment, then retest the two affected SkyHarbor Tower prompts on the deployed preview or production deployment.

## Rollback Plan

Revert the hotfix PR. The rollback only restores prior response-shaping behavior and has no migration or data rollback dependency.

## Audit Evidence

- Wave 0 L6 retest memo showing SkyHarbor P1/P3 truncation on the deployed preview.
- Hotfix PR diff and CI.
- Post-fix browser retest output for SkyHarbor P1 and P3.

## Known Gaps

The broad P3 integration red baseline remains separately baselined and is not part of this Wave 0 hotfix.
