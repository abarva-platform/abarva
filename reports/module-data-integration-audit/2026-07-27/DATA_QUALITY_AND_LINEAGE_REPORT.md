# Data Quality and Lineage Report

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Static Result

Inventory captured 679 module-relevant persisted objects or focused code references across Moves, Source, and Tower.

Module counts: Moves: 27; Source: 460; Tower: 192.

Disposition counts: retain_operational: 591; promote_link_canonical_knowledge: 68; archive: 8; replace: 1; project_shared_consumption: 11.


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
