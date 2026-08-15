# Canonical Tenant Data Build

Generated: 2026-08-15T17:56:30.829Z

## Truth Split

- This is an inactive, deterministic file-based build from canonical tenant inputs.
- No production tenant data was written.
- The Active Tenant Access Layer was not updated.
- No candidate was promoted.
- No module runtime reads changed.

## Summary

- Source root: `datasets/tenant-inputs/active`
- Template set: `universal-tenant-input-standard-2026-07-v3`
- Tenants processed: 2
- Accepted canonical records: 9,786
- Quarantined canonical records: 0
- Evidence attachments: 9,786
- Relationship candidates: 6,722
- Placeholder rejections/gaps: 2,974
- Archive/legacy read violations: 0
- Error findings: 0

## Tenants

| Tenant          | Source files | Source rows | Accepted records | Relationship candidates | Profile | Home/aVa ready |
| --------------- | -----------: | ----------: | ---------------: | ----------------------: | ------- | -------------- |
| Meridian Health |           25 |       5,408 |            5,059 |                     173 | ready   | ready          |
| Airline Demo    |           26 |       5,789 |            4,727 |                   6,549 | ready   | ready          |

## Domain Counts

| Tenant          | Domain                         | Source rows | Accepted records | Skipped rows | Duplicate names |
| --------------- | ------------------------------ | ----------: | ---------------: | -----------: | --------------: |
| Meridian Health | enterprise_profile             |           2 |                2 |            0 |               1 |
| Meridian Health | business_functions             |         252 |              252 |            0 |              91 |
| Meridian Health | org_ownership                  |         228 |              228 |            0 |               0 |
| Meridian Health | workforce_roles                |         238 |              238 |            0 |              91 |
| Meridian Health | applications_systems           |         324 |              324 |            0 |              91 |
| Meridian Health | data_assets_integrations       |         315 |              315 |            0 |              92 |
| Meridian Health | infrastructure_platforms       |          15 |               15 |            0 |               0 |
| Meridian Health | vendors_contracts              |         467 |              467 |            0 |              91 |
| Meridian Health | spend_value                    |         298 |              298 |            0 |               0 |
| Meridian Health | programs_initiatives           |         376 |              376 |            0 |             105 |
| Meridian Health | ai_automation_use_cases        |         251 |              251 |            0 |             105 |
| Meridian Health | risks_controls                 |         249 |              249 |            0 |              91 |
| Meridian Health | relationships                  |       1,037 |            1,037 |            0 |               0 |
| Meridian Health | evidence_sources               |         508 |              508 |            0 |               5 |
| Meridian Health | metrics_outcomes               |         257 |              257 |            0 |               0 |
| Meridian Health | industry_context_patterns      |           7 |                7 |            0 |               0 |
| Meridian Health | expert_lenses                  |           7 |                7 |            0 |               0 |
| Meridian Health | service_scope_managed_services |         228 |              228 |            0 |               0 |
| Meridian Health | operational_process_evidence   |           0 |                0 |            0 |               0 |
| Airline Demo    | enterprise_profile             |           1 |                1 |            0 |               0 |
| Airline Demo    | business_functions             |          22 |               22 |            0 |               0 |
| Airline Demo    | org_ownership                  |         153 |              153 |            0 |               0 |
| Airline Demo    | workforce_roles                |          38 |               38 |            0 |               0 |
| Airline Demo    | applications_systems           |         503 |              503 |            0 |               0 |
| Airline Demo    | data_assets_integrations       |         499 |              499 |            0 |             189 |
| Airline Demo    | infrastructure_platforms       |          33 |               33 |            0 |               0 |
| Airline Demo    | vendors_contracts              |          65 |               65 |            0 |               0 |
| Airline Demo    | spend_value                    |          20 |               20 |            0 |               0 |
| Airline Demo    | programs_initiatives           |          28 |               28 |            0 |               0 |
| Airline Demo    | ai_automation_use_cases        |          13 |               13 |            0 |               0 |
| Airline Demo    | risks_controls                 |          44 |               44 |            0 |               0 |
| Airline Demo    | relationships                  |       3,318 |            3,071 |          247 |               0 |
| Airline Demo    | evidence_sources               |         183 |              183 |            0 |               0 |
| Airline Demo    | metrics_outcomes               |          26 |               26 |            0 |               0 |
| Airline Demo    | industry_context_patterns      |          10 |               10 |            0 |               0 |
| Airline Demo    | expert_lenses                  |           7 |                7 |            0 |               0 |
| Airline Demo    | service_scope_managed_services |          11 |               11 |            0 |               0 |
| Airline Demo    | operational_process_evidence   |           0 |                0 |            0 |               0 |

## Proof Files

- `tenant-build-index.json`
- `canonical-records-summary.json`
- `evidence-attachment-summary.json`
- `relationship-candidates-summary.json`
- `enterprise-profile-build.json`
- `placeholder-rejection-report.json`
- `tenant-gaps.json`
- `tenant-quality-depth.json`
- `home-ava-readiness.json`
- `source-path-enforcement.json`
- `archive-read-violations.json`
- `all-tenant-build-control.html`
