# 2026-08-27-tower-tenant-route-scope — Tower Tenant Route Scope

## Release ID

`2026-08-27-tower-tenant-route-scope`

## Status

`candidate`

## Plain-English Summary

Tenant-scoped Tower URLs now render through the shared Tower command center with the tenant that
was already authorized by the route guard. They no longer hand off through a generic client query
parameter before the Tower read path resolves its tenant.

## Layer Impact

- Layer 4, Products: Tower route wiring changes only. The route continues to read governed serving
  views through the existing Tower reader.
- Layers 1-3: no intake, adapter, canonical, schema, or data-plane mutation.

## Client Applicability

- All clients: yes, for tenant-scoped Tower URLs.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/tower/page.tsx`
- `src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx`
- `src/app/(maestro)/tenant/[tenantSlug]/tower/[surface]/page.tsx`
- `src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts`

## QA / Validation

- `npm run test:behaviors -- --runTestsByPath 'src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts'` passed.
- `git diff --check` passed.
- `npm run release:check` required this release record before it could pass.

## Rollout Plan

Merge by PR. The repo-owned Azure Container Apps deploy workflow will publish the change with the
next main deploy.

## Deployment Authority

- Repo-owned deploy workflow: required for live web rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: supplied by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy before claiming live proof.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the affected Tower tenant routes.

## Rollback Plan

Revert the PR or roll back the ACA web revision to the prior digest-pinned image.

## Audit Evidence

- PR URL and CI checks.
- Signed-in browser proof for the affected Tower routes after deploy.

## Known Gaps

This change fixes tenant route scoping only. It does not add new serving data for tenants that have
not been loaded into the governed ECL substrate.
