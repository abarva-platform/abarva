# Enterprise Deployment + Trust Verification Runbook

Slice ID: QA8
Slice name: Enterprise Deployment + Trust Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Lane H (parallel build pack — overnight batch)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls.

This runbook is the founder-facing checklist for verifying that the
**enterprise deployment** and **client data trust** surfaces — the
SaaS tenancy architecture (TEN1), the tenant isolation data
boundary read model (TEN2), the optional dedicated-tenant blueprint
(TEN3), the dataset trust model (TRUST1), the agent data access
policy matrix (TRUST2), the optional surface wiring of TRUST in
Steward setup (TRUST3), the four-tier deployment strategy (CLOUD1),
the Azure VNet reference lab blueprint (CLOUD2), the optional
Docker packaging path (CLOUD3), the optional local-lab boot
(CLOUD4), the optional Bicep starter (CLOUD5), the production
readiness live refresh API + panel (PROD3), the optional CI / Vercel
ingestion path (PROD4), and the optional users / access surface
(ADM6) — land **honestly** before push or PR.

It is the eighth founder-facing verification runbook, after:

- QA1 — [`AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`](./AGENTIC_SPINE_VERIFICATION_RUNBOOK.md)
- QA2 — [`SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md`](./SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md)
- QA3 — [`SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`](./SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md)
- QA4 — [`AGENT_MISSION_PERSONA_VERIFICATION_RUNBOOK.md`](./AGENT_MISSION_PERSONA_VERIFICATION_RUNBOOK.md)
- QA5 — `slices/QA5_ROUTE_SMOKE_HARNESS.md`
- QA6 — [`GOLDEN_PROMPT_HARNESS_CONTRACT.md`](./GOLDEN_PROMPT_HARNESS_CONTRACT.md)
- QA7 — [`PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION_RUNBOOK.md`](./PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION_RUNBOOK.md)

The runbook is meant to be **walked manually** after the relevant
slice work has reached `code_complete`. It supports:

- Solo overnight founder review when an enterprise / cloud / trust
  batch lands.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-customer-conversation dry-run when an enterprise tier prospect
  asks "can you actually deploy this in our cloud?"

Each section has one expected outcome per row; do not skip rows.

---

## §A · Scope

QA8 verifies the **enterprise deployment + trust contract** that
the AbarVa platform must hold to be defensible against a sophisticated
enterprise / regulated buyer. The contract spans three planes —
tenancy (who is isolated from whom), trust (what client data the
platform may touch and at what level), and deployment topology
(where the data plane physically lives) — and the runbook walks
each plane against the canonical slice landing list below.

| Slice | Required | Conditional | Notes |
|-------|----------|-------------|-------|
| TEN1  | yes      | —           | SaaS tenancy architecture contract; canonical four-tier vocabulary |
| TEN2  | yes      | —           | Tenant isolation data boundary read model; five canonical isolation levels |
| TEN3  | —        | yes         | Dedicated-tenant blueprint; verified only if installed in batch |
| TRUST1| yes      | —           | Dataset trust model + sharing levels (L0–L4) and trust ladder (loaded → decision_grade) |
| TRUST2| yes      | —           | Agent data access policy matrix |
| TRUST3| —        | yes         | Steward Setup TRUST surface wiring; verified only if installed |
| CLOUD1| yes      | —           | Four-tier enterprise deployment strategy contract |
| CLOUD2| yes      | —           | Azure VNet reference lab blueprint |
| CLOUD3| —        | yes         | Docker packaging path; verified only if installed |
| CLOUD4| —        | yes         | Local lab boot; verified only if installed |
| CLOUD5| —        | yes         | Bicep starter; verified only if installed |
| PROD3 | yes      | —           | Production readiness live refresh API + panel |
| PROD4 | —        | yes         | CI / Vercel ingestion; verified only if installed |
| ADM6  | —        | yes         | Users / access surface; verified only if installed |

