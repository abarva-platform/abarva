# 2026-06-05-meridian-structured-loader-json-yaml — Meridian Structured Loader JSON/YAML Support

## Release ID

`2026-06-05-meridian-structured-loader-json-yaml`

## Status

`candidate`

## Plain-English Summary

The Admin context loader can now accept Meridian/PHS structured upload templates in CSV, JSON, JSONL, and YAML form. This keeps the Sacramento-based Meridian enterprise profile and HL7/FHIR topology files on the governed loader path instead of requiring a one-off seed or manual side load.

## Layer Impact

- `internal-admin`: The context-layer upload UI now describes and accepts structured files beyond CSV.
- `client-data-lane`: The same tenant-checked, attested, sensitive-scanned upload API now parses JSON, JSONL, and simple YAML into tenant context chunks with ingestion-run evidence.

## Client Applicability

- All clients: CSV behavior is unchanged.
- Specific clients: Meridian/PHS benefits immediately because its upload-template pack includes YAML and JSON files.
- Internal only: Admin/setup operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/csv-upload-connector.ts` adds structured upload format detection and parsing for JSON, JSONL, and simple YAML.
- `src/app/api/admin/context-layer/csv-upload/route.ts` allows structured context file formats while keeping Moves rate-card validation CSV-only.
- `src/components/admin/context-layer/CsvUploadConnector.tsx` updates the upload affordance and file accept list.
- Connector and route tests cover Meridian enterprise-profile YAML and HL7/FHIR JSON uploads.

## QA / Validation

- `npx jest src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand` — pass, 18 tests.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production path. No migration is required.

## Rollback Plan

Revert the PR. Existing CSV uploads and already-written context chunks remain intact because this release only broadens accepted upload formats.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3134.
- Focused Jest output shows JSON/YAML uploads are parsed and written through the existing loader connector.

## Known Gaps

- This release does not perform the live Meridian reset/reload because the local environment cannot resolve the Azure Postgres host. The live reload still needs to run from a network boundary that can reach production data plane or through authenticated Admin UI.
