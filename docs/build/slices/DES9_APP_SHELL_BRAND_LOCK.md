# DES9 · App Shell Brand Lock

**Wave:** wave-21  
**Lane:** C  
**Status:** code_complete

## Purpose

Lock the canonical AbarVa app shell (`AbarVaAppShell`) to import and render `AbarVaLogo`
from the canonical brand component path (`@/components/brand/AbarVaLogo`).

This slice is the shell layer of the brand lock effort. The `AbarVaLogo` component itself
(the real SVG-backed implementation) is delivered by **BRAND1** in a separate lane. DES9
wires the import in the shell and lands a BRAND1-compatible stub so TypeScript compiles
cleanly before BRAND1 merges.

## Changes

| File | Change |
|------|--------|
| `src/components/abarva/AbarVaAppShell.tsx` | Import `AbarVaLogo` from `@/components/brand/AbarVaLogo`; render `<AbarVaLogo variant="compact" ariaLabel="AbarVa" />` in the wordmark area |
| `src/components/brand/AbarVaLogo.tsx` | BRAND1 stub — satisfies TypeScript; replaced by BRAND1 canonical implementation |
| `src/components/brand/index.ts` | BRAND1 stub barrel — re-exports `AbarVaLogo` and `AbarVaLogoProps` |

## Design canon compliance

- Background: `#F8F7F4` / `#0A0C12` header — preserved unchanged
- Fonts: DM Sans, sans-serif — preserved unchanged
- No banned tokens (`#14B8A6`, teal, cyber, etc.) introduced
- Nav links, tenant badge, active surface indicator all preserved

## BRAND1 integration notes

- Import path: `@/components/brand/AbarVaLogo`
- Props: `variant: 'compact' | 'full'`, `ariaLabel`, `width`, `height`, `className`
- Wiring is **additive** — no other shell behaviour changes when BRAND1 replaces the stub
- Fallback import of `AbarVaWordmark` is kept in `AbarVaAppShell.tsx` with a comment
  (eslint-disabled as unused) so a rollback is a one-line change

## Tests

`src/__tests__/integration/design/app-shell-brand-lock.test.ts`

- AbarVaAppShell.tsx exists
- AbarVaAppShell.tsx contains `AbarVaLogo` import
- AbarVaAppShell.tsx imports from `@/components/brand/AbarVaLogo`
- AbarVaAppShell.tsx does NOT contain `#14B8A6`
- AbarVaAppShell.tsx references `ABARVA_SHELL_CONFIG` (canonical nav surfaces)
- `src/components/brand/AbarVaLogo.tsx` exists
- `src/components/brand/index.ts` exists
