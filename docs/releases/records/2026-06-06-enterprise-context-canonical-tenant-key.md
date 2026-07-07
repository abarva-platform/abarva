# 2026-06-06-enterprise-context-canonical-tenant-key — Enterprise Context canonical tenant key

## Release ID

`2026-06-06-enterprise-context-canonical-tenant-key`

## Status

`candidate`

## Plain-English Summary

The Enterprise Context Intelligence read model now canonicalizes legacy app tenant aliases before it reads tenant-scoped context. This fixes the Meridian path where the page passed the app key `meridian`, while Admin-loaded context chunks were stored under the canonical tenant key `meridian-health`.

## Layer Impact

- `global-control-lane`: Updates shared Enterprise Context rendering behavior for all Intelligence users.
- `client-data-lane`: Reads tenant-scoped context with canonical tenant keys. No data is created, modified, or deleted.

## Client Applicability

- All clients: Applies to tenants with app-key aliases that differ from canonical data-plane tenant keys.
- Specific clients: Immediately fixes Meridian Health System Enterprise Context rendering.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`: Canonicalizes the incoming tenant key before normalized-record and chunk-backed reads.
- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts`: Adds coverage proving `meridian` reads as `meridian-health`.

## QA / Validation

- Pass: `npx jest src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts --runInBand` with 5 tests passing.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npx eslint src/lib/enterprise-context/intelligence-read-model.ts src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts`.
- Pass: `git diff --check`.
- Not run yet: Production health check.
- Not run yet: Signed-in Meridian browser crawl of `/intelligence#enterprise-context`.

## Rollout Plan

Merge to `main`, deploy to production, then rerun the signed-in Meridian crawl to confirm the Enterprise Context canvas shows loader-backed context instead of the false empty state.

## Rollback Plan

Revert this PR and redeploy. The read model will return to using caller-provided tenant keys directly.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Production deployment: Pending.
- Previous fallback release: `docs/releases/records/2026-06-06-enterprise-context-chunk-fallback.md`.

## Known Gaps

This does not populate normalized Enterprise Context records. It ensures legacy aliases resolve to the existing canonical chunk-backed data-plane keys.
