# AbarVa Source Intelligence Operating System Specification

> **Complete specification** · Board-Grade, Confidential · 2026-06-19
> From document generator to sourcing intelligence operating system.
> Grounded against branch `codex/corpus-wave-24`. Built via multi-agent authoring + adversarial review.

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
  _grounding:_ `src/lib/source/agent-generation/context-binder.ts`, `src/lib/source/agent-generation/prompt-registry.ts`, `src/lib/source/agent-generation/server.ts`, `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
- **Stage Machinery S0-S7 — Strong Spec, Weak Enforcement** — Assess the stage packs (S0_intake..S7_activate), gate-criteria catalog (38 criteria), evidence requirements (21), canvas substrate. Maturity 4-5 at definition, but gates are advisory and validation runners are never hooked into mutations. Diagnose the spec-vs-runtime divergence.  
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
  _grounding:_ `src/lib/source/agent-generation/context-binder.ts`, `src/lib/source/agent-generation/server.ts`, `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
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
  _grounding:_ `src/lib/source/agent-generation/server.ts`, `src/lib/source/source-shape-resolver.ts`, `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
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


\newpage

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


\newpage

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


\newpage

## Volume 3 — Enterprise Architecture

> Classification: Board-Grade, Confidential · 2026-06-19 · Grounded against branch `codex/corpus-wave-24`.
> Review verdict: **board-ready**.

## Chapter 9 — Contract Intelligence

### Mandate: From Selection to Signed Contract

The sourcing lifecycle does not end when a vendor is selected. It ends — or fails — at signature. Between the Selection engine's award recommendation (Chapter 8) and the executed master agreement lies the most under-instrumented, highest-liability stretch of the entire journey: contracting. This is where negotiated leverage either crystallizes into enforceable terms or evaporates into vendor-favorable boilerplate; where a "tier-1, 99.95% availability" SLA promised in the BAFO round silently becomes "commercially reasonable best efforts" in the redline; where an uncapped indemnity or an auto-renewing evergreen clause is buried on page 47 of a 90-page Master Services Agreement that no procurement lead has the time — or the legal training — to fully parse. Elite advisory practices (Kearney's contracting playbooks, ISG's managed-services contract benchmarks) treat contract review as a distinct, evidence-anchored discipline with its own deliverables and sign-off chain. AbarVa Source must do the same.

**Why it matters.** The value captured across every prior stage — should-cost discipline (Volume 2, Chapter 5), evaluation rigor (Chapter 6), BAFO leverage (Chapter 7), risk-adjusted selection (Chapter 8) — is only *realized* if the signed contract preserves it. A 12% negotiated discount (illustrative range) that the contract fails to bind to a multi-year price-hold is a 12% discount the vendor reclaims at first renewal. **What problem it solves.** Today there is no layer that reconciles what was *negotiated and promised* against what is *written and enforceable*. The contract arrives as an uploaded PDF and is classified by filename keyword — nothing more. **How the gap manifests in the repo:** `src/lib/source/artifact-registry/upload-contract.ts` is misleadingly named. It contains no clause extraction, no redline logic, and no commercial-term parsing. It is purely a family/format classifier: `sourceArtifactFormatFromMime()` maps MIME types to formats and `inferSourceArtifactFamily()` infers a `SourceArtifactFamily` from the filename (e.g. `name.includes('commercial')` → `pricing_workbook`). An uploaded contract is registered, hashed (SHA-256), and stored — and then it is inert. Contract intelligence, as a reasoning capability, is **ABSENT**.

The anchor artifact for this layer is **d28 contract record** (`src/content/source-templates/selection/d28_contract_record.md`), stage Selection, owner role Legal. Today d28 is a five-section markdown stub (§1 reference, §2 term, §3 commercial-terms snapshot, §4 key clauses, §5 performance bonds) with placeholder prose and no generation logic — it is one of the 30 of 33 templates with no live generator (only d01/d05/d09 are live). This chapter specifies the engine that turns d28 from a manual fill-in form into the structured output of a verification reasoning pass, and that wires the SHIPPED-but-disconnected `ai-clause-gap` renderer to a real reasoning layer behind it.

### Redline & Clause-Gap Analysis

The first capability is **clause extraction and gap analysis**: parse the uploaded contract into a structured clause inventory, classify each clause by type, and compare each against an expected standard position.

**How it works — the parser upgrade.** The entry seam is `src/lib/source/artifact-registry/upload-contract.ts` and the shared text extractor `src/lib/source/artifact-registry/text-parser.ts`. But `text-parser.ts` is, by its own header, the "synchronous, first-mile parser for text-like Source uploads" — it handles pasted notes, Markdown, plain text, and CSV, and explicitly "does not replace the async binary/parser/vector/graph pipeline." It does **not** extract text from binary docx, xlsx, or pdf: it imports no `mammoth`, no `pdf-parse`, no `exceljs` (its parser id is `source_text_first_mile_v1`, handling pasted notes / Markdown / text / CSV via `extractLabeledLines` / `extractPricingComponents`). Those binary extractors exist in the repo only on the **Moves** side under `src/lib/programs/` (the Moves attachment pipeline — `programs/doc-parser.ts` and the `attachments/extract-text` path run `mammoth`/`pdf-parse`), not in Source; the `exceljs` dependency in `src/lib/source/exports/` is used only to *write* xlsx artifacts, never to read them. Rich binary vendor-document parsing is therefore a **net-new capability for Source** — it must build the binary-extraction stage (or reuse the Moves-side async pipeline), not extend `text-parser.ts`. Contracts arrive overwhelmingly as binary pdf/docx, so the `ContractClauseExtractor` cannot simply bolt a clause-segmentation pass onto already-rich text. It needs a real binary-extraction stage wired in first — either reusing the `programs/` extractors (`mammoth` for docx, `pdf-parse` for pdf) under the Source artifact registry, or standing up the equivalent in Source — and only then segments the extracted text into a `ContractClause[]`, each carrying `{ clauseType, headingPath, sourceLocation (page/section), verbatimText, extractedTerms }`. `clauseType` is drawn from a controlled taxonomy mirroring d28 §4 — `liability_cap`, `indemnification`, `data_residency`, `ip_ownership`, `security_obligations`, `sla_framework`, `termination`, `renewal`, `price_escalation`, `audit_rights`, `exit_assistance`. This is reasoning, not regex: the extractor must run as an analysis step (the Volume 2, Chapter 5 Analysis stage applied to a contract), emitting a Reasoning Envelope so that every extracted clause carries its `sourceLocation` citation — preserving the "source location evidence" standard the AGENTS.md context-ingestion contract demands for PDF/DOCX extraction. The binary-extraction stage is therefore the first piece of net-new build scope, not an assumed primitive.

**Standard-position comparison.** Each extracted clause is compared against a `StandardClausePosition` — the enterprise's preferred fallback (e.g. "liability capped at 12 months of fees"; illustrative). The comparison yields a `ClauseGap` with a deviation classification: `aligned`, `vendor_favorable_minor`, `vendor_favorable_material`, `missing`, `non_standard`. The renderer for this already exists and ships today: `src/lib/source/exports/renderers/ai-clause-gap.ts` (plus `ai-clause-gap-docx.ts`, `ai-clause-gap-html.ts`) and its payload builder `ai-clause-gap-payload.ts`. This is the chapter's leverage point: **the renderer is built; the reasoning that should feed it is not.** Today the payload binds to fixture or placeholder data. The specification is to wire `ai-clause-gap-payload.ts` to the live `ContractClause[]` and `ClauseGap[]` output of the extractor, so the AI Clause Gap report becomes a genuine artifact of contract reasoning rather than a template.

```
  UPLOADED CONTRACT (pdf/docx)
        │  artifact-registry/index.ts  (register, SHA-256, blob)
        ▼
  binary extraction  [NET-NEW · mammoth/pdf-parse from programs/, or new]
        │  ──► raw text + page/section anchors
        ▼
  ContractClauseExtractor   [NET-NEW · Analysis stage]
        │  emits ContractClause[] + sourceLocation citations
        ▼
  StandardClausePosition library  ──► clause-by-clause compare
        │
        ▼
  ClauseGap[]  (aligned · vendor_favorable · missing · non_standard)
        │                                   │
        ▼                                   ▼
  ai-clause-gap renderer            d28 contract record §4
  (SHIPPED — wire payload)          (Key clauses, now generated)
```

**Business value.** A clause-gap pass that surfaces "indemnification: vendor-favorable material — uncapped on third-party IP claims, page 41" is the difference between a legal reviewer who reads 90 pages under deadline pressure and one who is handed a triaged, cited deviation list and reviews the five clauses that matter. Cycle-time compression on legal review and a measurable reduction in adverse terms slipping through (illustrative range: legal review effort reduced 40–60%) are the prize.

### Liability, SLA & Commercial Verification

Clause-gap analysis compares the contract to a *generic* standard. The deeper, AbarVa-differentiating capability is **commitment verification**: comparing the contract against *what this specific deal negotiated and promised*. This is the cross-stage reasoning that no document-factory can do and that elite contract managers perform manually — reconciling the signed paper against the deal's own evidence trail.

**The verification model.** The engine ingests three deal-specific sources alongside the extracted clauses:

1. **The negotiated BAFO outcome** — the finalized concessions from `d23_bafo_round_log` (d28 §3 already instructs "Cross-reference `d23_bafo_round_log` for finalized concessions"). The BAFO engine (Volume 2, Chapter 7) produces the per-lever gives/gets and walk-away thresholds; verification checks that each *agreed* concession appears, enforceably, in the contract.
2. **The scorecard commitments** — capabilities and service levels the vendor *claimed* in their proposal and were *scored on* during evaluation (Chapter 6). A vendor scored highly on "24/7 follow-the-sun support, 15-minute P1 response" must have that bound in the SLA framework.
3. **The risk attestation** — `d25_risk_attestation` (`src/content/source-templates/executive_decision/d25_risk_attestation.md`), the artifact in which the executive decision packet records the risks the board accepted on the explicit assumption of certain contractual protections.

Verification is then a structured contradiction-detection pass producing a `CommitmentVerification[]`, each entry: `{ commitmentSource (bafo|scorecard|attestation), commitmentText, contractClauseRef, verificationStatus, evidenceCitations }`. `verificationStatus` ∈ `{ verified, weakened, absent, contradicted }`. The canonical example the system must catch:

> **Scorecard commitment:** "Tier-1 SLA — 99.95% availability, financially-backed."
> **Contract §SLA framework (page 38):** "Service provider shall use commercially reasonable best efforts to maintain availability."
> **Verification status: CONTRADICTED.** The financially-backed tier-1 commitment that drove the evaluation score has become an unenforceable best-efforts clause. Risk re-attestation required before signature.

**Grounding in real code.** The pattern library for this exists in seed form: `src/lib/source/commercial-risk-detection.ts` already encodes commercial-trap patterns (pricing traps, transition risk, supplier concentration). Contract verification extends this same detection discipline to clause-vs-commitment contradictions — it is the same "flag a pattern, attach evidence, quantify" machinery pointed at the signed paper rather than at vendor pricing. The verification finding is *not* a binary flag; following the Risk Philosophy (Volume 1, Chapter 4), each contradiction carries impact × probability × mitigability and an owner, and routes into `d25_risk_attestation` as a re-attestation trigger. A contradiction at `contradicted` severity should not be silently overridable: it is the contract-stage instance of the governed evidence-or-refuse posture — the system declines to assert "contract verified" while a material negotiated commitment is unbound, and surfaces the gap to Legal and the executive sponsor rather than rendering a clean d28.

```
  d23 BAFO round log ──┐
  scorecard (d16)  ────┼──► CommitmentVerification pass
  d25 risk attestation ┘        │  (extends commercial-risk-detection.ts)
                                ▼
     ┌──────────────────────────────────────────────┐
     │ verified · weakened · absent · CONTRADICTED    │
     └──────────────────────────────────────────────┘
        │ contradicted/absent (material)
        ▼
   re-attestation trigger ──► d25 risk attestation
   (block clean d28 render until resolved or waived)
```

**Why it matters / business value.** This is the single capability that converts Source from a document generator into a contract *guardian*. The negotiated value, the evaluation rationale, and the board's risk acceptance are all reconciled against the enforceable instrument before anyone signs. The value is asymmetric and tail-shaped: most of the time it confirms alignment cheaply; occasionally it catches the one uncapped-liability or downgraded-SLA term that would have cost multiples of the entire sourcing program's savings (illustrative range). It also closes the audit loop AGENTS.md requires — every verification finding carries file-level lineage (which clause, which page, which prior artifact it contradicts).

### The d28 Contract Record as Verification Output

Today d28 is a form to be filled. In the target state, **d28 is the rendered output of the verification reasoning pass** — documents are artifacts of reasoning. Each section is populated from a reasoning step, not hand-keyed:

| d28 Section | Today (stub) | Target — populated by | Reasoning source |
|---|---|---|---|
| §1 Contract reference | Manual | Registry metadata (`artifact-registry/index.ts`): blob URI, SHA-256, executed date | Ingestion lineage |
| §2 Term | Manual | Extracted `termination`/`renewal` clauses with auto-renewal & evergreen flags | ContractClauseExtractor |
| §3 Commercial terms snapshot | Manual | BAFO-verified pricing, escalators, price-hold, penalties | CommitmentVerification vs d23 |
| §4 Key clauses | Manual | ClauseGap inventory: IP, data residency, security, indemnification, exit | Clause-gap analysis |
| §5 Performance bonds / guarantees | Manual | Extracted bond/guarantee/insurance clauses + presence check vs attestation | ContractClauseExtractor |

Crucially, d28 carries an attached **Reasoning Envelope** (Volume 2, Chapter 5): the claims ("commercial terms match negotiated BAFO outcome"), the supporting evidence with citations (clause refs + prior-artifact refs), the assumptions tested ("assumed financially-backed SLA — REJECTED, contract says best-efforts"), and a confidence band. This is what makes d28 board-defensible. d28 relates to **d27 selection memo** as its downstream enforcement check: d27 (`src/content/source-templates/selection/d27_selection_memo.md`) records *why this vendor was chosen* — the risk-adjusted ranking and the conditions of award (Chapter 8). d28 then verifies *that the contract honors the basis of that choice*. A pre-award condition recorded in d27 ("award conditional on financially-backed tier-1 SLA") becomes a verification assertion in d28 ("contract binds financially-backed tier-1 SLA — VERIFIED" or, failing that, a blocking contradiction). The selection memo's conditions are the contract record's checklist; the two artifacts form a closed condition→verification loop.

### Contract Center UX & Outputs

The reasoning surfaces through a dedicated **Contract Center** under `src/app/(maestro)/source/` with components in `src/components/source/`, following the design-locked density contract (one row per item, status as color, detail one level down, forms reveal on click). It is not a document viewer; it is a triage and sign-off cockpit.

**Layout — three-pane verification cockpit:**

```
┌── CONTRACT CENTER · [Event] · stage S6 Contract ──────────────┐
│ Verification readiness: ● 3 contradictions · 5 vendor-favorable │
├───────────────┬──────────────────────────┬───────────────────┤
│ CLAUSE LEDGER │  CLAUSE / FINDING DETAIL  │ REASONING TRACE   │
│ (one row/each)│  (revealed on click)      │ (envelope panel)  │
│ ● Indemnity   │  Verbatim text · p.41     │ Claim · evidence  │
│ ● SLA  CONTRA │  vs standard position     │ Assumption tested │
│ ○ IP   aligned│  vs scorecard commitment  │ Confidence band   │
│ ● Renewal warn│  → re-attestation needed  │ Decision trace    │
└───────────────┴──────────────────────────┴───────────────────┘
   [Route to Legal sign-off]   [Request waiver]   [Render d28]
