# Keystone Energy Holdings · Intelligence Layer Overlay

**The Keystone-specific instantiation of the AbarVa Intelligence Layer North Star Specification v1.0. Extends the base Keystone Energy Holdings comprehensive seed with KPI architecture, pattern pack upgrades, telemetry sources, external signal envelope, and dual-scope configuration per the north star specification.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- `docs/specs/_meta/seed-data/keystone-energy-holdings-comprehensive-seed.md` — base tenant seed

**This overlay is the reference implementation.** It serves as the template for authoring the parallel intelligence layer overlays for Apex, Meridian, and First Capital during Phase A of the Option C build.

---

## Part 1 · Scope

This overlay adds to the base Keystone seed:

- **35 first-class KPI objects** with full north star schema compliance (Part 4)
- **7 pattern packs** upgraded from narrative description to full schema (Part 6)
- **External signal envelope** defining Keystone's tracked sources and entities (Part 8)
- **9 operational telemetry sources** with dual-scope access control (Parts 9-10)
- **Dual-scope configuration** for all KPIs, patterns, and telemetry (Part 11)
- **Graph entity population plan** specifying what materializes where

---

## Part 2 · KPI Architecture · 35 First-Class Metrics

Every KPI below conforms to the schema in north star Part 4.1. Fields shown are the critical subset; full schema populated during ingestion with reasonable defaults for non-specified metadata.

### 2.1 · Reliability KPIs

**2.1.1 — SAIDI (System Average Interruption Duration Index)**
- ID: `keystone_saidi_enterprise`
- Definition: Total customer minutes of interruption / total customers served, annualized
- Category: operational · subcategory: reliability
- Owner: Nicole Hargrave-Park (EVP COO) · business unit: Enterprise (aggregated across 6 subsidiaries)
- Strategic priority: Operational Excellence and Reliability (3.5)
- Target: 95 minutes (CY2026) · Current: 108 minutes (CY2025)
- Trend: down (improving), -6% YoY · Benchmark median: 130 · Top quartile: <90
- Peer position: top quartile
- Linked initiatives: Grid Modernization 2030 Phase 2 (6.1.1), Distribution Automation
- Linked patterns: Storm Response Coordination Fragmentation (7.3)
- Data source: Cross-subsidiary aggregated Outage Management Systems (4 distinct OMS platforms — measurement noise flagged)
- Freshness SLA: monthly · Confidence: measured
- Reasoning scope: broad (all maestros at tenant) · Disclosure scope: broad

**2.1.2 — SAIFI (System Average Interruption Frequency Index)**
- ID: `keystone_saifi_enterprise`
- Definition: Total customer interruptions / total customers, annualized
- Owner: Nicole Hargrave-Park · Target: 0.95 · Current: 1.12
- Trend: down (improving), -4% YoY · Benchmark median: 1.25 · Top quartile: <1.00
- Peer position: top quartile
- Linked initiatives and patterns: same as SAIDI
- Reasoning scope: broad · Disclosure scope: broad

**2.1.3 — CAIDI (Customer Average Interruption Duration Index)**
- ID: `keystone_caidi_enterprise`
- Definition: SAIDI / SAIFI (average outage duration)
- Current: 96 minutes · Benchmark median: 104
- Peer position: top half
- Linked patterns: Storm Response Coordination Fragmentation
- Reasoning scope: broad · Disclosure scope: broad

**2.1.4 — MAIFI (Momentary Average Interruption Frequency Index)**
- ID: `keystone_maifi_enterprise`
- Current: 2.4 events per customer per year
- Linked initiatives: Distribution Automation Program
- Reasoning scope: broad · Disclosure scope: broad

**2.1.5 — Interconnection Queue Duration**
- ID: `keystone_interconnection_queue_duration`
- Definition: Median study-phase duration from interconnection request to agreement
- Owner: James Oppenheim (SVP Transmission) · Target: 9 months · Current: 18 months
- Trend: up (worsening), +40% YoY · Benchmark: peer range 6-24 months (not well-standardized)
- Linked initiatives: Data Center Load Integration Program (6.1.3), Transmission Expansion Program
- Linked patterns: Data Center Load Interconnection Queue Bottleneck (7.2)
- Data source: Interconnection Management System
- Freshness: monthly · Confidence: measured
- Why it matters: queue time drives customer abandonment, regulatory scrutiny, lost revenue, competitive pressure
- Reasoning scope: broad · Disclosure scope: program-scoped (Regulatory Strategy, Transmission Capital programs — disclosable; other programs reasoning-only)

### 2.2 · Customer KPIs

**2.2.1 — J.D. Power Residential Customer Satisfaction**
- ID: `keystone_jdpower_residential_csat`
- Owner: Jonathan Aldridge · Strategic priority: Customer Experience Transformation (3.2)
- Target: top quartile by 2028 · Current: mid-pack (55th percentile) · Trend: flat
- Linked initiatives: Customer Self-Service Portal Transformation (6.2.1), Storm Response Coordination Platform (6.2.3)
- Data source: J.D. Power syndicated results · Freshness: annual
- Reasoning scope: broad · Disclosure scope: broad

**2.2.2 — First Call Resolution Rate**
- ID: `keystone_fcr_rate` · Owner: Sophia Lindqvist
- Target: 82% by 2027 · Current: 71% · Trend: flat
- Benchmark median: 76% · Top quartile: 84% · Peer position: bottom half
- Linked initiatives: Customer Self-Service Portal, AI Platform and Governance (6.2.6)
- Linked patterns: Shadow AI in Customer Operations (7.1)
- Reasoning scope: broad · Disclosure scope: broad

**2.2.3 — Digital Self-Service Adoption Rate**
- ID: `keystone_digital_selfservice_adoption` · Owner: Aisha Prentiss
- Target: 68% by 2027 · Current: 47% · Trend: up +6% YoY · Benchmark median: 52%
- Linked initiatives: Customer Self-Service Portal Transformation
- Reasoning scope: broad · Disclosure scope: broad

**2.2.4 — Customer Complaint Rate per 1,000 Customers**
- ID: `keystone_complaint_rate`
- Current: 4.8 per year · Target: 3.5 by 2028 · Benchmark median: 4.2
- Linked initiatives: Customer Self-Service Portal, Storm Response Coordination Platform
- Reasoning scope: broad · Disclosure scope: broad

