# ADMIN-DATA3 — `/admin/users-access` Wired to Adapter

## Metadata
- ID: ADMIN-DATA3
- Title: `/admin/users-access` consumes admin-users-adapter
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA2
- Estimated complexity: M

## Purpose
Replace the hardcoded `SEED_USER_DETAILS`, `SEED_INVITES`, `SEED_ROLE_SUMMARY` constants in `src/lib/admin/users-access-page-view.ts` with calls to `admin-users-adapter`. Page-view receives data through the adapter; UI is unchanged. Default mode is fixture; live DB activates once `ADMIN_DATA_MODE=live` plus DATA10 migrations are present.

## Context
Per ADMIN-DATA1 audit Section 2.2, the user list / role summary / user detail / recent activity all map to existing tables (`persons`, `team_memberships`, `person_client_memberships`, `audit_log`). Pending invites stay deterministic in this slice (Clerk live integration deferred to Wave 27). Permission matrix + action strip stay deterministic (concept-level data).

## Target state
- `src/lib/admin/users-access-page-view.ts` removes `SEED_USER_DETAILS`, `SEED_INVITES`, `SEED_ROLE_SUMMARY` consts (or makes them fixture-only fallbacks).
- `buildUsersAccessPageView(tenantSlug)` becomes async; calls `getAdminUsers`, `getAdminRoleSummary` from `@/lib/admin/data`.
- Page route `src/app/(maestro)/admin/users-access/page.tsx` awaits the async builder.
- Pending invites + permission matrix + action strip unchanged (deterministic).
- Existing 61 ADMIN11 regression tests still pass (fixture mode is parity-equivalent).

## Allowed files
- `src/lib/admin/users-access-page-view.ts`
- `src/app/(maestro)/admin/users-access/page.tsx`
- `src/lib/admin/__tests__/users-access-page-view.test.ts` (update to match async)
- `docs/build/slices/ADMIN-DATA3_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/admin/data/**` — that's DATA2's scope
- `supabase/migrations/**` — DATA10's scope
- Other admin page-views — separate lanes

## Implementation scope
1. Convert `buildUsersAccessPageView` to async.
2. Call `getAdminUsers(tenantSlug)`, `getAdminRoleSummary(tenantSlug)`, `getAdminUserDetail(tenantSlug, id)` for the drawer.
3. Remove `SEED_USER_DETAILS`, `SEED_ROLE_SUMMARY` from page-view; keep only the deterministic concept-level constants (TABS, PERMISSION_MATRIX, ACTION_STRIP, INVITES).
4. Update page route to await.
5. Update tests to use async + adapter mocks.

## Tests
- Update `users-access-page-view.test.ts` to assert adapter is called with tenantSlug, returned data flows to view-model.
- Add fixture-mode parity test.

## Validation
```bash
npx tsc --noEmit
npm test -- src/lib/admin/__tests__/users-access
npm run build
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. `users-access-page-view.ts` no longer contains `SEED_USER_DETAILS` / `SEED_ROLE_SUMMARY` as hardcoded data.
2. View builder is async + reads from adapter.
3. Page route handles async correctly (Server Component).
4. ADMIN11 regression tests (61) still pass in fixture mode.
5. URL searchParams contract preserved (per ADMIN19 lock).
6. No design-token regression.

## Risks
- Async page-view may break SSR caching expectations → verify with `npm run build` rendering.

## Founder review
Visit `/admin/users-access` — content identical in fixture mode (no visual change). After DATA10 + `ADMIN_DATA_MODE=live`, content reflects real DB.
