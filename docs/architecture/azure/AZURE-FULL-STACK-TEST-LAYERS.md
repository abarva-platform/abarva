# AbarVa Azure Full-Stack Test Layers

Status: stand-up operating model as of 2026-05-15  
Scope: Azure lab, parallel-run migration, and first customer private-data-lane readiness  
Posture: synthetic data only; no PHI, PII, or real customer data in the lab

## Executive Read

The Azure lab should be judged by eleven test layers. The bottom four block deploy, the middle four block pilot, and the top three are continuous controls. Each layer needs a concrete artifact: a workflow, script, route, SQL test, k6 scenario, dashboard, or Azure-native check. Generic "we will add tests" does not survive an enterprise stand-up.

Current state: the lab has real Azure services live through AZLAB25: Container Apps, ACR, Key Vault, private Postgres, Blob Storage, Service Bus, Event Grid, Azure AI Search, Cosmos Gremlin, Log Analytics, App Insights, cost budget, and the A2b ingestion worker. The remaining work is not "stand up Azure"; it is gating the stack with repeatable tests that prove private connectivity, tenant isolation, data integrity, pilot workflows, agent quality, and operability.

## Gate Model

| Tier | Layers | Blocks | Exit standard |
|---|---|---|---|
| Deploy gate | L1-L4 | Any Azure app cutover or credible parallel run | Fresh RG deploys, private connectivity is proven, no public access on private resources, cross-tenant probes are green. |
| Pilot gate | L5-L8 | First paid enterprise pilot | Migrations/seeds are reproducible, tenant workflows pass, agents pass golden/adversarial QA, load stays inside latency and cost budgets. |
| Continuous gate | L9-L11 | Production operation and renewal trust | Resilience drills, audit evidence, SLOs, traces, and cost alerts run continuously and produce exportable evidence. |

## Layer Matrix

