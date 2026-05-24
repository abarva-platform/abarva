# 2026-05-24-release-ledger-ui-polish — Release Ledger Formatting Polish

## Release ID

`2026-05-24-release-ledger-ui-polish`

## Status

`candidate`

## Plain-English Summary

This release improves the formatting of the admin Release Ledger page so the audit record is easier to scan. It replaces the cramped nested-grid layout with flatter record cards, compact metrics, readable section rows, lane chips, safer text wrapping, and responsive grid behavior.

## Layer Impact

- `ops-release-lane`: Makes release records readable as an operator-facing audit ledger.
- `app-control-lane`: Polishes the authenticated `/admin/releases` surface without changing release-control policy or data sources.

## Client Applicability

- All clients: The release governance view applies to every future recorded change.
- Specific clients: None.
- Internal only: AbarVa administrators and release operators.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- `src/components/admin/releases/ReleaseLedgerSurface.tsx`
- Flatter summary, latest-change, lane-distribution, and release-record sections.
- Better wrapping for source paths, release IDs, lane chips, and evidence rows.
- Snapshot verification against a rendered HTML copy of the component.

## QA / Validation

- pass: `npx eslint src/components/admin/releases/ReleaseLedgerSurface.tsx`.
- pass: `npx tsc --noEmit --pretty false`.
- pass: `npm run build`; route manifest includes `/admin/releases`.
- pass: Playwright snapshot of the rendered component had no horizontal overflow at 1180px viewport.
- blocked local dev/server: existing unrelated Next dynamic-route conflict, `moveId` vs `programId`, prevents local `next dev` and `next start` from serving routes.

## Rollout Plan

Merge this PR to `main`. Vercel production deployment follows the existing Git integration. The page remains available at `/admin/releases`.

## Rollback Plan

Revert this PR. No database migration, data mutation, or route rollback is required; rollback only restores the previous Release Ledger formatting.

## Audit Evidence

- Local ESLint and TypeScript validation output.
- Production build route manifest.
- Playwright-rendered component snapshot at `/tmp/release-ledger-polish.png`.
- GitHub CI checks for the PR.

## Known Gaps

This is a UI formatting polish only. The page is still markdown-backed per request and does not yet provide live GitHub, Vercel, database telemetry, signed audit export, or authenticated visual smoke capture.
