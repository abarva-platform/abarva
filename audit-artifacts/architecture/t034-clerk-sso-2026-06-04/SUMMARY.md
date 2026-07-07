## T034 — Clerk SSO

Status: Blocked

Date: 2026-06-04

What was run

- `npm run auth:clerk-sso:verify`
- `npm run auth:fakeclient-sso:verify`
- Live Clerk API check against `GET /v1/organizations`

Evidence files

- `auth-clerk-sso-verify.txt`
- `auth-fakeclient-sso-verify.txt`
- `clerk-organizations-raw.json`

What passed

- Repository-side SSO contract verifier passed.
- Fake-client rehearsal verifier passed.

Live result

- Clerk API returned `organization_not_enabled_in_instance`.
- Exact blocker: the current Clerk instance does not have Organizations enabled, so live Organization-backed SSO cannot be configured or proven from this instance today.

Why this is not Done

- Required live evidence is still missing: Clerk Organization, SAML/OIDC config, domain verification, test roster sign-in, tenant isolation proof, and sign-out proof.

Concrete remediation

- Enable Clerk Organizations on the current instance, or move this lane to a Clerk instance/plan with Organizations enabled.
- Then create the tenant Organization, configure fake/development SSO, and capture live sign-in / isolation / sign-out proof.