**2.2.5 — Outage Notification Timeliness**
- ID: `keystone_outage_notification_timeliness` · Owner: Aisha Prentiss
- Definition: % of affected customers notified within 15 minutes
- Target: 94% · Current: 67%
- Linked initiatives: Storm Response Coordination Platform
- Linked patterns: Storm Response Coordination Fragmentation (7.3)
- Reasoning scope: broad · Disclosure scope: broad

**2.2.6 — Bill Accuracy Rate**
- ID: `keystone_bill_accuracy` · Current: 99.2% · Target: 99.8%
- Linked initiatives: Billing System Consolidation Assessment (6.6.2)
- Reasoning scope: broad · Disclosure scope: broad

### 2.3 · Financial and regulatory KPIs

**2.3.1 — Rate Base Growth**
- ID: `keystone_rate_base_growth` · Owner: Elena Vosburgh
- Target: 7.2% CAGR through 2028 · Current: 6.9% trailing · Benchmark median: 6.8%
- Linked initiatives: Grid Modernization 2030 Phase 2, Transmission Expansion Program
- Linked patterns: Grid Modernization Capital vs Rate Recovery Gap (7.4)
- Reasoning scope: broad · Disclosure scope: broad (public financial metric)

**2.3.2 — Allowed ROE Weighted Average**
- ID: `keystone_allowed_roe_wtd_avg`
- Current: 9.5% across six subsidiaries · Target: 9.7%+
- Subsidiary range: 9.25% (MD) to 10.10% (PA)
- Linked initiatives: Rate Case Strategy Execution (6.4.1)
- Linked patterns: Cross-Jurisdictional Regulatory Coordination Gap (7.7)
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.3.3 — Rate Case Cycle Time**
- ID: `keystone_rate_case_cycle_time`
- Current: 14 months average · Target: 11 months · Peer range: 10-16 months
- Linked initiatives: Rate Case Strategy Execution
- Linked patterns: Grid Modernization Capital vs Rate Recovery Gap, Cross-Jurisdictional Regulatory Coordination Gap
- Reasoning scope: broad · Disclosure scope: broad (public records)

**2.3.4 — Capital Deployed per Customer**
- ID: `keystone_capital_per_customer`
- Current: $890 annual · Trend: accelerating (from $760 three years ago)
- Benchmark median: $720
- Linked patterns: Grid Modernization Capital vs Rate Recovery Gap
- Reasoning scope: broad · Disclosure scope: broad

**2.3.5 — Adjusted Operating EPS**
- ID: `keystone_adj_eps`
- Current: $2.71 (FY2025) · Target: 5-7% annual growth · Guidance: $2.64-$2.74 (2026)
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.3.6 — Rate Base ($B)**
- ID: `keystone_rate_base_total`
- Current: $62B · Target: $70B by end 2028
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.3.7 — Operating Expense per Customer**
- ID: `keystone_opex_per_customer`
- Current: $280 annual · Benchmark median: $295 · Peer position: top third (cost efficient)
- Reasoning scope: broad · Disclosure scope: broad

**2.3.8 — Bad Debt Expense %**
- ID: `keystone_bad_debt_pct`
- Current: 0.62% · Benchmark median: 0.58%
- Note: elevated vs peer given service territory economic mix
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Finance programs, Customer Affordability programs — disclosable; other programs reasoning-only given sensitivity about customer hardship signaling)

### 2.4 · Grid and operational KPIs

**2.4.1 — Distribution Line Losses %**
- ID: `keystone_distribution_losses`
- Current: 4.8% · Target: 4.2% by 2028 · Benchmark median: 4.6%
- Linked initiatives: Grid Modernization Phase 2
- Reasoning scope: broad · Disclosure scope: broad

**2.4.2 — Transmission Line Losses %**
- ID: `keystone_transmission_losses`
- Current: 2.3% · Benchmark median: 2.5% · Peer position: top third
- Reasoning scope: broad · Disclosure scope: broad

**2.4.3 — Substation Availability**
- ID: `keystone_substation_availability`
- Current: 99.94% · Benchmark median: 99.92%
- Reasoning scope: broad · Disclosure scope: **program-scoped with NERC CIP consideration** (aggregate disclosable; specific substation data NERC CIP critical infrastructure — reasoning-only for most programs)

**2.4.4 — Storm Restoration 95th Percentile Time**
- ID: `keystone_storm_restoration_p95`
- Current: 78 hours · Target: 48 hours
- Linked patterns: Storm Response Coordination Fragmentation
- Linked initiatives: Storm Response Coordination Platform, Generative AI Storm Outage Prediction
- Reasoning scope: broad · Disclosure scope: broad

**2.4.5 — AMI Data Utilization Rate**
- ID: `keystone_ami_data_utilization`
- Definition: % of AMI data systematically used in analytical models or customer features
- Current: 12% · Target: 45% by 2027
- Linked patterns: AMI Data Underutilization (7.5)
- Linked initiatives: AMI 2.0 Deployment, AI Platform and Governance Program, DERMS
- Reasoning scope: broad · Disclosure scope: broad

**2.4.6 — DER Interconnection Throughput**
- ID: `keystone_der_interconnection_throughput`
- Definition: DER interconnections completed per quarter
- Current: 840 · Target: 1,400
- Linked initiatives: Renewable Interconnection Queue Management, DERMS Deployment
- Reasoning scope: broad · Disclosure scope: broad

### 2.5 · Safety KPIs

**2.5.1 — OSHA DART Rate**
- ID: `keystone_osha_dart` · Owner: Yolanda Pettigrew
- Current: 1.2 · Target: <1.0 · Benchmark median: 1.3
- Reasoning scope: broad · Disclosure scope: broad (publicly reported)

**2.5.2 — OSHA Total Recordable Incident Rate**
- ID: `keystone_osha_trir`
- Current: 1.8 · Target: <1.5 · Benchmark median: 2.1
- Reasoning scope: broad · Disclosure scope: broad

**2.5.3 — Public Safety Incidents**
- ID: `keystone_public_safety_incidents`
- Current: 28 per year · Target: <20
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Safety programs, Executive Advisory — broad disclosure; other programs reasoning-only on specific incidents, aggregate disclosable)

### 2.6 · Workforce KPIs

**2.6.1 — Employee Engagement Score**
- ID: `keystone_employee_engagement`
- Current: 71% favorable · Target: 78% · Benchmark median: 68%
- Reasoning scope: broad · Disclosure scope: broad

