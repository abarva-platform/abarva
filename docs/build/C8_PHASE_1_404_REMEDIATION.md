# C8 Phase 1 404 Remediation Report

Date: 2026-05-30
Worker: D
Branch: codex/c8-phase1-404-remediation
Base ref: local origin/main at 65ad1c9fe, because GitHub fetch was blocked by authentication in this environment.

## Scope

Section 8.2 only: demo-critical 404 remediation for the five canonical tenants and primary demo surfaces.

In scope:
- Route crawl and route inventory artifacts.
- Tenant route resolver fixes.
- Focused tests for route resolver and route manifest behavior.

Out of scope:
- Ask runtime and retrieval files.
- Phase 4 verifier files.
- Database migrations.

## Crawl And Discovery

| Check | Result |
| --- | --- |
| Static App Router page inventory | Route groups, dynamic routes, and page files were enumerated from `src/app`. |
| Existing deterministic link crawler | PASS after fix: `routes=719`, `links=7002`, `brokenRoutes=0`, `brokenLinks=0`, `redirectViolations=0`. |
| Existing demo tenant route manifest | Found stale two-tenant coverage and no C8 working/stub/404/inconsistent classification field. |
| Live authenticated crawl | Blocked: clean worktree has no `.env.local`, Clerk keys, Supabase credentials, or real demo session state. Live protected pages would redirect or fail auth setup rather than prove route health. |

## Classification

Legend:
- `working`: route has an App Router page and a seeded/read-model-backed route resolver.
- `stub`: route has an App Router page and an honest zero-program state, not fabricated seeded content.
- `404`: route falls through `notFound()` or has no page.
- `inconsistent`: route exists but canonical slug or inventory disagrees with runtime expectations.

| Surface | Apex Retail | Meridian Health | First Capital | Northstar | SkyHarbor |
| --- | --- | --- | --- | --- | --- |
| `/home` | working | working | working | working | working |
| `/intelligence` | working | working | working | working | working |
| `/moves` / `/strategic-moves` | working | working | working | working | working |
| `/source` and Source index routes | working | working | working | working | working |
| `/tower` | working | working | working | working | working |
| `/admin`, `/platform/admin`, setup/context surfaces | working | working | working | working | working |
| `/tenant/<slug>` | working | working | working | stub fixed | stub fixed |
| `/tenant/<slug>/intelligence` | working | working | working | stub fixed | stub fixed |
| `/tenant/<slug>/tower` | working | working | working | stub fixed | stub fixed |
| `/tenant/<slug>/programs` | redirects to global Programs | redirects to global Programs | redirects to global Programs | redirects to global Programs | redirects to global Programs |

## Fixes

1. Added Northstar and SkyHarbor to the seed route plan as honest zero-program demo route stubs:
   - `northstar` -> `/tenant/northstar-clinical`
   - `skyharbor` -> `/tenant/skyharbor-air`

2. Expanded the deterministic demo tenant route manifest to all five canonical tenant slugs:
   - `/tenant/apex-retail`
   - `/tenant/meridian-health`
   - `/tenant/first-capital-financial`
   - `/tenant/northstar-clinical`
   - `/tenant/skyharbor-air`

3. Added C8 classification to demo tenant route records:
   - `working`
   - `stub`
   - `404`
   - `inconsistent`

4. Added focused tests proving Northstar and SkyHarbor resolve as stubs, not 404s or fabricated seeded portfolios.

## Deferred Routes

None for main demo flow reachability. Northstar and SkyHarbor tenant-scoped program portfolios remain honest zero-program stubs until their real program seed portfolios are authored.

## Validation

- PASS: `npm test -- --runTestsByPath src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/__tests__/integration/programs-enhancement-seed-planner.test.ts src/__tests__/integration/qa/demo-tenant-route-verification.test.ts src/__tests__/integration/qa/route-smoke-inventory.test.ts --runInBand`
- PASS: `npm run integrity:link-crawler`
- PASS: `npx eslint src/lib/programs/enhancement-seed-planner.ts src/__tests__/integration/programs-enhancement-seed-planner.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/lib/qa/demo-tenant-route-verification.ts src/__tests__/integration/qa/demo-tenant-route-verification.test.ts`
- PASS: `git diff --check`
- BLOCKED: live authenticated crawl in the clean worktree, because required Clerk/Supabase credentials and real session state are not present.
- PASS: `npm run release:check`
