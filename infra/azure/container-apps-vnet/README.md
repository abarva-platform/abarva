# CLOUD5 - Azure Container Apps + VNet IaC Starter

STARTER / LAB ONLY. Not production. Do not deploy without review.

This directory holds a reference Bicep template that shapes a
private-VNet Azure Container Apps lab into which the AbarVa shell
could later be deployed for validation. It is a starter, not a
production-grade module, and it does not deploy anything by itself.

## Purpose

- Provide a concrete, syntax-checkable Bicep starter for a private
  VNet container-app lab that complements the documentation-only
  blueprint in
  [docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md](../../../docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md).
- Make the resource shape explicit (VNet, two subnets, Container Apps
  Environment, Container App, Postgres Flexible Server, Storage,
  Key Vault, Log Analytics, three Private DNS zones) so reviewers
  can challenge the topology before any subscription is touched.
- Anchor a future Terraform / `azd` slice without locking the team
  to a specific tool today.

## What this proves

- The lab topology can be expressed as a single `main.bicep` file
  whose `az bicep build` syntax check passes.
- Sensitive values (Postgres administrator password, Key Vault
  contents, container registry credentials) live OUTSIDE the
  template; the template only names them.
- All parameter values are operator-supplied and documented.
- No subscription IDs, tenant IDs, or production secrets are
  embedded in either `main.bicep` or `parameters.example.json`.

## What this does NOT prove

- It does NOT prove the template deploys cleanly. There is no
  `az deployment group create` step here.
- It does NOT prove production-grade scaling, DR, multi-region,
  WAF, Front Door, RBAC, or compliance posture.
- It does NOT prove tenant isolation. Tenant isolation is governed
  by TEN1 / TEN2, not by this starter.
- It does NOT include private endpoints for Postgres, Blob, or
  Key Vault. Those are forward-step comments inside the template.
- It does NOT include a private container registry, an identity
  provider, an ingress (Front Door / Application Gateway), or a
  bastion subnet. Those are deferred.
- It does NOT call any model provider or stand up a model gateway.

## Prerequisites

- Azure CLI 2.59 or newer with the `bicep` extension installed.
  Install or upgrade Bicep:
  - `az bicep install`
  - `az bicep upgrade`
- An Azure subscription you are explicitly authorized to use for
  lab work, and a Resource Group that already exists in that
  subscription. This starter does NOT create the Resource Group.
- A Key Vault that already holds the Postgres administrator
  password under the secret name passed via
  `postgresAdminPasswordSecretName`. The actual password is NEVER
  written into this repo.

## Validation only (no deploy)

This starter is intended to be exercised in two read-only modes.
Neither mode creates or modifies Azure resources.

1. Bicep syntax check (compile only, no Azure call):

   ```sh
   az bicep build --file main.bicep
   ```

2. ARM what-if dry run against an EXISTING Resource Group:

   ```sh
   az deployment group what-if \
     --resource-group <rg> \
     --template-file main.bicep \
     --parameters parameters.example.json
   ```

   `what-if` is a planning operation. It does not create, modify,
   or delete any resource. Review the printed plan, then stop.

## Forward steps - DOCUMENTED, NOT RUN

The following commands are listed for forward reference only. They
are NOT to be executed from this starter:

- `az deployment group create --resource-group <rg> --template-file main.bicep --parameters parameters.example.json`
  is the eventual deploy command and is not safe to run from this
  starter as-is. It would create real Azure resources, which is
  out of scope for CLOUD5.

A future slice (CLOUD6 or later) will add private endpoints,
Front Door, identity, and a real registry image, and will define
deploy / tear-down procedures separately.

## Cross-references

- CLOUD1 - Enterprise private deployment strategy (four-tier model).
- CLOUD2 - Azure VNet reference lab blueprint (architecture document
  this starter aligns with).
- CLOUD4 - Local lab harness (forward reference).

## Files

- `main.bicep` - the reference template. Header marks it as
  STARTER / LAB ONLY.
- `parameters.example.json` - placeholder parameter values. All
  non-`location` values are `<replace-me>`. No real secrets.
- `README.md` - this file.

## Safety notes

- No real subscription IDs, tenant IDs, or secrets are committed.
- No `az deployment group create` is run by this starter.
- The placeholder image is a public Microsoft hello-world image
  (`mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`)
  used purely so the resource shape compiles.
- If you fork this starter, treat any production deploy as out of
  scope until a reviewer has signed off on the missing pieces
  (private endpoints, ingress, identity, registry, observability
  alerts, runbooks).
