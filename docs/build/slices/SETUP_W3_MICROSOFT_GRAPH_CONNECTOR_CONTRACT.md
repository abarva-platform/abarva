# Setup W3 Microsoft Graph connector contract

Status: contract-and-stub only

## Scope

Setup W3 introduces Microsoft Graph as a first-class connector record without
turning on live Graph behavior.

This slice may define deterministic fixture records, masked configuration
requirements, required OAuth scopes, and blocked configure/test messaging.

This slice must not add Microsoft Graph SDK calls, OAuth token exchange,
database migrations, environment-variable mutations, or claims that Graph is
live.

## Connector identity

- Integration class: `T-MS-GRAPH`
- Admin connector id: `conn-apex-ms-graph`
- Connector label: `Microsoft Graph`
- Setup connector id: `msgraph`
- Runtime status: blocked / not configured
- Data mode: deterministic seed only

## Required configuration contract

All configuration values are required before live OAuth can be attempted, but
this W3 slice stores no live values.

- `tenantId`: masked tenant identifier, displayed as `tenant-****`
- `clientId`: masked application client id, displayed as `app-****`
- `clientSecret`: secret reference only, displayed as bullets
- `redirectUri`: canonical OAuth redirect URL placeholder
- `adminConsent`: admin-consent checkpoint, currently not granted
- `requiredScopes`: masked required Microsoft Graph scopes

Required delegated/application scope set for W4 planning:

- `User.Read.All`
- `Group.Read.All`
- `Directory.Read.All`
- `Calendars.Read`
- `Mail.ReadBasic.All`
- `Reports.Read.All`

The scope list is a contract placeholder. It does not mean consent has been
granted or that a Graph token exists.

## Honest health behavior

The connector health read model must expose a deterministic `T-MS-GRAPH` row
with `not_configured` status.

Expected health facts:

- No authenticated timestamp
- No successful pull timestamp
- No latency value
- No active scopes
- PII filtering not active because no data is pulled
- Connectivity, auth, last sync, and rate-limit checks are not run

## Configure/test blocking reason

Configure and test affordances remain blocked because W3 does not own live
OAuth.

Canonical reason:

> Microsoft Graph configure/test is blocked until Setup W4 implements the live
> OAuth consent boundary, token storage, tenant admin approval, and steward
> validation runbook.

## W4 live OAuth boundary

Setup W4 may implement live Microsoft Graph only if it explicitly owns:

- OAuth app registration and tenant admin consent
- Redirect URI and callback handling
- Secure token storage and rotation
- Least-privilege scope review
- Tenant allowlist and steward approval flow
- Live connectivity test runbook
- Audit event emission for consent, test, success, and failure states

Until W4 lands, all Microsoft Graph state in Setup/Admin is deterministic,
blocked, and not configured.
