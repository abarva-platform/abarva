# FakeClient SSO Rehearsal Manifest

Date: 2026-06-03
Status: candidate
Backlog: T138, T140
Release lane: internal-admin

## What Changed

This package adds a concrete rehearsal kit for corporate SSO/AD testing before
the first client pilot.

Included artifacts:

- `config/sso/fakeclient-entra-clerk-rehearsal.json`
- `docs/runbooks/fakeclient-entra-sso-rehearsal.md`
- `scripts/auth/verify-fakeclient-sso-rehearsal.mjs`
- release record for the rehearsal kit

## Rehearsal Shape

- Microsoft Entra ID dev tenant
- Clerk Organization for `fakeclient`
- SAML 2.0 or OIDC federation
- SCIM provisioning
- Four role groups: tenant admin, sponsor, SME, viewer
- 10 synthetic users minimum
- Single-client claim mapping through `publicMetadata.clientId`
- Tenant-scoped roles through `publicMetadata.tenantRoles.fakeclient`
- No IdP group maps to AbarVa platform admin

## Evidence Required Before Done

- Entra tenant id
- Clerk Organization id
- verified domain or test domain
- SAML metadata URL or OIDC issuer URL
- SCIM provisioning proof
- 10 synthetic users sign in through Entra
- allowed route-smoke proof
- denied route-smoke proof
- tenant isolation probe output
- rollback transcript

## Verification

Run:

```bash
npm run auth:fakeclient-sso:verify
```

Expected result: JSON report with `status: "pass"`.

## Boundary

No live Entra or Clerk changes are performed by this repository artifact.

T138 and T140 remain `In progress` until the live dev tenant, Clerk
Organization, SAML/OIDC connection, SCIM provisioning, route smokes,
tenant-isolation probes, and rollback transcript are captured.
