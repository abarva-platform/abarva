# 2026-08-12-source-response-ingestion-path — Source Response Ingestion Path

## Release ID

`2026-08-12-source-response-ingestion-path`

## Status

`candidate`

## Plain-English Summary

Adds a Responses-stage panel that explains how long vendor proposal packages move from uploaded files to parser output, citations, scoring readiness, BAFO leverage, CXO decision conditions, and value proof guardrails. It makes clear that an uploaded file alone is not score evidence.

## Layer Impact

- Product surface: Source Responses UI now shows the ingestion/readiness path between file readiness and proposal intelligence.
- Canonical/data layer: No schema, migration, persistence, loader, adapter, or live data-plane change.
- Evidence governance: The UI reinforces the platform rule that Source consumes parsed/validated readiness and must not cite or score raw uploads until usable evidence exists.

## Client Applicability

- All clients: Yes, for Source New Event Responses-stage UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/components/source/canvas/responses/VendorResponseIngestionPathPanel.tsx`.
- Wired the panel into `src/components/source/canvas/responses/ResponsesStageView.tsx`.
- Added `src/components/source/canvas/responses/__tests__/VendorResponseIngestionPathPanel.test.tsx`.
- Added this release record.

## QA / Validation

- PASS: Focused Jest for the new ingestion path panel and existing Responses parser/decision panels: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseIngestionPathPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseDecisionProofPanel.test.tsx src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts --runInBand --silent`.
- PASS: ESLint for affected files: `npx eslint src/components/source/canvas/responses/VendorResponseIngestionPathPanel.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponseIngestionPathPanel.test.tsx`.
- PASS: TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: Release check: `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN YET: GitHub PR checks.
- NOT RUN YET: Signed-in live Source Responses route proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to the shared lab/product web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the main deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Responses route.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to deploy the reverted `main` image. No database rollback is required because there are no schema or persistence changes.

## Audit Evidence

To be filled after PR, CI, deploy, and live proof:

- PR URL:
- Merge commit:
- ACA deploy run:
- Runtime digest:
- Live screenshot:

## Known Gaps

This does not implement real OCR, document intelligence, persistent parse artifacts, retrieval indexing, evaluator calibration, or live upload-to-fact conversion. Those remain a separate governed ingestion/data-plane project.
