# 2026-08-24-ecl-w3-serving-views — ECL Serving View Contract

## Release ID

`2026-08-24-ecl-w3-serving-views`

## Status

`candidate`

## Plain-English Summary

Adds the ECL serving schema contract for product surfaces. The change creates a
`serving.serving_contract` table and 40 product-facing serving views across Home, Tower, Source,
and Intelligence. Product routes are not repointed by this release; the views are a local and
data-build-ready contract for the clean-break path.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: no projection tables are replaced; existing projection tables remain the backing
  source for serving views.
- Layer 5 Serving: adds the serving schema draft, one contract row per product surface, and 40
  serving views with common provenance columns.
- Layer 6 Product Pages: no runtime route or browser behavior changes in this release.

## Client Applicability

- All clients: schema contract only, once migrated into an environment.
- Specific clients: none.
- Internal only: local proof and data-build readiness.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/sql-drafts/ecl_serving_views_v1_draft.sql`.
- Wires serving DDL into dense all-layer execution.
- Wires serving DDL into the local source-projection proof runner.
- Extends projection reconciliation to validate serving contract rows and reject shell/alias views.
- Updates the integrated clean-break plan from W3 not-built to W3 locally built.

## QA / Validation

- `npm run ecl:source-room-source-projection:load` passed.
- Disposable Postgres load compiled the ECL physical, projection, and serving DDL.
- Readback showed `serving_contract_rows = 40`, `serving_views_populated = 40`, and
  `serving_views_empty = 0`.
- Planted failures were rejected for projection-entry FK, invented metric FK, event gate payload,
  Home refusal payload, Tower gate reason, and Intelligence context-pack FK.

## Rollout Plan

Merge by PR. The serving DDL is included in the governed dense all-layer data-build DDL list, but no
shared data-plane load, route repoint, default-provider change, deployment, or traffic change is
performed by this release.

## Deployment Authority

- Repo-owned deploy workflow: not used by this release.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required before any product route claims serving-view proof.

## Rollback Plan

Revert the PR. Because this is a draft SQL contract and local/data-build wiring only, rollback does
not require data cleanup unless an operator separately applies the serving DDL to a database.

## Audit Evidence

- Local command: `npm run ecl:source-room-source-projection:load`.
- Local proof readback:
  `reports/ecl-dense-source-projection-local-load-2026-08-23/dense_source_room_ecl_source_projection_load_summary.json`.
- Reconciliation test to be run on the committed ref:
  `ECL_RECONCILE_REF=$(git rev-parse HEAD) npm run test:ecl-projection-schema-reconciliation`.

## Known Gaps

- No Azure serving readback in this release.
- No product route repointing in this release.
- No browser proof in this release.
- Source compare and approvals serving views use the current event-workspace backing until dedicated
  compare/approval rows are generated in a later slice.
