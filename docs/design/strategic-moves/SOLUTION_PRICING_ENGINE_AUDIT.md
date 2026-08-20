# Solution Pricing, Should-Cost & Portfolio Economics Engine — Current-State Audit

**Status:** audit only. No schema or code changes proposed here are implemented.
**Date:** 2026-08-19
**Scope:** the Moves estimating capability end to end, audited against the target
operating model for a governed Solution Pricing / Should-Cost / Portfolio
Economics engine.

> **Naming note.** This document is in a **public** repository. The pilot
> client is referred to throughout as "the client" and delivery-model scenarios
> are named `client_led` / `vendor_led` rather than by any real organisation.
> Synthetic tenants (`meridian-health`, `apex-retail`) are named directly
> because they are fixtures.

---

## 0. Headline finding — read this first

**There are three parallel, non-integrated estimating systems in this codebase,
and the newest one already implements roughly half of the target model.**

| #   | System                                                    | Decomposition                                       | Roles                                                             | UI                 | Persistence                        | Wired to gates? |
| --- | --------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- | ------------------ | ---------------------------------- | --------------- |
| 1   | **Expert Kernel** `effort-estimator.ts`                   | 8 flat workstreams                                  | 38                                                                | none               | none (rebuilt per call)            | no              |
| 2   | **Nexus Pricing Engine** `src/lib/pricing/`               | 8 archetypes → 49 activity packs → 100 driver rules | **326** (21 towers → 147 capabilities → 146 families → 10 levels) | real 5-step wizard | real tables, snapshots, versioning | no              |
| 3   | **Deliverable Orchestrator** `deliverables/orchestrated/` | none — LLM authors prose                            | n/a                                                               | none               | HTML only                          | no              |

