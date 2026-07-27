# Consumption Reconciliation Test Plan

Reconciliation does not stop at canonical row counts. Every major count, metric, list and graph must be certified through the full path.

Canonical SQL value = Publication value = Consumption-view value = Cube value = API value = Home/Nexus displayed value.

For lists and graphs, use key-set hashes and content hashes rather than counts alone.

## Required ledgers

| Tenant | Baseline | Measure/view | Canonical | Publication | Consumption | Cube | API | UI | Status |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| airline-demo-new | AIRDN-KB-001 | Applications | TBD | TBD | TBD | TBD | TBD | TBD | pending |
| airline-demo-new | AIRDN-KB-001 | Active contracts | TBD | TBD | TBD | TBD | TBD | TBD | pending |
| healthcare-demo-new | HCDN-KB-001 | Epic modules | TBD | TBD | TBD | TBD | TBD | TBD | pending |

## Wave rule

Every load wave must build and validate the projections it unlocks immediately. Do not wait until final load to discover a consumption contract mismatch.
