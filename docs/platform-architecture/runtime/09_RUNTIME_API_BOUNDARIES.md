# Runtime API Boundaries

## Purpose

Define the relationship between product-specific APIs and shared platform services.

## Product-Specific APIs

Product-specific APIs sit above shared services and shape the request for a surface:

- Programs APIs.
- Source APIs.
- Intelligence APIs.
- Control Tower APIs.
- Admin/Setup APIs.

They can validate route parameters, user intent, work object identity, and allowed actions.

## Shared Services

Shared services own:

- Context Builder.
- Agent Runtime.
- Tool Layer.
- Model Gateway.
- Knowledge Fabric.
- Evidence Ledger.
- Governance and audit.

## Boundary Rules

Product APIs must not assemble prompts directly. Product APIs must not call model providers directly. Product APIs must not parse files directly unless they are calling the approved ingestion service.

## Error States

APIs should return typed states for missing context, access restricted, unsupported action, low confidence, stale data, validation failure, and service unavailable.

## Acceptance

A new runtime API is ready only when its work object, context contract, evidence contract, agent behavior, tool permissions, and error states are documented.
