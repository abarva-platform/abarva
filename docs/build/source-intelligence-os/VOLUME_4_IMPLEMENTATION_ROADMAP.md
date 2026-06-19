# AbarVa Source Intelligence Operating System Specification
## Volume 4 — Implementation Roadmap

> Classification: Board-Grade, Confidential · 2026-06-19 · Grounded against branch `codex/corpus-wave-24`.
> Review verdict: **needs-minor-fixes**.

## Chapter 16 — Seven-Phase Delivery Plan

Volume 4 converts the architecture of Volumes 2 and 3 into a buildable sequence. The preceding chapters argued *what* the Sourcing Intelligence Operating System is and *how* its engines reason; this chapter answers the only question a board ultimately funds against: *in what order, against what proof, and at what risk do we build it?* The discipline that governs this answer is the one stated throughout Volume 1 — a capability is not "done" because a deterministic builder returns the correct TypeScript shape over a fixture. It is done when it has reasoned correctly over a real sourcing event, end-to-end, on the ACA private database, against real vendor data, with the Steward gate holding. Every phase below carries that bar as its release condition, because the central failure mode of this program is not building the wrong thing — the dormant logic surveyed in our internal grounding notes is mostly well-shaped — it is declaring fixture-bound logic "shipped" and discovering at the first real customer that nothing was wired to live data.

### 16.1 Sequencing Logic & Cross-Phase Dependencies

The sequence is not a preference; it is forced by the dependency structure of the reasoning system. Five facts fix the order.

**First, the reasoning spine must ship before anything else, because there is nowhere to put a recommendation until it exists.** Today the live pipeline is `Event → Context Binder (`src/lib/source/agent-generation/context-binder.ts`) → Prompt Registry (`agent-generation/prompt-registry.ts`) → Claude (`server.ts`) → Deliverable`, invoked through `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`. There is no Analysis stage and no Recommendation stage between bound context and generated markdown. A vendor ranking, a negotiation strategy, a confidence band, a refusal — none of these have a home in the current pipeline. The Reasoning Envelope (Vol 2, Ch 5) is the canonical container every downstream engine emits and every UX surface renders. Until it exists, Phases 2–7 have no output contract to conform to. This is why Phase 1 is non-negotiable and first.

**Second, evaluation precedes BAFO: you cannot negotiate what you have not scored.** The BAFO leverage model (`bafo-negotiation-model.ts`) consumes a ranked, scored vendor field to compute competitive tension. Without consensus scores and a defensible ranking out of the Evaluation Engine (Phase 2), the leverage analysis runs on the same seeded levers it runs on today.

**Third, BAFO precedes selection: you cannot award what you have not negotiated.** The Selection Engine's risk-adjusted ranking (`award-decision-view.ts`) derives from both evaluation scores and BAFO outcomes — the post-negotiation price, the concession residual, the walk-away discipline that held or did not. Selection on pre-BAFO numbers awards the wrong vendor at the wrong price.

**Fourth, contract and transition follow selection because they operate on its output.** Contract Intelligence (Phase 5) verifies that the signed paper matches the negotiated BAFO outcome and the scorecard commitments — it has nothing to verify against until an award exists. Transition Intelligence (Phase 6) scores readiness for a vendor that has been selected and contracted.

**Fifth, the market-intelligence platform comes last because it calibrates a reasoning system that must first be internally trustworthy.** As Volume 1 argued: an internally-rigorous, market-blind system is far better than today's document factory; a market-calibrated system built on un-rigorous internal reasoning is confidently wrong at scale. Market intelligence (Phase 7) adds external calibration — and it depends on data AbarVa does not yet possess.

#### The cross-phase dependency graph

