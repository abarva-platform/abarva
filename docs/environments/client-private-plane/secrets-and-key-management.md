# Client Secrets And Key Management

Status: scaffold-ready, not executed

Client Preprod and Client Prod secrets must be isolated from AbarVa product/control-plane secrets.

## Key Vault Model

- one environment-scoped Key Vault per client private plane where practical
- managed identity access for runtime and operator jobs
- no secrets committed to repo
- no hardcoded tenant ids, subscription ids, passwords, API keys, or connection strings
- secret access logged and reviewable
- rotation owner and cadence recorded before Client Prod

## Approval Gates

Creating Key Vaults, assigning secret access, granting broad RBAC, or injecting production secrets requires explicit approval and an execution ledger entry.

## Evidence

Capture Key Vault name, access model, managed identity principal, role assignments, rotation owner, and diagnostic setting export. Do not expose secret values in evidence.