**2.6.2 — Turnover Rate (Enterprise)**
- ID: `keystone_turnover_enterprise`
- Current: 12% · Benchmark median: 10%
- Reasoning scope: broad · Disclosure scope: broad

**2.6.3 — Transmission Engineering Turnover Rate**
- ID: `keystone_transmission_engineering_turnover`
- Definition: Annual turnover in transmission and substation engineering roles
- Current: 27% · Target: 14% · Long-run average: 11%
- Linked patterns: Workforce Attrition in Specialized Grid Operations (7.6)
- Linked initiatives: Workforce Modernization Initiative (6.5.1)
- Why it matters: institutional knowledge loss during capital acceleration; top-3 risk to plan execution
- Reasoning scope: broad · Disclosure scope: **program-scoped** (HR Strategy, Workforce Transformation, Capital Plan Execution — disclosable; others reasoning-only to avoid talent poaching signal amplification)

**2.6.4 — Apprenticeship Program Completion Rate**
- ID: `keystone_apprenticeship_completion`
- Current: 82% · Target: 88%
- Linked initiatives: Workforce Modernization Initiative, Community Workforce Development
- Reasoning scope: broad · Disclosure scope: broad

**2.6.5 — Workforce Diversity (Leadership)**
- ID: `keystone_workforce_diversity_leadership`
- Definition: % of senior leadership (VP+) who are women or people of color
- Current: 38% · Target: 46% by 2028
- Reasoning scope: broad · Disclosure scope: broad

### 2.7 · Sustainability KPIs

**2.7.1 — Scope 1 GHG Intensity**
- ID: `keystone_scope1_ghg_intensity` · Owner: Warren Okafor
- Target: Scope 1+2 net zero by 2040 · Trend: decreasing consistent with target
- Linked strategic priority: Clean Energy Transition and Net Zero Commitments (3.3)
- Reasoning scope: broad · Disclosure scope: broad

**2.7.2 — Scope 2 GHG Intensity**
- ID: `keystone_scope2_ghg_intensity` · Same framing as Scope 1
- Reasoning scope: broad · Disclosure scope: broad

**2.7.3 — Scope 3 Measurement Coverage**
- ID: `keystone_scope3_measurement_coverage`
- Current: 45% · Target: 85% by 2027 · Net zero Scope 3 by 2050
- Reasoning scope: broad · Disclosure scope: broad

**2.7.4 — EV Charging Infrastructure Deployed**
- ID: `keystone_ev_charging_infrastructure`
- Current: 380 make-ready sites · Target: 2,400 by 2028
- Linked initiatives: EV Charging Infrastructure Program
- Reasoning scope: broad · Disclosure scope: broad

**2.7.5 — ESG Rating (MSCI)**
- ID: `keystone_esg_rating_msci`
- Current: A · Target: AA · Utility sector median: BBB
- Reasoning scope: broad · Disclosure scope: broad

### 2.8 · Cross-functional and strategic KPIs

**2.8.1 — AI Governance Maturity Score**
- ID: `keystone_ai_governance_maturity`
- Definition: Composite across AI policy, risk management, deployment inventory, outcome measurement
- Current: stage 2 of 5 (emerging) · Target: stage 4 (mature) by 2027
- Owner: Daniel Whitlock (SVP Data, Analytics, AI), dotted-line to Jonathan Aldridge
- Linked patterns: Shadow AI in Customer Operations and Grid Analytics (7.1)
- Linked initiatives: AI Platform and Governance Program (6.2.6)
- Reasoning scope: broad · Disclosure scope: broad

**2.8.2 — Cybersecurity Maturity Score**
- ID: `keystone_cybersecurity_maturity`
- Current: NIST CSF 3.2 average · Target: NIST CSF 4.0+
- Linked initiatives: Cybersecurity Modernization Program (6.2.4)
- Reasoning scope: broad · Disclosure scope: **tightly scoped** (Cybersecurity programs disclosable; other programs reasoning-only given critical infrastructure sensitivity)

**2.8.3 — Decision Latency — Capital Planning**
- ID: `keystone_decision_latency_capital`
- Definition: Median time from issue identification to capital allocation decision, non-routine requests
- Current: 6-8 months · Target: 3 months
- Why it matters: interconnection queue environment demands faster capital decisions; cross-functional bottleneck
- Linked patterns: Cross-Jurisdictional Regulatory Coordination Gap (7.7)
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Capital Strategy, Executive Advisory disclosable; others reasoning-only)

### 2.9 · KPI relationship graph summary

**Primary clusters:**
- Reliability (2.1.1-2.1.5) ← affected by Storm Response pattern, Grid Modernization initiatives, Workforce Attrition pattern
- Customer experience (2.2.1-2.2.6) ← affected by Customer Self-Service Portal, Storm Response pattern, Shadow AI pattern
- Financial (2.3.1-2.3.8) ← affected by Rate Case Strategy, Regulatory Coordination Gap
- Operational (2.4.1-2.4.6) ← affected by AMI Data Underutilization, Grid Modernization
- Workforce (2.6.1-2.6.5) ← affected by Workforce Attrition, Workforce Modernization

**Cross-cluster relationships:**
- Transmission engineering turnover (2.6.3) → degrades capital program throughput → impacts rate base growth (2.3.1)
- Shadow AI pattern (7.1) → degrades AI governance maturity (2.8.1) and customer experience KPIs
- Storm Response Coordination Fragmentation → degrades reliability (2.1.1-2.1.4), customer satisfaction (2.2.1), outage notification timeliness (2.2.5) simultaneously

---

## Part 3 · Pattern Pack Upgrades · 7 Patterns to Full Schema

Each of Keystone's 7 patterns upgraded from narrative description to full north star Part 6 schema. Critical subsets shown; full ingestion populates complete schema.

### 3.1 · Shadow AI in Customer Operations and Grid Analytics

Extends base pattern 7.1. Utility-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).

**Classification.** Category: AI Governance · Variant of: Shadow AI Governance · Cross-industry: yes · Sector applicability: utility

**Detection signals.**
- AI tool procurement below governance threshold (>5 AI-adjacent tool purchases under $150K review threshold within 12 months)
- AI governance policy vs practice contradiction (stated policy contradicted by documented decentralized procurement)

**Likely root causes.** Decentralized procurement under central review thresholds · individual team pressure to adopt AI · governance established but enforcement absent · prior approval philosophy too slow

