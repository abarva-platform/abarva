# FY2025 Synthetic Trend Baselines

Generated file per tenant:

`derived/tower_financial_amounts_fy2025_trend.csv`

## Purpose

These rows provide one prior-year baseline so Tower can show trend direction
without waiting for a real client historical export. They are demo trend rows,
not client-attested financial history.

## Rules

- `period` is always `fy25`.
- `value_source` is always `synthetic`.
- `formula_version` is always `tower_synthetic_fy2025_trend_v1`.
- `formula` references the FY2026 source row and multiplier used.
- Headline totals must use rows where `amount_type = none` and `component_of`
  is empty.
- Run/change and CapEx/OpEx charts may use component rows, but must never sum
  component rows together with headline rows.
- Replace these rows with client-provided FY2025 actuals when available.

## Tenant Multipliers

The generator uses conservative tenant-specific backcast multipliers to create
directional FY2025 baselines from FY2026 source rows.

| Tenant | IT budget | Initiative budget | Value | Vendor |
|---|---:|---:|---:|---:|
| apex-retail | 0.935 | 0.58 | 0.42 | 0.91 |
| first-capital-financial | 0.945 | 0.61 | 0.46 | 0.93 |
| lakeshore-industries | 0.925 | 0.52 | 0.38 | 0.90 |
| meridian-health | 0.940 | 0.55 | 0.40 | 0.92 |
| skyharbor-air | 0.915 | 0.50 | 0.36 | 0.89 |

## Regeneration

Run:

```bash
node scripts/tower/generate-fy2025-trend-synthetic.mjs
```

Summary files are written under:

`reports/tower-fy2025-trend/`
