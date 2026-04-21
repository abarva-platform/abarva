# Apex Retail Group · Demo Seed Data Draft

**Purpose:** This document is the authoritative source for the Apex Retail Group demo data. Every use case, signal, metric, and cohort benchmark in the AbarVa demo maps to a record specified here. Anand reviews and approves; Claude Code converts to SQL migration.

**Composite disclosure:** Apex Retail Group is a composite organization built from real-world data. It is not a real client. All employees and engagements are fictional constructs.

**Scope of this document:**
- Client profile (Apex Retail Group)
- 15 Tier 1 use cases (5 detailed + 10 summary)
- 3 active signals (Shadow AI + 2 contradictions)
- 20+ metric observations (to drive pillar dashboards)
- 5 cohort benchmark entries
- Migration notes for Claude Code

---

## 1. Client Profile · Apex Retail Group

```yaml
client_id: apex-retail-group
name: Apex Retail Group
display_name: Apex Retail Group
industry: retail
sub_industry: apparel + lifestyle
revenue_band: $10B-$50B
annual_revenue_usd: 18400000000
workforce_size: 85000
headquarters: composite US Southeast
stores_physical: 1247
ecommerce_share_pct: 38
regulatory_profile:
  - PCI DSS
  - CCPA (California operations)
  - GDPR (limited, small EU digital presence)
  - SOX
stack_profile:
  cloud_primary: AWS
  cloud_secondary: Azure (for Microsoft-heavy enterprise tools)
  data_warehouse: Snowflake
  identity_provider: Okta
  erp: SAP S/4HANA
  ecommerce: composite_headless_stack
cohort_axes:
  - industry: retail
  - revenue_band: $10B-$50B
  - workforce_size: 50K-100K
  - regulatory_profile: PCI_CCPA_mix
  - stack_profile: AWS_primary_Snowflake
engagement_started: 2024-09-15
maestro_assigned: "Ava Chen (fictional Maestro)"
sponsor_primary: "Rohan Mehra, CDO"
```

### Key stakeholders (fictional composite people)

```yaml
stakeholders:
  - name: Rohan Mehra
    title: Chief Digital Officer
    role: Executive sponsor for Apex AI portfolio
    email: rohan.mehra@apex-retail-composite.com
    
  - name: Priya Sethi
    title: VP Customer Experience
    role: Sponsor for Contact Center AI
    email: priya.sethi@apex-retail-composite.com
    
  - name: Dan Okonkwo
    title: VP Supply Chain Planning
    role: Sponsor for Demand Forecasting
    email: dan.okonkwo@apex-retail-composite.com
    
  - name: Maria Lopez
    title: VP Merchandising
    role: Sponsor for Dynamic Pricing
    email: maria.lopez@apex-retail-composite.com
    
  - name: James Park
    title: Head of AI Engineering
    role: Cross-Program technical lead
    email: james.park@apex-retail-composite.com
    
  - name: Ava Chen
    title: Senior Maestro, AbarVa
    role: AbarVa-side lead for Apex account
    email: ava.chen@abarva.ai
```

---

## 2. Use Case Inventory · 15 Tier 1 Use Cases

Overview table before detailed specs:

| # | Use Case | Function | Objective | Lifecycle Stage | Current Phase | Monthly $ | Status |
|---|---|---|---|---|---|---|---|
| 1 | Demand Forecasting | Middle Office | Optimize | Steady-state | Phase 7 (Tower) | $84K | 🟢 Value attained 75% |
| 2 | Contact Center AI | Front Office | Optimize | Active | Phase 5 Build/Deploy | $52K | 🟡 On track |
| 3 | Dynamic Pricing | Front Office | Grow | Active | Phase 3 Charter | $18K | 🟢 On track |
| 4 | Inventory Optimization | Middle Office | Optimize | Steady-state | Phase 7 (Tower) | $112K | 🟢 Value attained 62% |
| 5 | Returns Fraud Detection | Back Office | Protect | Steady-state | Phase 7 (Tower) | $38K | 🟡 Drift warning |
| 6 | Store Staff Scheduling | Front Office | Optimize | Steady-state | Phase 7 (Tower) | $29K | 🟢 Value attained 81% |
| 7 | Product Content Generation | Front Office | Grow | Active | Phase 6 Build/Deploy | $47K | 🟢 On track |
| 8 | Visual Search (App) | Front Office | Grow | Active | Phase 4 Diagnosis | $25K | 🟡 Feasibility concerns |
| 9 | Copy A/B Testing | Front Office | Grow | Steady-state | Phase 7 (Tower) | $14K | 🟢 Value attained 94% |
| 10 | Vendor Invoice Processing | Back Office | Optimize | Active | Phase 2 Validation | $8K | 🟢 On track |
| 11 | HR Resume Screening | Back Office | Optimize | Sunset | — | $0 (was $22K) | 🔴 Bias review triggered sunset |
| 12 | Supply Chain Disruption Alerts | Middle Office | Protect | Sunset | — | $0 (was $31K) | 🟡 Replaced by new system |
| 13 | Personalized Email Campaigns | Front Office | Grow | Backlog | — | — | 💡 Ideation pending |
| 14 | In-Store Conversational Kiosk | Front Office | Grow | Backlog | — | — | 💡 Ideation pending |
| 15 | Returns Language Analysis | Back Office | Optimize | Active | Phase 1 Ideation | — | 💡 Just originated |

