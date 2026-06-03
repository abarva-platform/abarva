# Immutable Audit Log Runbook

This runbook covers T041: the Azure immutable audit ledger for one client and
one client only. The ledger is a WORM-protected Blob container inside the
client private data-plane storage account.

## What It Provisions

`infra/azure/immutable-audit-log.bicep` creates:

- an `audit-ledger` container with public access disabled
- object-level immutability with versioning enabled at container creation
- a container immutability policy using the configured retention period
- protected append writes so append-only audit streams can continue writing
- Blob change feed aligned to the retention period, with soft delete/container
  delete retention capped at Azure's 365-day maximum
- a lifecycle rule that moves audit blobs and versions to cool tier after 30
  days

The client-tenant wrapper deploys this module into the private data-plane
resource group and exports the audit container name and retention period.

## Retention Policy

Preview and pilot lanes default to 365 days. Production defaults to 730 days.
Customer contracts may require a longer period up to the Azure limit configured
in the module.

Do not shorten or remove an immutability policy after customer approval.
Changes to retention are release-controlled and must include customer policy
approval, Azure what-if evidence, and rollback notes.

## Write Pattern

Applications should write audit events as append blobs or immutable versioned
objects under a client-scoped prefix such as:

```text
audit-ledger/yyyy/mm/dd/<system>/<event-id>.jsonl
```

Every record should include:

- `client_id` or canonical client key
- actor and role
- action type
- object reference
- source request or job id
- timestamp
- decision owner, if the event captures an approval
- evidence packet reference, if one exists

## Export Pattern

Client export requests should be fulfilled from a time-bounded prefix listing.
The export package must include:

- requested time range
- hash manifest
- source container and prefix
- generation timestamp
- export approver
- delivery channel

## Local Verification

```bash
npm run azure:immutable-audit-log:verify
npm run azure:client-tenant-iac:verify
```

If Azure CLI is installed, compile the wrapper:

```bash
az bicep build --file infra/azure/client-tenant-foundation.bicep
```

## Azure What-If

Use a client-specific parameter file. Do not commit customer values or secrets.

```bash
export POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD="<secure generated password>"

az deployment sub what-if \
  --name client-tenant-immutable-audit-log-whatif \
  --location eastus \
  --template-file infra/azure/client-tenant-foundation.bicep \
  --parameters /tmp/client-tenant.preview.bicepparam
```

## Post-Deploy Checks

After deployment, capture evidence for:

- storage account is private and belongs to the correct client resource group
- `audit-ledger` has public access set to `None`
- version-level immutability is enabled
- the immutability policy retention period matches the release record
- protected append writes are enabled
- sample append succeeds
- overwrite/delete attempt is denied during retention
- export by time prefix returns only the selected client scope

## Known Boundaries

This slice provisions the immutable ledger foundation. It does not yet wire
every application audit writer to Blob, create customer-specific legal holds, or
prove a live Azure deployment. Those remain follow-on validation items before
T041 can be marked Done in the tracker.
