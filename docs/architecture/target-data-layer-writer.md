# Target Data-Layer Writer

Status: official architecture baseline.

The Target Data-Layer Writer converts Canonical Ingestion Records into the target architecture. It is the persistence boundary between source parsing and the enterprise data stores.

## Target Stores

- Evidence Registry
- Canonical Fact Store
- Enterprise Relationship Graph
- Derived Intelligence Store
- Module Memory
- Outcome Ledger

## Writer Responsibilities

- database IDs
- foreign keys
- upsert behavior
- fact versioning
- supersession
- deduplication
- relationship resolution
- source linkage
- candidate tenant data version creation

## Idempotency

The writer uses stable identity:

- tenant key
- source system
- source object ID
- canonical object type
- effective date or version
- content fingerprint

Reloading the same packet must not duplicate facts, evidence, relationships, or measurements.

## Failure And Quarantine

The writer fails closed. Invalid canonical records are quarantined with source evidence and validation errors. Valid records from the same packet may continue only when tenant isolation, lineage, and version consistency are preserved.
