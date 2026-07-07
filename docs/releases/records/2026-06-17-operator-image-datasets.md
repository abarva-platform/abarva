# 2026-06-17-operator-image-datasets — Package Loader Datasets For Operator Jobs

## Release ID

`2026-06-17-operator-image-datasets`

## Status

`candidate`

## Plain-English Summary

The Azure runtime/operator image already includes loader scripts, but it did not include the `datasets/` directory those scripts need. This change packages the governed dataset artifacts into the runtime image so private Azure Container Apps operator jobs can run tenant substrate refreshes from inside the private data-plane network without cloning the repo or falling back to public-network database access.

## Layer Impact

- `global-control-lane`: Updates shared container packaging for Azure Container Apps runtime images.
- `internal-admin`: Enables private operator jobs to run approved loader-backed data-plane refreshes with the same image deployed by the normal release path.
- `client-data-lane`: Supports First Capital refresh execution, but does not itself write client data.

## Client Applicability

- All clients: Any future operator job can access packaged dataset artifacts when using the runtime image.
- Specific clients: First Capital Financial is the immediate load target.
- Internal only: Azure private operator and deployment workflow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `Dockerfile`: copies `/app/datasets` into the runtime image alongside existing operational scripts and migrations.

## QA / Validation

- Pending CI on PR.
- Local packaging inspection: `datasets/` is 48 MB; First Capital substrate pack is 1.3 MB.
- This change does not run the live load by itself. Live load must run through the Azure private operator after the ACA image deploy completes.

## Rollout Plan

Merge to `main` and allow the ACA main deploy workflow to build and deploy the new image. After deploy, run the First Capital private operator load using the latest deployed image, with `DATABASE_URL` and `OPENAI_API_KEY` from Key Vault, then run context insight evaluation and live tenant population audit.

## Rollback Plan

Revert this Dockerfile change and redeploy the previous image. If a live data load has already run, rollback the data by refresh batch/evidence receipt rather than by reverting the image alone.

## Audit Evidence

- PR checks for this release.
- ACA main deploy evidence after merge.
- Private operator job logs for the First Capital load, insight evaluation, and live population audit.

## Known Gaps

- The First Capital live load is still pending private operator execution.
- AI Control Tower monthly refresh rows still require the governed `ai_control_*` parser/commit path before they can be claimed live.
