# 2026-06-12-workspace-explorer-source-declutter — Source canvas Workspace chips and declutter

## Release ID

`2026-06-12-workspace-explorer-source-declutter`

## Status

`candidate`

## Plain-English Summary

Adds the flag-gated Source canvas declutter path for Workspace Explorer. When `workspace_explorer_source` is enabled for a tenant, the Source event canvas shows `Workspace · N ↗` and `Generate` chips, removes the inline Document/Evidence/Log tab strip from the canvas, and keeps the screen focused on the next move plus the gate checklist. With the flag off, the existing four-tab canvas remains unchanged.

## Layer Impact

- `global-control-lane`: Updates the Source canvas presentation behind the Workspace Explorer flag.
- `global-control-lane`: Adds chip entry points to the read-only Source workspace route without changing existing Source generate, upload, approval, or stage-advance API contracts.
- `global-control-lane`: Extends existing Source canvas render coverage to prove flag-off tab behavior and flag-on declutter behavior.

## Client Applicability

- All clients: no behavior change while `workspace_explorer_source` remains default off.
- Specific clients: none enabled by this release.
- Internal only: tenants can be opted in through `ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS`.
- Public/demo only: not applicable.
- Feature flag: `workspace_explorer_source`.

## Changes Included

- Adds `Workspace · N ↗` and `Generate` chips under the Source stage rail when Workspace Explorer is enabled.
- Links the Workspace chip to `/source/events/{eventId}/workspace`.
- Links the Generate chip to the workspace with an intent marker; actual generation remains a later WE-4 slice and still must use existing per-module routes.
- Replaces the tabbed Document/Gate/Evidence/Log workspace with a focused Next Move + Gate panel only when the flag is enabled.
- Keeps the existing tab components and APIs intact for flag-off behavior and later relocation work.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand`.
- PASS: `npx eslint src/components/source/canvas/UniversalCanvasShell.tsx src/__tests__/integration/source/source-event-canvas-render.test.tsx`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run audit:architecture-rules` reported 0 violations.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through PR and standard CI. The decluttered canvas remains inactive until a tenant is explicitly allowlisted for `workspace_explorer_source`; no database migration or ACA job is required for this UI-only slice.

## Rollback Plan

Revert the PR to remove the flag-on declutter path and chip entry points. If a tenant allowlist was configured, clear `ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS` for immediate rollback to the existing tabbed canvas without code changes.

## Audit Evidence

- Pull request and CI checks for the `codex/workspace-explorer-we2` branch.
- Local render test proving flag-off tabs remain and flag-on chips/declutter render.
- Local ESLint, TypeScript, architecture rules, whitespace, and release-control output.

## Known Gaps

WE-2 does not implement generation from the chip, upload/versioning, lineage columns, Moves explorer support, tenant vault, drawer entry behavior, or ACA private-DB state-level proof. The Generate chip is intentionally an entry point into the Workspace until WE-4 wires the existing per-module generate route.
