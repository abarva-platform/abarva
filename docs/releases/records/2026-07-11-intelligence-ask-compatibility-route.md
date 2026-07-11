# 2026-07-11-intelligence-ask-compatibility-route — Intelligence Ask Compatibility Route

## Release ID

`2026-07-11-intelligence-ask-compatibility-route`

## Status

`candidate`

## Plain-English Summary

Adds a config-level compatibility redirect for the legacy `/intelligence/ask` page URL so old product links, bookmarks, and post-deploy crawl probes land on the current `/intelligence` surface instead of returning 404. The canonical ask API remains `/api/intelligence/ask`.

## Layer Impact

- Global control lane: Adds one Next config redirect for a shared Intelligence page URL.
- Proof harness: Keeps the post-deploy crawl's `intelligence-ask` surface from failing on a retired page path while still exercising the live Intelligence surface and `/api/intelligence/ask` agent probe.

## Client Applicability

- All clients: yes, because `/intelligence/ask` was a shared navigation/proof URL.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `next.config.ts`
- `src/__tests__/integration/intelligence/intelligence-legacy-route-redirects.test.ts`
- `tests/e2e/intelligence-j0.spec.ts`
- `tests/e2e/intelligence-j1.spec.ts`

## QA / Validation

- `npm run release:check`: Pass after explicit QA status wording was added.
- `git diff --check`: Pass.
- Targeted TypeScript compile of the compatibility route: Pass before the redirect moved to `next.config.ts`; no route handler remains.
- `npm test -- src/__tests__/integration/intelligence/intelligence-legacy-route-redirects.test.ts --runInBand`: Pass, 14/14 tests; existing duplicate manual mock warnings were emitted.
- `npm test -- src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`: Pass, 7/7 tests; existing duplicate manual mock warnings were emitted.
- Live route check after deploy: Not run yet.
- Post-deploy crawl rerun after deploy: Not run yet.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the new image, waits for a healthy revision, shifts traffic, verifies the ACA runtime invariant, and uploads deployment evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: resolved by the ACA main deploy workflow.
- ACA runtime invariant: required by the ACA main deploy workflow.
- Worker image invariant: required by the ACA main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl rerun.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: to be added.
- ACA main deploy run: to be added.
- Post-deploy crawl run: to be added.
- Live `/api/health` result: to be added.

## Known Gaps

The broader post-deploy crawl still has tenant-identity P1 watch conditions that should be calibrated separately; this release only removes the shared `/intelligence/ask` 404 P0.
