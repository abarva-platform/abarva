# 2026-06-12-workspace-explorer-we0-flags — Workspace Explorer WE-0 flag foundation

## Release ID

`2026-06-12-workspace-explorer-we0-flags`

## Status

`candidate`

## Plain-English Summary

Adds the default-off feature flags and shared read-model contract needed to begin the Workspace Explorer surfacing program without changing the current Source canvas for any tenant. Source can now compute whether the Workspace Explorer should be enabled for the active client, but the only runtime effect in this slice is an inert data marker when the flag is explicitly enabled.

## Layer Impact

- `global-control-lane`: Adds shared feature-flag definitions and a module-neutral `WorkspaceItem` contract for the Workspace Explorer surfacing layer.
- `global-control-lane`: Wires the Source event page to evaluate the new Source explorer flag and pass the result to the canvas shell without changing existing generate, approve, advance, upload, or artifact route contracts.

## Client Applicability

- All clients: no behavior change while `workspace_explorer_source` and `workspace_explorer_moves` remain default off.
- Specific clients: none enabled by this release.
- Internal only: engineering can opt in a tenant by setting `ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS` or `ABARVA_FEATURE_WORKSPACE_EXPLORER_MOVES_TENANTS`.
- Public/demo only: not applicable.
- Feature flag: `workspace_explorer_source`, `workspace_explorer_moves`.

## Changes Included

- Adds `workspace_explorer_source` and `workspace_explorer_moves` to the feature registry as tenant-scoped, default-off flags.
- Adds `src/lib/workspace-explorer/types.ts` with the shared `WorkspaceItem` contract for future Source and Moves adapters.
- Adds feature-flag tests proving Source and Moves explorer flags are off by default and independently tenant-enabled.
- Passes the Source explorer flag into the Source canvas shell and emits a `data-workspace-explorer="source"` marker only when the flag is enabled.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/features/__tests__/is-feature-enabled.test.ts --runInBand`.
- PASS: `npx eslint src/lib/features/registry.ts src/lib/features/__tests__/is-feature-enabled.test.ts src/lib/workspace-explorer/types.ts 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/components/source/canvas/UniversalCanvasShell.tsx`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run audit:architecture-rules` reported 0 violations.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` through the normal PR flow. No tenant receives the Workspace Explorer surfacing UI until the relevant tenant allowlist environment variable is configured in a later release. This slice does not require a database migration or ACA deployment by itself beyond the standard application rollout.

## Rollback Plan

Revert the PR to remove the new flag definitions, read-model type, and inert Source page plumbing. If a tenant allowlist is accidentally configured before rollback, clear the corresponding `ABARVA_FEATURE_WORKSPACE_EXPLORER_*_TENANTS` environment variable to return all tenants to the existing canvas path immediately.

## Audit Evidence

- Pull request and CI checks for the `codex/workspace-explorer-we0` branch.
- Local validation output for Jest, ESLint, TypeScript, architecture rules, `git diff --check`, and release control.
- Feature registry entries showing both flags remain tenant-scoped and default off.

## Known Gaps

WE-0 only lays the non-breaking surfacing foundation. The explorer shell, Source adapter, decluttered chips, lineage schema, generate chip, governed upload flow, Moves adapter, tenant vault, ACA state-level proof, and Doc-Gen orchestrator migration remain in later slices.
