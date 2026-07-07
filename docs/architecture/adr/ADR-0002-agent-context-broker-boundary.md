# ADR-0002 - Agent Context Broker Boundary

## Status

Accepted

## Date

2026-06-01

## Context

Agent and app code need tenant facts, evidence, graph neighborhoods, semantic chunks, and corpus context. The repository already contains a broker boundary for that work:

- `src/lib/knowledge/agent-context-broker.ts` states that app-tier code must not bypass the broker to reach `EnterpriseDataRoom`, tenant-data adapters, vector stores, or graph stores.
- `src/lib/knowledge/context-broker/broker.ts` defines the `ContextBroker` contract and the default broker implementation.
- `src/lib/azure-search/tenant-context-retriever.ts` states that app-tier code must go through `AgentContextBroker` and never touch the vector store directly.
- `src/lib/knowledge/enterprise-data-room.ts`, `src/lib/knowledge/tenant-data/`, and `src/lib/knowledge/graph-access.ts` remain implementation details behind the broker boundary.

Without a firm ADR, new app routes and agent surfaces could accidentally import lower-level data room, vector, or graph modules directly.

## Decision

The app tier must retrieve agent context through the Agent Context Broker boundary.

New app-tier and agent-surface code must not directly import `EnterpriseDataRoom`, vector-store clients, graph-access modules, or tenant-data adapters. Retrieval should flow through `src/lib/knowledge/agent-context-broker.ts` or `src/lib/knowledge/context-broker/broker.ts`, depending on the surface contract.

## Consequences

- Context assembly stays tenant-scoped, auditable, and replaceable.
- Vector, graph, fixture, and persisted data paths can change behind the broker without page-level rewrites.
- Broker warnings and provenance tags become the standard way to surface synthetic, partial, persisted, and retrieval-degraded context.
- Tests should enforce the broker boundary where possible, especially for app-tier imports.

## Alternatives

- Allow direct imports of data room and graph modules from pages. Rejected because it bypasses the documented isolation and provenance boundary.
- Expose vector clients as general utilities. Rejected because retrieval must carry tenant filters and broker metadata.
- Maintain separate broker patterns per surface. Rejected because duplicated boundaries drift and are harder to audit.

## References

- `src/lib/knowledge/agent-context-broker.ts`
- `src/lib/knowledge/context-broker/broker.ts`
- `src/lib/azure-search/tenant-context-retriever.ts`
- `src/lib/knowledge/enterprise-data-room.ts`
- `src/lib/knowledge/tenant-data/`
- `src/lib/knowledge/graph-access.ts`
