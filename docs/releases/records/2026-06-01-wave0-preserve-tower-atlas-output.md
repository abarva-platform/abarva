# 2026-06-01-wave0-preserve-tower-atlas-output — Preserve Tower Atlas Output

## Release ID

`2026-06-01-wave0-preserve-tower-atlas-output`

## Status

`candidate`

## Plain-English Summary

This release disables the brittle Tower Atlas compaction path after production retesting showed it could still damage executive answers even after malformed table cleanup. Tower now preserves Atlas prose and applies only safety repairs: markup and internal-ID scrubbing, malformed table repair, and a next-action fallback when the answer has no action cue.

## Layer Impact

Global control lane: changes shared Tower Atlas answer formatting. No database schema, migration, auth, routing, or client data-plane behavior changes.

## Client Applicability

- All clients: Tower Atlas answer formatting benefits all authenticated clients.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/agent/response-shape.ts`: removes Tower from the generic compaction allowlist.
- `src/lib/agent/__tests__/response-shape.test.ts`: updates Tower expectations to prose preservation.
- `src/lib/agent/__tests__/response-shape-regression.test.ts`: keeps the Wave 0 production regressions pinned without requiring compacted bullets.

## QA / Validation

Current validation status:

- Passed: `npm test -- --runTestsByPath src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/__tests__/response-shape-regression.test.ts src/lib/agent/output-discipline/response-contract.test.ts --runInBand --no-cache`
- Passed: `npx eslint src/lib/agent/response-shape.ts src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/__tests__/response-shape-regression.test.ts`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run yet: production browser retest of SkyHarbor Tower Atlas prompts P1 and P3 after merge/deploy.

## Rollout Plan

Merge to `main`, allow the normal Vercel production deployment, then retest the two affected SkyHarbor Tower prompts on `https://app.abarva.ai`.

## Rollback Plan

Revert the hotfix PR. The rollback only restores prior Tower compaction behavior and has no migration or data rollback dependency.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production retest: pending.

## Known Gaps

The broad P3 integration red baseline remains separately baselined and is not part of this Wave 0 hotfix.
