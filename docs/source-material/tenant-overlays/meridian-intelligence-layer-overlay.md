# Meridian Health System · Intelligence Layer Overlay

**The Meridian-specific instantiation of the AbarVa Intelligence Layer North Star Specification v1.0. Extends the base Meridian Health System composite seed with KPI architecture, pattern pack upgrades, telemetry sources, external signal envelope, and dual-scope configuration per the north star specification.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- `docs/specs/_meta/seed-data/meridian-health-system-comprehensive-seed.md` — base tenant seed (ingested in PR #22)

**Meridian is the Intermountain-class integrated provider-payer composite.** This overlay introduces the healthcare sector into AbarVa's intelligence architecture with particular attention to the dual provider-payer complexity, HIPAA compliance handling, and value-based care progression dynamics.

---

## Part 1 · Scope

This overlay adds to the base Meridian seed:

- **38 first-class KPI objects** covering both provider and health-plan taxonomies (Part 4)
- **7 pattern packs** upgraded from narrative to full schema (Part 6)
- **External signal envelope** for healthcare sector (Part 8)
- **9 operational telemetry sources** with HIPAA-aware dual-scope access control (Parts 9-10)
- **Dual-scope configuration** with clinical data hard-limit enforcement (Part 11)
- **Graph entity population plan** reflecting provider-payer dual structure

**Healthcare-specific architectural notes:** This is the first composite to meaningfully exercise HIPAA compliance architecture, PHI de-identification protocols, and dual-entity (provider + payer) KPI relationships. Codex should treat this as validation of north star's compliance-mapping framework.

---

## Part 2 · KPI Architecture · 38 First-Class Metrics

Every KPI conforms to the schema in north star Part 4.1. Meridian's dual provider-payer structure means many KPIs exist in both provider-side and plan-side variants.

### 2.1 · Financial KPIs (enterprise)

**2.1.1 — Operating Margin % (Consolidated)**
- ID: `meridian_operating_margin_consolidated`
- Owner: CFO · Current: 2.8% · Target: 4.5% · Benchmark median (integrated systems): 3.2%
- Trend: declining 30 bps YoY · Labor cost pressure, payer mix headwinds
- Reasoning scope: broad · Disclosure scope: broad (non-profit disclosure obligations)

**2.1.2 — Days Cash on Hand**
- ID: `meridian_days_cash_on_hand`
- Current: 142 days · Target: 180 days · Benchmark median: 195 days
- Peer position: bottom half · Rating agency concern
- Reasoning scope: broad · Disclosure scope: broad (bond disclosure)

**2.1.3 — Days in AR**
- ID: `meridian_days_in_ar`
- Current: 52 · Target: 42 · Benchmark median: 47
- Linked patterns: Revenue Cycle Denial Cascade (3.2)
- Reasoning scope: broad · Disclosure scope: broad

**2.1.4 — Bad Debt %**
- ID: `meridian_bad_debt_pct`
- Current: 4.2% · Target: 2.8% · Benchmark median: 3.1%
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Finance, Revenue Cycle — disclosable; others aggregate only given community relations sensitivity)

**2.1.5 — Cost per Adjusted Discharge**
- ID: `meridian_cost_per_adj_discharge`
- Current: $13,420 · Target: $12,100 · Benchmark median: $12,650
- Linked initiatives: Clinical Variation Reduction, Workforce Optimization
- Reasoning scope: broad · Disclosure scope: broad

**2.1.6 — Payer Mix (Commercial %)**
- ID: `meridian_payer_mix_commercial`
- Current: 38% · Target: 45% · Trend: declining 2pt YoY
- Reasoning scope: broad · Disclosure scope: broad

### 2.2 · Clinical quality KPIs

**2.2.1 — Risk-Adjusted Mortality Index**
- ID: `meridian_raw_mortality_index`
- Definition: O/E ratio (observed / expected mortality)
- Current: 0.89 · Target: 0.82 · Benchmark median: 0.94 · Peer position: top third
- Owner: Chief Medical Officer · Linked initiatives: Clinical Excellence Program
- Reasoning scope: broad · Disclosure scope: broad (publicly reported)

**2.2.2 — 30-Day Readmission Rate**
- ID: `meridian_readmission_30day`
- Current: 14.2% · Target: 11.5% · Benchmark median: 13.8%
- Linked patterns: Care Transitions Gap (3.4)
- Reasoning scope: broad · Disclosure scope: broad (CMS reported)

**2.2.3 — Hospital-Acquired Infection Rate**
- ID: `meridian_hai_rate`
- Current: 1.8 per 1000 patient days · Target: 1.2 · Benchmark median: 1.9
- Reasoning scope: broad · Disclosure scope: broad

