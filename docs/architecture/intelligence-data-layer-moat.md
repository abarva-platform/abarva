# Intelligence Data Layer Moat

## Purpose

V7 remains the right strategic model: it is the canonical multi-tenant evidence and intelligence contract for Home, Intelligence, Moves, Source, Tower, and export surfaces. The gap was not the vision. The gap was operational governance around version promotion, existing-tenant migration, and module readiness.

This layer makes the contract explicit:

1. Evidence enters as source files with checksums, row counts, source dates, and validation status.
2. Facts are stored as tenant-scoped `business_records`, `record_fields`, source files, graph nodes, relationship edges, and retrieval chunks.
3. Derived intelligence is only allowed when a quality report names source fact refs, graph refs, assumptions, evidence gaps, and not-allowed claims.
4. Modules consume the active tenant contract version, not "latest loaded row".
5. Existing tenants move through versioned upgrade snapshots with before/after proof before promotion.

## Implemented In This Release

- `intelligence_v7.active_tenant_contract_versions`
  - One active V7 contract pointer per tenant.
  - Includes rollback contract version, promotion status, actor, proof bundle URI, notes, and metadata.

- `intelligence_v7.tenant_contract_promotion_events`
  - Append-only promotion event trail for promote, rollback, block, and validate decisions.

- `intelligence_v7.module_readiness_scores`
  - Per-tenant, per-contract readiness scores for `home`, `intelligence`, `moves`, `source`, `tower`, and `export`.
  - Tracks required dimensions, present dimensions, missing dimensions, source/fact/relationship/retrieval coverage, unsupported-claim risk, blockers, and proof refs.

- `intelligence_v7.derived_intelligence_quality_reports`
  - The no-fake-intelligence gate.
  - Stores source fact refs, graph refs, assumptions, evidence gaps, not-allowed claims, confidence, and blocked reasons for derived outputs.

- `intelligence_v7.existing_tenant_upgrade_snapshots`
  - A governed place to capture current state, candidate mapping, quality reports, before/after output comparisons, and proof matrices for existing tenants.

- Fact lifecycle columns on `intelligence_v7.business_records`
  - `fact_status`, `valid_from`, `valid_to`, `stale_after`, `superseded_by`, and `fact_confidence`.

- Active-current views
  - `intelligence_v7.current_tenant_pack_runs`
  - `intelligence_v7.current_business_records`

- Runtime reader adoption
  - Home and Intelligence default to the active contract view.
  - Tower joins to the active contract view and filters retired/stale/superseded facts out of the projection path.

- Loader adoption
  - Generic V7 loader and Lakeshore V7 loader install the foundation, promote the loaded contract, write module readiness scores, and write an aggregate quality report.

## Existing Tenant Upgrade Strategy

Existing tenants must not be silently overwritten by V7 candidate data.

The upgrade path is:

1. Capture the current active contract and current answer behavior in `existing_tenant_upgrade_snapshots`.
2. Load the V7 candidate contract without presenting it as active if proof is incomplete.
3. Build the mapping report from current evidence/facts into V7 dimensions.
4. Score module readiness and derived-intelligence quality.
5. Run before/after output comparison for Home, Intelligence, Moves, Source, Tower, and export.
6. Promote by updating `active_tenant_contract_versions` only after proof passes.
7. Keep rollback contract version attached to the active pointer.

## Multi-Tenant Proof Matrix

Each tenant promotion should capture:

| Proof area | Required evidence |
| --- | --- |
| Load proof | contract version, run key, source dataset, file count, row count, field count |
| Graph proof | node count, edge count, weak/unscored edge count, relationship dictionary alignment |
| Retrieval proof | retrieval chunk count and eligible chunk references |
| Module proof | readiness row for Home, Intelligence, Moves, Source, Tower, export |
| Answer proof | representative before/after questions with cited source rows |
| Tenant safety | tenant key, active contract pointer, RLS scope, no cross-tenant values |
| Rollback | prior active contract version and promotion event trail |

## What This Does Not Yet Prove

- It does not apply the migration to production by itself.
- It does not backfill upgrade snapshots for every historical tenant yet.
- It does not certify Meridian, Lakeshore, SkyHarbor, or any future tenant as live-proven until the loader runs and readback/browser evidence is captured.
- It does not replace the V6 graph substrate; V6 remains the governed relationship substrate, and V7 consumes clean tenant-scoped slices.

## Operating Rule

Meridian can be the first strong use case for this layer, but Meridian is not the architecture. The architecture is tenant-agnostic, versioned, evidence-backed, and module-readiness gated.
