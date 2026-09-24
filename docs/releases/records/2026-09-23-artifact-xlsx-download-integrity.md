# 2026-09-23-artifact-xlsx-download-integrity — Artifact XLSX Download Integrity

## Release ID

`2026-09-23-artifact-xlsx-download-integrity`

## Status

`candidate`

## Plain-English Summary

Generated artifact downloads now preserve the requested Office file type for XLSX exports. If a generated artifact is requested as XLSX, the artifact endpoint builds a real workbook from workbook-targeted tables, available document tables, or structured document summary sheets; it no longer silently returns a Word package under an Excel filename.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates generated artifact export behavior for Moves File Cabinet downloads. It does not change source data, canonical data, evidence parsing, artifact generation prompts, or data-plane state.

## Client Applicability

- All clients: Applies to generated artifact downloads served through `/api/v1/artifacts/:artifactId`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/artifacts/[artifactId]/route.ts`
- `src/app/api/v1/artifacts/[artifactId]/__tests__/route.test.ts`
- `src/lib/deliverables/orchestrator/renderers.tsx`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/artifacts/[artifactId]/__tests__/route.test.ts' --runInBand` — passed, 11 tests.
- `npx jest src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — passed, 35 tests.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting web image.

## Deployment Authority

- Repo-owned deploy workflow: Yes, `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, download an XLSX artifact from the Moves File Cabinet and verify the exported Office package contains workbook content.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to redeploy the previous artifact export behavior. No migration or data rollback is required.

## Audit Evidence

- Pull request URL and merge commit.
- GitHub Actions deploy run for the merge commit.
- ACA runtime invariant readback.
- Signed-in browser proof downloading a generated XLSX artifact and inspecting the Office package structure.

## Known Gaps

This release fixes file type integrity at the download endpoint. It does not change generated artifact content quality or regenerate existing artifacts.
