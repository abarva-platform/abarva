# 2026-06-12-docgen-backlog-handoff — backlog handoff doc to the Moves/Source layout-redesign session

## Release ID

`2026-06-12-docgen-backlog-handoff`

## Status

`candidate`

## Plain-English Summary

Documentation only. Adds `docs/build/DOCGEN_DELIVERABLES_BACKLOG_HANDOFF.md` — the
shipped state, UI overlap surface, layout↔engine integration points, and remaining
backlog (with dependencies) of the document-generation / deliverables workstream,
handed to the Moves/Source layout-redesign session to avoid overlap.

## Layer Impact

- `global-control-lane`: docs only. No code, schema, API, or runtime change.

## Client Applicability

- All clients: no behavioral change. Feature flag: none.

## Changes Included

- `docs/build/DOCGEN_DELIVERABLES_BACKLOG_HANDOFF.md` (NEW, documentation).

## QA / Validation

- N/A (documentation). `npm run release:check` passes with this record.

## Rollout Plan

Merge. No deploy impact.

## Rollback Plan

Delete the doc. No effect.

## Audit Evidence

- Branch: `docs/docgen-backlog-handoff`.

## Known Gaps

- This is a point-in-time handoff: the backlog and dependency list reflect `main`
  at `d59c9bddb` and will drift as the layout-redesign session and the autonomous
  Source-D09 agent land further changes. Treat it as guidance, not a live tracker —
  re-confirm PR/commit references against `main` before acting on them.
