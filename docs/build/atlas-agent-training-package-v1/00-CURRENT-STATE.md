# 00 · Current State Audit

**Snapshot date:** 2026-05-09
**Purpose:** Tell Atlas (and its implementer) exactly what's already shipped on Tower so reasoning fits in the gap rather than rebuilding what's there.

---

## What's already substrate-bound on Tower CFO View

### Band tiles · T-5 (PR #1703)

Five tiles aggregate from `ai_initiatives` + `ai_initiative_vendors`:

| Tile | Computation |
|---|---|
| Portfolio ROI · 12-month rolling | `sum(measured_value_usd) / sum(committed_annual_usd)` |
| Active pressures | `count(initiative)` where `status_flag in (cost_overrun, value_lag, stalled, duplication_risk, adoption_gap)`, split into "high" + "watch" by `confidence_level` |
| Spend at risk | `sum(committed_annual_usd)` over the pressuring initiatives |
| Renewals · 90d | `count(vendor)` where `renewal_date` within 90 days of `todayIso = '2026-05-07'` (deterministic pin) |
| Adoption rate | `% of non-foundation initiatives in 'scaled' stage` (proxy until per-tool MAU integrations land; LOW confidence by design) |

**File:** `src/lib/tower/band-metrics-view.ts` · pure deterministic · 23 unit tests
**ⓘ provenance panel:** `src/components/tower/MetricProvenance.tsx` reads from `metric-provenance.ts` view-model

### Pressure cards · T-6 (PR #1706)

Composes 0-N cards from substrate:

- One card per initiative whose `status_flag` is in the pressure-bearing set
- One card per vendor whose `renewal_date` falls within 90 days of `todayIso`
- Cards sorted by lens-aware priority (T-8)
- Each card carries: type, displayId, headline, lede (templated from `name` + `status_summary`), 3 meta rows, magnitude, magnitudeLabel, magnitudeConfidence, nextAction (templated)
- Section H2 anchors on the soonest vendor renewal when one is in window; otherwise generic posture statement

**File:** `src/lib/tower/pressure-cards-view.ts` · pure deterministic · 17 unit tests

### Atlas observations · T-7 (PR #1708)

The right rail observations are composed deterministically today:

- Obs 01 = top pressure (vendor clock or top initiative-pressure)
- Obs 02 = portfolio pattern (e.g., "2 of 3 active pressures are value-lag")
- Obs 03 = look-ahead (strategic bets in foundation phase + 90-365d renewals)
- "If you only do one thing today" anchors on Obs 01's recommended action
- Suggested prompts adapt to observed pressure types
- Falls back to legacy hardcoded Apex Retail observations when substrate empty

**File:** `src/lib/tower/atlas-observations-view.ts` · pure deterministic · 19 unit tests
**Atlas LLM agent:** `src/lib/atlas/` (orchestrator, classifier, scripted-engine, llm, prompt, repository, tool-belt, types)

The deterministic view-model is what renders the observations on first paint. The Atlas LLM agent answers the chat input ("Ask Atlas about the portfolio…") below the observations.

### Lens toggle · T-8 (PR #1709)

`?lens=value|risk|contract|adopt` URL param drives:

- Band hero swap: which tile renders in the larger font
  - value → portfolio_roi
  - risk → spend_at_risk
  - contract → renewals_90d
  - adopt → adoption_rate
- Pressure card priority swap (per-lens TYPE_PRIORITY map)
- Atlas observations re-anchor automatically because Obs 01 reads from `pressuresView.cards[0]` and the lens already re-ranked that

**File:** `src/lib/tower/band-metrics-view.ts` (`TowerLens` type, `HERO_BY_LENS`)
**File:** `src/lib/tower/pressure-cards-view.ts` (`PRIORITY_BY_LENS`)
**Tests:** 17 unit tests in `tower-t8-lens-toggle.test.ts`

