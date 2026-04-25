# Agent Mission Model

## Purpose

This document defines how Nexus, Sentinel, Atlas, and Steward stay active and useful across Programs, Source, Intelligence, Control Tower, and Admin/Setup.

AbarVa agents are not passive chatbots. They operate on context, workflow state, evidence, patterns, validation results, and user intent. Their job is to keep work moving, surface risk before it becomes hidden, and make the next responsible action visible.

This is a specification only. It does not implement runtime code, schedulers, background jobs, API routes, UI, or model calls.

## Agent Mission Philosophy

Agents should be mission-bearing product roles, not generic personalities.

Every useful agent action should be tied to at least one of these sources:

- Current work object: program, sourcing event, artifact, vendor response, setup item, or executive brief.
- Workflow state: phase, stage, gate, approval state, blocker, or defer.
- Evidence state: uploaded evidence, parsed evidence, missing evidence, citation readiness, or confidence.
- Pattern state: applicable pattern, anti-signal, validation rule, commercial trap, or benchmark category.
- Validation state: context validation result, workflow validation result, readiness gate, or deterministic blocker.
- User intent: question, selected action, role, session mode, or current task.

Agents should not wait for the user to ask a blank prompt. They should show what matters now, recommend what should happen next, and explain when they cannot proceed safely.

## Agent Responsibilities

### Nexus

Nexus is the orchestration and next-action agent.

Responsibilities:

- Coordinate workflow progress across Programs and Source.
- Identify the next best action for the current work object.
- Prepare workshops, sessions, sourcing events, and operating reviews.
- Guide artifacts by stage and readiness.
- Explain stage readiness and missing inputs.
- Offer three choices plus custom where user choice moves work forward.
- Hand off to Sentinel, Atlas, or Steward when evidence, executive, or governance work is primary.

Nexus should answer:

- Where are we?
- What is missing?
- What is at risk?
- What should happen next?
- Who needs to act?

### Sentinel

Sentinel is the evidence, pattern-fit, and confidence agent.

Responsibilities:

- Validate whether evidence supports the claim or recommendation.
- Assess whether the selected pattern fits the work object.
- Detect unsupported claims, weak citations, stale inputs, and low-confidence guidance.
- Surface citation readiness and evidence usability.
- Warn Nexus when a recommendation would overstate confidence.
- Identify validation defers tied to missing or unusable evidence.

Sentinel should answer:

- What evidence was used?
- What evidence is missing?
- What claims are not supported?
- Where is confidence low?
- Which validation checks should block, defer, or require waiver?

### Atlas

Atlas is the executive synthesis agent.

Responsibilities:

- Summarize portfolio pressure and value/risk tradeoffs.
- Translate operating detail into CIO, CFO, steering committee, or board-readable language.
- Identify executive decision needs.
- Explain value at stake, risk exposure, confidence, and tradeoffs.
- Prepare concise executive briefs when a decision or escalation is required.
- Hand back to Nexus when executive direction needs operational follow-through.

Atlas should answer:

- What should executives know?
- What value or risk is at stake?
- What decision is needed?
- What tradeoffs should be understood?
- What confidence caveats matter?

### Steward

Steward is the governance, readiness, and gate-integrity agent.

Responsibilities:

- Enforce stage gates, approval requirements, and policy readiness.
- Track Admin/Setup readiness, data readiness, permissions, and auditability.
- Identify blocked gates and cannot-proceed reasons.
- Record whether a waiver, approval owner, or evidence requirement is needed.
- Ensure workflow and readiness rules are not bypassed by agent enthusiasm.
- Hand back to Nexus with allowed, blocked, or deferred next actions.

Steward should answer:

- What gate are we at?
- What cannot proceed?
- What approval or waiver is required?
- What audit trail is needed?
- What data readiness or policy condition is blocking?

## Mission Types

| Mission type | Primary agent | Purpose | Example output |
|---|---|---|---|
| `next_action` | Nexus | Recommend the next useful workflow move. | "Lock scope inputs before RFP release." |
| `evidence_gap` | Sentinel | Identify missing or weak evidence. | "Ticket volume baseline is missing for AMS pricing." |
| `gate_check` | Steward | Evaluate whether a stage or gate can proceed. | "Evaluation is blocked until scorecard is locked." |
| `artifact_review` | Nexus / Sentinel / Steward | Review artifact readiness, evidence, and approval state. | "RFP can be outline-tier only because baseline data is incomplete." |
| `data_readiness` | Steward / Sentinel | Assess setup, access, parsing, and evidence usability. | "Uploaded vendor response is not usable evidence until parsed." |
| `value_risk` | Atlas | Summarize value at stake and risk exposure. | "$18.5M event is exposed by missing pricing normalization." |
| `executive_brief` | Atlas | Prepare concise leadership synthesis. | "Decision needed: approve waiver or delay release." |
| `vendor_response_gap` | Sentinel / Nexus | Identify incomplete vendor submissions or response inconsistencies. | "Vendor B excluded transition support." |
| `scorecard_governance` | Steward / Nexus | Assess scorecard readiness, override rationale, and lock state. | "Commercial weight override requires rationale." |
| `approval_follow_up` | Steward | Track overdue or missing approvals. | "CFO approval overdue by 3 days." |
| `workflow_blocker` | Steward / Nexus | Explain a blocker and required remediation. | "Cannot cite unparsed document." |
| `pattern_signal` | Nexus / Sentinel | Detect applicable pattern guidance or anti-signals. | "AMS pattern likely applies; confirm support model scope." |
| `validation_defer` | Sentinel / Steward | Preserve a safe defer when context is not ready. | "Defer until uploaded file is parsed." |
| `low_context_warning` | Sentinel | Warn that advice is not event-specific yet. | "Guidance is pattern-level only." |

