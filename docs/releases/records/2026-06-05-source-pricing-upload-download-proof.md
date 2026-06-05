# 2026-06-05-source-pricing-upload-download-proof — Source Pricing Upload/Download Binding Proof

## Release ID

`2026-06-05-source-pricing-upload-download-proof`

## Status

`candidate`

## Plain-English Summary

Adds an integration proof for the Source pricing workbook path so we can verify that a vendor pricing upload is parsed, persisted, listed, and then used by the comparison workbook download. This is a QA and evidence-control slice: it does not add a new user-facing workflow by itself.

## Layer Impact

- `global-control-lane`: Adds route-level coverage for shared Source artifact upload/list/render behavior.

## Client Applicability

- All clients: applies to the shared Source pricing workbook routes when the d19 pricing workflow is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts`.
- Covers `POST /api/v1/source/:eventId/artifacts/d19_pricing_workbook/vendor-submission`.
- Covers `GET /api/v1/source/:eventId/artifacts/d19_pricing_workbook/vendor-submissions`.
- Covers `GET /api/v1/source/:eventId/artifacts/d19_pricing_workbook/render?format=xlsx&variant=comparison`.
- Verifies non-pricing artifacts do not expose the d19 vendor-submission upload route.

## QA / Validation

- Pass: `npm test -- --runInBand src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts`
- Pass: `npx eslint src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts`
- Pass: `npx tsc --noEmit --skipLibCheck --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to main after CI passes. This is test coverage only, so there is no separate runtime rollout beyond the normal production deployment cadence for main.

## Rollback Plan

Revert the test and release record if the coverage proves flaky or misrepresents the route contract. No data migration or runtime rollback is required.

## Audit Evidence

- PR and CI for this branch.
- Local test output proving upload, list, comparison download headers, workbook bytes, and real-submission payload binding.

## Known Gaps

- This proof covers d19 pricing workbook upload/download binding. It does not claim every Source artifact has a live upload parser or every document type has a live export.
- Full browser E2E against production remains required before marking the broader artifact workflow complete.
