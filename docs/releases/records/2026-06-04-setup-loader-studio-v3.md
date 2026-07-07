# 2026-06-04-setup-loader-studio-v3 — Setup Data Load Studio v3

## Release ID

`2026-06-04-setup-loader-studio-v3`

## Status

`candidate`

## Plain-English Summary

The Admin Setup page now shows where a client data load actually starts. Maestros can see the active client's supported data templates, which formats are available, which path is live today, and the governed upload control in the same Data Loads page. The page is explicit that CSV is the live structured upload path today, while Office, PDF, slide, JSON, and archive formats are template-supported controlled intake until their parser and commit path is complete.

## Layer Impact

`global-control-lane` — Updates the shared Admin Setup/Data Loads UI and view model for all tenants. It does not add database migrations or change tenant data schemas.

`client-data-lane` — Surfaces the existing tenant-scoped CSV upload workflow inside Setup using the active `clientId`; it does not bypass the existing tenancy, attestation, scan, validation, or persistence checks.

## Client Applicability

- All clients: Yes, all signed-in tenants see the updated Data Loads experience.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/admin/setup` now passes the active tenant `clientId` into the Data Loads component.
- `SetupDataLoadCenter` now renders a registry-backed "Load data here" panel with starter dimensions, format support, and the existing upload control.
- `setup-load-studio-view` now builds a template guide from `NORTHSTAR_CONTEXT_TEMPLATES` and links to `/admin/context-layer/templates`.
- `CsvUploadConnector` copy now reads as governed structured-data upload instead of a raw CSV connector.
- Tests updated to pin tenant-scoped upload wiring, context-template routing, and honest format-path labels.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/lib/admin/__tests__/setup-load-studio-view.test.ts' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' --runInBand`
- Pass: `npx jest --runTestsByPath src/lib/admin/__tests__/setup-load-studio-view.test.ts src/lib/admin/__tests__/setup-data-load-center.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand`
- Pass: `npx eslint src/lib/admin/setup-load-studio-view.ts src/components/admin/SetupDataLoadCenter.tsx src/components/admin/context-layer/CsvUploadConnector.tsx 'src/app/(maestro)/admin/setup/page.tsx' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' src/lib/admin/__tests__/setup-load-studio-view.test.ts`
- Pass: `npx tsc --noEmit --pretty false --incremental false`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pending: production smoke after merge and deploy.

## Rollout Plan

Merge to `main`; Vercel production deploy updates `/admin/setup`. No migration or manual data-plane rollout is required.

## Rollback Plan

Revert this PR and redeploy. The existing `/admin/context-layer/uploads` route and API remain unchanged, so rollback is UI-only.

## Audit Evidence

- Pull request and CI checks for this release.
- Focused Jest and ESLint outputs listed above.
- Production smoke after deploy showing `/admin/setup` renders the Data Loads page and `/admin/context-layer/templates` remains reachable.

## Known Gaps

This release does not implement XLSX, DOCX, PPTX, PDF, JSON, JSONL, Markdown, or ZIP parser commits. It makes their template support visible and labels them as controlled intake until their parser and commit path is complete. A follow-up client-data-lane slice must add the non-CSV parser/preview/commit workflow before those formats can be treated as fully live.
