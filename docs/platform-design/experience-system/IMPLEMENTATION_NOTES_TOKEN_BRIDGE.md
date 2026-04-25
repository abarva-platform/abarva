# Experience System Token Bridge Implementation Notes

Date: 2026-04-25

Status: implemented as additive token aliases only.

## Purpose

This note records the first code-level bridge from the AbarVa Experience System to the current application token file.

The implementation adds warm Experience System aliases in `src/lib/design-system.ts` without refactoring pages, changing component styling, or removing the current dark-first tokens.

## Files Changed

- `src/lib/design-system.ts`
- `docs/platform-design/experience-system/IMPLEMENTATION_NOTES_TOKEN_BRIDGE.md`

## Token Groups Added

The bridge adds aliases for:

- warm background / ivory
- surface / surfaceWarm
- textPrimary / textSecondary through `EXPERIENCE_COLORS`
- navy / navySoft
- accentBlue
- accentTeal
- mutedBrown
- borderSoft
- riskAmber
- riskRed
- successGreen
- darkPanel
- journeyActive / journeyComplete / journeyBlocked / journeyWaiting
- evidenceUsable / evidenceLowConfidence / evidenceMissing

## Compatibility Decision

The existing `COLORS` export remains the backward-compatible entry point for current pages. It keeps existing dark tokens such as `pageBg`, `cardBg`, `surfaceBg`, `textPrimary`, `textSecondary`, and `teal`.

The new aliases are additive:

- future pages can use `COLORS.warmBackground`, `COLORS.ivory`, `COLORS.surfaceWarm`, `COLORS.navy`, and related semantic names
- future code that wants the Experience System grouping can use `EXPERIENCE_COLORS`
- existing pages do not change visual behavior in this slice

## Explicit Non-Scope

This slice does not:

- refactor pages
- change component styling
- change routes
- change API behavior
- call models
- implement upload/parsing
- implement persistence
- touch `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`

## Adoption Guidance

Future UI slices should migrate one surface at a time. Each surface should cite the relevant Experience System docs and use the token aliases rather than introducing local color constants.

Recommended first consumers:

- Source dashboard follow-up refinements
- Admin/Setup readiness surfaces
- Source data readiness panel
- table-forward portfolio surfaces

## Validation Expectation

Token bridge validation should include:

- scoped ESLint for `src/lib/design-system.ts`
- `npx tsc --noEmit --pretty false`
- no visual claims beyond additive aliases
