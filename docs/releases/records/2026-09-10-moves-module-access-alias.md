# 2026-09-10-moves-module-access-alias — Moves Module Access Compatibility

## Release ID

`2026-09-10-moves-module-access-alias`

## Status

`candidate`

## Plain-English Summary

Signed-in users whose product metadata still names the Moves module as `moves` now receive access to the canonical Programs/Moves surface. The app already uses `programs` as the server-side module key, so this keeps legacy metadata from bouncing valid users away from the Moves workspace.

## Layer Impact

Layer 4 Products; lane `global-control-lane`: the signed-in module access projection now normalizes an older product key to the canonical key before page guards evaluate access. No client intake, adapter, canonical model, tenant data, or generated content path changes.

## Client Applicability

All clients: applies to signed-in users whose account metadata carries the older Moves module key.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- `src/lib/auth/module-access.ts` normalizes `moves` to `programs`.
- `src/lib/auth/__tests__/module-access.test.ts` covers the legacy metadata shape.

## QA / Validation

- Passed: `npm test -- --runTestsByPath src/lib/auth/__tests__/module-access.test.ts`
- Passed: `npx eslint src/lib/auth/module-access.ts src/lib/auth/__tests__/module-access.test.ts`
- Passed: `npm run release:check`
- Pending until rollout: post-deploy signed-in Moves workspace smoke will be rerun as part of the active E2E.

## Rollout Plan

Merge to `main`, then let the repo-owned Azure Container Apps deploy workflow build and deploy the image. No migration or data-plane action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: recorded after deployment
- ACA runtime invariant: required after deployment
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, reopen the Moves phase workspace with legacy `moves` metadata

## Rollback Plan

Revert this release commit and redeploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL and CI checks
- ACA main deploy run
- Runtime invariant output
- Signed-in Moves workspace smoke screenshot

## Known Gaps

No data-plane or generated-content changes are included, so this release does not prove the active E2E by itself. The signed-in workspace proof remains a required post-deploy check because the defect only appears at the product route guard.