The instinct behind the brief — "build a governed pricing engine, not a better
ROM calculator" — has **already been acted on once**, in system 2. It was built
deliberately isolated from system 1 (`docs/architecture/PRICING_ENGINE_CURRENT_STATE.md`
§14: _"explicit product decision to build fresh rather than fold into
expert-kernel/rate-card"_), and it has never been connected to a tenant, a
governance gate, or a client-facing document.

**The recommendation that follows is therefore convergence, not greenfield.**
Building a fourth engine would be the single worst outcome available.

There is also one finding that is a **correctness problem today**, not a gap:

> **The orchestrated path violates the brief's §28 hard rule right now.** When
> the tenant flag `moves_orchestrated_deliverables` is ON, the board-grade
> business-case route calls `runOrchestratedBusinessCase()` _instead of_ the
> deterministic kernel, and Claude authors the cost and value figures from
> evidence rather than being handed computed totals
> (`src/app/api/v1/moves/board-grade-business-case/route.ts:107-165`;
> `deliverables/orchestrated/build-request.ts:140-319` — it never imports
> `buildEffortEstimate`, `buildAssumptionLedger`, or `compileBusinessCase`).
> This needs a decision before anything else is built on top of it.

---

## 1. Current-state audit

### 1.1 Estimate artifact types and schemas

| Artifact                   | Model                  | Produced by                 | Format                                   |
| -------------------------- | ---------------------- | --------------------------- | ---------------------------------------- |
| Charter case PDF           | `BusinessCaseSkeleton` | `business-case-pdf.tsx`     | PDF (`@react-pdf/renderer`)              |
| Costed business-case pack  | `BusinessCaseSkeleton` | `business-case-pdf.tsx`     | PDF                                      |
| CFO pack                   | `BusinessCaseSkeleton` | `business-case-pdf.tsx`     | PDF                                      |
| Board-grade estimate model | `MoveEstimateModel`    | `move-estimate-renderer.ts` | HTML (inline SVG, `@media print`)        |
| Board-grade business case  | `MovePackModel`        | `move-pack-model.ts`        | HTML, + PPTX for the reference deck only |
| Pricing estimate           | `EffortEngineOutput`   | `effort-engine.ts`          | UI only — no document                    |

**Core schema (system 1):** `EffortEstimate` (`effort-estimator.ts:132-151`) —
`workstreams[]`, `totalCost: Range`, `totalHumanCost`, `totalAgentCost`,
`effectiveAgentSplit`, `buildVsChange`, `aiOpsCost`, `probabilistic`, `rateCard`.
Each `WorkstreamEstimate` (lines 98-112) carries `cost`, `baseCost`, `humanCost`,
`agentCost`, `agentSplit`, `totalHeadcount`, `durationMonths`.

**Core schema (system 2):** `EffortEngineOutput` → `EffortLineItem[]` with
`activityPackCode`, `ruleCode`, `roleCode`, `moduleHours{raw,expected}`,
`laborCostCents`, `manualCostCents`, `classification`, `sharedCostRef`.

System 2's line-item schema is strictly richer and is the correct base.

### 1.2 Component library

Three exist; none is connected to costing.

1. **`src/lib/solutions/analytics-modernization-components.ts`** — 15 components
   (`cloud_lakehouse_foundation`, `data_quality_observability`, …). Rich
   definitions/steps/risks/governance. **Zero dollar or effort fields. Zero
   non-test consumers.** Pure taxonomy.
2. **`expert-kernel/modernization/archetype-coefficients.ts`** — the best asset in
   the repo for this work, and **orphaned**. 6 archetypes, each with
   `targetMedallion: bronze | bronze_to_silver | silver | gold`,
   `automationLeveragePct` and `grossPersonWeeksByComplexity{small,medium,large}`,
   every number carrying a `sourceId` into a 9-entry source ledger with real
   Databricks/AWS URLs, `asOf` dates and confidence ratings. Plus 7 disposition
   multipliers (retire → refactor). **This is the Bronze/Silver/Gold model the
   brief asks for, already built and already sourced — it just isn't wired to
   anything.**
3. **`pricing_activity_packs.csv`** — 49 packs across technical/change/PMO/run
   categories, each mapped to a tower and capability, with 100 driver-based
   effort rules. This is the live component library for system 2.

### 1.3 Rate cards and role taxonomy

**System 1 (live for documents):**

- `RoleRateCard` = `{role, onshoreAnnualRate, offshoreAnnualRate}`
  (`should-cost-model.ts:213-220`). No currency field, no seniority, no daily/hourly
  basis, no nearshore lane.
- 38 `ShouldCostRole` values — but these are a relabelling of only **9**
  researched `WorkSpecialization` buckets (`derived-planning-rate-card.ts:56-95`).
  The in-code comment claiming "six should-cost roles" is stale and wrong.
- Upstream `benchmark-rate-card.ts`: 42 populated cells of a possible 108
  (4 SI archetypes × 3 locations × 9 specializations). Each carries a confidence
  rating and a prose `note` — but **no structured `sourceId`/URL**, unlike
  `archetype-coefficients.ts`. Weaker sourcing than the coefficient library.
- `ANNUAL_BILLABLE_HOURS = 2080` converts hourly benchmarks to annual rates.
- `RateCardProvenance` has 4 values. **`client_specific` is never constructed in
  production code** — the only occurrence is a test fixture
  (`design-plan-phase.test.ts:94`). `comprehensive` is real working code
  (`comprehensive-rate-card.ts`, precedence client > vendor > internal > benchmark)
  but is called only from `demo-rate-card-packs.ts`, whose own header states these
  are _"not market research and not client-provided production records."_

**System 2 (built, unused):** `pricing_roles.csv` — **326 roles**, hierarchically
organised: 21 towers → 147 capabilities → 146 role families → 326 roles → 10
seniority levels. 908 rate bands, each citing a source workbook row, all tagged
`global_starter_unapproved`. 17 delivery locations with `shore_category` and
separate salary/rate/scarcity/cost-of-living multipliers. 5 provider classes
(premium advisory 1.85×, global SI 1.25×, AI-native 1.35×, eng boutique 1.10×,
industrialised offshore 0.85×) with cited source rows.
`pricing_rate_cards` table supports `scope_type ∈ {global, client, move_exception}`
with `parent_rate_card_id` inheritance and RLS.

**Verdict:** the "100+ governed roles, internal and external, with geography and
effective dates" the brief assumes is **already on disk and already schema'd** —
in system 2, feeding nothing.

### 1.4 Existing P3 solution inputs

`p3_solution_pattern_v1` — one enum (5 values) + one free-text rationale. That is
the entirety of P3 solution capture.

**It feeds nothing.** `governance.ts` contains zero references to it; the P3→P4
gate checks for a `design_spec`-family deliverable plus a traceability row and is
entirely indifferent to whether a solution pattern was ever set. `move-business-case.ts`
does not import it.

### 1.5 How effort is actually derived today

`deriveEffort` (`move-business-case.ts:822-946`) builds a **hardcoded 8-workstream
template** with fixed `durationMonths`/`agentSplit`, scaled by exactly three
scalars derived from the bound `FunctionPack`:

- `dataWeight` — count of distinct `dataDependencies` (line 845)
- `controlWeight` — fraction of archetypes needing human-in-the-loop (line 846)
- `patternWeight` — `pack.referenceSolutionPatterns.length / 12` (lines 852-856)

`referenceSolutionPatterns` is **static pre-authored expert-kernel content of fixed
cardinality (4)**, not the P3 user selection. So `patternWeight` is effectively a
constant.

> **Architecture does not determine work today.** The brief's governing principle
> is inverted: work is a fixed template, lightly scaled by content metadata that
> the user never sees or sets.

### 1.6 Persistence, versioning, review, and reuse

- **No estimate is ever persisted as a model.** Only rendered HTML is stored, in
  `generated_artifacts.metadata.renderedHtml`. `BusinessCaseSkeleton` and
  `EffortEstimate` are rebuilt from charter JSONB on every call.
- **No versioning** on the Moves path. `generated_artifacts` has a generic
  `superseded_by` mechanism, but the Moves board-grade writer
  (`saveRenderedBoardGradeMoveArtifact`, `repository.ts:382-421`) never sets
  `deliverableTypeKey`, so supersession never fires — every regeneration inserts an
  unlinked row and "latest" is inferred by `ORDER BY rendered_at DESC`.
- **No Build/Extend/Reuse concept anywhere in system 1.** `grep AssetAction` → zero
  hits repo-wide.
- **No cross-Move economics in system 1.** Every `buildEffortEstimate()` call is
  computed as if it were the only Move in the tenant.
- **The P4 gate validates no content.** `business_case_approved` requires the
  deliverable row to be `signed_off` with business+finance role approvals
  (`governance.ts:1101`, `deliverable-role-approval-policy.ts:24-28`). An empty stub
  passes. The gate never reads a single number from either engine.
- **System 2 does have real persistence, snapshots, and versioning**, plus an
  approve endpoint enforcing segregation of duties — with **no UI entry point**
  (`CostEffortWizard.tsx` never calls `.../approve`).

### 1.7 UI surfaces

- **No UI anywhere renders a real Move's `EffortEstimate` or `BusinessCaseSkeleton`.**
  The interactive "Living Move" view does render `BusinessCaseSkeleton` with live
  recompute — but is hard-locked to three fixed demo cases
  (`apexretail | meridian | arcturus`) with no `moveId` path.
- The board-grade 8-workstream table has **zero click-path**: no `.tsx` file
  anywhere links to `/api/v1/moves/board-grade-estimate-model` or
  `board-grade-business-case`. Reachable only by hand-constructing a URL.
- System 2's `CostEffortWizard` (P4, flag `moves_pricing_engine`, **zero tenants
  enrolled**) is the only genuine estimate UI, and it already shows cost by
  activity pack, cost by role, one-time vs recurring, rate-card coverage %, top
  assumptions and top uncertainty drivers.

