# 2026-06-05-admin-release-ledger-copy-crawl-fix — Admin Release Ledger Copy Crawl Fix

## Release ID

`2026-06-05-admin-release-ledger-copy-crawl-fix`

## Status

`candidate`

## Plain-English Summary

The admin release ledger now removes generic workspace wording before historical release records render on tenant-visible admin pages. This keeps release governance readable without exposing phrases that make pilot users wonder whether they are seeing sample or placeholder data.

## Layer Impact

`global-control-lane`: Shared admin release-ledger parsing now sanitizes generic tenant phrasing in addition to client names.

`client-data-lane`: No client data, loader data, private schemas, ingestion runs, migrations, or static seed facts changed.

## Client Applicability

- All clients: Yes. The admin release ledger is a shared authenticated control-plane surface.
- Specific clients: Not limited to one client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updated `src/lib/admin/release-ledger.ts` to replace generic tenant phrases with neutral workspace language.
- Updated `src/lib/admin/__tests__/release-ledger.test.ts` with a regression case for the production crawl finding.

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/release-ledger.test.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`.
- PASS: `npx eslint src/lib/admin/release-ledger.ts src/lib/admin/__tests__/release-ledger.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- NOT-RUN until merge and deploy: production crawl should remove the 4 `generic-tenant-copy` P1 findings on `admin-releases`.

## Rollout Plan

Merge to main and deploy the current production build. No data operation is required.

## Rollback Plan

Revert the PR. The release ledger returns to the previous sanitized wording without changing any persisted data.

## Audit Evidence

- Production crawl artifact `/private/tmp/post-deploy-crawl-local-intelligence-strip/2026-06-05T07-29-42-624Z-local` showed 4 `generic-tenant-copy` P1 findings on `admin-releases`.

## Known Gaps

This release does not address hard-question citation-depth P1 findings or visual-canon P2 findings.
