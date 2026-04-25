# 01 · Platform North Star

**Document:** AbarVa's canonical product vision, design principles, and surface-by-surface ideal experiences
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companion:** `00_AGENT_CENTRIC_MASTER_ANCHOR.md` (read first)
**Framework reference:** Sections 2, 3, 8, 10 of Agent-Centric Product Design Framework

This document establishes what AbarVa is supposed to feel like. Not in marketing language — in specific compositional and experiential terms that designers and engineers can build against.

## The North Star in one sentence

Every AbarVa surface should feel like an expert agent is actively guiding the user through a high-stakes enterprise decision with full awareness of client context, workflow state, artifacts, evidence, risks, value, uploaded files, patterns, and next action.

This is not a slogan. It is a design constraint that governs every surface-level decision. Surfaces that do not produce this feeling have failed the North Star regardless of how technically correct they are.

## The ideal user reaction

The target user reaction when landing on any AbarVa surface:

> This already understands my business context, the work in motion, the decision I need to make, and what is missing before I can move forward.

This reaction must occur in the first three to ten seconds of a user's session on any surface. Users should not have to read instructions, configure settings, parse dashboards, or type prompts to reach this state. The surface is designed to produce this state by default.

Two failure modes against this target:

**Failure A — the surface produces "I understand metrics but not what to do."** The user sees data but not synthesis. Dashboard graveyard symptom. Atlas is not composing editorial on top of the metrics.

**Failure B — the surface produces "I need to tell the AI what to do."** The user arrives at a blank prompt or a chat box expecting the user to initiate intelligence. Agent is not leading. This is ChatGPT dressed in enterprise clothing.

A surface that produces either failure mode has missed the North Star and must be reworked.

## AbarVa is not

Worth naming explicitly because these are the adjacent products AbarVa could drift toward under design pressure.

**Not a generic chatbot.** AbarVa agents do not answer arbitrary questions. They answer questions grounded in a specific Context Bundle for a specific work object on a specific surface. Outside the context, agents decline or redirect.

**Not a CRUD dashboard with AI sprinkled in.** Dashboards without agent editorial are incomplete. Every metric, table, or card serves evidence for an agent-authored synthesis.

**Not a static consulting template library.** Deliverables, RFPs, and artifacts are generated from authored pattern content composed with client-specific context, not filled from static templates.

**Not a project tracker.** Projects are not the primary unit. Programs (for AI transformation) and Sourcing Events (for IT sourcing) are primary units. Project-management features serve these decision-oriented workflows, not the reverse.

**Not a procurement portal.** Source does not replace Ariba or Coupa. Source sits upstream of procurement execution, handling the strategic and intelligence-driven work that happens before contracts flow into procurement systems.

**Not five disconnected products.** Programs, Source, Intelligence, Tower, Admin share fabric, voice, and navigation. A user who learns one surface should find the others familiar.

## Core design principles (rendered as product constraints)

Eight principles from the framework. Each rendered as a product constraint rather than an aspiration.

**Context-first, not prompt-first.**

Every agent response begins by assembling the Context Bundle defined in document 02. User prompts are intent signals that refine retrieval, not initial inputs from which the agent reasons. An agent that responds to a prompt without assembling a Context Bundle is in violation of this principle. Enforce at the runtime layer via the per-turn contract.

**Agent-led, not form-led.**

Forms are inputs to context, not the primary UX. Users do not fill long forms to receive value. Surfaces lead with agent synthesis; forms appear contextually when specific inputs are required. A surface whose entry point is a blank form fails this principle.

**Workflow-first, not page-first.**

Every surface shows workflow state: current stage, current blockers, current owner, current next action. Users can navigate to specific pages but the primary orientation is workflow progress. A surface that shows static content without workflow state fails this principle.

**Evidence-backed, not opinion-only.**

