# Workforce Economics — In-Product Compute Engine (first slice)

**Module:** `src/lib/workforce-economics/`
**Status:** First slice — pure compute engine + contract + tests. NOT yet wired into the Move generate path.
**Brief:** `docs/codex-handoff/WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md` (phases WE-1 … WE-5).
**Substrate of record:** `docs/workforce-economics/Workforce_Taxonomy_Master.xlsx` (built by `scripts/workforce-economics/build-workforce-taxonomy.py` — 21 towers / 321 roles / 891 rate-card units / 107 pods).

---

## What this slice delivers

A **pure, deterministic** "estimate-twice" compute engine — no DB, no model calls, unit-testable:

- **Contract** (`workforce-economics.ts`):
  - **Input** — `WorkforceEstimateInput`: a Move / WorkPackage scope expressed as a 10-category WBS (`EstimateCategory`), a geo/shore mix with traceable onshore/offshore rate-card rates (`GeoShoreMix`), the selected anonymized agent platform (`AgentPlatform`), the Traditional-vs-AI-native team shapes (`TeamShape`), and the hours/FTE/month planning basis.
  - **Output** — `WorkforceEstimateTwice`: a `traditional` and an `aiNative` `WorkforceScenario` (FTE, agents, effective capacity, duration months, human hours billed, human cost, agent cost, total cost), the `delta` (cost saving, % reduction, months saved, headcount reduction, productivity gain), and an honest `assumptions` block (planning confidence, agent-capacity planning RANGE with a conservative haircut, named drivers, caveats, normalization notes).

- **Compute** (`computeWorkforceEstimate`): implements the **WE-2 capacity model EXACTLY** —

  ```
  W            = Σ WBS effort hours
  blendedRate  = onFrac·onshoreRate + offFrac·offshoreRate
  // Traditional (people-only)
  tradMonths   = W / (tradHumans · hoursPerFteMonth)
  tradCost     = W · blendedRate
  // AI-Native (agents = parallel capacity on subscription; humans billed for actual time)
  agentCap     = agents · agentEquivFte · agentUtil
  aiCapacity   = aiHumans + agentCap
  aiMonths     = W / (aiCapacity · hoursPerFteMonth)
  aiHumanHours = aiHumans · aiMonths · hoursPerFteMonth
  aiCost       = aiHumanHours · blendedRate + agentAnnualCost · (aiMonths / 12)
  productivity = W / aiHumanHours
  ```

  This is a **CAPACITY model, not effort compression** — it does NOT compress effort hours *and* cut the team (the double-count bug the workbook caught). AI-native is cheaper because agent capacity is subscription-priced and humans are billed only for time actually worked. AI productivity is surfaced as a **planning range with an honest haircut**, never fabricated precision.

- **Tests** (`__tests__/workforce-economics.test.ts`): pinned to the workbook's worked example (the "Customer Data Product Program", W = 13,000 hrs, 40/60 geo, 18→8 humans + 12 agents). Asserts the **traditional cost anchor of $1,707,030 (≈ $1.71M)**, blended rate $131.31/hr, AI-native strictly cheaper (> 50% reduction) **and not slower**, agent cost < human cost (subscription, not human rate), a productivity multiple > 1 (≈ 3.0×), delta internal consistency, a populated honesty block, determinism, geo-mix normalization, and the two RangeError guards.

> **Note on the brief's narrative figure.** PART A of the brief narrates the AI-native side as ≈ $0.72M / 2.4×. Running the WE-2 formula on the workbook's literal Estimation-Engine inputs yields ≈ $0.58M / ~3.0× — the **traditional $1.71M anchor matches exactly**; the AI-native point depends on the precise agent/human counts in the worked example. The **formula is the contract**, so the tests assert the formula's deterministic output and the directional guarantees (cheaper, not slower, productivity > 1), not a hand-narrated point. Reconcile the exact narrative figure when the substrate constants are ported in WE-1.

---

## How it binds to Moves (per the brief)

The engine is an **input**, not a second business-case generator. Binding flows through the existing Move deliverable arc:

1. **WorkPackage scope → WBS.** A Move's WorkPackage / roadmap scope is expressed as effort hours across the 10 estimate categories (the same categories the Moves effort-estimator and the workbook already use). `computeWorkforceEstimate` consumes that WBS plus the selected delivery pod, geo mix, and agent platform.
2. **Business case (WE-3).** `src/lib/programs/move-business-case.ts` consumes the `WorkforceEstimateTwice` to emit Traditional-vs-AI-native cost / timeline / team / productivity / ROI / payback / NPV — every figure traceable to a substrate value (rate-card row / assumption / pod).
3. **Roadmap (WE-4).** `src/lib/deliverables/execution-roadmap-tracker.ts` derives phase / WorkPackage durations from `durationMonths` (effort ÷ capacity) — **no invented timelines**; the AI-native roadmap reflects the capacity gain.
4. **Convergence.** Per the reconciliation note, WE-3/4/5 converge through the transformation's `MoveDecisionModel` as the Value Model, rendered via the **existing** board-grade economic exhibits (`expert-kernel/exports/board-grade/svg-charts.ts`: investment waterfall, cost stack, value bridge, payback curve, tornado, roadmap swimlane) — **not** a parallel exhibit/generation path.

The output model deliberately mirrors `move-estimate-model.ts` conventions: discriminated/typed sections, planning-grade confidence, named evidence drivers, explicit caveats — so it slots into the existing estimate deck shell.

---

## Remaining work (this is a first slice)

**WE-1 — port the substrate (source-of-truth discipline).** Have the Python builder also emit `src/lib/workforce-economics/workforce-economics.constants.json` (assumptions, multipliers, rate card as diffable JSON); add `taxonomy.ts`, `assumptions.ts`, `rate-engine.ts` that import + validate against that JSON so TS cannot drift from the workbook. Today the test hand-feeds the blended rate / agent economics; WE-1 makes those derive from the substrate (e.g. `blendedRate(mix)`, `rateCard()`, `providerRate(...)`).

**WE-3 — business-case bind.** Wire `move-business-case.ts` to call `computeWorkforceEstimate` and add ROI / payback / NPV (discount-rate + horizon inputs) on top of the cost/timeline this slice produces. Reuse the GroundedAnswer contract for the narrative (cite drivers, refuse on insufficient).

**WE-4 — roadmap from estimate.** Derive `execution-roadmap-tracker.ts` durations from `durationMonths` + dependencies + critical path; both scenarios produce a roadmap.

**WE-5 — orchestrator + route wiring + live proof.** Register WE-backed deliverables in `deliverable-registry.ts` + the orchestrator generation-plan; gate behind tenant flag `moves_workforce_economics` (default OFF, mirroring `moves_orchestrated_deliverables`); prove live on ACA against a real Move at P1 (localhost cannot reach the private DB).

**UI surfacing.** Render the estimate-twice through the existing board-grade economic exhibits; no parallel exhibit path.

**Engine extensions (later).** Per-category agent-amenability re-weighting (the `agentAmenability` field is carried but not yet used to vary capacity by line); multi-pod blends; sensitivity / scenario bands on the AI-native side; tower-level rollups for portfolio views.
