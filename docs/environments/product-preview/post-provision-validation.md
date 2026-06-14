# Product Preview Post-Provision Validation

Status: scaffold-ready, not executed

Run this only after Product Preview is created with explicit approval. This document records what evidence must exist before Product Preview can host a release candidate.

## Required Evidence

- Subscription id exported into the execution ledger.
- Management group path exported.
- Budget id and alert recipients exported.
- RBAC assignment export reviewed.
- Azure Policy assignment export reviewed.
- Required tags exported for resource groups and resources.
- Diagnostic settings export captured.
- Key Vault RBAC model confirmed.
- Private data services confirmed where deployed.
- Container Apps environment export captured where deployed.
- Health endpoint returns 200 for any deployed app.
- No `server: Vercel` or `x-vercel-id` headers for Product Preview runtime.
- Context healthcheck report attached when data-backed validation runs.
- Signed-in browser QA report attached before Product Prod promotion.

## Pass / Fail

Product Preview fails validation if PHI/PII appears, client private raw documents are stored in product/control-plane storage, budgets are missing, broad RBAC exists without approval, policy assignments are missing, or rollback is not recorded.
