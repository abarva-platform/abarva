# Validation Report

Tenant: `airline-demo-new`  
Package: `airline-demo-new-source-corpus-v1.0.0`  
Status: PASS

| Check | Result | Detail |
|---|---:|---|
| application_target | PASS | 1495 applications/platforms, target 1,200-1,600. |
| integration_target | PASS | 6200 integrations/interfaces, target 5,000-8,000. |
| infra_target | PASS | 10000 infrastructure/cloud/mainframe rows, target 8,000-15,000. |
| data_target | PASS | 1250 data products/stores, target 1,000-1,500. |
| bi_target | PASS | 6200 BI reports/dashboards, target 5,000-7,500. |
| vendor_contract_target | PASS | 420 vendors and 820 contracts/SOWs. |
| workforce_program_risk_control_kpi_target | PASS | 9500 workforce, 190 programs, 650 risks, 1900 controls, 420 KPIs/SLAs. |
| relationship_target | PASS | 60000 relationship candidates, target 50,000-80,000. |
| tech_stack_diversity | PASS | Mainframe, SAP-style ERP, Teradata-scale analytics, AWS/Azure, private cloud and data center patterns are represented. |
| operational_chains | PASS | IROPS, crew, MRO and airport/station operational chains are represented. |
| source_family_strategy | PASS | Realistic source-family strategy avoids one workbook per object while carrying enterprise-scale rows. |
| hidden_truth_boundary | PASS | Boundary matrix separates parser-visible corpus from restricted evaluator truth/crosswalk. |
| forbidden_existing_tenant_absent | PASS | No forbidden prior-tenant, real-carrier or off-industry terms found outside validation artifacts. |
| no_azure_apply | PASS | No Azure apply, DB create or runtime mutation command appears in package text. |

## Scale summary

| Domain | Count |
|---|---:|
| Applications/platforms | 1495 |
| Integrations/interfaces | 6200 |
| Infrastructure/cloud/mainframe rows | 10000 |
| Data products/stores | 1250 |
| BI reports/dashboards | 6200 |
| Vendors | 420 |
| Active contracts/SOWs | 820 |
| Technology employees/contractors | 9500 |
| Major programs | 190 |
| Risks | 650 |
| Controls | 1900 |
| KPIs/SLAs | 420 |
| Canonical relationship candidates | 60000 |

## Boundary statement

This validation proves package shape, scale-depth and design boundaries only. It does not prove Azure resources, database migrations, parser output, product retrieval, or live UI behavior because those actions are intentionally out of scope for this task.
