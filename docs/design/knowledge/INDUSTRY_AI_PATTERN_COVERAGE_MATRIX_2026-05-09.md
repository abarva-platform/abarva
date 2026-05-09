# Industry AI Pattern Coverage Matrix

Date: 2026-05-09

Scope: Wave 3 PR-D1 planning artifact for Retail, Financial Services, and Healthcare across front office, middle office, and back office. This document identifies the coverage AbarVa needs before adding large volumes of new canonical pattern content.

Status: design and gap analysis only. No pattern seed files, migrations, or database content were changed.

## Source Evidence Used

- `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`
- `docs/knowledge-corpus/CANONICAL_CORPUS_VALIDATION_REPORT_2026-05-09.md`
- `docs/knowledge-corpus/SAMPLE_RETRIEVAL_QA_REPORT_2026-05-09.md`
- `docs/knowledge-corpus/PATTERN_CROSSWALK_INVENTORY_2026-05-09.md`
- `docs/knowledge-corpus/PATTERN_DUPLICATE_RISK_REPORT_2026-05-09.md`
- `docs/knowledge-corpus/CURATION_PROMPT_RETAIL.md`
- `docs/knowledge-corpus/CURATION_PROMPT_FINSERV.md`
- `docs/knowledge-corpus/CURATION_PROMPT_HEALTHCARE.md`
- `src/lib/intelligence/industry-knowledge.ts`
- `src/lib/intelligence/seed-patterns-cdp.ts`
- `src/lib/intelligence/generated/pattern-manifest.json`

## Current Coverage Baseline

The canonical preview currently contains 271 rows. Industry counts from the preview are:

| Industry | Preview rows | Current shape |
| --- | ---: | --- |
| Retail | 63 | Best current vertical coverage, with front/middle/back-office examples, but most rows lack KPIs, data domains, workshops, artifacts, and phases. |
| Healthcare | 19 | Meaningful clinical and value-based-care themes, but nearly all preview rows sit in `enterprise_platform` instead of front/middle/back-office areas. |
| Financial Services | 11 | Thinest target-industry coverage. AML/BSA is not explicitly represented enough to satisfy sample retrieval. |
| Cross industry | 166 | Strong generic catalog, but many rows need industry-specific translation before Nexus can advise like a domain expert. |

Preview area coverage for target industries:

| Industry | Front office | Middle office | Back office | Enterprise platform |
| --- | ---: | ---: | ---: | ---: |
| Retail | 15 | 15 | 10 | 23 |
| Healthcare | 0 | 0 | 0 | 19 |
| Financial Services | 0 | 0 | 0 | 11 |

Validation gaps from the current preview:

- 271 rows missing failure-mode mitigations.
- 271 rows below the minimum data-requirements threshold.
- 271 rows below the minimum KPI threshold.
- 271 rows missing recommended workshops.
- 255 rows missing provenance requirements.
- 246 rows missing recommended artifacts.
- 220 rows missing common failure modes.
- Phase coverage has no `originate` and no `mobilize_handoff` patterns.

Sample retrieval gaps that should drive Wave 3 content:

- Financial Services AML query returns fraud modernization but misses AML/BSA/compliance title specificity.
- Healthcare back-office productivity query returns revenue cycle denial cascade but misses `back_office` classification.
- Contact center KPI query returns the right retail pattern family but lacks at least three KPI anchors.

## Phase Key

| Key | Strategic Moves phase |
| --- | --- |
| O | Originate |
| C | Charter |
| Dg | Diagnose / Discover |
| Ds | Design |
| R | Roadmap / Estimates / Business Case / Change / Value Realization Plan |
| M | Mobilize & Handoff |

## Retail Coverage Matrix

