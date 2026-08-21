# Target Client-Pilot Data Architecture

## Logical Contract

```text
Operational workflow tables
  -> domain publication/outbox
  -> canonical identity map
  -> reviewed Knowledge promotion/link
  -> shared consumption projections
  -> Nexus/aVa/reporting consumers
```

Moves, Source, and Tower retain operational workflow state. Canonical Knowledge owns reviewed enterprise identity, facts, relationships, metrics, and evidence links. Shared read models, marts, graph, vector/search, context packs, snapshots, and generated artifacts are projections.

## Physical Pilot Placement

| Layer | Purpose | Mutability | Pilot placement |
| --- | --- | --- | --- |
| Control/config | tenant config, contracts, feature flags, versions | controlled | SaaS control plane |
| Raw/evidence | original files, uploads, source versions, hashes | append-only | client private plane |
| Parsed/staging | extracted rows, text, tables, parser outputs | rebuildable | client private plane |
| Canonical Knowledge | identity, reviewed facts, relationships, metrics, evidence | governed/versioned | client private plane |
| Domain workflow | Moves, Source, Tower operational state | transactional | client private plane where client-sensitive |
| Consumption | graph, vector, search, marts, context packs | rebuildable | client private plane |
| Artifacts | draft/reviewed/approved artifact versions | immutable versions | client private plane |
| Audit/lineage | jobs, hashes, publication events, approvals | append-only | private plane plus non-sensitive control telemetry |

## Control Plane Must Know

- Tenant key and deployment binding.
- Schema/version.
- Health and non-sensitive job status.
- Feature configuration.
- Cutover state.

## Control Plane Must Not Contain

- Evidence files.
- Extracted facts.
- Embeddings.
- Graph content.
- Commercial information.
- Artifacts.
- Interview responses.
- Clinical, regulated, or client-confidential data.

## Pilot Object Families

Pilot scope should stay narrow:

- Applications/systems.
- Data assets/integrations.
- Use cases/programs.
- Evidence/documents.
- Facts/claims.
- Relationships.
- Metric definitions and observations.
- Decisions/actions.
- Generated artifacts.

Module workflow tables should initially remain in place. Approved domain decisions/facts publish through an outbox into canonical Knowledge.