```

Color encodes verification status (red = contradicted/material, amber = vendor-favorable/weakened, green = aligned). Clicking a clause row reveals the verbatim contract text with its page citation alongside both comparison axes — standard position and deal commitment — and the reasoning trace renders the Reasoning Envelope (the cross-surface trace panel from Volume 3, Chapter 14). **Routing to legal sign-off** is the governance close: the Contract Center binds to the gate-criterion-state mutation path (`src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`) and the governance enforcement layer (`src/lib/source/source-governance-enforcement.ts`). The Selection→Transition gate cannot be marked `met` while a `contradicted` material finding is unresolved; resolution is either a vendor redline (re-upload → re-verify) or an explicit, audited **waiver** carrying the approver, rationale, and accepted residual risk — wired to the same waiver workflow specified for the Selection engine (Chapter 8). Steward is the governing voice here: it does not author the contract, it refuses to certify d28 as verified on insufficient or contradicted evidence. (Sentinel remains the single front agent for Source; Steward, like Atlas and Nexus, is an internal governing voice surfaced in the trace, not a competing front-agent brand on the packet.)

**Outputs.** From the Contract Center, d28 renders through the existing export pipeline (`src/lib/source/exports/dispatch.ts` → `format-router.ts`), and the AI Clause Gap report renders via the already-shipped `ai-clause-gap` renderers. The board-grade requirement is that d28 and d25 (risk attestation) ship as signed PDFs. The PDF path itself is already built and live: `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts` imports `@react-pdf/renderer`, gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and returns a print-ready PDF (`status: 200`) — but only for the four artifact codes wired today (`d05_scope_memo`, `d09_rfp_pack`, `d24_decision_brief`, `d27_selection_memo`); any code not yet wired returns **404** (not 501). The real gap for the contract stage is therefore neither a 501 nor an unbuilt route — it is **extending PDF coverage to the remaining artifact codes** (d28 and d25, alongside d25/d26/d28 generally) and adding signature blocks (a Volume 3, Chapter 15 dependency: extend the existing PDF route to those codes). Until those binders are added, d28 ships as docx via `narrative-docx.ts`.

**Implementation implications.** Contract Intelligence is a Phase 5 capability (Volume 4) and depends on three predecessors: (1) the Reasoning Envelope and Analysis stage (Phase 1), since clause extraction and verification are analysis passes; (2) live BAFO outcomes in d23 and scorecard commitments in d16 (Phases 2–3), since verification has nothing to reconcile against without them; (3) the waiver/gate-enforcement workflow (Phase 4). The net-new build is a binary-extraction stage (docx/pdf, reusing the `programs/` extractors or standing up the Source equivalent), the `ContractClauseExtractor` and `CommitmentVerification` reasoning modules, plus the Contract Center surface; the leverage is that the renderer (`ai-clause-gap`), the registry intake (`artifact-registry/`), the risk-pattern engine (`commercial-risk-detection.ts`), and the d28 template already exist — but the binary-extraction stage is genuinely new (the first-mile `text-parser.ts` handles only text/Markdown/CSV, not the binary pdf/docx contracts arrive as), so this is more than a wiring exercise.

---

---

## Chapter 10 — Transition Intelligence

> Volume 3 · Enterprise Architecture · Classification: Board-Grade, Confidential. Grounded against branch `codex/corpus-wave-24`.

### 10.0 Where Value Is Won or Lost

A sourcing event is not won at award. It is won — or quietly forfeited — in the ninety days after signature, when four years of incumbent operational knowledge has to cross a moving boundary into a new vendor without dropping a P1 incident, breaching an SLA, or stranding the institutional memory that nobody wrote down. The negotiated savings booked in Volume 2's BAFO engine are *promises*; transition is where the promise is either realized or eroded by parallel-run overrun, a knowledge gap that surfaces in month four, or an incumbent who has already mentally checked out. Elite operators (Bain delivery, ISG transition advisory) treat transition as a measured, gated program with rollback depth and continuity insurance — not a status meeting. AbarVa today does not. This chapter specifies how Source closes that gap.

The thesis of this specification — Source is a reasoning system that emits documents as artifacts of reasoning — applies with full force here. Transition Intelligence is not a Gantt chart renderer. It is a **continuously-scored readiness engine** that ingests transition evidence, reasons to a quantified go/no-go posture per checkpoint, monitors risk against blackout constraints, and emits `d29`–`d31` as the documentary residue of that reasoning. It then hands a clean, evidenced baseline to value realization (`d32`/`d33`), closing the lifecycle loop.

### 10.1 Current State — A Binary Heuristic Over Fixtures

The honest starting point is `src/lib/source/transition-readiness-view.ts` (358 lines). It is a **deterministic fixture view** — explicitly self-described as "no live clocks, no randomness, no network IO" — built over three hardcoded vendors (`vendor-a/b/c`) for the SRC-AMS-2026 demo event. `buildTransitionReadinessView()` returns per-vendor `checks[]`, a `risks[]` array of four seeded narratives, and seven `GO_NO_GO_CRITERIA` whose `met` flags are *all hardcoded `false`*. Its `transitionClearToBegin` boolean is computed as `goNoGoMetCount === goNoGoTotalCount` — a single binary collapse of a multi-dimensional readiness question, derived from constants, never from event state. The `honestDisclaimer` field says it plainly: live tracking, vendor check submission, and gate management are *deferred to the Source transition module (post-selection)* — which does not yet exist.

This is **PARTIAL, fixture-bound** (maturity 2 against the Volume 1 scale; an internal estimate, not an external rating). The view model, status taxonomy (`ready | partial | blocked | not_started | deferred`), and risk-severity scaffold (`high | medium | low`) are good bones. What is **ABSENT** is everything that makes it intelligence: no readiness *scoring* (binary `met`/not-`met`, never a weighted score with confidence), no knowledge-transfer *tracking* against evidence, no *continuous* risk monitoring (the four risks are static prose), no *blackout* model, and no connection to the live canvas substrate (`artifact_states`, `gate_criterion_states`, `evidence_states` in `src/lib/source/canvas-substrate/`) or to action routing via `src/lib/source/commercial-mission-queue.ts`. The three transition templates — `d29_transition_plan.md`, `d30_checkpoint_log.md`, `d31_kt_evidence.md` — are 34/26/26-line placeholder stubs with empty tables; none of the three is in the live generation set (only `d01/d05/d09` ship live templates in `prompt-registry.ts`). This chapter specifies the engine that replaces the heuristic and generates those three deliverables from reasoning.

### 10.2 Mandate & the Transition Readiness Scoring Model

**Why it matters.** A binary "clear to begin" answer is operationally useless: it cannot tell a CIO *how* unready, *where* the weakness sits, or *what one move* most improves the posture. Transition risk is asymmetric — a 70%-ready transition that begins on schedule with a known, insured gap can outperform a 95%-ready one that slips past the incumbent contract cliff. The board needs a *calibrated, decomposable* score.

**A note on stage span.** Transition readiness does not live in a single canonical stage. The canonical stage-pack scheme runs `S0_intake → S1_market_shape → S2_shortlist → S3_rfp → S4_demo_poc → S5_bafo → S6_contract → S7_activate`, and transition straddles the last two: contract terms (`S6_contract`) set the rollback and parallel-run obligations the engine scores, while cutover and knowledge-transfer completion land in `S7_activate`. (The UI's `source-shape-resolver.ts` uses a divergent S1/S3/S6/S7 labelling; this specification uses the canonical stage-pack scheme throughout.) To avoid drift, this specification fixes one convention: **the Transition Readiness Index is scored continuously from `S6_contract` and gated to clear in `S7_activate`** — KT and cutover semantics (`d29`–`d31`) span the boundary, but the go/no-go posture is anchored at `S7_activate`. Where later chapters anchor transition at `S7_activate`, they refer to this gate, not to the full span.

**What it solves.** It replaces the `transitionClearToBegin` boolean with a **Transition Readiness Index (TRI)** — a 0–100 score across four weighted dimensions, each carrying its own sub-score, evidence basis, and confidence band, surfaced through the Reasoning Envelope contract defined in Volume 2 (Ch 5).

**How it works.** The four dimensions extend the *checks* already modeled in `transition-readiness-view.ts` into a scored framework:

| Dim | Dimension | Default weight | What it scores | Evidence basis (from substrate) |
|---|---|---:|---|---|
| T1 | **KT plan maturity** | 30% | Are all phases of knowledge transfer planned, owned, scheduled — not just Phase 1? | `d29` §2 schedule + `d31` evidence rows; today `va-ktp` is "Phase 1 only" |
| T2 | **Parallel-run scope & cost** | 25% | Is the parallel-run window defined, cost-separated from steady-state, and budget-approved? | `d29` §3 gates + BAFO pricing split (`pricing-normalization.ts` transition dimension) |
| T3 | **Cutover sequencing** | 25% | Is the cutover ordered, dependency-mapped, with a confirmed timeline against the incumbent cliff? | `d29` §1 milestone roadmap + §4 critical path |
| T4 | **Rollback depth** | 20% | If cutover fails, how far back can we recover, how fast, at what cost? | `d29` §3 rollback criteria + `d30` go/no-go decisions |

```
            TRANSITION READINESS INDEX (TRI)
  evidence_states ─┐
  artifact_states ─┼─► [T1 KT maturity ·30] ─┐
  gate_states ─────┘   [T2 parallel-run ·25] ─┤
                       [T3 cutover seq ·25] ──┼─► Σ(score·weight) ─► TRI 0–100
  BAFO pricing ───────►[T4 rollback   ·20] ──┘        │
                                                       ├─► confidence band (multi-factor)
                                                       └─► binding constraint (lowest-scoring dim)
                              │
                              ▼
              Reasoning Envelope ──► d29 generation · go/no-go posture · UX
```

Crucially, TRI is **archetype-modulated**. The dormant Source Event Archetype Framework (`src/lib/source/types.ts` `archetype` field; `classifySourcingEvent()` in `classifier/category-classifier.ts`) must, when activated per Volume 2 Ch 5, drive the weights and thresholds here: an **AMS** transition (4 years of ops knowledge, the SRC-AMS-2026 case) weights T1 (KT) and T4 (rollback) heavily; an **AI-data-platform** transition weights T2 (parallel-run, data re-platforming) and T3 (cutover sequencing) more; a **renewal** archetype may legitimately score T1 near-complete because the incumbent stays. A single fixed weight vector — which is all the current view could ever express — is the wrong model. The weights are *data, keyed by archetype × estate*, consistent with the framework's two-axis resolver, not code.

**Expected business value (illustrative range).** Decomposed readiness lets a sponsor green-light a transition at, say, TRI 78 with a named, insured T2 gap rather than waiting for an unreachable 100 — compressing the post-award-to-go-live window by an estimated 2–4 weeks (illustrative range) and avoiding incumbent extension at premium rates. On the downside-protection side, surfacing a low T4 (rollback) score *before* cutover is the difference between a managed rollback and an unmanaged outage; one avoided P1-during-cutover event is worth more than the entire tooling cost (illustrative range).

**Implementation implications.** TRI replaces `buildTransitionReadinessView()`'s summary block. The function signature changes from zero-argument fixture to `buildTransitionReadinessView(eventId, ctx)` reading the live substrate via `canvas-substrate/queries.ts`. The `met: false` constants in `GO_NO_GO_CRITERIA` become derived from `gate_criterion_states` rows (`pending | met | not_met | waived | deferred`). `d29` generation is added to `prompt-registry.ts` as the fourth live template, consuming the TRI envelope so the plan's milestone roadmap and rollback criteria are *grounded in the same reasoning* that produced the score — not authored independently.

### 10.3 Knowledge-Transfer Tracking — From Checklist to Evidence Ledger

**Why it matters.** KT is the single highest-variance line in any AMS or platform transition, and the place where "looks done" diverges most from "is done." The current fixture flags `va-ktp` as "Phase 1 scope only; Phase 2 and 3 transfer milestones pending" — a real failure mode the model already anticipates but cannot track. Per the project's context-ingestion truth standard, "knowledge transferred" is not one state; it must be decomposed: *session scheduled → session held → content delivered → receiving-team verified competency → gap closed*.

**How it works.** `d31_kt_evidence.md` becomes a live **KT evidence ledger** rather than an empty table. Each session is a tracked row binding to the `evidence_states` substrate, advancing along the same readiness ramp used elsewhere in Source (`NotRequested → Loaded → Parsed → Available → UsableEvidence`, plus `Stale`/`LowConfidence` failure modes — see the readiness state contract in `canonical-specs/evidence-requirements.ts`). A KT session reaches "Usable Evidence" only when the **receiving-team attestation** (`d31` §2) is recorded — the lead confirming "competency to operate without vendor babysitting," in the template's own words. This is the evidence-or-refuse posture (net-new, wiring into `source-answer-engine.ts`) applied to transition: the engine *refuses* to score a KT track as complete on a held session alone; it requires the verifying attestation, and it surfaces open gaps (`d31` §3) as named, dated risks rather than absorbing them into a green checkmark.

```
KT TRACK STATE MACHINE (per track: ops/eng/governance/vendor-mgmt)
  scheduled ─► held ─► content delivered ─► [receiving attestation?]
                                                │ yes          │ no
                                                ▼              ▼
                                          Usable Evidence   gap flagged ─► d31 §3 open gaps
                                                │                         ─► risk monitor (T1)
                                                ▼                         ─► mission queue task
                                       feeds TRI · T1 score
```

`d30_checkpoint_log.md` (checkpoint log) sits above this: each checkpoint ("KT wave 1 complete") carries a go/no-go *decision record* — the missed-checkpoint protocol (`d30` §2: defer with new date · waive with rationale · trigger rollback, sponsor sign-off required). This is the governance spine — owned by the Steward internal voice, audit-visible per `d30` §3 — that makes a slipped KT wave a *recorded decision* rather than a silent slip. The decision rights mirror the gate-criteria model already in `gate-criteria.ts`: a checkpoint waiver is a `waived` gate state with a mandatory rationale and owner.

### 10.4 Risk Monitoring & Blackout Management

**Why it matters.** The current `TRANSITION_RISKS` array is four static narratives — incumbent-departure gap, CDP integration lock-in, parallel-run cost overrun, knowledge continuity. They are well-chosen, but they are *prose, scored once, monitored never*. Real transition risk is *temporal*: the incumbent-departure gap risk (severity `high` in the fixture) intensifies as the contract-expiry date approaches and the cutover slips; it is not a constant.

**How it works.** Risk monitoring promotes each static risk into a **live, re-scored monitor** under the Risk Philosophy of Volume 1 Ch 4 — impact × probability × mitigability, with an owner and a mitigation state. The four seed risks become the starting registry; each binds to a TRI dimension and a checkpoint, and is *re-evaluated whenever underlying state changes* (a checkpoint slips, an evidence row goes `Stale`, a gate flips). The incumbent-departure risk, for instance, is a computed function of `(incumbent contract end date − projected cutover date)`: as that margin narrows, probability rises and the monitor escalates — exactly the "confirm a 60-day extension option as a backstop" mitigation the fixture already names, now triggered by data rather than authored once.

**Blackout management** is the net-new capability with the sharpest operational edge. Every enterprise has windows in which cutover is forbidden — fiscal close, peak retail season, a frozen change-control period, a concurrent program's go-live. The engine maintains a **blackout calendar** as a first-class constraint: the cutover sequencing dimension (T3) is *invalid* if the planned cutover date lands inside a blackout, and the engine surfaces this as a hard conflict, proposing the nearest compliant window. This directly addresses the fixture's `tr-cdp-integration` risk — the AMS cutover must not land before the dependent CDP P3 Design gate clears; that dependency *is* a blackout on the AMS cutover until the gate is met.

**Action routing.** Detected risks and slipped checkpoints do not just display — they route. `commercial-mission-queue.ts` already defines a `transition_planning` mission type and a typed queue (`CommercialMissionQueueItem` with `priority`, `owner`, `blockedBy`, `status`). Transition Intelligence is its consumer: an escalating incumbent-gap risk emits a `risk_mitigation` mission owned by `buyer_team` ("confirm extension backstop"); an open KT gap emits a task owned by the receiving lead; a blackout conflict emits a `transition_planning` mission to re-sequence. The queue's existing `nextMission` resolver (highest-priority non-blocked queued item) becomes the Transition Center's "do this next" surface — connecting reasoning to action without a new orchestration layer.

| Risk monitor | Binds to | Trigger to escalate | Routed mission (queue) | Owner |
|---|---|---|---|---|
| Incumbent departure gap | T3, T4 | contract-cliff margin < 30d | `risk_mitigation` | buyer_team |
| Integration lock-in (CDP) | T3 | dependent gate unresolved at cutover-minus-window | `transition_planning` | steward |
| Parallel-run cost overrun | T2 | transition cost unseparated from steady-state | `governance_review` | steward |
| Knowledge continuity | T1 | KT track stuck below Usable Evidence | `evidence_collection` | sentinel |

### 10.5 The Transition Center & Handoff to Value

**The surface.** The Transition Center (Vol 3 Ch 14 specifies the component layer; this chapter specifies its intelligence) renders the TRI as the headline — a single decomposable score, not a binary — with the four dimensions as drill-downs, the live risk registry sorted by current severity, the blackout calendar with the proposed cutover window, and the `nextMission` from the queue as the prescribed action. It obeys the Source canvas density contract (one row per item, color carries status, forms reveal on click): each vendor's `checks[]`, each KT track, each checkpoint is one row whose color is its readiness state, expanding to the evidence and decision record one level down. Every number on the surface is traceable to its Reasoning Envelope — the UX expression of the OS thesis. Sentinel remains the single front agent across the Transition Center; the Steward owner labels above name internal voices in the mission queue, not competing front-agent brands.

**Handoff to value.** Transition closes the lifecycle loop. When the cutover checkpoint clears go/no-go (`d30`) and the KT ledger reaches Usable Evidence across all tracks (`d31`), the engine emits a **transition-complete baseline** that seeds value realization: `d32_value_ledger.md` inherits the negotiated savings targets from BAFO and the *actual* transition cost (including the now-itemized parallel-run split), establishing the variance baseline against which realized value is measured; `d33_governance_review.md` inherits the full audit trail of checkpoint decisions, waivers, and risk closures. The transition's residual open gaps (`d31` §3) carry forward as the first entries in the value-phase watch-list. This is the structural answer to a standing gap noted internally — that no path today connects "contracted value commitments to measured realization." Transition Intelligence is that connective tissue.

**Implementation summary.**

| Change | Seam (real file) | From → To |
|---|---|---|
| TRI scoring | `transition-readiness-view.ts` | fixture boolean → live 4-dim weighted index over substrate |
| Archetype-keyed weights | `classifier/category-classifier.ts`, `types.ts` | dormant → drives T1–T4 weight vector |
| Live go/no-go | `canvas-substrate/queries.ts` | hardcoded `met:false` → derived from `gate_criterion_states` |
| KT evidence ledger | `evidence-requirements.ts`, `d31` template | empty table → readiness ramp with attestation gate |
| `d29`/`d30`/`d31` generation | `agent-generation/prompt-registry.ts` | stubs → live templates fed by TRI envelope |
| Risk monitors + blackout | `commercial-risk-detection.ts` (seed patterns) | static prose → re-scored temporal monitors |
| Action routing | `commercial-mission-queue.ts` | unused `transition_planning` type → live consumer |
| Value handoff | `d32`/`d33` templates | no link → transition-complete baseline seed |

This is not greenfield. The view model, the status taxonomy, the four risks, the seven go/no-go criteria, the mission queue, the evidence ramp, and the deliverable templates all exist. Transition Intelligence is the act of converting them from a deterministic demo fixture into a scored, monitored, evidence-gated engine — and in doing so, of ensuring the value Volume 2 negotiates is actually the value Volume 4 measures.

---

---

## Chapter 11 — Market Intelligence Layer

> Volume 3 · Enterprise Architecture · Classification: Board-Grade, Confidential. Grounded against branch `codex/corpus-wave-24`.

### 11.0 Position in the OS

Volume 2 built the engines that reason about a sourcing event — evaluation, BAFO, selection. Chapters 9 and 10 built the engines that reason about the contract and the transition. Every one of those engines reasons against *internal* truth: the bound context for one event, the canvas substrate for one tenant, the evidence loaded for one decision. That is necessary and it is not sufficient. An elite sourcing operator never reasons only from what the client told them. They reason from what the *market* is doing — what this vendor charges three other clients, where the AMS rate card actually clears, which AI-platform vendors have a credible roadmap versus a slide, what a comparable ERP-SI deal closed at after BAFO. Chapter 11 specifies the **Market Intelligence Layer**: the externally-sourced brain that turns Source from internally-calibrated reasoning into *market-calibrated* reasoning.

This is the layer Source most conspicuously lacks. The thesis of this chapter is blunt: without a market brain, every recommendation the OS produces is anchored to conservative internal defaults, and a conservative default in a negotiation is a gift to the vendor.

### 11.1 Why Source Needs a Market Brain

**Why it matters.** The single highest-leverage moment in any sourcing event is the gap between what a buyer *thinks* a thing should cost and what the market *knows* it costs. McKinsey/Kearney sourcing practice quantifies that gap routinely — savings of 8–18% (illustrative range) on managed-services renewals come almost entirely from arriving at the table with a calibrated should-cost and a credible benchmark, not from harder bargaining. The intelligence is the leverage.

**What problem it solves.** Today the OS reasons in a vacuum on three axes:

1. **Vendor truth.** The live pipeline (`context-binder.ts` → `prompt-registry.ts` → `server.ts`) knows only what the buyer's context contains about a vendor. It has no independent vendor profile — no capability map, no reference base, no financial-health signal, no AI-maturity assessment. The commercial layer (`vendor-selection-readiness.ts`, `award-decision-view.ts`) is PARTIAL and fixture-bound — it reasons over `vendor-a/b/c` fixtures, not market-grounded vendor entities.
2. **Price truth.** `should-cost-model.ts` models the full TCO iceberg honestly — it returns a *range* with the seven hidden layers itemised rather than a point estimate. But its rate-card and role-mix assumptions are internal constants, and the module is imported and called by the dormant `source-answer-engine.ts` (so it has a call-site there) yet is never reached by the live generate-route deliverable pipeline (§11.3). Its sibling `pricing-normalization-model.ts` decomposes vendor quotes into towers and roles but has nothing external to *compare them against*. Both compute against defaults, and defaults skew conservative.
3. **Pattern truth.** `intelligence-patterns.ts` detects ten commercial patterns (`pricing_compression`, `bundling_trap`, `scope_creep_setup`, …) but does so from six internal boolean flags (`hasOpaquePricing`, `hasBroadScope`, …). It can tell you a vendor *is* anchoring on broad scope; it cannot tell you whether that anchor is unusual relative to how this vendor behaves across the market.

**How a market brain fixes it.** The Market Intelligence Layer is a distinct knowledge tier — analogous to a Gartner/Everest/ISG analyst desk rendered as data — sitting *beside* the per-tenant context layer, never inside it. It supplies four asset classes: **Vendor Profiles**, **Peer Benchmarks**, **Pricing/Savings Intelligence**, and **AI-Capability Profiles**. The engines of Volumes 2–3 consume these as additional grounded inputs to the Reasoning Envelope, so a vendor ranking carries a market-calibrated capability score, a should-cost carries a market clearing band, and a negotiation strategy carries a "this vendor concedes here" prior.

**Expected business value (illustrative ranges).** Market-calibrated should-cost typically recovers 8–18% on renewals and 5–12% on new managed-services awards; benchmark-anchored BAFO closes the "leave money on the table" gap that internal-default pricing creates, estimated at 3–9% of contract value. The defensibility argument for investors: vendor profiles and accumulated savings intelligence are a *data moat* that compounds with every event run — the reasoning IP gets sharper the more the OS is used.

**Implementation implications.** This is net-new infrastructure with a clean seam: it must enter through the broker boundary (§11.5), never through direct imports, and it must respect the firewall between market data (cross-tenant, non-privileged) and client data (tenant-scoped, RLS-governed). Market intelligence is never legal-privileged client work-product — it is curated cross-tenant analyst data — so it needs its own non-privileged classification at the market-layer boundary rather than borrowing the shipped privilege classifier, which has no market/non-privileged asset lane (§11.5).

### 11.2 Vendor Profiles & AI-Capability Assessment

**The entity.** Specify a first-class `VendorProfile` market entity (net-new; the natural home is a new `src/lib/source/market-intelligence/vendor-profile.ts` consumed via the broker, NOT a per-event fixture extension of `cat-pattern-instances.ts`). Its shape:

```
VendorProfile
├─ identity        canonical vendor id, aliases, segment (AMS / ERP-SI / AI-platform / niche)
├─ capabilities[]  capability map → maturity 1–5, evidence refs, last-verified date
├─ references[]    named/anonymized client refs, outcome, recency, verification status
├─ financials      health band, scale band, concentration risk, source + as-of date
├─ aiMaturity      AICapabilityProfile (see below)
├─ behaviorPriors  negotiation tendencies: where this vendor concedes / anchors
└─ provenance      source desk (analyst / corpus / human-curated), confidence band, freshness
```

Every field carries provenance and a freshness timestamp. This is non-negotiable: a vendor profile with stale financials is worse than none, because it launders an old fact into a confident recommendation. The Reasoning Envelope (Vol 2, Ch 5) must surface profile freshness in its caveats.

**The AI-Capability Profile.** AI maturity is the differentiating axis for the modern sourcing event and the one analysts assess most crudely. Specify an `AICapabilityProfile` sub-entity scoring a vendor on: model/IP ownership vs reseller posture; deployment evidence (production references vs roadmap slides); data-handling and governance posture; and roadmap credibility. This maps directly onto the `AI-data-platform` archetype in the (DORMANT) Source Event Archetype Framework — the `archetype` field in `types.ts` plus `classifySourcingEvent()` in `classifier/category-classifier.ts`, invoked only inside the dormant `source-answer-engine.ts` and its fixtures, never in the live deliverable-generation pipeline. When an event classifies as `AI-data-platform`, the evaluation engine weights `AICapabilityProfile` heavily; for an `AMS` renewal it weights references and financial stability.

**How it feeds the engines.** Two consumption seams:

- *Evaluation* (Vol 2, Ch 6): the multi-rater scoring engine ingests `capabilities[]` and `aiMaturity` as a market-calibrated rater alongside the buyer's internal ratings, so a vendor's self-claimed capability is scored against the market's independent view. Divergence becomes a flagged claim in the Reasoning Envelope.
- *BAFO leverage* (Vol 2, Ch 7): `behaviorPriors` feed the leverage/EV model. A vendor whose profile shows a consistent concede-on-transition-fees pattern changes the expected-value calculus of where to push. This is the entity that finally gives `bafo-negotiation-model.ts` something market-grounded to reason with instead of fixture priors.

**Implementation implications.** Vendor profiles are cross-tenant assets but must be *consumed* tenant-scoped — a profile is read for an event, never written back into a tenant's context layer (that would leak market data into client-governed data and corrupt the lineage). Curation is a governed admin function (Steward voice), separate from the client-data ingestion contract in AGENTS.md: profiles enter through a market-intelligence admin lane, not the Admin bulk loader.

### 11.3 Benchmarks, Pricing & Savings Intelligence

**Why it matters.** This is where the market brain converts directly into dollars at the table. The engines that need it already exist and are starved.

**The benchmark entity.** Specify a `BenchmarkSet` keyed by (segment, tower, role, geography, deal-size band) returning a clearing distribution — not a point, a distribution with p25/median/p75 and an `n`/confidence band:

```
BenchmarkSet { segment, tower, role, geo, sizeBand }
  → { p25, median, p75, currency, n, asOf, confidenceBand, provenance }
