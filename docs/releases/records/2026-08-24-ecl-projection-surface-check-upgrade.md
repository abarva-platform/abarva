# 2026-08-24-ecl-projection-surface-check-upgrade — ECL Projection Surface Check Upgrade

## Release ID

`2026-08-24-ecl-projection-surface-check-upgrade`

## Status

`candidate`

## Plain-English Summary

Updates the ECL product projection DDL so existing databases replace the stale
`projection_entry_surface_check` constraint when new product projection surfaces are added. This
keeps the existing-database path aligned with the fresh-schema path.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 Product Projections: updates the projection-entry surface allowlist upgrade path.
- Layer 5 Serving: no serving view behavior changes.
- Layer 6 Product Pages: no route or default-provider changes.

## Client Applicability

- All clients: ECL schema/data-build contract only.
- Specific clients: none.
- Internal only: local and ACA data-build proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Replaces `ecl_projection.projection_entry_surface_check` during existing-database DDL application.
- Extends the projection schema reconciliation test so every specified product projection surface
  must be admitted by both the fresh constraint and the existing-database replacement block.

## QA / Validation

- `pass` — `ECL_RECONCILE_REF=$(git rev-parse HEAD) npm run
  test:ecl-projection-schema-reconciliation` before merge.
- `not-run` — Local dense all-layer validation is required before any subsequent ACA load retry.

## Rollout Plan

Merge by PR. The next governed ACA data-build execution will apply the updated DDL before loading
projection rows. No product default-provider repoint, web deployment, traffic change, or browser
proof is included in this release.

## Deployment Authority

- Repo-owned deploy workflow: not used by this release.
- Shared runtime mutators: none.
- Approved image digest: required for any subsequent ACA data-build job.
- ACA runtime invariant: job idle restore must be verified after any data-build execution.
- Worker image invariant: required before claiming any ACA data-build execution complete.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming any product surface is live-proven.

## Rollback Plan

Revert the PR before the next data-build job. If already applied to a lab database, rerun the prior
approved DDL and data-build package only through the governed job path.

## Audit Evidence

- Projection DDL: `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql`.
- Reconciliation guard: `scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`.
- Failed Azure execution that motivated the fix is recorded in local operator output, not in public
  release narrative.

## Known Gaps

- Does not run or retry the ACA data-build job by itself.
- Does not perform independent Azure readback.
- Does not provide browser/live/product proof.
