# AbarVa Source Intelligence Operating System Specification
## Master Outline (all volumes)

> Total page estimate: **~126 pages** · 2026-06-19
> Volume 1 is authored in full (see VOLUME_1_CURRENT_AND_FUTURE_STATE.md). Volumes 2-4 are outlined here and authored on green-light.

### Front Matter
- **Title Page** — AbarVa Source Intelligence Operating System Specification: from document generator to sourcing intelligence OS; version, classification (board-grade, confidential), authoring authority (combined McKinsey/Bain/Kearney/Gartner/CPO/AI-Architect/Procurement-Exec voice)
- **Audience & Mandate** — who this is for (Founder, Product Leadership, AI Architecture, Engineering, Investors, CIO Advisory Board) and what decision each audience must be able to make after reading
- **How to Read This Document** — three reading paths (executive 30-min path = Vol1 Ch1+Ch4; architecture path = Vol2+Vol3; build path = Vol3 Deliverable Architecture + Roadmap); reading conventions (maturity scores 1-5, stage codes S0-S7, deliverable codes d01-d33, real-file citations)
- **Document Map** — visual table of the three volumes + roadmap, what each answers, and the dependency order in which they should be consumed
- **Glossary & Canonical Vocabulary** — stage codes (S0_intake..S7_activate), deliverable codes (d01..d33), agent names (Sentinel/Nexus/Atlas/Steward), readiness ramp states, gate severity (hard/soft/informational), archetypes (AMS/ERP-SI/AI-data-platform/renewal), key system terms (canvas substrate, context binder, prompt registry, reasoning envelope)
- **Source-of-Truth & Grounding Statement** — every current-state claim is tied to a real repo path; convention for distinguishing SHIPPED vs PARTIAL vs DORMANT vs ABSENT; how maturity scores were derived

---

## Volume 1 — Current State + Future State  _(~46pp)_

### Ch 1. Executive Summary  _(~10pp)_
- **The Thesis: From Document Generator to Sourcing Intelligence Operating System** — Argue the thesis and frame the rest of the document.  
  _grounding:_ `src/lib/source/agent-generation/context-binder.ts`, `src/lib/source/agent-generation/prompt-registry.ts`, `src/lib/source/source-answer-engine.ts`
- **What Exists Today — Honest Maturity Snapshot** — One-page truth table: specification/governance layers are mature (4-5), generation covers only 3 of 33 templates (d01/d05/d09), specialists and evaluation/BAFO are DORMANT or fixture-driven. Make the gap between spec maturity and runtime maturity the headline tension.  
  _grounding:_ `src/lib/source/canonical-specs/artifact-specs.ts`, `src/lib/source/__tests__/specialists/`, `src/lib/source/bafo-negotiation.ts`
- **The Five Load-Bearing Gaps** — Name the gaps that gate everything else: (1) no reasoning/analysis layer, (2) 30/33 deliverables unbuilt, (3) specialists test-only with no runtime call-site, (4) evaluation/BAFO/pricing run on fixtures not live vendor data, (5) gates declarative not enforced. Tie each to a real file and to a downstream business consequence.  
  _grounding:_ `src/lib/source/sentinel-source-orchestrator.ts`, `src/lib/source/pricing-normalization.ts`, `src/lib/source/source-governance-enforcement.ts`
- **Where the Value Is — Business Case in One Page** — Quantify the prize in plain English: faster cycle time, defensible vendor rankings, negotiation leverage captured, executive decision confidence, renewal-window capture. Connect each to a capability in Volumes 2-3.  
  _grounding:_ `src/lib/source/value-ledger.ts`, `src/lib/source/executive-decision-summary.ts`
- **The Path — Seven Phases at a Glance** — Preview the roadmap (Prompt+Reasoning -> Evaluation -> BAFO -> Selection -> Contract -> Transition -> Full Platform) and the sequencing logic (reasoning spine first because everything downstream depends on it).  
  _grounding:_ `docs/build/source-intelligence-os`

### Ch 2. Current State Assessment  _(~16pp)_
- **Assessment Method & Maturity Scale** — Define the 1-5 maturity scale used throughout, the eleven sourcing capability columns (origination, strategy, value-target, scope, RFP, evaluation, negotiation, selection, contracting, transition, value), and how repo evidence maps to scores. Establish the SHIPPED/PARTIAL/DORMANT/ABSENT taxonomy.  
  _grounding:_ `docs/source/STAGE_DELIVERABLES_INVENTORY.md`, `docs/build/SOURCE_BUILD_SPEC.md`
- **The Reasoning & Pipeline Core (Today)** — Walk the live pipeline file-by-file: context-binder assembles SourceGenerationContext, prompt-registry holds 3 versioned templates, server.ts calls Claude Sonnet, body+metadata persisted. Show with a box-and-arrow diagram and prose where reasoning is absent. Score it.  
  _grounding:_ `src/lib/source/agent-generation/context-binder.ts`, `src/lib/source/agent-generation/prompt-registry.ts`, `src/lib/source/agent-generation/server.ts`, `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`
