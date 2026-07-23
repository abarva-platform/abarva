# 2026-07-23-source-binary-evidence-extraction — Source binary evidence extraction

## Release ID

`2026-07-23-source-binary-evidence-extraction`

## Status

`deployed-regression-and-signed-in-proven`

## Plain-English Summary

Source uploads now extract text from common buyer evidence files before sending them through the existing evidence parser. PDF, XLSX, and PPTX uploads are still stored in Azure Blob and registered in Postgres as before, but when text can be extracted, Source also creates the same parsed evidence chunks and lightweight facts already used for Markdown, text, and CSV uploads.

This is the first `SOURCE-INGEST-001` slice. It does not add a new workshop upload UI, async parse worker, OCR, transcription, vector indexing, or enterprise-context promotion job.

## Layer Impact

- Release lane: `global-control-lane`.
- Source upload API: reuses one extracted-text result for canvas artifact landing and evidence parsing.
- Source extraction helper: adds deterministic PDF, XLSX, and PPTX extraction using existing dependencies.
- Source evidence data layer: successful binary extraction flows into existing Azure/Postgres tables through `parseSourceTextArtifact`; no schema or migration change.
- aVa readiness: parsed chunks/facts become available through the same Source artifact evidence path aVa already reads; this release does not change chat prompting or retrieval policy.

## Client Applicability

- All clients: yes, for Source artifact uploads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added by this slice.

## Changes Included

- `src/lib/source/artifact-registry/upload-text-extraction.ts`: extracts PDF text via `pdf-parse`, workbook cell text via `exceljs`, and PPTX slide text via `jszip`; keeps bounded synchronous extraction and explicit unsupported handling for image/audio/video.
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`: computes upload text extraction once, uses it for optional canvas body landing, and sends extracted text through `parseSourceTextArtifact` when available.
- `src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts`: adds PDF/XLSX/PPTX regression coverage and preserves unsupported-binary behavior.
- `src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts`: proves an XLSX upload feeds extracted text into the parser, not just blob storage and registry metadata.
- `docs/backlog/source-product-backlog.md`: records `SOURCE-INGEST-001a` scope and follow-on gaps.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts --runInBand` — pass, 14/14. Same pre-existing duplicate Jest manual mock warnings observed.
- `npm test -- --runTestsByPath src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts 'src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts' src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/artifact-registry/__tests__/upload-contract.test.ts --runInBand` — pass on 2026-07-23, 34/34 across the combined ingest regression set. Same pre-existing duplicate Jest manual mock warnings observed.
- `npx eslint src/lib/source/artifact-registry/upload-text-extraction.ts src/app/api/v1/source/[eventId]/artifacts/upload/route.ts src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts` — pass with warnings only. Warnings are pre-existing unused symbols in the upload route/test.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked by pre-existing missing optional Home graph packages in unrelated files: `@xyflow/react` and `@dagrejs/dagre`. No Source ingest type errors remained after fixing the upload-route test mock.
- `npm run release:check -- --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source upload proof where production/test data safely permits.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: later independently verified production revision
  `ca-abarva-web-lab-eastus--me89b7e4d`, image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:24e692b4213213fede4a7921ffe8a53d3a1b9215989c0f81bb2cd308b3ff5185`,
  tag `main-e89b7e4d`, contains PR #5432.
- ACA runtime invariant: passed independently on 2026-07-23 for the superseding
  production revision above; web and worker images matched and 100% traffic was on
  that revision.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, route/browser proof should show the Source app remains signed in and upload route behavior should be verified with safe test data where available.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That restores the prior behavior where PDF/XLSX/PPTX uploads remain registry-only unless another parser consumes them. No migration rollback or data cleanup is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5432
- Merge SHA: `919b7ae487e237c1157c50d92c613efc23624e70`.
- ACA deploy run / digest: ACA main run `29981467082` succeeded for the merge SHA;
  later production revision `ca-abarva-web-lab-eastus--me89b7e4d` was independently
  invariant-proven with digest
  `sha256:24e692b4213213fede4a7921ffe8a53d3a1b9215989c0f81bb2cd308b3ff5185`.
- Focused test output: local command above.
- Signed-in browser proof: non-mutating Files workspace proof captured in
  `audit-artifacts/source-ingest-files-workspace-live-proof-20260723/ui-proof-summary.json`.
  A real production upload was intentionally not performed without a dedicated safe
  test file/event approval.

## Known Gaps

- No new workshop/session-notes capture UI is added.
- No async parse worker is added for large or failed files.
- No OCR/transcription exists for image/audio/video uploads.
- No vector indexing or enterprise-context promotion job is added; parsed Source evidence remains in the existing Source evidence tables until a governed context promotion slice is built.