| Layer | What it proves | Live artifacts today | Missing gate | Status |
|---|---|---|---|---|
| L1 Infrastructure / IaC | The three-lane topology deploys cleanly to a fresh subscription/RG. Expected resources exist, no orphans. | `infra/azure/**`, `scripts/azure/verify-resource-parity.mjs`, `.github/workflows/azure-l1-resource-parity.yml`, `.github/workflows/azure-l1-bicep-whatif.yml`, `docs/architecture/azure/AZLAB*.md`, `docs/architecture/azure/CURRENT-STATE.md` | Run parity/what-if through GitHub OIDC, add expected-change parsing, then add ephemeral RG deploy/teardown. | Partial |
| L2 Connectivity / private endpoint reachability | Container Apps can reach private Postgres, Blob, Service Bus, Key Vault, and Search through intended lanes; public clients cannot reach private data resources. | `/api/health` direct Postgres probe; AZLAB20, AZLAB22, AZLAB23, AZLAB25 live job evidence; AZLAB26 positive-path smoke across Postgres/Blob/Service Bus/Key Vault/Search | Add negative public-path test to prove private resources fail by network/firewall, not only auth. | Partial |
| L3 Security: network + identity | Private data resources are not public; managed identities are least-privilege; secrets are Key Vault refs, not literals. | Key Vault env projection in AZLAB16; Defender baseline; ACR managed identity pull; `scripts/azure/audit-lab-security.mjs`; AZLAB27 live run: 67 pass, 9 attention, 0 fail | Add gitleaks workflow and rotation drill; close 9 advisory attention items before pilot strict mode. | Partial |
| L4 Multi-tenant isolation | Tenant A cannot read tenant B via API, RLS, broker, or UI. | `.github/workflows/sec-p0-post-deploy.yml`, `tests/security/sec-p0-cross-tenant-probes.sh`, `tests/e2e/primary-surfaces-smoke.spec.ts`; AZLAB28 adds `azure-lab` workflow target; AZLAB52 proves Azure Search retriever tenant-filtering and legacy-label normalization before broker consumption | Load Azure-host session secrets and run SEC-P0 against Azure FQDN; add authenticated broker response tenant-key assertion with `retrieval_azure_search` enabled for one lab tenant. | Partial |
| L5 Data integrity | Migrations and seeds replay to a fresh DB; drift is visible; backup/restore works. | `.github/workflows/migration-drift-*.yml`, `.github/workflows/azure-l5-reset-replay.yml`, `.github/workflows/azure-l5-data-parity.yml`, `src/scripts/bootstrap-azure-postgres-compat.ts`, `src/scripts/copy-tenant-context-to-azure.ts`, `src/scripts/verify-azure-postgres-schema.ts`, `src/scripts/verify-azure-tenant-data-parity.ts` | Run the data-parity gate live after copy/restore and add weekly PITR restore drill. | Partial |
| L6 Functional E2E | Each tenant can sign in, navigate Home/Intelligence/Moves/Source/Tower, complete one workflow, and sign out. | `tests/e2e/primary-surfaces-smoke.spec.ts`, `tests/e2e/primary-surfaces-tenant-matrix.spec.ts`, `.github/workflows/azure-l6-primary-surfaces.yml` | Run Azure-host live matrix, then add workflow-level specs: Origination, Move gate, Source evidence ledger, Tower decision pack, screenshot baselines. | Partial |
| L7 Agent quality | Sentinel, Atlas, Nexus, Source, and Steward stay grounded, in-voice, internally consistent, and safe under adversarial prompts. | `docs/agent-quality/SENTINEL-CONSISTENCY-GUARD-EXPANSION.md`, existing Sentinel voice tests, `tests/agent-quality/golden/*.jsonl`, `npm run qa:agent-quality:corpus`, `npm run qa:agent-quality:runner`, `.github/workflows/agent-quality-corpus.yml`, `.github/workflows/agent-quality-live-runner.yml`, `agent_quality_violation_events`, `npm run azure:agent-quality:telemetry-smoke`, C5 pilot dashboard guard telemetry, `npm run azure:search:retriever-smoke`; AZLAB37, AZLAB43, AZLAB44, AZLAB45, AZLAB46, AZLAB47, AZLAB48, AZLAB49, AZLAB52 | Live Azure/prod baseline run after AGENT_QUALITY_SESSION_COOKIE is set; add a run variant with `retrieval_azure_search` enabled and stored answer artifacts. | Partial |
| L8 Performance / load | Postgres pool, Container Apps autoscale, Search retrieval, and agent turns stay under CXO latency targets. | Container Apps runtime live; App Insights live; `scripts/load/azure-primary-surfaces.mjs`; `.github/workflows/azure-l8-primary-surface-load.yml`; AZLAB35 | Authenticated Azure run with `AZURE_LAB_L8_COOKIE`, cold-start test, agent latency budget trace, Postgres pool pressure scenario. | Partial |
| L9 Resilience / DR | The app degrades gracefully when Postgres, Service Bus, or LLM provider fails. | A2b worker DLQ behavior is designed; `npm run azure:servicebus:dlq-drill`; AZLAB40; AZLAB50 mixed-batch drill; AZLAB51 live mixed-batch evidence; PITR available through managed Postgres configuration | LLM 529 fallback simulation, Postgres disruption runbook, monthly restore drill. | Partial |
| L10 Compliance / audit trail | Sensitive-upload, gate approval, and admin-action evidence is append-only and exportable. | B5c `sensitive_upload_audit` migration/data wiring; `/admin/quarantine`; Purview stub design; `src/lib/security/__tests__/quarantine-audit-supabase.test.ts`; `npm run export:soc2-evidence-pack`; `npm run assert:sensitive-upload-audit-immutability`; `.github/workflows/l10-soc2-evidence-pack.yml`; AZLAB34; AZLAB38; AZLAB39; AZLAB41; AZLAB42 | Live Purview fixture and long-retention evidence archive. | Partial |
| L11 Observability / SLO + cost | Regression, latency, errors, agent violations, RLS denials, and spend cannot silently drift. | Log Analytics, App Insights, action group, budget; `scripts/azure/audit-observability.mjs`, `.github/workflows/azure-l11-observability-audit.yml`; `docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md` | Run audit through GitHub OIDC, add synthetic availability tests, SLO dashboard queries, cost alerts per RG, end-to-end agent trace coverage. | Partial |

