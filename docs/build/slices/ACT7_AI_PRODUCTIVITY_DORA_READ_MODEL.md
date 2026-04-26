# ACT7 · AI Productivity / DORA Read Model

Slice ID: ACT7
Slice name: AI Productivity / DORA Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes the **Productivity & DORA** dimension of the AI
Control Tower contract ([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md))
by projecting a deterministic, cross-tenant set of productivity and
DORA metric entries into a typed read model. The Tower will compose
this read model into Atlas brief content, scorecards, and pressure
cards in later slices (ACT9, ACT10). This slice is **types + seed +
helpers + tests only**; no surface binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/ai-productivity-dora.ts`](../../../src/lib/tower/ai-productivity-dora.ts)

Public types and tuples:

- `DORA_METRICS` (canonical tuple) and `DoraMetric`.
- `PRODUCTIVITY_METRICS` and `ProductivityMetric`.
- `METRIC_BANDS` and `MetricBand` (`'elite' | 'high' | 'medium' | 'low'`).
- `METRIC_TRENDS` and `MetricTrend`
  (`'improving' | 'flat' | 'declining' | 'unknown'`).
- `METRIC_MEASUREMENT_SOURCES` and `MetricMeasurementSource`
  (`'seed_only' | 'manual_capture' | 'gh_actions_seed' |
  'jira_seed' | 'incident_report_seed'`).
- `METRIC_KINDS` and `MetricKind` (`'dora' | 'productivity'`).
- `METRIC_UNITS` and `MetricUnit`
  (`'per_day' | 'hours' | 'percent' | 'days'`).
- `ProductivityDoraEntry`.
- `ProductivityDoraSummary`.

Public helpers:

- `buildProductivityDoraEntries()` — returns the canonical seed.
- `summarizeProductivityDora(entries?)` — reconciles totals, sorts
  unique sets ascending; defaults to the canonical seed.
- `getDoraEntries(entries?)` — filters to DORA-kind entries.
- `getProductivityEntries(entries?)` — filters to productivity-kind
  entries.
- `getDecliningOrLowBandEntries(entries?)` — returns entries whose
  trend is `declining` or whose band is `low`. These are the entries
  Atlas surfaces as productivity gaps so the Tower can render
  attention rather than a fabricated uplift number.

### Tests

[`src/__tests__/integration/tower/ai-productivity-dora.test.ts`](../../../src/__tests__/integration/tower/ai-productivity-dora.test.ts)

Deterministic integration tests across the following blocks:

- **Shape & determinism** — ≥ 20 entries, byte-equal across calls,
  canonical metric tuples, every entry carries
  `createdFrom: 'deterministic_productivity_dora_seed'`, every id
  matches the `dora-seed-{team}-{metric}` shape, every id is unique,
  every entry has at least one non-empty note.
- **Metric coverage** — every DORA metric (4) and every productivity
  metric (6) has ≥ 1 entry; every entry's metric matches its
  metricKind.
- **Band & trend coverage** — every band (4) and every trend (4)
  has ≥ 1 entry; ≥ 3 declining entries.
- **Per-row invariants** — every entry has
  `liveTelemetry: false`; every entry has a canonical seed-tagged
  measurement source; every entry has a non-empty team label;
  `delta === currentValue - baselineValue` (within an epsilon for
  floating-point seed values); every entry uses a canonical metric
  kind.
- **Distribution constraints** — ≥ 5 unique team labels and a sample
  of required role-based labels are present.
- **Summary reconciliation** — `byBand` and `byTrend` reconcile to
  `totalEntries`; every canonical band and trend key is present;
  `byMetric` sums to `totalEntries` and exposes every metric that
  appears in the seed; `doraCount + productivityCount` equals
  `totalEntries`; `uniqueTeams` and `uniquePrograms` are sorted
  ascending and de-duplicated; no-arg call summarizes the canonical
  seed.
- **Helper behaviors** — `getDoraEntries` and
  `getProductivityEntries` partition the input;
  `getDecliningOrLowBandEntries` returns only declining or low-band
  entries and excludes entries that are improving and not in the
  low band; helpers default to the canonical seed when called with
  no arguments.
- **No fabrication** — `JSON.stringify(entries)` never carries a
  dollar number, a branded vendor endorsement (`OpenAI`,
  `Anthropic`, `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
  `Microsoft Copilot`, `GitHub Copilot`), a banned placeholder
  (`Coming soon`, `TBD`, `Lorem ipsum`), or any positive claim that
  live telemetry has been captured.
- **Module hygiene** — module source contains no imports from
  Source / Sentinel / Atlas / Nexus / Agent runtime, auth, or
  supabase; no `Date.now` / `Math.random` / `new Date(` / `fetch(`;
  no `anthropic` / `openai` / `useState` / `useEffect`; no banned
  placeholder text; no positive "live telemetry" claims outside the
  negated `liveTelemetry: false` field.

### Manifest updates

- [`docs/build/build-slices.json`](../build-slices.json) gains an
  `ACT7` entry (category `ACT`, status `code_complete`, risk `low`,
  `dependsOn: ["ACT2"]`).
- [`docs/build/production-readiness.json`](../production-readiness.json)
  gains a note on the `ai_control_tower` component acknowledging the
  ACT7 productivity / DORA dimension. The component is **not
  promoted**; status is preserved.

---

## B. Why this slice exists

