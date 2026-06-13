# 2026-06-12-integrated-codex-execution — integrated Codex execution prompt (Workspace Explorer + Doc-Gen)

## Release ID

`2026-06-12-integrated-codex-execution`

## Status

`candidate`

## Plain-English Summary

Documentation only. Adds `docs/codex-handoff/INTEGRATED_WORKSPACE_AND_DOCGEN_EXECUTION.md`
— a single autonomous-execution prompt that sequences the Workspace Explorer
(surfacing) backlog and the Doc-Gen (engine) backlog as one program so they do not
interfere: separates surfacing from engine, connects them via three stable seams
(per-module generate route, artifact rows, lineage columns), interleaves the slices
in a dependency-ordered queue, and quarantines the Source engine migration behind
the autonomous Source-D09 agent.

## Layer Impact

- `global-control-lane`: docs only. No code, schema, API, or runtime change.

## Client Applicability

- All clients: no behavioral change. Feature flag: none.

## Changes Included

- `docs/codex-handoff/INTEGRATED_WORKSPACE_AND_DOCGEN_EXECUTION.md` (NEW, documentation).

## QA / Validation

- N/A (documentation). `npm run release:check` passes with this record.

## Rollout Plan

Merge so all sessions pull the same coordination contract from `main`. No deploy impact.

## Rollback Plan

Delete the doc. No effect.

## Audit Evidence

- Branch: `docs/integrated-codex-execution`. Composes with the Workspace Explorer brief (PR #3443) and the Doc-Gen backlog handoff (on `main`).

## Known Gaps

- Point-in-time: references PRs/commits and the Source-D09 collision as of `main`
  around `1e95675d8`; re-confirm against `main` before acting, as both the
  layout-redesign session and the Source-D09 agent continue to land changes.
