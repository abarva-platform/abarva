# Integration topology - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `integration-topology`
Dimension: `integration_topology`
Rows generated: 96
Owner role: VP Enterprise Architecture
Accepted formats: json, jsonl, csv

## Required fields

- `edge_id`
- `source_app_id`
- `target_app_id`
- `integration_type`

## Columns in generated file

- `edge_id`
- `source_app_id`
- `target_app_id`
- `integration_type`
- `latency_sla`
- `kill_blocker_flag`
- `data_domain`
- `criticality`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