The AI Control Tower contract names seven canonical dimensions. The
**Productivity & DORA** dimension answers a question Atlas otherwise
cannot defend: *"Has the AI portfolio actually shifted engineering
throughput, and where is it dragging?"* DORA gives the Tower a
cross-industry banded vocabulary (elite / high / medium / low) and
four canonical metrics (deployment frequency, lead time for changes,
change failure rate, mean time to recovery). The productivity set
adds engineering-system signals — PR cycle time, merge rate, review
turnaround, defect leakage, rework ratio, spike-to-ship ratio — that
sit outside the strict DORA frame but are necessary to assess AI
uplift (or drag) without inventing a dollar number.

ACT7 establishes the shape Atlas reads against. Once this read model
is canonical, ACT8 layers Operational Readiness onto the same team
keys, and ACT9 composes the Atlas brief from the seven dimension
read models. ACT10 implements the Tower surface.

This slice is **deliberately deterministic and seed-only** so that
later slices land against a stable contract.

---

## C. Distribution shape (test-enforced)

The seed contains 25 deterministic entries spread across seven role-
based teams. Distribution invariants tested:

| Constraint | Floor |
|---|---|
| Total entries | ≥ 20 |
| Unique team labels | ≥ 5 |
| DORA metrics covered | all 4 (≥ 1 each) |
| Productivity metrics covered | all 6 (≥ 1 each) |
| Bands present | all 4 (≥ 1 each) |
| Trends present | all 4 (≥ 1 each) |
| Declining entries | ≥ 3 |

Teams covered (sorted ascending):

- Customer Support Engineering
- Data Platform Team
- Internal Tools Squad
- Mobile App Team
- Platform Squad
- Risk & Compliance Engineering
- Sales Engineering
- Search Relevance Team

Tests assert that the first five required role-based labels are
present (Customer Support Engineering, Platform Squad, Data Platform
Team, Risk & Compliance Engineering, Sales Engineering).

`teamLabel` is a **role-based label**, not a real team name. The
seed cannot be mistaken for live tenant data.

---

## D. No-fabrication contract

The seed honors the ACT1 §K no-fabrication rules:

1. **No fake dollars.** Tested via `\$\s*\d` regex on the serialized
   inventory.
2. **No fake citations.** No `E-###` evidence id appears anywhere in
   the seed.
3. **No live telemetry claim.** Every entry carries
   `liveTelemetry: false`. Every `measurementSource` is one of
   `seed_only`, `manual_capture`, `gh_actions_seed`, `jira_seed`, or
   `incident_report_seed` — all five are seed-tagged. Notes only ever
   reference live capture in negated form ("no live ... pipeline is
   connected"); the test suite scans for positive live-telemetry
   phrases and fails on any match.
4. **No live model claim.** Every entry carries
   `createdFrom: 'deterministic_productivity_dora_seed'`. Module
   source has no `anthropic` / `openai` / `fetch(` / `Date.now` /
   `Math.random` / `new Date(`.
5. **No vendor brand claims.** The deny-list scan blocks `OpenAI`,
   `Anthropic`, `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
   `Microsoft Copilot`, and `GitHub Copilot`.
6. **No "industry average" claims.** Seed prose names the metric
   semantics ("lower is better") and the seed-only provenance, never
   an industry comparison.
7. **No "we deliver X% productivity uplift" claims.** Bands and
   trends are reported as deterministic literals; uplift framing is
   left to ACT9 brief composition (which will read against this
   contract, not invent its own).
8. **No silent suppression.** Entries that are declining or sitting
   in the `low` band honestly carry that state. The
   `getDecliningOrLowBandEntries` helper exists specifically so the
   Tower surface can render "productivity gap" instead of a
   fabricated uplift number. Trend `unknown` is permitted (and
   present) for cases where the seed cannot defend a direction
   without inventing data.

---

## E. What this slice does NOT do

- **No Atlas brief composition.** The Atlas Tower brief is composed
  from this read model (and its sibling dimension read models) in
  ACT9. ACT7 emits no prose framing.
- **No Tower UI.** The `/tenant/{tenantKey}/tower` surface is built
  in ACT10. ACT7 has no JSX, no React components, no DOM.
- **No connector binding.** The seed is the only data source. ACT7.x
  follow-up slices replace the seed with a connector-backed
  projection (Steward-owned).
- **No tenant scoping.** The seed is cross-tenant by design — it is
  a **shape** rather than a per-tenant feed. Per-tenant binding
  happens in ACT7.x once Steward captures productivity data per
  tenant.
- **No persistence.** No supabase, no migrations, no Drizzle, no
  JSON file write.
- **No live telemetry.** Every entry carries `liveTelemetry: false`
  and a seed-tagged measurement source.

---

## F. Future ACT7.x follow-up

These items are explicitly deferred:

- **ACT7.1 — Per-tenant productivity binding.** Replace the seed
  with a Steward-captured, per-tenant productivity feed while
  preserving the read model contract. Live measurement sources
  (`gh_actions`, `jira`, `incident_report`) replace their
  `_seed` counterparts.
- **ACT7.2 — Productivity completeness scoring.** Atlas surfaces
  productivity-coverage as a scorecard; Sentinel detects sparsity
  (e.g. no DORA metrics for a team that has shipped AI changes).
- **ACT7.3 — Trend history.** Time-series stitched against banded
  thresholds, with `unknown` collapsing to a defended trend once
  enough history is captured.
- **ACT7.4 — Productivity gap brief.** Atlas composes a "where is
  productivity dragging" brief from
  `getDecliningOrLowBandEntries`, with linked program / use case
  context for each gap.

---

## G. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/ai-productivity-dora.test.ts`
  — pass.
- `npm run build` — pass.
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`
  — pass.

---

## H. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component.
