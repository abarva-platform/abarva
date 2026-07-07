# Clerk SSO Readiness Manifest

Date: 2026-06-03
Status: candidate
Backlog: T034
Release lane: internal-admin

## What Changed

This manifest captures the repository-side readiness work for corporate SSO:

- a Clerk SSO claim contract for Organizations, SAML/OIDC, and tenant role mapping,
- an executable verifier that checks the contract, runbook, admin SSO page, and runtime metadata consumers,
- an updated enterprise SSO connectivity runbook that tells operators how to use the verifier,
- a release record for traceability.

## Current Runtime Contract Verified

| Runtime area | Expected contract |
| --- | --- |
| Client pinning | `src/lib/auth/current-user.ts` reads `publicMetadata.clientId` as the signed-in user's client key fallback. |
| Tenant roles | `src/lib/auth/tenant-roles.ts` reads `publicMetadata.tenantRoles[tenantKey]`. |
| Tenant-admin scope | `tenant_admin` is tenant-scoped; platform admin remains AbarVa-only. |
| Admin SSO route | `/admin/users-access/sso-configuration` describes SAML/OIDC setup and single-client role assignment. |

## Verification Command

Run:

```bash
npm run auth:clerk-sso:verify
```

Expected result: JSON report with `status: "pass"`.

## Evidence Still Required For Done

T034 is not Done from this repository work alone. It requires live evidence:

- Clerk Organization exists for the client.
- Client IdP federation is configured in Clerk as SAML or OIDC.
- Domain verification is complete.
- Test users authenticate through the client's IdP.
- `clientId` and `tenantRoles` metadata match the approved single-client role matrix.
- Allowed and denied route smoke passes.
- Tenant-isolation probes pass on the same deployment.

## Known Gaps

- No live Clerk Enterprise/Organization configuration is performed by this PR.
- No client IdP metadata is stored in the repository.
- No production user metadata is changed.
- T034 should remain `In progress` until live SSO evidence is captured.
