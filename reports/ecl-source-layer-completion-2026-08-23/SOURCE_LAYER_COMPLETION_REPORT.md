# ECL Source Layer Completion Report

- Generated: `2026-08-23T08:45:01.894162+00:00`
- Local queue passed: `19 / 19` executable slices
- Hard-gated slices: `1`
- Commercial Source vertical loaded locally across layers: `true`
- Full Source fully loaded and comprehensive across all layers: `false`

## Plain-English Verdict

The commercial Source 360 vertical is locally loaded through source room, builder, ECL core tables, Source/Tower projections, and commercial cubes with disposable-Postgres proof and static previews. Full Source is not yet 100% comprehensive because the remaining source families are mapped and specified, but not dense-loaded through Azure, product routes, live browser proof, retrieval, and all cross-product cubes.

## Why Full Source Is Not Yet Complete

- Dense source rooms for all nine families are requirements/planning artifacts, not fully populated source-room data.
- Azure/client-preprod load and independent readback were not performed in this local lane.
- Current product routes were not repointed to ECL and signed-in browser QA was not claimed.
- Home, Intelligence, Moves, and cross-family cube consumers are not all built against ECL yet.

## Layer Matrix

| Layer | Area | State | Passed | Remaining | Next gate |
|---|---|---|---|---|---|
| Backlog queue | 20-slice local execution queue | `local_proof_complete_with_hard_gate` | 19 executable passed; 1 hard-gated | Item 20 requires product route repointing and live/browser proof. | product_route_repointing |
| L1 client intake | Client workbook execution package | `local_package_contract_ready_not_published` | 83 field-guide rows; 9 example rows; 0 issues | Package is not published/replaced in Azure and not yet filled with dense client-scale synthetic rows across every family. | client_package_replacement |
| L1 source room | Commercial contract source room | `local_source_room_loaded` | 71 source-room hashes; 540 lineage rows; 0 document quality issues | Other source families are mapped as requirements, not yet source-room dense-loaded. | active_tenant_source_replacement_or_dense_package_promotion |
| L2 adapters/builders | Commercial source-room builder and validators | `local_builder_proven` | 22 expected-count checks; 16 extracts documented; planted failures pass | Reusable adapters for all nine source families are not built and no ACA data-build job executed. | migration_or_aca_data_build_execution |
| L3 ecl_source | Source files, source records, documents, extractions | `loaded_in_disposable_postgres` | 71 source files; 589 records; 55 documents; 235 extractions | No Azure/client-preprod load; no retrieval/index publication. | Azure_data_plane_load |
| L3 ecl_context | Objects, relationships, measures | `loaded_in_disposable_postgres` | 48 objects; 49 relationships; 75 measures | Dense application/data/AI/interview context across all source families is not loaded yet. | dense_source_room_build_then_Azure_load |
| L3 ecl_commercial | Contracts, service lines, scope, invoice, SLA | `loaded_in_disposable_postgres` | 5 contracts; 20 service lines; 44 scope links; 40 invoice lines; 90 SLA observations | The slice is deliberately five contracts, not a full tenant-scale commercial portfolio. | dense_commercial_population_and_Azure_load |
| L3 ecl_review | Review events and gates | `loaded_in_disposable_postgres` | 13 review events | Human review workflow UI and real approvals are not executed. | review_workflow_and_product_adoption |
| L4 Source 360 | Contract, vendor, value, and event projections | `local_projection_ready_not_repointed` | 5 contracts; 5 vendors; 5 value levers; 13 workspace rows | Current product routes are not repointed; signed-in browser QA is not claimed. | product_route_repointing_then_signed_in_browser_QA |
| L4 Tower | Tower command center preview | `local_static_preview_only` | 5 tower rows | Tower runtime dashboards and signed-in browser QA remain open. | product_route_repointing_then_signed_in_browser_QA |
| Product fact contracts | Home, Source, Tower, Intelligence, Moves, Cubes | `planning_contract_ready` | 8 contracts accepted; browser proof status not_started | Home, Intelligence, Moves, and most Tower consumers are not built against ECL yet. | product_projection_build_and_browser_QA |
| Cubes | Commercial/source/tower cube slices | `loaded_in_disposable_postgres` | 4 manifests; 20 slices; 160 metric links; 160 measure links | Cross-family cubes for Home architecture, D&A, AI usage, Moves, and Intelligence are not populated. | dense_source_family_population |
| Dense source coverage | Nine required source families | `requirements_ready_not_dense_loaded` | 9 extraction families accepted; partial processing supported=True | The dense source rooms are not fully generated/loaded across all families, so full Source comprehensiveness is not complete. | active_tenant_source_replacement_or_dense_synthetic_package_promotion |
| Azure/data plane | Client preprod/lab load | `not_loaded` | 0 Azure loads performed by this batch | Run governed ACA data-build job and independent Azure readback after approval. | Azure_data_plane_load_authorization |
| Browser/live product | Source/Tower route and signed-in proof | `hard_gated` | 0 live browser claims; route readiness accepted | Repoint behind explicit adapter flag, deploy through approved lane, then run signed-in browser QA. | product_route_repointing |
| Legacy sunset | Static table retirement pressure map | `static_inventory_ready_not_retired` | 736 unique table names; deletion authorization=False | No live readback, parity proof, or retirement authorization. | live_readback_and_retirement_authorization |

