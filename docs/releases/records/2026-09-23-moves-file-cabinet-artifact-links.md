# 2026-09-23-moves-file-cabinet-artifact-links — Moves Artifact Links

## Release ID

`2026-09-23-moves-file-cabinet-artifact-links`

## Status

`candidate`

## Plain-English Summary

Moves File Cabinet artifact actions now render as normal browser links for opening previews and downloading final files. This makes Open and Download observable, copyable, and resilient to button-side browser side effects that can fail without visible feedback.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates the Moves File Cabinet UI action controls only. It does not change artifact generation, artifact storage, evidence parsing, canonical data, or data-plane state.

## Client Applicability

- All clients: Applies to Moves File Cabinet artifact controls wherever the Moves product is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 79 tests.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting web image.

## Deployment Authority

- Repo-owned deploy workflow: Yes, `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify File Cabinet Open/Download render as direct links in the signed-in Moves UI.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to redeploy the prior File Cabinet controls. No migration or data rollback is required.

## Audit Evidence

- Pull request URL and merge commit.
- GitHub Actions deploy run for the merge commit.
- ACA runtime invariant readback.
- Signed-in browser proof on a Moves File Cabinet page.

## Known Gaps

This release changes the browser action controls only. It does not modify artifact generation quality, evidence parsing, or the set of artifacts shown in the File Cabinet.
