# DESROUTE3 — Admin Shell Enforcement

## Goal
Ensure active Admin routes are mounted through approved AbarVa canonical shell/chrome while preserving existing route behavior and auth guards.

## Scope
- Enforce canonical route shell usage on:
  - `/platform/admin`
  - `/platform/admin/architecture`
  - `/platform/admin/production-readiness`
  - `/platform/admin/build-progress`
- Preserve existing route logic and access control.
- Remove legacy dark-rail dominance from active admin landing route.

## Changed Files
- `src/app/(maestro)/platform/admin/page.tsx`
- `src/app/(maestro)/platform/admin/architecture/page.tsx`
- `src/app/(maestro)/platform/admin/production-readiness/page.tsx`
- `src/app/(maestro)/platform/admin/build-progress/page.tsx`
- `src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`

## Validation
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`
- `npx eslint --max-warnings=0 src/app/(maestro)/platform/admin/page.tsx src/app/(maestro)/platform/admin/architecture/page.tsx src/app/(maestro)/platform/admin/production-readiness/page.tsx src/app/(maestro)/platform/admin/build-progress/page.tsx src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`

## Notes
- No auth rewrite.
- No backend/runtime/model/upload changes.
- No fake live readiness claims were added.

