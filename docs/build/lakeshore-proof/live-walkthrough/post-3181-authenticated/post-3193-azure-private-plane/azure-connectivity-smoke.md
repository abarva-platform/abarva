# Lakeshore Azure Private-Plane Connectivity Proof

Captured: 2026-06-06T10:10Z  
Scope: Azure lab private data lane / Container Apps runtime proof  
Data posture: synthetic smoke only; no real client data

## Executive Result

The current Azure lab private-plane connectivity smoke passed on 2026-06-06. The smoke ran as a Container Apps Job inside the Azure lab lane and verified that the runtime identity can reach the private dependencies needed for a customer-controlled Azure substrate.

## Execution

| Field | Value |
|---|---|
| Subscription | `abarva-lab-sub` |
| Resource group | `rg-abarva-controlplane-lab-eastus` |
| Container Apps Job | `job-azure-connectivity-smoke-eus` |
| Execution | `job-azure-connectivity-smoke-eus-fti8q63` |
| Status | `Succeeded` |
| Start | `2026-06-06T10:10:21+00:00` |
| End | `2026-06-06T10:10:58+00:00` |
| Runtime image | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1` |
| Active Azure web revision | `ca-abarva-web-lab-eastus--0000047` |

## Check Results

| Check | Result | Evidence detail |
|---|---|---|
| Postgres | Pass | `SELECT 1 succeeded` in 159 ms. |
| Blob Storage | Pass | Put/get/delete succeeded on `context-drops/connectivity-smoke/azlab26-20260515170529.txt` in 1,443 ms. |
| Service Bus | Pass | Send/receive succeeded on `q-connectivity-smoke` in 2,611 ms. |
| Key Vault | Pass | Secret read succeeded for `azure-connectivity-smoke-secret` in 1,043 ms. |
| Azure AI Search | Pass | Count query succeeded on `tenant-context-v1`: 6,567 documents in 1,299 ms. |

## Truth Boundary

- This proves the Azure lab private-plane positive path for the core substrate dependencies: Postgres, Blob, Service Bus, Key Vault, and Azure AI Search.
- This does not change production Vercel runtime configuration.
- `https://app.abarva.ai/api/health/azure-connectivity` still returns masked `404` without operator auth/env, which is expected for the guarded public route.
- The remaining cutover gap is operational: provision the Vercel/operator route tokens and, if desired, run the guarded route check from production as an additional public-edge diagnostic.

## Commands Used

```bash
az containerapp job start \
  -g rg-abarva-controlplane-lab-eastus \
  -n job-azure-connectivity-smoke-eus

az containerapp job execution show \
  -g rg-abarva-controlplane-lab-eastus \
  -n job-azure-connectivity-smoke-eus \
  --job-execution-name job-azure-connectivity-smoke-eus-fti8q63

az containerapp job logs show \
  -g rg-abarva-controlplane-lab-eastus \
  -n job-azure-connectivity-smoke-eus \
  --execution job-azure-connectivity-smoke-eus-fti8q63 \
  --container context-ingestion-worker \
  --tail 200
```