### Retail Front Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Personalization and next-best-action | conversion, average order value, repeat purchase, opt-out rate | customer profile, loyalty, commerce behavior, consent, product catalog | segment leakage, privacy breach, irrelevant offers, channel conflict | O C Dg Ds R M | Customer journey map; KPI tree; consent workshop; personalization control review |
| 2 | Loyalty lifecycle AI | enrollment, active loyalty rate, redemption, churn, incremental margin | loyalty ledger, offers, transactions, customer service, campaign history | rewarding already-loyal customers, margin leakage, stale segments | O C Dg Ds R | Loyalty economics baseline; offer governance workshop; value measurement plan |
| 3 | Commerce search and recommendations | search conversion, zero-result rate, add-to-cart, return rate | product attributes, search logs, clickstream, inventory, margin | weak product attribution, popularity bias, out-of-stock recommendations | Dg Ds R M | Product data quality assessment; search relevance lab; agent guardrail design |
| 4 | AI-enabled contact center routing | containment, first-contact resolution, AHT, CSAT, transfer rate | interaction history, intent taxonomy, CRM, order status, agent skills | bot without authority, escalation loops, hallucinated policy, weak intent taxonomy | C Dg Ds R M | Service workflow blueprint; escalation matrix; KPI baseline; pilot scorecard |
| 5 | Store associate and clienteling copilot | assisted sales, clienteling adoption, basket size, task completion | customer profile, store inventory, associate roster, appointment history | detached from store workflow, bad inventory signals, trust collapse | C Dg Ds R M | Store workflow observation; associate HITL design; adoption risk workshop |
| 6 | Marketing activation and campaign agent | speed to campaign, incremental lift, CAC, suppression accuracy | campaign history, segments, creative, consent, MMM/MTA outputs | over-automation, attribution confusion, brand inconsistency, consent gaps | O C Dg Ds R | Campaign operating model; experimentation design; creative approval guardrails |
| 7 | Retail media optimization | ad yield, ROAS, fill rate, advertiser retention, incrementality | audience graph, ad inventory, product taxonomy, sales attribution | weak clean-room rules, attribution overclaim, retailer-supplier conflict | C Dg Ds R | Retail media value case; data sharing workshop; measurement governance |
| 8 | Dynamic pricing and promotion optimization | gross margin, promo ROI, sell-through, price trust, markdown rate | price history, competitor prices, inventory, elasticity, promo calendar | merchant override conflict, price fairness risk, cannibalization | O C Dg Ds R M | Pricing guardrail charter; merchant trust workshop; scenario simulator |
| 9 | Returns and service recovery agent | return rate, save rate, refund cycle time, fraud loss, NPS recovery | order, returns policy, reason codes, payment, customer history | agent lacks returns authority, refund fraud, inconsistent policy | C Dg Ds R M | Returns decision rights; fraud-risk controls; recovery journey map |
| 10 | GenAI product content and visual content ops | content cycle time, PDP completeness, SEO traffic, conversion, compliance defects | PIM, DAM, supplier content, brand rules, claims library | fabricated product claims, duplicate content, brand mismatch | O C Dg Ds R M | Content governance; claims review; human approval workflow |

### Retail Middle Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Demand forecasting with causal discipline | forecast accuracy, bias, inventory turns, service level | POS, inventory, promotions, weather, events, product hierarchy | historical overfit, missing causal events, weak cold-start logic | O C Dg Ds R M | Forecast baseline; causal feature workshop; model monitoring plan |
| 2 | Replenishment and inventory optimization | in-stock rate, days of supply, lost sales, excess inventory | store/SKU inventory, lead times, replenishment rules, demand signals | shelf inaccuracy masked by system stock, bad lead-time assumptions | C Dg Ds R M | Inventory truth audit; exception workflow; replenishment simulation |
| 3 | Allocation and store clustering AI | sell-through, transfer rate, markdowns, cluster stability | store clusters, product attributes, geography, demand, returns | overfits historic clusters, ignores local shifts, poor merchant trust | Dg Ds R | Allocation diagnostic; cluster explainability review; merchant signoff gate |
| 4 | Assortment and space optimization | sales per square foot, category margin, availability, localized fit | planograms, fixture capacity, category roles, POS, vendor terms | ignores space feasibility, creates store execution burden | O C Dg Ds R | Space feasibility pack; assortment workshop; store execution review |
| 5 | Supply chain ETA and exception orchestration | OTIF, expedite cost, dwell time, fulfillment SLA | orders, shipments, carrier events, DC capacity, supplier ASN | black-box ETA, no exception owner, stale carrier feeds | Dg Ds R M | Exception taxonomy; control tower workflow; carrier data readiness |
| 6 | Store operations task orchestration | task completion, labor productivity, audit compliance, customer wait time | store tasks, labor schedule, traffic, inventory alerts, audits | too many tasks, unclear priority, manager overload | C Dg Ds R M | Store operating cadence; task triage workshop; pilot adoption plan |
| 7 | Workforce scheduling optimization | labor cost, coverage, overtime, schedule adherence, turnover | labor standards, traffic, availability, skills, compliance rules | optimization violates labor rules, poor associate trust | C Dg Ds R M | Labor rule inventory; associate impact review; scheduler HITL design |
| 8 | Fresh forecasting and waste reduction | shrink, waste, freshness, availability, margin | freshness codes, waste logs, POS, weather, local events | no waste feedback, optimizing availability while hiding waste | C Dg Ds R | Fresh waste baseline; store process observation; exception playbook |
| 9 | Product content and attribution quality | attribute completeness, search relevance, return defects, vendor SLA | PIM, supplier portals, content audit, customer questions | content AI amplifies bad taxonomy, claims unsupported | Dg Ds R M | Attribute quality audit; supplier content workshop; claims guardrail |
| 10 | Returns fraud and loss prevention case AI | fraud loss, false positive rate, case cycle time, recovery rate | returns, payments, identity, store events, case history | privacy boundary failures, biased flags, no investigator workflow | C Dg Ds R M | Risk controls; investigator workflow; privacy and fairness review |

