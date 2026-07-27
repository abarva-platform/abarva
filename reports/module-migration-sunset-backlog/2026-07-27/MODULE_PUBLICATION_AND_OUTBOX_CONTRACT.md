# Module Publication and Outbox Contract

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Contract

Modules own workflow state. A module publishes only accepted, reviewed, or attested enterprise-significant events to a governed outbox. Canonical Knowledge and shared projections consume from the outbox after validation.

## Outbox Fields

| Field | Requirement |
| --- | --- |
| event_id | Immutable event identifier |
| tenant_key | Required tenant fence |
| module | Emitting module |
| business_event | Source, Moves, Tower, or cross-module event name |
| local_object_type / local_object_ref | Domain-local object reference |
| canonical_object_type | Intended target family |
| payload | Typed publication payload |
| evidence_refs | Source/evidence/provenance links |
| review_state | candidate, approved, rejected, superseded |
| idempotency_key | Required for replay safety |
| emitted_at / processed_at | Audit timestamps |

## Stop Conditions

- Missing tenant key.
- Missing evidence lineage for a material fact.
- Unreviewed fact attempting canonical promotion.
- Cross-tenant object reference.
- Conflicting metric definition or unit.
