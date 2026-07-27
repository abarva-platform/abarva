# Azure Cost Estimate

This is a plan-only directional estimate, not a billing quote.

Expected low-cost lab components:

- PostgreSQL Flexible Server Burstable B1ms, private networking, 128 GB storage.
- StorageV2 Standard LRS private account.
- Log Analytics 30-day retention.
- Container Apps workload-profiles environment with manually triggered jobs.
- Key Vault Standard.
- Private endpoints and DNS zones.

Deferred for initial vertical slice:

- Service Bus event orchestration.
- Azure AI Search.

Cost-control recommendation: apply a lab budget on `rg-abarva-hcdn-lab-eus-001`, keep job executions manual for Patient Access, and enable Service Bus/Search only after the first vertical slice proves reconstruction quality.
