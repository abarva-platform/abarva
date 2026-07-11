# Target Data-Layer Writer

Status: dry-run persistence planning baseline.

The Target Data-Layer Writer converts Canonical Ingestion Records into the target architecture. It is the persistence boundary between source parsing and the enterprise data stores.

It is the only component in this boundary that may know physical persistence details. Source packets and source adapters remain table-agnostic.

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
- target store transaction boundaries
- source evidence linkage
- proof bundle references
- rollback pointers

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

## Candidate Version Creation

The writer creates a candidate tenant data version with:

- packet ID
- contract versions
- mapping versions
- target writer version
- evidence count
- canonical record count
- quarantined record count
- unmapped field count
- source fingerprint list
- proof bundle location

Active promotion is a separate governed action.

## PR4 Dry-Run Plan

PR4 adds the first executable Target Writer dry-run. It consumes the PR3 tenant-packet proof bundle and produces:

- target write operations,
- target persistence mappings,
- candidate tenant data version metadata,
- quarantine routing,
- idempotency keys,
- source record fingerprints,
- a local proof bundle.

This path is planning only. It does not write physical tables, create a candidate version in the database,
promote active tenant data, mutate tenant state, or change module runtime behavior.

```bash
npm run audit:target-writer-dry-run
```