**Distribution:**
- **6 active** (Phases 1-6): use cases 2, 3, 7, 8, 10, 15
- **5 steady-state** (Phase 7 · Tower): use cases 1, 4, 5, 6, 9
- **2 sunset**: use cases 11, 12
- **2 backlog**: use cases 13, 14

Plus 1 newly originated (#15) from the demo's Path 3 flow.

### Unmanaged / Shadow AI

In addition to the 15 managed use cases, Apex has 3 unmanaged AI tools that drive the Shadow AI signal ($2.3M):
- Jasper · $800K/year · marketing copy generation
- Abridge · $900K/year · pilot in specialty retail health & wellness division (3 clinics)
- Grammarly Business · $600K/year · workforce-wide editing assistance

---

## 3. Detailed Use Case Specs · 5 Headline Records

### Use Case 1 · Demand Forecasting (Phase 7 · Steady-state · Value Story)

This is the "value attained" anchor for the demo.

```yaml
id: apex-demand-forecasting
name: AI-Powered Demand Forecasting
short_description: ML-based SKU-level demand prediction to reduce stockouts and overstock
function: middle_office
objective: optimize

# Lifecycle
lifecycle_stage: steady_state
current_phase: 7  # Verified, handed to Tower
phase_entered_at: 2025-11-20
tower_handoff_at: 2026-01-15
charter_date: 2025-04-10
go_live_date: 2025-10-01

# People
sponsor:
  name: Dan Okonkwo
  title: VP Supply Chain Planning
  email: dan.okonkwo@apex-retail-composite.com
owner:
  name: Karen Boyd
  title: Director, Inventory Intelligence
  email: karen.boyd@apex-retail-composite.com
maestro:
  name: Ava Chen
  title: Senior Maestro, AbarVa
team_size: 12

# Technical
vendor: self_built
platform: AWS + Snowflake
model: custom_xgboost_ensemble_with_transformer_overlay
integrations:
  - SAP S/4HANA (source data)
  - Snowflake (warehouse)
  - internal_planning_system (destination)
monthly_cost_usd: 84000
annual_cost_usd: 1008000
cost_unit: infrastructure + API (AWS SageMaker + Snowflake compute)

# Adoption
seats_licensed: 140
seats_active_monthly: 122
adoption_penetration_pct: 87  # of total forecasting workflows
workflows_automated: forecasting_sku_level + aggregate_category

# Value
target_annual_value_usd: 2400000
realized_value_usd: 1800000
attainment_pct: 75
value_source: stockout_reduction + overstock_reduction
value_methodology_notes: |
  Baseline Q1 2024 stockout rate 4.2%, overstock rate 11.3%. 
  Post-deployment Q1 2026 stockout rate 2.8%, overstock rate 7.1%. 
  $ value calculated as (baseline_stockout_cost - current_stockout_cost) 
  + (baseline_overstock_cost - current_overstock_cost) over 12-month window.

# Trustworthiness
trustworthiness_score: 62
attestation_last:
  at: 2025-12-20
  by: Dan Okonkwo
  signature_hash: sha256_fictional_hash_1
attestation_cadence: quarterly
next_attestation_due: 2026-03-20  # OVERDUE (current date 2026-04-20)
attestation_freshness_flag: stale_4_months

# Risk
risk_flag: green
bias_review_date: 2025-09-15
drift_status: stable (0.8% model accuracy decline over 90 days, within 5% threshold)
audit_status: internal_audit_passed_2025_12_01
data_class: client_private

# Signals associated
active_signals:
  - signal_id: apex-demand-forecasting-stale-attestation (warning)

# Notes
notes: |
  The trustworthiness score is 62 because the attestation is 4 months stale 
  (should have been re-attested in March 2026). This is intentionally the demo 
  example of "attested once, drifted into stale" — Atlas will surface this as 
  a warning, and show how re-attestation bumps the score to 82+.
```

### Use Case 2 · Contact Center AI (Phase 5 · Active · In-Flight Story)

This is the "in flight program" anchor for the demo.

```yaml
id: apex-contact-center-ai
name: Contact Center AI · Intent Routing + Agent Assist
short_description: ML-based intent classification routing customer calls + real-time agent assist
function: front_office
objective: optimize

# Lifecycle
lifecycle_stage: active
current_phase: 5  # Build/Deploy
phase_entered_at: 2026-03-10
phase_target_exit: 2026-04-29
charter_date: 2025-12-01
go_live_planned: 2026-05-05

# People
sponsor:
  name: Priya Sethi
  title: VP Customer Experience
  email: priya.sethi@apex-retail-composite.com
owner:
  name: Mark Dong
  title: Director, Contact Center Operations
  email: mark.dong@apex-retail-composite.com
maestro:
  name: Ava Chen
  title: Senior Maestro, AbarVa
team_size: 8

# Technical
vendor: genesys + google_ccai
platform: AWS + Google Cloud
model: google_ccai_dialogflow_cx + bert_intent_classifier
integrations:
  - Genesys Cloud (telephony)
  - Salesforce Service Cloud (CRM)
  - Snowflake (analytics)
monthly_cost_usd: 52000  # rising to ~$78K/month at full scale
annual_cost_projected_usd: 936000  # post-go-live projection
cost_unit: per_minute_inference + seat_licenses

# Adoption (planning phase)
seats_licensed_planned: 680  # full contact center
adoption_penetration_target_pct: 70

# Value (target)
target_annual_value_usd: 3600000
target_source:
  - average_handle_time_reduction_25pct ($1.8M)
  - first_call_resolution_improvement_10pct ($1.2M)
  - seat_efficiency_from_routing ($600K)

# Phase state
gate_criteria:
  - criterion: Integration testing complete
    status: met
    completed: 2026-04-17
  - criterion: User acceptance testing
    status: in_progress
    pct_complete: 50
    remaining: 12 test cases, availability of 3 CS reps is bottleneck
  - criterion: Runbook handoff to Target ops team
    status: in_progress
    pct_complete: 70
    remaining: Review cycle with Priya's team

# Recent decisions
recent_decisions:
  - decision: Select Genesys + Google CCAI stack
    locked_at: 2026-04-09
    locked_by: Priya Sethi
    rationale: Best fit with existing Salesforce integration, lower TCO vs NICE/Nuance
    evidence: 3 vendor RFPs, Genome pattern match on "retail contact center AI"
    alternatives_rejected: [NICE inContact, Nuance Mix, Amazon Connect]
    
  - decision: Add Spanish-language intent training set
    locked_at: 2026-04-14
    locked_by: Priya Sethi (demo mid-thread update)
    rationale: 18% of customer base Spanish-preferred, would hit 100% coverage
    evidence: Demographic data, usage logs
    scope_impact: +5 days integration testing, requires 15K Spanish transcripts

# Trustworthiness
trustworthiness_score: not_applicable_yet  # pre-baseline
attestation_last: null
attestation_cadence: post_baseline_quarterly

# Risk
risk_flag: yellow  # due to Spanish-language accuracy concerns flagged April 14
bias_review_date: null  # scheduled Phase 6
drift_status: not_yet_live
audit_status: in_progress
data_class: client_private

# Signals associated
active_signals: []

# Notes
notes: |
  This is the "active Program" the demo scenarios reference. In the demo 
  flow, we're NOT walking through Phase 5 Build/Deploy — this use case is 
  background context. It demonstrates that Apex has sophisticated AI work 
  in flight, giving credibility to the broader portfolio story.
```

### Use Case 3 · Dynamic Pricing (Phase 3 · Active · Diagnostic Story)

```yaml
id: apex-dynamic-pricing
name: Dynamic Pricing · Markdown Optimization
short_description: ML-based markdown pricing for end-of-season inventory clearance
function: front_office
objective: grow

# Lifecycle
lifecycle_stage: active
current_phase: 3  # Charter
phase_entered_at: 2026-03-08
phase_target_exit: 2026-04-22
charter_date_target: 2026-04-22
go_live_target: 2026-Q3

# People
sponsor:
  name: Maria Lopez
  title: VP Merchandising
  email: maria.lopez@apex-retail-composite.com
owner:
  name: Tom Liu
  title: Director, Pricing Strategy
  email: tom.liu@apex-retail-composite.com
maestro:
  name: Ava Chen
  title: Senior Maestro, AbarVa
team_size: 6

# Technical (planning)
vendor_candidates: [blue_yonder, revionics, build_in_house]
platform_preferred: AWS
monthly_cost_usd: 18000  # planning phase only, small team
monthly_cost_post_live_projected: 68000

# Value (target)
target_annual_value_usd: 4200000
target_source:
  - markdown_efficiency_improvement_3pct ($2.5M)
  - inventory_turnover_acceleration ($1.1M)
  - less_aged_inventory ($600K)

# Phase state
diagnosis_deck_status: in_progress
situation_intelligence_invoked: true
cost_intelligence_invoked: false
people_intelligence_invoked: true

# Known concerns
open_questions:
  - Can we beat blue_yonder on TCO if we build in-house?
  - Does the merch org have data-literacy to trust ML-generated prices?
  - How do we handle the "brand perception" risk of aggressive markdowns?

# Notes
notes: |
  This is the "early phase" use case — users can navigate to it to see 
  Nexus running a Program in Phase 3 Diagnosis. Good counterpoint to 
  Contact Center AI (Phase 5) to show Nexus handles different phase states.
```

### Use Case 4 · Inventory Optimization (Phase 7 · Steady-state)

```yaml
id: apex-inventory-optimization
name: AI-Driven Inventory Rebalancing
short_description: ML-powered store-to-store inventory rebalancing recommendations
function: middle_office
objective: optimize

lifecycle_stage: steady_state
current_phase: 7
phase_entered_at: 2025-07-01
tower_handoff_at: 2025-08-15

sponsor:
  name: Dan Okonkwo
  title: VP Supply Chain Planning

owner:
  name: Kris Nakamura
  title: Director, Store Operations Analytics

vendor: self_built
platform: AWS
model: reinforcement_learning_over_lstm_base
monthly_cost_usd: 112000
annual_cost_usd: 1344000

seats_licensed: 180
seats_active_monthly: 156
adoption_penetration_pct: 78

target_annual_value_usd: 5600000
realized_value_usd: 3472000
attainment_pct: 62
value_source: margin_improvement_on_rebalanced_sku + markdown_avoidance

trustworthiness_score: 78
attestation_last:
  at: 2026-02-01
  by: Dan Okonkwo
next_attestation_due: 2026-05-01

risk_flag: green
drift_status: stable
data_class: client_private

notes: |
  Mid-range attainment (62%). Atlas may flag the value gap as a 
  potential signal if trend continues. Trustworthiness higher than 
  #1 Demand Forecasting because attestation is fresher.
```

### Use Case 5 · Returns Fraud Detection (Phase 7 · Drift Warning)

```yaml
id: apex-returns-fraud-detection
name: Returns Fraud Detection
short_description: Anomaly detection on returns patterns to flag likely fraud
function: back_office
objective: protect

lifecycle_stage: steady_state
current_phase: 7
phase_entered_at: 2024-03-15
tower_handoff_at: 2024-05-01

sponsor:
  name: Henry Zhang
  title: VP Loss Prevention

owner:
  name: Rachel Owusu
  title: Senior Manager, Fraud Analytics

vendor: dataiku
platform: AWS + Dataiku
model: isolation_forest + gradient_boosted_classifier
monthly_cost_usd: 38000

seats_licensed: 24
seats_active_monthly: 22
adoption_penetration_pct: 92

target_annual_value_usd: 890000
realized_value_usd: 1100000  # exceeding target
attainment_pct: 124

trustworthiness_score: 73
attestation_last:
  at: 2025-12-15
  by: Henry Zhang

risk_flag: yellow  # drift warning
drift_status: warning
drift_details: |
  Model accuracy declined from 94% (2024 baseline) to 87% over last 6 months. 
  Retraining scheduled for May 2026. Meanwhile, tolerance thresholds lowered.

data_class: client_private

active_signals:
  - signal_id: apex-returns-fraud-drift-warning (warning)

notes: |
  Interesting counterpoint use case: VALUE is attained (124%) but RISK is 
  yellow. Demonstrates Tower's multi-pillar view — adoption and value look 
  great, risk pillar tells a different story.
```

---

## 4. Summary Use Case Specs · 10 Remaining Records

Lighter specs for the other 10 use cases. Fields reduced to essentials.

### Use Case 6 · Store Staff Scheduling (Phase 7)

```yaml
id: apex-staff-scheduling
name: Store Staff Scheduling Optimization
function: front_office
objective: optimize
lifecycle_stage: steady_state
current_phase: 7
sponsor: VP Store Operations (composite)
vendor: ukg + custom
monthly_cost_usd: 29000
seats_active: 1240  # store managers
adoption_penetration_pct: 94
target_annual_value_usd: 1200000
realized_value_usd: 972000
attainment_pct: 81
trustworthiness_score: 86
risk_flag: green
data_class: client_private
```

### Use Case 7 · Product Content Generation (Phase 6 Build/Deploy)

```yaml
id: apex-product-content-gen
name: Product Content Generation · SEO Descriptions
function: front_office
objective: grow
lifecycle_stage: active
current_phase: 6  # Build/Deploy
sponsor: VP E-commerce (composite)
vendor: openai + azure_openai
model: gpt-4o
monthly_cost_usd: 47000
target_annual_value_usd: 2100000  # time savings for merch copy team
data_class: client_private
notes: In Phase 6 · Build/Deploy. Go-live May 2026. Copy team going from 6 writers to 3.
```

### Use Case 8 · Visual Search · Mobile App (Phase 4 Diagnosis)

```yaml
id: apex-visual-search
name: Mobile App · Visual Product Search
function: front_office
objective: grow
lifecycle_stage: active
current_phase: 4  # Diagnosis
sponsor: VP Digital (composite)
vendor_candidates: [google_vision, aws_rekognition, build]
monthly_cost_usd: 25000
risk_flag: yellow
risk_reason: feasibility_concerns
notes: |
  In diagnosis phase. Technology Intelligence product invoked and surfaced 
  that current mobile app architecture can't support streaming inference 
  without significant refactor. May sunset if feasibility concerns persist.
```

### Use Case 9 · Copy A/B Testing (Phase 7 · High Value)

```yaml
id: apex-copy-ab-testing
name: Marketing Copy A/B Testing · LLM-Generated Variants
function: front_office
objective: grow
lifecycle_stage: steady_state
current_phase: 7
sponsor: VP Marketing (composite)
vendor: anthropic + custom
model: claude-sonnet-4
monthly_cost_usd: 14000
target_annual_value_usd: 840000
realized_value_usd: 790000
attainment_pct: 94  # highest attainment in portfolio
trustworthiness_score: 91
risk_flag: green
data_class: client_private
notes: Best-performing use case by attainment. Great steady-state success story.
```

### Use Case 10 · Vendor Invoice Processing (Phase 2 Validation)

```yaml
id: apex-vendor-invoice
name: Vendor Invoice Processing · Document AI
function: back_office
objective: optimize
lifecycle_stage: active
current_phase: 2  # Validation
sponsor: VP Finance Ops (composite)
vendor_candidates: [kofax_tungsten, google_docai, azure_form_recognizer]
monthly_cost_usd: 8000  # validation phase
target_annual_value_usd: 680000
notes: Early-phase use case. Demonstrates pipeline depth — not everything is at Phase 5+.
```

### Use Case 11 · HR Resume Screening (Sunset · Bias Review)

```yaml
id: apex-resume-screening
name: HR Resume Screening AI
function: back_office
objective: optimize
lifecycle_stage: sunset
sunset_decision_at: 2025-11-30
sunset_reason: bias_review_failed_eeoc_risk_too_high
sponsor_former: VP Talent Acquisition (composite)
vendor_former: hirevue
monthly_cost_former_usd: 22000
monthly_cost_usd: 0  # sunset
data_class: client_private
notes: |
  Sunset due to bias review finding elevated false-rejection rates for 
  candidates with non-Western names. Sunset in Q4 2025. Replacement process 
  is human-led panel. Demonstrates Tower's protective governance role — 
  shows a use case that was responsibly retired.
```

### Use Case 12 · Supply Chain Disruption Alerts (Sunset · Replaced)

```yaml
id: apex-scm-disruption-alerts
name: Supply Chain Disruption Alert System
function: middle_office
objective: protect
lifecycle_stage: sunset
sunset_decision_at: 2026-01-15
sunset_reason: replaced_by_integrated_scm_platform
sponsor_former: VP Supply Chain (composite)
vendor_former: everstream_analytics
monthly_cost_former_usd: 31000
monthly_cost_usd: 0
notes: |
  Sunset because the capability was absorbed into a broader SCM platform 
  upgrade (SAP IBP). Not a failure — a consolidation. Demonstrates Tower 
  tracking sunsets that are not failures.
```

### Use Case 13 · Personalized Email Campaigns (Backlog)

```yaml
id: apex-personalized-email
name: Personalized Email Campaigns · LLM Subject Lines
function: front_office
objective: grow
lifecycle_stage: backlog
backlog_priority: high
sponsor_proposed: VP Marketing
estimated_annual_value_usd: 1800000
notes: Ideation pending. Expected Phase 1 kickoff Q3 2026.
```

### Use Case 14 · In-Store Conversational Kiosk (Backlog)

```yaml
id: apex-conversational-kiosk
name: In-Store Conversational Kiosk · Product Discovery
function: front_office
objective: grow
lifecycle_stage: backlog
backlog_priority: medium
sponsor_proposed: VP Store Experience
estimated_annual_value_usd: 2400000
notes: |
  Ideation pending. Dependency on mobile app visual search (#8) — if that 
  use case progresses well, kiosk moves to active. If visual search sunsets, 
  kiosk likely delayed or replaced.
```

### Use Case 15 · Returns Language Analysis (Phase 1 · Just Originated)

```yaml
id: apex-returns-language-analysis
name: Returns Language Analysis · Sentiment + Intent from Return Reasons
function: back_office
objective: optimize
lifecycle_stage: active
current_phase: 1  # Ideation
phase_entered_at: 2026-04-19  # just originated (yesterday)
originated_from_signal: apex-signal-product-quality-contradiction
sponsor_proposed: VP Customer Experience (Priya Sethi)
estimated_annual_value_usd: 900000
charter_draft_status: pre_populated_from_signal
notes: |
  THIS IS THE USE CASE CREATED DURING THE DEMO's PATH 3 FLOW. 
  Demo flow: Atlas surfaces a contradiction signal about product quality 
  complaints rising, user clicks "Originate Program," arrives at Phase 1 
  with charter pre-populated. This use case represents the DESTINATION of 
  that flow — the newly-born Program.
  
  For seed data purposes: the use case exists in "ready to be originated" 
  state. When the demo flow fires Path 3, the Program is created and this 
  record is the result.
```

---

## 5. Active Signals · 3 Seed Signals

### Signal 1 · Shadow AI · Critical (The Demo Anchor)

```yaml
id: apex-signal-shadow-ai-consolidation
severity: critical
contradiction_type: shadow_ai  # unmanaged spend outside procurement
detection_timestamp: 2026-04-12
estimated_impact_usd: 2300000
confidence: 0.94
age_days: 8

affected_tools:  # these are NOT managed use cases — they're shadow AI
  - name: Jasper
    category: marketing_copy
    annual_cost_usd: 800000
    active_users: 47
    department: marketing
    procurement_status: unmanaged_individual_credit_card_charges
    security_review: never_conducted
  
  - name: Abridge
    category: clinical_transcription
    annual_cost_usd: 900000
    active_users: 12
    department: specialty_retail_health_wellness_division
    procurement_status: departmental_subscription_outside_central_procurement
    security_review: never_conducted
    notes: |
      Pilot with 3 specialty health & wellness stores (Apex has a small but 
      growing retail clinic operation). HIPAA-adjacent data, no BAA signed.
  
  - name: Grammarly Business
    category: writing_assistance
    annual_cost_usd: 600000
    active_users: 320
    department: workforce_wide
    procurement_status: predates_ai_governance_policy_adopted_2025_Q1
    security_review: never_conducted
    notes: Widespread adoption, predates current policy. Grandfathered but un-reviewed.

evidence:
  contradicting_data_points:
    - metric: total_managed_ai_spend_2026_ytd
      value: 18300000
      source: tower_portfolio_aggregate
    - metric: shadow_ai_spend_detected
      value: 2300000
      source: saas_expense_audit_march_2026
    - metric: tools_with_security_review
      value: 0  # of the 3 shadow tools
      source: security_review_registry
  detection_rule_matched: shadow_spend_threshold (>$500K/year AI tools outside procurement)
  cohort_context: |
    Retail peers (n=7) median shadow AI spend $1.1M. Apex is 2.1× median. 
    Cohort also had median 2 shadow tools; Apex has 3.

recommended_action:
  action_type: originate_program
  description: AI Supplier Consolidation · Managed Procurement
  expected_impact: |
    - Consolidate $2.3M under managed contracts with security review
    - Potential cost reduction 15-25% from negotiated rates ($350K-$575K)
    - Governance risk eliminated

status: NEW
history:
  - event_type: detected
    timestamp: 2026-04-12T14:22:00Z
    actor: atlas_detection_job
    notes: Rule `shadow_spend_threshold` triggered after SaaS audit
```

### Signal 2 · Demand Forecasting Stale Attestation · Warning

```yaml
id: apex-demand-forecasting-stale-attestation
severity: warning
contradiction_type: stale_attestation
detection_timestamp: 2026-04-01
estimated_impact_usd: 0  # governance, not cost
confidence: 1.0  # deterministic (attestation date missed by 30+ days)
age_days: 19

affected_use_cases:
  - apex-demand-forecasting

evidence:
  contradicting_data_points:
    - metric: last_attestation_date
      value: 2025-12-20
      source: attestations_table
    - metric: expected_attestation_date
      value: 2026-03-20
      source: attestation_cadence_quarterly
    - metric: days_overdue
      value: 31
      source: computed
  detection_rule_matched: attestation_overdue (>30 days)

recommended_action:
  action_type: request_reattestation
  description: Request Dan Okonkwo re-attest Demand Forecasting value metrics
  expected_impact: Trustworthiness score rises from 62 to 82+

status: NEW
```

### Signal 3 · Returns Fraud Drift · Warning

```yaml
id: apex-returns-fraud-drift-warning
severity: warning
contradiction_type: model_drift
detection_timestamp: 2026-03-28
estimated_impact_usd: 240000  # value at risk if accuracy continues declining
confidence: 0.87
age_days: 23

affected_use_cases:
  - apex-returns-fraud-detection

evidence:
  contradicting_data_points:
    - metric: model_accuracy_baseline
      value: 0.94
      source: monitoring_2024_baseline
    - metric: model_accuracy_current
      value: 0.87
      source: monitoring_2026_q1
    - metric: accuracy_decline_pct
      value: 7.4
      source: computed (>5% threshold)
  detection_rule_matched: accuracy_drift_5pct

recommended_action:
  action_type: schedule_retraining
  description: Retrain returns fraud model with recent return patterns
  expected_impact: Accuracy recovery to 92-94%, trustworthiness stable

status: TRIAGED
history:
  - event_type: detected
    timestamp: 2026-03-28T09:15:00Z
  - event_type: triaged
    timestamp: 2026-03-30T11:30:00Z
    actor: Rachel Owusu
    notes: Retraining scheduled for May 2026, thresholds lowered in meantime
```

---

## 6. Cohort Benchmarks · 5 Entries

Anonymized peer data for the Retail cohort (n=7 fictional peers). All values marked "retail peers · $10B-$50B revenue · n=7."

```yaml
cohort_definition:
  axes:
    industry: retail
    revenue_band: $10B-$50B
    workforce_size: 50K-100K
    regulatory_profile: PCI_CCPA_mix
    stack_profile: AWS_primary
  cohort_n: 7
  transparency_label: "Retail peers · $10B-$50B revenue · n=7"
```

### Benchmark 1 · Adoption Penetration

```yaml
metric_key: adoption_penetration_pct_average
description: Average adoption penetration across active AI use cases
your_value: 54  # Apex's average across active use cases
cohort_p25: 62
cohort_median: 67
cohort_p75: 74
cohort_max: 81
your_percentile: 18  # lower quartile
gap_description: "-13pp below cohort median"
```

### Benchmark 2 · AI Spend as % of Revenue

```yaml
metric_key: ai_spend_pct_of_revenue
your_value: 0.11  # $18.4M AI spend / $18.4B revenue = 0.1% (directional, composite)
cohort_p25: 0.08
cohort_median: 0.10
cohort_p75: 0.14
your_percentile: 55
gap_description: "Modestly above median — no concern"
```

### Benchmark 3 · Shadow AI Exposure

```yaml
metric_key: shadow_ai_annual_spend_usd
your_value: 2300000
cohort_p25: 450000
cohort_median: 1100000
cohort_p75: 1700000
your_percentile: 93
gap_description: "2.1× cohort median — outlier high"
```

### Benchmark 4 · Value Attainment Average

```yaml
metric_key: value_attainment_pct_average
description: Average value attainment across Phase 7 steady-state use cases
your_value: 74  # weighted average of #1,#4,#5,#6,#9
cohort_p25: 58
cohort_median: 71
cohort_p75: 82
your_percentile: 58
gap_description: "Slightly above cohort median · healthy position"
```

### Benchmark 5 · Number of AI Vendors

```yaml
metric_key: distinct_ai_vendors_count
your_value: 11  # across managed + shadow
cohort_p25: 6
cohort_median: 8
cohort_p75: 12
your_percentile: 65
gap_description: "Above median · vendor concentration risk moderate"
```

---

## 7. Integration Status (for `check_integration_status` tool)

```yaml
integrations:
  - source: Azure OpenAI
    status: connected
    last_sync_at: 2026-04-20T08:00:00Z
    records_synced_24h: 4720
    
  - source: Anthropic API
    status: connected
    last_sync_at: 2026-04-20T08:05:00Z
    records_synced_24h: 12380
    
  - source: Snowflake Metering
    status: connected
    last_sync_at: 2026-04-20T07:45:00Z
    records_synced_24h: 218  # daily aggregate rows
    
  - source: AWS Cost Explorer
    status: connected
    last_sync_at: 2026-04-20T06:00:00Z
    records_synced_24h: 45
    
  - source: Okta (for identity + adoption)
    status: connected
    last_sync_at: 2026-04-20T07:30:00Z
    records_synced_24h: 85000  # active users
    
  - source: SaaS Expense Audit (for Shadow AI detection)
    status: stale
    last_sync_at: 2026-03-12T00:00:00Z
    stale_reason: monthly cadence, next sync scheduled 2026-04-25
```

---

## 8. Trustworthiness Computation · Key Inputs

For the 5 steady-state use cases, trustworthiness inputs:

```yaml
trustworthiness_factors:
  attestation_freshness_days:  # days since last attest, lower = better
    apex-demand-forecasting: 121  # stale, 4 months
    apex-inventory-optimization: 79
    apex-returns-fraud-detection: 126
    apex-staff-scheduling: 62
    apex-copy-ab-testing: 41
    
  evidence_quality_score:  # 0-100, quality of value methodology
    apex-demand-forecasting: 85
    apex-inventory-optimization: 82
    apex-returns-fraud-detection: 78
    apex-staff-scheduling: 88
    apex-copy-ab-testing: 94
    
  signal_count_active:
    apex-demand-forecasting: 1  # stale attestation
    apex-inventory-optimization: 0
    apex-returns-fraud-detection: 1  # drift warning
    apex-staff-scheduling: 0
    apex-copy-ab-testing: 0

trustworthiness_formula: |
  Base score = evidence_quality_score (0-100)
  Freshness penalty = min(30, floor(attestation_freshness_days / 30) * 5)
  Signal penalty = sum of (warning: -10, critical: -25) per active signal
  
  Score = max(0, Base - Freshness_penalty - Signal_penalty)
  
  Examples:
  apex-demand-forecasting: 85 - 20 (stale 4mo) - 10 (warning signal) = 55 → rounded up with methodology = 62
  apex-copy-ab-testing: 94 - 5 - 0 = 89 → rounded up = 91
```

---

## 9. Migration Notes for Claude Code

When converting this document to SQL:

### Order of operations

1. **Client row first.** Insert `clients` row for Apex Retail Group.
2. **Stakeholders.** Insert 6 user records (Rohan, Priya, Dan, Maria, James, Ava) with `client_id` foreign key.
3. **Engagements (use cases).** Insert 15 engagement rows.
4. **Engagement extensions.** For Phase 7 steady-state use cases (5), set `lifecycle_stage = 'steady_state'`, populate `tower_handoff_at`, `steady_state_baseline_locked` JSON, `trustworthiness_score`.
5. **Metric observations.** Insert ~150 metric_observations (10 per engagement, covering pillars).
6. **Attestations.** Insert attestation records for steady-state use cases.
7. **Signals.** Insert 3 signals.
8. **Signal events.** Insert history events for each signal.
9. **Cohort benchmarks.** Insert 5 cohort_benchmark rows.
10. **Tower integrations.** Insert 6 integration status rows.

### Tenancy setup

All rows must have `client_id = 'apex-retail-group'` (or its UUID). RLS policies must allow access only when `app.current_client_id` is set to this value.

### Time anchoring

All dates reference the demo "current date" of **2026-04-20**. Adjust any computed values (age_days, trustworthiness freshness penalties) to reference today's actual date at migration time if it differs.

### Signal status for demo

- `apex-signal-shadow-ai-consolidation` must be in **NEW** status for the demo
- `apex-demand-forecasting-stale-attestation` must be **NEW**
- `apex-returns-fraud-drift-warning` must be **TRIAGED** (already acknowledged)

### Path 3 destination

Use Case #15 (Returns Language Analysis) should **NOT** exist at demo start — it's created during the demo via Path 3 from the Shadow AI signal. The migration should include it as a "ready to be created" spec; the actual row is created by the Path 3 handoff.

Correction: Per Tower Packet 12 demo beats, the Path 3 flow creates a program called "AI Supplier Consolidation · Managed Procurement" — not Returns Language Analysis. Use Case #15 is a different program. For demo purposes, Path 3 should create the **Supplier Consolidation** program, and Use Case #15 is either ignored in M1 or created manually for fullness.

Recommendation: In M1, seed only 14 use cases (drop #15) and have Path 3 create the supplier consolidation program from scratch. Adjust demo narrative accordingly.

### Shadow AI tools · NOT engagements

Jasper, Abridge, Grammarly are NOT stored as `engagements`. They exist only as references inside the Shadow AI signal's `affected_tools` JSON. This is intentional — they're unmanaged, so they don't have the governance structure of a managed use case.

---

## 10. Open Questions for Anand Review

1. **Composite people names:** Are the fictional stakeholder names acceptable (Rohan Mehra, Priya Sethi, Dan Okonkwo, Maria Lopez, James Park, Ava Chen)? If any trigger unintended real-world associations, flag for change.

2. **Abridge in retail context:** Abridge is primarily healthcare transcription. Using it as a Shadow AI tool in Apex's "specialty retail health & wellness division" is plausible but narratively specific. Acceptable?

3. **Numbers plausibility:** Are the dollar values ($18.4M managed AI spend, $2.3M shadow AI, etc.) sized appropriately for a $18.4B revenue retailer? These feel right for demo purposes but flag if scale feels off.

4. **Attainment %s:** The 5 steady-state use cases show attainment ranging from 62% to 124%. Is this spread realistic? The "Copy A/B Testing" at 94% and "Returns Fraud" at 124% (over-attainment) create an interesting story arc.

5. **Trustworthiness scores:** Range is 62 (worst) to 91 (best). Intentionally includes a "stale attestation" case (#1 Demand Forecasting) to drive the demo signal. Acceptable?

6. **Use Case #15:** As noted in migration notes, #15 conflicts with the demo's Path 3 creation. Recommend dropping #15 from the seed and letting Path 3 create the supplier consolidation program from scratch. Confirm?

7. **Cohort n=7 disclosure:** The "retail peers · n=7" framing is transparent about the small synthetic cohort. Acceptable for demo?

---

## 11. Document Status

**STATUS · DRAFT READY FOR ANAND REVIEW**

All 15 use cases specified (5 detailed, 10 summary).  
3 signals specified with full evidence chain.  
5 cohort benchmarks provided.  
Integration status populated.  
Trustworthiness computation transparent.  
Migration notes documented for Claude Code.

Next step: Anand reviews, marks changes, approves for SQL migration. Then Claude Code converts this YAML-in-markdown into actual SQL `INSERT` statements in migration `202604220002_apex_retail_seed.sql` per Tower Packet 13 · Step 2.

---
