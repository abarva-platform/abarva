# 07 WORKFLOW AND STATE MACHINE

## Universal Source Workflow

1. Intake
2. Scope
3. Sourcing Strategy
4. RFP / RFI Package
5. Vendor Responses
6. Evaluation
7. Orals / BAFO
8. Selection
9. Contract / Mobilization
10. Value Realization

## Stage Definitions

### 1. Intake

- Goal: classify event, sponsor, scope intent, archetype, and rigor.
- Required inputs: event name, business owner, sourcing need, timing, rough value, risk.
- Outputs: sourcing event brief, archetype, rigor recommendation.
- Stage gate: intake accepted.
- Artifacts: sourcing event brief, minimum data request.
- Risks: unclear sponsor, wrong archetype, under-scoped rigor.
- Nexus guidance: identify event shape and minimum inputs.
- User actions: confirm event frame.
- System actions: suggest pattern pack and rigor.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 2. Scope

- Goal: define in-scope work, out-of-scope work, assumptions, and required baseline data.
- Required inputs: inventory, baseline, contracts, workload, constraints.
- Outputs: scope document, projected value shell.
- Stage gate: scope ready.
- Artifacts: scope document, minimum data request, projected value ledger.
- Risks: missing baseline, scope bloat, value overstatement.
- Nexus guidance: do not advance strategy until inputs are credible.
- User actions: upload inputs, confirm assumptions.
- System actions: flag missing dependencies.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 3. Sourcing Strategy

- Goal: choose sourcing model, vendor universe, process shape, and evaluation approach.
- Required inputs: scope, constraints, market pattern, target model.
- Outputs: sourcing strategy memo, shortlist logic.
- Stage gate: strategy approved.
- Artifacts: sourcing strategy memo.
- Risks: premature shortlist, wrong model, stakeholder misalignment.
- Nexus guidance: keep sourcing model explicit before package generation.
- User actions: approve strategy.
- System actions: recommend pattern-backed options.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 4. RFP / RFI Package

- Goal: produce structured vendor package.
- Required inputs: scope, requirements, pricing model, evaluation criteria.
- Outputs: RFP/RFI package, pricing template, Q&A process.
- Stage gate: package approved for release.
- Artifacts: RFP/RFI package, pricing template.
- Risks: missing requirements, vague pricing, unfair comparison.
- Nexus guidance: tag missing assumptions and avoid blind free-writing.
- User actions: review, approve, release.
- System actions: generate draft sections and missing-input tags.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 5. Vendor Responses

- Goal: receive and normalize responses.
- Required inputs: vendor submissions, pricing templates, clarifications.
- Outputs: response summary, Q&A tracker.
- Stage gate: response set complete.
- Artifacts: vendor Q&A tracker, vendor response summary.
- Risks: late vendors, inconsistent pricing, non-comparable answers.
- Nexus guidance: normalize before evaluation.
- User actions: send reminders, mark complete.
- System actions: alert overdue responses.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 6. Evaluation

- Goal: evaluate vendors using approved scorecard.
- Required inputs: locked scorecard, normalized responses, evaluator assignments.
- Outputs: scored evaluation, risks, recommendation inputs.
- Stage gate: evaluation complete.
- Artifacts: evaluation scorecard.
- Risks: scorecard drift, hidden weighting bias, unsupported scoring.
- Nexus guidance: do not evaluate until scorecard is locked.
- User actions: score, review rationale.
- System actions: enforce scorecard lock.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 7. Orals / BAFO

- Goal: run structured vendor challenge and final offer process.
- Required inputs: evaluation gaps, questions, negotiation objectives.
- Outputs: orals guide, BAFO comparison.
- Stage gate: BAFO complete.
- Artifacts: orals/BAFO guide.
- Risks: vendor theater, inconsistent challenge, negotiation drift.
- Nexus guidance: focus on unresolved decision criteria.
- User actions: run orals, record results.
- System actions: prepare structured challenge guide.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 8. Selection

- Goal: recommend and approve vendor selection.
- Required inputs: evaluation, BAFO, risks, value case.
- Outputs: vendor selection memo, decision record.
- Stage gate: selection approved.
- Artifacts: vendor selection memo.
- Risks: unsupported recommendation, value not tied to decision, stakeholder disagreement.
- Nexus guidance: make tradeoffs explicit.
- User actions: approve selection.
- System actions: assemble decision packet.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 9. Contract / Mobilization

- Goal: move from selection to contract and launch.
- Required inputs: commercial terms, transition plan, owners, milestones.
- Outputs: mobilization checklist, transition plan.
- Stage gate: mobilization ready.
- Artifacts: mobilization checklist.
- Risks: contract delay, unclear owner, transition risk.
- Nexus guidance: lock responsibilities and timing.
- User actions: confirm plan and owners.
- System actions: create milestones.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

### 10. Value Realization

- Goal: measure projected versus realized value.
- Required inputs: measurement owner, milestones, evidence, actuals.
- Outputs: realized value ledger, variance explanation.
- Stage gate: realization active.
- Artifacts: realized value ledger.
- Risks: no measurement owner, attribution weakness, variance unexplained.
- Nexus guidance: track measured outcomes, not just sourcing completion.
- User actions: review actuals, explain variance.
- System actions: calculate variance and confidence.
- Valid states: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.

## Lifecycle Statuses

- Active
- Waiting on Client
- Waiting on Vendor
- Waiting on Procurement
- Waiting on Executive Decision
- Paused
- At Risk
- Completed
- Archived

## Transition Rules

- Waiting on Client -> Active when missing client input is received.
- Waiting on Vendor -> Active when vendor response is complete and normalized.
- Waiting on Procurement -> Active when procurement/legal action clears.
- Active -> Waiting on Executive Decision when stage gate requires sponsor approval.
- Any live state -> At Risk when threshold is breached.
- Paused -> Active only by explicit resume.
- Completed -> Archived.
- Archived is terminal.

Invalid transitions:

- Archived -> Active
- Waiting state -> Completed without clearing dependency
- At Risk -> Completed without risk resolution
- Paused -> Completed without resume

## Aging Rules

- aging starts when lifecycle state changes
- wait-state aging is displayed on dashboard and canvas
- at-risk aging is tracked separately

## At-Risk Rules

An event becomes At Risk when:

- missing input exceeds threshold
- vendor due date is missed
- procurement review is overdue
- executive approval is stale
- scorecard remains unlocked past evaluation start
- value ledger lacks measurement owner before selection

## Pause / Resume

Paused events require:

- pause reason
- owner
- resume condition

On resume:

- restore prior active stage
- refresh blockers
- ask Nexus to restate next action

## Nexus State Language

In every state Nexus should answer:

- where are we?
- what is missing?
- what is at risk?
- who owns the next action?
- what happens next?