- **Stage Machinery S0-S7 — Strong Spec, Weak Enforcement** — Assess the stage packs (S0_intake..S7_activate), gate-criteria catalog (57 criteria), evidence requirements (28), canvas substrate. Maturity 4-5 at definition, but gates are advisory and validation runners are never hooked into mutations. Diagnose the spec-vs-runtime divergence.  
  _grounding:_ `src/lib/source/stage-packs/S0_intake.ts`, `src/lib/source/stage-packs/S5_bafo.ts`, `src/lib/source/canonical-specs/gate-criteria.ts`, `src/lib/source/source-governance-enforcement.ts`, `src/lib/source/canvas-substrate/scaffold.ts`
- **Capability Scorecard Across the Eleven Stages** — The centerpiece table: score origination/strategy/value-target/scope/RFP/evaluation/negotiation/selection/contracting/transition/value each on maturity with the controlling file and the one-line reason. Ground every score in the provided audit. This is the quantified current-state baseline.  
  _grounding:_ `src/lib/source/canonical-specs/artifact-specs.ts`, `src/lib/source/award-decision-view.ts`, `src/lib/source/vendor-selection-readiness.ts`, `src/lib/source/transition-readiness-view.ts`
- **Deliverable Coverage — 3 of 33 Live** — Map all 33 templates (strategy d01-03, scope d04-08, rfp d09-12, responses d13-15, evaluation d16-18, pricing d19-21, bafo d22-23, executive_decision d24-26, selection d27-28, transition d29-31, value d32-33) to current build state. Highlight d19a pricing-template generator as the single most load-bearing missing artifact.  
  _grounding:_ `src/content/source-templates/`, `src/lib/source/exports/dispatch.ts`, `docs/source/DOCUMENT_FORMAT_MAP.md`
- **Evaluation / BAFO / Selection / Commercial — Built but Fixture-Bound** — Assess the partially-built commercial layer: BAFO negotiation plan, scenario compare, award decision, vendor-selection readiness, commercial signals/risk detection all exist as deterministic builders over vendor-a/b/c fixtures with no live call-site. Distinguish 'modeled' from 'operational'.  
  _grounding:_ `src/lib/source/bafo-negotiation.ts`, `src/lib/source/bafo-scenario-compare-view.ts`, `src/lib/source/award-decision-view.ts`, `src/lib/source/commercial-risk-detection.ts`, `src/lib/source/commercial-mission-adapter.ts`
- **Multi-Agent & Specialist Layer — Real Frame, Dormant Logic** — Assess Sentinel orchestrator + 7 specialists (context-validation-checker, evidence-gap-detector, next-action-recommender, minimum-data-request-generator, value-at-stake-summarizer, executive-decision-brief-writer, workflow-blocker-detector): they exist as deterministic builders/test stubs with no model calls and no persistence; briefings are transient. Score and diagnose.  
  _grounding:_ `src/lib/source/sentinel-source-orchestrator.ts`, `src/lib/source/multi-agent-types.ts`, `src/lib/source/__tests__/specialists/`, `src/lib/sentinel/orchestrator.ts`
- **The Dormant Archetype Framework & Disclosure-Flag** — Assess the Source Event Archetype Framework (4 archetypes, two-axis resolver, evidence ladder, governed grounded-answer) as DORMANT with no runtime call-site, and disclosure-flag/ as effectively unimplemented. Explain why activating these is the governance backbone of the future state.  
  _grounding:_ `src/lib/source/source-shape-resolver.ts`, `src/lib/source/classifier/category-classifier.ts`, `src/lib/source/disclosure-flag/`, `src/lib/source/source-answer-engine.ts`
- **Architecture, Workflow & Intelligence Gap Synthesis** — Consolidate the gap inventory into three buckets — Architecture gaps (no reasoning layer, no reasoning envelope, no observability), Workflow gaps (gates unenforced, no waiver flow, no cross-stage triggers, no audit trail), Intelligence gaps (no live data binding, fixture playbooks, binary confidence, no market/benchmark intel). Rank by leverage.  
  _grounding:_ `src/lib/source/agent-validation-runner.ts`, `src/lib/source/workflow-validation-runner.ts`, `src/lib/source/evidence-trace/`

### Ch 3. How Elite Sourcing Firms Actually Operate  _(~10pp)_
- **Why Study the Elite Operators** — Frame the chapter: to build a sourcing intelligence OS we must encode how the best human sourcing organizations reason, not just what documents they produce. Set up McKinsey, Bain, Accenture, Kearney, ISG, Everest, Gartner as the reference operating models.
- **The Strategy & Value-Targeting Discipline (McKinsey / Kearney)** — Describe how top firms set should-cost baselines, value targets, and category strategy before going to market — fact-base first, hypothesis-driven, clean-sheet costing. Map to where Source has should-cost-model and value-ledger but does not yet reason with them.  
  _grounding:_ `src/lib/source/should-cost/should-cost-model.ts`, `src/lib/source/value-ledger.ts`
- **Evaluation & Consensus Scoring Done Right** — Detail elite evaluation practice: weighted multi-rater scoring, calibration sessions, deviation flagging, evidence-anchored scores, blind vs open scoring. Contrast with Source's d16 scorecard being display-only with no scoring engine.  
  _grounding:_ `src/lib/source/scorecard.ts`, `src/lib/source/canonical-specs/artifact-specs.ts`