### Retail Back Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Finance close automation with retail calendar logic | close cycle time, journal error rate, reconciliation breaks | ERP, POS feeds, inventory valuation, retail calendar, accruals | ignores 4-5-4 calendar, automates unreconciled feeds | Dg Ds R M | Close process map; reconciliation control matrix; finance workshop |
| 2 | Procurement and supplier negotiation copilot | savings realized, cycle time, compliance, supplier risk | spend cube, contracts, supplier scorecards, market indices | recommends savings without contract authority, ignores supplier risk | O C Dg Ds R | Category strategy; sourcing guardrails; negotiation evidence pack |
| 3 | HR frontline workforce agent | time-to-fill, turnover, training completion, scheduling defects | HRIS, LMS, store roster, schedules, employee relations | policy hallucination, labor-law violations, adoption mistrust | C Dg Ds R M | HR policy grounding; associate experience workshop; approval rules |
| 4 | IT service and store-edge operations AI | MTTR, incident recurrence, store downtime, ticket deflection | ITSM, observability, store network, POS incidents, CMDB | ignores store-edge constraints, brittle automation | Dg Ds R M | Store-edge architecture review; runbook automation design |
| 5 | ERP modernization sequenced for AI | process fit, integration defects, data latency, AI dependency closure | ERP process map, master data, integrations, AI roadmap | ERP sequenced after AI commitments, duplicate semantic layers | O C Dg Ds R | Dependency map; ERP/AI sequencing workshop; migration risk register |
| 6 | Cyber risk for payment and commerce surfaces | vulnerability SLA, payment incident rate, PCI findings, script integrity | WAF, payment scripts, commerce logs, IAM, vendor tags | misses payment-page scripts, third-party script exposure | Dg Ds R M | Commerce security review; PCI/AI guardrail checklist |
| 7 | Retail semantic data layer | certified metric coverage, data latency, data quality defects | POS, loyalty, product, inventory, location, channel hierarchy | generic model misses retail calendar and store/SKU grain | O C Dg Ds R M | Metric dictionary; semantic model workshop; data-product backlog |
| 8 | Legal/privacy AI for retail marketing and content | review cycle time, claim defects, consent incidents, DSAR SLA | consent, claims, policy, campaign, product content | unapproved claims, privacy scope creep, weak audit trail | C Dg Ds R M | Legal control matrix; claims library; privacy impact assessment |
| 9 | Vendor consolidation and AI platform rationalization | vendor count, overlapping spend, integration reuse, SLA performance | contracts, app inventory, usage, data flows, roadmap | point-solution sprawl, embedded lock-in, unclear ownership | O C Dg Ds R | Vendor portfolio heatmap; rationalization workshop; exit criteria |
| 10 | Analytics and AI governance operating model | model inventory coverage, approval cycle time, drift incidents | model registry, decision inventory, risk tiering, monitoring | governance detached from merchandising cadence, no owner | O C Dg Ds R M | AI governance charter; decision rights workshop; model controls pack |

## Financial Services Coverage Matrix