Every substantive claim in an agent response carries provenance: pattern citation, evidence reference, uploaded file, measured outcome, or explicit "authored from industry knowledge" disclosure. Agents that make claims without provenance violate this principle. Enforce at the response composition layer.

**Progressive disclosure.**

The decision surfaces; detail lives in drawers. A page should answer the five questions (where am I, what matters, what's at risk, what's recommended, what should I do) without requiring scroll or click. Users who want more detail click or expand. Surfaces that require extensive scrolling to understand violate this principle.

**Governance-native.**

Audit, approval, gates, and rationale are first-class product primitives, not bolted-on features. Every decision has an audit trail. Every artifact has a review and lock state. Every gate has enforcement. Scorecard weights have rationale on material changes. Governance is how the product works, not a compliance feature.

**Pattern-powered.**

Reusable AbarVa IP drives behavior. Pattern packs configure workflows. Pattern sections are cited in agent responses. Scorecard defaults come from pattern content. Deliverable templates derive from patterns. UI does not hardcode domain logic; UI retrieves pattern configuration and renders.

**Value-linked.**

Every program, every sourcing event, every major decision connects to the Value Ledger. Projected value sits in Phase 4 equivalents. Realized value flows back in Phase 6 equivalents. Variance gets attributed. Surfaces that treat work as effort without value linkage fail this principle.

## The platform as one product with five surfaces

AbarVa is one platform. Five surfaces. Shared fabric.

**Programs** is the AI transformation programs workspace. A CIO running Ambient Clinical Value Chain Activation at Meridian Health works here. The surface runs through six phases (Origination, Charter, Diagnose, Design, Execute, Verify) with Nexus as the maestro and Steward enforcing gates.

**Source** is the IT sourcing workbench. A CIO running an AMS Strategic Sourcing event works here. The surface runs through ten stages (Intake, Scope, Strategy, RFP, Responses, Evaluation, Orals, Selection, Mobilization, Value Realization) with Nexus as the sourcing lead, Sentinel for evidence, Steward for gate enforcement.

**Intelligence** is the pattern library and research environment. A transformation leader exploring AI governance patterns or comparing ambient clinical approaches across industries works here. Sentinel is the librarian. Patterns are the primary content.

**Control Tower** is the executive portfolio oversight surface. A CIO who needs to see across all Programs and Source events — what is moving, what is blocked, what is at risk, where value is concentrated — works here. Atlas composes editorial on top of portfolio signals.

**Setup/Admin** is the platform administration surface. A platform admin configuring connectors, managing roles, reviewing audit logs, tuning pattern library access works here. Steward enforces operational integrity.

These five surfaces share:

- **Pattern Fabric** — authored patterns (M1-M6 meta, T1 Craft, T2 Capability, T3 Use-case) retrieved and cited across surfaces
- **Agent Fabric** — four agents (Nexus, Sentinel, Atlas, Steward) with distinct voices and shared context primitives
- **Artifact Studio** — deliverable generation with Rich/Outline/Stub tiers across program deliverables and Source artifacts
- **Control Tower logic** — portfolio aggregation across Programs and Source visible on the Tower surface
- **Value Ledger** — projected and realized value attached to every program and sourcing event

These five surfaces do not share domain models. Programs has phases; Source has stages; Intelligence has patterns as primary objects; Tower has pressures; Admin has connectors. Shared primitives are architectural. Domain shape is surface-specific.

## Surface-by-surface ideal reactions

For each surface, the specific user reaction the surface must produce. Each with persona-specific variations.

### Programs

**Default CIO reaction on Programs index:**
> I see which programs are moving, which are blocked, which need my decision, how much value is at stake across the portfolio, and what my team should do next.

**Default program sponsor reaction on a specific program detail:**
> Nexus understands this program is in Phase 3 Diagnose, the diagnostic surfaced three contradictions, two are resolved, one needs my input, and the Phase 4 gate depends on me scheduling the design touchpoint next week.

