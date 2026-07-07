# Client Tenant IaC Runbook

This runbook describes the reproducible Azure client-tenant scaffold for one
client and one client only. It is designed for preview and pilot rehearsal
lanes before any production customer deployment.

## What The Scaffold Creates

The wrapper `infra/azure/client-tenant-foundation.bicep` composes existing Azure
modules into a single client tenant lane:

- client-scoped control-plane resource group
- client-scoped private data-plane resource group
- shared-security resource group with Key Vault
- observability resource group with Log Analytics, Application Insights, action
  group, and deployment-failure alerting
- private Blob Storage with public access disabled
- private VNet, app subnet, data subnet, and private endpoint subnet
- private Azure Database for PostgreSQL lane with private DNS and VNet peering
- Service Bus queues for context ingestion and agent work
- Azure AI Search service for client-context retrieval
- optional Container Apps web runtime using Key Vault-backed secrets

Every deployment is tagged with `clientKey` and
`clientIsolation=single-client`.

## Files

- `infra/azure/client-tenant-foundation.bicep`
- `infra/azure/parameters/client-tenant.preview.example.bicepparam`
- `scripts/azure/verify-client-tenant-iac.mjs`
- `docs/build/CLIENT_TENANT_IAC_MANIFEST_2026-06-03.md`

## Local Verification

```bash
npm run azure:client-tenant-iac:verify
```

If Azure CLI is installed, also compile the Bicep wrapper:

```bash
az bicep build --file infra/azure/client-tenant-foundation.bicep
```

## Preview What-If

Create a client-specific copy of the example parameters. Do not commit secrets
or customer values:

```bash
cp infra/azure/parameters/client-tenant.preview.example.bicepparam \
  /tmp/client-tenant.preview.bicepparam
```

Set the secure Postgres password at deploy time:

```bash
export POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD="<secure generated password>"
```

Run what-if first:

```bash
az deployment sub what-if \
  --name client-tenant-preview-whatif \
  --location eastus \
  --template-file infra/azure/client-tenant-foundation.bicep \
  --parameters /tmp/client-tenant.preview.bicepparam
```

## Deployment

Only deploy after the what-if is reviewed and the customer data policy is
approved:

```bash
az deployment sub create \
  --name client-tenant-preview \
  --location eastus \
  --template-file infra/azure/client-tenant-foundation.bicep \
  --parameters /tmp/client-tenant.preview.bicepparam
```

## Guardrails

- Do not reuse a private data-plane resource group across clients.
- Do not use cross-tenant loading.
- Do not commit customer parameter files.
- Do not commit secrets or generated connection strings.
- Keep production `environmentName='prod'` behind customer approval and release
  sign-off.
- Use `what-if` evidence before every deploy.
- Run `npm run azure:resource:parity` and the relevant connectivity smokes
  after deployment.

## Known Boundaries

This scaffold does not provision Clerk SAML/OIDC, customer DNS, production
firewall approvals, or live data loads. Those remain separate workstreams with
human approvals and customer-specific configuration.