```
                         ┌───────────────────────────────────────────────┐
                         │  P1  PROMPT + REASONING UPGRADE                 │
                         │  Analysis+Recommendation stages,               │
                         │  Reasoning Envelope, archetype activation,     │
                         │  grounded refusal, observability               │
                         │  seam: agent-generation/server.ts              │
                         └───────────────┬───────────────────────────────┘
                                         │ emits Reasoning Envelope (consumed by ALL below)
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            │
  ┌───────────────────┐                 │                            │
  │ P2 EVALUATION     │                 │                            │
  │ d16–d18, scoring, │                 │                            │
  │ consensus,        │                 │                            │
  │ deviation, evid.  │                 │                            │
  └─────────┬─────────┘                 │                            │
            │ ranked, scored field      │                            │
            ▼                            │                            │
  ┌───────────────────┐                 │                            │
  │ P3 BAFO           │  needs P3: pricing-submissions/dao.ts        │
  │ d19 pricing→norm→ │  (live vendor pricing parsed to cells)       │
  │ leverage/EV,      │                                              │
  │ d20/d22/d23       │                                              │
  └─────────┬─────────┘                                              │
            │ post-negotiation price + concession residual           │
            ▼                                                        │
  ┌───────────────────┐                                              │
  │ P4 SELECTION      │  needs P4: source-governance-enforcement.ts  │
  │ award derivation, │  (gates move advisory→blocking; waiver flow) │
  │ d24–d27 packet,   │                                              │
  │ approval/waiver,  │                                              │
  │ PDF path          │                                              │
  └─────┬───────┬─────┘                                              │
        │       │ signed award                                       │
        ▼       ▼                                                    │
 ┌──────────┐ ┌──────────────┐                                      │
 │ P5       │ │ P6           │                                      │
 │ CONTRACT │ │ TRANSITION   │  (P5 and P6 may run partly parallel; │
 │ d28,     │ │ d29–d33,     │   both depend only on P4 award)      │
 │ redline  │ │ readiness    │                                      │
 └────┬─────┘ └──────┬───────┘                                      │
      └──────┬───────┘                                              │
             ▼                                                      │
   ┌───────────────────────────────────────────────────────────────┴──┐
   │ P7  FULL PLATFORM — Market Intelligence Layer, semantic retrieval, │
   │ portfolio reasoning, renewal automation, full multi-agent coord.  │
   │ Consumes envelopes from ALL prior phases; calibrates them          │
   │ against external market knowledge (the layer Source lacks today).  │
   └────────────────────────────────────────────────────────────────────┘
```

Two parallelization opportunities exist and only two. Within Phase 1, archetype activation (wiring `classifySourcingEvent()` from `classifier/category-classifier.ts` into the live path) can proceed alongside the Analysis/Recommendation stage build because they touch different seams. After Phase 4, Contract (P5) and Transition (P6) both depend only on the award and may overlap if staffing allows. Everything else is strictly serial: each phase's output is the next phase's input. The ROI curve is, as Volume 1 noted, back-loaded toward Phases 3–4 (BAFO and selection are where money is made or lost), which makes the early phases an investment thesis the board must accept on the logic above, not on Phase-1 hard-dollar return.

#### The gating proof-point, applied uniformly

Every phase exits the same way: **a live run on the ACA private database against a real sourcing event with real vendor data, with the relevant Steward gate enforced, and a release record filed.** This is not ceremony. The grounding audit shows the dominant historical defect class is exactly the one this gate catches — `pricing-normalization.ts` runs over empty data sets in tests (correct but low-signal); the seven specialist *builders* in `sentinel-source-orchestrator.ts` do run at runtime but are deterministic-prose-only (no model calls, transient/not persisted), with the model-backed specialist logic still unbuilt/test-only; and `source-answer-engine.ts` is dormant with no live generate-route call-site. A green test suite has repeatedly co-existed with zero live *reasoning* capability. The phase gate forbids declaring victory on shape conformance.

### 16.2 Phase 1 — Prompt + Reasoning Upgrade

**Objective.** Insert the missing reasoning layer into the live pipeline and make the Reasoning Envelope the canonical output of every generation, so that subsequent phases have a contract to fill. This is the spine on which the entire OS hangs.

**Features.**
1. *Analysis and Recommendation stages.* Extend the live generate path so that `context-binder.ts` output flows through an Analysis stage (which applies reasoning frameworks — should-cost, delivery-model gate, proposal-normalization) and a Recommendation stage before `server.ts` calls Claude. The seam is precisely the boundary between the binder and the model call in `server.ts` / the generate route. This is the architectural gap named first in our internal grounding notes.
2. *The Reasoning Envelope as output contract.* Every generation emits the structured envelope (claims, supporting evidence with citations, assumptions tested/rejected, confidence band, caveats, decision trace), extending the metadata seam already present in `agent-generation/types.ts` (today only model/tokens/stop-reason are captured).
3. *Archetype activation.* Wire `classifySourcingEvent()` (`classifier/category-classifier.ts`) into the live path at intake so the stored `archetype: string` field on `types.ts` and `SourceRigorLevel` actually drive framework selection and evidence thresholds — today the classifier runs *only* inside the dormant `source-answer-engine.ts` and fixtures.
4. *Grounded refusal.* Build the evidence-or-refuse module (ABSENT today) and wire it into `source-answer-engine.ts`, promoting that engine from dormant side-path to live spine. This is net-new and must not be confused with the SHIPPED `disclosure-flag/` legal-privilege classifier, which does a different job (privilege inheritance, not insufficiency refusal).
5. *Pipeline observability.* Capture an end-to-end reasoning trace — evidence retrieved, framework/playbook selected and why, score per decision point — extending `body_generation_metadata`.