**Default consultant-level user reaction on program detail:**
> I see every deliverable, its tier, its citations, its confidence, and what needs work before the next phase gate.

Programs must feel like a transformation command center. Agent-led. Workflow-aware. Stage-and-gate disciplined. Value-linked.

### Source

**Default CIO reaction on Source dashboard:**
> I see all active sourcing events across my portfolio, which are waiting on vendor, which are waiting on internal decision, which are at risk, which value decisions are coming up, and which have stalled and need escalation.

**Default sourcing lead reaction on a specific sourcing event (Nexus Engagement Canvas):**
> Nexus knows this event is an AMS Strategic Sourcing in Scope phase, missing application inventory and ticket volume data, three vendors are on the shortlist, the scorecard is drafted but not locked, and the Phase 4 gate is blocked on sponsor decision about retained organization.

**Default procurement leader reaction on event canvas:**
> I can see the gate enforcement, the approval audit trail, the scorecard lock state, and whether the process is fair enough to defend at contract committee.

Source must feel like an AI sourcing lead managing a complex vendor decision. Not a procurement portal. Not a generic RFP bot.

### Intelligence

**Default transformation executive reaction on Intelligence library landing:**
> Sentinel knows what patterns we have, which are at expert tier, which have the most observations, which are being most cited in current programs, and which the library recommends exploring based on my current work.

**Default user reaction on a pattern detail page:**
> I see the pattern's thesis, its detection signals, its interventions with evidence, its observation record from real deployments, and the other patterns and programs this one connects to.

**Default CIO reaction asking a library question:**
> Sentinel finds the applicable patterns, cites specific sections, distinguishes pattern-level guidance from measured outcomes, and surfaces contradictions rather than flattening them.

Intelligence must feel like rigorous research reasoning. Not search results. Not a static documentation site.

### Control Tower

**Default CIO reaction on Tower landing:**
> Atlas tells me the three pressures that matter most right now with specific dollar amounts, names the decision each one implies, and lets me drill into the underlying program or sourcing event with one click.

**Default CFO reaction on Tower:**
> I see projected value across the portfolio, realized value where measurement has completed, variance with attribution, and which investments are underperforming their business cases.

**Default board-member-level reaction (during a prep session):**
> Atlas generates a steering committee summary on demand — concise, decision-oriented, defensible, with evidence trail.

Control Tower must feel like executive situational awareness. Not a dashboard graveyard. Not a report generator.

### Setup/Admin

**Default platform admin reaction on Admin landing:**
> Steward tells me which connectors are healthy, which audit records are overdue, which users are waiting on provisioning, and which pattern library content has staleness flags — in priority order with specific actions.

**Default compliance reviewer reaction:**
> I see the audit trail, the retention status, the access controls, and the evidence that the platform is enforcing the policies we configured.

**Default tenant admin reaction on role management:**
> I can configure who sees what, approve pending access requests, review recent permission changes, and trust that Steward will enforce what I set.

Setup/Admin must feel like system intelligence configuration. Not a bland settings area.

## Compositional rules that apply across all five surfaces

These rules govern how surfaces compose. Violations are design failures.

**Rule 1 — Agent editorial leads every surface.**

The first substantive content on every surface is an agent-authored synthesis. Not a metric grid. Not a KPI strip. Not a welcome banner. An agent-composed editorial block that answers "what matters right now."

**Rule 2 — Evidence renders below editorial, not above it.**

Metrics, tables, deliverable grids, pattern catalogs, vendor lists — all evidence, all supporting the editorial. They render after the editorial, not before. Users who need detail find it below the synthesis.

**Rule 3 — Every editorial block names what the agent knows.**

Agent editorial must include either "context used" indicators (what data the agent synthesized from) or explicit confidence qualifiers (HIGH/MEDIUM/LOW) or both. The editorial is not a magic oracle; it is a transparent synthesis.

**Rule 4 — Five-question test applies to every surface.**