**2.2.4 — Hospital-Acquired Condition Rate**
- ID: `meridian_hac_rate`
- Current: 8.4 per 1000 discharges · Target: 6.5
- Reasoning scope: broad · Disclosure scope: broad

**2.2.5 — Core Measures Compliance**
- ID: `meridian_core_measures_compliance`
- Current: 94% · Target: 97% · Benchmark median: 95%
- Reasoning scope: broad · Disclosure scope: broad

### 2.3 · Patient experience KPIs

**2.3.1 — HCAHPS Top-Box %**
- ID: `meridian_hcahps_top_box`
- Current: 74% · Target: 82% · Benchmark median: 76%
- Linked initiatives: Patient Experience Transformation
- Reasoning scope: broad · Disclosure scope: broad (publicly reported)

**2.3.2 — Ambulatory CAHPS**
- ID: `meridian_cahps_ambulatory`
- Current: 71% top-box · Target: 80% · Benchmark median: 74%
- Reasoning scope: broad · Disclosure scope: broad

**2.3.3 — Days to Third Next Available**
- ID: `meridian_days_3rd_next_available`
- Current: 14 days (primary care), 22 days (specialty) · Target: 7 and 14 respectively
- Linked patterns: Access and Capacity Mismatch (3.5)
- Reasoning scope: broad · Disclosure scope: broad

**2.3.4 — ED Boarding Time**
- ID: `meridian_ed_boarding_time`
- Current: 4.2 hours average · Target: 2.0 · Benchmark median: 3.1
- Reasoning scope: broad · Disclosure scope: broad

### 2.4 · Operational KPIs

**2.4.1 — Occupancy Rate**
- ID: `meridian_occupancy_rate`
- Current: 78% · Target: 82% (operationally optimal)
- Note: regional hospitals vary — 62% (rural) to 91% (flagship)
- Reasoning scope: broad · Disclosure scope: broad

**2.4.2 — Average Length of Stay**
- ID: `meridian_alos`
- Current: 4.8 days · Target: 4.2 · Benchmark median: 4.5
- Linked initiatives: Care Transitions, Clinical Variation Reduction
- Reasoning scope: broad · Disclosure scope: broad

**2.4.3 — Surgical Volume (Cases/Year)**
- ID: `meridian_surgical_volume_annual`
- Current: 128,000 · Target: 145,000
- Reasoning scope: broad · Disclosure scope: broad

**2.4.4 — OR Utilization**
- ID: `meridian_or_utilization`
- Current: 68% · Target: 78% · Benchmark median: 72%
- Reasoning scope: broad · Disclosure scope: broad

**2.4.5 — Telehealth Volume**
- ID: `meridian_telehealth_volume`
- Current: 180,000 visits/year · Target: 320,000
- Reasoning scope: broad · Disclosure scope: broad

### 2.5 · Revenue cycle KPIs

**2.5.1 — First-Pass Denial Rate**
- ID: `meridian_denial_rate_first_pass`
- Current: 12.8% · Target: 7.5% · Benchmark median: 9.2%
- Linked patterns: Revenue Cycle Denial Cascade (3.2)
- Linked initiatives: Revenue Cycle Modernization
- Reasoning scope: broad · Disclosure scope: broad

**2.5.2 — Overall Denial Rate**
- ID: `meridian_denial_rate_overall`
- Current: 6.4% final · Target: 4.0%
- Reasoning scope: broad · Disclosure scope: broad

**2.5.3 — Denial Write-Off %**
- ID: `meridian_denial_writeoff_pct`
- Current: 2.1% of gross revenue · Target: 1.0%
- Reasoning scope: broad · Disclosure scope: broad

**2.5.4 — Clean Claim Rate**
- ID: `meridian_clean_claim_rate`
- Current: 84% · Target: 95% · Benchmark median: 89%
- Reasoning scope: broad · Disclosure scope: broad

**2.5.5 — POS Collections %**
- ID: `meridian_pos_collections_pct`
- Current: 28% · Target: 45% · Benchmark median: 36%
- Linked patterns: Revenue Cycle Denial Cascade
- Reasoning scope: broad · Disclosure scope: broad

### 2.6 · Value-based care KPIs

**2.6.1 — VBC Revenue %**
- ID: `meridian_vbc_revenue_pct`
- Owner: Chief Population Health Officer · Strategic priority: VBC Progression
- Target: 68% by end FY26 (per CEO Q2 2025 earnings call commitment)
- Current: 38% · Trend: +3pt YoY · Benchmark median: 42%
- Internal program plan reaches: 52% by end FY26 (16-pt commitment gap)
- Linked patterns: VBC Progression Lag (3.1)
- Reasoning scope: broad · Disclosure scope: broad (public commitment)

