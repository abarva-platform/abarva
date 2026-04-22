# Apex Retail · Seed Data · Reconciled Spec

**Purpose:** Reconcile my Apex seed draft with the Programs fixtures Claude Code already shipped in `src/scripts/seed/programs-demo-apex.ts`. The original draft assumed a greenfield; Code has already committed 4 active Apex programs + participants. This spec specifies what Tower needs to ADD on top of Code's existing seed, without overwriting what's there.

**Principle:** Code owns Programs-surface fixtures. Tower extends them (lifecycle_stage column, baseline_lock, trustworthiness) and adds NEW engagements for post-handoff (steady-state / sunset / backlog) use cases that don't need full Program artifacts.

**Status:** Ready for Anand review → Claude Code execution after PR #12 merges.

---

## 1. What Code already shipped

Observed from the PR #12 smoke output:

```
Apex Retail portfolio programs (active):
1. Contact Center AI
2. Store Associate Productivity
3. Unified Customer Data Platform
4. [4th program — name TBD, in output]
+ HR ERP (pre-existing, cross-client)
```

Each has: phase state, archetype, modules, team members (participants), activity log, metrics. Contact Center AI shown with 9 modules, 2 team, 8 activity, Phase 5 locked, 3 metrics.

**Gap I need Claude Code to confirm before final SQL:**
- Exact names of all 4 Apex active programs
- Sponsor names seeded for each
- Team member names
- Which archetype each was assigned

Once confirmed, I reconcile display names across Tower fixtures. Placeholder names used below pending confirmation.

---

## 2. Reconciled Use Case Inventory (17 entities)

Tower sees all engagements, not just Programs-surface ones. Table covers the full Tower inventory:

