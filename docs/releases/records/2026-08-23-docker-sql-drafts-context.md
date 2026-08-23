# 2026-08-23 Docker SQL Drafts Context

## Release ID

`2026-08-23-docker-sql-drafts-context`

## Status

`candidate`

## Plain-English Summary

The Azure Container Apps image build expects the SQL draft architecture folder to be available in the Docker build context. The Dockerfile already copies that folder into the runtime image for operator job support, but `.dockerignore` excluded the parent docs tree. This release allowlists the specific SQL draft folder so the repo-owned deploy workflow can build the image again.

## Layer Impact

- **Deployment packaging / `global-control-lane`:** Updates Docker build context packaging only. It does not change application behavior, tenant inputs, canonical data, projections, migrations, runtime flags, or product routing.

## Client Applicability

- All clients: Applies to shared product/lab web image builds.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.dockerignore` now allowlists `docs/architecture/sql-drafts/**` while keeping the rest of the docs tree excluded unless already explicitly allowlisted.

## QA / Validation

- PASS: Docker-ignore semantic check using the repo's `ignore` parser. It confirmed `docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql` is included while broader architecture docs and release records remain excluded.
- PASS: `npm run release:check` — migration seals verified, Azure deployment lane passed, no legacy tenant input audit passed, release control gate passed.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow rebuilds the image from the merge SHA and deploys the resulting digest-pinned revision.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming the runtime is current.
- Worker image invariant: Required if the workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Health and runtime invariant proof are sufficient for this packaging-only fix.

## Rollback Plan

Revert the release commit and redeploy the previous successful ACA image through the repo-owned main deploy workflow. No database rollback is required.

## Audit Evidence

- Failed deploy showing the prior issue: ACA main deploy run `32654411923` failed at Docker Buildx because `/app/docs/architecture/sql-drafts` was absent from the build context.
- PR URL: To be added after opening the PR.
- Deployment evidence: To be captured after merge.

## Known Gaps

None known.
