# Azure Migration End-to-End Task and Status

Date: 2026-05-21
Status: Azure database/schema/data lane advanced; full app cutover not yet complete
Data posture: synthetic/no-client-data only
Synthetic tenant added in this pass: Northstar MedTech (`northstar-medtech`)

## Executive Status

AbarVa now has a working Azure private database lane for the lab: the Azure
Postgres schema is current, pending migrations have been applied inside the
Azure VNet, Northstar MedTech setup/context data has been copied into Azure,
and tenant data parity passes for Northstar.

This is not yet a production cutover. The remaining work is app-runtime parity:
prove that authenticated user flows, all four product surfaces, generated
artifacts, agent answers, notifications, and rollback behavior work against
Azure as the active data plane.

## Current Readiness by Area

| Area | Status | Evidence | Cutover meaning |
|---|---|---|---|
| Azure subscription and resource groups | Done | Subscription `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`; lab RGs live | Azure lab foundation exists. |
| Private Postgres target | Done | `pg-abarva-context-lab-001.postgres.database.azure.com`, private DNS/VNet only | DB target exists and is intentionally not reachable from public runners. |
| Key Vault DB secrets | Done | `kv-abarva-lab-001` has Azure Postgres URLs plus `source-postgres-database-url` | Jobs can read source and target DSNs without printing secrets. |
| Local env wiring | Done | `.env.local` contains `SOURCE_DATABASE_URL`, `TARGET_DATABASE_URL`, `AZURE_LAB_DATABASE_URL`, `ABARVA_AZURE_DATABASE_URL` | Local scripts know source vs target, but local machine cannot resolve private DB DNS. |
| GitHub workflow secrets | Done | Repo secrets present: `DATABASE_URL`, `TARGET_DATABASE_URL`, `AZURE_LAB_DATABASE_URL` | Workflows are configured, but public GitHub runners still cannot reach the private DB. |
| Fresh app/job image | Done | `acrabarvalab001.azurecr.io/abarva/web:lab-northstar-copy-20260521-r1` | Azure jobs can run current repo scripts. |
| Schema/migration gate | Done | Container Apps job `job-abarva-db-migrate-lab-eastus-fzlu85n` succeeded | Azure schema is current enough for app/data validation. |
| Northstar tenant source seed | Done | PR `#2196`, source DB verifier passed | Synthetic medtech tenant exists in source DB. |
| Northstar tenant Azure copy dry-run | Done | `job-abarva-db-copy-lab-eastus-6rv486i` succeeded | Copy plan was clean before write. |
| Northstar tenant Azure real copy + parity | Done | `job-abarva-db-copy-lab-eastus-0twobtq` succeeded | Northstar tenant rows are in Azure and parity passed. |
| CI/workflow automation | Mostly done | PR `#2197` added copy/parity workflows | Useful for orchestration, but private DNS requires VNet-connected execution for live Azure DB. |
| Authenticated app-surface parity | Not done | No authenticated browser/session run against Azure DB in this pass | Primary remaining cutover blocker. |
| Source/Moves/Intelligence/Tower functional parity | Not done for Northstar | Database rows copied; surfaces not yet crawled against Azure runtime | Need browser and API proof before cutover. |
| Artifact generation parity | Not done | No Azure-runtime export/deck generation pass yet | Needed because artifacts are core value proof. |
| Agent/model path parity | Not done | No Azure-runtime hard-question or agent-quality run for Northstar yet | Needed before saying CXO/VP workflows are ready. |
| Notifications/email parity | Not done | No Resend/notification delivery smoke against Azure runtime yet | Needed if alerts are part of pilot experience. |
| Rollback and freeze plan | Not done | No written cutover runbook with stop/go/rollback windows yet | Needed before switching traffic or customer demos to Azure data plane. |

## Latest Verified Azure Evidence

### Tenant Copy Job

Job: `job-abarva-db-copy-lab-eastus`

| Execution | Result | Purpose |
|---|---|---|
| `job-abarva-db-copy-lab-eastus-6rv486i` | Succeeded | Northstar dry-run copy inside Azure. |
| `job-abarva-db-copy-lab-eastus-0twobtq` | Succeeded | Northstar real copy plus parity verifier inside Azure. |

