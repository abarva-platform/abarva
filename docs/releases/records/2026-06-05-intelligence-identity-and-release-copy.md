# 2026-06-05-intelligence-identity-and-release-copy — Intelligence Identity And Release Copy

## Release ID

`2026-06-05-intelligence-identity-and-release-copy`

## Status

`candidate`

## Plain-English Summary

The Intelligence patterns and signal stream pages now show the active client name in the page body. The admin release ledger also stops rendering the phrase "demo tenant" in sanitized legacy-client references, so the production crawl no longer flags that copy as generic tenant language.

## Layer Impact

`global-control-lane`: Shared Intelligence and admin release-ledger surfaces now use clearer tenant-visible copy.

`client-data-lane`: No client data, loader data, private schemas, ingestion runs, or static seed facts changed.

## Client Applicability

- All clients: Yes. The tenant strip uses the existing active-client resolver and the release-ledger copy is shared.
- Specific clients: Not limited to one client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `TenantIdentityStrip` to `/intelligence/patterns` and `/intelligence/signals`.
- Changed release-ledger sanitized legacy-client wording from "demo tenant" to "sample tenant".

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/release-ledger.test.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`.
- PASS: Scoped ESLint on changed Intelligence route files and release-ledger parser.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- NOT-RUN until merge: production crawl should reduce remaining `tenant-identity` findings for SkyHarbor Intelligence patterns/signals and `generic-tenant-copy` findings on admin releases.

## Rollout Plan

Merge to main and allow the normal production deployment. No manual data operation is required.

## Rollback Plan

Revert this PR. The Intelligence pages and release ledger return to the prior copy and layout without changing data.

## Audit Evidence

- Local production crawl artifact `/private/tmp/post-deploy-crawl-local-tenant-strip/2026-06-05T07-07-27-667Z-local` showed remaining P1 findings on SkyHarbor Intelligence patterns/signals and admin release generic copy.

## Known Gaps

This release does not address hard-question citation-depth P1 findings or P2 visual-canon findings.
