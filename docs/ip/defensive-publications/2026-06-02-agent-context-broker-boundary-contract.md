# Defensive Publication Draft: AgentContextBroker Boundary Contract

Date: 2026-06-02
Status: ready for external publication review
Audience: founder, patent counsel, product leadership, security reviewers

This document is a defensive-publication draft. It is not legal advice and it
is not itself a public defensive publication while this repository remains
private. To complete the defensive-publication backlog item, publish a reviewed
version through a public channel and record the public URL.

## Abstract

AbarVa uses a server-side AgentContextBroker boundary to assemble tenant-scoped
agent context before any downstream agent or application surface receives
facts, evidence, graph summaries, semantic chunks, or warnings. App-tier code
does not directly import private data-room, tenant-data, vector, graph, or
retrieval internals. Instead, each caller requests a typed context bundle from
the broker. The bundle carries tenant identity, source basis, sensitivity,
provenance identifiers, evidence citations, blocked-context records, graph
summary metadata, and warning strings. The same boundary lets the data plane
move from fixtures to persisted tenant data or Azure AI Search without changing
agent surfaces or weakening tenant isolation.

## Problem

Multi-tenant enterprise AI systems need private enterprise context, but direct
application access to raw stores creates avoidable risk:

- app pages can accidentally read another tenant's context;
- routes can bypass retrieval filters or evidence provenance;
- vector and graph calls can omit tenant filters;
- prompt text can receive stale or synthetic context without a visible warning;
- migration from fixture data to persisted data can create mixed-source
  responses that are difficult to audit.

Prompt-only tenant scoping is insufficient because it protects the model
instruction layer rather than the data-fetch layer. AbarVa's boundary moves
tenant scoping, source labeling, and warnings into the server-side context
assembly contract.

## Disclosure

The disclosed pattern is a broker-enforced context assembly contract with these
properties:

1. The application tier requests context through a broker entry point, not
   through direct imports of raw data-room, tenant-data, vector, graph, or
   retrieval modules.
2. The broker accepts a typed request containing tenant key, agent name, surface,
   optional program id, requested domains, graph-neighborhood preference, and raw
   context permission.
3. The broker normalizes tenant identity before data assembly when needed.
4. The broker returns a typed context bundle rather than raw rows.
5. Each context item carries tenant key, source basis, data classification,
   sensitivity, provenance ids, and linked evidence citations.
6. Unknown tenants return an explicit blocked bundle rather than synthetic
   fallback content.
7. Raw L4 context is blocked unless the caller explicitly requests and is
   authorized for raw context.
8. Persisted tenant data and code-fixture data are not mixed in a single
   response. The broker chooses one source basis per response and emits a bundle
   warning.
9. Graph neighborhood information is summarized as metadata instead of exposing
   graph-store internals directly to application surfaces.
10. CI enforces the architectural boundary by preventing app-tier and component
    runtime imports of raw context internals.

## Implementation Evidence

The current repository contains these concrete implementation points:

| Evidence | Path | What It Shows |
| --- | --- | --- |
| Agent context broker | `src/lib/knowledge/agent-context-broker.ts` | Defines `EnterpriseAgentContextRequest`, `EnterpriseAgentContextBundle`, context items, blocked items, citations, graph summary, warnings, and sync/async broker entry points. |
| Context broker public surface | `src/lib/knowledge/context-broker/index.ts` | Re-exports context bundle types and broker contracts so callers avoid reaching into tenant-data internals directly. |
| Broker boundary ADR | `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md` | Records the accepted architecture decision that app-tier code must retrieve context through the broker boundary. |
| Dependency boundary | `.dependency-cruiser.cjs` | Blocks `src/app/**` and `src/components/**` from importing data-room, tenant-data, graph, vector, Azure Search retriever, and related internals directly. |
| Architecture Boundary workflow | `.github/workflows/architecture-boundary.yml` | Runs the dependency boundary check in CI for pull requests. |
| Tenant isolation test | `src/lib/knowledge/__tests__/agent-context-broker-tenant-isolation.test.ts` | Verifies broker items and graph metadata remain scoped to the requested tenant, and includes a negative control showing why unfiltered vector chunks are unsafe. |
| Azure retrieval adapter comment | `src/lib/azure-search/tenant-context-retriever.ts` | Documents that app-tier code should go through AgentContextBroker rather than touching vector retrieval directly. |

## Example Context Bundle Contract

The broker response is a runtime-safe envelope:

```ts
interface EnterpriseAgentContextBundle {
  tenantKey: string;
  agentName: EnterpriseAgentName;
  surface: EnterpriseContextSurface;
  generatedFrom: 'enterprise_agent_context_broker_v1';
  runtimeSafe: true;
  directStoreAccess: false;
  items: EnterpriseAgentContextItem[];
  blockedItems: EnterpriseBlockedContextItem[];
  citations: EnterpriseEvidenceCitation[];
  graphNeighborhood: EnterpriseGraphNeighborhoodSummary;
  warnings: string[];
}
```

The `directStoreAccess: false` field is part of the disclosed control pattern:
callers receive a broker-mediated context receipt, not raw access to private
stores.

## Novelty Framing For Counsel Review

This draft does not claim that tenant scoping, retrieval, RAG, vector metadata
filters, or graph traversal are novel by themselves. The differentiating
combination to evaluate is:

- fetch-time context scoping rather than prompt-time-only scoping;
- broker as the only allowed app-tier data path;
- typed context bundle rather than raw rows or raw chunks;
- first-class warnings for fixture, persisted, missing, blocked, or degraded
  context;
- evidence citations and source-basis labels attached before model reasoning;
- CI-level import boundary enforcement.

## Publication Notes

This draft is suitable for counsel review or for conversion into a public
defensive publication. Before posting publicly, review for confidential content
and decide whether a patent filing should precede disclosure.

Suggested public-publication record fields:

- publication channel;
- public URL;
- publication timestamp;
- reviewer;
- version or commit hash;
- confidentiality review result.

## Related Internal Documents

- `docs/ip/ABARVA_PATENT_DISCLOSURE_PACKET_2026-05-14.md`
- `docs/gtm/D3-PATENT-DECISION-MEMO.md`
- `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`