## L1 - Infrastructure / IaC

**Acceptance question.** Can AbarVa deploy its Azure topology into a clean subscription/RG without hand-clicking the portal?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Bicep compilation | `az bicep build` or `az deployment group what-if` over `infra/azure/**` | No template errors. |
| Fresh-RG what-if | `.github/workflows/azure-l1-bicep-whatif.yml` | What-if completes for selected modules and uploads JSON reports. |
| Ephemeral smoke RG | Per-PR or nightly job | Deploys minimal stack, runs smoke, tears down within 1 hour. |
| Resource parity | New script: `scripts/azure/verify-resource-parity.mjs` | Expected resources present; no unexpected lab orphans. |

**Current state.** The live lab proves the resource sequence manually through AZLAB9-AZLAB32. AZLAB33 adds the live-state resource parity script and manual workflow. AZLAB36 adds the Bicep build plus subscription-scope what-if workflow for the deployable foundation modules. The missing L1 piece is expected-change parsing and a clean/ephemeral resource-group deploy/teardown.

## L2 - Connectivity / Private Endpoint Reachability

**Acceptance question.** Can the runtime reach every private dependency through the intended private lane, and can the public internet not reach those dependencies?

**Concrete checks.**

| Resource | Positive path from Container Apps | Negative path from public client |
|---|---|---|
| Postgres | `SELECT 1` through private network | Public connection fails with network/firewall failure, not auth failure. |
| Blob Storage | 1-byte put/get to `context-drops` | Public blob data-plane access denied by network. |
| Service Bus | No-op send/receive on test queue | Public client without private path cannot connect. |
| Key Vault | Managed identity reads `azure-connectivity-smoke-secret` | Public client cannot bypass RBAC/network posture. |
| AI Search | Query `$count=true` on `tenant-context-v1` | Admin-key-free public probe denied. |

**Live artifact.** AZLAB26 added `src/scripts/azure-connectivity-smoke.ts` and a guarded `/api/health/azure-connectivity` route. The script returns stable JSON:

```json
{
  "postgres": "pass",
  "blob": "pass",
  "serviceBus": "pass",
  "keyVault": "pass",
  "search": "pass"
}
```

**Important nuance.** Negative path failures must be network/firewall failures. An auth failure means the private resource is reachable and only credentials stopped the call.

## L3 - Security: Network + Identity

**Acceptance question.** Is the private data lane actually private, and are identities scoped to the smallest useful permission?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Public access audit | `scripts/azure/audit-lab-security.mjs` | Postgres, Blob, Service Bus, Search, Cosmos private-data resources do not expose public data-plane access unless explicitly approved. |
| Role assignment audit | `scripts/azure/audit-lab-security.mjs` | Container App MI has resource/container-level permissions, not subscription-wide Owner/Contributor. |
| Secrets scan | `gitleaks` workflow + `scripts/azure/audit-lab-security.mjs` env audit | No repo secrets; Container Apps use `secretRef`/Key Vault refs, not literal API keys. |
| Rotation drill | Monthly runbook | Rotate a test secret and confirm app picks it up after revision restart or configured TTL. |
| Defender baseline | Defender for Cloud | Foundational CSPM enabled where cost-appropriate. |

**Current state.** AZLAB27 added the advisory L3 audit script and a live run returned 67 pass, 9 attention, 0 fail. The lab is clean of fail findings, but pilot strict mode requires closing or waiving the attention items: Service Bus/Search public network reachability, Service Bus/Search/Cosmos local auth, Key Vault public manageability, and Storage/Service Bus role scopes that are broader than final tenant-lane posture.

## L4 - Multi-Tenant Isolation