### Financial Services Front Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Digital acquisition and onboarding AI | funded account rate, CAC, abandonment, approval cycle time | digital journey, identity, KYC, product, channel attribution | personalization conflicts with suitability, weak identity proofing | O C Dg Ds R M | Journey baseline; KYC controls; acquisition economics workshop |
| 2 | KYC onboarding orchestration agent | time to onboard, touchless rate, exception rate, compliance defects | identity, documents, sanctions, beneficial ownership, CRM | false clears, missing human review, stale watchlist logic | C Dg Ds R M | KYC workflow blueprint; exception matrix; compliance signoff |
| 3 | Next-best-action for banking customers | offer conversion, retention, share of wallet, complaint rate | customer profile, product holdings, behavior, eligibility rules | unsuitable offers, channel fatigue, opaque decisioning | O C Dg Ds R | NBA policy design; model explainability review; value measurement |
| 4 | Wealth advisor copilot | advisor productivity, proposal cycle time, client retention, suitability defects | portfolio, CRM, financial plan, research, compliance policy | fabricated recommendations, suitability failures, advisor overtrust | C Dg Ds R M | Advisor workflow lab; compliance guardrails; citation requirements |
| 5 | Branch banker assist | service time, cross-sell quality, first-visit resolution, referral conversion | customer profile, product catalog, appointment, branch staffing | inconsistent scripts, weak branch adoption, policy drift | C Dg Ds R M | Branch observation; banker HITL design; training plan |
| 6 | Contact center and servicing AI | containment, AHT, FCR, complaint escalation, QA score | interaction history, authentication, product policy, case notes | bot cannot act, regulatory disclosure missed, poor escalation | C Dg Ds R M | Servicing authority map; complaint workflow; QA scorecard |
| 7 | Customer retention and churn signal AI | attrition, save rate, deposit balance retention, churn precision | transaction behavior, balances, service interactions, offers | late signals, incentives erode margin, privacy concerns | O C Dg Ds R | Retention hypothesis; intervention test design; risk controls |
| 8 | Small-business banker copilot | application completion, cross-sell, cash-management adoption, SLA | business profile, cash flow, products, banker notes, risk policy | credit advice without evidence, weak data permissioning | C Dg Ds R | SMB journey map; banker workshop; data-permission review |
| 9 | Mortgage or lending journey assistant | pull-through, cycle time, document defects, borrower NPS | LOS, documents, appraisal, pricing, underwriting status | hallucinated loan status, fair lending risk, weak audit trail | C Dg Ds R M | Lending journey blueprint; fair-lending guardrail review |
| 10 | Complaint and vulnerable-customer assistant | complaint cycle time, first response SLA, remediation accuracy | complaints, call notes, policy, vulnerability flags, outcomes | insensitive automation, poor remediation evidence, regulatory breach | Dg Ds R M | Complaint taxonomy; vulnerable customer controls; evidence pack |

### Financial Services Middle Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | AML/BSA investigative agent | alert precision, SAR quality, investigator throughput, cycle time | transactions, customer profile, alerts, typologies, case history | fraud pattern mislabeled as AML, no explainability, missed escalation | O C Dg Ds R M | AML typology map; investigator HITL design; SAR evidence checklist |
| 2 | Fraud detection modernization | fraud loss, false positive rate, time to detect, case conversion | transactions, devices, identity, claims, network signals | model drift, alert overload, customer friction | C Dg Ds R M | Fraud signal inventory; decision threshold workshop; control plan |
| 3 | Credit underwriting and decisioning AI | approval time, default rate, override rate, adverse action defects | application, bureau, income, collateral, policy, outcomes | unsupported adverse-action reasons, bias, stale policy | O C Dg Ds R M | Underwriting workflow; fair lending review; decision audit pack |
| 4 | Portfolio credit risk monitoring | early warning precision, exposure at risk, migration rate, loss rate | exposures, covenants, market data, payments, collateral | late indicators, black-box portfolio alerts, no ownership | C Dg Ds R | Risk appetite map; signal governance; monitoring runbook |
| 5 | Compliance surveillance agent | alert precision, investigation backlog, breach rate, review SLA | communications, trades, policies, employee data, cases | privacy overreach, weak lexicon governance, false positives | C Dg Ds R M | Surveillance scope; privacy assessment; reviewer workflow |
| 6 | Model risk governance copilot | inventory completeness, validation cycle time, findings closure | model inventory, validation reports, policies, monitoring | treats LLM outputs as unregistered models, weak evidence trail | O C Dg Ds R M | Model inventory; risk-tiering workshop; validation evidence pack |
| 7 | Payments exception and dispute AI | exception cycle time, STP rate, loss recovery, SLA | payments, disputes, message data, sanctions, case history | wrong exception handling, missed sanctions hold, poor audit | C Dg Ds R M | Payment exception taxonomy; controls; operator HITL design |
| 8 | Collections and hardship orchestration | cure rate, roll rate, contact compliance, customer harm | delinquency, payment history, hardship flags, channel consent | aggressive automation, compliance violations, poor segmentation | O C Dg Ds R | Collections policy; vulnerability controls; outcome measurement |
| 9 | Insurance claims or servicing automation | cycle time, leakage, touchless rate, customer satisfaction | FNOL, documents, policy, reserves, payments, adjuster notes | leakage, unfair denials, weak adjuster review | C Dg Ds R M | Claims workflow; authority limits; audit trail design |
| 10 | Product operations and fee governance AI | fee error rate, exception backlog, product defect resolution | product catalog, fee schedules, account events, complaints | fee remediation misses edge cases, product taxonomy gaps | Dg Ds R M | Product control inventory; remediation workflow; evidence plan |