**In scope.** Walking the canonical TEN1 / TEN2 / TRUST1 / TRUST2 /
CLOUD1 / CLOUD2 / PROD3 contract documents and read models, walking
the conditional TEN3 / TRUST3 / CLOUD3 / CLOUD4 / CLOUD5 / PROD4 /
ADM6 surfaces only if they have landed in the batch, executing the
listed deterministic validation commands, and confirming that no
production-ready promotions or fabricated claims have been made.

**Out of scope.** Live cloud calls (Azure, GCP, AWS), real model
calls (Anthropic, OpenAI, Cohere), real customer cloud accounts,
real customer credentials, real CI / Vercel polling, real persona
crawler execution, real browser automation, and any modification of
auth, supabase, migrations, or platform-design canon docs. QA8 does
NOT promote `production_deployment` or `validation_qa` to
`production_ready`. It does NOT add a new blocker, remove an
existing blocker, or change overall readiness percent.

**Marking conditional rows.** When a row says "verified only if
installed", the runbook records `deferred` (not `failed`) when the
matching slice is not present in the batch. The integration agent
records `deferred` in the morning review note rather than failing
the runbook walk.

---

## §B · Branch hygiene

The dispatch operating model
([`AGENT_DISPATCH_OPERATING_MODEL.md`](./AGENT_DISPATCH_OPERATING_MODEL.md))
is canonical; this section restates the hygiene rules QA8 itself
enforces.

- **Worktree per slice.** Each enterprise / cloud / trust slice
  runs in its own worktree under `/Users/anand/Projects/nexus-*`
  with its own branch. QA8 itself runs in
  `/Users/anand/Projects/nexus-enterprise-qa8` on
  `enterprise/qa8-deployment-trust-verification`.
- **Lane agents commit only.** Lane agents (A / B / C / D / E / F /
  G / H) create local commits in their assigned worktree and never
  push, merge, or open a PR. The integration agent owns cherry-pick
  and merge. The founder owns the push and merge decisions.
- **Integration agent merges.** All cherry-picks follow the canonical
  cherry-pick path documented in §P. Conflicts on
  `docs/build/build-slices.json` are resolved append-only with
  HEAD-wins on existing entries; conflicts on
  `docs/build/production-readiness.json` follow conservative-status
  + UNION-notes / blockers / nextAction rules with no false
  promotions.
- **No `git add .`.** Every commit stages an explicit allowlist of
  files. QA8 stages exactly four files — see §P. Lane agents must
  not run `git add .`, `git add -A`, or `git add *`. The lane agent
  runs `git status` after staging to confirm only allowlisted files
  are staged.
- **Allowed files only.** Any file outside the slice's `allowedFiles`
  list in `build-slices.json` MUST NOT be staged or modified. The
  lane agent runs `git diff --cached --name-only` and rejects the
  commit if any unlisted file appears.

---

## §C · Validation commands

The following deterministic commands are required for every QA8
walk. They run from the QA8 worktree root.

### TypeScript

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  npx tsc --noEmit --pretty false
```

Must exit `0` with no diagnostics. Any new diagnostic — even one
that pre-existed on `main` — must be recorded in the morning review
note.

### Jest suites

QA8 itself is documentation-only and ships no jest suite. The
runbook walks the deterministic suites that the verified slices
ship:

- **TEN2** — `npx jest src/__tests__/integration/architecture/tenant-isolation-boundary.test.ts`
- **TRUST1** — `npx jest src/__tests__/integration/admin/dataset-trust-model.test.ts`
- **TRUST2** — `npx jest src/__tests__/integration/admin/agent-data-access-policy.test.ts`
- **PROD3** — `npx jest src/__tests__/integration/admin/production-readiness-live-refresh.test.ts` (if installed)
- **PROD4** — `npx jest src/__tests__/integration/admin/production-readiness-deployment-status.test.ts` (if installed)
- **ADM6** — `npx jest src/__tests__/integration/admin/users-access-surface.test.ts` (if installed)

A conditional jest path is **skipped** when the matching test file
does not exist (the slice has not yet landed). Skipped is recorded
as `deferred`, not `failed`. TEN1 / TEN3 / TRUST3 / CLOUD1 / CLOUD2 /
CLOUD3 / CLOUD4 / CLOUD5 are documentation / blueprint slices and do
not ship a jest suite.

### Production build

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  npm run build
```

