# Knowledge Broker and Intelligence Tool Alignment

**Status:** alignment contract for broker, Enterprise Data Room write-back, and Intelligence surface tools  
**Date:** 2026-04-29  
**Scope:** read-path broker requests, Intelligence tool requests, future vector/graph fields, and write-back event compatibility.

## 1. Why This Exists

AbarVa now has three adjacent contracts that must stay in sync:

- `AgentContextBroker` in `src/lib/knowledge/agent-context-broker.ts`, which governs read access to tenant context.
- `KNOWLEDGE_ENTERPRISE_DATA_ROOM_WRITEBACK_CONTRACT.md`, which defines how generated artifacts, user edits, decisions, approvals, evidence attachments, and graph/vector updates become provenance-bearing writes.
- `SESSION_BRIEF_INTELLIGENCE.md`, which proposes Sentinel tools: `search_patterns`, `pattern_neighborhood`, `evidence_lookup`, and `validate_synthesis`.

The risk is drift. If the Intelligence surface adds `vectorQuery`, `graphDepth`, or evidence filters that do not map to the write-back indexing model, the app tier will either reach around the broker or invent a parallel retrieval contract. Both are failure modes.

## 2. Boundary Rule

All app-tier reads use this path:

```text
surface tool or route -> surface adapter -> AgentContextBroker -> data room / persistence / vector / graph
```

For current surfaces:

| Surface | Adapter | Default agent | Default broker surface |
|---|---|---:|---:|
| Programs | `src/lib/programs/programs-broker-adapter.ts` | `Nexus` passed by caller | `programs` |
| Intelligence | `src/lib/intelligence/sentinel-broker-adapter.ts` | `Sentinel` | `intelligence` |

Disallowed paths:

```text
src/app/** -> EnterpriseDataRoom
src/app/** -> vector table/provider
src/app/** -> graph table/provider
src/lib/agent/** -> EnterpriseDataRoom
src/lib/agent/** -> vector table/provider
src/lib/agent/** -> graph table/provider
```

## 3. Shared Request Fields

These fields should remain shared across Programs, Intelligence, Source, Tower, and future agent surfaces.

| Field | Owner | Meaning | Write-back alignment |
|---|---|---|---|
| `tenantKey` | broker | Required tenant scope. Empty or unknown returns blocked context. | Every write event and persistence row must carry the same tenant key. |
| `agentName` | broker | Determines what the broker may reveal to Nexus, Sentinel, Atlas, or Steward. | Write events record actor/agent separately from tenant facts. |
| `surface` | broker | Semantic surface key: `programs`, `source`, `intelligence`, `tower`, `chat`, or `unknown`. | Write events record originating surface for replay and audit. |
| `programId` | broker | Optional program scope. Required for program-specific tools; optional for corpus-wide Intelligence. | Generated deliverables and approvals should link to program ID when available. |
| `requestedDomains` | broker | Data-room domains requested by the caller. | Domains map to persistence row groups and data-room domain coverage. |
| `includeGraphNeighborhood` | broker | Requests graph summary metadata. | Graph writes populate nodes/edges that this read may later traverse. |
| `allowL4RawContext` | broker/security | Defaults false. Raw L4 context requires explicit authorization and audit posture. | Write-back must not promote raw L4 text into shared metadata. |

## 4. Intelligence Tool Field Mapping

| Tool | Tool fields | Broker mapping | Artifact/write-back implication |
|---|---|---|---|
| `search_patterns` | `query`, `scope`, `limit` | Future `vectorQuery`, `vectorScope`, `limit`; until then use Sentinel adapter and corpus retrieval. | Emits `pattern-match` read artifacts. No corpus writes. |
| `pattern_neighborhood` | `patternId`, `depth`, `edgeTypes` | Future `graphRootId`, `graphDepth`, `graphEdgeTypes`, `includeGraphNeighborhood: true`. | Emits `graph-neighborhood`; graph writes must preserve edge types and provenance. |
| `evidence_lookup` | `claim`, optional `programId` | Future `evidenceClaim`, `programId`, requested domain `evidence_provenance`. | Emits `evidence-highlight`; write-back evidence attachments must use compatible citation IDs. |
| `validate_synthesis` | `text`, optional `againstPatterns` | Future `validationText`, `patternIds`, vector + evidence request fields. | Emits `contradiction-flag` and `pattern-match`; validation results can later become review events, not automatic pattern changes. |

## 5. Future Broker Field Names

If the broker grows vector/graph retrieval fields, use this vocabulary so the Intelligence tools and persistence model do not diverge.

```ts
interface FutureEnterpriseAgentContextRequestExtensions {
  vectorQuery?: string;
  vectorScope?: 'all' | 'sourcing' | 'lifecycle' | 'programs' | 'evidence';
  vectorLimit?: number;
  evidenceClaim?: string;
  patternIds?: string[];
  graphRootId?: string;
  graphDepth?: 1 | 2 | 3;
  graphEdgeTypes?: Array<'co_applies_with' | 'contradicts' | 'depends_on' | 'precedes'>;
}
```

Rules for adding these fields:

- Add fields to `EnterpriseAgentContextRequest` first.
- Update Programs and Sentinel adapters second.
- Add broker tests for unknown tenant, tenant scoping, and blocked raw context.
- Only then wire surface tools.
- Never add route-level direct vector/graph calls to compensate for missing broker fields.

## 6. Write-Back Alignment

The write-back contract should use the same identity vocabulary as broker reads.

| Write event family | Must carry | Read-side consumer |
|---|---|---|
| Generated deliverable | `tenantKey`, `programId`, `artifactId`, `sourceBasis`, `approvalState` | `evidence_lookup`, Programs evidence runner |
| User edit | `tenantKey`, `artifactId`, actor, prior version, new version | Broker citation/provenance summaries |
| Decision / approval | `tenantKey`, `programId`, approver, authority, timestamp, evidence IDs | Phase gate evidence, sponsor health drift |
| Evidence attachment | `tenantKey`, `sourceArtifactId`, `citationLocator`, `claimText`, `dataClassification` | `evidence_lookup`, `validate_synthesis` |
| Graph update | `tenantKey`, node/edge stable keys, edge type, confidence, evidence IDs | `pattern_neighborhood`, portfolio reasoning |
| Vector chunk update | `tenantKey`, `sourceRecordId`, chunking version, embedding profile, source hash | `search_patterns`, `evidence_lookup` |

## 7. Tenant-Isolation Requirement

Every retrieval mode must prove both halves of isolation:

1. With `tenantKey` filtering, a tenant query returns zero other-tenant rows.
2. Without the filter, the same candidate pool contains other-tenant rows, proving the test would catch a missing filter.

This is now covered at the broker/dry-run-persistence layer by `src/lib/knowledge/__tests__/agent-context-broker-tenant-isolation.test.ts`. The live pgvector migration must add an equivalent SQL/provider test before it can ship.

## 8. Drift Control

Any PR that modifies Intelligence tool contracts, broker request fields, Enterprise Data Room persistence rows, vector index shape, or graph edge shape must update this document or explicitly state why no alignment change is needed.
