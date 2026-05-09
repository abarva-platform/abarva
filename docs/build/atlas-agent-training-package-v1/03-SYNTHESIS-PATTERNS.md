# 03 · Synthesis Patterns

**Purpose:** the six named patterns Atlas detects and composes. Each pattern has: trigger condition (substrate state), output shape, worked example with Meridian fixture, and what disqualifies a false positive.

These six are the v1 surface. Atlas should master these before v2 expansion.

---

## Pattern 01 · Top Pressure Diagnosis

**Trigger:** at least one row in `pressuresView.cards`. Always.

**What Atlas does:** picks the lead card (already sorted by lens-aware priority), expands the templated lede into a diagnosis sentence + driver sentence + recommended-next-action sentence.

**Output:** Obs 01.

**Substrate cited:**
- Lead initiative's `display_id`, `name`, `status_flag`, `status_summary`, `confidence_level`
- Either committed/measured pair (for value/cost pressures) or vendor renewal data (for vend pressures)

**Worked example — Meridian, lens=value, lead = MH-03 dup_risk:**

> Autonomous Helpdesk overlaps with M365 Copilot on the same deflection use case. The duplication is real; the consolidation choice isn't — both initiatives self-report deflection metrics, neither has a clean attribution baseline. Run the attribution study before recommending sunset.
>
> Citations: ai_initiatives[MH-03].name, .status_flag=duplication_risk, .status_summary, .confidence_level=LOW

**Disqualified if:**
- Lead pressure has `confidence_level = LOW` AND no quoted source (e.g., no stakeholder note, no decision dissent, no KPI history) — Atlas should still write the diagnosis but should explicitly note evidence is thin.
- Lead pressure has been resolved within last 30 days (check `ai_initiative_decisions.outcome_status`).

---

## Pattern 02 · Shared-Root Pattern Detection

**Trigger:** ≥ 2 initiatives in the pressuring set share at least one of:
- Same `status_flag`
- Same `primary_category_id` AND `confidence_level`
- Same vendor (via `ai_initiative_vendors.vendor_name`)
- Same `primary_goal_id` (via `ai_business_goals`)
- Same dependency on a foundation-phase strategic bet (i.e., both reference an initiative with `stage = multi_year_strategic_bet AND status_flag = foundation_phase` in their `status_summary` or `description`)

**What Atlas does:** names the shared root explicitly, frames it as a single CFO posture rather than N separate ones.

**Output:** Obs 02 (the portfolio-pattern observation).

**Substrate cited:**
- Each contributing initiative's `display_id` + status_flag (≥ 2 cited)
- The shared root: vendor name OR goal name OR foundation-phase bet OR pattern descriptor

**Worked example — Meridian, lens=value:**

Templated (T-7 today):
> 2 of 3 active pressures are value-lag (MH-04, MH-06). Realized value is trailing committed across multiple programs.

Insight-grade (Pattern 02):
> Two of the three active pressures are value-lag (MH-04 Epic AI, MH-06 Joule). Both depend on enterprise-integration cadence that runs through MH-07's Model Governance & FinOps Platform — still in foundation phase. Until MH-07's instrumentation lands, MH-04 and MH-06 will keep showing value gaps that aren't actually their fault. The CFO posture is "defend MH-04, hold MH-06's re-baseline, accelerate MH-07."

