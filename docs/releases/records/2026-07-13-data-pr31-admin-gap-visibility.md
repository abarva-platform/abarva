# 2026-07-13-data-pr31-admin-gap-visibility — DATA-PR31 Admin Gap Visibility

## Release ID

`2026-07-13-data-pr31-admin-gap-visibility`

## Status

`candidate`

## Plain-English Summary

Tightens DATA-PR31 Admin Data Layer Explorer visibility so the page shows the audit's adapter gaps, mapping gaps, Home/aVa representation warnings, and promotion blockers directly in the UI, not only in the generated JSON proof bundle.

## Layer Impact

- `internal-admin`: updates `/admin/data-layer-explorer` display only.
- `client-data-lane`: no data writes, no candidate regeneration, no manifest remediation, no promotion, and no Active Tenant Access update.
- `global-control-lane`: no runtime module consumption change.

## Client Applicability

- All audited demo tenants represented by the DATA-PR31 audit.
- Northstar remains retired/excluded from active processing.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds visible `Adapter gaps`, `Mapping gaps`, `Home/aVa representation warnings`, and `Promotion blockers` sections to the DATA-PR31 panel.
- Adds a source-level test so those sections stay visible on the Admin route.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts --runInBand`
- Pass: `npx eslint src/app/'(maestro)'/admin/data-layer-explorer/page.tsx src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane and deploy only through the repo-owned Azure Container Apps main deployment workflow. After deploy, verify `/admin/data-layer-explorer` with a signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.

## Rollback Plan

Revert this PR. The change is display-only and has no data-plane side effects.

## Audit Evidence

- Admin route: `/admin/data-layer-explorer`
- DATA-PR31 proof bundle: `reports/data-quality/manifest-projection/latest/`

## Known Gaps

This PR still does not remediate source manifests or regenerate candidates. DATA-PR32 remains the first real SkyHarbor applications/systems candidate regeneration step.
