# ADR-001: Azure Subscription Strategy

Slice ID: AZLAB6 (partial)
Document: ADR-001-azure-subscription-strategy.md
Status: accepted
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture Decision Record — docs only, no runtime code, no migrations, no model calls.

---

## Status

Accepted — 2026-04-26

## Context

AbarVa requires Azure infrastructure for:
- A multi-model AI gateway (Azure OpenAI + Anthropic API)
- Azure AI Search for embeddings and vector retrieval
- Container Apps for the private data plane boundary service
- Postgres Flexible Server for tenant data
- Key Vault for secrets management
- Cost monitoring to stay within the $200/month lab ceiling

The decision was whether to:
1. Use an existing shared subscription
2. Use the main AbarVa production subscription
3. Create a dedicated lab subscription

## Decision

Create a **dedicated AbarVa lab subscription** separate from any production or personal subscriptions.

Subscription name convention: `abarva-lab-eastus2`

## Rationale

| Factor | Dedicated lab sub | Shared sub |
|---|---|---|
| Cost isolation | Full — cost alerts fire per-subscription | Mixed — hard to isolate lab spend |
| IAM blast radius | Narrow — only lab resources | Wide — could affect other workloads |
| Cleanup | Destroy subscription to remove all resources | Must individually delete each resource |
| Billing visibility | Line-item in Azure Cost Management | Buried in shared spend |
| Audit cleanliness | Lab operator has Contributor on one sub only | Risk of cross-sub permission drift |
| Compliance | No PII — lab-grade, no DPA scope | Potentially scoped if shared |

## Consequences

- Lab operator creates a new Azure subscription under the AbarVa billing account.
- Subscription ID is stored in Key Vault secret `abarva-lab-subscription-id` — never in `.env` files or source code.
- All lab resource groups are tagged `env=lab` and `project=abarva-azlab1`.
- When the lab is decommissioned, the subscription is cancelled and all resources are automatically deleted.
- A $200/month budget alert is configured at the subscription level (see ADR-004).

## Notes

- This decision applies to the Wave 24 lab only. Production deployment (Wave 27+) will use a separate production subscription with tighter IAM, zone-redundant SKUs, and CMK encryption.
- The subscription must be in the Azure region East US 2 (see ADR-005).
