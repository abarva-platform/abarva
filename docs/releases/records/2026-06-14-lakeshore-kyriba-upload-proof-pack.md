# 2026-06-14-lakeshore-kyriba-upload-proof-pack — Lakeshore Kyriba Upload Proof Pack

## Release ID

`2026-06-14-lakeshore-kyriba-upload-proof-pack`

## Status

`candidate`

## Plain-English Summary

Adds a synthetic Kyriba evidence pack and tightens the Admin data-load experience so operators can distinguish enterprise current-state updates from Source event evidence. The setup page now behaves like a clean data cabinet instead of mixing format education, template selection, and upload controls in one busy viewport. The focused upload workspace asks for the data area up front, supports template-prefilled links, auto-detects common structured templates from CSV headers, and reports fact supersession counts in the load receipt.

The synthetic workbooks include an `Instructions + Masking` tab so buyers can see how the demo data was generated, what fields a real client can safely provide, and what sensitive fields should be masked or excluded.

## Layer Impact

- `client-data-lane`: adds a synthetic Lakeshore/Kyriba source-upload dataset and manifest for governed context loading.
- `internal-admin`: improves the Admin context upload surface and receipt language.
- `public-demo`: supports the Surekha buyer proof with realistic synthetic files and a trace contract.

## Client Applicability

- All clients: Admin context upload copy and receipt semantics.
- Specific clients: synthetic dataset is Lakeshore/Kyriba demo material only.
- Internal only: dataset generation script and design contract.
- Public/demo only: Surekha proof pack materials.
- Feature flag: none.

## Changes Included

- `src/components/admin/context-layer/CsvUploadConnector.tsx`
- `src/components/admin/SetupDataLoadCenter.tsx`
- `src/app/(maestro)/admin/context-layer/uploads/page.tsx`
- `src/lib/admin/setup-load-studio-view.ts`
- `src/lib/context-ingestion/admin-structured-context-promotion.ts`
- `src/lib/context-ingestion/csv-upload-connector.ts`
- `datasets/lakeshore-kyriba-synthetic-v1/source_uploads/*`
- `scripts/generate-lakeshore-kyriba-synthetic-pack.mjs`
- `docs/build/lakeshore-kyriba-proof/KYRIBA_UPLOAD_AND_TRACE_DESIGN_CONTRACT_2026-06-14.md`
- `docs/build/lakeshore-kyriba-proof/ADMIN_DATA_CABINET_WIREFRAME_2026-06-14.html`

## QA / Validation

- PASS: Generated all Kyriba synthetic source-upload files.
- PASS: Added workbook-level `Instructions + Masking` tabs and a non-workbook upload sensitivity guide.
- PASS: Added a reviewable Admin Data Cabinet HTML wireframe before changing runtime UI.
- PASS: Redesigned the Admin Data Loads page into a file-cabinet/table overview with a single Upload action.
- PASS: Moved the embedded upload widget out of the setup overview and kept the actual load flow in the focused upload workspace.
- PASS: Added template-prefilled upload links such as `/admin/context-layer/uploads?template=integration-topology`.
- PASS: Added upload-workspace template auto-detection for integration topology, CMDB/application portfolio, vendor contracts, financial KPI, and org-role CSV headers.
- PASS: Imported each generated `.xlsx` workbook and verified expected sheet names.
- PASS: Ran `npx eslint` on changed TypeScript and generator files.
- PASS: Ran focused Jest tests for setup page source contract and setup load-studio view model.
- PASS: Ran focused Jest tests for context upload connector and CSV upload route.
- PASS: Ran `git diff --check`.
- PASS: Ran `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED: Local browser render could not run from this linked worktree because Turbopack rejected the `node_modules` symlink (`Symlink [project]/node_modules is invalid, it points out of the filesystem root`).
- NOT RUN: Full `tsc --noEmit` did not complete in this linked worktree during the interactive check; previous full-repo typecheck attempts in this slice were already blocked by known missing dev dependencies (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`).
- NOT RUN: Live tenant load, embedding refresh, Source RFP generation, and end-to-end evidence-to-output verification are intentionally deferred to the next slice.

## Rollout Plan

Merge to main. The data-cabinet overview, focused upload workspace, prefilled template links, and receipt changes become active with the next app deploy. The dataset is available in-repo for governed loading or demo review.

## Rollback Plan

Revert this release commit. Dataset removal is non-runtime. UI rollback restores the previous setup overview, upload mapping flow, and receipt language.

## Audit Evidence

- Dataset manifest: `datasets/lakeshore-kyriba-synthetic-v1/source_uploads/manifest.json`
- Design contract: `docs/build/lakeshore-kyriba-proof/KYRIBA_UPLOAD_AND_TRACE_DESIGN_CONTRACT_2026-06-14.md`
- Release record: this file.

## Known Gaps

The generated pack has not yet been loaded into a live tenant data plane in this slice. Loading, embedding refresh, Source RFP generation, and end-to-end evidence-to-output verification are the next slice.
