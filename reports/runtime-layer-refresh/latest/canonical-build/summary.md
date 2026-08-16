# Canonical Tenant Data Build

Generated: 2026-08-16T11:26:36.536Z

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
- Accepted canonical records: 6,198
- Quarantined canonical records: 0
- Evidence attachments: 6,198
- Relationship candidates: 12,184
- Placeholder rejections/gaps: 4,205
- Archive/legacy read violations: 0
- Error findings: 0

## Tenants

| Tenant          | Source files | Source rows | Accepted records | Relationship candidates | Profile | Home/aVa ready |
| --------------- | -----------: | ----------: | ---------------: | ----------------------: | ------- | -------------- |
| Meridian Health |           24 |       3,887 |            1,471 |                   5,635 | ready   | ready          |
| Airline Demo    |           26 |       5,789 |            4,727 |                   6,549 | ready   | ready          |

## Domain Counts

| Tenant          | Domain                         | Source rows | Accepted records | Skipped rows | Duplicate names |
| --------------- | ------------------------------ | ----------: | ---------------: | -----------: | --------------: |
| Meridian Health | enterprise_profile             |           1 |                1 |            0 |               0 |
| Meridian Health | business_functions             |          24 |               24 |            0 |               0 |
| Meridian Health | org_ownership                  |         225 |              225 |            0 |               0 |
| Meridian Health | workforce_roles                |          45 |               45 |            0 |               0 |
| Meridian Health | applications_systems           |         301 |              301 |            0 |               0 |
| Meridian Health | data_assets_integrations       |         520 |              520 |            0 |               0 |
| Meridian Health | infrastructure_platforms       |          60 |               60 |            0 |               0 |
| Meridian Health | vendors_contracts              |          72 |               72 |            0 |               0 |
| Meridian Health | spend_value                    |          24 |               24 |            0 |               0 |
| Meridian Health | programs_initiatives           |          28 |               28 |            0 |               0 |
| Meridian Health | ai_automation_use_cases        |          18 |               18 |            0 |               0 |
| Meridian Health | risks_controls                 |          40 |               40 |            0 |               0 |
| Meridian Health | relationships                  |       2,302 |                0 |        2,302 |               0 |
| Meridian Health | evidence_sources               |          27 |               27 |            0 |               0 |
| Meridian Health | metrics_outcomes               |          50 |               50 |            0 |               0 |
| Meridian Health | industry_context_patterns      |          12 |               12 |            0 |               0 |
| Meridian Health | expert_lenses                  |           9 |                9 |            0 |               0 |
| Meridian Health | service_scope_managed_services |          15 |               15 |            0 |               0 |
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
