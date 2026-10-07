# 2026-10-06 — Operator repair build context

## Release ID

`2026-10-06-operator-repair-build-context`

## Status

`candidate`

## Plain-English Summary

The Docker build context now includes committed data-repair authorization files. The runtime image already has a copy rule for these files; this change lets that rule receive its source directory during the repository-owned image build.

## Layer Impact

`client-data-lane`: operator data-plane execution can read exact-scope authorization from the approved image. The build-context rule alone writes no tenant data.

## Client Applicability

- All clients: no automatic data change.
- Specific clients: only an explicitly authorized operator job may use a matching repair file.
- Internal only: ACA image packaging and operator job execution.
- Public/demo only: the currently committed synthetic authorization.
- Feature flag: none.

## Changes Included

The `.dockerignore` allowlist for `docs/governance/data-repairs` and this release record.

## QA / Validation

Local validation: inspect Docker ignore rules and the matching Dockerfile runtime-stage copy, run `npm run release:check`, and confirm the authorization file is retained in the build context. ACA image build and operator execution follow merge.

## Rollout Plan

Merge through a PR. The repository-owned ACA main workflow builds and deploys a digest-pinned image. Verify web and worker digest parity, then retry the exact-scope operator job and validate its database and Blob readbacks.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only the repository-owned main workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: verify template, 100% traffic revision, and required workers.
- Worker image invariant: the operator job uses a pinned image and restores its idle template.
- Feature/env flag update path: none.
- Live signed-in proof required: refresh the affected synthetic Move cabinet after the operator job.

## Rollback Plan

Revert this build-context allowlist through a PR and main deploy. The data repair itself has a separate exact-scope authorization and proof.

## Audit Evidence

PR and merge commit, build and deploy run, image digest, operator job execution, Blob proof, database readback, and signed-in cabinet screenshot.

## Known Gaps

The exact-scope operator job has not yet been rerun from an image containing the authorization file.