### Financial Services Back Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Regulatory reporting copilot | report cycle time, data defects, late findings, adjustment rate | GL, risk data, regulatory taxonomy, lineage, controls | unsupported filings, weak lineage, manual override sprawl | C Dg Ds R M | Reporting lineage map; control matrix; regulator-ready evidence pack |
| 2 | Finance close and reconciliations AI | close days, breaks, manual journals, audit findings | GL, subledgers, reconciliations, product hierarchy | automates unresolved breaks, weak segregation of duties | Dg Ds R M | Close baseline; reconciliation controls; finance workflow workshop |
| 3 | Legal and contract intelligence | review cycle time, clause risk, fallback compliance, obligation misses | contracts, playbooks, policies, counterparty data | hallucinated clause meaning, no counsel review, stale playbook | C Dg Ds R M | Clause library; legal HITL design; obligation register |
| 4 | Procurement and third-party risk AI | cycle time, savings, risk findings, vendor concentration | spend, contracts, TPRM, risk ratings, service inventory | vendor-risk bypass, DORA/ICT gaps, savings overclaim | O C Dg Ds R M | Supplier risk map; category workshop; risk approval controls |
| 5 | HR and workforce productivity agent | HR case SLA, policy accuracy, training completion, attrition | HRIS, policy, LMS, employee relations, access roles | policy hallucination, confidential-data exposure, inconsistent advice | C Dg Ds R M | HR policy grounding; escalation design; privacy review |
| 6 | IT modernization and runbook automation | MTTR, change failure, automation success, incident recurrence | ITSM, CMDB, observability, runbooks, app inventory | automates brittle runbooks, hidden app dependencies | C Dg Ds R M | IT ops process map; automation safety gates; runbook inventory |
| 7 | Data governance and lineage AI | critical data element coverage, issue cycle time, lineage completeness | data catalog, lineage, ownership, policies, quality rules | metadata without ownership, no business glossary, stale lineage | O C Dg Ds R M | CDE inventory; data ownership workshop; governance charter |
| 8 | Cyber and identity risk agent | access review completion, privilege risk, incident MTTR, control gaps | IAM, PAM, logs, app inventory, vendor access | over-privileged automation, weak break-glass controls | Dg Ds R M | Identity control map; privileged action boundaries; cyber playbook |
| 9 | Enterprise model and AI governance | inventory completeness, approval SLA, drift events, policy exceptions | model registry, AI use cases, monitoring, policy, risk tiers | shadow AI, unregistered models, no monitoring ownership | O C Dg Ds R M | AI governance operating model; model-risk workshop; evidence gates |
| 10 | ERP/CRM modernization for regulated operations | data latency, process fit, integration defects, control breaks | ERP/CRM, master data, integrations, controls, product hierarchy | modernization decoupled from control requirements | O C Dg Ds R | Dependency map; target architecture; value case |

## Healthcare Coverage Matrix