### Strategic Alignment 2×2 · T-4 + T-4b (PRs #1670, #1673)

- 6 dots plot from `ai_initiatives` per tenant
- Quadrant derived: x = `measured_value_usd >= $1M`, y = `aligned_callout || (healthy && scaled) || foundation_phase`
- Sunset override: `duplication_risk` or `cost_overrun` forces low alignment
- Dots tile in 2-column grid (no overlap)
- ⭐ marker on `aligned_callout = true`
- Outline: solid HIGH · dashed MED · dotted LOW (matches `confidence_level`)
- Strategic Bets row separately renders `multi_year_strategic_bet + foundation_phase + measured = 0`

**File:** `src/lib/tower/strategic-alignment-2x2-view.ts` · pure deterministic · 27 unit tests

### Provenance and "Coming next" · T-4 (PR #1670)

- Every band tile has an ⓘ icon → popover with `calculation`, `day-1 load path`, `day-N integration target`, `source allows`, `last refreshed`
- "Coming next in this view" footer block above the doctrine line lists 5 deferred metrics with the integration each needs

**Files:** `src/components/tower/MetricProvenance.tsx`, `src/components/tower/DeferredMetricsBlock.tsx`
**View-models:** `src/lib/tower/metric-provenance.ts`, `src/lib/tower/deferred-metrics.ts`

---

## What's NOT yet substrate-bound (or out of scope)

### Tower content that's still Apex-storyline

- **Strategic alignment 2×2 quadrant headlines** (e.g., "Useful but off-strategy. Sustain or rationalize.") — these are framing labels, lens-agnostic, and stay
- **Doctrine footer line** ("Tower is a decision instrument, not a dashboard…") — intentional doctrine, stays
- **Provenance ribbon** (above the band) — references portfolio-level reasoning, not yet substrate-bound
- **Cascade graph** (large hero visual when shown) — separate substrate (program instances + source events), not AI initiatives
- **Risk register panel** — pulls from `lib/reasoning/risk-register`, not AI initiatives substrate

### Atlas LLM agent (chat surface)

- System prompt: `src/lib/atlas/prompt.ts` · `ATLAS_PROMPT_VERSION = 'tower-w5-v2'`
- Routes: `scripted | llm | hybrid | tool_augmented`
- Intents: morning_summary, shadow_ai_detail, cohort_position, portfolio_status, roi, idle_seats, signal_detail, strategy_refusal, llm
- Tool-belt: 8 functions wrapping `src/lib/atlas/repository.ts`
- Persisted to: `atlas_threads` (id), `atlas_observations` (id, summary, severity, observationKind), `atlas_message_traces` (turn-level provenance)

The chat surface answers user questions. The right-rail observations render on page-load deterministically. **Atlas reasoning v1 should compose interpretive observations for the right rail** — i.e., upgrade T-7's templated output to grounded reasoning. The chat surface is downstream.

---

## Substrate available to Atlas today

Per migration `20260507230500_ai_initiatives_registry.sql` + `20260502171000_private_setup_ai_initiatives.sql`:

| Table | Per-tenant rows (Meridian sample) | Atlas reads |
|---|---|---|
| `ai_initiatives` | 7 (MH-01 to MH-07) | name, displayId, stage, statusFlag, statusSummary, committedAnnual/Total, measuredValue, confidenceLevel, alignedCallout, ownerName/Title/Function |
| `ai_initiative_kpis` | 16 quarter-rows for Meridian | kpiName, quarter, kpiValue, kpiUnit, targetValue, peerMedian, confidenceLevel |
| `ai_business_goals` | 4 for Meridian | name, strategicContext |
| `ai_initiative_vendors` | 6 for Meridian | vendorName, contractValueUsd, renewalDate, financialHealth |
| `ai_initiative_decisions` | 5 for Meridian | decisionName, decisionDate, sponsorName, decisionStatus, dissentRecorded, dissentSummary, outcomeStatus |
| `ai_initiative_scenarios` | 4 for Meridian | scenarioName, triggerEvent, timeHorizonMonths, probabilityPct, impactSummary |
| `ai_initiative_stakeholder_notes` | 4 for Meridian | stakeholderName, stakeholderTitle, interviewDate, quote, themes |

