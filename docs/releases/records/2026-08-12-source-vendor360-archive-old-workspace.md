# 2026-08-12-source-vendor360-archive-old-workspace — Source Vendor 360 Route Archive

## Release ID

`2026-08-12-source-vendor360-archive-old-workspace`

## Status

`candidate`

## Plain-English Summary

The Source Vendor 360 workspace route now opens as a dedicated cockpit instead of a legacy multi-lens workspace. The old explorer rail, portfolio tab strip, compact metric strip, and portfolio Explore/Concentration/Renewals lenses are no longer reachable from the Vendor 360 landing surface. The release also pins the two launch identities used for production proof to their intended reference tenants.

## Layer Impact

Products (`global-control-lane`): Source presentation changes only. The governed Source read model, adapters, loaders, and tenant data remain unchanged.

Auth/session routing (`global-control-lane`): Static launch-access metadata now explicitly pins one launch identity to the SkyHarbor reference tenant and preserves the existing Meridian launch identity.

## Client Applicability

All clients: Source workspace users receive the simplified Vendor 360 route presentation.

Specific clients: The launch identity routing applies only to the explicitly listed launch identities.

Internal only: None.

Public/demo only: None.

Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/lib/auth/launch-access.ts`
- `src/lib/auth/__tests__/launch-access.test.ts`
- `src/lib/tenant/__tests__/resolveTenant.test.ts`

## QA / Validation

- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=4096 npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' src/lib/auth/launch-access.ts src/lib/auth/__tests__/launch-access.test.ts src/lib/tenant/__tests__/resolveTenant.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `NODE_OPTIONS=--max-old-space-size=4096 npx jest --runTestsByPath src/lib/auth/__tests__/launch-access.test.ts src/lib/auth/__tests__/pilot-access.test.ts src/lib/tenant/__tests__/resolveTenant.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deployment workflow builds and deploys the resulting image to the shared lab/product runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source/preview/workspace`.

## Rollback Plan

Revert the merge commit and let the repo-owned Azure Container Apps main deployment workflow redeploy the prior presentation. No data migration or tenant data rollback is required.

## Audit Evidence

- PR URL after creation.
- GitHub Actions deploy run after merge.
- ACA runtime invariant artifact after deploy.
- Signed-in browser proof for `/source/preview/workspace`.

## Known Gaps

No new data-plane changes are included. Actual Clerk dashboard metadata may still be audited separately, but route resolution now pins these launch identities from the trusted email resolver before stale session metadata or active-client cookies.
