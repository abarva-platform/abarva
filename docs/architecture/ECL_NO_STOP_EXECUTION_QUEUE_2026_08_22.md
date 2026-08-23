# ECL No-Stop Execution Queue

Purpose: keep execution moving in order without asking for confirmation on every local proof slice.

This queue does not override hard gates. It documents what can proceed automatically and what requires an explicit stop because it mutates shared infrastructure, active tenant data, migrations, or traffic.

CI runner: `.github/workflows/ecl-no-stop-data-pipeline.yml` executes the local proof lane through `python3 scripts/ecl/run_no_stop_execution_queue.py`, uploads proof artifacts, and can explicitly merge a PR after proof passes when invoked with `confirm_merge=MERGE`. Shared ACA deploy still belongs to `.github/workflows/aca-main-deploy.yml` after merge to `main`.

The runner reads `docs/architecture/ecl-no-stop-execution-queue.json`, executes only pre-authorized local proof/report commands, emits checkpoint events at 0/15/30/45/60/75/90/100 percent, and writes:

- `outputs/ecl-no-stop-execution-run/execution-summary.json`
- `outputs/ecl-no-stop-execution-run/execution-status.md`
- `outputs/ecl-no-stop-execution-run/execution-events.jsonl`
- `outputs/ecl-no-stop-execution-run/operator-status.json`
- `outputs/ecl-no-stop-execution-run/operator-status.md`
- `outputs/ecl-no-stop-execution-run/logs/*.log`

## Auto-Proceed Lane

