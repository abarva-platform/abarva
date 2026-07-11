# Enterprise Data Layer

Status: official architecture baseline.

AbarVa ingests tenant evidence into an Evidence Registry, normalizes it into a Canonical Fact Store, connects it through an Enterprise Relationship Graph, derives intelligence and readiness scores, exposes the active tenant context through an Active Tenant Access Layer, and lets each module consume and write back through governed Module Context APIs.

## Architecture Spine

- Client evidence inputs
- Tenant Packet
- Evidence Registry
- Canonical Fact Store
- Enterprise Relationship Graph
- Derived Intelligence Store
- Active Tenant Access Layer
- Module Context APIs
- Home / Intelligence / Moves / Source / Tower / Export
- Module Memory + Outcome Ledger
- Validated Write-Back
- Candidate Tenant Data Version
- Active Tenant Data Version

## Target Layers

| Layer | Purpose |
| --- | --- |
| Evidence Registry | Tracks source objects, provenance, authority, sensitivity, confidence, freshness, and retrieval proof. |
| Canonical Fact Store | Stores normalized tenant objects/facts/fields with versions and source links. |
| Enterprise Relationship Graph | Stores typed tenant-scoped object relationships and graph quality. |
| Derived Intelligence Store | Stores deterministic profiles, gaps, assumptions, blocked claims, recommendations, readiness, and answerability. |
| Module Memory | Stores module-created decisions, artifacts, events, assumptions, and proposed memory before promotion. |
| Outcome Ledger | Stores projected, committed, tracked, measured, realized, and attested value. |
| Product Capability Registry | Stores safe product capability claims, required evidence, unsupported patterns, and module contracts. |
| Access and Dossier Layer | Serves active/candidate version packets to modules through governed context APIs. |
| Benchmark Intelligence | Stores privacy-safe tenant-neutral benchmarks and market/corpus signals. |
