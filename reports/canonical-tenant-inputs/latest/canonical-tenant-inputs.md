# Canonical Tenant Inputs

Generated: 2026-08-16T11:40:41.098Z

## Guardrails

- productionTenantDataWritten: false
- activeTenantAccessLayerUpdated: false
- moduleRuntimeBehaviorChanged: false
- oneUniversalFilePerDomainPerTenant: true
- noVersionedFilesUnderActiveCurrent: true
- noNestedPacketFoldersUnderActiveCurrent: true
- northstarActive: false

## Active Tenant Input Roots

| Tenant | Canonical root | Packets | Universal CSV files | Files | CSV rows |
| --- | --- | ---: | ---: | ---: | ---: |
| Meridian Health | `datasets/tenant-inputs/active/meridian-health/current` | 1 | 24/19 | 24 | 3,887 |
| Airline Demo | `datasets/tenant-inputs/active/skyharbor-air/current` | 1 | 26/19 | 31 | 5,792 |

## Packet Detail

| Tenant | Packet | Path | CSV files | CSV rows | Status |
| --- | --- | --- | ---: | ---: | --- |
| Meridian Health | current-universal-integrated-healthcare | `datasets/tenant-inputs/active/meridian-health/current` | 24 | 3,887 | active-input |
| Airline Demo | current-universal | `datasets/tenant-inputs/active/skyharbor-air/current` | 26 | 5,792 | active-input |

## Retired / Archived Tenants

| Tenant | Status | Archive paths | Reason |
| --- | --- | --- | --- |
| Northstar Clinical | retired-excluded | External/git history only | Operator instruction: there should be no Northstar active tenant. Legacy source files are no longer retained in loader-visible repository paths. |
| Healthcare Demo | retired-excluded | External/git history only | Merged into meridian-health as the sole active integrated healthcare tenant; historical rollback via git history or external archive. No runtime/data-plane activation performed by this repo-local integration. |
| Apex Retail | retired-excluded | External/git history only |  |
| FS Demo | retired-excluded | External/git history only |  |
| Lakeshore Holdings | retired-excluded | External/git history only |  |
| Lakeshore Industries | retired-excluded | External/git history only |  |

## Legacy Roots Pending Mechanical Cleanup

None.

## Legacy Roots Archived

| From | To |
| --- | --- |

## Failures

- meridian-health: extra active CSV files outside universal template set: 19_data_analytics_platform_maturity.csv, SA08_AI_Benefits_Realization_Usage_Ledger.csv, SA09_AI_Tool_Usage_Feed.csv, SA10_AI_Value_Interview_Evidence.csv, SA11_AI_KPI_Operational_Outcome_Feed.csv
- skyharbor-air: extra active CSV files outside universal template set: 12b_interview_initiative_metric_crosswalk.csv, 19_data_analytics_platform_maturity.csv, 20_itsm_ticket_sla_performance.csv, SA08_AI_Benefits_Realization_Usage_Ledger.csv, SA09_AI_Tool_Usage_Feed.csv, SA10_AI_Value_Interview_Evidence.csv, SA11_AI_KPI_Operational_Outcome_Feed.csv