Northstar copied/parity counts:

| Table / metric | Count |
|---|---:|
| `clients` | 1 |
| `tenant_expected_baselines` | 14 |
| `data_inventory_segments` | 14 |
| `data_inventory_records` | 55 |
| `enterprise_context_chunks` | 55 |
| `enterprise_graph_nodes` | 34 |
| `enterprise_graph_edges` | 29 |
| `data_inventory_audit_log` | 14 |
| `data_ingestion_runs` | 1 |
| `source_events` | 0 |
| `engagements` | 0 |
| `kpis` | 0 |
| `pattern_packs` | 0 |

Interpretation: Northstar has the setup/context substrate needed to start
surface validation. It does not yet have Source events, engagement/program rows,
or KPI/pattern packs; those are not failures unless the pilot story requires
those workflows.

### Schema / Migration Job

Job: `job-abarva-db-migrate-lab-eastus`

Execution: `job-abarva-db-migrate-lab-eastus-fzlu85n`

Result: Succeeded

Applied pending migrations:

- `20260516180000_outcome_ledger.sql`
- `20260516200000_outcome_pattern_feedback.sql`
- `20260516220000_outcome_learning_context_writeback.sql`
- `20260516230000_artifact_disclosure_classification.sql`
- `20260517100000_sourcing_work_items.sql`
- `20260517190000_platform_notification_events.sql`
- `20260517210000_work_items_execution_room_kinds.sql`
- `20260518024500_platform_notification_deliveries.sql`
- `20260519120000_expert_reviews.sql`

Post-migration verifier summary:

| Metric | Count |
|---|---:|
| Applied migrations | 164 |
| Public tables | 242 |
| Storage buckets | 2 |
| Clients | 4 |
| Engagements | 48 |
| `enterprise_context_chunks` | 6,622 |
| `enterprise_graph_nodes` | 1,347 |
| `enterprise_graph_edges` | 1,597 |
| `source_events` | 23 |
| `gate_criteria` | 0 |
| `ai_initiatives_registry` | null |

Interpretation: Azure Postgres now includes the latest app schema for the
recent Moves, Source, Tower, notifications, execution-room, and expert-review
work. The `gate_criteria` and `ai_initiatives_registry` counts should be
treated as data-model follow-ups only if the pilot scenario depends on them.

## Critical Architecture Finding

Azure Postgres is private-DNS/VNet only. Local laptop commands and public GitHub
hosted runners cannot resolve:

```text
pg-abarva-context-lab-001.postgres.database.azure.com
```

That is expected for the target security posture. It means authoritative DB
migration, copy, and parity checks must run from a VNet-connected execution
environment, such as Azure Container Apps jobs, a self-hosted runner inside the
VNet, or a private operator host.

## End-to-End Migration Task Plan

### Phase 0 — Governance and Naming

| Task | Status | Owner | Notes |
|---|---|---|---|
| Confirm no real target-company name in repo/app/docs | Done | Engineering | Synthetic name is Northstar MedTech. |
| Confirm tenant key | Done | Engineering | `northstar-medtech`. |
| Document data posture | Done | Engineering | Synthetic/no-client-data only. |
| Define cutover acceptance gates | In progress | Founder + Engineering | This document is the current gate list. |

### Phase 1 — Azure Foundation

| Task | Status | Evidence / next action |
|---|---|---|
| Subscription access | Done | Azure CLI authenticated to `abarva-lab-sub`. |
| Resource groups | Done | Lab RGs are present. |
| Key Vault | Done | `kv-abarva-lab-001`. |
| ACR | Done | `acrabarvalab001`. |
| Container Apps jobs | Done | Migration/copy jobs exist and run. |
| Private Postgres | Done | `pg-abarva-context-lab-001`, private network. |
| Private DNS/VNet path | Done | Container Apps jobs can reach DB; local/public runners cannot. |
| Observability baseline | Existing lab capability | Needs fresh post-Northstar app-run evidence. |

### Phase 2 — Secrets and Environment Wiring

