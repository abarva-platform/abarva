# 2026-08-23-ecl-sql-drafts-image-context - ECL SQL Drafts Image Context

## Release ID

`2026-08-23-ecl-sql-drafts-image-context`

## Status

`candidate`

## Plain-English Summary

Allows the ECL SQL draft folder into the Docker build context so the dense ECL ACA execute entrypoint can copy and apply the required DDL inside the private operator job image.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 through Layer 4: No data semantics change. This only repairs runtime packaging for the governed all-layer data-build job.

## Client Applicability

- All clients: No.
- Specific clients: Dense synthetic ECL lab/preprod load only.
- Internal only: Operator image packaging.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.dockerignore` now explicitly includes `docs/architecture/sql-drafts/**` in the Docker build context.

## QA / Validation

- Verified the failed ACA main deploy build stopped because `/app/docs/architecture/sql-drafts` was missing from the Docker build context.
- Pending on PR: repo-owned ACA main deploy image build for the corrected context.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow rebuilds the digest-pinned image. After the image digest is available, submit the governed private ACA operator job for the dense ECL load.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Repo-owned ACA main deploy only for image packaging; data mutation through ACA operator job only.
- Approved image digest: Required.
- ACA runtime invariant: Required by main deploy workflow.
- Worker image invariant: Required before data-build job use.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this packaging hotfix.

## Rollback Plan

Revert this change and use the previous image digest. Do not submit the dense ECL operator job from an image missing the SQL draft DDL files.

## Audit Evidence

- Failed ACA main deploy run `32654250413` showed Docker Buildx could not find `/app/docs/architecture/sql-drafts`.
- PR checks and subsequent ACA main deploy run after merge.

## Known Gaps

This change does not mutate Azure data, submit the data-build job, perform readback, repoint product routes, or capture browser QA.