- **Negotiation & BAFO Mastery (Bain / ISG)** — Describe leverage analysis, concession ladders, walk-away thresholds, competitive-tension management, timing/sponsor plays, and expected-value scenario modeling as practiced by results-delivery firms. Map to Source's bafo-negotiation-model levers that are seeded not computed.  
  _grounding:_ `src/lib/source/bafo-negotiation-model.ts`, `src/lib/source/bafo-scenario-compare-view.ts`
- **Selection, Executive Decision-Making & Governance** — Describe how elite firms construct board-grade award recommendations: risk-adjusted ranking, decision options with rationale, dissent capture, sign-off trails. Map to Source's award-decision-view and executive-decision-summary which derive posture but don't enforce approval.  
  _grounding:_ `src/lib/source/award-decision-view.ts`, `src/lib/source/executive-decision-summary.ts`
- **Market & Benchmark Intelligence (Gartner / Everest / ISG)** — Describe the role of vendor profiles, peer benchmarks, pricing/savings intel, and AI-capability assessment in elite sourcing. Establish the case for a Market Intelligence Layer (built in Vol3) that Source entirely lacks today.  
  _grounding:_ `src/lib/source/intelligence-patterns.ts`, `src/lib/intelligence/pattern-manifest.ts`
- **The Operating-Model Translation Table** — Synthesize: a table mapping each elite-firm discipline to the AbarVa engine/agent that will encode it, and the maturity delta to close. Bridges Ch3 to Volume 2/3.

### Ch 4. Future State Vision — The Sourcing Intelligence Operating System  _(~10pp)_
- **Definition: What Makes Source an Operating System** — Define the target precisely: a system that ingests events and evidence, reasons to recommendations (vendor rankings, negotiation strategies, executive decisions), and emits documents as artifacts of that reasoning. Contrast OS vs feature-set vs document factory.  
  _grounding:_ `src/lib/source/source-answer-engine.ts`
- **First Principles & Design Philosophy** — State the governing principles: reasoning-first (analysis layer before generation), evidence-or-refuse (governed grounded-answer), promotion-only readiness, one-front-agent (Sentinel) over many specialists, separation of context/knowledge/reasoning layers. Tie each principle to the file/seam it extends.  
  _grounding:_ `src/lib/source/agent-context.ts`, `src/lib/source/disclosure-flag/`, `src/lib/source/sentinel-source-orchestrator.ts`
- **The Recommendation Philosophy** — Define how the system makes and expresses recommendations: every recommendation carries the evidence that shaped it, assumptions tested/rejected, options considered, and a defensible rationale chain. Introduce the Reasoning Envelope as the canonical output contract (detailed in Vol2).  
  _grounding:_ `src/lib/source/agent-mission-report.ts`, `src/lib/source/multi-agent-types.ts`
- **The Confidence Philosophy** — Move from binary/ternary confidence to multi-factor, explainable confidence (evidence sufficiency, recency, corroboration, model uncertainty) with confidence bands surfaced to CXOs. Explain why calibrated confidence is the trust currency of the OS.  
  _grounding:_ `src/lib/source/context-quality.ts`, `src/lib/source/evidence-trace/`
- **The Risk Philosophy** — Define how risk is detected, quantified, owned, and escalated across the lifecycle (commercial traps, evidence deficits, transition risk, contract liability). Move from flag-checking to quantified, mitigable risk with owners. Connect to commercial-risk-detection's 8 patterns as the seed.  
  _grounding:_ `src/lib/source/commercial-risk-detection.ts`, `src/lib/source/commercial-signals.ts`
- **The Governance & Refusal Philosophy** — Define the Steward-enforced governance posture: gates that block, evidence thresholds that must be met, and a disclosure-flag refusal mechanism that declines to advance or recommend on insufficient evidence. Position governance as a feature, not friction.  
  _grounding:_ `src/lib/source/source-governance-enforcement.ts`, `src/lib/source/disclosure-flag/`, `src/lib/agent/voice-doctrine/sentinel.ts`
- **Target Architecture at a Glance** — Present the full future-state architecture diagram (context layer -> knowledge layer -> reasoning layer -> engines -> agents -> deliverables -> UX surfaces) in ASCII plus prose, and show how each block maps to a Volume 2/3 chapter. The visual spine for the rest of the document.  
  _grounding:_ `src/lib/source/agent-generation/index.ts`, `src/lib/source/exports/dispatch.ts`

---

## Volume 2 — Source Intelligence Engine  _(~30pp)_

### Ch 5. The Reasoning Engine  _(~9pp)_
- **The Four-Step Pipeline: Context -> Analysis -> Recommendation -> Deliverable** — Specify the new reasoning spine that inserts Analysis and Recommendation stages between the existing context-binder and generation. Define each stage's inputs, outputs, and contract. Show exactly which seam it extends (server.ts / generate route).  
  _grounding:_ `src/lib/source/agent-generation/context-binder.ts`, `src/lib/source/agent-generation/server.ts`, `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`