**Dependencies.** None upstream — this is the foundation. It depends only on the existing live pipeline (`context-binder.ts`, `agent-generation/prompt-registry.ts`, `server.ts`, the generate route) and the dormant logic to be activated (`source-answer-engine.ts`, `category-classifier.ts`, `should-cost-model.ts`, `delivery-model-gate.ts`, `proposal-normalization.ts`). A nuance to carry honestly: `should-cost-model.ts` *is* imported and called (`estimateEventShouldCost`) by `source-answer-engine.ts`, so it has a real call-site there — but that engine is dormant, and the module's own header comment still reads "Standalone — NOT wired into source-answer-engine.ts," which is now stale. Either way, should-cost is not reached by the live generate-route pipeline today; Phase 1 brings it onto the live spine.

**Risks.** (a) *Scope creep into deliverable breadth* — the temptation to fix the 30 unbuilt templates now; resist, because breadth without the spine produces more un-reasoned documents. (b) *Refusal over-triggering* — a refusal module set too conservatively will decline on adequate evidence and erode trust; mitigate with calibration against real events and a sponsor-visible override path. (c) *Latency regression* — two new reasoning stages plus a synthesis call add token cost and wall-clock time to generation; budget for it and instrument from day one.

**Success metrics.** Reasoning-trace coverage on generated artifacts moves from 0% to 100% for the three live templates (d01/d05/d09); archetype classification runs on 100% of new events at intake; grounded refusal demonstrably declines on a real under-evidenced event and the decision is auditable; the should-cost baseline computed in Analysis is carried forward and cited in the d01/d02 envelope.

**Engineering impact.** Touches the busiest seam in the subsystem (`server.ts` and the generate route are on every artifact creation). Requires the new `reasoning_envelopes` / `reasoning_traces` entities (Vol 3, Ch 13) at the data layer — so a migration ships in this phase. The broker boundary (knowledge/reasoning reached only through a contract, never direct import) must be established here, because it is far cheaper to enforce on a small surface now than retrofit across seven phases.

**Product impact.** The first visible product change is that a generated d01 strategy memo now shows *why* — the evidence that shaped it, the assumptions tested, a confidence band — via the cross-surface reasoning-trace panel (Vol 3, Ch 14). This is the literal first instance of the OS thesis on screen. It reframes the product from "generates a document" to "shows its reasoning," which is the demonstrable differentiation the investor audience is being asked to fund.

### 16.3 Phase 2 — Evaluation Engine

**Objective.** Produce defensible, evidence-anchored vendor scores and rankings — the first live *commercial* reasoning the system performs, and the input BAFO requires. Replace today's display-only d16 scorecard (`scorecard.ts` is a display surface, not a scoring engine) with a real consensus-scoring engine.

**Features.**
1. *Multi-rater weighted scoring* — criterion weights under governance, per-rater submission, aggregation; generation of d16 (scorecard) and d17 (weight log).
2. *Consensus and deviation flagging* — automatic flagging of >N-point inter-rater deviation with a re-rate workflow; calibration-session support; blind vs open scoring modes.
3. *Evidence-anchored scoring* — each score links to evidence citations drawn through the artifact-registry parse layer and the evidence-trace store; generation of d18 (disqualification log) with a complete evidence chain. Note that `artifact-registry/text-parser.ts` is the synchronous first-mile parser for *text-like* uploads only (pasted notes / Markdown / text / CSV via `extractLabeledLines` / `extractPricingComponents`, parser id `source_text_first_mile_v1`); it does not read binary vendor documents. Rich binary parsing (docx/pdf/xlsx) is a net-new Source capability — or must reuse the Moves-side async pipeline (`src/lib/programs/` doc-parser, `attachments/extract-text`) — and the evidence chain's completeness depends on building it, not on extending `text-parser.ts`.
4. *Confidence and weight-sensitivity analysis* — score-level confidence, plus "if reliability weight +10 points, does the ranking flip?" what-if modeling for the Evaluation Workbench.
5. *Executive evaluation output* — board-grade evaluation summary emitted as a Reasoning Envelope, consumable by Phase 4 Selection and the Executive Cockpit.

**Dependencies.** Phase 1's Reasoning Envelope (scores and rationale serialize into it) and observability trace. The d16–d18 templates exist as stubs (`src/content/source-templates/evaluation/`); they need generation logic and live payload binding (`exports/payloads/scorecard-payload.ts` today "does NOT wire rater submissions or weight-change deltas").

**Risks.** (a) *Scorer adoption* — multi-rater scoring is a behavior change for evaluation committees; if the workbench is friction-heavy, raters revert to spreadsheets and the engine starves. (b) *Weight governance disputes* — sensitivity analysis can surface that the ranking is weight-fragile, which is politically uncomfortable; this is a feature (it is the truth) but must be framed as rigor, not as the tool "changing the answer." (c) *Evidence-link gaps* — if parsed vendor responses are thin, evidence-anchoring degrades to assertion; gate the engine's confidence on parse completeness.

