# ECL Tower Read Path Disposition - 2026-08-27

## Purpose

This artifact records the disposition for files that still mention pre-ECL Tower or Tower-adjacent schemas. It separates the live Tower page/API path from broader product-runtime references and operator scripts, because those are different risks and must not share one progress denominator.

## Measurement Reconciliation

The previously reported `50/50` denominator is withdrawn. It mixed scopes and included a duplicate row, so it is not a valid status metric.

The reproducible inventory is anchored to `origin/main`, not the working tree:

```bash
git grep -l -P '(?:^|[^A-Za-z0-9_])(?:cio_tower|consumption|tower)\.[a-z0-9_]+' \
  origin/main -- 'src/app' 'src/lib' \
  ':!**/__tests__/**' ':!**/__fixtures__/**' ':!**/*.test.*' ':!**/*.spec.*'
```

Product runtime inventory: **39 files**.

```bash
git grep -l -P '(?:^|[^A-Za-z0-9_])(?:cio_tower|consumption|tower)\.[a-z0-9_]+' \
  origin/main -- 'scripts' 'src/scripts'
```

Script/operator inventory: **56 files**.

A separate review reported 63 script files, but that count is not reproducible with the same named-ref schema scan. Amend this artifact only with the command and file list that produce the alternate denominator.

## Read Path Decision

`src/lib/tower/readTowerCommandCenter.ts` was contributing to the rendered Tower page. It was not dead alongside the ECL path.

Before this change, `/tower` called `readTowerCommandCenter`, and that reader queried pre-ECL Tower and consumption tables for the first-viewport Command Center model. After this change, the same page contract is populated from `serving.tower_*` views and refuses any returned serving row without source-record references.

Rendered-page change captured:

- The first-viewport Command Center remains present.
- First-viewport metrics now come from ECL serving views, not `tower.*` or `consumption.tower_*`.
- The mixed-basis `Declared vs observed` reconciliation panel was removed because it read a separate legacy Home/canonical path and could place old-basis figures beside ECL figures.
- The ECL projection diagnostic panel remains below the Command Center.

## Runtime Gate

The production-break gate is the live Tower page/API path, not every historical product file:

- Tower live route/API/runtime path clear of pre-ECL Tower schema reads: **7/7**.
- Product runtime inventory physically cleared by this PR: **6/39**.
- Product runtime inventory dispositioned below: **39/39**.
- Script/operator inventory dispositioned below: **56/56**.

The route fence scans:

- `src/app/(maestro)/tower/page.tsx`
- `src/app/api/tower/ask/route.ts`
- `src/app/api/tower/chat/route.ts`
- `src/lib/atlas/orchestrator.ts`
- `src/lib/tower/command-center/view-model.ts`
- `src/lib/tower/current-layer-answer.ts`
- `src/lib/tower/readTowerCommandCenter.ts`

It rejects `cio_tower.*`, `consumption.tower_*`, and pre-ECL `tower.*` value/metric read-model references on this live Tower path.

## Disposition Vocabulary

- `repointed_to_serving`: the file is active and now uses, or is guarded to require, the ECL serving path.
- `deleted_dead`: the file is historical/dead or should be removed by cleanup rather than retained as current runtime.
- `retained_schema_migrates`: the file is intentionally retained as schema migration evidence, test coverage, fixture material, or a non-current operator until its owning schema is migrated or retired through the governed lane.

## Product Runtime Inventory - 39 Files

