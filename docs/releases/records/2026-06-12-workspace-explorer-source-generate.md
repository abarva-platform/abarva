# 2026-06-12-workspace-explorer-source-generate — Workspace Explorer Source generate seam

## Release ID

`2026-06-12-workspace-explorer-source-generate`

## Status

`candidate`

## Plain-English Summary

Adds the first write action to the Source Workspace Explorer: when opened from the canvas Generate chip, the workspace shows stage-scoped artifact candidates and calls the existing per-artifact Source generate route. The route remains a black box to the explorer. Successful responses show the returned quality gate summary when the active generator provides one, refresh the workspace so the persisted draft appears, and route the user back to the existing canvas review/approval flow.

## Layer Impact

- `global-control-lane`: Adds Source generation candidates to the Workspace Explorer read model.
- `global-control-lane`: Adds a client-side Generate panel to the Workspace Explorer shell.
- `global-control-lane`: Wires `/source/events/[eventId]/workspace?intent=generate&stage=...` to stage-scoped candidates backed by existing Source artifact states.

## Client Applicability

- All clients with `workspace_explorer_source` enabled.
- Specific clients: none.
- Internal only: generation still requires the existing Source generation permission checks.
- Public/demo only: not applicable.
- Feature flag: the workspace route and Generate entry remain behind `workspace_explorer_source`.

## Changes Included

- Adds `WorkspaceGenerateCandidate` and `WorkspaceGenerateIntent` to the Workspace Explorer contract.
- Derives Source generate candidates from existing `source_event_artifact_states` and `listSupportedGenerationCodes()`.
- Posts to the existing `/api/v1/source/{eventId}/artifacts/{artifactCode}/generate` route without changing the route contract.
- Surfaces returned quality-gate metadata when present.
- Shows missing-upstream errors from the existing route without fabricating a draft.
- Keeps approval in the existing canvas flow by linking back to the stage for human review.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand`.
- PASS: `npx eslint src/components/workspace-explorer/WorkspaceExplorer.tsx src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx src/lib/workspace-explorer/types.ts src/lib/workspace-explorer/source-adapter.ts src/lib/workspace-explorer/source-adapter-mapping.ts src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts 'src/app/(maestro)/source/events/[eventId]/workspace/page.tsx'`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run audit:architecture-rules` reported 0 violations.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.

## Rollout Plan

Merge through PR and standard CI. No database migration is included. Enable only for tenants already using `workspace_explorer_source`.

## Rollback Plan

Disable `workspace_explorer_source` to hide the surface immediately, or revert this PR to remove the Generate panel and candidate read-model fields. Existing generated artifacts are not deleted by rollback because they are written by the existing Source generation route.

## Audit Evidence

- Pull request and CI checks for the `codex/workspace-explorer-we4` branch.
- Local Jest, ESLint, TypeScript, architecture-rules, whitespace, and release-control output.

## Known Gaps

This release does not add a new approval surface inside Workspace Explorer, does not modify the Source generation route, does not populate WE-3 lineage arrays during generation, and does not support Moves generation. Human approval remains in the existing Source canvas flow, and lineage population is owned by future Doc-Gen engine slices.
