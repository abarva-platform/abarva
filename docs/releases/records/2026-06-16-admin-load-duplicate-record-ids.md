# 2026-06-16-admin-load-duplicate-record-ids — Admin Load Duplicate Record IDs

## Release ID

`2026-06-16-admin-load-duplicate-record-ids`

## Status

`candidate`

## Plain-English Summary

Admin structured CSV loads now handle files where the user-selected record id
column repeats inside the same file. When that happens, AbarVa keeps each row
commit-safe by adding the CSV row number to the internal record id, while still
preserving stable ids for re-uploading the same file.

## Layer Impact

`global-control-lane`: shared Admin data-load commit behavior changes for all
clients using the governed structured CSV path.

`client-data-lane`: client data rows are affected only when a structured CSV is
confirmed by an authorized user and schema validation passes.

## Client Applicability

- All clients: yes, for Admin structured CSV uploads.
- Specific clients: validated against SkyHarbor Air DORA headers.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/context-ingestion/admin-structured-context-promotion.ts`
  disambiguates duplicate source record ids within one upload batch.
- `src/lib/context-ingestion/__tests__/admin-structured-context-promotion.test.ts`
  adds a DORA regression for repeated `scorecard_id` values.

## QA / Validation

- `npx jest --runTestsByPath src/lib/context-ingestion/__tests__/admin-structured-context-promotion.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand`
  passed, with pre-existing duplicate Jest manual mock warnings.

## Rollout Plan

Merge to main, then the ACA main deploy workflow builds and deploys the image to
Azure Container Apps. After the live revision is active, re-run the SkyHarbor
DORA upload from Admin Data and verify the Confirm tab/read-model state.

## Rollback Plan

Revert this PR and redeploy the previous ACA image. No migration is included.

## Audit Evidence

- PR URL and CI run for this release candidate.
- Live Admin Data screenshot:
  `reports/admin-load-data-column-mapping/live-after-app-abarva-admin-data-2026-06-16.png`
- Live failure that motivated the fix:
  `enterprise_context_records upsert: ON CONFLICT DO UPDATE command cannot affect row a second time`

## Known Gaps

Live committed-state and retrieval proof must be re-run after this follow-up PR
deploys.
