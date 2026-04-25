# Model Gateway

## Purpose

The Model Gateway is the only approved path for model calls. Agents, tools, and UI must not call providers directly.

## Responsibilities

- Provider selection.
- Model policy enforcement.
- Cost and token accounting.
- Request and response logging.
- Redaction and sensitive-data controls.
- Fallback and retry policy.
- Streaming policy.
- Evaluation and safety hooks.
- Trace linkage to work object, agent, and evidence context.

## Inputs

The gateway receives a normalized model request from Agent Runtime. The request must include agent identity, work object, context bundle reference, tool permissions, expected output contract, and audit metadata.

## Outputs

The gateway returns a typed response, trace id, model metadata, usage metadata, and policy status.

## Non-Goals

The gateway does not parse source documents, decide workflow state, or invent evidence. It routes and governs model calls after Context Builder and Agent Runtime have prepared the request.

## MVP / V1 / V2

MVP: one governed route for model calls with logging and no direct agent/provider calls. V1: provider fallback, cost controls, and evaluation hooks. V2: routing optimization and policy-aware model selection.