Must exit `0`. The well-known Next.js worktree symlink panic that
affects parallel builds in worktrees is acceptable to mitigate by
clearing `.next/` and re-running once; record the mitigation in the
morning review note.

### Manifest JSON parse check

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"
```

Must print `json ok`. Any parse error fails the run.

### Conflict marker grep

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  git grep -nE '^(<<<<<<<|=======|>>>>>>>)' -- 'docs/**' 'src/**' || true
```

Must return no matches inside the staged file set. The trailing
`|| true` is intentional — `git grep` exits non-zero on no match.
The lane agent inspects the output rather than relying on exit
code.

---

## §D · SaaS pilot readiness checks (Tier 1)

Verifies the AbarVa SaaS Pilot tier — the only tier provisionable
in MVP today.

| # | Check | Expected | Source |
|---|-------|----------|--------|
| D1 | Multi-tenant data plane working | TEN2 enumerates `logical_row_level` as the canonical isolation level for SaaS shared multi-tenant; `validateTenantBoundary` rejects missing `tenantId`, missing `dataNamespace`, missing `auditRequirement` | `src/lib/architecture/tenant-isolation-boundary.ts`; `src/__tests__/integration/architecture/tenant-isolation-boundary.test.ts` |
| D2 | Tenant registry stub deterministic | TEN1 contract names the registry fields (tenantId, tenantSlug, displayName, tier, isolationMode, dataNamespace, gatewayProfile, idpProfile, governancePosture, lifecycleState, region, timestamps, notes) and forbids tenant content in the registry | `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md` |
| D3 | Tenant admin / platform admin separation visible | TEN1 §SSO/RBAC/audit per-tier table separates platform-admin (Steward) from tenant-admin (per-tenant role bag) and forbids platform-admin visibility of tenant content from the control plane | `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md` |
| D4 | Model gateway shared, contract-only | MG2 contract is the single egress point for all four agents in Tier 1; gateway is contract-only (no live model calls) and is shared across all SaaS tenants in the multi-tenant pool with per-tenant audit attribution | `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md` §gateway |

**Failure mode.** If D1–D4 cannot be satisfied from the slice files
and named tests, the SaaS pilot tier is not defensible and the
runbook walk halts. Record the gap in the morning review note.

---

## §E · Dedicated tenant readiness checks (Tier 2 — conditional)

Verifies the AbarVa Enterprise SaaS / Dedicated Tenant tier. Walked
only if **TEN3** has landed in the batch under review.

| # | Check | Expected | Source |
|---|-------|----------|--------|
| E1 | TEN3 blueprint covers DB, storage, vector/graph, audit, model gateway, SSO, tenant admin | If installed: TEN3 enumerates per-tenant Postgres schema isolation, per-tenant storage prefix, per-tenant vector/graph namespace, per-tenant audit ledger, per-tenant model gateway profile (still AbarVa-keyed for Tier 2), per-tenant SSO IdP attachment, per-tenant tenant-admin role bag | TEN3 contract doc (when installed) |
| E2 | Onboarding path documented | If installed: TEN3 enumerates onboarding (tenant registry write → namespace allocation → IdP attachment → first user creation → audit channel attachment) without claiming live provisioning | TEN3 contract doc |
| E3 | Upgrade path documented | If installed: TEN3 enumerates how a SaaS Pilot tenant migrates to Dedicated Tenant without data loss (logical → schema isolation migration; per-tenant audit retention; gateway profile re-attachment) | TEN3 contract doc |
| E4 | Backup path documented | If installed: TEN3 enumerates per-tenant backup boundary (per-tenant Postgres dump or per-schema export; per-tenant storage snapshot; per-tenant audit ledger export) without making a live RPO/RTO SLA claim | TEN3 contract doc |
| E5 | No production-ready claim | TEN3 status in `build-slices.json` MUST be `code_complete` or lower; `production_deployment` status MUST remain `blocked`; the prod-deploy-verification blocker MUST be preserved | `docs/build/build-slices.json`; `docs/build/production-readiness.json` |