```

**Calibrating should-cost.** `should-cost-model.ts` today blends internal rate constants across its `ShouldCostRole` taxonomy and itemises the TCO iceberg against fixed hidden-layer ratios. Specify a calibration seam: the model accepts an optional `BenchmarkSet` injection that overrides its role-rate constants and hidden-layer ratios with market-clearing values for the event's segment/geo. The output stays a *range* (preserving the module's honest "never a single number" contract) but the range is now market-anchored, and the Reasoning Envelope records which benchmark calibrated it. Critically, this is also the moment to settle the module's wiring. Despite the module's own header comment still literally reading "Standalone — NOT wired into source-answer-engine.ts (separate follow-up)," the dormant `source-answer-engine.ts` already imports `should-cost-model.ts` (import line 22) and calls `estimateEventShouldCost` from it (around line 191) — so it does have a call-site there; that stale header comment should be corrected so a skeptical reviewer is not tripped by the contradiction. Either way, the module is **not** reached by the live generate-route pipeline today — it is reachable only through the DORMANT engine. The calibration work and the engine activation should therefore ship together so a calibrated should-cost actually reaches a deliverable on the live path.

**Calibrating pricing normalization.** `pricing-normalization-model.ts` decomposes each vendor quote into `PricingTower`/`PricingRole` lines and statuses (`comparable`, `needs_clarification`, `split_required`). Specify that each normalized line gets scored against the matching `BenchmarkSet`: a line clearing above p75 is flagged `above_market`, below p25 `below_market_verify` (a too-good price is a scope-gap signal, not a win). This turns normalization from a *comparability* exercise into a *competitiveness* exercise — the difference between "these quotes are comparable" and "vendor B's application-management tower is 22% (illustrative range) above market median."

**Savings intelligence.** Specify a `SavingsLedger` that accumulates realized-savings outcomes from completed events (anonymized, cross-tenant) keyed the same way as benchmarks. This is the compounding moat: every event that closes feeds the ledger, which tightens the next event's benchmark confidence band. It also grounds the value-realization deliverables (`d32` value ledger, `d33` governance review) in *market-relative* savings claims rather than internal before/after arithmetic.

| Asset | Grounds which engine | Replaces today's | Net effect |
|---|---|---|---|
| `VendorProfile` | Evaluation (Ch 6), BAFO leverage (Ch 7) | vendor-a/b/c fixtures | market-calibrated capability + concede priors |
| `AICapabilityProfile` | Evaluation, AI-platform archetype weighting | absent | credible-vs-slideware AI scoring |
| `BenchmarkSet` | should-cost, pricing-normalization | internal rate constants | market clearing bands, above/below-market flags |
| `SavingsLedger` | value deliverables d32/d33, benchmark confidence | internal before/after | compounding savings moat |

### 11.4 Pattern Grounding & Semantic Retrieval Upgrade

**Why it matters.** The market brain is only as good as the OS's ability to *retrieve the right slice of it* for the event at hand. Today retrieval is lexical, and lexical retrieval silently misses the relevant intelligence whenever the buyer's language and the market's language diverge — which is almost always.

**Current behavior (grounded).** Sentinel's pattern matching in `src/lib/sentinel/orchestrator.ts` is keyword/token-based. `scorePattern()` (line 103) builds a set of `haystack` blobs from the pattern's name, slug, category, descriptions, trigger symptoms, detection signals, diagnostic questions, interventions, observations and section bodies, then scores in three layers: a slug/name **containment** bonus (`normalized.includes(pattern.slug…)` / `…name…`, +36, line 121); a **token-overlap** pass that tokenizes the message and adds +8 for every token that hits any haystack (line 125); and a handful of **regex boosts** over the message (`/(evidence|citation|source|proof…)/`, line 129, plus vendor/risk tests). It is lexical end to end — token overlap and substring containment, never semantic similarity. The corpus seam `searchIndustryScopedCorpusPatternIndex()` routes through `searchCorpus()` — Postgres full-text, not vectors. The Source-side `intelligence-patterns.ts` detector is even coarser: it fires on six pre-computed booleans. Three consequences: (1) a vendor describing "elastic capacity bursting" never matches a pattern keyed on "scope creep" because no token overlaps; (2) `evidenceCount` is read once per render (`getPatternEvidenceMetrics`, `pattern-manifest.ts:175`) rather than tracked live; (3) the `cat-pattern-instances.ts` fixtures had to be hand-tuned to "share ≥2 non-stop-words with each pattern's contradiction templates" — the fixtures are bent to fit the matcher, which is the matcher confessing its own brittleness.

**The upgrade.** Specify a three-part move:

1. **Embedding-based semantic retrieval.** Replace the `scorePattern` token-overlap scoring with vector similarity over pattern embeddings, keeping the existing signal boosts (demoCritical, anchor-slug, evidence-presence) as a *re-ranking* layer on top of semantic candidates rather than as the primary matcher. The platform already has the cutover vehicle: the `retrieval_azure_search` feature flag in `src/lib/features/registry.ts:84` routes broker tenant-context retrieval through Azure AI Search instead of pgvector, staged tenant-by-tenant (its `includeTenants` allowlist is intentionally empty, default off everywhere). Pattern retrieval should ride the same flag key and the same staged-allowlist discipline — default off, prove per tenant, cut over.
2. **Live evidence-count updates.** Make `evidenceCount`/`observationCount` a tracked quantity that updates as evidence is loaded against an event (driven off the canvas substrate `evidence_states`), so a pattern's market relevance reflects current evidence, not a render-time snapshot. This feeds the reasoning engine's confidence bands directly.
3. **Retire the boolean detector.** Re-express `intelligence-patterns.ts`'s ten categories as semantic detectors grounded in vendor-profile behavior priors and benchmark deviations, so `pricing_compression` fires from an actual below-p25 benchmark deviation rather than a hand-set `hasOpaquePricing` flag.

**Why semantic, specifically.** The intelligence in a market brain is written in analyst/vendor language; the buyer's event is written in buyer language. Lexical matching forces an exact-vocabulary collision that rarely happens, which is precisely why the fixtures had to be bent. Semantic retrieval matches on *meaning*, which is the only way externally-sourced intelligence reaches an event whose author never used the market's words.

### 11.5 The Externally-Sourced Brain & the AgentContextBroker Boundary

Two hard architectural rules govern this entire layer.

**Rule 1 — Market data is a separate knowledge layer from client context.** The per-tenant context/corpus layer is client-governed, RLS-scoped, and lineage-tracked under the ingestion truth standard (AGENTS.md). The market brain is cross-tenant, analyst/curator-governed, and explicitly *non*-privileged. These must never commingle: market intelligence is read *into* an event's reasoning, never written *into* a tenant's context rows. Mixing them would both leak cross-tenant market data into a client's governed corpus and pollute the should-cost/benchmark provenance with one client's quotes. Note the firewall here is *not* the shipped disclosure-flag classifier — that classifier (`disclosure-flag/`, SHIPPED) tags attorney-client/work-product privilege on *client* artifacts and propagates that privilege downstream; it has no market/non-privileged asset lane. The market layer needs its own boundary-level non-privileged classification at the broker, stamping market assets as cross-tenant and disclosable, rather than borrowing a privilege classifier whose purpose is the opposite problem.

**Rule 2 — All access goes through the AgentContextBroker contract.** Per the knowledge-layer broker boundary, the app tier must never directly import market-intelligence internals any more than it may import the EnterpriseDataRoom or vector store. Vendor profiles, benchmarks, and savings intelligence are resolved through the `AgentContextBroker` seam (the same contract that already fronts `genome-query-broker.ts` and tenant-context retrieval). Concretely: the evaluation and BAFO engines request `VendorProfile`/`BenchmarkSet` *via the broker*, the broker enforces the market-vs-client firewall and stamps provenance/freshness, and the engines receive market-grounded inputs they can place directly into the Reasoning Envelope.

```
   ┌──────────────── Market Intelligence Layer (cross-tenant, non-privileged) ─────────────┐
   │  VendorProfile · AICapabilityProfile · BenchmarkSet · SavingsLedger · Pattern embeddings │
   └───────────────────────────────────────────┬──────────────────────────────────────────┘
                                                │  (resolve, with provenance + freshness + firewall)
                                   ┌────────────▼─────────────┐
                                   │   AgentContextBroker      │  ← single seam; app tier never bypasses
                                   └────────────┬─────────────┘
              ┌─────────────────────────────────┼─────────────────────────────────┐
              ▼                                  ▼                                 ▼
     Evaluation Engine (Ch6)           BAFO / should-cost (Ch7)         Sentinel semantic retrieval (§11.4)
     market-calibrated capability      benchmark-anchored ranges        embedding match → re-rank
              └─────────────────────────────────┬─────────────────────────────────┘
                                                 ▼
                                        Reasoning Envelope  →  Deliverable (d01–d33)
              (claims carry: market source · confidence band · freshness · non-privileged tag)
                                                 ▲
   Tenant Context/Corpus Layer (RLS, privileged) ┘  — separate broker path; NEVER commingled with market data
```

**Walkthrough.** An `ERP-SI` event reaches evaluation. The engine asks the broker for the shortlisted vendors' profiles and the matching ERP-SI benchmark set. The broker resolves them from the market layer, stamps each with provenance, freshness and a boundary-level non-privileged tag, and enforces that nothing from the buyer's privileged context is mixed in. Evaluation scores vendor claims against market capability; should-cost calibrates its iceberg to the benchmark band; BAFO loads the vendors' concede-priors. Every market-derived value lands in the Reasoning Envelope as a claim with its source and freshness, so the executive decision packet (`d24`–`d26`) can show not just *what* the OS recommends but *what market truth* it stood on. The tenant's context layer, reached on a separate broker path, supplies the client-specific evidence — and the two never touch.

**Net.** The Market Intelligence Layer is the difference between an OS that reasons well about what it was told and one that reasons well about what is *true in the market*. It is the asset that compounds, the moat that deepens with use, and — wired through the broker with the firewall intact — the one external brain Source can safely trust.

---

---

## Chapter 12 — Agent Architecture

> Volume 3 · Enterprise Architecture. Grounded against branch `codex/corpus-wave-24`. Classification: Board-Grade, Confidential.

Volume 2 specified the engines that reason — Evaluation, BAFO, Selection. This chapter specifies the **agents** that wear those engines: the operating personalities a CXO actually converses with, the function-named specialists working behind them, and the coordination fabric that lets a recommendation move from one engine to the next without losing its evidence or its caveats. The thesis of the whole document — that Source is a sourcing intelligence operating system, not a document factory — lives or dies in this layer. An OS that reasons but cannot *present* its reasoning as a single, trustworthy voice with clear decision rights is just a pile of clever functions. This chapter is how the reasoning becomes an interlocutor.

The chapter builds directly on what already exists. The orchestrator `src/lib/source/sentinel-source-orchestrator.ts` already composes a single Sentinel-voiced briefing from seven deterministic specialist builders. The type contract `src/lib/source/multi-agent-types.ts` already defines `SentinelSourceBriefing`, `SpecialistContribution`, and the four agent names. The mission layer `src/lib/source/agent-mission-report.ts` already counts, prioritizes, and routes missions across `nexus | sentinel | atlas | steward`. The work of this chapter is not to invent an agent layer — it is to **promote the existing deterministic frame into an engine-backed, decision-empowered, escalation-aware agent architecture**, and to do so at the named seams.

### 12.1 The One-Front-Agent Doctrine

**Why it matters.** Procurement transformation fails most often not on analytics but on *trust legibility*: a CXO confronted with four chat personas, three dashboards, and a scorecard that disagrees with the executive memo cannot tell which voice owns the answer. The founder feedback captured across this program is unambiguous — one front agent per product, specialists function-named and hidden behind it, every click a decision and not a form-fill. Source's front agent is **Sentinel**. Nexus fronts Moves; Atlas fronts Tower; Steward is the governance voice. Inside Source, Nexus, Atlas, and Steward are not separate chat surfaces the user toggles between — they are *internal contributors* whose findings Sentinel synthesizes and speaks.

**What problem it solves.** It collapses N agent surfaces into one accountable voice while preserving the multi-disciplinary reasoning underneath. The user sees Sentinel; the trace drawer reveals which specialist shaped which sentence.

**How it works (today, real code).** `buildSentinelSourceBriefing()` (orchestrator, line 290) calls `buildSourceMultiAgentBriefing()` to produce the four internal voices, wraps seven specialist builders around them (`buildContextValidationChecker`, `buildEvidenceGapDetector`, `buildNextActionRecommender`, `buildMinimumDataRequestGenerator`, `buildValueAtStakeSummarizer`, `buildExecutiveDecisionBriefWriter`, `buildWorkflowBlockerDetector`), ranks them by `SPECIALIST_PRIORITY` (`steward:0 > sentinel:1 > nexus:2 > atlas:3`, line 22), and composes a single `primaryVoice` via `composePrimaryVoice()`. The Sentinel voice is then drift-checked against `checkSentinelVoice()` from `src/lib/agent/voice-doctrine/sentinel.ts` — cite, label claims verified/asserted/inferred, lead with the gap, never fabricate a move — with violations surfaced as `[voice-drift:...]` evidence notes (line 262). The voice-doctrine modules (`sentinel.ts`, `nexus.ts`, `atlas.ts`, `steward.ts`) all live under `src/lib/agent/voice-doctrine/`, not under a `src/lib/source/agent/` path. This is the doctrine in working form. The gap is that every specialist builder is **deterministic prose assembly over the context bundle**; none yet calls an engine.

**The agent contract.** Every agent in this chapter is specified against one contract, so the architecture is uniform and a new agent can be added without inventing a new shape:

| Contract field | Meaning | Backing type |
|---|---|---|
| **Mission** | The one question this agent owns | `SourceAgentMission.missionType` |
| **Inputs** | What it consumes to reason | `SourceAgentContextBundle` + engine outputs |
| **Outputs** | A Reasoning Envelope (Ch5), never raw prose | `SourceAgentBriefing` extended with envelope |
| **Decision rights** | What it may decide vs. recommend vs. block | new `decisionRights` field on the contract |
| **Escalation rules** | When it must hand to a human | `handoffRecommendation` → state machine (§12.5) |

**Business value (illustrative range).** Consolidating to one front agent is the difference between a tool a CXO abandons after the demo and one that becomes the standing interface to a sourcing event. The legibility tax of multi-agent UIs is real; collapsing it is expected to lift advisory-board confidence and reduce time-to-first-decision materially (illustrative range: 20–35% faster decision cycles once the engines back the voice).

**Implementation implication.** No new chat surface. The seam is the existing `primaryVoice` composition in the orchestrator; the change is that each specialist builder stops assembling prose and starts consuming an engine output (Reasoning Envelope) — described per agent below.

### 12.2 Atlas, Sentinel & Steward — Governance and Value Voices

Three of the four internal voices are not engine agents; they are the *posture* agents — they shape how every engine output is framed, valued, and governed. Their decision rights are the spine of the trust model.

```
                    ┌─────────────────────────────────────────┐
   USER  ◀────────▶ │  SENTINEL  (front agent · synthesis)      │
                    │  speaks the single board-grade read       │
                    └───────────┬───────────────────────────────┘
                                │ composes & ranks (priority order)
        ┌───────────────────────┼───────────────────────┬──────────────────┐
        ▼                       ▼                       ▼                  ▼
  ┌───────────┐         ┌───────────────┐       ┌──────────────┐   ┌────────────┐
  │  STEWARD  │  pr 0   │   SENTINEL    │ pr 1  │    NEXUS     │   │   ATLAS    │
  │ governance│ ◀blocks │ evidence/     │       │ action /     │   │ value /    │
  │  gate     │         │ validation    │       │ next-step    │   │ executive  │
  └─────┬─────┘         └───────┬───────┘       └──────┬───────┘   └─────┬──────┘
        │ may BLOCK             │ may REFUSE           │ may RECOMMEND     │ may FRAME
        ▼                       ▼                      ▼                   ▼
   gate-criterion        evidence-or-refuse       next-action         value-at-stake
   enforcement           (Ch5 governed answer)    recommendation      (no "realized"
   (source-governance-                                                w/o measurement)
    enforcement.ts)
