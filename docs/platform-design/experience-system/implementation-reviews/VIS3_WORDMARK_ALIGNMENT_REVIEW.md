# VIS3 Wordmark Alignment Review

## Date
2026-04-26

## Scope
Slice 1 of Brand Wordmark Alignment + Vendor Selection Readiness.

## Files Changed
- `src/components/AbarvaNav.tsx`
- `src/components/admin/ExperienceGallery.tsx`
- `src/__tests__/integration/admin/experience-gallery.test.ts`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`

## Brand Rule Applied
- Aligned to interim name-only AbarVa wordmark.
- Removed the prior symbol rendering from shared app nav (`AbarvaNav`) by replacing
  `AbarvaMark` with `AbarvaWordmark`.
- Removed the gallery symbol component from `ExperienceGallery` and updated lockup
  copy to state symbol deferral.
- Did not introduce a new symbol or external asset.

## Wordmark Locations Reviewed/Updated
- App shell/nav logo path now points to canonical wordmark primitive in
  `src/components/abarva/AbarVaTopNav.tsx` via `src/components/abarva/AbarVaWordmark`.
- Experience Gallery lockup shows deterministic text-only `Abar` + `Va` treatment.

## Symbol Deferment
- `AbarVaMark` is no longer used in live app shell rendering.
- The gallery states that symbol rendering is deferred until the final logo asset is
  provided.

## Typography / Color Notes
- Wordmark continues to use DM Sans-like tokenized font stack through the canonical
  wordmark primitive.
- `Abar` remains near-black and `Va` remains dark blue in the gallery examples.

## Validation
- `npx jest src/__tests__/integration/admin/experience-gallery.test.ts`
- `npx eslint src/components/admin/ExperienceGallery.tsx src/__tests__/integration/admin/experience-gallery.test.ts src/components/AbarvaNav.tsx`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`

## Runtime / Model / Workflow Notes
- No runtime model calls added.
- No chat or upload/parsing behavior introduced.
- No workflow engine changes.