**Acceptance question.** Can a tenant ever see another tenant's data through API, UI, SQL, or agent retrieval?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| API cross-tenant probes | `.github/workflows/sec-p0-post-deploy.yml` + `tests/security/sec-p0-cross-tenant-probes.sh` | All known SEC-P0 routes return 403/400/404 for tenant-A -> tenant-B probes. Workflow targets staging, production, and Azure lab. |
| UI tenant matrix | `tests/e2e/primary-surfaces-smoke.spec.ts` extended across roster | Every primary surface shows expected tenant name/copy and no other tenant vocabulary. |
| SQL RLS regression | New `tests/security/rls-tenant-isolation.sql` | Tenant role SELECT sees only its tenant rows on every tenant-scoped table. Service-role bypass tested separately. |
| Broker boundary | New integration test for `/api/intelligence` | Tenant A response contains no tenant-B segment IDs, pattern overlays, source event IDs, or graph node IDs. |

**Immediate next step.** AZLAB28 added the Azure target. The live run now needs `AZURE_LAB_BASE_URL`, `AZURE_LAB_APEX_SESSION`, and `AZURE_LAB_MERIDIAN_CLIENT_ID` repository secrets.

## L5 - Data Integrity

**Acceptance question.** Can we rebuild the canonical synthetic context layer from scratch, and can we prove prod/live drift?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Migration drift | `.github/workflows/migration-drift-pr.yml`, `.github/workflows/migration-drift-nightly.yml` | New migrations are visible in PR; nightly drift is green or explicitly waived. |
| Reset-and-replay | `.github/workflows/azure-l5-reset-replay.yml` | Fresh Postgres runs compatibility bootstrap, all migrations replay, and schema verification passes. |
| Azure schema verification | `src/scripts/verify-azure-postgres-schema.ts` | Reports expected migration/table/context counts. |
| Tenant data parity | `.github/workflows/azure-l5-data-parity.yml`, `src/scripts/verify-azure-tenant-data-parity.ts` | Apex, Meridian, and First Capital each clear minimum row-count thresholds across clients, setup segments, records, context chunks, graph nodes/edges, Source events, and engagements. |
| Backup/restore drill | Monthly Azure Postgres PITR runbook | Restored sandbox passes smoke E2E. |

**Current canonical row-count baseline from AZLAB25.**

| Tenant | `tenant-context-v1` document count |
|---|---:|
| Apex Retail | 2,075 |
| Meridian Health | 2,422 |
| First Capital | 2,070 |
| Total | 6,567 |

These are synthetic context chunks, not customer data.

**Current state.** AZLAB29 closes the schema replay part of L5. AZLAB31 adds read-only row-count assertions for Apex, Meridian, and First Capital. The next step is running the parity gate after every Azure tenant-context copy and after each PITR restore drill.

## L6 - Functional E2E

**Acceptance question.** Can each demo persona complete the product's core workflows without founder handholding?

**Concrete checks.**

| Surface | Existing check | Missing workflow check |
|---|---|---|
| Home | Tenant identity and readiness modules in `primary-surfaces-smoke.spec.ts`; tenant matrix in `azure-l6-primary-surfaces.yml` | Setup-panel click coverage and action queue routing. |
| Intelligence | Brief page renders per tenant | Ask Sentinel tenant-grounded question, verify citation/evidence, navigate Enterprise Context tabs. |
| Moves | Page renders per tenant | Originate new Move, fill required fields, promote to P1. |
| Source | Page renders per tenant | Create sourcing event, attach/evaluate evidence, verify side panel fills from chat. |
| Tower | Page renders per tenant | Generate/open decision pack, traverse value/risk/renewal/adoption/evidence canvases. |
| Auth | Sign-out check exists | Extend to all rostered personas. |

**Visual gate.** Add screenshot-diff baselines for the locked AbarVa design system: cream background, Georgia headers, DM Sans body, black/ghost CTAs, Snowflake-density subnav, no truncated chat bubbles.

## L7 - Agent Quality

