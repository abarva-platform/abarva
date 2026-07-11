# Schema And Contract Registry

Status: official architecture baseline.

The Schema and Contract Registry records which versions were used for every tenant load and ensures source packet evolution is decoupled from physical data-layer evolution.

## Version Families

- Tenant Packet contract versions
- source adapter versions
- Canonical Ingestion Contract versions
- canonical domain model versions
- target persistence model versions
- analytics feature versions
- Module Context API versions

## Compatibility Rules

- Every tenant load records the exact versions used.
- Packet version N can be parsed by adapter versions X through Y.
- Canonical contract version N can be written by target writer version Z.
- Older packets can be upgraded through migration adapters.
- Newer database models do not invalidate existing source packets.

## Upgrade Principle

A physical database redesign should primarily require changes to:

- canonical-to-target writer
- migration logic
- views and Module Context APIs

It must not require every source template, client packet, and source parser to be rewritten.
