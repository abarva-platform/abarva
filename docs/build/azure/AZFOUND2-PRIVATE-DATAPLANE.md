# AZFOUND2 - Private Dataplane Runbook

Resource Group: `rg-abarva-private-dataplane-lab-eastus`
Subscription: `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)
Region: `eastus`

## Resource Inventory
- Tenant-isolated network boundary:
  - VNet + subnets for data-tier and private endpoints
  - NSG for subnet policy enforcement
- Data-tier baseline resources:
  - Storage account (private network access only)
  - Optional Postgres/Cosmos endpoints, introduced per workload need
- Private endpoints for approved dependencies:
  - Key Vault
  - Storage
  - Postgres (when provisioned)

## Network Architecture (VNet Name, Subnet CIDRs, NSG Rules)
Default lab topology in IaC starter:
- VNet: `vnet-abarva-private-dataplane-lab-eastus`
- Subnets:
  - `snet-data` -> `10.42.1.0/24`
  - `snet-private-endpoints` -> `10.42.2.0/24`
- NSG baseline:
  - Deny inbound from `Internet` by default
  - Allow east-west traffic only from approved private ranges
  - Permit only required service tags/ports for platform operations

## Private Endpoints to Key Vault, Storage, Postgres
- Private endpoint resources are declared in module form and can be enabled per dependency.
- Key Vault private endpoint targets `kv-abarva-lab-001` in shared security RG.
- Storage private endpoint targets local data-plane storage account.
- Postgres private endpoint requires explicit target resource ID input and is skipped until database is provisioned.

## Encryption-at-Rest Configuration (CMK from Key Vault)
- Storage account is configured with infrastructure encryption and TLS minimum `1.2`.
- CMK wiring is parameterized through Key Vault key ID input.
- If CMK input is omitted, platform-managed encryption remains active for lab bootstrap.

## Identity Model (Which Managed Identity from Control Plane Has Read/Write)
- Write/read access to private dataplane resources is granted only to approved managed identities from control plane.
- JWT-bounded access is enforced at application/API layers; infrastructure only provides private network and RBAC guardrails.
- Human interactive access should be minimal and audited.

## Tagging Strategy
Required tags:
- `environment=lab`
- `costCenter=<team-or-budget-code>`
- `dataClassification=synthetic`
- `owner=<primary-owner-alias>`
- `project=abarva`

## Backup and DR Posture (Synthetic Data, Low Priority)
- Lab data is synthetic and non-production.
- Backup posture is functional rather than compliance-driven.
- Geo-redundancy and cross-region restore are deferred until production architecture decisions are approved.

## Bicep Template Path
- `infra/azure/private-dataplane.bicep`

## Pre-Deployment Checklist
- [ ] Confirm no client/Accenture/production data will enter this RG.
- [ ] Validate subnet CIDRs do not overlap existing VNets.
- [ ] Validate Key Vault target resource ID for private endpoint.
- [ ] Confirm control-plane managed identity object IDs are available for RBAC assignments.

## Post-Deployment Validation (Smoke Tests)
- [ ] VNet/subnets provisioned with expected address ranges.
- [ ] NSG rules deny internet-origin inbound access.
- [ ] Storage account public network access is disabled.
- [ ] Private endpoint connections show `Approved` state.

## Rollback Procedure
1. Stop control-plane writes to data-tier services.
2. Remove failed private endpoint resources first if DNS/network dependencies break.
3. Roll back to prior known-good `private-dataplane.bicep` deployment.
4. Re-validate route tables/NSG behavior before re-enabling traffic.
