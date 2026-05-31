# 2026-05-30-admin-guidance-content-first — Admin Guidance Drawer

## Release ID

`2026-05-30-admin-guidance-content-first`

## Status

`candidate`

## Plain-English Summary

Admin menu pages should be simple enough for Maestros to understand without parsing a permanent agent rail. This release keeps static page guidance available, but moves it into an on-demand Guidance drawer so the default view is the actual work surface.

## Layer Impact

`global-control-lane`: Updates the shared admin shell layout used by Setup/Admin menu pages.

`internal-admin`: Improves Maestro/admin page consumption by removing the persistent right rail from default page layouts.

## Client Applicability

- All clients: All canonical tenants receive the cleaner admin shell.
- Specific clients: Apex Retail, Meridian Health, Northstar Clinical, First Capital, and SkyHarbor Air.
- Internal only: Setup/Admin operator pages.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `src/components/admin/AdminCanonShellV2.tsx`: Converts static `agentRail` content into a fixed, on-demand Guidance drawer and keeps the main layout at `sidebar | content`.
- `src/components/admin/StewardEditorial.tsx`: Removes internal `Context used` provenance chips from default Maestro-facing editorial cards.
- `src/components/admin/__tests__/AdminCanonShellV2.test.tsx`: Locks the content-first static guidance layout.
- `docs/build/ADMIN_MAESTRO_DESIGN_QA_2026-05-30.md`: Records the landing-page versus menu-page design contract and current gap closure.

## QA / Validation

- Passed: `npx eslint src/components/admin/AdminCanonShellV2.tsx src/components/admin/__tests__/AdminCanonShellV2.test.tsx`
- Passed: `npx jest --runTestsByPath src/components/admin/__tests__/AdminCanonShellV2.test.tsx`
- Passed: `npm run release:check`
- Passed: local authenticated browser smoke for `/admin/users-access`, `/admin/connectors`, and `/admin/production-readiness`; each route stayed at `window.scrollY = 0`, rendered one Guidance drawer, and rendered no persistent `aside[data-admin-agent-rail]`.
- Passed: `npx eslint src/components/admin/AdminCanonShellV2.tsx src/components/admin/StewardEditorial.tsx src/components/admin/__tests__/AdminCanonShellV2.test.tsx`
- Passed: `npx jest --runTestsByPath src/components/admin/__tests__/AdminCanonShellV2.test.tsx` includes a regression that hides internal `Context used` chips.

## Rollout Plan

Merge to `main`; Vercel deploys the shared shell change. No data migration or tenant-specific rollout step is required.

## Rollback Plan

Revert the release commit or PR to restore the persistent static right rail. No data rollback is required.

## Audit Evidence

- User screenshots showed admin pages that were too crowded for Maestro consumption, including internal provenance chips such as `tenant isolation guard` on default cards.
- The design QA document records the intended landing/menu page split.
- Regression test asserts no permanent `280px 1fr 320px` admin layout for static guidance pages.

## Known Gaps

Dense internal sections such as the Agent Readiness matrix and PatternOps coverage map still need progressive-disclosure polish in a later UX wave.
