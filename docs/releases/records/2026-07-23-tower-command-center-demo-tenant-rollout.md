# 2026-07-23-tower-command-center-demo-tenant-rollout — Tower Command Center Demo Tenant Rollout

## Release ID

`2026-07-23-tower-command-center-demo-tenant-rollout`

## Status

`candidate`

## Plain-English Summary

The rebuilt Tower Command Center remains tenant-gated, but the allowlist now includes the three governed demo tenants: Healthcare Demo, Airline Demo, and FS Demo. This follows the AI Portfolio density guard that caps bubble matrices at the top 10 initiatives for the selected filter while preserving the full filtered initiative list.

## Layer Impact

- `global-control-lane`: Updates the static feature flag registry for `tower_command_center_v2`.
- `public-demo`: Expands the reviewed Tower Command Center surface from Healthcare Demo to Airline Demo and FS Demo.

## Client Applicability

- All clients: No.
- Specific clients: Healthcare Demo (`meridian`), Airline Demo (`skyharbor`), FS Demo (`arcturus`).
- Internal only: No.
- Public/demo only: Demo tenant rollout only.
- Feature flag: `tower_command_center_v2` stays `policy: "tenant"` with an explicit `includeTenants` allowlist.

## Changes Included

- `src/lib/features/registry.ts` widens `tower_command_center_v2` from `["meridian"]` to `["meridian", "skyharbor", "arcturus"]`.
- `src/lib/features/__tests__/is-feature-enabled.test.ts` proves the flag is enabled for Healthcare Demo, Airline Demo, and FS Demo, including canonical dashed aliases, and remains off for Apex Retail and Lakeshore.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/features/__tests__/is-feature-enabled.test.ts --runInBand`
- PASS: `npx eslint src/lib/features/registry.ts src/lib/features/is-feature-enabled.ts src/lib/features/__tests__/is-feature-enabled.test.ts`
- PASS: `npm run audit:enterprise-naming`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc -p tsconfig.json --noEmit`

## Rollout Plan

Merge to `main`, let `.github/workflows/aca-main-deploy.yml` build and deploy the digest-pinned image to Azure Container Apps, then verify the ACA runtime invariant. Signed-in browser proof should be captured per newly enabled tenant before calling either tenant fully live-proven on the new Tower surface.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: static registry allowlist; emergency rollback by removing `skyharbor` and/or `arcturus`.
- Live signed-in proof required: Yes, for Airline Demo and FS Demo.

## Rollback Plan

Remove `skyharbor` and/or `arcturus` from `tower_command_center_v2.includeTenants` and redeploy through ACA main. The previous Tower remains available at `/tower/legacy` and automatically returns at `/tower` for tenants not on the allowlist.

## Audit Evidence

- PR URL: To be filled when opened.
- CI checks: To be filled from PR checks.
- Deploy run: To be filled after merge.
- Runtime invariant: To be filled after deploy.
- Signed-in screenshots: To be captured after deploy.

## Known Gaps

This is not platform default-on. Tenant-specific live proof may still show thinner Evidence or Recommended Actions sections where the Tower mart has sparse evidence for that tenant.
