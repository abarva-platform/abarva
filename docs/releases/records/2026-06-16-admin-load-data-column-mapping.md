# 2026-06-16-admin-load-data-column-mapping — Admin Load Data Mapping Confirmation

## Release ID

`2026-06-16-admin-load-data-column-mapping`

## Status

`candidate`

## Plain-English Summary

The Admin Load Data screen now asks operators to confirm what AbarVa understood instead of showing raw schema errors. For CSV files, the screen reads the headers, proposes a column mapping for the selected data area, preselects record/title columns, and only permits direct commit when all required meanings are mapped. Documents, workbooks, decks, and archives are preserved for review and do not claim committed facts.

## Layer Impact

`global-control-lane`: Shared Admin/Setup data-load UX and the direct structured upload route changed for all tenants using the common admin surface. The commit contract remains strict: structured rows commit only after required mappings resolve and server validation passes; review-required files are staged without tenant fact promotion.

## Client Applicability

- All clients: Admin users on the shared setup data-load surface receive the simplified mapping confirmation flow.
- Specific clients: Skyharbor Air DORA CSV headers are covered by the new synonym mapping test fixture.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/admin/AdminSetupExperience.tsx`: Renamed load modes and removed the default review-first explainer block.
- `src/components/admin/context-layer/CsvUploadConnector.tsx`: Added CSV row/header reading, plain-English mapping confirmation, editable required-field dropdowns, record/title guesses, compact attestation, and Advanced-only chunk/attestation-note controls.
- `src/lib/context-ingestion/csv-column-mapping.ts`: Added shared exact/synonym/fuzzy header matching.
- `src/lib/context-ingestion/csv-upload-connector.ts`: Reused the matcher on the server and rejects direct commit when required fields remain unmapped.
- `src/lib/context-ingestion/admin-structured-context-promotion.ts`: Promotes canonical mapped field names alongside source evidence.
- `src/app/api/admin/context-layer/csv-upload/route.ts`: Stages PDF/XLSX/DOCX/PPTX/ZIP uploads as review-required without committing facts.
- Focused tests for UI mapping, server inference, route review handling, and setup copy.

## QA / Validation

- `npx jest src/lib/context-ingestion/__tests__/csv-column-mapping.test.ts src/components/admin/context-layer/__tests__/CsvUploadConnector.test.tsx src/components/admin/__tests__/AdminSetupExperience.test.tsx src/components/admin/__tests__/admin-canonical-setup-source.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand` — passed, 40 tests. Jest also printed existing duplicate manual mock warnings for markdown mocks.
- `npx eslint src/components/admin/AdminSetupExperience.tsx src/components/admin/context-layer/CsvUploadConnector.tsx src/lib/context-ingestion/csv-column-mapping.ts src/lib/context-ingestion/csv-upload-connector.ts src/lib/context-ingestion/admin-structured-context-promotion.ts src/app/api/admin/context-layer/csv-upload/route.ts src/components/admin/context-layer/__tests__/CsvUploadConnector.test.tsx src/components/admin/__tests__/AdminSetupExperience.test.tsx src/components/admin/__tests__/admin-canonical-setup-source.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/lib/context-ingestion/__tests__/csv-column-mapping.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed. Release Control Gate and Pilot Data Loader Gate passed.
- `git diff --check` — passed.
- Live production before-state check on `https://app.abarva.ai/admin` as SkyHarbor Air — signed-in Data section showed the old copy (`Setup package`, `Single file update`, and the default `Package intake is review-first` block). Screenshot captured at `reports/admin-load-data-column-mapping/live-before-app-abarva-admin-data.png`.

## Rollout Plan

Merge the PR to `main`; the next normal app deployment makes the shared Admin/Setup screen and upload route active. No migration, feature flag, or manual data-plane mutation is required.

## Rollback Plan

Revert the PR. Since there is no schema migration, rollback is limited to restoring the prior UI and route behavior. Any files staged for review remain preserved in object storage and no automatic fact promotion needs to be undone for review-only uploads.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3534
- CI run: pending.
- Local focused Jest output: passed, 40 tests.
- Browser screenshots: production before screenshot captured at `reports/admin-load-data-column-mapping/live-before-app-abarva-admin-data.png`; post-deploy after screenshot pending.
- Release check: passed locally.

## Known Gaps

Live signed-in commit and retrieval proof on `https://app.abarva.ai` remain pending until this branch is merged and deployed. Local automated tests verify UI state, server mapping inference, strict commit gating, and review-required routing; production data-plane proof must still be run against the deployed release before marking the flow retrieval-proven.
