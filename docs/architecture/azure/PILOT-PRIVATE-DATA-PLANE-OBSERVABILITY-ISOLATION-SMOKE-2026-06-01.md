# Pilot Private Data Plane Observability, Isolation, And Smoke Contract

Date: 2026-06-01

Rows covered: T365, T366, T368

This document defines the final technical control pack before the pilot private
data plane can be called robust: observability and cost guardrails, tenant
isolation probes, and the end-to-end smoke sequence from SSO to product output.

## Observability And Cost Guardrails

| Signal | Trigger | Severity | Evidence |
| --- | ---: | --- | --- |
| Queue failure count | 1 or more in 15 minutes | Critical | Service Bus DLQ count and ingestion worker structured logs |
| Parse failure rate | 5% or more in 1 hour | Warning | `pilot_ingestion_upload_runs.validation_summary` |
| Retry storm count | 10 or more in 15 minutes | Critical | Queue retry telemetry grouped by tenant and run key |
| Long-running job | 20 minutes or more per job | Warning | Container Apps job run duration and request telemetry |
| Azure daily spend | 250 USD or more in 24 hours | Warning | Azure Cost Management grouped by pilot lane tags |

Runtime contract: `PILOT_ALERT_RULES` and `evaluatePilotAlerts` in
`src/lib/admin/pilot-observability-isolation-smoke.ts`.

## Tenant Isolation Test Pack

Pilot QA scope is exactly three clients for this wave:

- Apex Retail Group (`apexretail`)
- Meridian Health System (`meridian`)
- SkyHarbor Air (`skyharbor`)

For each active client, QA must attempt to access every other client using five
actions: view, upload, approve, commit, and export. All mismatched requests must
return HTTP 403, emit a structured tenant guard log, and include no requested
client data in the response body. With three clients, this creates 30 probes.

Runtime contract: `buildPilotIsolationProbes`.

## End-To-End Smoke Sequence

The smoke must run for Apex Retail, Meridian Health, and SkyHarbor Air.

| Step | Surface | Assertion | Evidence |
| ---: | --- | --- | --- |
| 1 | SSO | User signs in and resolves exactly one active client. | Browser session, resolved client key, and no cross-client names in first viewport |
| 2 | Setup | Data Load Center shows active-client workflow, readiness table, and work queue. | Screenshot and DOM text check for active client only |
| 3 | API | Upload, approval, commit, and audit-export routes reject mismatched client requests. | 403 responses for cross-client probes |
| 4 | Data plane | Synthetic file lands, scans clean, validates, approves, and commits through the pilot ledger. | Upload run, file manifest, approval decision, load commit, and commit items |
| 5 | Intelligence | Answers cite only committed active-client evidence. | Answer trace with tenant key and evidence locator |
| 6 | Moves | Recommendations reflect loaded dimensions and disclose missing dimensions. | Screen capture and trace bundle |
| 7 | Source | Output uses active-client vendor/context evidence only. | Vendor/context citation check |
| 8 | Tower | Committed load effects appear without fallback-only counters. | Tower panel screenshot and data-mode trace |
| 9 | Audit export | Export includes upload, scan, quarantine, clarification, approval, commit, and rollback history. | Audit export manifest hash and table coverage list |

Runtime contract: `PILOT_SMOKE_STEPS` and `getPilotSmokeStepsForClient`.

## Setup/Admin Design Implication

The Setup Data Load Center home must present these controls in Maestro language:

- "Active client verified" instead of internal tenant-guard labels.
- "Scan clean" or "Scan retry needed" instead of raw scanner states.
- "Cannot commit yet" with the exact blocker count instead of implementation tags.
- "Audit export ready" with a clear export action when ledger evidence exists.

Detailed logs, raw row IDs, policy names, and internal diagnostics belong in
drill-in drawers or audit exports, not in the first viewport.
