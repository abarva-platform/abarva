# AbarVa Source Intelligence Operating System Specification
## Volume 2 — Source Intelligence Engine

> Classification: Board-Grade, Confidential · 2026-06-19 · Grounded against branch `codex/corpus-wave-24`.
> Review verdict: **needs-minor-fixes**.

## Chapter 5 — The Reasoning Engine

Volume 1 argued the thesis; this chapter builds its spine. Everything that follows in Volumes 2 and 3 — the Evaluation Engine (Ch6), the BAFO Intelligence Engine (Ch7), the Selection Engine (Ch8), Contract and Transition Intelligence (Ch9–10) — is a specialized consumer of the contract defined here. If the Reasoning Engine is right, those engines are variations on a theme. If it is wrong, each becomes a one-off, and Source slides back toward the document factory it is today. The Reasoning Engine is therefore the single highest-leverage investment in the entire program, and the first thing Volume 4's roadmap ships.

The diagnosis from Volume 1's current-state assessment is precise and unforgiving. The live pipeline is `Event → Context Binder → Prompt Registry → Claude → Deliverable` (`src/lib/source/agent-generation/context-binder.ts`, `prompt-registry.ts`, `server.ts`, behind `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`). The context binder does real, careful work: `buildSourceGenerationContext` assembles a tenant-scoped `SourceGenerationContext` of event metadata, artifact states, gate-criterion states, and evidence states, never bridging across `client_keys`. The prompt registry holds three versioned templates (d01 strategy memo, d05 scope memo, d09 RFP pack). Then context and template are handed straight to Claude, and the markdown that comes back is persisted to `source_event_artifact_states.body` with a receipt in `body_generation_metadata`. **There is no step between context and prose where the system reasons.** No should-cost number is computed before the strategy memo asserts a target. No delivery-model gate is run before the scope memo recommends a boundary. The model is asked to be analyst, advisor, and author in one pass — and because the analysis is implicit, it cannot be inspected, challenged, cited, or trusted at board level.

This chapter specifies the fix in six parts: (1) the four-step pipeline that inserts **Analysis** and **Recommendation** between context and output; (2) the **Reasoning Frameworks Library** the Analysis stage applies; (3) the **Reasoning Envelope**, the canonical output contract that is the keystone of the OS; (4) the **Confidence, Risk, and Challenge** models that make recommendations defensible; (5) **pipeline observability** so every decision is traceable; and (6) the precise wiring that **activates the dormant archetype framework and grounded-refusal posture** into the live path.

### 5.1 The Four-Step Pipeline: Context → Analysis → Recommendation → Deliverable

**Why it matters.** Elite sourcing organizations do not write the recommendation first and reverse-engineer the analysis. They build a fact base, reason against it, form a defensible recommendation, and only then write the memo. Source today inverts this: the memo *is* the reasoning, fused and unrecoverable. The four-step pipeline restores the discipline by making Analysis and Recommendation first-class pipeline stages that produce structured, inspectable outputs *before* any prose is generated.

**What problem it solves.** It solves the four load-bearing gaps named in Volume 1 simultaneously: no reasoning layer (Analysis/Recommendation are now the layer), no reasoning trace (each stage emits a structured envelope), dormant analytical assets (should-cost, delivery-model gate, and proposal-normalization finally have a call-site), and binary confidence (confidence is computed at the Analysis stage, not asserted in prose).

**How it works.** The pipeline is a strict left-to-right sequence with a typed handoff between each stage.

```
                 ┌──────────────────────────────────────────────────────────┐
                 │  S0..S7 stage context · archetype · rigor level · gates   │
                 └──────────────────────────────────────────────────────────┘
                                          │
   ┌──────────────┐   SourceGenerationContext   ┌────────────────────────────┐
   │  1. CONTEXT   │ ─────────────────────────▶ │      2. ANALYSIS            │
   │ context-binder│  (tenant-scoped substrate,  │  framework selection +      │
   │   .ts (LIVE)  │   upstream bodies, evidence) │  execution → structured     │
   └──────────────┘                              │  findings + confidence      │
        ▲                                         └────────────────────────────┘
        │ evidence_states / artifact_states                    │ AnalysisResult[]
        │ gate_criterion_states                                ▼
   ┌──────────────┐                              ┌────────────────────────────┐
   │ canvas-       │                              │   3. RECOMMENDATION         │
   │ substrate     │   ◀── trace writes ───────── │  options → ranked rec +     │
   │ (LIVE 3-table)│                              │  challenge pass + risk +    │
   └──────────────┘                              │  REASONING ENVELOPE          │
                                                  └────────────────────────────┘
                                                              │ ReasoningEnvelope
                                                              ▼
                                                  ┌────────────────────────────┐
                                                  │   4. DELIVERABLE             │
                                                  │  prompt-registry + Claude    │
                                                  │  renders envelope → markdown │
                                                  │  → exports (Ch15 renderers)  │
                                                  └────────────────────────────┘
```

- **Stage 1 — Context (LIVE, unchanged contract).** `buildSourceGenerationContext` continues to produce `SourceGenerationContext`. No regression risk: the Analysis stage is additive, consuming the binder's existing output. This is deliberate — Volume 4 Phase 1 must not destabilize the one path that works.

