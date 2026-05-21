# AbarVa — Domain Function Pack Spec

**Date:** 2026-05-21
**Status:** design spec — v1.
**Pairs with:** `ABARVA-INVESTOR-DILIGENCE-MEMO-2026-05-20.md`,
`ABARVA-PILOT-USE-CASE-CATALOG.md`, `MOVES-DELIVERABLE-AND-BUSINESS-CASE-SPEC.md`.

> **The one-line intent.** Give the agents a curated, function-indexed
> industry-depth layer that is **bound into context before the agent reaches
> for general intelligence** — so AbarVa reasons like a senior operator of a
> specific industry function, not like a smart generalist.

---

## 1. The principle — context binding before general intelligence

Today the kernels and agents are general. They are smart, but they improvise
the domain. A clinical-documentation Move and a population-health Move get the
same blank reasoning frame; the depth comes from whatever Claude knows in the
moment.

A Domain Function Pack changes the order of operations:

1. The agent identifies the **industry** and the **function** of the task.
2. It **resolves and binds the Function Pack** for that industry-function —
   metrics, archetypes, value model, deliverable outlines, vocabulary, traps.
3. It then uses Claude's general intelligence to **adapt that curated frame
   to the specific tenant** — not to invent the domain from scratch.

Curated depth first; general intelligence second. The Function Pack is the
"senior operator's playbook" the agent inherits before it thinks.

This directly fixes two known problems:

- **Deliverable depth (TOC / outline).** The pack *carries* the canonical
  deliverable outline for each artifact in that function. The agent inherits
  structure instead of improvising it.
- **Agent intelligence.** The agent stops sounding like a generalist and
  starts sounding like someone who has run this function.

It is also a buildable moat: the diligence memo named accumulated
decision/outcome data as the only durable moat — a deepening curated domain
library is the *authored* cousin of that flywheel, and every pilot deepens
the functions it touches.

## 2. What this builds on — not greenfield

AbarVa already has the latent skeleton:

- `src/lib/intelligence/industry-knowledge.ts` — an industry taxonomy with two
  verticals (`healthcare-provider`, `retail`).
- `src/lib/intelligence/canonical/industry-ai-pattern.ts` — a canonical
  AI-pattern type; ~43 `seed-patterns-*.ts` files; retail patterns already
  carry a **`functionName`**.
- `src/lib/programs/expert-kernel/use-case-archetype-playbooks.ts` — archetype
  playbooks.

The Function Pack does **not** replace these. It **organises** them into a
per-function depth bundle and **adds the missing depth layers** (operating
metrics with benchmarks, the value model, deliverable outlines, vocabulary,
evidence anchors). Existing patterns are referenced by the pack, not
duplicated.

## 3. The spine — industry → ~12 functions

A Domain Function Pack is keyed by `(industryKey, functionKey)`.

**Healthcare (provider) — the function taxonomy:**

`clinical_operations_documentation` · `care_delivery_care_management` ·
`population_health_value_based_care` · `patient_access_engagement_experience` ·
`research_clinical_trials` · `revenue_cycle` · `quality_safety_regulatory` ·
`clinical_supply_chain` · `health_information_interoperability` ·
`clinical_workforce_staffing` · `payer_claims_operations` · `pharmacy`.

**Retail — the function taxonomy:**

`merchandising_assortment` · `pricing_promotions` ·
`demand_inventory_planning` · `supply_chain_fulfillment` ·
`store_operations` · `customer_loyalty_personalization` ·
`digital_commerce` · `marketing_retail_media` · `customer_care` ·
`workforce_labor` · `returns_reverse_logistics` · `loss_prevention`.

The retail vertical follows the same eight-layer schema as healthcare — it is
breadth, not new architecture. v1 of the retail vertical opens it with the
two functions a merchant's economics turn on: `merchandising_assortment` (what
to carry and how productive it is) and `pricing_promotions` (how that
assortment is priced and promoted). Together they are the
**margin-and-mix spine** of retail — the retail counterpart of the
value-based-care spine that proved the schema in healthcare. The retail
vertical is now complete at twelve catalogued functions.

**Financial services — the function taxonomy:**

`retail_banking_deposits` · `lending_credit_underwriting` ·
`payments_money_movement` · `wealth_asset_management` ·
`capital_markets_trading` · `commercial_corporate_banking` ·
`risk_management` · `fraud_financial_crime` · `regulatory_compliance` ·
`finance_treasury_alm` · `customer_servicing_contact_center` ·
`collections_recovery`.

The financial-services vertical follows the same eight-layer schema — again
breadth, not new architecture. It spans the front office (deposits, lending,
payments, wealth, markets, commercial banking), the control functions
(enterprise risk, fraud & financial crime, regulatory compliance), the
corporate spine (finance, treasury & asset-liability management), and the
servicing operations (customer servicing & contact centre, collections &
recovery). It is the diversified-institution taxonomy a tenant such as a
universal bank operates against. The depth bar (§6) is identical for every
function in every vertical.

## 4. The Function Pack schema

Every Function Pack carries eight layers. Each layer has a typed shape and a
depth requirement — a layer that is generic enough to apply to any industry
is a hard fail.

