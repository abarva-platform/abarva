# Tenant Connection Resolution Runbook

This runbook defines how runtime database access resolves to one client and one client only. It is the T030 bridge between the Azure client-tenant scaffold and the application data-plane adapters.

## Runtime Contract

When the server has an active client scope, the data-plane resolver checks only
that client's projected database secret. It does not fall back to another
client, and it does not silently fall back to a shared database.

Accepted scope signals:

- `ABARVA_ACTIVE_CLIENT_KEY`
- `ABARVA_CLIENT_KEY`
- `ABARVA_ACTIVE_CLIENT_ID`
- `ABARVA_CLIENT_ID`

Accepted secret names for each normalized client token:

- `ABARVA_CLIENT_DATABASE_URL_<CLIENT_TOKEN>`
- `ABARVA_TENANT_DATABASE_URL_<CLIENT_TOKEN>`
- `AZURE_CLIENT_DATABASE_URL_<CLIENT_TOKEN>`

Example:

```bash
export ABARVA_ACTIVE_CLIENT_KEY=meridian-health
export ABARVA_CLIENT_DATABASE_URL_MERIDIAN_HEALTH='postgres://...'
```

With that scope, the runtime returns only
`ABARVA_CLIENT_DATABASE_URL_MERIDIAN_HEALTH`.

## Fail-Closed Behavior

If a client scope is present but no matching client database URL secret is
projected, the resolver returns no candidates. Downstream database sessions then
fail with a missing-connection error instead of querying shared data.

Shared fallback is available only for explicit local preview use:

```bash
export ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK=true
```

Do not enable shared fallback for live private data-plane or pilot client
loads.

## Azure Wiring

The Azure client-tenant Bicep scaffold projects Key Vault-backed secrets into
the runtime container. Operators should map each client database secret to the
canonical env name:

```text
ABARVA_CLIENT_DATABASE_URL_<CLIENT_TOKEN>
```

Use the same token normalization as the app:

- trim spaces
- convert camelCase boundaries to underscores
- replace non-alphanumeric characters with underscores
- uppercase

Examples:

| Client key | Token | Canonical env name |
|---|---|---|
| `meridian-health` | `MERIDIAN_HEALTH` | `ABARVA_CLIENT_DATABASE_URL_MERIDIAN_HEALTH` |
| `First Capital` | `FIRST_CAPITAL` | `ABARVA_CLIENT_DATABASE_URL_FIRST_CAPITAL` |
| `client-123` | `CLIENT_123` | `ABARVA_CLIENT_DATABASE_URL_CLIENT_123` |

## Verification

Run local deterministic checks:

```bash
npm run data-plane:tenant-connection:verify
npx jest src/lib/__tests__/supabase-server.test.ts --runInBand
```

Before promoting a live pilot client, collect:

- Azure deployment evidence showing the client database secret is projected.
- Runtime smoke showing the client scope resolves exactly one candidate.
- DB smoke showing the resolved connection reaches that client's Postgres lane.
- Negative smoke showing a missing or wrong client secret fails closed.

## Known Boundaries

This slice does not deploy Azure resources, create Key Vault secrets, rotate
credentials, or rewrite every data-backed route to pass a request-local client
scope. It establishes the server-side resolver contract and wires the existing
global Postgres candidate functions to honor explicitly provided runtime client
scope.
