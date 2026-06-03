# FakeClient Entra SSO Rehearsal Runbook

This runbook covers T138 and T140: a production-like corporate SSO rehearsal
using a Microsoft Entra ID dev tenant, Clerk Organizations, SAML or OIDC, SCIM
provisioning, and AbarVa route-smoke evidence.

## Objective

Prove the pilot identity path before a real client connects:

1. FakeClient user authenticates through Entra.
2. Clerk receives the federated identity through SAML 2.0 or OIDC.
3. Clerk Organization and metadata pin the user to exactly one client:
   `fakeclient`.
4. AbarVa maps the user into tenant-scoped roles without granting platform admin.
5. Allowed and denied route smokes prove the role contract.
6. Tenant-isolation probes prove no cross-client access.

## Rehearsal Manifest

The source manifest is:

`config/sso/fakeclient-entra-clerk-rehearsal.json`

It defines:

- one FakeClient client key,
- Clerk Organization expectations,
- SAML/OIDC plus SCIM requirements,
- four Entra groups,
- at least 10 synthetic users,
- required route-smoke evidence,
- rollback evidence.

Do not use real client employee names or real client data in the rehearsal.

## Entra Setup

Create a Microsoft Entra ID dev tenant and add:

- `AbarVa FakeClient Admins`
- `AbarVa FakeClient Sponsors`
- `AbarVa FakeClient SMEs`
- `AbarVa FakeClient Viewers`

Create at least 10 synthetic users on the `fakeclient.example` domain using the
manifest naming pattern. Assign users to exactly one FakeClient role group unless
testing a denied multi-role scenario.

## Clerk Setup

Create one Clerk Organization for FakeClient.

Required setup:

- verified domain or test domain for the rehearsal,
- SAML metadata URL or OIDC issuer/client configuration,
- SCIM provisioning enabled,
- group-to-role mapping into `publicMetadata.tenantRoles.fakeclient`,
- `publicMetadata.clientId = fakeclient`,
- no IdP group maps to AbarVa platform admin.

## Route Smoke

For each role, capture:

- sign-in proof through Entra,
- Clerk user id and Organization id,
- resulting `clientId` and `tenantRoles`,
- allowed-route results,
- denied-route results,
- tenant-isolation probe output.

Minimum routes:

- Tenant admin: `/admin`, `/admin/users-access`, `/admin/ops`
- Sponsor: `/home`, `/tower`, `/source`
- SME: `/home`, `/intelligence`, `/source`
- Viewer: `/home`, `/tower`

## Rollback

The rehearsal must capture a rollback transcript:

1. Disable the Clerk enterprise connection.
2. Disable SCIM provisioning.
3. Remove or suspend synthetic users.
4. Confirm no FakeClient synthetic user can sign in through Entra.
5. Preserve the evidence bundle in the release record or audit pack.

## Verification

Run:

```bash
npm run auth:fakeclient-sso:verify
```

Expected result: JSON report with `status: "pass"`.

## Completion Boundary

The repository-side rehearsal kit is complete when the manifest, runbook,
verifier, build manifest, and release record merge.

T138 and T140 remain `In progress` until the live Entra tenant, Clerk
Organization, SAML/OIDC connection, SCIM provisioning, 10-user sign-in, route
smoke, tenant-isolation probe, and rollback transcript are captured.
