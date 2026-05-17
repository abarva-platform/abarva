# AZLAB61 — Cutover Validation Snapshot

Date: 2026-05-17

Purpose: record the current cutover-readiness evidence after the product enhancement backlog and residual cleanup landed on `main`.

## Summary

The Azure lab is standing up cleanly for the current demo-scale workload. Resource parity passes, security has zero failing checks, observability has no failing checks, the guarded connectivity smoke passes from inside Azure, and the Vercel-production-to-Azure-lab parallel-run harness is green at the unauthenticated connectivity tier.

The remaining cutover proof requires the two gated credentials already designed into the harness:

- `PARALLEL_RUN_INVARIANT_TOKEN` to compare tenant substrate invariants.
- A valid authenticated session cookie to compare signed-in surfaces.

## Validation Results

| Layer | Command / Artifact | Result | Notes |
|---|---|---|---|
| L1 resource parity | `npm run azure:resource:parity` | Pass | 37 expected resources present; 0 attention; 0 fail. |
| L2 Azure connectivity job | `job-azure-connectivity-smoke-eus-vk2egp9` | Pass | Postgres, Blob, Service Bus, Key Vault, and Azure AI Search all passed. |
| L3 security audit | `npm run azure:security:audit` | Attention | 84 pass, 9 attention, 0 fail. Remaining attention items are lab hardening items before customer private-data-lane pilots. |
| L11 observability audit | `npm run azure:observability:audit` | Attention | 11 pass, 2 attention, 0 fail. App Insights workspace mode and env projection remain hardening items. |
| Parallel run harness | `npm run parallel-run:diff -- --left-base-url https://nexus-vert-kappa.vercel.app --right-base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` | Yellow | 4 pass, 0 warn, 0 fail, 2 preflight-blocked. Both `/api/health` endpoints returned HTTP 200 and Postgres reachability was true on both sides. |
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

## Cutover Readiness

The lab is ready for the next cutover gate: authenticated and invariant-token parallel run.

Required next steps:

1. Ensure `PARALLEL_RUN_INVARIANT_TOKEN` is configured identically on Vercel production and Azure lab.
2. Run the parallel-run diff with `--invariant-token`.
3. Capture one valid demo session cookie and rerun with `--auth-cookie`.
4. Require three consecutive green runs at least 60 seconds apart before calling the parallel run cutover-ready.