**2.6.2 — Shared Savings Achievement**
- ID: `meridian_shared_savings_achievement`
- Current: $82M annual · Target: $180M by FY27
- Reasoning scope: broad · Disclosure scope: broad

**2.6.3 — Risk-Adjusted PMPM**
- ID: `meridian_risk_adjusted_pmpm`
- Current: $428 · Target: $395 (PMPM reduction goal)
- Reasoning scope: broad · Disclosure scope: **program-scoped** (VBC, Finance programs disclosable; aggregate-level for others given payer-contract sensitivity)

**2.6.4 — Attributed Lives (VBC)**
- ID: `meridian_attributed_lives_vbc`
- Current: 420,000 · Target: 750,000 by FY27
- Reasoning scope: broad · Disclosure scope: broad

### 2.7 · Health plan KPIs (Meridian Health Plans)

**2.7.1 — Medical Loss Ratio (MLR)**
- ID: `meridian_plan_mlr`
- Owner: President Meridian Health Plans (Dr. Linda Chen-Winters)
- Current: 87.2% · Target: 84.5% · Benchmark median: 86.8%
- Trend: up 80 bps YoY · Medical trend pressure
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Health Plan programs disclosable; financial regulatory sensitivity for others)

**2.7.2 — Medical Cost Trend**
- ID: `meridian_plan_medical_trend`
- Current: 8.2% annualized · Target: 6.0% · Industry median: 7.5%
- Reasoning scope: broad · Disclosure scope: broad

**2.7.3 — Member Retention (Plan)**
- ID: `meridian_plan_member_retention`
- Current: 82% · Target: 88% · Benchmark median: 85%
- Reasoning scope: broad · Disclosure scope: broad

**2.7.4 — MA Risk Adjustment Accuracy**
- ID: `meridian_ma_risk_adjustment_accuracy`
- Current: 91% · Target: 96% · Benchmark median: 94%
- Linked initiatives: Risk Adjustment Modernization
- Reasoning scope: broad · Disclosure scope: **program-scoped** (given CMS audit sensitivity)

**2.7.5 — MA Star Rating**
- ID: `meridian_ma_star_rating`
- Current: 4.0 stars · Target: 4.5 stars · Benchmark: 4.2 median
- Reasoning scope: broad · Disclosure scope: broad

**2.7.6 — HEDIS Composite Score**
- ID: `meridian_hedis_composite`
- Current: 73rd percentile · Target: 85th
- Reasoning scope: broad · Disclosure scope: broad

### 2.8 · Workforce KPIs

**2.8.1 — Physician Burnout Index**
- ID: `meridian_physician_burnout_index`
- Current: 48% reporting burnout · Target: 32% · Benchmark median: 43%
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Workforce, Clinical programs disclosable; aggregate only for others given physician-relations sensitivity)

**2.8.2 — Nurse Engagement**
- ID: `meridian_nurse_engagement`
- Current: 68% favorable · Target: 76% · Benchmark median: 71%
- Reasoning scope: broad · Disclosure scope: broad

**2.8.3 — wRVU Productivity**
- ID: `meridian_wrvu_productivity`
- Current: 4,800 wRVU/FTE · Target: 5,200 · Benchmark median: 5,000
- Reasoning scope: broad · Disclosure scope: broad

**2.8.4 — Nursing Hours per Patient Day**
- ID: `meridian_nursing_hppd`
- Current: 8.4 · Target: 8.0 (optimization, not reduction)
- Reasoning scope: broad · Disclosure scope: broad

**2.8.5 — Turnover (Nursing)**
- ID: `meridian_nursing_turnover`
- Current: 22% · Target: 14% · Benchmark median: 18%
- Reasoning scope: broad · Disclosure scope: broad

### 2.9 · Cross-functional KPIs

**2.9.1 — AI Governance Maturity**
- ID: `meridian_ai_governance_maturity`
- Current: Stage 2 · Target: Stage 4
- Linked patterns: Shadow AI in Clinical and Revenue Cycle (3.3)
- Reasoning scope: broad · Disclosure scope: broad

**2.9.2 — Cybersecurity Maturity (HITRUST+NIST)**
- ID: `meridian_cybersecurity_maturity`
- Current: HITRUST r2 certified, NIST CSF 3.4 · Target: NIST CSF 4.2
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Cybersecurity programs full; others aggregate given PHI-protection sensitivity)

**2.9.3 — EHR User Satisfaction**
- ID: `meridian_ehr_user_satisfaction`
- Current: 58% favorable · Target: 75% · Industry median: 62%
- Reasoning scope: broad · Disclosure scope: broad

### 2.10 · KPI relationship graph summary

**Provider-side cluster.** Financial (2.1), Clinical Quality (2.2), Patient Experience (2.3), Operational (2.4), Revenue Cycle (2.5), VBC Provider (2.6)

