# Pilot Private Data Plane Rehearsal Runbook

Date: 2026-06-01
Rows: T353-T356
Status: candidate runbook authority

## Purpose

This runbook turns the first Data Load Center foundation into a governed
private data-plane rehearsal. It defines exactly what Azure resources, SSO/SCIM
roles, operator stages, and processing services must exist before AbarVa treats
pilot data onboarding as robust.

This is not the durable ingestion schema or malware/retention/rollback wave.
Those remain governed by T357-T368.

## T353 — Azure Provisioning Runbook

Provision in this order, using the existing `infra/azure` authority paths.

| Layer | Resource | Authority path | Required validation |
| --- | --- | --- | --- |
| Subscription | Pilot private data-plane subscription or dedicated resource group | `docs/architecture/azure/PILOT-PRIVATE-DATA-LANE-RUNBOOK-2026-05-22.md` | Resource parity check sees lane RG, tags, owner, and environment. |
| Network | Private VNet, app/data/private-endpoint subnets, private DNS | `infra/azure/foundation.bicep` | Connectivity smoke runs from Container Apps job inside the VNet. |
| Storage | Landing, quarantine, processed, and evidence containers | `infra/azure/storage-event-ingestion.bicep` | Public access disabled; Event Grid emits metadata only. |
| Database | Private Azure Postgres tenant lane | `infra/azure/postgres-foundation.bicep` | Schema verifier and tenant parity checks pass from private network. |
| Queue | Service Bus namespace and `q-context-ingestion-events` | `infra/azure/event-ingestion-foundation.bicep` | DLQ drill and mixed-batch evidence tests pass. |
| Identity | Managed identities and scoped RBAC | `infra/azure/storage-rbac.bicep` | No runtime Owner/Contributor grants required. |
| Secrets | Key Vault with private endpoint, RBAC, purge protection | `infra/azure/keyvault-postgres-secrets.bicep` | Secret projection smoke passes without printing values. |
| Observability | Log Analytics, App Insights, action group, cost tags | `infra/azure/observability.bicep` | Observability audit proves alerts and tags exist. |
| Retrieval | Azure AI Search service or tenant indexes | `infra/azure/search-foundation.bicep` | Index contract includes tenant, provenance, sensitivity, freshness. |
| Runtime | Container Apps jobs for worker/migration/copy/smoke | `infra/azure/ingestion-worker-foundation.bicep` | Job evidence records command, image digest, status, and log path. |

## T354 — SSO/SCIM Role Mapping

The pilot must map Entra groups into Clerk organization roles, then into
tenant-scoped app permissions. Do not use email substring inference for these
roles.

| Role | Clerk org role | Entra group claim | Allowed | Denied | Validation |
| --- | --- | --- | --- | --- | --- |
| Tenant admin | `org:admin` | `abarva-pilot-admins` | Manage users, configure SSO, approve load policy, export audit history | Bypass quarantine, edit another tenant | Admin sees `/admin/setup`; cross-tenant `clientId` mutation returns 403. |
| Data uploader | `org:data_uploader` | `abarva-pilot-uploaders` | Upload files, view own runs, answer clarifications | Approve commits, alter role policy, export full audit | Uploader can create a run but cannot commit a load batch. |
| Data reviewer | `org:data_reviewer` | `abarva-pilot-reviewers` | Review parsed preview, resolve schema anomalies, mark row usability | Upload without uploader role, final-approve commits | Reviewer can resolve clarifications but cannot write commit rows. |
| Load approver | `org:load_approver` | `abarva-pilot-load-approvers` | Approve preview-before-commit, reject batch, request rollback | Edit raw bytes, bypass scanning | Every commit carries approver identity and role. |
| Auditor | `org:auditor` | `abarva-pilot-auditors` | Read/export audit ledger and policy decisions | Upload, approve, alter mappings | Auditor gets immutable history with no mutation controls. |

## T355 — Private-Data Rehearsal Runbook