**Conditional.** If TEN3 has not landed in the batch, record E1–E5
as `deferred` and proceed.

---

## §F · Private data plane readiness checks (Tier 3)

Verifies the AbarVa Private Data Plane tier — data + compute in
client cloud.

| # | Check | Expected | Source |
|---|-------|----------|--------|
| F1 | CLOUD1 four-tier strategy documented | CLOUD1 names Tier 1 SaaS, Tier 2 Dedicated Tenant, Tier 3 Private Data Plane, Tier 4 Self-Managed; control-plane vs data-plane separation is explicit; dependency replacement matrix is present (Vercel, Supabase, Vercel Blob, Clerk, Anthropic/OpenAI direct → Azure or GCP equivalents) | `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md` |
| F2 | CLOUD2 Azure VNet architecture documented | CLOUD2 names the single Resource Group, the VNet CIDR plan, app / data / private-endpoint / ingress / bastion subnets, Container Apps preferred / App Service fallback, Postgres Flexible Server / Blob / Key Vault each fronted by private endpoints with public access disabled, Log Analytics + Application Insights, private ingress, private DNS zones | `docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md` |
| F3 | CLOUD4 local lab boots clean (when run) | If installed: CLOUD4 scripts boot the AbarVa shell against local Postgres + local blob stub + local key store; smoke route renders; no live model call is made; tear-down leaves no leftover state | CLOUD4 scripts (when installed) |
| F4 | CLOUD5 Bicep starter parses | If installed: `az bicep build` against the CLOUD5 starter exits `0`; the parameters file parses; the emitted ARM JSON is well-formed; the file set is named (main.bicep, parameters.json, README.md) and explicitly LAB / NOT PRODUCTION | CLOUD5 bicep starter (when installed) |

**Conditional rows.** F3 and F4 are walked only if CLOUD4 and
CLOUD5 have landed in the batch. Otherwise record `deferred`.
F1 and F2 are required and must pass.

---

## §G · Azure VNet lab verification (CLOUD2 + CLOUD5)

The Azure lab is the canonical defensible answer to "can you
deploy this inside our Azure tenant with no public endpoints?"
QA8 walks the blueprint document and (when CLOUD5 is installed)
the Bicep starter.

### G1 · Resource list match

| Resource | Required in CLOUD2 blueprint? | Required in CLOUD5 Bicep? |
|----------|-------------------------------|---------------------------|
| VNet (single Resource Group) | yes | yes (when installed) |
| App subnet (Container Apps preferred) | yes | yes |
| Private Endpoint subnet | yes | yes |
| Ingress subnet (Front Door PLS or App Gateway WAF) | yes | yes |
| Bastion subnet | yes | yes |
| Container Apps Environment | yes | yes |
| Container App (AbarVa shell) | yes | yes |
| Azure Database for PostgreSQL Flexible Server | yes | yes |
| Azure Blob Storage account | yes | yes |
| Azure Key Vault (private endpoint, managed identity) | yes | yes |
| Log Analytics workspace | yes | yes |
| Application Insights (workspace-bound) | yes | yes |
| Private DNS zones (postgres, blob, vault) | yes | yes |

### G2 · Bicep lints clean

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  az bicep build --file infra/cloud5/main.bicep
```

Must exit `0`. Conditional — only walked when CLOUD5 is installed.
Otherwise record `deferred`.

### G3 · Parameters file parses

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  node -e "JSON.parse(require('fs').readFileSync('infra/cloud5/parameters.json','utf8')); console.log('params ok')"
```

Must print `params ok`. Conditional. Skipped if CLOUD5 not
installed.

### G4 · No hardcoded secrets