```

**Steward (decision right: BLOCK).** Steward owns governance enforcement. In the current code Steward is the highest-priority specialist (`steward:0`) and fronts `buildWorkflowBlockerDetector` (orchestrator line 333, mission type `workflow_blocker`). Its primary finding today reads `'Workflow gates contain blockers that must remain enforced'` when `workflowValidationReport.failedExpectations` is non-empty. The target promotes this from *detecting* blockers to *enforcing* them: Steward's `cannotProceedReasons` must become a hard precondition wired into `evaluateStagePromotionReadiness()` in `src/lib/source/source-governance-enforcement.ts` and the gate-criterion state mutation route `/api/v1/source/[eventId]/gate-criteria/[criterionId]/state`. Steward can block; it cannot author content. This is the only agent with a true veto, and that veto is the governance backbone. Critically — per the VERIFIED GROUND TRUTH — Source has **no refusal mechanism today**; `disclosure-flag/` is a shipped legal-privilege *classifier* (attorney-client / work-product inheritance), not a governance refusal. The evidence-or-refuse posture is net-new and is wired through Steward into the dormant `source-answer-engine.ts`, not through `disclosure-flag/`.

**Sentinel (decision right: REFUSE).** Sentinel owns evidence sufficiency and synthesis. It is both the front voice (§12.1) and an internal contributor via `buildContextValidationChecker` and `buildEvidenceGapDetector`. Its decision right is *refusal*: when `contextValidationReport.suite.verdict !== 'pass'` or `citationCoverage.missingCitationClaims` is non-empty, Sentinel declines to present a recommendation as decision-grade and instead surfaces the gap. This is the operationalization of the Confidence and Governance philosophies from Volume 1, Chapter 4 — Sentinel refuses to launder thin evidence into confident prose. It does not block stage advancement (that is Steward); it refuses to *speak with confidence*.

**Atlas (decision right: FRAME, never inflate).** Atlas owns value framing and the executive register. It fronts `buildValueAtStakeSummarizer` and `buildExecutiveDecisionBriefWriter`. Its single hard constraint is encoded in the existing code and must be preserved: Atlas **cannot label value as realized without measurement evidence** (`valueLabel()` returns `'projected' | 'seeded' | 'realized'`, and `buildValueAtStakeSummarizer` sets `cannotProceedReasons: ['Atlas cannot label value as realized without measurement evidence.']` when the label is not `realized`, line 174). Atlas frames the prize; it may never claim a prize that has not been measured. This is the value-discipline guardrail that keeps the executive cockpit honest.

| Voice | Owns | May decide | May NOT do | Controlling file |
|---|---|---|---|---|
| Steward | Governance gates | Block advancement | Author deliverable content | `source-governance-enforcement.ts` |
| Sentinel | Evidence + synthesis | Refuse a confident answer | Block a gate; fabricate | `agent/voice-doctrine/sentinel.ts` |
| Atlas | Value + exec framing | Frame value at stake | Label value realized w/o measurement | orchestrator `buildValueAtStakeSummarizer` |
| Nexus | Action sequencing | Recommend next action | Bypass a Steward block | orchestrator `buildNextActionRecommender` |

### 12.3 The Engine Agents — Evaluation, Negotiation, Selection

These three are the reasoning workhorses. Each is the *agent face* of a Volume 2 engine, and each emits a Reasoning Envelope (Ch5) rather than prose. Today their backing engines are PARTIAL and fixture-bound (`bafo-negotiation.ts`, `award-decision-view.ts`, `scorecard.ts` are deterministic builders over `vendor-a/b/c` fixtures with no live call-site); the agent contract here specifies how they become live, evidence-anchored contributors behind Sentinel.

**Evaluation Agent.**
- *Mission:* produce defensible, consensus-weighted vendor rankings with deviation flags. Mission type extends `data_readiness`/`evidence_gap`.
- *Inputs:* parsed vendor responses, scorecard criteria and weights (`scorecard.ts`, d16/d17), evidence states from `canvas-substrate`. Note: `artifact-registry/text-parser.ts` is the synchronous first-mile parser for *text-like* uploads only (pasted notes / Markdown / text / CSV; parser id `source_text_first_mile_v1`) — it does **not** read binary vendor documents. Rich binary parsing (docx/pdf/xlsx response packs) is a net-new capability for Source: it must be built, or reuse the Moves-side async pipeline under `src/lib/programs/` (`doc-parser`, `attachments/extract-text`). The Evaluation Agent's response-parsing input depends on standing that up, not on extending `text-parser.ts`.
- *Outputs:* a Reasoning Envelope carrying per-criterion scores, weighted aggregate, >5-point deviation flags, and evidence citations for each score (d16/d18 generation, Ch6).
- *Decision rights:* RECOMMEND rankings; FLAG deviations requiring re-rate. It cannot disqualify a vendor unilaterally — disqualification (d18) is a recommendation that Steward must clear.
- *Escalation:* when score deviation exceeds threshold or evidence sufficiency falls below band, escalate to a human calibration session rather than auto-resolving.

**Negotiation Agent (BAFO).**
- *Mission:* generate per-vendor leverage analysis, concession strategy, and expected-value scenarios.
- *Inputs:* normalized pricing (`pricing-normalization.ts`; note d19 (`d19_pricing_workbook`) is the only canonical pricing code — any d19a/d19b/d19c decomposition is a set of *proposed net-new sub-artifacts, not in the 33-code canon*), evaluation rankings, competitive-tension and incumbency signals (`commercial-signals.ts`).
- *Outputs:* Reasoning Envelope with leverage state, concession ladder, walk-away threshold, EV by scenario (conservative/base/stretch), each carrying caveats. Backs d22/d23 generation.
- *Decision rights:* RECOMMEND negotiation moves and walk-away points; never *commit* to a vendor or send vendor communications (the memory record is explicit: vendor comms are DRAFT-only).
- *Escalation:* a walk-away recommendation, or any concession crossing a value-at-stake threshold, escalates to the sponsor with Atlas framing the executive air-cover.

**Selection Agent.**
- *Mission:* assemble the risk-adjusted award recommendation and the board decision packet (d24–d27). (The d24 template ships titled "Atlas Decision Brief" in the repo, and some d-codes name Nexus/Steward; per the one-front-agent doctrine these resolve to Sentinel as the single front voice on the packet, with Atlas/Nexus/Steward as internal contributing voices — not three competing front-agent brands.)
- *Inputs:* evaluation rankings, BAFO outcomes, commercial risk patterns (`commercial-risk-detection.ts`), transition-risk signals.
- *Outputs:* Reasoning Envelope with ranked options, pre-award conditions, recommendation-level confidence band, dissent capture. Promotes `award-decision-view.ts` and `executive-decision-summary.ts` from fixture derivation to live.
- *Decision rights:* RECOMMEND an award with conditions; it has **no authority to award**. The award is a human sign-off enforced by Steward through the approval/waiver workflow (Ch8). This separation is non-negotiable — the AI never self-approves a gate (the R8 governance principle).
- *Escalation:* a recommendation below a confidence band, or a tie within margin, escalates to the executive committee with the dissent captured.

Each engine agent maps cleanly to an internal voice for synthesis: Evaluation and Negotiation findings flow through Nexus (action) and Sentinel (evidence); Selection findings flow through Atlas (executive) and Steward (governance). The user still sees only Sentinel.

### 12.4 Contract, Transition & Market-Intelligence Agents

The same contract extends to the three Volume-3 agents introduced in Chapters 9–11. They sit *downstream* of the engine agents and close the lifecycle loop from signature to value.

**Contract Agent (Ch9).**
- *Mission:* verify the signed contract against the negotiated BAFO outcome and scorecard commitments — catch the "tier-1 SLA claimed in evaluation, best-effort in the contract" contradiction.
- *Inputs:* uploaded contract via `artifact-registry/upload-contract.ts`, the BAFO outcome envelope (d23), the d16 scorecard commitments, and d25 risk attestation.
- *Outputs:* redline/clause-gap findings, SLA/liability verification, each as an envelope with the contradicting evidence cited.
- *Decision rights:* RECOMMEND redlines and FLAG contradictions; route to legal sign-off. No authority to accept terms.
- *Escalation:* any clause-gap touching liability/indemnity escalates to legal with Steward holding the gate.

**Transition Agent (Ch10).**
- *Mission:* score transition readiness quantitatively (KT plan maturity, parallel-run scope, cutover sequencing, rollback depth) and monitor checkpoint slippage.
- *Inputs:* `transition-readiness-view.ts`, KT evidence (d31), checkpoint log (d30).
- *Outputs:* readiness score envelope, blackout-window status, slippage alerts.
- *Decision rights:* RECOMMEND go/no-go on cutover; FLAG blackout violations. Cutover authorization is human.
- *Escalation:* a slipped checkpoint or a readiness score below threshold routes an action onto `commercial-mission-queue.ts` and escalates to the transition owner.

**Market-Intelligence Agent (Ch11).**
- *Mission:* calibrate internal reasoning against market data — vendor profiles, peer benchmarks, pricing/savings intel, AI-capability assessment.
- *Inputs:* `intelligence-patterns.ts`, `pattern-manifest.ts`, upgraded from keyword to semantic retrieval via `src/lib/sentinel/orchestrator.ts`.
- *Outputs:* benchmark envelopes that feed the Negotiation Agent's leverage analysis and the Evaluation Agent's should-cost calibration. (`should-cost-model.ts` is today imported and called by the *dormant* `source-answer-engine.ts` — so it has a call-site there, though the module's own header still carries a stale "NOT wired" comment — but it is not reached by the live `generate-route` pipeline; this agent's should-cost calibration depends on promoting that path to live.)
- *Decision rights:* ADVISE only. It injects market context; it never makes an event-level recommendation.
- *Escalation:* none direct — it raises the confidence (or lowers it) of other agents' envelopes by corroboration.

**Handoff topology.** The downstream agents do not poll; they are triggered by upstream state transitions. Selection's award recommendation, once human-approved, triggers the Contract Agent. Contract sign-off triggers the Transition Agent. The Market-Intelligence Agent is a *cross-cutting* contributor that any agent may query — it has no place in the linear chain. This is the lifecycle loop the OS closes.

### 12.5 Coordination, Handoff & Escalation State Machine

**Why it matters.** This is the single largest architectural gap in the current agent layer. Today handoffs are **strings**: `handoffRecommendation: 'Sentinel to Nexus: ...'` (orchestrator, throughout) and `handoffs: \`${mission.agentName} -> ${mission.handoffTarget}: ${mission.title}\`` (mission report, line 99). The grounding map states it plainly: "No agent-to-agent communication about contradictions, risk amplification, or priority negotiation. Handoff routing is string-based, not state-machine driven." A string handoff cannot be enforced, audited, or replayed. It cannot detect that the Evaluation Agent ranked Vendor A first while the Contract Agent found Vendor A's SLA contradicts its bid. It cannot escalate when two agents' risks *amplify* rather than sum.

**What problem it solves.** A structured coordination layer turns four parallel monologues into a governed conversation with contradiction detection, risk amplification, priority negotiation, and deterministic human-escalation triggers. It is the difference between four agents that each look correct in isolation and one OS that catches the cross-agent contradiction a human reviewer would otherwise miss at 2 a.m. before a board meeting.

**How it works.** Replace the string `handoffTarget` with a typed `AgentHandoff` and a coordination state machine. The `SourceAgentMissionState` enum already carries the right vocabulary — `proposed | active | waiting | blocked | completed | dismissed | escalated | deferred` (mission report, `countByState`, line 263). The state machine consumes these.

```
   ┌──────────┐   evidence ok    ┌──────────┐  engine output  ┌───────────┐
   │ PROPOSED │ ───────────────▶ │  ACTIVE  │ ──────────────▶ │ COMPLETED │
   └────┬─────┘                  └────┬─────┘                 └───────────┘
        │ missing input               │ contradiction OR
        ▼                             │ risk amplification
   ┌──────────┐                       ▼
   │ WAITING  │                 ┌───────────┐   human resolves
   └────┬─────┘                 │ ESCALATED │ ◀──────────────┐
        │ Steward gate fails    └─────┬─────┘                 │
        ▼                             │ blocked by gate        │
   ┌──────────┐  waiver granted       ▼                        │
   │ BLOCKED  │ ────────────────▶ ┌──────────┐                 │
   └──────────┘                   │ DEFERRED │ ────────────────┘
                                  └──────────┘
```

Three new coordination behaviors sit on top of this machine:

