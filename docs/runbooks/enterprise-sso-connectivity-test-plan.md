# Enterprise SSO and Azure Connectivity Test Plan

Status: candidate
Owner: AbarVa operations
Audience: founder, client IT, identity admin, security reviewer, data-plane engineer

## Purpose

Before an enterprise pilot uses client-scoped data, AbarVa needs a repeatable
test plan for corporate identity, role mapping, private dependency
connectivity, and tenant isolation. This plan connects the product-level pilot
runbooks with the Azure test layers already documented in
`docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`.

The claim and metadata contract for the SSO side of this plan lives in
`docs/security/clerk-sso-claim-contract.md`. Run
`npm run auth:clerk-sso:verify` before a pilot SSO rehearsal to confirm the
repository still documents and enforces the expected Clerk metadata contract.

This is a test plan, not a claim that every test has already passed for a live
client.

## Scope

| Area | What must be proven | Primary evidence |
| --- | --- | --- |
| SSO federation | The client IdP can authenticate users into the AbarVa app with expected org and role claims. | Clerk/IdP screenshots, test user roster, route smoke. |
| Role mapping | Admin, data steward, executive, and standard user roles resolve correctly. | Role matrix, route access results, denied-action evidence. |
| One-client boundary | Users can access only their client context and cannot enumerate another client. | Tenant-isolation probes and UI route checks. |
| Private dependency reachability | Runtime can reach Postgres, Blob/ADLS, Service Bus, Key Vault, and Search through intended paths. | `azure:connectivity:smoke`, Azure logs, route/API health evidence. |
| Negative public-path proof | Public clients cannot reach private data resources directly. | Firewall/network failure evidence, not only auth failures. |
| Observability | Auth, data-plane, and agent-quality events leave usable traces. | App Insights, Log Analytics, release evidence pack. |

## Test Roster

Create one named test user for each role before the pilot rehearsal:

| Role | Minimum test user | Required checks |
| --- | --- | --- |
| Client admin | Identity/admin owner | Admin routes, setup/data-load workspace, user management, approval policies. |
| Data steward | Data owner | Template explorer, upload/metadata review, quarantine queue, clarification workflow. |
| Executive | CXO/champion | Home, Moves, Source, Tower, agent answers, approval review. |
| Standard user | Business operator | Assigned workflow only; no admin access. |
| AbarVa platform admin | AbarVa operator | Support/admin access without bypassing client data boundaries. |

Do not use shared test accounts for final evidence. Shared accounts hide role
mapping and audit-trail problems.

## SSO Flow

1. Register the client organization and allowed domains in Clerk.
2. Configure the client IdP as SAML or OIDC, depending on the client standard.
3. Map IdP claims to AbarVa user, organization, client, and role claims per
   `docs/security/clerk-sso-claim-contract.md`.
4. Invite the test roster.
5. Verify sign-in for each role.
6. Verify sign-out and session expiry behavior.
7. Capture denied access for routes each role should not reach.

Minimum metadata that must resolve after sign-in:

| Clerk metadata | Required behavior |
| --- | --- |
| `publicMetadata.clientId` | Matches the one approved client key for the organization. |
| `publicMetadata.tenantRoles` | Contains only roles for that same client key. |
| `publicMetadata.role` | Does not grant client users AbarVa platform-admin rights. |
| `publicMetadata.person_id` | Optional; present only when a data-plane `persons` row is known. |

Client SSO is single-client scoped. Do not use one Clerk Organization for
multiple pilot clients, and do not give a client user `tenantRoles` entries for
another client.

## Connectivity Flow

Run the positive and negative paths separately:

| Step | Positive-path test | Negative-path test |
| --- | --- | --- |
| Postgres | Runtime runs a read-only `SELECT 1` and a tenant-scoped metadata read. | Public client cannot connect to private endpoint. |
| Blob / ADLS | Runtime can write/read a tiny synthetic object in the client-scoped container. | Public object access fails at network or firewall boundary. |
| Service Bus | Runtime can enqueue and receive a synthetic processing message. | Public sender without private path cannot send. |
| Key Vault | Managed identity reads an approved test secret. | Local/public caller cannot bypass identity and network posture. |
| Azure AI Search | Runtime can query an approved synthetic index with tenant/client filter. | Admin-key-free public probe is denied. |

Use `npm run azure:connectivity:smoke` where credentials are available, then
attach output to the release or rehearsal evidence packet.

## Isolation Flow

Run isolation checks after SSO and connectivity are both green:

1. Sign in as Client A admin.
2. Attempt Client B route/API access.
3. Attempt Client B Source artifact access.
4. Ask an agent a prompt designed to elicit Client B facts.
5. Confirm response refuses or stays within Client A.
6. Repeat as data steward and standard user.

Passing isolation means no Client B facts, ids, artifacts, citations, source
events, or evidence rows appear to Client A.

## Go / No-Go

| Gate | Go condition | No-go condition |
| --- | --- | --- |
| SSO | All rostered roles authenticate and deny correctly. | Any role over-privileged or blocked from required workflow. |
| Connectivity | Positive paths pass and negative paths fail by network/firewall. | Any private resource reachable publicly or runtime cannot reach required dependency. |
| Isolation | Cross-client probes fail safely. | Any cross-client content, artifact, or citation leaks. |
| Observability | Evidence packet has screenshots/logs/commands for every gate. | Missing audit trail for auth, approval, data-plane, or agent event. |

## Evidence Packet

Every rehearsal produces:

- date, client, environment, commit SHA, and deployment URL,
- IdP configuration summary,
- `npm run auth:clerk-sso:verify` output,
- test roster and role matrix,
- Clerk Organization id and domain-verification evidence,
- `publicMetadata.clientId` / `publicMetadata.tenantRoles` evidence for each
  test user,
- pass/fail table,
- command outputs or screenshots,
- unresolved gaps with owners and due dates,
- sign-off from AbarVa operator and client identity/data owner.