The CLOUD2 blueprint and (when installed) the CLOUD5 Bicep starter
MUST NOT contain a secret, a connection string with embedded
password, a service principal client secret, a subscription ID, or
a tenant ID. Run:

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  git grep -nE '(password=|secret=|api[_-]?key=|/subscriptions/|tenantId\s*=\s*"[0-9a-f-]{36}")' -- 'docs/architecture/CLOUD2_*' 'infra/cloud5/**' || true
```

Must return no matches. The trailing `|| true` is intentional
(grep exits non-zero on no match).

### G5 · README marks LAB / NOT PRODUCTION

The CLOUD2 blueprint document and (when installed) `infra/cloud5/README.md`
MUST contain the explicit phrase `LAB / NOT PRODUCTION` (or an
equivalent honest disclaimer such as "this lab does NOT prove
production scaling, DR, multi-region, live model gateway, production
tenant isolation certification, or compliance certification").

---

## §H · Docker packaging verification (CLOUD3 — conditional)

Walked only if **CLOUD3** has landed in the batch.

| # | Check | Expected |
|---|-------|----------|
| H1 | Dockerfile multi-stage | `Dockerfile` declares at least two `FROM` stages (build → runtime) |
| H2 | Non-root user | Final stage `USER` directive names a non-root user (`USER node` or equivalent) |
| H3 | No baked secrets | No `ENV` line carries a real secret value; no `COPY` line copies a `.env*` file; no `ARG` line carries a default secret |
| H4 | `.dockerignore` covers `node_modules`, `.env`, `.git`, `reports/` | `.dockerignore` lists at least these four paths |
| H5 | `verify-docker-build.sh` exits `0` whether Docker is present or not | The verification script gracefully reports `docker not present — verification deferred` and exits `0` when the Docker daemon is unavailable, so CI on hosts without Docker still passes |

**Conditional.** Skipped (recorded as `deferred`) if CLOUD3 has not
landed.

---

## §I · Dataset trust + agent access checks (TRUST1 / TRUST2 / TRUST3)

Verifies the dataset trust contract and the agent data access
policy matrix.

### I1 · Five sharing levels honored

The canonical sharing-level union is exactly:

```
['L0_public_external', 'L1_metadata_only', 'L2_summary_aggregate',
 'L3_redacted_extract', 'L4_sensitive_raw_data']
```

`buildDatasetTrustModel` must be byte-equal across calls; every
sharing level appears at least once in the seed. Source:
`src/lib/admin/dataset-trust-model.ts`;
`src/__tests__/integration/admin/dataset-trust-model.test.ts`.

### I2 · Five trust ladder states

The canonical trust ladder is exactly:

```
['loaded', 'available', 'usable_evidence', 'agent_usable',
 'decision_grade']