**Success metrics.** d16/d17/d18 generate live for a real event; 100% of scores carry an evidence citation; deviation flagging triggers a real re-rate on a real committee disagreement; sensitivity analysis demonstrably surfaces a weight-fragile ranking; the evaluation envelope is consumed by a Phase-4 dry run.

**Engineering impact.** New entities `scorecard_submissions` (per-rater) and the binding of `scorecard-payload.ts` to live submissions. Extracting scorable structure from binary vendor responses is a parser-*build* dependency, not just a wiring task: the first-mile `text-parser.ts` covers only text/CSV, so docx/pdf/xlsx response parsing is net-new (or a reuse of the Moves-side async extract pipeline).

**Product impact.** The Evaluation Workbench (Vol 3, Ch 14) becomes the first true reasoning surface beyond strategy: raters submit, deviations surface for review, evidence drills down, sensitivity is explorable. For the CIO Advisory Board audience this is the first artifact that visibly defends a vendor decision the way a McKinsey evaluation deck does.

### 16.4 Phase 3 — BAFO Engine

**Objective.** Capture negotiation leverage as hard dollars — the single largest economic lever in the program (Volume 1: a disciplined leverage-informed BAFO is estimated to capture an incremental 8–20% (illustrative range) beyond the first-round "best" offer). Promote the partial, fixture-bound commercial layer to a computed engine over live, normalized vendor pricing.

**Features.**
1. *The pricing-template / structured-submission workflow* — the canon carries one pricing code, **d19** (`d19_pricing_workbook`); the internal-grounding notes treat the structured pricing-template-to-submission chain as one of the most load-bearing gaps in the system. To make it concrete we describe three *proposed net-new sub-artifacts* — d19a (a structured pricing template sent to vendors), d19b (the structured submissions returned), d19c (the normalized result) — which are **not in the 33-code canon**; they are informal sub-steps of d19. Without a structured template to send vendors, there are no structured submissions, no normalization, and no trap log (d20). This is the first thing to build in the phase.
2. *Live pricing normalization* — the eight-dimension matrix (scope, assumptions, rates, accelerators, IP, security, transition, SLAs) in `pricing-normalization.ts` consuming real submissions through `pricing-submissions/dao.ts`, replacing the empty-set runs of today.
3. *Computed leverage and EV models* — promote `bafo-negotiation-model.ts` from seeded levers to a model computing leverage state (competitive tension, switching cost, incumbency, evidence asymmetry, time pressure) and conservative/base/stretch expected-value scenarios (`saving × probability`, risk-adjusted).
4. *Negotiation strategy and concession tracking* — per-vendor concession ladders with explicit, sponsor-set walk-away thresholds; generation of d22 (BAFO question pack), d23 (round log), and d20 (pricing trap log) with reasoning.
5. *Tactical models* — competitive-pressure, timing/fiscal-window, and sponsor/air-cover models that modulate the strategy (`commercial-signals.ts`, `commercial-mission-adapter.ts`).

**Dependencies.** Phase 2's ranked, scored field (leverage is computed against the competitive set). Phase 1's envelope and the should-cost baseline (the normalization reference). The pricing-submissions persistence path must exist — this is the most data-layer-intensive phase.

**Risks.** (a) *Vendor non-compliance with the template* — if vendors submit free-form pricing, normalization parsing fails; mitigate with a strict pricing-template structure (the proposed d19a sub-artifact) and a parse-or-reject intake gate. (b) *Walk-away discipline as a soft suggestion* — Volume 1 is explicit that the walk-away threshold "must be enforced by the system as a hard line, not a suggestion"; if the engine treats it as advisory, the system replicates the amateur failure it exists to prevent. (c) *EV overconfidence* — savings-probability estimates without market calibration (which arrives only in Phase 7) must carry conservative defaults and visible caveats, or the board is shown manufactured precision.

**Success metrics.** the structured pricing template (proposed d19a) generates and is sent to real vendors; real submissions parse into the normalization matrix; a computed leverage state and EV scenarios are produced for a real finalist field; a walk-away threshold is set with a sponsor and enforced; d20/d22/d23 generate with reasoning; captured savings on a real event are measured against the should-cost baseline.

**Engineering impact.** The heaviest data and parsing phase: `pricing-submissions/dao.ts`, the `vendor_proposals` (normalized) and `negotiation_rounds` entities, and a robust pricing parser. The renderers exist (`exports/renderers/pricing-comparison.ts`, `bafo-question-pack.ts`); the work is payload-to-live-data binding, which the audit flags as disconnected today.