**Intervention options.**
- Enterprise AI platform with sanctioned access
- AI governance framework with procurement integration
- Tool consolidation leveraging enterprise contracts
- Employee AI literacy and sanctioned-use training

**Phase-mapped deliverables.**

*Phase 1 — Intake.* AI tool inventory audit · spend and contract posture analysis · governance-vs-practice contradiction documentation · critical infrastructure data exposure assessment (utility-specific)

*Phase 2 — Diagnosis.* Root cause analysis · enterprise AI platform options assessment · governance framework options · tool consolidation targets

*Phase 3 — Decision.* Enterprise AI platform commitment · governance framework finalization with enforcement design · tool consolidation roadmap · migration and sunset plan

*Phase 4 — Execution.* Platform deployment · governance operationalization · tool consolidation execution · AI governance maturity KPI tracking (2.8.1)

**Expected outcomes.** Shadow AI spend reduction 40-60% within 12 months · AI governance maturity up one stage within 18 months · 80%+ contract risk remediated within 9 months

**Required sponsor profile.** CIO, CCTO, or CDO · cross-functional enterprise scope · medium political capital

**Linked KPIs (degrades direction).** AI Governance Maturity (2.8.1), Cybersecurity Maturity (2.8.2), First Call Resolution (2.2.2), Customer Complaint Rate (2.2.4)

**Keystone evidence.** 11 tools, $1.6M annualized, 17 teams, 7/11 with auto-renewal, 4/11 with unreviewed data sharing (NERC CIP implications)

### 3.2 · Data Center Load Interconnection Queue Bottleneck

