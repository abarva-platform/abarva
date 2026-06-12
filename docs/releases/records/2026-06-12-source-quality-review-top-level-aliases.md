# 2026-06-12-source-quality-review-top-level-aliases — Source quality review top-level alias parsing

## Release ID

`2026-06-12-source-quality-review-top-level-aliases`

## Status

`candidate`

## Plain-English Summary

This release hardens the Source consulting-grade quality-review parser for another live Claude structured-output variant. The previous parser accepted dimension aliases inside a `dimensionScores` array, but the live reviewer can return the same rubric scores under equivalent top-level keys such as `dimension_scores` or `scores`. This update accepts those equivalent shapes while still rejecting reviews that contain no real rubric scores.

## Layer Impact

- `global-control-lane`: Shared Source deliverable quality validation behavior. This changes only the parsing contract for quality reviews; it does not lower the quality bar.
- `internal-admin`: Improves the Source self-healing crawl's ability to distinguish real D09 RFP quality failures from evaluator shape mismatches.

## Client Applicability

- All clients: Applies to Source artifacts that use the consulting-grade quality gate.
- Specific clients: Live validation target is SkyHarbor's IT outsourcing RFP package.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing artifact-gate selection remains unchanged.

## Changes Included

- `src/lib/deliverables/quality/consulting-grade-rubric.ts`
  - Accepts `dimensionScores`, `dimension_scores`, `rubricScores`, `rubric_scores`, `scores`, or `dimensions` collections.
  - Accepts either arrays or keyed score maps.
  - Preserves the fail-loud behavior when required rubric dimensions are missing.
- `src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts`
  - Added tests for snake_case top-level score arrays and keyed score maps.

## QA / Validation

- `npx jest src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts --runInBand` — passed.
- `npx eslint src/lib/deliverables/quality/consulting-grade-rubric.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts` — passed.
- `git diff --check` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — to run before merge.

## Rollout Plan

Merge to `main`, build a fresh Azure Container Apps image, shift traffic to the new revision, then rerun the SkyHarbor Source self-healing crawl.

## Rollback Plan

Revert the PR or redeploy the previous ACA image. No migration or data change is included.

## Audit Evidence

- PR URL: to be added after opening.
- CI checks: to be captured on PR.
- Live proof: rerun Source self-healing crawl after deployment.

## Known Gaps

This release does not change RFP authoring quality. If parsing succeeds and the artifact still scores below 8/10, the next slice must strengthen D09 authoring rather than the parser.
