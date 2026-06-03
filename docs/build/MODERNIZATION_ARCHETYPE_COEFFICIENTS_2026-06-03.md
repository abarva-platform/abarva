# Modernization Archetype Coefficients — Controlled Slice

## Purpose

This slice turns the modernization pattern-pack research spine into an executable, source-backed
coefficient library. It is intentionally limited to pure expert-kernel data and tests:

- no UI wiring
- no route changes
- no database migrations
- no tenant seed mutation
- no Databricks Analyzer parser yet

The library lives at:

`src/lib/programs/expert-kernel/modernization/archetype-coefficients.ts`

## What Is Encoded

The module defines:

1. A modernization source ledger with stable `source_id` values.
2. Six workload archetype coefficient rows from the v2 spec:
   - source to landing onboarding
   - DataStage ETL job family
   - SQL stored procedure family
   - SQL mart repoint/rebuild
   - SAS program family
   - Tableau / BusinessObjects report family
3. Complexity bands: `small`, `medium`, `large`.
4. Gross person-week planning ranges by archetype and complexity.
5. Automation-leverage planning ranges by archetype.
6. 7R disposition multipliers.
7. Fixed foundation planning ranges for platform foundation and metadata-driven ingestion framework.
8. A residual-effort helper:

`computeHumanResidualPersonWeeks(archetypeId, complexity)`

The helper uses a conservative range formula:

- low residual = low gross effort × (1 - high automation)
- midpoint residual = midpoint gross effort × (1 - midpoint automation)
- high residual = high gross effort × (1 - low automation)

## Honesty Contract

Every coefficient carries:

- `sourceId`
- `asOf`
- `confidence`
- `rationale`

The validation helper rejects unsourced, undated, unordered, or unrationalized coefficient ranges.
Focused Jest tests assert the full library, not just the helper function.

## Source Ledger

Primary sources used in this slice:

| Source ID                                          | Use                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `databricks_lakebridge_overview_2026_06_03`        | Lakebridge migration phase taxonomy; AbarVa consumes assessment/conversion/reconciliation outputs. |
| `databricks_lakebridge_analyzer_2026_06_03`        | Analyzer-style inventory and complexity signals for SQL and ETL assets.                            |
| `databricks_bladebridge_announcement_2026_06_03`   | Conservative automation-leverage direction for legacy warehouse conversion.                        |
| `databricks_well_architected_lakehouse_2026_06_03` | Foundation and governance standards.                                                               |
| `databricks_medallion_architecture_2026_06_03`     | Bronze/Silver/Gold target mapping.                                                                 |
| `databricks_cicd_bundles_2026_06_03`               | CI/CD and deployment automation foundation effort.                                                 |
| `databricks_warehouse_to_lakehouse_2026_06_03`     | Mart and BI repoint/rebuild posture after migration and governance setup.                          |
| `databricks_sas_migration_case_2026_06_03`         | Conservative SAS planning ranges; kept low confidence because the public evidence is qualitative.  |
| `aws_7rs_migration_strategies_2026_06_03`          | Disposition taxonomy and refactor/re-architect complexity premium.                                 |

## Build Notes

The ranges deliberately remain broad. Public Databricks and partner material supports automation
directionally, but not enough to claim one universal automation percentage. The library therefore
uses planning ranges and marks SAS low-confidence until a richer SAS migration benchmark pass lands.

## Deferred

- Lakebridge/Analyzer inventory schema and parser.
- Industry-specific profile defaults for healthcare, retail, and airline source families.
- Estimator integration with the Phase 1 rate-card kernel.
- Source RFP scorecard and divergence report wiring.
- Tenant-scoped data-load templates and persistence.