### 1.8 Export capability

|                           | Charter/CFO PDF       | Board-grade HTML                        |
| ------------------------- | --------------------- | --------------------------------------- |
| Assumption list           | **yes**               | **yes** (tornado, from `byImpact`)      |
| Per-workstream breakdown  | no (per-_phase_ only) | **yes** — all 8, with human/agent split |
| Bronze/Silver/Gold        | **no**                | **no**                                  |
| Delivery-model comparison | **no**                | **no**                                  |

"Scenario" in both documents means Base/Conservative/Upside **financial
sensitivity**, never a delivery-model choice. No DOCX exists for board-grade
artifacts; the generic multi-format route requires a `metadata.renderableDoc`
that the Moves writer never sets — so **even the LLM-authored business case is
HTML-only**.

---

## 2. Hard-coded assumption inventory

Every cost/effort driver constant, classified. **None of the system-1 constants
are client-approved or contract-derived.**

### AbarVa reference assumptions (asserted, no external citation)

| #   | Location                           | Constant                                                                                                    | Applied to                                                  |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `effort-estimator.ts:153`          | `DEFAULT_CONSERVATIVE = 1.4`                                                                                | every workstream, uniformly                                 |
| 2   | `effort-estimator.ts:154`          | `DEFAULT_UPSIDE = 0.85`                                                                                     | every workstream, uniformly                                 |
| 3   | `should-cost-model.ts:282-288`     | hidden-layer drivers `{integration .35, dataMigration .25, changeManagement .30, opsPerYear .18, exit .12}` | fractions of labour base                                    |
| 4   | `should-cost-model.ts:291`         | `DEFAULT_HIGH_LAYER_UPSIDE = 0.35`                                                                          | hidden-layer high case                                      |
| 5   | `should-cost-model.ts:292`         | `DEFAULT_HIGH_SCALING_MULTIPLIER = 1.6`                                                                     | consumption/scaling high case                               |
| 6   | `value-forecast.ts:48-55`          | haircut weights `{adoption .28, data .20, process .16, integration .12, control .12, sponsor .12}`          | discounts **every Move's** gross value                      |
| 7   | `adoption-approach.ts:183-199`     | five penalties (.15/.30/.25/.15/.10/.10)                                                                    | adoption confidence                                         |
| 8   | `critic.ts:79,131,155`             | `.10` haircut floor, `.40` agent-split ceiling, `.60` coverage floor                                        | QA flags                                                    |
| 9   | `value-forecast-mc.ts:181`         | `discountRate ?? 0.1`                                                                                       | **NPV for every Move, every industry**                      |
| 10  | `derived-planning-rate-card.ts:46` | `ANNUAL_BILLABLE_HOURS = 2080`                                                                              | all rate conversion (standard convention, rationale stated) |
| 11  | `eval-cost-catalog.ts:11`          | `defaultLlmJudgeOutputTokens = 1000`                                                                        | eval cost                                                   |

