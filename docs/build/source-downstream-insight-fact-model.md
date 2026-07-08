# Source downstream-insight fact model

_The governed fact-model extension that makes the six downstream Source insights
real — without faking composite keys or letting an undescribed fact into the
model. Slice 3.1 lands Shape 1 (per-lever status) and the first insight built on
it: **RFP clause coverage**._

## The gap

Source's `✦ Intelligence` tab turns each workflow step into an intelligence
moment. The first three steps are already fact-live (Strategy value pool, Scope
coverage, Pricing value bridge — all computed from the archetype
`valueLeverRules` over `source_event_facts`). The **six downstream** insights are
not:

| Step        | Insight                     | Status before this slice |
|-------------|-----------------------------|--------------------------|
| RFP         | RFP clause coverage         | MODEL — every lever "exposed" |
| Responses   | Response coverage           | MODEL |
| Evaluation  | Should-cost normalization   | MODEL (illustrative vendors) |
| BAFO        | BAFO progress               | MODEL |
| Selection   | Committed value             | MODEL |
| Value       | Value realization           | MODEL |

They are MODEL not because the logic is missing but because the **fact shapes
they need do not fit the scalar lever-input model**. The value engine's fact
catalog (`src/lib/source/facts/fact-catalog.ts`) is DERIVED purely by sweeping
`valueLeverRules[].computation.inputs[].key`. Every catalog fact is therefore a
scalar the deterministic math consumes by key — `annual_run_cost`,
`recurring_avoidable_pct`, `transition_fee`. There is no place in that model for
"is the RFP clause for lever X present?" or "what did vendor V bid on lever X?".

## Principle: extend via `entity_ref` + a hand-authored signal-fact registry

We do **not** fake composite keys (`rfp_clause_present.AMS.VOLUME_BAND`). A fact
key must stay one canonical scalar meaning. Instead we extend the existing,
already-governed `entity_ref` dimension of `source_event_facts` and add a small,
**hand-authored** signal-fact registry that lives beside the derived catalog:

- **New entity kind `value_lever`.** A fact of `entity_kind='value_lever'` hangs
  off a canonical archetype lever key via `entity_ref` (e.g.
  `entity_ref='AMS.VOLUME_BAND_PRICING'`), exactly as a `vendor` fact hangs off a
  vendor id. One fact key, many rows — one per lever — disambiguated by
  `entity_ref`, never by mangling the key.
- **`DOWNSTREAM_SIGNAL_FACT_SPECS`** — a hand-authored map co-located in
  `fact-catalog.ts` and merged into `buildFactCatalog()`. These are the facts the
  downstream INSIGHT builders read that no value LEVER computes over. They earn a
  catalog entry the same way lever inputs do (label + entityKind + description +
  unit), so an undescribed signal fact still cannot enter the model — but they are
  exempt from the "every catalog key is a lever input" invariant, since by
  definition an insight signal is not a lever input.

This keeps the keystone guarantee — an undescribed fact key throws at build — for
everything, while giving the downstream insights a real, cited, governed fact to
read.

### Three fact shapes the downstream insights need

- **Shape 1 — per-lever status** (RFP clause, BAFO progress, Committed value).
  `entity_kind='value_lever'`, `entity_ref = <canonical archetype lever key>`
  (e.g. `AMS.VOLUME_BAND_PRICING`). New signal fact keys:
  - `rfp_clause_present` — 0/1, is the lever's clause required in the RFP draft.
  - `bafo_concession_captured_usd` — the concession captured in BAFO for the lever.
  - `committed_value_usd` — the value committed at award for the lever.
  Build order: **RFP clause → Committed value → BAFO**. This slice lands
  `rfp_clause_present` only; the other two are named here so the shape is declared.

- **Shape 2 — per-vendor / vendor×lever** (Response coverage, Evaluation
  should-cost). Needs an event **vendor registry** (a first-class list of the
  vendors bidding an event) plus `entity_kind='vendor'` bid facts and a
  `vendor_lever` composite `entity_ref` (`<vendorId>::<leverKey>`) for a vendor's
  answer to a specific lever. **Phase 2** — not in this slice.

- **Shape 3 — time-series** (Value realization). Period-scoped realized facts
  (`entity_ref = <leverKey>@<period>` or a dedicated realized-value table) so
  committed-vs-realized can be charted over time. **Phase 3** — not in this slice.

### Boolean representation (this slice)

`rfp_clause_present` is a boolean. Rather than widen the type surface (a new
`flag` unit would have to thread through `ValueUnit`, the DB, the structured-map
numeric-unit set, and every exhaustive switch), we represent it as **0/1 with the
existing `ratio` unit** — a value already in `NUMERIC_UNITS`, already accepted by
the DB, no schema/type churn. `1 = clause present/required`, `0 = absent`. The
lower-risk option; noted so a future `flag` unit can supersede it deliberately.

## Governance

A `value_lever` fact's `entity_ref` **MUST** be a canonical lever key validated
against the resolved archetype's `valueLeverRules` — never free text. The
`RFP_CLAUSES_V1` intake template's `Lever Key` column carries the lever key; the
insight builder only marks a lever protected when a `rfp_clause_present` fact
exists whose `entity_ref` matches a real lever key it is iterating. A row with a
lever key the archetype does not declare simply never matches a rendered lever —
it cannot inject a phantom lever. The same citation / confidence / source_method
contract every other fact carries applies unchanged: structured-map intake stamps
`source_method='structured_map'`, `confidence='high'`, and a template
code + column/row citation.

The DB CHECK on `entity_kind` is widened to include `value_lever` by migration
`supabase/migrations/20260707130000_source_event_facts_value_lever_kind.sql`.

## What "live" means for RFP clause coverage

`buildRfpClauseInsight` reads the set of lever keys with `rfp_clause_present = 1`:

- A lever is `protected: true` when its `rfp_clause_present` fact is present and
  `= 1`; else `exposed`.
- When **any** `rfp_clause_present` fact exists for the event → `provenance:
  'live'`, `isModel: false`; the headline reflects live coverage (N of M lever
  clauses present).
- When **none** exist → the honest MODEL is preserved unchanged (every lever
  exposed, `provenance: 'sample'`, the RFP-draft-signal note).

The advisor layer (bestPractice / benchmark / downstreamImpact) and the clause
library (each row's `rfpClause` + `bafoAsk`) are intact in both modes. No
value-lever economic math changes; this slice only reads a new presence signal.

## Everything stays behind `source_analytics`

Deterministic, no LLM. The Scope/Pricing/Exec/Transition insights and the gate
engine are untouched.