```

Only `agent_usable` and `decision_grade` permit agent runtime use;
only `decision_grade` permits decision-artifact citation.

### I3 · L4 sensitive raw data BLOCKED unless explicitly approved

`evaluateDatasetTrustDecision` returns `permitted: false` for any
L4 read without an `explicit_approved` approval state, including
`denied` and `expired`. The block reason includes
`rule_no_fake_approval`. Reading raw records at non-L4 levels is
blocked with `rule_raw_records_only_via_L4`.

### I4 · Agent use requires explicit policy

`evaluateAgentDataAccess` (TRUST2) blocks agent runtime use when no
agent-use policy is attached, when ladder state is only `available`,
or when ladder state is only `loaded`. Source:
`src/lib/admin/agent-data-access-policy.ts`;
`src/__tests__/integration/admin/agent-data-access-policy.test.ts`.

### I5 · Approval workflow

For agent-runtime use to be permitted, the dataset record must carry
`approved_for_agent_use === true` *and* the approval must be
`explicit_approved` and not expired. The flag MUST NOT be derivable
from a summary record; it must come from a named approver. The
approval state vocabulary is `not_required | pending | conditionally_approved | explicit_approved | denied | expired`.

### I6 · Revoked / expired blocks use

When the approval state transitions to `denied` or `expired`,
`evaluateDatasetTrustDecision` and `evaluateAgentDataAccess`
immediately block subsequent reads and returns a non-empty
`reasons` list naming the state.

### I7 · TRUST3 surface wiring (conditional)

If TRUST3 has landed in the batch, the Steward Setup TRUST surface
renders the TRUST1 + TRUST2 read models without writing back to
state. No fabricated approvals. No runtime mutation. Skipped if not
installed.

---

## §J · Users / access checks (ADM6 — conditional)

Walked only if **ADM6** has landed in the batch.

| # | Check | Expected |
|---|-------|----------|
| J1 | Surface renders deterministic seed | The users / access surface renders from a deterministic ADM6 seed; no `Date.now()`, `Math.random()`, `new Date()`, or `fetch()` runtime |
| J2 | All 7 roles represented in fixture | The fixture covers all 7 canonical roles (the canonical role vocabulary in the operating model: founder, platform_steward, tenant_admin, tenant_steward, tenant_member, tenant_observer, agent_service) |
| J3 | No real person names | The fixture uses persona placeholders (`Founder`, `Platform Steward`, `Apex Retail Admin`, etc.) and no real customer names |
| J4 | No live auth mutation claim | The surface does not claim to mutate Clerk / Auth users; no live SSO change is asserted; mutations are visibly disabled |
| J5 | Risky permission flags surface | Any role carrying a risky permission (e.g., `can_read_l4_raw`, `can_promote_production`, `can_override_audit`) is surfaced with a visible warning chip |
| J6 | Imports from `@/lib/design/abarva-theme` (canon) | The component imports tokens from the canonical `@/lib/design/abarva-theme` module and not a forked / inline tokens file |

**Conditional.** Skipped (recorded as `deferred`) if ADM6 has not
landed.

---

## §K · Production readiness tracker checks (PROD3 / PROD4)

### K1 · Page renders

The `/platform/admin/production-readiness` page renders. The page
shell loads. The deterministic component list is visible. The
overall readiness percent and overall status are visible.

### K2 · Live panel polls every 60s

The `ProductionReadinessLivePanel` component
(`src/components/admin/ProductionReadinessLivePanel.tsx`) polls
`/api/admin/production-readiness` on a 60-second interval and
exposes a manual `Refresh` button.

### K3 · API returns honest live status when tokens absent

`GET /api/admin/production-readiness` (PROD3) returns `liveCiStatus:
'unavailable'` when no GitHub / Vercel tokens are configured. PROD4
(when installed) extends this with a `/api/admin/production-readiness/deployment-status`
route that returns `liveStatus: 'unavailable'` honestly when no
tokens are configured. The route MUST NOT fabricate a green CI
status, a green Vercel deployment, or a green DNS check.

### K4 · No fake green CI claim

The runbook walker reads the live API response and confirms that
`liveCiStatus`, `liveDeploymentStatus`, and any other live signal
fields explicitly carry `unavailable` (or another honest value)
when the underlying source is not configured. No field carries a
fabricated `passing`, `green`, or `success` value.

### K5 · Blockers preserved

`production_deployment.blockers` MUST contain the
`prod-deploy-verification` blocker verbatim. `validation_qa.blockers`
MUST contain the `qa-ci-gates` blocker verbatim. Adding or removing
a blocker requires explicit founder approval.

### K6 · No false `production_ready` promotions

No component status is promoted to `production_ready` by QA8 or by
any of the slices it walks. The `overallStatus` is preserved. The
`overallReadinessPercent` is preserved or moves only by the same
delta the validator computes deterministically from the seed.

---

## §L · No-fabrication checks

Walked across every artifact the slices produce.

| # | Check | Expected |
|---|-------|----------|
| L1 | No fake citations | No `E-###` evidence token appears in a deliverable, recommendation, or audit row unless it traces to a real evidence record produced by EVID2 / EVID3. The TRUST1 / TRUST2 / CLOUD1 / CLOUD2 docs name no specific `E-###` tokens. |
| L2 | No fake approvals | No record is marked `approved_for_agent_use: true` or `explicit_approved` without a named approver, an approval timestamp, and (for L4) a named approval scope |
| L3 | No fake dollar amounts | No deliverable, recommendation, intelligence brief, or audit row contains a fabricated dollar amount (cycle-time savings, ROI, opportunity cost, contract value, ARR, regional SLA payout). The CLOUD1 / CLOUD2 / TEN1 / TEN3 docs MUST NOT name a customer contract value, a deal-size estimate, or a regional SLA dollar value. |
| L4 | No live model claim | The model gateway is contract-only via MG2; no slice asserts a live model invocation, live RAG retrieval, live embedding call, or live reranker call |
| L5 | No fake live monitoring claim | No slice asserts that the production readiness page is fed by a live CI / Vercel / DNS / observability source. PROD3 reports `unavailable` honestly; PROD4 (when installed) returns `liveStatus: 'unavailable'` when tokens are absent |

