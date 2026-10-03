# CIO Tower Fact Derivation Audit

Generated: 2026-07-15T19:28:22.145Z

## Verdict

Tower is **lineage-aware and source-backed through the existing `cio_tower` read model**, but this audit does **not** prove Tower is fully `standard-2026-07-v3` native.

The strongest derivation chain we can prove is:

```text
tower-standardized-v1 source files
  -> scripts/tower/load-cio-tower-standardized-v1.mjs
  -> cio_tower.source_registry / entities / facts / relationships / measures / question_contracts / measure_results
  -> Tower CXO view, Tower charts, budget rollups, and Tower aVa deterministic prompt packets
```

There are also bridge paths:

```text
src/scripts/lakeshore/load-cio-tower-facts.ts
  -> Lakeshore F12 budget subset into cio_tower

supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql
  -> seed/bootstrap Tower budget facts

intelligence_v7.business_records
  -> src/lib/tower/v7-tower-projection.ts
  -> runtime Tower current-state projection, not persisted cio_tower fact creation
```

## What is proven

- `cio_tower` has explicit schema tables for sources, entities, facts, relationships, measures, question contracts, measure results, prompt packages, answer traces, and validation results.
- The standardized Tower loader writes the main `cio_tower` tables from `tower-standardized-v1`.
- Tower landing and charts consume deterministic `cio_tower` view models.
- Tower aVa consumes question contracts, measure results, facts, relationships, and gaps before Claude, then stores prompt/render traces.
- `source_key`, `source_row`, `source_file`, `source_system`, `source_fact_keys`, and `formula_version` provide useful local lineage.

## What is not proven

- That every `cio_tower.facts.fact_key` reconciles to a `standard-2026-07-v3` source row.
- That `cio_tower.facts` rows carry a canonical `canonical_fact_id`.
- That `cio_tower.entities.entity_key` is the same as an enterprise Entity Profile ID.
- That `cio_tower.relationships.relationship_key` is the canonical enterprise relationship graph edge ID.
- That active vs candidate state is represented in the `cio_tower` schema.
- That seeded facts are current client evidence rather than bootstrap/read-model rows.

## Safe interpretation

`cio_tower` is safe to use as a governed Tower read model when the UI and aVa describe it as source-backed Tower context or materialized Tower metrics. It is not safe to call it fully v3-native or fully promoted active tenant truth until reconciliation fields and candidate/active state are added and proven.

## Required next design move

Keep `cio_tower` as the Tower serving/read model, but add a reconciliation boundary:

```text
v3 source row / evidence registry
  -> canonical fact
  -> entity profile
  -> relationship graph edge
  -> TowerValueRecord
  -> cio_tower fact / measure result
```

At minimum, future rows should carry:

- `source_standard`
- `source_contract_version`
- `tenant_packet_id`
- `candidate_version_id` or active version ID
- `evidence_registry_id`
- `canonical_fact_id`
- `entity_profile_id`
- `relationship_edge_id` where applicable
- `value_claim_status`: proposed, promised, measured, realized, unsupported
- `safe_to_display` and `display_caveat`

## Generated files

- `summary.json`
- `source-to-cio-tower-lineage.csv`
- `cio-tower-to-v3-reconciliation.csv`
- `legacy-bridge-dependencies.csv`
- `tower-consumer-map.csv`
- `unreconciled-facts.csv`
- `cio-fact-derivation-proof.html`
