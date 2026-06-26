# 2026-06-26-lakeshore-tower-data-reset — Lakeshore Tower Budget Read Model Reset

## Release ID

`2026-06-26-lakeshore-tower-data-reset`

## Status

`candidate`

## Plain-English Summary

This release replaces the stale Lakeshore Tower dashboard inputs with a governed Lakeshore Holdings Tower package and a dedicated Tower budget rollup read model. The Tower page must show Lakeshore's loaded FY2026 IT budget as a portfolio-company rollup, not the stale `$1.5B / 52 programs` fixture shape.

## Layer Impact

- `client-data-lane`: adds a Lakeshore Holdings v4 Tower dataset package, a `tower_budget_rollups` read-model table, and a controlled loader that purges/reloads only Lakeshore Tower read-model rows.
- `global-control-lane`: updates Tower runtime precedence so the page prefers materialized Tower read-model rows and budget rollups over legacy AI initiative fixtures whenever governed rows exist.

## Client Applicability

- All clients: Tower runtime now prefers governed Tower read models when present.
- Specific clients: Lakeshore Holdings receives the new enriched Tower package and controlled read-model reset.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- New dataset root: `datasets/lakeshore-holdings-synthetic-v4`.
- New migration: `supabase/migrations/20260626203000_tower_budget_rollups.sql`.
- New read adapter: `src/lib/tower/tower-budget-rollups.ts`.
- New controlled loader: `src/scripts/tower/load-lakeshore-holdings-read-model.ts`.
- Tower data trust gate now includes Lakeshore F11/F12 and derived Tower read-model files.
- Tower page now receives `budgetRollups` and uses them for CIO dashboard budget/vendor portfolio totals.

## QA / Validation

- `npm run tower:data-trust:gate:downloads` passed and wrote `/Users/anand/Downloads/tower-data-trust-gate-2026-06-26T20-27-33-867Z`.
- `npx tsx src/scripts/tower/load-lakeshore-holdings-read-model.ts` dry-run passed with 5 budget rollups, 8 initiatives, 20 deduped vendor rows, `$157.5M` IT budget, `$75.601M` YTD spend, `$90.657M` vendor budget, and `$56.1M` named vendor exposure.
- Private VNet loader first attempt failed because duplicate vendor conflict keys caused Postgres to reject the bulk upsert; the loader now dedupes vendor rows by `client_id + logical_vendor_key + period_label`, preserves summed exposure, and keeps source citations for each contributing portfolio-company row.
- Targeted tests and release check must pass before merge.
- Signed-in ACA browser proof is required after migration/load/deploy.

## Rollout Plan

1. Merge this release branch through PR after local/CI gates pass.
2. Apply the additive migration to Azure/Postgres from inside the private VNet.
3. Run `npx tsx src/scripts/tower/load-lakeshore-holdings-read-model.ts --apply` from the private VNet.
4. Build/deploy the merged main SHA to Azure Container Apps.
5. Browser-prove Lakeshore `/tower` shows `$157.5M` loaded IT portfolio, 5 portfolio-company rollups, 8 initiatives, and no stale `$1.5B / 52 programs` headline.

## Deployment Authority

- Repo-owned deploy workflow: required for ACA deployment.
- Shared runtime mutators: no local/non-main ACA mutation approved.
- Approved image digest: recorded after ACA build/deploy.
- ACA runtime invariant: active revision, traffic image, and template image must match the approved digest.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Lakeshore Tower.

## Rollback Plan

Rollback code by redeploying the prior approved main image. Rollback data by deleting Lakeshore rows from `tower_budget_rollups`, `tower_read_model_initiatives`, and `tower_read_model_vendors`; because the migration is additive, leaving the empty table in place is safe.

## Audit Evidence

- Tower trust gate output folder in Downloads.
- Loader dry-run JSON output.
- PR URL and CI run after PR creation.
- ACA revision/digest/traffic proof after deployment.
- Signed-in browser screenshot after deployment.

## Known Gaps

Lakeshore vendor budget from F12 totals `$90.657M`; named contract exposure currently totals `$56.1M`. The dashboard must present these as different coverage layers instead of collapsing them into one number.
