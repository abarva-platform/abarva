# 2026-05-30-fix-admin-page-silent-broker-swallow — Surface admin broker errors

## Release ID

`2026-05-30-fix-admin-page-silent-broker-swallow`

## Status

`candidate`

## Plain-English Summary

The /admin landing page used to silently swallow errors when one of its data brokers (trust spine, inventory snapshot, cross-program signals, approval queue) threw at request time. The page kept rendering, but with empty data — so a user could see the masthead pills truthfully report "14 SEGMENTS LOADED" while the Trust strip a few pixels below rendered "0 / no data yet" with nothing in Vercel function logs to explain the contradiction.

This change replaces every bare `catch { return null }` / `catch { return [] }` in those caches with a structured JSON `console.warn`, so Vercel logs now carry the event tag, tenant key, error message, and the first three stack frames. When the inventory snapshot broker fails but the page can still fall back to authored content, the user sees a small amber banner above the Trust strip that says "Live data temporarily unavailable. Showing authored baseline." with a Retry link. The page no longer pretends the tenant is empty when the real story is a transient data-plane failure.

The cached helpers were lifted out of the page module into `src/app/(maestro)/admin/_cached-helpers.ts` so the logging behavior is covered by Jest tests for the first time.

## Layer Impact

- `global-control-lane`: changes the /admin landing page rendering for every tenant. Adds a small amber banner when the inventory snapshot broker throws. Adds structured warn logs to four cached helpers.

No data-plane writes, no schema change, no migration.

## Client Applicability

- All clients: Every tenant that hits /admin gets the new banner whenever the inventory snapshot broker fails. Vercel logs now carry the four `admin_page.cached_*_failed` event tags for ops correlation.
- Specific clients: Reported live on Meridian Health (browser walk 2026-05-30 post-PR-2606 deploy) — masthead pills showed real counts while Trust strip showed empty chips.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/admin/_cached-helpers.ts` — new module. Extracts the four `React.cache`-wrapped broker helpers (`cachedInventorySnapshot`, `cachedTrustSpine`, `cachedCrossProgramSignals`, `cachedApprovalQueue`) and a shared `logBrokerFailure` JSON warn emitter.
- `src/app/(maestro)/admin/page.tsx` — imports the cached helpers from the new module. Adds a `snapshotLoadFailed` flag computed from `(brokerTenantKey !== null && snapshot === null && authoredFallbackSegments.length > 0)` and threads it into `HomeOverviewV2`. Emits a structured warn (`admin_page.snapshot_load_failed_authored_fallback_active`) when the divergence path fires. Tightens the `emptyTenant` definition so a broker failure with authored fallback no longer collapses the page into the brand-new-tenant skeleton.
- `src/components/home/HomeOverviewV2.tsx` — adds optional `snapshotLoadFailed` prop and an amber banner rendered above the Trust strip when the prop is true. Banner uses the locked palette amber tokens already in `C.amber` / `C.amberSoft` / `C.amberLine`.
- `src/app/(maestro)/admin/__tests__/cached-helpers-log-errors.test.ts` — 8 new Jest tests covering each cached helper's failure path and `logBrokerFailure` directly.
- `src/components/home/__tests__/HomeOverviewV2.snapshot-load-failed.test.tsx` — 3 new Jest tests covering banner rendering (default off, explicit off, explicit on).
- `docs/releases/records/2026-05-30-fix-admin-page-silent-broker-swallow.md` — this record.

No data-plane vocabulary changes (Postgres / `DATABASE_URL` only; no Supabase introduced or removed in this PR).

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — clean.
- `npx eslint src/app/(maestro)/admin/page.tsx src/app/(maestro)/admin/_cached-helpers.ts src/app/(maestro)/admin/__tests__/cached-helpers-log-errors.test.ts src/components/home/HomeOverviewV2.tsx src/components/home/__tests__/HomeOverviewV2.snapshot-load-failed.test.tsx` — clean.
- `npx jest --testPathPatterns "HomeOverviewV2|cached-helpers-log-errors|broker-boundary"` — 8 suites, 46 tests, all green. Pre-existing HomeOverviewV2 empty-state / dom-order / connector-cta / suspense / tenant-switcher suites continue to pass.
- Manual verification deferred to post-deploy: open Vercel function logs after merge, watch for the four `admin_page.cached_*_failed` event tags or `admin_page.snapshot_load_failed_authored_fallback_active`, then document the actual error message + stack as a follow-up note on the PR.

## Rollout Plan

Merge to `main` → Vercel preview build runs → squash-merge with admin once CI is green → production deploy ships via Vercel. No migration, no feature flag, no manual runbook.

## Rollback Plan

Standard git revert of the PR. No data plane changes to undo. Reverting restores the bare `catch { return null }` / `catch { return [] }` swallows — undesirable but harmless.

## Audit Evidence

- PR: (to be filled in once the branch is pushed)
- Squash commit: TBD on merge
- Vercel preview deploy: TBD
- Vercel function logs post-deploy: should contain at least one `admin_page.cached_inventory_snapshot_failed` or `admin_page.snapshot_load_failed_authored_fallback_active` line during a Meridian browser walk if the underlying broker concurrency issue is reproducible.
- Affected files (all under repo root):
  - `src/app/(maestro)/admin/page.tsx`
  - `src/app/(maestro)/admin/_cached-helpers.ts`
  - `src/app/(maestro)/admin/__tests__/cached-helpers-log-errors.test.ts`
  - `src/components/home/HomeOverviewV2.tsx`
  - `src/components/home/__tests__/HomeOverviewV2.snapshot-load-failed.test.tsx`

## Known Gaps

- The underlying root cause (why does `getSetupInventorySnapshot` intermittently throw on /admin under concurrency when /admin/data-trust never does?) is NOT fixed by this PR. The new logs are deliberate instrumentation so we can diagnose the throw in production rather than guess. Common suspects flagged for follow-up: Postgres connection pool exhaustion, RLS denial on a specific table for non-Apex tenants, adapter timeout, network hiccup.
- Other bare `catch { return null }` swallows exist elsewhere in the admin tree (e.g. `agent-readiness/page.tsx`, `data-trust/page.tsx`, `cross-program-signals/page.tsx`). They are NOT touched by this PR — scope was deliberately limited to the /admin landing per the P0 brief. A follow-up sweep should apply the same `logBrokerFailure` pattern to those routes.
- The "Retry" link is a plain anchor back to `/admin`. A more sophisticated retry (in-place re-fetch without full nav) is out of scope.
