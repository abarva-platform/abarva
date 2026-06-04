# AI tooling and model inventory - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `ai-tool-footprint`
Dimension: `ai_tooling_model_inventory`
Rows generated: 42
Owner role: AI Governance Lead
Accepted formats: csv, xlsx, json

## Required fields

- `tool_id`
- `tool_name`
- `owner_role`
- `workflow`
- `risk_classification`

## Columns in generated file

- `tool_id`
- `tool_name`
- `owner_role`
- `workflow`
- `risk_classification`
- `model_name`
- `regulated_workflow_flag`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
