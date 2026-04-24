# File 02 · Pattern Library Architecture Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Claude Code (pattern authoring and integration), Codex (pattern infrastructure)
**References:** File 01 failure modes FM-1 through FM-12. All patterns here exist to address one or more failure modes.

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`. Confidence level noted where inferred.

**Applies:** Agent Autonomy Charter. Pre-decided items in File 01 Section 15.

---

## Section 1 · Architectural premise

Patterns are not documentation. Patterns are accelerators that make every agent response faster and better than a blank-context response would be. Three-tier structure. Retrieval on every agent turn. Pattern-carries-execution-contract. Every pattern authored via a systematic assembly methodology that includes LLM synthesis, client-data validation, and provenance tracking. Over time, patterns mature through feedback from accumulated interactions. At scale, high-volume patterns become training data for specialized SLMs.

This file specifies: the three-tier structure, the specific patterns in each tier, the pattern metadata schema, the assembly methodology, the retrieval and composition architecture (at the pattern-library level; deeper architecture in File 03), the priority sequencing for demo and seed, and the retrofit plan for the 13 existing patterns.

---

## Section 2 · The three-tier structure

### Tier 1 — Craft patterns

Use-case agnostic. Phase-grain. Apply to every program regardless of industry or problem type. Capture "how good transformation work gets done" as craft — the discipline that distinguishes senior consulting partner work from junior analyst work.

Count: 20-25 patterns across five phases.
Size per pattern: tight — 3-5 pages of structured data, not long-form prose.
Retrieval: activates based on current phase of the program.
Composition: multiple Tier 1 patterns active at once for any given phase.

**Why this tier matters most for scalable moat:** craft scales across every engagement. A handful of tier 1 patterns enhances every program in every vertical. Craft is also what consulting firms uniquely have; by capturing it as structured retrievable intelligence, AbarVa inherits that advantage at scale.

### Tier 2 — Capability patterns

Use-case agnostic but not phase-grain. Cross-cutting capabilities that appear across programs regardless of industry. Examples: solution architecture alignment, estimation frameworks, operating model selection, vendor evaluation, build-vs-buy decisions, change management playbook.

Count: 8-10 patterns.
Size per pattern: substantial — 8-12 pages of structured data plus methodology, examples, variants.
Retrieval: activates when the relevant capability is invoked in a program (e.g., architecture pattern activates in Phase 3 for tech programs).
Composition: typically one or two Tier 2 patterns active alongside Tier 1 and Tier 3 at any given moment.

**Why this tier matters for commercial resonance:** capability patterns are where Fortune 500 CIOs feel the product's depth. "AbarVa does estimation rigorously" is a compelling claim supported by a capability pattern, not by generic feature descriptions.

### Tier 3 — Use-case patterns

Domain-specific. Organized by vertical (Healthcare, Retail, FinServ, Energy, Cross-sector) and within each vertical by specific use case. These are the enrichment patterns that layer onto Tier 1 and Tier 2 for specific industry situations.

Count: starts with 13 existing (retrofitted) + 10-15 gap coverage. Expands over time.
Size per pattern: focused — 5-8 pages of structured data with domain-specific priors.
Retrieval: activates when the program matches the pattern's use case declaration.
Composition: typically one Tier 3 pattern active per program.

**Why this tier matters for specificity:** clients need to feel the product "knows their industry." Tier 3 patterns are the visible domain-specificity layer. They're also what enables the emergent cross-tenant intelligence over time.

### Composition at runtime

For any agent response, the retrieval pipeline assembles:

- Relevant Tier 1 craft patterns for the current phase and activity
- Relevant Tier 2 capability patterns for the current decision or deliverable type
- The matching Tier 3 use-case pattern for the program
- Tenant-specific data and history
- Program-specific state and history

These compose into the context window. The LLM reasons across the composed context. The response reflects the composition.

The difference from default Claude: default Claude has only the user's prompt and its training data. AbarVa has all five inputs above, assembled on every turn. That's the moat.

---

## Section 3 · Tier 1 craft patterns — the list

Twenty-two Tier 1 patterns, organized by phase. Each pattern addresses one or more failure modes from File 01.

### Phase 1 · Intake & Framing (5 patterns)

**T1-P1-01 · Scope Boundary Setting**

Addresses: FM-1 (wrong use case), FM-4 (cross-functional misalignment)
Purpose: Good scope statements name what success excludes, not just what it includes. Ambiguous scope is the leading indicator of Phase 3 failure.
Activation: During charter drafting (D01).
Priors: Programs with scope exclusions explicit have 35% lower Phase 3 revision rates. Scope statements that lack "we are NOT doing X" language correlate with 50%+ higher Phase 3 revision rates.
Agent guidance: Pressure-test any scope the user proposes with "what are we explicitly excluding?" If the user can't name exclusions, the scope isn't complete.

**T1-P1-02 · Sponsor Commitment Verification**

Addresses: FM-3 (insufficient C-suite), FM-4 (misalignment)
Purpose: Structured sponsor commitment in writing dramatically outperforms "sponsor is supportive."
Activation: During charter (D01), enforced at Phase 1 gate.
Priors: Programs with written sponsor commitment (budget ceiling, named decision gates, named resistance interventions, time allocation) outperform by 3-5x on completion rate.
Agent guidance: Refuse to advance Phase 1 gate without structured commitment. Nexus prompts sponsor directly when commitment fields are empty.

**T1-P1-03 · Success Metric Quality**

Addresses: FM-1 (wrong use case), FM-9 (no value tracking)
Purpose: Metrics must be measurable, leading-indicator-capable, and tied to specific decisions. Not all percentages; not all outcomes; specific combinations.
Activation: During success metric tree (D03).
Priors: Metrics expressed only as percentages without absolute values are 60% likely to be revised in Phase 3. Metrics with both percentage AND absolute have lower rework.
Agent guidance: Require each metric declared as "X% represents Y absolute units at Z baseline." Flag metrics without leading indicators.

**T1-P1-04 · Stakeholder Completeness**

Addresses: FM-3 (sponsor), FM-4 (misalignment)
Purpose: Missing a Tier 2 influencer in Phase 1 surfaces as a Phase 3 blocker in 40% of programs. Stakeholder mapping needs tiered rigor.
Activation: During stakeholder map (D02).
Priors: Complete stakeholder maps include Tier 1 decision-makers, Tier 2 influencers, Tier 3 informed parties. Per Tier 1, explicit definition of success. Per Tier 2, explicit stance and interest level.
Agent guidance: After initial stakeholder entry, prompt for adjacent roles commonly missed ("who else has to approve for this to move forward? who would object if not engaged?").

**T1-P1-05 · Intake Tension Capture**

Addresses: FM-4 (misalignment)
Purpose: The synthesis must explicitly name tensions across stakeholder definitions. Tensions that go unnamed in Phase 1 surface as Phase 3 blockers.
Activation: During intake synthesis (D04).
Priors: 60%+ of Phase 3 decision memos require revision when intake synthesis didn't capture Tier 1 tensions.
Agent guidance: After synthesis draft, pressure-test: "are there stakeholders whose success definitions require different program priorities? If so, surface the tension; if not, confirm explicitly."

### Phase 2 · Diagnosis & Analysis (5 patterns)

**T1-P2-01 · Hypothesis Falsifiability**

Addresses: FM-8 (no pattern-based pressure-testing)
Purpose: Hypotheses must be falsifiable, measurable, and tied to specific interventions. Unfalsifiable hypotheses survive to Phase 3 as rationalizations.
Activation: During hypothesis backlog (D11).
Priors: Unfalsifiable hypotheses correlate with 70%+ Phase 3 revision rate.
Agent guidance: For every hypothesis, verify falsifiability ("what evidence would disprove this?") and measurability ("what data would we use to test?").

**T1-P2-02 · Evidence Triangulation**

Addresses: FM-2 (data readiness), FM-5 (wrong architecture)
Purpose: Single-source evidence is weaker than triangulated. Diagnoses anchored on three sources have 2x lower Phase 3 contradiction rates.
Activation: During RCA (D09) and baseline (D07).
Priors: Diagnoses citing only one data source survive Phase 3 scrutiny 55% of the time. Diagnoses with 3+ sources survive 88%.
Agent guidance: For every major diagnostic claim, verify at least three independent evidence sources. If not available, flag the claim as provisional.

**T1-P2-03 · Baseline Rigor**

Addresses: FM-9 (value tracking)
Purpose: Baselines should be frozen before intervention design. Re-derived baselines correlate with over-attribution of success.
Activation: During financial baseline (D07).
Priors: Baselines re-derived post-hoc inflate outcome attribution by 30-50%.
Agent guidance: Lock baseline in structured form at end of Phase 2. Subsequent updates to baseline data are flagged as potential attribution risk.

**T1-P2-04 · Cohort Comparison Discipline**

Addresses: FM-1 (use case), FM-8 (pressure-testing)
Purpose: Benchmarks require explicit peer cohort definition. Without cohort definition, gap analysis is misleading.
Activation: During benchmark (D10).
Priors: Benchmarks without explicit cohort selection produce misleading gap analysis 45% of the time.
Agent guidance: For every benchmark, require the cohort to be named (6 composite peers, specific industry/size/geography characteristics). Single-number benchmarks without cohort context get flagged.

**T1-P2-05 · Root Cause Depth**

Addresses: FM-5 (wrong solution)
Purpose: RCA must reach causal structure, not symptom listing. Surface-level causes correlate with surface-level interventions that fail.
Activation: During RCA (D09).
Priors: Programs that stop at symptom-level RCA show 2x higher Phase 4 rework than programs that reach causal structure.
Agent guidance: For each symptom identified, prompt "why does this happen?" until causal structure surfaces. Use 5-whys methodology with structured capture.

### Phase 3 · Decision & Design (5 patterns)

**T1-P3-01 · Three-Option Framing**

Addresses: FM-5 (wrong architecture), FM-7 (operating model)
Purpose: Binary framings (do X or don't) are structurally deficient. Every major decision requires three options minimum.
Activation: During any Phase 3 decision deliverable (D15, D16, D17).
Priors: Decisions presented as binary have 30% higher reversal rate than three-option framings.
Agent guidance: Any decision presented with fewer than three options is rejected. The third option is often "defer / do nothing for 6 months" which is legitimate.

**T1-P3-02 · Sequencing Consideration**

Addresses: FM-5 (wrong architecture), FM-6 (cost)
Purpose: Parallel-track vs. sequential is the most undervalued decision in Phase 3 and typically determines 20-30% of outcome timing.
Activation: During roadmap (D12) and intervention portfolio (D15).
Priors: Parallel-track execution has 73% success rate vs 41% sequential when portfolios compound leverage. Sequential preferred when dependencies are hard or risk is high.
Agent guidance: For every multi-intervention portfolio, explicitly analyze parallel vs. sequential with trade-offs visible.

**T1-P3-03 · Risk Framing**

Addresses: FM-6 (bad ROI), FM-10 (visibility)
Purpose: Every decision memo names 2-3 risks that most threaten the recommendation's success. Decisions without named risks have 50% higher board-level revision rate.
Activation: During decision memo (D17) and risk register (D18).
Priors: Decisions with 2-3 explicitly-named risks and mitigations show 2x lower board revision rates.
Agent guidance: No decision memo advances without named risks. Generic risk language ("execution risk") flagged for specificity.

**T1-P3-04 · Reversibility Analysis**

Addresses: FM-5 (wrong architecture)
Purpose: Every decision distinguishes reversible from irreversible commitments. Treating them the same is the most common Phase 3 error.
Activation: During solution architecture alignment (D13/D14) and decision memo (D17).
Priors: Programs that don't distinguish reversibility in Phase 3 show 1.8x higher Phase 4 rework.
Agent guidance: For each option, explicitly name reversibility profile — reversible, partially reversible, or irreversible commitment point.

**T1-P3-05 · Business Case Rigor**

Addresses: FM-6 (ROI)
Purpose: Business cases require NPV, sensitivity, benchmarks, risk-adjusted return. Without these, projections don't survive CFO scrutiny.
Activation: During business case (D16).
Priors: Business cases with seven-component rigor (NPV, sensitivity low/base/high, benchmarks, risk-adjusted return, counterfactual, assumptions, confidence intervals) survive scrutiny 80%+ of the time.
Agent guidance: Business case deliverable enforces seven-component structure at field level. Missing components block save.

### Phase 4 · Execution & Delivery (4 patterns)

**T1-P4-01 · Milestone Fidelity**

Addresses: FM-6 (cost), FM-10 (drift)
Purpose: Milestones need named owners and specific dates, not ranges.
Activation: During delivery plan (D19).
Priors: Milestones with date ranges slip 2x more often than specific-date milestones.
Agent guidance: Reject milestones expressed as ranges. Require single target date with explicit confidence.

**T1-P4-02 · Dependency Surfacing**

Addresses: FM-10 (drift)
Purpose: Execution plans undersurface external dependencies. Programs that stall in Phase 4 have undersurfaced external dependencies in 60% of cases.
Activation: During delivery plan (D19).
Priors: Programs with explicit external dependency analysis show 40% lower Phase 4 stall rates.
Agent guidance: Prompt for each milestone: "what dependencies outside the program control are required for this?" Flag if user can't name any.

**T1-P4-03 · Cadence Rigor**

Addresses: FM-10 (drift)
Purpose: Weekly cadence outperforms bi-weekly for programs under 6 months. Cadence slippage is the leading predictor of outcome miss.
Activation: During delivery plan (D19) and sprint artifacts (D20).
Priors: Programs with weekly cadence for <6mo duration show 35% better outcome hit rates than bi-weekly.
Agent guidance: Default cadence recommendation based on duration. Slippage flagged as pressure on Tower.

**T1-P4-04 · Sponsor Re-engagement**

Addresses: FM-3 (sponsor), FM-10 (drift)
Purpose: Phase 4 is where executive attention wanders. Programs that re-engage sponsor every 6 weeks show higher outcome hit rates.
Activation: Throughout Phase 4.
Priors: Sponsor re-engagement cadence slippage correlates with 25%+ higher outcome miss.
Agent guidance: Auto-generate sponsor re-engagement prompts every 6 weeks. Slippage surfaces as Tower pressure.

### Phase 5 · Outcome & Attestation (3 patterns)

**T1-P5-01 · Attribution Rigor**

Addresses: FM-9 (value tracking)
Purpose: Counterfactual definition matters more than measurement. Pre-registered counterfactuals produce defensible claims; post-hoc ones don't.
Activation: During outcome measurement plan (D24) and attestation (D25).
Priors: Programs with pre-registered counterfactuals have 85%+ CFO-acceptance rate. Post-hoc counterfactuals have <50%.
Agent guidance: Counterfactual methodology declared at Phase 3 is locked. Changes to counterfactual in Phase 5 flagged as integrity risk.

**T1-P5-02 · Dual-Ledger Reconciliation**

Addresses: FM-9 (value tracking)
Purpose: AbarVa outcome ledger reconciled against tenant finance ledger. Programs that reconcile survive CFO scrutiny.
Activation: During attestation (D25/D27).
Priors: Outcome claims that reconcile against finance ledger achieve 90%+ attestation rate. Non-reconciled claims achieve <40%.
Agent guidance: Reconciliation is a Phase 5 deliverable. Variance analysis surfaces where gaps exist.

**T1-P5-03 · Learning Extraction**

Addresses: FM-12 (no learning)
Purpose: Every completed program should produce at least one pattern-library-worthy observation. Programs that don't extract learnings fail to compound.
Activation: During attestation (D25).
Priors: Completed programs that extract 2-3 structured observations contribute materially to pattern library maturation.
Agent guidance: At Phase 5, prompt: "what did this program teach us that would improve the pattern library?" Structured capture for curator review.

---

## Section 4 · Tier 2 capability patterns — the list

Ten Tier 2 patterns. Ordered by priority for demo and seed.

**T2-01 · Solution Architecture Alignment** [P0 demo-critical]

Addresses: FM-5, FM-7
Activation: Phase 3 for technology programs.
Priors: Three-option framing mandatory. Seven-dimension analysis (business fit, technical risk, organizational fit, vendor dependency, cost profile, time to value, reversibility). Pattern-backed failure mode analysis per option. Operating model implications tied to each option.
Workshop-mode support: pauses Phase 3 for facilitated alignment.
Priority: P0 — without this, tech programs can't be demonstrated credibly.

**T2-02 · Estimation — AI-Led PDLC Full Stack** [P0 demo-critical]

Addresses: FM-6, FM-7
Activation: Phase 1 rough estimation, Phase 3 tight estimation.
Priors: Reference productivity (engineer-weeks per function-point-equivalent), AI-leverage factors by maturity, organizational drag factors by review type, sequencing intelligence for parallelism.
Output: estimates with confidence intervals (low/base/high), explicit assumption log, benchmark comparables.
Priority: P0 — demonstrates estimation rigor.

**T2-03 · Estimation — AI-Led PDLC Data Platforms** [P0 demo-critical]

Addresses: FM-6, FM-7
Activation: Phase 1 and Phase 3 for data platform programs.
Priors: Data engineer productivity, AI-code-gen effectiveness in SQL/data pipelines, data quality drag factors, integration complexity factors.
Priority: P0 — demand forecasting program (Apex) relies on this.

**T2-04 · Operating Model Selection** [P0 demo-critical]

Addresses: FM-7
Activation: Phase 3 for every program.
Priors: Five operating model options (fully in-house, in-house with augmentation, vendor-led with oversight, platform-with-SLA, fully outsourced). Fit criteria against tenant AI maturity. Accountability and governance mapping per option.
Priority: P0 — demonstrates consulting-partner-depth thinking.

**T2-05 · Vendor Evaluation Framework** [P1 seed-critical]

Addresses: FM-11
Activation: Programs involving vendor selection.
Priors: Weighted capability matrix, performance on historical comparable engagements, cultural fit, financial stability, partnership alignment.
RFP generation capability and negotiation playbook.
Priority: P1 — required when vendor-optimization workflow (File 06) is active.

**T2-06 · Estimation — AI-Led PDLC ERP** [P1 seed-critical]

Activation: ERP programs.
Priority: P1 — not in demo scope but common Fortune 500 use case.

**T2-07 · Estimation — AI-Led PDLC Digital** [P1 seed-critical]

Activation: Digital programs.
Priority: P1 — common use case, not demo-critical.

**T2-08 · Build-vs-Buy Decision Framework** [P1 seed-critical]

Addresses: FM-5, FM-11
Activation: Phase 3 when the choice arises.
Priors: Four-factor analysis (strategic differentiation, internal capability, time horizon, cost/risk profile). Pattern-backed guidance on when each is typically appropriate.
Priority: P1 — adjacent to vendor selection.

**T2-09 · Change Management Playbook** [P1 seed-critical]

Addresses: FM-3
Activation: Phase 1 change readiness, throughout Phase 4.
Priors: Affected role analysis, training program design, comms plan, sentiment measurement, resistance mitigation.
Priority: P1 — supports sponsor commitment mechanism.

**T2-10 · Risk Register Taxonomy** [P2 Series A]

Addresses: FM-6, FM-10
Activation: Phase 3 and throughout Phase 4.
Priors: Risk categories, severity tiering, mitigation patterns, trigger monitoring.
Priority: P2 — enhancement to existing D18.

---

## Section 5 · Tier 3 use-case patterns — retrofit and expansion

### Existing 13 patterns to retrofit

The 13 existing patterns need to be restructured from long-form documents into focused retrievable format matching the pattern metadata schema (Section 7). Retrofit is not re-authoring — it's restructuring existing content into the target format.

1. **Analytics Modernization** (Cross-sector) — retrofit [P1]
2. **AI-Led PDLC** (Cross-sector) — retrofit [P0; interacts with Tier 2 estimation patterns]
3. **AI Governance Operating Model** (Cross-sector) — retrofit [P0; required for Tower pressure on governance gap]
4. **Vendor Sprawl & AI Tool Rationalization** (Cross-sector) — retrofit [P0; required for Tower ambient pressure]
5. **AI Use Case Portfolio Management** (Cross-sector) — retrofit [P1]
6. **Ambient Clinical Value Chain Automation** (Healthcare) — retrofit [P0; Meridian demo anchor]
7. **Prior Authorization Automation** (Healthcare) — retrofit [P2]
8. **Owned Brand Margin Recovery** (Retail) — retrofit [P0; Apex Morrison anchor]
9. **Retail Demand Forecasting Modernization** (Retail) — retrofit [P0; Apex second program]
10. **Fraud Detection AI** (FinServ) — retrofit [P1]
11. **Regulatory Reporting Automation** (FinServ) — retrofit [P2]
12. **Grid Optimization AI** (Energy) — retrofit [P2]
13. **Predictive Maintenance** (Energy) — retrofit [P2]

### Gaps in vertical coverage

Missing use-case patterns that should exist for comprehensive coverage. New authoring work, priority-ordered.

14. **IT AMS Vendor Optimization** (Cross-sector) — [P1; specifically supports vendor-optimization workflow]
15. **Data Platform Rationalization** (Cross-sector) — [P0; supports Dara persona walk]
16. **Customer Service AI Deployment** (Cross-sector) — [P2]
17. **Supply Chain Visibility Platform** (Cross-sector/Retail) — [P2]
18. **Clinical Documentation Improvement** (Healthcare) — [P2]
19. **Claims Processing Automation** (Healthcare/Insurance) — [P2]
20. **AML/KYC Automation** (FinServ) — [P2]
21. **Treasury Operations AI** (FinServ) — [P3]
22. **Energy Trading Analytics** (Energy) — [P2]
23. **Field Operations Optimization** (Energy/Manufacturing) — [P3]

### Priority summary

Demo-critical Tier 3 retrofits: 5 patterns (AI-Led PDLC, AI Governance, Vendor Sprawl, Ambient Clinical, Owned Brand Margin Recovery, Retail Demand Forecasting, Data Platform Rationalization gap).

Wait — that's 7 if we count the gap. Let me be clearer: 6 retrofits + 1 new pattern = 7 total Tier 3 patterns required at full structured fidelity for demo. The other 7 existing patterns are retrofitted at lighter fidelity for seed. New use-case patterns beyond these are Series A scope.

---

## Section 6 · Pattern assembly methodology

The mechanism by which patterns are produced. This is a product capability, not a one-time authoring exercise. Over time, the assembly pipeline produces new patterns at a rate no consulting firm can match.

### Step 1 — Candidate surfacing

A pattern begins as a candidate. Sources of candidates:

- Anand or maestro proposes based on observed gap or opportunity
- Crawler persona walk surfaces a scenario where pattern-shaped guidance would help
- Completed program's Phase 5 learning extraction identifies a pattern-library-worthy observation
- Cross-program analysis detects a recurring theme

Candidates are logged with rationale and priority.

### Step 2 — LLM-driven synthesis

For approved candidates, the assembly pipeline runs a structured synthesis process:

**Prompt chain:**
1. Generate initial hypothesis of what's true about this pattern from broad sources (Claude Opus or GPT-5-class)
2. Cite sources that inform each claim (structured citation format)
3. Structure the hypothesis into the pattern metadata schema (Section 7)
4. Identify gaps where evidence is thin
5. Flag claims requiring validation

**Output:** a candidate pattern document with structured data, provenance chain, and identified validation needs.

**Model selection:** frontier models for synthesis. Local SLMs (once available) for exploratory iteration.

### Step 3 — Client-data validation

The candidate pattern is tested against sample client data — typically the four composite tenants (Meridian, Apex, First Capital, Keystone) plus any real engagement data if available.

**Validation questions:**
- Does the pattern's guidance produce sensible recommendations when applied to this tenant's profile?
- Where does the pattern break or produce generic output?
- Are the priors accurate against actual tenant characteristics?
- What tenant-specific amplifiers are missing?

**Output:** validated or revised pattern with tenant-specificity notes.

### Step 4 — Manual review and curation

A human curator (Anand initially, eventually a pattern curation role) reviews the candidate for:

- Credibility of claims
- Appropriate scoping
- Avoidance of overclaim
- Integrity layer compliance (composite disclaimers, authorship transparency)

**Output:** pattern ready for production or sent back for revision.

### Step 5 — Production deployment

The pattern enters the live knowledge layer — registry, graph, vector store, Postgres (File 03 architecture). Available for retrieval on agent turns.

Version 1 of the pattern is tagged with provenance (synthesis sources, validation tenants, curation approval).

### Step 6 — Feedback capture

Once live, user interactions with the pattern are captured:

- Pushback on specific claims ("this prior doesn't fit my situation")
- Acceptance of recommendations (implicit validation)
- Modifications to pattern-suggested content (refinement signal)
- Outcome data from programs that used the pattern (most valuable feedback)

Feedback flows to the pattern's refinement queue.

### Step 7 — Periodic refinement

The curator reviews accumulated feedback and produces Version N+1 of the pattern. Refinements include:

- Sharpening priors based on accumulated evidence
- Adding contextual amplifiers observed in practice
- Removing claims that didn't hold up
- Adding new failure modes observed

Version N+1 enters production with updated provenance chain.

### Step 8 — At-scale maturation

Over time, patterns with high-volume use accumulate substantial structured interaction data. This enables:

- Automated refinement (the pattern's priors update based on aggregated user responses)
- SLM training (specialized small model trained on the pattern's domain)
- Cross-pattern synthesis (emergent patterns discovered from overlaps)

This is the flywheel. Patterns mature; product intelligence compounds.

### Assembly pipeline as product capability

The eight steps above are not a one-time workflow. They're a pipeline that runs continuously as new patterns emerge and existing patterns mature. Infrastructure for this pipeline:

- Candidate tracking system
- Synthesis prompt library and execution harness
- Validation harness against composite tenants
- Curation workflow
- Deployment pipeline to knowledge layer
- Feedback capture and routing
- Refinement workflow
- Versioning and provenance tracking

This infrastructure is Codex's build (File 03 knowledge layer backlog specifies implementation).

---

## Section 7 · Pattern metadata schema

Every pattern, regardless of tier, carries structured metadata. This is what makes patterns retrievable and composable.

### Identity
- `pattern_id` — unique identifier
- `tier` — 1, 2, or 3
- `name` — display name
- `slug` — URL-safe identifier
- `version` — semantic version
- `authored_date`, `last_updated`
- `provenance` — synthesis sources, validation tenants, curation approvals

### Classification
- `phase` (for Tier 1) — which phase this craft pattern applies to
- `capability` (for Tier 2) — which capability this covers
- `vertical` (for Tier 3) — Healthcare, Retail, FinServ, Energy, Cross-sector
- `use_case` (for Tier 3) — specific problem type
- `workflow_type` — default five-phase, vendor-selection-procedural, crisis-response, or named alternative

### Applicability
- `activates_at` — what triggers retrieval (phase, deliverable type, decision type)
- `tenant_profile_filters` — characteristics that make this pattern especially relevant
- `related_patterns` — bidirectional edges (RELATED_TO)
- `prerequisite_patterns` — patterns that should activate first
- `sourced_from` — patterns that inform this one

### Priors (the retrievable intelligence)
- `diagnostic_priors` — structured data on causes and their frequencies
- `decision_priors` — structured data on success rates of common approaches
- `timeline_priors` — duration distributions by scale and complexity
- `vendor_priors` — vendor-specific intelligence (strengths, weaknesses, pricing patterns)
- `stakeholder_priors` — typical stakeholder positions and alignment friction
- `failure_mode_priors` — failure modes with frequencies and predictors
- `contextual_amplifiers` — tenant-specific factors that modify priors

### Interventions (Tier 3 specifically)
- `intervention_library` — catalog of interventions with evidence, success rates, effort, typical sequencing
- `anti_patterns` — what commonly fails with frequency data

### Agent guidance
- `prompt_seeds` — templates for agent prompts at specific moments
- `pressure_test_questions` — questions the agent should ask to stress-test user inputs
- `handoff_conditions` — when this pattern should route to another agent or workflow

### Execution contract
- `workflow_routing_rule` — if pattern matches, route to which workflow
- `phase_deliverables` — specific deliverables this pattern shapes
- `completion_criteria` — how to know the pattern's value has been realized

### Feedback and maturation
- `interaction_log` — captured user interactions with this pattern
- `refinement_queue` — pending refinements from feedback
- `outcome_data` — outcomes from programs that used this pattern (as they accumulate)
- `slm_candidate` — boolean flag when volume warrants SLM training

This schema is the contract. Every pattern carries it. Retrieval queries work against this structure. The registry enforces it at write time.

---

## Section 8 · Retrieval and composition at runtime

Detailed architecture in File 03. Summary here from the pattern library perspective.

When an agent generates a response, the retrieval step runs:

1. **Context read** — current program, phase, tenant, user, conversation state
2. **Tier 1 match** — retrieve all craft patterns active for current phase and activity (typically 3-5 patterns)
3. **Tier 2 match** — retrieve capability patterns relevant to current decision or deliverable (typically 1-2 patterns)
4. **Tier 3 match** — retrieve the use-case pattern for the program (typically 1 pattern)
5. **Tenant data pull** — tenant-specific data and history
6. **Assembly** — patterns and data compose into context window
7. **Generation** — LLM generates response over composed context
8. **Citation** — response includes visible citations to patterns used
9. **Feedback capture** — user response to the agent output is logged as interaction data

The composition step is where the moat shows. Default Claude has only step 7. AbarVa has all nine steps.

---

## Section 9 · Priority sequencing

### P0 — Demo-critical (must ship before demo)

Tier 1 craft patterns: all 22. These enhance every program; demo programs use them throughout.
Tier 2 capability patterns: T2-01 Solution Architecture Alignment, T2-02 Estimation Full Stack, T2-03 Estimation Data Platforms, T2-04 Operating Model Selection.
Tier 3 retrofits: Owned Brand Margin Recovery, Retail Demand Forecasting, Ambient Clinical Value Chain, AI Governance Operating Model, Vendor Sprawl & AI Tool Rationalization, AI-Led PDLC.
Tier 3 new: Data Platform Rationalization (for Dara persona).

Total demo-critical: 22 + 4 + 7 = 33 patterns at full structured fidelity.

### P1 — Seed-critical (ship in next 60 days post-demo)

Tier 2: T2-05 Vendor Evaluation, T2-06 Estimation ERP, T2-07 Estimation Digital, T2-08 Build-vs-Buy, T2-09 Change Management.
Tier 3 retrofits: Analytics Modernization, AI Use Case Portfolio, Fraud Detection AI.
Tier 3 new: IT AMS Vendor Optimization.

Total P1: 5 + 3 + 1 = 9 patterns.

### P2 — Series A (next 6 months)

Tier 2: T2-10 Risk Register Taxonomy.
Tier 3 retrofits: Regulatory Reporting, Grid Optimization, Predictive Maintenance, Prior Authorization.
Tier 3 new: Customer Service AI, Supply Chain Visibility, Clinical Documentation, Claims Processing, AML/KYC, Energy Trading.

Total P2: 1 + 4 + 6 = 11 patterns.

### P3 — Post-Series A

Additional vertical coverage as commercial demand surfaces.
Treasury Operations, Field Operations, others.

---

## Section 10 · Current state and gaps

**Tier 1 craft patterns:** None authored at the specified structured format. Status: **NEW-WORK** for all 22.

**Tier 2 capability patterns:** None authored. Status: **NEW-WORK** for all 10.

**Tier 3 use-case patterns:** 13 existing as long-form documents. Need retrofit to structured format. Status: **PARTIAL** — content exists, structure doesn't match schema.

**Pattern assembly methodology:** Not implemented as a pipeline. Patterns were manually authored. Status: **NEW-WORK**.

**Retrieval on every agent turn:** Partial per File 03. Status: **PARTIAL**.

**Feedback capture and refinement:** Not implemented. Status: **MISSING**.

**Pattern metadata schema:** Not fully implemented. Current patterns have partial metadata. Status: **PARTIAL**.

---

## Section 11 · Acceptance criteria

**For Tier 1:**
- All 22 patterns authored in structured format
- Retrieval pipeline activates appropriate craft patterns on every agent turn based on phase
- Patterns visible in agent responses via citation
- Field-level enforcement of pattern requirements (three-option framing, structured commitment fields, etc.)

**For Tier 2:**
- Four P0 capability patterns authored and retrievable
- Capability deliverables (Solution Architecture Alignment, Estimation, Operating Model) exist in Phase 3 workflow
- Pattern-backed priors populate decision-support content

**For Tier 3:**
- Seven P0 patterns in structured format
- Agent responses cite Tier 3 patterns by name
- Use-case-specific vendor intelligence, stakeholder priors, failure modes visible

**For assembly methodology:**
- Pipeline exists to produce new patterns through structured process
- Provenance chain persists
- Validation against composite tenants completes before production deployment

**For the moat test:**
- Crawler comparison between default Claude and AbarVa shows substantive, visible difference in response quality
- Five personas independently report pattern intelligence as evident in responses

---

## Section 12 · Execution discipline

**Ownership split:**
- Claude Code: pattern authoring (content production for all tiers), Tier 1 craft pattern integration into deliverable workflows
- Codex: pattern infrastructure (registry, graph, vector, Postgres), retrieval pipeline, assembly pipeline, feedback capture

**Commit discipline:** Every pattern-related PR references the patterns it touches by ID.

**Review gate:** Each pattern undergoes curation review before merging to production knowledge layer. Initial curator: Anand. Curation checklist applied.

**Staging:** Patterns merge to staging knowledge layer first, exercised through crawler persona walks, then promoted to production.

---

## Section 13 · Pre-decided items

- Tier 1 count target: 22 patterns (can expand by exception)
- Tier 2 count target: 10 patterns
- Pattern file format: structured markdown with YAML front-matter carrying the metadata schema
- Pattern storage: `intelligence/patterns/{tier}/{slug}.md` in repo, mirrored to knowledge layer on deploy
- Version numbering: semantic (MAJOR.MINOR.PATCH)
- Provenance: every claim cites source; every pattern tracks validation tenants
- Retrieval on every agent turn: non-negotiable
- Pattern-carries-execution-contract: non-negotiable

---

## Section 14 · One-line handoff

> Three-tier pattern library: 22 Tier 1 craft, 10 Tier 2 capability, 13 retrofitted + 10 new Tier 3 use-case. Pattern assembly methodology as product capability. Retrieval on every agent turn. P0 demo-critical priorities specified in Section 9. Assembly pipeline infrastructure in File 03. Apply autonomy charter; pre-decided items in Section 13.

---

*End of File 02 · Pattern Library Architecture Backlog.*
