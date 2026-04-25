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

## Non-Goals

No agent should become a generic chat personality. Agents are product roles bound to context, evidence, workflow, and user action.