Extends base pattern 7.2. New foundational pattern pack (#17 in north star top 20) — utility-specific.

**Classification.** Category: Growth Management — Regulated Infrastructure · Cross-industry: no · Sector applicability: utility (electric)

**Detection signals.**
- Interconnection queue growth >50% YoY
- Study-phase duration >12 months
- Transmission engineering capacity <70% of needed

**Likely root causes.** Rapid load growth outpacing engineering capacity · study process designed for smaller loads · cost allocation frameworks not designed for large-load economics · regulatory uncertainty on tariff design · federal-state jurisdictional friction (post-DOE Section 403 Oct 2025)

**Intervention options.**
- Study process modernization and engineering capacity expansion
- Large-load tariff filings across jurisdictions
- Co-location and flexible load arrangements
- Transmission expansion capital plan recalibration
- Engagement with FERC/PJM on large-load rulemaking

**Phase-mapped deliverables.**

*Phase 1 — Intake.* Queue analysis and forecast · engineering capacity assessment · regulatory posture across jurisdictions · customer mix economic analysis

*Phase 2 — Diagnosis.* Root cause deep-dive · peer benchmarking on queue management · tariff design options · cost allocation frameworks · stakeholder mapping (developers, regulators, ratepayer advocates)

*Phase 3 — Decision.* Tariff filing strategy · engineering capacity build plan · cost allocation framework · co-location policy · regulatory engagement strategy

*Phase 4 — Execution.* Tariff filings · engineering hiring and reorganization · regulatory proceedings · ongoing pipeline management

**Expected outcomes.** Queue time reduction from 18 to <12 months within 18 months · clear cost allocation signed off by state PUCs within 12 months · transmission engineering capacity to 90%+ of demand within 24 months

**Required sponsor profile.** Chief Regulatory Officer, Chief Customer and Technology Officer, or CEO · enterprise scope · high political capital · extensive time commitment

**Linked KPIs.** Interconnection Queue Duration (2.1.5), Rate Base Growth (2.3.1), Capital Deployed per Customer (2.3.4), Rate Case Cycle Time (2.3.3)

**Keystone evidence.** 32 GW pending (from 14 GW in early 2024) · 18-month study duration vs 9-month target · $1.4B delayed revenue · $340M accelerated transmission investment · 4-6% projected residential rate increase if not large-load-allocated

### 3.3 · Storm Response Coordination Fragmentation

Extends base pattern 7.3. Foundational pattern pack (#18) — utility-specific.

**Classification.** Category: Operational Excellence — Multi-Entity Coordination · Sector applicability: utility

**Detection signals.**
- Multiple OMS platforms across operating units (≥3 distinct platforms)
- Post-major-event coordination failures recurring
- Customer notification lag during events (>30 minutes average)
- Mutual assistance onboarding delays (>4 hours)

**Likely root causes.** Historical M&A/separation created OMS fragmentation · legacy customer service platforms with distinct IVR/notification scripts · cross-subsidiary handoffs not platform-enabled · mutual assistance coordination processes manual · data synchronization lag during high-velocity events

**Intervention options.**
- Unified storm response platform with cross-OpCo visibility
- OMS rationalization (costly, long-horizon)
- Communications orchestration layer above OMS fragmentation (faster)
- Crew coordination workflow modernization
- Generative AI storm impact prediction
- Customer communication script unification

**Phase-mapped deliverables.**

*Phase 1.* Storm event history analysis · coordination failure mode documentation · cross-OpCo handoff mapping · customer communication audit

*Phase 2.* Platform options (unified new build, orchestration layer over existing, OMS rationalization) · AI prediction capability assessment · workflow modernization options

*Phase 3.* Platform decision and architecture · communication orchestration design · AI integration approach · rollout sequencing

*Phase 4.* Platform deployment · workflow operationalization · training and readiness · measurement via reliability KPIs

**Expected outcomes.** Customer notification timeliness from 67% to 94% within 18 months · storm restoration 95th percentile from 78 to 48 hours within 24 months · coordination failure modes reduced 70%+ within 12 months

**Required sponsor profile.** COO with CCTO partnership · enterprise scope · high political capital (OpCo presidents must align)

**Linked KPIs.** SAIDI (2.1.1), SAIFI (2.1.2), CAIDI (2.1.3), Outage Notification Timeliness (2.2.5), Customer Satisfaction (2.2.1), Storm Restoration P95 (2.4.4)

**Keystone evidence.** Dec 2024 ice storm after-action: 14 inter-company handoffs · 34-minute average notification lag · 7 recurring coordination failure modes · 4 distinct OMS platforms across 6 subsidiaries

### 3.4 · Grid Modernization Capital vs Rate Recovery Gap

Extends base pattern 7.4. Foundational pattern pack (#19) — utility-specific.

**Classification.** Category: Regulatory Strategy — Capital Recovery · Sector applicability: utility (regulated)

**Detection signals.**
- Deployed capital vs recognized rate base gap >$500M
- Regulatory lag >12 months
- Financing cost of carry on lag capital >$50M annualized
- Credit agency commentary noting deployment pace concern
- Multiple concurrent rate case filings

**Likely root causes.** Capital deployment accelerating ahead of regulatory recovery · rate case cycle time longer than capital cycle · regulatory philosophy in some jurisdictions less constructive on pace · customer affordability concerns constraining ROE · multi-jurisdictional variance complicating coordinated strategy

**Intervention options.**
- Rate case strategy optimization (filing cadence, settlement vs litigation, ROE targeting)
- Capital deployment pace recalibration
- Rider and tracker recovery mechanisms where available
- Regulatory constructive engagement programs
- Financing strategy adjustment (debt/equity mix)

**Phase-mapped deliverables.**

*Phase 1.* Capital deployment vs rate base gap analysis · regulatory lag quantification · financing cost of carry · jurisdictional variance analysis

*Phase 2.* Rate case strategy options · capital pace scenarios · financing strategy options · stakeholder engagement options

*Phase 3.* Rate case strategy decisions · capital pace commitments · financing strategy · regulatory engagement plan

*Phase 4.* Rate case execution · financing execution · regulatory engagement operationalization · outcome tracking

**Expected outcomes.** Regulatory lag reduction to <10 months within 18 months · deployed-to-recognized gap reduction by 40%+ within 18 months · constructive ROE outcomes in active cases

**Required sponsor profile.** CFO with Chief Regulatory Officer partnership · cross-functional scope · high political capital

**Linked KPIs.** Rate Base Growth (2.3.1), Allowed ROE (2.3.2), Rate Case Cycle Time (2.3.3), Capital Deployed per Customer (2.3.4)

**Keystone evidence.** $1.8B deployed capital in regulatory lag · $92M annualized cost of carry · credit agency commentary on deployment pace · four concurrent rate cases with expected outcomes Q2-Q4 2026

### 3.5 · AMI Data Underutilization

Extends base pattern 7.5. Variant of Analytics Modernization foundational pattern pack (#2).

**Classification.** Category: Analytics Modernization — Utility Specific · Variant of: Analytics Modernization foundational pack · Sector applicability: utility (electric, gas)

**Detection signals.**
- AMI data utilization <20% of available data
- Use case inventory with majority unimplemented
- AMI 2.0 deployment with data platform not scaled
- Analytical capacity concentration in small team

**Likely root causes.** AMI deployed for operational/billing use, not broader analytics · data platform not architected for AMI data volume · analytics capacity limited relative to use case inventory · customer-facing features require upstream data work not prioritized · DER integration use cases emerging faster than analytical capability

**Intervention options.**
- Enterprise data platform scaling
- Use case prioritization against strategic priorities
- Analytics capability expansion (talent and tooling)
- Customer-facing feature rollout coordination
- DER integration analytical workstream

**Linked KPIs.** AMI Data Utilization (2.4.5), DER Interconnection Throughput (2.4.6), AI Governance Maturity (2.8.1)

**Keystone evidence.** 18 TB annual AMI data · 12% utilization · 34 use cases identified, 7 production, 11 piloted, 16 unimplemented · AMI 2.0 will multiply data volume 4-6x

### 3.6 · Workforce Attrition in Specialized Grid Operations

Extends base pattern 7.6. Foundational pattern pack (#20) — cross-sector with utility variant.

**Classification.** Category: Workforce Strategy — Specialized Technical Roles · Cross-industry: yes (applies to healthcare nursing, financial services quantitative roles, utility grid engineering) · Sector applicability: all

**Detection signals.**
- Specialized role turnover >2x enterprise average
- Experience-band concentration in departures (8-15 year tenure band >40% of departures)
- Destination concentration (peer competitors or adjacent industries)
- Compensation below market in specific roles
- Replacement time >12 months to full productivity

**Keystone evidence.** 27% transmission engineering turnover vs 14% target · 43% of departures in 8-15 year band · 58% moving to renewable developers/IPPs · 18-month replacement time

**Linked KPIs.** Transmission Engineering Turnover (2.6.3), Apprenticeship Completion (2.6.4), Enterprise Turnover (2.6.2)

### 3.7 · Cross-Jurisdictional Regulatory Coordination Gap

Extends base pattern 7.7. Utility-specific (financial services variant #15 on Cross-Franchise regulatory).

**Classification.** Category: Regulatory Strategy — Multi-Jurisdiction · Sector applicability: utility (multi-state regulated) · Cross-industry: partial (financial services parallel pattern)

**Detection signals.**
- Multi-state operations with 5+ PUCs
- Filing cycle misalignment across subsidiaries
- ROE variance across jurisdictions >75 bps
- Rate case strategy subsidiary-by-subsidiary vs enterprise-coordinated
- Intervenor coalition overlap across cases

**Keystone evidence.** 5 state PUCs + DC PSC + FERC + NERC + PJM · ROE range 9.25% (MD) to 10.10% (PA) · subsidiary-level regulatory teams with limited enterprise coordination · four concurrent rate cases

**Linked KPIs.** Allowed ROE Weighted Average (2.3.2), Rate Case Cycle Time (2.3.3), Decision Latency — Capital Planning (2.8.3)

---

## Part 4 · External Signal Envelope

Keystone's signal relevance configuration per north star Part 8.4.

### 4.1 · Tracked executives (name-level)

**Executive Committee (12).** Marcus Kittrell, Nicole Hargrave-Park, Elena Vosburgh, Jonathan Aldridge, Calvin Shenker, Anita Ramaswamy, Derek Braithwaite, Priya Mehta, Warren Okafor, Samantha Chen-Pryce, Rafael DeLeon, Melissa Strickland.

**Operating subsidiary Presidents (6).** Gregory Lundquist, Reginald Chatmon, Maria Cervantes-Ruiz, Natasha Feldbaum, Benjamin Harwell, Theo Carrington.

**Extended leadership SVPs (23).** All named SVPs from base seed Part 5.

### 4.2 · Tracked business units

All six operating subsidiaries. Enterprise-level functions (Finance, HR, Legal, Communications, Sustainability, etc.). The newly-created combined Customer and Technology organization.

### 4.3 · Tracked initiatives

All 22 active initiatives from base seed Part 6. Major historical initiatives (3-year lookback) for trajectory context.

### 4.4 · Tracked vendor and partner relationships

Core OEM relationships (GE Vernova, Siemens Energy, Hitachi Energy, Schneider Electric). Technology vendors (Microsoft Azure, AWS, Databricks, Snowflake, AVEVA, Esri, SAP, Workday, Salesforce, Splunk, NICE CX, Microsoft Entra). AI/ML vendors (OpenAI, Anthropic, NVIDIA). Engineering consulting firms. EPRI, Argonne National Laboratory.

### 4.5 · Tracked regulatory bodies

**State PUCs.** Illinois Commerce Commission, Maryland Public Service Commission, Pennsylvania Public Utility Commission, New Jersey Board of Public Utilities, Delaware Public Service Commission.

**DC.** District of Columbia Public Service Commission.

**Federal.** Federal Energy Regulatory Commission (FERC), North American Electric Reliability Corporation (NERC), Department of Energy (DOE).

**Regional.** PJM Interconnection.

**Filing types to track.** Rate case orders, large load tariff filings, interconnection rulings, capacity market filings, reliability standards updates, enforcement actions.

### 4.6 · Tracked competitor set

**Primary peer utilities.** Exelon, Xcel Energy, PPL, DTE Energy, Ameren, ConEd, Eversource, NiSource, WEC Energy Group.

**Extended peers by dimension.** Duke Energy, Southern Company, Dominion Energy, American Electric Power (grid mod benchmarks); NextEra Energy, Edison International (clean energy transition benchmarks).

### 4.7 · Tracked topics

**Strategic priority-linked.** Grid modernization, customer experience transformation, clean energy transition, community investment, operational excellence, regulatory partnership.

**Industry-level.** Data center interconnection and large load management, AI deployment in utility operations, grid reliability and resilience, renewable integration, workforce transformation, cybersecurity and NERC CIP, ESG disclosure, rate case trends, regulatory rulemakings (FERC, state PUCs).

**Event-driven.** Extreme weather events, regulatory enforcement actions, cybersecurity incidents (industry-level), major executive moves (industry-level), M&A activity, capacity auction results.

### 4.8 · Geographic scope

Service territory states: Illinois, Maryland, Pennsylvania, New Jersey, Delaware, District of Columbia.

Adjacent regulatory context: all PJM states, DOE/FERC federal.

---

## Part 5 · Operational Telemetry Sources · 9 Registered Sources

Keystone operational telemetry sources per north star Part 9. All entries below are **composite-world simulations** establishing architectural patterns — no real Keystone data exists. When real utility clients onboard, the same source types will be instantiated with real data and appropriate access control.

### 5.1 · Weekly Business Review Deck

- **ID:** `keystone_wbr_deck`
- **Description:** CEO's weekly business review materials presented to Executive Committee every Monday
- **Modality:** Export (PowerPoint or PDF) · weekly refresh
- **KPIs populated:** 2.1.1 (SAIDI), 2.1.2 (SAIFI), 2.2.1 (JD Power CSAT, quarterly), 2.3.5 (Adj EPS), 2.6.1 (Engagement, quarterly), plus leading indicators
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** PII (customer data aggregates only), SOX (financial metrics)
- **Reasoning scope:** Executive Advisory program + all cross-functional transformation programs
- **Disclosure scope:** Executive Advisory (full) · transformation programs (relevant subset) · other programs (reasoning-only for leading indicators)

### 5.2 · CFO Scorecard Power BI Dashboard

- **ID:** `keystone_cfo_scorecard_pbi`
- **Description:** Elena Vosburgh's weekly financial and treasury scorecard
- **Modality:** API integration (Power BI API) · weekly refresh
- **KPIs populated:** 2.3.1-2.3.8 (all financial KPIs), cash position, debt metrics, financing execution tracking
- **Residency mode:** client_owned_client_hosted (Power BI stays in client tenant; AbarVa agents access via API)
- **Compliance tags:** SOX, material non-public information, SEC disclosure considerations
- **Reasoning scope:** Finance Transformation program, Executive Advisory program
- **Disclosure scope:** Finance Transformation (full) · Executive Advisory (full) · others (reasoning-only; specific values never disclosed)

### 5.3 · Enterprise PMO Initiative Tracker

- **ID:** `keystone_pmo_tracker`
- **Description:** Christopher Reede's PMO office tracker covering all 22 active initiatives
- **Modality:** API (ServiceNow or equivalent) · weekly refresh
- **KPIs populated:** initiative status, milestone tracking, budget-vs-actual, risk registry
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** internal-confidential
- **Reasoning scope:** all transformation programs at tenant
- **Disclosure scope:** per initiative — initiative-specific programs can disclose; others reasoning-only

### 5.4 · Customer Operations Dashboard Suite

- **ID:** `keystone_customer_ops_dashboards`
- **Description:** Sophia Lindqvist's customer operations performance dashboards (Tableau)
- **Modality:** API (Tableau REST) · daily refresh
- **KPIs populated:** 2.2.2 (FCR), 2.2.3 (Digital Self-Service), 2.2.4 (Complaint Rate), 2.2.5 (Outage Notification Timeliness), 2.2.6 (Bill Accuracy), plus granular call center, digital channel, and billing metrics
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** PII (customer-level data, aggregated for AbarVa view), state privacy laws
- **Reasoning scope:** Customer Experience Transformation program, Jonathan Aldridge's Executive Advisory
- **Disclosure scope:** CX Transformation (full) · Executive Advisory (full) · others (aggregate metrics disclosable, customer-level data never disclosable)

### 5.5 · Reliability Performance Dashboard

- **ID:** `keystone_reliability_dashboard`
- **Description:** Nicole Hargrave-Park's reliability scorecard covering all six subsidiaries
- **Modality:** API (internal enterprise dashboard platform) · daily refresh with storm-event real-time
- **KPIs populated:** 2.1.1-2.1.5 (all reliability), 2.4.1-2.4.6 (grid operational), 2.4.4 (storm restoration)
- **Residency mode:** client_owned_abarva_hosted (aggregate metrics); client_owned_client_hosted (substation-specific detail due to NERC CIP)
- **Compliance tags:** NERC CIP (critical infrastructure — partitioned access), state PUC reporting obligations
- **Reasoning scope:** Operational Excellence programs, Storm Response Coordination program, Executive Advisory
- **Disclosure scope:** Operational Excellence programs (aggregate full; specific substation reasoning-only due to NERC CIP) · Storm Response (relevant subset) · Executive Advisory (aggregate) · others (public-level metrics only)

### 5.6 · Technology Investment and Architecture Tracker

- **ID:** `keystone_tech_investment_tracker`
- **Description:** Hideki Tanaka's enterprise technology portfolio and architecture tracker
- **Modality:** Export (Excel monthly) · share-link for architecture diagrams
- **KPIs populated:** application portfolio inventory, vendor spend, cloud utilization, cybersecurity metrics (aggregate), technical debt indicators
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** cybersecurity-sensitive, vendor-confidential
- **Reasoning scope:** Cloud Migration program, Cybersecurity Modernization program, AI Platform program, Executive Advisory
- **Disclosure scope:** per-program scope aligned · cybersecurity specifics tightly controlled

### 5.7 · Safety Performance Dashboard

- **ID:** `keystone_safety_dashboard`
- **Description:** Yolanda Pettigrew's safety metrics dashboard
- **Modality:** API · weekly refresh (daily during high-activity periods)
- **KPIs populated:** 2.5.1 (OSHA DART), 2.5.2 (TRIR), 2.5.3 (Public Safety Incidents), contractor safety, leading indicators
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** OSHA reporting obligations, contractor liability sensitivities
- **Reasoning scope:** Safety programs, Executive Advisory
- **Disclosure scope:** Safety programs (full) · Executive Advisory (full) · aggregate publicly disclosable; specific incident details program-scoped

### 5.8 · Regulatory Proceedings Tracker

- **ID:** `keystone_regulatory_tracker`
- **Description:** Danielle Westergaard's rate case and regulatory proceedings tracker
- **Modality:** API (internal regulatory system) · weekly refresh; event-driven during active filings
- **KPIs populated:** 2.3.2 (Allowed ROE), 2.3.3 (Rate Case Cycle Time), 2.8.3 (Decision Latency Capital), procedural status by case
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** legal-privileged material (for case strategy), public-record material (for procedural status)
- **Reasoning scope:** Rate Case Strategy program, Regulatory Affairs programs, Executive Advisory
- **Disclosure scope:** Rate Case programs (full, including privileged in appropriate context) · Regulatory Affairs (full) · Executive Advisory (procedural full, strategy program-scoped) · other programs (public-record information only)

### 5.9 · Workforce Analytics Dashboard

- **ID:** `keystone_workforce_dashboard`
- **Description:** Derek Braithwaite's HR analytics dashboard
- **Modality:** API (Workday) · weekly refresh
- **KPIs populated:** 2.6.1-2.6.5 (all workforce KPIs), compensation analytics, talent pipeline, exit analytics
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** PII (employee-level), labor relations (union-sensitive data), state employment law
- **Reasoning scope:** HR Strategy program, Workforce Transformation program, Executive Advisory
- **Disclosure scope:** HR Strategy (aggregate full; employee-specific reasoning-only) · Workforce Transformation (aggregate full) · Executive Advisory (aggregate) · other programs (aggregate metrics only, no individual employee data)

### 5.10 · Telemetry source summary

| Source | Modality | Refresh | Residency | Most restricted by |
|---|---|---|---|---|
| Weekly Business Review | Export | Weekly | AbarVa-hosted | SOX + PII aggregate |
| CFO Scorecard | API | Weekly | Client-hosted | SOX + MNPI |
| PMO Tracker | API | Weekly | AbarVa-hosted | Internal-confidential |
| Customer Ops Dashboards | API | Daily | AbarVa-hosted | PII + state privacy |
| Reliability Dashboard | API | Daily + real-time | Hybrid | NERC CIP |
| Tech Investment Tracker | Export | Monthly | AbarVa-hosted | Cybersecurity-sensitive |
| Safety Dashboard | API | Weekly | AbarVa-hosted | OSHA + contractor |
| Regulatory Tracker | API | Weekly + event | AbarVa-hosted | Legal-privileged |
| Workforce Dashboard | API | Weekly | AbarVa-hosted | PII + labor relations |

---

## Part 6 · Dual-Scope Configuration Examples

Three illustrative scenarios showing the dual-scope model per north star Part 11 applied to Keystone.

### 6.1 · Scenario: Jonathan Aldridge's Customer Experience Transformation program

**Program scope.** Jonathan is running a Customer Experience Transformation program. His maestro is assigned to this program.

**Reasoning access (broad, informs the thinking):**
- All customer operations dashboards (5.4)
- All reliability metrics (5.5 aggregate level)
- Shadow AI pattern context (pattern 3.1)
- Workforce analytics on customer-facing roles (5.9 aggregate)
- CFO scorecard (5.2) — so the agent knows capital constraints affecting CX investment
- PMO tracker (5.3) for all initiatives

**Disclosure access (narrower, governs what gets shown):**
- Customer operations aggregate and detail
- Reliability aggregate (not NERC CIP-sensitive substation data)
- Shadow AI pattern insights in full
- Workforce aggregate metrics (not individual employee data)
- CFO scorecard: **reasoning-only** — agent can reason about capital constraints without disclosing specific forecasts
- PMO tracker: customer-experience-initiative specifics disclosable; finance-initiative specifics reasoning-only

**Example conversational pattern.** Jonathan asks: "Should I prioritize the billing system consolidation or the digital self-service portal?" Agent reasons with knowledge of capital constraints, rate case strategy, and billing system age. Response: "Given where the capital plan is right now and what's in rate case flight, I'd push hard on digital self-service — it's the faster path to the customer satisfaction target, and the capital profile is more program-flexible. Billing consolidation is a bigger program that probably wants its own rate case cycle behind it. Want to talk through the sequencing?"

Agent used CFO scorecard and regulatory tracker in reasoning. Did not disclose specific figures. Gave Jonathan an informed strategic recommendation.

### 6.2 · Scenario: Cybersecurity Modernization program with NERC CIP considerations

**Program scope.** Rachel Navarro is running the Cybersecurity Modernization Program. Her maestro is assigned.

**Reasoning access:**
- Full technology investment tracker including cybersecurity specifics
- Reliability dashboard including NERC CIP-partitioned substation data (with explicit authorization)
- External signal envelope on cybersecurity threats in utility sector
- Workforce data on cybersecurity talent

**Disclosure access:**
- Cybersecurity modernization program details within program audience
- NERC CIP-sensitive information: **reasoning-only even within this program for most outputs**; disclosure limited to specific authorized deliverables with controlled distribution
- External threat intelligence: program-scoped disclosure

**Example scenario.** Someone not in the cybersecurity program asks the Executive Advisory maestro: "What's our cybersecurity posture?" Agent has reasoning access to the overall NIST CSF maturity score (public-level metric) but does NOT have disclosure access to specific vulnerability data or incident response capability details. Response: "Current cybersecurity maturity is at NIST CSF 3.2 average with the stated target of 4.0+. The Cybersecurity Modernization Program is actively addressing the gap. I can give you the high-level trajectory and investment story. For specifics on vulnerability posture or incident response, you'd want to route through the cybersecurity program leadership — some of that information has scope restrictions I'm respecting."

### 6.3 · Scenario: CFO's sensitive capital forecast

**Situation.** Elena Vosburgh is managing a confidential capital forecast that is material non-public information. It's in the CFO Scorecard telemetry source.

**Reasoning access:**
- Finance Transformation program maestro: has reasoning access
- Executive Advisory maestro: has reasoning access
- Other transformation programs: reasoning-only on derived implications, not the specific numbers

**Disclosure access:**
- Finance Transformation program: discloses to finance-scoped users within program
- Executive Advisory: discloses to CEO-direct-reports within program
- Other programs: never discloses the specific numbers

**Example scenario.** CX VP in the CX Transformation program asks: "Can we afford to do both the billing consolidation and the digital self-service portal in the next 18 months?" Agent reasons from capital forecast knowledge. Response: "I can't share the specific capital allocation figures, but I can tell you that the combined scope of both programs is larger than the typical 18-month envelope for this kind of initiative. The sequencing question is real. A practical path might be digital self-service as the fast Phase 1 with billing consolidation as a Phase 2 initiative that begins scoping while the digital portal is deploying. Want to walk through what that would look like?"

Agent knew the number, couldn't disclose it, offered genuinely useful strategic guidance anyway. This is the informed-indirection pattern in action.

---

## Part 7 · Graph Entity Population Summary

The Keystone intelligence layer produces approximately the following graph entity counts:

- **Client entities:** 1 (Keystone) + 6 subsidiaries = 7
- **Person entities:** ~42 (full C-suite + SVP + OpCo Presidents)
- **Role entities:** ~35 (named roles across executives and SVP layer)
- **StrategicPriority entities:** 6
- **Initiative entities:** 22
- **KPI entities:** 35
- **Pattern entities:** 7 (upgraded to full packs)
- **System entities:** ~30 (core operational, corporate, digital)
- **Vendor entities:** ~25 (strategic relationships)
- **Benchmark entities:** ~40 (primary + extended cohorts × KPI dimensions)
- **TelemetrySource entities:** 9
- **ExternalEvent entities:** ~50 (initial seed of tracked events; grows with ingestion)
- **Evidence entities:** ~200 (evidence chains across patterns and KPIs)
- **Source entities:** ~30 (knowledge sources tracked)
- **Contradiction entities:** ~5 (known contradictions identified)
- **Risk entities:** ~15 (enterprise and subsidiary-level risks)
- **Decision entities:** ~8 (open high-stakes decisions)

**Total approximate entity count: ~570**

Edge counts scale with entity relationships; approximately 2,500-3,500 edges at full depth.

---

## Part 8 · Smoke Tests

Per north star Part 14 acceptance criteria, the Keystone intelligence layer should pass:

**KPI queries.**
1. "What is Keystone's current SAIDI?" → 108 minutes (CY2025) with context
2. "Who owns the interconnection queue duration metric?" → James Oppenheim with role context
3. "How does Keystone compare on allowed ROE vs peers?" → 9.5% vs 9.6% median, with subsidiary variance noted
4. "What KPIs does the Shadow AI pattern degrade?" → graph-traversal result listing AI Governance Maturity, Cybersecurity Maturity, First Call Resolution, Customer Complaint Rate

**Pattern queries.**
5. "What patterns are active at Keystone?" → 7 patterns with evidence summaries
6. "What interventions apply to the Data Center Load Interconnection pattern?" → structured intervention options with sponsor requirements
7. "What Phase 2 deliverables does Storm Response Coordination pattern require?" → structured deliverable list

**Telemetry and dual-scope queries.**
8. "What operational telemetry sources are registered?" → 9 sources listed with modality
9. "Can a Customer Experience program maestro see the CFO scorecard?" → "reasoning access yes, disclosure no"
10. "What's the NERC CIP-sensitive data handling?" → response describing partitioned access

**Complex reasoning.**
11. "Should Keystone prioritize billing system consolidation or digital self-service portal?" → informed strategic response reasoning across capital constraints, customer impact, sequencing
12. "What's changed at Keystone this quarter?" → synthesis of external signal events affecting tenant

---

## Part 9 · Ingestion Notes for Codex

### 9.1 · This overlay supersedes pure narrative in base seed

Where the base Keystone seed describes patterns narratively, this overlay provides the structured pattern pack schema. Where the base seed mentions KPIs in prose, this overlay provides the first-class KPI object schema with full metadata.

### 9.2 · Dual-scope fields are architectural

The `reasoning_scope` and `disclosure_scope` fields on every KPI, pattern, and telemetry source are not optional metadata — they drive the output filter in the agent reasoning pipeline. Schema implementation must support these fields as first-class with enforcement.

### 9.3 · Telemetry sources are composite simulation

The 9 telemetry sources listed are notional for the composite tenant. No real integrations exist. Schema and access control patterns should be implemented; actual connector bindings are not required for composite tenant (just registration metadata).

### 9.4 · Smoke test priority

Implement the 12 smoke tests listed in Part 8. All 12 should pass post-ingestion to validate intelligence layer compliance for Keystone.

### 9.5 · Template for other composites

Apex, Meridian, and First Capital will receive parallel overlays following this structure. Ingestion pipeline should be template-driven to minimize per-composite engineering effort.

---

**END OF KEYSTONE INTELLIGENCE LAYER OVERLAY**

*Companion to `intelligence-layer-north-star-spec.md` and `keystone-energy-holdings-comprehensive-seed.md`. Reference implementation for north star Parts 4, 6, 8, 9, 10, 11 applied to a single composite tenant.*
