# ADR-004: Monthly Cost Ceiling Strategy — $200/Month Lab Budget

Slice ID: AZLAB6 (partial)
Document: ADR-004-cost-ceiling-strategy.md
Status: accepted
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture Decision Record — docs only, no runtime code, no migrations, no model calls.

---

## Status

Accepted — 2026-04-26

## Context

The AbarVa lab requires predictable, bounded Azure spend. The founder has approved a $200/month ceiling for the lab subscription. Exceeding this limit could affect cash flow and would indicate scope creep in lab SKUs.

## Decision

Enforce a hard $200/month ceiling on the AbarVa lab subscription via Azure Cost Management budget alerts with two-tier notification:

- **$150/month (75% threshold)**: Warning alert to lab operator email + PagerDuty-equivalent webhook
- **$200/month (100% threshold)**: Hard ceiling alert — triggers auto-scale-down action group

## Rationale

A two-tier alert gives the lab operator 25% of budget headroom to react before the ceiling is hit. The action group at $200 provides automated mitigation without requiring human response.

## SKU Selection for Cost Control

| Resource | Lab SKU | Est. Monthly Cost |
|---|---|---|
| Azure Container Apps (Boundary API) | Consumption plan | ~$5 |
| Postgres Flexible Server (Control Plane) | Burstable B2ms | ~$30 |
| Postgres Flexible Server (Private Data Plane) | Burstable B2ms | ~$30 |
| Azure Blob Storage (both planes) | LRS Hot, ~50 GB | ~$2 |
| Azure AI Search | Standard S1 | ~$75 |
| Azure OpenAI (GPT-4o, ~100K tokens/day) | Pay-per-use | ~$20 |
| Anthropic API (~50K tokens/day) | Pay-per-use | ~$10 |
| Key Vault (Standard, 2 vaults) | ~1K operations/month | ~$1 |
| Application Insights + Log Analytics | ~1 GB/day | ~$5 |
| Networking (egress, DNS) | Estimated | ~$5 |
| **TOTAL ESTIMATE** | | **~$183/month** |

This leaves ~$17 buffer below the $200 ceiling.

## Consequences

- Budget alert resource: `budget-abarva-lab` in the subscription (not a resource group)
- Warning threshold: $150/month — email to lab operator
- Hard threshold: $200/month — action group `ag-abarva-lab-scale-down`
- Action group response: scale down Container Apps to 0 instances; post Slack/webhook notification
- Cost Management tags on all resources: `env=lab`, `project=abarva-azlab1`, `costCentre=rd-lab`
- Monthly cost reviewed by lab operator; any resource exceeding 50% of single-service estimate triggers SKU review
- AI model spend tracked separately via Application Insights custom metric `model_gateway_token_cost`

## Notes

The Bicep scaffold for budget alert is in:
`docs/architecture/azure/bicep-stubs/budget-alert.bicep`

Azure AI Search S1 is the primary cost driver. If the lab budget is under pressure, downgrade to Basic SKU (~$25/month) at the cost of reduced semantic ranking quality.
