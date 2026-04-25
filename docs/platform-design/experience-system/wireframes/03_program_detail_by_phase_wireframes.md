# Program Detail by Phase Wireframes

## Purpose

Define the program workbench layout for every phase.

## Primary User Question

Where is this program in the journey, what is required now, and what should happen next?

## Shared Layout

```text
Top nav
Context strip: program, sponsor, value, current phase, owner
Horizontal journey map
Left phase requirements rail
Primary workspace: Nexus phase brief, deliverables, decisions, blockers
Right agent panel: Nexus with Steward/Sentinel participation when needed
Drawer: artifact/evidence/detail inspector
```

## Phase Wireframes

### Origination

- Journey position: Origination active; all future phases subdued.
- Goal: identify opportunity and executive intent.
- Required inputs: sponsor, business problem, value hypothesis.
- Artifacts: opportunity note, initial value thesis.
- Risks: unclear executive owner, weak value thesis, duplicate initiative.
- Agent guidance: Nexus clarifies whether this is a real program.
- Suggested actions: clarify objective, draft opportunity note, identify sponsor, ask something else.
- Data shown: sponsor, business problem, value hypothesis, related patterns.
- Must not show: detailed execution plan before charter exists.

### Charter

- Journey position: Charter active; Origination complete or waived.
- Goal: lock scope, outcomes, governance, and funding.
- Required inputs: sponsor, stakeholders, objectives, decision rights.
- Artifacts: charter, governance map, value baseline request.
- Risks: unclear decision rights, missing funding, undefined value baseline.
- Approvals: sponsor and program owner.
- Agent guidance: Nexus explains charter readiness; Steward flags governance gaps.
- Suggested actions: show charter gaps, draft governance map, request sponsor approval, ask something else.
- Data shown: objectives, stakeholders, value baseline request, approvals.
- Must not show: verify-ready value claims.

### Diagnose

- Journey position: Diagnose active; Charter approved.
- Goal: understand current state, evidence, risks, and constraints.
- Required inputs: system/process data, stakeholder interviews, evidence.
- Artifacts: diagnosis brief, risk map, baseline.
- Risks: stale evidence, incomplete current state, contradiction across sources.
- Sentinel role: evidence adequacy and contradiction detection.
- Agent guidance: Nexus frames diagnosis; Sentinel explains evidence quality.
- Suggested actions: show missing evidence, summarize diagnosis, flag contradictions, ask something else.
- Data shown: current-state facts, baseline, evidence readiness, risks.

### Design

- Journey position: Design active; Diagnose evidence accepted or gaps waived.
- Goal: define future state, roadmap, and operating model.
- Required inputs: target architecture, prioritized initiatives, dependencies.
- Artifacts: roadmap, business case, operating model.
- Risks: dependency conflicts, value overclaim, future state not linked to evidence.
- Nexus role: sequence work and expose tradeoffs.
- Agent guidance: Nexus recommends sequencing and design tradeoffs.
- Suggested actions: show roadmap risks, draft business case, compare options, ask something else.
- Data shown: target state, initiatives, dependencies, value case.

### Execute

- Journey position: Execute active; Design approved.
- Goal: run delivery and manage risk.
- Required inputs: workplan, owners, milestones, status, decisions.
- Artifacts: execution plan, decision log, risk register.
- Risks: unowned milestone, blocked decision, unmanaged risk.
- Steward role: gate integrity and governance.
- Agent guidance: Nexus identifies execution pressure; Steward enforces gates.
- Suggested actions: show blocked decisions, assign owners, update risk register, ask something else.
- Data shown: milestones, owners, risks, decision log, value drift.

### Verify

- Journey position: Verify active; Execute complete or in measurement window.
- Goal: prove value and close the loop.
- Required inputs: measured outcomes, evidence, owner, baseline.
- Artifacts: value realization report, lessons learned, closure memo.
- Risks: no measurement owner, missing evidence, projected value not reconciled.
- Approvals: sponsor/value owner signoff.
- Agent guidance: Nexus distinguishes projected, measured, and realized value.
- Suggested actions: show value gaps, request evidence, prepare closure brief, ask something else.
- Data shown: baseline, actuals, evidence, owner, reconciliation.
- Must not show: realized value without measurement evidence.

## Empty / Loading / Error States

Each phase must define missing inputs, show a loading skeleton, and surface data failure plainly.

## Responsive Behavior

Journey stays visible as a compact strip. Agent panel collapses to drawer.

## Acceptance Criteria

- Current phase is obvious.
- Blockers and required inputs are visible.
- Nexus guidance is tied to the current phase.
