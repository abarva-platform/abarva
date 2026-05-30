# 2026-05-30-c8-phase1-404-remediation — C8 Phase 1 404 Remediation

## Release ID

`2026-05-30-c8-phase1-404-remediation`

## Status

`candidate`

## Plain-English Summary

Northstar and SkyHarbor are now recognized by the tenant-scoped route resolver, so their demo tenant URLs render honest zero-program route stubs instead of falling into a 404. The route audit manifest now covers all five canonical demo tenants and classifies each route as working, stub, 404, or inconsistent.

## Layer Impact

- `global-control-lane`: updates deterministic route planning and QA inventory shared by all demo tenants.
- `public-demo`: improves demo route reachability for canonical tenant walkthroughs without claiming seeded programs exist for Northstar or SkyHarbor.

## Client Applicability

- All clients: no production data-plane or runtime retrieval behavior changed.
- Specific clients: Northstar Clinical Technologies and SkyHarbor Air gain tenant-scoped route stubs.
- Internal only: route audit/report artifacts.
- Public/demo only: canonical demo route inventory.
- Feature flag: none.

## Changes Included

- Extended seed route plan with Northstar and SkyHarbor zero-program stubs.
- Expanded demo tenant route manifest from partial two-tenant coverage to all five canonical tenant slugs.
- Added C8 route classification fields and focused tests.
- Added C8 Phase 1 remediation report at `docs/build/C8_PHASE_1_404_REMEDIATION.md`.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/__tests__/integration/programs-enhancement-seed-planner.test.ts src/__tests__/integration/qa/demo-tenant-route-verification.test.ts src/__tests__/integration/qa/route-smoke-inventory.test.ts --runInBand`
- PASS: `npm run integrity:link-crawler` (`routes=719`, `links=7002`, `brokenRoutes=0`, `brokenLinks=0`, `redirectViolations=0`)
- PASS: `npx eslint src/lib/programs/enhancement-seed-planner.ts src/__tests__/integration/programs-enhancement-seed-planner.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/lib/qa/demo-tenant-route-verification.ts src/__tests__/integration/qa/demo-tenant-route-verification.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- BLOCKED: live authenticated crawl in the clean worktree, because required Clerk/Supabase credentials and real session state are not present.

## Rollout Plan

Merge to `main`; the next Vercel deployment picks up the route resolver and manifest changes. No migration or manual data operation is required.

## Rollback Plan

Revert this PR. That restores the prior route plan and manifest behavior. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- C8 report: `docs/build/C8_PHASE_1_404_REMEDIATION.md`.
- Local validation output: to be added to PR description after checks complete.

## Known Gaps

Live authenticated crawl was blocked in the clean worktree because Clerk/Supabase credentials and real session state were not present. Northstar and SkyHarbor program portfolios remain zero-program stubs until seeded program portfolios are authored.