- **Reasoning Frameworks Library** — Define the reusable reasoning frameworks the analysis stage applies (should-cost, delivery-model gate, proposal normalization, two-gap maturity, archetype-method library). Specify how frameworks are selected per archetype/stage and composed. Why this beats hardcoded playbooks.  
  _grounding:_ `src/lib/source/delivery-model/delivery-model-gate.ts`, `src/lib/source/should-cost/should-cost-model.ts`, `src/lib/source/proposal-normalization/proposal-normalization.ts`
- **The Reasoning Envelope — Canonical Output Contract** — Define the standardized structured envelope every reasoning step emits: claims, supporting evidence with citations, assumptions tested/rejected, confidence band, caveats/limits, decision trace. Specify the TypeScript contract and how UI/API/exports consume it. This is the keystone artifact of the OS.  
  _grounding:_ `src/lib/source/agent-mission-report.ts`, `src/lib/source/multi-agent-types.ts`, `src/lib/source/evidence-trace/`
- **Confidence, Risk & Challenge Models** — Specify the three cross-cutting models: a multi-factor confidence scorer, a risk quantification model (impact x probability x mitigability), and a challenge/red-team model that adversarially tests recommendations before they surface. Define inputs, math, and outputs.  
  _grounding:_ `src/lib/source/context-quality.ts`, `src/lib/source/commercial-risk-detection.ts`
- **Pipeline Observability & Reasoning Trace** — Specify end-to-end trace capture: what evidence was retrieved, what mode/playbook/framework was selected and why, score per decision point, model/token metadata. Define the trace store and how it powers audit and the UX reasoning panels. Extends existing body_generation_metadata.  
  _grounding:_ `src/lib/source/agent-generation/types.ts`, `src/lib/source/evidence-trace/evidence-trace.ts`
- **Activating the Dormant Archetype Framework** — Specify how to wire the dormant two-axis resolver and grounded-answer into the live path: classify at intake, drive framework/evidence-threshold selection by archetype, and route source-answer-engine through the governed refusal path. Name the swap precisely.  
  _grounding:_ `src/lib/source/source-shape-resolver.ts`, `src/lib/source/classifier/category-classifier.ts`, `src/lib/source/source-answer-engine.ts`

### Ch 6. The Vendor Evaluation Engine  _(~7pp)_
- **Engine Mandate, Inputs & Outputs** — Define the evaluation engine: consumes parsed vendor responses + scorecard criteria + weights + evidence; produces consensus scores, ranked vendors, deviation flags, and a reasoning envelope. Contrast with today's display-only d16 scorecard.  
  _grounding:_ `src/lib/source/scorecard.ts`, `src/lib/source/canonical-specs/artifact-specs.ts`
- **Scoring, Weighting & Consensus Mechanics** — Specify the weighted multi-rater scoring model: criterion weights governance, per-rater submission, aggregation, calibration, >5-point deviation flagging and re-rate workflow, blind/open modes. Define the d16/d17 generation contract.  
  _grounding:_ `src/content/source-templates/evaluation/d16_scorecard.md`, `src/content/source-templates/evaluation/d17_weight_log.md`
- **Evidence-Anchored Scoring & Disqualification** — Specify how each score links to evidence citations and how d18 disqualification rationale is generated with an evidence chain. Connect to the artifact-registry parse layer and evidence-trace.  
  _grounding:_ `src/content/source-templates/evaluation/d18_disqualification_log.md`, `src/lib/source/artifact-registry/text-parser.ts`, `src/lib/source/evidence-trace/`
- **Confidence & Sensitivity Analysis** — Specify score-confidence scoring and weight-sensitivity analysis ('if reliability weight +10pts, does the ranking flip?'). Define the what-if model and its UX surface in the Evaluation Workbench.  
  _grounding:_ `src/lib/source/award-decision-view.ts`, `src/lib/source/context-quality.ts`
- **Executive Reporting Output** — Specify how the engine emits board-grade evaluation summaries (d16 outputs + reasoning envelope) consumable by the Selection engine and Executive Cockpit. Define the export payload binding that is missing today.  
  _grounding:_ `src/lib/source/exports/renderers/scorecard.ts`, `src/lib/source/exports/payloads/scorecard-payload.ts`

### Ch 7. The BAFO Intelligence Engine  _(~8pp)_
- **Engine Mandate & The Leverage Analysis Model** — Define the BAFO engine and its core leverage-analysis model: competitive tension, switching cost, incumbency, evidence asymmetry, time pressure. Promote bafo-negotiation-model from seeded levers to a computed model over live pricing.  
  _grounding:_ `src/lib/source/bafo-negotiation.ts`, `src/lib/source/bafo-negotiation-model.ts`
- **Negotiation Strategy & Concession Tracking** — Specify per-vendor negotiation strategy generation (asks by category, concession ladder, walk-away thresholds) and a concession tracker that records rounds, gives/gets, and residual gap. Define d22 BAFO question pack and d23 round log generation.  
  _grounding:_ `src/content/source-templates/bafo/d22_bafo_question_pack.md`, `src/content/source-templates/bafo/d23_bafo_round_log.md`, `src/lib/source/bafo-negotiation-types.ts`
