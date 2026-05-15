# AZLAB51 - L9 Live Mixed-Batch Evidence

Status: live Azure evidence captured  
Date: 2026-05-15  
Layer: L9 - Resilience / DR

## Purpose

AZLAB50 added the L9 mixed-batch drill. This record captures the first successful live Azure execution against the lab private data lane.

The drill proves that one malformed Service Bus ingestion message does not block a valid synthetic tenant-context upload from the same queue cycle.

## Live Environment

| Item | Value |
|---|---|
| Subscription | `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20` |
| Resource group | `rg-abarva-controlplane-lab-eastus` |
| Service Bus namespace | `sb-abarva-lab-eastus` |
| Queue | `q-context-ingestion-events` |
| Storage account | `stabarvaprivatedplab001` |
| Container | `context-drops` |
| Tenant key | `apex-retail` |
| Data posture | Synthetic lab data only; no PHI/PII/client data |
| Image tag | `acrabarvalab001.azurecr.io/abarva/web:lab-l9-mixed-batch-20260515-r3` |
| Image digest | `sha256:3e381bb075a9b2a2e65bc539fb6f5b5e83abe37caaf083bb696d46247d5a7b73` |
| Source commit | `88bcc4df4ab099f459e94d652421907ac9203476` |

## Pre-Live Findings Closed

Two defects surfaced before the successful live run:

| Finding | Symptom | Closure |
|---|---|---|
| Audit timestamp mismatch | Verifier queried `created_at`; `sensitive_upload_audit` uses `evaluated_at`. | PR #2006 changed the verifier to order by `evaluated_at desc`. |
| Safe-payload false positive | The synthetic run id included a long numeric suffix that satisfied the payment-card Luhn check, so the good payload was quarantined. | PR #2007 moved opaque run ids out of scanned blob body and kept them in metadata/message properties only. |

The false positive was useful: it proved the sensitive-upload guard is active in the live A2b path, not bypassed for smoke tests.

## Successful Run

| Step | Container Apps job | Execution | Result |
|---|---|---|---|
| Produce mixed batch | `job-a2b-smoke-send-eus` | `job-a2b-smoke-send-eus-ekwqgcb` | Succeeded |
| Process queue | `job-a2b-ingest-lab-eus` | `job-a2b-ingest-lab-eus-veahqes` | Succeeded |
| Verify audit + DLQ | `job-a2b-smoke-verify-eus` | `job-a2b-smoke-verify-eus-m69yjx6` | Succeeded |

Run id:

```text
l9-mixed-20260515231810
```

Producer evidence:

```json
{
  "status": "pass",
  "event": "l9_mixed_batch_messages_produced",
  "runId": "l9-mixed-20260515231810",
  "queueName": "q-context-ingestion-events",
  "tenantClientKey": "apex-retail",
  "storage": {
    "accountName": "stabarvaprivatedplab001",
    "containerName": "context-drops",
    "blobPath": "l9-mixed/l9-mixed-20260515231810/good-enterprise-profile.txt"
  },
  "messages": [
    "l9-mixed-20260515231810-good",
    "l9-mixed-20260515231810-poison"
  ]
}
```

Worker evidence:

```json
{"event":"ingestion_message_processed","messageId":"l9-mixed-20260515231810-good","status":"accepted","auditRowId":"547a4683-61c0-483c-8221-51882b6cbbd7","durationMs":136}
{"event":"ingestion_message_processed","messageId":"l9-mixed-20260515231810-poison","status":"rejected","auditRowId":null,"durationMs":0}
```

Verifier evidence:

```json
{
  "status": "pass",
  "event": "l9_mixed_batch_drill_verified",
  "runId": "l9-mixed-20260515231810",
  "queueName": "q-context-ingestion-events",
  "tenantClientKey": "apex-retail",
  "goodMessage": {
    "auditRowId": "547a4683-61c0-483c-8221-51882b6cbbd7",
    "finalDecision": "allow",
    "storagePath": "context-drops/l9-mixed/l9-mixed-20260515231810/good-enterprise-profile.txt"
  },
  "poisonMessage": {
    "messageId": "l9-mixed-20260515231810-poison",
    "deadLetterReason": "missing_tenantClientKey",
    "deadLetterErrorDescription": "missing_tenantClientKey",
    "completed": false
  }
}
```

## What This Proves

- The A2b worker can process a valid tenant-context message and a malformed poison message in the same queue cycle.
- The valid message reaches the private Blob path, sensitive-upload guard, Azure Postgres audit table, and normal completion path.
- The malformed message is isolated in Service Bus DLQ with a worker rejection reason, not retry exhaustion.
- DLQ evidence and Postgres audit evidence reconcile by the same run id.
- The live path uses managed Azure services: Blob, Service Bus, Container Apps Jobs, managed identity, and Azure Postgres.

## Post-Drill Restoration

After evidence capture, the three A2b smoke jobs were restored to their normal e2e smoke commands:

| Job | Restored command | Restored image |
|---|---|---|
| `job-a2b-smoke-send-eus` | `npx tsx src/scripts/azure-ingestion-e2e-smoke.ts` | `lab-eventgrid-normalizer-20260515-r1` |
| `job-a2b-ingest-lab-eus` | `npx tsx src/scripts/azure-context-ingestion-worker.ts` | `lab-eventgrid-normalizer-20260515-r1` |
| `job-a2b-smoke-verify-eus` | `npx tsx src/scripts/azure-ingestion-e2e-smoke.ts` | `lab-eventgrid-normalizer-20260515-r1` |

## Remaining L9 Work

This closes the Service Bus mixed-batch live evidence item. Remaining L9 resilience work:

- LLM provider overload / 529 fallback simulation.
- Postgres private endpoint disruption drill.
- PITR restore timing and smoke verification.
- A scheduled cadence for keeping DLQ drills clean, including optional completion of inspected DLQ evidence messages after export.
