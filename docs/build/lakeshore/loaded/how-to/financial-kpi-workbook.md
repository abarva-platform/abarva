# Financial KPI workbook - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `financial-kpi-workbook`
Dimension: `financial_kpis`
Rows generated: 240
Owner role: CFO
Accepted formats: xlsx, csv

## Required fields

- `period`
- `metric`
- `value`
- `currency_or_unit`
- `segment`

## Columns in generated file

- `period`
- `metric`
- `value`
- `currency_or_unit`
- `segment`
- `margin_bridge_driver`
- `source_report`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
