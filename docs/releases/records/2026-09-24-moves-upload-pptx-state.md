# 2026-09-24-moves-upload-pptx-state — Moves Upload State Alignment

## Release ID

`2026-09-24-moves-upload-pptx-state`

## Status

`candidate`

## Plain-English Summary

Moves upload routes now treat presentation files the same way the evidence parser already does: if a `.pptx` is parsed synchronously during upload, the attachment scan state is recorded as a completed synchronous extraction path instead of remaining in a pending state. Artifact-review uploads also keep risk and blocker feedback in the review triage payload instead of dropping those comments.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / Products: Updates Moves upload API behavior and tests. No canonical data model, Source adapter, or tenant intake template changes.

## Client Applicability

- All clients: Applies to Moves file upload and workspace upload routes for every tenant using the shared product runtime.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/programs/[id]/attachments/upload/route.ts` includes PPTX in synchronous evidence scan-state handling.
- `src/app/api/programs/workspace/[moveId]/upload/route.ts` includes PPTX in synchronous workspace upload scan-state handling and includes risk/blocker comments in artifact-review feedback extraction.
- `src/app/api/programs/__tests__/attachments-upload.smoke.test.ts` adds PPTX upload coverage for the main attachment route.
- `src/app/api/programs/workspace/[moveId]/__tests__/upload-route.test.ts` adds workspace upload route coverage for PPTX evidence ingestion, discovery readiness response, artifact-review feedback extraction, and ingestion-failure reporting.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath src/app/api/programs/__tests__/attachments-upload.smoke.test.ts 'src/app/api/programs/workspace/[moveId]/__tests__/upload-route.test.ts' --runInBand` — 16/16 passing.
- `./node_modules/.bin/eslint 'src/app/api/programs/[id]/attachments/upload/route.ts' 'src/app/api/programs/workspace/[moveId]/upload/route.ts' 'src/app/api/programs/__tests__/attachments-upload.smoke.test.ts' 'src/app/api/programs/workspace/[moveId]/__tests__/upload-route.test.ts'` — clean.
- `npm run typecheck` — clean.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image. No migration, data load, feature flag, tenant-data mutation, or manual operator run is required.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge to `main`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required only if the deploy workflow updates workers as part of the standard invariant.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Route-level validation is covered locally; live upload proof may be performed as part of the broader Moves operating smoke.

## Rollback Plan

Revert the pull request and allow the repo-owned deploy workflow to redeploy the previous behavior. No schema or data rollback is required.

## Audit Evidence

- Pull request URL and commit SHA after PR creation.
- Local validation commands listed in QA / Validation.
- GitHub deploy workflow run and ACA runtime invariant after merge/deploy.

## Known Gaps

This does not change the broader Move phase workflow, document-generation quality, evidence approval policy, or client-review loop. It only fixes upload-state alignment for presentation evidence and preserves risk/blocker feedback during artifact-review upload triage.
