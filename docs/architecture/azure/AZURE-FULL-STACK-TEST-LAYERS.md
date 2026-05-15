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
| L1 Infrastructure / IaC | The three-lane topology deploys cleanly to a fresh subscription/RG. Expected resources exist, no orphans. | `infra/azure/**`, `docs/architecture/azure/AZLAB*.md`, `docs/architecture/azure/CURRENT-STATE.md` | CI job for `bicep what-if` against ephemeral RG plus `az resource list` parity check. | Partial |
| L2 Connectivity / private endpoint reachability | Container Apps can reach private Postgres, Blob, Service Bus, Key Vault, and Search through intended lanes; public clients cannot reach private data resources. | `/api/health` direct Postgres probe; AZLAB20, AZLAB22, AZLAB23, AZLAB25 live job evidence | New `/api/health/azure-connectivity` route or script with per-resource pass/fail plus negative public-path test. | Partial |
| L3 Security: network + identity | Private data resources are not public; managed identities are least-privilege; secrets are Key Vault refs, not literals. | Key Vault env projection in AZLAB16; current state doc; Defender baseline; ACR managed identity pull | Role-assignment audit script, public-network audit, gitleaks workflow, Container App env literal scan, rotation drill. | Partial |
| L4 Multi-tenant isolation | Tenant A cannot read tenant B via API, RLS, broker, or UI. | `.github/workflows/sec-p0-post-deploy.yml`, `tests/security/sec-p0-cross-tenant-probes.sh`, `tests/e2e/primary-surfaces-smoke.spec.ts` | Wire SEC-P0 workflow to Azure FQDN, add SQL RLS tenant-role tests, add broker response tenant-key assertion. | Partial |
| L5 Data integrity | Migrations and seeds replay to a fresh DB; drift is visible; backup/restore works. | `.github/workflows/migration-drift-*.yml`, `src/scripts/bootstrap-azure-postgres-compat.ts`, `src/scripts/copy-tenant-context-to-azure.ts`, `src/scripts/verify-azure-postgres-schema.ts` | Reset-and-replay CI against fresh Postgres, expected row-count assertions, weekly PITR restore drill. | Partial |
| L6 Functional E2E | Each tenant can sign in, navigate Home/Intelligence/Moves/Source/Tower, complete one workflow, and sign out. | `tests/e2e/primary-surfaces-smoke.spec.ts` | Add workflow-level specs: Origination, Move gate, Source evidence ledger, Tower decision pack, screenshot baselines. | Partial |
| L7 Agent quality | Sentinel, Atlas, Nexus, Steward stay grounded, in-voice, internally consistent, and safe under adversarial prompts. | `docs/agent-quality/SENTINEL-CONSISTENCY-GUARD-EXPANSION.md`, existing Sentinel voice tests, audit question batteries in docs | Golden corpus and adversarial corpus per agent, weekly drift watchdog, guard telemetry wired to C5 dashboard. | Design |
| L8 Performance / load | Postgres pool, Container Apps autoscale, Search retrieval, and agent turns stay under CXO latency targets. | Container Apps runtime live; App Insights live | k6/Artillery scenarios, cold-start test, agent latency budget trace, p95 target gates. | Gap |
| L9 Resilience / DR | The app degrades gracefully when Postgres, Service Bus, or LLM provider fails. | A2b worker DLQ behavior is designed; PITR available through managed Postgres configuration | Chaos drill scripts, Service Bus malformed-message DLQ test, LLM 529 fallback simulation, monthly restore drill. | Gap |
| L10 Compliance / audit trail | Sensitive-upload, gate approval, and admin-action evidence is append-only and exportable. | B5c `sensitive_upload_audit` migration/data wiring; `/admin/quarantine`; Purview stub design | Append-only SQL assertion, lifecycle reconstruction test, Purview label persistence test, monthly evidence-pack export. | Partial |
| L11 Observability / SLO + cost | Regression, latency, errors, agent violations, RLS denials, and spend cannot silently drift. | Log Analytics, App Insights, action group, budget; `docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md` | Synthetic availability tests, SLO dashboard queries, cost alerts per RG, end-to-end agent trace coverage. | Partial |

