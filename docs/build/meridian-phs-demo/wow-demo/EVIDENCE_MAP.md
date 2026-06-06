# Meridian / PHS Demo — Evidence Map

Maps demo claims to the loaded Meridian context files (governed admin context
loader, tenant `meridian-health`) and the use-case evidence register refs. All
files are synthetic.

> No claim in the demo should be made without a row in this map. Nothing here is
> real confidential PHS data.

## Claim → source file → evidence ref

| Demo claim area                 | Loaded source file (17-upload-templates)      | Segment                           | Use-case ref          |
| ------------------------------- | --------------------------------------------- | --------------------------------- | --------------------- |
| Enterprise identity & scale     | `enterprise-profile.yaml`                     | enterprise_profile                | MR-UC-030             |
| Org decision rights & vacancies | `org-structure-decision-rights.csv`           | org_structure                     | MR-UC-028             |
| Application portfolio risk      | `application-portfolio.csv`                   | it_landscape                      | MR-UC-026             |
| Epic optimization backlog       | `epic-optimization-backlog.csv`               | it_landscape                      | MR-UC-017             |
| ERP / data estate               | `erp-data-estate.csv`                         | it_landscape                      | MR-UC-029             |
| KPI baselines                   | `kpi-library.csv`                             | program_inventory                 | MR-UC-018             |
| Databricks lakehouse target     | `databricks-lakehouse-target-model.csv`       | it_landscape                      | MR-UC-014             |
| Plan/provider analytics gaps    | `plan-provider-analytics.csv`                 | program_inventory                 | MR-UC-015             |
| Value-based care panel          | `value-based-care-panel.csv`                  | program_inventory                 | MR-UC-007             |
| Population-health risk panels   | `population-health-risk-panels.csv`           | program_inventory                 | MR-UC-006             |
| Ambient documentation pilot     | `ambient-documentation-pilot.csv`             | program_inventory                 | MR-UC-001             |
| Prior-auth & denials value      | `prior-auth-workqueue.csv`, `rcm-denials.csv` | program_inventory / it_financials | MR-UC-002 / MR-UC-003 |
| Clinical AI model inventory     | `clinical-ai-model-inventory.csv`             | it_landscape                      | MR-UC-004             |
| AI governance decisions         | `governance-committee-decisions.csv`          | program_inventory                 | MR-UC-012             |
| HIPAA AI controls               | `hipaa-ai-controls.csv`                       | it_landscape                      | MR-UC-013             |
| AMS / vendor contracts          | `ams-vendor-contracts.csv`                    | it_financials                     | MR-UC-016             |
| Care-management staffing        | `care-management-staffing.csv`                | org_structure                     | MR-UC-019             |
| Clinical/interop data contracts | `clinical-data-contracts.csv`                 | it_landscape                      | MR-UC-020             |
| Service-line P&L                | `service-line-pnl.csv`                        | it_financials                     | MR-UC-023             |
| Downtime / cyber readiness      | `security-downtime-readiness.csv`             | it_landscape                      | MR-UC-021             |
| Use-case evidence register      | `use-case-evidence-register.csv`              | program_inventory                 | (index)               |

## Hero Move deliverable → evidence

| Deliverable                    | Evidence files                                                                |
| ------------------------------ | ----------------------------------------------------------------------------- |
| P1 Charter                     | plan-provider-analytics, value-based-care-panel                               |
| P2 Discovery Brief             | plan-provider-analytics, kpi-library, clinical-ai-model-inventory             |
| P3 Target-State Architecture   | databricks-lakehouse-target-model, clinical-data-contracts, hipaa-ai-controls |
| P4 Business Case & Value Model | service-line-pnl, plan-provider-analytics, ams-vendor-contracts               |
| P5 Mobilization / RACI         | org-structure-decision-rights, care-management-staffing                       |
| P5 Value-Measurement Contract  | kpi-library, value-based-care-panel, governance-committee-decisions           |

## Embedding evidence

`../MERIDIAN_AZURE_EMBED_DRAIN_EVIDENCE_2026-06-06.md` — 873 embedded / 0
pending / 0 failed (verified against Azure Log Analytics).
