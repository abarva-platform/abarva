# 10 · Metric Explainability

**Purpose:** the contract that says **every number Atlas displays, Atlas can explain.** Not just cite — explain. When a CFO sees "Adoption · 50% LOW · Meridian" and asks "why?", Atlas drills into the substrate composition and tells them: which initiatives count, which don't, what would change the number, what's missing.

The doctrine line says *"every number on this page has a confidence level and an underlying calculation that's queryable."* The ⓘ panel (T-4) made calculations visible. This package extends that to *interrogable* — Atlas as the live encyclopedia for every metric.

---

## The principle

A senior chief-of-staff doesn't just know what the number is. They know:

1. **What goes into it** — the substrate inputs and their per-row contribution
2. **Which rows are pulling it up vs. down** — the bottom-3 and top-3 contributors
3. **What's excluded and why** — initiatives in foundation phase, deferred metrics, etc.
4. **What the trend is** — quarter-over-quarter from `ai_initiative_kpis` when available
5. **What would change it** — the deterministic levers (resolve a status, scale a pilot, load an integration)
6. **Where the confidence comes from** — the weakest substrate field cited

Atlas should be able to answer all six on demand for any number on the page.

---

## The drill-down contract

When a user clicks the ⓘ icon (today's static popover) or asks Atlas "why is X at N?", Atlas returns a `MetricExplanation`:

```ts
interface MetricExplanation {
  metricKey: string;              // e.g. 'adoption_rate'
  displayValue: string;           // e.g. '50%'
  displayConfidence: 'high' | 'med' | 'low' | 'none';

  /** 1-2 sentence summary in Atlas voice. */
  headline: string;

  /** The deterministic computation breakdown. */
  composition: {
    formula: string;              // e.g. 'count(scaled stage) / count(non-foundation)'
    inputs: ReadonlyArray<MetricInput>;
    excluded: ReadonlyArray<MetricExclusion>;
  };

  /** Top contributors and detractors. */
  contributors: ReadonlyArray<MetricContribution>;

  /** Quarter-over-quarter trend if substrate supports it. */
  trend: MetricTrend | null;

  /** What would change the number — verb-leading levers. */
  levers: ReadonlyArray<MetricLever>;

  /** Confidence floor with explanation. */
  confidenceFloor: {
    level: 'HIGH' | 'MED' | 'LOW';
    reason: string;
    upgradePath?: string;         // what would raise the confidence
  };

  /** Citations as in every Atlas output. */
  citations: ReadonlyArray<AtlasCitation>;
}

interface MetricInput {
  initiativeId?: string;
  vendorId?: string;
  displayId: string;              // e.g. 'MH-01'
  name: string;
  contribution: string;           // e.g. 'in scaled stage → counts toward numerator'
  contributingValue?: number | string;  // e.g. 5800000
}

interface MetricExclusion {
  displayId: string;
  name: string;
  reason: string;                 // e.g. 'foundation_phase → excluded from denominator'
}

interface MetricContribution {
  displayId: string;
  name: string;
  pulling: 'up' | 'down' | 'neutral';
  by: string;                     // e.g. '+$2.1M' or '−12%'
}

interface MetricTrend {
  quarters: ReadonlyArray<{ quarter: string; value: number; confidence: 'HIGH' | 'MED' | 'LOW' }>;
  direction: 'improving' | 'declining' | 'flat' | 'volatile';
  note: string;                   // narrative description
}

interface MetricLever {
  action: string;                 // e.g. 'Scale MH-03 from pilot to scaled'
  estimatedImpact: string;        // e.g. 'would raise adoption to ~63%'
  owner: 'Sentinel' | 'Steward' | 'Nexus' | 'Source' | 'CFO' | 'Atlas';
  confidence: 'HIGH' | 'MED' | 'LOW';
}
```

Same citation contract as observations. Same refusal discipline. The drill-down is just an Atlas reasoning call with a different output shape.

---

## Per-metric drill-down specs

### Portfolio ROI · "Why is Meridian's ROI at 1.1× against a 3.5× target?"

**Composition:**
- Formula: `sum(measured_value_usd) / sum(committed_annual_usd) across all initiatives for tenant`
- Inputs: every initiative with `committed_annual_usd > 0`
- Per-row contribution: `(measured / total_measured) × 100%` shows which initiatives carry the ratio

**Atlas drill-down:**

> Portfolio ROI is 1.1× because $13.0M measured value divides $11.9M committed annual across 7 initiatives.
>
> The ratio is concentrated:
> - MH-01 (Clinical Documentation Copilot) carries 45% of measured value: $5.8M against $4.1M committed = 1.41× — pulling the ratio up
> - MH-05 (Clinical Risk Stratification ML) carries 29%: $3.8M against $0.6M committed = 6.33× — strongest individual ROI
> - MH-04, MH-06 are dilutive: combined $2.8M measured against $4.5M committed = 0.62×
> - MH-07 (Model Governance) is 0× by design — foundation phase, no measured value yet
>
> **What would move the number:** if MH-04 and MH-06 reached committed value (resolving the value-lag pressures), portfolio ROI would jump to ~1.5×. Hitting target 3.5× requires either dropping MH-07 from the denominator (it's a strategic bet, leave it) or new high-ROI initiatives.
>
> **Confidence:** HIGH — 6 of 7 initiatives carry measured values. The 7th (MH-07) is structurally 0; not a data gap.

**Trend (if KPI history loaded):** the quarterly value of `sum(measured) / sum(committed)` across the last 4 quarters.

---

### Active pressures · "Why 3 active pressures for Meridian?"

**Composition:**
- Formula: `count(initiative)` where `status_flag in (cost_overrun, value_lag, stalled, duplication_risk, adoption_gap)`
- Inputs: every initiative with a pressure-bearing status_flag
- Split: high (HIGH conf) vs watch (MED+LOW conf)

**Atlas drill-down:**

> 3 pressures: 1 capability-duplication (MH-03, LOW conf) + 2 value-lags (MH-04 HIGH conf, MH-06 MED conf).
>
> - MH-03 (Autonomous Helpdesk via ServiceNow): duplication_risk against M365 Copilot. Evidence is thin — both self-report; attribution study would resolve in 6 weeks.
> - MH-04 (Epic AI for Revenue Cycle): value_lag, $1.4M measured / $1.3M annual but $2.6M total committed. Aligned-callout overrides — defend, re-baseline.
> - MH-06 (Joule SAP for Finance): value_lag, $1.4M measured / $3.2M committed. RPA pipeline migration cited as driver. Re-baseline gate.
>
> Other initiatives (MH-01, MH-02, MH-05, MH-07) are healthy or in foundation phase — no pressure firing.
>
> **What would move the number:** resolving any of the three (status flag transitions to healthy / in_move) drops the count. New duplications or value gaps raise it.
>
> **Confidence:** HIGH on the count itself (deterministic). Per-pressure confidence varies — MH-03 is LOW, MH-04 is HIGH.

---

### Spend at risk · "Why $5.4M Meridian?"

**Composition:**
- Formula: `sum(committed_annual_usd)` over pressuring initiatives
- Inputs: same set as Active pressures, summed by committed annual

**Atlas drill-down:**

> $5.4M = MH-03 ($0.9M) + MH-04 ($1.3M) + MH-06 ($3.2M).
>
> The largest contributor is MH-06 — Joule SAP at $3.2M annual, currently realizing only $1.4M (44% of committed). MH-04 is aligned-callout so the $1.3M is at risk in a soft sense — likely to be re-baselined upward, not cut.
>
> **What "at risk" means here:** the substrate flag is `committed_annual_usd` for initiatives in pressure status. Atlas does not claim this $5.4M will be lost; it claims the budget is in pressure-bearing posture and a CFO decision is owed.
>
> **What would move the number:** MH-06 resolving (or being re-scoped) is the largest lever — drops the number to $2.2M. MH-03's $0.9M moves only after the attribution study.
>
> **Confidence:** MED. The number sums HIGH-conf and LOW-conf rows; the floor is LOW (MH-03's confidence). If MH-03 resolves out of pressure, confidence floor rises.

---

### Renewals · 90d · "Why 0 for Meridian?"

**Composition:**
- Formula: `count(vendor)` where `renewal_date` within 90 days of `todayIso = 2026-05-09`
- Window: 2026-05-09 → 2026-08-07

**Atlas drill-down:**

> 0 renewals in the next 90 days. The 6 loaded vendors all renew later:
>
> - ServiceNow on MH-03: renews 2026-12-31 (236 days)
> - Cursor on MH-02: renews 2027-04-30 (356 days)
> - Innovaccer on MH-06: renews 2027-01-31 (267 days)
> - Nuance/Microsoft (DAX Express) on MH-01: renews 2027-06-30 (417 days)
> - SAP on MH-06: renews 2027-12-31 (601 days)
> - Epic Systems on MH-04: renews 2028-06-30 (783 days)
>
> **Look-ahead:** 3 vendors renew in the 90-365 day window — all in late 2026. The next forcing function is ServiceNow on MH-03 in ~8 months.
>
> **What would move the number:** a vendor renewal date moving forward, or a new vendor signing with a near-term renewal. Neither is imminent.
>
> **Confidence:** HIGH — renewal_date is calendrical and unambiguous.

---

### Adoption · "Why 50% Meridian, and why LOW confidence?"

**This is the example the user asked about.** The fullest worked drill-down.

**Composition:**
- Formula: `% of non-foundation initiatives in 'scaled' stage`
- Numerator: count where `stage = 'scaled'`
- Denominator: count where `stage NOT IN (multi_year_strategic_bet)` AND `status_flag != 'foundation_phase'`
- This is a **proxy metric** until per-tool MAU integrations land

**Atlas drill-down (the full target output):**

> Meridian's adoption reads 50% because 2 of 4 eligible initiatives are in scaled stage. Confidence is LOW because *stage* isn't *adoption* — it's a structural placeholder until per-tool MAU lands.
>
> **What's in the denominator (4 eligible):**
> - MH-01 Clinical Documentation Copilot · stage=scaled → counts toward numerator
> - MH-03 Autonomous Helpdesk via ServiceNow · stage=pilot → in denominator, not numerator
> - MH-05 Clinical Risk Stratification ML · stage=scaled → counts toward numerator
> - MH-06 Joule (SAP) Pilot for Finance · stage=pilot → in denominator, not numerator
>
> **What's excluded:**
> - MH-02 Vibe Coding Rollout for IT · status_flag=foundation_phase → excluded from denominator
> - MH-04 Epic AI for Revenue Cycle · stage=multi_year_strategic_bet → excluded
> - MH-07 Model Governance & FinOps Platform · stage=multi_year_strategic_bet → excluded
>
> So the math is `2 scaled / 4 eligible = 50%`. If MH-03 or MH-06 transitions from pilot to scaled, the number jumps to 75%. If both do, it's 100%.
>
> **Why this is a proxy:** stage is a self-reported lifecycle marker — it tells you the program is operationally rolled out, not that users are actually adopting. Real adoption needs per-tool MAU:
> - M365 Graph API for any M365 Copilot rollout (not loaded for Meridian)
> - Cursor admin API for the IDE rollout (MH-02 — but MH-02 is foundation-phase, excluded anyway)
> - ServiceNow Performance Analytics for Now Assist / Helpdesk (could replace MH-03's pilot signal)
> - Nuance reporting API for DAX Express (could ground MH-01's scaled claim with usage data)
>
> Identity sources (Okta + EntraID) are the upstream gate — without them, none of these per-tool integrations resolve cleanly to a user count.
>
> **What would move the number AND its confidence:**
> 1. Connect Okta + EntraID (Steward) — unlocks per-tool MAU integrations
> 2. Configure M365 Graph + Cursor admin + ServiceNow PA + Nuance reporting (Steward + integrations team) — replaces stage proxy with real MAU per initiative
> 3. Once real MAU is loaded, the metric becomes weighted-avg of `mau_count / licensed_users` per initiative — confidence moves from LOW to MED or HIGH per integration depth
>
> **Confidence:** LOW. The number is correct *as a proxy*. The proxy itself is the limitation. The "Connect identity sources" chip on Atlas Obs 03 is the upstream lever.

This is what depth looks like. It's not just citing the calculation — it's narrating the *substrate composition*, calling out *which rows count and why*, naming the *integrations that would replace the proxy*, and identifying the *upstream gate*.

---

## Per-section drill-downs

The same explainability contract extends beyond band tiles to every visible region:

### Pressure cards · "Why is MH-03 the lead pressure?"

Atlas explains:
- The sort order (lens-aware: vend > cost > dupl > value > adopt for VALUE lens)
- Why MH-03 is dup, not value or cost
- The substrate citation chain: `status_flag = duplication_risk` set when, by whom (`decisions` table)
- Why other pressures (MH-04, MH-06) sort below
- What would change the lead

### 2×2 dots · "Why is MH-06 in the TL quadrant (high value, low alignment)?"

Atlas explains:
- The quadrant derivation rule: x-axis = `measured_value_usd >= $1M`, y-axis = `aligned_callout || (healthy && scaled) || foundation_phase`
- MH-06's specific values: measured=$1.4M (high), aligned_callout=false, status=value_lag, stage=pilot → low alignment
- Why a similar initiative (MH-04) lands in TR despite being value-lag too: aligned_callout=true overrides
- The sunset override rule (duplication_risk / cost_overrun forces low alignment regardless)
- What would move MH-06 across quadrants: callout flag set, or status flag resolves

### Strategic Bets row · "Why is MH-07 here and not in the 2×2?"

Atlas explains:
- The strategic-bet trigger: `stage = multi_year_strategic_bet AND status_flag = foundation_phase AND measured_value_usd ≤ 0`
- Why this triple-trigger separates strategic bets from the main matrix: attribution is loose, measured value is 0 by design
- MH-04 also has `stage = multi_year_strategic_bet` but stays in the 2×2 because measured > 0 — explains the contrast
- The committed_total_usd field (vs annual) — strategic bets are multi-year commitments
- What would graduate MH-07 to the 2×2: measured_value_usd > 0 OR status moves out of foundation_phase

### Atlas observations · "Why this observation, not another?"

Atlas explains its own selection — meta-explainability:
- Pattern selection logic from `03-SYNTHESIS-PATTERNS.md`
- Why Pattern 02 didn't fire (e.g., 2 value-lags but no shared root in substrate)
- Why this pressure was lead (lens × priority map from T-8)
- Citation density of the chosen observations

This is the most valuable drill-down for trust — it lets a CFO audit Atlas's reasoning, not just its output.

---

## The "ⓘ → ask Atlas" transition

Today's ⓘ panel is static — it shows a pre-written calculation/day-1/day-N description. The training package adds a "Why?" or "Ask Atlas" affordance that hands the metric context to Atlas chat.

**Wireframe sketch (no implementation):**

```
┌─────────────────────────────────────────┐
│ Adoption · 50% LOW                      │
│                                         │
│ How calculated:                         │
│   % of non-foundation initiatives in    │
│   'scaled' stage                        │
│                                         │
│ Day-1 load path:                        │
│   stage field per initiative            │
│   Source: meridian-health/full_load.json│
│                                         │
│ Day-N integration target:               │
│   M365 Graph, Cursor admin, ServiceNow  │
│   Performance Analytics                 │
│                                         │
│ Source allows: ⚠️ Per-tool varies        │
│                                         │
│ Last refreshed: 14m ago                 │
│                                         │
│ ─────────────────────────────────────   │
│ → Ask Atlas why this is at 50%          │  ← new chip
│ → See the lever map                     │  ← new chip (drives Atlas drill-down)
└─────────────────────────────────────────┘
```

The two new chips at the bottom open Atlas chat with the metric pre-loaded as context. Atlas responds with the `MetricExplanation` shape above.

---

## Substrate fields needed per drill-down

To produce the depth shown above, Atlas needs:

| Drill-down section | Substrate fields |
|---|---|
| Composition | `ai_initiatives.{stage, status_flag, committed_annual_usd, measured_value_usd, aligned_callout}` |
| Contributors | Same + per-initiative magnitude relative to total |
| Excluded with reason | Same — explain *why* a row is excluded |
| Trend | `ai_initiative_kpis.{quarter, kpi_value, target_value, peer_median, confidence_level}` for trended metrics |
| Levers | `ai_initiative_decisions.outcome_status` (gates), `ai_initiative_scenarios.{trigger_event, probability_pct}` (what-if), deferred metric integration map |
| Confidence floor | `ai_initiatives.confidence_level` (per row), aggregation rule (weakest) |
| Citations | All of the above with field paths |

The reasoning module reads these on demand for any drill-down. Most are already passed in the `AtlasReasoningInput` bundle (per `02-SUBSTRATE-CONTRACT.md`); KPI history and decisions are lazy-loaded via tool-belt for trend and lever analysis.

---

## Eval harness extensions for explainability

The 24-case harness in `07-EVAL-HARNESS.md` covers observations + refusals + lens reframing. Add **Group H · Explainability** (8 cases):

- **H1** · Why is Meridian Portfolio ROI at 1.1×? — expected: 4-row composition, named contributors, target gap explained
- **H2** · Why is Meridian adoption 50% AND LOW conf? — the worked example above
- **H3** · Why is MH-06 in the TL quadrant? — quadrant derivation explanation
- **H4** · Why is MH-07 in Strategic Bets row, not 2×2? — triple-trigger explanation
- **H5** · Why is MH-03 the lead pressure under VALUE lens? — sort order + lens priority explanation
- **H6** · Why is Spend at risk $5.4M? — composition + contributor breakdown
- **H7** · Why does Atlas Obs 02 NOT fire on Pattern 02 today? — meta-explainability: pattern skipped reason
- **H8** · Why is Renewals · 90d at 0 for Meridian? — empty-window explanation + look-ahead

Each case grades against the same three probes (citation completeness, pattern correctness, compression test) plus a fourth: **explanation completeness** — does the drill-down hit composition + contributors + levers + confidence?

Pass rate target for Group H: ≥ 80% in v1, ≥ 95% in v2.

---

## What this changes upstream

The MetricExplanation contract above is the new shape. Implementation impacts:

1. **Atlas reasoning module** — adds an `explainMetric(metricKey, context)` entry point alongside `composeObservations(context)`
2. **Tower view-models** — already produce `tooltip`, `confidence`, calculation strings (T-4/T-5); the explanation builder reads these but adds the contributor/excluded/lever rows
3. **`MetricProvenance.tsx` component** — gains the "Ask Atlas" chip; clicking opens chat with metric context pre-filled
4. **Trace shape** — `atlas_reasoning_traces.trigger` adds `'metric_explanation'` value; full MetricExplanation is captured

These are surfaced as the v1.1 wave after the v1 reasoning ships.

---

## Done state for explainability

After v1.1 lands:

- ✅ Every band tile, pressure card, 2×2 dot, Strategic Bets card, and Atlas observation has an "Ask Atlas" affordance
- ✅ Atlas produces `MetricExplanation` for each, citing substrate fields, naming contributors and exclusions, surfacing levers
- ✅ The Adoption · 50% drill-down is the canonical demo case — full composition + lever map
- ✅ Group H eval cases (8) pass at ≥ 80%
- ✅ Trace logs capture every explanation request
- ✅ Doctrine line ("every number queryable") is no longer aspirational — it's literally clickable

This is what closes the gap from "honest data" to "instrument a CFO actually trusts."
