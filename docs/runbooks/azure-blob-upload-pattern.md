# Azure Blob Direct Upload Pattern

Backlog row: T036
Owner: AbarVa architecture and operations
Status: repository architecture contract

## Purpose

This runbook defines the Azure Blob upload pattern for client data entering
AbarVa through a private or pre-prod data plane. It is an architecture contract,
not a live tenant implementation. It exists so customer IT, AbarVa operators,
and future implementation agents use the same upload shape before T141, T151,
T154, or pilot reload work begins.

The pattern is strict: one upload session belongs to one client and one client
only. In short: one client and one client only. A user or job must never upload
across tenants in the same session, same container, same SAS token, or same
processing run.

## Non-Negotiable Rules

| Rule                                  | Required behavior                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One client only                       | Container, SAS token, metadata, queue message, audit row, and processing run all carry exactly one canonical client key.                                                   |
| No shared keys                        | Uploaders receive short-lived user delegation SAS or service SAS. Storage account keys are not distributed.                                                                |
| Direct-to-Blob                        | Browser, AzCopy, or customer ETL writes directly to Azure Blob Storage. The app never proxies large file bytes.                                                            |
| Prefix-scoped write                   | SAS grants write/create/list only for the client's landing prefix or container. It does not grant read/delete unless explicitly approved for the workflow.                 |
| Metadata required                     | Every blob must declare client key, dimension/segment, upload session id, source system, declared classification, uploader id or service principal id, and policy version. |
| Scan before parse                     | Defender malware status and sensitive-data screening must pass before parsing, indexing, retrieval, or evidence extraction.                                                |
| Quarantine is terminal until reviewed | Quarantined files are not retried into the normal parser without an explicit admin release decision and audit row.                                                         |

## Container and Prefix Shape

Use one storage account per client private data plane when possible. Within that
account:

| Area       | Example                                                 | Purpose                                                                                |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Landing    | `landing/<uploadSessionId>/<segmentKey>/<fileName>`     | Write-only direct upload destination.                                                  |
| Quarantine | `quarantine/<uploadSessionId>/<segmentKey>/<fileName>`  | Sensitive, malicious, malformed, or policy-blocked files.                              |
| Accepted   | `accepted/<processingRunId>/<segmentKey>/<contentHash>` | Files cleared for parse and commit preview.                                            |
| Rejected   | `rejected/<processingRunId>/<segmentKey>/<fileName>`    | Files that cannot be processed and do not need sensitive quarantine.                   |
| Evidence   | `evidence/<processingRunId>/manifest.json`              | Immutable manifest, checksums, scan outcomes, uploader attestation, and approval refs. |

For small pre-prod tests, a single storage account with one container per
client is acceptable only if IAM, lifecycle, logs, and SAS scope remain
client-isolated.

## Required Blob Metadata

Each blob must carry these metadata fields or be rejected before parse:

| Field                            | Example                             | Notes                                                                                   |
| -------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `abarva_client_key`              | `fakeclient`                        | Must match the active client exactly.                                                   |
| `abarva_upload_session_id`       | `uls_20260603_001`                  | Correlates Blob, Event Grid, queue, ledger, and approval UI.                            |
| `abarva_segment_key`             | `it_financials`                     | Must match `SEGMENT_KEYS` in `src/lib/ingestion/azure-landing-zone-types.ts`.           |
| `abarva_source_system`           | `customer_sftp_bridge`              | Human-readable system or uploader channel.                                              |
| `abarva_declared_classification` | `confidential_business`             | Must map to `UploadDataClassification` in `src/lib/security/sensitive-upload-guard.ts`. |
| `abarva_policy_version`          | `pilot-private-data-use-2026-06-01` | Ties upload to the accepted data-use policy.                                            |
| `abarva_uploader_ref`            | `user_...` or `spn:...`             | User id or service principal id.                                                        |
| `abarva_file_sha256`             | lowercase hex hash                  | Used for idempotency and evidence.                                                      |

Optional but recommended:

- `abarva_template_id`
- `abarva_schema_version`
- `abarva_source_record_count`
- `abarva_customer_ticket`

## SAS Policy

