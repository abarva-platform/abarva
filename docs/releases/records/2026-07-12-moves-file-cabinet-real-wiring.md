# 2026-07-12-moves-file-cabinet-real-wiring — Wire Files & Evidence to the real Artifact Vault

## Release ID

`2026-07-12-moves-file-cabinet-real-wiring`

## Status

`candidate`

## Plain-English Summary

The "Files & Evidence" tab in the live Moves phase workspace (`MovesPhaseStandaloneClient.tsx`)
was a fully static mock: every phase showed hardcoded "Ready"/"Queued"/"Scheduled" labels regardless
of real state, and none of the three file categories (input templates, client evidence, generated
deliverables) rendered as a real clickable link — the row markup had no `<a href>` or `onClick`
anywhere. Confirmed live: a real, board-ready `target_state_architecture` artifact generated during
this session's own testing still showed "Queued" in this panel.

Root cause, once traced: the panel's own deliverable-matching logic did a fuzzy
`deliverable.title.includes(phase.title)` string match that almost never succeeds against real
deliverable titles, so it always fell through to a hardcoded fallback. Separately, the "client
evidence" data came from a completely different, disconnected `evidence` table than the one the
upload button in the same panel actually writes to (`move_artifacts`), so an uploaded file could
never appear in its own list.

Investigating the fix surfaced a better answer than patching the mock: `src/components/strategic-
moves/FileCabinetPanel.tsx` is a **complete, correct, already-built** Moves File Cabinet component —
real data via `GET /api/v1/programs/:id/artifacts`, real Open/Download actions (blob-fetch with
503 retry, not a bare `<a href>` that can dead-end on auth/CORS), real upload, real review/decision
flows — with **zero import sites anywhere in the app**. It was fully built and never mounted.

This release deletes the entire broken mock (`FilesEvidenceExplorer`, `FileColumn`, and their
now-unused per-phase static template/status logic) and mounts the real, already-correct
`FileCabinetPanel` in its place. No new plumbing was needed — the fix is almost entirely deletion.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx`'s Files & Evidence tab is the sole live
  implementation for all tenants — this fix applies platform-wide, no flag.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: removed the entire
  `FilesEvidenceExplorer`/`FileColumn` mock (fuzzy title matching, hardcoded status strings, no
  real links) and the now-unnecessary `DELIVERABLE_REGISTRY`-based phase lookup added earlier in
  this same investigation. Mounted `<FileCabinetPanel moveId={move.id} phase={phase.phase} />` in
  its place, keeping the existing crumb/header wrapper for visual continuity.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: updated the
  existing Files & Evidence interaction test to assert the real component fetches
  `/api/v1/programs/:id/artifacts` (the real endpoint) instead of asserting on the deleted mock's
  labels. Added a new test proving a real generated deliverable (real title, real `downloadUrl`)
  renders and that clicking its real "Open" button reaches the real download URL via `fetch` — not
  a placeholder.

## QA / Validation

- `npx eslint`: PASS — 0 errors on all changed files.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: PASS —
  8/8 (6 pre-existing + 1 updated + 1 new).
- `npx tsc --noEmit -p .`: local run crashed at the Node/V8 level (native stack trace, not a
  reported type error) — the same reproducible, environment-only crash seen repeatedly this
  session on this machine. CI's typecheck job is authoritative.
- Live signed-in browser proof: pending — plan is to open a real Move's Files & Evidence tab
  post-deploy and confirm real artifacts (including the one generated live during this session's
  earlier validation work) render with working Open/Download actions.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → open a
live Move's Files & Evidence tab and confirm real artifacts render with working actions.

## Rollback Plan

Revert this commit. The change is subtractive (removes broken mock code) plus mounting one
existing, already-tested component — no schema, API, or data changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.

## Audit Evidence

- `npx eslint` (0 errors) and `npx jest` (8/8) output captured this session.
- Confirmed via `git ls-tree`/grep that `FileCabinetPanel.tsx` (Moves-specific) had no import
  sites anywhere in `origin/main` prior to this change — it was fully orphaned.
- Confirmed the same live `target_state_architecture` artifact used in the prior release's proof
  (`d74ed94a-a600-46ee-ad5d-a505556c4cac`) is the exact fixture used in the new regression test.

## Known Gaps

- Dead CSS classes (`mxw-files-legend`, `mxw-file-phases`, `mxw-file-phase`, `mxw-file-cols`,
  `mxw-file-col`, `mxw-file-row`) remain in the component's inline style block, now unused after
  deleting the components that referenced them. Left in place — harmless, low-priority cleanup,
  not functional risk.
- A broader UI audit (dispatched this session) also flagged dead-link/no-op patterns in
  `EvidenceWorkbench.tsx` and `StrategicMovePhaseClient.tsx` — both confirmed **already deleted**
  from `origin/main` by the 2026-07-10 migration, so those findings do not apply to the live
  product and required no action here.