| file | disposition | reason |
|---|---|---|
| `src/app/(maestro)/source/preview/workspace/buildViewModel.ts` | `retained_schema_migrates` | Source workspace reference is outside the Tower page path and belongs to the Source migration lane. |
| `src/app/api/tower/decision/route.ts` | `retained_schema_migrates` | Decision API is outside the Command Center route path; retain until the decision surface is repointed or retired. |
| `src/lib/admin/broker/notifications-registry.ts` | `retained_schema_migrates` | Admin notification metadata is not a Tower page reader; migrate with admin/control-plane cleanup. |
| `src/lib/admin/data/fixtures/admin-users-fixture.ts` | `retained_schema_migrates` | Fixture reference only; not a live Tower database read. |
| `src/lib/admin/users-access-page-view.ts` | `retained_schema_migrates` | Admin access view reference; migrate with admin/control-plane cleanup. |
| `src/lib/atlas/llm.ts` | `retained_schema_migrates` | Shared model-support library outside the Tower Command Center route. |
| `src/lib/cio-tower/answer.ts` | `deleted_dead` | Legacy CIO Tower answer path; not imported by the live Tower page/API path. |
| `src/lib/cio-tower/cxo-view-model.ts` | `deleted_dead` | Legacy CIO Tower view-model path; superseded by ECL serving. |
| `src/lib/cio-tower/mart-projection/assemble-mart.ts` | `deleted_dead` | Legacy mart projection path superseded by ECL projections and serving views. |
| `src/lib/cio-tower/mart-projection/facts-from-tower.ts` | `deleted_dead` | Legacy mart projection helper superseded by ECL. |
| `src/lib/cio-tower/mart-projection/facts-from-v3.ts` | `deleted_dead` | Legacy mart projection helper superseded by ECL. |
| `src/lib/cio-tower/mart-projection/facts-schema.ts` | `deleted_dead` | Legacy mart projection helper superseded by ECL. |
| `src/lib/cio-tower/mart-projection/merge-facts.ts` | `deleted_dead` | Legacy mart projection helper superseded by ECL. |
| `src/lib/cio-tower/mart-projection/tool-identity-crosswalk.ts` | `deleted_dead` | Legacy mart projection helper superseded by ECL. |
| `src/lib/cio-tower/tower-mart-view-model.ts` | `deleted_dead` | Legacy CIO Tower library superseded by ECL serving. |
| `src/lib/features/registry.ts` | `retained_schema_migrates` | Feature registry reference retained until old Tower feature flags are retired. |
| `src/lib/home/ai-success-data/architecture-advisory-result.json` | `retained_schema_migrates` | Static Home success fixture; belongs to Home cleanup, not Tower read-path cleanup. |
| `src/lib/home/ai-success-data/architecture-graph.json` | `retained_schema_migrates` | Static Home graph fixture; belongs to Home cleanup, not Tower read-path cleanup. |
| `src/lib/home/ai-success-data/data-capability-packet.json` | `retained_schema_migrates` | Static Home data fixture; belongs to Home cleanup, not Tower read-path cleanup. |
| `src/lib/knowledge/consumption-client/contract-fixture-provider.ts` | `retained_schema_migrates` | Knowledge fixture provider outside the Tower Command Center runtime path. |
| `src/lib/knowledge/consumption-contracts/core.ts` | `retained_schema_migrates` | Knowledge contract schema artifact; retain until Knowledge migrates. |
| `src/lib/knowledge/consumption-contracts/metrics.ts` | `retained_schema_migrates` | Knowledge metric contract artifact; retain until Knowledge migrates. |
| `src/lib/knowledge/consumption-contracts/projections.ts` | `retained_schema_migrates` | Knowledge projection contract artifact; retain until Knowledge migrates. |
| `src/lib/knowledge/consumption-server/reader.ts` | `retained_schema_migrates` | Knowledge reader outside the Tower page path; migrate with Knowledge. |
| `src/lib/notifications/module-producers.ts` | `retained_schema_migrates` | Notification metadata outside the Tower page path. |
| `src/lib/notifications/registry.ts` | `retained_schema_migrates` | Notification metadata outside the Tower page path. |
| `src/lib/programs/expert-kernel/exports/board-grade/pack-model.ts` | `retained_schema_migrates` | Program export model outside the Tower Command Center route. |
| `src/lib/source/data-model/contract-optimization-evidence-readiness.ts` | `retained_schema_migrates` | Source optimization model still names old proof concepts; migrate with Source. |
| `src/lib/source/data-model/contract-optimization-evidence.ts` | `retained_schema_migrates` | Source optimization model still names old proof concepts; migrate with Source. |
| `src/lib/source/data-model/contract-optimization-ledger.ts` | `retained_schema_migrates` | Source optimization model still names old proof concepts; migrate with Source. |
| `src/lib/source/data-model/read-adapter.ts` | `retained_schema_migrates` | Source read adapter is outside Tower Command Center; migrate with Source. |
| `src/lib/source/data-model/source-v4-workspace-snapshot.ts` | `retained_schema_migrates` | Source workspace snapshot path; migrate with Source. |
| `src/lib/source/data-model/sourcing-opportunities.ts` | `retained_schema_migrates` | Source opportunity model; migrate with Source. |
| `src/lib/source/data-model/types.ts` | `retained_schema_migrates` | Type-only/source terminology reference; migrate with Source. |
| `src/lib/source/should-cost/should-cost-model.ts` | `retained_schema_migrates` | Source should-cost model; migrate with Source. |
| `src/lib/tower/canonical-reconciliation.ts` | `deleted_dead` | Removed from the live page path; its separate panel mixed old and ECL bases. |
| `src/lib/tower/command-center/view-model.ts` | `repointed_to_serving` | Active UI provenance labels now name ECL serving views instead of retired consumption views. |
| `src/lib/tower/readTowerCommandCenter.ts` | `repointed_to_serving` | Live reader retained and repointed to `serving.tower_*` views. |
| `src/lib/tower/tower-materialization.ts` | `retained_schema_migrates` | Historical/materialization helper outside the live Tower page path. |

