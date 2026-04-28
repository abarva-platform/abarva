# 13 EVENT LIFECYCLE AND ALERTS

## Purpose

Source lifecycle and alerts must represent real sourcing event state, including waiting, approval, document review, rework, vendor response gaps, and evidence limitations.

Alerts are not generic notifications. They are operating signals that explain what is blocked, who owns it, what is aging, what value is exposed, and what should happen next.

## Dashboard Question

The dashboard should answer:

> What sourcing events are active, where are they stuck, what decision is needed, who owns the next action, and what value is at stake?

## Event Lifecycle States

Core lifecycle states:

- Active
- Waiting on Client
- Waiting on Vendor
- Waiting on Procurement
- Waiting on Executive Decision
- Paused
- At Risk
- Completed
- Archived

These states should remain deterministic and should not be overwritten by model-generated narrative.

## Document Review Wait States

Additional document-related wait states should be represented in event, artifact, or alert state:

- waiting on document owner
- waiting on reviewer
- waiting on legal redlines
- waiting on procurement review
- waiting on security review
- waiting on finance review
- waiting on comment resolution
- waiting on uploaded redline classification
- waiting on evidence/citation validation

These wait states can coexist with broader lifecycle states. For example, an event can be `Waiting on Client` while the RFP artifact is `In Review`.

## Approval Wait States

Approval-related wait states:

- approval not started
- approval pending
- approval changes requested
- approval rejected
- approval escalated
- approval expired
- approval waived

Approval state should affect:

- artifact lock
- stage-gate movement
- release/issue readiness
- executive decision readiness

## Alert Types

- missing input aging
- vendor response overdue
- procurement review overdue
- executive approval pending
- scorecard not locked
- artifact needs review
- RFP package missing required inputs
- event approaching at-risk threshold
- value ledger missing measurement owner
- incomplete pricing template
- approval overdue
- approval rejected
- approval waiver required
- unresolved required comments
- uploaded document parse failed
- citation/evidence validation failed
- stage gate blocked
- realized value evidence missing

## Alert Severity

### Critical

Blocks progress or creates material governance/value risk.

Examples:

- required client input overdue beyond threshold
- scorecard not locked while evaluation is about to begin
- executive approval blocks release

### Warning

Needs attention soon.

Examples:

- vendor response nearing due date
- artifact needs review
- event approaching at-risk threshold

### Info

Useful operating context.

Examples:

- reminder to confirm next meeting
- value owner assigned
- upcoming gate review

## Alert Fields

- id
- event id
- type
- severity
- title
- detail
- owner
- next action
- due date
- aging days
- status
- artifact id/version id if applicable
- lifecycle state
- gate affected
- waiver availability
- evidence/citation gap

## Alert Behavior

- critical alerts appear first
- each alert includes owner and next action
- alerts should link to the relevant event, stage, artifact, scorecard, or ledger
- resolved alerts should not dominate the active dashboard
- alerts distinguish event wait state from artifact/review/approval state

## At-Risk Thresholds

Initial suggested thresholds:

- client input overdue by 5 business days
- vendor response overdue by 3 business days
- procurement review overdue by 5 business days
- executive decision overdue by 5 business days
- scorecard unlock remains unresolved when evaluation starts

## Stale Review And Overdue Approval Alerts

Stale review alert:

- triggers when required reviewer has not acted by due date
- names reviewer/role
- names artifact version
- names gate affected
- recommends reminder, reassignment, or escalation

Overdue approval alert:

- triggers when required approval is past due
- names approver/role
- names routing mode
- names artifact/stage blocked
- recommends escalation or waiver request if allowed

## Rework Loop Alerts

Rework loop alerts should surface:

- artifact changes requested
- required comments unresolved
- uploaded redlines require classification
- locked artifact reopened
- approvals reset because material change occurred
- new version supersedes prior review

Nexus should explain the rework loop in plain sourcing language.

Steward should enforce the related gate or lock state.

## Stage-Gate Alerts

Stage-gate alerts should clearly state:

- current stage
- attempted next stage
- required artifacts
- missing approvals
- missing inputs
- unresolved comments
- evidence gaps
- waiver path if available

Example:

The event cannot move from RFP/RFI Package to Vendor Responses because the RFP package is not locked and the pricing template is not approved.

## Agent Behavior

Nexus:

- explains what is blocked and why
- identifies owner and next action
- distinguishes event wait state from artifact review state
- states whether a waiver is possible

Sentinel:

- flags evidence/citation failures
- validates uploaded document trust state

Atlas:

- summarizes alert posture for executives
- highlights decision and approval bottlenecks

Steward:

- enforces lifecycle and gate state
- logs wait states, overrides, waivers, and approvals

## Anti-Patterns

- decorative alerts with no owner
- alerts with no action
- hiding aging
- merging all alert types into one generic warning
- using color without text
- letting generated narrative override deterministic lifecycle state
