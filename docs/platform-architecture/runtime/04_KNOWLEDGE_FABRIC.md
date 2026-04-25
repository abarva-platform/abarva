# Knowledge Fabric

## Purpose

Knowledge Fabric separates the stores and retrieval paths AbarVa agents rely on.

## Stores

- Relational state: tenants, programs, Source events, vendors, artifacts, approvals, tasks, owners, and workflow state.
- Vector store: embedded chunks and semantic retrieval.
- Graph store: relationships between patterns, evidence, vendors, programs, risks, and outcomes.
- Object/raw files: uploaded files, original proposals, spreadsheets, documents, exports, and raw evidence.
- Evidence ledger: claim-to-source links and confidence labels.

## Retrieval Rules

Retrieval must be work-object aware. A Source event answer should not pull unrelated program context unless a governed relationship exists. A program answer should not cite vendor proposal evidence unless the evidence ledger links it.

## Separation Of Concerns

Vector search finds candidate context. Graph relationships explain connections. Relational state provides truth for workflow and ownership. Object storage preserves source material. Evidence ledger validates claims.

## MVP / V1 / V2

MVP: relational state, seeded patterns, object references, and evidence labels. V1: parsed chunks, embeddings, graph relationships, and claim-to-source ledger. V2: feedback loop, provenance scoring, and learning from applied outcomes.
