# 2026-05-24-p22-decision-dossier — Unified Decision Dossier v1

## Release ID

`2026-05-24-p22-decision-dossier`

## Status

`candidate`

## Plain-English Summary

Adds the Packet 22 foundation for cross-surface continuity: a tenant-scoped
decision-thread spine, dossier list/detail pages, auto-link helpers, Move /
Source / Tower entry points, and a source-event-code backfill script for
duplicate tenant prefixes.

## Layer Impact

- `decision-continuity-lane`: new `decision_threads` and
  `decision_thread_links` tables bind Intelligence, Moves, Source, Tower,
  Watchlist, and generated artifacts.
- `evidence-ledger-lane`: dossier sections show proof-point counts from
  Evidence Ledger rows for linked surface artifacts.
- `source-lane`: source event detail can auto-link to a dossier and the
  backfill script removes duplicate event-code prefixes.
- `artifact-lane`: Dossier board-pack adapter uses the Packet 20 render engine
  with `dossier_board_pack`.

## Client Applicability

- Specific clients: all tenant-scoped clients, including Apex, Meridian, and
  First Capital.
- Internal only: `/admin/dossiers` is an admin/operator surface.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds additive Supabase migration for `decision_threads`,
  `decision_thread_links`, and `source_event_code_backfill_audit`.
- Adds `src/lib/decisions/auto-linker.ts` with idempotent helpers for Move,
  Source, Tower, Watchlist, and generated artifact linkage.
- Adds `/dossier/[threadId]` with four sections: Intelligence rationale, Moves
  business case, Source commercial path, and Tower measurement plan.
- Adds `/admin/dossiers` list view sorted by last activity.
- Adds "View in Dossier" entry points to Move detail, Source event detail, and
  Tower.
- Adds `scripts/migration/source-event-code-backfill.ts`.

## QA / Validation

- PASS: `npm run smoke:p22-decision-dossier`
- PASS: targeted `npx eslint ...`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run build`
- Pending before merge: release gate re-run and remote CI.

## Rollout Plan

Merge after CI is green. Apply `npm run db:migrate` before relying on persisted
decision thread rows or running the source-event-code backfill in production.

## Rollback Plan

Revert the PR. The migration is additive; no existing product rows are modified
unless the explicit source-event-code backfill script is run.

## Audit Evidence

- Smoke asserts decision dossier schema, RLS hooks, auto-linker helpers, dossier
  pages, source event-code backfill script, and visible "View in Dossier" entry
  points.
- Build confirms `/dossier/[threadId]` and `/admin/dossiers` route registration.
- The backfill script is dry-run capable and writes immutable audit rows before
  this release depends on it operationally.

## Known Gaps

- This slice creates dossier threads when existing Move/Source/Tower pages are
  opened. Direct event-driven hooks inside every creation API remain follow-up
  hardening.
- Dossier export uses the Packet 20 adapter; production download API and
  generated-artifact persistence should be added after the generated-artifacts
  migration is applied in the target database.
- Tower's entry point lands at the tenant dossier list until a specific Tower
  value-state thread is selected.
