# Source Adapter Framework

Status: operational contract baseline.

Source adapters parse source inputs into the Canonical Ingestion Contract. They never write directly to product tables.

## Supported Adapter Families

- CSV adapter
- Excel adapter
- JSON adapter
- document extraction adapter
- ServiceNow adapter
- SAP, Oracle, and Workday adapter
- historical AbarVa pack adapter
- Source-event adapter
- Moves-memory adapter
- Tower-metric adapter

## Adapter Responsibilities

Each adapter defines:

- accepted source shape
- parser version
- mapping profile
- validation rules
- source identity handling
- error and quarantine handling
- evidence lineage
- idempotency behavior
- test fixtures

Each adapter produces only:

- canonical ingestion records
- adapter findings
- unmapped-field reports
- quarantine summaries
- content fingerprints

An adapter must be deterministic for the same packet file, mapping profile, parser version, and adapter version.

## Non-Responsibilities

Adapters do not own:

- database IDs
- persistence table choice
- foreign keys
- deduplication across target stores
- fact versioning
- supersession
- active tenant data version promotion
- module readiness
- derived intelligence computation
- outcome realization
- cross-packet deduplication

## Quarantine Behavior

If parsing or mapping is incomplete, the adapter emits a quarantined canonical ingestion record or an unmapped-field report. It must not silently drop fields that could support future evidence, claims, or value proof.

## Adapter Input Contract

Every adapter input includes:

- tenant key
- packet ID and packet contract version
- source path and declared source class
- source profile
- parser version
- mapping profile
- sensitivity and data status
- expected canonical domains

The adapter may reject input when the declared source class, mapping profile, or data status conflicts with the manifest.
