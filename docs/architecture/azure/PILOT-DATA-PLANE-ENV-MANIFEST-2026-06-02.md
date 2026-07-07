# Pilot Data-Plane Environment Manifest

Status: candidate  
Release lane: `client-data-lane`  
Date: 2026-06-02

This manifest is the names-only configuration contract for the T341 pilot private data-plane rehearsal. It is intentionally safe to share in the repository: it lists key names, never key values.

## Verification Command

Run:

```bash
npm run verify:pilot-data-plane
```

The verifier reports three statuses per hop:

- `live_ready`: required key names are configured and the hop is eligible for live validation.
- `stub_fail_closed`: live keys are absent or a scanner is explicitly stubbed; downstream processing must block rather than silently pass.
- `blocked`: live mode was requested but a required key group is missing or invalid.

For a hard live preflight, run:

```bash
npm run verify:pilot-data-plane -- --live
```

## Pilot Clients

| Client | Accepted aliases | Isolation expectation |
|---|---|---|
| Apex Retail | `apex`, `apex-retail`, `apexretail` | Every upload, queue message, ledger row, commit, search document, notification, and audit row is client-scoped. |
| Meridian Health | `meridian`, `meridian-health` | Same as above. |
| SkyHarbor | `skyharbor`, `skyharbor-air` | Same as above. |

## Required Key Groups

| Hop | Required key group | Notes |
|---|---|---|
| SSO and role binding | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; `CLERK_SECRET_KEY` | Required for authenticated admin/setup access. |
| Private Azure Blob landing zone | one of `AZURE_BLOB_CONNECTION_STRING`, `DATA_PLANE_OBJECT_STORE_CONNECTION_STRING`, `AZURE_OBJECT_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONNECTION_STRING`; one of `AZURE_BLOB_LANDING_CONTAINER`, `DATA_PLANE_OBJECT_STORE_CONTAINER`, `AZURE_OBJECT_STORAGE_CONTAINER` | Blob keys are used for private landing-zone storage before parse. |
| Durable processing queue | one of `AZURE_QUEUE_CONNECTION_STRING`, `AZURE_SERVICE_BUS_CONNECTION_STRING`, `VERCEL_QUEUE_TOKEN`; one of `AZURE_QUEUE_NAME`, `AZURE_SERVICE_BUS_QUEUE_NAME`, `VERCEL_QUEUE_INGESTION_TOPIC` | The current codebase already has a Service Bus/Event Grid landing-zone consumer contract. |
| Client-scoped Postgres data plane | `DATABASE_URL` | Required for ledger, quarantine, approval, commit, rollback, and audit state. |
| Immutable audit and ingestion ledger | `DATABASE_URL` | Same underlying database, separate verification hop because audit must never be silently skipped. |
| Malware and restricted-data scan gate | `AZURE_DEFENDER_SCAN_MODE` | Must be `live` or `stub`; `stub` is fail-closed for parse/commit. |
| Approved-data search index | one of `AZURE_SEARCH_ENDPOINT`, `AZURE_AI_SEARCH_ENDPOINT`; one of `AZURE_SEARCH_INDEX_NAME`, `AZURE_AI_SEARCH_INDEX_NAME` | Required before T350 can claim approved parsed data is committed to search. |
| In-app and email notification fan-out | `RESEND_API_KEY`; `RESEND_FROM` | In-app notification rows still rely on the app database; email dispatch uses Resend. |
| Role-gated admin access | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; `CLERK_SECRET_KEY` | Separate hop from SSO because admin mutation roles must be proven, not inferred. |

## Optional Key Names

| Hop | Optional key names |
|---|---|
| SSO and role binding | `PILOT_CLERK_ORG_ID`, `PILOT_ADMIN_ROLE`, `PILOT_DATA_UPLOADER_ROLE` |
| Private Azure Blob landing zone | `AZURE_BLOB_QUARANTINE_CONTAINER`, `AZURE_BLOB_PROCESSED_CONTAINER` |
| Durable processing queue | `AZURE_SERVICE_BUS_NAMESPACE` |
| Client-scoped Postgres data plane | `AZURE_CONTEXT_DATABASE_URL`, `AZURE_CONTROL_DATABASE_URL` |
| Immutable audit and ingestion ledger | `ADMIN_AUDIT_LOG_RETENTION_DAYS`, `PILOT_INGESTION_AUDIT_EXPORT_CONTAINER` |
| Malware and restricted-data scan gate | `AZURE_DEFENDER_SCAN_RESULT_TOPIC`, `AZURE_DEFENDER_STORAGE_ACCOUNT` |
| Approved-data search index | `AZURE_SEARCH_API_KEY`, `AZURE_AI_SEARCH_API_KEY` |
| In-app and email notification fan-out | `PILOT_NOTIFICATION_OWNER_EMAIL`, `NOTIFICATIONS_DISPATCH_SECRET` |
| Role-gated admin access | `PILOT_ADMIN_ROLE`, `PILOT_DATA_REVIEWER_ROLE`, `PILOT_LOAD_APPROVER_ROLE` |

## Open Live Decisions

- Azure subscription and resource group for Blob, Queue or Service Bus, Defender, Search, and Postgres.
- Clerk organization and role mapping for pilot admins, uploaders, reviewers, approvers, and auditors.
- Queue technology final choice. The repo already has a Service Bus/Event Grid consumer contract; the verifier accepts Azure Queue, Service Bus, or Vercel Queues until the live choice is locked.
- Legal sign-off for the attestation and restricted-data policy text.
- Notification owner resolution for dimension owners and uploaders.

## Fail-Closed Rule

A missing key never means the hop passes. In stub-aware mode, the verifier reports `stub_fail_closed`; in live mode, it reports `blocked` and exits non-zero. Future PL agents should wire into this contract and refuse parse, commit, search indexing, notification fan-out, or live-data acceptance when the relevant hop is not `live_ready`.