**Acceptance question.** Do Sentinel, Atlas, Nexus, Source, and Steward remain consultant-grade under normal and adversarial prompts?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Golden corpus | `tests/agent-quality/golden/*.jsonl` | 50 initial prompt contracts across Sentinel, Atlas, Nexus, Source, and Steward with expected answer shape, not exact text. |
| Adversarial corpus | Included in `tests/agent-quality/golden/*.jsonl` by `category=adversarial` | Refuses or grounds fallback on unknowable items such as Slack URLs, board meetings, or private HR facts. |
| Live runner / scorer | `src/scripts/qa/agent-quality-live-runner.ts`, `npm run qa:agent-quality:runner`, `.github/workflows/agent-quality-live-runner.yml` | Dry-run plans cases, scores captured JSONL answers, and can execute the corpus through `/api/chat/agent` with a short-lived authenticated cookie. |
| Voice doctrine | Existing Sentinel voice tests and `validateSentinelVoice` | No banned phrases; contains consultant-style reasoning and confidence calibration. |
| Consistency guards | `src/lib/agent/voice-doctrine/sentinel.ts`, `agent_quality_violation_events`, C5 pilot dashboard | Existing ranked-money guard plus Phase 1 G1 sum reconciliation, G2 date math, and G6 pattern-citation validity; caught-violation rate and violation type counts are persisted to Postgres and visible in Panel 2. |
| Persisted telemetry smoke | `src/scripts/agent-quality-telemetry-smoke.ts`, `.github/workflows/azure-l7-agent-quality-telemetry-smoke.yml` | Proves the durable guard telemetry table accepts service-side writes and enforces tenant-scoped authenticated reads. |
| Continuity | New multi-turn eval | The agent can repeat prior KPI pressures and reconcile Q11/Q14 without contradiction. |

**Telemetry target.** Track caught-violation rate and false-positive rate per guard. Disable any guard above 5% false-positive rate.

**Current state.** AZLAB37 wires the deterministic corpus contract and validation workflow. AZLAB43 adds the live runner/scorer: weekly dry-run planning, captured-answer scoring, and optional authenticated live execution against `/api/chat/agent`. AZLAB44 implements Phase 1 Sentinel consistency guards for sum reconciliation, date math, and pattern-citation validity. AZLAB45 surfaces caught-violation rate and violation type counts in the C5 pilot dashboard. AZLAB46 persists those guard events in `agent_quality_violation_events` with tenant-scoped RLS and a dashboard fallback banner when persistence is unavailable. AZLAB47 adds the Azure Postgres smoke for durable telemetry writes and tenant-scoped RLS reads. AZLAB48 proves that smoke live in Azure Postgres. The corpus has 50 cases today (10 per agent) spanning tenant grounding, strategic business, AI programs, sourcing/vendor, move origination, portfolio risk, data readiness, compliance risk, adversarial prompts, and continuity. The next L7 step is the first stored Azure/prod baseline run.

## L8 - Performance / Load

**Acceptance question.** Does the stack stay fast and stable under realistic CXO and agent traffic?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Surface load | `scripts/load/azure-primary-surfaces.mjs`, `.github/workflows/azure-l8-primary-surface-load.yml` | No 5xx, no request errors, global p95 inside target; authenticated mode can require 2xx. |
| Cold start | New Container Apps scale-to-zero script | Cold-start measured and accepted per surface. |
| Postgres pool | Load scenario plus DB metrics | No connection exhaustion; pool sizing documented. |
| Agent latency budget | Trace fields for retrieval/reasoning/synthesis/model calls | p95 answer-with-citations stays below target; slow segment is visible. |

**Initial target.** For CXO-facing answers with citations, use 8 seconds p95 as the first stand-up target. Tune after App Insights has real traces.

**Current state.** AZLAB35 wires a dependency-free Node load smoke with a manual GitHub Actions workflow for Azure, staging, and production. It is intentionally lighter than k6/Artillery so it can run immediately with Node 24. The next L8 step is an authenticated Azure run with `AZURE_LAB_L8_COOKIE` and `--require-2xx`, then deeper workflow and agent-turn load scenarios.

## L9 - Resilience / DR

