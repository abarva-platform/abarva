# Source Adapter Framework

Status: official architecture baseline.

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

## Quarantine Behavior

If parsing or mapping is incomplete, the adapter emits a quarantined canonical ingestion record or an unmapped-field report. It must not silently drop fields that could support future evidence, claims, or value proof.
