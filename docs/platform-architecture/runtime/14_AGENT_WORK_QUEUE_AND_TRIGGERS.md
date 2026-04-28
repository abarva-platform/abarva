# Agent Work Queue And Triggers

## Purpose

This document defines the future work queue and trigger model for Nexus, Sentinel, Atlas, and Steward. It explains how agent missions can be generated from workflow, evidence, validation, setup, and user activity without treating agents as passive chatbots.

This is a specification only. It does not implement queues, schedulers, background jobs, API routes, UI, persistence, or model calls.

## Work Queue Philosophy

The agent work queue should answer four questions:

1. What work needs attention?
2. Which agent is responsible?
3. What context caused the mission?
4. What output or owner action will resolve it?

The queue should be deterministic first. Later runtime implementation may add model-assisted phrasing, but the queue itself should be grounded in product state, validation results, workflow state, evidence readiness, and pattern signals.

## Work Queue Record

A future mission queue item should be able to represent:

- Mission id.
- Mission type.
- Agent owner.
- Work object type and id.
- Surface: Programs, Source, Intelligence, Control Tower, or Admin/Setup.
- Trigger.
- Priority.
- State.
- Context used.
- Evidence or validation source.
- Owner.
- Due date.
- Recommended next action.
- Suggested actions.
- Handoff recommendation.
- Stop condition.
- Audit notes.

## Trigger Matrix

| Trigger | Input state | Agent(s) activated | Mission generated | Expected output | UI visibility | Logging/audit needs | Stop conditions |
|---|---|---|---|---|---|---|---|
| Page load | Current route, user role, work object, readiness state | Nexus, Sentinel, Steward, Atlas as relevant | `next_action`, `low_context_warning`, `gate_check`, `value_risk` | Compact current-state read and next action | Activity strip or mission panel only if useful | Record deterministic context snapshot id later | Hide if no material mission exists |
| Event/program created | New work object with seed state | Nexus, Steward | `next_action`, `data_readiness`, `pattern_signal` | Intake guidance and minimum data request | Inline recommendation or setup panel | Record creation trigger and required data | Stop after intake checklist is accepted or dismissed |
| Stage change | Previous stage, next stage, gate result | Nexus, Steward, Sentinel | `gate_check`, `workflow_blocker`, `evidence_gap` | Allowed, blocked, deferred, or waiver-required state | Journey map, gate panel, or activity strip | Record stage transition attempt and gate result | Stop if transition is completed, blocked, or deferred |
| Artifact generated | Artifact type, tier, source context, evidence state | Nexus, Sentinel, Steward | `artifact_review`, `evidence_gap`, `approval_follow_up` | Artifact tier, missing evidence, review/approval path | Artifact strip or review panel | Record artifact version and evidence readiness later | Stop after review starts or artifact is dismissed |
| Artifact uploaded | File metadata, work object, owner | Sentinel, Steward | `data_readiness`, `validation_defer` | Uploaded but not parsed warning, or usable evidence state after parsing later | Evidence strip or upload status | Record file id, owner, and parser status later | Stop when parsed, rejected, waived, or removed |
| File parsed | Parsed file, extracted evidence, confidence | Sentinel, Nexus | `evidence_gap`, `next_action`, `pattern_signal` | Evidence readiness and impacted next actions | Evidence drawer or context-used strip | Record parse result and evidence link later | Stop when evidence is attached or rejected |
| Validation defer | Context or workflow validation defer | Sentinel, Steward, Nexus | `validation_defer`, `workflow_blocker` | Defer explanation and required remediation | Activity strip, gate panel, or validation report | Record validation id and defer reason | Stop when defer is resolved or intentionally preserved |
| Workflow block | Blocked gate, blocker severity, remediation | Steward, Nexus | `workflow_blocker`, `gate_check` | Cannot-proceed reason and remediation | Mission panel or journey map | Record blocker id and owner | Stop when gate passes, waiver is approved, or block is dismissed with reason |
| Approval overdue | Approval item, owner, due date | Steward, Atlas if executive impact | `approval_follow_up`, `executive_brief` | Owner escalation and decision consequence | Activity strip or executive brief | Record aging and notification path later | Stop when approved, rejected, escalated, or waived |
| Vendor response missing | Vendor, event stage, due date, required sections | Nexus, Sentinel | `vendor_response_gap`, `evidence_gap` | Missing response detail and reminder/BAFO guidance later | Source event panel or table row | Record vendor and response requirement | Stop when response arrives, vendor is waived, or event is rescoped |
| Value at risk changes | Value estimate, confidence, blocker, stage | Atlas, Nexus | `value_risk`, `executive_brief` | Executive impact and operational follow-up | Control Tower brief or Source dashboard | Record value source and confidence | Stop when value is baselined, reconciled, or escalated |
| Daily/nightly scan | Portfolio/event/program/readiness snapshots | Atlas, Steward, Sentinel, Nexus | `value_risk`, `data_readiness`, `evidence_gap`, `workflow_blocker` | Prioritized mission summary | Hidden drawer, digest, or Control Tower summary | Record scan time and deterministic rule version | Stop when scan completes or runtime scheduler is disabled |
| User asks question | User prompt, role, selected context, route | Nexus first, handoff as needed | `next_action`, `evidence_gap`, `executive_brief`, or `gate_check` | Contextual answer plus next action | Agent panel or inline response | Record context used and response contract later | Stop when answer is delivered or missing context is disclosed |

## Queue Visibility Rules

Not every mission belongs in the UI. A mission should be visible when it changes a decision, blocks progress, creates a useful next action, or materially affects value/risk.

Visibility levels:

- `silent`: kept for audit or later runtime state, not shown.
- `compact`: shown in activity strip with count and short label.
- `panel`: shown in mission panel with reason, context, owner, and action.
- `inline`: shown near the artifact, gate, table row, or workflow element it affects.
- `executive`: shown in Atlas brief or Control Tower summary.

## Queue Ownership

Agent ownership should follow the mission purpose:

- Nexus owns orchestration, next action, artifact guidance, and session preparation.
- Sentinel owns evidence, confidence, pattern fit, and unsupported-claim warnings.
- Atlas owns executive synthesis, portfolio pressure, value/risk, and leadership decisions.
- Steward owns gate integrity, approvals, data readiness, auditability, and policy enforcement.

When more than one agent is involved, the queue item should name a primary agent and optional supporting agents.

## Stop Conditions

A mission should leave the active queue when:

- The required action is completed.
- The user dismisses it with an accepted reason.
- The mission is superseded by a newer state.
- The mission is escalated to a different owner or agent.
- The blocker is resolved.
- The defer reason remains valid and is intentionally preserved.
- The work object is archived or out of scope.

## Audit Requirements

Future runtime implementation should preserve:

- Trigger source.
- Work object id.
- Agent owner.
- Context used.
- Validation or evidence source.
- Mission state transitions.
- User dismissal or waiver reason.
- Handoff reason.
- Generated output tier: deterministic, model-assisted, or human-authored.

The audit model must distinguish deterministic findings from future model-assisted responses.

## Non-Goals

- No scheduler implementation.
- No background job implementation.
- No notification system implementation.
- No database schema implementation.
- No chat UI implementation.
- No API route implementation.
- No model call implementation.

## Acceptance Criteria

- Every trigger creates concrete agent work or intentionally creates no visible mission.
- Mission output is tied to state, evidence, workflow, validation, or pattern context.
- UI visibility is constrained by decision value.
- Logging and audit needs are explicit enough for future runtime work.
- Stop conditions prevent agent spam and stale mission queues.
