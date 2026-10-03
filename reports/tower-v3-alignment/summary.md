# Tower v3 Source-of-Truth Alignment Audit

Generated: 2026-07-15T19:45:01.239Z

## Verdict

**Fail: Tower is not yet aligned to the v3 enterprise context source of truth.**

The correct architecture is now explicit:

```text
standard-2026-07-v3 source templates / source adapters
-> Evidence Registry
-> Canonical Facts
-> Entity Profiles
-> Relationship Graph
-> Context Gaps / Confidence
-> TowerContextPack
-> TowerMetricRecord / TowerValueRecord / TowerValueClaim
-> Tower UI / Tower aVa
```

The current bridge is still:

```text
tower-standardized-v1
-> cio_tower tables
-> Tower UI / Tower aVa
```

That bridge may remain temporarily only as a derived/read-optimized projection. It must not be treated as Tower source of truth.

## Selected Path

Path A - Derived Tower Projection

Current Tower depends heavily on cio_tower, so the practical migration path is to keep cio_tower as a read-optimized projection while requiring every visible row to reconcile back to v3 governed context. Path B remains a later simplification option.

## Hard-rule checks

- Fail: Tower-visible rows lack v3/context-layer lineage — cio_tower schema does not contain the required lineage fields for every Tower-visible row.
- Fail: cio_tower rows are treated as source of truth without reconciliation — Tower UI consumes cio_tower directly through loadCioTowerCxoView while required v3 reconciliation fields are absent.
- Fail: tower-standardized-v1 remains an independent active source — tower-standardized-v1 exists and scripts/tower/load-cio-tower-standardized-v1.mjs reads it.
- Fail: realized value appears without TowerValueClaim support — Tower has realized_value_usd value-state code, but TowerContextPack does not define TowerValueClaim/TowerValueRecord support.
- Fail: old V6/V7 bridge rows are visible as product truth — Prior derivation audit found the V7 projection bridge exists; current audit does not prove it is hidden from product truth.
- Fail: Tower data bypasses Evidence Registry / Canonical Facts / Entity Profiles / Relationship Graph — Missing evidence_registry_id, canonical_fact_id, entity_profile_id, and relationship_edge_id on cio_tower serving rows.

## v3 coverage

- Required Tower dimensions present in v3 template: yes
- Existing source adapters in v3 pack: SA01_ServiceNow_CMDB_Extract_Template.xlsx, SA02_IT_Finance_Budget_Spend_Extract_Template.xlsx, SA03_Vendor_Contracts_Extract_Template.xlsx, SA04_Program_Portfolio_Extract_Template.xlsx, SA05_Cloud_Inventory_Extract_Template.xlsx, SA06_Incident_Problem_Change_Extract_Template.xlsx
- Proposed Tower source adapters present: no
- Active tenant CSV files under canonical root: 114
- Separate `tower-standardized-v1` files still present: 250

## Definition of done

Tower may use read-optimized projections, but Tower truth must come from the v3 enterprise context layer. `cio_tower` can survive only as a reconciled projection with source/evidence/canonical/entity/relationship/context-gap lineage and value-claim status.
