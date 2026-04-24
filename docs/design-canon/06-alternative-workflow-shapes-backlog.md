# File 06 · Alternative Workflow Shapes Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Claude Code primary, with pattern library work from File 02
**References:** File 01 failure modes, File 02 patterns, File 05 workflow mechanics

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`.

**Applies:** Agent Autonomy Charter. Pre-decided items in prior files.

---

## Section 1 · Architectural premise

The default five-phase workflow (Intake → Diagnosis → Decision → Execution → Outcome) handles transformation-style programs well — margin recovery, ambient clinical rollout, platform modernization, fraud detection deployment. It handles them because they share a common shape: diagnose the problem, design the solution, execute the change, measure the outcome.

But a meaningful class of enterprise programs has a different shape. Vendor selection is sequential and procedural, not parallel and analytical. Crisis response is reactive and time-bounded, not reflective. Regulatory response is compliance-driven with specific artifacts required at specific gates. Procurement has its own stages that don't map to transformation phases.

The product must support these alternative shapes credibly. Without them, AbarVa is limited to "we help with the easier phases of transformation and hand off the procedural work to your existing tools." That's a meaningful limitation on the moat claim.

**The mechanism: pattern-driven workflow routing.** Each pattern in the library declares its workflow type. Most patterns route to the default five-phase workflow. Specific patterns route to alternative workflow shapes. The intake flow matches the user's problem to a pattern; the pattern's execution contract determines which workflow shape the program enters.

This file specifies: the alternative workflow shapes needed, the archetype extensions, the pattern-driven routing logic, and the priority sequencing for which alternatives to build when.

---

## Section 2 · Why the default five-phase isn't universal

### 2.1 · The shape of transformation work

Transformation programs have a recognizable rhythm:
- **Intake** establishes scope and sponsor
- **Diagnosis** surfaces root causes with evidence
- **Decision** chooses among options with trade-off analysis
- **Execution** delivers change via parallel workstreams
- **Outcome** measures realized value

The phases are sequential but the work within each phase is often parallel. Multiple hypotheses tested simultaneously in Phase 2. Multiple interventions executed simultaneously in Phase 4. Diagnostic rigor matters; execution velocity matters; outcome attribution matters.

### 2.2 · Where this shape breaks down

**Vendor selection.** The work is procedural — RFP drafting, issuance, vendor response, scoring, shortlist, negotiation, contract drafting, legal review, signature, transition. Each step is sequential and gates the next. Each has specific artifacts (RFP document, scorecard, term sheet, redline). Each has specific stakeholders (procurement lead, legal, incumbent vendor, candidate vendors). The "phases" here are named differently: Requirements, Market Engagement, Evaluation, Negotiation, Contracting, Transition. Different rhythm, different deliverables, different gates.

**Crisis response.** Time-bounded. Often externally triggered (incident, regulatory notice, public event). Phases compress or overlap. Diagnosis happens under pressure. Decisions happen fast. Execution may precede full analysis. The governance model is different — who decides, who acts, who communicates.

**Regulatory response.** Externally driven by a specific rule or framework. Required artifacts are specific (policy document, evidence compilation, attestation). Timeline is externally set. Content is compliance-focused rather than transformation-focused.

**Procurement.** Similar to vendor selection but focused on recurring purchases, contract renewals, portfolio rationalization rather than new vendor addition.

**M&A integration.** Merger or acquisition integration has its own shape — Day 1 readiness, functional integration workstreams, synergy realization, organizational alignment, cultural integration.

### 2.3 · What they share with the default

Even with different shapes, all workflows share:
- Pattern-driven intelligence (the relevant patterns for the specific workflow type)
- Knowledge layer retrieval on every agent turn
- Four-zone structure (Tower, Admin, Programs, Intelligence)
- Integrity disciplines (composite disclaimers, provenance, audit)
- Human-layer integration
- Upload and ingestion
- User provisioning, approvals, notifications, tasks

What differs:
- Phase structure and gates
- Deliverable set
- Pattern archetype that drives the workflow
- Agent voice nuances for the workflow type
- Success criteria for phase transitions

---

## Section 3 · Archetype extension

### 3.1 · Current five archetypes

The default workflow accommodates five archetypes, each with slightly different emphasis on the five phases:

1. **Strategic Transformation (ST)** — business-level transformation with executive sponsorship
2. **Workflow Automation (WA)** — process-level automation
3. **Platform Modernization (PM)** — technical stack transformation
4. **AI Product / Copilot Enablement (AP)** — product development for AI capabilities
5. **Operational Optimization (OO)** — cost/performance optimization

All five use the default five-phase workflow with variations in emphasis.

### 3.2 · New archetypes requiring alternative workflow shapes

**Vendor Selection (VS)** — procedural vendor sourcing and contracting
**Procurement Optimization (PO)** — portfolio-level vendor rationalization, similar stages to VS
**Crisis Response (CR)** — reactive, time-compressed
**Regulatory Response (RR)** — compliance-driven, artifact-specific
**M&A Integration (MA)** — merger or acquisition integration

### 3.3 · Total archetypes

After extension: 10 archetypes. Five use the default five-phase workflow. Five use alternative workflow shapes specific to their type.

Intake classifies the proposed program into one archetype based on pattern match. Archetype determines workflow shape.

---

## Section 4 · Vendor Selection workflow

### 4.1 · When this workflow activates

Pattern matches include: IT AMS Vendor Optimization, Vendor Sprawl & AI Tool Rationalization (if in active sourcing mode), any Tier 3 use-case pattern that specifies vendor-selection routing in its execution contract.

### 4.2 · Phase structure

**Phase VS-1 · Requirements Definition**
- Scope the need (what are we buying, for whom, what outcomes)
- Stakeholder alignment on requirements (avoids Mode 4 failure at procurement)
- Market landscape (what vendors exist, incumbent analysis)
- Evaluation criteria with weighting
- Go/no-go decision on market engagement

Deliverables: Requirements Document, Stakeholder Alignment Summary, Evaluation Framework, Market Landscape Analysis.

**Phase VS-2 · Market Engagement**
- RFP drafting (pattern-driven scaffolding)
- Vendor shortlist
- RFP issuance
- Q&A management
- Response receipt

Deliverables: RFP Document, Vendor Shortlist with rationale, Q&A Log, Response Inventory.

**Phase VS-3 · Evaluation**
- Scorecard application
- Vendor demos and interviews
- Reference checks
- Risk assessment per vendor
- Shortlist to finalist(s)

Deliverables: Scorecard Outputs, Demo Evaluations, Reference Check Summary, Finalist Recommendation.

**Phase VS-4 · Negotiation**
- Term sheet development
- Negotiation (pattern-backed intelligence on levers)
- Contract drafting (legal collaboration)
- Redline cycles
- Final terms

Deliverables: Term Sheet, Negotiation Log, Contract Draft, Redline History, Final Contract.

**Phase VS-5 · Contracting and Transition**
- Signature workflow
- Transition planning (if replacing incumbent)
- Onboarding and integration
- Hand-off to operational phase

Deliverables: Signed Contract, Transition Plan, Onboarding Runbook, Operational Hand-off.

### 4.3 · Deliverable shapes distinct from transformation

**Requirements Document** — structured capability requirements with weighting, success criteria, must-have vs. nice-to-have, dealbreakers.

**RFP Document** — industry-standard sections (introduction, scope, requirements, response format, evaluation criteria, timeline, Ts&Cs). Pattern-driven scaffolding based on vendor category.

**Scorecard** — evaluation matrix with weighted criteria, per-vendor scores, rationale per score, defensible audit trail.

**Term Sheet** — commercial terms (pricing model, SLA tiers, service scope), legal terms (liability, IP, data, termination), operational terms (governance, reporting).

**Contract Redline History** — version-controlled redlines with change history, approval per redline cycle, audit trail.

### 4.4 · Agent behavior in this workflow

Nexus adapts: less "maestro-collegial diagnostic" voice, more "procurement-partner" voice. Still thoughtful, still pattern-backed, but oriented to procedural rigor rather than analytical depth.

Pattern backing specifically for vendor selection includes: vendor-specific intelligence (strengths, weaknesses, pricing patterns, common contract gotchas per vendor category), negotiation playbooks, RFP language patterns.

### 4.5 · Pause and resume support

Vendor selection often pauses between phases (while vendors respond to RFP, during legal review, etc.). The workflow supports extended pauses with named reasons and clear resume triggers.

### 4.6 · Current state

Missing entirely. No vendor selection workflow exists. Status: **NEW-WORK** for the full workflow shape.

### 4.7 · Gaps with priority

- [P1 seed-critical] Vendor Selection archetype added to intake classification
- [P1 seed-critical] Five-phase Vendor Selection workflow structure
- [P1 seed-critical] Phase-specific deliverables scaffolded at Outline tier minimum
- [P1 seed-critical] Pattern backing: Vendor Evaluation Framework (T2-05 from File 02), IT AMS Vendor Optimization (new Tier 3 pattern)
- [P2 Series A] Rich deliverable tier for RFP Document, Term Sheet, Contract Redline (these are high-value artifacts)
- [P2 Series A] Negotiation playbook depth
- [P2 Series A] Industry-specific RFP patterns

**Not demo-critical.** Morrison and Ambient are transformation programs, not vendor selection. Demo narrative can include vendor-selection workflow as "we also do this" without full implementation. Seed-critical because commercially common.

---

## Section 5 · Procurement Optimization workflow

### 5.1 · Relationship to Vendor Selection

Similar stages but focused on existing portfolio rather than net-new acquisition. Often the right workflow for "rationalize our AMS vendor spend across 14 vendors."

### 5.2 · Phase structure

**Phase PO-1 · Portfolio Baseline**
- Current vendor inventory with spend, contract terms, renewal dates
- Utilization analysis
- Strategic value assessment per vendor
- Redundancy and overlap identification

**Phase PO-2 · Strategy Definition**
- Target portfolio shape (consolidate to N vendors? Tier vendors?)
- Rationalization priorities
- Retention, renegotiation, replacement decisions per vendor
- Sequencing plan

**Phase PO-3 · Execution**
- For retained vendors: renewal negotiations (may use Vendor Selection sub-workflow)
- For renegotiated vendors: term updates, SLA refreshes
- For replaced vendors: RFP process (triggers Vendor Selection sub-workflow)
- For canceled vendors: termination and transition

**Phase PO-4 · Transition and Stabilization**
- New vendor onboarding
- Incumbent phase-out
- Portfolio governance establishment

**Phase PO-5 · Ongoing Management**
- Portfolio health monitoring
- Renewal cadence discipline
- Continuous rationalization

### 5.3 · Unique characteristics

Sub-workflows: individual vendor decisions within a portfolio optimization may trigger Vendor Selection workflow as a nested program.

Portfolio-level view in Tower: the portfolio rationalization program surfaces in Control Tower with explicit before/after vendor count, spend trajectory, realized savings.

### 5.4 · Current state and gaps

Missing. Status: **NEW-WORK**.

Priority: P2 Series A. Not seed-critical unless a specific design partner needs it.

---

## Section 6 · Crisis Response workflow

### 6.1 · When this activates

Triggered by external event — security incident, AI ethics incident, regulatory notice, public embarrassment, executive-mandated investigation. Time-compressed. High stakes.

### 6.2 · Phase structure

**Phase CR-1 · Situation Assessment** (hours to 1 day)
- Incident characterization
- Scope assessment
- Stakeholder notification (internal, external, regulatory as required)
- Initial response team assembled

**Phase CR-2 · Containment** (day 1-3)
- Immediate actions to stop harm / stabilize
- Communications plan
- Legal and compliance engagement

**Phase CR-3 · Investigation** (days 3-14)
- Root cause analysis
- Impact assessment
- Culpability/responsibility analysis
- Recommendations for remediation

**Phase CR-4 · Remediation** (days 14-90)
- Specific corrective actions
- System/process changes
- Training or policy updates
- Communication follow-through

**Phase CR-5 · Post-Incident Review** (after remediation)
- Full after-action review
- Lessons learned
- Pattern library contribution (anonymized)
- Preventive pattern refinement

### 6.3 · Unique characteristics

Time-compressed. Phase transitions can happen in hours rather than weeks.

Agent voice: crisis-appropriate. Atlas especially — concise, action-oriented, no decorative content.

Stakeholder structure different: crisis response team rather than traditional program structure. CEO, legal, communications, relevant technical leads.

Integrity discipline heightened: everything logged, audit trail impeccable, legal review explicit.

### 6.4 · Current state and gaps

Missing. Status: **NEW-WORK**.

Priority: P3 post-Series A. Not in seed scope unless a high-profile design partner has imminent crisis response need.

---

## Section 7 · Regulatory Response workflow

### 7.1 · When this activates

Triggered by specific regulatory requirement — new rule issuance requiring compliance response, audit notification, regulatory inquiry. Content is compliance-focused.

### 7.2 · Phase structure

**Phase RR-1 · Requirement Analysis**
- Specific regulation and its requirements
- Applicability assessment (does this apply to us?)
- Impact assessment across organization
- Compliance gap identification

**Phase RR-2 · Response Planning**
- Required artifacts (policies, evidence, attestations)
- Ownership assignment
- Timeline (externally set)
- Resource allocation

**Phase RR-3 · Evidence Compilation**
- Document current state relevant to requirement
- Gather historical evidence where required
- Conduct assessments if new evidence needed
- Curate evidence for submission

**Phase RR-4 · Submission**
- Compile submission package
- Legal review
- Submit to regulator
- Respond to follow-up inquiries

**Phase RR-5 · Ongoing Compliance**
- Ongoing evidence maintenance
- Periodic re-attestation
- Pattern contribution to regulatory posture intelligence

### 7.3 · Unique characteristics

Pattern backing from Regulatory Posture content in Tower zone. AI Governance Operating Model pattern provides structure.

Externally-bounded timeline: the regulator's timeline is the timeline. Product must accommodate external deadlines as hard constraints.

Audit discipline: every piece of evidence tracked with provenance to original source.

### 7.4 · Current state and gaps

Missing. Status: **NEW-WORK**.

Priority: P2 Series A. Enterprise buyers frequently have regulatory response needs; this is commercially useful within year 1 post-seed.

---

## Section 8 · M&A Integration workflow

### 8.1 · When this activates

Merger or acquisition closing. Integration planning and execution.

### 8.2 · Phase structure

**Phase MA-1 · Day 1 Readiness**
- Legal, compliance, HR minimum-viable integration
- Communications to employees and customers
- Critical systems continuity

**Phase MA-2 · Functional Integration**
- Parallel workstreams per function (Finance, HR, IT, Operations, Sales, Marketing)
- Systems migration planning
- Process harmonization
- Organizational structure

**Phase MA-3 · Synergy Realization**
- Cost synergies (consolidation, renegotiation)
- Revenue synergies (cross-sell, expanded footprint)
- Capability synergies (combined strengths)

**Phase MA-4 · Cultural Integration**
- Values alignment
- Leadership model
- Team integration
- Retention of key talent

**Phase MA-5 · Full Integration Validation**
- Synergy realization measurement
- Ongoing operations validation
- Lessons learned
- Transition to BAU

### 8.3 · Unique characteristics

Highly parallel: multiple functional workstreams running simultaneously, each with its own sub-workflow (some may trigger transformation-style sub-programs).

Stakeholder complexity: two organizations' leadership. Political dynamics specific to M&A.

Time pressure: Day 1 is immovable.

### 8.4 · Current state and gaps

Missing. Status: **NEW-WORK**.

Priority: P3 post-Series A. Specialized workflow; not critical for initial enterprise transformation focus.

---

## Section 9 · Pattern-driven workflow routing

### 9.1 · Routing mechanism

Every pattern in the library declares its `workflow_type` in metadata (File 02 Section 7):
- `default-five-phase` (most patterns)
- `vendor-selection` (IT AMS Vendor Optimization and similar)
- `procurement-optimization`
- `crisis-response`
- `regulatory-response`
- `m-and-a-integration`

At intake, after pattern match, the routing logic:

1. User describes problem
2. Intake matches to pattern(s)
3. Primary pattern's workflow_type determines initial workflow shape
4. If ambiguity, user confirms workflow type
5. Program created with appropriate phase structure

### 9.2 · Workflow composition

A program typically uses one workflow shape. But sub-workflows are possible — a Procurement Optimization program may spawn Vendor Selection sub-programs for specific replacements.

Composition is explicit: parent program tracks sub-programs, sub-programs inherit relevant context from parent.

### 9.3 · Workflow migration

Rarely, a program's shape needs to change mid-stream. User-initiated with clear rationale. System migrates state to new workflow, preserving relevant content. Audit logged.

### 9.4 · Current state and gaps

Pattern metadata schema includes `workflow_type` field (File 02). Routing logic not yet implemented. Status: **NEW-WORK**.

---

## Section 10 · Demo-scope considerations

### 10.1 · What the demo shows

Morrison and Ambient use the default five-phase workflow. The demo walks Prat through those programs primarily.

The vendor-optimization example (as surfaced in conversation during design discussions) is a powerful demo moment to *show* rather than implement:

- Prat asks hypothetically "can AbarVa handle our AMS vendor optimization?"
- Demo response: "yes, and here's how that would look — same knowledge layer, same agent roster, different workflow shape because vendor selection is procedural not transformational."
- Walk through the Vendor Selection phase structure conceptually, showing the phase tiles, the deliverable set, the pattern backing.
- Narrative: "this is the moat — the product knows when to pivot workflow shape based on the pattern match. The alternative workflow uses the same architecture; it's just a different composition."

This demonstrates breadth without requiring full implementation. Honest about current state (Morrison and Ambient are what we've built; Vendor Selection is on the near roadmap) while showing the architectural capability that justifies the moat claim.

### 10.2 · What the demo doesn't show

Crisis Response and M&A Integration are too specialized to include in the near roadmap narrative. They exist in this backlog as future-state but aren't part of seed-raise positioning.

Regulatory Response can be mentioned as adjacent to the Tower's Regulatory Posture capability — not a separate workflow demonstrated, but a capability area the Tower already surfaces.

---

## Section 11 · Priority sequencing

### P0 — Demo-critical

No alternative workflows implemented. Default five-phase workflow suffices for Morrison and Ambient. Demo narrative *shows* Vendor Selection conceptually without requiring implementation.

Pattern metadata `workflow_type` field populated for all patterns (even if most use default).

### P1 — Seed-critical

Vendor Selection workflow implemented at Outline tier fidelity. Enables the alternative-workflow demo to be more than narrative — users can actually experience the different phase structure and deliverable set.

Pattern-driven routing logic implemented. Intake can route to either default or vendor-selection based on pattern match.

IT AMS Vendor Optimization Tier 3 pattern authored (File 02 P1 item).

### P2 — Series A

Procurement Optimization workflow.
Regulatory Response workflow.
Richer deliverable tiers for Vendor Selection (RFP Document, Term Sheet, Contract Redline at Rich tier).
Sub-workflow composition support.

### P3 — Post-Series A

Crisis Response workflow.
M&A Integration workflow.
Industry-specialized variants of existing workflows.
Workflow migration support.

---

## Section 12 · Acceptance criteria

**For demo:**
- Pattern metadata includes workflow_type field
- Demo narrative credibly explains alternative workflow capability
- Current product handles Morrison and Ambient via default workflow

**For P1 Seed:**
- Vendor Selection workflow available at Outline tier
- Pattern-driven routing works end-to-end: intake matches pattern, determines workflow, creates program with appropriate phases
- At least one Vendor Selection test program runs through all phases

**For P2 Series A:**
- Procurement Optimization and Regulatory Response workflows available
- Rich tier deliverables for vendor-selection high-value artifacts
- Sub-workflow composition functional

---

## Section 13 · Execution discipline

**Ownership:** Claude Code builds workflow shapes; File 02 pattern library work provides the patterns that route to them. Codex supports state model extensions for different phase structures.

**Commit discipline:** Workflow-related PRs reference File 06 sections and relevant pattern IDs.

**Validation:** Each new workflow shape validated by running a test program through all phases end-to-end before declaring complete.

**Integrity:** All alternative workflows inherit disclaimers, provenance, audit discipline from the default workflow.

---

## Section 14 · Pre-decided items

- Default five-phase workflow is default; not all workflows fit it
- Pattern-carries-execution-contract: patterns declare their workflow_type
- Alternative workflows inherit all cross-cutting capabilities (agents, zones, knowledge layer, integrity)
- Workflow routing determined at intake; migration possible but rare
- Vendor Selection is the first alternative workflow to implement (P1)
- Crisis Response and M&A are future-state, not in seed scope

---

## Section 15 · One-line handoff

> Default five-phase workflow handles transformation programs. Alternative workflow shapes needed for Vendor Selection, Procurement Optimization, Crisis Response, Regulatory Response, M&A Integration. Pattern-driven routing via workflow_type metadata. Demo shows alternative capability conceptually; seed implements Vendor Selection at Outline tier; Series A adds Procurement Optimization and Regulatory Response. Apply autonomy charter.

---

*End of File 06 · Alternative Workflow Shapes Backlog.*
