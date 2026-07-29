# 2026-07-29-foundation-consumption-tenant-reader — Governed tenant consumption reader

## Release ID

`2026-07-29-foundation-consumption-tenant-reader`

## Status

`candidate`

## Plain-English Summary

Foundation-preview tenants now use a tenant-scoped Knowledge consumption database reader instead
of silently reading the shared web database. If the tenant data-plane connection is not configured,
the product fails clearly rather than making an active baseline appear empty.

## Layer Impact

- Layer 3 Canonical Enterprise Model: no canonical data is changed.
- Layer 4 Products: Knowledge consumption APIs route governed foundation tenants to the tenant data
  plane and preserve the existing shared reader for non-foundation tenants during transition.
- Operations: enables passwordless Azure PostgreSQL reads with a tenant-scoped managed identity.

## Client Applicability

- All clients: no.
- Specific clients: governed foundation-preview tenants.
- Internal only: yes, for the foundation closure proof path.
- Public/demo only: no.
- Feature flag: not a feature flag; the route is keyed by the foundation-preview tenant registry.

## Changes Included

- `src/lib/knowledge/consumption-server/db.ts`
- `src/lib/knowledge/consumption-server/index.ts`
- `src/app/api/knowledge/consumption/_shared.ts`
- `src/lib/knowledge/consumption-server/__tests__/db.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/knowledge/consumption-server/__tests__/db.test.ts src/lib/knowledge/consumption-server/__tests__/reader.test.ts --runInBand`
- Pass: `npx tsc --noEmit`

## Rollout Plan

Merge through GitHub PR, deploy through the repo-owned Azure Container Apps main deploy workflow,
then project tenant-scoped runtime configuration for the foundation tenant. Signed-in proof remains
required before claiming the tenant is live-proven.

## Deployment Authority

- Repo-owned deploy workflow: required for web code rollout.
- Shared runtime mutators: tenant-scoped environment and identity updates only, using the approved
  digest-pinned ACA image.
- Approved image digest: populated after deploy.
- ACA runtime invariant: required after deploy and after runtime env/identity update.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: Azure Container Apps update with digest-pinned image.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR to return the consumption APIs to the previous shared reader. If runtime env/identity
updates were applied, remove the tenant-scoped environment variables and detach the tenant read
identity from the shared web Container App.

## Audit Evidence

- PR URL: populated after PR creation.
- CI run: populated after PR checks.
- ACA deployment proof: populated after deploy.
- Signed-in proof: still required.

## Known Gaps

The code path is ready, but production proof still requires private network/DNS connectivity and a
tenant read identity projected into the web runtime.
