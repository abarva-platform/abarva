# 2026-05-24-p21-post-deploy-crawl — Authenticated Post-Deploy Crawl

## Release ID

`2026-05-24-p21-post-deploy-crawl`

## Status

`candidate`

## Plain-English Summary

Adds a post-deploy crawl harness that signs in as canonical CXO personas, visits primary tenant surfaces, captures screenshots/HTML/transcripts, compares the crawl to a baseline, and reports P0/P1/P2 trust regressions. Rollback is implemented as a dry-run by default and only executes when explicitly enabled in the controlled deploy workflow.

## Layer Impact

- `ops-release-lane`: adds automated post-deploy crawl workflow, smoke script, and rollback guard.
- `app-control-lane`: adds `/admin/deploy-crawl` so operators can inspect the latest crawl run.
- `agent-quality-lane`: captures hard-question transcripts and exact-field citation counts for agent surfaces.
- `client-data-lane`: verifies tenant identity and seeded Apex watchlist candidates are visible where expected.

## Client Applicability

- All clients: protected by the regression harness after production deploys.
- Specific clients: Apex, Meridian, and First Capital are covered by the canonical persona set.
- Internal only: `/admin/deploy-crawl` is an authenticated admin/operator surface.
- Public/demo only: none.
- Feature flag: actual rollback requires `CRAWL_ENABLE_AUTO_ROLLBACK=true`.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts`
- `scripts/crawl/auto-rollback.ts`
- `src/lib/crawl/baseline-compare.ts`
- `src/lib/crawl/persona-switcher.ts`
- `src/app/(maestro)/admin/deploy-crawl/page.tsx`
- `.github/workflows/post-deploy-crawl.yml`
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`

## QA / Validation

- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx eslint src/lib/crawl scripts/crawl scripts/smoke/p21-post-deploy-crawl.spec.ts src/app/'(maestro)'/admin/deploy-crawl/page.tsx`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run build`

## Rollout Plan

Merge to main and let the normal production deploy run. The workflow runs on push to main and can also be manually dispatched with a target URL.

## Rollback Plan

The harness is additive. Disable the workflow or revert this PR if it causes noise. Actual Vercel rollback remains disabled unless `CRAWL_ENABLE_AUTO_ROLLBACK=true`.

## Audit Evidence

- PR and CI logs for this branch.
- Post-deploy crawl artifacts uploaded by GitHub Actions.
- `audit-artifacts/post-deploy-crawl/latest.json` when run locally or in CI.

## Known Gaps

- Live rollback chaos verification is not executed automatically in v1; it is available only as an explicitly enabled controlled workflow path.
