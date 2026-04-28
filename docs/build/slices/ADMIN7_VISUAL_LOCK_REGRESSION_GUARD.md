# ADMIN7 — Visual Lock + Regression Guard

## Metadata
- ID: ADMIN7
- Title: Admin Visual Lock + Regression Guard
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: code_complete
- Type: qa
- Dependencies: ADMIN1, ADMIN2, ADMIN3, ADMIN4, ADMIN5, ADMIN6
- Completed: 2026-04-27

## Purpose
Lock the admin redesign behind a regression guard so hex / font / shell / logo
drift breaks CI. Update WIRE2B compliance scores to reflect the rendered pixels
shipped by ADMIN1–6.

## What's locked
- **Hex palette.** Every hex literal in `src/components/admin/**`,
  `src/lib/admin/**`, and `src/app/(maestro)/admin/**` must be in the canonical
  allow-list. Any banned token (`#14B8A6`, `#0E9F8C`, `#0D9488`, `#06B6D4`,
  `#7C3AED`, `#A855F7`, `#9333EA`, `#D946EF`, `#EC4899`) anywhere in the admin
  tree fails the suite.
- **Font families.** Only Cormorant Garamond / DM Sans / Georgia (or
  inherit/system fallbacks) allowed in admin tree.
- **Shell imports.** Every one of the 8 canonical `/admin/*` routes must import
  `AdminCanonShellV2`, `EditorialCanvas`, and `AgentRail`.
- **Logo.** Brand barrel re-exports `AbarVaLogo`; no admin file may inline a
  hand-coded SVG wordmark or reference a bitmap logo asset.

## What the regression guard catches
- A future PR introducing `#14B8A6` or any banned teal/cyan/purple/magenta in
  admin code → suite fails, CI fails, shell guard fails.
- A future PR using `fontFamily: 'Comic Sans MS'` → suite fails.
- A future admin page that forgets to import `AdminCanonShellV2` → suite fails.
- A future admin page hand-coding `<svg>...Abarva...</svg>` → suite fails.

## WIRE2B score deltas
| Surface | Before | After | Note |
|---|---|---|---|
| Admin (`/platform/admin`) | 72 | 92 | ADMIN1–6 |
| Production Readiness | 80 | 92 | ADMIN5 |
| Architecture | 58 | 90 | ADMIN4 (component drawer remains open) |
| Programs Index | 76 | 76 | unchanged |
| Program Detail | 72 | 72 | unchanged |
| Source Event | 71 | 71 | unchanged |
| Intelligence | 84 | 84 | unchanged |
| Control Tower | 82 | 82 | unchanged |

`safeFixesApplied`: 13 → 15 (only honest deltas).

## Files added
- `src/__tests__/integration/admin/admin7-visual-lock.test.ts` — 70 tests
- `scripts/integration/check_admin_design_tokens.sh` — shell CI gate
- `docs/build/slices/ADMIN7_VISUAL_LOCK_REGRESSION_GUARD.md` (this file)

## Files modified
- `src/lib/qa/wireframe-compliance-audit.ts` — score updates + safe-fix flags
- `src/__tests__/integration/qa/wireframe-compliance-audit.test.ts` — expectations
- `src/components/admin/DatasetExplorerPanel.tsx` — replaced banned `#0E9F8C` accent with `#0b4a91` navy
- `src/components/admin/StewardSetupControlCenter.tsx` — replaced banned `#0E9F8C` accent with `#0b4a91` navy

## Test count
70 tests in `admin7-visual-lock.test.ts` (page presence × 8 × 4 dimensions,
banned-token sweep × 9, hex-canonicality, font discipline, logo audit, token
registry sanity, synthetic fixtures, coverage sanity).

## Acceptance
- `bash scripts/integration/check_admin_design_tokens.sh` exits 0
- `npx jest src/__tests__/integration/admin/admin7-visual-lock.test.ts` green
- `npx jest src/__tests__/integration/qa/wireframe-compliance-audit.test.ts` green
- TypeScript clean, ESLint clean, hygiene gate 11/11

## Notes
The Architecture component detail drawer remains an open `interaction_map`
deviation (Wave 33). Score reflects shell + canon + atlas identity but not the
deferred drawer interaction. That deviation is intentionally NOT marked
`safeFixApplied: true`.
