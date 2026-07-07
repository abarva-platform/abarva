# 2026-06-12-workspace-explorer-lineage-seam — Workspace Explorer lineage seam

## Release ID

`2026-06-12-workspace-explorer-lineage-seam`

## Status

`candidate`

## Plain-English Summary

Adds the additive lineage columns that let Workspace Explorer show which governed inputs a generated artifact or deliverable actually cited. This release deliberately does not infer or backfill historical lineage. Existing items continue to show "lineage not yet recorded" unless a row has explicit cited input ids.

## Layer Impact

- `client-data-lane`: Adds additive UUID-array lineage columns and GIN indexes to `source_artifacts`, `generated_artifacts`, and `deliverables_v2`.
- `global-control-lane`: Exposes `source_artifacts.cited_source_artifact_ids` through the Source artifact registry type and read mapper.
- `global-control-lane`: Updates the Source Workspace Explorer mapper so recorded registry lineage renders as real `cites` edges while missing lineage remains honest.

## Client Applicability

- All clients: schema columns are additive and default to empty arrays; no historical data changes.
- Specific clients: none.
- Internal only: future generator slices can populate these columns at generation time.
- Public/demo only: not applicable.
- Feature flag: display remains tied to `workspace_explorer_source`; population by future engine slices remains separate.

## Changes Included

- Adds `source_artifacts.cited_source_artifact_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[]`.
- Adds `generated_artifacts.cited_input_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[]`.
- Adds `deliverables_v2.cited_input_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[]`.
- Adds GIN indexes for all three lineage arrays.
- Extends `SourceArtifactRegistryRecord` and row mapping to include `citedSourceArtifactIds`.
- Updates Source Workspace Explorer mapping tests to prove recorded lineage renders and historical rows remain non-fabricated.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts --runInBand`.
- PASS: `npx eslint src/lib/source/artifact-registry/types.ts src/lib/source/artifact-registry/index.ts src/lib/workspace-explorer/source-adapter-mapping.ts src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run audit:architecture-rules` reported 0 violations.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.

## Rollout Plan

Merge through PR and standard CI. Apply the migration in the normal database migration path before enabling any generator slice that writes lineage. No backfill job is part of this release.

## Rollback Plan

If rollback is needed before downstream generators write these columns, revert the PR and drop the new columns/indexes. After downstream slices begin writing lineage, rollback should first pause lineage-writing feature flags and preserve any populated arrays for audit before dropping columns.

## Audit Evidence

- Pull request and CI checks for the `codex/workspace-explorer-we3` branch.
- Migration file `supabase/migrations/20260613043000_workspace_explorer_lineage.sql`.
- Local Jest, ESLint, TypeScript, architecture rules, whitespace, and release-control output.

## Known Gaps

This release creates the lineage seam only. It does not populate lineage during Source or Moves generation, does not backfill historical records, does not add reverse `used by` queries beyond the existing preview shape, and does not run the ACA migration job. Future WE-4 / Doc-Gen slices must populate these columns from evidence actually assembled at generation time.
