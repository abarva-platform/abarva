# PHS Population Health Command Center — Architecture Pattern Setter

Date: 2026-06-05
Status: Target architecture contract

## Architecture Thesis

The target architecture is an Azure Databricks lakehouse that unifies payer and
provider evidence while preserving PHI governance, evidence traceability, and
human approval. The point is not to move tables. The point is to create trusted
data products that support clinical performance, population health, quality,
plan economics, and executive decisions.

## Required Architecture Elements

| Layer | Required pattern |
|---|---|
| Landing / bronze | Source-preserving ingestion with source system, extract timestamp, load batch, checksum, sensitivity, and evidence key |
| Silver | Conformed patient/member, encounter, provider, department, location, payer, claim, medication, lab, diagnosis, procedure, order, attribution, quality, and finance entities |
| Gold | Business-ready data products for care gaps, total cost of care, Stars / quality, utilization, patient access, provider performance, service-line margin, and intervention worklists |
| Governance | Unity Catalog or equivalent PHI tagging, row/column policy, masking, lineage, approval groups, and audit |
| AI / ML | Feature store, model registry, model monitoring, drift checks, human review queue, incident trail |
| Operations | Pipeline run ledger, reconciliation checks, freshness SLA, data quality score, DBU/TCO tags, owner escalation |

## Evidence Inputs

| Evidence key family | Required before generated architecture can be decision-grade |
|---|---|
| PHS-PUBLIC | Public PHS facts and public economic/quality context |
| MRD-WORKLOAD | Synthetic Meridian workload inventory with domain, source, owner, disposition, and criticality |
| MRD-DQ | Synthetic data quality baseline with completeness, timeliness, identity, coding, claims lag, and trust score |
| MRD-RATE | Rate-card and estimation assumptions |
| MRD-GATE | Phase criteria and blocker status |
| MRD-APPROVAL | Named synthetic owners and approval records |

## Data Product Map

| Data product | Primary consumers | Source families | Gold output |
|---|---|---|---|
| Patient/member 360 | Care management, quality, access | Epic, claims, eligibility, provider roster, SDOH | unified longitudinal member profile |
| Care-gap closure | Plan quality, clinical quality, care teams | HEDIS/Stars, Epic, claims, pharmacy | measure gaps, owner, next action, evidence |
| Avoidable utilization | Plan COO, CMO, CFO | ED, inpatient, claims, care management | cohort risk, avoidable event logic, intervention queue |
| Total cost of care | CFO, plan actuary, service line | claims, finance, contracts, attribution | PMPM, trend, drivers, cohort economics |
| Access command center | COO, ambulatory ops | scheduling, referral, contact center, provider roster | access bottlenecks, leakage, no-show, capacity |
| Quality and safety | CMO, quality leader | clinical events, measures, incident data | quality performance, risk, measure evidence |

## Architecture Answer Standard

Generated architecture artifacts must:

- lead with the executive decision the architecture supports
- separate public facts, synthetic internal evidence, and assumptions
- cite evidence keys for material claims
- use planning ranges when inventory is missing
- avoid exact Epic table, ERP object, interface, report, or job counts until loaded
- name owners and approval gates
- end with the next artifact or approval action

## Anti-Patterns

- Architecture diagram with no workload inventory behind it
- Gold mart list with no owner or consumer
- Unity Catalog mentioned as a logo rather than a policy/lineage control
- AI worklists without clinical governance and human approval
- Databricks cost discussion without DBU/TCO tags and FinOps owner
