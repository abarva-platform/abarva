# PAT1 · Data Platform Managed Services Pattern Pack

Slice ID: PAT1_W27
Wave: wave-27
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)

Deterministic pattern pack for data platform managed services sourcing events.
Covers vendor selection criteria, transition governance, failure modes, BAFO
readiness signals, and Sentinel/Nexus guidance for Databricks, Snowflake, dbt,
and equivalent stacks. **No live runtime, no model invocation, no migrations, no UI.**

## What changed

- New module
  [src/lib/solutions/data-platform-managed-services-pack.ts](../../../src/lib/solutions/data-platform-managed-services-pack.ts):
  - Public types: `DataPlatformPatternSeverity`, `DataPlatformCriteria`,
    `DataPlatformFailureMode`, `DataPlatformSourcingPattern`.
  - Two pattern entries:
    - `data-platform-vendor-selection-criteria` — 5 criteria (technical depth,
      operational model, transition risk, commercial structure, data governance),
      3 failure modes (knowledge loss, silent data quality drift, change order
      scope creep), 5 BAFO readiness signals, 4 recommended gates.
    - `data-platform-transition-governance` — 2 criteria (phase gates, runbook
      completeness), 1 failure mode (premature go-live), 3 BAFO readiness signals,
      4 recommended gates.
  - Public accessors: `getDataPlatformPattern()`, `getDataPlatformPatternsByCategory()`,
    `getDataPlatformBafoChecklist()`, `DATA_PLATFORM_PATTERN_SLUGS`.
  - `createdFrom: 'pat1_data_platform_managed_services'` discriminator on every record.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/pattern-library-packs.test.ts` — 91 passed
- `npm run build` — pass
