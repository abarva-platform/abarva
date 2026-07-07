# 2026-06-12-source-d09-json-heartbeat — Source D09 JSON Heartbeat

## Release ID

`2026-06-12-source-d09-json-heartbeat`

## Status

`candidate`

## Plain-English Summary

The Source D09 RFP package generation endpoint now keeps its JSON response stream alive while the long Claude generation and quality gate run. The endpoint sends harmless whitespace before the final JSON body, which remains valid JSON for callers, so Azure does not terminate the request as an idle stream timeout before the generation finishes.

## Layer Impact

- `global-control-lane`: changes the shared Source D09 artifact-generation response transport for all clients.
- `public-demo`: affects the SkyHarbor Source self-healing crawl proof path for board-grade RFP generation.

## Client Applicability

- All clients: Source tenants generating `d09_rfp_pack` receive the stream-safety behavior.
- Specific clients: SkyHarbor is the live proof tenant for this validation lane.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: wraps D09 generation in a JSON-compatible heartbeat stream while preserving the existing generation, quality-gate, persistence, and final JSON body behavior.
- `docs/releases/records/2026-06-12-source-d09-json-heartbeat.md`: this release record.

## QA / Validation

- PASS expected: `git diff --check origin/main...HEAD`
- PASS expected: `npm run release:check -- --base origin/main --head HEAD`
- PASS expected: focused ESLint on the touched route
- PENDING: Azure Container Apps deploy and live SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, build a new Azure Container Registry image, update `ca-abarva-web-lab-eastus`, shift traffic to the healthy revision, run `/api/health`, then rerun the SkyHarbor Source self-healing crawl.

## Rollback Plan

Revert this PR and redeploy the prior known Azure Container Apps image if D09 callers regress.

## Audit Evidence

The two pre-fix live crawl reports in deployment worktrees showed D09 returning HTTP 504 `stream timeout` after about 240 seconds while D01 and D05 completed successfully. Post-fix crawl evidence will be recorded after deployment.

## Known Gaps

This PR does not implement asynchronous job orchestration or the full document-generation policy/orchestrator mission. It is a focused transport fix for the current production D09 idle timeout.