- **Stage 2 — Analysis (NEW).** A new module, proposed at `src/lib/source/reasoning/analysis-stage.ts`, takes `SourceGenerationContext` plus the resolved archetype/rigor and produces an ordered set of `AnalysisResult` objects. It does *not* author prose. It runs the appropriate reasoning frameworks (§5.2), each emitting structured findings — a should-cost band, a delivery-model verdict, a proposal-normalization gap matrix — each carrying its own confidence and evidence references. This is where the should-cost (`should-cost/should-cost-model.ts`), delivery-model (`delivery-model/delivery-model-gate.ts`), and proposal-normalization (`proposal-normalization/proposal-normalization.ts`) modules get a live home in the deliverable pipeline. Note the nuance: should-cost *is* imported and called by the dormant `source-answer-engine.ts` (its `estimateEventShouldCost` call-site exists there, even though the module's own header comment still stalely reads "Standalone — NOT wired"), but it is **not** reached by the live `generate-route` path that ships prose today. The Analysis stage gives these modules their first live call-site on the generation path.

- **Stage 3 — Recommendation (NEW).** A new module at `src/lib/source/reasoning/recommendation-stage.ts` consumes `AnalysisResult[]` and produces exactly one `ReasoningEnvelope` (§5.3). It enumerates options, ranks them, runs the challenge model (§5.4) to adversarially test the leading option, attaches the risk profile, and computes the recommendation-level confidence band. The envelope is the stage's only output and the durable artifact of the system's thinking.

- **Stage 4 — Deliverable (EXTENDS the live path).** `prompt-registry.ts` and `server.ts` change in one disciplined way: the prompt builder receives the `ReasoningEnvelope` as bound context, and the system prompt is rewritten from "analyze and write a strategy memo" to "render this reasoning into board-grade prose — assert nothing the envelope does not support, cite the evidence the envelope carries, surface its caveats." The model's job collapses from *reasoning + writing* to *writing*, which is exactly the task it is most reliable at and least likely to fabricate within.

**Expected business value (illustrative range).** By separating reasoning from rendering, the same envelope drives the d-code deliverable, the UX reasoning panel (Ch14), the export payload (Ch15), and the audit trail — one analysis, many consumers. Internal modeling suggests this reuse alone removes a meaningful share of per-deliverable build effort (illustrative range: 30–50% less bespoke logic per new d-code) because new deliverables become new *renderers* of an existing envelope, not new analytical engines.

**Implementation implications.** The seam is `server.ts`. Today it calls binder → registry → Claude. Phase 1 inserts `analysis-stage` and `recommendation-stage` between binder and registry, gated behind a tenant feature flag so the legacy path remains the fallback until the envelope is proven on the ACA private DB with real data. The `generate/route.ts` contract to the UI is unchanged; only the body's provenance changes.

### 5.2 Reasoning Frameworks Library

**Why it matters.** Source's current intelligence is encoded as five hardcoded playbooks inside `source-answer-engine.ts` (CDP, Contact Center AI, Store Productivity, AMS Outsourcing, Platform Sourcing). Hardcoded playbooks are a liability: they cannot be updated without a code change, they do not compose, and they bias every analysis toward the five categories someone happened to write. Elite firms do not carry five playbooks; they carry a *library of reasoning methods* and select among them by situation. The Frameworks Library encodes that distinction.

**What problem it solves.** It replaces brittle, category-specific prose playbooks with composable, situation-selected analytical methods — directly addressing Volume 1's "fixture playbooks" intelligence gap and the dormant-archetype gap.

**How it works.** A framework is a pure function with a typed contract: `(SourceGenerationContext, FrameworkParams) → AnalysisResult`. The seed library reuses what already exists:

| Framework | Source module (today) | Produces | Selected when |
|---|---|---|---|
| Should-cost baseline | `should-cost/should-cost-model.ts` (`buildShouldCostEstimate`) | Role-mix blended-rate cost band with effort drivers | Strategy/value-target stages; any archetype with a build/SI motion |
| Delivery-model gate | `delivery-model/delivery-model-gate.ts` (`runDeliveryModelGate`) | Build / buy / partner / SI verdict + rationale | Scope/strategy stages; before boundary recommendations |
| Proposal normalization | `proposal-normalization/proposal-normalization.ts` | 8-dimension comparability matrix + gap flags | Responses/evaluation/BAFO; when ≥2 vendor proposals parsed |
| Two-gap maturity | (NEW, extends `context-quality.ts`) | Foundation-gap vs use-case-gap split | Intake/strategy; AI-data-platform archetype |
| Archetype-method set | `classifier/category-classifier.ts` + method registry (NEW) | Ordered list of methods to run for this archetype×estate | Every stage; selection is the resolver's job |

**Selection logic.** The archetype resolver (§5.6) returns, for a given `(archetype, estate, stage, rigor)`, an ordered list of framework ids. `SourceRigorLevel` (`'standard' | 'enhanced' | 'strategic'` on `types.ts`) modulates depth: `standard` runs the minimum set, `strategic` runs the full set plus the challenge pass at higher intensity. Frameworks compose because each emits an `AnalysisResult` in the same shape; the Analysis stage simply concatenates them and lets the Recommendation stage reconcile.

**Why this beats hardcoded playbooks.** A playbook says "for AMS outsourcing, recommend X." A framework set says "for AMS×large-estate at enhanced rigor, run should-cost + delivery-model + proposal-normalization, then reason over their outputs." The first is an opinion frozen in code; the second is a method that produces an opinion from this event's evidence. New archetypes (Volume 1 names the 4→12 archetype extension) require *data* — a new resolver entry — not new analytical code.

**Implementation implications.** The deterministic frameworks already exist as functions; the new work is the registry (`src/lib/source/reasoning/framework-registry.ts`) and the resolver binding. Critically, the framework modules must be callable from both the dormant answer engine and the new Analysis stage so both call the same code — one definition, two callers. The proposal-normalization chain has a real dependency the table understates: comparing vendor *documents* requires rich binary parsing (docx/pdf/xlsx response files), which is a **net-new capability for Source**. `text-parser.ts` is the synchronous first-mile parser for text-like uploads only (pasted notes / Markdown / text / CSV via `extractLabeledLines` / `extractPricingComponents`); it does not parse binary formats. Binary parsing must either be built net-new for Source or reuse the Moves-side async pipeline (`src/lib/programs/` doc-parser and attachments/extract-text). The proposal-normalization framework reasons over *already-parsed* proposals; it does not itself unlock binary parsing.

### 5.3 The Reasoning Envelope — Canonical Output Contract

**Why it matters.** This is the keystone. Volume 1's Confidence and Recommendation philosophies both reduce to a single demand: *every recommendation must carry the reasoning that produced it.* The Reasoning Envelope is the structured contract that makes this enforceable rather than aspirational. It is the unit that flows from the Recommendation stage to the deliverable prompt, to the UX reasoning panel, to the export payload, and to the audit store — the system's single source of reasoning truth.

**What problem it solves.** Volume 1's "no standardized reasoning output" and "binary confidence" gaps. Today, reasoning components emit prose only; nothing is machine-readable, nothing is auditable, nothing can be re-rendered in a different surface without re-running the model.

**How it works — the contract.** The envelope, proposed at `src/lib/source/reasoning/reasoning-envelope.ts`, extends the existing `agent-mission-report.ts` and `multi-agent-types.ts` shapes (which already carry `primaryFinding`, `confidence`, `risks`, `evidenceNotes`) rather than inventing a parallel vocabulary:

```
ReasoningEnvelope {
  envelopeId:        string            // persisted; the durable reasoning artifact
  eventId, tenantKey, stage, archetype, rigor
  claims: Claim[]                       // each assertion the system is willing to stand behind
  evidence: EvidenceRef[]               // citations into evidence_states / parsed artifacts
  assumptions: Assumption[]             // tested → {accepted | rejected} with reason
  confidence: ConfidenceBand            // multi-factor, calibrated (§5.4)
  caveats: Caveat[]                     // limits scoped to rigor level
  decisionTrace: TraceStep[]            // frameworks run, options weighed, why this won
  refusal?: RefusalRecord               // present when grounded-refusal fired (§5.6)
}

Claim {
  id, text,
  supportedBy: evidenceRefId[],         // a claim with zero support is a hard violation
  confidence: ConfidenceBand,
  challenged: boolean                   // did the challenge model test this? (§5.4)
}

EvidenceRef { id, sourceArtifactCode?, evidenceStateId?, citation, readinessState }

Assumption { id, statement, status: 'accepted' | 'rejected', reason, evidenceRefId? }
```

**The enforcement rule that makes it real:** *a Claim with an empty `supportedBy` array is a quality-gate failure, not a warning.* This is the structural expression of evidence-or-refuse. The deliverable prompt is forbidden from asserting anything not present as a supported `Claim`; the per-deliverable quality gate (Ch15) reads the envelope and rejects the body if it introduces unsupported assertions. This is how "0 unsupported claims, 0 leaks" stops being a prompt instruction (which models violate) and becomes a contract (which is checked).

**How consumers use it.** The deliverable renderer (Ch15) walks `claims` and `caveats` to produce prose. The UX reasoning panel (Ch14) renders `decisionTrace`, `evidence` weights, and `confidence` bands. The export payload binds envelope fields to docx/xlsx cells. The audit store persists the whole envelope keyed by `envelopeId`. One reasoning act, four faithful renderings.

**Expected business value.** Defensibility. A CIO advisory board can ask "why this vendor?" and receive not a paragraph but a traversable trace: these claims, supported by this evidence at this readiness, these assumptions tested and these rejected, at this calibrated confidence, with these caveats. That is the trust currency on which an enterprise sourcing OS is sold.

**Implementation implications.** The envelope needs a home in the data architecture (Ch13 specifies the `reasoning_envelopes` table with RLS). Phase 1 can persist it as JSON alongside `body_generation_metadata` before the dedicated table lands, so the contract ships before the schema migration.

### 5.4 Confidence, Risk & Challenge Models

Three cross-cutting models feed the envelope. Each is a pure, testable function so the reasoning is reproducible and auditable.

**The Confidence Model.** Volume 1's Confidence philosophy demands a move from binary/ternary to multi-factor, explainable confidence. The model (extending `context-quality.ts`) computes a `ConfidenceBand` from four weighted factors:

```
confidence = f( evidence_sufficiency,   // how much required evidence is at Usable state
                evidence_recency,        // staleness penalty (evidence-requirements ramp)
                corroboration,           // independent sources agreeing
                model_uncertainty )      // self-reported + structural (e.g. single-source)
→ band ∈ {low | moderate | high} + numeric interval + the factor breakdown
```

The factor breakdown is carried in the envelope, so a `moderate` is never opaque: the panel can show "moderate — driven down by stale incumbent-contract evidence (Parsed, not Usable) despite strong corroboration." Calibration matters more than precision: a `high` that is wrong twice destroys trust faster than a `moderate` that is honest.

**The Risk Model.** Volume 1's Risk philosophy demands quantified, owned, mitigable risk. The model promotes the deterministic `RISK_PATTERNS` in `commercial-risk-detection.ts` (today five: pricing-anomaly, scope-ambiguity, governance-gap, evidence-deficit, contract-trap) from flag-checking to a scored profile:

```
risk_score = impact × probability × (1 − mitigability)
each risk → { id, pattern, impact, probability, mitigability, owner, mitigation, residual }
```

Risks attach to the envelope and to specific claims, so the Selection Engine (Ch8) can risk-adjust a ranking using the same risk objects the Analysis stage produced — no recomputation, no divergence.

**The Challenge Model (red-team).** This is the most distinctive of the three and has no analogue in the current code. Before any recommendation surfaces, the Challenge Model adversarially tests it: it constructs the strongest case *against* the leading option, probes each high-weight claim for single-source dependence, and checks whether a plausible swing in a key assumption flips the recommendation (a hook the Evaluation Engine's weight-sensitivity analysis, Ch6, reuses directly).

```
challenge(rec) → { steelman_against, fragile_claims[], assumption_flips[], verdict }
verdict ∈ { holds | holds_with_caveats | does_not_hold }
```

A `does_not_hold` verdict forces the Recommendation stage to either revise the recommendation or downgrade confidence and add caveats — it cannot surface an unchallenged or failed recommendation as `high` confidence. This is how the OS encodes the discipline that separates an advisor from a generator: the willingness to argue against its own conclusion before presenting it.

**Expected business value.** Negotiation leverage and decision confidence are the two highest-value outcomes in sourcing. Calibrated confidence and adversarial challenge are precisely what let a CXO act on a recommendation rather than re-litigate it — compressing the executive decision cycle (illustrative range: days to hours for board-grade award packets) because the dissent has already been captured and answered.

### 5.5 Pipeline Observability & Reasoning Trace

**Why it matters.** A reasoning system you cannot inspect is a black box, and enterprises do not buy black boxes for governed procurement decisions. Observability is not a nice-to-have bolted on after — it is how the OS earns its audit posture and powers the Ch14 reasoning panels.

**What problem it solves.** Volume 1's observability gap: today `body_generation_metadata` captures model, tokens, and stop reason — generation telemetry, not *reasoning* telemetry. There is no record of what evidence was retrieved, which frameworks ran, which mode was selected and why, or the score at each decision point.

**How it works.** The trace store (extending `evidence-trace/evidence-trace.ts` and the `agent-generation/types.ts` metadata) records a `TraceStep[]` for every pipeline run:

```
TraceStep { step, input_refs, framework?, decision, score?, confidence?, model_meta?, ts }
```

Steps cover: evidence retrieved (with readiness states), archetype resolved (and why), frameworks selected and their outputs, options enumerated and ranked, the challenge verdict, and the final model call's metadata (preserving today's `model/tokensIn/tokensOut/stopReason`). The trace is written transactionally to the canvas substrate alongside the envelope, keyed by `envelopeId`, so audit and UX read the same record.

**Expected business value.** The trace is the evidence bundle the release-control discipline already demands (lineage, parser used, citations, retrieval proof). It turns "we generated a memo" into "here is the auditable chain from evidence to recommendation," which is the difference between a demo and a pilot-ready system.

**Implementation implications.** The trace and the envelope share a write path; persist both in one transaction so a recommendation can never exist without its trace. This is a hard invariant, enforced at the data layer (Ch13).

### 5.6 Activating the Dormant Archetype Framework

**Why it matters.** The Source Event Archetype Framework — 4 archetypes (AMS / ERP-SI / AI-data-platform / renewal), the two-axis archetype×estate resolver, the 10-method library, the promotion-only evidence ladder, and the governed grounded-answer with refusal — is the governance backbone of the future state. It is built. It is dormant. Activating it is the single act that converts the dormant assets into the live reasoning spine.

**What problem it solves.** Three Volume 1 gaps at once: the dormant archetype framework (no runtime call-site), the absent grounded-refusal posture, and the unenforced gates (archetype drives evidence thresholds and gate strictness).

**The precise wiring — what must change, named exactly.** Three swaps, in order, and one crucial correction.

1. **Classify at intake.** Today `classifySourcingEvent` (`classifier/category-classifier.ts`) is invoked only inside the dormant `source-answer-engine.ts` (the `classifyEventCategory` seam) and in fixtures — never in the live deliverable pipeline. Move classification to event creation, persisting `archetype` and `SourceRigorLevel` onto the `source_events` row via the `types.ts` seam, so every downstream stage reads a resolved archetype.

2. **Drive framework and evidence-threshold selection by archetype.** The archetype resolver (a *new* `src/lib/source/reasoning/archetype-resolver.ts`, two-axis archetype×estate) returns the ordered framework set (§5.2) and the evidence thresholds the gate model must enforce. **Correction, per the canonical record:** this resolver is net-new reasoning logic. It must *not* be conflated with `source-shape-resolver.ts`, which is the UI `WorkingPaneShapeResolver` (and the source of the divergent UI stage labels — S1/S3/S6/S7 — that diverge from the canonical stage-pack scheme `S0_intake..S7_activate`, where S2=shortlist, S3=rfp, S5=bafo, S6=contract, S7=activate). The archetype resolver is an analytical seam; the shape resolver is a presentation seam. They are different concerns and must stay separate files.

3. **Route the grounded answer through the governed refusal path.** This is the heart of the activation. The Recommendation stage must be able to *refuse* — to decline to recommend a vendor or advance a stage when evidence is insufficient — and record that refusal as a `RefusalRecord` in the envelope. This posture is **ABSENT/net-new** and wires into `source-answer-engine.ts`, which currently has no live generate-route call-site (its only live entry is the read-only `nexus/ask` stub). **Crucial ground-truth correction:** `disclosure-flag/` is a *shipped legal-privilege classifier* (attorney-client / work-product, with downstream inheritance) — it is **not** the refusal mechanism. The refusal posture is new logic in the reasoning layer, not a repurposing of disclosure-flag.

The refusal contract:

```
if requiredEvidence(stage, archetype).anyBelow(UsableEvidence) for a gate-defining claim:
    → emit ReasoningEnvelope { refusal: { reason, missingEvidence[], minimumDataRequest } }
    → deliverable stage renders the refusal + minimum-data-request, NOT a fabricated rec
    → gate model reads the refusal and holds the stage (Steward voice; Ch12)
```

This is the promotion-only evidence ladder made operational: evidence climbs the readiness states (Not Requested → Loaded → Parsed → Available → Usable Evidence), with two off-ramp states — **Stale** and **Low Confidence** — that the governance rank treats as disqualifying (both rank below Not Requested). Only `Usable Evidence` can support a gate-defining claim; `Stale` or `Low Confidence` evidence is explicitly demoted. Below the usable bar, the system says so — and says precisely what data it needs — rather than guessing.

**Expected business value.** This is the IP that makes Source defensible. A system that *refuses to fabricate* and *names the missing evidence* is categorically more valuable to a CIO than one that always produces a confident-sounding memo. It converts governance from friction into the product's central trust feature — the exact reframe Volume 1's Governance philosophy demands.

**Implementation implications.** Sequencing is strict: classification at intake (1) is a small, low-risk change that unblocks everything; the resolver (2) is new but pure and testable; the refusal path (3) is the highest-value and highest-care change and must be live-proven on the ACA private DB against real evidence states — not fixtures — before it is trusted to hold a stage. Volume 4 Phase 1 ships all three behind the tenant flag, with the legacy path as the fallback until the first real refusal is observed end-to-end.

### Chapter Summary

The Reasoning Engine inserts two new stages — Analysis and Recommendation — between the live context binder and the deliverable, turning an implicit, unrecoverable reasoning act into an explicit, inspectable one. The Frameworks Library replaces five hardcoded playbooks with composable, archetype-selected methods that already exist in the codebase. The Reasoning Envelope is the keystone contract — claims, evidence, assumptions, confidence, caveats, and decision trace — that flows to every downstream consumer and makes "no unsupported claims" a checked invariant rather than a hope. The confidence, risk, and challenge models make recommendations calibrated and adversarially tested. Observability captures the full reasoning trace as audit evidence. And activating the dormant archetype framework — classify at intake, resolve frameworks and thresholds by archetype, and route through the net-new grounded-refusal path — converts built-but-dormant assets into the live spine on which Chapters 6 through 16 depend. Build this first, prove it on real data, and the rest of the operating system becomes specialized renderers of a reasoning contract that already holds.

---

---

## Chapter 6 — The Vendor Evaluation Engine

### 6.1 Engine Mandate, Inputs and Outputs

Evaluation is the moment a sourcing event stops being about *what we want* and becomes about *which vendor delivers it best*. It is the hinge of the entire lifecycle: everything upstream (strategy, scope, RFP) exists to provoke comparable vendor responses, and everything downstream (BAFO, selection, contract) inherits whatever the evaluation concludes. If the evaluation is defensible, the award is defensible; if the evaluation is a spreadsheet of opinions, the award is a coin flip dressed in a memo. This is why elite operators treat evaluation as a *discipline* — calibrated, multi-rater, evidence-anchored — and not as a scoring chore. Volume 1, Chapter 3 established the standard. This chapter specifies the engine that encodes it.

The honest current-state baseline matters here. Today there is no evaluation *engine*. There is `src/lib/source/scorecard.ts` — a 39-line module that counts criteria (`countRequiredCriteria`, `countApprovedCriteria`) and labels an approval state. There is the d16 scorecard *template* (`src/content/source-templates/evaluation/d16_scorecard.md`) — a markdown stub with an empty `Vendor × criteria matrix` table and a `§4 · Deviation log` section that describes the right discipline in prose but computes nothing. There is a `scorecard-payload.ts` binder that, by its own header comment, "errs on the side of producing SOME content rather than blocking the download," parsing vendor names out of the d12 shortlist body and falling back to "Vendor A / B / C" when nothing is authored. And there is `award-decision-view.ts`, whose `VendorScoreCard` (commercial / technical / transition / risk / overall, each 0–100) is real in shape but `deterministicSeed: true` — hardcoded fixture vendors C, B, A. In one sentence: **Source today renders a scorecard; it does not produce one.** The numbers are display, not derivation.

The Vendor Evaluation Engine closes that gap. Its mandate is to consume the artifacts of the Responses and Evaluate stages and *derive* a ranked, confidence-bounded, evidence-anchored vendor comparison that the Selection engine (Chapter 8) and Executive Cockpit (Volume 3, Chapter 14) can consume without re-litigation.

```
                    THE VENDOR EVALUATION ENGINE
  INPUTS                          ENGINE                         OUTPUTS
┌──────────────────────┐   ┌──────────────────────────┐   ┌────────────────────────┐
│ d13 vendor responses │──▶│ 1. INGEST & NORMALIZE     │   │ Consensus scores       │
│ (text-like: text-    │   │    parse → criterion cells│   │  (per vendor×criterion)│
│  parser; binary =    │   ├──────────────────────────┤   ├────────────────────────┤
│  net-new pipeline)   │   │                          │   │                        │
│ d12 vendor shortlist │──▶│ 2. WEIGHTED MULTI-RATER   │──▶│ Ranked vendors w/       │
│ d17 weight set (gov) │   │    SCORING & AGGREGATION  │   │  weighted totals       │
│ d16 scorecard criteria│  ├──────────────────────────┤   ├────────────────────────┤
│ evidence_states      │──▶│ 3. CONSENSUS & DEVIATION  │   │ Deviation flags +      │
│ (canvas substrate)   │   │    >threshold → re-rate   │   │  re-rate worklist      │
│ rater submissions    │──▶│ 4. CONFIDENCE & SENSITIVITY│──▶│ Confidence band/criterion│
│ (new entity)         │   │    weight what-if        │   │ + rank-flip warnings   │
│ security/arch reviews│──▶│ 5. EVIDENCE ANCHORING     │   │ d16/d17/d18 + Reasoning│
│ demo/reference notes │   │    cite or disqualify    │   │  Envelope (Ch5)        │
└──────────────────────┘   └──────────────────────────┘   └────────────────────────┘
```

**Inputs.** The engine consumes five live or near-live sources: (1) parsed vendor responses (`d13_vendor_responses`). Here the honest dependency must be stated: `src/lib/source/artifact-registry/text-parser.ts` is the synchronous first-mile parser for *text-like* uploads only — pasted notes, Markdown, plain text and CSV (`extractLabeledLines` / `extractPricingComponents`, parser id `source_text_first_mile_v1`). It does **not** import mammoth, pdf-parse or exceljs and does **not** parse docx / pdf / xlsx vendor responses. Rich binary vendor-document parsing is therefore a *net-new capability for Source* — it must either be built or reuse the asynchronous Moves-side pipeline (`src/lib/programs/` doc-parser and `attachments/extract-text`, which do use mammoth/pdf-parse); (2) the governed weight set (`d17_weight_log`); (3) the criteria definitions (`ScorecardCriterion[]` on `ScorecardGovernance` in `src/lib/source/types.ts`); (4) per-rater score submissions (a *new* persisted entity, specified in §6.2 and Volume 3, Chapter 13); and (5) the evidence state rows from the canvas substrate (`evidence_states` via `src/lib/source/canvas-substrate/queries.ts`). Security, architecture and reference inputs enter as evidence rows that anchor specific criteria.

**Outputs.** The engine emits four things, all bound to the Reasoning Envelope defined in Chapter 5: a **consensus score** per vendor-criterion cell with its supporting evidence citations; a **ranked vendor list** with weighted totals; a **deviation and disqualification record** (the d18 rationale with an evidence chain); and a **confidence-and-sensitivity profile** (per-criterion confidence bands plus weight-sensitivity rank-flip warnings). These are not prose — they are structured, auditable, and consumable by both the next engine and the UI reasoning panels. The d16 / d17 / d18 markdown deliverables become *renderings* of this structure, not its source of truth. This is the OS thesis applied to evaluation: the document is the artifact of the reasoning, not the reasoning itself.

*Why it matters:* a defensible evaluation is the single largest determinant of award defensibility and the primary input to negotiation leverage. *What it solves:* it replaces a display-only scorecard and fixture-seeded award view with a derived, contestable, board-grade ranking. *Business value (illustrative range):* organizations that move from ad-hoc to calibrated, evidence-anchored evaluation typically reduce post-award disputes and re-procurements and tighten realized-versus-promised value by a meaningful margin — and, more importantly, they can *defend the decision* when a losing vendor protests or a board challenges it.

### 6.2 Scoring, Weighting and Consensus Mechanics

The core of the engine is a **weighted multi-rater consensus model**. Three sub-mechanics compose it: weight governance, per-rater scoring with aggregation, and deviation-triggered reconciliation.

**Weight governance (d17).** Weights are not an evaluator's private preference; they are a *governed instrument* set before responses are seen, signed off by the EA council and sponsor, and locked. The d17 weight log template already prescribes this discipline — "Versioned weight sets with EA / sponsor / Steward signatures and rationale," with a `§2 · Version history` capturing what moved and why. The engine operationalizes it: a `WeightSet` is a versioned object of `{ criterionId, weight, approvedBy, approvedAt, rationale }` rows that must sum to 100 and must be *locked* (an immutable version) before any rater score is admitted. Locking before scoring is the structural defense against the oldest evaluation manipulation in sourcing — quietly re-weighting after the bids are in to favor a preferred vendor. The engine refuses to aggregate against an unlocked or post-submission-mutated weight set; that refusal is the evaluation-stage instance of the governed-insufficiency posture (ABSENT today, net-new per Volume 1) wiring into the scoring path.

**Per-rater scoring and aggregation.** Each criterion is scored by multiple raters on a fixed scale. The repo carries two *source* rubrics that must be reconciled at the engine boundary: the d16 template states a 1–100 scale, while `scorecard-payload.ts` defaults to "a standard 1-5 procurement rubric." The engine canonicalizes both onto a single **0–100 normalized scale** (matching `award-decision-view.ts`'s `VendorScoreCard`, where commercial/technical/transition/risk are each 0–100), and converts any rubric-native 1–5 inputs by anchored mapping (each rubric level carries a descriptor and an evidence requirement, so the conversion is deterministic, not arithmetic rounding). A vendor-criterion *consensus score* is the rater-mean after deviation reconciliation; the vendor's *weighted total* is the sum over criteria of `consensusScore × (weight/100)`.

```
   WEIGHTED CONSENSUS — worked shape (illustrative)
   criterion      weight   raterA  raterB  raterC   consensus   contribution
   Capability       30      82      78      85         81.7         24.5
   Security         25      70      72      90 (!)     reconcile     —
   Cost             20      88      85      86         86.3         17.3
   Transition       15      74      76      72         74.0         11.1
   Roadmap          10      80      82      79         80.3          8.0
                   ───                                            ───────
                   100                              weighted total ≈ 60.9+Security
   (!) Security shows >5-pt spread (raterC 90 vs raterA 70) → deviation flag → re-rate
```

**Consensus, deviation and re-rate.** Calibration is where elite evaluation separates from amateur scoring. The d16 template already names the threshold — "Where multiple raters disagreed by more than 5 points, the reconciliation" — and the two legitimate resolutions: raters converge after discussion (new score logged), or Steward arbitrates with rationale. The engine encodes this as a state machine on each cell: `scored → deviation_flagged → reconciled` (or `→ arbitrated`). A cell with rater spread above the configured deviation threshold (default 5 points on the 0–100 scale, archetype-tunable) is *blocked from contributing to the weighted total* until reconciled — the consensus is not silently averaged across a genuine disagreement. This produces a **re-rate worklist** surfaced in the Evaluation Workbench (Volume 3, Chapter 14): every flagged cell, the disagreeing raters, the spread, and the evidence each rater cited. Reconciliation outcomes are appended to the deviation log, which becomes d16 §4.

**Blind versus open modes.** The engine supports both. In *blind* mode raters score without seeing peers' scores or identities until all submissions are in (the default for high-rigor `strategic` events per `SourceRigorLevel`), which removes anchoring and seniority bias. In *open* mode raters score collaboratively (acceptable for `standard`-rigor renewals where speed outweighs independence risk). The mode is selected by archetype × rigor, the same two-axis selection logic Chapter 5 specifies for framework selection — extending the dormant archetype seam (`src/lib/source/classifier/category-classifier.ts`, `types.ts` `SourceRigorLevel`) into the scoring contract rather than inventing a parallel one.

**The d16/d17 generation contract.** d17 is generated first (the locked weight set), then d16 (the populated matrix). The d16 generator's contract: given a locked d17 weight set, the parsed d13 responses, and the rater submissions, produce the §2 vendor×criteria matrix with consensus scores, the §3 per-criterion rationale with citations, and the §4 deviation log — and refuse to emit a "weighted total" column where any contributing cell is still `deviation_flagged`. The `scorecard-payload.ts` binder is the seam this extends: today it parses vendors from d12 and falls back to placeholders; tomorrow it binds to real rater submissions and real consensus scores, and the renderer (`src/lib/source/exports/renderers/scorecard.ts`) renders derived numbers.

*Why it matters:* unweighted or post-hoc-weighted scoring is the most common way a "rigorous" evaluation is quietly gamed. *What it solves:* it makes weight a locked, signed instrument and makes disagreement visible and reconciled rather than averaged away. *Business value:* defensibility against vendor protest and board challenge; calibrated scores are the only credible input to negotiation leverage (Chapter 7).

### 6.3 Evidence-Anchored Scoring and Disqualification

The governing rule, stated in the d16 template itself, is absolute: **"No score without evidence."** Today this is a sentence in a markdown stub. The engine makes it a hard constraint.

Every consensus score must link to one or more evidence citations. An evidence citation is not a free-text note; it is a reference into the substrate — a parsed span of a vendor response (`d13`, via the text-like first-mile parser or, for binary documents, the net-new/Moves-side parsing pipeline noted in §6.1), an evidence row in `evidence_states`, a security review finding, a reference-check note — carried as a structured pointer (artifact code, location/offset, and the readiness state of that evidence). This is precisely the `evidenceCitations` mechanism Chapter 5 specifies for the Reasoning Envelope and that the dormant `source-answer-engine.ts` already gestures at (its `rankAnswerEvidence` pulls "top-8 ranked evidence from live tenant context"). The Evaluation Engine reuses that contract rather than minting a new one: each score-cell carries the evidence that produced it, and the per-criterion rationale (d16 §3) is generated *from* those citations, never asserted around them.

The discipline forces an honest distinction the current system cannot make: a score of 85 on Security anchored to a vendor's parsed SOC-2 attestation and a clean architecture-review finding is materially different from a score of 85 a rater typed with no citation. The engine surfaces the difference as *evidence sufficiency* per cell (a direct reuse of `context-quality.ts`'s `evidenceCoverage` dimension, scored 0–5), and that sufficiency feeds the confidence model in §6.4. An evidence-thin score is not forbidden, but it is *flagged and discounted* — a high score on thin evidence carries a low confidence band, and the CXO sees both.

**Disqualification with an evidence chain (d18).** The d18 disqualification log template prescribes two cases: vendors "scored below threshold or excluded," and the subtler "below-threshold but advancing" — a vendor below threshold on one criterion that other criteria offset, where "the rationale and the trade-off explicit." The engine generates both with their evidence chains. A disqualification is never "Vendor X scored low"; it is "Vendor X scored 38 on Security (threshold 60), anchored to: no SOC-2 attestation provided (d13 response gap), one open critical finding in the architecture review (evidence row ER-114), and an exit-clause that violates the d05 scope constraint — disqualified per GATE-EVALUATE rationale, approved by Steward." This is the difference between a disqualification a vendor's counsel can overturn and one they cannot. The evidence chain is what makes a "no" survive a protest.

This is also where the `disclosure-flag/` classifier (SHIPPED, per Volume 1) does real work *without* being a refusal mechanism: where an evidence citation references legal-privileged content (an attorney-client review of a vendor's contract posture), the disclosure flag inherits onto the d18 rationale, ensuring privileged reasoning is correctly partitioned in the rendered output and not leaked into a vendor-shareable debrief. The engine reads the flag and routes the privileged citation into the internal-only rationale band, leaving a disclosable summary in its place.

*Why it matters:* unevidenced scores and unevidenced disqualifications are the two largest sources of legal and reputational exposure in vendor selection. *What it solves:* it makes "no score without evidence" a system constraint instead of an aspiration, and makes every disqualification defensible. *Business value:* materially reduced protest exposure and faster, cleaner debriefs; the evidence chain is reusable as the audit record.

### 6.4 Confidence and Sensitivity Analysis

A board does not just need a ranking; it needs to know *how much to trust it* and *how fragile it is*. These are two distinct questions, and the engine answers both.

**Score confidence.** Confidence on a consensus score is not binary and not the model's self-reported certainty. It is a multi-factor composite, reusing the philosophy Chapter 5 establishes and the existing dimensional scorer in `src/lib/source/context-quality.ts`, which already defines `evidenceCoverage`, `patternGrounding`, `eventStateGrounding`, `missingInputAwareness` and an `overallConfidence` label (low / medium / high) over a 0–5 scale with explicit `thresholds` (`DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS`). The Evaluation Engine extends this from "context quality of an answer" to "confidence of a score" by composing four factors per cell:

| Factor | Source | Effect on confidence |
|---|---|---|
| Evidence sufficiency | `context-quality.evidenceCoverage` (0–5) | thin evidence → lower band |
| Rater corroboration | inverse of post-reconciliation spread | high agreement → higher band |
| Evidence recency | readiness state + staleness flag on `evidence_states` | stale evidence → lower band |
| Response completeness | d15 response-completeness signal | gaps in the response → lower band |

The composite yields a **confidence band** per cell and rolls up to a per-vendor and per-criterion band, surfaced as low / medium / high with the contributing reasons (mirroring `context-quality`'s `missingContextReasons` array). The CXO sees not "Vendor B: 81" but "Vendor B: 81, *medium* confidence — Security score rests on a single uncorroborated reference and one stale evidence row." This is the trust currency of the OS: a calibrated, explainable confidence the board can act on.

**Weight-sensitivity analysis.** The fragility question is distinct and arguably more important: *would the ranking survive a defensible change in weights?* The engine runs a **what-if model** over the locked weight set — the canonical question from the master outline: "if reliability weight +10pts, does the ranking flip?" Mechanically, the engine perturbs each criterion weight within a plausible band (e.g., ±10 points, re-normalized to 100) and recomputes the ranking, recording any **rank-flip** and the *minimum perturbation* that causes it. A ranking where Vendor B leads Vendor A only if Cost is weighted ≥22% — and flips below that — is a *fragile* recommendation; one that holds across the entire plausible weight envelope is *robust*. The output is a sensitivity profile: the rank order, the rank-flip thresholds, and a robustness verdict.

```
   SENSITIVITY — rank-flip detection (illustrative)
   base ranking:  1) Vendor B (60.9)   2) Vendor A (59.4)   3) Vendor C (52.1)
   perturb Cost weight 20→ : flip at Cost ≤ 14% (A overtakes B)  ← FRAGILE
   perturb Security 25→    : no flip across ±10pts             ← robust
   verdict: B-over-A ranking is SENSITIVE to Cost weighting; surface to board.
```

This is what turns a scorecard into a *decision instrument*. The Evaluation Workbench (Volume 3, Chapter 14) renders the sensitivity slider live; the Selection engine (Chapter 8) consumes the robustness verdict directly into its recommendation confidence. The seam this extends is `award-decision-view.ts` — today its `decisionReadiness` (`ready | conditional | not_ready`) and `keyDecisionFactors` are fixture-seeded; tomorrow they are *derived* from the sensitivity profile and the confidence rollup.

*Why it matters:* a confident-looking ranking that flips on a 2-point weight change is a liability presented as a recommendation. *What it solves:* it separates *how trustworthy* from *how fragile* and surfaces both to the decision-maker. *Business value:* fewer reversed awards, faster board sign-off (a robust ranking shortens deliberation), and a documented robustness record that itself defends the decision.

### 6.5 Executive Reporting Output

The engine's terminal output is a board-grade evaluation summary that the Selection engine and Executive Cockpit consume without re-deriving anything. This is where the missing payload binding is closed.

The output is the d16 scorecard plus a **Reasoning Envelope** (Chapter 5) carrying: the ranked vendors with weighted totals; per-criterion consensus scores with their evidence citations; the deviation log and its reconciliations; the confidence bands; the sensitivity profile with rank-flip thresholds; and the d18 disqualification rationale. Critically, this envelope is *structured and persisted* (Volume 3, Chapter 13 specifies the `reasoning_envelopes` and `scorecard_submissions` entities), so the Selection engine reads consensus scores and confidence directly rather than re-parsing a markdown body — eliminating the lossy re-extraction that the current fixture-bound `vendor-selection-readiness.ts` performs (it imports `getSourceEventSeed` from `mock-seed` and derives viability by string-matching "pricing" / "template" / "missing" in artifact text).

The export binding is the concrete near-term gap. The renderer (`src/lib/source/exports/renderers/scorecard.ts`) and payload builder (`src/lib/source/exports/payloads/scorecard-payload.ts`) exist, and Volume 1 confirms format parity across docx/xlsx/html. What is missing is the *binding* of that payload to derived data: today `scorecard-payload.ts` parses vendors from d12 and weights from d17 with placeholder fallbacks; the engine replaces those fallbacks with real consensus scores, real confidence bands, and real deviation records. The renderer additionally gains a cells-to-citations binding so the exported scorecard can expose, per cell, the evidence that anchors it — making the *exported* document as auditable as the live surface. (PDF rendering already works: `render-pdf/route.ts` imports `@react-pdf/renderer`, gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and returns HTTP 200 with a PDF buffer for the wired artifact codes — d05/d09/d24/d27 — returning 404 for codes not yet wired. The real work for the evaluation summary is *extending* PDF coverage to the remaining codes such as d25/d26/d28 and adding signature blocks; that extension is sequenced in Volume 4, Phase 4 alongside the board packet, while the d16/d17/d18 summary ships as docx/xlsx/html until those codes are wired.)

The handoff contract to Selection is explicit and structured: `{ rankedVendors[], consensusScores[], confidenceBands[], sensitivityProfile, disqualifications[], reasoningEnvelopeRef }`. The Selection engine (Chapter 8) applies risk adjustments and tie-break logic *on top of* this — it never re-scores. This separation of concerns — evaluation derives the calibrated ranking, selection risk-adjusts and recommends — is the same engine-boundary discipline that runs through Volume 2, and it is what lets each engine be tested, audited and trusted independently.

*Why it matters:* an evaluation that cannot be cleanly consumed downstream gets re-litigated at every stage, and re-litigation is where defensibility leaks. *What it solves:* it persists evaluation reasoning as a structured, citable envelope and binds the export to derived (not placeholder) data. *Business value:* a single source of evaluation truth from the workbench to the board deck to the contract record — and a measurable lift in reasoning-trace coverage, the program metric Volume 4 governs the build against.

### 6.6 Engine Summary and the Maturity Delta

The Vendor Evaluation Engine converts the most consequential stage of the lifecycle from a display surface into a reasoning engine. The table below states the delta precisely, grounded in real files.

| Capability | Today (controlling file) | Engine target |
|---|---|---|
| Scorecard | Counts criteria only (`scorecard.ts`, 39 LOC) | Derives consensus scores from rater submissions |
| Weights | d17 stub, no locking (`d17_weight_log.md`) | Versioned, signed, locked-before-scoring `WeightSet` |
| Consensus | None — averaged in template prose | >5-pt deviation flag → re-rate state machine |
| Evidence | "No score without evidence" (aspiration) | Hard constraint; cell-level evidence citations |
| Disqualification | Empty d18 table | Evidence-chain rationale (`d18`) |
| Confidence | Binary / fixture | Multi-factor band (extends `context-quality.ts`) |
| Sensitivity | None | Weight what-if, rank-flip thresholds |
| Award view | `deterministicSeed: true` fixtures | Derived from consensus + confidence + sensitivity |
| Selection input | String-matched from `mock-seed` | Structured Reasoning Envelope handoff |

The implementation lands at named seams, not greenfield: the scoring contract extends `ScorecardGovernance`/`ScorecardCriterion` (`types.ts`); the evidence anchoring reuses the `evidenceCitations`/`rankAnswerEvidence` pattern from `source-answer-engine.ts`; the confidence model extends `context-quality.ts`; the award derivation replaces the fixtures in `award-decision-view.ts` and `vendor-selection-readiness.ts`; and the export binds `scorecard-payload.ts` to derived data. The new persisted entities (`scorecard_submissions`, `reasoning_envelopes`) are specified in Volume 3, Chapter 13, and the build is sequenced as Volume 4, Phase 2 — after the reasoning spine of Phase 1, because every output of this engine is a Reasoning Envelope, and before the BAFO engine of Phase 3, because calibrated evaluation scores are the fuel of negotiation leverage. Evaluation is where the OS first proves it can *reason* about vendors rather than merely describe them.


---

---

## Chapter 7 — The BAFO Intelligence Engine

> Volume 2 · Source Intelligence Engine. This chapter specifies the engine that turns Best-And-Final-Offer (BAFO) from a templated questionnaire ritual into a computed negotiation intelligence layer. It is the single stage where the dollar value of the entire sourcing event is won or lost, and today it is the engine furthest from operational — a seeded fixture pretending to be an analysis.

### 7.0 Why BAFO Is the Engine That Pays for the Platform

Every stage before BAFO builds the *position*. BAFO *cashes it*. By the time an event reaches stage `S5_bafo` (`src/lib/source/stage-packs/S5_bafo.ts`), the buyer has already spent the leverage-generating capital — it ran a competitive RFP (`d09`), collected responses, scored them, and shortlisted. The finalists know they are finalists. The only remaining mechanism to move price, scope, liability, and service-level commitments is the structured final round, and the buyer has exactly one credible shot at it before the field collapses to a single counterparty and all tension evaporates.

This is why elite results-delivery firms (Bain, ISG, Kearney's procurement transformation practice) treat BAFO not as a document but as a *leverage model under a clock*. The difference between an average BAFO and an expert one is routinely 5–12% of contract value (illustrative range) on a multi-year managed-services or platform deal — value that is pure margin to the buyer because the scope is already fixed. On a USD 40M (illustrative range) AMS deal, the gap between a mechanical "please sharpen your pricing" round and a model-driven concession campaign is single-digit millions. **The BAFO engine is the line item that pays for the entire Source platform.**

And it is precisely where Source is weakest in *operational* terms. By our own internal estimate the Evaluation/BAFO/Selection commercial layer sits around maturity **2–3 of 5** — the *frame* is real, the *logic is fixture-bound*. `src/lib/source/bafo-negotiation-model.ts` is a `buildBafoNegotiationSummary()` that — per its own header comment — is a "Deterministic seeded builder — no model calls, no network calls." It emits a `Vendor 1 / Vendor 2` opportunity set with a hardcoded `'4-7% cost reduction'` string and a single `scenario-standard` scenario whose `estimatedTotalImpact` is the literal string `'7-11% aggregate value improvement'`. It does not read a single real price. This chapter specifies how that seam becomes a live engine.

### 7.1 Engine Mandate & The Leverage Analysis Model

**Mandate.** The BAFO Intelligence Engine ingests normalized vendor pricing (the output of `pricing-normalization.ts`), the evaluation engine's consensus scores and rank margins (Chapter 6), the open commercial traps, and the event's archetype/rigor classification — and produces, per finalist: (1) a *leverage profile*, (2) a *negotiation strategy* (asks, concession ladder, walk-away threshold), (3) an *expected-value model* across conservative/base/stretch scenarios, and (4) a Reasoning Envelope (Chapter 5) that carries the evidence, assumptions, and confidence band behind every ask. Its outputs are the generation fuel for `d22` (BAFO question pack), `d23` (BAFO round log), and the feed for the Selection engine (Chapter 8).

**The Leverage Analysis Model.** Leverage is not a vibe; it is a computable function of the buyer's true alternatives. The engine computes a per-vendor `LeverageProfile` along five orthogonal axes, each scored 0–100 with an evidence-cited rationale:

```
                    LEVERAGE PROFILE (per finalist vendor)
  ┌────────────────────────────────────────────────────────────────┐
  │  Axis                  Computed from                  Score 0-100│
  ├────────────────────────────────────────────────────────────────┤
  │  Competitive Tension   # viable alternates × score-gap to next  │
  │  Switching Cost        incumbency flag × transition cost ratio  │
  │  Incumbency Position   incumbent? renewal archetype? lock-in?   │
  │  Evidence Asymmetry    open traps × evidence usability gaps     │
  │  Time Pressure         days-to-deadline × fiscal-window flag    │
  └───────────────────────┬────────────────────────────────────────┘
                          │  weighted → composite leverage index
                          ▼
              negotiation posture: AGGRESSIVE | FIRM | PROTECTIVE
```

- **Competitive Tension** is the dominant axis. It is derived directly from the evaluation engine: the number of vendors still *comparable* (`SourcePricingNormalizationSummary.comparable` in `pricing-normalization.ts`) and the score-gap between this vendor and the next-best alternative. Two comparable finalists within a 3-point evaluation margin = maximum tension; one comparable finalist = the buyer is negotiating against itself, and the model must *say so* and protect against over-reaching.
- **Switching Cost** consumes the year-one transition-inclusive cost already computed in `pricing-normalization.ts` (`transitionInclusiveYearOneUsd`, in `buildRatios()`) as a ratio of annual run cost. A vendor whose transition cost is a large fraction of annual spend holds asymmetric power — the buyer's BATNA is expensive.
- **Incumbency** reads the archetype seam (`types.ts` `archetype:string`; `renewal` archetype via `classifySourcingEvent()` in `classifier/category-classifier.ts`). A `renewal` event is structurally low-leverage and the model must temper asks accordingly.
- **Evidence Asymmetry** counts the open commercial traps from `buildCommercialTraps()` in `pricing-normalization.ts`. Every unpriced exclusion, every `low_confidence` evidence flag, every missing transition plan is *buyer* leverage — the vendor has left value on the table it cannot defend.
- **Time Pressure** is the axis that cuts both ways and is specified in §7.3.

**Why it matters / what it solves.** Today `bafo-negotiation-model.ts` assigns every vendor the same `strength: 'moderate'` regardless of reality. A model that cannot tell a sole-finalist renewal from a three-way knife-fight cannot generate a defensible ask. The leverage model is the input layer that makes every downstream recommendation specific, and — critically — that lets the engine *refuse to over-ask* when leverage is genuinely weak, which is the governance posture that protects the buyer relationship.

### 7.2 Negotiation Strategy & Concession Tracking

The leverage profile resolves to a posture; the posture resolves to a *strategy* — the concrete asks, the order in which they are surrendered, and the floor below which the buyer walks. The engine promotes the existing `BafoNegotiationLever` / `BafoNegotiationAsk` types (`bafo-negotiation-model.ts`) from seeded literals to computed objects.

**The 12-lever taxonomy is already correct.** `bafo-negotiation-model.ts` already defines the right `BafoLeverType` union: `price | scope | term | transition | governance | liability | exclusion | timing | volume | service_level | evidence | payment_terms`. This taxonomy is sound and should be preserved verbatim. What changes is that today each lever's `targetPosition` is a hardcoded string (e.g. `'Market median minus 5%'`); in the live engine each lever is *computed* from the normalized pricing delta and the should-cost baseline.

**The Concession Ladder.** For each finalist the engine builds an ordered ladder — the sequence of asks ranked by buyer priority and by *how cheap each is for the vendor to grant*. The ladder is the negotiation playbook made executable:

| Rung | Lever | Ask (computed) | Vendor cost to grant | Buyer value (illustrative range) | Give-to-get pairing |
|---|---|---|---|---|---|
| 1 | `exclusion` | Re-include release support now excluded | Low (already staffed) | 2–4% | — (free ask) |
| 2 | `evidence` | Provide reference proof for automation claim | Low | de-risks 20% claim | — |
| 3 | `price` | Align rate card to should-cost median | Medium | 4–7% | offer 4-yr term |
| 4 | `term` | Extend to 4 years | Low (revenue certainty) | leverage chip | get rung-3 price |
| 5 | `liability` | Raise cap to 12 months fees | High | risk transfer | last resort |

The give-to-get column is the heart of expert negotiation: the engine pairs a low-cost-to-buyer concession (a longer term, which vendors value as revenue certainty) against a high-value-to-buyer ask (a price reduction). This is what `bafo-negotiation-model.ts` gestures at with its `recommendations` array note "Bundled asks are harder to reject individually" — but cannot compute, because it has no real prices.

**Walk-Away Thresholds.** Every strategy carries an explicit floor derived from the should-cost model (`should-cost/should-cost-model.ts`, which *is* imported by the dormant `source-answer-engine.ts` — it calls `estimateEventShouldCost`, even though the should-cost module's own header comment still stalely reads "NOT wired into source-answer-engine.ts"; either way it is not reached by the live generate-route pipeline) and the buyer's BATNA cost. The walk-away is *not* a single number; it is a band: the price/scope/liability point below which the next-best comparable vendor becomes the rational choice. Surfacing the walk-away converts a gut call into an auditable decision and is the input the Selection engine (Chapter 8) needs to risk-adjust the award.

**Concession Tracker (the d23 engine).** BAFO is iterative — round 1, round 2, closure. The engine maintains a `ConcessionRound` record per round capturing: what was asked, what was given, what was withheld, the *delta vs. prior round*, and the residual gap to the walk-away floor. This is the live data model behind `d23_bafo_round_log.md`, whose §2 already specifies "Deltas vs prior. Concessions accepted with signature" and §4 "the locked-in concessions that go into the post-BAFO TCO and scorecard." The tracker is what closes the loop: every accepted concession *mutates* the normalized pricing snapshot, so the post-BAFO TCO that flows into selection is the *negotiated* number, not the opening offer. New persistence (`negotiation_rounds` table, specified in Vol 3 Ch 13) makes this durable and auditable rather than the transient computation it is today.

### 7.3 Competitive-Pressure, Timing & Sponsor Models

Three tactical sub-models modulate the strategy. Each is a small, explainable scorer feeding the leverage composite — and each is grounded in a signal Source can actually compute.

**Competitive-Pressure Model.** Inputs: count of `comparable` and `partially_comparable` vendors from `pricing-normalization.ts` (`buildSummary()`) and the evaluation rank margins. Output: a tension score and a *credibility flag* on the buyer's threat to walk. The model encodes the elite-firm discipline of *managing the field*: it recommends keeping a credible runner-up "warm" through round 1 specifically to preserve tension, and it raises a hard caution when the field has collapsed to one — at which point the posture flips to `PROTECTIVE` and the engine suppresses aggressive price asks that would only poison a relationship the buyer can no longer credibly exit.

**Timing Model.** Inputs: days-to-decision-deadline, fiscal-window flags (vendor quarter/year-end, buyer budget cycle), and the `timing` lever already in the taxonomy. Timing is *bidirectional leverage* and the model must say which way it points. A vendor at fiscal year-end with an unsigned deal is under pressure the buyer should exploit; a buyer with a hard go-live date and a single comparable finalist is under pressure the engine must *warn about* rather than pretend away. This honesty is the difference between a tool that flatters the user and an engine that protects them.

**Sponsor Model.** Inputs: executive sponsor presence, escalation authority, and air-cover for aggressive positions. Some asks (raising a liability cap, demanding a parent-company guarantee) only work with executive weight behind them. The sponsor model tags each ask with the *seniority required to land it* and routes the high-seniority asks into the executive decision packet (Chapter 8, `d24` — titled "Atlas Decision Brief" in the repo; under the one-front-agent doctrine Sentinel remains the single front agent for Source and Atlas is an internal voice, so the packet surfaces under Sentinel). It connects to `commercial-signals.ts` and `commercial-mission-adapter.ts`, which already model commercial "motion" and map missions to agent states.

```
   Competitive-Pressure ──┐
   Timing                ─┼──► leverage modulation ──► posture + ask seniority tagging
   Sponsor               ─┘                                │
                                                           ▼
                                          per-ask: {strength, seniority, EV, caveat}
```

**Why it matters.** Today these three forces are entirely absent from `bafo-negotiation-model.ts` — it has no notion of how many alternates exist, what the deadline is, or who is sponsoring. Encoding them is what lets the engine produce a *campaign* rather than a question list.

### 7.4 Playbooks as Data, Not Code

The current system hardcodes negotiation playbooks. `_GROUNDING_MAP.md` is explicit: the dormant `source-answer-engine.ts` carries "Five hardcoded playbooks per archetype (CDP, Contact Center AI, Store Productivity, AMS Outsourcing, Platform Sourcing)" and "Playbooks are hardcoded; no update path without code change." Every refinement to negotiation doctrine today requires an engineering deploy. That is structurally wrong for a body of knowledge that procurement experts must own and tune continuously.

**The specification: playbooks become governed data keyed by `archetype × leverage-state`.** A `NegotiationPlaybook` is a versioned record selected by a two-dimensional key — the event archetype (`AMS | ERP-SI | AI-data-platform | renewal`, from the dormant archetype framework) crossed with the resolved leverage posture (`AGGRESSIVE | FIRM | PROTECTIVE`). Each playbook entry specifies the prioritized lever order, the give-to-get pairings appropriate to that archetype, the standard caveats, and the walk-away framing.

| Field | Type | Purpose |
|---|---|---|
| `archetype` | `SourceArchetype` | matches `types.ts` archetype seam |
| `leverageState` | posture enum | from the §7.1 composite |
| `leverPriority` | `BafoLeverType[]` | ordered ask sequence |
| `giveToGet` | `{give, get}[]` | computed concession pairings |
| `caveats` | `string[]` | archetype-specific risk framing |
| `version` / `approvedBy` | governance | Steward-owned, audited |

An `AMS × AGGRESSIVE` playbook leads with rate-card and exclusion levers; a `renewal × PROTECTIVE` playbook leads with evidence and governance levers and explicitly *de-prioritizes* price (because a renewal with a sole credible incumbent has little price leverage and over-asking risks the relationship). Selection logic lives in the engine; the *content* lives in data that a procurement transformation lead can edit and a Steward can approve, with version history. This is the same "playbooks as data" discipline the dormant archetype framework already anticipates with its 10-method library and two-axis resolver — the BAFO engine is the first place to operationalize it.

**Why it matters / business value.** Playbooks-as-data is what makes the engine *improve without a deploy*. Each closed event feeds the concession tracker; aggregate concession outcomes by archetype become the empirical basis for tuning the next playbook version. The engine gets smarter as the firm runs more events — a flywheel that hardcoded prose can never produce.

### 7.5 Expected-Value Calculations & Scenario Modeling

This is the analytical core that turns "ask for a discount" into "this campaign has an expected value of USD 2.1M (illustrative range) at 62% confidence." Today `bafo-scenario-compare-view.ts` is fixture-bound and emits a single seeded scenario with a string impact. The live engine computes expected value over real normalized prices.

**Per-lever expected value.** For each ask the engine computes `EV = potential_value × probability_of_winning`. The potential value is derived from the should-cost gap and the normalized pricing delta (real dollars, from `pricing-normalization.ts` cost-by-year via `buildYearlyCosts()`). The probability is a *calibrated* estimate driven by the leverage profile — a price ask backed by two comparable alternates and an open should-cost gap carries a high win probability; the same ask against a sole finalist does not.

**Three scenarios, not one point estimate.** Expert negotiators never plan to a single number; they plan a range and stage their asks accordingly. The engine emits three:

| Scenario | Asks activated | Aggregate value (illustrative) | Win probability | Risk level | Caveat |
|---|---|---|---|---|---|
| **Conservative** | free asks only (exclusions, evidence) | 2–4% | 85% | low | safe to commit to board |
| **Base** | + price alignment, term-for-price swap | 6–9% | 60% | medium | requires sponsor on price ask |
| **Stretch** | + liability cap, parent guarantee | 10–14% | 35% | high | risks vendor pushback / withdrawal |

Each scenario carries its own risk level and an explicit caveat — the `confidenceLevel` field already exists on `BafoNegotiationScenario` (`bafo-negotiation-model.ts`) but is hardcoded `'medium'`; the live engine computes it. The board is shown the *band*, not a false-precision point, which is exactly the calibrated-confidence philosophy Volume 1 Chapter 4 establishes as the trust currency of the OS.

**Cross-vendor side-by-side.** The engine produces a comparison: if both finalists are pushed to their base scenario, where do they land, and does the ranking *flip*? This is the sensitivity question the Selection engine consumes — a finalist that is second on opening price but has more concession headroom may be the better award after BAFO. `bafo-scenario-compare-view.ts` is promoted from rendering fixtures to rendering this computed comparison.

```
   normalized prices (real) ──► per-lever EV = value × P(win)
   should-cost gap          ──┘            │
   leverage profile (P)     ──────────────►├──► Conservative / Base / Stretch
                                           │      each: {value, P, risk, caveat}
                                           ▼
                            cross-vendor flip analysis ──► Selection engine (Ch 8)
```

### 7.6 Pricing Normalization as the Engine's Fuel

No expected-value calculation is real until it runs on real, comparable prices — and **this is the single most load-bearing missing capability in the entire BAFO chain.** The canonical pricing artifact in `artifact-specs.ts` is `d19` (`d19_pricing_workbook`); the three-step decomposition below — `d19a` (template generation), `d19b` (vendor submissions), `d19c` (normalization) — are **proposed net-new sub-artifacts, not codes in the 33-code canon**, introduced here to name the distinct seams. The grounding map flags the gap as `CRITICAL ARCHITECTURAL`: the structured pricing-workbook *generator does not exist*, and without it vendors cannot receive a structured template, so the vendor-submission, normalization, and trap-log (`d20`) steps are all blocked.

The chain that must become live:

```
  d19a* pricing template (GENERATED, structured workbook)   ← does not exist today
    ↓   issued to vendors
  d19b* vendor pricing submissions (parsed back in)          ← parse-to-cells gap
    ↓
  d19c* pricing comparison (normalized, comparable)          ← pricing-normalization.ts
    ↓
  d20   trap log (computed exceptions)                        ← buildCommercialTraps()
    ↓
  BAFO engine (leverage, strategy, EV)                        ← THIS chapter

  * d19a/b/c = proposed net-new sub-steps; canon has only d19.
```

**The 8-dimension normalization matrix is the right model and is partly built.** `pricing-normalization.ts` already implements the normalization logic across the dimensions the grounding map names — scope, assumptions, rates, accelerators, IP, security, transition, SLAs. It already computes year-1/2/3 costs with rate escalation (`buildYearlyCosts()`), cost-per-application and cost-per-ticket ratios (`buildRatios()`), comparability status, and a deterministic trap catalog (`buildCommercialTraps()`). The engine ranks snapshots with a real penalty-weighted score (`scoreSnapshot()`, with high-severity traps and comparability misses carrying the heaviest penalties). **This is genuinely good logic.** The defect is its fuel: `pickPricingInputs()` falls through to `getSourcePricingNormalizationSeed()` and `toContext()` reads `getSourceVendorResponseSeed()`. It runs on `mock-seed`, and the output is stamped `generatedAtSource: 'seeded'`.

**The load-bearing build is the parse-to-cells binding.** Two seams must be wired:

1. **Pricing template generation (`d19a*`)** — a structured workbook generator (the `pricing-template` renderer already exists in `exports/renderers/`, per the grounding map) emitting a deterministic line-item schema so every vendor submits *the same cells*. Without an enforced template, normalization is impossible by construction.
2. **Parse-to-cells (`d19b*`)** — binding parsed vendor submissions into the `SourcePricingVendorInput` shape that `buildSnapshot()` consumes, persisted via the `pricing-submissions/dao.ts` seam and the `vendor_proposals` table (Vol 3 Ch 13), is the swap that replaces `pickPricingInputs()`'s seed fallback with real `event.pricingInputs`. **This is a net-new binary-parsing capability for Source, not an extension of an existing one.** `artifact-registry/text-parser.ts` is the synchronous *first-mile* parser for text-like uploads only (pasted notes / Markdown / text / CSV via `extractLabeledLines` / `extractPricingComponents`; parser id `source_text_first_mile_v1`) — it does **not** read xlsx via exceljs, docx via mammoth, or pdf via pdf-parse. (In Source, exceljs is used only to *write* xlsx in the `exports/` renderers, never to read responses; the binary readers `mammoth`/`pdf-parse` live on the Moves side under `src/lib/programs/`.) Rich binary vendor-pricing-workbook parsing therefore must either be built fresh for Source or reuse the Moves-side async extraction pipeline; the `d19b*`→`d19c*` chain depends on building that, not on extending `text-parser.ts`.

Once those two seams carry real data, *every downstream computation in this chapter becomes real* — the trap log, the leverage profile, the EV scenarios, the walk-away floor. The normalization matrix is not a feature alongside the BAFO engine; it is the BAFO engine's bloodstream.

**Why the template discipline matters.** Per the project's context-ingestion truth standard, structured CSV/JSON/JSONL/YAML can commit on schema validation; XLSX and PDF must preserve source-location evidence and enter review-required status unless a tested, template-specific parser proves deterministic mapping. The pricing template *forces* vendor pricing into the deterministic, schema-validated path — which is precisely why a template-bound submission can deterministically normalize and why a free-form PDF proposal cannot. The template is not bureaucracy; it is what makes the math defensible to a board and auditable to procurement governance.

### 7.7 Engine Output Contract & Governance Posture

Every BAFO engine output is wrapped in the Reasoning Envelope defined in Chapter 5: each ask carries its evidence citations (the specific trap, the should-cost line, the rank margin that justifies it), the assumptions tested and rejected, a calibrated confidence band, and the caveats that travel with the recommendation into the board packet. The `sentinelEvidenceNotes` and `stewardGateNotes` already threaded through `pricing-normalization.ts` are the seed of this — the engine elevates them from prose annotations to first-class envelope fields.

The governance posture is the net-new piece. `disclosure-flag/` is, per verified ground truth, a *legal-privilege classifier*, not a refusal mechanism — so the evidence-or-refuse posture is net-new and wires into the dormant `source-answer-engine.ts`. For BAFO this means: when the normalization layer reports `not_comparable` or `blocked` (the engine already computes this — `deriveReadinessStatus()`, and `stewardGateNotes` that say "Do not authorize final decision lock until comparability blockers are resolved"), the BAFO engine **must refuse to generate a final negotiation strategy** and instead emit the minimum-data request that would unblock it. An engine that fabricates leverage on incomparable prices is worse than no engine — it gives the board false confidence on the most expensive decision in the lifecycle.

### 7.8 Implementation Implications

- **Seam, not rewrite.** The engine extends three existing files: promote `bafo-negotiation-model.ts` from `buildBafoNegotiationSummary()`'s seeded literals to computed objects; feed it from a live `pricing-normalization.ts` (swap the seed fallback in `pickPricingInputs()`); promote `bafo-scenario-compare-view.ts` from fixtures to computed EV. The type contracts (`bafo-negotiation-types.ts`, the 12-lever union) are already correct and are preserved.
- **The blocking dependency is pricing-template generation + parse-to-cells** (the proposed `d19a*`/`d19b*` sub-steps; canon has only `d19`). No BAFO work delivers value until real prices flow, and parse-to-cells means standing up net-new binary-workbook parsing for Source, not extending `text-parser.ts`. This sequences the roadmap (Vol 4, Phase 3): pricing template generation and submission parsing ship *before* the leverage and EV models, because the latter are computationally meaningless on seed data.
- **New persistence** (Vol 3 Ch 13): `vendor_proposals` (normalized), `negotiation_rounds` (concession tracker), and a governed `negotiation_playbooks` table — all RLS-scoped, all audited, because BAFO outcomes are board-grade evidence.
- **Live-proof requirement.** Per release-control discipline, the engine is not "done" until it runs on a real multi-finalist event on the ACA private DB with real parsed vendor pricing and produces a defensible EV band that survives the Reasoning Envelope quality gate (0 unsupported claims, evidence-cited). Fixture-passing is not proof.

**The destination.** When this engine is live, a sourcing lead opens the BAFO Command Center (Vol 3 Ch 14) and sees, per finalist: a leverage score with its five-axis rationale, a concession ladder with give-to-get pairings, three EV scenarios with confidence bands, and a `d22` question pack generated from the open traps — every number traceable to a parsed price and every ask defensible to the board. That is the moment BAFO stops being a document Source generates and becomes an intelligence Source *reasons to*. It is also the moment the platform's business case closes, because that single-digit-percentage swing on every event is the value the rest of the system exists to capture.


---

---

## Chapter 8 — The Selection Intelligence Engine

> Volume 2 · Source Intelligence Engine
> Maturity today (internal estimate): **2/5** (selection logic exists as fixtures and a ternary heuristic; no live derivation, no enforced sign-off)
> Controlling files: `src/lib/source/award-decision-view.ts`, `src/lib/source/executive-decision-summary.ts`, `src/lib/source/vendor-selection-readiness.ts`, `src/lib/source/source-governance-enforcement.ts`
> Deliverables produced: **d24** (decision brief), **d25** (risk attestation), **d26** (Steward sign-off), **d27** (selection memo), **d28** (contract record handoff)

### 8.0 Why Selection Is the Load-Bearing Moment of the Whole System

Every prior engine in this volume — the Reasoning Engine (Ch 5), the Vendor Evaluation Engine (Ch 6), the BAFO Intelligence Engine (Ch 7) — exists to feed exactly one decision: *which vendor does the enterprise award, on what conditions, and with what defensible rationale.* The Selection Intelligence Engine is where reasoning becomes consequence. A scorecard can be wrong and corrected; a negotiation round can be re-run; an award decision that goes to a board, gets ratified, and converts into a multi-year contract cannot be quietly undone. This is the moment where the cost of an un-traced recommendation is highest and the value of a calibrated, evidence-anchored one is greatest.

The honest current-state position is that Source has the *shape* of a selection capability but not the *substance*. `award-decision-view.ts` (208 lines) produces a board-quality ranked comparison — three vendors, a four-dimension scorecard (`commercial`, `technical`, `transition`, `risk` rolled to `overall`), a recommended vendor, pre-award conditions, and an Atlas guidance narrative — but every number is a hardcoded fixture for the Apex Retail "AMS Vendor Consolidation 2026" engagement (`buildAwardDecisionView()` takes no inputs and returns `deterministicSeed: true`). `executive-decision-summary.ts` (387 lines) does derive a posture from upstream commercial signals, but its confidence model is a three-value heuristic (`high`/`medium`/`low`) computed by `deriveEvidenceConfidence()` from the presence of substrings like `"evidence"`, `"proof"`, `"citation"` in blocker text. `vendor-selection-readiness.ts` derives a `readinessStatus` but reads from `getSourceEventSeed()` mock data. None of these is wired to a live `generate` route; the only enforced governance is in `source-governance-enforcement.ts`, which validates stage *promotion* but never the *award sign-off* itself.

This chapter specifies the engine that closes that gap. It does four things: (1) promotes `award-decision-view.ts` from a fixture renderer to a **live derivation** over Evaluation and BAFO outputs; (2) replaces the ternary confidence heuristic with a **calibrated, multi-factor recommendation confidence**; (3) generates the **board decision packet** (d24–d27) as a coherent, signed, reasoning-backed artifact set rather than five disconnected templates; and (4) extends `source-governance-enforcement.ts` with an **approval-and-waiver workflow** so that an award cannot be marked final without a human, a reason, and an auditable trail.

### 8.1 The Recommendation Framework

**Why it matters.** An elite sourcing recommendation is not "Vendor C scored highest." It is a *defensible chain*: here is the ranked field, here is why the leader leads on the deciding axis, here is what the runner-up would have given the enterprise instead, here are the conditions that must close before award, and here is the dissent we captured and did not bury. A CIO advisory board does not approve scores; it approves *judgment under named uncertainty*. The framework must make that judgment legible.

**What problem it solves.** Today `award-decision-view.ts` hardcodes the conclusion (`recommendedVendorId: 'vendor-c'`) and the rationale. There is no separation between the *raw evaluation result* and the *risk-adjusted recommendation*, so there is nothing to audit and nothing to challenge. The framework introduces that separation explicitly.

**How it works.** The Selection Engine consumes three structured inputs, all promoted from fixtures to live data in the phases that precede it:

```
  Evaluation Engine (Ch 6)          BAFO Engine (Ch 7)            Reasoning Engine (Ch 5)
  ┌────────────────────┐           ┌────────────────────┐        ┌────────────────────┐
  │ consensus scores    │           │ normalized pricing  │        │ reasoning envelope  │
  │ per vendor/criterion│           │ EV scenarios        │        │ assumptions tested  │
  │ + evidence cites    │           │ residual gaps       │        │ confidence bands    │
  └─────────┬──────────┘           └─────────┬──────────┘        └─────────┬──────────┘
            └──────────────────────┬─────────┴──────────────────────────────┘
                                   ▼
                    ┌──────────────────────────────────┐
                    │   SELECTION INTELLIGENCE ENGINE    │
                    │  1. assemble raw ranked field      │
                    │  2. apply risk adjustments (8.2)   │
                    │  3. resolve tie-breaks (8.2)        │
                    │  4. score recommendation conf (8.3)│
                    │  5. derive options + dissent        │
                    └──────────────┬───────────────────┘
                                   ▼
              d24 brief · d25 attestation · d26 sign-off · d27 memo (8.4)
                                   ▼
                    Approval + Waiver Workflow (8.5)
```

The engine emits a single `SelectionRecommendation` envelope (extending the existing `AwardDecisionSummary` interface in `award-decision-view.ts`) carrying: the ordered field of `VendorAwardProfile` records; a `decisionReadiness` of `ready | conditional | not_ready` (the existing enum); the headline `rationale`; `keyDecisionFactors`; `preAwardConditions`; and four net-new fields — `decisionOptions` (ordered, each with rationale and what it forecloses), `recommendationConfidence` (the calibrated band from §8.3), `dissent` (captured minority positions with owner), and a `reasoningEnvelope` reference (Ch 5) so the recommendation carries its own provenance.

**Decision options, not a single answer.** The framework borrows the discipline already sketched in `executive-decision-summary.ts`'s `deriveDecisionOptions()`, which returns three ordered options per posture. The Selection Engine generalizes this: for every recommendation it surfaces *Award as recommended* (lead vendor, stated conditions), *Award the runner-up* (with the explicit value the enterprise trades away — for the fixture, Vendor A's +14-point transition and risk posture against Vendor C's technical and CDP-architecture lead), and *Defer / re-compete* (when no option clears the readiness bar). The board chooses among framed options; it is never handed a fait accompli.

**Expected business value.** A recommendation that arrives as a framed, conditioned, dissent-aware judgment compresses the executive decision cycle (illustrative range: 2–4 weeks of committee back-and-forth collapsed to a single ratification meeting) and materially reduces the rate of awards reopened after sign-off — the most expensive failure mode in sourcing.

**Implementation implications.** `buildAwardDecisionView()` must change signature from `(): AwardDecisionView` to `(input: SelectionEngineInput): AwardDecisionView`, where `SelectionEngineInput` binds live evaluation consensus scores, normalized pricing, and the reasoning envelope. The fixture `VENDOR_PROFILES` and `DECISION_SUMMARY` constants become the *test fixture* (preserving the existing deterministic test), and the live path derives them. This is a Phase 4 change (Vol 4 Ch 16) and depends on Phases 2–3 shipping real evaluation and pricing data first — selection cannot be live before its inputs are.

### 8.2 Risk Adjustments and Tie-Break Logic

**Why it matters.** Raw scores measure *fit*; they do not measure *exposure*. The vendor that scores highest on capability may concentrate too much of the portfolio in one supplier, carry the deepest transition risk, or accept the weakest liability cap. Elite firms never award on raw scores; they award on *risk-adjusted* scores, and they make the adjustment auditable so the board can see exactly how a 88-on-technical became a conditional recommendation.

**What problem it solves.** The fixture in `award-decision-view.ts` already encodes the *result* of risk adjustment — Vendor B's `risk: 52` (SOC-2 Type II outstanding) drives `status: 'not_recommended'` regardless of a competitive `technical: 77` — but the *adjustment logic* is hardcoded prose in `weaknessSummary` and `decisionNote`. There is no model. We specify the model.

**How it works.** The engine applies three risk adjustments to each vendor's raw `overall` score, each producing a transparent delta:

| Adjustment | Input source | Logic | Fixture illustration |
|---|---|---|---|
| **Transition risk** | BAFO/evaluation `transition` score + KT-plan maturity | Penalty scales as transition score falls below the field median; severe below a hard floor | Vendor C `transition: 76` (newer incumbent, intensive KTP) carries a moderate penalty; Vendor B `68` (thin KTP, unquantified parallel-run) heavier |
| **Concentration risk** | Market Intelligence Layer (Ch 11) vendor-profile portfolio holdings | Penalty if award would breach a tenant concentration threshold across existing relationships | d25 §3 "Concentration check" is the artifact home for this |
| **Liability / contract exposure** | `commercial-risk-detection.ts` patterns + BAFO-negotiated terms | Penalty for accepted-but-weak liability caps, best-effort SLAs, missing exit clauses | Vendor A's "exit clause accepted, no SOC-2 exceptions" earns the field's best `risk: 85` |

Each adjustment is recorded as a signed delta against the raw score, so the recommendation can state, in plain English, "Vendor C's technical lead survives a moderate transition-risk adjustment; Vendor B's capability is erased by a hard security-risk floor." This reuses the eight commercial-risk patterns in `commercial-risk-detection.ts` as the seed detector set (Vol 1 Ch 4 establishes risk-as-quantified-and-owned, not flag-checked).

**Tie-break logic.** When risk-adjusted scores fall within a defined margin (illustrative range: within 3 points on a 100-scale), the engine resolves the tie with an explicit, ordered, auditable cascade rather than a coin-flip: (1) lower aggregate risk exposure; (2) lower transition risk; (3) better EV-weighted pricing position from the BAFO engine; (4) escalate to the decision options framework with the tie surfaced as a named decision the board must resolve. The cascade is *logged* — d27's §2 selection rationale must be able to state which tie-break rule was decisive.

**Expected business value.** Risk-adjusted, tie-break-disciplined selection prevents the single most damaging award error — choosing the highest-capability vendor while ignoring a security, concentration, or transition exposure that surfaces as a crisis 18 months into the contract. It also gives Legal and the CISO a defensible audit trail (the d25 risk attestation) for why exposure was accepted.

**Implementation implications.** Risk adjustments require the concentration input from the Market Intelligence Layer (Ch 11), which is a Phase 7 capability; in Phase 4 the concentration adjustment runs in a degraded mode (tenant-portfolio-only) and is explicitly flagged as a caveat in the reasoning envelope. d27 generation (`src/content/source-templates/selection/d27_selection_memo.md`) gains a structured input binding so §2 rationale and §3 conditions are derived, not hand-authored.

### 8.3 Confidence Scoring on the Recommendation

**Why it matters.** Calibrated confidence is the trust currency of the operating system (Vol 1 Ch 4, The Confidence Philosophy). A board that is told "we recommend Vendor C with high confidence — and here is precisely why it is *not* certainty" makes a better decision than one handed a binary verdict. Uncalibrated confidence is worse than none: it manufactures false assurance.

**What problem it solves.** The current confidence signal is the ternary `SourceExecutiveEvidenceConfidence` (`high | medium | low`) in `executive-decision-summary.ts`. `toEvidenceConfidence()` returns `low` if any blocker text contains `"evidence"`/`"proof"`/`"citation"`, `medium` for high/critical risk, else `high`. `deriveEvidenceConfidence()` then rolls vendor-level values to an event level. This is a string-matching heuristic, not a confidence model — it cannot distinguish "we have three corroborating sources and a 20-point score margin" from "we have one stale source and a 1-point margin."

**How it works.** The recommendation-level confidence is a weighted composite of four explainable factors, each scored 0–1 and each individually surfaced to the board so the confidence is *decomposable*:

| Factor | Question it answers | Source |
|---|---|---|
| **Evidence sufficiency** | Is every score anchored in committed, non-stale evidence? | Evaluation engine evidence cites + `EVIDENCE_RANK` from `source-governance-enforcement.ts` (Usable Evidence=4 down to Stale/Low-Confidence=−1) |
| **Score margin** | How decisively does the leader lead after risk adjustment? | Risk-adjusted field spread (§8.2) |
| **Assumption resolution** | How many material assumptions remain untested/open? | Reasoning envelope `assumptions` (Ch 5) + `unresolvedAssumptions` already collected in `executive-decision-summary.ts` |
| **Corroboration & recency** | Are the deciding facts corroborated and current? | Market Intelligence Layer (Ch 11) + evidence recency |

The composite maps to a **confidence band** (e.g., *High / Moderate / Low* with a stated numeric range) rather than a point estimate, because a band honestly communicates that confidence is itself uncertain. Critically, the band is *gating*: a recommendation below a configured confidence floor cannot reach `decisionReadiness: 'ready'`; it is forced to `conditional` or `not_ready`, mechanically connecting confidence to the governance posture. This realizes the evidence-or-refuse principle (Vol 1 Ch 4) — the engine *declines to express high confidence* on insufficient evidence rather than fabricating it. Today the disclosure-flag classifier (`src/lib/source/disclosure-flag/`) handles legal-privilege classification only; the governed-insufficiency posture specified here is net-new and wires into the recommendation path through `source-answer-engine.ts` (which is itself dormant — not yet reached by the live generate-route pipeline — so this binding must be made live as part of Phase 4, not assumed).

**Expected business value.** Decomposable confidence raises executive decision confidence where it is warranted and *withholds* it where it is not — the latter being where the system earns its keep. It converts the board conversation from "do we trust the tool?" to "do we accept *this specific named uncertainty*?"

**Implementation implications.** The four-factor scorer is a new module that the Selection Engine calls; it replaces `deriveEvidenceConfidence()`/`toEvidenceConfidence()` in `executive-decision-summary.ts` as the canonical confidence source. The existing functions are retained as a back-compat shim during migration. Calibration (does "High" actually correlate with awards that hold?) is a longitudinal exercise gated on real award outcomes — until then the bands are explicitly labeled *(illustrative range)* in board output.

### 8.4 Board and Executive Decision Packets

**Why it matters.** A board decision is made from a *packet*, not a screen. The packet must be coherent (one recommendation, supported consistently across documents), signed (named accountability), and self-provenancing (the reasoning travels with the conclusion). Five disconnected templates that contradict each other are worse than one honest page.

**What problem it solves.** The four templates exist as markdown stubs — d24 (`d24_decision_brief.md`), d25 (`d25_risk_attestation.md`), d26 (`d26_steward_signoff.md`), d27 (`d27_selection_memo.md`) — but they are not generated, not bound to live data, and not assembled into a single packet. The PDF render path that signed executive artifacts require (`render-pdf/route.ts`) is already built and returns HTTP 200 for the artifact codes wired today — d05, d09, d24, and d27 (it gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and returns 404 for codes not yet wired). For this engine the work is *extending* PDF coverage to the remaining selection codes (d25, d26, d28) and adding signature blocks, not building the path from zero. And the deal-pack assembly route (`deal-pack/route.ts`) already assembles a combined document and returns 200 today; its real gap is **multi-artifact ZIP bundling** of the separate signed PDFs, not that it does nothing.

**How it works.** The Selection Engine emits the packet as one coherent assembly driven by the single `SelectionRecommendation` envelope, so every document shares one source of truth:

| Code | Document | Lead | Derived content | Signature |
|---|---|---|---|---|
| **d24** | Decision brief | Sentinel (Atlas voice)* | §1 recommendation, §2 deciding-axis rationale, §3 tradeoff card (value/risk/transition), §4 finalist comparison — all from the recommendation envelope | — |
| **d25** | Risk attestation | Sentinel | §1 aggregate risk posture (financial/security/concentration/geopolitical/operational), §2 top-three open risks with owner + residual, §3 concentration check (Ch 11) | Sentinel sign-off block |
| **d26** | Steward sign-off | Sentinel (Steward voice)* | Governance attestation: gates met or waived, approval reason, evidence floor cleared | Steward sign-off block |
| **d27** | Selection memo | Sentinel* | §1 selected vendor, §2 rationale citing d24, §3 binding BAFO conditions, §4 appeal closure, §5 transition kickoff → hands to d28 | Sponsor sign-off |

*\*Reconciliation to the one-front-agent doctrine (Vol 1 Ch 4): **Sentinel is the single front agent for Source.** The d24 template is literally titled "Atlas Decision Brief" in the repo and some selection d-codes name Atlas or Steward — these are **internal voices** (Atlas = the value/tower lens on the executive brief; Steward = the governance sign-off lens), not competing front-agent brands on the packet. Every document in this packet is authored under Sentinel; the named voices indicate which internal lens shapes the section, and the packet must never present three front-agent brands to the board.*

The packet attaches the **reasoning envelope** (Ch 5) so a board member can trace any claim in d24 back to the evidence that shaped it. Assembly happens through the existing `exports/dispatch.ts` and `format-router.ts` (which already routes `decision-brief` and `selection-memo` kinds to docx/html); PDF rendering already works (200) for d24 and d27 via `render-pdf/route.ts`. The missing capabilities are **extending the signed-PDF path** to d25/d26 (and d28) with signature blocks, and the **deal-pack multi-artifact ZIP** that bundles the signed PDFs into one packet. Both are explicit Phase 4 deliverables.

**Expected business value.** A single coherent, signed, reasoning-backed packet is the difference between a board that ratifies in one meeting and a board that sends the recommendation back for rework. It also produces the audit evidence (signed d25/d26) that satisfies enterprise procurement governance and survives post-award scrutiny.

**Implementation implications.** Each of d24/d25/d27 gains a payload builder under `exports/payloads/` binding the recommendation envelope to the template's structured sections (the pattern already used for `scorecard-payload.ts`). `render-pdf/route.ts` already renders d24/d27 at 200 and must be *extended* to d25/d26/d28 (the route returns 404 for codes not yet wired) with signature blocks added. `deal-pack/route.ts`, which already returns a combined document at 200, must gain multi-artifact ZIP bundling of the signed PDFs. Per the context-ingestion truth standard, none of these may be claimed "live" until a real event produces a signed packet on the ACA private DB.

### 8.5 Approval Enforcement and Waiver Workflow

**Why it matters.** Governance is a feature, not friction (Vol 1 Ch 4). A recommendation that can be marked "awarded" by anyone, with no reason and no trail, is not a decision — it is an exposure. The selection moment is precisely where the human-in-the-loop sign-off must be *enforced by the system*, not assumed by policy.

**What problem it solves.** `source-governance-enforcement.ts` enforces *stage promotion* well — `evaluateStagePromotionReadiness()` blocks non-adjacent promotion, requires an approval reason of at least `SOURCE_APPROVAL_REASON_MIN_LENGTH` (12) characters, re-verifies that previously-`met` gate criteria still satisfy artifact/evidence controls, and treats criteria as open unless `met` or `waived`. But there is no equivalent enforcement at the *award sign-off* itself, and the **waiver path is undefined** (Vol 1 Ch 2 names this a gap): `gate_criterion_states` carries a `waived` state and the criterion-state route (`src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`) can set it, but there is no waiver *request*, *registry*, *approver routing*, or *variance tracking*.

**How it works.** The engine closes the loop with three additions, all extending the existing governance seam rather than replacing it:

```
  Recommendation (decisionReadiness)
        │
        ├── ready ──────────► AWARD SIGN-OFF GATE
        │                      • requires human approver (role: Sponsor + Steward)
        │                      • requires reason ≥ 12 chars (reuse SOURCE_APPROVAL_REASON_MIN_LENGTH)
        │                      • re-runs evaluateCriterionMetReadiness() at sign-off time
        │                      • writes signed d26 + audit row → award locked
        │
        └── conditional/not_ready ──► WAIVER WORKFLOW
                                       • waiver request (criterion, scope, residual-risk owner)
                                       • approver routing (Steward; escalation if hard severity)
                                       • waiver registry row (auditable)
                                       • gate-variance tracking (what was waived, by whom, why)
                                       │
                                       └─► on approval: criterion → 'waived' via existing state route
```

The award sign-off gate reuses the exact controls already proven in `evaluateStagePromotionReadiness()`: the approval-reason minimum, the re-verification of `met` criteria against current artifact and evidence state (so a recommendation cannot be signed on a gate that *was* met but is no longer), and the `EVIDENCE_RANK` floor. The waiver workflow is the net-new piece: a waiver is a *first-class, owned, auditable exception* — the system permits advancing past a soft gate only when a named approver records why and who carries the residual risk. Hard-severity gates (per the 38-criterion catalog in `gate-criteria.ts`) escalate; they are not self-waivable. This respects the pilot-vs-production gate-approval model (pilot: any user self-approves; production: admin/Steward only) without letting the AI self-approve.

**Expected business value.** Enforced sign-off plus an auditable waiver registry converts governance from a paper policy into a system property. It produces the evidence trail enterprises require, prevents silent advancement on fragmentary evidence (the CRITICAL gap named in Vol 1 Ch 2), and makes every accepted exception attributable — which is exactly what survives a post-award audit or a vendor dispute.

**Implementation implications.** Three new entities (Vol 3 Ch 13): a `waivers` table (request, scope, approver, residual-risk owner, status), an award-sign-off audit row, and a gate-variance record. The criterion-state route already mutates `waived`; the new waiver-request route gates *who* may trigger that mutation and records *why*. `source-governance-enforcement.ts` gains an `evaluateAwardSignoffReadiness()` function mirroring the promotion-readiness pattern. This is the final Phase 4 deliverable and the point at which the selection lifecycle becomes genuinely governed end-to-end.

### 8.6 Chapter Summary — From Fixture to Governed Judgment

The Selection Intelligence Engine is the convergence point where the operating system either earns or forfeits executive trust. Today it is a fixture renderer (`award-decision-view.ts`), a substring-matching confidence heuristic (`executive-decision-summary.ts`), and a readiness derivation over mock seed data (`vendor-selection-readiness.ts`), with real governance present only at stage promotion (`source-governance-enforcement.ts`) and absent at the award itself. This chapter specified its promotion to a live engine: a recommendation framework that frames options and captures dissent; risk adjustments and auditable tie-breaks that convert fit-scores into exposure-aware judgment; a decomposable, gating confidence model that honestly withholds assurance on thin evidence; a coherent, signed, reasoning-backed board packet (d24–d27); and an enforced sign-off plus first-class waiver workflow that closes the governance loop. Sequenced in Phase 4 (Vol 4 Ch 16), it depends on live Evaluation (Phase 2) and BAFO/pricing (Phase 3) outputs — because a selection engine is only as defensible as the reasoning it stands on.
