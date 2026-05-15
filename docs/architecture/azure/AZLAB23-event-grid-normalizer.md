# AZLAB23 — Event Grid Normalizer

Status: passed
Date: 2026-05-15
Data posture: synthetic smoke files only

## Purpose

AZLAB22 proved the A2b ingestion lane with canonical queue messages. It also surfaced the next gap: raw Azure Storage `Microsoft.Storage.BlobCreated` Event Grid events were landing on `q-context-ingestion-events`, but the worker only understood AbarVa's canonical `abarva.ingestion.v1` schema.

AZLAB23 closes that gap for metadata-bearing BlobCreated events.

## Design

The worker now accepts two inbound shapes:

| Inbound shape | Handling |
|---|---|
| Canonical `abarva.ingestion.v1` | Process directly. |
| Raw `Microsoft.Storage.BlobCreated` Event Grid event | Parse blob URL, read blob metadata, construct canonical `abarva.ingestion.v1`, then process through the same guard/audit/pipeline path. |

Blob metadata is the trust boundary. The worker does not infer tenant or segment from a user-controlled URL. Required metadata:

| Metadata | Purpose |
|---|---|
| `tenantClientKey` | Canonical tenant key. |
| `segmentKey` | One of the 14 setup-data segments. |
| `declaredClassification` | Product data classification. |
| `sha256` | Integrity checksum supplied by producer. |

The normalizer lives in `src/lib/ingestion/event-grid-normalizer.ts` and is covered by `src/lib/ingestion/__tests__/event-grid-normalizer.test.ts`.

## Execution Evidence

Image:

- `acrabarvalab001.azurecr.io/abarva/web:lab-eventgrid-normalizer-20260515-r1`
- Digest: `sha256:77df2e645c9881eacaf44a2023c9e593ce55d3bf24a726b151eb7b10091f2599`

Worker deployment:

- Deployment: `azlab23-worker-normalizer-20260515135934`
- State: `Succeeded`

Event Grid-only smoke run:

| Step | Execution | Result |
|---|---|---|
| Producer | `job-a2b-smoke-send-eus-90du7i3` | Succeeded |
| Worker | `job-a2b-ingest-lab-eus-cv1q617` | Succeeded |
| Verifier | `job-a2b-smoke-verify-eus-0e2dy7r` | Succeeded |

Run id: `azlab23-20260515140157`

Important distinction: producer ran with `INGESTION_SMOKE_SEND_CANONICAL=false`. It uploaded blobs only; Event Grid delivered the queue events.

Worker evidence:

```json
{"event":"ingestion_message_processed","messageId":"9c41dbed-17fe-4d58-aaca-a6002b63e0d8","status":"quarantined","auditRowId":"64693f81-dcb7-4d0f-a287-bee715fb3b7f","durationMs":48}
{"event":"ingestion_message_processed","messageId":"2b6c3d99-efc2-462d-a198-ee093946922a","status":"accepted","auditRowId":"6d730d69-6249-44d8-9bf5-30b23e980e07","durationMs":17}
```

Verifier evidence:

```json
{"event":"ingestion_smoke_verified","smokeRunId":"azlab23-20260515140157","observed":{"safe":"allow","sensitive":"quarantine"}}
```

## What This Proves

- Private Blob upload can trigger Event Grid.
- Event Grid can place raw BlobCreated events onto the Service Bus queue.
- The worker can normalize raw BlobCreated events using blob metadata.
- The same sensitive-upload guard and audit path handles both canonical and Event Grid-originated messages.
- The fake sensitive sample is quarantined before broker/indexing.

## What Remains

- The broker/index rebuild path is still `audit_only`.
- Azure AI Search indexing is not wired.
- Purview enrichment is not wired.
- Production ingestion should enforce a documented blob path + metadata contract at upload time so malformed events fail fast with an operator-readable reason.
