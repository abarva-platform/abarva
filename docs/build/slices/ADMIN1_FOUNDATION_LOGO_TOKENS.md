# ADMIN1 — Foundation: Logo + Token Lock

## Metadata
- ID: ADMIN1
- Title: Foundation: Logo + Token Lock
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: ui
- Dependencies: ADMIN0
- Estimated complexity: S

## Purpose
Land the new logo lockup asset and the canonical design-token table so every later admin lane can import tokens instead of hex literals.

## Context
The founder shared `abarva_logo_lockup_v2.svg` on 2026-04-27. It refines the orbital symbol, locks "Abar" `#070707` + "Va" `#0b4a91` in Cormorant Garamond at 168px base size with -8/-9 letter spacing. The current `AbarVaLogo` component renders only the inline wordmark. The current admin tree uses ad-hoc hex literals.

## Target state
- New SVG sits at `public/brand/abarva-logo-lockup-v2.svg`.
- `AbarVaLogo` accepts `variant: 'wordmark' | 'lockup'` (default `'wordmark'` — preserves existing call sites).
- `src/lib/design/design-tokens.ts` exports the canonical palette as typed constants.
- Cormorant Garamond imported via `next/font/google` (no application yet — application lands in ADMIN2).
- Banned-token list extended with purple, magenta, cyan (teal stays banned).

## Allowed files
- `public/brand/abarva-logo-lockup-v2.svg`
- `src/components/brand/AbarVaLogo.tsx`
- `src/components/brand/index.ts`
- `src/lib/design/abarva-shell.ts` (token table only)
- `src/lib/design/design-tokens.ts` (new)
- `src/__tests__/integration/design/abarva-logo-v2.test.ts` (new)
- `docs/build/slices/ADMIN1_FOUNDATION_LOGO_TOKENS.md`

## Forbidden files
- `src/app/(maestro)/admin/**`
- `src/components/admin/**`
- Any route, API, or migration file
- Any other `src/lib/**` outside `src/lib/design/`

## Implementation scope
1. Copy `/Users/anand/Downloads/abarva_logo_lockup_v2.svg` to `public/brand/abarva-logo-lockup-v2.svg`.
2. Update `AbarVaLogo.tsx` with a `variant` prop. `'wordmark'` keeps current behavior. `'lockup'` renders the new SVG (via `<img>` or inline `<svg>` — pick whichever is simpler given the existing component pattern).
3. Create `src/lib/design/design-tokens.ts` exporting:
   - `INK = '#070707'`
   - `NAVY = '#0b4a91'`
   - `CREAM = '#FBFAF7'`
   - `SKY_PALE = '#E8F0FA'`
   - `MINT_SOFT = '#E8F5E8'`
   - `AMBER_SOFT = '#FFF4E1'`
   - `CORAL_SOFT = '#FFE6E1'`
   - typed `DESIGN_TOKENS` const that bundles the above
4. Add Cormorant Garamond via `next/font/google` in `src/app/layout.tsx` (or scoped admin layout when ADMIN2 lands). Import only.
5. Update banned-token list in `src/lib/design/abarva-shell.ts` (or wherever it lives) to add purple, magenta, cyan.

## Tests
- `src/__tests__/integration/design/abarva-logo-v2.test.ts` (15+ tests):
  - tokens match exact hex values
  - `'lockup'` variant renders the new SVG asset
  - `'wordmark'` variant unchanged
  - no banned tokens appear in `design-tokens.ts`
  - banned-token list includes purple, magenta, cyan, teal
  - SVG file exists at `public/brand/abarva-logo-lockup-v2.svg`

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/lib/design src/components/brand
npx jest src/__tests__/integration/design/abarva-logo-v2
```

## Acceptance criteria
1. `npx tsc --noEmit` clean.
2. ESLint clean for the touched paths.
3. ADMIN1 tests pass.
4. No app routes touched.
5. SVG present in `public/brand/`.
6. Token file exports the locked palette exactly.

## Risks
- Existing `AbarVaLogo` call sites might rely on default behavior — keep default `variant='wordmark'`.
- `next/font/google` import without application can still affect build output — verify build remains green.

## Founder review
No visible UI change yet. Reviewer can spot-check the SVG renders at `/abarva-logo-lockup-v2.svg` directly; the lockup component lights up only after ADMIN2 puts it in the admin shell.
