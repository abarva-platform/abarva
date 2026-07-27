# Module Data Integration Target Architecture

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Target Pattern

```text
Operational workflow tables
        ↓
Domain outbox / change events
        ↓
Canonical identity mapping
        ↓
Knowledge promotion where appropriate
        ↓
Domain publication
        ↓
Shared consumption projections
        ↓
Cube / Nexus / aVa / Superset / Observable
```

## Architecture Rules

- Products do not own enterprise data; they own workflow state and projections.
- Local module IDs are preserved, then linked through `governance.object_identity_map`.
- Accepted/published enterprise facts promote or link to canonical Knowledge; draft artifacts stay operational.
- Metric definitions are governed separately from observations and chart-ready projections.
- No synchronous multi-write of the same fact into Moves, Source, Tower, Knowledge, and reporting tables.

## Proposed Crosswalk Fields

| Field | Purpose |
| --- | --- |
| tenant_key | Tenant fence |
| module | Source module |
| local_object_type | Domain object type |
| local_object_ref | Domain-local ID |
| canonical_object_type | Canonical Knowledge type |
| canonical_object_ref | Canonical ID |
| match_method | exact, deterministic, reviewed, manual |
| match_confidence | confidence score or tier |
| review_state | candidate, approved, rejected, superseded |
| valid_from / valid_to | temporal boundary |
