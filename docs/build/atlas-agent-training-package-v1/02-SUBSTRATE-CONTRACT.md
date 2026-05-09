# 02 · Substrate Contract

**Purpose:** Tell Atlas exactly what fields it reads, what they mean, what their confidence is, and what it can and can't claim from each.

The cardinal rule: **every numeric or factual claim Atlas makes must trace to a substrate field on a row that's loaded for the active tenant.** No interpolation. No "approximately." No "industry standard."

---

## The five tables Atlas reads

```
ai_initiatives                   the spine — one row per initiative per tenant
ai_initiative_kpis               quarterly KPI history per initiative
ai_initiative_vendors            contract / renewal data per initiative
ai_initiative_decisions          governance decisions, sponsor, dissent
ai_initiative_scenarios          forward-looking scenarios with probability
ai_initiative_stakeholder_notes  interview quotes with attribution_consent
```

Plus the **business goal lookup**:

```
ai_business_goals                per-tenant goals each initiative attaches to
ai_categories                    8 global AI categories
```

All Atlas-readable per tenant via `client_id` (RLS enforced; service_role full access in dev).

---

## `ai_initiatives` · the spine

Every Atlas observation that names an initiative cites one of these fields:

| Field | What Atlas can claim | What Atlas cannot |
|---|---|---|
| `display_id` (e.g. "MH-04") | Use as the badge / reference. Always. | Never invent a display_id. |
| `name` (e.g. "Epic AI for Revenue Cycle") | Quote verbatim. Atlas may shorten in body prose if name is > 30 chars (e.g. "Epic AI" with displayId in parens). | Never alter the casing or vendor punctuation. |
| `description` | Use as background context, not as a quote. | Never quote as if it's the user's own framing. |
| `primary_category_id` → `ai_categories.name` | Atlas may say "MH-04 sits in the Customer-Facing AI category" if relevant. | Never claim categorical comparisons that the substrate doesn't support. |
| `primary_goal_id` → `ai_business_goals.name` | Atlas may say "MH-04 attaches to the Reduce denial rate goal" when discussing alignment. | Never invent goals. |
| `stage` ∈ {pilot, scaled, sunset, multi_year_strategic_bet, in_strategic_move} | Atlas can use stage to frame maturity ("MH-04 is in scaled stage; failure here scales too"). | Never use "production" or "GA" — use the substrate enum exactly. |
| `stage_detail` (free text) | Use verbatim if helpful. | Never paraphrase as fact. |
| `owner_name`, `owner_title`, `owner_function` | Atlas may name the owner when surfacing accountability. | Never characterize the owner ("D. Chen has been slow") — only cite role. |
| `committed_annual_usd` | Atlas can compare against `measured_value_usd` to compute the gap. | Never round outside the deterministic view-models' formatting. |
| `committed_total_usd` | Atlas can use for multi-year programs. | Never assume which is more relevant; cite both if both are populated and the difference matters. |
| `measured_value_usd` | Atlas can frame as realized value. | Never extrapolate to future quarters; that's `ai_initiative_scenarios`. |
| `status_flag` ∈ {healthy, adoption_gap, value_lag, cost_overrun, duplication_risk, stalled, foundation_phase, in_move} | Atlas frames the diagnosis using this exact taxonomy. | Never invent a status ("at-risk", "trending down") — use the enum. |
| `status_summary` | Quote or paraphrase. Atlas may unpack it for the body. | Never quote in scare-quotes as if it's the user's framing. |
| `confidence_level` ∈ {HIGH, MED, LOW} | **Inherits to every claim Atlas makes about this initiative.** | Never upgrade confidence. If `LOW`, Atlas's claim about this initiative is dotted-underline. |
| `aligned_callout` (boolean) | Atlas may say "aligned-callout, defend it." Atlas can use ⭐ in display. | Never claim two initiatives are "equally aligned" — alignment_score isn't loaded yet. |
| `aligned_rationale` | Quote or paraphrase. | Never use to imply a numeric alignment score. |

---

## `ai_initiative_kpis` · quarterly KPI history

Per-initiative metric rows with quarter-over-quarter coverage.

| Field | What Atlas can claim |
|---|---|
| `kpi_name` | Quote exactly (e.g. "Documentation time per encounter"). |
| `kpi_unit` | Use as the unit suffix (e.g. "min", "NPS pts"). |
| `quarter` (e.g. "Q1-2026") | Cite when describing trends. |
| `kpi_value` | Cite as the value. |
| `target_value` | Frame as "target X". |
| `peer_median` | Frame as "peer median X" — never as "industry standard." |
| `confidence_level` | Inherits to the KPI claim. |

**Trend detection:** Atlas can compare `kpi_value` across quarters when `≥ 3 quarters` of data are loaded. With 1-2 quarters, Atlas describes the latest value but doesn't claim trend.

---

## `ai_initiative_vendors`

| Field | What Atlas can claim |
|---|---|
| `vendor_name` | Quote exactly (e.g. "Nuance / Microsoft (DAX Express)"). |
| `contract_value_usd` | Cite as the contract value. |
| `renewal_date` | Atlas computes days-until from `todayIso`. |
| `financial_health` ∈ {strong, moderate, watch, at_risk} | Atlas may flag at_risk. | Never opine when null. |
| `notes` | Quote if helpful. |

**Renewal urgency:** Atlas treats < 90 days as P-VEND pressure (already done by T-6). Atlas can additionally note < 365 days as look-ahead.

---

## `ai_initiative_decisions`

This is reasoning-rich substrate. Atlas should use it sparingly in v1, more in v2.

