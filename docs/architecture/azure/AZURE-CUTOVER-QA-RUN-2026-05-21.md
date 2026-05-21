# Azure Cutover QA Run

Date: 2026-05-21
Target: `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
Revision: `ca-abarva-web-lab-eastus--0000042`
Image: `acrabarvalab001.azurecr.io/abarva/web:lab-l7-clear-c-20260521-r5`
Data plane: `ABARVA_DATA_PLANE=azure-postgres`

## Executive Status

The Azure lab app is deployed on the current migration image and is reading
from Azure Postgres. The database, schema, Northstar tenant copy, primary
authenticated surfaces, core Moves artifacts, Source artifacts, Source
deterministic agent path, SEC-P0 cross-tenant probes, resource parity,
observability, connectivity smoke, protected-surface load smoke, and the L7
50-case multi-agent live quality gate are green.

Final cutover QA update, 2026-05-21 15:26 Central: the remaining data-plane
checks have now been run from inside Azure Container Apps. Event Grid ingestion
passed end-to-end with exactly one safe allow row and one sensitive quarantine
row, runtime persistence passed for `expert_reviews`, `sourcing_work_items`,
`platform_notification_events`, and `platform_notification_deliveries`, the
Service Bus active and dead-letter queues are clean, Azure schema verification
passed, and all four tenant data-parity profiles now pass after adding the
missing First Capital Source-event substrate.

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
| Azure app deploy | Pass | 100% | Active revision `ca-abarva-web-lab-eastus--0000042`; image `lab-l7-clear-c-20260521-r5`; digest `sha256:572a2d0d1bb48d4959e4dec6129537c258e8ad8bf97d39957bae51598a101d3a` | None for lab. |
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
| Multi-agent live QA | Pass | 100% at strict C gate | Full 50-case live `/api/chat/agent` baseline after revision `0000042`: 50 pass, 0 fail, grades A:40, B:10, C:0, D:0, F:0, 0 blocking failures at `--fail-on-grade C`. Source targeted rerun passed 10/10 A. | B-level citation/evidence polish remains before A-only board demos. |
| Connectivity smoke | Pass | 100% with logs | `job-azure-connectivity-smoke-eus-vyhijgl` succeeded; logs show Postgres, Blob, Service Bus, Key Vault, and Azure AI Search all passed. | None for lab. |
| Event Grid ingestion smoke | Pass | 100% | Fresh run `cutover-eventgrid-20260521144452`; send `job-a2b-smoke-send-eus-5opibrf`, ingest `job-a2b-ingest-lab-eus-k61nztw`, verify `job-a2b-smoke-verify-eus-i4ltqew`; active queue=0, DLQ=0 after stale lab-message purge. | None for lab; keep DLQ monitor enabled. |
| Runtime persistence smoke | Pass | 100% | `job-a2b-smoke-verify-eus-ssdvdgq` on image `cutover-runtime-smoke-exact-20260521144932`: 10 pass, 0 fail; transaction-tested expert reviews, Source work items, notification events/deliveries, and exact ingestion audit rows. | Promote the new smoke script into main so this remains repeatable. |
| Tenant data parity | Pass | 100% | `job-a2b-smoke-verify-eus-z9p9rtz`: Apex, Meridian, First Capital, Northstar all pass. First Capital fixed from 2/5 to 5/5 Source events with seed run `job-a2b-smoke-verify-eus-l2aweep`. | None for lab. |
| Final cutover runbook | Pass | 100% authored / 0% rehearsed | `AZURE-CUSTOMER-CUTOVER-RUNBOOK-2026-05-21.md` defines freeze, final delta, go/no-go, rollback, owners, and evidence gates. | Rehearse before customer traffic switch. |

## Final QA Addendum — 2026-05-21

### Runtime Persistence Smoke

Command path:

```bash
npm run azure:cutover:runtime-smoke -- --ingestion-smoke-run-id cutover-eventgrid-20260521144452
```

Azure execution:

```text
Image: acrabarvalab001.azurecr.io/abarva/web:cutover-runtime-smoke-exact-20260521144932
Digest: sha256:9f413d91bd0dc114abbb270d7ad6a1e10dd14d1e36a108024ac727abc286ad22
Execution: job-a2b-smoke-verify-eus-ssdvdgq
Result: pass
Checks: 10 pass, 0 fail
Committed synthetic rows: false
```

Validated:

- `expert_reviews` table exists and supports append-only insert/read.
- `sourcing_work_items` table exists and supports Source action-layer insert/read.
- `platform_notification_events` table exists and supports operating-signal insert/read.
- `platform_notification_deliveries` table exists and supports delivery audit insert/read.
- `sensitive_upload_audit` table exists.
- Ingestion run `cutover-eventgrid-20260521144452` has exactly one `safe=allow`
  row and exactly one `sensitive=quarantine` row.

### Event Grid Ingestion Smoke

Fresh run:

```text
Run id: cutover-eventgrid-20260521144452
Producer: job-a2b-smoke-send-eus-5opibrf
Ingest worker: job-a2b-ingest-lab-eus-k61nztw
Verifier: job-a2b-smoke-verify-eus-i4ltqew
Result: pass
```

The correct mode for this smoke is `INGESTION_SMOKE_SEND_CANONICAL=false`.
Blob upload triggers Event Grid into Service Bus. Turning canonical sends on
also sends duplicate Service Bus messages and correctly fails the strict
one-row-per-case verifier.

Service Bus queue hygiene after stale lab-message purge:

```json
{
  "active": 0,
  "deadletter": 0
}
```

### Data Parity

First Capital initially failed the data-parity gate because Azure had only two
persisted `source_events` for the tenant while the cutover threshold is five.
The fix was additive and synthetic-only:

```text
Script: npm run seed:source-events:first-capital
Azure execution: job-a2b-smoke-verify-eus-l2aweep
Inserted/upserted: 3 First Capital source events
Total First Capital source_events: 5
```

Rerun result:

```text
Execution: job-a2b-smoke-verify-eus-z9p9rtz
Apex Retail: pass
Meridian Health: pass
First Capital: pass, sourceEvents 5 / min 5
Northstar MedTech: pass
```

## Commands / Evidence

### Deploy

```bash
az containerapp update \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --image acrabarvalab001.azurecr.io/abarva/web:lab-l7-clear-c-20260521-r5
```

Result:

```text
latestRevision = ca-abarva-web-lab-eastus--0000042
latestReadyRevision = ca-abarva-web-lab-eastus--0000042
image digest = sha256:572a2d0d1bb48d4959e4dec6129537c258e8ad8bf97d39957bae51598a101d3a
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

