# ADR-002: AI Provider Strategy — Multi-Provider Model Gateway

Slice ID: AZLAB6 (partial)
Document: ADR-002-ai-provider-strategy.md
Status: accepted
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture Decision Record — docs only, no runtime code, no migrations, no model calls.

---

## Status

Accepted — 2026-04-26

## Context

AbarVa's Model Gateway needs to route inference requests to one or more AI providers. The candidate options were:

1. **Azure OpenAI only** — data stays in Azure, lowest egress risk for enterprise
2. **Anthropic API only** — highest model quality for reasoning-heavy tasks
3. **Both — multi-provider gateway with switchable routing** — best capability coverage; routing policy per tenant/task type

The primary concern for enterprise customers is data residency: raw client data must never leave their private data plane. The model gateway sits in the SaaS Control Plane and only receives structured context bundles (not raw data), so provider choice is a capability and cost optimisation decision, not a data residency violation.

## Decision

Use **both providers** via a multi-provider model gateway with runtime-switchable routing:

- **Azure OpenAI** for: compose, critique, narrate, summarize (default for enterprise tenants)
- **Anthropic API (Claude)** for: complex reasoning, pattern synthesis, multi-step agent tasks (default for SaaS tenants)
- Routing policy is per-tenant and per-task-type, stored in the Control Plane Postgres routing policy table
- Providers are never called directly by application code — all calls go through the gateway interface

## Rationale

| Factor | Azure OpenAI only | Anthropic only | Both (chosen) |
|---|---|---|---|
| Model quality for reasoning | Good | Best | Best (routed) |
| Data residency (enterprise) | Azure boundary | External call | Configurable — AZ for enterprise |
| Cost control | Azure spend only | Anthropic spend only | Combined ceiling; per-provider cap |
| Provider lock-in | High | High | Low — swap provider without code change |
| Failover | Azure availability | Anthropic availability | Cross-provider failover possible |
| Compliance coverage | Azure compliance certs | Anthropic BAA available | Both available per tenant tier |

## Consequences

- The Model Gateway abstraction layer (`lib/model-gateway/`) defines a `ModelProvider` interface that both providers implement.
- No application code calls Azure OpenAI SDK or Anthropic SDK directly — all calls go through `ModelGateway.route()`.
- Provider credentials are stored per-provider in Key Vault: `abarva-azure-openai-key`, `abarva-anthropic-api-key`.
- Routing policy table in Postgres: `model_gateway_routing_policies` (tenantKey, taskType, provider, modelId, tokenBudget, costCentreTag).
- The gateway logs every invocation: provider used, latency, token count, cost estimate — to Application Insights.
- The gateway enforces the no-raw-data rule: strips any field matching raw content patterns before forwarding to provider.

## Deferred

- Local inference inside the Private Data Plane (e.g. Azure OpenAI deployed in customer subscription) — deferred to AZLAB3.
- Fine-tuned model support — deferred until customer data is available.
- GCP Vertex AI as third provider — deferred.

## Notes

The multi-provider routing design is specified in detail in:
`docs/architecture/azure/AZLAB7-multi-provider-model-gateway-design.md`