## L1 - Infrastructure / IaC

**Acceptance question.** Can AbarVa deploy its Azure topology into a clean subscription/RG without hand-clicking the portal?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Bicep compilation | `az bicep build` or `az deployment group what-if` over `infra/azure/**` | No template errors. |
| Fresh-RG what-if | New workflow: `.github/workflows/azure-iac-whatif.yml` | What-if completes and reports only expected changes. |
| Ephemeral smoke RG | Per-PR or nightly job | Deploys minimal stack, runs smoke, tears down within 1 hour. |
| Resource parity | New script: `scripts/azure/verify-resource-parity.mjs` | Expected resources present; no unexpected lab orphans. |

**Current state.** The live lab proves the resource sequence manually through AZLAB9-AZLAB25. The missing piece is CI enforcement.

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

**Recommended artifact.** Add `src/scripts/azure-connectivity-smoke.ts` first, then expose a guarded `/api/health/azure-connectivity` route for app-level diagnostics. The script should return stable JSON:

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
| Public access audit | New script: `scripts/azure/audit-private-resource-networking.mjs` | Postgres, Blob, Service Bus, Search, Cosmos private-data resources do not expose public data-plane access unless explicitly approved. |
| Role assignment audit | New script: `scripts/azure/audit-managed-identity-rbac.mjs` | Container App MI has resource/container-level permissions, not subscription-wide Owner/Contributor. |
| Secrets scan | `gitleaks` workflow + `az containerapp show` env audit | No repo secrets; Container Apps use `secretRef`/Key Vault refs, not literal API keys. |
| Rotation drill | Monthly runbook | Rotate a test secret and confirm app picks it up after revision restart or configured TTL. |
| Defender baseline | Defender for Cloud | Foundational CSPM enabled where cost-appropriate. |

**Current state.** Key Vault projection is live, ACR pull is managed identity, and Defender baseline exists. The least-privilege and literal-env checks need scripts.

## L4 - Multi-Tenant Isolation

**Acceptance question.** Can a tenant ever see another tenant's data through API, UI, SQL, or agent retrieval?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| API cross-tenant probes | `.github/workflows/sec-p0-post-deploy.yml` + `tests/security/sec-p0-cross-tenant-probes.sh` | All known SEC-P0 routes return 403/400/404 for tenant-A -> tenant-B probes. |
| UI tenant matrix | `tests/e2e/primary-surfaces-smoke.spec.ts` extended across roster | Every primary surface shows expected tenant name/copy and no other tenant vocabulary. |
| SQL RLS regression | New `tests/security/rls-tenant-isolation.sql` | Tenant role SELECT sees only its tenant rows on every tenant-scoped table. Service-role bypass tested separately. |
| Broker boundary | New integration test for `/api/intelligence` | Tenant A response contains no tenant-B segment IDs, pattern overlays, source event IDs, or graph node IDs. |

**Immediate next step.** Point the existing SEC-P0 workflow at the Azure Container Apps FQDN once authenticated Azure smoke is available.

## L5 - Data Integrity

**Acceptance question.** Can we rebuild the canonical synthetic context layer from scratch, and can we prove prod/live drift?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Migration drift | `.github/workflows/migration-drift-pr.yml`, `.github/workflows/migration-drift-nightly.yml` | New migrations are visible in PR; nightly drift is green or explicitly waived. |
| Reset-and-replay | New CI job with fresh Postgres container | All migrations + seed scripts replay; Apex, Meridian, First Capital exist with expected row counts. |
| Azure schema verification | `src/scripts/verify-azure-postgres-schema.ts` | Reports expected migration/table/context counts. |
| Backup/restore drill | Monthly Azure Postgres PITR runbook | Restored sandbox passes smoke E2E. |

