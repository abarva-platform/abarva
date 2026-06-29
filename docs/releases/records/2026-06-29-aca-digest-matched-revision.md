# 2026-06-29-aca-digest-matched-revision — Accept ACA Digest-Matched Revision Names

## Release ID

`2026-06-29-aca-digest-matched-revision`

## Status

`candidate`

## Plain-English Summary

The ACA main deploy workflow now treats the approved image digest as the deployment proof instead of assuming Azure Container Apps will always honor the requested revision suffix. If ACA creates a numeric revision name, the workflow accepts it only after proving the revision image exactly matches the expected digest-pinned main image.

## Layer Impact

`global-control-lane`: Updates the shared deployment workflow for `app.abarva.ai`. No product UI, data model, tenant data, or application runtime code changes are included.

## Client Applicability

- All clients: Yes, because the shared ACA deploy lane serves the shared app runtime.
- Specific clients: None.
- Internal only: Deployment control plane only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/aca-main-deploy.yml`
- The workflow now verifies the actual ACA revision image digest before passing the revision forward.
- The traffic shift step now re-checks that the target revision image matches the approved digest before assigning 100% traffic.

## QA / Validation

- `npm run release:check`: pass after this record is included.
- GitHub Actions validation: not-run until PR creation.
- Runtime proof through the next ACA main deploy run: not-run until merge.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow runs automatically. The workflow will build the main image, deploy an ACA revision, verify the actual revision image digest, shift traffic only to that verified revision, and run the existing runtime invariant and health checks.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACR build policy: unchanged; the workflow still builds and resolves a digest-pinned image from the repo-owned main deploy path.
- Shared runtime mutators: unchanged; only the repo-owned deploy workflow should mutate shared ACA runtime.
- Approved image digest: required and verified against the actual ACA revision before traffic shift.
- ACA runtime invariant: unchanged; still runs after traffic shift.
- Worker image invariant: unchanged; worker jobs are still updated to the same image.
- Feature/env flag update path: unchanged.
- Live signed-in proof required: Yes, after deploy.

## Rollback Plan

Revert this workflow change if the digest-matched revision handling is wrong. If a deployment fails, the workflow restores previous 100% traffic before exiting, and the existing rollback path remains shifting traffic back to the previous healthy revision recorded in `traffic-before.json`.

## Audit Evidence

- PR URL
- ACA main deploy run
- `audit-artifacts/aca-main-deploy/revision.json`
- `audit-artifacts/aca-main-deploy/traffic-target-revision.json`
- `audit-artifacts/aca-main-deploy/runtime-invariant`

## Known Gaps

This change does not itself deploy Tower code; it repairs the deploy lane so the next main deploy can proceed through ACA when Azure returns a numeric revision name.
