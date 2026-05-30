# Healthcare AI Corpus Load Report · 2026-05-30

## Executive Summary

The healthcare-provider industry corpus has been expanded and loaded into the Azure/Postgres data plane.

| Metric | Result |
|---|---:|
| New authored seed files | 200 |
| New domains | 50 |
| New authored patterns | 10,000 |
| New persisted genome patterns | 10,000 |
| New persisted intelligence graph edges | 20,000 |
| New code range | H10000-H19999 |
| Total healthcare-provider patterns now in DB | 10,785 |
| Healthcare demo-relevant patterns now in DB | 6,872 |

## What This Corpus Emphasizes

This wave is not legacy IT filler. Every pattern is built around 2025-2026 healthcare AI decision pressure:

- AI innovation: ambient documentation, CAC/coding AI, prior auth AI, radiology AI, sepsis AI, digital therapeutics, RPM, trial matching, synthetic data, model monitoring.
- Startup ecosystem knowledge: vendor maturity, BAA/subprocessor posture, KLAS/referenceability, FDA clearance posture, Series B/runway risk, App Orchard/platform integration, implementation capacity.
- Agentic workflows: clinical operations agents, administrative copilots, finance/procurement agents, IT service-desk and EHR-build agents, scoped action permissions, audit trails, rollback controls.
- Moves usefulness: unsafe-to-fund gates, value ledgers, adoption plans, clinical governance checklists, pre-mortems, dependency maps, benefit validation plans.
- Source usefulness: RFI/RFP questions, BAA clauses, subprocessor schedules, model audit rights, deployment-site validation SLAs, adoption telemetry clauses, exit rights, BAFO counters.

## Quality Census

| Quality dimension | Count |
|---|---:|
| Patterns in new wave | 10,000 |
| Moves-anchored patterns | 10,000 |
| Source/procurement-anchored patterns | 10,000 |
| Startup ecosystem-anchored patterns | 10,000 |
| Agentic/copilot-anchored patterns | 2,549 |

## Current DB Pattern Counts By Vertical

| Vertical | Persisted patterns | Demo-relevant patterns |
|---|---:|---:|
| airline | 1,289 | 206 |
| banking | 180 | 118 |
| cross_industry | 150 | 125 |
| healthcare_provider | 10,785 | 6,872 |
| medtech | 100 | 81 |
| retail | 40 | 0 |

## New Healthcare Domains Loaded