**Acceptance question.** What happens when a critical dependency fails for five minutes?

**Concrete checks.**

| Drill | Artifact | Pass condition |
|---|---|---|
| Postgres private endpoint disruption | `npm run azure:postgres-disruption:smoke` | Protected read-only degradation contract; no raw stack traces or connection details. |
| Service Bus poison message | `src/scripts/azure-servicebus-dlq-drill.ts`, `npm run azure:servicebus:dlq-drill` | Malformed message lands in DLQ with a worker rejection reason, not retry exhaustion. |
| LLM provider overload | `npm run azure:agent-provider-overload:smoke` | UI returns fallback or alternate provider response; no agent crash. |
| PITR restore | `npm run azure:postgres:pitr-drill` | Restored private DB reaches Ready; actual RTO/RPO documented; temporary target cleaned up. |

**Current state.** AZLAB40 adds the first L9 operator drill: produce a malformed ingestion message, run the A2b worker once, then verify the message is in the Service Bus dead-letter subqueue with a non-empty worker rejection reason. AZLAB50 adds the mixed good+poison batch path. AZLAB51 captures the live Azure pass: run `l9-mixed-20260515231810` accepted the good synthetic context upload into `sensitive_upload_audit` and isolated the malformed message into DLQ with `missing_tenantClientKey`. AZLAB58 captures the live r26 provider-overload pass: `/api/chat/agent` returns HTTP 200 with explicit capacity-limited fallback copy and no raw stream-error leakage. AZLAB59 captures the live r28 Postgres disruption pass: the guarded endpoint returns HTTP 503 with protected-read-only copy, `dataChanged=false`, and no raw driver/network/secret leakage. AZLAB60 captures the live Azure Postgres PITR restore pass: restored a private target to `Ready` in 393 seconds and deleted it after evidence capture.

**Design choice.** A fallback message is acceptable for first pilot if it is explicit and executive-safe. A crashed chat UI is not.

## L10 - Compliance / Audit Trail

**Acceptance question.** Can we export the evidence a SOC2 auditor or enterprise infosec reviewer will ask for?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Sensitive-upload audit immutability | `src/scripts/assert-sensitive-upload-audit-immutability.ts`, `npm run assert:sensitive-upload-audit-immutability` | UPDATE/DELETE is blocked under authenticated observer and tenant-admin claims; release/hard-delete actions append lifecycle child rows. |
| Lifecycle reconstruction | SQL test fixture | Quarantine -> release -> hard-delete rows reconstruct through `parent_id`. |
| Purview label persistence | `src/lib/security/quarantine-audit-supabase.ts` + unit test | Labels persist in `purview_labels` JSONB and survive release/hard-delete lifecycle rows. |
| Evidence export | `src/scripts/export-soc2-evidence-pack.ts`, `npm run export:soc2-evidence-pack`, `.github/workflows/l10-soc2-evidence-pack.yml` | CSV/JSON pack contains sensitive-upload decisions, data inventory audit logs, gate evidence, local approval ledgers, and a manifest with row counts/skips; monthly/manual workflow uploads artifacts. |

**Current state.** B5c introduced the quarantine/audit table and admin page. AZLAB34 adds application-level L10 assertions: tenant-scoped parent-row listing, release/hard-delete append lifecycle rows through `parent_id`, RLS enabled, and authenticated public-role SELECT only in the migration contract. AZLAB38 adds the SOC2 evidence-pack export command with dry-run validation. AZLAB39 adds the live SQL immutability assertion command with dry-run validation. AZLAB41 preserves Purview labels into release and hard-delete lifecycle rows. AZLAB42 adds a monthly/manual GitHub Actions evidence-pack export. A live Purview fixture and long-retention Blob archive still need to be implemented.

## L11 - Observability / SLO + Cost

