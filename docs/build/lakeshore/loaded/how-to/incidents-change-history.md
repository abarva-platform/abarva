# Incidents and ops telemetry - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `incidents-change-history`
Dimension: `incidents_ops_telemetry`
Rows generated: 96
Owner role: VP IT Operations
Accepted formats: csv, json, jsonl

## Required fields

- `incident_id`
- `system_id`
- `severity`
- `opened_at`

## Columns in generated file

- `incident_id`
- `system_id`
- `severity`
- `opened_at`
- `closed_at`
- `root_cause`
- `business_service`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
