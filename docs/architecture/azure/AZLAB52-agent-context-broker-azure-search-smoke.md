# AZLAB52 - AgentContextBroker Azure Search Retrieval Smoke

Date: 2026-05-15  
Scope: L4/L7 retrieval cutover proof for the Azure lab  
Data posture: synthetic setup/context data only

## Executive Read

AZLAB52 closes the first live proof that the AgentContextBroker can retrieve tenant context from Azure AI Search instead of the current pgvector/Supabase lane. The broker adapter and feature flag already existed; this slice adds an operator smoke command, validates all three canonical tenants against live `tenant-context-v1`, and hardens the Azure retriever so legacy demo labels are normalized before chunks reach Sentinel, Nexus, Source, Atlas, or Steward.

This does not flip the feature flag. `retrieval_azure_search` remains off by default for every tenant. The point of this lab step is to prove the Azure retrieval lane is queryable, tenant-filtered, and safe to test in a controlled tenant-by-tenant rollout.

## What Changed

| Area | Change |
|---|---|
| Operator smoke | Added `npm run azure:search:retriever-smoke` for repeatable live checks against `tenant-context-v1`. |
| Smoke behavior | Supports `--tenant`, `--top-k`, and `--require-results`; exits non-zero when any required tenant returns zero hits or errors. |
| Auth posture | Supports lab admin key and RBAC/AAD via `DefaultAzureCredential`; no secrets are printed. |
| Broker safety | Azure Search retriever now normalizes legacy demo labels (`Asterline`, `Heliara`, `Brindlemark`) before returning chunks to the broker. |
| Regression test | Added a parity test proving legacy labels are removed from `text`, `sourceDoc`, and `sourceBasis` before broker consumption. |

## Live Azure Evidence

Command shape:

```bash
AZURE_SEARCH_SERVICE_NAME=srch-abarva-context-lab-eastus \
AZURE_SEARCH_ADMIN_KEY=<redacted> \
npm run azure:search:retriever-smoke -- \
  --require-results \
  --top-k 3 \
  "What do you know about my IT leadership team and budget?"
```

Result summary:

| Tenant | Result | Hits | Evidence |
|---|---:|---:|---|
| Apex Retail | Pass | 3 | Retrieved CIO/program sponsor and COO/CFO discovery context. Legacy `Asterline Retail` text was normalized to `Apex Retail`. |
| Meridian Health | Pass | 3 | Retrieved healthcare sponsor/program context, including Anita-specific discovery context. |
| First Capital | Pass | 3 | Retrieved CIO/program sponsor context. Legacy `Brindlemark Financial` text was normalized to `First Capital Financial`. |

Final smoke event:

```json
{
  "event": "azure_search_retriever_smoke_passed",
  "index": "tenant-context-v1",
  "topK": 3,
  "requireResults": true,
  "tenants": [
    { "tenant": "apex-retail", "hitCount": 3, "ok": true },
    { "tenant": "meridian-health", "hitCount": 3, "ok": true },
    { "tenant": "first-capital", "hitCount": 3, "ok": true }
  ]
}
```

## Design Guardrails

| Guardrail | Status |
|---|---|
| Tenant filter is mandatory | Covered by `retriever-parity.test.ts`; every query includes `tenant_key eq '<canonical>'`. |
| Legacy tenant aliases are accepted on input | Covered by canonicalization tests (`apexretail -> apex-retail`, `meridian -> meridian-health`, `arcturus -> first-capital`). |
| Feature flag remains default-off | Covered by tests; no production behavior changed. |
| Azure failure falls back to pgvector | Covered by `broker-azure-search-dispatch.test.ts`. |
| Legacy demo labels do not reach agents | New AZLAB52 parity test plus live smoke excerpts. |

## Validation

| Check | Result |
|---|---|
| `npm run test:behaviors -- --testPathPatterns=src/lib/azure-search/__tests__/retriever-parity.test.ts` | Pass: 27/27 tests. Existing duplicate Jest mock warnings are unrelated. |
| `npx eslint src/lib/azure-search/tenant-context-retriever.ts src/lib/azure-search/__tests__/retriever-parity.test.ts src/scripts/azure-search-retriever-smoke.ts` | Pass. |
| `npx tsc --noEmit -p tsconfig.json` | Pass. |
| Live Azure Search smoke across Apex/Meridian/First Capital | Pass. |

## Cutover Meaning

This moves the Azure cutover from "index populated" to "retriever proven." It is still not a full retrieval cutover because the app has not run authenticated Sentinel/Nexus/Source turns with `retrieval_azure_search` enabled in the Azure-hosted runtime.

Next required proof:

1. Enable `retrieval_azure_search` for one synthetic tenant in lab only.
2. Run an authenticated `/api/chat/agent` or UI Sentinel question against Azure lab.
3. Confirm answer context is tenant-correct and no pgvector fallback tag is present.
4. Add the same assertion to the L7 live runner and L4 broker isolation checks.

