# Site and plant inventory - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `site-and-plant-inventory`
Dimension: `manufacturing_sites`
Rows generated: 56
Owner role: COO
Accepted formats: csv, xlsx

## Required fields

- `site_id`
- `country`
- `business_unit`
- `primary_system`
- `validated_system_flag`

## Columns in generated file

- `site_id`
- `country`
- `business_unit`
- `primary_system`
- `validated_system_flag`
- `quality_cost_usd`
- `capacity_utilization_pct`
- `region`
- `site_type`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
