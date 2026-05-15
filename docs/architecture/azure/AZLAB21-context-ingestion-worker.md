# AbarVa Azure Lab Context Ingestion Worker

Status: deployed to `abarva-lab-sub` on 2026-05-15
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`
Data posture: synthetic/no-client-data only

## Purpose

This stage turns the A2b ingestion consumer from a library into a deployable Azure lab worker.

The worker is a manual Container Apps Job that can be scheduled or triggered later. It reads from Service Bus queue `q-context-ingestion-events`, downloads the referenced Blob payload, runs the sensitive-upload guard, writes an append-only audit row when `DATABASE_URL` is available, and settles the Service Bus message.

## Deployed Resources

| Item | Value |
|---|---|
| Container Apps Job | `job-a2b-ingest-lab-eus` |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-ingestion-worker-20260515-r2` |
| Image digest | `sha256:397b9063136cc874f0cf24390536ecb5ccd4f14173f33741679e5432e3a9f347` |
| Deployment | `azlab21-ingestion-worker-r2-20260515075255` |
| Queue | `q-context-ingestion-events` |
| Service Bus namespace | `sb-abarva-lab-eastus` |
| Runtime identity | `id-abarva-scale-runtime-lab-eastus` |
| Smoke execution | `job-a2b-ingest-lab-eus-7l2xu5s` |

## Runtime Configuration

| Env var | Source | Purpose |
|---|---|---|
| `SERVICE_BUS_NAMESPACE` | Plain env | Service Bus namespace short name. |
| `SERVICE_BUS_QUEUE_NAME` | Plain env | Queue to receive ingestion events from. |
| `AZURE_CLIENT_ID` | Plain env | Pins `DefaultAzureCredential` to the user-assigned managed identity. |
| `INGESTION_WORKER_MAX_MESSAGES` | Plain env | Maximum messages processed per job execution. |
| `INGESTION_WORKER_MAX_WAIT_MS` | Plain env | Queue receive wait before idle exit. |
| `INGESTION_PIPELINE_MODE` | Plain env | `audit_only` in lab; `broker_command` when the broker rebuild command is ready. |
| `DATABASE_URL` | Key Vault secret ref | Azure Postgres audit writes. |

## Worker Behavior

| Consumer outcome | Queue action | Notes |
|---|---|---|
| `accepted` | Complete | Payload passed guard and pipeline hook returned. |
| `quarantined` | Complete | Payload was held by sensitive-upload guard and audit row was written. |
| `rejected` | Dead-letter | Message shape was invalid; retrying will not help. |
| `transient_failure` | Abandon | Blob, audit, or pipeline failure should retry through Service Bus. |

The current lab default is `INGESTION_PIPELINE_MODE=audit_only`. That intentionally proves the control loop without pretending the broker/indexer has been rebuilt. When the data-access adapter and broker rebuild command are ready, switch to:

```text
INGESTION_PIPELINE_MODE=broker_command
INGESTION_BROKER_REBUILD_COMMAND=<approved command>
```

## Smoke Results

First execution failed because the Azure SDK could not infer the correct user-assigned managed identity. The fix was to set `AZURE_CLIENT_ID` and pass it to `DefaultAzureCredential`.

Second execution succeeded:

```json
{"event":"ingestion_worker_idle","queueName":"q-context-ingestion-events"}
```

That proves the job can start, use the pinned managed identity, authenticate to Service Bus, attempt a receive on the queue, and exit cleanly when no messages are present.

## What This Proves

- The A2b consumer is now deployable in Azure, not just locally runnable.
- The image contains the operational script surface plus `src/lib` dependencies required by `tsx` scripts.
- Managed identity can be pinned correctly for Container Apps Jobs.
- The worker can reach Service Bus and idle safely with an empty queue.
- The queue settlement logic is explicit and matches retry semantics.

## What This Does Not Yet Prove

- It does not yet process a real BlobCreated event end to end.
- It does not yet run the broker rebuild/index refresh path.
- It does not yet write a sample audit row from a real queued message.
- It does not yet move quarantined blobs into a quarantine container.

## Next Close Path

1. Drop a synthetic safe file into `context-drops` and enqueue a normalized `abarva.ingestion.v1` message.
2. Verify the worker downloads the blob, writes `sensitive_upload_audit`, and completes the message.
3. Drop a synthetic PHI/PII-like file and verify quarantine, audit reason codes, and no broker/indexing path.
4. Replace `audit_only` with a real broker command once the Azure Postgres data-access adapter lands.
5. Convert the manual job into a scheduled or event-triggered worker when the end-to-end message path is stable.