| Field | What Atlas can claim |
|---|---|
| `decision_name`, `decision_date`, `sponsor_name` | Cite when relevant to the current pressure. |
| `decision_status` | Frame as the latest decision posture. |
| `dissent_recorded` (boolean) + `dissent_summary` | Atlas may flag "dissent on file" with a short paraphrase. **High-trust signal — surfaces honesty.** |
| `outcome_status` | Cite if the decision has measurable outcome. |

**Pattern hook:** when an initiative has `dissent_recorded = true` AND a current `status_flag` in the pressure-bearing set, Atlas should consider citing the dissent in Obs 02 (the portfolio pattern observation). It's exactly the kind of signal that turns templated commentary into insight.

---

## `ai_initiative_scenarios`

Forward-looking scenarios with probability. Atlas can use these for *look-ahead* observations but never as *predictions*.

| Field | What Atlas can claim |
|---|---|
| `scenario_name` | Quote. |
| `trigger_event` | Frame as "if {event}, this initiative becomes {state}." |
| `time_horizon_months` | Cite. |
| `probability_pct` | Frame as "{N}% probability per scenario library." |
| `impact_summary` | Quote or paraphrase. |

---

## `ai_initiative_stakeholder_notes`

Interview quotes. **Only quote when `attribution_consent = true`.**

| Field | What Atlas can claim |
|---|---|
| `quote` | Quote verbatim only when consent is true. Otherwise paraphrase the theme. |
| `themes` (array) | Cite as theme codes. |
| `stakeholder_name`, `stakeholder_title` | Attach to the quote when consent allows. |

**The dissent + stakeholder note pairing** is one of the highest-leverage signals Atlas can surface: a status_flag of value_lag + an interview quote about why = an insight-grade Obs 02.

---

## What Atlas reads on every turn

The **reasoning input bundle** Atlas v1 sees on every Tower right-rail render:

```ts
interface AtlasReasoningInput {
  tenant: { name: string; clientId: string };
  todayIso: string;
  lens: TowerLens;

  // From the deterministic view-models (already aggregated/composed):
  bandMetrics: TowerBandMetricsView;
  pressuresView: TowerPressuresView;
  alignment2x2View: StrategicAlignment2x2View;
  deferredMetrics: ReadonlyArray<DeferredMetric>;

  // Raw substrate (for pattern detection beyond what view-models surface):
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  // (kpis, decisions, scenarios, stakeholderNotes loaded lazily via tool-belt)
}
```

This is enough for v1. The lazy-loaded tables (kpis, decisions, scenarios, stakeholder notes) come in via `query_signal_evidence` / `query_use_cases` / `query_programs` for chat turns and on-demand observation enrichment.

---

## The citation contract

Every observation Atlas writes carries a `citations` array:

```ts
interface AtlasCitation {
  initiativeId?: string;
  vendorId?: string;
  kpiId?: string;
  field: string;          // e.g. "ai_initiatives.status_flag"
  value: string | number; // the substrate value cited
}
```

Rules:

1. **Every numeric in the body must have a citation.** If Atlas writes "$5.4M at risk", a citation must exist.
2. **Every named initiative must cite at least its `display_id` and `name`.**
3. **Every claim about a status (e.g. "MH-06 is value-lag") cites `status_flag` + `confidence_level`.**
4. **Pattern claims cite ≥ 3 supporting rows.** "Two of three pressures share a root" is a pattern claim and needs 3 rows backing the pattern (the 2 lagging + the 1 contrastive).
5. **Citations are exposed in the trace log (`atlas_traces`).** Operators can grade Atlas turns by sampling and verifying citations.

If Atlas can't cite, Atlas doesn't claim. Refusal is a feature.

---

## What's NOT yet substrate (deferred per Load Path Manifest)

These are the 5 deferred metrics Atlas should never claim:

- `mau_count` per initiative (per-tool integrations not landed)
- `api_spend_monthly_usd`, `cost_per_inference_usd`, `gpu_utilization_pct` (token router integration not landed)
- `override_rate_pct` (per-tool, varies)
- `hours_saved_per_month`, `ftes_redeployed` (HRIS integration partial)
- `tickets_resolved_pct`, `resolution_time_before_hrs`, `resolution_time_after_hrs` (ServiceNow / Zendesk per-tenant)

Atlas in observation prose should **name the integration** that would unlock these when relevant ("Adoption is a stage proxy until per-tool MAU integrations land — M365 Graph, Cursor admin, ServiceNow Performance Analytics") and otherwise stay quiet.

---

## Tenant key mapping caveat

There's a known gap (see memory: `apex_tenant_key_split`):

- App ClientKey: `apexretail` (no dash)
- Broker / data-room: `apex-retail` (with dash)
- AI Initiatives substrate: uses `client_id` UUID via `clients` table, not a string key

Atlas v1 reads via `client_id` (UUID) which is the spine. Atlas does not need to handle the string-key split — that's an integration concern for `lib/setup/ai-initiatives-private-plane.ts`, not the reasoning layer.

---

## Substrate quality matrix (v1 fixture)

For grading purposes, here's what's loaded today per tenant:

| Tenant | Initiatives | Vendors | KPIs (rows) | Decisions | Scenarios | Stakeholder notes |
|---|---|---|---|---|---|---|
| Apex Retail | 7 | 6 | 16 | 5 | 4 | 4 |
| Meridian Health | 7 | 6 | 16 | 5 | 4 | 4 |
| First Capital Financial | 7 | 6 | 16 | 5 | 4 | 4 |

**Total surface for grading:** 21 initiatives + 18 vendors + 48 KPI quarter-rows + 15 decisions + 12 scenarios + 12 stakeholder notes.

Atlas v1 should ground its reasoning in the initiatives + vendors + (top KPI per initiative). v2 expands into decisions + scenarios + stakeholder notes.