**Product impact.** The BAFO Command Center (Vol 3, Ch 14) — leverage dashboard, per-vendor strategy, concession tracker, EV scenario modeling, pricing-trap log. This is the surface where the product most visibly earns its keep: it is where the hard-dollar story to the board is generated, and it is the strongest differentiation against generic e-sourcing tools that stop at price collection.

### 16.5 Phase 4 — Selection Engine

**Objective.** Produce a board-grade, risk-adjusted award recommendation with calibrated confidence, and close the governance loop with enforced approvals and a waiver workflow. This is where gates stop being advisory.

**Features.**
1. *Live award derivation* — promote `award-decision-view.ts` and `vendor-selection-readiness.ts` from fixtures to live derivation from Phase-2 evaluation and Phase-3 BAFO outputs.
2. *Risk adjustment and tie-breaks* — risk-adjust raw scores (transition risk, supplier concentration, liability exposure via `commercial-risk-detection.ts`) with explicit, auditable tie-break logic; generation of d27 (selection memo).
3. *Recommendation-level confidence* — replace the coarse three-level confidence heuristic in `executive-decision-summary.ts` with a calibrated band rolling up evidence sufficiency, score margin, and unresolved assumptions.
4. *Board decision packet* — coherent assembly of d24 (decision brief), d25 (risk attestation), d26 (Steward sign-off) with signature blocks and the attached reasoning envelope. The deal-pack route already assembles a combined document and returns 200 today; the real gap is **multi-artifact ZIP bundling** of the packet, not a non-functional stub. One naming note to reconcile: the d24 template is literally titled "Atlas Decision Brief" in the repo and other packet codes carry Steward/Nexus voicing — under the one-front-agent doctrine, **Sentinel is the single front agent for Source**, and Atlas/Steward/Nexus are internal voices, not competing front-agent brands on the board packet. The assembled packet must present under Sentinel, with those internal voices subordinated.
5. *Approval enforcement and waiver workflow* — gates move from advisory to **blocking** in `source-governance-enforcement.ts`, wired to the gate-criterion-state mutation route (`.../gate-criteria/[criterionId]/state/route.ts`); waiver request generation, a waiver registry, and gate-variance tracking close the loop the audit flags as "undefined" today.
6. *The PDF path* — `render-pdf/route.ts` already works (returns HTTP 200): it imports `@react-pdf/renderer`, gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and emits a PDF buffer; codes not yet wired return 404. PDF rendering is live today for **d05/d09/d24/d27**. The real Phase-4 work is **extending coverage** to the remaining packet codes (d25/d26/d28) and adding signature blocks, not standing up rendering from nothing.

**Dependencies.** Phases 2 and 3 (the recommendation derives from both). The 38 gate criteria in `gate-criteria.ts` and the governance enforcement functions (`evaluateCriterionMetReadiness`, `evaluateStagePromotionReadiness`) already exist as evaluators — this phase hooks them into mutations so they actually block.

**Risks.** (a) *Blocking gates as adoption friction* — the moment gates block, users who could previously advance freely will hit walls; the waiver workflow is the pressure-release valve and must ship simultaneously, or users route around the system. (b) *PDF coverage and fidelity* — rendering already works for d05/d09/d24/d27, but extending it to the remaining packet codes and adding signed-document fidelity (signature blocks, pagination, attachments) is deceptively heavy; do not under-budget it. (c) *Confidence miscalibration on the recommendation* — a confidently-wrong award recommendation is the highest-consequence error in the system; the confidence model must be conservative and the dissent-capture path real.

**Success metrics.** A real award recommendation is derived live from evaluation + BAFO; a hard gate demonstrably blocks an under-prepared advancement on a real event and a waiver resolves it with an audit trail; d24–d27 generate and assemble into a board packet exported as signed PDF (PDF coverage extended from the existing d05/d09/d24/d27 baseline to the full packet); recommendation confidence is calibrated against a known-good real decision.

**Engineering impact.** The governance wiring is the highest-stakes change: it converts a read-only evaluator into a write-path enforcer. New entities `waivers` and gate-variance tracking. PDF rendering infrastructure already exists for d05/d09/d24/d27 — the build extends `isPdfGeneratable` coverage and signature blocks rather than creating it. The mutation route must atomically check the gate and the waiver state.

**Product impact.** The Selection Center and Executive Cockpit (Vol 3, Ch 14) — ranked recommendation with confidence, decision options with rationale, risk attestation, sign-off capture. For the founder and investor audience this is the capstone of the "decision product" thesis: the system now produces the board paper, not just the working documents, and governance is visibly a feature (it blocks, it waives, it audits) rather than friction bolted on.

### 16.6 Phase 5 — Contract Intelligence

