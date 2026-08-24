# 2026-08-24-ecl-source-file-origin-ddl-upgrade — ECL source provenance upgrade path

## Release ID

`2026-08-24-ecl-source-file-origin-ddl-upgrade`

## Status

`candidate`

## Plain-English Summary

The ECL physical schema now upgrades existing `ecl_source.source_file` tables when adding the
source-origin field. Fresh databases already created the field, but existing lab databases needed an
additive upgrade path before the dense ECL data-build job could apply the current schema safely.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 source adapters: source-file provenance remains explicit as `client_intake` or
`synthetic_generator`.

Layer 3 canonical model: the ECL physical DDL is now re-runnable against databases that were created
before the origin field existed.

Layer 4 products: no direct product behavior changes.

## Client Applicability

- All clients: no default route or product behavior change.
- Specific clients: none.
- Internal only: governed ECL lab/preprod data-build operations.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql`
- `scripts/ecl/__tests__/run-ecl-source-file-origin-upgrade-tests.mjs`
- `package.json`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

- `npm run test:ecl-source-file-origin-upgrade` passed. It starts from an old-shape
  `ecl_source.source_file` table without `origin`, applies the current DDL, verifies existing rows
  are backfilled, verifies the origin constraint and index exist, and plants an invalid-origin row
  that is rejected.
- `npm run test:ecl-client-intake-application-adapter` passed.
- `npm run test:ecl-object-type-catalog` passed.
- `npm run test:ecl-dense-readback-query` passed.
- `npm run release:check -- --base origin/main --head HEAD` required before merge.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned
runtime image. The next governed ACA data-build job can then rerun the ECL DDL and dense load through
the private operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before rerunning the data-build job from the new image.
- Worker image invariant: data-build job must use the digest-pinned image that contains this DDL.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this schema-runner fix alone.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow if the schema runner regresses. If the
DDL has already added the nullable/backfilled origin field in lab, leaving the extra column is safer
than destructive rollback; future loaders can ignore it after code rollback.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local regression output for `npm run test:ecl-source-file-origin-upgrade`.
- ACA deploy run and runtime invariant after merge.
- Governed ACA data-build retry logs after deployment.

## Known Gaps

This does not itself run the Azure data-build load, compare readback, or prove browser surfaces.
