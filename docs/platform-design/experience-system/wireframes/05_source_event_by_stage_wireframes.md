# Source Event by Stage Wireframes

## Purpose

Define Source event workbench behavior by sourcing stage.

## Primary User Question

Where is this sourcing event in the journey, what is required now, what is blocked, and what should Nexus guide next?

## Above-the-Fold Layout

The first viewport should show event context, stage journey position, Nexus stage guidance, required inputs, top risks, and the primary next action.

## Shared Layout

```text
Top nav
Context strip: event, account, archetype, rigor, owner, value
Horizontal stage journey map
Left stage requirements rail
Primary workspace: Nexus stage brief, required inputs, artifacts, risks
Right agent panel: Nexus, Sentinel, Steward participation
Drawer: artifact, scorecard, evidence, approval detail
```

## Table / Card Behavior

Use tables for vendor responses, scorecards, artifacts, approvals, and value ledger detail. Use cards only for command read, current-stage pressure, and short readiness summaries.

## What Opens in Drawer

Artifacts, scorecard criteria, evidence/citations, approval route, vendor response detail, and value ledger evidence open in drawers.

## Stages

### Strategy

- Journey position: Strategy active; future stages subdued.
- Goal: define sourcing model and value thesis.
- Required inputs: spend, incumbent, business goals, risk level.
- Artifacts: sourcing strategy memo.
- Risks: wrong sourcing model, unclear value thesis, missing market context.
- Approvals: sourcing lead and procurement.
- Nexus guidance: recommend sourcing approach and identify missing strategy inputs.
- Suggested actions: show strategy gaps, draft sourcing strategy memo, compare sourcing models, ask something else.
- Data shown: spend, incumbent, archetype, value hypothesis, risk level.
- Must not show: RFP release actions.

### Scope

- Journey position: Scope active; Strategy complete or explicitly waived.
- Goal: finalize scope and required inputs.
- Required inputs: scope, baseline, stakeholders, constraints.
- Artifacts: scope document, requirement outline.
- Risks: missing baseline, unclear ownership.
- Approvals: sourcing lead and business sponsor when required.
- Nexus guidance: what must be completed before RFP.
- Suggested actions: show missing inputs, generate minimum data request, explain scope readiness, ask something else.
- Data shown: scope status, baseline status, owner, aging, blockers.
- Must not show: release-ready RFP if baseline or scope is incomplete.

### RFP

- Journey position: RFP active; Scope approved or waived.
- Goal: prepare release package.
- Required inputs: approved scope, vendor list, pricing template, scorecard.
- Artifacts: RFP/RFI package, pricing workbook, Q&A protocol.
- Risks: incomplete pricing template, unlocked scorecard, missing approval route.
- Approvals: procurement, legal/security when required.
- Nexus guidance: explain whether a Rich, Outline, or Stub artifact is possible.
- Suggested actions: show release blockers, draft outline package, review approval path, ask something else.
- Data shown: artifact state, approval state, scorecard lock state, vendor list.
- Must not show: issue/release until approved and locked.

### Vendor Responses

- Journey position: Vendor Responses active; RFP package issued.
- Goal: track response completeness and normalize submissions.
- Required inputs: vendor files, pricing, exceptions, Q&A.
- Artifacts: response tracker, normalization log.
- Risks: missing pricing, uncited uploads, late responses, unnormalized exceptions.
- Approvals: exceptions reviewed when required.
- Nexus guidance: identify incomplete responses and next vendor action.
- Sentinel role: identify missing or uncitable evidence.
- Suggested actions: show incomplete responses, draft vendor reminder, flag event at risk, ask something else.
- Data shown: vendor response status, parse status, pricing completeness, exceptions.
- Must not show: evaluation-ready state if responses or pricing are incomplete.

### Evaluation

- Journey position: Evaluation active; Vendor Responses complete or exceptions approved.
- Goal: score vendors using governed criteria.
- Required inputs: locked scorecard, responses, pricing normalization.
- Artifacts: scorecard, exception log, evaluation memo.
- Risks: unlocked criteria, scoring drift, missing evidence, pricing apples-to-oranges.
- Approvals: evaluation governance and selection-readiness review.
- Nexus guidance: explain leading vendor only when evidence and scorecard state support it.
- Suggested actions: show default weights, explain tradeoffs, add override rationale, ask something else.
- Data shown: vendor scores, criteria weights, evidence gaps, pricing normalization.
- Must not show: selection recommendation without complete scoring.

### Negotiation

- Journey position: Negotiation active; Evaluation complete.
- Goal: manage BAFO, commercial movement, and risk.
- Required inputs: negotiation goals, pricing deltas, legal/security exceptions.
- Artifacts: negotiation tracker, BAFO summary.
- Risks: unresolved legal terms, commercial leakage, unmanaged concessions.
- Approvals: procurement, legal, finance, sponsor as required by rigor.
- Nexus guidance: recommend negotiation focus and unresolved decision points.
- Suggested actions: show open concessions, draft BAFO request, summarize risk tradeoffs, ask something else.
- Data shown: BAFO status, pricing deltas, concessions, exception owners.
- Must not show: final selection without decision package readiness.

### Transition

- Journey position: Transition active; vendor selected.
- Goal: prepare mobilization and handoff.
- Required inputs: selected vendor, contract status, mobilization plan.
- Artifacts: mobilization checklist, transition plan.
- Risks: unclear service handoff, missing ownership, contract/mobilization gap.
- Approvals: business sponsor and transition owner.
- Nexus guidance: identify handoff readiness and mobilization blockers.
- Suggested actions: show mobilization gaps, draft transition checklist, assign owners, ask something else.
- Data shown: selected vendor, contract state, owner map, mobilization milestones.
- Must not show: value realization complete before measurement begins.

### Verify / Value Realization

- Journey position: Verify active; Transition complete or in measurement window.
- Goal: measure realized value.
- Required inputs: measurement owner, evidence, baseline, actuals.
- Artifacts: value realization report.
- Risks: projected value not baselined, no measurement owner, no evidence.
- Approvals: finance/value owner signoff.
- Nexus guidance: distinguish projected, baselined, measured, and realized value.
- Suggested actions: show value gaps, request measurement evidence, prepare value brief, ask something else.
- Data shown: projected value, baseline, actuals, evidence, owner, reconciliation.
- Must not show: realized value without evidence.

## Responsive Behavior

Stage map becomes compact strip. Requirements rail moves above workspace. Agent panel becomes drawer.

## Empty / Loading / Error States

- Empty: show stage purpose, required inputs, and first setup action.
- Loading: show context strip, journey skeleton, and disabled stage actions.
- Error: explain which stage context failed to load and prevent unsafe actions.

## Acceptance Criteria

- Current stage is obvious.
- Required inputs, artifacts, risks, approvals, Nexus guidance, and suggested actions are visible.
- Unsafe future actions are disabled or explained.
