# 2026-08-23-post-deploy-crawl-guard — Post-Deploy Crawl Guard

## Release ID

`2026-08-23-post-deploy-crawl-guard`

## Status

`candidate`

## Plain-English Summary

Adds explicit runtime bounds and progress reporting to the post-deploy crawl. The crawl now declares its total and per-surface deadline, emits progress at 15 percent increments, and writes partial proof artifacts before failing when a crawl surface exceeds the internal guardrail.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / Products: no product route, rendering logic, or data source changes.
- Release/QA: strengthens post-deploy browser automation so it is bounded and auditable instead of waiting for the outer workflow timeout.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: none.
- Internal only: post-deploy QA automation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `CRAWL_TOTAL_TIMEOUT_MS` and `CRAWL_SURFACE_TIMEOUT_MS` to `.github/workflows/post-deploy-crawl.yml`.
- Adds a 50-minute timeout to the authenticated crawl step, above the harness-level 45-minute default.
- Adds harness progress logging at 15 percent increments.
- Adds per-surface and total-deadline failures that preserve partial crawl artifacts.
- Updates the P21 post-deploy crawl smoke test to require the new guardrails.

## QA / Validation

Validation performed before PR:

- PASS: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS with larger local heap after default heap OOM: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow may rebuild and redeploy the app image. The change affects the post-deploy crawl workflow and does not mutate tenant data, route wiring, database schema, feature flags, DNS, or traffic outside the standard deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: yes, after merge through the standard main deploy workflow.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: standard post-deploy invariant applies if the main deploy workflow runs.
- Worker image invariant: not applicable.
- Feature/env flag update path: optional GitHub Actions variables only for timeout tuning.
- Live signed-in proof required: yes for product changes; this change only improves the proof lane.

## Rollback Plan

Revert the PR. The previous crawl behavior returns immediately because there are no migrations, data changes, or runtime route changes.

## Audit Evidence

- PR URL after opening.
- P21 post-deploy crawl smoke output.
- Release check output.
- Post-merge workflow run for `Post-deploy crawl`.

## Known Gaps

This does not reduce the crawl surface area or claim any Source 360 ECL browser proof. It only makes the existing post-deploy proof lane bounded and easier to audit.
