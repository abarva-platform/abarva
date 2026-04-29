# AbarVa Knowledge Layer Architecture Visuals

Status: current architecture snapshot after Enterprise Data Room, agent context broker, persistence mapper, and phase-pack work.

## Executive View

AbarVa should treat the knowledge layer as four coordinated planes:

1. Enterprise Data Room: tenant facts, programs, artifacts, evidence, graph candidates, vector readiness.
2. Knowledge Fabric: global patterns, signals, solutions, contradictions, sourcing corpus, and future client-private embeddings.
3. Context Broker: governed northbound contract that gives agents scoped context without letting them query raw stores directly.
4. Model/Agent Layer: Nexus, Sentinel, Atlas, and Steward combine static workflow doctrine with tenant-specific context.

```mermaid
flowchart LR
  subgraph D[Data Plane]
    EDR[Enterprise Data Room]
    SRC[Source Artifacts + Deliverables]
    DB[(Postgres / Supabase)]
    VEC[(pgvector / Search)]
    GRAPH[(Postgres Graph Fallback)]
  end

  subgraph K[Knowledge Plane]
    PAT[Patterns]
    SIG[Signals]
    SOL[Solutions]
    CON[Contradictions]
    PHASE[Phase Intelligence Packs]
  end

  subgraph C[Context Plane]
    BROKER[Agent Context Broker]
    POLICY[Policy + Tenant Scope + Approval State]
    PROV[Evidence + Provenance]
  end

  subgraph A[Agent + Model Plane]
    NEXUS[Nexus]
    SENTINEL[Sentinel]
    ATLAS[Atlas]
    STEWARD[Steward]
    MODEL[Model Gateway / Provider]
  end

  EDR --> BROKER
  SRC --> EDR
  DB --> BROKER
  VEC --> BROKER
  GRAPH --> BROKER
  PAT --> BROKER
  SIG --> BROKER
  SOL --> BROKER
  CON --> BROKER
  PHASE --> NEXUS
  POLICY --> BROKER
  PROV --> BROKER
  BROKER --> NEXUS
  BROKER --> SENTINEL
  BROKER --> ATLAS
  BROKER --> STEWARD
  NEXUS --> MODEL
  SENTINEL --> MODEL
  ATLAS --> MODEL
  STEWARD --> MODEL
```

## What Exists Now

| Layer | Current State | Notes |
|---|---|---|
| Enterprise Data Room | Source-code seeded read model | Apex is rich. Meridian and First Capital are partial/conflict-aware. |
| Agent Context Broker | Contract-only implementation | No route imports yet. It returns scoped context bundles and blocked items. |
| Persistence Mapper | Dry-run only | Lowers data-room records into future row groups; no DB writes. |
| Phase Packs | P0-P6 complete | Static workflow doctrine for Nexus on program surfaces. |
| Vector Layer | Not live for Enterprise Data Room | Vector readiness rows exist; embeddings are not generated. |
| Graph Layer | Candidate graph only | Graph nodes/edges exist in data room; no persistent graph fallback migration yet. |
| App Runtime Wiring | Not yet attached | Programs agents can pivot to broker through a thin adapter later. |

## Target Data / Knowledge Shape

```mermaid
flowchart TB
  CLIENT[Client / Tenant]
  PROFILE[Profile]
  ORG[People + Org Chart]
  SYSTEMS[Systems + Integrations]
  VENDORS[Vendors + Contracts]
  FIN[Financials + KPIs]
  PROGRAMS[Programs + Phase State]
  ARTIFACTS[Deliverables + Templates]
  EVIDENCE[Evidence + Citations]
  CHUNKS[Chunks + Embeddings]
  NODES[Graph Nodes]
  EDGES[Graph Edges]

  CLIENT --> PROFILE
  CLIENT --> ORG
  CLIENT --> SYSTEMS
  CLIENT --> VENDORS
  CLIENT --> FIN
  CLIENT --> PROGRAMS
  PROGRAMS --> ARTIFACTS
  ARTIFACTS --> EVIDENCE
  EVIDENCE --> CHUNKS
  PROFILE --> NODES
  ORG --> NODES
  SYSTEMS --> NODES
  VENDORS --> NODES
  PROGRAMS --> NODES
  ARTIFACTS --> NODES
  EVIDENCE --> NODES
  NODES --> EDGES
```

## Agent Context Assembly

Agents should not read raw stores directly. They request context from the broker.

```mermaid
sequenceDiagram
  participant App as App Surface
  participant Broker as Agent Context Broker
  participant EDR as Enterprise Data Room
  participant KF as Knowledge Fabric
  participant Policy as Policy/Governance
  participant Agent as Agent
  participant Model as Model Layer

  App->>Broker: EnterpriseAgentContextRequest
  Broker->>Policy: validate tenant, role, surface, L4 allowance
  Broker->>EDR: retrieve tenant-scoped facts/evidence
  Broker->>KF: retrieve patterns/signals/phase doctrine as needed
  Broker->>Broker: redact, rank, cite, block unsafe items
  Broker->>Agent: EnterpriseAgentContextBundle
  Agent->>Model: prompt + tools + scoped context
  Model-->>Agent: response / tool call
  Agent-->>App: answer + citations + blocked-context notes
```

## Multi-Agent Responsibilities

| Agent | Primary Question | Context It Should Receive | Should Not Do |
|---|---|---|---|
| Nexus | What should the program do next? | Phase pack, program state, deliverables, evidence, risks, gate readiness | Query raw tenant stores directly |
| Sentinel | Is this evidence/pattern/source trustworthy? | Evidence rows, graph candidates, citations, contradictions, quality state | Invent sources or bypass approval state |
| Atlas | What does the portfolio/value picture show? | Financials, KPIs, systems, aggregate program/value context | Consume raw L4 text by default |
| Steward | Is this governed and safe? | Policy readiness, tenant scope, data classification, blocked items, write-back status | Approve private data exposure implicitly |

## Runtime Composition Pattern

```mermaid
flowchart LR
  PHASE[Phase Pack: static workflow doctrine]
  TENANT[Enterprise Context Bundle: tenant facts]
  CORPUS[Corpus Retrieval: patterns/signals]
  TOOLS[Tools: program actions/write-back]
  PROMPT[Agent Prompt Assembly]
  LLM[Model Provider]
  AUDIT[Trace + Evidence + Decision Log]

  PHASE --> PROMPT
  TENANT --> PROMPT
  CORPUS --> PROMPT
  TOOLS --> PROMPT
  PROMPT --> LLM
  LLM --> AUDIT
  TOOLS --> AUDIT
```

## Recommended Next Build Order

1. Add a read-only Programs adapter that calls the broker but does not change write behavior.
2. Add a migration decision doc for pgvector and graph fallback before real DDL.
3. Lock embedding default for the Azure lab: `text-embedding-3-small`, `1536`, `vector(1536)` if Supabase pgvector is chosen.
4. Define tenant identity bridge: `tenant_key` and `client_id` must be explicit and consistent.
5. Add write-back event contract for generated artifacts and user edits.
6. Only then create real migrations for documents, chunks, embeddings, graph nodes, graph edges, and write events.

## Do Not Shortcut

- Do not let app agents import seed data directly.
- Do not let agents query vector/graph/database stores directly.
- Do not create pgvector DDL until embedding dimensions and RLS are locked.
- Do not mark Meridian or First Capital as rich tenants until canonical profile conflicts are resolved.
- Do not treat phase packs as tenant data; they are workflow doctrine.