**Current canonical row-count baseline from AZLAB25.**

| Tenant | `tenant-context-v1` document count |
|---|---:|
| Apex Retail | 2,075 |
| Meridian Health | 2,422 |
| First Capital | 2,070 |
| Total | 6,567 |

These are synthetic context chunks, not customer data.

## L6 - Functional E2E

**Acceptance question.** Can each demo persona complete the product's core workflows without founder handholding?

**Concrete checks.**

| Surface | Existing check | Missing workflow check |
|---|---|---|
| Home | Tenant identity and readiness modules in `primary-surfaces-smoke.spec.ts` | Setup-panel click coverage and action queue routing. |
| Intelligence | Brief page renders | Ask Sentinel tenant-grounded question, verify citation/evidence, navigate Enterprise Context tabs. |
| Moves | Page renders | Originate new Move, fill required fields, promote to P1. |
| Source | Page renders | Create sourcing event, attach/evaluate evidence, verify side panel fills from chat. |
| Tower | Page renders | Generate/open decision pack, traverse value/risk/renewal/adoption/evidence canvases. |
| Auth | Sign-out check exists | Extend to all rostered personas. |

**Visual gate.** Add screenshot-diff baselines for the locked AbarVa design system: cream background, Georgia headers, DM Sans body, black/ghost CTAs, Snowflake-density subnav, no truncated chat bubbles.

## L7 - Agent Quality

**Acceptance question.** Do Sentinel, Atlas, Nexus, Source, and Steward remain consultant-grade under normal and adversarial prompts?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Golden corpus | New `tests/agent-quality/golden/*.jsonl` | ~50 questions per agent with expected answer shape, not exact text. |
| Adversarial corpus | New `tests/agent-quality/adversarial/*.jsonl` | Refuses or grounds fallback on unknowable items such as Slack URLs, board meetings, or private HR facts. |
| Voice doctrine | Existing Sentinel voice tests and `validateSentinelVoice` | No banned phrases; contains consultant-style reasoning and confidence calibration. |
| Consistency guards | `docs/agent-quality/SENTINEL-CONSISTENCY-GUARD-EXPANSION.md` | G1/G2/G6 implemented first; guard telemetry visible. |
| Continuity | New multi-turn eval | The agent can repeat prior KPI pressures and reconcile Q11/Q14 without contradiction. |

**Telemetry target.** Track caught-violation rate and false-positive rate per guard. Disable any guard above 5% false-positive rate.

## L8 - Performance / Load

**Acceptance question.** Does the stack stay fast and stable under realistic CXO and agent traffic?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Surface load | New `tests/load/azure-primary-surfaces.k6.ts` or Artillery equivalent | 20 concurrent users for 5 minutes; no 5xx; p95 inside target. |
| Cold start | New Container Apps scale-to-zero script | Cold-start measured and accepted per surface. |
| Postgres pool | Load scenario plus DB metrics | No connection exhaustion; pool sizing documented. |
| Agent latency budget | Trace fields for retrieval/reasoning/synthesis/model calls | p95 answer-with-citations stays below target; slow segment is visible. |

**Initial target.** For CXO-facing answers with citations, use 8 seconds p95 as the first stand-up target. Tune after App Insights has real traces.

## L9 - Resilience / DR

**Acceptance question.** What happens when a critical dependency fails for five minutes?

**Concrete checks.**

| Drill | Artifact | Pass condition |
|---|---|---|
| Postgres private endpoint disruption | Chaos runbook/script | Cached/read-only surfaces degrade gracefully; no raw stack traces. |
| Service Bus poison message | A2b DLQ test | Malformed message lands in DLQ; good messages continue after it. |
| LLM provider overload | Provider stub/simulation | UI returns fallback or alternate provider response; no agent crash. |
| PITR restore | Monthly restore runbook | Restored DB passes smoke E2E; actual RTO/RPO documented. |