1. **Contradiction detection.** Before Sentinel composes the primary voice, the coordinator compares engine envelopes for claim conflicts (Evaluation ranks A first; Contract flags A's SLA as best-effort). A detected contradiction forces the involved missions to `ESCALATED` and bars Sentinel from presenting a clean recommendation. This extends `composePrimaryVoice()` — instead of flattening all `cannotProceedReasons` into a set (line 282), the coordinator first reconciles or escalates conflicts.

2. **Risk amplification.** Risks are not merely concatenated (today: `risks: ranked.flatMap((c) => c.contribution.risks).slice(0, 5)`, line 275). The coordinator detects when two agents' risks compound — e.g., Negotiation's "single viable alternate" plus Transition's "aggressive cutover" together exceed either alone — and elevates the combined risk band, escalating if it crosses threshold.

3. **Priority negotiation.** When two missions of equal priority demand conflicting next actions, the `SPECIALIST_PRIORITY` tier order (Steward > Sentinel > Nexus > Atlas) is the tie-break, and the loser's action is recorded as a deferred mission rather than dropped — preserving the audit trail.

**Human-escalation triggers (deterministic, not discretionary).** The OS must escalate, not improvise, on: (a) a Steward gate block with no waiver; (b) a Sentinel refusal on insufficient evidence; (c) any award, walk-away, or cutover recommendation below its confidence band; (d) a detected cross-agent contradiction; (e) an amplified risk crossing threshold; (f) value labeled by Atlas as anything other than measured `realized`. Each escalation persists with the envelope attached — closing the auditability gap the grounding map flags ("multi-agent briefing is transient; not persisted").

**Implementation implication.** This wires into `src/lib/source/agent-mission-report.ts` (the handoff/state machinery) and `commercial-mission-queue.ts` (action routing). The string `handoffRecommendation`/`handoffTarget` fields remain for back-compat display but are *derived from* the typed state machine, not the source of truth.

### 12.6 Specialist Registry & Plugin Architecture

**Why it matters.** Today the seven specialists are **hardcoded inside the orchestrator** as the `specialistContributions` array (orchestrator, line 295). Adding an eighth specialist — say a should-cost challenger or a renewal-window detector — means editing `buildSentinelSourceBriefing()`. The seven existing builders (`buildContextValidationChecker`, `buildEvidenceGapDetector`, `buildExecutiveDecisionBriefWriter`, `buildMinimumDataRequestGenerator`, `buildNextActionRecommender`, `buildValueAtStakeSummarizer`, `buildWorkflowBlockerDetector`) are real runtime code — they execute on every briefing — but they are **deterministic prose assembly with no engine behind them** (transient, not persisted). The only artifacts under `src/lib/source/__tests__/specialists/` are `*.test.ts` files plus a `specialist-test-utils.ts` helper; there are no separate runtime specialist *modules* there. So the grounding map's maturity-1 read is more precise stated this way: the runtime builders exist, run, and emit deterministic prose, but the model-backed engine reasoning each is meant to carry is unbuilt and exercised only in those tests. The architecture has a real frame and dormant model-backed logic.

**What problem it solves.** A registry decouples *what specialists exist* from *how the orchestrator runs them*, and gives the deterministic-prose builders an engine-backed runtime home. New reasoning capability becomes a registered plugin, not an orchestrator edit. This is what lets Source grow from 7 specialists toward the 10+ the dossier prescribes without re-opening the front agent.

**How it works.** Define a `SourceSpecialist` interface — `{ id, flavor: SourceAgentName, missionType, run(input): SpecialistContribution }` — and a `SpecialistRegistry` that the orchestrator iterates instead of the hardcoded array. The seven existing builders register first as the seed set; their bodies are swapped from deterministic prose to calls into the live engines (Evaluation/BAFO/Selection), promoting the engine-backed reasoning currently exercised only in `__tests__/specialists/` into the runtime path.

```
   buildSentinelSourceBriefing()
            │
            ▼
   ┌──────────────────────┐     register()    ┌────────────────────────────┐
   │  SpecialistRegistry  │ ◀──────────────── │ evidence-gap-detector       │
   │  (iterates, no edit  │ ◀──────────────── │ next-action-recommender     │
   │   to orchestrator)   │ ◀──────────────── │ value-at-stake-summarizer   │
   └──────────┬───────────┘ ◀──────────────── │ executive-decision-writer   │
              │ rank + run                      │ minimum-data-request-gen    │
              ▼                                 │ workflow-blocker-detector   │
   SpecialistContribution[]                     │ context-validation-checker  │
              │                                 │ + future plugins…           │
              ▼                                 └────────────────────────────┘
   composePrimaryVoice() → SENTINEL
```

The registry preserves the existing ranking semantics (`rankSpecialists()` by tier then confidence, orchestrator line 29) — it changes *registration*, not *synthesis*. The Sentinel voice-doctrine check (`checkSentinelVoice`) still runs over the composed output, so the trust contract is unchanged.

**Business value (illustrative range).** The registry is the leverage point that turns the agent layer from a fixed feature into an extensible platform — the Phase 7 "full Source intelligence platform" capability. It is also the line between defensible IP (a governed, extensible reasoning fabric) and a commodity chatbot. Expected effect: specialist time-to-add drops from an orchestrator change with regression risk to a registered module behind a stable interface.

**Implementation implication.** The seam is precisely `buildSentinelSourceBriefing()` in `sentinel-source-orchestrator.ts` and the test fixtures in `__tests__/specialists/`. This is a refactor-and-wire, not a greenfield — consistent with the program's "locate every change at a named file, not a new build" discipline.

### 12.7 Chapter Synthesis

The agent architecture is the OS's face and its conscience. One front agent (Sentinel) speaks; three posture voices (Steward blocks, Sentinel refuses, Atlas frames) hold the trust line; three engine agents (Evaluation, Negotiation, Selection) and three lifecycle agents (Contract, Transition, Market-Intelligence) reason and hand off through a typed state machine that detects contradiction, amplifies compounding risk, and escalates to humans on deterministic triggers. A specialist registry makes the whole thing extensible without re-opening the front agent. Every element of this is a promotion of code that already exists — the orchestrator, the mission report, the voice doctrine, the type contracts — from a deterministic, fixture-bound, transient frame into a live, engine-backed, persisted, decision-empowered architecture. The single most important change is the smallest to state and the largest to build: replace string handoffs with the coordination state machine, because that is what turns four clever monologues into one trustworthy operating system.

---

---

## Chapter 13 — Data Architecture

> Volume 3 · Enterprise Architecture · Classification: board-grade, confidential
>
> *The reasoning is only as defensible as the data model underneath it. This chapter specifies the persistence architecture that lets Source move from "a system that stores documents" to "a system that stores why."*

### 13.0 The Thesis at the Data Layer

Every preceding chapter argued the same point from a different altitude: Source must become a sourcing intelligence operating system, where documents are the *output* of reasoning rather than the *unit* of work. That thesis has a quiet but absolute corollary at the data layer. **A reasoning OS cannot be built on a persistence model that stores only outcomes.** You cannot audit a recommendation you did not record the reasoning for. You cannot show a CXO why vendor A outranked vendor B if the only artifacts on disk are the final memo body and a status enum. You cannot calibrate confidence over time if confidence was never persisted as a structured value. And you cannot enforce a gate against evidence that was never bootstrapped into a row.

Today's Source data model — three per-event state tables plus an events table — is a faithful and well-built representation of *where each artifact and gate stands*. It is a state ledger. What it is not, and what this chapter specifies, is a **reasoning ledger**: a persistence layer that captures the analysis, the evidence that shaped it, the assumptions tested and rejected, the confidence band, and the lineage from a board decision back to the L2/L3 ticket extract that justified it. That gap is why Chapter 13 is load-bearing: it is the schema that makes Volume 2's engines auditable and Volume 4's live-proof requirement satisfiable.

The chapter proceeds in five sections: (13.1) the current persistence model and its precise limits; (13.2) the new reasoning-layer entities; (13.3) the three-layer separation of context, knowledge, and reasoning data; (13.4) the graph relationships and evidence lineage; and (13.5) data-layer enforcement of the evidence readiness ramp.

---

### 13.1 Current Persistence and Its Limits

#### What exists today

The live Source data substrate is four tables. The events table (`supabase/migrations/20260430150000_source_events.sql`) anchors each sourcing event with `client_key`, `event_code`, `current_stage_key` (defaulting to `intake`), `lifecycle_state`, `estimated_value_usd`, and `linked_program_id`. On top of it sit the three per-event state tables created in `supabase/migrations/20260507230000_source_canvas_per_event_substrate.sql`, mirrored in TypeScript at `src/lib/source/canvas-substrate/types.ts`:

```
                        ┌─────────────────────────────────────┐
                        │           source_events             │
                        │  id · client_key · event_code       │
                        │  current_stage_key · lifecycle_state │
                        │  estimated_value_usd · linked_program│
                        └──────────────────┬──────────────────┘
                                           │ 1:N (source_event_id FK, ON DELETE CASCADE)
            ┌──────────────────────────────┼──────────────────────────────┐
            ▼                              ▼                               ▼
┌───────────────────────┐  ┌──────────────────────────────┐  ┌───────────────────────────┐
│ source_event_artifact │  │ source_event_gate_criterion  │  │ source_event_evidence     │
│        _states        │  │           _states            │  │        _states            │
│ artifact_code (d01..) │  │ criterion_id (GATE-…)        │  │ requirement_id            │
│ status (6-enum)       │  │ state (5-enum)               │  │ current_state (7 labels)  │
│ tier · body(markdown) │  │ from_stage→to_stage          │  │ source_artifact_id        │
│ body_generation_meta  │  │ evidence_artifact_ids[]      │  │ stage_key · last_synced   │
│ (JSONB)               │  │ waiver_approval_id           │  │                           │
└───────────────────────┘  └──────────────────────────────┘  └───────────────────────────┘
```

These tables are seeded at event creation by the pure scaffold builder in `src/lib/source/canvas-substrate/scaffold.ts`, which fans the canonical catalogs (`SOURCE_ARTIFACT_SPECS`, `SOURCE_GATE_CRITERIA`, `SOURCE_EVIDENCE_REQUIREMENTS`) into one state row per spec. A fifth table, `source_event_pricing_submissions` (`supabase/migrations/20260508040000_…`), stores parsed vendor xlsx submissions with `unit_prices_by_id` (JSONB), `assumption_deviations`, and a `parse_status` CHECK — the one place in the system where real vendor data lands in structured form. All five tables are tenant-scoped via a denormalized `tenant_key`/`client_key` column and RLS through `can_read_tenant_by_key()`, a deliberate denormalization that trades storage for avoiding a join on every row-level security check.

This is a **maturity-4 state ledger**. The enum discipline is excellent: artifact `status` is a clean six-value lifecycle (`not_started → drafting → needs_review → approved → locked → superseded`), gate `state` is a five-value verdict (`pending | met | not_met | waived | deferred`), and the evidence `current_state` carries all seven readiness labels. The transformer functions (`artifactStateRowToView` et al.) cleanly separate DB rows from camelCase view-models, honoring the project's types.ui/types.db discipline.

#### Where it falls short — five structural limits

The model is strong at *state* and silent at *reasoning*. Five limits gate everything in Volumes 2–3:

| # | Limit | Evidence in the schema | Downstream consequence |
|---|---|---|---|
| L1 | **Evidence rows are never bootstrapped with real state.** Scaffold seeds `current_state` at the catalog default (effectively `Not Requested`); no ingestion path advances them. | `scaffold.ts` `NewEvidenceStateRow` has no state-machine; the grounding map confirms "Evidence state is never bootstrapped at event creation." | Gates cannot read real evidence state, so they default to advisory. The governance backbone has nothing to govern against. |
| L2 | **No reasoning is persisted — only the artifact body.** The analysis behind a memo lives nowhere; `body_generation_metadata` captures model/tokens/stop-reason, not claims/evidence/assumptions. | `SourceEventArtifactStateRow.body_generation_metadata: Record<string, unknown>` — an unindexed JSON bag. | The Reasoning Envelope (Vol 2, Ch 5) has no home table. Recommendations are unauditable; confidence is unrecorded. |
| L3 | **No state machine — only current state.** Each table stores the *present* value; transitions are overwrites, not events. | No `*_transitions` or audit table exists alongside the five state tables. | No waiver trail, no "who advanced this gate and on what evidence," no time-series for confidence calibration. Fails the release-control audit-evidence standard. |
| L4 | **The value ledger and pricing payloads are JSONB, not indexed entities.** Vendor unit prices live in `unit_prices_by_id` JSONB; normalized comparison is computed transiently. | `source_event_pricing_submissions.unit_prices_by_id JSONB` — fine for storage, useless for cross-vendor, cross-event analytics. | The BAFO and Selection engines (Vol 2) cannot query "every vendor's transition rate across all AMS events" — the market brain (Ch 11) has no queryable substrate. |
| L5 | **No vendor or market entity exists at all.** Vendors appear only as a `vendor_name` string on a pricing submission. | No `vendor_profiles`, no `benchmarks` table anywhere in `supabase/migrations/`. | Evaluation, leverage analysis, and benchmark-calibrated should-cost (Ch 11) have no entity to attach to or learn across events. |

The honest framing for the board: **the current model is the correct foundation, not a mistake to undo.** Every new entity in 13.2 extends these tables through foreign keys; nothing is rebuilt. The work is additive — which is exactly what the release-control discipline rewards and what makes the roadmap's phased proof points achievable.

---

### 13.2 New Entities for the Reasoning Layer

The reasoning layer introduces eight new entities. They divide into three clusters: **reasoning capture** (the envelope and its trace), **commercial records** (proposals, scorecards, negotiation rounds, waivers), and **market knowledge** (vendor profiles, benchmarks). Each is specified below with its columns, tenancy posture, and the relationships that wire it into the existing substrate.

#### Cluster A — Reasoning Capture

**`reasoning_envelopes`** — the keystone. This is the persisted form of the Reasoning Envelope contract defined in Volume 2, Chapter 5. Every reasoning step (an evaluation consensus, a leverage analysis, a selection recommendation) emits exactly one envelope row. Its TypeScript shape extends the structures already sketched in `src/lib/source/agent-mission-report.ts` and `multi-agent-types.ts`.

```
reasoning_envelopes
  id                  UUID PK
  source_event_id     UUID FK → source_events(id) ON DELETE CASCADE
  tenant_key          TEXT          -- denormalized for RLS, mirrors substrate pattern
  produced_by         TEXT          -- engine/agent id: 'evaluation' | 'bafo' | 'selection' | 'sentinel'
  subject_artifact_code TEXT        -- e.g. d16, d24 — the deliverable this reasoning grounds
  stage_key           TEXT          -- S0..S7 (canonical stage-pack scheme)
  claims              JSONB         -- [{ claim, supportingEvidenceIds[], strength }]
  assumptions         JSONB         -- [{ assumption, status: 'tested'|'rejected'|'accepted', basis }]
  options_considered  JSONB         -- [{ option, rationale, rejectedBecause? }]
  confidence_band     TEXT          -- 'high' | 'medium' | 'low' (calibrated, not heuristic)
  confidence_factors  JSONB         -- { evidenceSufficiency, recency, corroboration, modelUncertainty }
  caveats             JSONB         -- stage-rigor-scoped limits
  decision_trace_id   UUID FK → reasoning_traces(id)
  model_metadata      JSONB         -- model, promptVersion, tokens, stopReason
  created_at          TIMESTAMPTZ
```

The single most important design decision here: **`confidence_band` is a persisted, calibrated value, CHECK-constrained to `'high' | 'medium' | 'low'`, with its `confidence_factors` decomposed into a JSONB structure — not a binary `'high'` literal.** Like every enum elsewhere in this architecture (§13.5), the band carries a CHECK constraint so an illegal value cannot land; it is the factors JSONB, not the band column, that stays free-form. This directly retires the P0 anti-pattern recorded in the archetype-framework memory — the hardcoded `'high'` confidence in the dormant `source-answer-engine.ts`. Persisting the four factors (sufficiency, recency, corroboration, model uncertainty) is what makes confidence *calibratable* over time, which is the Confidence Philosophy of Volume 1, Chapter 4 made durable.

**`reasoning_traces`** — the observability spine. Where the envelope is the *conclusion*, the trace is the *work*: which evidence rows were retrieved, what archetype/mode/framework was selected and why, the score at each decision point, and the ordered steps. This is the persisted upgrade of today's transient `body_generation_metadata` (L2) and the evidence-trace seam at `src/lib/source/evidence-trace/`.

```
reasoning_traces
  id · source_event_id FK · tenant_key
  envelope_id        UUID FK → reasoning_envelopes(id)
  retrieved_evidence JSONB   -- evidence ids + retrieval scores
  framework_selected TEXT    -- should-cost | delivery-model-gate | proposal-normalization | …
  archetype_resolved TEXT    -- AMS | ERP-SI | AI-data-platform | renewal (from classifySourcingEvent)
  rigor_resolved     TEXT    -- standard | enhanced | strategic (SourceRigorLevel)
  steps              JSONB   -- ordered [{ step, input, output, scoreDelta }]
  created_at
```

#### Cluster B — Commercial Records

These four tables promote the *fixture-bound, transient* commercial layer (`bafo-negotiation.ts`, `award-decision-view.ts`, etc.) into queryable, audit-bearing records.

| Entity | Replaces / extends | Key columns | Why it must be a table, not JSONB |
|---|---|---|---|
| **`vendor_proposals`** | The `unit_prices_by_id` JSONB in pricing submissions, normalized | `source_event_id`, `vendor_profile_id` FK, `normalized_cells` (8-dimension matrix), `parse_status`, `superseded_by` | The BAFO engine's pricing normalization (Vol 2, Ch 7) needs row-level, cross-vendor queries on each of the eight dimensions (scope, assumptions, rates, accelerators, IP, security, transition, SLAs). |
| **`scorecard_submissions`** | The display-only d16 (`scorecard.ts`) | `source_event_id`, `rater_user_id`, `criterion_id`, `score`, `weight_at_submission`, `evidence_ids[]`, `deviation_flag` | Multi-rater consensus, >5-point deviation flagging, and evidence-anchored scoring (Ch 6) require per-rater, per-criterion rows — not one blob per scorecard. |
| **`negotiation_rounds`** | The seeded levers in `bafo-negotiation-model.ts` | `source_event_id`, `vendor_profile_id`, `round_no`, `asks` JSONB, `concessions` JSONB, `residual_gap`, `walk_away_threshold` | The concession tracker (Ch 7, d23 round log) is inherently a time-series; each round is an immutable event. |
| **`waivers`** | The orphan `waiver_approval_id` on gate states | `source_event_id`, `criterion_id`, `requested_by`, `approved_by`, `rationale`, `expires_at`, `state` | Closes the governance loop (Vol 2, Ch 8). Today `gate_criterion_states.waiver_approval_id` points at nothing — this is the table it points to. |

#### Cluster C — Market Knowledge

**`vendor_profiles`** and **`benchmarks`** are the persistent substrate for the Market Intelligence Layer (Chapter 11). Critically, these are **not per-event** — they are cross-event, tenant-or-shared-scoped knowledge (see §13.3). `vendor_profiles` carries capabilities, references, financials, and an AI-maturity assessment; `benchmarks` carries market pricing, savings ranges, and should-cost calibration points keyed by `archetype × dimension`. Every `vendor_proposal` and `scorecard_submission` FKs into `vendor_profiles`, so the system can finally answer "how did this vendor perform across our last five AMS events" — the learning loop that no per-event-only model can support.

#### Tenancy and RLS posture

Every new table follows the proven substrate pattern: a denormalized `tenant_key`, RLS via `can_read_tenant_by_key()`, and `ON DELETE CASCADE` from `source_events` for the per-event entities (Clusters A and B). The two knowledge entities (Cluster C) take a different posture — addressed next — because cross-event knowledge that cascade-deletes with a single event would be a data-loss bug.

---

### 13.3 Context, Knowledge, and Reasoning Layer Separation

The eight new entities are not a flat pile of tables. They belong to **three distinct data layers**, and the separation is itself an architectural commitment that the app-tier must respect. This is the data-model expression of the broker-boundary doctrine already in force in the codebase.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CONTEXT LAYER  (per-event, per-tenant, mutable state)                     │
│  source_events · source_event_artifact_states · …_gate_criterion_states    │
│  …_evidence_states · …_pricing_submissions                                 │
│  vendor_proposals · scorecard_submissions · negotiation_rounds · waivers   │
│  → "what is true for THIS event for THIS tenant right now"                 │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │  read via AgentContextBroker contract
                                 ▼          (agent-context.ts / context-builder.ts)
┌──────────────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE LAYER  (cross-event, market/pattern/benchmark, slow-changing)   │
│  vendor_profiles · benchmarks · pattern-manifest (intelligence-patterns)   │
│  → "what is true across events and across the market"                      │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │  written ONLY by reasoning engines
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  REASONING LAYER  (immutable, append-only, audit-grade)                    │
│  reasoning_envelopes · reasoning_traces                                    │
│  → "why the system concluded what it concluded, with full lineage"         │
└──────────────────────────────────────────────────────────────────────────┘
```

The rules that make this separation load-bearing:

1. **Direction of writes is one-way.** Engines read Context + Knowledge, and write Reasoning. Reasoning rows are append-only and immutable — a recommendation is never edited, only superseded by a new envelope. This is what gives the audit trail integrity: you can replay every decision the system ever made.

2. **Knowledge is never cascade-deleted with an event.** `vendor_profiles` and `benchmarks` outlive any single sourcing event. Deleting the SkyHarbor AMS event must not erase what the system learned about the incumbent vendor. This is why Cluster C breaks from the `ON DELETE CASCADE` pattern of the per-event substrate.

3. **The app-tier never reaches across layers directly.** Per the established knowledge-layer broker boundary, UI and route code must read through the `AgentContextBroker` contract (`src/lib/source/agent-context.ts`, `context-builder.ts`) rather than importing the knowledge or reasoning stores directly. The data architecture makes this enforceable: the broker is the only module granted read access to the Knowledge layer, and the reasoning engines are the only writers to the Reasoning layer.

**Why this matters in business terms.** Mixing these layers is the single most common way enterprise AI systems become un-auditable and un-improvable. If reasoning is overwritten, you lose the ability to show a board why a decision was made — fatal in a procurement context where awards are legally contestable. If knowledge is trapped per-event, the system never gets smarter — every event starts from zero, and the "intelligence" in "intelligence OS" is a marketing claim rather than a queryable asset. The three-layer model is what lets AbarVa truthfully claim cycle-time and savings improvement (illustrative range: 15–30% cycle-time reduction across repeated category events) because each event genuinely inherits the last one's learning.

---

### 13.4 Graph Relationships and Evidence Lineage

State tables answer "what is the status." A graph answers "what connects to what" — and sourcing defensibility is fundamentally a connectivity question: *can I trace this board decision back to the raw evidence that justifies it, and can I trace forward from a piece of evidence to every gate and claim it unblocks?*

The substrate already has the seeds of this graph. `gate_criterion_states.evidence_artifact_ids[]` links a gate to evidence; `artifact-gate-map.ts` links artifacts to the gates they satisfy; `evidence_states.source_artifact_id` links an evidence requirement to the uploaded artifact that fills it. What is missing is a **first-class, typed edge model** that unifies these into a traversable knowledge graph and adds the reasoning-layer edges.

We specify three edge types, expressed as a single `reasoning_edges` table (typed, directional, tenant-scoped):

| Edge type | From → To | Meaning | Powers |
|---|---|---|---|
| `evidence_for` | evidence_state → claim (in envelope) | This evidence row substantiates this specific claim | Backward trace: "show me the L2/L3 ticket extract behind the should-cost number in the d24 brief" |
| `synthesis` | envelope → envelope | This reasoning was built on that reasoning (e.g., selection envelope synthesizes evaluation + BAFO envelopes) | Cross-engine handoff lineage (Vol 3, Ch 12 coordination state machine) |
| `contradiction` | claim → claim / artifact → artifact | These two facts disagree (e.g., "tier-1 SLA claimed in d16" vs. "best-effort in d28 contract") | The commercial-risk and contract-verification engines (Ch 9) flagging contradictions for human escalation |

The bidirectional trace this enables is the UX promise of the reasoning-trace panel (Ch 14) made queryable:

```
  GATE-DECISION-01  ──met_by──►  d24 decision brief
        │                              │ grounded_by
        │ unblocked_by                 ▼
        ▼                        reasoning_envelope (selection)
  evidence: vendor pricing            │ synthesis
  responses [Usable Evidence]    ┌────┴─────┐
        ▲                        ▼          ▼
        │ evidence_for      envelope    envelope
        │                  (evaluation) (BAFO)
   source_artifact:             │ evidence_for
   vendor_a_pricing.xlsx        ▼
   (parsed → normalized →   scorecard_submissions
   vendor_proposals row)    + vendor_proposals
```

A reviewer clicking the d24 board decision can walk *down* to the exact normalized pricing cells and parsed ticket extracts; an analyst who re-parses a vendor file can walk *up* to see every claim, score, and gate that now needs re-validation. This is provenance as a queryable property of the system, not a PDF appendix — and it is precisely the audit evidence the release-control discipline demands for any `client-data-lane` change.

---

### 13.5 Evidence Readiness Ramp Enforcement at the Data Layer

The seven-state readiness ramp is fully specified in types (`SourceEventEvidenceCurrentState`) and catalogued in `canonical-specs/evidence-requirements.ts` (21 requirements). But per L1 and the grounding map, it is enforced *nowhere*: rows are never bootstrapped to real state, the UI collapses seven states to a binary, and gates do not read minimum-state thresholds. This section closes that gap at the layer where it can actually be guaranteed — the database — rather than in application code that can be bypassed.

**Three enforcement mechanisms:**

1. **CHECK-constrained state with a transition function.** Replace the free-text `current_state` with a CHECK constraint over the seven labels, and route every mutation through a `advance_evidence_state()` SQL function that validates the transition is legal (the ramp is `Not Requested → Loaded → Parsed → Available → Usable Evidence`, with `Stale`/`Low Confidence` as side-states reachable from any active state). Illegal jumps (e.g., `Not Requested → Usable Evidence`) are rejected at the database, satisfying the context-ingestion truth standard's insistence that "loaded," "parsed," and "usable" are *separate states* that must never be collapsed.

2. **An append-only `evidence_state_transitions` audit table.** Every advance writes a row: `from_state`, `to_state`, `actor`, `source_artifact_id`, `at`. This is the data-layer answer to L3 (no state machine) and supplies the lineage the §13.4 graph traverses. It is also the audit evidence a release record cites when claiming an event's evidence is "usable."

3. **Bootstrap real evidence rows at event creation.** Extend `scaffold.ts` so `NewEvidenceStateRow` seeds at `Not Requested` *and* registers the requirement so the ingestion path (Admin loader → parse → commit) can advance it through the real ramp. Critically — and consistent with the governed-ingestion contract — scaffolding seeds the *requirement*, never fabricated evidence; only the loader, after a genuine parse with source citations, may advance a row to `Parsed` or beyond.

With these three in place, gates can finally read **real** evidence state. `source-governance-enforcement.ts`'s `evaluateCriterionMetReadiness()` already reads the `EVIDENCE_RANK` map; once the underlying rows carry truthful, constraint-guaranteed state, the same function flips from advisory to enforcing without a rewrite. The governed-refusal posture (the net-new evidence-or-refuse mechanism that wires into `source-answer-engine.ts`, per Volume 1) gains a trustworthy substrate: it can refuse to advance a gate or surface a recommendation *because the database guarantees the evidence has not reached `Usable Evidence`*, not because application code happened to check.

**The business payoff** is the difference between a system that *claims* governance and one that *has* it. A gate that cannot be advanced past a CHECK constraint is a control an auditor, a CIO advisory board, or a contesting losing bidder can rely on. That reliability — evidence states that mean what they say, decisions that trace to their grounds, knowledge that compounds across events — is the data architecture that turns the intelligence-OS thesis from an aspiration into an enforceable property of the platform.

---

### 13.6 Migration Path and Layer Mapping

To keep this implementable under release-control discipline, the new entities map cleanly to roadmap phases (Vol 4, Ch 16) and to release lanes:

| Entity / mechanism | Roadmap phase | Release lane | Live-proof gate |
|---|---|---|---|
| `reasoning_envelopes` + `reasoning_traces` | Phase 1 (reasoning spine) | `global-control-lane` (flag-gated) | One real event emits a persisted, queryable envelope on ACA private DB |
| `scorecard_submissions`; ramp CHECK + transitions + bootstrap | Phase 2 | `client-data-lane` | Real multi-rater scoring + evidence advanced through ramp by loader |
| `vendor_proposals`; `negotiation_rounds` | Phase 3 | `client-data-lane` | Live vendor xlsx normalized into row-level cells (not JSONB) |
| `waivers`; `reasoning_edges` (contradiction) | Phase 4 | `global-control-lane` | Waiver request → approval → gate-variance recorded with audit trail |
| `vendor_profiles`; `benchmarks` | Phase 7 (market brain) | `client-data-lane` + shared knowledge | Cross-event vendor query returns calibrated benchmark |

Every one of these is **additive** — new tables and constraints alongside the proven five-table substrate, reachable only through the broker boundary, written one-way into an append-only reasoning layer. No existing migration is reversed; the current state ledger becomes the Context layer of a three-layer model. That additive, lane-classified, live-proof-gated path is what makes a data architecture of this ambition shippable rather than a rewrite the organization cannot afford.

---

---

## Chapter 14 — UX Architecture

A sourcing intelligence operating system is judged at the glass. The reasoning engines specified in Volume 2 and the contract, transition, and market layers of Volume 3 only become *value* when a category manager, an evaluation lead, a commercial negotiator, and a CIO can each look at a screen and act with conviction. This chapter specifies the UX architecture for that act of conviction. It is not a component library and not a visual style guide — the design tokens are already locked (`#F8F7F4` canvas, Georgia serif headings at normal weight, DM Sans body, black/ghost buttons; see `src/components/source/foundationStyles.ts`, which exposes `COLORS`/`FONTS` and is the single token source every Source surface already imports). This chapter is the *interaction architecture* that turns reasoning into decisions: the principles that govern every screen, the six decision surfaces that map one-to-one onto the engines of Volumes 2–3, and the cross-cutting reasoning-trace panel that is the literal UX expression of the OS thesis.

The governing design fact, established in Volume 1's current-state audit, is that Source today renders *outputs* (stage canvases, artifact drawers, gate panels, commercial views) but rarely renders *reasoning*. There are 80-plus components under `src/components/source/`, and the commercial cluster alone runs to two dozen panels (`SourceCommercialHub.tsx`, `AmsBafoPanel.tsx`, `PricingNormalizationMatrix.tsx`, `ScorecardGovernancePanel.tsx`, and others) — but these are fixture-bound display surfaces. The UX work of this volume is not to add screens. It is to re-found the existing surfaces on a reasoning substrate so that every recommendation carries its *why*.

### 14.1 UX Principles for a Reasoning System

Five principles govern every Source surface. They are not aesthetic preferences; each one solves a specific failure mode that the audit and the founder's repeated density rejections (recorded in the canvas-density contract) have already surfaced.

**Principle 1 — Surface the reasoning trace, not just the answer.** *Why it matters:* a recommendation a CIO cannot interrogate is a recommendation a CIO will not sign. *Problem it solves:* today's generated deliverables (d01/d05/d09, the only three live in `prompt-registry.ts`) emit prose with no visible evidence weighting, no confidence band, and no assumption ledger; the reader must trust or reject the whole artifact. *How it works:* every recommendation-bearing surface renders a **reasoning trace** — the ranked evidence that drove the conclusion, the assumptions held, the confidence band, and the decision path — sourced from the reasoning envelope defined in Volume 2 and carried on the mission-report contract (`src/lib/source/agent-mission-report.ts`, `SourceAgentMissionReport`, with its `contextUsedSummary`). *Business value:* decision latency at the board gate collapses because the dissent-worthy assumptions are already on the table (illustrative range: 30–50% faster executive sign-off). *Implementation:* a single reusable panel (§14.8) bound to the envelope, not re-authored per screen.

**Principle 2 — Density discipline: one row per item, status as color, forms reveal on click.** *Why it matters:* the founder rejected canvas clutter twice (preview pane, then a triple-repeating gate panel with always-open textareas); the lesson, recorded as the canvas-density contract, is *"every click is a decision, not form-fill."* *Problem it solves:* sourcing surfaces carry high cardinality — dozens of criteria, vendors, clauses, checkpoints — and naive layouts drown the operator. *How it works:* each list surface renders exactly one row per item; **status is encoded as color** (drawing the locked palette's teal/amber/risk tokens), there is one gap line of breathing room, and any form to edit an item *reveals on click* with detail living one level down in a drawer (`SourceDrawerShell.tsx`, `SourceArtifactDrawer.tsx`, `EvidenceTraceDrawer.tsx` are the existing drawer primitives). *Business value:* an evaluation lead scans 40 criteria in seconds rather than scrolling a wall of open textareas. *Implementation:* the row-per-item pattern is already partially present in `SourcingEventTable.tsx` and `VendorScorecardMatrix.tsx`; this chapter makes it the universal contract.

**Principle 3 — The Ask-Anything agent toolbar is the agentic spine.** *Why it matters:* without a persistent, GPT-style bottom toolbar the surface does not *feel* agentic (recorded as a standing feedback item). *Problem it solves:* operators have questions that no static panel anticipates ("which vendor has the weakest SLA evidence?"). *How it works:* a sticky, auto-growing, spellchecked, Enter-submits toolbar fronts **Sentinel** (the one front agent for Source; Nexus=Moves, Atlas=Tower, Steward=governance voice) on every surface, routing to the grounded-answer engine (`source-answer-engine.ts`, today DORMANT) once it is wired. Existing scaffolds — `PersistentNexusPanel.tsx`, `SentinelMissionPanel.tsx`, `SentinelEngagementCanvas.tsx` — are the seams. *Business value:* the surface answers the question the screen didn't anticipate, which is where consulting value actually lives. *Implementation:* one toolbar component, rendered by the `(maestro)/source/layout.tsx` shell so it is universal.

**Principle 4 — Format follows intent.** Rich, conversational reasoning renders inline (markdown → tables/lists); heavy or structured output renders as a downloadable artifact card (Claude-artifact / GPT-canvas style), reusing the HTML/DOCX/PPTX/XLSX renderers in `src/lib/source/exports/`. *Value:* the operator never restructures a wall of text into a board deck by hand.

**Principle 5 — Anchor in the locked design system and the existing component set.** No new color, font, or layout primitive is introduced. Every surface specified below composes existing tokens and drawer/panel primitives. *Value:* the redesign is additive, not a rewrite, which is what keeps it shippable.

```
   ┌──────────────────────── SOURCE SURFACE SHELL ─────────────────────────┐
   │  SourceSubNav (sticky)  ·  Stage rail S0──S7                           │
   │  ┌─────────────────────────┐   ┌──────────────────────────────────┐   │
   │  │  DENSITY-DISCIPLINED     │   │  REASONING TRACE PANEL           │   │
   │  │  CANVAS                  │──▶│  evidence weights · assumptions  │   │
   │  │  one row / item          │   │  confidence band · decision path │   │
   │  │  status = color          │   │  (binds reasoning envelope)      │   │
   │  │  forms reveal on click   │   └──────────────────────────────────┘   │
   │  └─────────────────────────┘   detail one level down → SourceDrawer    │
   │  ┌───────────────────────────────────────────────────────────────┐    │
   │  │  ◇ Ask Sentinel anything…                          [↵ submit]   │    │
   │  └───────────────────────────────────────────────────────────────┘    │
   └────────────────────────────────────────────────────────────────────────┘
```

### 14.2 The Evaluation Workbench

**Mandate.** The Evaluation Workbench is the glass for the Evaluation Engine (Volume 2 / Phase 2). It is the surface where multi-rater scores become a defensible, evidence-anchored, weight-governed recommendation. Today the substrate is the weakest in the chain — `scorecard.ts` offers only approval-state helpers, the d16 template is a stub, and the live panel `ScorecardGovernancePanel.tsx` records verdicts rather than producing them. The Workbench is therefore the highest-value UX in the volume.

**Screens & workflow.** The Workbench is a single surface with five tabs, each one row-per-item:

| Tab | One row per | Status color encodes | Forms-on-click reveal | Engine output |
|---|---|---|---|---|
| Rater Submission | criterion × vendor cell | submitted / draft / overdue | score + rationale + evidence link | per-rater raw scores |
| Weight Governance | evaluation criterion | locked / pending-approval / changed | weight value + change reason + approver | governed weight set (d17 weight log) |
| Deviation Review | criterion where raters diverge | within-band / flagged / escalated | side-by-side rater rationales | consensus + dissent (d16) |
| Sensitivity What-If | weight slider | base case / scenario | re-rank result preview | rank stability under weight perturbation |
| Evidence Drill-Down | scored claim | usable / stale / low-confidence | source citation + readiness state | evidence-anchored score |

**User journey.** An evaluation lead opens the Workbench at stage `S4` (post-demo/PoC). She scans the Rater Submission grid — color tells her instantly which raters are overdue. She opens Deviation Review; three criteria are amber (raters diverge beyond band). She clicks a row; the two rationales reveal side-by-side, and the reasoning-trace panel shows that one rater weighted a reference call the other never saw. She resolves it, then runs a Sensitivity What-If: dragging the "AI capability" weight from 15% to 25% does not change the rank order — the recommendation is *robust*, and that robustness is now a board-defensible statement, not a hope. Every score she sees carries a confidence band sourced from the evidence readiness state on the 7-step ramp; a score built on `Loaded`-but-not-`Usable` evidence is visibly low-confidence.

**Grounding & seam.** `ScorecardGovernancePanel.tsx` and `VendorScorecardMatrix.tsx` are the existing surfaces; `EvaluationCriteriaEditor.tsx` becomes the Weight Governance tab; `EvidenceTraceDrawer.tsx` is the drill-down. The Workbench consumes the weighted-aggregation, deviation, and sensitivity outputs the Evaluation Engine must add to `scorecard.ts`.

### 14.3 The BAFO Command Center

**Mandate.** The BAFO Command Center is the glass for the BAFO/negotiation engine (Volume 2 / Phase 3). It turns evaluation outputs and normalized pricing into *leverage* and a per-vendor negotiation strategy. Today's commercial layer is PARTIAL and fixture-bound: `bafo-negotiation.ts`, `ams-bafo-view.ts`, `pricing-normalization.ts`, and the panels `AmsBafoPanel.tsx` / `SourceBafoNegotiationPanel.tsx` / `PricingNormalizationMatrix.tsx` / `PricingTrapLog.tsx` exist over vendor-a/b/c fixtures with no live data call-site.

**Screens & workflow.** Five coordinated zones, density-disciplined throughout:

```
  ┌──── BAFO COMMAND CENTER (stage S5_bafo) ──────────────────────────────┐
  │  LEVERAGE DASHBOARD          │  PER-VENDOR STRATEGY (one row/vendor)    │
  │  switching cost · #bidders   │  ┌ Vendor A  ● strong leverage          │
  │  scope concentration         │  │   target: 12% price ↓ (illustrative) │
  │  → leverage score per vendor │  │   ask: SLA tier-1, cap escalators    │
  │                              │  └ click → strategy detail drawer        │
  ├──────────────────────────────┼──────────────────────────────────────────┤
  │  CONCESSION TRACKER          │  EV SCENARIO MODELING                     │
  │  one row / concession asked  │  walk-away vs. settle expected value      │
  │  status: open/won/conceded   │  per round, with probability bands        │
  ├──────────────────────────────┴──────────────────────────────────────────┤
  │  PRICING-TRAP LOG  one row / detected trap (ramp clauses, unit drift)     │
  └────────────────────────────────────────────────────────────────────────┘
```

**User journey.** A commercial lead enters at `S5`. The Leverage Dashboard shows Vendor A at high leverage (three bidders remain, low switching cost) and Vendor C at low leverage (incumbent, deep integration). She opens Vendor A's per-vendor strategy row; the drawer reveals the recommended concession asks with the reasoning trace explaining *why* each is winnable — the trace cites the should-cost estimate (`should-cost/should-cost-model.ts`) and the normalized price gap. She logs the concessions in the Concession Tracker; the EV Scenario panel updates the expected value of pressing versus settling for each round. (Note on should-cost wiring: `should-cost-model.ts` *is* imported and called by `source-answer-engine.ts`, so it has a call-site there — but that engine is DORMANT, and the module's own header still carries a stale "not wired" comment. Either way, the live `generate-route` pipeline does not yet reach it.) The Pricing-Trap Log flags a back-loaded ramp clause in Vendor B's submission that the normalization layer caught — a trap that would have cost real money post-signature (illustrative range: 3–8% of total contract value). Every number on the screen is a row, color-coded by status; nothing is an open textarea.

**Grounding & seam.** `commercial-mission-adapter.ts` and `commercial-risk-detection.ts` feed the trap log; `bafo-negotiation-model.ts` and `bafo-scenario-compare-view.ts` feed the EV panel; `SourceBafoNegotiationModelPanel.tsx` is the existing model surface. The Command Center is what makes these fixtures live by binding them to real pricing submissions.

### 14.4 The Selection Center

**Mandate.** The Selection Center is the glass for the award recommendation (Volume 2 selection engine). It converts evaluation and BAFO outputs into a ranked recommendation with explicit confidence, decision options, and risk attestation — feeding d24 decision brief, d25 risk attestation, d27 selection memo. Today `award-decision-view.ts`, `vendor-selection-readiness.ts`, and `executive-decision-summary.ts` exist as fixture-bound logic with surfaces `SourceVendorSelectionReadinessPanel.tsx` and `SourceExecutiveDecisionSummaryPanel.tsx`.

**Screens & workflow.** A single decision surface:

| Zone | Contents | Density rule |
|---|---|---|
| Ranked Recommendation | recommended vendor, runner-up, gap, **confidence band** | one row per ranked vendor |
| Decision Options | award / re-BAFO / split / cancel — each with EV and risk | one row per option, color = recommended/viable/discouraged |
| Risk Attestation | residual risks the decider must accept | one row per risk, status = accepted/open |
| Readiness Check | are all gates green to award? | one row per gate (from `gate-criteria.ts`) |
| Sign-off Capture | decider identity, timestamp, rationale, dissent | reveal-on-click form |

**User journey.** A selection lead reviews the ranked recommendation; the confidence band is *medium*, and the reasoning trace explains why — one usable-evidence gap on Vendor A's security posture. She sees a red Readiness Check row: a hard gate (`GATE-` id, severity hard) is unmet. She cannot proceed to sign-off until it clears — the UX enforces the gate the engine defines. Once green, she captures sign-off; her rationale and any dissent are recorded as audit evidence (no demo thinking — this is pilot-grade audit trail).

### 14.5 The Contract Center

**Mandate.** Specified fully in Chapter 9, the Contract Center is the glass for contract intelligence — it picks up after award and renders redline analysis, liability/indemnity assessment, SLA verification, and commercial-term extraction against the negotiated BAFO outcome, anchored on d28 contract record. The renderer exists (`exports/renderers/ai-clause-gap.ts`); the reasoning does not. The clause-extraction substrate is a genuine net-new build: Source's synchronous first-mile parser (`artifact-registry/text-parser.ts`) handles only text-like uploads (pasted notes, Markdown, text, CSV) and does *not* read binary formats. Rich binary vendor-document parsing (DOCX, PDF) is therefore a net-new capability for Source — it must either be built here or reuse the Moves-side async pipeline (`src/lib/programs/` doc-parser and `attachments/extract-text`), with the upload seam at `artifact-registry/upload-contract.ts`.

**Screens & workflow.**

```
  ┌──── CONTRACT CENTER (stage S6_contract) ───────────────────────────────┐
  │  CLAUSE LEDGER  one row / clause                                        │
  │   ● standard   ● redlined   ● gap-vs-BAFO   ● missing                    │
  │   click → clause drawer: uploaded text │ standard position │ trace       │
  │                                                                          │
  │  CONTRADICTION FEED  one row / detected contradiction                    │
  │   "tier-1 SLA scored in evaluation; contract says best-effort"           │
  │   → links to scorecard commitment + BAFO concession + risk attestation   │
  └────────────────────────────────────────────────────────────────────────┘
```

**User journey.** A legal reviewer uploads the vendor's draft MSA via the artifact registry (`artifact-registry/upload-contract.ts`). The Clause Ledger renders one row per extracted clause, color-coded; three rows are red — gaps versus the negotiated BAFO position. The Contradiction Feed surfaces the load-bearing catch: the contract's SLA language is *best-effort*, but the evaluation scored a *tier-1* SLA and the BAFO won a tier-1 concession. `SourceContradictionCard.tsx` is the existing surface for this; the reasoning trace shows the three linked sources (scorecard commitment, BAFO round log, contract clause). The reviewer routes the finding to legal sign-off. This is the surface that prevents the single most expensive sourcing failure mode — winning a commitment in negotiation and losing it in the paper.

### 14.6 The Transition Center

**Mandate.** Specified fully in Chapter 10, the Transition Center is the glass for transition intelligence — readiness scoring, KT tracking, checkpoint logging, and risk monitoring through cutover. It replaces today's binary keyword-derived risk with a quantitative readiness model (d29 transition plan, d30 checkpoint log, d31 KT evidence). Existing logic: `transition-readiness-view.ts`; existing surface seam: the commercial-readiness panels.

**Stage scope (stated once for the volume).** Transition readiness is not a single-stage concern. The work it scores — KT, parallel-run, cutover sequencing, rollback — straddles `S6_contract` (where the transition plan d29 is committed alongside the contract record) into `S7_activate` (where cutover, checkpoint logging d30, and KT evidence d31 are executed and verified). The canonical convention this volume adopts: the *transition plan* is authored and gated at `S6_contract`, and *transition readiness* is scored and the Transition Center is anchored at `S7_activate`, where execution and verification happen. Other chapters that name a single stage for transition deliverables should be read against this convention — `S6` for plan authorship, `S7` for readiness scoring and cutover execution. (The canonical stage scheme is the stage-pack convention `S0_intake..S7_activate`; the UI `source-shape-resolver.ts` uses a divergent S1/S3/S6/S7 labeling — references here use the canonical scheme.)

**Screens & workflow.**

| Zone | One row per | Status color | Engine output |
|---|---|---|---|
| Readiness Scorecard | readiness dimension (KT maturity, parallel-run scope, cutover sequencing, rollback depth) | green/amber/red score | composite readiness score |
| KT Tracker | knowledge item | transferred / verified / gap | d31 KT evidence |
| Checkpoint Log | cutover checkpoint | on-track / slipped / blocked | d30 checkpoint log |
| Risk & Blackout Monitor | active risk / blackout window | monitored / breached | escalation → commercial-mission-queue |

**User journey.** A transition manager opens the Readiness Scorecard at `S7_activate`. Rollback Depth is amber — the plan has no tested rollback for the payments cutover. The KT Tracker shows two knowledge items as *gap* (transferred but not verified). A Checkpoint Log row slips; the Risk Monitor escalates it, routing an action through `commercial-mission-queue.ts`. The manager cannot mark the transition complete while a verified-KT gap remains, closing the lifecycle loop into value realization (d32 value ledger, surfaced by `SourceValueLedger.tsx`).

### 14.7 The Executive Cockpit

**Mandate.** The Cockpit is the portfolio-level board surface — it aggregates across all live sourcing events what the six per-event surfaces show locally. It is the CIO's single pane: which events are at which stage, which are blocked, where the dollars and risks concentrate, and which decisions await sign-off. It composes `SourceEventsPortfolio.tsx` / `SourcePortfolioPage.tsx` (existing portfolio surfaces) with the reasoning layer.

**Screens & workflow.** One row per sourcing event; columns encode stage (S0–S7), value-at-stake (illustrative ranges only, never false precision), readiness, blocking gate count, and pending decision. Color is the language: a red event is gate-blocked; an amber event awaits a decision; teal is on-track. A portfolio reasoning trace explains *concentration* — "62% of value-at-stake sits in three AMS events all entering BAFO this quarter" (illustrative range) — which is exactly the cross-event insight a CIO advisory board wants and no per-event screen can show.

**User journey.** The CIO opens the Cockpit weekly. Two events are red (gate-blocked); one amber awaits award sign-off. She clicks the amber row; it deep-links into that event's Selection Center. She asks Sentinel via the Ask-Anything toolbar: "which events are most exposed to a single vendor?" — and the grounded answer (once `source-answer-engine.ts` is wired) returns a portfolio concentration view with citations. The Cockpit is where the OS thesis becomes visible to the buyer of the OS.

### 14.8 Reasoning Trace Visualization (Cross-Surface)

This is the keystone of the chapter and the literal UX expression of the OS thesis: *documents are outputs of reasoning, so reasoning must be visible everywhere*. A **single reusable reasoning-trace panel** renders on every surface above. It binds to the reasoning envelope (Volume 2) carried on the multi-agent contracts — `SourceAgentBriefing` and `SpecialistContribution` in `multi-agent-types.ts`, and `SourceAgentMissionReport.contextUsedSummary` in `agent-mission-report.ts`, where confidence is already typed as `'low' | 'medium' | 'high'`.

The panel renders four bands, each density-disciplined:

```
  ┌──── REASONING TRACE ───────────────────────────────────────────┐
  │  CONFIDENCE   ● medium   (1 usable-evidence gap)                 │
  │  EVIDENCE     one row / item, ranked by weight                   │
  │   ▸ ref-call transcript      weight 0.31  ● usable               │
  │   ▸ pricing submission        weight 0.27  ● usable               │
  │   ▸ security questionnaire    weight 0.18  ● stale  ⚠            │
  │  ASSUMPTIONS  one row / assumption  (click → basis + who set it)  │
  │  DECISION     why this over the runner-up; what would flip it     │
  └─────────────────────────────────────────────────────────────────┘
```

*Why it matters:* it is the same panel on the Evaluation Workbench, the BAFO Command Center, and the board Cockpit — which means the operator learns one interaction grammar and applies it to every decision. *Problem it solves:* the current pipeline emits trust-or-reject prose; the panel makes every recommendation interrogable and makes *insufficiency visible* — when evidence is `stale` or `low-confidence`, the band shows it, which is the UX half of the governed-insufficiency posture that Volume 2 wires into `source-answer-engine.ts` (today ABSENT; the shipped `disclosure-flag/` classifier is a legal-privilege labeler, not a refusal mechanism — the trace panel must not be confused with it). *Business value:* it is the difference between a tool a CIO advisory board *uses* and one it *audits and discards*. *Implementation:* one component, four props bound to the envelope, rendered in the right rail of every Source surface via the `(maestro)/source/layout.tsx` shell — additive, token-locked, and the cheapest high-leverage UX investment in the entire roadmap.

**Closing scorecard.** Six decision surfaces, one reasoning-trace grammar, one agent toolbar, one density contract — all composing the existing 80-component surface set rather than replacing it. The UX architecture's single thesis: *Source's screens stop displaying answers and start defending them.*

| Surface | Engine (Vol 2/3) | Existing seam | UX state today |
|---|---|---|---|
| Evaluation Workbench | Evaluation Engine | `ScorecardGovernancePanel.tsx` | display-only → make reasoning-anchored |
| BAFO Command Center | BAFO Engine | `AmsBafoPanel.tsx` | fixture-bound → bind live pricing |
| Selection Center | Selection Engine | `SourceExecutiveDecisionSummaryPanel.tsx` | fixture-bound → gate-enforced sign-off |
| Contract Center | Contract Intelligence (Ch 9) | `SourceContradictionCard.tsx` | renderer only → wire clause reasoning |
| Transition Center | Transition Intelligence (Ch 10) | `transition-readiness-view.ts` | binary risk → quantitative readiness |
| Executive Cockpit | Portfolio aggregation | `SourceEventsPortfolio.tsx` | event list → reasoning-aware portfolio |
| Reasoning Trace (all) | Reasoning Envelope (Vol 2) | `multi-agent-types.ts` | ABSENT → keystone build |

---

---

## Chapter 15 — Deliverable Architecture (d01-d33)

### 15.0 Why this chapter exists, and what it changes

Every prior chapter in Volume 3 designed an organ of the operating system — the reasoning engine, the evaluation engine, the agent fabric, the data substrate. This chapter is where those organs produce something a human can sign. The 33 deliverables (`d01`–`d33`, catalogued in `src/lib/source/canonical-specs/artifact-specs.ts`) are the system's externally visible surface: the strategy memo a CIO forwards to a steering committee, the pricing comparison a CFO challenges, the selection memo a board approves, the contract record legal redlines. If the reasoning is invisible inside the machine, the deliverable is where it becomes accountable.

The central argument of this specification — Source is a *sourcing intelligence operating system*, not a document generator — lives or dies in how these deliverables are conceived. In a document generator, a deliverable is a template plus a prompt: text in, text out, the document *is* the product. In an operating system, a deliverable is **the rendered surface of a reasoning act**: the strategy memo is what the analysis stage concluded, the pricing comparison is what the normalization model computed, the selection memo is what the recommendation framework decided. The document is downstream of, and traceable to, the reasoning that produced it. That inversion is the whole game.

The honest current state, grounded in the audit (`_GROUNDING_MAP.md`, `docs/source/STAGE_DELIVERABLES_INVENTORY.md`), is stark and must be stated plainly so this chapter is read as a build spec and not a status report:

- **3 of 33 deliverables generate.** Only `d01_strategy_memo`, `d05_scope_memo`, and `d09_rfp_pack` have live prompt templates in `src/lib/source/agent-generation/prompt-registry.ts`. The remaining 30 exist as lightweight markdown stubs under `src/content/source-templates/<cat>/dNN_*.md` — a heading and placeholder sections, never auto-scaffolded into an event.
- **The export pipeline is broader than the generation pipeline.** `src/lib/source/exports/{format-router,dispatch}.ts` plus 40+ renderers can emit docx/xlsx/html for ~11 deliverable kinds — but their payload builders (`exports/payloads/`) bind to fixtures, not to live vendor submissions, rater scores, or parsed evidence. We can render a pricing comparison; we cannot yet render *this tenant's* pricing comparison from real data.
- **The PDF route works but only binds four artifacts.** `render-pdf/route.ts` is built: it imports `@react-pdf/renderer`, gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and returns status-200 PDFs — but only for the four codes with a payload binder and config (`d05`, `d09`, `d24`, `d27`); any other code returns **404** (not yet wired), not a missing-route error. The board-packet deliverables (e.g. `d25`, `d26`, `d28`) cannot ship as PDFs not because the route is missing but because their per-artifact PDF binders and signature blocks are. The real work is *extending* coverage to the remaining codes, never building a PDF path from scratch.
- **Reasoning metadata is absent from every deliverable.** Generated artifacts carry `body_generation_metadata` (model, tokens, prompt version) but no record of *which evidence shaped a claim, what assumptions were tested, what the confidence band is.* This is the gap that keeps deliverables in the "document" category.

This chapter does two things. First (§15.1) it defines a single **Deliverable Contract** — the ten-clause specification every one of the 33 must satisfy — so that "build d16" stops meaning "write a template" and starts meaning "wire a reasoning act to a governed, traceable, exportable artifact." Second (§15.2–§15.7) it applies that contract family by family across all 33, identifying for each its reasoning framework, its quality gates, and its dependencies. §15.8 isolates the load-bearing missing artifacts — the few that, until built, block everything downstream. §15.9 specifies the export, format, and quality-gate architecture that turns a reasoning envelope into a signed document.

---

### 15.1 The Deliverable Contract

A deliverable in a sourcing intelligence OS is not a file format. It is a **contract** between a reasoning act and the humans who consume its output. Today that contract is implicit and partial: `prompt-registry.ts` captures a system prompt, an upstream-artifact list, and a token ceiling — but says nothing about who consumes the output, what reasoning framework produced it, what quality gates it must clear, or who approves it. The result is that the three live deliverables are well-authored prose with no machinery behind them, and the 30 stubs are nothing at all.

We define ten clauses. Every deliverable specification — `d01` through `d33` — must answer all ten before it is considered built. This is the template, applied in §15.2 onward.

| # | Clause | What it specifies | Where it lives in code |
|---|---|---|---|
| 1 | **Purpose** | The single decision or action the deliverable enables. One sentence. | `artifact-specs.ts` `description` |
| 2 | **Consumer** | Who reads it and what they do next (CIO, CFO, evaluation panel, legal, board, downstream deliverable). | new field on `SourceArtifactSpec` |
| 3 | **Inputs** | Upstream deliverables, evidence states, and live data the deliverable requires; hard vs. optional. | `prompt-registry.ts` `upstreamRequired/Optional` + new `evidenceRequired` |
| 4 | **Outputs** | The structured payload the deliverable emits (not just prose) — the shape downstream consumers bind to. | `exports/payloads/*` |
| 5 | **Reasoning framework** | The named analysis the deliverable renders — should-cost, weighted scoring, leverage analysis, risk adjustment. *This is the OS clause.* | Volume 2 engines; `should-cost/`, `proposal-normalization/`, `bafo-negotiation-model.ts` |
| 6 | **Quality gates** | Machine-checkable conditions the output must pass before it surfaces: 0 unsupported claims, 0 leaks, evidence-cited, tier-sufficient. | new per-deliverable gate spec, tied to `gate-criteria.ts` |
| 7 | **Approvals** | The human sign-off required to lock it, and the role that owns that sign-off. | `gate-criteria.ts` `ownerRole`; `source-governance-enforcement.ts` |
| 8 | **Dependencies** | Which gate criteria this deliverable defines or unblocks; what re-opens if it changes. | `artifact-gate-map.ts` |
| 9 | **UI surface** | The workbench or panel where it is authored, reviewed, and drilled into. | `src/components/source/`; Ch14 workbenches |
| 10 | **Prompt / generation architecture** | How it is produced: pure-prose generation, structured-payload generation, deterministic computation, or hybrid. | `prompt-registry.ts` + engine call |

Three clauses deserve emphasis because they are where today's implementation is thinnest and where the OS thesis is enforced.

**Clause 4, Outputs, must be structured — not just prose.** Today `d01` emits markdown and nothing else. A strategy memo whose value target is buried in a sentence cannot be read by the value-at-stake summarizer, cannot seed the should-cost baseline, cannot populate the executive cockpit. The contract requires every deliverable to emit a structured payload alongside its prose body — the value target as a `{low, base, high, confidence}` object, the scope as an inventory of in/out items, the scorecard as criterion-weight-score rows. The renderer architecture in `exports/payloads/` already models this for ~11 kinds (`ScorecardPayload`, `PricingTemplatePayload`); the contract makes it universal and makes the structured payload the *source of truth*, with prose rendered from it rather than parsed back out of it.

**Clause 5, Reasoning framework, is the clause that distinguishes this chapter from a template library.** Each deliverable names the reasoning act it renders. `d02_value_target` renders the should-cost model (`should-cost/should-cost-model.ts`). `d16_scorecard` renders weighted multi-rater consensus (Ch6). `d20_trap_log` renders the 8-dimension pricing-normalization comparison (`pricing-normalization.ts`). The deliverable does not *invent* its content via a generic prompt; it *expresses* a computed reasoning result. This is the difference between "ask Claude to write a pricing analysis" and "compute the normalized comparison, then ask Claude to narrate the computed result with citations." The former hallucinates numbers; the latter cannot, because the numbers arrive pre-computed and the model's job is exposition, not arithmetic.

**Clause 6, Quality gates, makes deliverable quality machine-enforced, not hoped-for.** The Deliverable Intelligence work proven on SkyHarbor established the bar: a board-grade artifact must pass a quality gate of *0 unsupported claims, 0 confidentiality leaks, every material claim evidence-cited.* The contract attaches gates per deliverable: a strategy memo gate checks the value target carries a confidence band; a scorecard gate checks every score links to an evidence citation; a decision brief gate checks no claim lacks an upstream-artifact reference. These gates read from the **reasoning envelope** (Ch5) — the structured record of claims, evidence, assumptions, and confidence that every reasoning step emits — which is precisely why the envelope is the keystone of the whole system. A deliverable's quality is auditable only because the reasoning that produced it is recorded.

**The generation taxonomy (Clause 10).** Deliverables fall into four production modes, and naming the mode per deliverable resolves most of the "how do we build d-NN" question:

```
  MODE A · Prose-led generation       (Claude drafts narrative from bound context + envelope)
           → strategy/scope/decision memos: d01 d02 d03 d05 d06 d24 d27
  MODE B · Structured-payload generation (engine computes payload; renderer emits xlsx/docx; prose narrates)
           → scorecard/pricing/trap: d16 d17 d19 d20 d22
  MODE C · Deterministic computation   (no model; pure builder over substrate; renderer emits)
           → logs/registries/ledgers: d14 d18 d23 d28 d30 d31 d32
  MODE D · Hybrid                      (deterministic skeleton + model narration of computed result)
           → premortem/disqualification/risk attestation: d08 d18 d25 d33
```

Modes B and C are where the OS earns its defensibility: numbers come from engines and substrate, never from a language model's imagination. Mode A is where it earns its readability. The current system implements only a degenerate Mode A (generic prompt, no envelope) for three deliverables.

---

### 15.2 Strategy & Scope Family (d01–d08)

This family establishes the fact base and the boundary of the event — the work elite operators (McKinsey, Kearney) do *before* going to market. It is the only family with any live generation today (`d01`, `d05`).

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d01** strategy memo | Frame why-now, what, value target, archetype, rigor | A (LIVE) | Archetype + rigor heuristic (`prompt-registry.ts`) → should-cost (target) | Value target carries confidence band; decision owner named | Sponsor → steering committee |
| **d02** value target | Quantify the savings/value envelope to defend | A→B | `should-cost/should-cost-model.ts` (clean-sheet baseline) | Target is `{low,base,high}` with stated assumptions | CFO / sponsor |
| **d03** archetype decision | Record the archetype × estate classification and its rigor consequences | D | `classifier/category-classifier.ts` `classifySourcingEvent()` | Classification cites the trigger evidence; rigor justified | Sentinel / governance |
| **d04** app inventory | Enumerate in-scope applications/systems with disposition | C | Deterministic over uploaded landscape (`app-inventory-payload.ts`) | Every row has a disposition; no orphan systems | Scope lead |
| **d05** scope memo | Define in/out boundary, exclusions, dependencies | A (LIVE) | Two-gap (foundation vs. use-case) framing | Exclusions cross-referenced to d06; no scope ambiguity | Scope lead → RFP |
| **d06** exclusion log | Record what is deliberately out of scope, with rationale | C | Deterministic register | Each exclusion has a rationale and an owner | Scope lead |
| **d07** ticket synthesis | Synthesize L2/L3 ticket/run-rate history into demand signal | B/D | Run-rate analysis over parsed ticket evidence | Synthesis cites ticket-history evidence state ≥ Parsed | Demand analyst |
| **d08** premortem | Anticipate failure modes of the sourcing approach before market | D | Red-team / challenge model (Ch5) | ≥1 mitigation per identified failure mode | Sponsor / Sentinel |

**The d01 reality and the d02 dependency.** `d01` is live and genuinely useful: its system prompt (`prompt-registry.ts`) instructs a 600–1200 word memo across five §-sections and *does* ask for a value target "as a range with confidence band when the intake provided one." But "when the intake provided one" is the tell — today the range is whatever a human typed at intake, not a computed should-cost baseline. The architectural upgrade is to make `d02_value_target` a Mode-B deliverable that *runs* `buildShouldCostEstimate` (`should-cost/should-cost-model.ts`) over the event's category and landscape, emits a `{low, base, high, confidence, assumptions[]}` payload, and then `d01` *consumes that payload* rather than reciting an intake field. This is the first place the "documents are outputs of reasoning" thesis becomes concrete: the value target is computed, then narrated.

**d03 activates the dormant classifier.** `classifySourcingEvent()` exists and runs only inside the dormant `source-answer-engine.ts` and fixtures — never in the live generation path. Making `d03_archetype_decision` a real deliverable is the forcing function that wires classification into the live pipeline: at intake the classifier produces a `CategoryClassification`, `d03` renders it as an auditable decision record (archetype, estate, rigor, and the evidence that drove each), and that classification then parameterizes every downstream deliverable's rigor and evidence thresholds. The archetype stops being a string on a row and becomes the governing variable it was designed to be.

---

### 15.3 RFP & Responses Family (d09–d15)

This family takes the event to market and ingests what comes back. `d09` is live; `d10`–`d15` are stubs. The pivotal architectural fact is that **d13–d15 are the first deliverables that depend on parsed external evidence** — uploaded vendor responses — and therefore the first to exercise the parse → evidence-state → reasoning chain that the system has modeled but never run on live data. Note that `artifact-registry/text-parser.ts` is only the first-mile text/Markdown/CSV parser (it handles pasted notes / Markdown / text / CSV via `extractLabeledLines`/`extractPricingComponents`; it does *not* import `mammoth`, `pdf-parse`, or `exceljs`); the binary (docx/pdf/xlsx) extraction these deliverables ultimately need is **net-new for Source** — either a new capability or a reuse of the Moves-side async pipeline under `src/lib/programs/` (doc-parser, attachments/extract-text), not an extension of `text-parser.ts` (see Ch9).

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d09** RFP pack | The issued requirements + evaluation criteria + commercial template | A (LIVE) | Scope (d05) → requirements decomposition | Every requirement traces to scope; criteria + weights present | Sourcing lead → vendors |
| **d10** RFI summary | Synthesize market RFI responses into a shortlist hypothesis | B | Market-scan synthesis | Synthesis cites each RFI source | Sourcing lead |
| **d11** response checklist | The completeness rubric vendors must satisfy | C | Deterministic from d09 sections | Checklist covers 100% of d09 mandatory items | Sourcing lead → vendors |
| **d12** vendor shortlist | The qualified set advancing to evaluation, with rationale | D | Qualification scoring + risk screen | Each include/exclude has a cited rationale | Sourcing lead → panel |
| **d13** vendor responses | Registered, parsed vendor submissions | C | First-mile `text-parser.ts` (text/CSV) + net-new async binary extraction | Parse status = Parsed; evidence rows created | System → evaluation |
| **d14** Q&A log | The vendor clarification trail | C | Deterministic register | Every Q linked to the affected requirement | Sourcing lead |
| **d15** response completeness | Per-vendor gap report vs. the d11 checklist | B | Completeness diff (checklist × parsed response) | Gaps cite the missing checklist item | Panel / Sentinel |

**Why d15 is more than a report.** `d15_response_completeness` already has a renderer (`exports/renderers/response-checklist`) — but its payload is fixture-bound. The contract makes it a Mode-B deliverable that diffs the parsed vendor response (from `d13`) against the `d11` checklist and emits a structured gap list. This is the system's first live demonstration that *uploaded documents drive reasoning*: until a vendor response is parsed into evidence and diffed against a requirement rubric, the system cannot honestly say a vendor is "complete." Today it could only assert completeness from a fixture. This deliverable is the proof point that the parse-to-evidence-to-reasoning chain works end to end, and it gates the evaluation family that follows.

---

### 15.4 Evaluation Family (d16–d18)

This family is where the **vendor evaluation engine** (Ch6) surfaces. Today the scorecard (`d16`) is display-only: a renderer with no scoring engine behind it. The contract turns the evaluation family into the rendered output of weighted multi-rater consensus.

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d16** scorecard | Consensus weighted scores and ranking across vendors | B | Weighted multi-rater consensus (Ch6) | Every score links to ≥1 evidence citation; weights sum to 100 | Panel chair → selection |
| **d17** weight log | The governed record of criterion weights and any changes | C | Deterministic weight-change audit | Each weight change has an owner + timestamp + rationale | Panel chair / governance |
| **d18** disqualification log | The evidence-anchored rationale for each disqualified vendor | D | Disqualification chain (criterion → evidence → decision) | Each DQ cites the failing criterion and its evidence | Panel chair → legal |

**The scoring engine is the missing reasoning, not the missing template.** The renderer for `d16` exists; what is absent is the consensus model: per-rater submissions, criterion weights governed via `d17`, aggregation, calibration, and the >5-point deviation flag that triggers a re-rate. `d16`'s quality gate — *every score links to an evidence citation* — is the bar that separates an opinion-scorecard from a defensible one. A score of 7/10 on "delivery reliability" that points to nothing is litigable; a 7/10 that cites the vendor's parsed reference-customer evidence and a specific SLA-history line is defensible. `d18`'s gate is the same discipline applied to exclusion: a disqualification that cannot cite the criterion it failed and the evidence of failure is a lawsuit waiting to happen. These three deliverables are the first family where *legal defensibility* is the operative quality bar, and they are why the evidence-citation clause (Clause 6) is non-negotiable.

---

### 15.5 Pricing & BAFO Family (d19–d23)

This is the **commercial core** and it contains the single most load-bearing gap in the entire system. The pricing-normalization model (`pricing-normalization.ts`) — eight dimensions: scope, assumptions, rates, accelerators, IP, security, transition, SLAs — is built but runs over an empty proposal set. The BAFO models (`bafo-negotiation.ts`, `bafo-negotiation-model.ts`, `bafo-scenario-compare-view.ts`) are fixture-bound with no live call-site.

The canon (`artifact-specs.ts`) carries a single pricing code, `d19` (`d19_pricing_workbook`). The pricing *work*, however, is naturally a chain: the workbook is issued, filled, parsed back, normalized, and trap-scanned. To make that chain buildable we decompose `d19` into proposed net-new sub-artifacts — **`d19a`/`d19b`/`d19c`, which are not in the 33-code canon** but informal sub-steps of the canonical `d19` — flowing into `d20`:

```
  d19a PRICING TEMPLATE  ──issued to vendors──▶  vendors fill it
  (structured workbook)                              │
        │                                            ▼
        │                              d19b VENDOR SUBMISSIONS  (parsed back in)
        │                                            │
        └──────────normalization matrix──────────────┤
                                                      ▼
                            d19c PRICING COMPARISON  (8-dimension normalized)
                                                      │
                                                      ▼
                                       d20 TRAP LOG  (computed anomalies + narration)
```

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d19a**¹ pricing template | The structured workbook vendors price into | C | Deterministic from scope + cost model | Cells cover every cost dimension; locked formulas | Commercial lead → vendors |
| **d19b**¹ vendor submissions | Parsed, normalized vendor pricing | C | Parse → `pricing-submissions/dao.ts` | Every submission mapped to template cells | System → normalization |
| **d19c**¹ pricing comparison | Apples-to-apples normalized comparison | B | 8-dim `pricing-normalization.ts` | Normalization assumptions stated per dimension | CFO / commercial lead |
| **d20** trap log | Computed pricing traps (ramps, exclusions, escalators) | B/D | `commercial-risk-detection.ts` over normalized data | Each trap cites the submission cell that triggered it | Commercial lead / Sentinel |
| **d21** assumption set | The normalization assumptions governing the comparison | C | Deterministic register | Every comparison adjustment references an assumption | Commercial lead |
| **d22** BAFO question pack | Per-finalist negotiation asks, concession ladder, walk-away | B | Leverage analysis (`bafo-negotiation-model.ts`) | Asks cite the d19c gap or d16 deviation they target | Negotiation lead |
| **d23** BAFO round log | The concession tracker: rounds, gives/gets, residual gap | C | Deterministic round register | Each round records give, get, and residual | Negotiation lead → selection |

¹ `d19a`/`d19b`/`d19c` are **proposed net-new sub-artifacts, not canonical codes** — the canon has only `d19` (`d19_pricing_workbook`). They are named here only to make the pricing chain's build sequence explicit.

**d19a is the keystone the entire commercial layer hangs from.** The inventory (`STAGE_DELIVERABLES_INVENTORY.md`) flags the structured pricing template explicitly as the single most load-bearing missing artifact, and the logic is unforgiving: until a *structured* pricing template is issued, vendors return prose PDFs and free-form spreadsheets; without a structured template, there is no deterministic way to parse submissions into comparable cells (`d19b`); without comparable cells, the 8-dimension normalization (`d19c`) runs over nothing; without normalization, the trap log (`d20`) has no anomalies to detect and the BAFO question pack (`d22`) has no leverage to compute. The renderer for the pricing template *exists* (`exports/renderers/pricing-template.ts`); the *generator that produces a tenant-specific template from the event's scope and cost model* does not. This is a Mode-C deliverable — pure deterministic construction from the scope inventory and should-cost dimensions — and it is the highest-leverage single artifact to build because it unblocks five downstream deliverables and the entire negotiation engine. Estimated commercial impact of getting the negotiation chain live is material — concession capture in the high single-digit to low double-digit percentage of contract value (illustrative range) — but *zero* of it is reachable until `d19a` issues a structured template.

**d22 promotes negotiation from prose to leverage.** Today the BAFO levers in `bafo-negotiation-model.ts` are seeded, not computed. The contract makes `d22` a Mode-B deliverable whose asks are *derived* from concrete gaps: a `d19c` pricing dimension where one finalist runs over the should-cost baseline by a material margin (illustrative range) becomes a specific concession ask; a `d16` score deviation becomes a clarification demand. The quality gate — *every ask cites the d19c gap or d16 deviation it targets* — is what makes the negotiation pack defensible to a sponsor and actionable to a counterparty, rather than a generic list of "ask for a discount."

---

### 15.6 Executive Decision & Selection Family (d24–d28)

This family is where the **selection intelligence engine** (Ch8) produces a board-grade recommendation. It is the family with the hardest output requirement — signed PDFs — and the PDF route already serves two of its codes (`d24`, `d27`); the remaining gap is per-artifact PDF binders for the rest of the deal pack, not a missing route.

A naming note that must be reconciled before these artifacts ship to a customer: the repo's d24 template is literally titled *"Atlas Decision Brief"* and `d26` is named for *Steward*. Under the one-front-agent doctrine, **Sentinel is the single front agent for Source**; Atlas, Nexus, and Steward are internal voices, not competing front-agent brands. A Source decision packet must therefore present a single Sentinel-fronted face — the Atlas/Steward labels are internal lineage and should not surface as three separate brands on a board-bound document.

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d24** decision brief | The board-grade award recommendation with options + rationale | A | Risk-adjusted ranking + recommendation framework | Recommendation carries calibrated confidence band; options ranked | Board / sponsor |
| **d25** risk attestation | The named, owned, mitigated risk register behind the decision | D | `commercial-risk-detection.ts` + impact×probability×mitigability | Each risk has owner + mitigation; no unowned high risk | Sponsor / governance |
| **d26** Steward sign-off | The governance attestation that gates were met or waived | C | `source-governance-enforcement.ts` gate evaluation | Every hard gate is met or has a logged waiver | Steward |
| **d27** selection memo | The defensible written rationale for the awarded vendor | A | Recommendation + tie-break logic | No claim lacks an upstream-artifact reference | Sponsor → legal |
| **d28** contract record | The anchor record linking award to the signed contract | C | Deterministic + clause extraction (Ch9) | Contract terms reconcile to d22 BAFO outcome | Legal / commercial |

**The board packet must be one coherent, signed artifact.** `d24`, `d25`, and `d26` are not three independent documents; they are a *deal pack* — a decision brief, the risk attestation that backs it, and the Steward sign-off that governs it — assembled into a single board-consumable packet with signature blocks. Two architectural facts shape this today: the deal-pack route (`/api/v1/source/[eventId]/deal-pack`) already assembles a combined document and returns 200 — its real gap is **multi-artifact ZIP bundling** (composing several discrete deliverables into one downloadable package), not that it does nothing; and the PDF route, while built (`render-pdf/route.ts` renders status-200 PDFs via `@react-pdf/renderer`), returns 404 for codes without a wired binder — it carries binders and configs only for `d05`/`d09`/`d24`/`d27`, so `d25` and `d26` are not yet PDF-renderable. The contract requires (a) the deal-pack assembler extended to bundle the three deliverables plus their reasoning envelopes (including ZIP packaging where multiple artifacts ship together), and (b) the existing PDF route extended with per-artifact binders for `d25`/`d26` plus signature blocks, so the packet ships as a signed PDF rather than a docx that loses fidelity. Until both exist, the system can reason its way to a board recommendation but cannot *deliver* it in the form a board accepts.

**d24's confidence band is the trust currency.** Today `executive-decision-summary.ts` derives a binary posture. The contract replaces it with a calibrated confidence band (Ch5's confidence model: evidence sufficiency × score margin × unresolved assumptions). A board that is told "recommend Vendor B, confidence: high (score margin 14 points, all hard gates met, 1 open assumption on transition staffing)" can make a decision; a board told "recommend Vendor B" with no confidence calculus is being asked to trust a black box. The quality gate — *no claim lacks an upstream-artifact reference* — is what lets a dissenting board member drill from any sentence in `d27` back to the `d16` score or `d19c` comparison that produced it.

