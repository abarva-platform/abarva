# What can render `ENABLED_AND_PROVEN` today, given the real data state

Grounded in the foundation-closure record's projection counts
(`clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/foundation-closure-authority-record-20260729.json`)
and `consumption-server/reader.ts`/`shape.ts`'s actual implemented read paths — not aspirational.
"Contract-capable" (from the reconciliation matrix) and "renderable today" are different questions;
this document answers the second one.

## Renderable today (`ENABLED_AND_PROVEN` once a cite-render test exists — see `TEST_PLAN.md`; realistically `DATA_RECONCILED_BUT_UI_UNPROVEN` until that test exists)

| View model                                                                         | Why                                                                                                                                            | Real evidence                                                                                     |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `EnterpriseProfileViewModel`                                                       | `enterprise_brief_v1` has 1 row; `getEnterpriseBrief` reads `payload` straight through                                                         | Closure record: `enterprise_brief_v1: 1`                                                          |
| `ExploreInventoryViewModel` (`domainKey: "technology"`, i.e. applications)         | `application_inventory_v1` has 1,405 rows and `reader.ts` implements a real read path for it                                                   | Closure record: `application_inventory_v1: 1,405`; `reader.ts::exploreEntities` unions this table |
| `ExploreInventoryViewModel` (`domainKey: "vendors"`)                               | `vendor_contract_inventory_v1` has 420 rows, same real read path                                                                               | Closure record: `vendor_contract_inventory_v1: 420`                                               |
| `RelationshipNeighborhoodViewModel`                                                | `relationship_node_v1` (34,534) and `relationship_edge_v1` (16,605) both have real rows and `reader.ts::getRelationships` is fully implemented | Closure record counts; `reader.ts` lines 157–229                                                  |
| `AvaContextViewModel` (models-disabled banner / `getAvaProviderStatus` equivalent) | Purely a runtime-config check (`ANTHROPIC_API_KEY` presence via `ConsumptionRuntime.modelsEnabled`), no tenant data dependency at all          | `consumption-client/factory.ts`                                                                   |

## `PROJECTION_UNAVAILABLE` today (real query exists, but the projection has zero rows for this baseline)

| View model                                                                                                                                                              | Why                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EvidenceAndGapsViewModel`                                                                                                                                              | `evidence_gap_v1: 0` rows in the closure record; `reader.ts::getEvidenceAndGaps` returns `not_loaded` when the read returns zero rows                                                      |
| Any metric-driven part of `TopOpportunitiesViewModel`/`CurrentVsTargetViewModel`/`IndustryContextViewModel` that depends on `metric_observation_v1`/`metric_catalog_v1` | `metric_catalog_v1: 0` rows in the closure record                                                                                                                                          |
| `DecisionReadinessViewModel`'s gap-severity inputs                                                                                                                      | Depends on `getEvidenceAndGaps`, which is `not_loaded` per above — the readiness rollup can still compute from domain coverage alone, but its gap-count component is unavailable, not zero |

## `SOURCE_INCOMPLETE` today (see `SOURCE_INCOMPLETE_COMPONENTS.md` for the full writeup)

`LeadershipAgendaViewModel` and everything built on `EnterpriseBriefV1.perspectives` /
`.interpretation` for the strategic-narrative content.

## `MISSING_PROVIDER_QUERY` / `MISSING_CONSUMPTION_PROJECTION` today (no amount of real data changes this — the contract itself has no home for it yet)

Everything in the reconciliation matrix classified `MISSING_PROVIDER_QUERY` or
`MISSING_CONSUMPTION_PROJECTION` (Purpose statements, Goals, Decision lanes, Contradictions,
Integrations/Programs/Risks inventories, metric trajectories, decision-readiness quadrant). These stay
unavailable regardless of how much data gets loaded, until a contract/registry change lands — that is
data-plane/contract-lane work, not a PR A or PR B concern.

## Bottom line for whoever plans PR B/C's rollout order

The two Explore inventory kinds that are both contract-supported AND already have real rows
(`applications`, `vendors`) plus the Relationships mode (both node/edge tables populated) are the
highest-confidence slice to prove first. Brief mode's headline identity fields are next. Leadership
content should ship its `SOURCE_INCOMPLETE` state honestly rather than being held back — the empty
state itself is real, useful, governed information.
