# 2026-06-11-manage-moves-archive — Manage Moves: bulk archive / restore (audit-retained, no hard delete)

## Release ID

`2026-06-11-manage-moves-archive`

## Status

`candidate`

## Plain-English Summary

Adds a **Manage Moves** surface so an operator can clean up the Moves portfolio
without destroying anything. Moves are **archived**, never hard-deleted:
archiving sets `lifecycle_state = 'archived'`, stamps who/why/when
(`archived_by`, `archive_reason`, `archive_explanation`, `archived_at`) and
records the prior state in `archived_from_state` so the Move can be **restored**
to exactly where it was. Archived Moves drop out of the active portfolio
(`archived_at IS NULL` filter) but are fully retained for audit — their
approvals, evidence, generated artifacts and context-bundle traces are left
untouched. The portfolio list (`/strategic-moves`) stays the read surface; the
new `/strategic-moves/manage` page is where bulk archive/restore/export happens,
reached by a "Manage Moves" button next to "+ New Move".

This gave us the clean slate to run two fresh end-to-end Moves (AI-SDLC + IROPS)
without deleting the audit history of the earlier crawl Moves.

## Layer Impact

- `global-control-lane`: new archive/restore API routes
  (`/api/v1/programs/archive`, `/archive/restore`), `archiveMove`/`restoreMove`
  mutations, an `archiveFilter` ('active' | 'all' | 'archived') seam on the
  programs read path (`getProgramPortfolio` / `getStrategicMovePortfolio` +
  `programsReadAdapter`), and the Manage Moves UI.
- `client-data-lane`: additive schema migration on `engagements` — adds
  `'archived'` to `engagements_lifecycle_state_check` and the columns
  `archived_by`, `archive_reason`, `archive_explanation`, `archived_from_state`
  (`archived_at` already existed). No data is moved or destroyed.

## Client Applicability

- All clients: yes (Manage Moves is available to any tenant operator who can
  approve gates — `canApproveGates`).
- Specific clients: exercised live on SkyHarbor Air (archived all 12 crawl Moves
  for the clean slate).
- Internal only / public-demo only: no.
- Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260611210000_engagements_archive_state.sql`
  (additive: new lifecycle-state value + 4 provenance columns).
- API: `src/app/api/v1/programs/archive/route.ts` (POST `{moveIds, reason,
explanation}`, gated on `canApproveGates`, `program_archived` audit entry) and
  `.../archive/restore/route.ts` (POST `{moveIds}`, `program_restored` audit).
- Mutations: `archiveMove` / `restoreMove` in `src/lib/programs/mutations.ts`
  (reversible soft-state; double-archive cannot overwrite the restore target;
  idempotent; best-effort audit).
- Read path: `archiveFilter` seam in `queries.ts` + `programsReadAdapter.ts`
  (active list excludes `archived_at IS NULL`).
- Types: `'archived'` lifecycle state (`types.db.ts`); archive provenance
  surfaced on `StrategicMove` / `ProgramCore` as **optional** additive fields
  (so existing producers and fixtures are unaffected); transformer mapping.
- UI: `/strategic-moves/manage` page + `ManageMovesClient` (checkbox select,
  Archived filter chip, archive drawer with reason + explanation + impact
  acknowledgement, Restore, Export) and a "Manage Moves" button on the home.

## QA / Validation

- `npx tsc --noEmit`: no new errors (pre-existing `.next/dev` validator only).
- `npx eslint` on the 14 changed files: clean.
- Jest (archive-adjacent suites): transformers, azure-read transformer,
  programs-read-adapter (asserts the active filter emits `archived_at IS NULL`),
  cross-module-trace, nexus-briefing, move-to-source-handoff, outputs-explorer,
  StrategicMoveDetailClient — 72/73 pass. The one failure
  (`BoardArtifactsPanel.test.tsx`, 8 rows vs 1) is **pre-existing on `main`**
  (reproduced on a pristine `origin/main` checkout) and unrelated to this change.
- Live state-verified on ACA (SkyHarbor): archived all 12 Moves via the endpoint
  (`archived: 12, failed: 0`); active portfolio read returned 0; the Move vault
  artifacts (`program_charter`, `phase_gate_decision`) remained present after
  archive — confirming audit retention.

## Rollout Plan

Apply the additive migration (already applied in-VNet on
`ca-abarva-web-lab-eastus` — verified `20260611210000_engagements_archive_state.sql ✓`
in Log Analytics) and deploy. The migration is additive and idempotent; no
backfill required (existing Moves default to their current lifecycle state with
null archive provenance). No feature flag.

## Rollback Plan

Shift ACA ingress back to the prior healthy revision — instant. The schema
change is additive (a new enum value + nullable columns); leaving the columns in
place is harmless if the app is rolled back, since the active read path simply
keeps filtering on `archived_at IS NULL`. No destructive change to roll back.

## Audit Evidence

- Branch: `fix/move-crawl-punchlist` (scoped to the 14 archive files; unrelated
  branch drift was reverted to `origin/main`).
- Audit-log actions: `program_archived` (with reason + prior state) and
  `program_restored`, written per Move, tenant-scoped.
- Verification memory: `feedback_verify_at_state_level` (archive proven at state
  level — fetched portfolio count + retained vault rows, not UI text).

## Known Gaps

- Archive is gated on `canApproveGates`; there is no separate finer-grained
  "archive" permission yet (acceptable — archive is reversible and audited).
- `BoardArtifactsPanel.test.tsx` fails on `main` independently of this change
  (8 board-artifact rows vs the expected 1) — tracked separately, not fixed here
  to keep this PR scoped.
- The branch carried incidental quote-style drift in its base; the shared files
  touched here (`mutations.ts`, `queries.ts`, `programsReadAdapter.ts`,
  `StrategicMovesHomeClient.tsx`) therefore show single→double-quote churn around
  the genuine archive additions. It is cosmetic (eslint-clean; the repo enforces
  no quote rule) and behavior-identical to the deployed/proven code.
