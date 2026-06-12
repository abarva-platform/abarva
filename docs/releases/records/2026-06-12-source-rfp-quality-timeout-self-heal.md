# 2026-06-12-source-rfp-quality-timeout-self-heal — Source RFP quality gate timeout self-heal

## Release ID

`2026-06-12-source-rfp-quality-timeout-self-heal`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor Source E2E crawl proved that event creation, approval, evidence upload, and document-shelf binding worked, but the flagship RFP generation call timed out at the platform stream limit. This release keeps the partner-grade consulting quality gate intact while making the synchronous generation path smaller and faster: the D09 RFP prompt now targets a concise first-market draft, binds fewer duplicate uploaded-evidence excerpts, and caps the JSON quality-review output at a practical size.

## Layer Impact

- `global-control-lane`: changes shared Source generation behavior for the D09 RFP package and its quality-review call.

## Client Applicability

- All clients: Source clients that generate `d09_rfp_pack`.
- Specific clients: SkyHarbor exposed the timeout during the live Source E2E crawl.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
- `tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts`

## QA / Validation

- Passed: `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts --runInBand`
- Passed: `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Blocked until rollout: live Source E2E crawl rerun requires merge and Azure redeploy.

## Rollout Plan

Merge to main, build/push a new Azure Container Apps image, deploy it to `ca-abarva-web-lab-eastus`, and rerun the SkyHarbor Source E2E crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior Azure Container Apps image/revision. No schema or data migration is included.

## Audit Evidence

- Prior crawl report showing D09 timed out after D01 and D05 succeeded.
- PR and CI checks.
- Post-redeploy Playwright Source E2E crawl report.

## Known Gaps

The synchronous route is still bounded by platform timeout. A future async generation/job model would be more durable for very long, multi-pass deliverables.