| # | Layer | Required content | Why it matters |
|---|---|---|---|
| 1 | **Operating metrics** | The KPIs that define performance in this function — each with a definition, unit, the direction of "good", a benchmark range, and a typical data source. | Makes baselines real; makes seed gaps *precise* — the pack knows what *should* be measured. |
| 2 | **Pain themes & failure modes** | The recurring ways this function underperforms or breaks — domain-specific, named, with the signal that detects each. | Function-specific "phase traps"; the agent knows what to look for. |
| 3 | **AI use-case archetypes** | The recurring AI bets made in this function — each with its value mechanism, adoption profile, data dependencies, control/risk profile, and the metrics it moves. | The agent *recognises* the bet instead of reasoning from zero. |
| 4 | **Reference solution patterns** | The architecture + operating-model patterns that recur — named, with the boundary, the human-accountability point, the control posture. | Feeds the Solution Architecture Pack and the "patterns" depth directly. |
| 5 | **Value model** | How value is realised in this function; which haircut factors bite hardest (adoption, data readiness, regulatory, process dependency); benchmark value ranges. | Honest, function-calibrated value forecasts. |
| 6 | **Vocabulary & entities** | Systems of record, the roles, the regulatory frame, the canonical terms. | Grounds the language; the agent sounds like an operator. |
| 7 | **Deliverable outlines** | The canonical table of contents for each phase artifact *as it applies to this function* — Discover brief, business case, architecture pack, etc. | **The deliverable-depth fix** — structure is inherited, not improvised. |
| 8 | **Evidence anchors** | What data proves what in this function; which sources are authoritative; what "good evidence" looks like. | Strengthens the no-fabrication discipline. |

Each pack is a pure, deterministic, typed module — no I/O, no fabrication —
the same discipline as the expert kernel.

## 5. Context binding — how a pack plugs in

- A resolver: `resolveFunctionPack(industryKey, functionKey): FunctionPack | null`
  backed by a registry (extensible catalog, same shape as the board-artifacts
  registry and the pilot catalog).
- **Binding contract.** Before a surface reasons about a task in a known
  industry-function, it resolves the pack and binds it:
  - the **deliverable outline** drives the artifact's table of contents;
  - the **operating-metrics** list drives the baseline model — and turns
    "metric absent" into a *precise, named* seed gap;
  - the **AI use-case archetypes** drive use-case recognition;
  - the **value model** calibrates the haircut/forecast;
  - the **vocabulary** grounds the agent's language;
  - the **pain themes** seed the diagnostic questions.
- When no pack exists for an industry-function, the agent falls back to
  general reasoning — and says so honestly. A missing pack is a known gap,
  never silently faked depth.

## 6. The depth bar — what "super deep" means

v1 builds two healthcare reference packs to genuine reference depth — the
**value-based-care spine**: `care_delivery_care_management` and
`population_health_value_based_care`.

Each reference pack must carry, at minimum:

- **≥ 10 operating metrics**, each with definition, unit, benchmark range,
  data source — real VBC/care-management metrics (e.g. risk-adjusted total
  cost of care, readmission rate, ED utilisation per 1,000, care-gap closure
  rate, HCC/RAF capture, panel risk distribution, care-plan adherence).
- **≥ 6 pain themes**, each with its detection signal.
- **≥ 5 AI use-case archetypes**, each fully specified (value mechanism,
  adoption profile, data deps, control/risk, metrics moved).
- **≥ 4 reference solution patterns**.
- A complete **value model** with the function's dominant haircut factors.
- A real **vocabulary & entities** layer (the SoRs, roles, the regulatory
  frame — CMS programs, VBC contract types, etc.).
- **Deliverable outlines** for the four Moves phase artifacts.
- **Evidence anchors**.

**Hard fails** (auto-reject the pack): a metric with no definition or
benchmark; an archetype with no value mechanism; content generic enough to
paste into any industry; a deliverable outline that is a label list, not a
real TOC; any fabricated benchmark presented as fact rather than a labelled
planning range.

## 7. No-fabrication — the pack makes seed gaps precise

Today a seed gap is "we don't have this number." With a Function Pack, the
gap becomes specific: *"care-gap closure rate is not recorded — this function
expects it; it is sourced from the care-management platform; its absence
blocks the value forecast."* The pack knows what *should* exist, so the
honesty is sharper, not vaguer.

## 8. Scoping

1. **One vertical — healthcare.** Two functions to reference depth first
   (§6). Prove the schema and the depth bar before breadth.
2. **Fixed schema.** The eight-layer schema is the contract; new packs are
   catalog entries, not new architecture.
3. **Pilots deepen it.** A healthcare pilot funds the deepening of the
   functions it touches; the library compounds with every engagement.
4. Then: expand healthcare functions, then port the schema to retail.

## 9. The experience horizon — named, not yet in scope

Once the dataset has genuine depth, the next challenge is the **experience**:
making the app feel Apple-grade *on top of* this domain layer — a surface
where the depth is felt, not just present. That is a deliberate later phase.
The discipline for v1: the dataset must be deep first, or the experience has
nothing to be elegant about. This spec builds the depth; the experience
design comes after the reference packs prove the bar.