| Order | Slice                                   | Current artifact/proof                                                                                                     | Next automatic action                                                                                                                  | Stop gate                                                      |
| ----: | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
|     1 | Commercial contract source-room proof   | `scripts/ecl/run_commercial_contract_proof.py`; accepted proof bundle with 26 artifact hashes and 67 source-room hashes.   | Generalize proof-runner, extraction-map, product-consumption-map, and document-quality patterns across other ECL builders.             | Azure load, migration, product repointing, browser-live claim. |
|     2 | Legacy table retirement pressure map    | `reports/ecl-legacy-table-retirement-map-2026-08-22/`: 895 repo-visible `CREATE TABLE` statements classified.              | Add writer/reader owner fields, parity target, and live-readback checklist for `HOLD_*` and projection-replacement rows.               | Live DB readback or retirement authorization.                  |
|     3 | Client extraction mapping               | Commercial slice documents 12 extracts with owner, source system, grain, join keys, quality gates, and examples.           | Extend the same map shape to CMDB, budget/spend, data/analytics volumetrics, AI usage, interviews, infra/cloud, and program portfolio. | Replacing client-facing template package in Azure.             |
|     4 | Dense Meridian source-room requirements | `commercial_scope_dense_meridian_required_additions.*` lists 29 application/platform additions required by contract scope. | Generate dense application/data/infra source-room requirements from product deterministic needs.                                       | Active tenant source replacement.                              |
|     5 | Product consumption parity              | `commercial_product_consumption_mapping.*` maps Source 360, Tower, Home, Intelligence, and cubes.                          | Produce page-by-page deterministic fact contracts for the first Source/Tower consumer surfaces.                                        | Product route repointing or deployed/browser-live claim.       |
|     6 | ECL builder quality gates               | Commercial validator, planted failures, lineage, document-quality gate, acceptance summary.                                | Create common runner/acceptance helper so each builder has the same reproducibility bar.                                               | Migration or ACA job execution.                                |
|     7 | Source 360 client language cleanup      | `render_source_360_contract_preview.py --contract-id MER-CTR-RCM-001` renders the healthy contract and rejects client-visible builder vocabulary. | Keep static render proof ahead of any product-route repointing.                                                                         | Product route repointing or deployed/browser-live claim.       |
|     8 | Source 360 weak-contract preview        | `render_source_360_contract_preview.py --contract-id MER-CTR-SSO-BPO-001 --require-weak-contract` proves the weak contract exposes leverage loss. | Use the weak preview as the Source 360 demo target before route adoption.                                                               | Product route repointing or deployed/browser-live claim.       |
|     9 | Commercial document grammar gate        | `validate_commercial_document_quality.py` rejects snake_case and internal process vocabulary in generated contract documents. | Keep the gate in the dense document generation path before scaling more contracts.                                                       | Active tenant source replacement or dense document promotion.  |
|    10 | Cross-family extraction mapping          | `write_ecl_client_extraction_mapping.py` maps CMDB, application deployment, commercial, budget/spend, D&A volumetrics, AI usage, interviews, infra/cloud, and programs. | Use the owner/source/grain/join/gate map to design practical workbook folders without asking for exhaustive inventories.                 | Replacing client-facing workbook packages in Azure.            |
|    11 | Dense source-room requirements           | `write_ecl_dense_source_room_requirements.py` writes product-driven depth requirements, including mainframe/warehouse/private cloud, D&A, AI, interviews, budget, and contracts. | Use the dense requirements to drive synthetic generation and source-room gap tracking without mutating active tenant inputs.             | Active tenant source replacement or dense synthetic promotion. |
|    12 | Product deterministic fact contracts     | `write_ecl_product_fact_contracts.py` defines page-level deterministic needs for Source, Tower, Home, Intelligence, Moves, and cubes. | Use product fact contracts as the page-by-page basis before building workbook fields, adapters, cubes, or projections.                  | Product route repointing or deployed/browser-live claim.       |
|    13 | Next-slice acceptance gate               | `validate_ecl_next_slice_acceptance.py` validates product coverage, source-family coverage, explicit partial behavior, and anti-overcollection rules. | Keep the next source-room/workbook design falsifiable before any dense package or workbook package is promoted.                         | None while validation remains local and report-only.           |
|    14 | Client workbook execution package        | `build_ecl_client_workbook_execution_package.py` creates one folder per business-facing workbook with field guides, examples, extract recipes, product mapping, and HTML how-to guidance. | Use the folders as the practical client-execution design before any workbook package replacement.                                      | Replacing client-facing workbook packages in Azure.            |
|    15 | Client workbook package validation       | `validate_ecl_client_workbook_execution_package.py` rejects missing folders/files, thin examples, missing partial behavior, missing products, and overcollection language. | Keep fillability, examples, extract recipes, partial behavior, and product coverage falsifiable before package generation scales.       | Replacing client-facing workbook packages in Azure.            |
|    16 | Operator status reporting gate           | `validate_ecl_operator_status_report.py --allow-in-progress` verifies the live operator snapshot has percent complete, checkpoint events, evidence paths, next action, and blocked gate. | Keep progress visible during long runs and make the final proof bundle answer "where are we?" without manual reconstruction.           | None while validation remains local and report-only.           |
|    17 | Queue validation                         | `validate_no_stop_execution_queue.py` verifies queue shape and generated evidence paths after all output-producing slices produce their artifacts. | Keep queue/checkpoint artifacts in the proof bundle for every PR.                                                                      | None while validation remains local and report-only.           |

## No Remaining Queued Local Slices

All local-proof slices currently named in the queue have proof commands. The only remaining blocked row after slice 17 is the product-route/browser proof gate, which intentionally requires explicit runtime authorization.

## Hard Stop Gates

- Azure data-plane write or load.
- Database migration creation/execution against shared environments.
- Active tenant input replacement or snapshot promotion.
- Product route repointing to new ECL projections.
- ACA deploy, traffic shift, or runtime template mutation outside the repo-owned main deploy workflow.
- Claiming browser/live proof without a signed-in browser crawl.
- Deleting or retiring old tables/files/loaders.

## Execution Rule

When a slice stays in the auto-proceed lane, keep going: implement, run the proof command, write the evidence artifact, update the tracker, and package output when useful. The runner publishes checkpoints every 15 percent and writes an operator status report with current percent complete, next local action, blocked gate, and evidence paths. It stops hard-gated slices behind explicit approval.
