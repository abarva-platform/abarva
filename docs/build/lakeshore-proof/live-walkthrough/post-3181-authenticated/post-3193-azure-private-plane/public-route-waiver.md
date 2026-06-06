# Lakeshore Azure Public-Route Proof Waiver

Captured: 2026-06-06T10:42Z  
Scope: Lakeshore non-corpus demo readiness / Azure substrate truth boundary  
Decision: waive public Vercel route-level Azure connectivity proof as a demo-readiness blocker

## Decision

The Azure substrate readiness proof for Lakeshore is satisfied by the Azure Container Apps private-plane smoke, not by the public Vercel guarded health route.

The public route `https://app.abarva.ai/api/health/azure-connectivity` remains intentionally guarded and currently returns masked `404` without operator token/env. That is expected behavior for the public edge and should not be treated as a failed private-plane proof.

## Evidence Used

| Evidence | Result |
|---|---|
| Azure Container Apps Job `job-azure-connectivity-smoke-eus-fti8q63` | `Succeeded` |
| Postgres | Pass |
| Blob Storage | Pass |
| Service Bus | Pass |
| Key Vault | Pass |
| Azure AI Search | Pass |
| Production Vercel `/api/health` | Pass for Postgres/direct Postgres |
| Production Vercel `/api/health/azure-connectivity` without operator token | Masked `404`, expected guarded behavior |

## Why This Is The Correct Boundary

- The customer/private-plane promise is that the Azure runtime lane can reach private dependencies using the Azure runtime identity and private network posture.
- The Container Apps Job proves that from the Azure lab lane.
- The public Vercel route is an operator diagnostic endpoint, not the private-plane runtime itself.
- Running Azure private-dependency checks from Vercel would require extra public-edge secrets/env and may still not represent the customer-controlled private lane.

## Remaining Optional Follow-Up

Provision `AZURE_CONNECTIVITY_HEALTH_TOKEN` or `INTERNAL_HEALTH_TOKEN` plus route-level Azure service env in Vercel only if the team wants a public-edge operator diagnostic proof. That follow-up is useful for operations, but it is not required to call Lakeshore non-corpus demo readiness green.