| Seq | Stage | Owner | Entry criteria | Exit evidence |
| ---: | --- | --- | --- | --- |
| 1 | SSO sign-in and tenant resolution | Setup admin | Clerk organization, Entra group claim, and tenant row configured | Session resolves exactly one `clientId` and client key. |
| 2 | Upload consent and data-use attestation | Tenant admin | Uploader role exists and prohibited-data policy is accepted | Upload run records attestation version, user, tenant, timestamp. |
| 3 | Private landing-zone upload | Data uploader | Blob container, queue, and managed identity RBAC deployed | Blob event normalizes to `abarva.ingestion.v1` queue message. |
| 4 | Malware and sensitive-data quarantine | Ingestion worker | File bytes available in private lane and scan policy active | Run is allowed, quarantined, or rejected before parsing/indexing. |
| 5 | Template mapping and schema anomaly review | Data reviewer | Template version and mapping profile selected | Unmapped columns, missing fields, and low-confidence rows resolved or waived. |
| 6 | Preview-before-commit approval | Load approver | Parsed preview, validation findings, and quality score available | Approver accepts, rejects, or sends batch back for clarification. |
| 7 | Commit, notify, and audit export | Setup admin | Approval exists and idempotency key is unused | Commit written, subscribers notified, audit export includes run. |
| 8 | Source/Moves/Tower output smoke | AbarVa QA | Committed rows available to approved retrieval/reasoning surfaces | Outputs cite tenant evidence, disclose gaps, and show no other-client data. |

## T356 — Processing Service Decision

| Service | Decision | Reason |
| --- | --- | --- |
| Azure Blob Storage + Event Grid | Approved for pilot | Clean metadata handoff from private landing zone to durable ingestion queue. |
| Azure Service Bus | Approved for pilot | Retry, DLQ, and mixed-batch drills match the ingestion consumer contract. |
| Azure Container Apps jobs | Approved for pilot | Runs worker, migrations, copy, and smokes inside the private network boundary. |
| Azure Functions | Approved when customer requires | Compatible with queue-trigger processing, but Container Apps jobs remain the default repo lane. |
| Azure Document Intelligence | Deferred until Day 2 | Useful for unstructured documents after consent, malware, retention, and raw-file policy are complete. |
| Azure AI Search | Approved for pilot | Approved committed evidence can be indexed with tenant, sensitivity, provenance, and freshness fields. |
| Microsoft Purview | Approved when customer requires | Use for regulated customers needing label lifecycle persistence; not mandatory for first rehearsal. |

## Validation Commands

Local authority checks:

```bash
npx jest src/lib/admin/__tests__/pilot-private-data-plane-runbook.test.ts --runInBand
npx eslint src/lib/admin/pilot-private-data-plane-runbook.ts src/lib/admin/__tests__/pilot-private-data-plane-runbook.test.ts
git diff --check
npm run release:check -- --base origin/main --head HEAD
```

Azure live validation must run from an authorized Azure environment:

```bash
az deployment sub what-if --template-file infra/azure/foundation.bicep --parameters infra/azure/parameters/foundation.lab.bicepparam
az deployment sub what-if --template-file infra/azure/event-ingestion-foundation.bicep --parameters infra/azure/parameters/event-ingestion.lab.bicepparam
az deployment sub what-if --template-file infra/azure/ingestion-worker-foundation.bicep --parameters infra/azure/parameters/ingestion-worker.lab.bicepparam
npm run azure:connectivity:smoke
npm run azure:security:audit
```

## Out Of Scope For This Slice

T357-T368 still need implementation:

- durable ingestion schema;
- idempotency and dedupe;
- template versioning and mapping profiles;
- rollback/unload;
- malware scanning implementation;
- encryption/key policy finalization;
- retention/deletion policy;
- audit export UI/API;
- observability and cost limits;
- tenant isolation test pack;
- legal/data-use policy pack;
- end-to-end pilot smoke evidence.
