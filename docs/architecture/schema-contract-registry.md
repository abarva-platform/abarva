# Schema And Contract Registry

Status: official architecture baseline.

This registry is the compatibility ledger between input contracts, neutral canonical contracts, and target persistence versions. It prevents source templates from being coupled to physical table names.

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
- Candidate tenant data versions record all contract versions used to create them.
- Promotion requires compatibility status `compatible` or an approved migration adapter.

## Upgrade Principle

A physical database redesign should primarily require changes to:

- canonical-to-target writer
- migration logic
- views and Module Context APIs

It must not require every source template, client packet, and source parser to be rewritten.

## Registry Entry Families

- packet contract versions
- source adapter versions
- mapping profile versions
- canonical ingestion contract versions
- target writer versions
- candidate tenant data version compatibility
- module context API compatibility