| Setting              | Default                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Scope                | One client container or one client landing prefix.                                       |
| Expiry               | 15 minutes for browser uploads; 4 hours maximum for batch/AzCopy windows.                |
| Permissions          | `create`, `write`, and limited `list` for resumability. No delete. No account-level SAS. |
| Protocol             | HTTPS only.                                                                              |
| IP range             | Customer egress range when known; otherwise omit until network path is agreed.           |
| Stored access policy | Required for batch windows longer than 15 minutes so access can be revoked centrally.    |
| Rotation             | New SAS for each upload session or batch window. Never reuse across clients.             |

## Processing Flow

1. Admin creates an upload session for exactly one client and one allowed set of
   dimensions.
2. The app or operator issues a short-lived SAS scoped to that client's landing
   prefix/container.
3. Uploader writes files directly to Blob Storage with required metadata.
4. BlobCreated event emits through Event Grid into the normalized ingestion
   queue shape documented in `src/lib/ingestion/azure-landing-zone-types.ts`.
5. Ingestion consumer validates client key, segment key, metadata, hash, size,
   MIME, and session state.
6. Defender for Storage result must be `No threats found` per
   `docs/runbooks/defender-storage-malware.md`.
7. Sensitive-data guard evaluates declared classification and detected content
   using `src/lib/security/sensitive-upload-guard.ts`. Identifier detection
   delegates to `src/lib/security/preingest-sensitive-scanner.ts`, whose entity
   names are compatible with the future Microsoft Presidio adapter.
8. Files pass to parse/schema preview only after malware and sensitive-data
   gates pass.
9. Schema anomalies pause the processing run and request clarification from the
   client/admin before commit.
10. Human approval commits accepted records into the tenant data plane and
    writes evidence under the processing run.

## Azure Services

| Service                       | Role                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Azure Blob Storage            | Client-isolated landing, quarantine, accepted, rejected, and evidence areas. |
| Microsoft Entra ID            | User delegation SAS, service principal auth, and customer federation path.   |
| Defender for Storage          | Malware scan before parsing.                                                 |
| Event Grid                    | BlobCreated event fan-out.                                                   |
| Azure Service Bus             | Durable normalized ingestion queue.                                          |
| Azure Key Vault               | Secret and SAS signing material control where applicable.                    |
| Azure Monitor / Log Analytics | Upload, scan, quarantine, parse, and commit telemetry.                       |
| Azure Postgres                | Processing ledger, approval evidence, and committed tenant records.          |

## Failure and Quarantine Behavior

| Condition                            | Behavior                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Missing metadata                     | Reject or quarantine; do not parse.                                                      |
| Client key mismatch                  | Reject and alert; treat as potential tenant-isolation incident.                          |
| Unknown segment key                  | Pause run and request metadata clarification.                                            |
| Defender result missing              | Retry later; do not parse.                                                               |
| Defender malicious/error/not scanned | Quarantine; do not parse.                                                                |
| PHI/PII/payment/secrets suspected    | Quarantine before indexing or evidence extraction.                                       |
| Schema mismatch                      | Pause run, ask client/admin to map columns, then resume only after approval.             |
| Duplicate content hash               | Reuse parse result only inside the same client boundary and record idempotency evidence. |

## Audit Evidence

Every upload session should preserve:

- client key,
- upload session id,
- SAS issuance id, scope, issuer, expiry, and revoked-at timestamp if revoked,
- blob URL without SAS token,
- blob metadata,
- sha256,
- Defender scan result and timestamp,
- sensitive-data decision and matched rule ids,
- schema validation result,
- clarification messages,
- human approval decision,
- commit result,
- rollback or delete evidence.

## Related Repository Artifacts

- `src/lib/ingestion/azure-landing-zone-types.ts`
- `src/lib/ingestion/azure-landing-zone-consumer.ts`
- `src/lib/security/sensitive-upload-guard.ts`
- `docs/runbooks/defender-storage-malware.md`
- `docs/runbooks/pilot-data-loader-governance.md`
- `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`
- `docs/architecture/azure/PILOT-DATA-PLANE-ENV-MANIFEST-2026-06-02.md`

## T036 Completion Boundary

T036 is complete when this architecture contract, release record, verifier, and
package script merge. It does not complete live tenant provisioning, live SAS
issuance, Defender evidence, or data loading. Those remain tracked separately
by the FakeClient rehearsal, private data-plane, and live load rows.