**Objective.** Verify that the signed contract matches what was negotiated and scored — catching the contradictions that destroy value after award (the canonical example: "tier-1 SLA claimed in the proposal, contract says best-effort").

**Features.**
1. *Contract parser upgrade* — extend `artifact-registry/upload-contract.ts` to extract clauses, SLAs, and commercial terms from uploaded contracts with source-location evidence (consistent with the context-ingestion truth standard: extraction must preserve source citations and, for document formats, enter review-required status).
2. *Redline and clause-gap analysis* — compare extracted clauses to standard positions and detect gaps; the renderer exists (`exports/renderers/ai-clause-gap.ts`) but the reasoning does not.
3. *Liability, SLA and commercial verification* — check contract terms against the negotiated BAFO outcome and scorecard commitments, linking findings to the d25 risk attestation; reuse `commercial-risk-detection.ts` patterns.
4. *d28 contract record* generation as the anchor artifact, with the verification findings and reasoning trace attached.
5. *Contract Center UX* — redline/SLA/liability findings rendered with reasoning trace, routed to legal sign-off.

**Dependencies.** Phase 4's award and the negotiated BAFO outcome (the verification baseline). The artifact-registry upload and parse path (SHIPPED for intake; the clause-level extraction is the upgrade).

**Risks.** (a) *Parser accuracy on legal prose* — clause extraction from contracts is genuinely hard; per the truth standard, document-derived extraction must enter review-required status, not auto-commit, until a tested template-specific parser proves deterministic mapping. (b) *Legal-privilege handling* — uploaded contracts may carry privilege; the SHIPPED `disclosure-flag/` classifier must tag them and propagate the flag downstream. (c) *False-contradiction noise* — over-flagging trivial clause differences erodes legal-team trust; tune for material contradictions.

**Success metrics.** A real contract uploaded, parsed to clauses with source citations; a real SLA-vs-proposal contradiction surfaced; d28 generated with verification findings; the Contract Center routes a finding to legal with reasoning trace; privilege flags propagate correctly.

**Engineering impact.** Parser-heavy, lower data-model footprint than Phases 3–4. The clause-extraction quality bar gates the value; budget for review-required workflows rather than full automation initially.

**Product impact.** The Contract Center extends the OS past the award into execution — closing the "we negotiated it but the contract gave it back" gap that procurement organizations live with. This is a credibility feature for the CIO Advisory Board: it shows the system protects realized value, not just modeled value.

### 16.7 Phase 6 — Transition Intelligence

**Objective.** Replace today's fixture-derived transition readiness with a real quantitative readiness model, and track knowledge transfer to the point where contracted value can actually be realized.

**Features.**
1. *Quantitative readiness scoring* — a model over KT-plan maturity, parallel-run scope, cutover sequencing, and rollback depth, replacing the fixture-builder output of `transition-readiness-view.ts` (it assembles a readiness view rather than computing a scored model); generation of d29 (transition plan).
2. *Knowledge-transfer tracking* — d30 (checkpoint log) and d31 (KT evidence): what knowledge moved, verified by whom, with gaps flagged and linked to evidence.
3. *Risk monitoring and blackout management* — continuous transition-risk monitoring with escalation when checkpoints slip, routed through `commercial-mission-queue.ts`; blackout-window management.
4. *Value handoff* — d32 (value ledger) and d33 (governance review) connecting contracted value commitments to measured realization, closing the lifecycle loop into `value-ledger.ts` (today minimal).
5. *Transition Center UX* — readiness, KT, and risk-monitoring surfaces with the reasoning-trace panel.

**Dependencies.** Phase 4's award and Phase 5's contract (transition is scored for a selected, contracted vendor). May run partly parallel to Phase 5 since both depend only on the award.

**Risks.** (a) *Readiness-model calibration* — a quantitative score is only as good as its inputs; if KT-plan maturity is self-reported, the score is gameable; anchor to evidence where possible. (b) *Value-realization measurement* — connecting committed to realized value requires post-go-live data the system may not receive; design for graceful degradation when realization data is absent. (c) *Monitoring fatigue* — continuous risk monitoring that cries wolf will be ignored; tune escalation thresholds.

**Success metrics.** A real transition scored quantitatively; d29–d31 generate; a checkpoint slip triggers a real escalation; d32 value ledger connects at least one contracted commitment to a measured outcome; the lifecycle loop (intake → value) is demonstrably closed on one real event.

**Engineering impact.** Moderate; reuses the mission-queue and value-ledger seams. The value-ledger entity needs indexing, since the JSON ledger is not currently indexed for portfolio-scale retrieval.

**Product impact.** The Transition Center and value handoff complete the lifecycle: the OS now spans intake to realized value, which is the full arc Volume 1's consulting story-arc demands. For the founder this is the "we don't just pick the vendor, we land the value" claim made real.