This pattern works because:
- It cites 3 rows (MH-04, MH-06, MH-07) — meets the 3-row pattern bar
- It names the root (MH-07's foundation phase)
- It reframes the action: not "re-baseline both", but "hold one and unblock the platform"

**Disqualified if:**
- Only 1 contributing initiative supports the pattern (not enough; that's a single-pressure observation, not a pattern)
- The "shared root" isn't actually shared — Atlas inventing causation from co-occurrence
- The recommendation requires Sentinel-level strategy; Atlas should hand off

---

## Pattern 03 · Defend-While-Resolving

**Trigger:** ≥ 1 initiative with `aligned_callout = true` AND ≥ 1 initiative in pressuring state.

**What Atlas does:** names the aligned-callout(s) as the defend-vector while the pressures resolve. This is how a senior CFO talks: don't lose sight of what's working while fixing what isn't.

**Output:** appended to Obs 02 (or Obs 01 if portfolio is small) — usually the third sentence.

**Substrate cited:**
- Each aligned-callout's `display_id`, `name`, `aligned_rationale` (if non-null), `measured_value_usd`

**Worked example — Meridian:**

> MH-01 (Clinical Documentation Copilot) and MH-04 (Epic AI for Revenue Cycle) are flagged as aligned-callouts — both delivering measured value above committed. While the value-lag pressures resolve elsewhere, defend these two: scaled stage, healthy or aligned-overriding-lag.

**Disqualified if:**
- Aligned-callout initiatives are themselves in cost_overrun or duplication_risk (rare, but check)
- Aligned-callout has `measured_value_usd = 0` (the callout is aspirational, not earned)

---

## Pattern 04 · Vendor-Clock as Forcing Function

**Trigger:** ≥ 1 vendor with `renewal_date` within 90 days of `todayIso`.

**What Atlas does:** frames the renewal as the calendar forcing function it is, ties it to current pressures if any are connected via `ai_initiative_vendors.initiative_id`, recommends Source.

**Output:** Obs 01 (vendor clock takes priority lead in `pressuresView`).

**Substrate cited:**
- Vendor's `vendor_name`, `contract_value_usd`, `renewal_date`, `financial_health`
- Initiative the vendor ties to: `display_id`, `name`, current `status_flag`

**Worked example — fictional Meridian vendor in window:**

> Epic Systems renewal closes in 38 days. \$2.6M contract on MH-04 (Epic AI for Revenue Cycle) — currently flagged value_lag with HIGH-confidence aligned-callout. The renewal is a forcing function for the re-baseline conversation: defend the aligned-callout, but don't sign without the value-lag root cause named. Open the brief in Source.

**Disqualified if:**
- Vendor's `financial_health = at_risk` AND that triggers a separate Steward signal (Atlas should still name the renewal but defer the financial-risk read to Steward)
- The renewal is ≥ 60 days out AND no current pressure ties to the vendor (defer to Look-ahead in Obs 03)

---

## Pattern 05 · Look-Ahead Composition

**Trigger:** ≥ 1 strategic bet (`stage = multi_year_strategic_bet AND status_flag = foundation_phase AND measured_value_usd ≤ 0`) OR ≥ 1 vendor renewal in 90-365 day window.

**What Atlas does:** surfaces the *next* thing without making it today's pressure. Tells the CFO what's around the corner.

**Output:** Obs 03.

**Substrate cited:**
- Strategic bet's `display_id`, `name`, `stage_detail`, `committed_total_usd`
- Vendor's `vendor_name`, `renewal_date` (formatted as days)

**Worked example — Meridian, no vendors in 90-365d window:**

> MH-07 (Model Governance & FinOps Platform) is the multi-year strategic bet feeding the value-lag pressures above — \$4.2M total committed over 3 years, in foundation phase. It won't show measured value until MH-04 and MH-06 migrate onto its instrumentation, which is the structural unblock for the value-lag pattern. Watch the foundation milestone cadence; that's the look-ahead.

**Disqualified if:**
- No strategic bets AND no vendor renewals in 90-365d (skip Obs 03 entirely; healthy portfolios don't need filler)
- The strategic bet is itself in `cost_overrun` (escalates from look-ahead to today's pressure; goes to Obs 01 instead)

---

## Pattern 06 · Healthy Posture

**Trigger:** `pressuresView.cards.length === 0`.

**What Atlas does:** says the portfolio is quiet. Names the aligned-callouts that are working. Names the next thing on the horizon. Resists the temptation to manufacture a worry.

**Output:** Obs 01 (replaces top-pressure observation), optionally Obs 02 (look-ahead).

**Substrate cited:**
- Aligned-callouts' `display_id`, `name`, `measured_value_usd`
- Scaled-stage count
- Foundation-phase strategic bets (look-ahead)

**Worked example:**

> Portfolio is quiet this week. Three of seven initiatives are in scaled stage; MH-01 and MH-04 carry the aligned-value callouts and are delivering above committed. No active CFO-decision pressures. Use the time to read MH-07's foundation plan — that's the next inflection.

**Disqualified if:**
- "Healthy" claim hides a `confidence_level = LOW` aggregation. Atlas should explicitly note when the band's confidence is mostly LOW even if no pressure is firing ("Portfolio reads quiet, but adoption coverage is LOW-confidence — connect identity sources before drawing conclusions").

---

## How patterns combine

A normal Tower CFO render uses 1-3 patterns in combination:

| Substrate state | Patterns used | Observations produced |
|---|---|---|
| 3 pressures, no vendors in 90d, 1 strategic bet | Pattern 01 + 02 + 05 | Obs 01 + 02 + 03 |
| 1 pressure + 1 vendor in 90d + 0 strategic bets | Pattern 04 (lead) + 01 (extended) | Obs 01 + 02 |
| 0 pressures, 2 strategic bets, 1 aligned-callout | Pattern 06 + 05 | Obs 01 + 02 |
| 5 pressures, 2 share root, 2 vendors in 90d, 1 strategic bet | Pattern 04 (lead) + 02 + 05 + 03 (defend) | Obs 01 + 02 + 03 (with all 3 patterns surfacing) |

Atlas should compose 1-3 observations, not always 3. **Empty space is honest.** A 1-observation morning is the signal that the portfolio is calm.

---

## What patterns Atlas should *resist*

### Anti-pattern: forcing 3 observations

If only Pattern 01 fires, Atlas should not pad with manufactured Obs 02 or Obs 03. The right rail naturally compresses.

### Anti-pattern: claiming pattern from coincidence

Two initiatives with `status_flag = value_lag` is **not** Pattern 02 unless they share a root (vendor, goal, foundation bet, etc.). Without the shared root, Atlas should write two single-pressure observations or compose them into a "two value-lags, no shared root" framing — not invent causation.

### Anti-pattern: industry-standard framing

"AI initiatives typically take 18 months to scale" — out. Atlas reads this tenant's `stage_detail` and `kpi_history`. Industry generalizations come from training data, not substrate.

### Anti-pattern: prediction

"MH-06 will likely under-realize again next quarter." Atlas reads the current quarter and cites `ai_initiative_scenarios` if needed. Atlas does not predict.

### Anti-pattern: stakeholder commentary without consent

`ai_initiative_stakeholder_notes.attribution_consent = false` means the quote is internal. Atlas may use the *theme* but not the quote.

---

## Pattern selection algorithm (rule-based, deterministic)

For Atlas v1, pattern selection is rule-based and runs *before* the LLM call. The LLM composes prose under each selected pattern. This keeps the LLM scoped to language, not selection.

```
1. If pressuresView.cards has ≥ 1 vend card → Pattern 04 leads (Obs 01)
   Else if pressuresView.cards has ≥ 1 card → Pattern 01 leads (Obs 01)
   Else → Pattern 06 leads (Obs 01)

2. For Obs 02:
   If pressuresView.cards.length ≥ 2 AND a shared root exists → Pattern 02
   Else if aligned-callouts exist AND pressures exist → Pattern 03 (as Obs 02)
   Else if Pattern 06 fired in Obs 01 AND look-ahead substrate exists → Pattern 05 in Obs 02
   Else → skip Obs 02

3. For Obs 03:
   If strategic bets exist OR vendor renewals in 90-365d → Pattern 05
   Else → skip Obs 03

4. Compose "if you only do one thing today" from Obs 01's primary action chip,
   plus an "anchor sentence" naming why this is the priority
```

This algorithm fires deterministically. The LLM only writes prose under each selected pattern — keeping the surface auditable.
