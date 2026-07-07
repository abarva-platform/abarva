# 2026-06-13-source-progression-surface — Workspace "What's needed to advance" panel (Slice F)

## Release ID

`2026-06-13-source-progression-surface`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Surfaces the Source stage progression engine (`computeStageProgression`, Slice A) in the Workspace
Explorer as a **"What's needed to advance"** panel. For the current (or query-selected) stage it shows
the ordered, one-click action list a user needs to progress: **Upload** missing/stale evidence,
**Generate** an AI-authorable deliverable, **Prepare** one that isn't auto-authorable yet (shown but
blocked), **Approve** a draft, **Send** a vendor communication (shown but blocked), and — when every
required gate is clear — a single **Advance**. The first item is highlighted as the one next move.

Upload and Generate resolve to the explorer's own `?intent=upload` / `?intent=generate` flow; Approve and
Advance link back to the event canvas where those controls live; Prepare and Send are named but disabled
until slices C and D. This makes "what do I do next?" answerable at a glance.

## Layer Impact

- `global-control-lane`: Adds a `progression` prop + panel to the shared `WorkspaceExplorer`; the Source
  workspace page computes it from existing substrate reads. Behind `workspace_explorer_source`. No schema,
  API-contract, generate/upload/approve/advance route, or new runtime dependency. The Moves workspace path
  is unaffected (it passes no `progression`).

## Client Applicability

- All clients: no change while `workspace_explorer_source` is off — the workspace route is `notFound` as before.
- Specific clients: SkyHarbor — the only tenant with the flag on, so the only place the panel renders today.
- Internal only: None.
- Public/demo only: None.
- Feature flag: `workspace_explorer_source`.

## Changes Included

- `WorkspaceProgression` / `WorkspaceProgressionNeed` types.
- `buildSourceWorkspaceProgression()` — pure mapper: engine view → needs with one-click hrefs.
- `WorkspaceExplorer` `progression` prop + `ProgressionPanel` (ordered needs; primary highlighted;
  wired actions are links, blocked actions are disabled with their reason).
- Source workspace page loads `listGateCriterionStatesForEvent` / `listEvidenceStatesForEvent` /
  `listArtifactStatesForEvent`, computes progression for the stage, passes it to the explorer.

## QA / Validation

- PASS: `npx jest … source-progression.test.ts stage-progression.test.ts` — 8/8 (mapper hrefs:
  upload→intent=upload, generate→intent=generate, prepare→blocked/no-href; approve & advance→event href;
  all-met→single advance).
- PASS: `npx eslint` on all changed files.
- PASS: `npx tsc --noEmit` — no type errors in changed files.
- Visual: panel rendered (`progression-panel-preview.html`) — primary highlighted, wired vs blocked actions.

## Rollout Plan

Merge through PR + CI (stacked on `feat/source-progression-engine`). Surfacing only appears where the flag
is on. To show it on SkyHarbor, the SkyHarbor source event must exist (origination is a separate step).

## Rollback Plan

Revert the PR, or disable `workspace_explorer_source` for the tenant. No data/schema to unwind.

## Audit Evidence

PR diff (explorer panel + pure mapper + page wiring + unit tests + this record), the PR CI checks, and the
jest/eslint/tsc output in QA / Validation. Read path only — preview/list honor the same per-user RLS and
classification as the existing Workspace; no new writes, migration, or egress to audit.

## Known Gaps

- `Prepare` and `Send` are surfaced but blocked until the authoring expansion (slice C) and vendor-send
  wiring (slice D).
- Approve/Advance link to the event canvas rather than acting in-place (in-place is a later refinement).
- No live ACA / private-DB state-level proof yet — SkyHarbor has no live source event to render against;
  that proof runs once the event is originated.
