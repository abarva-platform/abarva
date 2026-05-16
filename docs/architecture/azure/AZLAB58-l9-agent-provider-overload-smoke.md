# AZLAB58 - L9 Agent Provider Overload Smoke

Status: wired; live run pending after deploy  
Layer: L9 - Resilience / DR

## Purpose

AZLAB40, AZLAB50, and AZLAB51 prove the ingestion lane handles poison
Service Bus messages without blocking good uploads. The next L9 failure mode is
the model provider itself: Anthropic or the Azure-native Claude route can return
capacity errors such as HTTP 529.

This slice adds a guarded drill proving `/api/chat/agent` degrades to a clear,
non-mutating fallback instead of exposing a raw stream error to the CXO.

## What Changed

| Artifact | Purpose |
| --- | --- |
| `src/app/api/chat/agent/route.ts` | Adds a guarded provider-overload drill path and graceful fallback copy. |
| `scripts/resilience/agent-provider-overload-smoke.mjs` | Operator smoke that signs in as a demo user, invokes the drill, and asserts the fallback shape. |
| `npm run azure:agent-provider-overload:smoke` | Package command for local, CI, or Container Apps execution. |

## Guard Model

The drill is inert unless the caller supplies:

```text
x-abarva-l9-provider-drill-token: <token>
```

The token must match one of:

1. `L9_PROVIDER_OVERLOAD_DRILL_TOKEN`
2. `AZURE_CONNECTIVITY_HEALTH_TOKEN`
3. `INTERNAL_HEALTH_TOKEN`

That lets the Azure lab reuse the existing guarded health token without adding a
new secret before the next deploy.

## Expected User-Facing Degradation

The route still emits the context-bundle artifact first. It then simulates a
provider overload before the model call and writes a plain-language fallback:

```text
Sentinel is temporarily capacity-limited by the model provider, so I cannot
safely complete this turn with fresh reasoning right now.
I have not changed tenant data for Apex Retail Group. Keep this /intelligence
context open and retry in a moment; I will resume from the same tenant-grounded
surface.
```

The response must not include:

- `[stream error: ...]`
- provider stack traces
- simulated error internals
- any claim that data was written or a workflow advanced

## Operator Command

```bash
BASE='https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io'
TOKEN=$(az containerapp secret show \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --secret-name azure-connectivity-health-token \
  --query value -o tsv)

npm run azure:agent-provider-overload:smoke -- \
  --base-url "$BASE" \
  --drill-token "$TOKEN"
```

## Cutover Gate

Pass criteria:

- HTTP status is 2xx.
- Response includes the capacity-limited fallback.
- Response says tenant data was not changed.
- Response tells the user to retry/resume from the same surface.
- Response does not include raw stream-error or simulated-provider text.

## Current L9 State

| Failure mode | Evidence |
| --- | --- |
| Service Bus poison message | AZLAB40 dry-run drill. |
| Service Bus mixed good + poison batch | AZLAB51 live Azure pass. |
| Model provider overload | This AZLAB58 drill; live evidence to be captured after deploy. |
| Postgres disruption | Runbook/drill still pending. |
| PITR restore timing | Restore drill still pending. |
