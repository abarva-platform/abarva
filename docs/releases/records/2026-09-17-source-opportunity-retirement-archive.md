# 2026-09-17 Source Opportunity Retirement Archive

## Release ID

`2026-09-17-source-opportunity-retirement-archive`

## Status

`candidate`

## Plain-English Summary

Add a private, tenant-scoped archive for exact-row opportunity-spine cutovers. The archive preserves the original row payload and checksum with the operator run before an approved retirement can remove a competing package writer's records. The migration alone does not change existing opportunities.

## Layer Impact

`client-data-lane`: Layer 3 gains an operational audit archive. No Layer 1 input, Layer 2 adapter, Layer 4 read model, or product page is changed by this migration.

## Client Applicability

- All clients: The empty archive schema is available after migration.
- Specific clients: No rows change until an independently approved, tenant-scoped operator job runs.
- Internal only: Archive reads and writes are restricted to the service role.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Add `source.opportunity_cutover_run` for manifest, inventory, operator, and proof identity.
- Add `source.opportunity_cutover_archive` with one immutable-intent snapshot per original row and source table.
- Add tenant-scope index and service-role-only row-level policies.

## QA / Validation

Status: pass for a fresh PostgreSQL migration replay in an isolated local cluster, including three policy and two foreign-key assertions. Release check: pass locally. Application, data, and signed-in proof are not claimed by this migration.

## Rollout Plan

Merge through a reviewed PR. The repo-owned ACA workflow deploys code; the database migration remains pending until the separate lab migration workflow reports its status and an explicit apply is dispatched. A later cutover job must inventory installed constraints and exact rows, archive and verify them atomically, reject unexpected dependencies, and produce a durable private proof bundle before any retirement.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: No feature-branch or ad-hoc traffic updates.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Must pass on the merged SHA before operator execution.
- Worker image invariant: Must pass with the web digest.
- Feature/env flag update path: None.
- Live signed-in proof required: After the separately approved data cutover.

## Rollback Plan

Before any archive rows exist, leave the additive tables unused; do not drop them in an emergency deploy. After archival, preserve the tables and use the approved exact-run restore path before reversing writer ownership. Never truncate an archive or restore across tenant or dataset boundaries.

## Audit Evidence

Migration diff, focused test results, PR checks, governed migration status/apply run, exact-row preflight, and future operator-job proof bundle.

## Known Gaps

- This migration does not itself archive, remove, reload, or validate any tenant records.
- Archive-write authorization, external-reference handling, and private Blob proof must be proven by the operator job before data retirement.