## Script And Operator Inventory - 56 Files

| file | disposition | reason |
|---|---|---|
| `scripts/audit/build-module-data-integration-audit.mjs` | `retained_schema_migrates` | Cross-module audit script; not a live Tower reader. |
| `scripts/audit/build-module-migration-sunset-backlog.mjs` | `retained_schema_migrates` | Backlog builder used for migration planning, not runtime serving. |
| `scripts/audit/candidate-consumption-proof.mjs` | `retained_schema_migrates` | Historical proof script; retain until proof lane is migrated or retired. |
| `scripts/data-build/refresh-source-l4-cube.ts` | `retained_schema_migrates` | Source data-build script outside Tower runtime. |
| `scripts/data-build/refresh-tower-value-evidence.ts` | `deleted_dead` | Pre-ECL Tower data-build script superseded by governed ECL data-build jobs. |
| `scripts/data-build/verify-tower-value-evidence-readback.ts` | `deleted_dead` | Pre-ECL Tower readback script superseded by ECL readback proof. |
| `scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs` | `repointed_to_serving` | Status test now treats cleanup as closed by decision and tracks Tower runtime/disposition metrics. |
| `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` | `retained_schema_migrates` | Foundation-v2 historical test; outside Tower runtime. |
| `scripts/foundation-v2/__tests__/run-validate-approved-package-tests.mjs` | `retained_schema_migrates` | Foundation-v2 historical test; outside Tower runtime. |
| `scripts/foundation-v2/execute-golden-slice-db.mjs` | `retained_schema_migrates` | Foundation-v2 executor; outside Tower runtime. |
| `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` | `retained_schema_migrates` | Knowledge test script; outside Tower runtime. |
| `scripts/knowledge/airline-demo-active-promotion.mjs` | `deleted_dead` | Historical candidate-promotion script superseded by ECL data-build/readback. |
| `scripts/knowledge/backfill-exploration-evidence.mjs` | `retained_schema_migrates` | Knowledge backfill utility; outside Tower runtime. |
| `scripts/knowledge/build-consumption-projections-v1.ts` | `retained_schema_migrates` | Knowledge consumption builder; migrate with Knowledge. |
| `scripts/knowledge/build-foundation-v3-day-one-breach-report.mjs` | `retained_schema_migrates` | Historical report builder; outside Tower runtime. |
| `scripts/knowledge/build-phase2b3c-postgres-plan.mjs` | `retained_schema_migrates` | Historical planning script; outside Tower runtime. |
| `scripts/knowledge/build-phase3c2d-consumption-contracts.mjs` | `retained_schema_migrates` | Knowledge consumption contract builder; migrate with Knowledge. |
| `scripts/knowledge/consumption-activation-gates.mjs` | `retained_schema_migrates` | Knowledge activation gate utility; outside Tower runtime. |
| `scripts/knowledge/consumption-metric-parity.ts` | `retained_schema_migrates` | Knowledge parity utility; outside Tower runtime. |
| `scripts/knowledge/fs-airline-active-promotion-review.mjs` | `deleted_dead` | Historical promotion review utility superseded by ECL. |
| `scripts/knowledge/fs-airline-azure-candidate-load.mjs` | `deleted_dead` | Historical candidate-load utility superseded by ECL. |
| `scripts/knowledge/fs-demo-active-promotion.mjs` | `deleted_dead` | Historical demo promotion utility superseded by ECL. |
| `scripts/knowledge/load-tenant-candidate-context.mjs` | `deleted_dead` | Historical candidate-context loader superseded by ECL. |
| `scripts/knowledge/processing/executor-framework.mjs` | `retained_schema_migrates` | Knowledge processing framework; migrate with Knowledge. |
| `scripts/knowledge/reconcile-tenant-data-plane.mjs` | `retained_schema_migrates` | Historical reconciliation utility; outside Tower runtime. |
| `scripts/qa/airline-e2e-live-reconciliation-readback.mjs` | `retained_schema_migrates` | Historical QA script; outside Tower runtime. |
| `scripts/qa/airline-module-data-plane-certification.mjs` | `retained_schema_migrates` | Historical QA script; outside Tower runtime. |
| `scripts/qa/airline-module-runtime-db-proof.mjs` | `retained_schema_migrates` | Historical QA script; outside Tower runtime. |
| `scripts/qa/home-tower-ava-100q-stream-audit.mjs` | `deleted_dead` | Historical Tower answer proof utility superseded by ECL eval proof. |
| `scripts/qa/skyharbor-day-one-breach-readback.mjs` | `retained_schema_migrates` | Historical QA script; outside Tower runtime. |
| `scripts/qa/skyharbor-phase-a-candidate-readback.mjs` | `retained_schema_migrates` | Historical QA script; outside Tower runtime. |
| `scripts/qa/tower-answer-contract-executor.ts` | `deleted_dead` | Historical Tower answer proof utility superseded by ECL eval proof. |
| `scripts/qa/tower-answer-contract-server-runner.ts` | `deleted_dead` | Historical Tower answer proof utility superseded by ECL eval proof. |
| `scripts/source/audit-contract-optimization-evidence-readiness.mjs` | `retained_schema_migrates` | Source optimization audit; migrate with Source. |
| `scripts/source/build-meridian-contract-evidence-package.mjs` | `retained_schema_migrates` | Source evidence package builder; migrate with Source. |
| `scripts/source/build-meridian-health-demo-package.mjs` | `retained_schema_migrates` | Source package builder; migrate with Source. |
| `scripts/source/compare-skyharbor-live-lab-postgres.mjs` | `deleted_dead` | Historical live comparison utility superseded by ECL readback/browser proof. |
| `scripts/source/inspect-skyharbor-v3-live-proof.ts` | `deleted_dead` | Historical tenant-specific proof utility superseded by ECL. |
| `scripts/source/skyharbor-v3/load_source_tower_measurements.sql` | `deleted_dead` | Historical fixture SQL superseded by ECL Tower projections. |
| `scripts/source/skyharbor-v3/tower_measurement_layer.sql` | `deleted_dead` | Historical fixture SQL superseded by ECL Tower projections. |
| `scripts/source/source-substrate-lineage-report.mjs` | `retained_schema_migrates` | Source lineage utility; migrate with Source. |
| `scripts/source/verify-source-cube-postgres-reconciliation.mjs` | `retained_schema_migrates` | Source cube verification utility; migrate with Source. |
| `scripts/source/verify-sourcing-context-depth.mjs` | `retained_schema_migrates` | Source depth verifier; migrate with Source. |
| `scripts/tenant-v3/finalize-meridian-v3-reload-templates.mjs` | `deleted_dead` | Historical tenant-v3 reload utility superseded by ECL. |
| `scripts/tenant-v3/tenant-data-factory.mjs` | `retained_schema_migrates` | Historical tenant factory; outside Tower runtime. |
| `scripts/tower/load-cio-tower-standardized-v1.mjs` | `deleted_dead` | Historical CIO Tower loader superseded by ECL. |
| `scripts/tower/project-meridian-v3-to-cio-tower.mjs` | `deleted_dead` | Historical CIO Tower projector superseded by ECL. |
| `scripts/tower/query-cio-tower-answer-traces.mjs` | `deleted_dead` | Historical inspection utility queued for cleanup. |
| `scripts/tower/query-cio-tower-proof.mjs` | `deleted_dead` | Historical inspection utility queued for cleanup. |
| `scripts/tower/tower-data-trust-gate.mjs` | `retained_schema_migrates` | Historical trust gate retained as migration evidence until replaced. |
| `scripts/tower/validate-cio-tower-quality.mjs` | `deleted_dead` | Historical validator superseded by ECL proof. |
| `scripts/tower/verify-tower-value-os.mjs` | `retained_schema_migrates` | Historical verifier retained as migration evidence until formally retired. |
| `src/scripts/lakeshore/load-cio-tower-facts.ts` | `deleted_dead` | Historical tenant-specific loader superseded by ECL source/context/projection loaders. |
| `src/scripts/lakeshore/load-product-substrate.ts` | `retained_schema_migrates` | Historical product-substrate loader; outside Tower runtime. |
| `src/scripts/tower/project-tower-mart-write.ts` | `deleted_dead` | Historical Tower mart writer superseded by ECL. |
| `src/scripts/tower/project-tower-mart.ts` | `deleted_dead` | Historical Tower mart projector superseded by ECL. |
