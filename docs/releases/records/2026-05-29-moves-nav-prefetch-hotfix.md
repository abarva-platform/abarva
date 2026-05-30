# 2026-05-29-moves-nav-prefetch-hotfix — Moves Nav Document Navigation Hotfix

## Release ID

`2026-05-29-moves-nav-prefetch-hotfix`

## Status

`candidate`

## Plain-English Summary

This release fixes the Home to Moves click path. Direct `/strategic-moves` loads worked, but the top-bar Moves link could use a stale client-router navigation result and leave some client personas on Home. Product-module nav links now use normal document anchors so each click performs a fresh authenticated document navigation after the session and active-client cookie are ready.

## Layer Impact

Runtime app lane: shared AppTopBar product navigation behavior changes for module links.

Control lane: release evidence records the P0 triage, blast-radius decision, and rollback path.

Data/schema lane: no schema, seed, corpus, retrieval, or tenant-data changes.

Auth lane: no auth-policy change and no PR #2445 rollback.

## Client Applicability

- All clients: yes. The top-bar product navigation is shared across all authenticated client tenants.
- Specific clients verified pre-fix: Apex Retail, Meridian Health, and SkyHarbor Air.
- Public/demo only: no. Authenticated app shell only.
- Feature flag: none.

## Changes Included

- `src/components/shell/AppTopBar.tsx`
- `src/__tests__/integration/app-topbar-prefetch-guard.test.ts`
- `docs/releases/records/2026-05-29-moves-nav-prefetch-hotfix.md`

## QA / Validation

- PASS: live diagnostic confirmed direct `/strategic-moves` and `/moves` render `h1=Strategic Moves` for Apex, Meridian, and SkyHarbor.
- PASS: live diagnostic reproduced the top-bar click bounce for Apex/Meridian before the fix.
- PASS: `jest --runTestsByPath src/__tests__/integration/app-topbar-prefetch-guard.test.ts --runInBand`.
- PASS: `eslint src/components/shell/AppTopBar.tsx src/__tests__/integration/app-topbar-prefetch-guard.test.ts`.
- PASS: `git diff --check`.
- PENDING: CI checks on PR.
- PENDING: post-deploy live click smoke for Apex, Meridian, and SkyHarbor.

## Rollout Plan

Merge after CI green. Deploy through the normal Git integration. Run the live click smoke on `app.abarva.ai` for Apex CIO, Meridian CDIO, SkyHarbor CTO, and SkyHarbor admin.

## Rollback Plan

Revert this PR to restore Next.js client-side navigation on AppTopBar product-module links. No database rollback is required.

## Audit Evidence

- `/tmp/moves-p0-triage/moves-p0-matrix-ticket.json`
- `/tmp/moves-p0-triage/moves-p0-matrix-ui-cookie.json`
- `/tmp/moves-p0-triage/moves-p0-direct-routes.json`
- `/tmp/moves-p0-triage/moves-p0-geometry.json`

## Known Gaps

The user-requested `cio@meridian-health.example.com` account is not in the canonical demo roster and returns `401 invalid_credentials`; Meridian validation uses the canonical `cdio@meridian-health.example.com` account until that roster decision changes.
