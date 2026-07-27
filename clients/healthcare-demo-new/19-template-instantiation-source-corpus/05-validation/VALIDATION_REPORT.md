# Validation Report

Tenant: `healthcare-demo-new`  
Package: `healthcare-demo-new-source-corpus-v1.0.0`  
Status: PASS

| Check | Result | Detail |
|---|---:|---|
| application_target | PASS | 1670 applications/platforms, target 1,300-1,700. |
| interface_target | PASS | 8400 interfaces/data feeds, target 7,000-10,000. |
| infra_target | PASS | 12500 infrastructure/cloud rows, target 10,000-15,000. |
| sql_target | PASS | 2050 SQL Server databases/marts/assets, target 1,500-2,500. |
| data_target | PASS | 1500 data products/stores, target 1,200-1,800. |
| bi_target | PASS | 8600 BI reports/dashboards, target 7,000-10,000. |
| vendor_contract_target | PASS | 480 vendors and 980 contracts/SOWs. |
| relationship_target | PASS | 85000 relationship candidates, target 70,000-100,000. |
| epic_depth | PASS | Epic modules, environments and analytics/interface dependencies are represented. |
| sql_legacy_depth | PASS | SQL Server and legacy EDW estate represented. |
| cloud_posture | PASS | Azure-current/AWS-future posture represented. |
| medicare_assumption_boundary | PASS | Medicare/MA assumption is tenant-specific, not industry-wide. |
| source_evidence_families | PASS | Structured proposal, pricing, rate-card, staffing, invoice, change-order, incident, SLA, BAFO, commitment, evaluation and decision evidence families are present. |
| reconstruction_ledger | PASS | 425 reconstruction-ledger rows include required objects and intentional non-reconstructable review cases. |
| no_other_tenant_leak | PASS | No blocked existing tenant or real-carrier terms found in parser-visible package text. |
| no_azure_apply | PASS | No Azure apply, DB create or runtime mutation command appears. |

## Boundary Statement

This validates package shape and design-level scale only. It does not prove Azure resources, Postgres migrations, parser output, product retrieval, semantic reconstruction or live UI behavior.

