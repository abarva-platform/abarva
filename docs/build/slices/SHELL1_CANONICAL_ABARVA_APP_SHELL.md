# SHELL1 · Canonical AbarVa App Shell Ownership

**Wave:** wave-20  
**Lane:** A  
**Status:** code_complete  
**Last updated:** 2026-04-26

---

## Goal

Establish a canonical, version-controlled shell configuration type and component set that all new AbarVa routes can compose from. Prevents per-route drift of design tokens, nav structure, and wordmark rendering.

---

## Artifacts

| File | Role |
|---|---|
| `src/lib/design/abarva-shell.ts` | Canonical shell config type + `ABARVA_SHELL_CONFIG` constant + `getNavItemsForRole()` |
| `src/components/abarva/AbarVaAppShell.tsx` | Canonical wrapper shell component (sticky header, wordmark, tenant badge, nav) |
| `src/components/abarva/AbarVaTenantBadge.tsx` | Tenant name + richness badge (rich / thin / shell_only) |
| `src/components/abarva/AbarVaWordmark.tsx` | Updated to also export `AbarVaWordmark` PascalCase alias alongside legacy `AbarvaWordmark` |
| `src/__tests__/integration/design/abarva-app-shell.test.ts` | Pure-TS integration tests — no jsdom, no React rendering |

---

## AbarVaWordmark status

`AbarVaWordmark.tsx` existed prior to SHELL1 as a re-export stub from DES7. It correctly follows canon:
- `Abar` half: near-black `#0A0C12`, weight 700, DM Sans
- `Va` half: navy `#1B2B5C`, weight 700, DM Sans, 1.05–1.10× larger
- No teal, no `#14B8A6`, no banned tokens

SHELL1 adds a `AbarVaWordmark` alias (PascalCase) alongside the pre-existing `AbarvaWordmark` export so `AbarVaAppShell.tsx` can import canonically. No existing import paths are broken.

---

## Legacy TopBar note

`src/components/chrome/TopBar.tsx` is the **legacy** nav. It uses `#14B8A6` (teal) — a **banned token** per SHELL1. It is intentionally preserved for backward compatibility. New routes must NOT use `TopBar`; they must use `AbarVaAppShell` or `AbarvaTopNav` (DES2).

---

## Banned tokens (enforced by test)

- `#14B8A6` (teal)
- `teal`
- `cyber`, `neon`, `sparkle`
- `ॐ`, `Sanskrit`

---

## Nav surfaces (canonical order)

| surface | label | href | admin-only |
|---|---|---|---|
| home | Home | /home | no |
| programs | Programs | /tenant/apex-retail/programs | no |
| source | Source | /source | no |
| intelligence | Intelligence | /tenant/apex-retail/intelligence | no |
| control_tower | Control Tower | /tenant/apex-retail/tower | no |
| platform | Platform | /platform/admin | no |
| admin | Admin | /platform/admin | yes |

---

## Test coverage

- `ABARVA_SHELL_CONFIG` value assertions (wordmark parts, accent color)
- navItems surface membership (programs, source, intelligence, control_tower)
- bannedTokens membership (#14B8A6, teal)
- `getNavItemsForRole(false)` excludes admin-only items
- File existence checks (AbarVaAppShell, AbarVaTenantBadge, AbarVaWordmark, abarva-shell.ts)
- Banned token scan of AbarVaAppShell.tsx content

---

## What SHELL1 does NOT do

- Does not remove or modify the legacy `TopBar` or `AppChrome`
- Does not wire `AbarVaAppShell` into any existing route (that is a separate route-enforcement slice)
- Does not add authentication or role-checking logic
- Does not change the maestro layout