**Plan-side cluster.** Health Plan KPIs (2.7)

**Cross-cluster (integrated system reality).**
- VBC Revenue % (2.6.1) connects provider and plan through risk-bearing relationship
- Risk-Adjusted PMPM (2.6.3) is provider-owned but plan-measured
- MA Risk Adjustment Accuracy (2.7.4) drives plan revenue but depends on provider documentation
- Physician Burnout (2.8.1) affects both provider throughput and plan network capacity

**Pattern-affected clusters.**
- Revenue Cycle Denial Cascade → Days in AR, First-Pass Denial, Clean Claim, POS Collections
- VBC Progression Lag → VBC Revenue %, Shared Savings, Attributed Lives
- Access and Capacity Mismatch → Days to 3rd Next Available, ED Boarding, HCAHPS
- Care Transitions Gap → Readmission, ALOS, Cost per Discharge

---

## Part 3 · Pattern Pack Upgrades · 7 Patterns to Full Schema

### 3.1 · Value-Based Care Progression Lag

Foundational pattern pack #13 — healthcare-specific.

**Classification.** Category: Clinical-Financial Integration · Sector applicability: healthcare (provider and integrated systems)

**Detection signals.**
- Public commitment to VBC % by date exists
- Current trajectory (linear extrapolation from trailing 4 quarters) does not reach commitment
- Infrastructure investments insufficient to support commitment (risk management, care coordination, analytics)
- Physician attribution and incentive alignment immature relative to commitment

**Likely root causes.** Fee-for-service muscle memory · risk infrastructure gap · physician alignment and compensation model lag · attributed-life growth plateau · payer contract negotiation cycles · data and analytics capability gap

**Intervention options.**
- Risk management infrastructure build-out (care coordination, analytics, actuarial)
- Physician compensation model redesign for risk alignment
- Attributed-life growth acceleration (contract wins, member retention)
- Technology platform modernization for risk-bearing operations
- Partnership strategy (payer, employer, network expansion)
- Public commitment reforecasting where acceleration not feasible

**Phase-mapped deliverables.**

*Phase 1.* VBC current state · commitment gap analysis · trajectory math · infrastructure readiness audit · physician alignment audit · peer benchmarking

*Phase 2.* Root cause deep-dive · infrastructure options · compensation model options · growth strategy · partnership options

*Phase 3.* Investment commitments · compensation redesign · growth plan · partnership strategy · timeline reforecasting decision

*Phase 4.* Infrastructure build · compensation rollout · growth execution · quarterly KPI tracking

**Expected outcomes.** VBC revenue trajectory inflection within 6 months · commitment credibility preserved or reforecasted transparently · attributed lives up 50%+ within 18 months

**Required sponsor profile.** CEO with CFO + CMO partnership · enterprise scope · very high political capital

**Linked KPIs.** VBC Revenue % (2.6.1), Shared Savings (2.6.2), Risk-Adjusted PMPM (2.6.3), Attributed Lives (2.6.4)

**Meridian evidence.** CEO Q2 2025 earnings commitment 68% by FY26 end · current 38%, trajectory to 52% · 16pt gap unresourced · infrastructure assessment shows risk management and analytics capability shortfalls

### 3.2 · Revenue Cycle Denial Cascade

Foundational pattern pack #14 — healthcare-specific.

**Classification.** Category: Revenue Cycle Operations · Sector applicability: healthcare

**Detection signals.**
- First-pass denial rate >10%
- Overall denial rate >5%
- Denial write-off >1.5% of gross revenue
- Clean claim rate <90%
- POS collections <35%
- Payer-specific denial clustering

**Likely root causes.** Eligibility verification gap at point of service · prior authorization workflow inefficiency · documentation quality and specificity gap · coding accuracy · payer contract complexity · denial management reactive vs preventive · technology platform fragmentation

**Intervention options.**
- Eligibility and prior auth automation
- Clinical documentation improvement program
- Coding quality and AI-assisted coding
- Denial prevention analytics (predictive at submission)
- Payer contract review and rationalization
- Technology platform consolidation

**Linked KPIs.** First-Pass Denial (2.5.1), Overall Denial (2.5.2), Denial Write-Off (2.5.3), Clean Claim (2.5.4), POS Collections (2.5.5), Days in AR (2.1.3)

**Meridian evidence.** 12.8% first-pass denial · $140M annual preventable denial impact · POS collections lagging peer median by 8 points

### 3.3 · Shadow AI in Clinical and Revenue Cycle Operations