- **Competitive-Pressure, Timing & Sponsor Models** — Specify three tactical models: competitive-pressure (how many viable alternates and their gap), timing (deadline/fiscal-window leverage), and sponsor (executive air-cover and escalation paths). Define inputs and how they modulate the strategy.  
  _grounding:_ `src/lib/source/commercial-signals.ts`, `src/lib/source/commercial-mission-adapter.ts`
- **Playbooks as Data, Not Code** — Specify the negotiation playbook library as updatable data keyed by archetype x leverage-state, replacing hardcoded prose playbooks in source-answer-engine. Define the playbook schema and selection logic.  
  _grounding:_ `src/lib/source/source-answer-engine.ts`, `src/lib/source/negotiation`
- **Expected-Value Calculations & Scenario Modeling** — Specify the EV engine: per-lever savings x probability, conservative/base/stretch scenarios with risk levels and caveats, and cross-vendor side-by-side comparison. Promote bafo-scenario-compare-view from fixtures to computed EV over normalized pricing.  
  _grounding:_ `src/lib/source/bafo-scenario-compare-view.ts`, `src/lib/source/pricing-normalization.ts`
- **Pricing Normalization as the Engine's Fuel** — Specify the 8-dimension normalization matrix consuming real vendor submissions (d19a template -> d19b submissions -> d19c comparison -> d20 trap log). Define the parse-to-cells binding that is the system's most load-bearing missing capability.  
  _grounding:_ `src/lib/source/pricing-normalization.ts`, `src/lib/source/pricing-submissions/dao.ts`, `src/content/source-templates/pricing/d19_pricing_workbook.md`, `src/content/source-templates/pricing/d20_trap_log.md`

### Ch 8. The Selection Intelligence Engine  _(~6pp)_
- **The Recommendation Framework** — Specify how the selection engine produces a defensible award recommendation: risk-adjusted ranking, decision options ordered with rationale, pre-award conditions, and dissent capture. Promote award-decision-view from fixtures to live derivation from evaluation + BAFO outputs.  
  _grounding:_ `src/lib/source/award-decision-view.ts`, `src/lib/source/vendor-selection-readiness.ts`
- **Risk Adjustments & Tie-Break Logic** — Specify how raw scores are risk-adjusted (transition risk, concentration, liability exposure) and how tie-breaks resolve with explicit, auditable logic. Define d27 selection memo generation.  
  _grounding:_ `src/content/source-templates/selection/d27_selection_memo.md`, `src/lib/source/commercial-risk-detection.ts`
- **Confidence Scoring on the Recommendation** — Specify recommendation-level confidence: how evidence sufficiency, score margin, and unresolved assumptions roll into a calibrated confidence band shown to the board. Replace the binary heuristic in executive-decision-summary.  
  _grounding:_ `src/lib/source/executive-decision-summary.ts`
- **Board & Executive Decision Packets** — Specify generation of d24 decision brief, d25 risk attestation, d26 Steward sign-off as a coherent board packet with signature blocks and the reasoning envelope attached. Define the deal-pack assembly and PDF requirement.  
  _grounding:_ `src/content/source-templates/executive_decision/d24_decision_brief.md`, `src/content/source-templates/executive_decision/d25_risk_attestation.md`, `src/content/source-templates/executive_decision/d26_steward_signoff.md`
- **Approval Enforcement & Waiver Workflow** — Specify the post-gate human sign-off step, waiver-request generation, waiver registry, and gate-variance tracking that close the governance loop. Wire to source-governance-enforcement and the gate-criterion-state mutation path.  
  _grounding:_ `src/lib/source/source-governance-enforcement.ts`, `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`

---

## Volume 3 — Enterprise Architecture  _(~38pp)_

### Ch 9. Contract Intelligence  _(~5pp)_
- **Mandate: From Selection to Signed Contract** — Define the contract intelligence layer that picks up after award: redline analysis, liability/indemnity assessment, SLA verification, commercial-term extraction. Establish d28 contract record as the anchor artifact.  
  _grounding:_ `src/content/source-templates/selection/d28_contract_record.md`, `src/lib/source/artifact-registry/upload-contract.ts`
- **Redline & Clause-Gap Analysis** — Specify clause extraction from uploaded contracts, comparison to standard positions, and AI-clause-gap detection (the renderer exists; the reasoning does not). Define the parser upgrade needed in upload-contract.ts.  
  _grounding:_ `src/lib/source/artifact-registry/upload-contract.ts`, `src/lib/source/exports/renderers/ai-clause-gap.ts`
- **Liability, SLA & Commercial Verification** — Specify how contract terms are checked against the negotiated BAFO outcome and scorecard commitments (catch the 'tier-1 SLA claimed, contract says best-effort' contradiction). Define the verification model and risk-attestation linkage.  
  _grounding:_ `src/lib/source/commercial-risk-detection.ts`, `src/content/source-templates/executive_decision/d25_risk_attestation.md`
- **Contract Center UX & Outputs** — Specify the Contract Center surface and how redline/SLA/liability findings render with reasoning trace and route to legal sign-off.  
  _grounding:_ `src/components/source/`

