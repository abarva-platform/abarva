# Tower Active Budget Envelope Repair

Status: PASS (write applied)

This repair adds explicit FY26 budget-envelope source rows to active tenant input packs where the Tower source-path audit found blocking `total_it_budget_fy26` gaps.

No product runtime or database mart changes are made by this script. Marts must still be regenerated through the governed ACA operator job after merge/deploy.

| Tenant | Total | Run | Change | AI tagged | Status | Caveat |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| apex-retail | 1516800000 | 979600000 | 537200000 | 25400000 | READY |  |
| first-capital-financial | 2132000000 | 1321840000 | 810160000 | 323960000 | READY |  |
| lakeshore-holdings | 190600000 |  |  | 11800000 | READY_WITH_SPLIT_PENDING | Corporate/local budget fields reconcile to total, but source does not declare run/change split. |
| lakeshore-industries | 877920000 | 604160000 | 273760000 | 105665000 | READY |  |
| skyharbor-air | 2578000000 | 1445400000 | 1132600000 | 0 | READY |  |
