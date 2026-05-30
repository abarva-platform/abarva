# Tower · ERP financial ingest

This folder ships two workbook artifacts:

| File | Purpose |
|---|---|
| `template.xlsx` | Blank template. Two data sheets + How-to-fill + Schema. |
| `sample-northwind.xlsx` | Synthetic Northwind Retail dataset. 75 programs × 12 monthly periods + 30 vendors. Banner row marks every figure SYNTHETIC. |

Both workbooks share the same schema. The ingest CLI accepts either —
it is keyed off sheet names, not file name.

## What the sheets carry

### `Program Financials`

One row per (program, fiscal period). Columns:

| Column | Required | Type | Notes |
|---|---|---|---|
| `program_id` | yes | string | Customer program identifier (Oracle Project ID, SAP WBS, internal code). |
| `period_start` | yes | date | Fiscal period start. YYYY-MM-DD. |
| `period_end` | yes | date | Fiscal period end. Must be ≥ `period_start`. |
| `budget_usd` | – | number | Planned spend, USD. |
| `actual_usd` | – | number | Posted actual spend, USD. |
| `capex_usd` | – | number | Capital-expenditure share of actual. |
| `opex_usd` | – | number | Operating-expenditure share. |
| `vendor_id` | – | string | FK to `Vendor Spend.vendor_id`. |
| `cost_center` | – | string | Cost-center / profit-center code. |
| `gl_account` | – | string | GL natural account code. |

Validation enforced at ingest:

* `period_end ≥ period_start`
* `capex_usd + opex_usd ≤ actual_usd` (± $1 rounding)
* `vendor_id` if present must exist in `Vendor Spend`
* `(program_id, period_start)` is unique

### `Vendor Spend`

One row per vendor in the source ERP. Columns:

| Column | Required | Type | Notes |
|---|---|---|---|
| `vendor_id` | yes | string | Stable vendor master ID. |
| `vendor_name` | yes | string | Vendor display name. |
| `cost_center` | – | string | Default cost center. |
| `gl_account` | – | string | Default GL natural account. |
| `ttm_spend_usd` | – | number | Trailing-twelve-month vendor spend, USD. |

`(vendor_id)` is unique within a tenant.

## Real-world extract paths

The ingest accepts the same workbook regardless of source system. The
recipes below produce the columns above from each system.

### Oracle E-Business Suite / Fusion (GL + AP)

**Source tables / subject areas:**

* `GL_BALANCES` (or "GL — Account Balances" subject area in OTBI) — for budget and actual at the (period, account, project) grain.
* `PA_PROJECTS_ALL` / `PA_EXPENDITURES_ALL` (or "Project Costing" subject area) — for project-level cost rollup.
* `AP_INVOICES_ALL` + `PO_VENDORS` — for supplier spend and the vendor master.

**Procedure (Oracle Fusion ERP example):**

1. Open OTBI → Reports & Analytics → Catalog → create a new analysis on the **Project Costing - Real Time** subject area.
2. Add columns: `Project Number`, `Posting Date From`, `Posting Date To`, `Plan Amount`, `Actual Cost`, `Capital Cost`, `Operating Cost`, `Supplier ID`, `Cost Center`, `Natural Account`.
3. Filter to the fiscal periods you want to load (typically last 12 months, monthly).
4. Group / bucket by month. Run.
5. Action → Export → Excel → save as the **Program Financials** sheet of `template.xlsx`.
6. From the **Suppliers** work area, run a "Supplier Spend Analysis" report at the TTM grain. Export columns: `Supplier Number`, `Supplier Name`, `Cost Center`, `Natural Account`, `TTM Spend`. Paste into the **Vendor Spend** sheet.
7. Save as `<tenant>-<period>.xlsx` and upload.

**Notes:**

* If you maintain capital / operating classification on the project rather than the GL account, OTBI's "Capital Cost" and "Operating Cost" columns are already split. Otherwise derive them from the natural account range (capex accounts are typically `15xxx`–`17xxx` in standard Oracle COA).
* If the project carries multiple budgets (baselined vs current), use **Current Budget Amount** to populate `budget_usd`.

