# AbarVa Source Intelligence Operating System Specification
## Volume 1 — Current State + Future State

> Classification: Board-Grade, Confidential · Status: Architecture of Record (Draft for Advisory Review) · 2026-06-19
> Grounded against branch `codex/corpus-wave-24`. Review verdict: **board-ready**.

## Front Matter

**AbarVa Source Intelligence Operating System Specification — Volume 1: Current State + Future State**
Classification: Board-Grade, Confidential. Status: Architecture of Record (Draft for Advisory Review).
Authoring authority: a combined transformation-architecture voice — McKinsey (tech strategy), Kearney (strategic sourcing), Bain (results delivery), Gartner (analyst rigor), an enterprise SaaS CPO, an enterprise AI architect, and a procurement transformation executive.

This specification argues one thesis: **Source must evolve from a document generator into a Sourcing Intelligence Operating System.** Today the live pipeline runs `Event → Context Binder → Prompt Registry → Claude → Deliverable` (`src/lib/source/agent-generation/context-binder.ts`, `prompt-registry.ts`, `server.ts`). The target inserts reasoning between context and output — `Context → Analysis → Recommendation → Deliverable` — so that vendor rankings, negotiation strategies, and executive decisions become the product, and documents become artifacts of that reasoning. The grounded-answer seam already exists (`src/lib/source/source-answer-engine.ts`); the work is to make it the spine, not a side path.

### Intended Audience & Mandate

| Audience | Decision this document must enable |
|---|---|
| Founder | Commit to the OS thesis and the seven-phase sequencing |
| Product Leadership | Prioritize the reasoning spine over deliverable breadth |
| AI Architecture | Adopt the Reasoning Envelope as the canonical output contract |
| Engineering | Locate every change at a named file/seam, not a greenfield |
| Investors | Distinguish defensible IP (reasoning, governance) from commodity generation |
| CIO Advisory Board | Validate that governance and refusal are first-class, not retrofitted |

### How to Read This Document

Three reading paths. **Executive (30 min):** Volume 1, Chapter 1 (Executive Summary) plus Volume 1, Chapter 4 (Future State). **Architecture:** Volumes 2 and 3 in order. **Build:** Volume 3, Chapter 15 (Deliverable Architecture) plus Volume 4 (Roadmap). Conventions: maturity is scored 1–5; stages are `S0`–`S7`; deliverables are `d01`–`d33`; every current-state claim cites a real repo path, tagged **SHIPPED / PARTIAL / DORMANT / ABSENT**.

### Document Map

```
VOL 1  Current State + Future State
  Ch1 Executive Summary ........ thesis, honest maturity snapshot, five gaps, path
  Ch2 Current State Assessment . file-grounded scorecard across 11 stages
  Ch3 Elite Sourcing Operators . how McKinsey/Bain/Kearney/Gartner reason
  Ch4 Future State Vision ....... OS definition + 6 philosophies + target architecture
VOL 2  Source Intelligence Engine
  Ch5 Reasoning Engine ......... 4-step pipeline, Reasoning Envelope, observability
  Ch6 Vendor Evaluation Engine . weighted multi-rater scoring, evidence-anchored
  Ch7 BAFO Intelligence Engine . leverage/EV models, pricing normalization fuel
  Ch8 Selection Intelligence ... risk-adjusted ranking, board packet, approvals
VOL 3  Enterprise Architecture
  Ch9  Contract Intelligence ... redline, SLA/liability verification
  Ch10 Transition Intelligence . readiness scoring, KT tracking
  Ch11 Market Intelligence ..... vendor profiles, benchmarks, semantic retrieval
  Ch12 Agent Architecture ...... one-front-agent doctrine, specialist registry
  Ch13 Data Architecture ....... reasoning entities, layer separation, lineage
  Ch14 UX Architecture ......... workbenches + cross-surface reasoning trace
  Ch15 Deliverable Architecture  the d01–d33 contract, export/quality gates
VOL 4  Implementation Roadmap
  Ch16 Seven-Phase Delivery .... sequencing, per-phase scope, metrics, governance
```

### Glossary & Canonical Vocabulary

