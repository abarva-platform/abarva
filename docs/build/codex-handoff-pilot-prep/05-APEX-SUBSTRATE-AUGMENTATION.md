# 05 · Apex Substrate Augmentation Spec

**Purpose:** the exact rows Codex adds to Apex Retail's substrate to give Atlas drill-down depth and pattern detection material. ~60-80 new rows across 4 tables. Schema-valid, no PII, plausible content.

This is the spec for PR 2 of the implementation plan.

---

## Why augmentation is needed

Today's Apex `full_load.json` (per `docs/build/intelligence/ai-initiatives-package/templates/apex-retail/full_load.json`) has shallow KPI history (1-2 rows per initiative), few decisions, no dissent records, sparse stakeholder notes, minimal scenarios.

Atlas v1 reasoning grades poorly on shallow substrate because:

- Pattern 02 (shared root) needs cross-row evidence
- Trend analysis (in MetricExplanation drill-down) needs 3+ quarters
- "If you only do one thing today" benefits from decision dissent context
- Refusal vs. attempt calibration improves with rich substrate

**Goal:** Apex becomes the gold-standard demo tenant, not the thinnest.

---

## Augmentation summary

| Table | Rows today | Rows after | Net add |
|---|---|---|---|
| ai_initiative_kpis | ~16 | ~80 | +64 |
| ai_initiative_decisions | ~5 | ~12 | +7 |
| ai_initiative_scenarios | ~4 | ~12 | +8 |
| ai_initiative_stakeholder_notes | ~4 | ~14 | +10 |
| ai_initiative_vendors | ~6 | ~6-8 | +0-2 (renewal date adjustments) |
| **Total new rows** | | | **~89** |

---

## Per-initiative spec

Apex has 7 initiatives (display IDs AR-01..AR-07 — verify exact list in current substrate). For each, augment as below.

### AR-01 · M365 Copilot Enterprise Rollout

