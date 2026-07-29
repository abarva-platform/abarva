# 2026-07-29-foundation-consumption-tenant-reader — Governed tenant consumption reader

## Release ID

`2026-07-29-foundation-consumption-tenant-reader`

## Status

`candidate`

## Plain-English Summary

Foundation-preview tenants now use a tenant-scoped Knowledge consumption database reader instead
of silently reading the shared web database. If the tenant data-plane connection is not configured,
the product fails clearly rather than making an active baseline appear empty.

Follow-up production proof showed the tenant database, private DNS, managed identity token, and
active baseline were all reachable, but row-level security hid the consumption rows unless the
database session carried `app.tenant_key`. The tenant-scoped reader now binds and resets that
session setting around every query so governed projections are visible only for the requested
tenant.

Signed-in canary follow-up isolated a second, application-side issue: the direct
`/api/knowledge/consumption/enterprise-brief` call returned `200` with the active Airline baseline,
but the preview UI still displayed the generic unavailable message without issuing its own browser
network request. The HTTP consumption provider now late-binds `globalThis.fetch` at call time so a
provider instance created during a Next server-render pass cannot freeze Node's server fetch into
the hydrated browser runtime.

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
- `src/lib/knowledge/consumption-client/http-consumption-provider.ts`
- `src/lib/knowledge/consumption-client/__tests__/vnext-consumption.test.ts`
- `scripts/auth/prime-foundation-preview-session.ts`

## QA / Validation

- Pass: `npx jest src/lib/knowledge/consumption-server/__tests__/db.test.ts src/lib/knowledge/consumption-server/__tests__/reader.test.ts --runInBand`
- Pass: `npx jest src/lib/knowledge/consumption-client/__tests__/vnext-consumption.test.ts --runInBand`
- Pass: `npx tsc --noEmit`
- Pending: signed-in Airline proof after the RLS binding deploy.

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
- ACA deployment proof: PR #5745 deployed to revision `ca-abarva-web-lab-eastus--m62c6bc41`
  on digest `acrabarvalab001.azurecr.io/abarva/web@sha256:f4126f328f2abcbd11b6efdf42995faf17823eda2912c97ff6b52085fb9fe36c`.
- Read-only failure capture: signed-in direct API probe returned `200`, `knowledgeBaselineRef`
  `airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1`, `availabilityState=available`,
  while UI rendered the generic provider-unavailable message without its own consumption network
  request.
- Signed-in proof: still required.

## Known Gaps

Production proof still requires a post-deploy signed-in Airline run proving the HTTP provider reads
the active baseline through the tenant-scoped RLS context.
