# PAT4 · AI Program Failure Modes → Solution Pattern Runtime Map

Slice ID: PAT4_W27
Wave: wave-27
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)

Deterministic runtime mapping that bridges the PF1 AI Program Failure Modes
pack (`src/lib/intelligence/ai-program-failure-modes.ts`) with the PAT1–PAT3
solution pattern packs. Maps 12 canonical failure mode keys to applicable
sourcing and evaluation patterns with salient criteria IDs and agent routing.
**No live runtime, no model invocation, no migrations, no UI.**

## What changed

- New module
  [src/lib/solutions/ai-failure-modes-solution-map.ts](../../../src/lib/solutions/ai-failure-modes-solution-map.ts):
  - Public types: `SolutionPatternPack`, `FailureModeSolutionMapping`,
    `FailureModeSolutionResult`, `FailureModesSolutionReport`.
  - 16 mapping entries across 12 failure mode keys → PAT1/PAT2/PAT3.
  - Public accessors:
    - `mapFailureModeToSolutions(key)` — all solution patterns for one failure mode.
    - `buildFailureModesSolutionReport(keys)` — aggregated report for multiple modes.
    - `getFailureModesByPatternPack(pack)` — reverse lookup by pack.
    - `getFailureModesByPatternSlug(slug)` — reverse lookup by slug.
    - `getMappingsForPatternPack(pack, slug?)` — all mappings for a pack/slug.
    - `failureModeHasSolutionMapping(key)` — lightweight boolean check.
  - Re-exports: `ALL_FAILURE_MODE_SOLUTION_MAPPINGS`, `SOLUTION_PATTERN_PACKS`,
    `MAPPED_FAILURE_MODE_KEYS`.
  - `createdFrom: 'pat4_ai_failure_modes_solution_map'` discriminator on all records.

## Failure modes covered

| Failure Mode Key | Pattern Pack(s) | Primary Agent |
|---|---|---|
| weak_data_foundation | PAT1 (both slugs) | steward |
| no_measurable_baseline | PAT3 | atlas |
| no_value_ledger | PAT3 | atlas |
| weak_workflow_integration | PAT2, PAT1 | nexus |
| tool_first_thinking | PAT3 | nexus |
| missing_governance_risk | PAT1, PAT2, PAT3 | steward |
| no_adoption_change_plan | PAT2 | nexus |
| no_operating_model_for_scale | PAT2, PAT1 | atlas |
| pilot_purgatory | PAT3 | atlas |
| ai_tool_sprawl_without_value | PAT3 | atlas |
| poor_use_case_framing | PAT3 | nexus |
| no_business_owner | PAT3 | steward |

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/pattern-library-packs.test.ts` — 91 passed
- `npm run build` — pass