Atlas v1 reasoning works primarily off `ai_initiatives` + `ai_initiative_vendors` + `ai_initiative_kpis` (the bulk of useful pattern surface). `decisions`, `scenarios`, `stakeholder_notes` are reasoning-rich and used for the ≥ 90% target, not the v1 75%.

---

## What Atlas reasoning should NOT do

- **Re-aggregate.** The deterministic view-models already compute Portfolio ROI, Active pressures, etc. Atlas reads those numbers, never re-derives them.
- **Replace pressure cards.** T-6's pressure cards stay. Atlas's interpretation appears in the right rail observations + chat.
- **Cite peer benchmarks not in `ai_initiative_kpis.peer_median`.** No "industry standard" from training data.
- **Manipulate state.** Atlas advises. Nexus runs Moves. Source runs negotiations. Steward runs governance. Atlas writes `atlas_observations` rows but nothing else.

---

## The contract for Atlas reasoning v1

Inputs (passed by Tower page server-side, alongside the deterministic view-models):

- `initiatives: ReadonlyArray<AIInitiative>`
- `vendors: ReadonlyArray<AIInitiativeVendorRow>`
- `pressuresView: TowerPressuresView` (already composed by T-6)
- `bandMetrics: TowerBandMetricsView` (already aggregated by T-5)
- `alignment2x2View: StrategicAlignment2x2View` (already plotted by T-4)
- `lens: TowerLens`
- `todayIso: string` (deterministic pin)
- `clientName: string` (e.g. "Meridian Health")

Output (replaces or augments `atlasObservationsView`):

```ts
interface AtlasInterpretation {
  /** Headline for the right rail. Senior advisor voice. */
  headline: string;
  /** 1-3 interpretive observations. Each grounded, each cited. */
  observations: ReadonlyArray<AtlasInterpretiveObservation>;
  /** "If you only do one thing today" — anchored on the most-defensible action. */
  ifYouOnlyDoOneToday: string;
  /** Suggested prompts that follow from the interpretation. */
  suggestedPrompts: ReadonlyArray<string>;
  /** Same shape as deterministic so the renderer can swap. */
  metaSuffix: string;
  /** Confidence in the overall interpretation. LOW means "fall back to deterministic." */
  interpretationConfidence: 'high' | 'med' | 'low';
  /** Trace of which substrate fields were cited, for the Atlas trace log. */
  citations: ReadonlyArray<AtlasCitation>;
}

interface AtlasInterpretiveObservation {
  number: number;
  topic: string;
  body: string;          // 1-3 sentences, grounded
  rootCause?: string;    // optional · only when 3+ initiatives support it
  actions: ReadonlyArray<AtlasObservationAction>;
  confidenceFloor: 'HIGH' | 'MED' | 'LOW';  // weakest underlying citation
  citations: ReadonlyArray<AtlasCitation>;
}

interface AtlasCitation {
  initiativeId?: string;
  vendorId?: string;
  kpiId?: string;
  field: string;          // e.g. "ai_initiatives.status_flag"
  value: string | number; // the substrate value cited
}
```

When `interpretationConfidence = 'low'` the renderer falls back to the deterministic T-7 view. This is the safety net.

---

## Eval target

≥ 75% pass on the 24-case harness in `07-EVAL-HARNESS.md` for v1. Tuning to ≥ 90% within the first observation cycle.

A "pass" means Atlas's output:
1. Cites the substrate fields it claims
2. Doesn't invent numbers
3. Stays in voice (no fluff, no cheerleading)
4. Refuses correctly when the harness expects refusal
5. Surfaces a pattern that's actually present in the fixture (not a false positive)