### Ch 10. Transition Intelligence  _(~5pp)_
- **Mandate & Readiness Scoring Model** — Define a quantitative transition-readiness model (KT plan maturity, parallel-run scope, cutover sequencing, rollback depth) replacing today's binary keyword-derived risk. Define d29 transition plan generation.  
  _grounding:_ `src/lib/source/transition-readiness-view.ts`, `src/content/source-templates/transition/d29_transition_plan.md`
- **Knowledge-Transfer Tracking** — Specify KT evidence tracking (d31) and checkpoint logging (d30): what knowledge moved, verified by whom, with gaps flagged. Define the tracking model and its evidence linkage.  
  _grounding:_ `src/content/source-templates/transition/d30_checkpoint_log.md`, `src/content/source-templates/transition/d31_kt_evidence.md`
- **Risk Monitoring & Blackout Management** — Specify continuous transition-risk monitoring, blackout-window management, and escalation when checkpoints slip. Connect to commercial-mission-queue for action routing.  
  _grounding:_ `src/lib/source/commercial-mission-queue.ts`, `src/lib/source/transition-readiness-view.ts`
- **Transition Center UX & Handoff to Value** — Specify the Transition Center surface and the handoff into value realization (d32 value ledger, d33 governance review), closing the lifecycle loop.  
  _grounding:_ `src/content/source-templates/value/d32_value_ledger.md`, `src/content/source-templates/value/d33_governance_review.md`

### Ch 11. Market Intelligence Layer  _(~5pp)_
- **Why Source Needs a Market Brain** — Make the case for a market intelligence layer: vendor profiles, peer benchmarks, pricing/savings intel, AI-capability profiles. This is the externally-sourced knowledge that turns internal reasoning into market-calibrated reasoning.  
  _grounding:_ `src/lib/source/intelligence-patterns.ts`, `src/lib/intelligence/pattern-manifest.ts`
- **Vendor Profiles & AI-Capability Assessment** — Specify the vendor profile entity (capabilities, references, financials, AI maturity) and how it feeds evaluation and BAFO leverage analysis.  
  _grounding:_ `src/lib/source/intelligence-patterns.ts`
- **Benchmarks, Pricing & Savings Intelligence** — Specify benchmark and should-cost calibration from market data so pricing normalization and EV calcs reference real market quotes, not conservative defaults.  
  _grounding:_ `src/lib/source/should-cost/should-cost-model.ts`, `src/lib/source/pricing-normalization-model.ts`
- **Pattern Grounding & Semantic Retrieval Upgrade** — Specify upgrading Sentinel pattern matching from keyword/slug to embedding-based semantic retrieval with live evidence-count updates, feeding the reasoning engine.  
  _grounding:_ `src/lib/sentinel/orchestrator.ts`, `src/lib/intelligence/pattern-manifest.ts`, `src/lib/source/cat-pattern-instances.ts`

### Ch 12. Agent Architecture  _(~6pp)_
- **The One-Front-Agent Doctrine** — Specify Sentinel as the single front agent for Source with function-named specialists behind it; define how Nexus/Atlas/Steward voices relate. Establish the agent contract (mission, inputs, outputs, decision rights, human escalation) used for every agent below.  
  _grounding:_ `src/lib/source/sentinel-source-orchestrator.ts`, `src/lib/agent/voice-doctrine/sentinel.ts`, `src/lib/source/multi-agent-types.ts`
- **Atlas, Sentinel & Steward — Roles & Decision Rights** — Specify the three governance/value voices: Atlas (value/tower), Sentinel (validation/synthesis front), Steward (governance gate enforcement). Define each one's decision rights and what it can block vs advise.  
  _grounding:_ `src/lib/source/multi-agent-briefing.ts`, `src/lib/source/source-governance-enforcement.ts`
- **The Engine Agents — Evaluation, Negotiation, Selection** — Specify the three reasoning-engine agents as a contract: mission, inputs, outputs (reasoning envelope), decision rights, escalation. Map each to its Volume 2 engine and the specialist functions it orchestrates.  
  _grounding:_ `src/lib/source/agent-missions.ts`, `src/lib/source/commercial-mission-adapter.ts`
- **Contract, Transition & Market-Intelligence Agents** — Specify the three Volume-3 agents with the same contract, and how they hand off to/from the engine agents.  
  _grounding:_ `src/lib/source/agent-mission-types.ts`
- **Coordination, Handoff & Escalation State Machine** — Specify the multi-agent coordination model: structured (not string) handoffs, contradiction/risk-amplification detection across agents, priority negotiation, and human-escalation triggers. Replace today's string handoffTarget with a state machine.  
  _grounding:_ `src/lib/source/agent-mission-report.ts`, `src/lib/source/commercial-mission-queue.ts`
- **Specialist Registry & Plugin Architecture** — Specify a specialist registry replacing the hardcoded-in-orchestrator builders, enabling new specialists without editing the orchestrator, with the 7 existing specialists as the seed set and live wiring of the test-only implementations.  
  _grounding:_ `src/lib/source/sentinel-source-orchestrator.ts`, `src/lib/source/__tests__/specialists/`

