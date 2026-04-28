# BRAND1 — Canonical AbarVa Wordmark

**Wave:** wave-21
**Lane:** BRAND1
**Status:** implemented
**Last updated:** 2026-04-26

## Goal
Make the canonical name-only AbarVa wordmark the single active source of truth for logo rendering in active app shells and nav surfaces.

## Scope implemented
- Added shared brand component: `src/components/brand/AbarVaLogo.tsx`
- Added brand export entrypoint: `src/components/brand/index.ts`
- Wired active nav/shell surfaces to the canonical component through existing wordmark primitives:
  - `src/components/abarva/AbarVaTopNav.tsx`
  - `src/components/abarva/AbarVaShellNav.tsx` (unchanged import chain)
  - `src/components/abarva/AbarVaWordmark.tsx`
  - `src/components/AbarvaNav.tsx` (via wordmark primitive)
  - `src/components/programs/ProgramsCanonShell.tsx`
  - `src/components/chrome/TopBar.tsx`
  - `src/app/not-found.tsx`
  - `src/app/sponsor/page.tsx`
  - `src/components/admin/ExperienceGallery.tsx`
- Added canonical SVG asset: `public/brand/abarva-logo.svg`
- Added logo integration test: `src/__tests__/integration/design/abarva-logo.test.ts`
- Updated gallery lockup and symbol status copy in `src/components/admin/ExperienceGallery.tsx`

## Evidence
- SVG source path is `public/brand/abarva-logo.svg`.
- Canonical consumers import/compose through `AbarVaLogo` (directly or via `AbarvaWordmark`).
- No manual in-shell split text logo in the modified shell/nav pages listed above.

## Non-implemented in this slice
- No new page-level design system changes beyond approved logo wiring.
- No API/auth/workflow changes.