| Task | Status | Evidence / next action |
|---|---|---|
| Source DB secret in Key Vault | Done | `source-postgres-database-url`. |
| Azure Postgres URL secrets in Key Vault | Done | Control/context/audit URL secrets set. |
| Local `.env.local` source/target variables | Done | `SOURCE_DATABASE_URL`, `TARGET_DATABASE_URL`, `AZURE_LAB_DATABASE_URL`, `ABARVA_AZURE_DATABASE_URL`. |
| GitHub Actions target DB secrets | Done | `TARGET_DATABASE_URL`, `AZURE_LAB_DATABASE_URL`. |
| Runtime app secret projection | Needs verification | Confirm `ca-abarva-web-lab-eastus` is using the intended Azure DB secret for the candidate revision. |
| Secret rotation policy | Not done | Needed before customer/private-data pilot. |

### Phase 3 — Schema Migration

| Task | Status | Evidence / next action |
|---|---|---|
| Build current image with scripts/migrations | Done | `lab-northstar-copy-20260521-r1`. |
| Run Azure compatibility bootstrap | Done | Included in migration job. |
| Apply pending migrations | Done | 9 pending migrations applied on 2026-05-21. |
| Run schema verifier | Done | 164 migrations, 242 public tables. |
| Add recurring schema drift gate | Mostly done | Existing workflows/scripts; still need VNet-connected runner model for private DB. |
| Snapshot/backup before cutover | Not done | Required before traffic switch. |

### Phase 4 — Tenant Data Migration

| Task | Status | Evidence / next action |
|---|---|---|
| Add Northstar setup/context seed source files | Done | PR `#2196`. |
| Seed Northstar into source DB | Done | Source verifier passed. |
| Copy Northstar to Azure dry-run | Done | `job-abarva-db-copy-lab-eastus-6rv486i`. |
| Copy Northstar to Azure real run | Done | `job-abarva-db-copy-lab-eastus-0twobtq`. |
| Verify Northstar parity in Azure | Done | JSON parity status `pass`. |
| Add Northstar Source events / Moves case / Tower outcomes | Not done | Needed only if the Northstar demo must exercise full workflow, not just context readiness. |
| Define repeatable copy for all tenants | Mostly done | Script supports tenants; GitHub workflow exists, but use Container Apps for private DB. |

### Phase 5 — App Runtime on Azure

| Task | Status | Evidence / next action |
|---|---|---|
| Confirm active Azure app image is current | Not done | Need compare `ca-abarva-web-lab-eastus` image digest to `main`. |
| Confirm Azure app uses Azure DB | Not done | Verify runtime env secret reference. |
| `/api/health` against Azure app | Not done in this pass | Run once candidate revision is confirmed. |
| Authenticated Clerk/demo sign-in against Azure app | Not done | Requires valid session/demo auth flow. |
| Northstar tenant route/session resolution | Not done | Must verify active tenant selector and tenant scoping. |
| Surface crawl: Home | Not done | Must verify no missing/fabricated tenant content. |
| Surface crawl: Intelligence | Not done | Must verify grounded context or honest gaps. |
| Surface crawl: Moves | Not done | Must verify kernel/dossier behavior if Northstar use case exists. |
| Surface crawl: Source | Not done | Needs Source substrate if source queue/deal-room is expected. |
| Surface crawl: Tower | Not done | Needs outcomes/watch items if Tower value view is expected. |

### Phase 6 — Artifact and Agent Parity

| Task | Status | Evidence / next action |
|---|---|---|
| Moves artifact generation on Azure runtime | Not done | Generate/open all relevant decks/documents against Azure. |
| Source artifact generation on Azure runtime | Not done | Generate CXO report, deal pack, PPTX where Source event exists. |
| Expert review persistence | Schema ready | `expert_reviews` migration applied; need runtime test. |
| Source execution-room persistence | Schema ready | `sourcing_work_items` migrations applied; need runtime test. |
| Notification event persistence | Schema ready | Notification migrations applied; need runtime test. |
| Email/notification delivery | Not done | Requires Resend/provider route smoke and policy decision. |
| Agent hard-question run | Not done | Run Source/Moves adversarial prompts against Azure runtime. |
| No-fabrication assertions | Not done for Azure runtime | Need browser/API evidence. |

### Phase 7 — Security, Isolation, and Compliance