### Ch 13. Data Architecture  _(~6pp)_
- **Current Persistence & Its Limits** — Describe the live three-table canvas substrate (artifact_states, gate_criterion_states, evidence_states) + source_events, and where it falls short (evidence never bootstrapped, no state-machine, JSON value ledger not indexed).  
  _grounding:_ `supabase/migrations/20260507230000_source_canvas_per_event_substrate.sql`, `supabase/migrations/20260430150000_source_events.sql`, `src/lib/source/canvas-substrate/types.ts`
- **New Entities for the Reasoning Layer** — Specify new tables/entities: reasoning_envelopes, reasoning_traces, vendor_proposals (normalized), scorecard_submissions, negotiation_rounds, waivers, vendor_profiles, benchmarks. Define columns, RLS, and relationships.  
  _grounding:_ `src/lib/source/canvas-substrate/types.ts`, `src/lib/source/pricing-submissions/dao.ts`
- **Context, Knowledge & Reasoning Layer Separation** — Specify the three-layer data model (context = per-event/tenant state; knowledge = market/pattern/benchmark; reasoning = traces/envelopes) and the broker boundary that app-tier code must respect.  
  _grounding:_ `src/lib/source/agent-context.ts`, `src/lib/source/context-builder.ts`
- **Graph Relationships & Evidence Lineage** — Specify the knowledge-graph edges (synthesis, contradiction, evidence_for) linking evidence to claims to gate criteria, enabling bidirectional trace from a gate to the evidence that unblocks it.  
  _grounding:_ `src/lib/source/gate-criteria-types.ts`, `src/lib/source/evidence-trace/`, `src/lib/source/artifact-gate-map.ts`
- **Evidence Readiness Ramp Enforcement** — Specify enforcing the 7-state readiness ramp at the data layer (CHECK constraints, transition audit) and bootstrapping evidence rows at event creation so gates can read real evidence state.  
  _grounding:_ `src/lib/source/canonical-specs/evidence-requirements.ts`, `src/lib/source/canvas-substrate/scaffold.ts`

### Ch 14. UX Architecture  _(~7pp)_
- **UX Principles for a Reasoning System** — Establish UX principles: surface the reasoning trace (why this recommendation, what evidence weighted highest, confidence bands), density-disciplined canvas (one row per item, status as color, forms reveal on click), and the Ask-Anything agent toolbar. Anchor in the existing component set and design-locked tokens.  
  _grounding:_ `src/components/source/`, `src/app/(maestro)/source/`
- **The Evaluation Workbench** — Specify every screen/workflow/journey of the evaluation surface: rater submission, weight governance, deviation review, sensitivity what-if, evidence drill-down. Map to the Evaluation Engine outputs.  
  _grounding:_ `src/components/source/ScorecardGovernancePanel.tsx`
- **The BAFO Command Center** — Specify the negotiation surface: leverage dashboard, per-vendor strategy, concession tracker, EV scenario modeling, pricing-trap log. Map to the BAFO Engine.  
  _grounding:_ `src/components/source/`, `src/lib/source/ams-bafo-view.ts`
- **The Selection Center & Executive Cockpit** — Specify the award-recommendation and board-decision surfaces: ranked recommendation with confidence, decision options, risk attestation, sign-off capture, and the portfolio-level Executive Cockpit.  
  _grounding:_ `src/components/source/`, `src/lib/source/executive-decision-summary.ts`
- **Contract & Transition Centers** — Specify the post-award surfaces: redline/SLA/liability review (Contract Center) and readiness/KT/risk monitoring (Transition Center).  
  _grounding:_ `src/components/source/`
- **Reasoning Trace Visualization (Cross-Surface)** — Specify the reusable reasoning-trace panel that renders the reasoning envelope (evidence weights, assumptions, confidence bands, decision trace) on every surface — the UX expression of the OS thesis.  
  _grounding:_ `src/lib/source/multi-agent-types.ts`, `src/lib/source/agent-mission-report.ts`

### Ch 15. Deliverable Architecture (d01-d33)  _(~8pp)_
- **The Deliverable Contract** — Define the canonical contract every deliverable must specify: purpose, consumer, inputs, outputs, reasoning framework, quality gates, approvals, dependencies, UI surface, prompt architecture. This is the template applied to all 33.  
  _grounding:_ `src/lib/source/canonical-specs/artifact-specs.ts`, `src/lib/source/agent-generation/prompt-registry.ts`
- **Strategy & Scope Family (d01-d08)** — Apply the deliverable contract to strategy memo, value target, archetype decision, app inventory, scope memo, exclusion log, ticket synthesis, premortem. Note d01/d05 are live; specify the rest.  
  _grounding:_ `src/content/source-templates/strategy/d01_strategy_memo.md`, `src/content/source-templates/scope/d05_scope_memo.md`
- **RFP & Responses Family (d09-d15)** — Apply the contract to RFP pack, RFI summary, response checklist, vendor shortlist, vendor responses, QA log, response completeness. Note d09 is live; specify the rest with their reasoning frameworks.  
  _grounding:_ `src/content/source-templates/rfp/d09_rfp_pack.md`, `src/content/source-templates/responses/d15_response_completeness.md`
