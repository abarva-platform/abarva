# 2026-06-09-governance-operator-runtime-config — Include canonical tenant config in runtime image

## Release ID

`2026-06-09-governance-operator-runtime-config`

## Status

`candidate`

## Plain-English Summary

The Azure Container Apps runtime image now includes `src/config` so private operator jobs can run governance scripts that import canonical tenant definitions. This fixes the live governance inventory job packaging failure without changing product behavior or web traffic.

## Layer Impact

- `global-control-lane`: Updates shared Azure runtime packaging for operator jobs that reuse the web image.
- `internal-admin`: Enables governance inventory/readiness/coverage jobs to run inside the private Azure data plane.

## Client Applicability

- All clients: Indirectly affected through governance job readiness.
- Specific clients: None.
- Internal only: Yes, this is an operator/runtime packaging fix.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `Dockerfile`: copies `/app/src/config` into the runtime stage alongside `src/lib` and `src/scripts`.

## QA / Validation

- `git diff --check`
- Azure ACR image build will validate that the runtime image packages the config used by governance scripts.
- Live ACA operator job rerun will validate the fix against the private Azure/Postgres data plane.

## Rollout Plan

Merge to `main`, build a new Azure Container Registry image from `main`, update the private operator job image, and rerun the governance inventory/readiness/coverage sequence. No web traffic shift is required.

## Rollback Plan

Revert the Dockerfile change or run the operator job against the prior image. This change has no database migration and no customer-facing route change.

## Audit Evidence

- PR URL and merge commit.
- ACR build log for the fixed image.
- ACA operator job logs showing governance scripts can import canonical tenants and run.

## Known Gaps

None known.
