# 2026-05-30-setup-kill-home-reexports — Setup/Admin: kill /home/* re-exports

## Release ID

`2026-05-30-setup-kill-home-reexports`

## Status

`candidate`

## Plain-English Summary

The Setup/Admin surface used to live under two parallel URL trees: `/admin/*` and `/home/*`. The landing page's panel cards linked to `/home/*` while the sidebar linked to `/admin/*` — same code, two URLs, a credibility hit for any new admin landing on the page. This release consolidates to `/admin/*` as the only canonical Setup tree by deleting thin `/home/*` re-export pages and adding per-segment 301 redirects so any persisted `/home/*` links still resolve. Three `/home/*` pages that turned out NOT to be thin re-exports (ai-initiatives, configuration, training) were left in place and surfaced in the PR for separate decisions.

## Layer Impact

- `runtime-app-lane`: Removes redundant Setup re-export routes; updates landing-page panel hrefs to `/admin/*`; adds proxy redirects so deleted `/home/*` paths route to their `/admin/*` equivalents.
- `qa-validation-lane`: Adds a hygiene test under `src/app/(maestro)/home/__tests__/` that fails if any deleted `/home/*` re-export is re-introduced.

## Client Applicability

- All clients: User-visible URL changes for any inbound link or bookmark pointing at the deleted `/home/*` Setup paths — they now 301-redirect to `/admin/*`.
- Specific clients: None singled out.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deleted thin re-exports:
  - `src/app/(maestro)/home/data-trust/page.tsx`
  - `src/app/(maestro)/home/connectors/page.tsx`
  - `src/app/(maestro)/home/agent-readiness/page.tsx`
  - `src/app/(maestro)/home/tenant-profile/page.tsx`
- Updated `src/lib/admin/home-overview-v2.ts` so landing-page panel cards link to `/admin/*` instead of `/home/*`.
- Updated `src/lib/home/panel-inventory.ts` and `src/components/home/tenant-home-fixtures.ts` for consistency.
- Added 301 redirects in `src/proxy.ts` for the deleted segments.
- Added hygiene test `src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts`.
- Surfaced (left in place pending separate decision): `src/app/(maestro)/home/ai-initiatives/`, `configuration/`, `training/` (not thin re-exports).

## QA / Validation

- PASS: `npx eslint src/` (locally per agent report).
- PASS: `npx tsc --noEmit` (locally per agent report).
- PASS: `npm run test:nav` (locally per agent report).
- PENDING: PR CI gates (Hygiene, Integrity, ESLint, Production Readiness, Reasoning Layer Guard, Vercel abarva + nexus).

## Rollout Plan

Merge to main → Vercel production deploy redeploys the Setup/Admin routes with the new redirect map. No migration, no feature flag, no manual runbook step.

## Rollback Plan

Revert this PR. The deleted `/home/*` pages return; redirects disappear. No data migration to reverse.

## Audit Evidence

- Audit verdict: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §2 "IA — three navigation systems coexist" and §5.5 "What gets deleted/merged/demoted."
- Hygiene test: `src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts`.

## Known Gaps

Three `/home/*` pages (ai-initiatives, configuration, training) were on the original deletion list but discovered NOT to be thin re-exports during the agent's verification step. They remain in place pending separate audits. Tracked as follow-up to this PR.
