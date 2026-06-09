# 2026-06-09-active-client-tenant-admin-access — Active-Client Tenant Admin Access

## Release ID

`2026-06-09-active-client-tenant-admin-access`

## Status

`candidate`

## Plain-English Summary

Fixes Clerk-vs-database access drift for Move creation. If the signed-in Clerk
user is explicitly marked `tenant_admin` for the active client, AbarVa now treats
that session as a client admin for that same client even when an older database
membership row still says viewer/client. This preserves the one-client policy and
does not create a tenant switcher or cross-client admin role.

## Layer Impact

- `global-control-lane`: Updates shared auth/tenancy resolution and program
  access policy used by all clients.
- `client-data-lane`: Keeps authorization pinned to the active `clientId` and
  `clientKey`; no source data or tenant data is mutated.

## Client Applicability

- All clients: Yes, for users with explicit active-client Clerk
  `tenantRoles[clientKey] = tenant_admin`.
- Specific clients: Applies to Anand operator aliases and any buyer/test users
  provisioned as tenant admins.
- Internal only: No, this is runtime access policy.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/lib/auth/current-user.ts` now carries Clerk `tenantRoles`.
- `src/lib/auth/tenancy.ts` passes the active-client `tenantRole` into
  `TenancyCtx`.
- `src/lib/auth/program-access-policy.ts` treats active-client `tenant_admin` as
  `client_admin` before stale DB membership access levels.
- Regression tests for stale DB viewer drift and non-admin tenant roles.

## QA / Validation

- `npx jest src/lib/auth/__tests__/program-access-policy.test.ts src/app/api/v1/programs/__tests__/_auth.test.ts --runInBand` — pass.
- `npx eslint src/lib/auth/current-user.ts src/lib/auth/tenancy.ts src/lib/auth/program-access-policy.ts src/lib/auth/__tests__/program-access-policy.test.ts src/app/api/v1/programs/__tests__/_auth.test.ts src/lib/programs/types.db.ts` — pass.
- `npx tsc --noEmit --pretty false --incremental false` — pending local result / CI gate.

## Rollout Plan

Merge to `main`, build the next Azure Container Apps image, and deploy through
the normal ACA release path. No migration is required. Clerk metadata remains
the provisioning control: each user must still be one-client pinned.

## Rollback Plan

Revert the PR. No database rollback is needed.

## Audit Evidence

- PR and CI checks.
- Auth regression tests proving active-client `tenant_admin` can create Moves
  despite stale DB viewer membership, while non-admin tenant roles do not get
  create permission.

## Known Gaps

- This does not provision or repair live Clerk/DB user records; it prevents a
  stale DB membership from denying an otherwise valid active-client tenant admin
  session.
