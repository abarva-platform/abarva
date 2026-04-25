# Agent Runtime And Handoffs

## Purpose

Define how Nexus, Sentinel, Atlas, and Steward operate without directly owning models, tools, or prompt assembly.

## Agents

- Nexus: work guidance, program and Source reasoning, next-action support.
- Sentinel: risk, contradiction, pattern, and evidence warnings.
- Atlas: operating pressure, portfolio, and execution implications.
- Steward: setup, data readiness, governance, permissions, and audit readiness.

## Runtime Flow

1. Product API receives a work-object request.
2. Context Builder assembles context and readiness.
3. Agent Runtime selects agent behavior and response contract.
4. Tool Layer may run approved deterministic tools.
5. Model Gateway may be invoked only when policy allows.
6. Evidence ledger and audit trace are updated.
7. Product API returns a typed response to the surface.

## Handoffs

Handoffs must name the receiving agent, reason, missing data or risk, owner action, and expected next state.

## Mission-Driven Runtime

The agent runtime should be able to create and resolve agent missions before it becomes model-heavy or chat-heavy.

Mission-bearing agents:

- Nexus owns orchestration, next action, workshop/session preparation, artifact guidance, stage readiness, and three choices plus custom.
- Sentinel owns evidence validation, pattern fit, unsupported-claim detection, low-confidence warnings, and citation readiness.
- Atlas owns executive synthesis, value/risk tradeoffs, portfolio pressure, and steering committee briefs.
- Steward owns governance, stage gates, approvals, data readiness, auditability, and policy/readiness enforcement.

Mission runtime must preserve:

- Mission type.
- Mission state.
- Work object.
- Trigger.
- Context used.
- Priority.
- Recommended next action.
- Handoff recommendation.
- Stop condition.

See `13_AGENT_MISSION_MODEL.md` and `14_AGENT_WORK_QUEUE_AND_TRIGGERS.md` before implementing any runtime queue, scheduler, background job, agent panel, or proactive agent behavior.

## Non-Goals

No agent should become a generic chat personality. Agents are product roles bound to context, evidence, workflow, and user action.
