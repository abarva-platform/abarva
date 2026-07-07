# 2026-06-12-source-quality-review-dimension-normalization — Source quality review dimension normalization

## Release ID

`2026-06-12-source-quality-review-dimension-normalization`

## Status

`candidate`

## Plain-English Summary

This release hardens the Source consulting-grade quality reviewer so it cannot silently turn a malformed or partially shaped Claude review into an all-zero quality failure. The reviewer now accepts common dimension aliases when Claude returns structured tool input, and it fails loudly when required rubric dimensions are missing. This keeps the Source self-healing crawl honest: a failed RFP package must reflect a real quality issue, not a parser mismatch.

## Layer Impact

- `global-control-lane`: Shared deliverable quality validation logic for Source artifact generation. The runtime behavior changes only for consulting-grade review parsing and retry/error handling.
- `internal-admin`: Supports the governed Source E2E validation lane and operator QA reports by making quality failures more diagnosable.

## Client Applicability

- All clients: Applies to any client generating Source artifacts that use the consulting-grade quality gate.
- Specific clients: The live validation target is SkyHarbor's IT outsourcing RFP package.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing artifact-gate selection remains unchanged; currently the flagship RFP package is gated.

## Changes Included

- `src/lib/deliverables/quality/consulting-grade-rubric.ts`
  - Normalize `id`, `dimensionId`, `dimension`, `label`, or `name` to canonical rubric dimension ids.
  - Accept `requiredFixes`, `required_fixes`, or `fixes` arrays.
  - Throw a parse error when `dimensionScores` is missing or any required dimension is absent.
- `src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts`
  - Added coverage for alias normalization and missing-dimension rejection.

## QA / Validation

- `npx jest src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts --runInBand` — passed.
- `npx eslint src/lib/deliverables/quality/consulting-grade-rubric.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts` — passed.
- `git diff --check` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — to run before merge.

## Rollout Plan

Merge to `main`, build a fresh Azure Container Apps image, shift traffic to the new revision, then rerun the Source self-healing Playwright crawl for the SkyHarbor IT outsourcing event.

## Rollback Plan

Revert this PR or redeploy the previous Azure Container Apps image if quality-review parsing regresses. No database migration is included.

## Audit Evidence

- PR URL: to be added after opening.
- CI checks: to be captured on PR.
- Live proof: rerun Source self-healing crawl after deployment and attach the report path.

## Known Gaps

This release does not change the RFP authoring prompt itself. If the hardened review parser proves the RFP is truly below the 8/10 threshold, the next slice must strengthen the D09 authoring engine rather than the parser.
