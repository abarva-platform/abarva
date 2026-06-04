# Regulatory / QMS / risk - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `qms-events`
Dimension: `regulatory_qms_risk`
Rows generated: 62
Owner role: Chief Quality Officer
Accepted formats: csv, xlsx, pdf

## Required fields

- `event_id`
- `event_type`
- `product_family_id`
- `severity`
- `opened_at`

## Columns in generated file

- `event_id`
- `event_type`
- `product_family_id`
- `severity`
- `opened_at`
- `capa_id`
- `audit_reference`
- `opco`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
