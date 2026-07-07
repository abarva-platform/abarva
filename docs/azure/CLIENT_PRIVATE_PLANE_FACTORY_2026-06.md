# Client Private Plane Factory

## Purpose

This packet makes ENV-14 executable without improvising. It defines the repeatable factory for creating two isolated private-plane subscriptions per pilot or production client: client preprod and client prod.

It is intentionally non-mutating. Do not create subscriptions, move management groups, assign RBAC, create budgets, create private endpoints, deploy data services, run ingestion, load client data, or execute client-prod data actions from this packet without explicit approval.

Machine-readable companion: `docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json`.

Verifier: `npm run azure:client-private-plane-factory:verify`.

## Model

Every client private plane has two subscriptions:

- `client-preprod`: client validation, ingestion rehearsal, retrieval proof, and acceptance testing
- `client-prod`: client private production data plane and production retrieval/runtime evidence

Subscription name templates:

- `sub-abarva-<client-code>-client-preprod-eus-001`
- `sub-abarva-<client-code>-client-prod-eus-001`

The isolation rule is simple: one client per subscription, and two subscriptions per client.

## Product / Client Boundary

AbarVa product subscriptions do not store client private production data. Product Dev, Product Preview, and Product Prod are for the shared product/control plane.

Client private data belongs in that client's private preprod/prod subscriptions.

PHI is not accepted. PII is not accepted unless a future contract explicitly changes the policy and the governance framework is updated first.

## Approval Boundary

Explicit approval is required before:

- approving the client code
- creating the client preprod subscription
- creating the client prod subscription
- moving subscriptions into management groups
- creating budgets
- assigning RBAC
- assigning policies
- creating private networks
- creating data services
- creating operator jobs
- running ingestion rehearsal
- accepting retrieval and context-bundle proof
- executing any client prod data action

## Baseline Resource Families

Each private plane must include, when approved:

- resource group
- VNet
- private endpoint subnets
- Postgres Flexible Server
- Blob Storage
- Key Vault
- Azure AI Search
- Container Apps jobs
- immutable audit log
- Defender for Storage malware scanning
- Log Analytics
- Application Insights or managed Prometheus
- private DNS zones

## Required Evidence

Factory output is not complete until the execution ledger has:

- explicit approval record
- client code
- client legal name
- preprod subscription id
- prod subscription id
- management group paths
- role assignment exports
- policy assignment exports
- budget ids
- tag exports
- private endpoint exports
- diagnostic settings exports
- Bicep or Terraform plan
- what-if output
- deployment output if approved
- ingestion receipt
- context health check report
- retrieval/citation proof
- context-bundle trace proof
- artifact/file-cabinet proof
- rollback or abandon plan

## Hard Stops

Stop if any of these are true:

- client code is missing
- explicit approval is missing
- a product subscription is being used for client private data
- a client prod mutation lacks approval
- Postgres is public
- Blob public access is enabled
- Key Vault is public
- budget is missing
- RBAC export is missing
- context-bundle proof is missing
- PHI/PII policy exception is not explicitly approved

## Command Templates

These are templates only. Do not run without approval.

```bash
npm run azure:client-tenant-iac:verify
```

```bash
az deployment sub what-if \
  --location eastus \
  --template-file infra/azure/client-tenant-foundation.bicep \
  --parameters infra/azure/parameters/client-tenant.preview.example.bicepparam
```

## Completion Rule

ENV-14 is scaffold-ready when this factory packet and its verifier are merged. It is complete only after an approved sample client preprod/prod factory run has evidence, including private network proof, context health, retrieval/citation proof, and rollback posture.