Final live Source agent-quality baseline:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --agent source \
  --out /tmp/azure-agent-quality-live-source-after-core-final-fix.jsonl \
  --fail-on-grade C
```

Result:

```text
total=10
pass=10
fail=0
blockingFailures=0
grades=A:10,B:0,C:0,D:0,F:0
```

Interpretation: the live Source model path works through `/api/chat/agent` and
all Source cases are now A-grade under the strict C gate.

### Final Full Multi-Agent Agent Quality Baseline

Final full 50-case run:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --out /tmp/azure-agent-quality-live-50-final-no-c-after-source-core-fix.jsonl \
  --fail-on-grade C
```

```text
total=50
pass=50
fail=0
blockingFailures=0
grades=A:40,B:10,C:0,D:0,F:0
```

By agent:

| Agent | Total | Pass | Fail | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Atlas | 10 | 10 | 0 | 9 | 1 | 0 | 0 | 0 |
| Nexus | 10 | 10 | 0 | 9 | 1 | 0 | 0 | 0 |
| Sentinel | 10 | 10 | 0 | 5 | 5 | 0 | 0 | 0 |
| Source | 10 | 10 | 0 | 8 | 2 | 0 | 0 | 0 |
| Steward | 10 | 10 | 0 | 9 | 1 | 0 | 0 | 0 |

Interpretation: live model execution is proven across Sentinel, Atlas, Nexus,
Source, and Steward with no C/D/F blockers under the strict C gate. B-level
citation/evidence polish remains, but the lab agent path is pilot-safe for the
current L7 threshold. Full detail is recorded in
`AZURE-L7-MULTI-AGENT-QUALITY-LIVE-BASELINE-2026-05-21.md`.

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
3. Improve the 10 remaining B-level live agent-quality rows if the next bar is
   A-only board-demo quality; there are no C/D/F blockers left under the current
   strict C gate.
4. Add Northstar full-workflow substrate if it must be a real client demo:
   Source event, Moves case, Tower outcomes, artifacts, notifications.
5. Rehearse the final cutover runbook:
   freeze, final delta copy, go/no-go, rollback, owner sign-off.
