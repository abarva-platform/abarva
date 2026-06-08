# 2026-06-08-admin-context-upload-tabs — Admin Context Upload Tabs

## Release ID

`2026-06-08-admin-context-upload-tabs`

## Status

`candidate`

## Plain-English Summary

Operators now land on a simple Add data path first, with loaded-file review and package/corpus tooling separated into secondary tabs. The internal manifest JSON control is hidden behind Advanced so the normal workflow no longer feels like a developer console.

## Layer Impact

- Release lane: `internal-admin`.
- Impact: Improves the AbarVa operator/admin upload workflow without changing ingestion APIs, data contracts, persistence behavior, tenant routing, or production client data.

## Client Applicability

- All clients: Admin operators see the same cleaner upload layout for the active client.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/components/admin/context-layer/ContextUploadsTabs.tsx`.
- Updated `src/app/(maestro)/admin/context-layer/uploads/page.tsx` to place existing upload connectors behind Add data, Loaded files, and Advanced tabs.
- Updated the structured-upload connector so the default experience is a drop/choose-file panel with optional specific-area mapping.
- Updated the bulk-package connector so manifest JSON is hidden behind an Advanced package mapping disclosure instead of being shown by default.
- Added `src/__tests__/integration/admin-context-uploads-tabs.test.tsx`.

## QA / Validation

- `npx jest src/__tests__/integration/admin-context-uploads-tabs.test.tsx --runInBand` passed.
- `npx eslint 'src/app/(maestro)/admin/context-layer/uploads/page.tsx' src/components/admin/context-layer/ContextUploadsTabs.tsx src/components/admin/context-layer/CsvUploadConnector.tsx src/components/admin/context-layer/BulkContextUploadConnector.tsx src/__tests__/integration/admin-context-uploads-tabs.test.tsx` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` passed.
- Full `npx tsc --noEmit --pretty false` was attempted and is blocked by
  existing missing optional packages outside this change:
  `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to main and deploy through the Azure Container Apps production path. No
migration or data-plane action is required.

## Rollback Plan

Revert this PR to restore the prior vertically stacked upload page. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI status: pending.
- Production deployment: pending.
- Live smoke: pending.

## Known Gaps

This only reduces page clutter by grouping existing capabilities. It does not change file parsing, Blob staging, worker handoff, template validation, or evidence persistence.
