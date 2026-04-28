# ADR-005: Azure Region Strategy — East US 2

Slice ID: AZLAB6 (partial)
Document: ADR-005-azure-region-strategy.md
Status: accepted
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture Decision Record — docs only, no runtime code, no migrations, no model calls.

---

## Status

Accepted — 2026-04-26

## Context

AbarVa needs to select a primary Azure region for the lab. The key requirements are:

1. Azure OpenAI availability (not all regions support all models)
2. Azure AI Search availability
3. Container Apps support
4. Postgres Flexible Server with zone-redundant standby (production path)
5. Low latency for US-East early customers
6. Founder is based in the United States

## Decision

Use **East US 2** (`eastus2`) as the primary Azure region for the AbarVa lab and production path.

## Rationale

| Factor | East US 2 | West US 2 | North Europe |
|---|---|---|---|
| Azure OpenAI (GPT-4o) | Available | Available | Available |
| Azure OpenAI (latest models first) | First access | First access | Delayed |
| Azure AI Search | Available | Available | Available |
| Container Apps | Available | Available | Available |
| Postgres Flexible Server ZRS | Available | Available | Available |
| Latency for US-East customers | Lowest | High | Very high |
| Compliance (US data residency) | Yes | Yes | No (EU) |
| Pricing | Standard | Standard | Standard |
| Availability Zones | 3 | 3 | 3 |

East US 2 is preferred over East US because it typically receives Azure OpenAI model updates first and has consistent availability across all required services.

## Consequences

- All lab resource groups use `eastus2` as location
- Resource naming convention includes `eastus2` as region token (see `AZLAB6-resource-naming-convention.md`)
- If a specific service is unavailable in East US 2 during lab setup, fail-over region is East US
- Production deployment: primary region East US 2, secondary region West US 2 (for geo-redundancy)
- Customer data residency: US customers → East US 2; EU customers → North Europe (future expansion, post-lab)
- Azure OpenAI deployment: `gpt-4o` deployed in East US 2, capacity reserved via Azure AI Services

## Deferred

- Multi-region active-active deployment — deferred to production
- EU data residency region (North Europe) — deferred to pilot customer with EU residency requirement
- Availability Zone selection within East US 2 — deferred to production (lab uses single AZ)
