# Data Quality and Lineage Report

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Static Result

Inventory captured 131 module-relevant persisted objects parsed from migration DDL across Moves, Source, and Tower.

Module counts: Moves: 11; Source: 50; Tower: 70.

Disposition counts: retain_operational: 72; archive: 5; promote_link_canonical_knowledge: 38; project_shared_consumption: 16.


## What Was Observed

- Evidence lineage markers were inferred from parsed columns containing source, evidence, artifact, lineage, provenance, citation, or confidence language.
- Metric duplication candidates were extracted into `METRIC_DEFINITION_DUPLICATION_MATRIX.xlsx`.
- Identity collision candidates were extracted into `CROSS_MODULE_IDENTITY_COLLISION_MATRIX.xlsx`.

## What Remains Unknown Until Live DB Audit

- Null rates and duplicate business keys.
- Broken foreign-key-like references where no explicit FK exists.
- Superseded/stale rows versus current accepted rows.
- Whether generated artifacts are being treated as source truth.

## Minimum Quality Gate Before Migration

- Every promoted fact needs tenant identity, canonical object type, local object ref, evidence/provenance, effective dates where applicable, and review state.
- Every consumption projection needs a domain owner, refresh cadence, parity test, and rollback path.
