# Clerk SSO Claim Contract

Status: candidate
Owner: AbarVa operations
Applies to: first-client pilot and every future client organization

## Purpose

Corporate SSO must resolve to exactly one active client boundary before a user
can load data, review deliverables, or approve consequential actions. Clerk is
the control-plane identity broker; Azure/Postgres remains the data-plane source
of truth for tenant data.

This contract defines the claims and metadata AbarVa expects after Clerk
Organizations plus SAML/OIDC federation are configured for a client.

## Clerk Organization Posture

Each client receives one Clerk Organization for the pilot environment. The
organization must be bound to one client key only.

| Field | Required value |
| --- | --- |
| Clerk organization | One organization per client pilot. |
| Allowed domains | Client-approved corporate email domains only. |
| Federation protocol | SAML 2.0 or OIDC, matching the client's IdP standard. |
| MFA | Enforced by the client IdP before Clerk session issuance. |
| Session audience | AbarVa app only; no shared test account for final evidence. |
| Client boundary | One client key; no cross-client organization membership for client users. |

## Required Clerk Metadata

AbarVa runtime code reads these Clerk metadata fields today:

| Metadata field | Shape | Runtime consumer |
| --- | --- | --- |
| `publicMetadata.clientId` | Client key such as `meridian` or `apex-retail`. | `src/lib/auth/current-user.ts` tenant fallback and client scoping. |
| `publicMetadata.role` | Platform role such as `admin` or `maestro`; client users should not receive platform-admin values. | Platform-admin gates and legacy fallback role resolution. |
| `publicMetadata.tenantRoles` | Object keyed by client key; values are `tenant_admin`, `sponsor`, `sme`, or `viewer`. | `src/lib/auth/tenant-roles.ts` tenant-admin and least-privilege checks. |
| `publicMetadata.person_id` | Optional linked `persons.id` when the data-plane person row exists. | `src/lib/auth/current-user.ts` and `src/lib/auth/maestro.ts`. |

The minimum pilot-ready client user has:

```json
{
  "clientId": "example-client",
  "tenantRoles": {
    "example-client": "viewer"
  }
}
```

Tenant administrators use `tenant_admin` for their own client key only:

```json
{
  "clientId": "example-client",
  "tenantRoles": {
    "example-client": "tenant_admin"
  }
}
```

## IdP Claim Mapping

| IdP source | Clerk/AbarVa target | Requirement |
| --- | --- | --- |
| Email | User primary email | Must be corporate domain and unique. |
| Display name | User name | Used for audit readability, not authorization. |
| IdP group or app role | `publicMetadata.tenantRoles[clientKey]` | Map to one of the approved tenant roles. Unknown groups default to no access. |
| Client app assignment | `publicMetadata.clientId` | Must match exactly one approved client key. |
| Optional employee id | `publicMetadata.person_id` after data-plane roster match | Do not fabricate if no `persons` row exists. |

## Group-To-Role Baseline

| Client IdP group intent | AbarVa tenant role | Capabilities |
| --- | --- | --- |
| Client identity or workspace admin | `tenant_admin` | Manage users, request SSO changes, approve load policy, export audit history for that client. |
| Executive sponsor | `sponsor` | View Home, Tower, Moves, Source briefs, and approval evidence assigned to that client. |
| Subject-matter expert or data steward | `sme` | Upload/review assigned templates, clarify schema issues, inspect quarantine outcomes for that client. |
| Standard user or observer | `viewer` | Read assigned workflow surfaces only. |

No client IdP group maps to AbarVa platform admin. Platform admin remains an
AbarVa-only role controlled outside client SSO.

## Go / No-Go Checks

| Gate | Go | No-go |
| --- | --- | --- |
| Organization | One Clerk Organization exists for the client. | Client users share an AbarVa platform organization or a multi-client org. |
| Domain | Only approved domains are allowed. | Personal email domains or another client domain can authenticate. |
| Role mapping | Every test user resolves to one approved tenant role. | Unknown group grants access or over-privileged role. |
| Client boundary | `clientId` and `tenantRoles` use one matching client key. | A client user has roles for more than one client key. |
| Admin access | Tenant admin can access only client admin workflows. | Tenant admin can access AbarVa platform-admin routes or another client. |
| Evidence | Screenshots/logs show positive and denied paths. | SSO is marked ready without evidence packet. |

## Evidence Required Before Marking T034 Done

- Clerk Organization id and domain verification screenshot.
- SAML/OIDC provider configuration summary from Clerk and the client IdP.
- Test roster with at least client admin, data steward, executive sponsor, and viewer.
- Metadata export or screenshot showing `clientId` and `tenantRoles` for every test user.
- Route smoke showing allowed and denied access.
- Tenant-isolation probe output for the same deployment.
- Operator sign-off plus client identity-owner sign-off.

Until that evidence exists, T034 must remain `In progress`, even when the
repository contract and verifier are merged.
