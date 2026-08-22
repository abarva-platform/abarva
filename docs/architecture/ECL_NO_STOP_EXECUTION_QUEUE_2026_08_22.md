# ECL No-Stop Execution Queue

Purpose: keep execution moving in order without asking for confirmation on every local proof slice.

This queue does not override hard gates. It documents what can proceed automatically and what requires an explicit stop because it mutates shared infrastructure, active tenant data, migrations, or traffic.

CI runner: `.github/workflows/ecl-no-stop-data-pipeline.yml` executes the local proof lane, uploads proof artifacts, and can explicitly merge a PR after proof passes when invoked with `confirm_merge=MERGE`. Shared ACA deploy still belongs to `.github/workflows/aca-main-deploy.yml` after merge to `main`.

## Auto-Proceed Lane

| Order | Slice                                   | Current artifact/proof                                                                                                     | Next automatic action                                                                                                                  | Stop gate                                                      |
| ----: | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
|     1 | Commercial contract source-room proof   | `scripts/ecl/run_commercial_contract_proof.py`; accepted proof bundle with 26 artifact hashes and 67 source-room hashes.   | Generalize proof-runner, extraction-map, product-consumption-map, and document-quality patterns across other ECL builders.             | Azure load, migration, product repointing, browser-live claim. |
|     2 | Legacy table retirement pressure map    | `reports/ecl-legacy-table-retirement-map-2026-08-22/`: 895 repo-visible `CREATE TABLE` statements classified.              | Add writer/reader owner fields, parity target, and live-readback checklist for `HOLD_*` and projection-replacement rows.               | Live DB readback or retirement authorization.                  |
|     3 | Client extraction mapping               | Commercial slice documents 12 extracts with owner, source system, grain, join keys, quality gates, and examples.           | Extend the same map shape to CMDB, budget/spend, data/analytics volumetrics, AI usage, interviews, infra/cloud, and program portfolio. | Replacing client-facing template package in Azure.             |
|     4 | Dense Meridian source-room requirements | `commercial_scope_dense_meridian_required_additions.*` lists 29 application/platform additions required by contract scope. | Generate dense application/data/infra source-room requirements from product deterministic needs.                                       | Active tenant source replacement.                              |
|     5 | ECL builder quality gates               | Commercial validator, planted failures, lineage, document-quality gate, acceptance summary.                                | Create common runner/acceptance helper so each builder has the same reproducibility bar.                                               | Migration or ACA job execution.                                |
|     6 | Product consumption parity              | `commercial_product_consumption_mapping.*` maps Source 360, Tower, Home, Intelligence, and cubes.                          | Produce page-by-page deterministic fact contracts for the first Source/Tower consumer surfaces.                                        | Product route repointing or deployed/browser-live claim.       |

## Hard Stop Gates

- Azure data-plane write or load.
- Database migration creation/execution against shared environments.
- Active tenant input replacement or snapshot promotion.
- Product route repointing to new ECL projections.
- ACA deploy, traffic shift, or runtime template mutation.
- Claiming browser/live proof without a signed-in browser crawl.
- Deleting or retiring old tables/files/loaders.

## Execution Rule

When a slice stays in the auto-proceed lane, keep going: implement, run the proof command, write the evidence artifact, update the tracker, and package output when useful. Report status only after a proof boundary or if a hard stop gate is reached.
