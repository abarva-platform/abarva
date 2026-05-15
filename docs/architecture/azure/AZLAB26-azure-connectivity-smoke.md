# AZLAB26 - Azure Connectivity Smoke

Date: 2026-05-15  
Status: complete  
Layer: L2 connectivity / private endpoint reachability  
Data posture: synthetic smoke only; no PHI, PII, or real client data

## Purpose

AZLAB26 converts the L2 test layer from an architecture claim into a repeatable smoke test. The test runs inside the Azure Container Apps runtime lane and verifies that the app identity can reach the private dependencies required for an Azure parallel run.

The smoke checks:

1. Azure Postgres: `SELECT 1`
2. Blob Storage: one-byte put/get/delete against `context-drops`
3. Service Bus: no-op send/receive against `q-context-ingestion-events`
4. Key Vault: managed-identity secret read
5. Azure AI Search: count query against `tenant-context-v1`

## Repo Artifacts

| Artifact | Purpose |
|---|---|
| `src/lib/azure-connectivity/config.ts` | Shared config, env alias handling, report shape, and error redaction. |
| `src/lib/azure-connectivity/smoke.ts` | Connectivity runner for Postgres, Blob, Service Bus, Key Vault, and AI Search. |
| `src/scripts/azure-connectivity-smoke.ts` | CLI entrypoint for Container Apps Jobs. |
| `src/app/api/health/azure-connectivity/route.ts` | Guarded app route for the same check; production requires `x-abarva-health-token`. |
| `infra/azure/parameters/connectivity-smoke.lab.bicepparam` | Lab Container Apps Job parameter file. |
| `src/lib/azure-connectivity/__tests__/config.test.ts` | Unit coverage for env normalization, redaction, and report summarization. |

## Live Azure Run

| Item | Value |
|---|---|
| ACR image | `acrabarvalab001.azurecr.io/abarva/web:lab-connectivity-smoke-20260515-r1` |
| Image digest | `sha256:225fa721b0c5349a5da11fa6d08ac1d5675ccf17559ace2478d8201338a0a690` |
| Container Apps Job | `job-azure-connectivity-smoke-eus` |
| Deployment | `azlab26-connectivity-smoke-job-azlab26-20260515170529` |
| Execution | `job-azure-connectivity-smoke-eus-flqccn6` |
| Run id | `azlab26-20260515170529` |
| Result | `pass` |

The first local Docker build failed with exit code 137 during `next build`, which is a local memory constraint. The successful path used ACR remote build, which is the correct lab image-supply-chain path.

## Check Results

| Check | Result | Observed detail |
|---|---|---|
| Postgres | Pass | `SELECT 1 succeeded` in 176 ms. |
| Blob | Pass | Put/get/delete succeeded on `context-drops/connectivity-smoke/azlab26-20260515170529.txt` in 1,006 ms. |
| Service Bus | Pass | Send/receive succeeded on `q-context-ingestion-events` in 2,104 ms. |
| Key Vault | Pass | Secret read succeeded for `azure-connectivity-smoke-secret` in 932 ms. |
| Azure AI Search | Pass | Count query succeeded on `tenant-context-v1`: 6,567 documents in 131 ms. |

## Security Posture

The health route is intentionally guarded:

- In production, `/api/health/azure-connectivity` returns `404` unless the caller supplies `x-abarva-health-token` matching `AZURE_CONNECTIVITY_HEALTH_TOKEN` or `INTERNAL_HEALTH_TOKEN`.
- The smoke report redacts obvious secret material from failure details.
- The route is `no-store` and dynamic.
- The CLI path is preferred for CI/Container Apps Jobs; the route exists for operator diagnostics and future App Insights availability tests.

## Remaining L2 Gap

This closes the positive-path private-lane smoke. The negative-path test still needs to be automated:

| Gap | Why it matters | Target artifact |
|---|---|---|
| Public-client negative reachability checks | A public client should fail because private resources are network-blocked, not because it lacks credentials. Auth failure would imply the resource is reachable from the wrong place. | `scripts/azure/audit-private-resource-networking.mjs` in the L3 security-audit slice. |

## Notes

The job emitted the existing `pg-connection-string` SSL warning: future `pg` versions will change semantics for `sslmode=require`. The cutover path should move Azure Postgres connection strings to explicit `sslmode=verify-full`.
