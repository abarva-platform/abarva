# Client Private-Plane Security Controls

Status: non-mutating scaffold

These controls apply to Client Preprod and Client Prod private data planes.

## Required Security Controls

- least-privilege RBAC
- breakglass accounts documented
- managed identity for runtime and jobs
- Key Vault for all secrets
- purge protection where available
- diagnostic settings on supported resources
- activity log review
- policy assignments for public access denial and required tags
- private endpoints for private data services
- budget and cost alerts
- immutable or retained audit evidence
- context-bundle trace proof for agent use

## Approval Gates

Pause before broad RBAC, budget creation or increase, public network exceptions, client-prod data action, search index refresh in client prod, agent-ready promotion, or any PHI/PII exception.

## Evidence

Each control must produce an exportable evidence artifact: policy assignment export, RBAC export, diagnostic setting export, budget export, Key Vault access proof, private endpoint proof, and retrieval/citation/context-bundle proof where data is involved.
