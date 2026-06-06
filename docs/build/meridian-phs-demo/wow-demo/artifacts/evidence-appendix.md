# Evidence Appendix — AI-enabled Population Health & Clinical Performance Command Center

**Tenant:** Meridian Health System (synthetic)

> Synthetic, Meridian/PHS-inspired pilot context. Not real confidential PHS data.

Every claim in this Move's artifacts traces to a loaded Meridian context file
(governed admin context loader path, tenant `meridian-health`). No seed-side
shortcuts. Nothing here is real confidential PHS data.

| Claim area                    | Loaded source file                      | Use-case evidence ref        |
| ----------------------------- | --------------------------------------- | ---------------------------- |
| Care-gap & analytics baseline | `plan-provider-analytics.csv`           | use_case_evidence: MR-UC-015 |
| Value-based care panel        | `value-based-care-panel.csv`            | use_case_evidence: MR-UC-007 |
| Population-health risk panels | `population-health-risk-panels.csv`     | use_case_evidence: MR-UC-006 |
| Lakehouse target model        | `databricks-lakehouse-target-model.csv` | use_case_evidence: MR-UC-014 |
| Clinical AI model inventory   | `clinical-ai-model-inventory.csv`       | use_case_evidence: MR-UC-004 |
| KPI baselines                 | `kpi-library.csv`                       | use_case_evidence: MR-UC-018 |
| AMS / vendor contracts        | `ams-vendor-contracts.csv`              | use_case_evidence: MR-UC-016 |
| AI governance decisions       | `governance-committee-decisions.csv`    | use_case_evidence: MR-UC-012 |
| HIPAA AI controls             | `hipaa-ai-controls.csv`                 | use_case_evidence: MR-UC-013 |
| Org decision rights           | `org-structure-decision-rights.csv`     | use_case_evidence: MR-UC-028 |

## How to verify

1. Admin Context Layer → filter tenant `meridian-health` → confirm the source
   files above are present and embedded (873 embedded, 0 pending, 0 failed).
2. Intelligence (Sentinel) → ask a hard question from the golden deck and
   confirm the answer cites these evidence fields.
3. Strategic Move → Documents tab → open each phase deliverable and the
   artifacts in this folder.
