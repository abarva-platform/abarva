# Azure Modules Scaffold

Status: scaffold-ready

This folder is reserved for reusable Azure Bicep modules used by AbarVa product/control-plane and client private data-plane environments.

## Rules

- No secrets.
- No real tenant ids.
- No real subscription ids.
- No default command that deploys to Azure.
- Prefer existing root modules before creating new ones.
- All modules must accept tags, environment key, region, budget evidence expectations, RBAC placeholders, policy assignment placeholders, diagnostic/logging placeholders, Key Vault references, and private endpoint/private networking placeholders where applicable.

## Existing Standard

Current Bicep lives in `infra/azure/*.bicep`. Environment folders should parameterize those templates rather than fork them.
