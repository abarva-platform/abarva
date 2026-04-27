# AbarVa Azure Resource Naming Convention

Slice ID: AZLAB6
Document: AZLAB6-resource-naming-convention.md
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture document — docs only, no runtime code, no migrations, no model calls.

---

## Overview

This document defines the naming convention for all Azure resources in the AbarVa lab and production deployments. Consistent naming ensures:
- Easy identification of resource purpose, environment, and region
- Correct cost tagging and billing grouping
- Predictable Bicep/Terraform variable names
- No naming collisions across environments

---

## General pattern

```
<resource-type-prefix>-<project>-<environment>-<region>[-<discriminator>]
```

| Token | Values | Notes |
|---|---|---|
| `resource-type-prefix` | See table below | Azure-recommended abbreviations |
| `project` | `abarva` | Always lowercase |
| `environment` | `lab`, `staging`, `prod` | Never abbreviate to avoid confusion |
| `region` | `eastus2`, `westus2`, `northeu` | Use Azure region slug without hyphens |
| `discriminator` | `ctrl`, `pdp`, `shared` | Only when multiple instances per env |

---

## Resource type prefixes

| Resource Type | Prefix | Max Length | Example |
|---|---|---|---|
| Resource Group | `rg` | 90 | `rg-abarva-lab-control` |
| Virtual Network | `vnet` | 64 | `vnet-abarva-lab-eastus2` |
| Subnet | `snet` | 80 | `snet-abarva-lab-app` |
| Network Security Group | `nsg` | 80 | `nsg-abarva-lab-app` |
| Postgres Flexible Server | (no prefix) | 63 | `abarva-lab-pg-ctrl-eastus2` |
| Storage Account | `st` | 24 (no hyphens) | `stabarvalabeactrl` |
| Key Vault | `kv` | 24 | `kv-abarva-lab-ctrl` |
| Container App Environment | `cae` | 32 | `cae-abarva-lab-eastus2` |
| Container App | `ca` | 32 | `ca-abarva-lab-pdp-eastus2` |
| Azure OpenAI | (no prefix) | 64 | `abarva-lab-aoai-eastus2` |
| Azure AI Search | `srch` | 60 | `srch-abarva-lab-eastus2` |
| Application Insights | `appi` | 260 | `appi-abarva-lab` |
| Log Analytics Workspace | `law` | 63 | `law-abarva-lab` |
| Budget | `budget` | 90 | `budget-abarva-lab` |
| Action Group | `ag` | 260 | `ag-abarva-lab-scale-down` |
| Managed Identity | `id` | 128 | `id-abarva-lab-ctrl` |
| Private DNS Zone | (domain style) | 253 | `privatelink.postgres.database.azure.com` |

---

## Storage account name rules

Storage accounts cannot contain hyphens and have a 24-character limit. Use concatenation:

```
st + abarva + lab|prod + ea (East US 2) | wu (West US 2) + ctrl | pdp | shared
```

Examples:
- `stabarvalabeactrl` — lab, East US 2, Control Plane
- `stabarvalabeapdp` — lab, East US 2, Private Data Plane
- `staborvaprodeastctrl` — production, East US, Control Plane

Verify uniqueness with: `az storage account check-name --name <name>`

---

## Resource group naming

Resource groups follow a slightly different pattern to be human-readable in the portal:

```
rg-abarva-<environment>-<plane>
```

| Resource Group | Environment | Purpose |
|---|---|---|
| `rg-abarva-lab-control` | lab | SaaS Control Plane simulation |
| `rg-abarva-lab-private-dp` | lab | Client Private Data Plane simulation |
| `rg-abarva-lab-observability` | lab | Monitoring, logging, alerting |
| `rg-abarva-prod-control` | prod | SaaS Control Plane (future) |
| `rg-abarva-prod-data` | prod | Shared data tier (future) |
| `rg-abarva-prod-intelligence` | prod | AI Search + OpenAI (future) |
| `rg-abarva-prod-security` | prod | Key Vault, Managed Identity (future) |

---

## Required tags

All resources MUST have these tags at creation:

| Tag Key | Lab Value | Production Value |
|---|---|---|
| `env` | `lab` | `prod` |
| `project` | `abarva-azlab1` | `abarva-prod` |
| `owner` | `abarva-lab` | `abarva-ops` |
| `costCentre` | `rd-lab` | `ops-prod` |
| `plane` | `control` or `private-dp` | same |

Enforce tags via Azure Policy (Bicep stub in `bicep-stubs/policy-tags.bicep`).

---

## Bicep variable mapping

In Bicep templates, resource names are constructed from these parameters:

```bicep
param project string = 'abarva'
param env string = 'lab'
param region string = 'eastus2'
param plane string = 'ctrl' // or 'pdp'
param regionShort string = 'ea' // for storage accounts

var pgName = '${project}-${env}-pg-${plane}-${region}'
var kvName = 'kv-${project}-${env}-${plane}'
var storageName = 'st${project}${env}${regionShort}${plane}'
var caName = 'ca-${project}-${env}-${plane}-${region}'
var searchName = 'srch-${project}-${env}-${region}'
```

---

## Naming validation checklist

Before provisioning:
- [ ] Resource name matches the pattern for its type
- [ ] Storage account name verified unique (24 chars, no hyphens, globally unique)
- [ ] Key Vault name verified unique (globally unique within Azure AD tenant)
- [ ] All required tags present
- [ ] Region token matches actual deployment region
- [ ] Discriminator (`ctrl` vs `pdp`) present when both planes are in same subscription