### SAP S/4HANA (CO-PA + Project System)

**Source tables / CDS views:**

* `ACDOCA` (Universal Journal) — for actuals at the (period, WBS, cost center, GL account) grain.
* `ACDOCP` — for plan (budget) values posted to the same dimensions.
* `LFA1` / `LFB1` — for the vendor master.

**Procedure (SAP S/4HANA Fiori):**

1. Open the **Manage Custom Analytical Queries** app (or the legacy **KE30** report path in CO-PA).
2. Build a custom query on `ACDOCA` joined with `ACDOCP`:
   * Dimensions: `WBS Element`, `Posting Date` (bucketed monthly), `Cost Center`, `Profit Center`, `Vendor Number`, `G/L Account`.
   * Measures: `Plan Amount` (from `ACDOCP`), `Actual Cost` (from `ACDOCA`).
3. Add a calculated column `Capital Expenditure` filtered to the asset-class accounts (typically GL group `0010*`–`0099*` for fixed-asset acquisition), and `Operating Expenditure` for the complement.
4. Restrict to the last 12 fiscal periods.
5. Export → CSV or Excel.
6. Map columns to template headers:
   * `WBS Element` → `program_id`
   * `Posting Date From` → `period_start`
   * `Posting Date To` → `period_end`
   * `Plan Amount` → `budget_usd`
   * `Actual Cost` → `actual_usd`
   * `Capital Expenditure` → `capex_usd`
   * `Operating Expenditure` → `opex_usd`
   * `Vendor Number` → `vendor_id`
   * `Cost Center` (or `Profit Center`) → `cost_center`
   * `G/L Account` → `gl_account`
7. From **Manage Suppliers** (`LFA1` / `LFB1`), export `Supplier ID`, `Supplier Name`, `Cost Center`, `G/L Account`, `TTM Spend`. Paste into the **Vendor Spend** sheet.

**Notes:**

* The parser auto-detects SAP-style headers ("WBS Element", "Profit Center", "Posting Date") and tags the rows with `source_system = 'sap_co_pa'` in `tower_program_financials.source_system`. You can override with `--source sap_co_pa` if your custom query renames headers.
* If you use ECC instead of S/4HANA, `CE1xxxx` (operating concern) replaces `ACDOCA` and `KE30` replaces the Manage Custom Analytical Queries app — the column mapping is otherwise the same.
* If your S/4HANA tenant uses the **Cloud** edition, the `Project Financial Controlling - Plan/Actual` analytical query already produces the right grain; export it directly to Excel.

## Loading the workbook

```bash
# Validate without writing
npx tsx src/scripts/tower/ingest-erp.ts \
  --client-id <tenant-uuid> --file /path/to/<tenant>-<period>.xlsx --dry-run

# Apply
npx tsx src/scripts/tower/ingest-erp.ts \
  --client-id <tenant-uuid> --file /path/to/<tenant>-<period>.xlsx

# Or load the synthetic Northwind dataset (for a demo tenant)
npx tsx src/scripts/tower/ingest-erp.ts \
  --client-id <demo-tenant-uuid> --sample
```

The CLI is idempotent. Re-running with the same file upserts on
`(client_id, program_id, period_start)` for financials and
`(client_id, vendor_id)` for vendors — repeat loads of an updated
monthly extract are safe.

## Data classification

Program budgets and vendor spend are **confidential**. The Tower
ingest registry entry marks this source `dataClass: 'confidential'`,
which causes redaction Layer 2 to gate exact-figure rollups behind the
financial-data role in any LLM-facing surface. Synthesis routes that
quote actuals re-prompt with redacted aggregates for non-financial
viewers.

See `docs/architecture/ABARVA_DATA_PROTECTION_CONTROLS_2026-05-14.md`
for the redaction tier model.
