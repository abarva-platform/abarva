# 2026-07-14-nexus-brand-navigation-visual-polish — NEXUS Navigation Visual Polish

## Release ID

`2026-07-14-nexus-brand-navigation-visual-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the production NEXUS top navigation after visual review. The approved AbarVa NEXUS lockup remains in place, but the rendered lockup is smaller and the navigation/action row is optically lowered so the bar feels less oversized and better aligned.

## Layer Impact

- UI shell: Adjusts only the CSS presentation of the global authenticated top navigation.
- Data plane: No impact.
- Auth/runtime behavior: No impact.

## Client Applicability

- All clients: Yes, for the authenticated product shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/navigation/NexusTopNav.module.css` reduces the rendered lockup footprint and adjusts the nav/action optical baseline.

## QA / Validation

- Pass: `npm run audit:nexus-navigation`
- Pass: `npx jest src/components/navigation/__tests__/NexusTopNav.test.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts --runInBand`
- Pass: `npx eslint src/components/navigation/NexusTopNav.tsx src/components/navigation/__tests__/NexusTopNav.test.tsx src/components/shell/topbar-nav-items.ts src/components/shell/AppShell.tsx src/app/'(maestro)'/home/learn/layout.tsx scripts/audit/nexus-navigation-contract.mjs`

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deploy workflow will build and deploy the corrected product image. Signed-in browser proof is required before calling the visual correction live-proven.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the approved main deploy workflow.
- Approved image digest: To be recorded after ACA deploy.
- ACA runtime invariant: Required after ACA deploy.
- Worker image invariant: Required after ACA deploy if the workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by reverting this CSS-only PR or by redeploying the prior digest-pinned ACA image through the approved workflow if an urgent visual regression is found.

## Audit Evidence

- PR URL: To be added after PR creation.
- Signed-in screenshots: To be captured after deploy.
- ACA revision and digest: To be captured after deploy.

## Known Gaps

No data-plane, Home, Admin, or module runtime behavior changes are included.