Where am I? What matters right now? What is blocked or at risk? What does the agent recommend? What should I do next? Every surface answers these five questions within three seconds of landing. Surfaces that do not answer all five are incomplete.

**Rule 5 — Handoffs between agents are explicit.**

When Nexus hands to Sentinel for evidence validation, the handoff is visible in the UI. When Atlas hands to a specific program for drill-in, the handoff is visible. Silent cross-agent participation is a violation.

**Rule 6 — Three choices plus custom after every substantive agent response.**

No blank-prompt dead-ends. Every agent response closes with three context-generated suggested actions plus a "Ask something else" custom option. See document 05 for specifics.

**Rule 7 — File attachment is a first-class context event.**

Users upload files to ingest context, not to attach to messages. Files classify, parse, extract structured evidence, attach to work objects. See document 05 for specifics.

**Rule 8 — Progressive disclosure.**

Every surface answers the five questions above without scroll. Detail lives in drawers, drill-ins, expandable sections. Users who need depth find it; users who need orientation get it immediately.

**Rule 9 — Governance is visible, not buried.**

Gate states, approval audit trails, rationale on material changes, lock states, review status — all visible in-surface, not hidden in settings. Governance is a primary experience, not a compliance feature.

**Rule 10 — Value linkage is persistent.**

Every program, every sourcing event displays projected value and (where measured) realized value. Value Ledger is not a separate surface users must visit; it is a component that renders on every workflow surface.

## The five-question test applied per surface

Example of the five-question test applied to each surface. These examples are illustrative, not prescriptive. The design must produce answers to these questions; the specific prose is the designer's craft.

### Programs (on a specific program detail page)

1. **Where am I?** Meridian Health · Ambient Clinical Value Chain Activation · MRD-01 · Phase 3 Diagnose
2. **What matters right now?** Diagnostic surfaced three contradictions; two resolved; one open on payer mix assumption
3. **What is blocked or at risk?** Phase 4 gate requires CXO touchpoint 2 not yet scheduled
4. **What does the agent recommend?** Nexus: "Schedule touchpoint 2 with Dr. Chen by next Thursday to hold Phase 4 start date"
5. **What should I do next?** Click "Schedule touchpoint" or "Explain the payer mix contradiction first"

### Source (on a specific sourcing event canvas)

1. **Where am I?** Meridian Health · AMS Strategic Sourcing · SRC-001 · Scope stage
2. **What matters right now?** Application inventory received; ticket volume data missing; retained org assumption undecided
3. **What is blocked or at risk?** Sourcing Strategy gate blocked on missing ticket volume data
4. **What does the agent recommend?** Nexus: "Request ticket volume from ServiceNow integration; confirm retained org assumption with Priya by Wednesday"
5. **What should I do next?** Click "Request ticket volume" or "Draft sourcing strategy options with current information"

### Intelligence (on library landing)

1. **Where am I?** AbarVa Intelligence · Pattern Library · Meridian tenant view
2. **What matters right now?** M1-M6 meta-patterns locked; T3-H01 Ambient Clinical near expert tier; T1-02 Vendor Sprawl in draft
3. **What is blocked or at risk?** Three patterns cited frequently this week that need depth revisions
4. **What does the agent recommend?** Sentinel: "T3-H01 Ambient Clinical is most-cited this week; its depth refresh is scheduled for next authoring cycle"
5. **What should I do next?** Click "Explore Ambient Clinical pattern" or "Browse recently-cited patterns"

### Control Tower

1. **Where am I?** Meridian Health · Control Tower · portfolio view
2. **What matters right now?** Three pressures totaling $3.1M/mo unowned; ambient documentation overlap at $522K/mo with clear rationalization path
3. **What is blocked or at risk?** AI cloud spend trajectory will hit CFO review in 30 days without guardrails
4. **What does the agent recommend?** Atlas: "Address the ambient overlap first — cleanest decision; then tackle the governance gap before cloud spend escalates"
5. **What should I do next?** Click "Open ambient overlap" or "Draft governance proposal"

