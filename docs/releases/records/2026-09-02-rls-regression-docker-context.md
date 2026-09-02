# 2026-09-02-rls-regression-docker-context — Tenant Isolation Runtime Packaging

## Release ID

`2026-09-02-rls-regression-docker-context`

## Status

`candidate`

## Plain-English Summary

Allows the runtime image build to receive the read-only SQL fixtures used by the tenant isolation regression job. The previous image packaging change copied the fixture directory from the build stage, but the Docker build context still excluded that directory.

## Layer Impact

Control plane: updates runtime-image packaging used by the repo-owned deploy workflow and the private operator job.

Data plane: no database changes. The affected regression is read-only when executed.

## Client Applicability

- All clients: Yes, as shared tenant-isolation monitoring.
- Specific clients: None.
- Internal only: Operational monitoring only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Docker build context allowlist: `.dockerignore`
- Release record: `docs/releases/records/2026-09-02-rls-regression-docker-context.md`

## QA / Validation

- Pass: `docker build --no-cache --file - .` with a scratch Dockerfile successfully copied `tests/security/rls-regression.sql` from the Docker build context.
- Pass: local YAML parse validates `.github/workflows/rls-regression.yml`.
- Pass: Release Control Gate.
- Pending: merge to `main`, repo-owned ACA deploy, then main-branch tenant isolation workflow dispatch.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys a digest-pinned image that includes `tests/security`. After that deploy is healthy, dispatch the tenant isolation regression workflow from `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Main deploy workflow only.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must pass in the main deploy workflow before live proof.
- Worker image invariant: Must pass in the main deploy workflow before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal SQL-level monitor.

## Rollback Plan

Revert the `.dockerignore` allowlist and let the repo-owned ACA deploy workflow rebuild the prior runtime packaging. No database rollback is required.

## Audit Evidence

- PR for this packaging correction.
- Release Control Gate result.
- Repo-owned ACA deploy run for the merge commit.
- Main-branch tenant isolation workflow dispatch after deployment.

## Known Gaps

Until the corrected image is deployed and the workflow is dispatched from `main`, tenant isolation state remains unproven by this monitor.
