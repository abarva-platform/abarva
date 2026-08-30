# 2026-08-30-source-workspace-tenant-request-guard — Source Workspace Tenant Request Guard

## Release ID

`2026-08-30-source-workspace-tenant-request-guard`

## Status

`candidate`

## Plain-English Summary

The Source workspace now treats a `client` query parameter as an access-gated tenant request. If the requested tenant is unknown, the page returns not found. If the signed-in user cannot access the requested tenant, the page returns forbidden. The page no longer falls back to the session tenant while preserving a mismatched tenant key in the URL.

Follow-up hardening adds a visible blocked-workspace state for inaccessible requested tenants so operators see that no Source rows were loaded.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates the Source workspace page routing guard before loading Source read models or rendering Source 360.

Layer 3 Canonical Model: no schema or data changes.

Layer 2 Source Adapters: no adapter changes.

Layer 1 Client Intake: no intake changes.

## Client Applicability

- All clients: yes, for the Source workspace and Source 360 page route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `src/app/(maestro)/source/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/workspace/page.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- `npm run release:check` passed.

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify requested-tenant mismatch does not render fallback tenant data and verify an authorized tenant session renders its own Source workspace.

## Rollback Plan

Revert the page guard change through a PR and redeploy with the same ACA workflow. No database rollback is required.

## Audit Evidence

- PR URL: initial guard merged; visible blocked-state follow-up pending.
- CI checks: pending for follow-up.
- ACA deploy run: pending for follow-up.
- Live proof bundle: pending for follow-up.

## Known Gaps

This release does not change tenant session membership or data content. If a browser is signed in to the wrong tenant, it should fail closed for an inaccessible requested tenant; a separate correctly authorized session is still required to live-prove that tenant's Source data.
