# Business unit segment P&L - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `segment-pnl`
Dimension: `business_units_segment_pnl`
Rows generated: 40
Owner role: CFO FP&A
Accepted formats: xlsx, csv

## Required fields

- `segment`
- `revenue_usd`
- `gross_margin_pct`
- `operating_margin_pct`

## Columns in generated file

- `segment`
- `revenue_usd`
- `gross_margin_pct`
- `operating_margin_pct`
- `r_and_d_usd`
- `sg_and_a_usd`
- `period`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