---

## §M · CI / Vercel status checks

| # | Check | Expected |
|---|-------|----------|
| M1 | ESLint passes | `npm run lint` (or the equivalent project lint script) returns no errors. Warnings recorded. |
| M2 | Routes-and-disclaimers passes | The deterministic routes-and-disclaimers gate (when wired) returns `passed: true`. Skipped if not wired. |
| M3 | Vercel abarva deployment green | The Vercel deployment for the abarva project (when an external preview URL is available) returns HTTP 200 on the canonical home and tenant routes. Recorded as deferred when no Vercel token is configured. |
| M4 | Vercel nexus deployment green | The Vercel deployment for the nexus project (when configured) returns HTTP 200 on the canonical surfaces. Recorded as deferred when no Vercel token is configured. |
| M5 | Supabase Preview skipping is acceptable | When the Supabase Preview environment is intentionally skipped (no DB writes from this slice batch), record `skipped` rather than `failed` |

---

## §N · Client data sharing trust ladder walk

This section traces a canonical Apex Retail dataset record through
the four sharing-level transitions. At each step, the runbook
records the evidence required, the reviewer, and the approver.

### Step 1 · L1_metadata_only

- **Evidence required.** Dataset registry entry with name,
  description, owning steward, classification, retention.
- **Reviewer.** Tenant Steward.
- **Approver.** Tenant Steward (no platform involvement at L1).
- **Permitted.** Discovery, listing, classification visibility.
- **Forbidden.** Raw record reads, summary aggregate reads, redacted
  extract reads. `evaluateDatasetTrustDecision` returns
  `permitted: true` only for `purpose === 'discovery'`.

### Step 2 · L2_summary_aggregate

- **Evidence required.** Aggregate definition (counts, rates, ranges)
  with named projection rules; review log naming the steward who
  signed off on the projection.
- **Reviewer.** Tenant Steward.
- **Approver.** Tenant Admin (per-tenant approval scope).
- **Permitted.** Summary read, aggregate trend read. Atlas may use
  L2 for executive-brief surfaces.
- **Forbidden.** Raw record read, redacted extract read,
  decision-grade citation. Sentinel pattern detection may use L2 as
  a candidate but not as decision-grade evidence.

### Step 3 · L3_redacted_extract

- **Evidence required.** Redaction policy document naming the
  redaction rules (PII fields removed, regex masks applied, k-anon
  bucket sizes); a per-row redaction audit row in the unified audit
  ledger; a named redaction approver.
- **Reviewer.** Tenant Steward + Platform Steward (joint).
- **Approver.** Tenant Admin + Platform Steward (joint).
- **Permitted.** Redacted record read, redacted aggregate read.
  Sentinel may treat L3 as evidence candidate. Nexus may use L3 in
  a deliverable when explicitly cited.
- **Forbidden.** L4 raw read. Decision-grade citation requires
  ladder state `decision_grade`, not just sharing level L3.

### Step 4 · L4_sensitive_raw_data

- **Evidence required.** Explicit named approval (approver, scope,
  expiry, audit row); the approval MUST come from a named human
  reviewer and not from a derived summary; an L4 access purpose
  statement; a per-read audit row.
- **Reviewer.** Tenant Admin + Tenant Steward + Platform Steward
  (full chain).
