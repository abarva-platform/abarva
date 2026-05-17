# AZLAB61 — Cutover Validation Snapshot

Date: 2026-05-17

Purpose: record the current cutover-readiness evidence after the product enhancement backlog and residual cleanup landed on `main`.

## Summary

The Azure lab is standing up cleanly for the current demo-scale workload. Resource parity passes, security has zero failing checks, observability has no failing checks, the guarded connectivity smoke passes from inside Azure, and the Vercel-production-to-Azure-lab parallel-run harness is green for the connectivity and tenant-substrate invariant tiers.

The remaining cutover proof requires the one gated credential that is intentionally not available to this shell:

- A valid authenticated session cookie to compare signed-in surfaces.

## Validation Results

| Layer | Command / Artifact | Result | Notes |
|---|---|---|---|
| L1 resource parity | `npm run azure:resource:parity` | Pass | 37 expected resources present; 0 attention; 0 fail. |
| L2 Azure connectivity job | `job-azure-connectivity-smoke-eus-vk2egp9` | Pass | Postgres, Blob, Service Bus, Key Vault, and Azure AI Search all passed. |
| L3 security audit | `npm run azure:security:audit` | Attention | 85 pass, 9 attention, 0 fail. Remaining attention items are lab hardening items before customer private-data-lane pilots. |
| L11 observability audit | `npm run azure:observability:audit` | Attention | 11 pass, 2 attention, 0 fail. App Insights workspace mode and env projection remain hardening items. |
| Parallel run harness | `npm run parallel-run:diff -- --left-base-url https://nexus-vert-kappa.vercel.app --right-base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` | Yellow | 4 pass, 0 warn, 0 fail, 2 preflight-blocked. Both `/api/health` endpoints returned HTTP 200 and Postgres reachability was true on both sides. |
| Token-backed substrate parity | `PARALLEL_RUN_INVARIANT_TOKEN=<secret> npm run parallel-run:diff -- --left-base-url https://nexus-vert-kappa.vercel.app --right-base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` | Yellow | Three consecutive runs at least 60 seconds apart produced 28 pass, 0 warn, 0 fail, 1 preflight-blocked. The only blocked check is authenticated surface parity. |
| Residual code tests | `npx jest src/lib/source/__tests__/event-code-as-slug.test.ts src/lib/source/disclosure-flag/__tests__/serde.test.ts src/lib/source/disclosure-flag/__tests__/disclosure-flag.test.ts --runInBand` | Pass | 3 suites, 32 tests. |

## Connectivity Detail

The first job execution (`job-azure-connectivity-smoke-eus-2q24h29`) failed only the Service Bus leg because the job still used the real ingestion queue (`q-context-ingestion-events`). That queue has a competing consumer, so the smoke probe could send successfully but lose the receive race.

The job was updated to set:

```text
AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME=q-connectivity-smoke
```

The follow-up execution (`job-azure-connectivity-smoke-eus-vk2egp9`) passed:

| Check | Result | Evidence |
|---|---|---|
| Postgres | Pass | `SELECT 1 succeeded` |
| Blob | Pass | Put/get/delete succeeded under `context-drops/connectivity-smoke/` |
| Service Bus | Pass | Send/receive succeeded on `q-connectivity-smoke` |
| Key Vault | Pass | Secret read succeeded for `azure-connectivity-smoke-secret` |
| Azure AI Search | Pass | Count query succeeded on `tenant-context-v1: 6567` |

## Security-Audit Adjustment

The audit script was updated to treat `AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME` as a public resource identifier, matching `SERVICE_BUS_QUEUE_NAME`. It is not a secret. After that adjustment, the security audit reports 0 failing checks.

## Token-Backed Substrate Parity

After confirming the shared invariant token was projected into the Azure Container App, the parallel-run harness was run three times against Vercel production and Azure lab.

Each run returned:

```text
28 pass | 0 warn | 0 fail | 1 preflight-blocked
```

The authenticated-surface check is the only preflight-blocked check. The following tenant substrate invariants matched exactly across both backends:

| Tenant | Graph nodes | Graph edges | Context chunks | Data segments | Programs | Source events |
|---|---:|---:|---:|---:|---:|---:|
| Apex Retail | 338 | 413 | 2,075 | 23 | 23 | 0 |
| First Capital | 458 | 413 | 2,070 | 23 | 9 | 0 |
| Meridian Health | 517 | 742 | 2,422 | 23 | 16 | 0 |

Top-3 KPI names and top-3 pattern IDs also matched for all three tenants in all three runs.

## Cutover Readiness

The lab is ready for the final cutover gate: authenticated surface parity.

Required next steps:

1. Capture one valid demo session cookie and rerun the parallel-run diff with `--auth-cookie`.
2. Require three consecutive authenticated green runs at least 60 seconds apart before calling the parallel run cutover-ready.
3. Treat the remaining security and observability attention items as customer-pilot hardening, not current lab blockers.
