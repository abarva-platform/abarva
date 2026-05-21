# Azure Cutover QA Run

Date: 2026-05-21
Target: `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
Revision: `ca-abarva-web-lab-eastus--0000036`
Image: `acrabarvalab001.azurecr.io/abarva/web:lab-northstar-copy-20260521-r1`
Data plane: `ABARVA_DATA_PLANE=azure-postgres`

## Executive Status

The Azure lab app is deployed on the current migration image and is reading
from Azure Postgres. The database, schema, Northstar tenant copy, primary
authenticated surfaces, core Moves artifacts, Source artifacts, Source
deterministic agent path, SEC-P0 cross-tenant probes, resource parity,
observability, connectivity smoke, and protected-surface load smoke are green.

This is still a lab cutover candidate, not a final customer cutover. The
remaining blockers are customer-pilot hardening items: security attention items
around public/local-auth posture for Service Bus/Search/Key Vault/Cosmos and
full Northstar workflow substrate if Northstar must demonstrate end-to-end
Source/Moves/Tower rather than context migration only. The final
freeze/delta/rollback runbook is now authored, but it has not been rehearsed
against a real customer cutover window.

## Progress by Category

| Category | Status | Percent | Evidence | Remaining |
|---|---:|---:|---|---|
| Azure app deploy | Pass | 100% | Active revision `ca-abarva-web-lab-eastus--0000036`; image `lab-northstar-copy-20260521-r1` | None for lab. |
| Runtime DB wiring | Pass | 100% | `/api/health` returned `postgres=true`, `direct_postgres=true`; `DATABASE_URL` secretRef is `azure-postgres-control-database-url` | None for lab. |
| Schema migration | Pass | 100% | Migration job `job-abarva-db-migrate-lab-eastus-fzlu85n` succeeded; 9 pending migrations applied; verifier showed 164 migrations and 242 public tables | None for lab. |
| Northstar tenant data | Pass | 100% for context layer | Copy job `job-abarva-db-copy-lab-eastus-0twobtq` succeeded; parity pass with 14 segments, 55 records, 55 chunks, 34 graph nodes, 29 edges | Add Source/Moves/Tower workflow rows only if Northstar must demo full journey. |
| Resource parity | Pass | 100% | `npm run azure:resource:parity`: 37 pass, 0 attention, 0 fail | None. |
| Observability | Pass | 100% | `npm run azure:observability:audit`: 13 pass, 0 attention, 0 fail; web app projects `APPLICATIONINSIGHTS_CONNECTION_STRING`; App Insights is workspace-backed | None. |
| Security posture | Attention | 80% | `npm run azure:security:audit`: 85 pass, 9 attention, 0 fail; detailed close plan in `AZURE-SECURITY-HARDENING-BACKLOG-2026-05-21.md` | Close/waive Service Bus public access/local auth, Key Vault public manageability, Search public/API-key auth, Cosmos local auth, broad RBAC scopes. |
| Authenticated surface QA | Pass | 100% for existing demo tenants | Playwright matrix passed 15/15 across Apex, Meridian, First Capital after updating stale Source assertion to the Decision Queue front door. | Add Northstar browser tenant once a Northstar login/session path exists. |
| Source front door QA | Pass | 100% | `/source` renders Decision Queue for Apex/Meridian/First Capital with grounded vendor-contract cards. | Old E2E expected `Sourcing events`; test contract updated. |
| Protected-surface load smoke | Pass | 100% for current lab threshold | 117 requests, 0 errors, 0 non-2xx, p95 1016.6ms across `/home`, `/intelligence`, `/strategic-moves`, `/source`, `/tower` after revision `0000036`. | Broaden duration/concurrency before real pilot. |
| SEC-P0 cross-tenant isolation | Pass | 100% | 8/8 probes passed against Azure app with Apex session probing Meridian. | Store durable Azure cookie secret or automated cookie mint for scheduled workflow. |
| Moves artifact generation | Pass | 100% for Apex board-grade artifacts | 8/8 board-grade HTML decks returned status 200 with deck content; business-case PPTX returned status 200 and ZIP/PPTX magic `504b0304`. | Northstar-specific artifacts require Northstar Moves case substrate. |
| Source artifact generation | Pass | 100% for seeded Apex AMS event | CXO HTML, CXO PPTX, Deal Pack all returned status 200; PPTX magic `504b0304`. | Store Ops hard event not available in Azure copied set; AMS event is the live Azure seed. |
| Source agent route | Pass | 80% | `/api/v1/source/apex-retail-ams-outsourcing-2026/nexus/ask` returned 200 and evidence-aware deterministic response. | Response is `noModel=true`; live Claude/provider path still needs separate model-enabled run. |
| Connectivity smoke | Pass | 100% with logs | `job-azure-connectivity-smoke-eus-vyhijgl` succeeded; logs show Postgres, Blob, Service Bus, Key Vault, and Azure AI Search all passed. | None for lab. |
| Final cutover runbook | Pass | 100% authored / 0% rehearsed | `AZURE-CUSTOMER-CUTOVER-RUNBOOK-2026-05-21.md` defines freeze, final delta, go/no-go, rollback, owners, and evidence gates. | Rehearse before customer traffic switch. |

## Commands / Evidence

### Deploy

```bash
az containerapp update \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --image acrabarvalab001.azurecr.io/abarva/web:lab-northstar-copy-20260521-r1
```

Result:

```text
latestRevision = ca-abarva-web-lab-eastus--0000035
traffic = 100%
```

Follow-up observability update:

```bash
az containerapp secret set \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --secrets appinsights-connection-string=<Application Insights connection string>