---

### 15.7 Transition & Value Family (d29–d33)

This family closes the lifecycle: from signed contract to running service to measured value. It is almost entirely unbuilt as live generation, and today's transition risk is "binary keyword-derived" (`transition-readiness-view.ts`) rather than a quantitative readiness model.

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d29** transition plan | The KT, parallel-run, cutover, rollback plan | A→B | Quantitative readiness scoring (Ch10) | Plan has rollback depth + cutover sequence; readiness scored | Transition lead |
| **d30** checkpoint log | The transition milestone/checkpoint tracker | C | Deterministic register + slip detection | Every checkpoint has owner + date + status | Transition lead |
| **d31** KT evidence | What knowledge moved, verified by whom, gaps flagged | C | Deterministic evidence tracker | Each KT item verified-by named; gaps flagged | Transition lead / Steward |
| **d32** value ledger | Contracted value commitments vs. measured realization | C | `value-ledger.ts` variance tracking | Each commitment links to a measurement + variance | Sponsor / CFO |
| **d33** governance review | The periodic governance review of the running engagement | D | Variance + risk re-assessment | Review cites d32 variances and d25 risk status | Governance / board |

**d32 closes the loop the OS exists to close.** The entire point of a sourcing intelligence operating system is that the value targeted in `d02` is *defended through the lifecycle and measured at the end.* `d32_value_ledger` is the deliverable that makes that accountability real: it binds each contracted commitment (from `d28`) back to the value target (`d02`) and forward to a measured realization, surfacing variance. Today `value-ledger.ts` exists in skeleton with minimal implementation and no path connecting commitments to measurement. The contract makes `d32` a Mode-C deliverable computing variance from substrate, and `d33` a Mode-D review that narrates it — turning the system from "we ran a sourcing event" into "we captured the value we promised, and here is the evidence."

