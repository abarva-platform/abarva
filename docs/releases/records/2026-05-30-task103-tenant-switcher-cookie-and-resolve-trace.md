# 2026-05-30-task103-tenant-switcher-cookie-and-resolve-trace — TenantSwitcher RSC refresh + resolveTenant diagnostic trace

## Release ID

`2026-05-30-task103-tenant-switcher-cookie-and-resolve-trace`

## Status

`candidate`

## Plain-English Summary

After PR-2607 surfaced the silent-fail UI for the TenantSwitcher chip, a follow-up browser test showed the API was returning `{ok:true}` and the `abarva_active_client` cookie was being written, but the `/admin` page was still rendering the previous tenant. Two changes ship together: (1) the switcher now calls `router.refresh()` and hard-navigates with a cache-busting query so the new cookie is honored even when the user is already on `/admin`; (2) `resolveTenant` gains an opt-in structured-log diagnostic (env: `ABARVA_TENANT_RESOLVE_TRACE=1`) that emits which candidate source the resolver picked on each call, so a Vercel log line nails down whether the cookie is being read or whether a higher-priority source is overriding it.

## Layer Impact

- `global-control-lane` — client-side TenantSwitcher behavior and server-side tenant-resolver logging both run for every signed-in admin/founder session that loads `/admin`.

## Client Applicability

- All clients: yes (the resolver runs on every admin page request).
- Specific clients: TenantSwitcher chip is gated to founder + Clerk `role === 'admin'` only.
- Internal only: the diagnostic log is opt-in via env var, default-off; intended for AbarVa operators investigating the prod symptom.
- Public/demo only: n/a
- Feature flag: `ABARVA_TENANT_RESOLVE_TRACE=1` env var gates the diagnostic emit only.

## Changes Included

- PR #2618 — https://github.com/anandsundaram-hash/abarva/pull/2618
- `src/components/admin/TenantSwitcher.tsx` — add `useRouter().refresh()` + cache-busted hard-nav.
- `src/components/admin/__tests__/TenantSwitcher.test.tsx` — mock `next/navigation` so the 6 existing tests still pass.
- `src/lib/tenant/resolveTenant.ts` — opt-in `tenant_resolve_trace` structured-log emit gated on `ABARVA_TENANT_RESOLVE_TRACE`.

## QA / Validation

- `npx jest src/components/admin/__tests__/TenantSwitcher.test.tsx src/lib/tenant/__tests__/resolveTenant.test.ts --no-coverage` → 15/15 pass.
- Manual prod re-test pending after deploy (see Rollout Plan).
- CI: pre-existing checks must pass (ESLint, Routes & disclaimers, Typecheck, Hygiene, Verify canonical tenant allowlist).

## Rollout Plan

- Merge PR #2618 to main; Vercel auto-deploys to production.
- After deploy: set `ABARVA_TENANT_RESOLVE_TRACE=1` in Vercel prod env, then re-test the switcher chip from `Meridian Health → Apex Retail`. Grep Vercel logs for `tenant_resolve_trace` — picked source should be `cookie` and `pickedKey: apexretail`.
- Leave the trace on until task #103 is closed, then unset.

## Rollback Plan

- Revert PR #2618 and redeploy. No DB migration, no schema change, no data path. The diagnostic log gate defaults to off, so leaving it merged with the env var unset is also a safe holding pattern.

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2618
- Local test run: 15/15 pass on `TenantSwitcher.test.tsx` + `resolveTenant.test.ts`.
- Vercel deploy URL: populated on PR check.
- Post-deploy: Vercel log grep for `tenant_resolve_trace` event lines after toggling `ABARVA_TENANT_RESOLVE_TRACE=1`.

## Known Gaps

- The fix is targeted at the most common root cause (RSC cache + cache-buster). If the diagnostic log reveals the resolver is picking a session-pinned source over the cookie, a follow-up PR will re-prioritize the candidate list for non-locked founder sessions.
- `ABARVA_PG_POOL_MAX=5` env bump (operational mitigation from `docs/build/BROKER_THROW_DIAGNOSIS_2026-05-30.md`) is out of scope here.
