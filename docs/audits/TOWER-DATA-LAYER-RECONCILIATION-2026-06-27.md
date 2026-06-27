# Tower Data Layer Reconciliation Audit — 2026-06-27

## Status

`candidate`

## Root Cause

Tower source evidence exists, but the read-model projection used a narrow field
contract. It recognized `budget_usd` but missed tenant variants such as
`fy26_budget_usd`, `annual_budget_usd`, `spend_amount_usd`,
`measured_value_ytd_usd`, and `realized_value_ytd_usd`.

The visible failure was SkyHarbor showing 100 program rows with `$0` budget.
That was not because the source data was empty. SkyHarbor has budget and value
fields in `F12`, `F13`, `T01`, `T07`, and `T08`; those fields were not surviving
the Tower projection and rollup path.

## Layer Reconciliation

| Layer | Current finding | Fix in this release |
|---|---|---|
| Source files | Tower evidence is present, but schemas vary by tenant and version. | Audited source headers and row counts for canonical tenants. |
| Deterministic projection | Projection read `F13`/`F11`, then stopped before `T01`/`T07`/`T08` if any initiative rows existed. | Projection now reads and merges `F13`, `F11`, `T01`, `T07`, `T08`, and `T09`. |
| Budget rollups | Runtime trusted `tower_budget_rollups`; empty table produced `$0` even when `F12` existed. | Runtime now falls back to source-backed `F12_it-budget-financials` rows when materialized rollups are absent. |
| L3 dossiers | Dossier builder already has richer Tower metric concepts, but consistency depends on the same source field semantics. | Field-synonym semantics are now aligned with dashboard projection and budget rollup fallback. |
| Dashboard/chat | Dashboard and chat could contradict each other when one path saw data the other missed. | Shared source-field preservation reduces contradiction risk; remaining proof requires deployed browser crawl. |

## Source Coverage Snapshot

| Tenant | F12 budget rows | F13 program rows | T01 initiative rows | T07 benefit rows | T08 spend rows | T09 risk rows |
|---|---:|---:|---:|---:|---:|---:|
| Apex Retail | 10 | 75 | 14 | 14 | 14 | 14 |
| First Capital Financial | 13 | 90 | 42 | 126 | 42 | 42 |
| Lakeshore Holdings | 55 | 62 | 8 | 8 | 8 | 8 |
| Meridian Health | 12 | 72 | 14 | 14 | 14 | 14 |
| SkyHarbor Air | 13 | 120 | 30 | 30 | 120 | 150 |

## Field Contract Now Recognized

| Concept | Accepted source fields |
|---|---|
| Initiative id | `initiative_id`, `initiative_key`, `program_id` |
| Initiative name | `initiative_name`, `program_name`, `name` |
| Function/domain | `business_area`, `business_function`, `portfolio_segment`, `category` |
| Owner | `owner_role`, `owning_team`, `business_owner_role`, `business_sponsor_role`, `owner` |
| Program budget/spend | `budget_usd`, `fy26_budget_usd`, `annual_budget_usd`, `program_budget_usd`, `spend_amount_usd` |
| Actual YTD spend | `actual_ytd_usd`, `actual_spend_ytd_usd`, `ytd_spend_usd`, `realized_spend_usd` |
| Realized/measured value | `measured_value_usd`, `measured_value_ytd_usd`, `realized_value_usd`, `realized_value_ytd_usd` |
| Vendor exposure | `annual_contract_value_usd`, `contract_value_usd`, `annual_budget_usd`, `fy26_budget_usd`, `spend_amount_usd`, `annualized_spend_usd` |
| Renewal/gate date | `renewal_date`, `renewal_or_gate_date`, `gate_date` |

## Validation

- Targeted Jest:
  `npx jest src/lib/tower/__tests__/tower-semantic-projection.test.ts src/lib/tower/__tests__/tower-materialized-read-model.test.ts --runInBand`
  passed, `8/8`.
- Targeted ESLint:
  `npx eslint src/lib/tower/tower-semantic-projection.ts src/lib/tower/tower-budget-rollups.ts src/lib/tower/__tests__/tower-semantic-projection.test.ts src/lib/tower/__tests__/tower-materialized-read-model.test.ts`
  passed.
- Repo-wide TypeScript was rerun with a larger heap. It still fails on existing
  missing dependency declarations outside this Tower change:
  `js-yaml`, `@azure-rest/ai-document-intelligence`, and
  `@axe-core/playwright`.

## Truth Boundary

This audit validates the local source-to-projection contract and the
source-to-budget-rollup fallback. It does not yet prove:

- Azure/Postgres live rows have been refreshed for every tenant.
- `tower_read_model_*` and `tower_budget_rollups` have been rebuilt in the live
  data plane.
- Browser-visible Tower has been redeployed and crawled.

Those are the next proof steps.

