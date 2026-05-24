# 2026-05-24-release-ledger-page — Admin Release Ledger Page

## Release ID

`2026-05-24-release-ledger-page`

## Status

`candidate`

## Plain-English Summary

This release adds a live admin page for the release ledger so Anand can review changes without opening raw markdown files. The page reads every markdown record under `docs/releases/records` on each request, summarizes release status, shows impacted layers, client applicability, QA/validation, rollout, rollback, evidence, and known gaps, and exposes the page from the admin sidebar.

## Layer Impact

- `ops-release-lane`: Turns the markdown release records into a readable admin ledger.
- `app-control-lane`: Adds the authenticated `/admin/releases` route and a legacy `/platform/admin/releases` redirect.

## Client Applicability

- All clients: Governance visibility applies to every future release record.
- Specific clients: None.
- Internal only: AbarVa administrators and release operators.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- `src/app/(maestro)/admin/releases/page.tsx`
- `src/app/(maestro)/platform/admin/releases/page.tsx`
- `src/components/admin/releases/ReleaseLedgerSurface.tsx`
- `src/lib/admin/release-ledger.ts`
- `src/lib/admin/__tests__/release-ledger.test.ts`
- `src/lib/admin/admin-shell-config.ts`
- `docs/releases/records/2026-05-24-release-ledger-page.md`
- Request-time refresh contract text on the page so operators know this is a markdown-backed audit ledger, not live GitHub/Vercel telemetry.

## QA / Validation

- pass: `npm run release:check -- --base origin/main --head HEAD`.
- pass: `npx tsc --noEmit --pretty false`.
- pass: focused `npx eslint` on the new route, component, parser, and admin config files.
- pass: `npx jest src/lib/admin/__tests__/release-ledger.test.ts`.
- pass: `npm run build`; route manifest includes `/admin/releases` and `/platform/admin/releases`.
- pass: local HTTP route check returned `200 OK` for `/admin/releases`.
- pass: local HTTP route check returned `307 Temporary Redirect` for `/platform/admin/releases`.

## Rollout Plan

Merge this PR to `main`. Vercel production deployment follows the existing Git integration. The page becomes available at `/admin/releases`; old `/platform/admin/releases` bookmarks redirect to the canonical route.

## Rollback Plan

Revert this PR. No database migration, data mutation, or production release record deletion is required; rollback only removes the admin page, sidebar link, read model, and redirect.

## Audit Evidence

- PR for this release-ledger page slice.
- Local release-control validation output.
- GitHub CI checks for the PR.
- Vercel preview for `/admin/releases`.

## Known Gaps

This is a markdown-backed viewer. It refreshes for every recorded change present in the deployed repo, but it does not infer unrecorded code changes or live deployment state. A database-backed release ledger with write workflow, deployment telemetry, and signed audit export remains a future slice.
