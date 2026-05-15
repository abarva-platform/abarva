# AZLAB40 - L9 Service Bus DLQ Drill

Date: 2026-05-15  
Status: wired, dry-run validated  
Layer: L9 resilience / DR

## Why This Exists

The A2b context-ingestion lane depends on Service Bus. A common failure mode in event-driven systems is a poison message that blocks the queue or crashes the worker loop. AbarVa needs a repeatable drill proving malformed ingestion messages are isolated into the dead-letter queue while good messages can continue.

This slice adds an operator drill for the existing `q-context-ingestion-events` queue.

## Artifact

| Artifact | Purpose |
|---|---|
| `src/scripts/azure-servicebus-dlq-drill.ts` | Produces and verifies one malformed ingestion message. |
| `npm run azure:servicebus:dlq-drill` | Operator command for Azure Service Bus. |

## Drill Sequence

Generate a run id:

```bash
RUN_ID="l9-dlq-$(date +%Y%m%d%H%M%S)"
```

Produce one poison message:

```bash
npm run azure:servicebus:dlq-drill -- --mode produce --run-id "$RUN_ID"
```

Run the A2b ingestion worker once:

```bash
npx tsx src/scripts/azure-context-ingestion-worker.ts
```

Verify the poison message landed in the dead-letter queue:

```bash
npm run azure:servicebus:dlq-drill -- --mode verify --run-id "$RUN_ID"
```

By default the verifier abandons the matching DLQ message so it remains available for inspection. To clear it after verification:

```bash
npm run azure:servicebus:dlq-drill -- \
  --mode verify \
  --run-id "$RUN_ID" \
  --complete-dlq-message
```

## Dry Run

```bash
npm run azure:servicebus:dlq-drill -- --dry-run
```

## Required Environment

One of:

- `SERVICE_BUS_CONNECTION_STRING`
- or managed identity with `SERVICE_BUS_NAMESPACE` / `SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE`

Optional:

- `SERVICE_BUS_QUEUE_NAME` (defaults to `q-context-ingestion-events`)
- `AZURE_CLIENT_ID` for user-assigned managed identity

## Pass Criteria

The verifier must return JSON with:

- `status: "pass"`
- the same `runId`
- `event: "l9_dlq_drill_verified"`
- a non-empty `deadLetterReason`
- `deadLetterReason` must not be `MaxDeliveryCountExceeded`; the message should be rejected by the worker as malformed, not merely retried until exhaustion

## Current Limit

This proves the malformed-message DLQ path. It does not yet run a full mixed batch proving one poison message and one good message in the same queue cycle leaves the good message accepted. That is the next resilience hardening.

## Next L9 Controls

| Next control | Why |
|---|---|
| Mixed good+poison batch drill | Proves poison isolation does not delay good uploads. |
| LLM provider overload simulation | Proves Sentinel/agent UI degrades gracefully on provider 529s. |
| Postgres disruption runbook | Proves read-only/cached degradation path instead of raw 500s. |
| PITR restore drill | Measures actual RTO/RPO, not aspirational targets. |
