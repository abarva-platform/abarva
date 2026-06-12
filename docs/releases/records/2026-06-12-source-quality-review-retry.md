# 2026-06-12-source-quality-review-retry — Retry Malformed Source Quality Reviews

## Release ID

`2026-06-12-source-quality-review-retry`

## Status

`candidate`

## Plain-English Summary

The Source RFP quality gate now retries the consulting-grade evaluator once when Claude returns malformed JSON. The retry uses the same source context and rubric, asks for compact valid JSON only, and still fails closed if the response cannot be parsed or if any quality dimension scores below 8/10.

## Layer Impact

- `global-control-lane`: hardens shared Source artifact generation and review orchestration.
- `public-demo`: supports the SkyHarbor Source E2E crawl by making evaluator formatting failures self-heal without weakening the quality bar.

## Client Applicability

- All clients: applies to Source artifacts that require consulting-grade quality review.
- Specific clients: validated through SkyHarbor Source E2E.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: increases review response budget and retries once with a strict compact-JSON instruction when the first review JSON is malformed.

## QA / Validation

- Passed: `npx eslint src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`.
- Passed: `git diff --check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`.
- Not run yet: full Source E2E crawl; it will rerun after Azure deployment.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, verify `/api/health`, then rerun the Source E2E self-healing crawl.

## Rollback Plan

Revert the route change or roll ACA traffic back to the previous known-good revision. No schema or data migration is involved.

## Audit Evidence

- Source E2E crawl exposed `quality_review_parse_failed` with malformed evaluator JSON after the fenced JSON parser fix.
- Final crawl report will be recorded under `docs/build/source-e2e-self-healing/` after deployment and rerun.

## Known Gaps

The retry handles malformed evaluator JSON only. It does not bypass failed quality dimensions or lower the partner-grade threshold.