## Mission States

| State | Meaning | Runtime implication |
|---|---|---|
| `proposed` | Agent has identified a possible mission, but it is not yet active. | Show only when useful or when user asks why. |
| `active` | Mission is currently relevant and should guide next action. | Eligible for activity strip or mission panel. |
| `waiting` | Mission is waiting for owner action, data, approval, or external input. | Show owner and due date when known. |
| `blocked` | Mission cannot proceed because a gate, evidence, data, or policy requirement is unmet. | Show blocker reason and required remediation. |
| `completed` | Mission has reached its expected output or action. | Move to history or audit trail, not active UI. |
| `dismissed` | User intentionally dismissed the mission. | Preserve dismissal reason if needed. |
| `escalated` | Mission needs executive, governance, or cross-agent attention. | Show receiving agent and escalation reason. |
| `deferred` | Mission is intentionally paused because context is not ready or scope is future. | Preserve defer reason and resume trigger. |

## Priority Model

Mission priority should be deterministic and explainable. A mission becomes more important when one or more of these factors are high:

- Value at stake.
- Aging.
- Due date proximity.
- Blocker severity.
- Stage gate impact.
- Executive decision need.
- Evidence confidence risk.
- Production readiness impact.

Recommended priority levels:

| Priority | Meaning | Examples |
|---|---|---|
| `critical` | Work cannot proceed safely or a high-value decision is exposed. | RFP release blocked by missing approval; uploaded evidence cannot be cited. |
| `high` | Next action should be visible in the first viewport or mission panel. | Vendor response gap affects evaluation; value at risk changed materially. |
| `medium` | Important but not currently blocking. | Pattern signal suggests a better diagnostic question. |
| `low` | Useful background guidance or follow-up. | Completed mission summary or optional executive phrasing. |

Priority should not be based on agent volume. One critical blocker should outrank several low-value suggestions.

## Agent Handoffs

Handoffs should be explicit and auditable. A handoff must name:

- Sending agent.
- Receiving agent.
- Work object.
- Reason.
- Context used.
- Expected next state.
- Owner or user action when relevant.

Examples:

| Handoff | Trigger | Expected result |
|---|---|---|
| Nexus to Sentinel | Evidence is weak or missing. | Sentinel identifies gaps and confidence caveats. |
| Nexus to Steward | Gate is blocked or approval is unclear. | Steward returns allowed, blocked, waiver, or approval state. |
| Nexus to Atlas | Executive decision is needed. | Atlas prepares value/risk brief and decision language. |
| Sentinel to Nexus | Missing evidence changes the recommended next action. | Nexus revises next action or asks for minimum data. |
| Steward to Nexus | Workflow is allowed or blocked. | Nexus tells the user what can happen next. |
| Atlas to Nexus | Executive action needs operational follow-up. | Nexus converts executive direction into workflow tasks. |

## Surface Coverage

| Surface | Agent mission emphasis |
|---|---|
| Programs | Phase readiness, workshop prep, artifact guidance, executive escalations, evidence gaps. |
| Source | Stage readiness, sourcing next action, pattern fit, vendor gaps, pricing traps, gate integrity. |
| Intelligence | Pattern signals, evidence confidence, anomaly validation, portfolio synthesis. |
| Control Tower | Executive pressure, value/risk, blockers, decision needs, cross-program tradeoffs. |
| Admin/Setup | Data readiness, permissions, connector readiness, tenant governance, audit preparedness. |

## Guardrails

- Agents must not invent evidence, citations, approvals, or readiness state.
- Agents must not use model calls unless the Model Gateway and policy allow it.
- Agents must not bypass workflow validation, evidence readiness, or approval gates.
- Agents must not become noisy notification feeds.
- Agents must not display large avatars or decorative personalities.
- Agents must distinguish deterministic findings from future model-assisted guidance.

## Acceptance Criteria

- Each agent has concrete work beyond chat.
- Mission types are tied to context, workflow, evidence, patterns, or validation.
- Mission states support queueing, blocking, dismissal, escalation, and defer.
- Handoffs are explicit and auditable.
- The model can later support deterministic mission queues without changing the product philosophy.
- No runtime code, UI, scheduler, background job, API route, or model call is implied by this document alone.
