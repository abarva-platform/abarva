# 2026-06-13-workspace-explorer-build-brief — Workspace Explorer Design And Build Brief

## Release ID

`2026-06-13-workspace-explorer-build-brief`

## Status

`candidate`

## Plain-English Summary

Adds planning artifacts for the Workspace Explorer reset across Moves and Source. The design separates decision-making from documents, proposes a calm page plus Finder-style workspace drawer, and includes a grounded Codex build brief for future implementation.

This PR does not ship the Workspace Explorer UI. It only records the design and implementation plan.

## Layer Impact

- Documentation/planning: Adds a design document and implementation handoff brief.
- Runtime application: No direct impact.
- Data plane: No direct impact.
- Azure infrastructure: No direct impact.

## Client Applicability

- All clients: None at runtime.
- Specific clients: None.
- Internal only: AbarVa product/design/build planning.
- Public/demo only: None.
- Feature flag: Future implementation is expected to be flag-gated; this PR does not add or enable a feature flag.

## Changes Included

- `docs/build/WORKSPACE_EXPLORER_DESIGN.md`
- `docs/codex-handoff/WORKSPACE_EXPLORER_BUILD_BRIEF.md`
- `docs/releases/records/2026-06-13-workspace-explorer-build-brief.md`

## QA / Validation

- Existing PR CI checks were green except for the missing release-control record.
- `npm run release:check` should pass with this record present.

## Rollout Plan

Merge to `main` as documentation only. No Azure Container Apps deploy, database migration, feature flag change, or traffic shift is required.

## Rollback Plan

Revert the documentation commit if the plan is superseded.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3443
- Release record: this file
- Design and build brief files listed above

## Known Gaps

The actual Workspace Explorer product implementation remains future work. Any runtime implementation must be built in separate PRs with flag-off regression proof, flag-on browser proof, release records, and Azure validation as applicable.
