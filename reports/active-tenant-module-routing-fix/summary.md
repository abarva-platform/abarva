# Active Tenant Module Routing Fix — Airline and FS

## Status

Candidate proof generated locally. Production/browser proof is still required after merge and ACA main deploy.

## What changed

- Home now prefers `datasets/tenant-inputs/active/<tenant>/current` for tenants with active standard v3 packets before falling back to legacy V7/V6 browsers.
- SkyHarbor Intelligence now reads active/current standard v3 files first and no longer throws a user-facing missing-file error for `skyharbor-air-synthetic-v6/templates/V6_02_business_functions.csv`.
- Tower starter questions are tenant-aware: holdco wording remains for holdco tenants only; Airline, Healthcare, and FS demos receive enterprise-safe Tower prompts.
- Tower budget posture copy is tenant-aware and no longer reuses healthcare operational language for Airline or FS.

## Local evidence

| Area                       | Tenant                  | Proof                                                                | Result                                                                     |
| -------------------------- | ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Home active packet         | SkyHarbor Air           | `getLocalCxoRuntimeBrowser("skyharbor")` resolves active/current     | `local-v3-active`, 613 application rows, IROPS AI recovery cockpit visible |
| Home active packet         | Financial Services Demo | `getLocalCxoRuntimeBrowser("first-capital")` resolves active/current | `local-v3-active`, 212 application rows, 96 program rows                   |
| Intelligence active packet | SkyHarbor Air           | SkyHarbor CTO source packet lists active/current source files        | No `skyharbor-air-synthetic-v6` path in source detail                      |
| Tower tenant starters      | SkyHarbor Air           | Component regression                                                 | Enterprise budget/run/change/funded-initiative starter questions           |
| Tower tenant starters      | Financial Services Demo | Component regression                                                 | Enterprise budget/run/change/funded-initiative starter questions           |

## Validation run

- `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/home/__tests__/local-cxo-runtime.test.ts --runInBand`
- `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
- `npx eslint src/lib/home/local-cxo-runtime.ts src/lib/home/v6-context-browser.ts 'src/app/(maestro)/home/page.tsx' src/lib/intelligence/skyharbor-cto-readiness.ts src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts src/components/tower/TowerIndexPage.tsx`
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- `git diff --check`

## Boundaries

- No data reload.
- No candidate promotion.
- No Azure/Postgres mutation.
- No ACA traffic mutation from this branch.
- Legacy V6/V7 code remains only as compatibility fallback where no active standard v3 packet exists.

## Pending live proof

After merge and repo-owned ACA deploy:

1. Confirm ACA revision and image digest match merged SHA.
2. Run signed-in Airline proof for Home, Intelligence, Tower, Moves, and Source.
3. Run signed-in FS proof for Home, Intelligence, Tower, Moves, and Source.
4. Confirm no cross-tenant bleed and no stale visible user-facing V6/V7/local fallback copy.