Item 3's motivating "quote is 20-35% of true cost" claim traces to an **internal
AbarVa strategy doc** (`SOURCE-SOURCING-METHODOLOGY.md:140`) with no external
citation — and the individual per-layer splits are documented nowhere at all.

Item 6 is the most consequential unsourced number set in the codebase: it sets how
much of claimed value is discounted, for every Move, universally.

### Illustrative / placeholder (round numbers, no stated origin)

| #   | Location                         | Constant                                                                                  |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| 12  | `effort-estimator.ts:347,355`    | change-fraction warning bands 0.20 / 0.55                                                 |
| 13  | `roadmap.ts:285`                 | change-underbudgeted flag at 0.15 — **inconsistent with #12's 0.20 for the same concept** |
| 14  | `master-move-dossier.ts:184,187` | confidence bands 0.7 / 0.9                                                                |
| 15  | `embedding-cost-catalog.ts:40`   | `DEFAULT_QUERY_TOKENS = 512`, no comment at all                                           |

### Sourced / cited (the standard to hold everything else to)

| #   | Location                                                            | What                                                                                                                    |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 16  | `archetype-coefficients.ts`                                         | 6 archetypes × complexity bands + 7 dispositions, each with `sourceId` → ledger with URL, `asOf`, confidence, rationale |
| 17  | `ai-ops-cost/model-cost-catalog.ts`, `embedding-cost-catalog.ts`    | vendor pricing-page attribution + `asOf` per entry                                                                      |
| 18  | `pricing_rate_bands.csv` (908 rows), `pricing_provider_classes.csv` | source workbook + row citation, `approval_status: global_starter_unapproved`                                            |

### Missing / requires calibration