### Setup/Admin

1. **Where am I?** AbarVa Admin · platform state
2. **What matters right now?** Three connectors degraded; one audit record stale >30 days; two user provisioning requests pending
3. **What is blocked or at risk?** ServiceNow connector degraded for 4 hours; ticket volume data not flowing to active programs
4. **What does the agent recommend?** Steward: "Fix ServiceNow connector first; it's blocking two active sourcing events"
5. **What should I do next?** Click "Open ServiceNow connector status" or "Approve pending user access"

## Success criteria for this document

This document succeeds when:

1. A designer or engineer reading it can build a new surface without drifting toward generic-dashboard or generic-chat failure modes
2. A crawler persona (document 06) walking any AbarVa surface produces the ideal reaction language above
3. Every surface audit checks against the five-question test
4. Every implementation slice can trace its justification to one or more principles in this document
5. When founder reads a surface's wireframe, the wireframe reflects this North Star rather than contradicting it


## GPT refinement addendum · North Star sharpening

The current North Star is strong. The refinement is to make the **agent-centric promise** measurable. AbarVa should not merely look like an intelligent platform; it must behave as if each page is being actively managed by a domain-aware expert agent.

### The platform promise in operational terms

AbarVa wins if users believe three things within the first minute of using any page:

1. **The system knows where I am.** It understands the surface, work object, stage, status, and business context.
2. **The system knows what matters.** It identifies risk, missing inputs, evidence gaps, value at stake, and the next decision.
3. **The system can help me move.** It recommends concrete next actions, not generic advice.

If any page fails these three reactions, it is not yet agent-centric.

### Product-level North Star behavior

Every surface should feel like a live operating environment rather than a static page:

- Programs should feel like Nexus and Steward are helping run the transformation.
- Source should feel like Nexus is running the sourcing event and Sentinel is guarding rigor.
- Intelligence should feel like Sentinel is curating patterns, evidence, and contradictions.
- Control Tower should feel like Atlas is surfacing executive pressure and decision needs.
- Setup/Admin should feel like Steward is protecting tenant integrity, connector health, and governance.

### Key product requirements implied by the North Star

The following should become platform-wide requirements:

1. **Agent rail or agent presence on every major work surface** — even if compact, the agent owner must be visible or accessible.
2. **Context strip on every work-object page** — surface, object, stage/status, owner, risk, and next action should be visible above the fold.
3. **Work-object memory** — page behavior should depend on the specific program, sourcing event, pattern, tenant, uploaded files, and prior turns.
4. **Guided actions** — the platform should provide suggested actions before asking users to invent prompts.
5. **Evidence posture** — claims should identify whether they are based on event data, uploaded files, pattern guidance, or inference.
6. **Value posture** — every major initiative should connect to projected value, realized value, or explicit value unknowns.

### Definition of a kick-ass product

AbarVa should be considered high quality only if a senior enterprise user says:

> "This is not another dashboard. It feels like the system understands the work and is helping me make the next decision."

The product should feel premium because it reduces ambiguity, not because it adds visual polish. Design excellence must come from clarity, context, confidence, and motion.

### Practical product priorities

For the next build cycles, prioritize in this order:

1. Context-aware agent behavior
2. Page-level decision clarity
3. Workflow state and gates
4. Evidence/citation display
5. Suggested actions
6. Artifact and value outputs
7. Visual polish

Visual polish before context awareness will create a beautiful but hollow product. Context awareness before visual polish creates a credible product that can be refined.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with markups
2. Revisions integrated
3. Cross-check against document 00 for consistency
4. Cross-check against framework section 2 (North Star Vision), section 3 (Core Design Principles), section 8 (Page-Level Product Vision)
5. Explicit founder sign-off

No implementation proceeds against this document until AUTHORED-LOCKED.