| dom31 | Ambient Clinical Documentation & Scribing AI | middle_office | H10000-H10199 | ambient AI, clinical note automation, CDI specificity, HIPAA BAA, Epic Notes |
| dom32 | AI CDI & Coding Automation | middle_office | H10200-H10399 | CAC AI, ICD-10-CM, HCC v28, MS-DRG, physician query |
| dom33 | Prior Authorization AI & Utilization Management | middle_office | H10400-H10599 | prior auth AI, payer criteria, FHIR Prior Authorization, Da Vinci CRD, medical necessity |
| dom34 | Revenue Cycle Automation & Denial AI | middle_office | H10600-H10799 | denial AI, claim scrubber, 835 remittance, RCM automation, appeal workflow |
| dom35 | Patient Access, Scheduling & Digital Front Door AI | front_office | H10800-H10999 | digital front door, scheduling AI, patient matching, Epic Cadence, No Surprises Act |
| dom36 | Contact Center, Voice AI & Patient Concierge | front_office | H11000-H11199 | voice AI, patient concierge, IVR containment, Genesys, TCPA |
| dom37 | Agentic Care Navigation & Transitions | front_office | H11200-H11399 | care navigation agent, ADT feed, discharge follow-up, FHIR Tasks, readmission risk |
| dom38 | Population Health AI & VBC Risk Stratification | middle_office | H11400-H11599 | population health AI, ACO attribution, HEDIS, claims lag, VBC contract |
| dom39 | Clinical Decision Support & SaMD Governance | middle_office | H11600-H11799 | clinical decision support, FDA SaMD, override workflow, model validation, EHR alert |
| dom40 | Radiology, Imaging & AI Diagnostics | middle_office | H11800-H11999 | radiology AI, FDA 510(k), worklist prioritization, PACS, incidental finding |
| dom41 | Pathology, Lab & Genomics AI | middle_office | H12000-H12199 | pathology AI, LIS, CLIA, genomics, variant interpretation |
| dom42 | Pharmacy AI, Medication Safety & 340B | middle_office | H12200-H12399 | pharmacy AI, 340B, NDC, medication safety, split billing |
| dom43 | Nursing Workforce AI & Staffing Optimization | back_office | H12400-H12599 | nursing staffing AI, acuity scoring, CMS CoP, float pool, contract labor |
| dom44 | ED Flow, Capacity Command Center & Virtual Nursing | front_office | H12600-H12799 | ED flow AI, capacity command center, virtual nursing, boarding time, EMTALA |
| dom45 | Perioperative, OR Robotics & Surgical AI | middle_office | H12800-H12999 | OR scheduling AI, robotics, preference cards, block utilization, TJC |
| dom46 | Remote Patient Monitoring & Hospital-at-Home | front_office | H13000-H13199 | RPM, hospital-at-home, device telemetry, CMS waiver, care escalation |
| dom47 | Behavioral Health AI & Digital Therapeutics | front_office | H13200-H13399 | behavioral health AI, digital therapeutics, suicide risk, 42 CFR Part 2, telepsychiatry |
| dom48 | SDOH, Health Equity & Community Referral AI | front_office | H13400-H13599 | SDOH AI, health equity, closed-loop referral, Z codes, community resource |
| dom49 | Interoperability, FHIR, TEFCA & AI Agents | back_office | H13600-H13799 | FHIR R4, TEFCA, HL7 v2, agentic integration, ADT |
| dom50 | Data Platform, Lakehouse & AI Governance | back_office | H13800-H13999 | healthcare lakehouse, data lineage, FHIR bulk export, model registry, PHI |
| dom51 | Cybersecurity, Identity & Zero Trust AI | back_office | H14000-H14199 | healthcare cybersecurity, Zero Trust, HITRUST, identity governance, ransomware |
| dom52 | Cloud FinOps & Healthcare Platform Ops AI | back_office | H14200-H14399 | cloud FinOps, Azure, AWS, Epic cloud, Kubernetes |
| dom53 | Epic / Oracle Health Optimization & Build Agents | back_office | H14400-H14599 | Epic optimization, Oracle Health, build agent, order sets, EHR governance |
| dom54 | Quality Measures, Stars & HEDIS Automation | middle_office | H14600-H14799 | HEDIS, CMS Stars, quality measure AI, NCQA, gap closure |
| dom55 | Patient Safety, Sepsis & Deterioration AI | middle_office | H14800-H14999 | sepsis AI, deterioration model, alert fatigue, TJC, clinical governance |
| dom56 | Compliance, Privacy, HIPAA & BAA AI Controls | back_office | H15000-H15199 | HIPAA, BAA, subprocessor, AI privacy, minimum necessary |
| dom57 | Payer-Provider Collaboration & API Ecosystem AI | middle_office | H15200-H15399 | payer API, HL7 Da Vinci, FHIR payer data, MCO, prior auth |
| dom58 | Value-Based Contracting & Actuarial AI | back_office | H15400-H15599 | actuarial AI, risk adjustment, shared savings, MCO contract, stop-loss |
| dom59 | Home Health & Post-Acute Agentic Workflows | front_office | H15600-H15799 | home health, post-acute, SNF, agentic workflow, OASIS |
| dom60 | Supply Chain, Procurement & Purchased Services AI | back_office | H15800-H15999 | healthcare supply chain, GHX, Vizient, contract compliance, AI sourcing |
| dom61 | Startup Ecosystem: Ambient AI Vendor Diligence | middle_office | H16000-H16199 | Abridge, Nuance DAX, Suki, Nabla, BAA |
| dom62 | Startup Ecosystem: RCM & Coding Vendor Diligence | middle_office | H16200-H16399 | Cohere Health, Waystar, AKASA, RCM startup, contract SLA |
| dom63 | Startup Ecosystem: Virtual Care & RPM Vendor Diligence | front_office | H16400-H16599 | TytoCare, Current Health, Biofourmis, RPM startup, device integration |
| dom64 | Startup Ecosystem: Clinical AI & FDA Diligence | middle_office | H16600-H16799 | Aidoc, Viz.ai, PathAI, FDA clearance, clinical AI startup |
| dom65 | Startup Ecosystem: Cyber, Identity & Trust Diligence | back_office | H16800-H16999 | Claroty, Wiz, Ordr, identity startup, HITRUST |
| dom66 | Agentic AI: Clinical Operations Orchestrators | middle_office | H17000-H17199 | clinical operations agent, workflow orchestration, EHR action, human-in-the-loop, audit trail |
| dom67 | Agentic AI: Administrative Copilots | back_office | H17200-H17399 | administrative copilot, task automation, HR service delivery, policy retrieval, approval workflow |
| dom68 | Agentic AI: Finance & Procurement Agents | back_office | H17400-H17599 | procurement agent, invoice AI, contract analytics, ERP workflow, approval gate |
| dom69 | Agentic AI: IT Service Desk & EHR Build Agents | back_office | H17600-H17799 | IT service desk agent, EHR build agent, ServiceNow, change control, CAB |
| dom70 | AI Governance Operating Model & Model Registry | back_office | H17800-H17999 | AI governance, model registry, NIST AI RMF, HIPAA, clinical validation |
| dom71 | Model Monitoring, Drift & Deployment Validation | middle_office | H18000-H18199 | model drift, deployment-site validation, MLOps, shadow mode, calibration |
| dom72 | AI Adoption, Change Management & Clinician Trust | middle_office | H18200-H18399 | AI adoption, clinician trust, training, workflow redesign, change management |
| dom73 | AI ROI, Value Realization & Benefit Tracking | back_office | H18400-H18599 | AI ROI, value realization, benefits ledger, adoption telemetry, finance validation |
| dom74 | Synthetic Data, De-Identification & Privacy-Preserving AI | back_office | H18600-H18799 | synthetic data, de-identification, Safe Harbor, Expert Determination, PHI |
| dom75 | HIE, Public Health Reporting & Surveillance AI | middle_office | H18800-H18999 | HIE, public health reporting, eCR, TEFCA, syndromic surveillance |
| dom76 | Academic Medical Center Research AI | middle_office | H19000-H19199 | research AI, IRB, clinical trial matching, OMOP, academic medical center |
| dom77 | Precision Medicine & Trial Matching AI | middle_office | H19200-H19399 | precision medicine, trial matching, genomics, FHIR Genomics, molecular tumor board |
| dom78 | Medicaid, MCO Operations & Social Care AI | front_office | H19400-H19599 | Medicaid, MCO, social care, managed care, eligibility |
| dom79 | Rural Health & Access Innovation AI | front_office | H19600-H19799 | rural health, telehealth, provider shortage, CAH, broadband |
| dom80 | Board Strategy, Innovation Portfolio & Venture Partnerships | back_office | H19800-H19999 | innovation portfolio, venture partnership, AI strategy, board governance, portfolio value |

## DB Verification

| Check | Result |
|---|---:|
| Numeric code-range count H10000-H19999 | 10,000 |
| Min code | H10000 |
| Max code | H19999 |
| Intelligence graph edges for wave | 20,000 |
| Domains with exactly 200 patterns | 50 / 50 |

## Notes

- The load used the durable Azure/Postgres genome seed loader: `scripts/corpus/load-authored-genome-seeds.ts`.
- The first attempted load from the temp worktree stopped before writes because env was absent; the successful load used the working `DATABASE_URL` fallback from the main repo environment.
- The older healthcare corpus remains in place; this wave adds a new H10000-H19999 band rather than rewriting historical H-code patterns.

## Retrieval Smoke

| Topic | Hits in new wave |
|---|---:|
| ambient AI | 280 |
| prior auth AI | 80 |
| agentic workflow | 200 |
| BAA | 2,444 |
| Abridge | 80 |
| Cohere Health | 80 |
| model registry | 821 |
| value realization | 1,289 |

Smoke artifact: `verification/corpus-load/2026-05-30-healthcare-ai-corpus-retrieval-smoke.json`.
