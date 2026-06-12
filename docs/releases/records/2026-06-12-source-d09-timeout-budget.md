# 2026-06-12-source-d09-timeout-budget — Source D09 Generation Timeout Budget

## Release ID

`2026-06-12-source-d09-timeout-budget`

## Status

`candidate`

## Plain-English Summary

The Source RFP package generator now aims to produce a review-ready D09 RFP draft on the first pass and avoids spending the entire production request window on a late automatic rewrite. This keeps the partner-grade quality gate intact while preventing a 240-second stream timeout from hiding the actual result.

## Layer Impact

- `global-control-lane`: adjusts shared Source artifact-generation behavior for all clients that generate D09 RFP packages.
- `public-demo`: affects the SkyHarbor Source self-healing crawl path used as the live proof case for the board-grade RFP package.

## Client Applicability

- All clients: Source tenants that use generated `d09_rfp_pack` artifacts receive this generation/runtime behavior.
- Specific clients: SkyHarbor is the live proof tenant for the current self-healing crawl.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: D09 prompt template version updated, output budget reduced from 4,500 to 3,800 tokens, and first-pass quality requirements made explicit.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: Source quality-review tool token budget compacted, and automatic rewrite is skipped with an explicit quality-gate failure when the synchronous request budget is nearly exhausted.
- `docs/releases/records/2026-06-12-source-d09-timeout-budget.md`: this release record.

## QA / Validation

- PASS: `git diff --check origin/main...HEAD`
- PASS after release-record correction expected: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' src/lib/source/agent-generation/prompt-registry.ts`
- PASS: `npx jest src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts --runInBand`
- PENDING: Azure Container Apps deploy and live SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, build a new Azure Container Registry image, update `ca-abarva-web-lab-eastus`, shift traffic to the new healthy revision, run `/api/health`, then rerun the SkyHarbor Source self-healing crawl.

## Rollback Plan

Revert this PR and redeploy the prior known Azure Container Apps image if the D09 generation behavior regresses.

## Audit Evidence

- Failed pre-fix live crawl report in deployment worktree: `reports/source-golden-event/2026-06-12-05-09-36`.
- HAR evidence from that crawl: D01 generated with HTTP 200, D05 generated with HTTP 200, and D09 returned HTTP 504 after about 240 seconds.
- Post-fix CI, deploy, and crawl evidence will be attached to the PR/checks and final status report.

## Known Gaps

This PR does not implement the full document-generation policy/orchestrator mission. It is a focused Source D09 timeout fix required before the live Source crawl can complete. Durable DOCX/XLSX/HTML File Cabinet proof remains part of the larger document-generation architecture lane.
