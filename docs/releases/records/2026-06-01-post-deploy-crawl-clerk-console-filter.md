# 2026-06-01-post-deploy-crawl-clerk-console-filter — Post-Deploy Crawl Clerk Console Filter

## Release ID

`2026-06-01-post-deploy-crawl-clerk-console-filter`

## Status

`candidate`

## Plain-English Summary

The post-deploy crawl now separates real app console errors from a known Clerk dev-browser CORS refresh message. A rendered, correctly scoped page with only that Clerk browser noise no longer triggers an automatic P0 rollback finding, while real app console errors still fail the crawl as P0.

## Layer Impact

- `global-control-lane`: changes the shared post-deploy quality gate comparator used after production releases.
- Product runtime: no user-facing UI, routing, schema, or data-plane behavior changed.

## Client Applicability

- All clients: the post-deploy crawl gate applies across tenant personas and surfaces.
- Specific clients: none.
- Internal only: the comparator and smoke test are internal release-control tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/baseline-compare.ts`: filters known Clerk dev-browser CORS console noise into a non-blocking telemetry finding.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`: adds regression coverage proving Clerk CORS noise is not P0 and real app console errors remain P0.

## QA / Validation

- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `npx eslint src/lib/crawl/baseline-compare.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: replayed production crawl artifact from run `26783958644`; patched comparator returned `0 P0 · 100 P1 · 1 P2` and no P0 findings.
- Pass: `git diff --check`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The next post-deploy crawl will use the updated comparator automatically.

## Rollback Plan

Revert the PR. No migration or data rollback is required.

## Audit Evidence

- Triggering production crawl: `https://github.com/anandsundaram-hash/abarva/actions/runs/26783958644`
- Finding: one P0 on `admin-production-readiness` for Meridian CDIO caused only by Clerk CORS console messages after the page rendered with the correct tenant.
- PR URL and CI evidence to be added after the PR is opened.

## Known Gaps

This does not change Clerk configuration. If Clerk CORS noise becomes user-visible or blocks authentication, it should be treated as an environment/auth configuration issue rather than filtered as crawl telemetry.
