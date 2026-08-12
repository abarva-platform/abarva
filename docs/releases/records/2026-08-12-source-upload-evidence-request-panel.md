# 2026-08-12-source-upload-evidence-request-panel — Source Upload Evidence Request Panel

## Release ID

`2026-08-12-source-upload-evidence-request-panel`

## Status

`candidate`

## Plain-English Summary

Source provide/upload tasks now show a clearer evidence request before the user uploads a file. The panel states what to load, which source system or extract it comes from, who owns it, the accepted format, whether the file will parse into governed Source facts, and the current upload status. This keeps the workflow explicit without changing upload, parsing, or completion semantics.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates the Source working-canvas upload presentation for provide tasks.
- Layer 3 Canonical Enterprise Model: no change. Existing upload, artifact registry, and fact-ingest routes remain the source of persistence.

## Client Applicability

- All clients: yes, any tenant using Source event provide/upload tasks receives the clearer request panel.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- `src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand` passed.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required before live-proof claim.
- Worker image invariant: required before live-proof claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for any claim beyond deployment health.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No schema, migration, data-plane, or feature-flag rollback is required.

## Audit Evidence

- Pull request URL after creation.
- CI checks on the pull request.
- Main ACA deploy run after merge.
- Live ACA digest/traffic/worker invariant and health endpoint readback after deploy.

## Known Gaps

This does not add new parsers, new templates, or new workflow stages. It makes the existing upload and fact-ingest path understandable to the user and keeps missing evidence visible.
