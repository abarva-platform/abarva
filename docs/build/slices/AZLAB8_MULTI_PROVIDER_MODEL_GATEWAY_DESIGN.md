# Slice Report: AZLAB8 — Multi-Provider Model Gateway Design

Slice ID: AZLAB8
Title: Multi-Provider Model Gateway Design (Azure OpenAI + Anthropic, Switchable)
Wave: wave-24
Track: 09-saas-azure-private-data-plane
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)
Type: Docs — no app runtime code, no migrations, no Azure deployment.

---

## Summary

Specifies how the AbarVa multi-provider model gateway routes inference requests between Azure OpenAI and Anthropic API at runtime. Includes interface contract, routing policy data model, request lifecycle sequence diagram, cost tracking, failover behaviour, and provider isolation guarantees.

## Files created

| File | Purpose |
|---|---|
| `docs/architecture/azure/AZLAB8-multi-provider-model-gateway-design.md` | Full design document |

## Key design decisions documented

- `ModelGateway` interface: single `route()` method; no direct provider calls in app code
- Default routing: `synthesize` → Anthropic (multi-step reasoning); all others → Azure OpenAI
- Routing policy stored in Postgres, per-tenant per-task-type, with optional `fallbackProvider`
- No automatic cross-provider failover without explicit policy (protects Azure-only data residency)
- `deterministicCaveat` field on every response — cannot be suppressed by caller or provider
- Cost tracked via Application Insights custom event `ModelGatewayInvocation` with KQL query
- No raw data enforcement: context bundle validated before call; size checked; rawContent field blocked

## Acceptance criteria met

- [x] Gateway interface TypeScript contract documented
- [x] Routing policy data model (SQL schema) specified
- [x] Request lifecycle sequence diagram (Mermaid)
- [x] Per-provider cost formulas and cost tracking KQL query
- [x] Failover behaviour specified with no-auto-failover rule for data residency
- [x] `deterministicCaveat` mechanism documented
- [x] Wave 24 lab configuration checklist provided

## Excluded

- Gateway implementation code (lib/model-gateway/) — existing contracts extended, no new runtime code in this wave
- Fine-tuned model support — deferred
- GCP Vertex AI as third provider — deferred
