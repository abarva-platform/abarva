# SHELL6 · Admin Architecture Readiness Shell Control

**Wave:** wave-20  
**Lane:** F  
**Status:** code_complete  
**Date:** 2026-04-26

## Summary

Creates `AdminRouteShell`, a lightweight orientation strip primitive for admin
routes. Complements the existing `AdminCanonShell` by providing a minimal,
self-contained wrapper that can be composed into any admin page needing a
context banner without the full workflow panel.

## Scope

### Created
- `src/components/admin/AdminRouteShell.tsx` — canonical route-level orientation shell
- `src/__tests__/integration/admin/admin-route-shell-control.test.ts` — fs-scan tests (no jsdom)
- `docs/build/slices/SHELL6_ADMIN_ARCHITECTURE_READINESS_SHELL_CONTROL.md` — this slice doc

### Updated
- `docs/build/build-slices.json` — SHELL6 entry added
- `docs/build/production-readiness.json` — note under visual_design_system
- `docs/build/build-waves.json` — wave-20 entry with SHELL6

## Admin Page Wiring

| Route | Status | Reason |
|---|---|---|
| `admin/page.tsx` | **Already wired** | Uses `AdminCanonShell` with full workflow orientation |
| `admin/architecture/page.tsx` | **Already wired** | Uses `AdminCanonShell` with full workflow orientation |
| `admin/production-readiness/page.tsx` | **Already wired** | Uses `AdminCanonShell` with full workflow orientation |
| `admin/build-progress/page.tsx` | **Already wired** | Uses `AdminCanonShell` with full workflow orientation |

All existing admin routes already satisfy the orientation requirement via
`AdminCanonShell`. `AdminRouteShell` is available as the canonical lightweight
alternative for future admin surfaces that do not need the full panel.

## Design Tokens Used

- Background: `#FBFAF7` (warm off-white, AbarVa canon)
- Strip background: `#FFFFFF`
- Accent / label color: `#1B2B5C` (navy)
- Muted: `#9AA3B2`
- Border: `#E8E6E1`
- Font: DM Sans, sans-serif
- No teal (`#14B8A6`) — none permitted per design system lock

## Caveat Text

> Manifest-backed. No live monitoring. All states are deterministic or manually updated.

## Validation

- TypeScript: clean
- Tests: all passing
- ESLint: 0 warnings
