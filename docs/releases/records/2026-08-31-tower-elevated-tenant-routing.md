# 2026-08-31-tower-elevated-tenant-routing — Tower Tenant Selection Precedence

## Release ID

`2026-08-31-tower-elevated-tenant-routing`

## Status

`candidate`

## Plain-English Summary

Tower now honors an explicit client selection for elevated users even when their account email contains a tenant-shaped hint. Tenant-locked users remain pinned to their authorized tenant and cannot switch tenants through a URL parameter.

## Layer Impact

Layer 4 PRODUCTS, release lane `global-control-lane`: updates the shared tenant resolver used by Tower and other product surfaces so elevated sessions can intentionally select an authorized tenant while locked sessions keep the existing isolation behavior.

## Client Applicability

- All clients: applies to shared product runtime tenant resolution.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tenant/resolveTenant.ts`
- `src/lib/tenant/__tests__/resolveTenant.test.ts`
- `docs/releases/records/2026-08-31-tower-elevated-tenant-routing.md`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/tenant/__tests__/resolveTenant.test.ts --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts' --runInBand`
- Pass: `npx eslint src/lib/tenant/resolveTenant.ts src/lib/tenant/__tests__/resolveTenant.test.ts 'src/app/(maestro)/tower/page.tsx' 'src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Not run yet: ACA runtime invariant and signed-in Tower proof after deploy.

## Rollout Plan

Merge by pull request into `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. No data-plane job, schema migration, feature flag, or manual traffic mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: assigned by the deploy workflow
- ACA runtime invariant: required before claiming live behavior
- Worker image invariant: unchanged by this release
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the resolver precedence change through a follow-up PR and allow the repo-owned deploy workflow to publish the rollback image.

## Audit Evidence

- Pull request and workflow run once opened.
- Local resolver regression test output.
- Local Tower route scope test output.
- ACA runtime invariant after merge.
- Signed-in Tower route proof after deploy.

## Known Gaps

The change does not add new tenant entitlements. It only changes precedence for elevated sessions that are already allowed to select tenants; locked sessions continue to resolve from their pinned session context.
