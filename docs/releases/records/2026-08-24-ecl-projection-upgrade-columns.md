# 2026-08-24-ecl-projection-upgrade-columns - ECL Projection Upgrade Columns

## Release ID

`2026-08-24-ecl-projection-upgrade-columns`

## Status

`candidate`

## Plain-English Summary

Existing ECL product projection tables can predate the projection-entry spine. This change makes
the projection DDL upgrade those existing tables by adding the `projection_entry_id` column and FK
guard needed by the dense ECL loaders.

## Layer Impact

- Client-data-lane, Layer 4 product projections: existing ECL projection tables become compatible
  with the projection-entry spine used by the dense load.
- Client-data-lane, Layer 3 canonical model: no canonical object, relationship, measure, or metric
  semantics change.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: governed ECL lab/preprod data-build slices using the dense projection loaders.
- Internal only: operator proof and schema compatibility path.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql`
- `scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`

## QA / Validation

- Pass: `ECL_RECONCILE_REF=HEAD npm run test:ecl-projection-schema-reconciliation`
- Pass: `npm run test:ecl-dense-readback-query`
- Pass: `npm run test:ecl-object-type-catalog`
- Pass: `npm run ecl:source-room-source-projection:load -- --out-dir /tmp/ecl-projection-upgrade-local`

## Rollout Plan

Merge through PR. The next governed ACA data-build job should use a digest-pinned image from the
merged commit and rerun the dense ECL all-layer load.

## Deployment Authority

- Repo-owned deploy workflow: required to produce the shared digest-pinned image.
- Shared runtime mutators: no product route or traffic change in this PR.
- Approved image digest: resolved after merge by the repo-owned deploy workflow.
- ACA runtime invariant: required before claiming deployed runtime proof.
- Worker image invariant: not changed by this PR directly.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, later product/browser QA; not claimed by this PR.

## Rollback Plan

Revert this PR before rerunning the dense ECL data-build job. The compatibility block is additive
and does not delete tables or rows.

## Audit Evidence

- PR URL once opened.
- ACA load attempt evidence: `reports/ecl-dense-aca-job-execute-2026-08-24-rerun-approved/`
- Local projection proof: `/tmp/ecl-projection-upgrade-local`

## Known Gaps

The Azure dense ECL load must be rerun from a merged digest-pinned image before product/browser QA
can proceed.
