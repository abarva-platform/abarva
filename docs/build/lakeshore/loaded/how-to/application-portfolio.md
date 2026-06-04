# CMDB / application portfolio - Lakeshore Load Guide

SYNTHETIC / ILLUSTRATIVE.

Template ID: `application-portfolio`
Dimension: `application_portfolio`
Rows generated: 228
Owner role: VP Enterprise Architecture
Accepted formats: csv, xlsx

## Required fields

- `app_id`
- `name`
- `criticality`
- `owner_role`
- `system_of_record`

## Columns in generated file

- `app_id`
- `name`
- `criticality`
- `owner_role`
- `system_of_record`
- `ams_vendor`
- `time_classification`
- `platform`
- `hosting_model`
- `data_classification`
- `source_system`
- `source_record_id`
- `source_owner`
- `last_validated_date`
- `confidence`
- `evidence_usable`
- `notes_gaps`

## Loader note

Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.