---

### 15.8 The load-bearing missing artifacts

Of the 30 unbuilt deliverables, a small set are *load-bearing* — they block disproportionate downstream value and must be sequenced first. Ranked by leverage:

| Rank | Artifact | Why load-bearing | Unblocks |
|:--:|---|---|---|
| 1 | **d19a pricing template** (Mode C) | No structured template ⇒ no parseable submissions ⇒ no normalization ⇒ no trap log ⇒ no leverage | d19b, d19c, d20, d22, the entire BAFO engine |
| 2 | **The reasoning envelope binding** (cross-cutting) | Every Clause-4 structured output and Clause-6 quality gate reads from it | Quality gates on all 33; reasoning-trace UI |
| 3 | **d02 value target** (Mode B, should-cost) | Computed baseline ⇒ defensible d01, d19c deviations, d32 measurement | d01 quality, d19c gaps, d32 variance |
| 4 | **d16 scoring engine** (Mode B) | Display-only scorecard ⇒ no defensible ranking | d18, d24, d27 (the whole decision chain) |
| 5 | **d13/d15 parse-to-evidence chain** | First live use of uploaded-document reasoning (net-new binary extraction for Source) | d16 evidence citations, d20 trap detection |
| 6 | **d25/d26 PDF binders** (extend existing route) | The PDF route is built and serves d24/d27; the deal pack lacks per-artifact binders for d25/d26 | d24–d26 deal-pack delivery as signed PDF |

