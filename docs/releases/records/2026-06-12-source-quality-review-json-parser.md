# 2026-06-12-source-quality-review-json-parser — Tolerate Fenced Quality Review JSON

## Release ID

`2026-06-12-source-quality-review-json-parser`

## Status

`candidate`

## Plain-English Summary

The Source RFP quality gate now accepts strict evaluator JSON even when Claude wraps the JSON in a Markdown fence or brief wrapper text. This keeps the partner-grade ≥8/10 quality gate intact while avoiding false failures caused only by response formatting.

## Layer Impact

- `global-control-lane`: shared deliverable quality parsing for Source consulting-grade artifact review.
- `public-demo`: supports the Source E2E crawl and demonstration path by preventing fenced JSON from breaking the quality validator.

## Client Applicability

- All clients: applies to any Source artifact that uses the consulting-grade quality review parser.
- Specific clients: immediately validated through the SkyHarbor Source E2E crawl lane.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/quality/consulting-grade-rubric.ts`: robust JSON normalization for exact fenced JSON, embedded fenced JSON, and wrapper text around a JSON object.
- `src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts`: regression coverage for prose-wrapped fenced evaluator JSON.

## QA / Validation

- `npx jest src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts --runInBand` passed.
- `npx eslint src/lib/deliverables/quality/consulting-grade-rubric.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` required for PR gate.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, verify `/api/health`, then rerun the Source E2E self-healing crawl.

## Rollback Plan

Revert the parser change or roll ACA traffic back to the previous known-good revision. No schema or data migration is involved.

## Audit Evidence

- Source E2E crawl failure showed `quality_review_parse_failed` because the evaluator returned fenced JSON.
- Regression test covers the fenced JSON wrapper shape.
- Final crawl report will be recorded under `docs/build/source-e2e-self-healing/` after deployment and rerun.

## Known Gaps

This fix only handles response-format normalization. It does not lower the quality threshold or bypass failed review dimensions.
