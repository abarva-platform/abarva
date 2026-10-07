# 2026-10-06 — Operator repair authorization packaging

## Release ID

`2026-10-06-operator-repair-authorization-packaging`

## Status

`candidate`

## Plain-English Summary

The runtime image now includes committed data-repair authorization files required by scoped operator jobs. The earlier image included the job script but omitted its authorization file, causing the job to fail before reaching the database.

## Layer Impact

Release lane: `client-data-lane` for operator data-plane execution. The runtime image contents change; no product route or data changes automatically.

## Client Applicability

- All clients: no automatic data mutation.
- Specific clients: only an explicitly authorized operator repair can consume a matching file.
- Internal only: ACA operator job execution.
- Public/demo only: the currently committed synthetic repair authorization.
- Feature flag: none.

## Changes Included

The Docker runtime-stage copy rule for `docs/governance/data-repairs` and this release record.

## QA / Validation

PASS: Dockerfile path inspection, release gate, and local presence of the authorization directory. NOT RUN: ACA image and operator job until merge and repository-owned main deploy.

## Rollout Plan

Merge through a PR. The repository-owned ACA main workflow builds and deploys a digest-pinned image. Verify the runtime invariant, then retry the exact scoped operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only the repository-owned main workflow.
- Approved image digest: record from the deploy before operator execution.
- ACA runtime invariant: verify template, 100% traffic revision, and required workers.
- Worker image invariant: the operator job uses a pinned digest and restores its idle template.
- Feature/env flag update path: none.
- Live signed-in proof required: after the repair job, read the product cabinet.

## Rollback Plan

Revert the copy rule through a PR and main deploy if necessary. No database change occurs from this packaging rule alone.

## Audit Evidence

The PR and merge commit, image digest, deploy invariant, operator job execution and Blob proof, database readback, and signed-in cabinet screenshot.

## Known Gaps

The earlier operator execution failed before the database connection. The scoped repair must be rerun from the corrected image.