The sequencing logic is causal, not arbitrary: `d19a` unblocks the commercial engine, the reasoning envelope unblocks every quality gate, the should-cost baseline unblocks defensible value claims end to end. These six, built in order, convert roughly nine-tenths of the deliverable surface from "stub" to "reachable."

---

### 15.9 Export, format, and quality-gate architecture

The deliverable contract terminates at the export layer, which is — uniquely in this subsystem — *more* mature than the generation layer it serves. The architecture is a three-stage pipeline already substantially built in `src/lib/source/exports/`:

```
  reasoning envelope + structured payload
            │
            ▼
   [ payloads/ ]  builder binds envelope → typed payload (ScorecardPayload, PricingTemplatePayload …)
            │
            ▼
   [ format-router.ts ]  kind + requested format → allowed? → renderer
            │                (narrative = docx/html/pdf · structured = xlsx/docx/pdf)
            ▼
   [ dispatch.ts → renderers/ ]  40+ renderers emit docx (docx lib) · xlsx (exceljs, write-only) · html · pdf
```

Three architectural priorities complete it.

**Bind payloads to live data.** The single largest export gap is not missing renderers — it is that payload builders bind to fixtures. The pricing-template payload does not read live vendor submissions; the scorecard payload does not read rater submissions or weight deltas; the trap-log payload does not parse vendor narratives. The contract's Clause 4 (structured outputs) resolved at the engine layer fixes this at the source: when `d16` *is* the rendered output of the scoring engine and `d19c` *is* the rendered output of the normalization model, the payload builder reads computed reasoning, not a fixture. The renderers were built ahead of the reasoning; the reasoning is what makes them honest. (Note `exceljs` here is used only to *write* xlsx exports — it is not a vendor-response reader; reading binary vendor submissions is the net-new parsing capability flagged in §15.3.)

**Extend the PDF binders to the full deal pack.** The PDF route is built — `render-pdf/route.ts` gates on `isPdfGeneratable()` and renders status-200 PDFs through `@react-pdf/renderer` — but it only carries payload binders and configs for four codes (`d05`, `d09`, `d24`, `d27`); any other artifact returns 404 (not yet wired). The board-decision family needs `d25`/`d26` to render too, so the discrete, sequenced build (load-bearing item 6) is per-artifact PDF binders plus signature blocks for the rest of the deal pack, not a new route — without them the system reasons to a recommendation it cannot deliver in full board-acceptable form.

**Make quality gates machine-checkable and envelope-fed.** The final architectural move binds Clause 6 to the export pipeline: no deliverable renders for sign-off until it passes its gates, and the gates read the reasoning envelope. The universal gates — *0 unsupported claims, 0 confidentiality leaks, every material claim evidence-cited* — apply to all 33; the per-deliverable gates (value-target confidence band, scorecard evidence links, BAFO ask-to-gap citations) apply per family as tabulated above. A deliverable that fails a hard gate does not silently render; it surfaces the failure as a gap (the Sentinel voice doctrine, `src/lib/agent/voice-doctrine/sentinel.ts`: *lead with the gap*), routes to the owning role for waiver or remediation via `source-governance-enforcement.ts`, and is blocked from locking until the gate clears or a waiver is logged. This is the mechanism that makes deliverable quality a property of the system rather than a property of the operator's diligence — and it is the final expression of the chapter's thesis: a deliverable is the signed, governed, traceable surface of a reasoning act, and its quality is exactly as auditable as the reasoning beneath it.

**The disclosure-flag interaction.** One clarification prevents a common conflation: `disclosure-flag/` is a *shipped legal-privilege classifier* — it marks a deliverable as attorney-client or work-product and inherits that flag to downstream derived artifacts. It is **not** a market-data disclosability tagger and **not** an evidence-insufficiency refusal mechanism. The quality gates above are the refusal-on-insufficient-evidence posture, and that posture is net-new — it would wire into the generation path (extending `source-answer-engine.ts` and the per-deliverable gate spec), distinct from the privilege classification that disclosure-flag already performs. A deliverable can be both *privilege-flagged* (disclosure-flag) and *gate-blocked* (quality gate); they are orthogonal governance layers, and the contract requires both.


\newpage

## Volume 4 — Implementation Roadmap

> Classification: Board-Grade, Confidential · 2026-06-19 · Grounded against branch `codex/corpus-wave-24`.
> Review verdict: **needs-minor-fixes**.

## Chapter 16 — Seven-Phase Delivery Plan

Volume 4 converts the architecture of Volumes 2 and 3 into a buildable sequence. The preceding chapters argued *what* the Sourcing Intelligence Operating System is and *how* its engines reason; this chapter answers the only question a board ultimately funds against: *in what order, against what proof, and at what risk do we build it?* The discipline that governs this answer is the one stated throughout Volume 1 — a capability is not "done" because a deterministic builder returns the correct TypeScript shape over a fixture. It is done when it has reasoned correctly over a real sourcing event, end-to-end, on the ACA private database, against real vendor data, with the Steward gate holding. Every phase below carries that bar as its release condition, because the central failure mode of this program is not building the wrong thing — the dormant logic surveyed in our internal grounding notes is mostly well-shaped — it is declaring fixture-bound logic "shipped" and discovering at the first real customer that nothing was wired to live data.

### 16.1 Sequencing Logic & Cross-Phase Dependencies

The sequence is not a preference; it is forced by the dependency structure of the reasoning system. Five facts fix the order.

**First, the reasoning spine must ship before anything else, because there is nowhere to put a recommendation until it exists.** Today the live pipeline is `Event → Context Binder (`src/lib/source/agent-generation/context-binder.ts`) → Prompt Registry (`agent-generation/prompt-registry.ts`) → Claude (`server.ts`) → Deliverable`, invoked through `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`. There is no Analysis stage and no Recommendation stage between bound context and generated markdown. A vendor ranking, a negotiation strategy, a confidence band, a refusal — none of these have a home in the current pipeline. The Reasoning Envelope (Vol 2, Ch 5) is the canonical container every downstream engine emits and every UX surface renders. Until it exists, Phases 2–7 have no output contract to conform to. This is why Phase 1 is non-negotiable and first.

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
*Relevant repo seams referenced in this chapter (absolute paths): `/Users/anand/Projects/nexus/src/lib/source/agent-generation/server.ts`, `/Users/anand/Projects/nexus/src/lib/source/agent-generation/context-binder.ts`, `/Users/anand/Projects/nexus/src/lib/source/source-answer-engine.ts`, `/Users/anand/Projects/nexus/src/lib/source/classifier/category-classifier.ts`, `/Users/anand/Projects/nexus/src/lib/source/scorecard.ts`, `/Users/anand/Projects/nexus/src/lib/source/pricing-normalization.ts`, `/Users/anand/Projects/nexus/src/lib/source/pricing-submissions/dao.ts`, `/Users/anand/Projects/nexus/src/lib/source/bafo-negotiation-model.ts`, `/Users/anand/Projects/nexus/src/lib/source/award-decision-view.ts`, `/Users/anand/Projects/nexus/src/lib/source/source-governance-enforcement.ts`, `/Users/anand/Projects/nexus/src/lib/source/canonical-specs/gate-criteria.ts`, `/Users/anand/Projects/nexus/src/lib/source/artifact-registry/upload-contract.ts`, `/Users/anand/Projects/nexus/src/lib/source/transition-readiness-view.ts`, `/Users/anand/Projects/nexus/src/lib/source/value-ledger.ts`, `/Users/anand/Projects/nexus/src/lib/intelligence/pattern-manifest.ts`, `/Users/anand/Projects/nexus/src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`.*


\newpage