### Healthcare Front Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Digital front door and access AI | conversion to appointment, abandonment, wait time, patient NPS | provider directory, scheduling, eligibility, CRM, web behavior | inaccurate availability, weak triage, accessibility gaps | O C Dg Ds R M | Access journey map; scheduling data audit; patient safety review |
| 2 | Patient or member contact center AI | containment, FCR, AHT, complaint rate, transfer accuracy | CRM, EHR/claims status, benefits, authorization, call history | PHI leakage, wrong benefit advice, poor escalation | C Dg Ds R M | Contact authority map; HIPAA guardrails; escalation matrix |
| 3 | Care navigation and concierge agent | successful navigation, leakage, referral completion, satisfaction | referral, provider network, care gaps, benefits, preferences | unsafe clinical advice, network errors, no nurse review | C Dg Ds R M | Navigation workflow; clinical escalation design; care-team workshop |
| 4 | Patient outreach and activation | outreach conversion, gap closure, opt-out, readmission impact | care gaps, CRM, claims/EHR, SDOH, consent | spammy outreach, wrong cohort, trust erosion | O C Dg Ds R | Outreach hypothesis; consent controls; cohort design |
| 5 | Member engagement and benefits assistant | self-service completion, call deflection, grievance rate, accuracy | benefits, claims, provider network, prior auth, ID card | misleading coverage answer, no evidence citation, stale benefits | C Dg Ds R M | Benefits knowledge grounding; grievance controls; QA scorecard |
| 6 | Appointment scheduling and capacity assistant | slot utilization, no-show rate, time to appointment, waitlist fill | scheduling, provider templates, patient preference, reminders | double booking, bad template rules, equity risk | C Dg Ds R M | Capacity model; scheduling rule workshop; pilot plan |
| 7 | Price estimate and financial counseling AI | estimate accuracy, conversion, bad-debt rate, charity screening | chargemaster, contracts, eligibility, claims history, policy | inaccurate estimate, patient harm, policy noncompliance | Dg Ds R M | Estimate controls; financial counseling workflow; compliance review |
| 8 | Patient portal copilot | portal resolution, secure message volume, response time, safety escalations | portal messages, EHR notes, policy, scheduling, labs metadata | unsafe advice, clinician inbox flooding, weak triage | C Dg Ds R M | Portal triage design; clinical safety guardrails; inbox baseline |
| 9 | Healthcare CRM growth and retention AI | acquisition, retention, service-line conversion, campaign ROI | CRM, claims/EHR segments, consent, campaign, referral sources | inappropriate targeting, HIPAA marketing issue, attribution overclaim | O C Dg Ds R | Growth use-case charter; privacy review; measurement plan |
| 10 | Post-discharge follow-up agent | readmission, follow-up completion, medication issue detection, satisfaction | discharge, meds, appointments, care plan, contact preferences | unsafe escalation, missed red flags, incomplete medication data | C Dg Ds R M | Discharge workflow; red-flag escalation; nurse HITL design |

### Healthcare Middle Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Prior authorization agentic workflow | cycle time, touchless rate, denial overturn, clinical criteria accuracy | orders, clinical policy, EHR, payer rules, claims | unsafe auto-approval, missing clinical evidence, payer rule drift | O C Dg Ds R M | Prior-auth workflow; clinical evidence checklist; payer policy review |
| 2 | Revenue cycle denial prevention | denial rate, days in AR, avoidable write-offs, appeal success | claims, remits, coding, auth, clinical documentation | symptom-only denial fixes, no root cause, payer mix blind spots | C Dg Ds R M | Denial root-cause register; revenue-cycle workshop; appeal playbook |
| 3 | Ambient clinical documentation | clinician time saved, note quality, adoption, coding impact | encounter audio/text, EHR notes, specialties, coding rules | clinician trust failure, note hallucination, coding mismatch | C Dg Ds R M | Specialty workflow map; clinical safety review; adoption plan |
| 4 | Care management and population health orchestration | gap closure, admission avoidance, care-plan completion, risk score movement | claims, EHR, risk scores, SDOH, care plans | wrong cohort, care-manager overload, no intervention capacity | O C Dg Ds R M | Cohort design; capacity model; intervention prioritization |
| 5 | Quality measure and Stars/HEDIS assistant | measure closure, abstraction productivity, audit defects | quality measures, claims/EHR, member outreach, provider attribution | measure gaming, incomplete evidence, audit failure | C Dg Ds R M | Quality measure map; evidence review; audit controls |
| 6 | Risk adjustment AI | RAF accuracy, suspect gap closure, chart retrieval, audit findings | diagnoses, charts, claims, coding, encounter history | unsupported coding, compliance exposure, provider burden | C Dg Ds R M | Coding evidence rules; compliance workshop; provider workflow |
| 7 | Clinical surveillance and safety signals | alert precision, response time, adverse event reduction, override rate | vitals, labs, meds, notes, protocols, outcomes | alert fatigue, no clinical ownership, biased thresholds | Dg Ds R M | Clinical safety case; alert workflow; governance review |
| 8 | Bed capacity and throughput optimization | LOS, boarding time, discharge before noon, bed turns | ADT, staffing, transport, discharge orders, demand forecast | optimization without discharge authority, weak data freshness | C Dg Ds R M | Throughput map; command center workflow; exception playbook |
| 9 | Healthcare supply chain and preference-card AI | stockout, waste, case cost, preference-card accuracy | item master, supply usage, case schedule, vendor, contracts | item-master defects, clinician preference conflict, savings overclaim | Dg Ds R M | Supply data quality audit; OR workflow workshop; value tracker |
| 10 | Workforce productivity and staffing AI | premium labor, productivity, turnover, coverage, safety events | staffing, census, acuity, schedules, HR, productivity | unsafe staffing, labor agreement conflicts, manager mistrust | C Dg Ds R M | Workforce baseline; acuity model review; labor controls |

### Healthcare Back Office

