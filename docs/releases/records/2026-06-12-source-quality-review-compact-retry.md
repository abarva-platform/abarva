# 2026-06-12-source-quality-review-compact-retry — Source Quality Review Compact Retry

## Release ID

`2026-06-12-source-quality-review-compact-retry`

## Status

`candidate`

## Plain-English Summary

This release hardens the Source RFP package quality gate when Claude returns a malformed reviewer payload. The D09 RFP package still requires the partner-grade 10-dimension rubric, but the retry now uses a compact, dimension-explicit prompt with more output budget. If the model still omits the rubric, the system records an explicit failed Gate B review instead of returning an ambiguous parser failure.

## Layer Impact

- `global-control-lane`: Updates shared Source artifact-generation quality-review behavior for the D09 RFP package generation endpoint.
- `client-data-lane`: No schema or data mutation. Existing artifact persistence behavior is unchanged; the route still writes only after the quality gate succeeds.

## Client Applicability

- All clients: Source events that generate the D09 RFP package.
- Specific clients: SkyHarbor is the active live proof client for the self-healing crawl.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/quality/consulting-grade-rubric.ts`
  - Adds a compact reviewer retry prompt that names every required rubric dimension.
  - Adds an explicit malformed-review failure object with all ten dimensions failed.
- `src/lib/source/agent-generation/quality-review.ts`
  - Exposes Source-specific compact retry and malformed-review helpers.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
  - Raises the Source quality-review token budget.
  - Uses the compact retry prompt after the first malformed review.
  - Converts repeated malformed reviewer output into a failed quality review instead of `quality_review_parse_failed`.
- Unit tests cover compact retry prompt completeness and malformed-review failure metadata.

## QA / Validation

- `npx jest src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts --runInBand` — passed, 16 tests.
- `npx eslint src/lib/deliverables/quality/consulting-grade-rubric.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts src/lib/source/agent-generation/quality-review.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts'` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, shift traffic after the revision is healthy, smoke `/api/health`, then rerun the SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this release commit and redeploy the prior healthy Azure Container Apps image. No database rollback is required.

## Audit Evidence

- Prior live failure: D09 returned `quality_review_parse_failed` after the heartbeat stream because the reviewer payload omitted `dimensionScores` or an equivalent rubric score collection.
- This release is the targeted resilience fix before rerunning the live crawl.

## Known Gaps

- This release does not itself prove the D09 RFP package is partner-grade. The live crawl must still pass Gate B after deployment.
