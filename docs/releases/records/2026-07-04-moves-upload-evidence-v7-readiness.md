# 2026-07-04-moves-upload-evidence-v7-readiness — Moves Upload Evidence Readiness

## Release ID

`2026-07-04-moves-upload-evidence-v7-readiness`

## Status

`candidate`

## Plain-English Summary

Moves phase uploads now behave more like useful evidence instead of simple file storage. When a user uploads a phase file, AbarVa can classify what the file appears to contain, record it as Move evidence, show what was found, and explain where that evidence will be used in the P2/P3/P4/P5 workflow.

This is a targeted readiness slice for the Lakeshore legal-contract-intake demo. It does not make uploaded Move files automatically update V7.

## Layer Impact

- `global-control-lane`: Updates shared Moves upload routes, evidence classification, and phase workspace UI for all tenants using the Moves workspace.
- `client-data-lane`: Writes additional structured metadata into existing program evidence records when users upload files. No schema migration is included.
- `public-demo`: Supports the Lakeshore Shared Services legal-contract-intake demo path with clearer upload guidance and evidence feedback.

## Client Applicability

- All clients: Yes, the shared Moves upload path and workspace guidance are global.
- Specific clients: Lakeshore / Industrial Demo is the immediate proof target.
- Internal only: No.
- Public/demo only: No, although this slice is demo-driven.
- Feature flag: None added in this slice.

## Changes Included

- `src/app/api/programs/workspace/[moveId]/upload/route.ts`
- `src/app/api/programs/[id]/attachments/upload/route.ts`
- `src/lib/programs/uploaded-move-evidence-classification.ts`
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
- `src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts`
- `src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx`
- `reports/moves-upload-evidence-v7-integration-audit-2026-07-04.md`
- `proof/lakeshore-legal-upload-evidence-smoke-2026-07-04/proof-report.md`

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx src/lib/programs/__tests__/evidence-ingestion.test.ts src/components/strategic-moves/__tests__/ClientFinalArtifactActions.test.tsx --runInBand`
- Pass: 4 suites, 15 tests.
- Pass: `npx eslint 'src/app/api/programs/workspace/[moveId]/upload/route.ts' 'src/app/api/programs/[id]/attachments/upload/route.ts' src/lib/programs/uploaded-move-evidence-classification.ts src/components/strategic-moves/StrategicMovePhaseClient.tsx src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx`
- Pass: `npx tsc --noEmit`
- Pass: `git diff --check -- 'src/app/api/programs/workspace/[moveId]/upload/route.ts' 'src/app/api/programs/[id]/attachments/upload/route.ts' src/lib/programs/uploaded-move-evidence-classification.ts src/components/strategic-moves/StrategicMovePhaseClient.tsx src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx reports/moves-upload-evidence-v7-integration-audit-2026-07-04.md proof/lakeshore-legal-upload-evidence-smoke-2026-07-04/proof-report.md docs/releases/records/2026-07-04-moves-upload-evidence-v7-readiness.md`
- Blocked: `npm run release:check` passed its context-ingestion and Azure deployment checks, then hit `spawnSync git ENOBUFS` while listing the existing unrelated untracked-file volume in this worktree.
- Not run: signed-in browser proof.
- Not run: Azure Container Apps deploy.
- Not run: V7 promotion job.

## Rollout Plan

1. Review and merge the candidate branch.
2. Build and deploy through the approved Azure Container Apps lane.
3. Capture ACA revision, image digest, traffic, and health.
4. Run the Lakeshore signed-in browser proof:
   - P2 upload guidance visible.
   - Upload evidence file.
   - Evidence captured and reflected in readiness.
   - Generate artifact.
   - Upload client-final document.
   - Confirm "What changed."
   - Approve final.
   - Confirm downstream P3/P4 context behavior.

## Deployment Authority

`app.abarva.ai` must deploy through the approved Azure Container Apps lane for `ca-abarva-web-lab-eastus`. Vercel deploys, preview URLs, and rollback commands are not valid production evidence for this release.

## Rollback Plan

Rollback through the previous Azure Container Apps revision if deployed. Code rollback removes the classifier, synchronous evidence recording from the workspace upload route, and the additional upload guidance UI. No schema rollback is required.

## Audit Evidence

- `reports/moves-upload-evidence-v7-integration-audit-2026-07-04.md`
- `proof/lakeshore-legal-upload-evidence-smoke-2026-07-04/proof-report.md`
- `proof/lakeshore-legal-upload-evidence-smoke-2026-07-04/fixture-manifest.json`

## Context Ingestion Evidence

- Local artifact generated: Lakeshore demo pack already exists at `/Users/anand/Downloads/lakeshore-legal-contract-intake-live-demo-2026-07-04.zip`.
- Local parse/preflight: Pass through existing `evidence-ingestion` focused test coverage.
- Product loader/API acceptance: Not browser-proven in this slice.
- Azure Blob/object storage staging: Existing upload routes stage attachments when invoked; not browser-proven in this slice.
- Queue/private worker handoff: Existing background `extractAndChunk` still fires; not browser-proven in this slice.
- Parser extraction with source citations: Local unit coverage confirms extraction path remains valid and classifier adds citation metadata.
- Review/approval queue: Not applicable to this slice.
- Client data-plane commit: Local code path records `program_evidence_items` after upload route success; not live-proven in this slice.
- Embedding/search refresh: Not run.
- Live signed-in retrieval or answer QA: Not run.

Path type: Move phase file upload to program attachment storage and program evidence records. This is not V7 committed context and not an embedding/search refresh.

## Known Gaps

- Signed-in browser proof still required.
- Azure deploy still required before production claim.
- V7 promotion remains a separate governed staging/attestation path.
- Spreadsheet/PDF/PPTX semantic diff completeness is not proven.
- All P2-P6 phase/file variants are not proven.
