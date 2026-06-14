# 2026-06-14-admin-setup-data-pane-compact — Compact Setup Data Pane

## Release ID

`2026-06-14-admin-setup-data-pane-compact`

## Status

`candidate`

## Plain-English Summary

Tightens the canonical Admin Setup Data pane so it behaves like a compact setup workflow instead of a large marketing-style page. The Data tab now has one clear action model, distinguishes first-time setup packages from ongoing single-file updates, and keeps ZIP/package intake truthfully labeled as review-first until server-side unpack and commit are proven.

## Layer Impact

- `global-control-lane`: updates shared Admin Setup UI behavior and copy for all tenants using the canonical `/admin` setup page.
- `internal-admin`: affects the AbarVa steward/operator setup workflow for tenant data loading and review.

## Client Applicability

- All clients: yes, for the shared Admin Setup surface.
- Specific clients: none.
- Internal only: yes, setup/admin operators.
- Public/demo only: no.
- Feature flag: none; this follows the canonical `/admin` setup route.

## Changes Included

- Compact typography and spacing in `AdminSetupExperience`.
- Removal of the duplicate Data-tab primary CTA so `Add data` appears only outside the Data tab.
- Package-vs-single-file load mode selector in the Data tab.
- Compact upload connector copy and drop target.
- Focused tests for Data tab click behavior, loaded-file count binding, package-vs-single-file copy, and canonical route-source contract.

## QA / Validation

- PASS — `npx eslint src/components/admin/AdminSetupExperience.tsx src/components/admin/context-layer/CsvUploadConnector.tsx src/components/admin/__tests__/AdminSetupExperience.test.tsx src/components/admin/__tests__/admin-canonical-setup-source.test.ts`
- PASS — `npx jest src/components/admin/__tests__/AdminSetupExperience.test.tsx src/components/admin/__tests__/admin-canonical-setup-source.test.ts --runInBand`

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, deploy to the lab ACA app, health-gate the new revision, shift 100% traffic, and verify the signed-in `/admin` Data tab in Chrome.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image/revision, or shift ACA traffic back to the previous revision if still active.

## Audit Evidence

- PR and CI checks for this release candidate.
- Focused local lint and Jest output.
- Post-deploy ACA revision, health check, redirect check, and signed-in browser screenshot.

## Known Gaps

Server-side ZIP unpack/classify/commit is not claimed by this release. Package intake is intentionally review-first until that backend path is implemented and validated.