| # | Use Case | Owner | Lifecycle | Source |
|---|---|---|---|---|
| 1 | Contact Center AI | **Code** | active · Phase 5 | already seeded |
| 2 | Store Associate Productivity | **Code** | active · Phase 1 | already seeded |
| 3 | Unified Customer Data Platform | **Code** | active · Phase 1 | already seeded |
| 4 | [Code's 4th Apex program] | **Code** | active · TBD | already seeded |
| 5 | Demand Forecasting | **Tower** | steady_state · Phase 7 | new seed |
| 6 | Inventory Optimization | **Tower** | steady_state · Phase 7 | new seed |
| 7 | Returns Fraud Detection | **Tower** | steady_state · Phase 7 | new seed |
| 8 | Store Staff Scheduling | **Tower** | steady_state · Phase 7 | new seed |
| 9 | Copy A/B Testing | **Tower** | steady_state · Phase 7 | new seed |
| 10 | HR Resume Screening | **Tower** | sunset | new seed |
| 11 | Supply Chain Disruption Alerts | **Tower** | sunset | new seed |
| 12 | Personalized Email Campaigns | **Tower** | backlog | new seed |
| 13 | In-Store Conversational Kiosk | **Tower** | backlog | new seed |

Dropped from original draft: Dynamic Pricing, Product Content Gen, Visual Search, Vendor Invoice Processing, Returns Language Analysis. Reasons:
- Dynamic Pricing / Product Content Gen / Visual Search / Vendor Invoice — redundant with Code's 4 active programs. Tower doesn't need more active programs than Code shipped.
- Returns Language Analysis (#15 in original) — was the Path 3 destination conflict. Resolved: Path 3 creates AI Supplier Consolidation from Shadow AI signal at demo time, not pre-seeded.

**Net result:** Code's 4 active + Tower's 9 additions (5 steady + 2 sunset + 2 backlog) = 13 seeded engagements. The 14th slot is reserved for the Path 3 creation during demo (AI Supplier Consolidation).

---

## 3. Tower Extensions to Code's 4 Active Programs

Additive only. Code's fields remain untouched. Tower adds:

```sql
-- For each of Code's 4 active Apex programs:
UPDATE engagements
SET 
  lifecycle_stage = 'active',
  tower_handoff_at = NULL,
  steady_state_baseline_locked = NULL,
  sunset_decision_at = NULL,
  sunset_reason = NULL,
  trustworthiness_score = NULL
WHERE client_id = 'apex-retail-group' AND lifecycle_stage IS NULL;
```

Active programs have NULL for Tower-specific fields by design. Trustworthiness is computed only post-Phase-7 handoff.

**Metric observations added** (per active program, ~5 observations each):
- `monthly_cost_usd` — current spend
- `seats_licensed` — target footprint
- `seats_active_monthly` — current adoption (may be 0 pre-go-live)
- `target_annual_value_usd` — charter target
- `risk_flag` — current risk posture (green/yellow/red)

Values for Contact Center AI (use this as template):
- monthly_cost_usd: 52000
- seats_licensed_planned: 680
- seats_active_monthly: 0 (pre-go-live)
- target_annual_value_usd: 3600000
- risk_flag: yellow (Spanish-language accuracy concern, per original draft)

Values for Store Associate Productivity, Unified Customer Data Platform, and 4th program: to be filled once names and archetypes confirmed.

---

## 4. Tower-Only Engagements (9 new seed inserts)

### 4.1 · Demand Forecasting (steady-state, value story)

```yaml
id: apex-demand-forecasting
client_id: apex-retail-group
name: AI-Powered Demand Forecasting
function: middle_office
objective: optimize
lifecycle_stage: steady_state
current_phase: 7
phase_entered_at: 2025-11-20
tower_handoff_at: 2026-01-15

sponsor_name: Dan Okonkwo
sponsor_title: VP Supply Chain Planning
owner_name: Karen Boyd
owner_title: Director, Inventory Intelligence

vendor: self_built
platform: AWS + Snowflake
monthly_cost_usd: 84000

seats_licensed: 140
seats_active_monthly: 122
adoption_penetration_pct: 87

target_annual_value_usd: 2400000
realized_value_usd: 1800000
attainment_pct: 75

trustworthiness_score: 62
last_attestation_at: 2025-12-20
last_attestation_by: Dan Okonkwo
next_attestation_due: 2026-03-20  # overdue
risk_flag: green
data_class: client_private

# Purpose in demo: "stale attestation" signal source
```

### 4.2 · Inventory Optimization (steady-state)

```yaml
id: apex-inventory-optimization
client_id: apex-retail-group
name: AI-Driven Inventory Rebalancing
function: middle_office
objective: optimize
lifecycle_stage: steady_state
current_phase: 7
tower_handoff_at: 2025-08-15

sponsor_name: Dan Okonkwo
sponsor_title: VP Supply Chain Planning
owner_name: Kris Nakamura
owner_title: Director, Store Operations Analytics

vendor: self_built
monthly_cost_usd: 112000

seats_licensed: 180
seats_active_monthly: 156
adoption_penetration_pct: 78

target_annual_value_usd: 5600000
realized_value_usd: 3472000
attainment_pct: 62
trustworthiness_score: 78
last_attestation_at: 2026-02-01
risk_flag: green
```

### 4.3 · Returns Fraud Detection (steady-state, drift warning)

```yaml
id: apex-returns-fraud-detection
client_id: apex-retail-group
name: Returns Fraud Detection
function: back_office
objective: protect
lifecycle_stage: steady_state
current_phase: 7
tower_handoff_at: 2024-05-01

sponsor_name: Henry Zhang
sponsor_title: VP Loss Prevention
owner_name: Rachel Owusu
owner_title: Senior Manager, Fraud Analytics

vendor: dataiku
monthly_cost_usd: 38000

seats_licensed: 24
seats_active_monthly: 22
adoption_penetration_pct: 92

target_annual_value_usd: 890000
realized_value_usd: 1100000
attainment_pct: 124  # over-attainment

trustworthiness_score: 73
last_attestation_at: 2025-12-15
risk_flag: yellow  # drift
drift_details: Model accuracy 94% → 87% over 6mo; retraining May 2026

# Purpose in demo: "value attained but risk yellow" multi-pillar story
```

### 4.4 · Store Staff Scheduling (steady-state, healthy)

```yaml
id: apex-staff-scheduling
client_id: apex-retail-group
name: Store Staff Scheduling Optimization
function: front_office
objective: optimize
lifecycle_stage: steady_state
current_phase: 7

sponsor_name: [TBD — composite VP Store Ops]
vendor: ukg + custom
monthly_cost_usd: 29000
seats_active_monthly: 1240

target_annual_value_usd: 1200000
realized_value_usd: 972000
attainment_pct: 81
trustworthiness_score: 86
risk_flag: green
```

### 4.5 · Copy A/B Testing (steady-state, best performer)

```yaml
id: apex-copy-ab-testing
client_id: apex-retail-group
name: Marketing Copy A/B Testing · LLM-Generated Variants
function: front_office
objective: grow
lifecycle_stage: steady_state
current_phase: 7

sponsor_name: [TBD — composite VP Marketing]
vendor: anthropic + custom
model: claude-sonnet-4
monthly_cost_usd: 14000

target_annual_value_usd: 840000
realized_value_usd: 790000
attainment_pct: 94  # highest in portfolio
trustworthiness_score: 91
risk_flag: green

# Purpose in demo: best-in-class steady-state success story
```

### 4.6 · HR Resume Screening (sunset, bias)

```yaml
id: apex-resume-screening
client_id: apex-retail-group
name: HR Resume Screening AI
function: back_office
objective: optimize
lifecycle_stage: sunset
sunset_decision_at: 2025-11-30
sunset_reason: bias_review_failed_eeoc_risk_too_high

vendor_former: hirevue
monthly_cost_usd: 0  # sunset
monthly_cost_former_usd: 22000

# Purpose in demo: responsible retirement story, governance working
```

### 4.7 · Supply Chain Disruption Alerts (sunset, replaced)

```yaml
id: apex-scm-disruption-alerts
client_id: apex-retail-group
name: Supply Chain Disruption Alert System
function: middle_office
objective: protect
lifecycle_stage: sunset
sunset_decision_at: 2026-01-15
sunset_reason: replaced_by_integrated_scm_platform_sap_ibp

vendor_former: everstream_analytics
monthly_cost_usd: 0
monthly_cost_former_usd: 31000

# Purpose in demo: sunset via consolidation, not failure
```

### 4.8 · Personalized Email Campaigns (backlog)

```yaml
id: apex-personalized-email
client_id: apex-retail-group
name: Personalized Email Campaigns · LLM Subject Lines
function: front_office
objective: grow
lifecycle_stage: backlog
backlog_priority: high
estimated_annual_value_usd: 1800000
```

### 4.9 · In-Store Conversational Kiosk (backlog)

```yaml
id: apex-conversational-kiosk
client_id: apex-retail-group
name: In-Store Conversational Kiosk · Product Discovery
function: front_office
objective: grow
lifecycle_stage: backlog
backlog_priority: medium
estimated_annual_value_usd: 2400000
```

---

## 5. Three Signals (unchanged from original draft)

### 5.1 · Shadow AI · Critical (demo anchor)

```yaml
id: apex-signal-shadow-ai-consolidation
client_id: apex-retail-group
severity: critical
contradiction_type: shadow_ai
detection_timestamp: 2026-04-12
estimated_impact_usd: 2300000
confidence: 0.94
status: NEW

affected_tools:
  - name: Jasper
    annual_cost_usd: 800000
    active_users: 47
    department: marketing
  - name: Abridge
    annual_cost_usd: 900000
    active_users: 12
    department: specialty_retail_health_wellness_division
    notes: Pilot 3 retail clinics, HIPAA-adjacent no BAA
  - name: Grammarly Business
    annual_cost_usd: 600000
    active_users: 320
    department: workforce_wide
    notes: Predates 2025 AI governance policy

cohort_context: Retail peers (n=7) median $1.1M shadow spend; Apex 2.1× median.

recommended_action_type: originate_program
recommended_action_description: AI Supplier Consolidation · Managed Procurement
```

### 5.2 · Demand Forecasting Stale Attestation · Warning

```yaml
id: apex-signal-demand-forecasting-stale
client_id: apex-retail-group
severity: warning
contradiction_type: stale_attestation
detection_timestamp: 2026-04-01
estimated_impact_usd: 0  # governance
affected_engagement_id: apex-demand-forecasting
status: NEW
days_overdue: 31
```

### 5.3 · Returns Fraud Drift · Warning (already triaged)

```yaml
id: apex-signal-returns-fraud-drift
client_id: apex-retail-group
severity: warning
contradiction_type: model_drift
detection_timestamp: 2026-03-28
estimated_impact_usd: 240000
affected_engagement_id: apex-returns-fraud-detection
status: TRIAGED
accuracy_baseline: 0.94
accuracy_current: 0.87
```

---

## 6. Cohort Benchmarks (5 entries, unchanged)

All transparency_label: *"Retail peers · $10B-$50B revenue · n=7"*

| metric_key | your_value | cohort_median | your_percentile | gap |
|---|---|---|---|---|
| adoption_penetration_pct_avg | 54 | 67 | 18 | -13pp |
| ai_spend_pct_of_revenue | 0.11 | 0.10 | 55 | slightly above |
| shadow_ai_annual_spend_usd | 2300000 | 1100000 | 93 | 2.1× median |
| value_attainment_pct_avg | 74 | 71 | 58 | slightly above |
| distinct_ai_vendors_count | 11 | 8 | 65 | above median |

---

## 7. Execution Plan for Claude Code

When PR #12 is merged and Claude Code picks this up, the order:

**Step 1 · Confirm Code's existing seed names.** Read `src/scripts/seed/programs-demo-apex.ts`, extract exact program names, sponsor names, team member names for all 4 Apex active programs. Update §1 above.

**Step 2 · Run Tower foundation migration** (Tower spec Packet 13 Step 1). Adds 7 Tower tables + engagement extension columns. RLS on everything.

**Step 3 · Extend Code's 4 active programs with Tower columns.** SQL UPDATE per §3. Lifecycle_stage='active', trust fields NULL.

**Step 4 · Insert 9 new Tower engagements** per §4. Same `client_id = apex-retail-group`. Same tenancy.

**Step 5 · Insert metric observations** across all 13 engagements. ~10 per engagement for time-series pillar data (cost, adoption, value, risk).

**Step 6 · Insert 3 signals** per §5. Link to engagements where applicable.

**Step 7 · Insert 5 cohort_benchmarks** per §6.

**Step 8 · Insert integration status rows** (6 integrations: Azure OpenAI, Anthropic, Snowflake, AWS, Okta, SaaS Expense Audit — last one stale for demo).

Single migration file: `202604220002_apex_retail_seed_tower.sql`. Separate from whatever Code's existing seed migration is, so Tower seed can be re-run independently.

---

## 8. Open Questions for Anand (reduced from 7 to 4)

Items resolved by reconciliation:
- ~~Use Case #15 conflict~~ → resolved, Path 3 creates AI Supplier Consolidation at demo time
- ~~Composite names~~ → mostly deferred to Code's already-seeded names
- ~~Numbers plausibility~~ → mostly unchanged, re-review if needed

Still need your call on:

1. **Abridge in retail context** — specialty health & wellness division plausible, or swap for a more retail-native shadow tool (e.g., Synthesia for training videos, Notion AI workforce-wide)?
2. **Attainment spread 62%–124%** — narrative arc intentional (stale-attestation on 62%, drift-warning on 124%). Keep or flatten?
3. **Trustworthiness 62 vs 91 range** — deliberately wide to drive attestation re-lock demo moment. Confirm?
4. **Placeholder sponsor names for 2 steady-state use cases** (§4.4, §4.5) — fictional composite names fine, or should Claude Code reuse sponsors it already seeded for active programs?

---

## 9. Status

**Ready.** Reconciled, additive, doesn't fight Code's existing work. Waiting on:
1. Your answers to the 4 open questions above
2. PR #12 merge (then Code reads §1 from its own seed file and confirms names)
3. Tower M1 kickoff

Output file (this one): `abarva-apex-seed-data-reconciled.md` supersedes `abarva-apex-seed-data-draft.md`. Can delete the draft once you've reviewed this version.