(Adjust naming if Apex's actual initiative differs — Codex reads substrate to confirm.)

**Profile:** scaled stage, healthy or aligned-callout, large-scale Microsoft tooling.

**KPIs to add (4 quarters each):**

| KPI | Q3-2025 | Q4-2025 | Q1-2026 | Q2-2026 (latest) | Unit | Confidence |
|---|---|---|---|---|---|---|
| Active seats / licensed seats | 1840 / 8400 | 2100 / 8400 | 2016 / 8400 | 2280 / 8400 | seat ratio | HIGH |
| Adoption per role: Finance | 38% | 47% | 52% | 56% | pct | HIGH |
| Adoption per role: Sales | 8% | 10% | 12% | 14% | pct | HIGH |
| Hours saved per active user (self-report) | 2.8 | 3.1 | 3.4 | 3.6 | hrs/wk | MED |

**Stakeholder notes (2):**

1. *quote (consent=true), Finance Director:* "Copilot in Excel changed the close cycle by a half-day per close. We're rolling it to all five regional finance teams."
2. *theme only (consent=false):* IT_organization_pushback — "Finance is happy; IT spent a quarter convincing security to allow it."

**Decisions (1, no dissent):**

- Decision: "Rollout Copilot to Sales (regions 1-3 only)"
- Date: 2026-03-15
- Sponsor: VP Sales Enablement
- Status: implemented
- Outcome: Q2 active seats expanded; adoption tracking below pace.

**Scenarios (1):**

- Scenario: "If EA renewal lapses without bundle"
- Trigger: Microsoft EA expiry without volume bundle locked
- Time horizon: 6 months
- Probability: 25%
- Impact: Cost per Copilot seat would rise ~40%; sustaining 2280 seats adds $1.1M annual cost.

---

### AR-02 · SAP Joule Pilot for Finance

**Profile:** value_lag, MED confidence, $3.2M committed annual, ~$1.4M measured (similar to Meridian's MH-06).

**KPIs (4 quarters):**

| KPI | Q3-2025 | Q4-2025 | Q1-2026 | Q2-2026 | Unit | Confidence |
|---|---|---|---|---|---|---|
| Realized efficiency gain (vs Q2-2025 baseline) | 8% | 14% | 19% | 22% | pct | MED |
| RPA migration completion | 12% | 28% | 41% | 53% | pct of pipeline | MED |
| Per-process AI assist adoption | 4% | 11% | 18% | 24% | pct | LOW |

**Stakeholder notes (2):**

1. *quote (consent=true), VP Finance Operations:* "Joule's read-only assist is solid. The action layer needs the RPA pipeline to migrate before we see the projection numbers."
2. *theme only:* RPA_migration_dependency — "We're doing two things in series that should be in parallel."

**Decisions (2, one with dissent):**

- Decision: "Continue Joule scope, accelerate RPA migration"
- Date: 2026-02-08
- Sponsor: CFO Office
- Status: implemented
- Dissent recorded: false

- Decision: "Defer Joule action-layer expansion until Q3-2026"
- Date: 2026-04-12
- Sponsor: SAP COE
- Status: in_review
- Dissent recorded: TRUE
- Dissent summary: "VP Finance Operations argues against deferral — believes parallel migration is feasible with additional headcount."
- Outcome: pending governance review

**Scenarios (2):**

- Scenario A: "If RPA migration slips one more quarter"
- Trigger: 2 of 5 critical RPA processes miss Q3 deadline
- Probability: 40%
- Impact: Joule realized value remains < 50% of committed through 2026; re-baseline mandatory at next governance cycle.

- Scenario B: "If parallel migration headcount is approved"
- Trigger: 4 FTE backfill approved for RPA pipeline team
- Probability: 30%
- Impact: Joule realization timeline accelerates 1-2 quarters; reaches ~85% by Q4-2026.

---

### AR-03 · ServiceNow Now Assist (IT Helpdesk)

**Profile:** duplication_risk with M365 Copilot, LOW confidence on attribution.

**KPIs (3-4 quarters):**

| KPI | Q4-2025 | Q1-2026 | Q2-2026 | Unit | Confidence |
|---|---|---|---|---|---|
| Tickets deflected per month | 320 | 540 | 720 | tickets | MED |
| Avg resolution time before/after | 4.2 / 2.8 | 4.1 / 2.4 | 4.0 / 2.1 | hrs | MED |
| Tier-1 deflection rate | 18% | 22% | 26% | pct of tier-1 vol | LOW (attribution loose) |

**Stakeholder notes (2):**

1. *theme only (consent=false):* helpdesk_team_morale — "Helpdesk leads worry about role displacement; HR has open conversations underway."
2. *quote (consent=true), IT Service Manager:* "Some of the deflections we're crediting to Now Assist are actually being absorbed by Copilot's M365 contextual help. We need to A/B."

**Decisions (1 with dissent):**

- Decision: "Hold Now Assist Tier-2 expansion pending attribution study"
- Date: 2026-04-22
- Sponsor: CIO Office
- Status: open
- Dissent recorded: TRUE
- Dissent summary: "ServiceNow account exec disputes the duplication framing; cites their telemetry showing distinct user populations. Internal team disputes vendor's analysis."

**Scenarios (1):**

- Scenario: "If attribution study confirms genuine duplication"
- Trigger: Q3-2026 study completes with cleanly attributed deflection breakdown
- Probability: 50%
- Impact: Now Assist scope reduced to L2/L3 specialty workflows; M365 absorbs L1; ~40% TCO reduction across the helpdesk AI stack.

---

### AR-04 · Azure ML Demand Forecasting

**Profile:** scaled, healthy, aligned_callout (highest-ROI Apex Predictive ML use case).

**KPIs (4 quarters):**

| KPI | Q3-2025 | Q4-2025 | Q1-2026 | Q2-2026 | Unit | Confidence |
|---|---|---|---|---|---|---|
| Forecast accuracy (MAPE, weekly) | 14.2% | 11.6% | 9.8% | 8.4% | pct error | HIGH |
| Inventory write-down avoidance | $0.4M | $0.7M | $1.1M | $1.4M | USD/Q | HIGH |
| Buyer override rate | 22% | 18% | 14% | 11% | pct | HIGH |

**Stakeholder notes (2):**

1. *quote (consent=true), Head of Merchandising:* "The Q2 numbers convinced even the regional buyers. Override rate is half what it was last year."
2. *quote (consent=true), Inventory Director:* "$1.4M writedown avoidance in a quarter is real money. Defend this budget."

**Decisions (1):**

- Decision: "Expand model coverage to private-label SKUs"
- Date: 2026-03-30
- Sponsor: VP Merchandising
- Status: implemented
- Outcome: Q2 expansion adds ~2400 SKUs to forecast scope; early signal positive.

**Scenarios (1):**

- Scenario: "If model accuracy degrades > 2 pts MAPE in any quarter"
- Trigger: drift detection threshold breach
- Probability: 15%
- Impact: triggers Steward model risk review; possible re-training pause; up to $0.8M quarterly write-down exposure.

---

### AR-05 · Cursor IDE Rollout for Engineering

**Profile:** pilot stage, foundation_phase signal, lower committed dollars, vibe-coding category.

**KPIs (3-4 quarters):**

| KPI | Q4-2025 | Q1-2026 | Q2-2026 | Unit | Confidence |
|---|---|---|---|---|---|
| Active engineering seats | 24 | 47 | 78 | seats | HIGH |
| Cycle time on new-feature PRs | 5.2d | 4.6d | 4.1d | days | MED |
| Self-reported productivity uplift | 28% | 31% | 33% | pct | LOW (self-report) |

**Stakeholder notes (1):**

1. *quote (consent=true), Senior Engineering Manager:* "Cursor + agent flows changed our R&D cadence. The number we don't yet measure is the prevented context-switches."

**Decisions (1):**

- Decision: "Expand to all engineering teams Q3-2026"
- Date: 2026-04-18
- Sponsor: VP Engineering
- Status: planned

**Scenarios (1):**

- Scenario: "If engineering uplift translates to roadmap acceleration"
- Trigger: 2 quarters of consistent ≥ 25% PR throughput improvement
- Probability: 55%
- Impact: roadmap velocity targets shift forward; product strategy team revises Q4 commitments.

---

### AR-06 · GitHub Copilot Enterprise

**Profile:** scaled, healthy, smaller than M365 but solid ROI in engineering.

**KPIs (4 quarters):**

| KPI | Q3-2025 | Q4-2025 | Q1-2026 | Q2-2026 | Unit | Confidence |
|---|---|---|---|---|---|---|
| Active seats / licensed seats | 180 / 320 | 220 / 320 | 252 / 320 | 268 / 320 | seat ratio | HIGH |
| Suggestions accepted per user / day | 14 | 18 | 22 | 24 | count | HIGH |
| Avg coding test pass rate (post-AI) | 76% | 81% | 84% | 86% | pct | MED |

**Stakeholder notes (1):**

1. *theme only (consent=false):* security_review_friction — "Security team wants per-prompt audit; Copilot doesn't expose that."

**Decisions (1):**

- Decision: "Bundle Copilot + Cursor under a single AI-developer-tools envelope"
- Date: 2026-04-05
- Sponsor: CTO Office
- Status: in_review
- Outcome: pending governance approval

**Scenarios (1):**

- Scenario: "If Microsoft EA bundle includes Copilot enterprise tier shift"
- Trigger: Microsoft EA renewal (closes ~ pilot week) confirms tier upgrade
- Probability: 60%
- Impact: per-seat cost drops ~25%; enables expansion to remaining 52 unlicensed engineering seats.

---

### AR-07 · Strategic Bet · Agent Platform Foundation

**Profile:** multi_year_strategic_bet, foundation_phase, $4.2M committed, 0 measured (matches Meridian's MH-07 pattern).

**KPIs (1-2 quarters · early signal only):**

| KPI | Q1-2026 | Q2-2026 | Unit | Confidence |
|---|---|---|---|---|
| Migration milestones completed | 1 of 8 | 2 of 8 | count | MED |
| Internal evaluator framework coverage | 12% | 28% | pct of agents covered | MED |

**Stakeholder notes (1):**

1. *quote (consent=true), Chief Architect:* "We're three quarters into a multi-year build. The compounding kicks in when programs migrate. Until then, attribution will look loose."

**Decisions (1):**

- Decision: "Add 4 FTE to platform team for Q3 milestone acceleration"
- Date: 2026-04-10
- Sponsor: CTO Office
- Status: implemented

**Scenarios (2):**

- Scenario A: "If platform foundation hits 5 of 8 milestones by EOY"
- Trigger: Q4-2026 milestone review
- Probability: 65%
- Impact: 3 dependent initiatives (AR-02, AR-03, AR-04) gain shared instrumentation; portfolio-wide attribution improves.

- Scenario B: "If platform delivery slips two quarters"
- Trigger: 2+ critical-path milestones miss Q3-2026 deadline
- Probability: 25%
- Impact: dependent initiatives blocked; aggregate value gap grows ~$2-3M; sponsor confidence deteriorates.

---

## Vendor renewal date adjustments (PR 1 + PR 2)

For pilot week realism, ensure ≥ 1 Apex vendor has `renewal_date` within 90 days of `TOWER_DEMO_TODAY` (which we'll set to `'2026-05-12'` for the pilot week).

**Suggested adjustments:**

- AR-01 Microsoft EA renewal: set to `'2026-06-28'` (47 days from 2026-05-12) — drives the EA storyline
- AR-03 ServiceNow renewal: keep at `'2026-12-31'` (~233 days, look-ahead band)
- AR-04 Azure ML renewal: set to `'2026-08-04'` (84 days, window edge — tests boundary)
- AR-06 GitHub Copilot renewal: set to `'2026-07-10'` (59 days)

This gives 3 vendors in 90d window — Atlas Pattern 04 fires confidently with multi-vendor story.

---

## Validation rules

Codex must verify all augmentation rows pass:

1. **Schema valid** — every field matches column type + constraint
2. **No null required fields** — `kpi_name`, `quarter`, `kpi_value`, `confidence_level`, `loaded_via_template` all present on every kpi row; analogous for other tables
3. **No PII** — names like "VP Finance Operations" (role-only), no real-sounding personal names that could match a real person
4. **Confidence levels distributed** — not all HIGH; mix of HIGH/MED/LOW per Atlas's confidence-floor logic
5. **Consent mix** — stakeholder_notes have both `attribution_consent=true` and `false` per Apex
6. **Decision dissent appears at least 2x** — feeds Pattern 02 + Atlas's stakeholder citation in v2
7. **Scenarios probability_pct distributed** — not all 50%; mix 10-80% for variety
8. **Loaded_via_template** — set to `'apex-retail/full_load.json'` for traceability

---

## How to load the augmentation

```bash
# Validate JSON shape against schema
npx tsx src/scripts/seed/load-ai-initiatives.ts apex-retail --dry-run

# Load (idempotent)
npm run db:migrate     # if any new migrations
npx tsx src/scripts/seed/load-ai-initiatives.ts apex-retail

# Verify counts
psql $DATABASE_URL -c "SELECT 'kpis' AS table, COUNT(*) FROM ai_initiative_kpis WHERE initiative_id LIKE 'apex-%'
UNION ALL SELECT 'decisions', COUNT(*) FROM ai_initiative_decisions WHERE initiative_id LIKE 'apex-%'
UNION ALL SELECT 'scenarios', COUNT(*) FROM ai_initiative_scenarios WHERE initiative_id LIKE 'apex-%'
UNION ALL SELECT 'stakeholder_notes', COUNT(*) FROM ai_initiative_stakeholder_notes WHERE initiative_id LIKE 'apex-%';"
```

Expected counts post-augmentation:
- kpis: ≥ 80
- decisions: ≥ 12
- scenarios: ≥ 12
- stakeholder_notes: ≥ 14

---

## What this enables

After augmentation, Atlas can:

- **Trend** any KPI across 3-4 quarters (powers MetricExplanation `trend` field)
- **Cite dissent** in Atlas Pattern 02 observations (Atlas v1.5 surface)
- **Attribute outcomes** when decisions have outcome_status set
- **Quote stakeholders** with attribution_consent gating
- **Surface scenarios** with probability framing in Pattern 05 look-ahead

This is what closes the 8/10 → 10/10 gap on Apex specifically. Substrate-rich Apex + Atlas reasoning → CXO-grade demo.

---

## Out of scope for augmentation

- Cross-tenant data (no leak between Apex / Meridian / FCF)
- Real PII or any name matching a real person
- Numbers calibrated to a specific competitor or known industry benchmark
- Statistical realism beyond plausibility (no claim Apex's 2280/8400 seats matches their actual ratio)

The goal is *plausible demo content*, not synthetic "real" data. CXOs reading this should see numbers that hang together — not numbers that claim to be Apex's actual ones.