| # | Pattern area | KPI anchors | Core data requirements | Common failure modes | Phases | Recommended artifacts and workshops |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Finance close and margin analytics AI | close cycle time, service-line margin accuracy, manual adjustments | GL, cost accounting, patient accounting, contracts, volumes | margin model mismatch, unreconciled clinical/finance data | Dg Ds R M | Finance data lineage; margin model workshop; control matrix |
| 2 | HR workforce service agent | HR case SLA, policy accuracy, onboarding speed, retention risk | HRIS, policy, LMS, credentials, employee relations | policy hallucination, credentialing gaps, labor rule violations | C Dg Ds R M | HR policy grounding; credential workflow; escalation rules |
| 3 | Procurement and purchased services AI | savings realized, contract compliance, vendor risk, cycle time | spend, contracts, item master, vendor performance, demand | supply substitution risk, savings not realized, clinical pushback | O C Dg Ds R | Category baseline; clinical preference workshop; savings tracker |
| 4 | IT service operations and EHR app support | MTTR, ticket deflection, change failure, clinician downtime | ITSM, EHR tickets, CMDB, observability, knowledge base | unsafe auto-remediation, stale runbooks, PHI in logs | Dg Ds R M | IT runbook review; EHR support workflow; privacy controls |
| 5 | ERP and EHR-adjacent modernization | integration defects, data latency, process fit, support cost | ERP, EHR interfaces, master data, contracts, identity | technology change ignores clinical workflow, duplicate platforms | O C Dg Ds R | Architecture dependency map; migration value case; risk register |
| 6 | Healthcare analytics governance | metric certification, data quality issue closure, lineage coverage | data catalog, metric dictionary, claims/EHR, ownership | report sprawl, no metric owner, stale extracts | O C Dg Ds R M | Metric governance charter; data-product backlog; owner workshop |
| 7 | Privacy, security, and compliance AI | policy review cycle, PHI incidents, audit findings, access defects | policies, access logs, BAAs, HIPAA controls, incidents | PHI exposure, weak audit trail, third-party risk blind spots | C Dg Ds R M | HIPAA/AI control matrix; privacy impact assessment; vendor review |
| 8 | Revenue integrity administrative agent | charge capture, coding query cycle, compliance findings, leakage | charges, coding, clinical notes, payer policy, audits | unsupported charge recommendations, coding compliance risk | C Dg Ds R M | Charge-capture workflow; compliance evidence; coding guardrails |
| 9 | Research operations and trial matching support | match precision, accrual, protocol deviation, coordinator time | protocol, eligibility, EHR, consent, research registry | privacy breach, false eligibility, coordinator overload | O C Dg Ds R M | Trial matching controls; IRB evidence pack; coordinator workflow |
| 10 | Legal, contracting, and payer contract intelligence | review cycle, obligation misses, dispute cycle, clause risk | contracts, payer terms, policies, disputes, obligations | incorrect clause interpretation, no counsel review, stale templates | C Dg Ds R M | Contract clause library; legal HITL design; obligation register |

## Cross-Industry Patterns Required Before D2-D4 Content Expansion

These patterns should be reusable across all three industries and linked to industry-specific variants rather than duplicated.

| Priority | Cross-industry pattern | Why it matters |
| ---: | --- | --- |
| 1 | Pattern provenance and confidence disclosure | Agents must show source basis, confidence, missing fields, and unsupported claim flags before giving advice. |
| 2 | Human-agent operating model and decision rights | Most use cases fail when autonomous actions, escalation points, and human approvals are unclear. |
| 3 | KPI baseline and measurement design | Every pattern needs at least three KPIs, baseline needs, and measurement method to pass validation. |
| 4 | Data readiness and semantic layer requirements | Retrieval and agent recommendations need industry/function/process data domains, not generic data-platform language. |
| 5 | Responsible AI guardrails and policy controls | Healthcare safety, financial compliance, and retail privacy all need control patterns. |
| 6 | Failure-mode and anti-pattern taxonomy | Sentinel needs reusable risk patterns for thin data, symptom-only diagnosis, scope creep, missing sponsor, and unsupported claims. |
| 7 | Agentic workflow architecture patterns | Nexus needs patterns for tools, memory, retrieval, HITL checkpoints, escalation, and audit. |
| 8 | Vendor/build/buy decision patterns | Patterns should guide when to use SaaS, SI partner, client team, or custom agent stack. |
| 9 | Mobilize and handoff readiness | Current phase coverage has zero `mobilize_handoff`; handoff patterns must be added before demo claims of execution readiness. |
| 10 | Originate phase opportunity triage | Current phase coverage has zero `originate`; agents need patterns for executive problem framing and opportunity selection. |