### 16.8 Phase 7 — Full Source Intelligence Platform

**Objective.** Add the external market brain and portfolio-level reasoning that turn internally-rigorous reasoning into market-calibrated reasoning — and automate the renewal window where prior-event value silently drifts away.

**Features.**
1. *Market Intelligence Layer* — vendor profiles (capabilities, references, financials, AI maturity), peer benchmarks, and pricing/savings intel, built as a distinct knowledge plane (Vol 3, Ch 11) feeding evaluation and BAFO leverage analysis.
2. *Semantic pattern retrieval* — upgrade Sentinel pattern matching from keyword/slug to embedding-based semantic retrieval with live evidence-count updates (`sentinel/orchestrator.ts`, `pattern-manifest.ts`).
3. *Portfolio-level reasoning* — cross-event analysis: supplier concentration across the portfolio, conflicting commitments, aggregate leverage.
4. *Renewal-window automation* — detect approaching renewals and drifting value targets before they expire, integrating `commercial-risk-detection.ts` into portfolio reasoning (today it is not portfolio-integrated).
5. *Full multi-agent coordination* — replace the string-based handoff with a state machine that detects cross-agent contradictions and risk amplification, with human-escalation triggers (Vol 3, Ch 12); the specialist registry replaces the hardcoded-in-orchestrator builders and upgrades the seven runtime specialist builders from deterministic-prose-only to model-backed, persisted reasoning (the model-backed logic is unbuilt/test-only today).

**Dependencies.** All prior phases — market intelligence calibrates engines that must first be trustworthy; portfolio reasoning needs multiple completed events with envelopes; renewal automation needs the value targets Phases 1–6 produce.

**Risks.** (a) *Market-data acquisition* — this is the "one genuinely absent category" (Volume 1); benchmarks and vendor profiles are externally-sourced data AbarVa must acquire or build, a procurement/partnership problem, not only an engineering one. (b) *Calibration corrupting good internal reasoning* — bad market data is worse than none; gate market calibration behind data-quality thresholds. (c) *Coordination complexity* — the multi-agent state machine is the most architecturally complex deliverable; phase it last deliberately.

**Success metrics.** A vendor profile demonstrably sharpens a real leverage analysis; semantic retrieval outperforms keyword retrieval on a held-out question set; a real renewal window is detected and surfaced ahead of expiry; the coordination state machine detects a real cross-agent contradiction; all seven specialists run model-backed in production (not merely as deterministic-prose builders).

**Engineering impact.** The largest knowledge-layer build (new `vendor_profiles`, `benchmarks` entities, embedding infrastructure) and the most complex agent-coordination logic. The broker boundary established in Phase 1 pays off here, as the knowledge plane is finally populated.

**Product impact.** Source becomes a platform, not a workflow: it reasons across the portfolio, calibrates against the market, and acts on renewals autonomously. This is the full investment thesis realized — the durable, defensible IP (governed reasoning + market calibration) that distinguishes the OS from any document generator or commodity e-sourcing suite.

### 16.9 Cross-Phase Success Metrics, Risk Register & Governance

#### Program-level success metrics

A board funds an outcome, not a feature list. Five cross-program metrics track whether the OS thesis is being realized, measured at every phase gate:

| Metric | What it measures | Baseline (today) | Trajectory |
|---|---|---|---|
| **Reasoning-trace coverage** | % of generated artifacts carrying a complete Reasoning Envelope | 0% | P1: 100% of live templates → P7: 100% of all generated artifacts |
| **Deliverable quality-gate pass rate** | % of generations passing the quality gate (0 unsupported claims, 0 leaks, evidence-cited) | n/a (no gate) | P1 onward, rising; never declared "passing" on fixtures |
| **Cycle time** | Calendar time, intake to award, on a real event | uninstrumented | falling as engines automate evaluation/BAFO/selection |
| **Savings captured vs should-cost** | Hard-dollar delta against the computed baseline | unmeasured | first measurable at P3; the program's primary ROI signal |
| **Decision confidence** | Calibrated confidence on the award recommendation, validated against outcomes | coarse three-level heuristic | calibrated band from P4; validated over multiple real events |

The discipline is that each metric is reported from a **live ACA run**, never a fixture. "Savings captured" in particular is the metric the back-loaded ROI curve rests on; it cannot be claimed before Phase 3 wires live pricing normalization, and any earlier savings figure would be illustrative only.

#### Consolidated risk register