- **Evaluation, Pricing & BAFO Family (d16-d23)** — Apply the contract to scorecard, weight log, disqualification log, pricing workbook, trap log, assumption set, BAFO question pack, round log — the engine-fed deliverables. Flag d19a as the load-bearing gap.  
  _grounding:_ `src/content/source-templates/evaluation/d16_scorecard.md`, `src/content/source-templates/pricing/d19_pricing_workbook.md`, `src/content/source-templates/bafo/d22_bafo_question_pack.md`
- **Executive Decision, Selection, Transition & Value Family (d24-d33)** — Apply the contract to decision brief, risk attestation, Steward sign-off, selection memo, contract record, transition plan, checkpoint log, KT evidence, value ledger, governance review.  
  _grounding:_ `src/content/source-templates/executive_decision/d24_decision_brief.md`, `src/content/source-templates/transition/d29_transition_plan.md`, `src/content/source-templates/value/d32_value_ledger.md`
- **Export, Format & Quality-Gate Architecture** — Specify the renderer/payload/format-router architecture, the missing PDF path, payload-to-live-data binding, and per-deliverable quality gates (0 unsupported claims, 0 leaks, evidence-cited). Tie deliverable quality to the reasoning envelope.  
  _grounding:_ `src/lib/source/exports/format-router.ts`, `src/lib/source/exports/dispatch.ts`, `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts`

---

## Volume 4 — Implementation Roadmap  _(~12pp)_

### Ch 16. Seven-Phase Delivery Plan  _(~12pp)_
- **Sequencing Logic & Cross-Phase Dependencies** — Explain why the reasoning spine ships first (everything depends on it), why evaluation precedes BAFO precedes selection, and why contract/transition follow. Present the dependency graph and the gating proof-points (live ACA private-DB run, real vendor data).  
  _grounding:_ `docs/build/source-intelligence-os`, `src/lib/source/source-answer-engine.ts`
- **Phase 1 — Prompt + Reasoning Upgrade** — Define objectives, features (insert Analysis/Recommendation stages, reasoning envelope, activate archetype framework + grounded refusal, observability), dependencies, risks, success metrics, engineering and product impact. Extends context-binder/server/generate route.  
  _grounding:_ `src/lib/source/agent-generation/server.ts`, `src/lib/source/source-shape-resolver.ts`, `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`
- **Phase 2 — Evaluation Engine** — Define objectives, features (d16-d18 generation, multi-rater scoring, consensus, deviation, sensitivity, evidence-anchored scores), dependencies on Phase 1 envelope, risks, success metrics, engineering/product impact.  
  _grounding:_ `src/lib/source/scorecard.ts`, `src/content/source-templates/evaluation/d16_scorecard.md`
- **Phase 3 — BAFO Engine** — Define objectives, features (d19a pricing template, live normalization, leverage/EV/scenario models, d20/d22/d23 generation, concession tracking), dependencies on evaluation outputs and pricing-submissions, risks, success metrics, impact.  
  _grounding:_ `src/lib/source/bafo-negotiation.ts`, `src/lib/source/pricing-normalization.ts`, `src/lib/source/pricing-submissions/dao.ts`
- **Phase 4 — Selection Engine** — Define objectives, features (live award derivation, risk adjustment, recommendation confidence, d24-d27 board packet, approval/waiver workflow, PDF path), dependencies, risks, success metrics, impact.  
  _grounding:_ `src/lib/source/award-decision-view.ts`, `src/lib/source/executive-decision-summary.ts`, `src/lib/source/source-governance-enforcement.ts`
- **Phase 5 — Contract Intelligence** — Define objectives, features (contract parser upgrade, redline/clause-gap, SLA/liability verification, d28, Contract Center), dependencies on selection output, risks, success metrics, impact.  
  _grounding:_ `src/lib/source/artifact-registry/upload-contract.ts`, `src/lib/source/exports/renderers/ai-clause-gap.ts`
- **Phase 6 — Transition Intelligence** — Define objectives, features (readiness scoring, KT tracking, risk monitoring, blackout mgmt, d29-d33, Transition Center, value handoff), dependencies, risks, success metrics, impact.  
  _grounding:_ `src/lib/source/transition-readiness-view.ts`, `src/lib/source/value-ledger.ts`
- **Phase 7 — Full Source Intelligence Platform** — Define objectives, features (market intelligence layer, semantic pattern retrieval, portfolio-level reasoning, renewal-window automation, cross-event conflict detection, full multi-agent coordination), dependencies on all prior phases, risks, success metrics, impact.  
  _grounding:_ `src/lib/intelligence/pattern-manifest.ts`, `src/lib/source/commercial-risk-detection.ts`
- **Success Metrics, Risk Register & Governance** — Define the cross-program metrics (cycle time, reasoning-trace coverage, deliverable quality-gate pass rate, savings captured, decision confidence), the consolidated risk register, and the release-control discipline (lanes, release records, live-proof requirement) governing the build.  
  _grounding:_ `docs/build/SOURCE_BUILD_SPEC.md`, `docs/source/STAGE_DELIVERABLES_INVENTORY.md`