**Acceptance question.** Can regressions, SLO breaches, isolation denials, agent violations, and spend drift silently?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Synthetic availability | App Insights availability tests | `/health` and one logged-in canonical-user flow run every 5 minutes from 3 regions. |
| SLO dashboards | App Insights / Log Analytics queries pinned to C5 dashboard | p95 latency, error rate, agent guard violations, RLS denials visible by surface and tenant. |
| Cost alerts | Azure Cost Management budgets | Alerts at 80% and forecast breach by RG/service. |
| Trace coverage | Agent turn trace schema | Every answer has retrieval IDs, model calls, latencies, guard results, and tenant key. |

**Current state.** Log Analytics, App Insights, and budget exist. AZLAB32 adds the first L11 evidence-plane audit for Log Analytics, Application Insights, action group, deployment-failure alert, monthly budget, Container Apps diagnostic wiring, and web-app telemetry binding. The C5 dashboard spec defines the product view; the next step is wiring true SLO availability tests, Azure metrics, and agent traces into it.

## 48-Hour Execution Queue

| Priority | Work item | Why |
|---:|---|---|
| 1 | Add Azure connectivity smoke script for Postgres, Blob, Service Bus, Key Vault, Search. | Converts L2 from assumption to pass/fail JSON. |
| 2 | Point SEC-P0 workflow at Azure FQDN once authenticated smoke is available. | Makes L4 a deployment gate, not an audit memory. |
| 3 | Add role/network/secret audit script. | Closes the most obvious infosec stand-up question. |
| 4 | Extend Playwright primary-surface smoke to all five canonical personas. | Proves tenant/persona fidelity across the demo roster. |
| 5 | Add reset-and-replay migration/seed CI job. | Moves L5 from manual confidence to reproducible evidence. |

## Seven-Day Execution Queue

| Priority | Work item | Why |
|---:|---|---|
| 1 | Implement L6 workflow specs: Move origination, Source event/evidence, Tower decision pack. | Blocks pilot credibility more than another static page smoke. |
| 2 | Run the L7 live answer runner against Azure/prod and store the first baseline artifact. | Moves from runner availability to measurable answer-quality drift. |
| 3 | Run the L7 live answer runner against Azure/prod, then verify C5 reads persisted guard telemetry from the live turns. | Confirms real agent-quality events, not only synthetic smoke rows, survive Container App restarts and feed the pilot dashboard from durable evidence. |
| 4 | Run the L8 primary-surface load smoke against Azure with an authenticated cookie, then add cold-start and agent-turn scenarios. | Establishes first p95/cold-start baseline before real pilot traffic. |
| 5 | Add live Purview fixture and Blob-retained evidence archive. | Moves compliance from GitHub artifact export to recurring auditor-ready proof with durable retention. |

## Fresh Subscription Acceptance Checklist

Before calling any new Azure environment "stood up":

1. L1 resource parity, Bicep what-if, and deploy complete against clean RG.
2. L2 connectivity smoke returns pass for all private dependencies from Container Apps.
3. L2 negative public-path checks fail with network/firewall failure.
4. L3 private-resource audit shows no accidental public data-plane exposure.
5. L3 managed identity audit shows no broad Owner/Contributor assignments.
6. L4 SEC-P0 cross-tenant probes pass against the deployed app URL.
7. L5 schema verification and canonical seed row counts pass.
8. L6 primary-surface Playwright matrix passes for all canonical personas.
9. L11 budget and deployment-failure alert are enabled, and the observability audit is green or intentionally waived.
10. `docs/architecture/azure/CURRENT-STATE.md` is updated with live resource names, counts, known gaps, and test-layer status.

## Stand-Up Answer

The Azure lab has the services needed for an enterprise-grade private data lane. What makes it stand-up ready is the test model above: L1-L4 are the deploy gates, L5-L8 are the pilot gates, and L9-L11 are the continuous controls. Today several artifacts already exist and have passed live Azure runs, especially ingestion, Search backfill, Postgres migration/copy, SEC-P0 probes, primary-surface smoke, and the first observability evidence-plane audit. The next work is to wire the remaining CI/live runs and add the missing what-if, load, resilience, audit-pack, SLO, and trace gates so the lab can be rebuilt, validated, and defended without relying on founder memory.
