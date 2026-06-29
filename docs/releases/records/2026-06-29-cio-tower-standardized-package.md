# 2026-06-29-cio-tower-standardized-package — Package Tower Standardized Source Data

## Release ID

`2026-06-29-cio-tower-standardized-package`

## Status

`candidate`

## Plain-English Summary

The governed Tower loader works locally because it reads `tower-standardized-v1`, but the Azure Container Apps runtime image did not include that source package. This change packages the standardized Tower source folder into the runtime image so the private VNet operator job can refresh the live `cio_tower` schema from the same governed source files.

## Layer Impact

- `global-control-lane`: Updates Docker runtime packaging for shared ACA web/operator image. No route or UI behavior changes.
- `client-data-lane`: Enables the already-approved Tower standardized loader to run in the private VNet for all canonical tenants.

## Client Applicability

- All clients: Applies to the shared ACA runtime/operator image and all canonical Tower tenants.
- Specific clients: None.
- Internal only: Operator/runtime packaging only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Docker runtime now copies `/app/tower-standardized-v1` into the final image.

## QA / Validation

- Pending before PR: focused release check.
- Live validation after merge: run `tower:cio:load-standardized`, `tower:cio:proof`, and `tower:cio:quality` through the ACA private operator job using the deployed digest image.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the corrected image. Then rerun the Tower standardized load/proof/quality scripts in the private VNet operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned main deploy only
- Approved image digest: produced by the main deploy workflow after merge
- ACA runtime invariant: required by deploy workflow
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Tower dashboard/chat parity after live data refresh

## Rollback Plan

Rollback by redeploying the prior approved main digest. This change only adds source files to the image and does not alter live data unless the operator refresh job is run.

## Audit Evidence

- PR URL: pending
- ACA deploy run: pending
- Operator load/proof/quality outputs: pending

## Known Gaps

Until this package change is deployed, the live operator job fails with `ENOENT: no such file or directory, scandir '/app/tower-standardized-v1'`.
