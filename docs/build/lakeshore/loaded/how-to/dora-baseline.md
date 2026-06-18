# Delivery / DORA / DevEx - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `dora-baseline`
Dimension: `delivery_dora_devex`
Rows generated: 84
Owner role: VP Engineering
Accepted formats: csv, xlsx, json

## Required fields

- `team_id`
- `measured_at`
- `deploy_freq_per_week`
- `lead_time_hours`

## Columns in generated file

- `team_id`
- `measured_at`
- `deploy_freq_per_week`
- `lead_time_hours`
- `mttr_hours`
- `change_failure_rate_pct`
- `product_area`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
