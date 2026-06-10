# Moves Consulting Engine — End-to-End Arc Map

**Status:** design · 2026-06-09
**Purpose:** One end-to-end map of the Moves engine as a _consulting brain_ — **collect
comprehensively (scoped to the client's real estate) → reason → recommend the approach,
sequencing, strategy, roadmap, and estimates.** Client/use-case agnostic; proven first on
SkyHarbor "AI-Powered Product Development Lifecycle".
**Supersedes the linear readiness framing** in `current-state-readiness-model.md` (kept as the
intake-instrument detail). Ties together `discovery-engine-design.md` (analysis),
`strategy-content-model.md` (outputs), and `move-deliverable-story-arc-map.md` (deliverables).

---

## 0. Thesis

The client brings a problem/aspiration. They do **not** know where to start, how to sequence,
or what it costs — **producing that is the product.** So the engine must:

1. **Discover the estate** (what they _have_) — mostly from the context layer; infers the profile.
2. **Collect comprehensively within that estate** — the client supplies _data/docs_, never decisions.
3. **Reason** — maturity + two-gap + AI-leverage×readiness ranking.
4. **Recommend** — where to start, target state, approach, strategy, roadmap, **estimates aligned to the roadmap**.

Non-linearity lives in two places: **(a)** estate discovery _scopes which instruments apply_
(DORA for full-stack squads; batch/SME/modernization for mainframe; ETL/lineage for DataStage),
and **(b)** the _leverage×readiness ranking computes the sequence_ — "where to start" is an
**output**, never a question.

## 1. The arc as a state machine (P0→P5)

Each phase **inherits** a frozen contract from the prior, **collects** (estate-scoped evidence),
**derives** (system reasoning), and **emits** a frozen contract for the next. Gate = `governance.evaluateGate` + PhasePack `gate_criteria`.

| Phase                          | Inherits               | COLLECT (estate-scoped, client supplies data)                                                                                                              | DERIVE (system reasons → the value)                                                                                                                                                   | Emits (frozen)                                                                   | Plug-in                                                                                |
| ------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **P0 Originate**               | signal                 | signal, archetype signals; **estate discovery (broad/shallow)**: which team archetypes, systems, clouds, tooling exist (context-layer)                     | classify use-case archetype + **MoveProfile** (estate-inferred); **evidence-families-in-scope** for this estate                                                                       | hypothesis, archetype, sponsor candidate, **MoveProfile + scoped evidence plan** | PhasePack P0.1–P0.4; `MoveProfile` (NEW)                                               |
| **P1 Charter**                 | profile, scope         | sponsor confirm; stakeholder/decision-rights; **the derived per-estate current-state doc requests** (DORA / batch / ETL / cloud / tooling…) begin          | sponsor commitment; **ValueTree** (north-star→drivers→KPIs); preliminary value **Range**; kill criterion                                                                              | charter, ValueTree, value Range, stakeholder map                                 | PhasePack P1.1–P1.5; `ValueTree`                                                       |
| **P2 Discover & Diagnose**     | charter, ValueTree     | **COMPREHENSIVE current-state**: baselines per relevant area + systems/CMDB + org/workforce + vendor + controls + tooling-benefits/gaps + change-readiness | **maturity profile (8 dims, 1–5, vs industry)**; **two-gap** (foundation vs use-case) → `CapabilityGap[]`; root causes; **AI-leverage×readiness ranking per area**                    | `BaselineModel`, `CapabilityGap[]`, maturity, **leverage ranking**               | `discovery-engine-design.md`; PhasePack P2; **CapabilityGap bridge (MISSING)**         |
| **P3 Design**                  | gaps, ValueTree        | option preferences, sourcing constraints                                                                                                                   | **target state** (`LayeredArchitecture`, operating model, agentic), 2–3 options + tradeoffs, sourcing                                                                                 | targetState, OptionTradeoff, sourcing                                            | PhasePack P3; `LayeredArchitecture` (**thin/MISSING for non-data-platform**)           |
| **P4 Roadmap & Business Case** | gaps, targetState      | rate-card overrides, constraints                                                                                                                           | **PhaseThesis + sequencing** (← leverage ranking), **WorkflowMap/DataflowMap**, **Roadmap (WorkPackages)**, **EffortEstimate phased BY WorkPackages**, value model, Tower metric plan | Roadmap+WorkPackage[], EffortEstimate, business case                             | `roadmap.ts`, `effort-estimator.ts` (**exist**); WorkflowMap/DataflowMap (**MISSING**) |
| **P5 Mobilize**                | roadmap, business case | approvals, team names                                                                                                                                      | handoff package; Tower acceptance                                                                                                                                                     | execution-ready handoff                                                          | PhasePack P5; `mobilize_pack` (**exists**)                                             |

**The "where to start" answer** is produced at **P2 (leverage×readiness ranking)** and consumed
at **P4 (PhaseThesis sequencing → Roadmap)** — never asked of the client.

## 2. Estate-driven collection model (the intake half)

Replaces the fixed family list with **estate-conditional instruments** (see
`current-state-readiness-model.md` R1/R2 for the registry shape):

- **Estate discovery (P0):** from context layer + light confirmation → `MoveProfile`
  (teamArchetypes[], deliveryMaturity, orgTopology, cloudPosture, existingAiTools[], industry).
- **Instrument library w/ applicability predicates:** each current-state instrument declares
  `appliesWhen(profile)`, `phase`, `severityFor(profile)`, and a `backing` source (a `tower_*`
  table for committed data, or chat/upload for qualitative). Predicates branch on **what the
  estate has** — e.g. `dora_baseline.appliesWhen = team∈{full_stack,data_eng} ∧ delivery∈{scrum,continuous}`.
- **Derivation = predicates ∪ Claude:** predicates select the obvious; Claude tailors
  profile-specific questions + extra doc requests, **grounded** (every ask cites why it applies; no invented requirements).
- **Comprehensiveness, honestly:** "readiness" = _enough current-state collected, across the
  areas the estate makes relevant, to produce a defensible recommendation._ Honest ingestion
  ladder `missing→staged→parsing→committed`; never "committed" before rows land + are retrievable.

## 3. The cross-phase data contract (continuity)

Reuse the locked `strategy-content-model.md` continuity contract — the single binding that keeps
the arc coherent and **fixes "estimates float free of the roadmap"**:

```
UseCase.scope → ValueTree.drivers → CapabilityGap[] (current↔target) →
  targetState → PhaseThesis (sequencing) → Roadmap.workPackages →
    EffortEstimate (phased BY workPackages) + ValueForecast → MeasurementHandoff (Tower)
```

`WorkPackage.workstreamId` reuses the kernel `WorkstreamId` enum
(`ai_build|integration|data|foundational|data_governance|process_redesign|change_adoption|run`),
so the estimate, roadmap, and swimlane stack share one atom. `CapabilityGap.bridgedBy = WorkPackage.id[]`
closes the loop from gap → work → cost.

## 4. What exists vs what's missing (build surface)

From `move-deliverable-story-arc-map.md` + code:

**Solid (reuse):** phase packs P0–P5 (workflow steps, gates, anti-hallucination), `effort-estimator.ts`,
`roadmap.ts` (WorkPackage-aware), `charter_case`, `discover_brief`, `business_case_pack`, `financial_model`,
`cfo_pack`, `mobilize_pack`; the `tower_*` current-state tables; the upload→attachment→chunk seam.

**Gaps to close (the engine's real work):**

1. **Comprehensive current-state collection** — today P2 grabs ~4 KPIs; needs systems/CMDB + org/workforce
   - vendor + controls + tooling-benefits/gaps + change-readiness, estate-scoped. _(intake half)_
2. **Estate discovery → MoveProfile** — does not exist; P0.2 classifies a single archetype only.
3. **AI-leverage×readiness ranking** — the "where to start" engine; not present.
4. **CapabilityGap bridge** (P2→P3) — decks carry evidence/seed gaps, not capability gaps.
5. **Target-state for non-data-platform archetypes** — `LayeredArchitecture` is data-platform-shaped.
6. **WorkflowMap / DataflowMap** — missing; mandatory for the strategy document.
7. **Fused Strategy Document** (M5+M6+M7) + **estimate phased by roadmap WorkPackages** — partial.
8. **Context-layer enrichment writeback** (flywheel) via `AgentContextBroker`.

## 5. Build slices (engine-general, proven on AI-SDLC)

| Slice  | Scope                                                                                                                              | Proves on AI-SDLC                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **E1** | `MoveProfile` + estate-discovery resolver (context-layer-inferred) + estate-conditional instrument library (predicates)            | SkyHarbor profile: detect team archetypes / cloud / tooling from context |
| **E2** | Comprehensive collection panel + upload→classify→commit for CSV families (DORA, CMDB, workforce) + honest ladder + evidence_ledger | Supply real SkyHarbor exports → committed + retrievable                  |
| **E3** | Maturity scoring (8 dims) + two-gap → `CapabilityGap[]` + **AI-leverage×readiness ranking** (the where-to-start engine)            | Rank SkyHarbor teams/areas; produce first-wave recommendation            |
| **E4** | PhaseThesis sequencing ← ranking → Roadmap WorkPackages → EffortEstimate phased by WorkPackages                                    | SkyHarbor roadmap + estimate aligned, not floating                       |
| **E5** | WorkflowMap/DataflowMap + fused Strategy Document (HTML, altitude-filtered)                                                        | One SkyHarbor strategy doc, board/exec/full                              |
| **E6** | Originate the REAL SkyHarbor Move P0→P2 end-to-end through the engine; enrichment writeback                                        | Live: profile→collect→diagnose→ranked recommendation, all real           |

Each slice is engine-general (registry/predicate/score driven, no AI-SDLC hardcode) and verified on the SkyHarbor instance.

## 6. Boundaries

- Collection is **context/evidence** via the governed upload path; identity work stays separate.
- Single-tenant; no cross-tenant reads/writes; enrichment writeback only through `AgentContextBroker`.
- Truth standard: states reported separately; CSV-only auto-commit in v1, binaries review-required.
- Recommendations cite evidence (`evidence_ledger`); no fabricated baselines or requirements.
- No seeded move: E6 originates for real.
  </content>