- **Approver.** Tenant Admin (with optional Platform Steward
  co-sign for cross-tenant patterns); approval expiry MUST be set;
  expired or revoked approvals immediately block reads.
- **Permitted.** Raw record read for the explicitly named purpose,
  for the explicitly named scope, until the explicit expiry.
- **Forbidden.** Open-ended L4 reads. Implicit approvals.
  Cross-purpose reads. Reads after expiry or revocation. The
  TRUST1 read model enforces this: the rule
  `rule_no_fake_approval` blocks any L4 decision without
  `explicit_approved`.

---

## §O · Security review checklist

| # | Check | Expected |
|---|-------|----------|
| O1 | Secrets never in code or manifests (regex audit) | `git grep -nE '(API_KEY=[A-Za-z0-9]{20,}\|SECRET_KEY=[A-Za-z0-9]{20,}\|sk-[A-Za-z0-9]{20,}\|aws_secret_access_key=[A-Za-z0-9]{20,})'` returns no matches in staged files |
| O2 | No hardcoded subscription / tenant IDs | `git grep -nE '/subscriptions/[0-9a-f-]{36}\|"tenantId"\s*:\s*"[0-9a-f-]{36}"'` returns no matches |
| O3 | Auth not modified | `src/lib/auth/**`, `src/middleware.ts`, and any Clerk integration files are unchanged in this slice's diff |
| O4 | All future-only actions clearly disabled | Any UI button / link that would trigger a deferred action (provision tenant, deploy lab, approve L4, send to client cloud) carries an explicit `disabled` attribute and a visible "deferred" / "future" chip |
| O5 | Hairline borders / canon-compliant chrome | Any visible UI shell (PROD3 panel, optional ADM6 surface) uses hairline borders and canon-compliant chrome per AbarVa Visual Canon (DES1) |
| O6 | Dark surfaces only on Atlas Brief / pattern detail per canon §F | The TEN / TRUST / CLOUD / PROD / ADM surfaces use the canon light surface (#F8F7F4 / #FFFFFF). Dark surfaces are reserved for Atlas Brief and pattern detail per canon §F. |

---

## §P · Morning review / PR merge rules

- **Merge gated on PROD2 `passed: true`.** No batch is merged unless
  the PROD2 production-readiness validator returns `passed: true`
  on the merged manifest. The validator runs after the integration
  agent's cherry-pick and before the founder approves the PR.
- **Conservative-status policy preserved.** No status promotion
  happens without explicit founder approval. `validation_qa` stays
  `tested`; `production_deployment` stays `blocked`; the
  `prod-deploy-verification` and `qa-ci-gates` blockers are
  preserved verbatim. UNION-notes / UNION-blockers / UNION-nextAction
  apply per the OPS1 §G–§H conflict policy.
- **Cherry-pick path canonical.** TEN1 → TEN2 → TEN3 → TRUST1 →
  TRUST2 → TRUST3 → CLOUD1 → CLOUD2 → CLOUD3 → CLOUD4 → CLOUD5 →
  PROD4 → ADM6 → QA8. Conditional slices in this list are skipped
  (the cherry-pick simply moves to the next installed slice). QA8
  is always last in the merge order so its runbook references all
  installed enterprise / cloud / trust slices.

### QA8 staged set (exactly four files)

```
docs/build/ENTERPRISE_DEPLOYMENT_TRUST_VERIFICATION_RUNBOOK.md
docs/build/slices/QA8_ENTERPRISE_DEPLOYMENT_TRUST_VERIFICATION.md
docs/build/build-slices.json
docs/build/production-readiness.json
```

After staging, run:

```bash
cd /Users/anand/Projects/nexus-enterprise-qa8 && \
  git diff --cached --name-only
```

The output MUST list exactly the four files above and nothing else.

---

## End of runbook

QA8 is documentation only. No application code, no runtime
modification, no migrations, no model calls, no live retrieval, no
browser automation. The runbook adds the eighth founder-facing
verification surface and preserves all existing conservative-status
guardrails.
