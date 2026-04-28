# ADMIN7 — Visual Lock + Regression Guard

## Metadata
- ID: ADMIN7
- Title: Admin Visual Lock + Regression Guard
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: qa
- Dependencies: ADMIN1, ADMIN2, ADMIN3, ADMIN4, ADMIN5, ADMIN6
- Estimated complexity: M

## Purpose
Lock the admin redesign with hex / font / logo regression guards and update the WIRE2B compliance scores from 72→92.

## Context
Without a regression guard a future PR will inevitably re-introduce a banned token, an inline wordmark, or a non-Cormorant title font. ADMIN7 is the visual fence around the wave's deliverables and the place where the WIRE2B audit table is rescored to reflect the rendered pixels.

## Target state
- Hex-scan test fails any non-canonical hex inside `src/app/(maestro)/admin/**` or `src/components/admin/**`.
- Font-family scan limits the admin tree to Cormorant Garamond / DM Sans / Georgia.
- Logo presence test asserts every admin page renders `AbarVaLogo` from the canonical component (no inline wordmarks).
- WIRE2B scores updated: admin pages 72→92.
- Optional Playwright snapshot stubs at 1280×800.

## Allowed files
- `src/__tests__/integration/admin/admin-visual-regression.test.ts` (new)
- `scripts/integration/check_admin_design_tokens.sh` (new)
- `src/lib/qa/wireframe-compliance-audit.ts` (modify — score updates only)
- `docs/build/slices/ADMIN7_VISUAL_LOCK.md`

## Forbidden files
- Any admin page or component (must already be merged via ADMIN1–6)
- Any token file (ADMIN1)
- Any read-model file (ADMIN4–6)

## Implementation scope
1. **Hex-scan test:** read each file under the admin tree, fail on any hex literal outside the canonical palette (INK, NAVY, CREAM, SKY_PALE, MINT_SOFT, AMBER_SOFT, CORAL_SOFT plus neutral grays explicitly listed).
2. **Font-family scan:** assert font-family declarations in admin tree resolve to Cormorant Garamond / DM Sans / Georgia.
3. **Logo presence test:** every admin page module imports `AbarVaLogo` from the canonical brand component (no inline wordmarks, no `<img src="/abarva.png">` style stubs).
4. **WIRE2B score update:** edit `wireframe-compliance-audit.ts` raising admin scores to 92. Update `safeFixesApplied` and `avgScore` accordingly.
5. **Playwright stub:** if Playwright is configured, add a `baseline.spec.ts` snapshot file at 1280×800 for one admin page; if not, skip cleanly.

## Tests
- `src/__tests__/integration/admin/admin-visual-regression.test.ts` (40+ tests):
  - hex-scan passes against current admin tree
  - hex-scan rejects a synthetic violation fixture
  - font-family scan passes
  - font-family scan rejects a synthetic violation
  - logo presence test passes for all 8 admin pages
  - compliance score reflects new value
  - score update doesn't break existing audit consumers

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/lib/qa src/__tests__/integration/admin/admin-visual-regression.test.ts
npx jest src/__tests__/integration/admin/admin-visual-regression
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. Regression guard fails any future PR that drifts.
2. Score updates reflected in `wireframe-compliance-audit.ts`.
3. `npx tsc --noEmit` clean.
4. ESLint clean.

## Risks
- Score update is the only file the wave touches in `wireframe-compliance-audit.ts` — any other audit changes belong in a separate slice.
- Playwright may not be configured; skip cleanly rather than introducing it as a dependency in this slice.

## Founder review
No new visible UI. Reviewer should run the regression suite and confirm scores. From this point on, any drift breaks CI.