Healthcare-specific variant of cross-sector Shadow AI Governance pattern (#1 of 20 foundational).

**Classification.** Variant of Shadow AI Governance · Sector applicability: healthcare

**Healthcare-specific sensitivities.** PHI handling in AI tools not BAA-covered · HIPAA violation risk · clinical decision influence without validation · payer audit exposure

**Meridian evidence.** 16 AI tools identified · 9 below governance threshold · 4 with PHI exposure (BAA status unclear) · 2 with clinical decision integration · 3 in revenue cycle with payer-audit exposure

**Linked KPIs.** AI Governance Maturity (2.9.1), Cybersecurity Maturity (2.9.2)

### 3.4 · Care Transitions Gap

Foundational cross-sector pattern — healthcare application.

**Detection signals.** Readmission >12% · ALOS concentration in discharge-ready cohort · care coordination staffing below peer · discharge instruction compliance gaps · post-acute partner performance variance

**Meridian evidence.** 14.2% readmission · 1.1 day avg discharge-ready delay · care coordination FTEs at 0.7 per 1000 discharges (peer 1.0)

**Linked KPIs.** Readmission (2.2.2), ALOS (2.4.2), Cost per Discharge (2.1.5), HCAHPS (2.3.1)

### 3.5 · Access and Capacity Mismatch

Healthcare-specific pattern.

**Detection signals.** Days to 3rd next available >10 (primary), >18 (specialty) · ED boarding >3 hours · capacity utilization variance across facilities · telehealth underutilization · specialist network gaps

**Meridian evidence.** 14 days PCP, 22 days specialty · 4.2 hour ED boarding · occupancy 62% (rural) to 91% (flagship) · telehealth at 12% of ambulatory volume

**Linked KPIs.** Days to 3rd Next Available (2.3.3), ED Boarding (2.3.4), HCAHPS (2.3.1), Telehealth Volume (2.4.5)

### 3.6 · Physician Burnout and Engagement Erosion

Healthcare-specific pattern.

**Detection signals.** Physician burnout index >40% · wRVU productivity declining · EHR user satisfaction <65% · physician turnover elevated · clinical documentation time exceeding patient-facing time

**Meridian evidence.** 48% burnout · wRVU productivity 4,800 vs 5,200 target · EHR satisfaction 58% · documentation time exceeds patient-facing time in primary care

**Linked KPIs.** Physician Burnout Index (2.8.1), wRVU Productivity (2.8.3), EHR Satisfaction (2.9.3)

### 3.7 · MA Risk Adjustment Maturation Gap

Healthcare payer-specific pattern.

**Detection signals.** Risk adjustment accuracy <95% · MA revenue trailing benchmark · physician documentation quality variance · HCC recapture rate low · coder-physician collaboration gap

**Meridian evidence.** 91% accuracy · HCC recapture rate 68% vs 78% benchmark · risk adjustment program staffing below peer

**Linked KPIs.** MA Risk Adjustment Accuracy (2.7.4), MA Star Rating (2.7.5), Medical Loss Ratio (2.7.1)

---

## Part 4 · External Signal Envelope

### 4.1 · Tracked executives

**Executive Committee.** CEO, CFO, CMO, COO, Chief Population Health Officer, Chief Nursing Officer, Chief Experience Officer, Chief Digital Officer, Chief Information Officer, Chief Legal and Compliance Officer, President Meridian Health Plans (Dr. Linda Chen-Winters).

**Extended leadership.** ~25 SVPs and service-line leaders.

### 4.2 · Tracked business units

Hospital operations, ambulatory, Meridian Health Plans, medical group, specialty service lines (oncology, cardiology, orthopedics, neuroscience, women's health), population health, research, foundation.

### 4.3 · Tracked vendor and partner relationships

**EHR and core clinical.** Epic, Cerner (legacy), clinical decision support systems.

**Revenue cycle.** Epic Resolute, Experian Health, MDaudit, Optum360.

**Analytics.** Epic Cogito, Clarify Health, Arcadia, Health Catalyst.

**AI/ML.** Microsoft Azure Health, Google Cloud Healthcare, OpenAI (via vendor APIs with BAA).

**Cybersecurity.** HITRUST-certified vendors, FireEye/Trellix, medical device security.

**Payer partnerships.** UnitedHealthcare, Anthem BCBS, Cigna, Aetna, state Medicaid managed care plans.

### 4.4 · Tracked peer competitors

**Integrated systems (primary).** Intermountain, Kaiser Permanente, Geisinger, UPMC, Providence, Sutter Health, Ascension.

**Academic medical centers (extended).** Mayo Clinic, Cleveland Clinic, Johns Hopkins.

**Regional dominants (extended).** Regional competitor hospital systems in Meridian's footprint.

### 4.5 · Tracked regulatory bodies

**Federal.** CMS (Medicare, Medicaid, CMMI), HHS OCR (HIPAA), FDA (devices, digital health), ONC (health IT).

**State.** State departments of insurance (health plan), state departments of health, state Medicaid offices.

**Industry.** Joint Commission, NCQA, HITRUST, Leapfrog Group.

### 4.6 · Tracked topics

**Strategic priority-linked.** VBC progression, clinical quality, patient experience, physician engagement, revenue cycle, health plan growth, technology modernization.

**Industry-level.** VBC policy evolution, MA star rating changes, CMS rulemaking, payer-provider dynamics, physician workforce shortage, nursing shortage, clinician AI, virtual care, post-acute integration, health equity, ESG/community benefit.

**Event-driven.** Major regulatory actions, peer cybersecurity incidents, clinical quality crises, major payer network changes, rate-setting decisions.

### 4.7 · Geographic scope

Primary: Meridian's service area states (per base seed). Federal: CMS national policy. Industry: national healthcare trends.

---

## Part 5 · Operational Telemetry Sources · 9 Registered

### 5.1 · Executive Operating Dashboard (Power BI)

- **ID:** `meridian_executive_ops_dashboard`
- **Modality:** API · daily
- **KPIs:** Operating margin, days cash, consolidated financial metrics, enterprise quality metrics
- **Residency:** client_owned_client_hosted (financial + clinical combined sensitivity)
- **Compliance:** SOX (where applicable to non-profit), HIPAA (aggregate clinical)
- **Reasoning scope:** Executive Advisory, Finance Transformation
- **Disclosure scope:** Executive Advisory (full) · Finance (full) · others (reasoning-only on specific values)

### 5.2 · Clinical Quality Dashboard

- **ID:** `meridian_clinical_quality_dashboard`
- **Modality:** API (Epic Cogito) · daily
- **KPIs:** 2.2.1-2.2.5 (clinical quality), service-line quality detail
- **Residency:** client_owned_abarva_hosted (de-identified aggregate); client_owned_client_hosted (patient-level detail never leaves)
- **Compliance:** HIPAA (de-identification required for AbarVa-hosted), CMS reporting obligations
- **Reasoning scope:** Clinical Excellence programs, Executive Advisory
- **Disclosure scope:** Clinical programs (full aggregate; patient-level reasoning-only) · Executive Advisory (aggregate)

### 5.3 · Revenue Cycle Performance Tracker

- **ID:** `meridian_revenue_cycle_tracker`
- **Modality:** API (Epic Resolute) · daily
- **KPIs:** 2.5.1-2.5.5 (revenue cycle)
- **Residency:** client_owned_abarva_hosted
- **Compliance:** HIPAA (account-level data handling), payer contract sensitivity
- **Reasoning scope:** Revenue Cycle programs, Finance, Executive Advisory
- **Disclosure scope:** program-specific aggregate

### 5.4 · Patient Experience Dashboard

- **ID:** `meridian_patient_experience_dashboard`
- **Modality:** API · daily
- **KPIs:** 2.3.1-2.3.4 (patient experience)
- **Residency:** client_owned_abarva_hosted (aggregate); de-identification required for narrative content
- **Compliance:** HIPAA, CMS reporting
- **Reasoning scope:** Patient Experience programs, Executive Advisory
- **Disclosure scope:** aggregate and service-line level

### 5.5 · VBC and Population Health Dashboard

- **ID:** `meridian_vbc_dashboard`
- **Modality:** API (Arcadia + Epic) · weekly
- **KPIs:** 2.6.1-2.6.4 (VBC), 2.7.1-2.7.2 (plan-side VBC-linked)
- **Residency:** client_owned_client_hosted (contract-sensitive + clinical-combined)
- **Compliance:** HIPAA, payer contract sensitivity, CMS VBC reporting
- **Reasoning scope:** VBC programs, Population Health, Executive Advisory, Health Plan (VBC-relevant subset)
- **Disclosure scope:** tightly program-scoped; payer-contract specifics never cross-program

### 5.6 · Health Plan Operating Dashboard

- **ID:** `meridian_health_plan_dashboard`
- **Modality:** API · daily
- **KPIs:** 2.7.1-2.7.6 (health plan)
- **Residency:** client_owned_client_hosted (regulatory and business-sensitivity)
- **Compliance:** HIPAA, state DOI reporting, CMS MA reporting, payer contract sensitivity
- **Reasoning scope:** Health Plan programs, Executive Advisory
- **Disclosure scope:** Health Plan programs (full) · Executive Advisory (aggregate) · provider-side programs (reasoning-only on plan specifics)

### 5.7 · Workforce and Clinical Operations Dashboard

- **ID:** `meridian_workforce_clinical_ops`
- **Modality:** API (Workday + clinical operations platform) · weekly
- **KPIs:** 2.8.1-2.8.5 (workforce)
- **Residency:** client_owned_abarva_hosted (aggregate)
- **Compliance:** HIPAA (where clinical-linked), PII (employee), physician-relations sensitivity
- **Reasoning scope:** Workforce programs, Clinical programs, Executive Advisory
- **Disclosure scope:** aggregate with physician-burnout specifics program-scoped

### 5.8 · Technology and Security Posture Tracker

- **ID:** `meridian_tech_security_tracker`
- **Modality:** Export (monthly) + share-link
- **KPIs:** 2.9.1-2.9.3 (cross-functional technology)
- **Residency:** client_owned_abarva_hosted
- **Compliance:** HIPAA Security Rule, HITRUST, state breach notification
- **Reasoning scope:** Technology, Cybersecurity, AI Platform programs, Executive Advisory
- **Disclosure scope:** Cybersecurity specifics tightly restricted; AI governance aggregate disclosable

### 5.9 · Compliance and Regulatory Tracker

- **ID:** `meridian_compliance_tracker`
- **Modality:** API · weekly + event-driven
- **KPIs:** compliance findings, regulatory examinations, audit responses
- **Residency:** client_owned_client_hosted (legal-privileged + regulatory-sensitive)
- **Compliance:** HIPAA, CMS, state regulatory, legal-privileged material
- **Reasoning scope:** Compliance programs, Executive Advisory, Legal
- **Disclosure scope:** Compliance programs (full, including privileged) · Executive Advisory (procedural full, strategic program-scoped) · others (public-record only)

### 5.10 · Telemetry source summary

| Source | Modality | Residency | Most restricted by |
|---|---|---|---|
| Executive Ops | API | Client-hosted | Consolidated sensitivity |
| Clinical Quality | API | Hybrid (aggregate/patient-level) | HIPAA |
| Revenue Cycle | API | AbarVa-hosted | HIPAA + payer contract |
| Patient Experience | API | AbarVa-hosted | HIPAA |
| VBC/Population Health | API | Client-hosted | HIPAA + payer contract |
| Health Plan | API | Client-hosted | Plan regulatory + business |
| Workforce/Clinical Ops | API | AbarVa-hosted | HIPAA-linked + PII |
| Tech/Security | Export | AbarVa-hosted | HITRUST + security sensitivity |
| Compliance | API | Client-hosted | Legal-privileged |

---

## Part 6 · HIPAA and PHI Handling

### 6.1 · Categorical PHI prohibition

**Individually-identifiable patient data is never ingested into AbarVa's reasoning or disclosure layers.** Period. This is a structural constraint enforced at the ingestion filter.

De-identified aggregate data is ingestible. Patient-level data is not.

### 6.2 · De-identification protocols

Per HIPAA Privacy Rule §164.514:

- **Safe Harbor method.** Removal of 18 specified identifiers. Used where feasible.
- **Expert Determination method.** Statistical analysis showing minimal re-identification risk. Used where Safe Harbor removal degrades utility.

Both methods executed before data enters AbarVa systems.

### 6.3 · Business Associate Agreement requirements

Every telemetry source that handles PHI (even aggregated clinical data) requires BAA coverage. BAA status tracked per source, audit-logged, renewed annually.

### 6.4 · Clinical data reasoning scope boundaries

Even for BAA-covered, de-identified clinical data:
- Reasoning scope limits to programs with explicit clinical scope
- Disclosure scope further restricts to program-specific audiences
- Patient-level inferences (e.g., "these 14 patients with these conditions") never surface; patterns at the population level do

### 6.5 · Breach notification architecture

If PHI inadvertently enters AbarVa systems:
- Automated detection flagging
- Immediate quarantine
- Client notification within 24 hours
- Incident response per BAA terms
- State breach notification obligations assessed

---

## Part 7 · Dual-Scope Configuration Examples

### 7.1 · VBC Transformation program scenario

**Program scope.** VBC Transformation program sponsor is CEO with co-sponsors CFO, CMO, Chief Population Health Officer, President Meridian Health Plans.

**Reasoning access.**
- All provider-side clinical, financial, operational KPIs
- VBC dashboard in full
- Health plan MLR and trend (for integrated-system reasoning)
- Revenue cycle (VBC-affected denial patterns)
- Workforce (physician engagement affecting VBC execution)

**Disclosure access.**
- VBC-specific KPIs disclosable within program
- Health plan MLR reasoning-only for provider-side program members
- Payer-specific contract details never disclosable cross-program
- Patient-level data never disclosable

**Example.** CMO in VBC program asks: "Are our payer contracts set up right for the acceleration we need?" Agent reasons from plan-side MLR, VBC dashboard, payer contract tracking. Response: "From what I can see, the acceleration path requires two structural shifts in contract design — specifically around risk corridor sharing and quality-linked reconciliation. I can't share the plan-side specifics in detail, but the implication for the provider side is significant and worth a coordinated conversation with Linda's team. Want me to help frame that?"

### 7.2 · Physician burnout with sensitivity

**Situation.** Physician burnout data contains service-line and specialty-level breakdowns with small cohorts (risk of individual identification).

**Reasoning access.** Workforce programs, Clinical programs, Executive Advisory all reason broadly.

**Disclosure access.**
- Enterprise burnout index broadly disclosable
- Service-line level disclosable to Workforce + Clinical programs
- Specialty-level (small cohorts) reasoning-only; only aggregate enterprise data disclosable externally
- Individual physician never surfaced

### 7.3 · Revenue cycle with payer sensitivity

**Situation.** Denial rate by payer shows specific payers with elevated denial patterns.

**Reasoning access.** Revenue Cycle, Finance, Executive Advisory.

**Disclosure access.** Revenue Cycle program (full). Executive Advisory (full). Other programs (aggregate denial rate only; payer-specific patterns reasoning-only to avoid disrupting payer relations).

**Example.** Patient Experience program lead asks: "Are there denial patterns affecting our patient billing experience?" Agent has payer-specific reasoning access. Response: "There are patterns worth addressing at the patient experience layer — specifically around initial denial communication and patient understanding. I can't share the payer-specific denial breakdowns with you directly, but the Revenue Cycle team has the specifics and the pattern has real patient experience implications. Want to coordinate a cross-program conversation?"

---

## Part 8 · Graph Entity Population Summary

- **Client entities:** 1 (Meridian) + Health Plan sub-entity = 2
- **Person entities:** ~38
- **Role entities:** ~32
- **StrategicPriority entities:** 6
- **Initiative entities:** ~18
- **KPI entities:** 38
- **Pattern entities:** 7
- **System entities:** ~28 (Epic-centered + supporting)
- **Vendor entities:** ~32
- **Benchmark entities:** ~48 (integrated systems + sector-specific)
- **TelemetrySource entities:** 9
- **ExternalEvent entities:** ~50
- **Evidence entities:** ~220
- **Source entities:** ~32
- **Contradiction entities:** ~6 (including the VBC commitment-pace contradiction)
- **Risk entities:** ~15

**Total approximate entity count: ~580**

Edge counts scale with entity relationships; approximately 2,400-3,400 edges.

---

## Part 9 · Smoke Tests

### KPI queries

1. "What is Meridian's VBC revenue percentage?" → 38% with commitment-gap context
2. "Who owns the MLR metric?" → Dr. Linda Chen-Winters
3. "How does Meridian compare on readmission?" → 14.2% vs 13.8% median
4. "What KPIs does VBC Progression Lag pattern impact?" → graph traversal result

### Pattern queries

5. "What patterns are active at Meridian?" → 7 patterns
6. "What interventions apply to Revenue Cycle Denial Cascade?" → structured options
7. "What's the Phase 2 deliverable list for VBC Progression Lag?" → structured list

### HIPAA/dual-scope queries

8. "What telemetry sources have HIPAA compliance tags?" → 9 sources with tags
9. "Can a Patient Experience program maestro see payer-specific denial data?" → reasoning yes, disclosure no
10. "How is patient-level data handled?" → never-ingested confirmation

### Complex reasoning

11. "Should Meridian reforecast VBC commitment or accelerate?" → informed multi-factor response
12. "What's changed at Meridian this quarter?" → external signal synthesis

---

## Part 10 · Ingestion Notes for Codex

### 10.1 · Template pattern established

Third composite overlay. Template from Keystone and Apex should apply cleanly. Meridian-specific additions:
- Dual provider-payer entity structure
- HIPAA compliance hard-limits at ingestion filter
- PHI de-identification verification
- Clinical data reasoning scope enforcement

### 10.2 · Preserve PR #22 conventions

Short name compatibility (`clients.name = "Meridian Health"`). Benchmark data in JSONB.

### 10.3 · HIPAA architectural validation

This overlay is the first real exercise of HIPAA compliance architecture. Codex should verify:
- Ingestion filter rejects PHI
- BAA status trackable per source
- De-identification status recorded per source
- Reasoning and disclosure scopes honor clinical data boundaries

### 10.4 · Smoke test priority

12 tests from Part 9 should all pass. Emphasize HIPAA-related tests (8, 9, 10) for validation of compliance architecture.

### 10.5 · Non-goals

- No actual PHI ingestion (composite data only)
- No real payer contract integration (notional)
- No CMS reporting pipeline (future)
- No actual BAA management system (structural hooks only)

---

**END OF MERIDIAN INTELLIGENCE LAYER OVERLAY**

*Third in four-composite intelligence layer instantiation sequence. Healthcare sector reference implementation with HIPAA architecture validation.*