- Every rate a real client would recognise. No client rate card has ever been
  loaded (`pricing_providers`/`pricing_provider_level_aliases` are "deliberately
  unseeded").
- Internal loaded-cost methodology — does not exist in any form.
- Delivery-pyramid ratios — no pyramid analysis exists anywhere.
- Per-role location eligibility — does not exist; offshore is a ratio, and
  nothing prevents a governance role being costed 100% offshore.
- Nearshore rates — researched in `benchmark-rate-card.ts`, then **discarded**
  before reaching the estimator, which has only two lanes.

---

## 3. Gap assessment against the target model

Scored against the brief's 32 sections. "Partial" means real code exists but is
unwired, stubbed, or demo-only.

| Brief § | Requirement                            | System 1                     | System 2                                                                                                                            | Verdict                             |
| ------- | -------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2       | Architecture → work → demand → cost    | ✗                            | partial                                                                                                                             | **inverted today**                  |
| 3       | 11 canonical cost categories           | ✗ (8 workstreams)            | partial (49 packs, no canonical roll-up)                                                                                            | gap                                 |
| 4       | Build/Extend/Reuse                     | ✗                            | **partial — `LineClassification` has `shared_program`, `reused`, `already_funded`, `out_of_scope`**                                 | strong seam                         |
| 5       | 3 core cost numbers                    | ✗                            | partial                                                                                                                             | gap                                 |
| 6       | Canonical role taxonomy                | ✗ (38 flat)                  | **✓ (326, families + levels)**                                                                                                      | **exists**                          |
| 7       | Role-based work breakdown              | ✗                            | **✓ (126 activity-role-mix rows)**                                                                                                  | **exists**                          |
| 8       | Delivery-model scenarios               | ✗                            | **stub** — `vendor_led`/`client_led` keys exist with **empty override maps**, functionally identical to `traditional`               | **critical gap**                    |
| 9       | Bill of work stays constant            | n/a                          | n/a                                                                                                                                 | not yet possible                    |
| 10      | Internal loaded cost                   | ✗                            | ✗                                                                                                                                   | gap                                 |
| 11      | External rate lineage                  | ✗                            | **✓**                                                                                                                               | **exists**                          |
| 12      | Delivery pyramid intelligence          | ✗                            | ✗ (levels exist, no analysis)                                                                                                       | gap                                 |
| 13      | Geography optimization                 | ✗ (2 lanes, ratio only)      | partial (17 locations, multipliers)                                                                                                 | gap                                 |
| 14      | Clinical vs non-clinical paths         | ✗                            | ✗                                                                                                                                   | gap                                 |
| 15      | Driver-based complexity                | ✗ (3 hidden scalars)         | **✓ (23 drivers, 100 rules)**                                                                                                       | **exists**                          |
| 16      | AI acceleration as governed hypothesis | ✗ (flat, uniform)            | **✓ — per-activity override map, default 1.0, each with rationale; agent costs added explicitly, never netted**                     | **exists, and is the right design** |
| 17      | Confidence / uncertainty model         | partial (flat multipliers)   | **✓ — 5-dimension score → 4 banded range policies (0.9-1.15 … 0.45-2.0)**                                                           | **exists**                          |
| 18      | Recurring / consumption TCO            | partial (`ai-ops-cost`)      | partial                                                                                                                             | gap                                 |
| 19      | Multi-view roll-up                     | ✗                            | partial                                                                                                                             | gap                                 |
| 20      | Should-cost vs vendor proposal         | ✗                            | ✗ (Source has adjacent work)                                                                                                        | gap                                 |
| 21      | Negotiation levers                     | ✗                            | ✗                                                                                                                                   | gap                                 |
| 22      | Portfolio economics                    | ✗                            | **✓ — `rollUpPortfolio()` dedups shared costs across Moves and reports `naiveSumCents` so the UI can show avoided double-counting** | **exists**                          |
| 23      | Versioning                             | ✗                            | **✓**                                                                                                                               | **exists**                          |
| 24      | Persist the calculation model          | ✗ (HTML only)                | **✓**                                                                                                                               | **exists**                          |
| 25      | Executive artifact                     | partial                      | ✗ (no document at all)                                                                                                              | gap                                 |
| 26      | Reference visuals                      | partial (SVG exhibits exist) | ✗                                                                                                                                   | gap                                 |
| 27      | Quality/blocking rules                 | partial (golden bar)         | partial (validation.ts)                                                                                                             | gap                                 |
| 28      | Claude never calculates totals         | **✗ VIOLATED**               | ✓                                                                                                                                   | **must fix**                        |

**Roughly 10 of 28 requirements are already met — all of them in the system that
is switched off.**

---

## 4. Recommended approach

### 4.1 Converge, don't rebuild

The pricing engine is the target architecture, already ~55% built, with the
correct posture on the two things briefs usually get wrong (AI acceleration as a
per-activity disclosed override rather than a global multiplier; uncertainty as a
driver-scored band rather than a flat contingency).

Proposed disposition:

- **System 2 (`src/lib/pricing/`) becomes the calculation engine.** All quantities,
  effort, rates, cost, scenarios, TCO, reuse and portfolio maths live here.
- **System 1 (`effort-estimator.ts`) is subordinated, then retired.** Near term it
  keeps serving existing documents unchanged. Its genuinely valuable parts —
  `archetype-coefficients.ts` (sourced medallion coefficients) and the
  `ai-ops-cost` catalogs (sourced vendor pricing) — are **lifted into system 2**,
  not duplicated.
- **System 3 (orchestrator) is constrained to narration.** It must be handed
  computed totals and forbidden from authoring numbers.

### 4.2 The three decisions I need from you before any code

These change the shape of the work and are not mine to make.

**D1 — The orchestrator's authority over numbers.**
Today, with the flag on, Claude authors the cost figures. The brief says it must
never do that. Options: (a) hard-gate the orchestrated path so it cannot run
without a computed estimate to narrate; (b) leave it as-is for narrative-only
tenants and forbid it for costed artifacts; (c) retire it. **My recommendation:
(a)** — it preserves the narrative quality already built while restoring
determinism. But this is a behaviour change for any tenant on that flag.

**D2 — Rate-card approval posture.**
All 908 rate bands are `global_starter_unapproved` and no client card has been
loaded. Before any estimate can be shown to a client, someone has to decide what
"approved" means and who signs. Until then every number in the engine is an
AbarVa reference assumption and must be labelled as such on every surface.
**This is the single biggest blocker to the engine being client-usable**, and it
is a governance decision, not an engineering one.

**D3 — Where the estimate lives in the product.**
The pricing wizard is on P4 with zero tenants. The brief's model implies the
estimate is driven from P3 architecture. Do we (a) keep capture on P4, (b) move
component selection to P3 and leave pricing on P4, or (c) span both? **My
recommendation: (b)** — it makes "architecture determines work" literally true in
the UI, and it gives the currently-inert `p3_solution_pattern_v1` something to do.

### 4.3 Sequenced plan

Each step is independently shippable, flag-gated, default-off, and leaves every
existing tenant byte-identical. I would not start step 2 before D1-D3 are answered.

| PR  | Workstream           | Deliverable                                                                                                                                                                | Depends on |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Determinism          | Hard-gate the orchestrator so it cannot author cost/value numbers; regression-test that a costed artifact always traces to a computed estimate                             | **D1**     |
| 2   | Domain model         | Canonical 11-category cost taxonomy as a typed layer over the 49 activity packs; map every pack to exactly one category; reconciliation test                               | —          |
| 3   | Build/Extend/Reuse   | Promote `LineClassification` into a first-class per-component `AssetAction` with a tenant-scoped asset registry; persist `sharedCostRef` identity                          | 2          |
| 4   | Three cost numbers   | Incremental / required-foundation / first-mover, computed from 3 — plus future-reuse value from `rollUpPortfolio`                                                          | 3          |
| 5   | Medallion components | Lift `archetype-coefficients.ts` into the pack library so Bronze/Silver/Gold/Reporting are real, sourced, costed components                                                | 2          |
| 6   | Delivery scenarios   | Make `client_led` / `vendor_led` real: same bill of work, different sourcing; explicit incremental-scope lines for PMO/assurance/KT/warranty; bill-of-work-invariance test | 2, **D2**  |
| 7   | Pyramid + geography  | Level/location analysis and flags over the existing 10 levels and 17 locations; per-role location eligibility                                                              | 6          |
| 8   | Clinical path        | Clinical classification **adds components**, never multiplies labour; prove via test                                                                                       | 2          |
| 9   | Run/TCO              | AWS + Databricks + AI consumption, Year 0-3                                                                                                                                | 2          |
| 10  | Should-cost          | Vendor proposal comparison + variance decomposition that reconciles exactly; negotiation levers                                                                            | 6, 7       |
| 11  | Executive artifact   | The estimate document + reference exhibits, rendered from the persisted model                                                                                              | 4, 5, 6    |
| 12  | Live proof           | Three representative use cases end to end, plus portfolio view proving shared-asset recognition across all three                                                           | all        |

### 4.4 What I will not do

- Convert any AbarVa reference assumption into a client rate, productivity factor
  or multiplier without explicit approval. Every figure in §2 stays labelled as
  what it is.
- Build a fourth engine.
- Report an increment as done on unit tests alone. Per the brief's §30, "done"
  means three representative use cases proven end to end.

---

## 5. Document quality, prompts, token limits and formats

Audited separately at your request. **This is the weakest area found, and it is
weak for a specific, fixable reason: the quality contracts exist and are
well-specified — they are simply not connected to the Moves business case.**

### 5.1 Three quality contracts, none governing this deliverable

| Contract                                                  | Where                                | Applies to the Moves business case?                        |
| --------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `golden-bar.ts` (475 lines, 10 blocking checks)           | `src/lib/deliverables/`              | **No** — only 2 call sites, both in `generate-artifact.ts` |
| `quality-bar-registry.ts` `moves::business_case` override | `src/lib/deliverables/orchestrator/` | **No** — see 5.2                                           |
| `validateDeliverableQuality`                              | orchestrated path only               | Yes, but with the wrong bar                                |

The deterministic renderer (`renderMoveCostedBusinessCaseHtml`) has **no quality
gate of any kind**.

### 5.2 The dead quality bar — the single worst defect found

`programs/deliverables/orchestrated/build-request.ts:36-46` **hardcodes** a generic
`QUALITY_BAR` and never calls `resolveQualityBar`. The only production caller of
`resolveQualityBar` is the _generic_ builder, which the Moves routes do not use.

So the entire `moves::business_case` override (`quality-bar-registry.ts:81-93`) is
dead for this route:

| Setting                     | Intended       | Actually enforced     |
| --------------------------- | -------------- | --------------------- |
| Minimum sections            | 9              | **5**                 |
| Minimum body words          | 5,000          | **600**               |
| Target max / advisory band  | 9,500 / 11,000 | **no ceiling at all** |
| `requiresCentralTension`    | yes            | never asked for       |
| `requiresOptionsConsidered` | yes            | never asked for       |
| `requiresEvidenceGapsNoted` | yes            | never asked for       |

Consequences, each traced:

1. **No length instruction reaches the model.** `sizeDisciplineInstruction` returns
   `""` when `targetBodyWordsMax` is undefined.
2. **No per-section word cap.** `conciseSectionDraftInstruction` returns `""`.
3. **The system prompt actively encourages length**: with `enforceMaxAsBlocker`
   false, the model is told _"Do not optimize for short documents"_
   (`prompt-builder.ts:108`).
4. **No narrative-spine instruction** — central tension, real options considered,
   and what remains unproven are never requested.
5. **A ~600-word document passes as a board-grade business case.** So does a
   30,000-word one.

### 5.3 The red-team pass does not run

`GENERATION_PASSES` advertises six passes (architect → evidence_grounding →
full_draft → red_team → board_grade_rewrite → render_package). **The array is
documentation only.** The real sequence (`orchestrator.ts:157-273`) is:

```
architect (1 call) → section_draft × N (concurrency 5) → synthesis (1 call)
```

Five of six documented prompts are unreachable code — including the **red-team
critique**, the one pass that would catch generic prose and mechanical
template-following. The file header still describes the sequence that no longer
exists.

There is also **no retry or repair on quality failure**: the gate runs once and
returns a blocked reason. The only retry is network-level (2 attempts, connection
errors only).

### 5.4 The orchestrated business case contains zero visuals

`doc.exhibits` is computed, then **never read** by `render-html.ts:174-263`. The
rendered document is prose plus HTML tables. If `golden-bar` were applied it would
fail check #1 (`hasVisuals`) immediately. The profile's `visualRendererRequired:
true` is enforced nowhere.

### 5.5 The unsupported-claim blocker is structurally unreachable

`countUnsupportedClaims` treats any uncited figure as a blocker. But
`repairUncitedFigures` mirrors the same regexes and runs **twice, before the
validator**, appending `[ASSUMPTION TO VALIDATE: …]` to every offending sentence.

> The net mechanism: **every ungrounded figure the model invents is preserved
> verbatim and relabelled as an assumption.** A fabricated "$4.2M annual savings"
> survives into the board document with a tag. A document can be almost entirely
> invented numbers and still pass.

There is also **no verification that a `[n]` citation actually supports the
sentence it is attached to** — citations are checked for existence only.

And `minEvidence` defaults to **1**: one charter field authorises a board-grade
investment case.

### 5.6 `qualityScore` cannot express "board-grade"

```
score = pass ? 92 : 55
  − min(unsupportedClaims, 8) × 3
  − (overMaxWords ? 6 : 0)
  − min(duplicateHeadings, 6) × 4
```

- **Ceiling is 92.** There is no gradation above pass.
- It is binary-plus-penalties, not a quality measure — a document with 40 exhibits
  and one with the bare minimum both score 92.
- It ignores 7 of the 10 blocking signals entirely.
- The blueprint's 7-dimension rubric (storyline, exhibit craft, financial
  challenge, domain expertise, decision usability, auditability, visual polish) is
  **not implemented at all**.

### 5.7 Blueprint vs. built

`docs/strategy/MOVES-BOARD-GRADE-ARTIFACT-BLUEPRINT.md` §9/§A.5 specifies **11
sections and 11 named exhibits**, 10-12 pages.

| #   | Blueprint section     | Deterministic                                                     | Orchestrated     |
| --- | --------------------- | ----------------------------------------------------------------- | ---------------- |
| 1   | Board Answer          | ✓                                                                 | ~                |
| 2   | Why Now               | **✗** — replaced by an "Inherited outline" Function-Pack TOC dump | ~                |
| 3   | What We Are Funding   | **✗** no scope boundary                                           | **✗**            |
| 4   | Investment Case       | ✓                                                                 | ~                |
| 5   | Value Case            | ✓                                                                 | ~                |
| 6   | Payback & Sensitivity | ~ no payback curve                                                | ~ no sensitivity |
| 7   | Roadmap & Gates       | **✗**                                                             | **✗**            |
| 8   | Risk & Control View   | **✗**                                                             | ~ no heatmap     |
| 9   | Assumption Ledger     | **✗**                                                             | **✗**            |
| 10  | Evidence Appendix     | ✓                                                                 | ~                |
| 11  | Recommendation & Asks | ~ no "what not to fund yet"                                       | ~                |

**7 of 11 missing or partial on the deterministic path; ~9 of 11 on the
orchestrated path.** None of the blueprint's named hard-fails are checked: no
downside-case check, no "what not to fund yet" check, no first-page decision
check, no payback-while-monetisation-blocked check.

The blueprint's exhibit anatomy (§2 — takeaway title, decision role, evidence
strip, implication, owner, next gate) **is** fully implemented as a type on the
deterministic path (`MoveSectionAnatomy`). It is the best thing in the document
layer, and the orchestrated path implements none of it.

### 5.8 Token and format contracts

- **Model**: one tier for every pass (`tier4_large_package` → env-resolved, default
  `claude-opus-4-8`). No cheap-model routing for the architect pass. Worth a
  separate decision on whether to move to the current Opus generation.
- **Token budgets**: flat **12,000 per section** regardless of importance — the
  executive summary and the risk register get identical budgets. The charter has a
  bespoke per-pass ceiling; **the business case has no equivalent**. The 32,000
  `maxOutputTokens` defined for `business_case` is read by the golden-bar pipeline
  and **never by the orchestrated path** — two numbers, one consumer each.
- **Formats**: HTML only on both paths. PDF is not wired. Yet `formattingProfile`
  sets `wideDataToExcelCompanion: true`, every synthesized table sets
  `targetFormat: "docx"` or `"xlsx"`, and the prompt instructs the model to _"move
  wide datasets into an Excel companion exhibit"_ — **for an HTML-only pipeline**.
  No companion is ever produced, and the format-mismatch validator only warns.

### 5.9 One artifact id, two different documents

Both paths persist under the same artifact id (`costed-business-case`), the same
title, and the same record — differing only by an `x-deliverable-engine` header.
The orchestrated path additionally **forces the title** to "Business Case Readiness
Memo" unconditionally, so it can never produce a document titled "Business Case"
regardless of evidence completeness.

### 5.10 Where this lands in the plan

Document quality is not a separate workstream — it is the acceptance criteria for
PR 11. But three items are **independent of the pricing work and worth doing
first**, because they are cheap and they currently make every artifact
untrustworthy:

|     | Fix                                                                                                                                             | Effort               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Q1  | Call `resolveQualityBar` instead of the hardcoded bar — activates the real 9-section / 5,000-word contract and the narrative-spine instructions | small                |
| Q2  | Apply `golden-bar` to both Moves paths                                                                                                          | small                |
| Q3  | Decide whether `repairUncitedFigures` should tag or block; today it guarantees the blocker never fires                                          | decision, then small |

---

## 6. Open items carried into design

- The 15-component `analytics-modernization-components.ts` taxonomy and the 49
  activity packs overlap conceptually and need reconciling into one library.
- `benchmark-rate-card.ts` needs the structured `sourceId` ledger pattern that
  `archetype-coefficients.ts` already uses, or its rates should be superseded by
  system 2's cited bands.
- The 0.15 / 0.20 change-fraction inconsistency (#12 vs #13) should be resolved to
  one value with a stated basis, or both removed.
- No estimate document renders to DOCX today. If executives need Word, that is a
  `renderableDoc` wiring task, not a new renderer.