| Task | Status | Evidence / next action |
|---|---|---|
| DB private access | Done | Private DNS/VNet only. |
| RLS migration coverage | Existing lab capability | Need fresh run after latest migrations. |
| Cross-tenant API probes | Not done in this pass | Run SEC-P0 suite against Azure candidate revision. |
| Key Vault public manageability | Existing lab attention item | Close or waive before customer pilot. |
| Search/Service Bus public access posture | Existing lab attention item | Close or waive before customer pilot. |
| Secrets are not printed in logs | Mostly done | Scripts avoid printing DSNs; continue log audit. |
| SOC2/evidence export gate | Existing lab capability | Needs fresh run after cutover candidate. |

### Phase 8 — Performance, Resilience, and Cost

| Task | Status | Evidence / next action |
|---|---|---|
| App-to-Postgres latency baseline | Not done in this pass | Measure p50/p95 from Container Apps. |
| Primary surface load smoke | Existing lab capability | Needs fresh run on current candidate image/data. |
| Artifact route performance | App-side memo cache exists | Need Azure runtime timing for board-grade routes. |
| Postgres disruption drill | Existing lab capability | Repeat after current data/schema state. |
| Service Bus DLQ/mixed batch drill | Existing lab capability | Repeat only if event ingestion is in pilot scope. |
| Monthly cost baseline | Existing lab cost docs | Refresh after current resources/jobs/images. |

### Phase 9 — Cutover Readiness and Rollback

| Task | Status | Evidence / next action |
|---|---|---|
| Define cutover target | Not done | Decide: Azure lab only, pilot-only, or production data-plane switch. |
| Freeze window | Not done | Needed before final data sync. |
| Final source-to-target delta sync | Not done | Must run immediately before cutover. |
| Three consecutive parity runs | Not done | Required: authenticated and tenant-surface parity. |
| Rollback plan | Not done | Define DNS/env rollback, DB source-of-truth rollback, and data writes during rollback. |
| Founder/customer go/no-go checklist | Not done | Needed before any live pilot/customer-facing cutover. |

## Practical Next Steps

1. **Pin the candidate Azure app revision**
   - Verify the app image and env secret references for `ca-abarva-web-lab-eastus`.
   - If stale, update it to the same image used for the successful migration/copy jobs or a newer `main` image.

2. **Run the authenticated Azure app smoke**
   - `/api/health`
   - sign-in/demo auth
   - tenant resolution
   - Northstar tenant shell

3. **Run the four-surface Northstar crawl**
   - Home
   - Intelligence
   - Moves
   - Source
   - Tower
   - Save screenshots and observed gaps.

4. **Decide whether Northstar needs full workflow substrate**
   - If yes: add Northstar Moves use case, Source event, vendor/contracts, Tower outcomes, and notifications.
   - If no: keep Northstar as a context-layer migration proof only.

5. **Run artifact and agent verification**
   - Moves dossier/decks if a Northstar Move exists.
   - Source CXO/deal pack if a Northstar Source event exists.
   - Hard questions and no-fabrication checks.

6. **Run fresh isolation/performance gates**
   - SEC-P0 cross-tenant probes.
   - RLS regression.
   - primary-surface load smoke.
   - app-to-DB latency baseline.

7. **Write the cutover runbook**
   - freeze
   - final delta copy
   - go/no-go
   - rollback
   - owner assignments
   - exact commands.

## Recommended Definition of Done for Cutover

A cutover should not be called ready until all of these are true:

- Azure schema verifier passes on the final candidate DB.
- Tenant data parity passes for every pilot tenant.
- Authenticated browser parity passes for every primary surface.
- Source/Moves/Tower artifacts generate successfully on Azure runtime.
- Agent answers are grounded and no-fabrication checks pass.
- Cross-tenant isolation probes pass.
- Performance/load smoke meets demo/pilot thresholds.
- Notification/email behavior is either verified or explicitly disabled.
- A rollback plan exists and has been rehearsed at least once.
- The founder/customer-facing tenant names are synthetic or contract-approved.

## Current Bottom Line

The Azure migration has crossed the database-readiness threshold. Schema,
migrations, secrets, image supply chain, VNet execution, Northstar copy, and
Northstar parity are green.

The migration has not crossed the product-cutover threshold. The remaining
work is to prove the application and user workflows against Azure with real
authenticated sessions and artifact/agent outputs. That is the next critical
path.
