# 2026-06-17-moves-explorer-tab — Moves Explorer (Finder-style read-only browse)

## Release ID

`2026-06-17-moves-explorer-tab`

## Status

`candidate`

## Plain-English Summary

Adds an **Explorer** tab to a Strategic Move's detail page. It is a Mac-Finder-style
tree that lets a user browse the whole Move at a glance: the Move at the root, each
phase (P1–P5) beneath it, and inside every phase three folders — **Templates** (the
standard documents that phase produces), **Inputs** (files uploaded for that phase),
and **Deliverables** (the generated documents, with their status and download links).

The Explorer is **read-only browse**. It does not generate, upload, regenerate, or
delete anything. Generation stays a phase-level "Approve & Build" action (built in a
later slice); a document that changes goes stale and is refreshed by re-running its
phase and re-approving — there is no isolated regenerate from the Explorer. The detail
pane on the right shows, for the selected item, plain context (purpose/audience for a
template, file metadata for an input, status + download for a deliverable) and tells
the user where generation happens rather than offering a button.

It reads the same `deliverables_v2` data the existing Documents tab uses, so the two
tabs are always consistent. No schema, API, or data-plane change.

## Layer Impact

- `global-control-lane`: shared app/control-plane UI. A new client component
  (`MovesExplorer.tsx`) plus a server-side model builder and a new `explorer` tab in
  the Strategic Move detail view and its route's tab resolver. Pure read surface over
  existing `deliverables_v2` rows and program attachments; no behavior change to
  generation, persistence, or retrieval.

## Client Applicability

State exactly who receives the change.

- All clients: yes — the Explorer tab appears on every Strategic Move detail page.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (read-only browse over data the Documents tab already shows)

## Changes Included

- `src/components/strategic-moves/MovesExplorer.tsx` (new) — client Finder tree +
  read-only detail panes.
- `src/components/strategic-moves/StrategicMoveDetailView.tsx` — Explorer tab in the
  TabBar; `ExplorerContent` server component + `buildExplorerModel` (queries
  `deliverables_v2` by `engagement_id`, groups attachments by phase, walks
  `PHASE_CANONICAL_KEYS` × `DELIVERABLE_REGISTRY`).
- `src/app/(maestro)/strategic-moves/[moveId]/page.tsx` — `explorer` added to the
  `Tab` type and `resolveTab` so `?tab=explorer` routes.

## QA / Validation

- `npx tsc --noEmit` on the three changed files — **PASS** (clean, no new type errors).
- `npx eslint` on the three files — **PASS** (exit 0, no warnings).
- Manual consistency check — **PASS**: verified `buildExplorerModel` reads the same
  `deliverables_v2` (id/status/latest-version content) the Documents tab/
  `PhaseDocumentsPanel` reads, so deliverable status/downloads match between tabs.
- Live signed-in click-through on ACA (SkyHarbor Move) — **NOT-RUN** at record
  authoring; runs post-deploy, evidence appended below.

## Rollout Plan

Merge to main (squash), `az acr build` a new web image, deploy a new
`ca-abarva-web-lab-eastus` revision, health-gate, shift traffic, deactivate idle
revisions. No worker-job change (web-only component/route change). No migration.

## Rollback Plan

Revert the squash-merge commit and redeploy the prior web image / shift traffic back
to the prior revision. No data or schema migration to unwind; the tab simply
disappears and existing tabs are unaffected.

## Audit Evidence

- PR URL (to be filled at PR open).
- `tsc` / `eslint` output in the PR description.
- Post-deploy: ACA revision name + signed-in screenshot of the Explorer tab on a real
  Move.

## Known Gaps

- Explorer is read-only browse only. Phase-level "Approve & Build" (gate-driven
  generation), staleness/re-run, and Move-side upload are later slices and are NOT in
  this change.
- Deliverable downloads link to the `deliverables_v2` content-export route (same as
  the Documents tab); the decomposed-generator `generated_artifacts` output is served
  by its own route and is surfaced elsewhere, not in this tree.
