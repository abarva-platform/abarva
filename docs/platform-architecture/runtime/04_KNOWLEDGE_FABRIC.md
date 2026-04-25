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

## Admin/Setup And Source Readiness Boundary

Admin/Setup owns platform-level data readiness. This includes connector status, dataset inventory, permissions, parsing status, source freshness, and evidence usability.

Source consumes knowledge and evidence readiness for a sourcing event. Source can show sourcing-specific impact, such as whether AMS ticket history blocks a Rich-tier RFP, but it does not own connector setup, dataset inventory, tenant access control, parsing, or evidence storage.

Knowledge Fabric must distinguish:

- Loaded: data has entered the platform.
- Available: data can be retrieved or viewed.
- Usable Evidence: data is validated enough to support claims, citations, artifacts, scorecards, or decisions.

Source agents and Source UI must not treat loaded or available data as usable evidence unless the Evidence Ledger and readiness state support it.

## MVP / V1 / V2

MVP: relational state, seeded patterns, object references, and evidence labels. V1: parsed chunks, embeddings, graph relationships, and claim-to-source ledger. V2: feedback loop, provenance scoring, and learning from applied outcomes.
