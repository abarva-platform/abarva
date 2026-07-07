# 2026-06-06-enterprise-context-chunk-fallback — Enterprise Context chunk fallback

## Release ID

`2026-06-06-enterprise-context-chunk-fallback`

## Status

`candidate`

## Plain-English Summary

The Intelligence Enterprise Context page now recognizes context that was loaded through the Admin setup loader even when the older normalized Enterprise Context tables have not been populated yet. This prevents a false "not loaded" message for tenants such as Meridian Health System whose Admin-uploaded context chunks are present and embedded.

## Layer Impact

- `global-control-lane`: Updates the shared Enterprise Context read model used by the Intelligence experience.
- `client-data-lane`: Reads existing tenant-scoped `enterprise_context_chunks` rows as a fallback evidence source. No schema changes or data mutations are included.

## Client Applicability

- All clients: Applies to any tenant with Admin-loader context chunks and zero normalized Enterprise Context records.
- Specific clients: Immediately validates the Meridian Health System pilot path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`: Adds a chunk-backed fallback overview when normalized records are empty.
- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts`: Adds regression coverage for the fallback and source-document domain summarization.

## QA / Validation

- Pass: `npx jest src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts --runInBand` with 4 tests passing.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Blocked local environment: `tsc --noEmit --pretty false` stops on missing optional dependency packages already absent from this local install (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`) before exercising this diff.
- Not run yet: Production health check.
- Not run yet: Signed-in Meridian browser crawl of `/intelligence#enterprise-context`.

## Rollout Plan

Merge to `main`, deploy the production app through Vercel, then rerun the signed-in Meridian crawl to confirm the Enterprise Context page shows chunk-backed loaded context instead of the empty-state copy.

## Rollback Plan

Revert the read-model PR and redeploy. The previous behavior returns to normalized-records-only rendering and will show the unloaded state when normalized records are absent.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Production deployment: Pending.
- Meridian live data evidence: `docs/build/meridian-phs-demo/MERIDIAN_EMBEDDING_COMPLETION_EVIDENCE_2026-06-06.md`.

## Known Gaps

This fallback does not populate normalized Enterprise Context tables. It makes existing loader-backed chunks visible to Intelligence while the fuller normalized context pipeline remains a separate hardening lane.
