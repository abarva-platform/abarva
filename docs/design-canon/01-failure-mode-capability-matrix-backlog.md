# File 01 · Failure-Mode-to-Capability Matrix Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Claude Code (implementation), Codex (infrastructure and validation)
**Purpose:** The product's north star. Twelve enterprise-AI-program failure modes, each mapped to the specific AbarVa mechanism that prevents or mitigates it. Every feature in every other backlog file references this one. If a feature doesn't address a failure mode, it doesn't belong in the product.

**Status convention used throughout:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`. Confidence level noted where claims are inferred rather than verified.

**Applies:** Agent Autonomy Charter. Decide and move on Tier 1/2, flag and proceed on Tier 3, stop only on Tier 4. Pre-decided items in Section 14 — don't re-ask.

---

## Section 1 · How to use this file

This file is the product requirements document for AbarVa. Every capability described here has a corresponding implementation surface. When in doubt about whether a feature belongs or how it should behave, the test is: does this capability credibly prevent or mitigate one of the twelve failure modes? If yes, it belongs and should be built to the specification below. If no, it should be deferred or removed.

The matrix has four uses:

**Product development.** Claude Code and Codex execute against the gap items in each failure-mode section. Every PR should reference the failure mode(s) it addresses.

**Demo and testing.** The crawler personas test the product against these twelve modes. A persona walk is a demonstration of failure-mode prevention. Gaps surface as failures on specific modes.

**Pitch and external narrative.** The twelve modes are the pitch structure (separate File 07). This file is the product spec; File 07 is the communication strategy.

**Pattern library justification.** Every pattern in the library (Tier 1 craft, Tier 2 capability, Tier 3 use-case) exists because it addresses one or more failure modes. The mapping is bidirectional — failure modes reference the patterns that mitigate them, and patterns reference the failure modes they address.

---

## Section 2 · The twelve failure modes, summary

| # | Failure mode | Primary AbarVa mechanism | Zone(s) | Status |
|---|---|---|---|---|
| 1 | Wrong use case selection | Maestro Intake with pattern-library pressure-testing | Programs (Zone 3) | PARTIAL |
| 2 | Data readiness gap | Phase 1 data readiness assessment against pattern requirements | Programs (Zone 3) | MISSING |
| 3 | Insufficient C-suite & change leadership | Sponsor commitment verification (Tier 1 craft pattern), change readiness as Phase 1 deliverable | Programs (Zone 3) | MISSING |
| 4 | Cross-functional misalignment on problem definition | Stakeholder completeness pattern, Intake Synthesis tension capture | Programs (Zone 3) | PARTIAL |
| 5 | Wrong solution architecture | Solution Architecture Alignment capability pattern (Tier 2) | Programs (Zone 3) | MISSING |
| 6 | Bad ROI or uncontrolled cost | Estimation capability patterns (Tier 2) + business case craft pattern | Programs (Zone 3) + Tower (Zone 1) | PARTIAL |
| 7 | Wrong human-agent operating model | Operating Model Selection capability pattern (Tier 2) | Programs (Zone 3) | MISSING |
| 8 | No pattern-based pressure-testing | Pattern library + retrieval-on-every-turn architecture | All zones | PARTIAL |
| 9 | No ongoing value tracking | Control Tower + Phase 5 attestation | Tower (Zone 1) + Programs (Zone 3) | PARTIAL |
| 10 | No visibility-driven action on drift | Atlas proactive surfacing + pressure cards with editorial analysis | Tower (Zone 1) | PARTIAL |
| 11 | Wrong vendor or partner selection | Vendor Evaluation Framework capability pattern (Tier 2) + use-case vendor intelligence | Programs (Zone 3) + Tower (Zone 1) | MISSING |
| 12 | No learning capture to compound | Pattern library feedback loop + cross-tenant emergent intelligence | Intelligence (Zone 4) + all zones | MISSING |

Aggregate: twelve modes, three PARTIAL, nine MISSING or NEW-WORK. Current product addresses several modes structurally but few are built to the depth that would credibly prevent the failure. This file defines what "built to depth" means per mode.

---

## Section 3 · Failure Mode 1 · Wrong use case selection

### 3.1 · The failure, concretely

Enterprise AI programs fail most often because the initial use case was pursued for novelty, organizational politics, or pattern-matching to what other companies were doing — rather than because it was the right problem to solve at the right time for the right reasons. Symptoms: programs that can't articulate their measurable outcome beyond "improve X by being more AI-driven," programs that duplicate efforts already underway elsewhere in the organization, programs whose success metrics get revised multiple times because the real goal was never clear.

**Industry evidence:** Gartner consistently cites use case selection as the #1 or #2 reason for AI project failure. MIT Sloan's research on AI adoption shows that organizations with formal use case evaluation processes outperform ad-hoc processes by 2-3x on program success rate.

### 3.2 · AbarVa's mechanism

The Maestro Intake Interface is the front door of the product, and its primary job is not to accept any program the user proposes but to pressure-test whether this is the right program to run. The pressure-test uses three inputs:

- **Pattern-library match.** Does the proposed program match a known pattern with measured outcome distributions? If yes, the intake surfaces what comparable programs achieved, what they failed at, and what the typical gotchas are. If no, the intake flags the program as high-uncertainty and requires additional scoping before proceeding.

- **Tenant context match.** Does the proposed program fit this tenant's current capability, data readiness, and organizational readiness? The intake queries the tenant's existing program portfolio, pattern library history, and explicit readiness signals from prior engagements.

- **Adjacent use case exploration.** The intake surfaces adjacent problems that commonly accompany the one proposed — is this really a standalone program, or is it the visible tip of a bigger problem that should be scoped together? This prevents the "we thought we were doing X but we were actually doing Y and Z" post-mortem.

The intake produces three possible outcomes: GO (pattern match strong, tenant ready, scope clear — proceed to Phase 1), REFINE (uncertainty present, additional scoping session needed before commitment), or REDIRECT (the real problem is adjacent to the stated problem; here's what the reframe should be).

### 3.3 · Required product surfaces and components

**Maestro Intake Interface (Zone 3, Programs).** Conversational intake flow with guided-choice prompts. Integrates the three pressure-test inputs above. Produces the GO/REFINE/REDIRECT outcome visibly, with rationale.

**Pattern-library routing logic.** The intake queries the pattern registry on every input; matches the problem description semantically (vector search) and structurally (graph traversal). Returns the top three pattern matches with confidence scores.

**Tenant readiness dashboard fragment.** Surfaces in the intake flow, showing the tenant's current program portfolio, data readiness posture, and capability history. Not a separate page — an inline contextual element during intake.

**Adjacent use case suggestion engine.** Reads the pattern's `RELATED_TO` edges and tenant's current program portfolio to surface "have you considered this related problem?" prompts during intake.

### 3.4 · Current state and gaps

**Current state (inferred, medium-high confidence):** The Maestro Intake Interface exists as a concept and partial implementation. Based on PR history, what exists is a conversational entry point that accepts a program description and routes it to pattern matching. What's partial: the three-outcome pressure-test structure (GO/REFINE/REDIRECT) is not explicit. The tenant readiness integration is minimal. The adjacent use case exploration is absent. Status: **PARTIAL**.

**Gaps with priority:**

- [P0 · demo-critical] Explicit three-outcome pressure-test (GO/REFINE/REDIRECT) with visible rationale
- [P0 · demo-critical] Pattern-library confidence scoring surfaced in intake
- [P1 · seed-critical] Tenant readiness inline integration
- [P1 · seed-critical] Adjacent use case suggestion engine
- [P2 · Series A] Intake conversation state persisted across sessions (user pauses intake, returns, continues)

### 3.5 · Acceptance criteria

- A user entering a program idea receives a GO/REFINE/REDIRECT outcome with explicit rationale
- The rationale references the specific pattern(s) matched or the specific gap(s) identified
- Confidence scores are visible to the user
- Tenant-specific context (portfolio, readiness) is integrated, not decorative
- At least one adjacent use case is surfaced if the pattern library indicates adjacency
- The intake flow completes in under 15 minutes of wall time for a typical program

### 3.6 · Crawler persona test

Marcus T. (Apex CFO) proposes "improve owned-brand margin by using AI." Expected system response: pattern match to Owned Brand Margin Recovery, GO outcome, with explicit reference to the pattern's diagnostic priors. Adjacent suggestion: "programs of this type commonly surface supplier concentration issues that become their own workstream — want to scope that alongside?" Marcus's persona test passes if the intake demonstrates pressure-testing rather than order-taking.

---

## Section 4 · Failure Mode 2 · Data readiness gap

### 4.1 · The failure, concretely

AI programs are launched with an assumed data substrate that doesn't exist or isn't in usable form. The gap surfaces weeks or months into the program, when Phase 2 diagnosis or Phase 3 design discovers the foundational data isn't there, isn't clean, isn't integrated, or isn't accessible. Programs then either stall while data work catches up (delaying outcomes), or proceed with inadequate data (producing unreliable results), or get scope-cut to match available data (sacrificing original intent).

**Industry evidence:** BCG and McKinsey studies consistently cite data readiness as a top-3 failure driver. The specific finding: ~70% of enterprise AI projects discover material data gaps after program commitment rather than before.

### 4.2 · AbarVa's mechanism

Phase 1 intake includes an explicit **data readiness assessment** against the pattern's known requirements. Every pattern in the library declares what data signals are required to execute the pattern at quality, and at what quality level. The intake surfaces this requirement specifically to the user: "programs of this type require data signal X at quality Y; here's what we can verify about your tenant's current posture; here's the gap."

The assessment produces three categories:

- **Available and sufficient** — the tenant has the required data at the required quality level. Program proceeds without data-work precursor.
- **Available but needs preparation** — the data exists but requires cleaning, integration, or transformation. Scoped as a Phase 1 sub-workstream with its own timeline and ownership.
- **Gap** — the data does not exist or is fundamentally insufficient. Program's scope requires revision or a data-first precursor program.

The assessment is not a one-time gate — it updates as Phase 2 diagnosis surfaces actual data conditions. But the Phase 1 assessment forces the conversation to happen before commitment rather than after.

### 4.3 · Required product surfaces and components

**Data readiness assessment component in Phase 1 flow.** Triggered by the pattern match in intake. Pulls the pattern's declared data requirements. Surfaces them as a structured checklist with tenant-specific verification status.

**Tenant data profile registry.** A structured record per tenant of known data systems, their integration status, and observed quality signals. Populated from: prior program experience with this tenant, connector health (from Admin surface), explicit readiness declarations.

**Pattern data requirements metadata.** Every pattern in the library declares its data requirements in structured form — signal type, minimum quality threshold, typical source systems, common preparation needs. This is new metadata added to the pattern library (File 02).

**Gap-to-action mapping.** When a gap is identified, the product recommends the action: "propose data preparation sub-workstream" or "propose scope revision" or "propose precursor data program." Each recommendation has a template that flows into Phase 1 deliverables.

### 4.4 · Current state and gaps

**Current state (inferred, high confidence):** Missing. No data readiness assessment exists in the current product. Pattern metadata does not include data requirements. Tenant data profile is not a structured registry. Status: **MISSING**.

**Gaps with priority:**

- [P0 · demo-critical] Data readiness assessment component in Phase 1 flow
- [P0 · demo-critical] Pattern data requirements metadata for the five priority Tier 3 patterns
- [P1 · seed-critical] Tenant data profile registry (can start with manual population)
- [P1 · seed-critical] Gap-to-action mapping templates
- [P2 · Series A] Automated data profile population from connector health signals
- [P2 · Series A] Data readiness re-assessment at Phase 2 diagnosis with drift flagging

### 4.5 · Acceptance criteria

- Every Phase 1 intake includes an explicit data readiness assessment
- The assessment references the specific pattern's data requirements
- Gaps are categorized (available / preparation needed / fundamental gap)
- Each gap maps to a specific recommended action
- The assessment result is persisted and surfaces again at Phase 2 for re-verification
- Test: Marcus T. proposes Morrison. System surfaces "this program requires SKU-level margin data at monthly granularity going back 24 months. Your tenant has this at 18-month history. Recommended: proceed with 18-month baseline, expand to 24 months if retrospective data becomes available." — concrete, specific, actionable.

### 4.6 · Crawler persona test

Dr. L (Meridian CMIO) proposes Ambient Clinical Value Chain at Meridian. Expected: system surfaces the pattern's data requirements — ambient conversation capture volume, HCC coding history, documentation denial rates by specialty — and reports Meridian's known posture on each. Gap identification for SDOH / Z-code capture (known to be thin at Meridian). Recommended action: scope Z-code capture as a Phase 2 sub-workstream. Dr. L's persona test passes if the data readiness assessment surfaces specific, credible gaps rather than generic "ensure data quality" guidance.

---

## Section 5 · Failure Mode 3 · Insufficient C-suite & change leadership

### 5.1 · The failure, concretely

Programs proceed with "sponsor is supportive" but without formal sponsor commitment in the form of specific accountability, allocated budget, dedicated time for decision gates, and clear articulation of what the sponsor will personally do when the program hits resistance. When the inevitable organizational resistance emerges — mid-level managers protecting turf, other programs competing for resources, unexpected technical challenges requiring scope or timeline revision — the sponsor either isn't engaged enough to clear the blockage or isn't positioned to do so.

Separately: change management is treated as a Phase 4 or Phase 5 concern when it should be a Phase 1 design consideration. Programs are scoped technically and socialized politically after the fact, rather than designed with organizational readiness as a first-class constraint.

**Industry evidence:** Prosci and McKinsey change management research consistently shows that programs with formal executive sponsorship commitment outperform programs without by 3-5x on successful adoption. The single best predictor of program success is whether the sponsor can name what they will do when the program hits resistance.

### 5.2 · AbarVa's mechanism

Two mechanisms combine.

**Sponsor Commitment Verification (Tier 1 craft pattern).** Phase 1 Charter (D01) includes a structured sponsor commitment section that is not optional. The sponsor must declare, in writing within the product: budget authority and specific ceiling; decision gates they will attend personally; named resistance scenarios and their specific intervention; time allocation commitment. The product refuses to advance Phase 1 without this section populated. This is enforced at the workflow mechanic level — the phase gate check requires it.

**Change Readiness as Phase 1 Deliverable.** A dedicated Phase 1 deliverable (not Phase 4) that assesses organizational readiness for the change the program will require. Assessment covers: affected roles and their sentiment (informed by the stakeholder map from D02), change precedent at this tenant (has this tenant successfully executed similar-magnitude changes recently?), identified resistance pockets, mitigation strategies. This deliverable's output shapes Phase 3 decision-making (some interventions may be down-weighted if change readiness is low for them).

### 5.3 · Required product surfaces and components

**Structured sponsor commitment form in D01.** Fields for budget ceiling, named decision gates with dates, named resistance scenarios and interventions, time allocation. Validated on save — no free-text substitute for required fields.

**Phase gate enforcement.** The Phase 1 → Phase 2 gate check includes sponsor commitment completion. The gate doesn't advance without it. Nexus surfaces this as the user approaches the gate.

**Change Readiness Assessment deliverable (new, insert as D05).** Pattern-driven assessment with structured inputs. Produces a readiness score, risk identification, and mitigation recommendations. Feeds into D18 Risk Register in Phase 3.

**Sponsor re-engagement cadence.** Tier 1 craft pattern: programs re-engage the sponsor every 6 weeks. Product surfaces this — reminders, prompts, session templates. Atlas on Tower surfaces sponsor engagement health as a pressure card when cadence slips.

### 5.4 · Current state and gaps

**Current state (inferred, high confidence):** Missing. D01 Charter exists (shipped by Agent C1) but probably does not include the structured sponsor commitment form with gate enforcement. Change readiness is not a Phase 1 deliverable in the current architecture. Status: **MISSING** (though D01 exists as a partial foundation).

**Gaps with priority:**

- [P0 · demo-critical] Structured sponsor commitment form in D01 with field-level validation
- [P0 · demo-critical] Phase 1 → Phase 2 gate enforcement requires sponsor commitment
- [P1 · seed-critical] Change Readiness Assessment deliverable (D05 insertion)
- [P1 · seed-critical] Sponsor Commitment Verification as Tier 1 craft pattern in library
- [P2 · Series A] Sponsor re-engagement cadence tracking with Atlas surfacing

### 5.5 · Acceptance criteria

- D01 Charter includes structured sponsor commitment section with required fields
- Phase 1 → Phase 2 gate refuses to advance without sponsor commitment populated
- A dedicated change readiness deliverable produces a scored assessment
- Change readiness output feeds Phase 3 decision-making visibly
- Sponsor re-engagement cadence slippage surfaces on Tower as a pressure card

### 5.6 · Crawler persona test

Mike (Fortune 40 CIO persona) starts a new program at his tenant. System prompts him for sponsor commitment. He enters "I'm the sponsor, I support this" in free-text. System rejects — the commitment requires structured fields. He completes the structured form. System proceeds. Test passes if the product forces commitment discipline rather than accepting hand-waving.

---

## Section 6 · Failure Mode 4 · Cross-functional misalignment on problem definition

### 6.1 · The failure, concretely

The CFO thinks the program is about cost reduction. The COO thinks it's about throughput. The CTO thinks it's about platform modernization. The Chief AI Officer thinks it's about responsible AI adoption. All four support the program, all four are nominally aligned, but their underlying definitions of success differ in ways that don't surface until Phase 3 when the decision memo has to satisfy all of them and can't. The program then either fails (no decision can satisfy all definitions), gets revised to satisfy the most politically powerful definition (alienating others), or produces a muddled outcome that satisfies none.

This failure is distinct from "insufficient C-suite support" (Mode 3). The executives *are* supportive. They're just supportive of different things.

**Industry evidence:** Less commonly cited in published research but consistently surfaced in program post-mortems. Organizations with formal cross-functional problem-definition alignment processes show measurably lower Phase 3 revision rates.

### 6.2 · AbarVa's mechanism

Two mechanisms.

**Stakeholder Completeness Pattern (Tier 1 craft).** The stakeholder map (D02) requires tiered mapping — Tier 1 decision-makers, Tier 2 influencers, Tier 3 informed parties — and for each Tier 1 decision-maker, an explicit articulation of their definition of success. Not "CFO supports margin recovery" but "CFO defines success as 180 bps margin recovery measured on a rolling quarterly basis with full counterfactual attribution; CFO will not accept anecdotal attribution." This specificity forces the misalignment to surface at D02 rather than D17.

**Intake Synthesis Tension Capture (D04).** The Phase 1 synthesis deliverable explicitly captures tensions across stakeholder definitions. Not "stakeholders are aligned" but "CFO wants cost-side attribution; COO wants throughput attribution; these are not the same metric and the program must resolve which is primary." The tension is named, not papered over. Resolution mechanism is specified (workshop with all Tier 1 decision-makers, facilitated to consensus on primary metric, alternates as secondary).

### 6.3 · Required product surfaces and components

**Tiered stakeholder map in D02** with per-Tier-1 definition-of-success field. Validated on save.

**Tension capture section in D04.** Required field that cannot be left blank. If no tensions exist, the section explicitly says so and the user confirms. This forces conscious consideration.

**Resolution mechanism templates.** For common tension patterns (cost vs. throughput, speed vs. rigor, automation vs. employment preservation), the product provides facilitation templates — agenda, structured discussion prompts, decision capture format. AbarVa human layer available for facilitation.

**Phase 1 → Phase 2 gate enforcement.** Gate refuses to advance if D04 has un-resolved tensions without named resolution paths.

### 6.4 · Current state and gaps

**Current state (inferred, medium-high confidence):** Partial. D02 Stakeholder Map exists (probably shipped by Agent C1). D04 Intake Synthesis exists. What's partial: the definition-of-success per-stakeholder and the tension-capture discipline are probably not enforced at the field-level validation. Status: **PARTIAL**.

**Gaps with priority:**

- [P0 · demo-critical] Definition-of-success field in D02 per Tier 1 stakeholder
- [P0 · demo-critical] Tension capture field in D04 with explicit resolution path
- [P1 · seed-critical] Resolution mechanism templates for common tensions
- [P1 · seed-critical] Phase 1 → Phase 2 gate enforcement of tension resolution
- [P2 · Series A] Tension detection across program history (if prior programs at this tenant showed this tension, flag proactively)

### 6.5 · Acceptance criteria

- D02 captures per-Tier-1 definition of success as a required structured field
- D04 captures named tensions with resolution paths
- Phase gate enforces tension resolution
- Workshop/facilitation support is available via human-layer booking for unresolved tensions
- Test: a program with three Tier 1 stakeholders having different success definitions cannot advance past Phase 1 without explicit tension resolution

### 6.6 · Crawler persona test

Dr. L (Meridian CMIO) starts Ambient Clinical Value Chain. System prompts for Tier 1 stakeholder definitions. Dr. L enters: CEO wants "demonstrable AI leadership," CMO wants "physician burden reduction," CFO wants "documented ROI." Tension capture: these three definitions require different optimization targets. System surfaces this explicitly. Resolution path: "propose a facilitated workshop with all three, arriving at a primary metric with secondary considerations; AbarVa maestro available to facilitate." Test passes if the product surfaces the tension and proposes resolution rather than accepting the ambiguous alignment.

---

## Section 7 · Failure Mode 5 · Wrong solution architecture

### 7.1 · The failure, concretely

The most expensive failure mode in enterprise tech programs. Multiple viable architectural paths exist for most problems. The team picks one — often based on familiarity, vendor influence, or whoever argues loudest — and doesn't systematically pressure-test alternatives. Six months later, architectural limitations surface (scalability, integration, operability, security) and the program either rebuilds (expensive) or accepts degraded outcomes. The lesson is always the same: more rigor at the architecture decision would have saved the program.

This is specifically where consulting firms earn their highest fees — driving architectural alignment under ambiguity is senior partner work. If AbarVa doesn't address this mode substantively, the product is a workflow tool, not a transformation product.

**Industry evidence:** Every major tech program post-mortem cites architectural decisions as a primary driver of outcomes. The difference between successful and failed programs at this moment is systematic option generation and rigorous pressure-testing, not smart architects.

### 7.2 · AbarVa's mechanism

The **Solution Architecture Alignment capability pattern (Tier 2)**. The single most important Tier 2 pattern. Activates whenever a program enters Phase 3 for technology work.

The pattern's mechanism:

**Mandatory three-option framing.** Every architecture decision presents at least three options. Binary framings (do X or don't) are structurally disallowed at this moment. The third option is often "do nothing / defer" which is a legitimate architecture choice that's typically under-considered.

**Structured trade-off analysis per option.** Each option is evaluated across: business requirement fit, technical risk, organizational fit, vendor dependency, cost profile (build + run), time to value, reversibility. Not prose — structured comparison that forces explicit analysis.

**Architecture implications surfaced.** For each option, the downstream architectural implications are named. "Option A requires standardized data contracts across 14 systems within 6 months; Option B doesn't require this but locks us into vendor X for 5 years." The hidden costs become visible.

**Operating model implications tied to each option.** Architecture choice drives operating model choice. "Option A requires platform engineering team with 8 FTEs; Option B requires 3 FTEs plus vendor management competency; Option C requires retraining of existing team over 4 months." Operating model is a first-class output of the architecture decision, not an afterthought.

**Failure mode analysis per option.** For each option, the most likely failure modes are named with their frequency in comparable programs. Pattern-backed, not speculation.

**Reversibility analysis.** Each option's reversibility is explicit. "Option A: reversible within 3 months at cost of $X. Option B: irreversible commitment after month 12. Option C: reversible but requires sponsor re-engagement." Reversibility is a decision input, not an afterthought.

**Pause-and-workshop support.** Solution architecture decisions rarely resolve in a single session. The pattern explicitly supports pausing the workflow, holding workshops (with AbarVa facilitation available), returning with a decision. The ingest flow reshapes program state based on workshop outputs. The decision itself is an output of a facilitated process, not a solo analytical exercise.

### 7.3 · Required product surfaces and components

**Solution Architecture Alignment deliverable (insert as D13 or D14 in Phase 3).** Structured format covering the seven analytical dimensions above. Pattern-driven — the specific questions asked and priors surfaced depend on the solution type (full stack, data platform, ERP, digital, AI/ML).

**Three-option mandatory framing enforced at the field level.** The deliverable cannot save with fewer than three options. Binary framings are rejected with explanatory prompts.

**Architecture implications matrix.** Structured cross-option comparison across the seven dimensions. Visualizable as a table or radar chart.

**Pattern-driven prior population.** The Solution Architecture Alignment capability pattern provides priors on typical failure modes, reversibility profiles, and operating model implications per solution type. Agent populates defaults that the user pressure-tests rather than starting from blank.

**Workshop mode integration.** When the architecture decision is flagged as requiring a workshop, the product enters workshop mode — pause state, workshop agenda template, participant-facing display of the three options with structured discussion prompts, capture flow for workshop output. AbarVa maestro bookable for facilitation.

### 7.4 · Current state and gaps

**Current state (inferred, high confidence):** Missing. No Solution Architecture Alignment capability pattern exists in the current pattern library. No dedicated deliverable. No three-option mandatory framing. No workshop mode integration. Status: **MISSING** (critical gap for any technology program).

**Gaps with priority:**

- [P0 · demo-critical] Solution Architecture Alignment capability pattern authored and in knowledge layer
- [P0 · demo-critical] Dedicated deliverable in Phase 3 with structured fields
- [P0 · demo-critical] Three-option framing enforced
- [P0 · demo-critical] Architecture implications matrix
- [P1 · seed-critical] Pattern-driven prior population by solution type
- [P1 · seed-critical] Workshop mode integration with facilitation support
- [P2 · Series A] Cross-tenant architectural pattern library (what worked for similar tenants with similar problems)

### 7.5 · Acceptance criteria

- Solution Architecture Alignment deliverable exists in Phase 3 for technology programs
- Three options minimum enforced
- Seven-dimension structured analysis per option
- Pattern-backed priors populated by solution type
- Workshop mode supports pause/facilitate/resume
- Test: a user entering a technology program reaches Phase 3 and is presented with a structured architectural decision process, not a blank deliverable

### 7.6 · Crawler persona test

Dara (technical design partner persona, VP of AI Platform) starts a data platform rationalization program. System activates Solution Architecture Alignment pattern. Presents three architectural options: consolidate to single platform, federated with common standards, replace with managed service. For each, populates priors: failure modes, operating model implications, reversibility. Dara's persona test passes if the product demonstrates architectural rigor equivalent to what she'd expect from a senior consulting engagement — not in length but in structured completeness.

---

## Section 8 · Failure Mode 6 · Bad ROI or uncontrolled cost

### 8.1 · The failure, concretely

Programs launch with optimistic business cases that don't survive execution reality. Costs overrun, benefits underperform, the break-even date slides, and the CFO eventually asks "was this worth it?" with no good answer. The root cause is typically not dishonesty at the business case stage — it's inadequate estimation methodology, insufficient sensitivity analysis, and no systematic comparison to how similar programs actually performed.

Separately: programs that do track financials don't track them tightly enough. Monthly run-rate doesn't surface drift quickly; quarterly reviews surface drift too late to correct.

**Industry evidence:** The gap between planned and actual program economics in enterprise tech consistently runs 40-80% over on cost, 30-60% under on benefit. Programs with pre-registered measurement methodology and rigorous counterfactual construction perform dramatically better.

### 8.2 · AbarVa's mechanism

Four mechanisms combine.

**Estimation capability patterns (Tier 2).** Separate patterns for the major estimation domains: AI-Led PDLC Full Stack, AI-Led PDLC Data Platforms, AI-Led PDLC ERP, AI-Led PDLC Digital. Each pattern provides reference productivity data, AI-leverage factors, organizational drag factors, sequencing intelligence. Estimates produced through these patterns carry confidence intervals and explicit assumption tracking.

**Business Case Craft Pattern (Tier 1).** Every business case deliverable (D16) requires: NPV calculation with explicit discount rate rationale, sensitivity analysis across low/base/high scenarios, comparable program benchmarks (pattern-sourced), risk-adjusted return calculation, pre-registered counterfactual methodology. The craft pattern enforces this structure.

**Estimation Re-calibration Cadence.** At each phase gate, estimates are re-calibrated against actual program experience. Phase 1 estimate is rough; Phase 2 estimate incorporates diagnosis findings; Phase 3 estimate incorporates decision specifics; Phase 4 estimate is execution-tight. The product surfaces estimation drift between phases and forces explicit reconciliation.

**Control Tower economic health surface.** Portfolio-level view of estimation accuracy and cost/benefit realization. Atlas surfaces programs drifting from their estimates as pressure cards. Economic drift is visible at the portfolio level, not just program level.

### 8.3 · Required product surfaces and components

**Estimation capability patterns** as Tier 2 entries in the pattern library. Each with structured priors on productivity, AI leverage, drag factors, sequencing.

**D16 Business Case deliverable with pattern-enforced structure.** Seven required components: NPV, sensitivity, benchmarks, risk-adjusted return, counterfactual methodology, assumption log, confidence intervals.

**Estimation re-calibration flow at phase gates.** Each gate requires estimate update with variance explanation if >10% drift.

**Tower economic health panel.** Portfolio view of estimate vs. actual across all programs. Pressure cards for material drift.

**Counterfactual registry.** Pre-registered counterfactual methodology per program persisted and available at Phase 5 attestation.

### 8.4 · Current state and gaps

**Current state (inferred, high confidence):** Partial. D16 Business Case exists as a deliverable (in Agent C3's queue). What's partial: the pattern-enforced seven-component structure is probably not implemented at field-level validation. Estimation capability patterns don't exist. Re-calibration flow doesn't exist. Tower economic health panel doesn't exist. Status: **PARTIAL**.

**Gaps with priority:**

- [P0 · demo-critical] Estimation capability patterns for AI-Led PDLC (at least full stack and data platforms for demo)
- [P0 · demo-critical] D16 Business Case pattern-enforced structure with field validation
- [P1 · seed-critical] Estimation re-calibration flow at phase gates
- [P1 · seed-critical] Counterfactual registry
- [P1 · seed-critical] Tower economic health panel
- [P2 · Series A] Estimation accuracy learning feedback (past estimate vs. actual data refines pattern priors)

### 8.5 · Acceptance criteria

- Business case deliverable enforces seven-component structure
- Estimation capability patterns populate priors for the major PDLC domains
- Phase gate re-calibration is mandatory
- Tower surfaces economic drift as pressure cards
- Counterfactual methodology is pre-registered before Phase 5

### 8.6 · Crawler persona test

Marcus T. (Apex CFO) opens D16 Business Case on Morrison. Expected: structured sensitivity analysis, comparable program benchmarks with actual outcome data, explicit counterfactual methodology. Marcus's persona specifically tests: "can I trace every number to its basis?" Test passes if every projection has sourced confidence intervals and every benchmark has named comparable programs with actual (composite) results.

---

## Section 9 · Failure Mode 7 · Wrong human-agent operating model

### 9.1 · The failure, concretely

Two versions of this failure are common today. Version one: the organization doesn't use AI tooling where it would help, sticking with human-heavy processes that AI could accelerate 3-10x. Version two: the organization over-deploys AI where judgment matters, producing brittle automation that fails in edge cases and erodes trust. Both versions come from not having a rigorous framework for deciding where AI adds value and where human judgment must remain central.

Related: the organization doesn't think systematically about the operating model implications of its AI choices. Who runs the AI? Who maintains it? Who's accountable when it misfires? These questions get handled ad-hoc, creating governance and accountability gaps that surface during incidents.

**Industry evidence:** A recurring finding in AI adoption research — organizations that think through operating model choices explicitly outperform those that let the operating model emerge implicitly.

### 9.2 · AbarVa's mechanism

The **Operating Model Selection capability pattern (Tier 2)**. Activates in Phase 3 for every program, providing structured guidance on:

**Work split between AI and humans.** For each major work type in the program, the pattern surfaces the evidence base on what's AI-suitable, what's human-suitable, what's collaborative (AI drafts, human reviews and judges). Specific to the solution type and the client profile.

**Operating model options.** Typically three to five: fully in-house, in-house with specialist augmentation, vendor-led with oversight, platform-with-SLA, fully outsourced. Each evaluated against fit criteria (internal capability, time horizon, cost sensitivity, risk tolerance, compound-learning priority).

**AI leverage calibration.** For each operating model option, how much AI tooling is leveraged and at what maturity level. Aggressive AI leverage requires higher internal AI maturity; selective leverage works for lower-maturity teams.

**Accountability and governance mapping.** Explicit assignment of accountability for each work type under each operating model. Where AI is leveraged, governance mechanism is specified (human-in-the-loop review thresholds, bias monitoring, drift detection).

**Failure mode analysis.** For each operating model option, historical failure modes and their rates in comparable programs. Pattern-backed.

The mechanism's output is not a recommendation but a structured decision with the sponsor explicitly choosing. The product ensures the choice is made consciously, not by default.

### 9.3 · Required product surfaces and components

**Operating Model Selection capability pattern** as a Tier 2 entry.

**Operating Model deliverable in Phase 3** (could be integrated with D19 Delivery Plan or standalone). Structured format covering work split, operating model options, AI leverage calibration, accountability mapping, failure modes.

**AI maturity assessment for the tenant.** Input to the operating model decision. Structured assessment of the tenant's current AI capability, tooling, governance maturity.

**Pattern-driven recommendations.** The pattern surfaces "programs of this type at tenants of this maturity most often succeed with operating model X" — pattern-backed priors rather than generic options.

### 9.4 · Current state and gaps

**Current state (inferred, high confidence):** Missing. No Operating Model Selection capability pattern. No dedicated deliverable. AI maturity assessment doesn't exist as a structured tenant attribute. Status: **MISSING**.

**Gaps with priority:**

- [P0 · demo-critical] Operating Model Selection capability pattern authored
- [P0 · demo-critical] Operating Model deliverable in Phase 3
- [P1 · seed-critical] AI maturity assessment as tenant attribute
- [P1 · seed-critical] Pattern-driven recommendations based on tenant profile
- [P2 · Series A] Cross-tenant operating model outcome data refining pattern priors

### 9.5 · Acceptance criteria

- Operating Model Selection pattern exists and drives Phase 3 deliverable
- Structured decision with conscious selection (no default)
- AI maturity assessment populated per tenant
- Pattern-backed priors visible to user
- Test: a technology program reaches Phase 3 and the operating model is consciously chosen with explicit trade-offs, not implicitly assumed

### 9.6 · Crawler persona test

Dara (VP AI Platform) reviews her program's Phase 3 Operating Model deliverable. Expected: structured presentation of five operating model options, evaluation against her tenant's AI maturity (medium-high), pattern-backed recommendations with explicit priors. Her test passes if the product demonstrates the product "knows" her organization's specific capability profile rather than offering generic options.

---

## Section 10 · Failure Mode 8 · No pattern-based pressure-testing

### 10.1 · The failure, concretely

Programs are designed from first principles each time, without systematic leverage of accumulated organizational or industry knowledge. The team treats their program as novel; it usually isn't. Decisions that have been made many times before get re-made with less information than is available. Predictable failure modes aren't predicted. Success patterns aren't leveraged.

This failure is the moat gap. If AbarVa doesn't address it substantively, the product is a workflow tool. If AbarVa does, the product is a transformation accelerator.

### 10.2 · AbarVa's mechanism

The entire **pattern library architecture + retrieval-on-every-turn** specified in File 02 and File 03. The mechanism is the product's core differentiator — every agent response is pattern-enriched, every decision is pattern-backed, every estimate is pattern-calibrated, every risk surfaces from pattern-known failure modes.

Specifically:

**Three-tier pattern library.** Tier 1 craft patterns (universal), Tier 2 capability patterns (cross-cutting), Tier 3 use-case patterns (domain-specific). Composition at runtime produces enriched responses.

**Retrieval on every agent turn.** No agent response is generated without first retrieving relevant patterns. The assembly is registry (routing), graph (relationships), vector (semantic match), Postgres (structured data).

**Pattern-backed visible reasoning.** Agent responses don't just use patterns — they visibly cite them. "We're recommending parallel-track sequencing because the Owned Brand Margin Recovery pattern's observation base shows 73% success rate for parallel vs. 41% sequential." The citation is visible to the user, proving the pattern is doing work.

**Feedback loop.** User interactions (pushback, acceptance, modification) flow back to the pattern, sharpening its priors over time.

### 10.3 · Required product surfaces and components

Specified comprehensively in File 02 (Pattern Library Architecture Backlog) and File 03 (Knowledge Layer Architecture Backlog). Summary here.

**Pattern registry** with metadata, routing, priors.
**Graph** with relationship edges (SOURCED_FROM, APPLIED_IN, RELATED_TO, APPLICABLE_TO_TENANT).
**Vector store** for semantic pattern retrieval.
**Postgres** for structured pattern data (priors, priors, failure modes).
**Retrieval pipeline** wired into every agent call.
**Pattern citation rendering** in agent responses and deliverables.
**Feedback capture and curation pipeline** for pattern refinement.

### 10.4 · Current state and gaps

**Current state (inferred, medium-high confidence):** Partial. Pattern library exists with 13 authored patterns. Registry, graph, vector, Postgres are partially wired per PR history. Retrieval on every turn is probably not uniformly implemented. Pattern citations in responses are partial (D17 uses E1-E7 chips). Feedback loop is not built. Status: **PARTIAL**.

**Gaps with priority:**

- [P0 · demo-critical] Retrieval-on-every-turn uniformly implemented across all agents
- [P0 · demo-critical] Pattern citations visible in agent responses and deliverables
- [P0 · demo-critical] Tier 1 craft patterns authored (20-25 patterns)
- [P0 · demo-critical] Tier 2 capability patterns authored (8-10 patterns)
- [P1 · seed-critical] Tier 3 use-case pattern retrofit to structured format
- [P1 · seed-critical] Feedback capture pipeline
- [P2 · Series A] Automated pattern refinement from interaction data
- [P2 · Series A] SLM training on high-volume patterns

### 10.5 · Acceptance criteria

- Every agent response across all four agents demonstrably uses pattern retrieval
- Pattern citations are visible to users in responses and deliverables
- Pattern library contains Tier 1, Tier 2, Tier 3 patterns at specified counts
- User interactions feed the pattern feedback pipeline
- Test: the crawler's default-Claude-comparison test shows substantive difference in response quality for any program scenario

### 10.6 · Crawler persona test

All five personas, implicit across all their walks. The product fails this mode if default Claude produces comparably good responses; the product succeeds if pattern-backed responses are visibly richer, more specific, more credibly grounded.

---

## Section 11 · Failure Mode 9 · No ongoing value tracking

### 11.1 · The failure, concretely

Programs declare victory at Phase 4 completion (build-and-deliver) and don't rigorously measure whether the promised outcomes materialize over time. The "hockey stick" projections get assumed into reality rather than verified. Six months post-launch, no one can definitively say whether the program delivered its promised value, and the organization loses the ability to learn from what worked and didn't.

Separately: tracking that does exist is often disconnected from the program's original business case. Metrics drift. Counterfactuals get revised post-hoc. Outcome claims become un-verifiable.

### 11.2 · AbarVa's mechanism

**Phase 5 as a formal phase** with structured deliverables: D24 Outcome Measurement Plan, D25 Outcome Attestation Report, D26 Financial Impact Validation, D27 Dual-Ledger Reconciliation.

**Pre-registered counterfactual methodology.** At Phase 3, the counterfactual is locked. No post-hoc revision of how outcomes are measured.

**Dual-ledger reconciliation.** AbarVa's outcome ledger reconciles against the tenant's finance ledger. Outcome claims are structurally defensible under CFO scrutiny.

**Control Tower portfolio value tracking.** Tower surfaces portfolio-level realized value against portfolio-level projections. Drift visible at portfolio level, not just program level.

**Outcome attestation as signed artifact.** D25 is signed by the sponsor (Marcus T. at Apex, e.g.), making the outcome claim formally attested rather than informally asserted.

### 11.3 · Required product surfaces and components

**Phase 5 workflow with D24-D27 deliverables.**
**Counterfactual registry** persisting Phase 3 methodology to Phase 5.
**Dual-ledger reconciliation UI** supporting variance analysis.
**Tower portfolio value panel** surfacing realized vs. projected.
**Attestation signature flow** with audit trail.

### 11.4 · Current state and gaps

**Current state (inferred, medium confidence):** Partial. Phase 5 deliverables are scoped but most are Stubs rather than Rich. D25 exists as a Stub exemplar (good foundation). Tower portfolio view partially exists. Counterfactual registry and dual-ledger reconciliation are not built. Status: **PARTIAL**.

**Gaps with priority:**

- [P1 · seed-critical] Counterfactual registry
- [P1 · seed-critical] Dual-ledger reconciliation UI
- [P1 · seed-critical] Tower portfolio value panel with drift surfacing
- [P2 · Series A] Attestation signature flow with formal audit
- [P2 · Series A] Outcome learning feedback to pattern library (completed Phase 5 contributes observations back)

**Note:** This mode is less demo-critical because Morrison in the seed is Phase 4, not Phase 5. Phase 5 capabilities can ship post-demo.

### 11.5 · Acceptance criteria

- Phase 5 deliverables render at appropriate tier (Rich for demo programs where applicable)
- Counterfactual registry persists from Phase 3
- Outcome claims trace to dual-ledger reconciliation
- Tower surfaces portfolio-level value tracking
- Attestation is signed with audit trail

### 11.6 · Crawler persona test

Less demo-critical but: Marcus T. clicks D25 on Morrison (Stub state). System surfaces the activation conditions, the prerequisite deliverables (D24 Outcome Measurement Plan), the scheduled activation window. Marcus's test passes if the Stub renders as dignified scheduled state rather than "coming soon" placeholder.

---

## Section 12 · Failure Mode 10 · No visibility-driven action on drift

### 12.1 · The failure, concretely

Organizations have dashboards. They don't take action on what dashboards show. Drift happens, the dashboard reflects it, but no one is accountable for acting on the signal. The dashboard becomes decorative. Executive attention drifts because the dashboard doesn't drive behavior.

This is specifically why Control Tower has to be an action surface, not a dashboard. The distinction is whether the surface changes behavior or decorates conference rooms.

### 12.2 · AbarVa's mechanism

**Atlas agent anchoring Control Tower with proactive pressure surfacing.** Atlas doesn't wait for the user to ask what's wrong. Atlas identifies the pressures — unowned spend, governance gaps, stalled programs, drifting outcomes — and surfaces them with editorial analysis and specific recommended actions.

**Pressure cards with editorial lines.** Not "three items require review" (generic). But "three ambient tools, one problem, no owner" or "$1.3M/mo cloud spend on pace to $2.4M/mo without guardrails by Q3" (specific, analytical, decision-oriented).

**Action affordances on every pressure card.** Every pressure has 2-3 actions available directly from the card: assign owner, open investigation, defer to council, escalate. The Tower is where action begins, not just where information is displayed.

**Cross-agent handoffs from Tower.** When a pressure requires program-level work, Atlas hands off to Nexus (program creation) or Sentinel (pattern consultation). The handoff preserves context — the target agent opens with "Atlas said you were working on X..."

**Stall detection and proactive nudges.** Programs that haven't advanced in threshold time surface on Tower as stall pressures. Atlas offers interventions: AbarVa human layer help, re-engagement with sponsor, scope revision.

### 12.3 · Required product surfaces and components

**Atlas agent fully anchored on Tower.** Covered in File 04 (Surface Design Backlog).

**Pressure card component with editorial line, action affordances, cross-agent handoff.**

**Stall detection logic** — days-since-advance threshold, automatic pressure creation when threshold crossed.

**Atlas proactive prompt generation.** Atlas reviews portfolio state on each user visit and surfaces new pressures or updates to existing pressures.

**Action flow tracking.** When a user takes an action from a pressure card (e.g., "assign owner"), the action is tracked, and the pressure updates accordingly.

### 12.4 · Current state and gaps

**Current state (inferred, medium-high confidence):** Partial. Tower surface exists with pressure cards (per Apr 22 screenshot — editorial lines good). Atlas agent posture is partial. Action affordances exist per the screenshot but may not all route cleanly. Stall detection doesn't exist. Cross-agent handoff from Tower is not wired. Status: **PARTIAL**.

**Gaps with priority:**

- [P0 · demo-critical] Atlas agent fully anchored on Tower with proactive prompting
- [P0 · demo-critical] Action affordances on every pressure card routing to appropriate next state
- [P0 · demo-critical] Cross-agent handoff (Atlas → Nexus, Atlas → Sentinel)
- [P1 · seed-critical] Stall detection logic
- [P2 · Series A] Atlas learning from user action patterns (what actions produce outcomes)

### 12.5 · Acceptance criteria

- Every pressure card has specific editorial analysis, not generic labeling
- Action affordances work end-to-end (clicking "assign owner" produces a structured assignment)
- Cross-agent handoffs preserve context
- Stall detection surfaces stalled programs as pressures
- Test: Mike (Fortune 40 CIO) opens Tower, sees three editorial pressure cards, clicks one, takes an action, action completes within the product

### 12.6 · Crawler persona test

Mike's primary walk. Lands on Tower. Expected: three editorial pressure cards within the first screen. Each card legible as real analysis. Action affordances visible. Cross-agent handoff on at least one click. His 3-minute test passes if Tower earns his interest through substance; fails if it reads as another dashboard.

---

## Section 13 · Failure Mode 11 · Wrong vendor or partner selection

### 13.1 · The failure, concretely

Vendor selection often gets treated as a procurement exercise rather than a strategic decision. The team runs an RFP, vendors respond with marketing materials, the scoring is opaque, and the final choice is shaped more by politics and price than by fit. Six months later, the vendor doesn't deliver as promised, and the program either muddles through or replaces the vendor at significant cost.

Separately: some programs should not use vendors at all (build internally) or should use different vendors for different components (best-of-breed) — but the framework for making those choices doesn't exist.

### 13.2 · AbarVa's mechanism

The **Vendor Evaluation Framework capability pattern (Tier 2)**. Plus **use-case-specific vendor intelligence** in relevant Tier 3 patterns.

**Structured evaluation framework.** Capabilities matrix with weighting, performance on historical engagements (where data exists), cultural fit, financial stability, partnership alignment. Not a feature checklist but a weighted, evidence-based assessment.

**Build-vs-buy-vs-partner framework.** First-order decision before vendor selection. The pattern surfaces when each is typically appropriate given program characteristics.

**Use-case-specific vendor intelligence.** For specific program types (ambient clinical, vendor optimization, data platforms), the relevant use-case pattern provides vendor-specific intelligence: which vendors have strength/weakness for which client profiles, pricing patterns, common contract gotchas, outcome distributions across composite programs.

**RFP generation support.** When an RFP is the right mechanism, the product generates a first-draft RFP based on the program's specific requirements and the pattern-backed evaluation framework. Not a template — a specific RFP tailored to the problem.

**Negotiation support.** Pattern-backed intelligence on typical negotiation levers, common concession patterns, contract clauses that matter most.

### 13.3 · Required product surfaces and components

**Vendor Evaluation Framework capability pattern** as a Tier 2 entry.

**Use-case patterns include vendor intelligence sections** as structured data.

**Vendor evaluation deliverable** within appropriate workflow shapes (especially the alternative vendor-selection workflow in File 06).

**RFP generation capability** — the product produces an RFP skeleton with section-by-section scaffolding and pattern-backed requirements.

**Negotiation playbook capability** — tier-by-tier negotiation guidance for specific vendor and program types.

### 13.4 · Current state and gaps

**Current state (inferred, high confidence):** Missing. No Vendor Evaluation Framework pattern. No use-case vendor intelligence at the structured-data level. No RFP generation. No negotiation playbook. Status: **MISSING**.

**Gaps with priority:**

- [P1 · seed-critical] Vendor Evaluation Framework capability pattern
- [P1 · seed-critical] Use-case vendor intelligence in Tier 3 patterns (at least ambient and data platform)
- [P2 · Series A] RFP generation capability
- [P2 · Series A] Negotiation playbook

**Note:** Not demo-critical for Morrison/Ambient (neither is primarily vendor selection). Becomes critical if vendor optimization workflow (File 06) is included in demo.

### 13.5 · Acceptance criteria

- Vendor Evaluation Framework pattern exists
- Use-case patterns include structured vendor intelligence
- Vendor evaluation deliverable produces pattern-backed assessment
- RFP generation produces substantive first draft

### 13.6 · Crawler persona test

If vendor optimization workflow is included: a persona running an AMS vendor rationalization should see structured evaluation framework, build-vs-buy-vs-partner decision, pattern-backed vendor intelligence. If not demo-critical, deferred.

---

## Section 14 · Failure Mode 12 · No learning capture to compound

### 14.1 · The failure, concretely

Every program is treated as isolated. Learnings don't accumulate. The organization's pattern library doesn't sharpen with use. Each new initiative starts from roughly the same baseline of expertise. Over time, this prevents the organization from becoming genuinely AI-capable at the compound level — it just has a series of individual AI projects.

This is the deepest failure mode because it prevents all others from resolving over time. Organizations that fail Mode 12 continue to fail Modes 1-11 forever because they don't learn from their failures.

### 14.2 · AbarVa's mechanism

The **pattern library feedback loop and cross-tenant emergent intelligence**. Specified comprehensively in File 02 and File 03. Summary:

**Every program contributes observations back to the relevant patterns at Phase 5.** Observations are structured, anonymized, composite-tagged. They update the pattern's priors — diagnostic priors, decision priors, timeline priors, failure modes, contextual amplifiers.

**Cross-tenant emergent intelligence.** With appropriate anonymization and curation, observations from one tenant's completed program refine patterns available to all tenants using that pattern. Not Meridian's experience affecting Apex; composite learning at the pattern level.

**Pattern versioning with provenance.** Patterns evolve over time. Each version traceable. Clients can see how patterns matured based on accumulated experience.

**SLM training pipeline (future-state).** High-volume patterns eventually train specialized small language models. Proves the compounding value of captured learning — the product's intelligence is literally a function of the data it's accumulated.

**Intelligence layer (Zone 4) as the substrate.** Not a browse destination primarily but the invisible enrichment behind every agent response. Becoming visible only when the user explicitly browses.

### 14.3 · Required product surfaces and components

Specified in File 02, File 03. Summary:

**Pattern feedback capture** from user interactions across all phases.
**Curation pipeline** with human-in-the-loop for promotion decisions.
**Anonymization layer** for cross-tenant flow.
**Pattern versioning** with provenance chain.
**Emergent intelligence propagation** across tenants referencing the same pattern.
**SLM training pipeline** (future-state).

### 14.4 · Current state and gaps

**Current state (high confidence):** Missing. No feedback capture. No curation pipeline. No cross-tenant flow. Patterns are static. Status: **MISSING / NEW-WORK**.

**Gaps with priority:**

- [P1 · seed-critical] Feedback capture from user interactions (additive; initially curated manually)
- [P1 · seed-critical] Curation workflow for promotion decisions
- [P2 · Series A] Anonymization and cross-tenant flow
- [P2 · Series A] Pattern versioning and provenance
- [P3 · post-Series A] SLM training pipeline

### 14.5 · Acceptance criteria

- User interactions produce structured feedback data
- Curation workflow exists for pattern promotion
- Pattern versions track over time
- Cross-tenant learning flows with appropriate anonymization
- At scale, SLM training becomes economically viable

### 14.6 · Crawler persona test

Less visible in a single cycle but detectable: if the product is used over time, later runs should show patterns maturing. This is a longitudinal test, not a single-cycle test. Relevant for investor narrative (File 07) more than for crawler validation.

---

## Section 15 · Pre-decided items — don't re-ask

Applies across all backlog files. These decisions are settled. Do not flag, do not re-open.

- **Composite disclaimer exact wording:** "Composite organization built from real-world data."
- **Demo-rendering disclaimer exact wording:** "This document is a demo rendering, not a deliverable for a real engagement."
- **Pattern authorship disclaimer exact wording:** "Pattern observations are authored from industry knowledge, not measured outcomes from deployed customers. Every observation card carries a 'Composite' tag."
- **Agent rail behavior:** persistent-visible, collapsed-narrow default (40-60px), expands on click to 320-400px, mutual exclusivity with document sidebar.
- **Conversation state scope:** per-surface, persists across navigation within surface, resets on tenant switch.
- **Voice contracts:** Nexus maestro-collegial, Sentinel research-rigorous, Atlas executive-concise, Steward operationally-terse.
- **Guided-choice pattern:** 3-5 option chips + "something else" text input, always visible, single-click submit.
- **Three render tiers:** Rich (12 components), Outline (8 components), Stub (6 components per D25 pattern).
- **Four authenticated zones:** Zone 1 Tower (earned density, Atlas refines), Zone 2 Admin (organized features, Steward helps), Zone 3 Programs (ruthless minimalism, Nexus anchors), Zone 4 Intelligence (agent-surfaced, Sentinel anchors).
- **Workflow phase count:** 5 phases (Intake, Diagnosis, Decision, Execution, Outcome) with named gates between each.
- **Retrieval on every agent turn:** non-negotiable architectural commitment.
- **Pattern-carries-execution-contract:** each pattern declares its workflow type.
- **Zero tolerance for:** dead links, pre-canon URLs, placeholder strings, missing disclaimers, cross-tenant leak.

---

## Section 16 · Execution discipline

**Ownership:** File 01 is the spec. Claude Code implements the product surfaces, workflow mechanics, and agent anchoring against it. Codex implements the knowledge layer infrastructure, integrity defenses, and pattern registry against it.

**Priority tagging:** Every gap item has a priority label. P0 demo-critical items ship before demo. P1 seed-critical items ship before seed close. P2 Series A items ship in the next 6 months post-seed. P3 post-Series A items are roadmap.

**Commit discipline:** Every PR references the failure mode(s) it addresses. Commit messages include "addresses FM-N" where N is the mode number.

**Review criterion:** Every PR is reviewed against the acceptance criteria for the failure mode(s) it addresses. If the PR doesn't visibly improve a failure mode's mitigation, the PR is deprioritized.

**Aggregation:** A matrix view of failure modes × status is maintained. Updated on every merge. Surfaces to the team which modes are well-addressed and which remain thin.

---

## Section 17 · One-line handoff

> This file is the product's north star. Twelve failure modes, each with mechanism, surfaces, components, current state, gaps, and acceptance. Every downstream file (File 02-07) references this one. Every feature in the product exists because it addresses a failure mode. Every gap has a priority. Every PR references the mode(s) it addresses. Apply autonomy charter. Pre-decided items in Section 15 — don't re-ask.

---

*End of File 01 · Failure-Mode-to-Capability Matrix Backlog.*
