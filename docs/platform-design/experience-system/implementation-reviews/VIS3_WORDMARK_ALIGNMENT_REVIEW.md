# VIS3 Wordmark Alignment Review

## Date
2026-04-26

## Scope
Slice 1 of Brand Wordmark Alignment + Vendor Selection Readiness.

## Files Changed
- `src/components/AbarvaNav.tsx`
- `src/components/admin/ExperienceGallery.tsx`
- `src/__tests__/integration/admin/experience-gallery.test.ts`
- `src/__tests__/integration/design/abarva-logo.test.ts`
- `src/components/brand/AbarVaLogo.tsx`
- `src/components/brand/index.ts`
- `src/components/abarva/AbarVaWordmark.tsx`
- `src/components/abarva/AbarVaTopNav.tsx`
- `src/app/not-found.tsx`
- `src/app/sponsor/page.tsx`
- `src/components/chrome/TopBar.tsx`
- `src/components/programs/ProgramsCanonShell.tsx`
- `public/brand/abarva-logo.svg`
- `docs/build/slices/BRAND1_CANONICAL_ABARVA_LOGO.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`

## Brand Rule Applied
- Canonical name-only logo now resolves through `public/brand/abarva-logo.svg`.
- Added reusable renderer `src/components/brand/AbarVaLogo.tsx` + `src/components/brand/index.ts`.
- Routed shared wordmark entrypoints (`AbarvaWordmark` and `AbarVaWordmark`) through `AbarVaLogo`.
- Removed manual split-text symbol treatment from modified nav/shell surfaces.
- `AbarVaMark` is not used in active wordmark surfaces in this slice.
- Did not introduce a new symbol, external font file, or image-generation dependency.

## Wordmark Locations Reviewed/Updated
- `src/components/AbarvaNav.tsx` now uses `AbarvaWordmark` (asset-backed)
- `src/components/abarva/AbarVaTopNav.tsx` now renders `AbarvaWordmark` through `AbarVaWordmarkPrimitive`
- `src/components/admin/ExperienceGallery.tsx` now renders `AbarVaLogo` in lockup examples
- `src/components/programs/ProgramsCanonShell.tsx`, `src/components/chrome/TopBar.tsx`,
  `src/app/not-found.tsx`, and `src/app/sponsor/page.tsx` were converted to `AbarVaLogo`
- `src/components/abarva/AbarVaWordmark.tsx` now resolves to the canonical asset component

## Symbol Deferment
- The prior mark symbol is explicitly deferred until a dedicated final logo asset is approved.
- Active symbol rendering now points at the canonical wordmark asset only.

## Validation
- `npx jest src/__tests__/integration/design/abarva-logo.test.ts`
- `npx jest src/__tests__/integration/admin/experience-gallery.test.ts`
- `npx eslint src/components/brand/AbarVaLogo.tsx src/components/abarva/AbarVaWordmark.tsx src/components/abarva/AbarVaTopNav.tsx src/components/AbarvaNav.tsx src/components/admin/ExperienceGallery.tsx src/__tests__/integration/design/abarva-logo.test.ts src/__tests__/integration/admin/experience-gallery.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`

## Runtime / Model / Workflow Notes
- No runtime model calls added.
- No chat or upload/parsing behavior introduced.
- No workflow-engine changes.