## Prioritized Gap List

| Priority | Gap | Evidence | Remediation target |
| ---: | --- | --- | --- |
| 1 | KPIs and data requirements are missing across nearly all canonical preview rows. | Validator shows 271 minimum KPI issues and 271 minimum data requirement issues. | Every D2-D4 pattern must include at least 3 primary KPIs and at least 3 required data domains. |
| 2 | Provenance is thin or missing. | Validator shows 255 provenance issues. | Mark source basis honestly, add confidence rationale, and do not add fabricated public citations. |
| 3 | Financial Services lacks AML/BSA specificity. | Sample retrieval AML query misses title terms. | Add explicit AML/BSA/compliance investigation patterns before broad fraud content. |
| 4 | Healthcare is not classified into front/middle/back office. | Preview shows 19 healthcare rows all as `enterprise_platform`. | Split healthcare into access/member front office, clinical/revenue-cycle middle office, and admin/platform back office. |
| 5 | Healthcare back-office productivity is absent. | Sample retrieval back-office query returns revenue-cycle denial cascade. | Add healthcare finance, HR, IT, procurement, compliance, analytics governance, legal, and research ops patterns. |
| 6 | Contact-center patterns lack KPI depth. | Sample retrieval contact-center query misses KPI minimum. | Add contact-center KPI sets for retail, financial services, and healthcare variants. |
| 7 | Originate and Mobilize/Handoff phases have no canonical coverage. | Validator phase coverage shows zero for both. | Add phase applicability and gate evidence for every pattern, plus explicit originate and handoff patterns. |
| 8 | Recommended artifacts and workshops are missing. | Validator shows 246 artifact issues and 271 workshop issues. | Add artifact/workshop bundles per pattern cell and phase. |
| 9 | Failure modes and mitigations are incomplete. | Validator shows 220 failure-mode issues and 271 mitigation issues. | Add failure modes and mitigation guidance for each pattern. |
| 10 | Duplicate risk remains high enough to block blind content expansion. | Duplicate-risk report shows 22 high-risk and 192 medium-risk objects. | D2-D4 must use canonical ids and crosswalk before adding/enriching content. |
| 11 | Cross-industry rows dominate but are not translated into industry context. | Preview has 166 cross-industry rows versus 63 retail, 19 healthcare, 11 financial services. | Add industry overlays that map generic patterns to industry processes, data, KPIs, and guardrails. |
| 12 | Enterprise-platform buckets hide functional specificity. | Financial Services and Healthcare target rows are almost entirely `enterprise_platform`. | Normalize enterprise area, function, process area, and use-case category during D2-D4 enrichment. |

## D2-D4 Content Execution Rules

Before adding or enriching industry pattern packs:

1. Use this matrix as the content backlog, not as seed data.
2. Enrich existing canonical ids when a current row already covers the same pattern family.
3. Create new canonical ids only when the crosswalk shows no safe existing target.
4. Do not add unsupported quantitative outcome claims.
5. Use `source_basis: inferred_from_patterns` for synthesized internal pattern expansions unless a real source reference is provided.
6. Include confidence rationale even when confidence is low.
7. Include phase applicability and gate evidence for every pattern.
8. Preserve Apex Retail naming. There must be no reference to the legacy retail client name.
9. Run canonical validation and sample retrieval QA before opening each content PR.
10. Do not execute DB backfill writes until dry-run payloads pass review.

## Recommended Wave 3 PR Sequence

| Slice | Scope | Gate before merge |
| --- | --- | --- |
| PR-D2 Retail Pattern Pack | Enrich Retail across the 30 front, 30 middle, 30 back, and 10 cross-functional targets, starting with contact center KPIs and merchandising/store operations. | Validator issue count falls for retail rows; sample retail queries remain passing; no forbidden naming. |
| PR-D3 Financial Services Pattern Pack | Add AML/BSA, KYC, fraud, underwriting, advisor/contact-center, regulatory reporting, model risk, and data governance depth. | AML sample query passes title/function/process expectations. |
| PR-D4 Healthcare Pattern Pack | Split healthcare rows into front/middle/back office and add access, prior auth, revenue cycle, care management, back-office productivity, and compliance depth. | Healthcare prior-auth query remains passing and back-office productivity query passes. |
| PR-D5 Nexus Phase Training Framework | Create the phase-by-phase consultant-grade Nexus training manual tied to canonical retrieval, artifacts, gates, and uncertainty rules. | Each phase maps to canonical patterns and explicit evidence gates. |
