# 2026-05-30-setup-production-readiness-2tabs — Production Readiness consolidated to 2 tabs

## Release ID

`2026-05-30-setup-production-readiness-2tabs`

## Status

`candidate`

## Plain-English Summary

The `/admin/production-readiness` page used a four-tab layout that fragmented the operator's read of "are we ready to ship?" This release consolidates to two tabs — **Decision** (gate criteria → blockers → recent decisions, single scrollable view) and **History** (full decision history with filter). Same data, denser presentation, canonical Snowflake-style tab strip consistent with the rest of the Setup surface.

## Layer Impact

- `runtime-app-lane`: `/admin/production-readiness` page reorganized to two tabs. Existing route URL preserved. Existing data sources unchanged.
- `qa-validation-lane`: Updated tab-strip hygiene tests; sub-nav pattern check (from Wave 1 PR-3) continues to pass.

## Client Applicability

- All clients.
- Specific clients: None singled out.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/admin/production-readiness/page.tsx` — reads `searchParams.tab`, renders Decision (default) or History.
- Production-readiness tab component(s) under `src/components/admin/` — consolidated from 4 tabs to 2.
- Section ordering within Decision tab: gate criteria → blockers → recent decisions.
- Test updates: tab-presence assertions revised; canonical sub-nav hygiene preserved.

## QA / Validation

- PASS: `npx eslint src/` on touched files.
- PASS: `npx tsc --noEmit`.
- PASS: Sub-nav hygiene test (`src/components/admin/__tests__/no-sub-nav-strip.test.ts`) from Wave 1 PR-3.
- PENDING: PR CI gates.

## Rollout Plan

Merge to main → Vercel production deploy. No migration, no feature flag.

## Rollback Plan

Revert this PR. Four-tab layout returns. No data migration needed.

## Audit Evidence

- Audit verdict: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §7 Wave 3 PR 5 (Production-readiness consolidation).
- Canonical sub-nav pattern documented in W1-PR-3 release record.

## Known Gaps

If any tab that was dropped held a feature only used by power users, surface it in a follow-up. Decision tab is the operator default; History tab is the auditor default.