| Term | Meaning |
|---|---|
| Sourcing Intelligence OS | System that reasons to recommendations and emits documents as outputs of that reasoning |
| Stage `S0`–`S7` | Lifecycle from intake to activation, per the canonical stage-pack filenames (`S0_intake`…`S7_activate`, so `S2`=shortlist, `S5`=BAFO); `src/lib/source/stage-packs/`. Known source-side labeling inconsistency: the UI `source-shape-resolver.ts` uses divergent labels (`S3`=Shortlist, `S6`=Initial Bid, `S7`=BAFO). The stage-pack scheme is this spec's canonical numbering. |
| Deliverable `dNN` | One of 33 canonical artifacts (`d01`–`d33`); `canonical-specs/artifact-specs.ts` |
| Archetype | Event shape — AMS, ERP-SI, AI-data-platform, renewal. Lives today as a plain `archetype: string` field on the event (`src/lib/source/types.ts:245`), `SourceRigorLevel = standard\|enhanced\|strategic` (`types.ts:3`), and `classifySourcingEvent()` in `classifier/category-classifier.ts`. The classifier is imported and invoked by `source-answer-engine.ts` and by handoff fixtures — but that engine is itself DORMANT (no live generate-route call-site), so the classifier runs only inside the dormant engine and tests, never in the live deliverable-generation pipeline (its only live entry point is the read-only nexus/ask stub responder). The full two-axis archetype × estate Source Event Archetype Framework is built but DORMANT. (Note: `source-shape-resolver.ts` is the UI WorkingPaneShapeResolver for the source-detail surface, not an archetype resolver.) |
| Estate | The second resolver axis (the enterprise context the event sits in) |
| Evidence Readiness Ramp | Promotion-only states: Not Requested → Loaded → Parsed → Available → Usable Evidence |
| Gate | Stage-transition criterion; severity hard/soft/informational; `canonical-specs/gate-criteria.ts` |
| BAFO | Best And Final Offer negotiation round; `bafo-negotiation.ts` (PARTIAL, fixture-bound) |
| Sentinel | The single front agent for Source; specialists are function-named behind it |
| Nexus / Atlas / Steward | Command, value/tower, and governance voices in the briefing |
| Confidence Band | Calibrated, multi-factor confidence on a claim (replacing today's binary heuristic) |
| Canvas Substrate | Per-event mutable state (artifact/gate/evidence rows); `canvas-substrate/` |
| Context Binder | Assembles `SourceGenerationContext` (SHIPPED) |
| Prompt Registry | Versioned per-artifact templates — only `d01`, `d05`, `d09` live |
| Reasoning Envelope | Future canonical output: claims, evidence, assumptions, confidence, caveats, decision trace |
| Disclosure Flag | Legal-privilege classification value object — marks content as legal-privileged (attorney-client, work-product) and inherits the flag to downstream derived artifacts as an artifact moves Intelligence → Move → Source → Tower; `disclosure-flag/` (SHIPPED). It is **not** an evidence-insufficiency refusal mechanism. |
| Governed Insufficiency / Refusal | Future evidence-or-refuse posture — declining to recommend when evidence is below the stage threshold. ABSENT (unbuilt); the live grounded-answer path is `source-answer-engine.ts`, and a refusal/insufficiency module would be net-new and would wire into it. |

**Source-of-Truth Statement.** Maturity scores derive from the grounding audit and verified repo paths; where future state extends today's code, the controlling file is named.

---

## Executive Summary

### The Thesis: From Document Generator to Sourcing Intelligence Operating System

AbarVa Source today is, in architectural truth, a **governed document generator**. An event is created; a context binder (`src/lib/source/agent-generation/context-binder.ts`) assembles tenant identity, event metadata, upstream artifact bodies, gate criteria and evidence states into a `SourceGenerationContext`; a prompt registry (`src/lib/source/agent-generation/prompt-registry.ts`) selects one of three versioned templates; Claude Sonnet renders markdown; and the body plus generation metadata is persisted. The pipeline is real, it runs in production, and it produces clean deliverables. But it reasons about nothing. The model receives bound context and returns prose in a single hop. There is no layer in between that asks *which vendor should we pick, on what evidence, at what confidence, and what would change the answer.*

This specification argues that Source must become a **Sourcing Intelligence Operating System** — a system that ingests events and evidence, reasons to **recommendations** (vendor rankings, negotiation strategies, executive award decisions), and emits documents as the *artifacts of that reasoning rather than its substitute*. The distinction is not cosmetic. A document generator answers "write me an RFP." An operating system answers "we should shortlist these three vendors, negotiate these four levers worth $4.2M at 70% confidence, and award to Vendor B subject to a SOC-2 holdback — here is the evidence chain and here are the documents that express it." The grounded-answer seam for this already exists in skeleton form at `src/lib/source/source-answer-engine.ts`; the work of this program is to make it the spine, not a side path.

This is the right moment to make the turn. The specification, governance, and stage machinery are already mature — what is missing is the reasoning layer that the entire mature scaffold was built to carry. We are not rebuilding the house; we are installing the brain the house was framed for.

### What Exists Today — Honest Maturity Snapshot

The defining tension of the current state is the gap between **specification maturity** (high) and **runtime maturity** (low). The system is exceptionally well-specified and only thinly executed.

| Layer | Maturity (1–5) | Reality | Controlling evidence |
|---|---|---|---|
| Stage machinery S0–S7 | **5** | All 8 stage packs fully defined with outcomes, gates, anti-patterns | `src/lib/source/stage-packs/S0_intake.ts` … `S7_activate.ts` |
| Gate-criteria catalog | **5** | 38 gate criteria, hard/soft/informational severity, owner roles | `src/lib/source/canonical-specs/gate-criteria.ts` |
| Canonical artifact specs | **4–5** | All **33** of d01–d33 specified (code, family, tier, gate-defining) | `src/lib/source/canonical-specs/artifact-specs.ts` |
| Export / render pipeline | **4** | Renderers for 15+ artifact kinds across docx/xlsx/html | `src/lib/source/exports/dispatch.ts` |
| Artifact generation | **3** | Only **3 of 33** templates live (d01, d05, d09) | `prompt-registry.ts` (verified: d01_strategy_memo, d05_scope_memo, d09_rfp_pack only) |
| Evaluation / BAFO / selection | **2** | Builders exist but run over **vendor-a/b/c fixtures**, no live call-site | `src/lib/source/award-decision-view.ts`, `bafo-negotiation.ts` |
| Specialist layer | **1–2** | 7 specialists exist as **test files only**, no runtime wiring | `src/lib/source/__tests__/specialists/` |
| Disclosure-flag (privilege classifier) | **5** | **SHIPPED** legal-privilege classification value object (attorney-client / work-product), inherits the flag to downstream derived artifacts across Intelligence → Move → Source → Tower; pure constructors/transforms, no I/O | `src/lib/source/disclosure-flag/` |
| Evidence-or-refuse / insufficiency posture | **0** | **Does not exist** — a governed decline-to-advance-below-threshold module is net-new and would wire into `source-answer-engine.ts` | — |
| Reasoning / analysis layer | **0** | **Does not exist** between context and generation | — |

The headline reads bluntly: **we have specified a sourcing operating system and built a three-template document generator on top of it.** Thirty of thirty-three deliverables have specs but no generation logic. The commercial intelligence (negotiation, pricing normalization, award) is *modeled* but not *operational* — it computes confidently over hardcoded vendors A, B and C and has no path to real proposals. This is not a criticism of the work done; the scaffold is genuinely excellent and rare. It is a precise diagnosis of where the remaining value lives.

### The Five Load-Bearing Gaps

Five gaps gate everything else. Each is named to a real file and to its downstream business consequence. Closing them in sequence is the program.

1. **No reasoning/analysis layer.** The flow is `Event → ContextBinder → PromptRegistry → Claude → markdown`. There is no stage that produces structured analysis (claims, tested assumptions, confidence, caveats) before text is written. *Consequence:* every deliverable is an unaudited assertion; a CIO cannot see why a recommendation holds, and we cannot defend an award in a board room. The target inserts **Analysis** and **Recommendation** stages at the `server.ts` / generate-route seam (`src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`).

2. **30 of 33 deliverables unbuilt.** Only d01/d05/d09 have prompts; the other 30 are template stubs in `src/content/source-templates/`. *Consequence:* the value-bearing stages — evaluation (d16–d18), pricing (d19–d21), BAFO (d22–d23), executive decision (d24–d26) — produce nothing automatically. The single most load-bearing missing artifact is **d19a, the pricing-template generator**: without it vendors cannot be sent a structured template, so submissions, normalization, comparison and the trap log are all blocked.

3. **Specialists are test-only.** `evidence-gap-detector`, `executive-decision-brief-writer`, `minimum-data-request-generator`, `next-action-recommender`, `value-at-stake-summarizer`, `workflow-blocker-detector`, `context-validation-checker` exist as fixtures with no runtime call-site; the orchestrator's builders are deterministic and never call a model. *Consequence:* the "intelligence" surfaced to users is canned. The Sentinel front (`src/lib/source/sentinel-source-orchestrator.ts`) is a real frame around dormant logic.

4. **Evaluation/BAFO/pricing run on fixtures, not live vendor data.** Every commercial builder is `deterministicSeed`-driven over vendor-a/b/c. *Consequence:* no real ranking, no real negotiation leverage, no real savings — the commercial core looks operational in a demo and is inert in a pilot. Pricing normalization (`src/lib/source/pricing-normalization.ts`) runs correctly over an empty proposal set.

5. **Gates are declarative, not enforced.** The 38-gate-criteria catalog and `src/lib/source/source-governance-enforcement.ts` can *evaluate* readiness, but the evaluators are never invoked on mutations; a user can advance a stage with fragmentary evidence, and no evidence-or-refuse mechanism declines that advance. *Consequence:* governance is advisory theater, not control — fatal for enterprise trust. (The shipped `disclosure-flag/` module is a legal-privilege *classifier*, not an evidence-insufficiency refusal posture; the governed decline-to-advance capability is net-new and unbuilt.)

### Where the Value Is — Business Case in One Page

The prize is not "more documents faster." It is **decision quality, defensibility, and captured leverage** across a high-stakes process where the average IT sourcing event governs tens of millions in multi-year spend.

| Value lever | What unlocks it | Plain-English prize |
|---|---|---|
| **Cycle-time compression** | Reasoning spine + 33 live deliverables | Weeks of analyst-hours per event collapse to hours; an event that took a quarter to shape moves in days |
| **Defensible vendor rankings** | Evaluation engine with evidence-anchored, calibrated scores | Every score traces to evidence; deviation flags survive audit; no "trust me" rankings |
| **Captured negotiation leverage** | BAFO engine over live normalized pricing (`bafo-negotiation-model.ts`) | Expected-value modeling of concession levers — the single largest hard-dollar lever; 1–3 points of contract value (illustrative range) routinely left on the table today |
| **Executive decision confidence** | Selection engine + reasoning envelope in `executive-decision-summary.ts` | Board-grade award recommendations with explicit confidence bands, options, and dissent capture |
| **Renewal / value capture** | Portfolio reasoning + `value-ledger.ts`, `commercial-risk-detection.ts` | Renewal windows and value drift detected before leverage evaporates |
| **Governance & auditability** | Enforced gates + a net-new evidence-or-refuse posture (wired into `source-answer-engine.ts`) | The system refuses to advance on insufficient evidence — a *feature* that lets a regulated enterprise adopt AI in sourcing at all. (Privilege classification is separately handled by the shipped `disclosure-flag/` module) |

The economic logic is concentrated: the BAFO and selection stages are where money is made or lost, and they are precisely the stages running on fixtures today. The program's ROI curve is therefore back-loaded toward Phases 3–4, but those phases are *only buildable* once the reasoning spine (Phase 1) and evaluation engine (Phase 2) exist — which is why sequencing is itself a value decision.

### Target Architecture at a Glance

The future state separates three concerns the current code conflates, and inserts the reasoning layer the document generator lacks:

```
  ┌──────────────┐   ┌───────────────┐   ┌────────────────────────────┐
  │ CONTEXT LAYER│   │ KNOWLEDGE LAYER│   │      REASONING LAYER        │
  │ per-event/   │   │ market intel,  │   │  Context → Analysis →       │
  │ tenant state │──▶│ vendor profiles│──▶│  Recommendation → Deliverable│
  │ (canvas      │   │ benchmarks,    │   │                             │
  │  substrate)  │   │ patterns       │   │  emits REASONING ENVELOPE   │
  └──────────────┘   └───────────────┘   └──────────────┬──────────────┘
        agent-context.ts   pattern-manifest.ts          │
                                                         ▼
        ┌────────────────────────────────────────────────────────────┐
        │  ENGINES:  Evaluation │ BAFO │ Selection │ Contract │ Transit│
        └────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────▼────────────────────────────────────┐
        │  AGENTS:  Sentinel (front) · Atlas · Steward · engine agents  │
        └─────────────────────────┬────────────────────────────────────┘
                                  ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  DELIVERABLES d01–d33  →  UX SURFACES (workbench / cockpit)     │
        └───────────────────────────────────────────────────────────────┘
```

The keystone is the **Reasoning Envelope** — a standardized structured output every reasoning step emits: claims, supporting evidence with citations, assumptions tested and rejected, a calibrated confidence band, caveats, and a decision trace. It extends today's thin `body_generation_metadata` and the `agent-mission-report.ts` shape into the canonical contract that UI, API, and exports all consume. Documents become *renderings of an envelope*. This is the architectural expression of the thesis: reasoning is the product; the document is the receipt.

Governance runs as a real control, not advice. **Steward** enforces gates that block; a **net-new evidence-or-refuse posture** is built and wired into the live grounded-answer path (`src/lib/source/source-answer-engine.ts`) — the system declines to recommend or advance when evidence is below the stage threshold, and says why. (This is distinct from the already-shipped **disclosure-flag** module at `src/lib/source/disclosure-flag/`, which is a legal-privilege *classifier* — attorney-client / work-product — that inherits the privilege flag to downstream derived artifacts across Intelligence → Move → Source → Tower; it is not an evidence-insufficiency refusal mechanism.) The dormant **Source Event Archetype Framework** (4 archetypes — AMS, ERP-SI, AI-data-platform, renewal — with a two-axis archetype × estate resolver, a 10-method library, a promotion-only evidence-readiness ladder, and a governed grounded-answer path) is activated to drive *which* reasoning frameworks and evidence thresholds apply per event, so an AMS outsourcing reasons differently from an ERP-SI build. Today the archetype concept lives as a plain `archetype` field on the event (`src/lib/source/types.ts`), a `SourceRigorLevel` (standard/enhanced/strategic), and `classifySourcingEvent()` in `classifier/category-classifier.ts` — which `source-answer-engine.ts` imports and invokes, but only inside that dormant engine (and in tests/fixtures), never in the live deliverable-generation pipeline (its only live entry point is the read-only nexus/ask stub responder).

### The Path — Seven Phases at a Glance

The sequencing logic is strict and dependency-driven: **the reasoning spine ships first because every downstream capability consumes the Reasoning Envelope**; evaluation precedes BAFO (you cannot negotiate what you have not scored); BAFO precedes selection (you cannot award what you have not negotiated); contract and transition follow selection; the market-intelligence platform comes last because it calibrates a reasoning system that must first exist.

| Phase | Focus | Why here | Anchor seam |
|---|---|---|---|
| **1** | Prompt + Reasoning upgrade | Inserts Analysis/Recommendation stages, the Reasoning Envelope, archetype activation, grounded refusal, observability — **everything else depends on it** | `agent-generation/server.ts`, `classifier/category-classifier.ts`, `source-answer-engine.ts` |
| **2** | Evaluation engine | Multi-rater weighted scoring, consensus, deviation flagging, evidence-anchored scores (d16–d18) — first live commercial reasoning | `scorecard.ts`, d16 template |
| **3** | BAFO engine | **d19a pricing template → live normalization → leverage/EV/scenario models → d20/d22/d23** — the highest hard-dollar lever | `bafo-negotiation.ts`, `pricing-normalization.ts`, `pricing-submissions/dao.ts` |
| **4** | Selection engine | Live award derivation, risk adjustment, recommendation confidence, board packet (d24–d27), approval/waiver workflow, PDF path | `award-decision-view.ts`, `source-governance-enforcement.ts` |
| **5** | Contract intelligence | Redline/clause-gap, SLA/liability verification, d28, Contract Center | `artifact-registry/upload-contract.ts` |
| **6** | Transition intelligence | Quantitative readiness scoring, KT tracking, risk monitoring, d29–d33, value handoff | `transition-readiness-view.ts`, `value-ledger.ts` |
| **7** | Full platform | Market intelligence layer, semantic pattern retrieval, portfolio reasoning, renewal automation, full multi-agent coordination | `pattern-manifest.ts`, `commercial-risk-detection.ts` |

Each phase is gated by a hard proof-point: a **live run on the ACA private database against real vendor data**, not a fixture demonstration — consistent with the program's release-control discipline (lanes, release records, live-proof requirement). A capability is not "done" because a builder returns the right shape; it is done when it has reasoned correctly over a real event end-to-end and the Steward gate has held.

### What This Document Delivers

The reader leaves Chapter 1 with the thesis and the shape; the rest of the specification makes it buildable. **Volume 1** completes the current-state assessment (Ch. 2), encodes how elite sourcing firms actually reason (Ch. 3), and defines the future-state philosophy — recommendation, confidence, risk, governance (Ch. 4). **Volume 2** specifies the four engines that carry the reasoning: the Reasoning Engine and its envelope (Ch. 5), Vendor Evaluation (Ch. 6), BAFO Intelligence (Ch. 7), Selection Intelligence (Ch. 8). **Volume 3** specifies the enterprise architecture — contract, transition, and market intelligence layers, the agent architecture, the data model that adds reasoning entities, the UX that surfaces reasoning trace, and the full d01–d33 deliverable architecture. **Volume 4** is the seven-phase delivery plan with metrics, risk register, and governance.

The through-line never changes: **Source stops generating documents and starts making decisions.** The documents it produces become the defensible, auditable expression of reasoning a CIO can take to a board — which is the only version of AI in strategic sourcing that an enterprise can actually trust, adopt, and stake a $50M decision on.

---

## Chapter 2 — Current State Assessment

This chapter is the empirical foundation of the entire specification. Every recommendation in Volumes 2 through 4 is calibrated against the baseline established here. We have read the code. We do not describe what the roadmap intends Source to be; we describe what it provably is today, file by file, and we assign a maturity score to each sourcing capability that an enterprise CIO advisory board would recognize as a discrete competence.

The central finding can be stated in one sentence: **Source has the specification maturity of a finished product and the runtime maturity of an early prototype, and the gap between those two numbers is the thesis of this entire document.** The stage doctrine, the artifact catalog, the gate criteria, the evidence ramp, and the agent-voice contracts are all defined to a standard a Big-Three consulting partner would sign. But the engine that would *reason* over that doctrine — to rank vendors, compute leverage, derive a recommendation, and refuse on insufficient evidence — is either absent, dormant, or fixture-bound. Source today is a document generator with an exceptionally well-architected blueprint for the intelligence operating system it is not yet.

### 2.1 Assessment Method & Maturity Scale

We score each capability on a 1-to-5 maturity scale and tag it with one of four runtime states. The two axes are deliberately distinct, because the most important diagnostic insight in this chapter is precisely where they diverge.

**Maturity scale (1–5):**

| Score | Meaning | Operational test |
|---|---|---|
| 1 | Absent / placeholder | No structured logic; a stub, a directory, or a type alias only. |
| 2 | Modeled | Types and a deterministic builder exist, but run on fixtures with no live call-site. |
| 3 | Partial / wired | Live in at least one path, but narrow coverage, shallow logic, or seed-bound inputs. |
| 4 | Substantially built | Specified to standard and operational, with material gaps in enforcement or coverage. |
| 5 | Mature | Defined to standard, enforced at runtime, and live-proven on real tenant data. |

**Runtime-state taxonomy:**

- **SHIPPED** — executes on a live request path against real per-event state.
- **PARTIAL** — executes, but on narrow coverage or seed/fixture inputs.
- **DORMANT** — full implementation or rich types exist but no runtime call-site invokes them.
- **ABSENT** — no implementation; specification or directory only.

The scoring evidence is the repository itself. Where two internal audits disagreed (for example, on whether `src/lib/source/disclosure-flag/` was empty), we resolved the discrepancy by reading the files directly: the directory in fact contains `disclosure-flag.ts` (~6.4 KB), `types.ts`, `serde.ts`, and a test suite — and, on reading them, disclosure-flag turns out to be a **SHIPPED legal-privilege classifier**, not the evidence-refusal mechanism an earlier audit assumed. Settling that taxonomy correctly (see §2.8) is itself a meaningful correction. This is the standard we hold throughout: claims are tied to files, and files are read when the stakes warrant it.

The eleven sourcing capability columns map to the lifecycle a sourcing partner would recognize and to the stage packs `S0_intake` through `S7_activate` and deliverable codes d01–d33: **origination, strategy, value-target, scope, RFP, evaluation, negotiation (BAFO), selection, contracting, transition, and value**. One caveat on the stage codes: the stage-pack filenames are this spec's canonical scheme (so `S2`=shortlist, `S5`=bafo), but the UI `source-shape-resolver.ts` carries divergent labels (S3=Shortlist, S6=Initial Bid, S7=BAFO). We treat the stage-pack `S0`–`S7` numbering as canonical throughout and flag the UI labeling as a known source-side inconsistency to reconcile, not as a competing scheme.

### 2.2 The Reasoning & Pipeline Core (Today)

The live generation pipeline is the spine of the current product, and it is worth tracing precisely, because its shape *is* the problem the future state must solve.

```
  POST /api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts
        │
        ▼
  buildSourceGenerationContext()          ← context-binder.ts
   • event metadata (source_events)
   • artifact states (canvas-substrate/queries.ts)
   • gate criteria + evidence states
   • upstream artifact bodies (collectUpstreamBodies)
        │
        ▼
  PromptRegistry[artifactCode]            ← prompt-registry.ts
   • systemPrompt (Sentinel voice)
   • upstreamRequired / upstreamOptional
   • buildUserMessage(context)
   • version, maxTokens
        │
        ▼
  Claude (Sonnet 4-6, ≤4–5k tokens)       ← server.ts
        │
        ▼
  Markdown body + generation metadata
   → source_event_artifact_states
   → body_generation_metadata
```

Read against the target pipeline — `Event → Context → **Analysis → Recommendation** → Deliverable` — the diagnosis writes itself. There is **no Analysis stage and no Recommendation stage.** Bound context flows directly into a system prompt, and Claude returns markdown that is persisted verbatim. The model is doing the reasoning *inside* a single generation call, opaquely, with no structured intermediate representation of what evidence mattered, what assumptions were tested, what alternatives were considered, or what the confidence bounds are.

The prompt registry confirms the narrowness empirically. `src/lib/source/agent-generation/prompt-registry.ts` ships exactly three templates — `d01_strategy_memo` (version 1), `d05_scope_memo` (version 1, `upstreamRequired: ['d01_strategy_memo']`), and `d09_rfp_pack` (version 2, `upstreamRequired: ['d01_strategy_memo', 'd05_scope_memo']`, maxTokens 5000). This is the Strategy→Scope→RFP chain and nothing more. The registry's own comment is candid: *"Slice 1 ships templates for d01, d05, d09 — the minimum chain."* Notably, the d09 system prompt already references "the empty pricing template d19a" as a separate artifact the RFP body points to — confirming that the most load-bearing missing deliverable (d19a, the vendor-fill pricing template) is *known* and *referenced* but *unbuilt*.

The upstream binding deserves a hard note. `collectUpstreamBodies` includes upstream artifact text "if it exists" — the d05 and d09 prompts fall back to literal strings like `'(NOT YET AUTHORED — DO NOT FABRICATE; surface the gap in the draft)'`. This is honest and well-designed against fabrication, but it is a *flat include-if-present* mechanism: there is no validation that a required upstream artifact has reached a sufficient tier, no precedence or quality scoring, and no error when d09 is generated while d05 is still a stub. The pipeline will proceed on thin air and rely on the model to confess.

**Maturity: 3 (PARTIAL).** Live, versioned, audited, fabrication-aware — but a single-stage LLM call with no reasoning layer and 3-of-33 coverage. This is the most important score in the chapter because every downstream engine inherits this seam.

### 2.3 Stage Machinery S0–S7 — Strong Spec, Weak Enforcement

The stage layer is where Source's specification maturity is most impressive and its enforcement gap most acute. All eight stage packs exist as full TypeScript modules — `S0_intake.ts`, `S1_market_shape.ts`, `S2_shortlist.ts`, `S3_rfp.ts`, `S4_demo_poc.ts`, `S5_bafo.ts`, `S6_contract.ts`, `S7_activate.ts` — each carrying the full `StagePack` doctrine: outcome, definition-of-done, right-questions (open/converge/close), anti-patterns, coaching arc, and dependencies. The canonical specs in `src/lib/source/canonical-specs/` define 38 gate criteria (`gate-criteria.ts` — 38 distinct `GATE-` ids) with severity (hard/soft/informational), `linkedArtifactCodes`, and `ownerRole`, plus ~21 evidence requirements (`evidence-requirements.ts`) mapping each evidence source to a minimum readiness state on the 7-step ramp (Not Requested → Loaded → Parsed → Available → Usable Evidence, plus Stale and Low Confidence failure modes).

`src/lib/source/source-governance-enforcement.ts` even implements the *logic* — `evaluateCriterionMetReadiness()` and `evaluateStagePromotionReadiness()` — that would verify artifact status, evidence tier, and approval reason before a promotion. The machinery to enforce gates exists and is tested.

And yet it is never called on a mutation. The decisive findings from the audit:

- **Gates are advisory, not mandatory.** Gate criteria are scaffolded at event creation by `canvas-substrate/scaffold.ts`, but never *dynamically re-evaluated* during operations. A user can advance a stage without meeting criteria, and the hard/soft distinction is semantic only — both block (or fail to block) identically through the same path.
- **Validation runners are orphaned utilities.** `agent-validation-runner.ts` and `workflow-validation-runner.ts` compute violations but are never hooked into the request path. There is no mutation-guard pattern; promoting a stage or marking a criterion met does not trigger a governance check.
- **Evidence is never bootstrapped.** `scaffold.ts` seeds artifact and gate rows but *not* evidence rows. The `SourceEventEvidence` table is empty at intake, so gate logic that would read evidence state has nothing to read.
- **Stage doctrine is narrative-only.** `rightQuestions`, `antiPatterns`, and `coachingArc` are specifications for human Sentinel operators; the briefing engine does not consume them, and stage-voice depth is configured but underused.

**Maturity: 4 at definition, 2 at enforcement.** We record the column score as **4 (PARTIAL)** to reflect that the spec is genuinely production-grade, but we flag the enforcement gap as one of the five load-bearing failures: a gate that does not gate is documentation, not governance.

### 2.4 Capability Scorecard Across the Eleven Stages

This is the centerpiece of the chapter — the quantified current-state baseline. Each row is scored on maturity, tagged with runtime state, anchored to the controlling file(s) and the canonical stage/deliverable codes, and given a one-line reason grounded in the audit.

| # | Capability | Stage | Maturity | State | Controlling file(s) | One-line reason |
|---|---|---|---|---|---|---|
| 1 | **Origination / Intake** | S0 | **2** | PARTIAL | `stage-packs/S0_intake.ts`, `api/v1/source/events/route.ts`, `classifier/category-classifier.ts` | Event CRUD ships, but intake is a 1-page form stub; no intake wizard, no archetype auto-inference on the live path, evidence rows never created. |
| 2 | **Strategy** | S1 | **3** | PARTIAL | `prompt-registry.ts` (d01), `content/source-templates/strategy/d01_strategy_memo.md` | d01 strategy memo generates live, but d02 value-target and d03 archetype-decision are unbuilt template stubs. |
| 3 | **Value-Target** | S1 | **2** | PARTIAL | `value-ledger.ts`, `value-line-types.ts`, `should-cost/should-cost-model.ts` | Value ledger is point-in-time JSON (not time-series), confidence ternary; should-cost is wired into the dormant `source-answer-engine`, not the live generate-route pipeline, so it is never reasoned with mid-event on a live request. |
| 4 | **Scope** | S2 | **3** | PARTIAL | `prompt-registry.ts` (d05), `content/source-templates/scope/d04..d08` | d05 scope memo generates live; d04 app-inventory, d06 exclusion log, d07 ticket synth, d08 premortem are stubs. |
| 5 | **RFP** | S3 | **3** | PARTIAL | `prompt-registry.ts` (d09 v2), `stage-packs/S3_rfp.ts` | d09 RFP pack is the flagship live generator; d10 RFI summary, d11 response checklist, d12 shortlist unbuilt. |
| 6 | **Evaluation** | S4 | **2** | PARTIAL | `scorecard.ts`, `award-decision-view.ts`, `content/source-templates/evaluation/d16..d18` | Scorecard is a display type with no scoring engine; no multi-rater aggregation, no deviation flagging, no d16 generator. |
| 7 | **Negotiation (BAFO)** | S5 | **3** | PARTIAL | `bafo-negotiation.ts`, `bafo-negotiation-model.ts`, `bafo-scenario-compare-view.ts` | Rich deterministic builders over vendor-a/b/c fixtures; levers seeded not computed; no live pricing input; no d22/d23 generation. |
| 8 | **Selection** | S5→S6 | **2** | PARTIAL | `award-decision-view.ts`, `vendor-selection-readiness.ts`, `executive-decision-summary.ts` | Award scores hardcoded (`deterministicSeed: true`); readiness posture derives but does not enforce; binary confidence heuristic. |
| 9 | **Contracting** | S6 | **2** | PARTIAL | `artifact-registry/upload-contract.ts`, `exports/renderers/ai-clause-gap.ts` | Upload-contract metadata extractor is a ~3.4 KB stub; clause-gap renderer exists but no reasoning behind it; d28 unbuilt. |
| 10 | **Transition** | S7 | **2** | PARTIAL | `transition-readiness-view.ts`, `vendor-selection-readiness.ts` (`resolveTransitionRisk`) | Transition risk is binary, keyword-matched from blocker text; no KT/parallel-run/cutover model; d29–d31 stubs. |
| 11 | **Value Realization** | S7 | **2** | PARTIAL | `value-ledger.ts`, `financial-display.ts` | Snapshot only, no variance tracking (projected vs realized), no realized-value capture endpoint; d32/d33 stubs. |

**Cross-cutting capabilities (scored separately because they span all stages):**

| Capability | Maturity | State | Controlling file(s) | Reason |
|---|---|---|---|---|
| Stage doctrine & gate spec | **4** | PARTIAL | `stage-packs/*`, `canonical-specs/gate-criteria.ts` | Specified to standard; gates advisory not enforced. |
| Artifact spec catalog (d01–d33) | **4** | SHIPPED | `canonical-specs/artifact-specs.ts` | All 33 specified with family/tier/gate-defining; only 3 generate. |
| Canvas substrate persistence | **4** | SHIPPED | `canvas-substrate/{types,queries,scaffold}.ts`, `migrations/2026050723…sql` | Three-table per-event state, RLS-scoped; evidence rows not bootstrapped. |
| Exports & renderers | **4** | PARTIAL | `exports/dispatch.ts`, `format-router.ts`, 40+ renderers | Renderers production-grade; payloads disconnected from live data; PDF render route (`@react-pdf`) returns 200 but is wired only for a subset of artifact codes (d05/d09/d24/d27), 404 for the rest. |
| Artifact registry & upload | **3** | SHIPPED | `artifact-registry/index.ts`, `text-parser.ts` | Upload/parse/mime/SHA-256 live; no semantic chunking, no live evidence linkage, embedding/graph statuses inert. |
| Multi-agent briefing | **3–4** | DORMANT | `sentinel-source-orchestrator.ts`, `multi-agent-briefing.ts` | 4 voices + 7 specialists run deterministically; no model calls, no persistence, transient. |
| Source Event Archetype Framework | **2** | DORMANT | `types.ts` (`archetype`, `SourceRigorLevel`), `classifier/category-classifier.ts` (`classifySourcingEvent`) | `classifySourcingEvent()` is imported and invoked by `source-answer-engine.ts` and handoff fixtures — but that engine is itself dormant, so the classifier runs only inside the dormant engine and tests, never in the live deliverable-generation pipeline (its only live entry point is the read-only nexus/ask stub responder); archetype stored but drives nothing live. |
| Disclosure-flag (legal-privilege classifier) | **3** | SHIPPED | `disclosure-flag/disclosure-flag.ts`, `types.ts`, `serde.ts` | Privilege-classification value object (attorney-client, work-product) with downstream inheritance; pure constructors/transforms, no I/O. **Not** an evidence-refusal mechanism. |
| Evidence-refusal / governed-insufficiency posture | **1** | ABSENT | (net-new; would wire into `source-answer-engine.ts`) | No module declines to recommend or advance when evidence is below the stage threshold; the capability is unbuilt, not merely dormant. |
| Source answer engine | **2** | DORMANT | `source-answer-engine.ts` | Mode detection + hardcoded playbooks + Slice-1.x modules exist, but the engine has no live generate-route call-site; it runs only in tests/fixtures. |
| Governance enforcement | **4** | DORMANT | `source-governance-enforcement.ts` | Evaluation logic complete; never triggered on a mutation. |

The pattern is unmistakable when read down the columns: **specification and persistence layers cluster at 4; reasoning, evaluation, negotiation-as-computation, and governance-as-enforcement cluster at 2–3.** No single capability is mature (5) because none is both enforced at runtime and live-proven on real tenant data. The weighted center of gravity sits at roughly **2.6** — a capable, well-specified document factory, not yet a reasoning system.

### 2.5 Deliverable Coverage — 3 of 33 Live

The 33 canonical deliverables exist as files. We verified this directly: `find src/content/source-templates -name "d*.md"` returns exactly 33. But existence as a markdown stub is not the same as a generation capability. The table below maps each family to its true build state.

| Family | Codes | Stage | Generation state | Note |
|---|---|---|---|---|
| Strategy | d01–d03 | S1 | d01 **live**; d02, d03 stubs | d01 in prompt-registry v1 |
| Scope | d04–d08 | S2 | d05 **live**; d04, d06, d07, d08 stubs | d05 in prompt-registry v1 |
| RFP | d09–d12 | S3 | d09 **live**; d10, d11, d12 stubs | d09 in prompt-registry v2 |
| Responses | d13–d15 | S4 | all stubs | No vendor-response ingestion-to-completeness reasoning |
| Evaluation | d16–d18 | S4 | all stubs | d16 scorecard has renderer + payload but **no generator** |
| Pricing | d19–d21 | S5 | all stubs | **d19a pricing template = the single most load-bearing gap** |
| BAFO | d22–d23 | S5 | all stubs | Renderers exist (`bafo-question-pack.ts`); no payload binding |
| Executive decision | d24–d26 | S5/S6 | all stubs | d24 hand-drafted today; no Sentinel prompt |
| Selection | d27–d28 | S6 | all stubs | Derivation views exist but not generators |
| Transition | d29–d31 | S7 | all stubs | — |
| Value | d32–d33 | S7 | all stubs | — |

**Coverage is 3/33 = 9% generated.** The renderer/export layer overstates apparent readiness: `format-router.ts` declares 17 deliverable kinds with per-format allowances, and 40+ renderers in `exports/renderers/` cover docx/xlsx/html for ~15 artifact types. But a renderer with no payload binder is a printing press with no manuscript. The audit is explicit that pricing-template and pricing-comparison payloads "do NOT bind to actual vendor submissions," scorecard payload does not wire rater submissions, and trap-log payload "returns hardcoded examples."

**The d19a verdict.** Among all 30 missing generators, the pricing-template generator (d19a) is the load-bearing one, and the d09 prompt already names it. The dependency chain is unforgiving: without d19a (the structured template vendors fill), there is no d19b (normalized submissions), therefore no d19c (comparison), therefore no d20 (trap log), therefore the entire BAFO Intelligence Engine (Chapter 7) runs on empty proposal sets. Pricing normalization (`pricing-normalization.ts`) is modeled across eight dimensions — scope, assumptions, rates, accelerators, IP, security, transition, SLAs — but "runs over empty proposal set (correct but low-signal)." The matrix is built; it has nothing to chew on. This is the highest-leverage single artifact in the system.

### 2.6 Evaluation / BAFO / Selection / Commercial — Built but Fixture-Bound

This section makes the most important *honesty* point in the chapter, and it cuts both ways. The commercial layer is **not greenfield** — a substantial body of code exists and is well-organized. But it is **not mature** — every builder is deterministic over `vendor-a/b/c` fixtures with no live call-site. The distinction between "modeled" and "operational" is the whole story.

What genuinely exists, and is non-trivial:

- **`bafo-negotiation.ts`** (~625 lines) — `buildSourceBafoNegotiationPlan()` produces vendor readiness states, negotiation questions by category (pricing/scope/evidence/governance/transition/exclusion), key issues, recommended asks, expected value impact, and blockers. This is real, structured procurement logic.
- **`bafo-scenario-compare-view.ts`** (~380 lines) — three scenarios per vendor (conservative/base/stretch) with risk level, levers, per-lever USD savings, caveats, next actions.
- **`award-decision-view.ts`** (~208 lines) — ranked vendor scorecard (commercial/technical/transition/risk/overall 0–100), decision status, strengths/weaknesses, pre-award conditions, Atlas guidance.
- **`vendor-selection-readiness.ts`** (~316 lines) — aggregates commercial signals, executive decision summary, and stage-gate readiness into a posture (`ready_for_selection_review` / `proceed_to_bafo` / `defer_pending_clarifications` / `blocked_missing_pricing` / `blocked_low_evidence` / `waiver_required`). This is the most mature commercial builder, scoring 4 on internal audit.
- **`commercial-risk-detection.ts`** (~214 lines) — eight risk-exception categories: pricing_anomaly, scope_ambiguity, governance_gap, evidence_deficit, contract_trap, transition_risk, liability_exposure, timeline_compression.
- **`commercial-mission-adapter.ts`** (~433 lines) + **`commercial-mission-queue.ts`** — map a commercial mission queue into canonical agent missions with duplicate suppression.
- **`executive-decision-summary.ts`** (~387 lines) — derives decision posture, vendor tradeoffs, evidence confidence, decision options, and recognizes `waiver_required`.

The disqualifying caveats, stated plainly:

1. **Fixtures override production.** `award-decision-view.ts` carries `deterministicSeed: true`; scores like "Vendor C technical: 88, risk: 80" are hardcoded, not calculated from d16 ratings or rater submissions. The savings in `bafo-scenario-compare-view.ts` are marked `savingQuantified: false`.
2. **No live call-site.** There is no API route or orchestrator that triggers the chain vendor-responses → evaluation → BAFO prep → award → selection. The only entry point is the briefing path, which is read-only.
3. **Confidence is heuristic.** Evidence confidence in `executive-decision-summary.ts` is a three-branch rule (low-evidence blocker → low; high risk → medium; else high), not a multi-factor score.
4. **The queue is ephemeral.** `commercial-mission-queue.ts` is in-memory; missions are enqueued but never dequeued, executed, persisted, or escalated.
5. **Waiver is recognized, not workflowed.** The posture `waiver_required` is named and a decision option is emitted, but there is no waiver-request form, registry, approval routing, or gate-variance — a blocked gate stays blocked even after a notional waiver.

**Scoring summary for this layer:** BAFO planning **3**, scenario compare **2**, award decision **2**, vendor-selection readiness **4**, commercial signals/risk **3**, mission adapter **4**, executive decision summary **4**, pricing normalization **2**, evaluation scorecard **1**, waiver workflow **1**. The headline: the *frame* is built to a 3–4 standard; the *intelligence inside the frame* sits at 1–2 because it has never touched a real vendor proposal.

### 2.7 Multi-Agent & Specialist Layer — Real Frame, Dormant Logic

`src/lib/source/sentinel-source-orchestrator.ts` (~395 lines) is a genuinely well-designed orchestration frame. `buildSentinelSourceBriefing()` runs seven embedded specialist builders, ranks them by tier (Steward=0, Sentinel=1, Nexus=2, Atlas=3) then confidence, synthesizes a primary Sentinel voice capped at ~120 words, and checks output against the Sentinel voice doctrine (`agent/voice-doctrine/sentinel.ts`: cite, mark verified/asserted/inferred, lead with the gap, no Moves language). The seven specialists are: context-validation-checker, evidence-gap-detector, next-action-recommender, minimum-data-request-generator, value-at-stake-summarizer, executive-decision-brief-writer, workflow-blocker-detector.

The dormancy is structural, not incidental:

- **No model calls.** Every specialist is a deterministic builder that patches a base briefing. There is no LLM reasoning inside any specialist.
- **Test-only implementations.** The seven specialists exist primarily as test fixtures in `src/lib/source/__tests__/specialists/` (we confirmed all seven `.test.ts` files plus `specialist-test-utils.ts`). The runtime builders are hardcoded *inside* the orchestrator; there is no registry, so a new specialist requires editing the orchestrator.
- **Transient output.** The briefing is computed per request and never persisted or routed. There is no activity log of what Nexus recommended yesterday versus today, no acknowledgment/dismissal flow, no cross-agent reasoning about contradictions or risk amplification.
- **Voice doctrine is advisory.** Violations surface in `evidenceNotes` but do not block the briefing from rendering.
- **Handoff is a string.** `handoffTarget`/`handoffRecommendation` are hardcoded strings ("Sentinel to Nexus"), not a structured state machine that could drive navigation or action tracking.

`src/lib/sentinel/orchestrator.ts` adds pattern grounding (300+ patterns, keyword/slug scoring, top-3 ranking, ~420-token Claude synthesis), but matching is keyword-based, not semantic, and pattern metadata is static.

**Maturity: 3–4 frame, 1–2 logic. Recorded as 3 (DORMANT).** The architecture is the right architecture; the bodies behind it are empty. This is load-bearing gap #3: specialists are test-only with no runtime call-site.

### 2.8 The Dormant Archetype Framework, the Privilege Classifier, and the Missing Refusal Posture

Three distinct assets are easy to conflate here, and the audit history did conflate them. We separate them cleanly because the future-state governance posture depends on getting the taxonomy right: one is dormant, one is shipped for a different purpose, and one does not exist yet.

**The Source Event Archetype Framework — DORMANT.** The archetype concept lives as a plain `archetype: string` field on the event (`src/lib/source/types.ts`), a `SourceRigorLevel = standard | enhanced | strategic` type, and `classifier/category-classifier.ts`, which exposes `classifySourcingEvent()`. That classifier *is* imported and invoked — by `source-answer-engine.ts` (import line 9, call line 316) and by the handoff fixtures. But `source-answer-engine.ts` is itself dormant, with no live generate-route call-site, so the classifier runs only inside the dormant engine and in tests/fixtures — never in the live deliverable-generation pipeline (its only live entry point is the read-only nexus/ask stub responder). No event-creation path populates the archetype from intake data on the live path, rigor is a field that drives nothing live, and the full framework — four archetypes (AMS / ERP-SI / AI-data-platform / renewal), the two-axis archetype × estate resolver, the 10-method library, the promotion-only evidence-readiness ladder, and the governed grounded-answer — is built but unwired. The promotion-only constraint (archetype chosen at intake, never changed) is enforced nowhere live. The framework is a fully-formed governance idea with no nervous system connecting it to behavior. *(Note: do not attribute archetype resolution to `source-shape-resolver.ts` — that file is the UI `WorkingPaneShapeResolver` for the source-detail surface and is unrelated to archetype resolution.)*

**Disclosure-flag — SHIPPED, but it is a privilege classifier, not a refusal mechanism.** Here we correct the record, and the correction matters. One audit reported `src/lib/source/disclosure-flag/` as an empty directory; another assumed it was the evidence-refusal posture. Direct inspection of `disclosure-flag.ts` (~6.4 KB), `types.ts` (~4.6 KB), `serde.ts` (~3.9 KB), and the `__tests__/` suite shows what it actually is: a **legal-privilege classification value object**. It marks content as legal-privileged (classifications include attorney-client and work-product) and inherits that flag to downstream derived artifacts as an artifact moves Intelligence → Move → Source → Tower — the First Capital privilege-inheritance guarantee. It is pure constructors and transforms, no I/O, and it is built and shipped *for that purpose*. It is **SHIPPED**, not dormant, and it is **not** an evidence-insufficiency mechanism.

**The evidence-refusal / governed-insufficiency posture — ABSENT.** The capability that an earlier draft attributed to disclosure-flag — declining to recommend a vendor or advance a stage when evidence is below the stage threshold — does not exist in the codebase. The live grounded-answer path is `source-answer-engine.ts`; a refusal/insufficiency module would be net-new and would wire into it. There is no stage-by-stage definition of "sufficient evidence," and no UI communicates "why we cannot proceed." This is unbuilt, not merely dormant.

**Maturity: archetype framework 2 (DORMANT), disclosure-flag 3 (SHIPPED, privilege-classification), evidence-refusal posture 1 (ABSENT).** The refusal-and-rigor spine the operating system needs is therefore *not* a matter of wiring an existing module: the privilege classifier is shipped and serves a different (also important) purpose, while the evidence-refusal posture must be built from scratch. `source-answer-engine.ts` is the live grounded-answer path into which a net-new refusal module would route — that build is specified in Chapter 5, and the privilege/insufficiency distinction is stated correctly in Chapter 4 §4.2.

### 2.9 Architecture, Workflow & Intelligence Gap Synthesis

We consolidate the full gap inventory into three buckets and rank by leverage — leverage meaning how many downstream capabilities the gap unblocks.

#### 2.9.1 Architecture Gaps (highest leverage)

| Rank | Gap | Evidence | Downstream consequence |
|---|---|---|---|
| A1 | **No Reasoning/Analysis layer.** Flow is Context → Claude → Markdown; no Analysis or Recommendation stage. | `agent-generation/server.ts`, `generate/route.ts` | Every recommendation, ranking, and decision in Volumes 2–3 has no place to live. The keystone fix. |
| A2 | **No Reasoning Envelope.** Reasoning outputs are prose only; no structured contract for claims, evidence, assumptions, confidence, caveats, decision trace. | `agent-mission-report.ts`, `multi-agent-types.ts` | UI/API/exports cannot render *why*; auditability and CXO trust impossible. |
| A3 | **No pipeline observability.** Audit metadata captures model/tokens/stop-reason for the final body only; no trace of evidence retrieved, mode/playbook selected, or score per decision point. | `agent-generation/types.ts`, `evidence-trace/` | No defensibility for board decisions; no debugging of reasoning. |
| A4 | **No semantic retrieval / live evidence binding.** Pattern matching is keyword/slug; artifact registry tracks parse status but does not live-link parsed content into reasoning. | `sentinel/orchestrator.ts`, `artifact-registry/text-parser.ts` | Reasoning runs on fixtures and exact-match patterns, missing "AMS Consolidation" vs "AMS Outsourcing." |

#### 2.9.2 Workflow Gaps (medium-high leverage)

| Rank | Gap | Evidence | Downstream consequence |
|---|---|---|---|
| W1 | **Gates unenforced.** Governance logic exists but is never triggered on a mutation; validation runners are orphaned utilities. | `source-governance-enforcement.ts`, `agent-validation-runner.ts`, `workflow-validation-runner.ts` | Events advance with fragmentary evidence; governance is theater. |
| W2 | **No waiver workflow.** `waiver_required` recognized; no form, registry, routing, or gate-variance. | `executive-decision-summary.ts` | Exceptions cannot be governed; blocked gates can't be cleared with accountability. |
| W3 | **No cross-stage triggers.** Re-opening d05 scope does not auto-revert d09 RFP to needs_review. | `canvas-substrate/types.ts`, artifact status enum | Stale downstream artifacts present as current; silent integrity loss. |
| W4 | **No audit trail for state changes.** Gate flips and evidence transitions computed at read-time, not persisted with who/when. | `canvas-substrate/queries.ts` | No defensible record of how a decision was reached — fatal for pilot-grade procurement. |
| W5 | **Evidence never bootstrapped; ramp unenforced.** Scaffold seeds artifacts/gates but not evidence; UI shows binary, not the 7-state ramp. | `canvas-substrate/scaffold.ts`, `evidence-requirements.ts` | Evidence-gated reasoning has no substrate to read. |

#### 2.9.3 Intelligence Gaps (medium leverage, but the differentiating layer)

| Rank | Gap | Evidence | Downstream consequence |
|---|---|---|---|
| I1 | **No live vendor data binding.** Evaluation/BAFO/selection/pricing all run on vendor-a/b/c fixtures; should-cost is wired into the dormant `source-answer-engine` (not the live generate-route pipeline) and normalization uses mock seed. | `bafo-negotiation.ts`, `pricing-normalization.ts`, `should-cost/should-cost-model.ts`, `award-decision-view.ts` | The commercial layer cannot produce a real ranking or a real savings number. |
| I2 | **Playbooks hardcoded.** Five archetype playbooks are prose in `source-answer-engine.ts`; no update path without code change. | `source-answer-engine.ts` | Procurement IP is frozen in source; can't evolve per market. |
| I3 | **Binary/ternary confidence.** No multi-factor (sufficiency × recency × corroboration × model uncertainty) calibration. | `context-quality.ts`, `evidence-trace/` | CXOs see "medium" with no basis; trust currency is debased. |
| I4 | **No market/benchmark intelligence.** No vendor profiles, peer benchmarks, savings intel, or AI-capability assessment. | `intelligence-patterns.ts`, `intelligence/pattern-manifest.ts` | Reasoning is internally consistent but market-blind. |
| I5 | **No renewal/portfolio reasoning.** Commercial risk detection isn't integrated into portfolio-level or renewal-window logic. | `commercial-risk-detection.ts` | No proactive capture of renewal leverage or cross-event conflict. |

#### 2.9.4 The Five Load-Bearing Gaps, Ranked by Leverage

Synthesizing across all three buckets, five gaps gate everything else, and they should be read in dependency order:

1. **No reasoning layer (A1/A2/A3).** Until Analysis and Recommendation stages and a Reasoning Envelope exist, there is nowhere to put a vendor ranking, a negotiation strategy, or a confidence band. Everything downstream waits on this. *This is why the roadmap ships the reasoning spine in Phase 1.*
2. **30 of 33 deliverables unbuilt — d19a first (§2.5).** The pricing-template generator unblocks the entire pricing→BAFO chain.
3. **Specialists test-only, no runtime call-site (§2.7).** The intelligence frame is empty until specialists are wired and given a registry.
4. **Evaluation/BAFO/pricing run on fixtures, not live vendor data (I1/§2.6).** The commercial layer is a sophisticated demonstration until real proposals flow through it.
5. **Gates declarative, not enforced (W1/§2.3).** Governance and auditability are inert until enforcement is bolted onto the mutation path, and the evidence-refusal posture is net-new (it does not exist yet, and is distinct from the shipped privilege classifier — see §2.8).

### 2.10 Chapter Verdict

Source is, today, a **well-architected document generator with a board-grade specification for the operating system it is not yet.** Its specification, persistence, and rendering layers are mature (4); its reasoning, evaluation-as-computation, negotiation-as-leverage, governance-as-enforcement, and market-intelligence layers are early (1–3). The commercial code is real but fixture-bound; the agent frame is real but dormant; the governance-enforcement logic is real but never triggered on a mutation; the privilege classifier is shipped but the evidence-refusal posture it was mistaken for has yet to be built.

The good news embedded in this assessment is that the hardest intellectual work — the doctrine, the artifact taxonomy, the gate criteria, the evidence ramp, the agent voices, the commercial models — is *already done to standard*. What remains is overwhelmingly a matter of **wiring, enforcement, and live-data binding**, not invention from scratch. The future-state chapters that follow do not ask the team to imagine a new system; they ask the team to *activate the one it has already specified* — to insert the reasoning layer (Chapter 5), feed the engines real vendor data (Chapters 6–8), and bolt governance to the mutation path (Chapters 8, 12, 13). The distance from a 2.6 baseline to a sourcing intelligence operating system is shorter than the code's current behavior suggests, precisely because the blueprint is already this good.

---

## How Elite Sourcing Firms Actually Operate

### Why Study the Elite Operators

The thesis of this specification — that Source must evolve from a document generator into a sourcing intelligence operating system — cannot be executed by studying software. Software tells us what is easy to build. It does not tell us what is *worth* building. To know that, we have to study the human organizations that already do this work at the highest level and command the highest fees for it: the strategy houses (McKinsey, Bain, Kearney), the systems integrators with sourcing advisory practices (Accenture), the specialist sourcing advisors (ISG), and the analyst-benchmark firms (Everest, Gartner). These firms are not paid for the RFP document. They are paid for the *reasoning* the document encodes — the fact-base, the should-cost model, the leverage analysis, the consensus discipline, the decision rigor. The document is the receipt; the reasoning is the product.

This matters because AbarVa's current architecture has inverted that relationship. The live pipeline — `src/lib/source/agent-generation/context-binder.ts` → `prompt-registry.ts` → Claude → markdown — treats the document as the deliverable and the reasoning as an implicit side-effect of a single LLM pass. There is no should-cost reasoning step, no leverage analysis step, no consensus-scoring step that the document is the *output* of. Worse, the deterministic commercial layer that *does* exist (`bafo-negotiation-model.ts`, `should-cost/should-cost-model.ts`, `award-decision-view.ts`) is wired only into the dormant `source-answer-engine.ts` or remains fixture-bound — never reached by the live generate-route pipeline. So the firm-study is not academic. It is the requirements specification for the reasoning engine that Volume 2 builds. Every discipline an elite firm practices is a function the system must encode, an engine it must run, or an agent it must field.

The problem each elite discipline solves is the same problem AbarVa's enterprise customers have: sourcing decisions are high-stakes, irreversible-for-years commitments made under information asymmetry, where the counterparty (the vendor) is a professional and the buyer is an amateur who runs one such process every three to five years. The vendor has run a thousand. Elite firms exist to rent the buyer a thousand-deal memory and a disciplined method. That is precisely what an operating system can institutionalize and scale — *if* it encodes the method rather than just the output format.

### The Strategy & Value-Targeting Discipline (McKinsey / Kearney)

The single most consequential thing elite strategy houses do differently is that they **set the target before they go to market**. A Kearney sourcing-transformation engagement or a McKinsey clean-sheet exercise begins not with a vendor longlist but with a fact-base and a *should-cost* model: what should this service cost if we built the cost stack from first principles — labor pyramid, blended rate, productivity assumption, infrastructure, overhead, margin — rather than anchoring on what the incumbent charges or what vendors quote? This is the difference between negotiating against the vendor's number and negotiating against the *right* number.

AbarVa has the raw material for this and does not use it. `src/lib/source/should-cost/should-cost-model.ts` is explicit in its own header that it models "the visible layer plus the seven hidden layers and returns a cost RANGE with the iceberg itemised — never a single number," with a 30+ role labor pyramid (`ShouldCostRole`) for the blended-rate calculation. This is genuine clean-sheet costing logic. And it is in fact consumed — `source-answer-engine.ts` imports the model (line 22) and invokes `estimateEventShouldCost`, carrying its output through a `shouldCostEstimate` field. But `source-answer-engine.ts` is itself dormant: it has no live generate-route call-site. So the model is wired into the dormant engine, not into the live generate pipeline. The fact-base exists; the discipline of reasoning *from* it does not yet run where customers' artifacts are produced. The value target lives in `src/lib/source/value-ledger.ts` as a point-in-time snapshot, not as a target that the strategy memo (d01), the RFP (d09), and the eventual award (d24) are all held accountable to.

The operating pattern to encode is the **value-target spine**: a should-cost baseline computed at S0–S1 intake, expressed as a defensible range with the iceberg itemized, that becomes the reference point every downstream stage reasons against. When a vendor quotes 15% above should-cost on the visible layer but hides 40% in the seven invisible layers, an elite firm catches it because it modeled the invisible layers up front. The system must do the same: bind `should-cost-model.ts` into the live reasoning engine at Phase 1 (today it reaches only the dormant `source-answer-engine.ts`), anchor d01/d02 (strategy memo, value target) to its output, and carry the target forward as the benchmark against which every proposal is normalized. Business value: this is the difference between "we negotiated a discount" and "we held the vendor to economic reality" — typically a 5–15 point swing on total contract value (illustrative range), and the entire credibility of the savings claim made to the board.

### Evaluation & Consensus Scoring Done Right

Amateur evaluation is a spreadsheet where each evaluator types a number and someone averages the columns. Elite evaluation is a *governed consensus process*. The differences are specific and each one is a requirement:

| Discipline | Amateur practice | Elite practice (McKinsey/Kearney/Accenture) | What it solves |
|---|---|---|---|
| Weight governance | Weights set after scores seen | Weights locked *before* responses opened, change-logged | Prevents post-hoc rationalization to a favored vendor |
| Multi-rater | One scorer per criterion | Independent raters, then calibration session | Surfaces evaluator bias and knowledge gaps |
| Deviation handling | Outliers silently averaged | Deviations >5 points flagged, re-rated with rationale | Forces the disagreement into the open where it's information |
| Evidence anchoring | Scores from impression | Every score cites the proposal section that justifies it | Makes scores defensible and disqualifications litigable |
| Blind vs open | Always open (halo effect) | Blind technical scoring, open commercial | Stops brand reputation from contaminating capability fit |

AbarVa's evaluation capability is, by the audit, the weakest link in the entire chain — maturity 1. `src/lib/source/scorecard.ts` is the whole of it, and reading the file confirms the diagnosis: it offers `countRequiredCriteria`, `countApprovedCriteria`, `summarizeApprovalState`, and `approvalStateLabel`. These are *display and approval-state* helpers. There is no weighted aggregation function, no rater-submission model, no deviation detector, no evidence linkage. The d16 scorecard template (`src/content/source-templates/evaluation/d16_scorecard.md`) is a markdown stub. The scorecard is a place to *record* a verdict, not an engine that *produces* one.

The operating pattern to encode is **governed weighted consensus**: weights locked and change-logged (d17 weight log) before responses are opened; per-rater independent submission; deterministic weighted aggregation; automatic flagging of any criterion where raters deviate beyond a threshold; a forced re-rate with written rationale; and every numeric score linked to the evidence citation in the parsed vendor response (`src/lib/source/artifact-registry/text-parser.ts`) that justifies it. This is the d16/d17/d18 generation contract that Chapter 6 specifies. The value is not merely a better number — it is a *defensible* number. When a losing vendor protests, an evidence-anchored, change-logged, deviation-flagged scorecard is the difference between a clean award and a re-run procurement.

### Negotiation & BAFO Mastery (Bain / ISG)

This is where results-delivery firms like Bain and specialist advisors like ISG earn their premium, and where the gap between AbarVa's modeled intent and its operational reality is most instructive. Elite negotiation is not haggling. It is **leverage analysis followed by disciplined concession management against pre-set walk-away thresholds.** The master practitioner walks into a BAFO round having already answered, quantitatively: How many viable alternates do I have, and how far behind is the second-best? What is the vendor's switching cost to *lose* me versus my switching cost to *leave* them? Where is my evidence asymmetry — what do I know about their cost structure that they don't know I know? What is the timing leverage — whose fiscal quarter closes first? And critically: what is my walk-away, and have I pre-committed to it with the sponsor so I don't blink in the room?

```
        ELITE NEGOTIATION REASONING (the model AbarVa must compute)
        ┌─────────────────────────────────────────────────────────┐
        │  LEVERAGE STATE  =  f(                                    │
        │     competitive_tension  (# viable alts × gap-to-2nd),    │
        │     switching_cost_asymmetry (theirs vs ours),            │
        │     evidence_asymmetry  (should-cost vs their quote),     │
        │     timing_pressure  (fiscal windows, renewal cliff),     │
        │     sponsor_air_cover  (escalation path pre-agreed)       │
        │  )                                                        │
        └──────────────────────┬──────────────────────────────────┘
                               │ drives
        ┌──────────────────────▼──────────────────────────────────┐
        │  CONCESSION LADDER per lever (12 levers):                 │
        │  price · scope · term · transition · governance ·         │
        │  liability · exclusion · timing · volume · service_level ·│
        │  evidence · payment_terms                                 │
        │  each lever: current → target → walk-away, with EV        │
        └──────────────────────┬──────────────────────────────────┘
                               │ produces
        ┌──────────────────────▼──────────────────────────────────┐
        │  EXPECTED-VALUE SCENARIOS: conservative / base / stretch  │
        │  per-lever saving × probability, risk-adjusted            │
        └───────────────────────────────────────────────────────────┘
```

The remarkable thing is that AbarVa has already *modeled* this structure. `src/lib/source/bafo-negotiation-model.ts` defines exactly the right ontology: a 12-type `BafoLeverType` (`price`, `scope`, `term`, `transition`, `governance`, `liability`, `exclusion`, `timing`, `volume`, `service_level`, `evidence`, `payment_terms`), a `BafoNegotiationLever` with `currentPosition`/`targetPosition`/`rationale`, opportunity strength tiers, risk levels, ask types, and `BafoNegotiationScenario` objects carrying `expectedOutcome` and `estimatedTotalImpact`. This is, structurally, exactly how Bain models a negotiation. The fatal gap is in the field types and the data source: `estimatedValueImpact` is a `string` ("5–8% cost reduction"), not a computed number; the scenarios in `bafo-scenario-compare-view.ts` are deterministic fixtures over `vendor-a/b/c`; and none of it consumes a live pricing comparison. The model encodes the *shape* of elite reasoning but runs on hardcoded prose, not on the should-cost baseline and normalized vendor pricing it should be reasoning over.

The operating pattern to encode is **computed leverage and expected-value negotiation**: promote the lever model from seeded prose to a model that takes the should-cost baseline and the normalized vendor pricing matrix as inputs, computes a leverage state from real competitive tension, generates per-vendor concession ladders with explicit walk-away thresholds, and produces conservative/base/stretch EV scenarios where each lever's impact is `saving × probability`, risk-adjusted. The walk-away threshold is the discipline that separates elite from amateur — it must be set with the sponsor *before* the round and enforced by the system as a hard line, not a suggestion. Business value: ISG and Bain routinely demonstrate that disciplined, leverage-informed BAFO captures an incremental 8–20% beyond the first-round "best" offer (illustrative range). That delta is pure margin on a multi-year contract — and it is invisible to any process that walks into the room without having computed its leverage.

### Selection, Executive Decision-Making & Governance

Elite firms understand that the award recommendation is not the answer to "who scored highest" — it is the answer to "which decision can the board defend in two years when one assumption proves wrong." The construction of a board-grade recommendation has a specific anatomy that amateur processes skip:

1. **Risk-adjusted ranking**, not raw-score ranking. The highest technical scorer with a transition plan that depends on retaining incumbent staff who are leaving is *not* the lowest-risk award. Elite recommendations adjust scores for transition risk, supplier concentration, and liability exposure before ranking.
2. **Decision options, ordered, with rationale** — not a single recommendation presented as inevitable. A board wants to see the recommended path, the credible alternate, and *why* one beats the other, so it is deciding rather than rubber-stamping.
3. **Dissent capture.** The strongest evaluation processes record the minority view on the record. If the security lead dissented, the board should know, and the record should show it was heard and overruled with reason.
4. **A sign-off trail.** Who approved, on what evidence, under what conditions, with what residual risk explicitly owned.

AbarVa derives the *posture* of this but enforces none of it. `src/lib/source/award-decision-view.ts` is, by its own header, a "Deterministic view model for the Source Event Award Decision Tracker" that answers "which vendor should be awarded, and why" — with a `VendorScoreCard` (commercial/technical/transition/risk/overall, each 0–100) and an `AwardDecisionStatus` of `recommended | conditional | not_recommended`. The structure is right. But the scores are hardcoded fixtures (the audit notes Vendor C technical: 88, risk: 80 are literals, not derivations from d16), there is no risk-adjustment computation from the evaluation engine, and `src/lib/source/executive-decision-summary.ts` derives evidence confidence by a binary heuristic (low-evidence blocker present → low; high risk → medium; else high). Crucially, the posture is *derived but not enforced*: nothing blocks advancement on an unmet pre-award condition, and there is no sign-off capture. The decision brief (d24), risk attestation (d25), and Steward sign-off (d26) are markdown stubs.

The operating pattern to encode is **the defensible recommendation with an enforced governance loop**: live derivation of risk-adjusted ranking from evaluation + BAFO outputs; ordered decision options with explicit rationale chains; dissent capture as a first-class field; a calibrated recommendation-level confidence band (replacing the binary heuristic); and a hard post-gate sign-off step wired into `src/lib/source/source-governance-enforcement.ts` and the gate-criterion-state mutation path, with waiver generation and a waiver registry for the cases where the board chooses to proceed with eyes-open residual risk. Governance here is not friction — it is the audit trail that makes the decision survive scrutiny.

### Market & Benchmark Intelligence (Gartner / Everest / ISG)

The discipline that most cleanly separates the analyst-benchmark firms from internal procurement teams is **externally-calibrated reasoning**. Gartner Magic Quadrants and Everest PEAK Matrices, ISG pricing benchmarks, and the deal-comparison databases these firms maintain exist so that a buyer's internal reasoning is checked against the market. An internal team estimates should-cost from first principles and hopes it's right. Everest *knows* what the market clears at, because it has the comparable-deal data. A vendor profile at Gartner is not marketing — it is capability assessment, reference checks, financial stability, and increasingly AI-capability maturity, structured so a buyer can reason about fit and risk without taking the vendor's word.

AbarVa has **none** of this. There is no vendor profile entity, no benchmark store, no peer-deal database. The closest analog is the Intelligence pattern layer (`src/lib/source/intelligence-patterns.ts`, `src/lib/intelligence/pattern-manifest.ts`), which holds 300+ patterns matched by keyword/slug — a thin, internally-sourced proxy with no market pricing, no vendor financials, no AI-capability profiles, and (per the audit) keyword matching rather than semantic retrieval. This is the single largest *category* of capability the future-state must add, and it is what Chapter 11 (Market Intelligence Layer) specifies.

The operating pattern to encode is the **market brain**: a vendor-profile entity (capabilities, references, financials, AI maturity) that feeds both the evaluation engine (capability fit) and the BAFO engine (switching-cost and leverage analysis); a benchmark store that calibrates the should-cost model against real market clears rather than conservative defaults; and a semantic-retrieval upgrade to pattern matching so that "AMS Consolidation" matches the "AMS Outsourcing" pattern without an explicit hardcoded alias. Without this layer, AbarVa's reasoning is *internally consistent but market-blind* — it can tell you what a deal should cost in theory but not what comparable enterprises actually paid. That blindness is exactly the gap a CIO pays ISG to close.

### The Decision Rigor Common to All of Them

Stepping back from the discipline-by-discipline view, five operating patterns recur across every elite firm, regardless of which stage they specialize in. These are the *meta-disciplines* — the connective tissue that makes the individual techniques add up to trustworthy advice. They are the patterns AbarVa must encode not as features but as the architecture itself.

**Fact-base before opinion.** No elite firm offers a recommendation before it has built the fact-base the recommendation rests on. The should-cost model precedes the negotiation strategy; the parsed evidence precedes the score. AbarVa's current pipeline violates this directly: generation runs even when upstream evidence is merely "Loaded," not "Parsed" (per the evidence-readiness ramp in `src/lib/source/canonical-specs/evidence-requirements.ts`), because gates are advisory. The fix is the reasoning-first pipeline of Chapter 5 and an *evidence-or-refuse* posture — a governed-insufficiency mechanism that is, today, entirely absent and would be net-new (it is not the disclosure-flag layer, which classifies legal privilege, not evidence sufficiency).

**Hypothesis-driven, falsifiable reasoning.** Elite firms state a hypothesis ("an AMS consolidation captures 18% by eliminating duplicate ticket-handling overhead"), then try to *kill* it with evidence before they trust it. The recommendation carries the assumptions tested *and rejected*, not just the survivors. AbarVa's generated artifacts carry no reasoning trace at all — no record of which evidence shaped the recommendation, which assumptions were tested, or what confidence bounds apply. This is the Reasoning Envelope of Chapter 5: the canonical output contract that makes every claim auditable.

**Calibrated, expressed confidence.** A McKinsey partner does not say "the answer is 18%." She says "18%, with high confidence on the labor component and low confidence on the automation assumption, which depends on a productivity claim we couldn't verify." Confidence is multi-factor and *expressed*, because the client's trust depends on knowing where the analysis is solid and where it's thin. AbarVa's confidence is ternary (`high`/`medium`/`low`) and, in `executive-decision-summary.ts`, derived by crude heuristic. The Confidence Philosophy of Chapter 4 and the multi-factor scorer of Chapter 5 replace this.

**Adversarial self-challenge (red-team).** The best firms run an internal challenge before the recommendation reaches the client — a partner whose job is to attack the logic. AbarVa has no equivalent; recommendations surface unchallenged. The challenge/red-team model of Chapter 5 institutionalizes this.

**Governed refusal.** An elite firm will tell a client "we cannot responsibly recommend a vendor on this evidence base" rather than manufacture a confident answer. This is the hardest discipline to encode and the most valuable, because it is the one that protects the buyer from the system's own fluency. AbarVa has no such mechanism today: the evidence-or-refuse / decline-to-advance-below-threshold posture is absent and would be net-new. The live grounded-answer path is `src/lib/source/source-answer-engine.ts`; a refusal/insufficiency module would wire into it. (`src/lib/source/disclosure-flag/` is a separate, shipped capability — a legal-privilege *classifier* that marks attorney-client / work-product content and inherits the flag to downstream derived artifacts; it is not a refusal mechanism.) Building this governed-insufficiency layer (Chapter 5) is the governance backbone of the entire OS.

### The Operating-Model Translation Table

The purpose of this chapter is to convert observed elite practice into engineering requirements. The following table is the bridge: each elite-firm discipline mapped to the AbarVa engine or agent that will encode it, the real file or seam it extends, the current maturity (1–5 per the assessment scale), and the maturity delta the future-state must close. This table is the index from Chapter 3 into Volumes 2 and 3.

| Elite discipline | Reference firms | AbarVa engine / agent | Real seam it extends | Current → target maturity | Spec'd in |
|---|---|---|---|---|---|
| Should-cost / value-target spine | McKinsey, Kearney | Reasoning Engine (analysis stage) | `should-cost/should-cost-model.ts` (wired into dormant `source-answer-engine.ts`, not the live pipeline) | 2 → 5 | Ch5, Ch16 P1 |
| Fact-base-before-opinion pipeline | All | Reasoning Engine (4-step pipeline) | `agent-generation/server.ts`, `context-binder.ts` | 2 → 5 | Ch5 |
| Governed weighted consensus scoring | McKinsey, Kearney, Accenture | Vendor Evaluation Engine | `scorecard.ts` (display-only), d16/d17 stubs | 1 → 5 | Ch6, Ch16 P2 |
| Evidence-anchored scoring & disqualification | All | Evaluation Engine + evidence-trace | `artifact-registry/text-parser.ts`, `evidence-trace/` | 1 → 4 | Ch6 |
| Leverage analysis & concession laddering | Bain, ISG | BAFO Intelligence Engine | `bafo-negotiation-model.ts` (12 levers, seeded) | 3 → 5 | Ch7, Ch16 P3 |
| Expected-value scenario modeling | Bain, ISG | BAFO Engine (EV calc) | `bafo-scenario-compare-view.ts` (fixtures) | 2 → 5 | Ch7 |
| Pricing normalization (8-dimension) | ISG, Everest | BAFO Engine fuel | `pricing-normalization.ts`, `pricing-submissions/dao.ts`, d19a missing | 2 → 5 | Ch7, Ch16 P3 |
| Risk-adjusted award recommendation | McKinsey, Bain | Selection Intelligence Engine | `award-decision-view.ts` (fixtures) | 2 → 5 | Ch8, Ch16 P4 |
| Calibrated recommendation confidence | All | Confidence model | `executive-decision-summary.ts` (binary heuristic) | 2 → 4 | Ch5, Ch8 |
| Decision options + dissent capture | McKinsey, Bain | Selection Engine + Executive Cockpit | `executive-decision-summary.ts`, d24 stub | 2 → 4 | Ch8, Ch14 |
| Enforced sign-off & waiver governance | All | Steward agent + governance enforcement | `source-governance-enforcement.ts`, gate-criteria mutation route | 3 → 5 | Ch8, Ch12 |
| Adversarial self-challenge (red-team) | McKinsey, Bain | Challenge model | (absent) | 0 → 4 | Ch5 |
| Governed refusal on thin evidence | All | Evidence-insufficiency module + grounded-answer | (refusal mechanism absent — net-new), `source-answer-engine.ts` (live path, dormant) | 0 → 5 | Ch4, Ch5 |
| Legal-privilege classification & inheritance | Accenture, ISG legal | Disclosure-flag value object | `disclosure-flag/disclosure-flag.ts` (shipped) | 4 → 5 | Ch4, Ch9 |
| Market / benchmark / vendor-profile intelligence | Gartner, Everest, ISG | Market Intelligence Layer | `intelligence-patterns.ts`, `pattern-manifest.ts` (keyword) | 1 → 4 | Ch11, Ch16 P7 |
| Contract redline & SLA/liability verification | Accenture, ISG legal | Contract Intelligence | `artifact-registry/upload-contract.ts`, `ai-clause-gap.ts` renderer | 2 → 4 | Ch9, Ch16 P5 |
| Transition readiness quantification | Accenture, Bain | Transition Intelligence | `transition-readiness-view.ts` (keyword-derived) | 2 → 4 | Ch10, Ch16 P6 |

Two observations from this table sharpen the build sequence and close the chapter.

First, the **structural ontologies already exist** for the disciplines AbarVa has invested in — the 12-lever BAFO model, the four-axis award scorecard, the 30-role should-cost pyramid, the eight-dimension pricing normalization. The system is not naïve about how elite firms reason; it has encoded the *shape* of that reasoning in TypeScript. What is missing is uniform and consistent: the reasoning runs on fixtures and prose rather than live data, the models are not wired into the live pipeline, and the outputs carry no reasoning trace. This is profoundly good news for sequencing — the future state is largely a matter of *activating and connecting* well-designed dormant logic, not inventing it. The reasoning spine (Phase 1) is the unlock because every engine downstream consumes its envelope.

Second, the **one category genuinely absent is market intelligence** — the externally-sourced knowledge that the analyst firms exist to provide. This is why it sequences last (Phase 7) and why it is architecturally a separate layer (Chapter 11): it depends on data AbarVa does not yet have and cannot derive internally, and the internally-grounded engines must be trustworthy first before market calibration adds leverage rather than noise. An internally-rigorous system that is market-blind is still vastly better than today's document factory; a market-calibrated system built on un-rigorous internal reasoning would be confidently wrong at scale.

The synthesis is this: elite sourcing firms are paid for reasoning rigor, fact-base discipline, leverage mastery, consensus governance, and decision defensibility — and they express all of it through a small set of meta-disciplines (fact-base first, falsifiable hypotheses, calibrated confidence, adversarial challenge, governed refusal). AbarVa has the artifact ontologies and partial engines to encode every one of these disciplines, but currently delivers the documents without the reasoning that should produce them. Volume 2 builds the engines that close that gap. Volume 3 builds the architecture that makes them trustworthy and scalable. Chapter 4 next defines, from first principles, what it means for Source to become the operating system that institutionalizes this elite-firm method — and turns reasoning, not documents, into the product.

---

## Chapter 4 — Future State Vision: The Sourcing Intelligence Operating System

Chapters 2 and 3 established two facts that, held together, define the entire mandate of this volume. First, AbarVa Source already possesses a sophisticated *specification* of sourcing — eleven canonical stages, 33 deliverable definitions in `src/lib/source/canonical-specs/artifact-specs.ts`, 38 gate criteria, a four-agent voice model, and a dormant archetype framework that mirrors how the best sourcing organizations classify and rigor-tier their events. Second, almost none of that specification *reasons*. The live runtime — `src/lib/source/agent-generation/context-binder.ts` → `prompt-registry.ts` → `server.ts` → Claude → markdown body — is a single-hop generator: it assembles context and asks a language model to write a document. There is no step in which the system decides *what the answer is* before deciding *how to write it down*.

This chapter defines what we are building instead, and why the distinction is not cosmetic. It is the difference between a document factory and an operating system.

### 4.1 Definition: What Makes Source an Operating System

An operating system, in the sense we intend, is not a metaphor for "comprehensive software." It is a precise architectural claim: a layer that sits between raw inputs (events, evidence, market signals) and the decisions an organization must make, and that *owns the reasoning in between*. Documents, dashboards, and exports are peripheral devices — they render the operating system's state — but they are not the system. The system is the reasoning.

Concretely, the Source Intelligence Operating System ingests a sourcing event and the evidence attached to it, and produces four classes of *decision output*:

| Decision output | What it asserts | Today's analog | Future-state owner |
|---|---|---|---|
| **Recommendation** | "Pursue an AMS consolidation, not a renewal" | none (prompt writes prose) | Reasoning Engine (Ch. 5) |
| **Vendor ranking** | "Vendor C leads on risk-adjusted score, margin 6 pts" | `award-decision-view.ts` (fixtures) | Evaluation Engine (Ch. 6) |
| **Negotiation strategy** | "Pull the SOC-2 holdback as your first concession ask" | `bafo-negotiation-model.ts` (seeded levers) | BAFO Engine (Ch. 7) |
| **Executive decision** | "Award to C, conditional on parallel-run commitment" | `executive-decision-summary.ts` (heuristic posture) | Selection Engine (Ch. 8) |

Documents (`d01`–`d33`) become the *serialization* of these decisions. The strategy memo (`d01`) is the readable form of a category-strategy recommendation; the scorecard (`d16`) is the readable form of an evaluation; the decision brief (`d24`) is the readable form of a selection. Today the causal arrow points the wrong way — the document is generated and *implies* a recommendation. In the future state the recommendation exists first, as a structured object, and the document is rendered *from* it.

This single inversion — recommendation-before-document — is the thesis of the entire specification. Everything that follows in Volumes 2 and 3 is an elaboration of how to make it true.

#### Why it matters

A document factory cannot be trusted with a board decision because no one can interrogate *why* it said what it said. A McKinsey engagement manager who presents a vendor recommendation can be asked, in the room, "what evidence drove this, what did you assume, what would change your mind?" — and must answer. A system that emits a 39,000-character RFP with no reasoning trace cannot answer those questions, which is precisely why CXOs treat AI-generated procurement artifacts as drafts to be re-validated rather than decisions to be acted upon. The business value of the operating system is not faster documents; it is *trustable decisions*, which is a categorically different and far larger prize.

### 4.2 First Principles & Design Philosophy

Five principles govern the architecture. Each is stated as a rule, justified by the problem it solves, and tied to the file or seam it extends.

**Principle 1 — Reasoning before generation.** A distinct analysis-and-recommendation layer must sit between context binding and deliverable generation. The seam already exists: `server.ts` calls the prompt registry with a fully-bound `SourceGenerationContext`. Today the next hop is Claude. In the future state the next hop is the Reasoning Engine, which consumes the context, produces a structured recommendation with a reasoning trace, and *then* passes that recommendation (not raw context) to the generation step. This solves the auditability problem at its root: the reasoning is computed and stored before any prose is written, so the document can never assert more than the reasoning supports.

**Principle 2 — Evidence-or-refuse.** The system must decline to advance or recommend when evidence is insufficient, and must say so in plain language. The live grounded-answer path is `src/lib/source/source-answer-engine.ts`; the dormant governance backbone is the archetype framework's promotion-only evidence ladder. The refusal posture is not yet wired (the `disclosure-flag/` module that exists today is a *privilege-classification* value object — attorney-client, work-product — not the insufficiency-refusal mechanism; that mechanism is unbuilt). The principle: a recommendation grounded in one parsed vendor proposal and three fixtures is a liability, not an asset. A system that says "I cannot rank these vendors until pricing for Vendor B is normalized" is more valuable than one that ranks them anyway. Refusal is a feature.

**Principle 3 — Promotion-only readiness.** Evidence and artifact states move forward through a ramp (Not Requested → Loaded → Parsed → Available → Usable Evidence) and never silently regress. This is defined in `src/lib/source/canonical-specs/evidence-requirements.ts` but not enforced at the data layer. The principle protects the integrity of every downstream decision: if a recommendation was made on Usable Evidence, and the underlying evidence later goes Stale, the system must surface the drift rather than let a stale decision stand. This is the procurement analog of a clean audit trail.

**Principle 4 — One front agent, many specialists.** Sentinel is the single voice the user converses with in Source; the seven specialists behind it (`evidence-gap-detector`, `value-at-stake-summarizer`, `executive-decision-brief-writer`, and the rest, orchestrated in `src/lib/source/sentinel-source-orchestrator.ts`) are function-named contributors, not chat personas. This solves the "too many cooks" failure of multi-agent UX: the executive sees one coherent, governed recommendation, with the specialist contributions available as a trace drawer. The architecture exists; the specialists are deterministic stubs with no model calls and no persistence. Activating them is a Volume 3 concern.

**Principle 5 — Layer separation: context, knowledge, reasoning.** Three data planes must be kept distinct: the *context layer* (per-event, per-tenant mutable state — `agent-context.ts`, the canvas substrate), the *knowledge layer* (market intelligence, vendor profiles, benchmarks, patterns — largely absent today), and the *reasoning layer* (traces and envelopes — entirely new). App-tier code must reach knowledge and reasoning through a broker boundary, never by direct import. This solves the contamination problem: tenant context must never leak into the shared knowledge plane, and reasoning artifacts must be reconstructable independently of the UI that displayed them.

These five principles are not aspirational slogans. Each names a specific file that either embodies it partially or marks the seam where it will be enforced. The maturity delta between "principle stated" and "principle enforced" is the work of Volumes 2–4.

### 4.3 The Core Inversion — From Prompt to Reasoning

The single most important diagram in this specification is the contrast between the live pipeline and the target pipeline.

**Today (live):**

```
  ┌──────────┐   ┌──────────────┐   ┌────────────────┐   ┌────────┐   ┌────────────┐
  │  EVENT   │──▶│ CONTEXT       │──▶│ PROMPT          │──▶│ CLAUDE │──▶│ DELIVERABLE│
  │ + state  │   │ BINDER        │   │ REGISTRY        │   │ Sonnet │   │ (markdown) │
  └──────────┘   │ context-      │   │ prompt-         │   └────────┘   └────────────┘
                 │ binder.ts     │   │ registry.ts     │        │
                 └──────────────┘   │ (3 of 33 tmpl)  │        ▼
                                    └────────────────┘   body + token
                                                          metadata only
   REASONING HAPPENS NOWHERE — it is implicit in the model's single forward pass.
```

The context binder assembles a `SourceGenerationContext` (event metadata, artifact states, gate criteria, evidence states). The prompt registry — holding live templates only for `d01`, `d05`, `d09` — produces a system prompt and a user message. Claude returns markdown. `body_generation_metadata` records model, prompt version, tokens, stop reason. At no point does a structured *claim* exist that can be inspected, scored, challenged, or stored independently of the prose. The recommendation, if there is one, is dissolved into the document.

**Future state (target):**

```
  ┌──────────┐   ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐   ┌────────────┐
  │  EVENT   │──▶│ CONTEXT       │──▶│ ANALYSIS        │──▶│ RECOMMENDATION    │──▶│ DELIVERABLE│
  │ + state  │   │ (binder +     │   │ apply reasoning │   │ structured claim  │   │ rendered   │
  │ + evid.  │   │  archetype    │   │ frameworks →    │   │ + evidence +      │   │ FROM the   │
  └──────────┘   │  classify)    │   │ structured      │   │ confidence +      │   │ envelope   │
                 └──────────────┘   │ findings        │   │ caveats + trace   │   └────────────┘
                       │            └────────────────┘   └──────────────────┘         │
                       │                    │                      │                    │
                       ▼                    ▼                      ▼                    ▼
                 evidence-or-          REASONING            REASONING ENVELOPE      every doc is a
                 refuse gate           FRAMEWORKS           (canonical contract)    serialization of
                 (NET-NEW module)      (should-cost,        claims·evidence·        the envelope
                                       delivery-model,      assumptions·conf·
                                       normalization)       caveats·decision-trace
```

Two stages are inserted. **Analysis** consumes the bound context, classifies the event by archetype (via `src/lib/source/classifier/category-classifier.ts` `classifySourcingEvent()`, today imported and invoked by `source-answer-engine.ts` but live only inside that dormant engine and its test fixtures — never in the live deliverable-generation pipeline (its only live entry point is the read-only nexus/ask stub responder)), selects and runs the applicable reasoning frameworks (`should-cost-model.ts`, `delivery-model-gate.ts`, `proposal-normalization.ts` — already wired into the dormant `source-answer-engine.ts` as a flat bundle rather than a live pipeline stage), and emits structured findings. **Recommendation** turns findings into a defensible claim with its supporting evidence, the assumptions it tested, the alternatives it rejected, a calibrated confidence band, and a decision trace. Only then does generation render a document — and the document can render nothing the envelope does not contain.

This is the operating-system inversion expressed as a pipeline. The business consequence: every artifact becomes auditable by construction, because the reasoning that produced it is a first-class, stored object rather than an emergent property of a prompt.

### 4.4 The Recommendation Philosophy

A recommendation is not an opinion the system holds; it is a *defensible position the system can defend*. The future state expresses every recommendation through a single canonical structure — the **Reasoning Envelope** — specified in full in Chapter 5 and extending the under-used `SourceMultiAgentBriefing` and `agent-mission-report.ts` contracts. Here we define its philosophy.

A recommendation that an elite firm would put in front of a board carries six things, and the envelope makes all six mandatory:

| Envelope element | Question it answers | Why a board demands it |
|---|---|---|
| **Claim** | "What do you recommend?" | The decision itself, stated unambiguously |
| **Supporting evidence** | "What is this based on?" | Every claim cites parsed evidence with provenance, not assertion |
| **Assumptions tested / rejected** | "What did you take as given, and what did you rule out?" | Exposes the reasoning's load-bearing premises for challenge |
| **Options considered** | "What else could we do?" | A recommendation without alternatives is advocacy, not analysis |
| **Confidence band** | "How sure are you?" | Calibrated, multi-factor, explainable (see 4.5) |
| **Decision trace** | "How did you get here?" | The framework chosen, the data weighted, the score at each fork |

The discipline this enforces is the discipline of clean-sheet analysis that McKinsey and Kearney teams practice instinctively: you do not recommend a should-cost target without showing the cost build; you do not rank a vendor without showing the evidence behind each dimension; you do not advance a stage without naming what you assumed. The envelope is the codification of that discipline into a machine-checkable contract.

Critically, the recommendation is the input to generation, not the output. When the strategy memo (`d01`) is rendered, it is rendered from a recommendation envelope whose claims are already evidenced and whose confidence is already calibrated. The prompt's job shrinks from "decide and write" to "write what has been decided." This is why the future state can guarantee quality gates — "0 unsupported claims, 0 leaks" — that the present state can only hope for: an unsupported claim is structurally impossible if every claim in the envelope must carry a citation before the renderer ever runs.

### 4.5 The Confidence Philosophy

Today, confidence in Source is ternary and inherited. `SourceAgentBriefingConfidence` in `multi-agent-types.ts` is the literal type `'low' | 'medium' | 'high'`, and the executive decision summary derives it by a one-line heuristic (low-evidence blocker present → low; high risk → medium; else high). This is not confidence; it is a label. A board cannot act on a label.

The future state moves to **multi-factor, explainable confidence**, and the seed already exists: `src/lib/source/context-quality.ts` defines a seven-dimension `SourceContextQualityScore` (contextCompleteness, patternGrounding, evidenceCoverage, eventStateGrounding, missingInputAwareness, actionability, vanillaResponseRisk) on a 0–5 scale with explicit `missingContextReasons` and a thresholds object. This is the right shape, scoped today to context quality; the future state generalizes it into a confidence model that every recommendation carries.

The confidence model rolls four factors into a calibrated band:

| Factor | What it measures | Source signal |
|---|---|---|
| **Evidence sufficiency** | Is there enough evidence, at the right readiness state, for this claim? | evidence-requirements ramp + parsed-proposal coverage |
| **Recency** | Is the evidence current, or has it gone Stale? | readiness-ramp freshness (a future-state TTL) |
| **Corroboration** | Do independent sources agree, or is this a single point? | knowledge-graph `evidence_for` edge count |
| **Model uncertainty** | How much of this is inference vs. grounded fact? | Sentinel voice doctrine's verified/asserted/inferred tagging |

The output is a band — not a point — surfaced to the CXO with its drivers. "High confidence on the ranking; medium on the savings estimate because Vendor B's pricing is normalized from a single response and may be Stale" is a statement a board can act on. The principle: **calibrated confidence is the trust currency of the operating system.** A system that is confidently wrong destroys trust faster than one that is honestly uncertain; the entire value of the OS rests on its confidence being earned and explainable, never asserted.

### 4.6 The Risk Philosophy

Risk in the future state is not a flag; it is a quantity with an owner. Today, `src/lib/source/commercial-risk-detection.ts` detects eight risk categories — `pricing_anomaly`, `scope_ambiguity`, `governance_gap`, `evidence_deficit`, `contract_trap`, `transition_risk`, `liability_exposure`, `timeline_compression` — by checking input flags and emitting a severity. This is a strong taxonomy and a weak engine: it tells you a category fired but not its financial magnitude, its probability, whether it can be mitigated, or who is accountable for it.

The future-state risk model moves from detection to **quantification, ownership, and escalation** along four moves:

1. **Quantify.** Each risk carries impact (financial or value-at-stake), probability, and mitigability — the standard impact × probability × mitigability triple that Bain results-delivery teams use to triage. A `transition_risk` is no longer "flagged"; it is "$4M of run-rate exposure, 40% likely without a parallel-run commitment, mitigable via a contractual KT milestone" (illustrative range).
2. **Own.** Every risk routes to a role (the `ownerRole` already present on gate criteria) and to an agent. Sentinel surfaces it; Steward governs whether it blocks; Atlas weighs it against value.
3. **Escalate.** Risks above a threshold trigger the human-escalation path of the agent state machine (Chapter 12), not a silent log entry.
4. **Carry.** Risks travel with the artifact and into the executive decision packet, where the risk attestation (`d25`) is the formal record that the board saw and accepted the residual exposure.

The eight existing categories are the seed; the engine that turns them into governed, owned, mitigable quantities is built in Volumes 2–3. The principle: **risk that is detected but not quantified, owned, and escalated is risk that will surface at award or in transition** — exactly when it is most expensive to address.

### 4.7 The Governance & Refusal Philosophy

Governance in the future state is enforcement, not advice. Chapter 2 documented the central pathology: `src/lib/source/source-governance-enforcement.ts` can *evaluate* whether a gate's criteria are met and whether a stage may be promoted — `evaluateCriterionMetReadiness()`, `evaluateStagePromotionReadiness()` are real and tested — but nothing calls them on the mutation path. Gates are computed at read time and never block a write. A user can advance from RFP to Responses with zero vendor responses; a stage can promote with soft criteria unmet and only a warning shown.

The future-state governance posture rests on three mechanisms, owned by the Steward voice:

- **Gates that block.** The validation runners (`agent-validation-runner.ts`, `workflow-validation-runner.ts`) become mutation guards: stage promotion, artifact approval, and evidence-state changes call governance *before* committing, and a hard-criterion failure rejects the mutation with a plain-language reason and an audit row. This is the single highest-leverage governance change because it converts the entire mature gate catalog from documentation into runtime control.
- **Evidence thresholds that must be met.** The promotion-only readiness ramp is enforced at the data layer (CHECK constraints, transition audit — Chapter 13), so a recommendation can never be built on evidence below its required minimum state.
- **A refusal mechanism.** When evidence is insufficient, the system declines and explains. This is net-new work: the live grounded-answer path is `source-answer-engine.ts`, and a refusal/insufficiency module would wire into it. (Note the naming: the existing `disclosure-flag/` module governs legal *privilege* classification — attorney-client, work-product — an orthogonal axis that is already shipped; the insufficiency-refusal capability is absent and must be built from scratch.)

The reframe this requires of the founder and product leadership is important and explicit: **governance is a feature, not friction.** A sourcing OS that will refuse to recommend a vendor on thin evidence is *more* valuable to a CIO than one that always produces an answer, because the CIO's career risk lives in the unjustified award, not the delayed one. Steward saying "no, not yet, here is what is missing" is the product working, not the product failing.

### 4.8 Target Architecture at a Glance

The future state is a layered architecture in which each block maps to a chapter of Volumes 2 and 3. The diagram below is the spine of the remainder of this specification; read it as the table of contents made physical.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  UX SURFACES (Vol 3, Ch 14)                                                   │
│  Evaluation Workbench · BAFO Command Center · Selection Center ·              │
│  Executive Cockpit · Contract Center · Transition Center                      │
│  ── all bind to the Reasoning Trace Visualization (cross-surface) ──          │
└───────────────▲───────────────────────────────────────────────────────────────┘
                │  reasoning envelopes rendered as decisions, not documents
┌───────────────┴───────────────────────────────────────────────────────────────┐
│  DELIVERABLES d01–d33 (Vol 3, Ch 15)   render-router → renderers → docx/xlsx/  │
│  pdf/html      exports/dispatch.ts · format-router.ts   (PDF path = new)       │
└───────────────▲───────────────────────────────────────────────────────────────┘
                │  every deliverable is a serialization of an envelope
┌───────────────┴───────────────────────────────────────────────────────────────┐
│  AGENTS (Vol 3, Ch 12)   Sentinel (front) · Atlas · Steward · engine agents    │
│  sentinel-source-orchestrator.ts · voice-doctrine/sentinel.ts                  │
│  + specialist registry (the 7 stubs, wired) + handoff state machine            │
└───────────────▲───────────────────────────────────────────────────────────────┘
                │  agents orchestrate engines and emit envelopes
┌───────────────┴───────────────────────────────────────────────────────────────┐
│  ENGINES (Vol 2, Ch 6–8 · Vol 3, Ch 9–10)                                      │
│  Evaluation · BAFO Intelligence · Selection · Contract · Transition            │
│  scorecard.ts · bafo-negotiation*.ts · award-decision-view.ts ·                │
│  upload-contract.ts · transition-readiness-view.ts                             │
└───────────────▲───────────────────────────────────────────────────────────────┘
                │  engines run on the reasoning spine
┌───────────────┴───────────────────────────────────────────────────────────────┐
│  REASONING LAYER (Vol 2, Ch 5)   Analysis → Recommendation                     │
│  Reasoning Frameworks library · Reasoning Envelope contract ·                  │
│  Confidence/Risk/Challenge models · Pipeline observability + trace             │
│  extends agent-generation/server.ts · context-quality.ts · evidence-trace/     │
└───────────────▲───────────────────────────────────────────────────────────────┘
                │  reasoning consumes context + knowledge
┌───────────────┴───────────────────┐   ┌───────────────────────────────────────┐
│  CONTEXT LAYER (Vol 3, Ch 13)      │   │  KNOWLEDGE LAYER (Vol 3, Ch 11)        │
│  per-event/tenant mutable state    │   │  Market Intelligence — vendor profiles,│
│  agent-context.ts · canvas-        │   │  benchmarks, pricing/savings intel,    │
│  substrate · gate/evidence/        │   │  AI-capability profiles, semantic      │
│  artifact states                   │   │  pattern retrieval (pattern-manifest)  │
└────────────────────────────────────┘   └───────────────────────────────────────┘
        ▲                                              ▲
        │  bootstrapped + promotion-only               │  broker boundary — app-tier
        │  readiness ramp                              │  never imports directly
   EVENT INTAKE + EVIDENCE INGESTION (archetype classified at S0_intake)
```

**Reading the spine bottom-up.** Events enter at intake, are classified by archetype, and have evidence ingested under a promotion-only ramp. Two knowledge planes feed reasoning: the *context layer* (everything about this event for this tenant) and the *knowledge layer* (everything the market knows — the brain Source entirely lacks today, built in Chapter 11). The *reasoning layer* (Chapter 5) is the new heart: it applies frameworks, produces recommendations, and emits envelopes carrying confidence, risk, and trace. The *engines* (Chapters 6–10) are the specialized reasoners — evaluation, negotiation, selection, contract, transition — each running on that spine and each emitting envelopes rather than prose. The *agents* (Chapter 12) orchestrate the engines and present a single governed voice. The *deliverables* (Chapter 15) serialize envelopes into documents. The *UX surfaces* (Chapter 14) render envelopes as decisions, with a cross-surface reasoning-trace panel that is the literal visual expression of the OS thesis: the user can always see why.

**The mapping discipline.** Notice that almost every block names a file that exists today. This is deliberate and it is the central message to the engineering team: the future state is overwhelmingly an *activation and re-architecture* of present assets, not a greenfield build. `award-decision-view.ts` already produces ranked vendors — it runs on fixtures and must be promoted to live derivation. `commercial-risk-detection.ts` already classifies eight risk types — it must be promoted from flag-checking to quantification. `context-quality.ts` already scores seven dimensions — it must be generalized into the confidence model. The seven specialists already exist as tested stubs — they must be wired into a registry and given live logic. The dormant archetype framework already specifies the governance ladder — it must be given a runtime call-site. The gap between Source-today and Source-as-operating-system is not invention; it is the insertion of one reasoning layer and the activation of capabilities that were specified before they were enforced.

### 4.9 The Shift, Stated Plainly

The future state can be reduced to one sentence the founder can repeat to an investor or a CIO advisory board: **Source stops generating documents and starts making decisions, and the documents become the receipts.**

Every philosophy in this chapter serves that sentence. The recommendation philosophy ensures decisions are defensible. The confidence philosophy ensures their certainty is honest. The risk philosophy ensures their exposures are owned. The governance philosophy ensures they are not made on insufficient evidence. The reasoning-first design principle ensures the decision exists as a structured, stored, auditable object before any prose is written. And the layered architecture ensures the whole thing is reconstructable, governed, and market-calibrated rather than a black box.

What follows in Volume 2 specifies the reasoning engine and the three decision engines — evaluation, BAFO, and selection — that turn this vision into a runtime. Volume 3 specifies the enterprise architecture — contract and transition intelligence, the market brain, the agent model, the data model, the UX, and the deliverable contract — that makes it an operating system rather than a feature. Volume 4 sequences the build, and explains why the reasoning spine must ship first: because, as this chapter has argued, in an operating system the reasoning *is* the system, and everything else is a peripheral that renders it.