az containerapp update \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --set-env-vars APPLICATIONINSIGHTS_CONNECTION_STRING=secretref:appinsights-connection-string
```

Result:

```text
latestRevision = ca-abarva-web-lab-eastus--0000036
APPLICATIONINSIGHTS_CONNECTION_STRING = secretRef(appinsights-connection-string)
```

### Health

```bash
curl https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io/api/health
```

Result:

```json
{
  "ok": true,
  "checks": {
    "postgres": true,
    "direct_postgres": true,
    "neo4j": "skipped"
  }
}
```

### Authenticated Surface Matrix

```bash
BASE_URL=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts \
  --project=chromium --workers=1
```

Result:

```text
15 passed
```

### Load Smoke

```bash
npm run azure:load:primary-surfaces -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --duration-seconds 60 \
  --concurrency 3 \
  --require-2xx \
  --p95-target-ms 10000 \
  --cookie-refresh-seconds 0 \
  --paths /home,/intelligence,/strategic-moves,/source,/tower
```

Result:

```text
status=pass
totalAttempts=117
statusCounts.200=117
errorRate=0
p95Ms=1016.6
```

### Observability

```bash
npm run azure:observability:audit
```

Result:

```text
status=pass
summary.pass=13
summary.attention=0
summary.fail=0
web app env binding=APPLICATIONINSIGHTS_CONNECTION_STRING
App Insights workspace-backed=true
```

Note: the audit script previously queried the wrong App Insights property
casing. Azure already returned a workspace resource ID under
`workspaceResourceId`; the script has been corrected to read that property.

### Connectivity Smoke

Execution:

```text
job-azure-connectivity-smoke-eus-vyhijgl
```

Result:

```text
status=pass
postgres: SELECT 1 succeeded
blob: put/get/delete succeeded on context-drops/connectivity-smoke/azlab26-20260515170529.txt
service_bus: send/receive succeeded on q-connectivity-smoke
key_vault: secret read succeeded for azure-connectivity-smoke-secret
ai_search: count query succeeded on tenant-context-v1: 6567
```

### SEC-P0

```bash
ABARVA_PROBE_BASE_URL=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
ABARVA_PROBE_COOKIE_HEADER=<Apex Azure cookie header> \
ABARVA_PROBE_OTHER_TENANT_ID=a20ecef5-f0ea-4890-b9d5-7375fab223ff \
ABARVA_PROBE_OTHER_TENANT_KEY=meridian-health \
  bash tests/security/sec-p0-cross-tenant-probes.sh
```

Result:

```text
8 passed, 0 failed
```

### Moves Artifact QA

Authenticated requests to:

- `/api/v1/moves/board-grade-business-case`
- `/api/v1/moves/board-grade-discover-brief`
- `/api/v1/moves/board-grade-solution-architecture`
- `/api/v1/moves/board-grade-estimate-model`
- `/api/v1/moves/board-grade-mobilize-packet`
- `/api/v1/moves/board-grade-charter-skeleton`
- `/api/v1/moves/board-grade-cfo-pack`
- `/api/v1/moves/board-grade-master-dossier`
- `/api/v1/moves/board-grade-business-case?format=pptx`

Result:

```text
8 HTML decks: status=200, deck=true
Business-case PPTX: status=200, magic=504b0304
```

### Source Artifact QA

Seeded Azure Source slug:

```text
apex-retail-ams-outsourcing-2026
```

Authenticated requests:

- `/api/v1/source/apex-retail-ams-outsourcing-2026/cxo-report?format=html`
- `/api/v1/source/apex-retail-ams-outsourcing-2026/cxo-report?format=pptx`
- `/api/v1/source/apex-retail-ams-outsourcing-2026/deal-pack`

Result:

```text
CXO HTML: status=200
CXO PPTX: status=200, magic=504b0304
Deal Pack HTML: status=200
```

### Source Agent QA

Request:

```text
POST /api/v1/source/apex-retail-ams-outsourcing-2026/nexus/ask
prompt: What is the next sourcing action and what evidence blocks award readiness?
```

Result:

```text
status=200
answerStatus=blocked
noModel=true
missing inputs named:
- BAFO responses received
- Final pricing comparison approved
- Award recommendation approved
```

## Fix Made During QA

The product now correctly uses Source Decision Queue as the `/source` front
door. The existing Playwright matrix still expected the old `Sourcing events`
H1. The test was updated to assert the new contract:

```text
heading: /decisions need your attention/i
```

This is a QA contract correction, not a product change.

## Remaining Work Before Declaring Customer Cutover Ready

1. Close or explicitly waive the 9 security attention items.
2. Add a durable Azure authenticated cookie workflow or automated cookie mint
   for scheduled SEC-P0 and agent-quality jobs.
3. Run live model-enabled agent quality, not only deterministic fallback.
4. Add Northstar full-workflow substrate if it must be a real client demo:
   Source event, Moves case, Tower outcomes, artifacts, notifications.
5. Rehearse the final cutover runbook:
   freeze, final delta copy, go/no-go, rollback, owner sign-off.
