# 2026-06-12-workspace-explorer-source-readonly — Source Workspace Explorer read-only shell

## Release ID

`2026-06-12-workspace-explorer-source-readonly`

## Status

`candidate`

## Plain-English Summary

Adds the first read-only Workspace Explorer surface for Source events. When the `workspace_explorer_source` tenant flag is enabled, a Source event can open `/source/events/{eventId}/workspace` to see registry-backed files, expected deliverables, evidence readiness rows, and approval/gate records in one explorer. The explorer reads existing Source registry and canvas-substrate queries only; it does not upload, generate, approve, advance, delete, or alter existing route contracts.

## Layer Impact

- `global-control-lane`: Adds a reusable Workspace Explorer shell component for module-level file and deliverable surfacing.
- `global-control-lane`: Adds a Source read-only adapter that maps existing `source_artifacts` and Source canvas-substrate reads into the shared `WorkspaceItem` contract.
- `global-control-lane`: Adds a flag-gated Source workspace route without changing the existing event canvas, artifact page, upload route, generate route, gate route, or Source navigation.

## Client Applicability

- All clients: no behavior change while `workspace_explorer_source` remains default off.
- Specific clients: none enabled by this release.
- Internal only: tenants can be opted in through `ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS`.
- Public/demo only: not applicable.
- Feature flag: `workspace_explorer_source`.

## Changes Included

- Adds `WorkspaceExplorer`, a reusable three-pane nav/list/preview shell.
- Adds `SourceWorkspaceAdapter` read-only server adapter over `listSourceArtifactsForSourceEventId`, `listArtifactStatesForEvent`, `listEvidenceStatesForEvent`, and `listGateCriterionStatesForEvent`.
- Adds pure Source mapping helpers and tests for registry uploads, expected deliverables, evidence rows, and approval records.
- Adds `/source/events/[eventId]/workspace`, gated by `workspace_explorer_source`, using the resolved event UUID for substrate reads.
- Extends the shared `WorkspaceItem` contract with optional `description` and `href` fields for previews/actions.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts --runInBand`.
- PASS: `npx eslint src/lib/workspace-explorer/types.ts src/lib/workspace-explorer/source-adapter.ts src/lib/workspace-explorer/source-adapter-mapping.ts src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts src/components/workspace-explorer/WorkspaceExplorer.tsx 'src/app/(maestro)/source/events/[eventId]/workspace/page.tsx'`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run audit:architecture-rules` reported 0 violations.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` through PR and standard CI. The route remains unavailable unless a tenant is explicitly allowlisted for `workspace_explorer_source`; no database migration or ACA job is required for this read-only slice.

## Rollback Plan

Revert the PR to remove the read-only route, shell, and adapter. If a tenant allowlist was configured, clear `ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS` for immediate rollback without code changes.

## Audit Evidence

- Pull request and CI checks for the `codex/workspace-explorer-we1` branch.
- Local Jest, ESLint, TypeScript, architecture rules, whitespace, and release-control output.
- Mapper tests proving Source registry uploads and substrate records are surfaced without fabricating lineage or duplicating linked registry artifacts.

## Known Gaps

WE-1 is read-only surfacing only. It does not add the drawer entry point, declutter the Source canvas, add Workspace/Generate chips, add lineage columns, wire generation, upload/version files from the explorer, build the Moves adapter, build the tenant vault, or run ACA private-DB state-level proof. Historical records still show "lineage not yet recorded" unless an existing substrate row explicitly cites an artifact id.