## 20 Backlog Items

| Order | Slice | Result | Checkpoint | Stop gate |
|---:|---|---|---:|---|
| 1 | `commercial_contract_source_room_proof` | `passed` | 5% | Azure load, migration, product repointing, or browser-live claim. |
| 2 | `legacy_table_retirement_pressure_map` | `passed` | 10% | Live Azure DB readback or retirement authorization. |
| 3 | `client_extraction_mapping_extension` | `passed` | 15% | Replacing client-facing template packages in Azure. |
| 4 | `dense_meridian_requirements` | `passed` | 21% | Active tenant source replacement. |
| 5 | `product_consumption_fact_contracts` | `passed` | 26% | Product route repointing or deployed browser-live claim. |
| 6 | `builder_quality_gate_generalization` | `passed` | 31% | Migration or ACA data-build execution. |
| 7 | `source_360_client_language_cleanup` | `passed` | 36% | Product route repointing or deployed browser-live claim. |
| 8 | `source_360_weak_contract_preview` | `passed` | 42% | Product route repointing or deployed browser-live claim. |
| 9 | `commercial_document_grammar_gate` | `passed` | 47% | Active tenant source replacement or dense document promotion. |
| 10 | `ecl_cross_family_client_extraction_mapping` | `passed` | 52% | Replacing client-facing workbook packages in Azure. |
| 11 | `ecl_dense_source_room_requirements` | `passed` | 57% | Active tenant source replacement or dense synthetic package promotion. |
| 12 | `ecl_product_deterministic_fact_contracts` | `passed` | 63% | Product route repointing or deployed browser-live claim. |
| 13 | `ecl_next_slice_acceptance_gate` | `passed` | 68% | None while validation remains local and report-only. |
| 14 | `ecl_client_workbook_execution_package` | `passed` | 73% | Replacing client-facing workbook packages in Azure. |
| 15 | `ecl_client_workbook_execution_validation` | `passed` | 78% | Replacing client-facing workbook packages in Azure. |
| 16 | `operator_status_reporting_gate` | `passed` | 84% | None while validation remains local and report-only. |
| 17 | `source_360_route_readiness_bridge` | `passed` | 89% | product_route_repointing |
| 18 | `tower_command_center_static_preview` | `passed` | 94% | product_route_repointing |
| 19 | `machine_readable_execution_queue` | `passed` | 100% | None while validation remains local and report-only. |
| 20 | `browser_and_product_repointing_proof` | `hard_gated` | 100% | product_route_repointing |