**Design choice.** A fallback message is acceptable for first pilot if it is explicit and executive-safe. A crashed chat UI is not.

## L10 - Compliance / Audit Trail

**Acceptance question.** Can we export the evidence a SOC2 auditor or enterprise infosec reviewer will ask for?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Sensitive-upload audit immutability | SQL test against `sensitive_upload_audit` | UPDATE/DELETE is blocked or append-only lifecycle is enforced. |
| Lifecycle reconstruction | SQL test fixture | Quarantine -> release -> hard-delete rows reconstruct through `parent_id`. |
| Purview label persistence | Purview stub + DB assertion | Labels persist in `purview_labels` JSONB and survive release. |
| Evidence export | New `src/scripts/export-soc2-evidence-pack.ts` | CSV contains sensitive-upload decisions, gate approvals, admin actions, and timestamps. |

**Current state.** B5c introduced the quarantine/audit table and admin page. The export and immutability tests still need to be implemented.

## L11 - Observability / SLO + Cost

**Acceptance question.** Can regressions, SLO breaches, isolation denials, agent violations, and spend drift silently?

**Concrete checks.**

| Check | Artifact | Pass condition |
|---|---|---|
| Synthetic availability | App Insights availability tests | `/health` and one logged-in canonical-user flow run every 5 minutes from 3 regions. |
| SLO dashboards | App Insights / Log Analytics queries pinned to C5 dashboard | p95 latency, error rate, agent guard violations, RLS denials visible by surface and tenant. |
| Cost alerts | Azure Cost Management budgets | Alerts at 80% and forecast breach by RG/service. |
| Trace coverage | Agent turn trace schema | Every answer has retrieval IDs, model calls, latencies, guard results, and tenant key. |

**Current state.** Log Analytics, App Insights, and budget exist. The C5 dashboard spec defines the product view; the next step is wiring Azure metrics and agent traces into it.

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
| 2 | Implement agent golden/adversarial corpus harness. | Makes "super-smart consultant" measurable. |
| 3 | Implement G1/G2/G6 Sentinel consistency guards. | Highest-value quality lift from the guard expansion design. |
| 4 | Add k6 or Artillery load scenario for Azure primary surfaces. | Establishes first p95/cold-start baseline before real pilot traffic. |
| 5 | Add evidence-pack export for sensitive-upload, gate approval, and admin actions. | Makes SOC2/infosec evidence one command away. |

## Fresh Subscription Acceptance Checklist

Before calling any new Azure environment "stood up":

1. L1 what-if and deploy complete against clean RG.
2. L2 connectivity smoke returns pass for all private dependencies from Container Apps.
3. L2 negative public-path checks fail with network/firewall failure.
4. L3 private-resource audit shows no accidental public data-plane exposure.
5. L3 managed identity audit shows no broad Owner/Contributor assignments.
6. L4 SEC-P0 cross-tenant probes pass against the deployed app URL.
7. L5 schema verification and canonical seed row counts pass.
8. L6 primary-surface Playwright matrix passes for all canonical personas.
9. L11 budget and deployment-failure alert are enabled.
10. `docs/architecture/azure/CURRENT-STATE.md` is updated with live resource names, counts, known gaps, and test-layer status.

## Stand-Up Answer

The Azure lab has the services needed for an enterprise-grade private data lane. What makes it stand-up ready is the test model above: L1-L4 are the deploy gates, L5-L8 are the pilot gates, and L9-L11 are the continuous controls. Today several artifacts already exist and have passed live Azure runs, especially ingestion, Search backfill, Postgres migration/copy, SEC-P0 probes, and primary-surface smoke. The next work is to wire these into CI and add the missing connectivity, security, workflow, load, resilience, audit, and observability gates so the lab can be rebuilt, validated, and defended without relying on founder memory.