| Risk | Phase exposure | Severity | Mitigation |
|---|---|---|---|
| Fixture-bound logic declared "shipped" | All | **Critical** | Uniform live-ACA-run phase gate; release record required; the program's defining control |
| Reasoning spine slips → all phases blocked | P1 | **Critical** | Protect P1 scope ruthlessly; defer deliverable breadth |
| Refusal/confidence miscalibration → confidently wrong | P1, P4 | High | Conservative defaults, sponsor override, validation against known-good real decisions |
| Pricing template / parser fails on real vendor input | P3 | High | Strict pricing-template structure (proposed d19a), parse-or-reject intake gate |
| Walk-away threshold treated as advisory | P3 | High | Enforce as a hard line per Vol 1; sponsor-set, system-enforced |
| Blocking gates drive users around the system | P4 | High | Ship waiver workflow simultaneously with blocking enforcement |
| Contract/transition extraction inaccurate on real docs | P5, P6 | Medium | Review-required status per truth standard; no auto-commit of document-derived facts |
| Market data unavailable or low-quality | P7 | Medium | Treat as acquisition problem early; gate calibration on data-quality thresholds |
| Latency/cost regression from added reasoning stages | P1+ | Medium | Instrument from P1; budget token/wall-clock cost per phase |
| Multi-agent coordination complexity | P7 | Medium | Sequence last; build on the broker boundary established in P1 |

#### Release-control governance

This program is built under the repository's release-control discipline, and the chapter is explicit about how it applies. Every phase is a controlled release candidate, not merely a PR. Each phase classifies its release lane: the reasoning spine, evaluation, BAFO, and selection engines are `global-control-lane` (shared control-plane behavior, feature-gated until live-proven); any work touching per-event evidence, vendor pricing, or tenant corpus is `client-data-lane`; capabilities shipped behind a flag pending live proof are `experimental`. Each phase files or updates a release record under `docs/releases/records/` using the standard template, and `npm run release:check` enforces it in CI. Per the program's operating memory, `node scripts/release-check.mjs --base origin/main --head HEAD` is run locally before pushing, with exact headers (Rollout/Rollback Plan, Audit Evidence), a Layer Impact section naming the lane, and a literal Client Applicability marker.

The **Steward** is the governance voice that holds the gate at every phase. Phases 1 and 4 are where Steward enforcement materially tightens: Phase 1 introduces grounded refusal (the system declines on insufficient evidence), and Phase 4 converts the 38 gate criteria from advisory evaluators into blocking write-path enforcers with a waiver workflow. This is the through-line that makes governance a feature rather than friction — the same posture Volume 1's governance philosophy demands. The ingestion truth standard governs Phases 3, 5, and 6 specifically: where the system extracts facts from vendor pricing submissions, contracts, or transition documents, it reports each ingestion state separately and routes document-derived extraction (XLSX/PDF/DOCX) to review-required status unless a tested, deterministic parser proves the mapping — never collapsing "uploaded" and "committed and usable" into one word.

The reader leaves Chapter 16 — and Volume 4 — with the build made executable: a strict dependency-ordered sequence, a per-phase definition of objectives, features, dependencies, risks, metrics, and engineering and product impact, and a uniform proof bar that forbids confusing fixture conformance for live capability. The reasoning spine ships first because everything depends on it; money is made in Phases 3–4; governance becomes real in Phases 1 and 4; and the market brain comes last because it calibrates a system that must first be trustworthy. That is the path from a document generator to a Sourcing Intelligence Operating System.

---
*Relevant repo seams referenced in this chapter (absolute paths): `/Users/anand/Projects/nexus/src/lib/source/agent-generation/server.ts`, `/Users/anand/Projects/nexus/src/lib/source/agent-generation/context-binder.ts`, `/Users/anand/Projects/nexus/src/lib/source/source-answer-engine.ts`, `/Users/anand/Projects/nexus/src/lib/source/classifier/category-classifier.ts`, `/Users/anand/Projects/nexus/src/lib/source/scorecard.ts`, `/Users/anand/Projects/nexus/src/lib/source/pricing-normalization.ts`, `/Users/anand/Projects/nexus/src/lib/source/pricing-submissions/dao.ts`, `/Users/anand/Projects/nexus/src/lib/source/bafo-negotiation-model.ts`, `/Users/anand/Projects/nexus/src/lib/source/award-decision-view.ts`, `/Users/anand/Projects/nexus/src/lib/source/source-governance-enforcement.ts`, `/Users/anand/Projects/nexus/src/lib/source/canonical-specs/gate-criteria.ts`, `/Users/anand/Projects/nexus/src/lib/source/artifact-registry/upload-contract.ts`, `/Users/anand/Projects/nexus/src/lib/source/transition-readiness-view.ts`, `/Users/anand/Projects/nexus/src/lib/source/value-ledger.ts`, `/Users/anand/Projects/nexus/src/lib/intelligence/pattern-manifest.ts`, `/Users/anand/Projects/nexus/src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`.*
