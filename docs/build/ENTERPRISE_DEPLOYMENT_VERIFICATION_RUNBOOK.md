# Enterprise Deployment Verification Runbook

Slice ID: CLOUD7
Slice name: Enterprise Deployment Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Wave3 Lane G (parallel build pack — overnight batch)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls, no live cloud calls.

This runbook is the founder-facing checklist for verifying the
**enterprise deployment posture** of the AbarVa platform — the four
deployment tiers (SaaS pilot, dedicated tenant, private data plane,
fully self-managed), the Azure VNet reference lab, the Docker
runtime packaging, the dataset trust contract, the agent data access
policy, the evidence manifest mode contract, the model provider
policy, the runtime safety gate, the unified audit ledger, the
no-fabrication contract, the CI / Vercel readiness signal, the
security review checklist, and the morning review / merge gates —
land **honestly** before push, PR, or pilot conversation.

CLOUD7 is the **deployment-tier-walk** runbook. It is sibling to QA8
(`ENTERPRISE_DEPLOYMENT_TRUST_VERIFICATION_RUNBOOK.md`), which walks
the slice contracts as filed. CLOUD7 instead walks the **operator
posture** that a regulated enterprise buyer or a security review
team would walk against a dry-run of the platform. The two runbooks
are designed to be executable in either order.

The runbook is meant to be **walked manually** after the relevant
slice work has reached `code_complete`. It supports:

- Solo overnight founder review when an enterprise / cloud / trust
  batch lands.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-customer-conversation dry-run when an enterprise tier prospect
  asks "where does our data physically live, and who can see it?"
- Pre-pilot dry-run when a SaaS-tier prospect asks "what changes if
  we move from SaaS to dedicated tenant?"

Each section has one expected outcome per row; do not skip rows.

---

## §A · SaaS pilot readiness

CLOUD7 §A asserts the **shared multi-tenant SaaS pilot tier** —
today's default — is honestly described and honestly defended. The
pilot tier is the only tier that is operable today; it is the
reference posture every other tier diverges from.

| # | Check | Expected outcome |
|---|-------|------------------|
| A1 | TEN1 SaaS tenancy architecture lands the canonical four-tier vocabulary | `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md` exists; vocabulary covers SaaS / Dedicated / Private Data Plane / Self-Managed |
| A2 | TEN2 tenant isolation read model declares five canonical isolation levels | `src/lib/architecture/tenant-isolation-data-boundary.ts` exports five levels (logical_row_level, schema_per_tenant, database_per_tenant, cluster_per_tenant, network_per_tenant) |
| A3 | Tenant registry stub is deterministic | No live DB call, no live auth call, fixture-only |
| A4 | Tenant admin / platform admin separation is visible in fixture | TEN2 tenant boundary fixture has at least two distinct tenant rows with different admin actors |
| A5 | Model gateway is shared and contract-only | MG2 model gateway contract documents shared egress for SaaS tier; no per-tenant model contract is required for pilot |
| A6 | The phrase "production_ready" does not appear against the SaaS tier | `production_deployment.status` remains `blocked`; no slice promotes the tier |

If any §A row fails: **stop**. Do not promise SaaS pilot to a
prospect until TEN1 / TEN2 / MG2 are landed and recorded as
`code_complete` or higher in `build-slices.json`.

---

## §B · Dedicated tenant tier readiness

CLOUD7 §B walks the **single-tenant-on-AbarVa-cloud** tier — TEN3.
This is the lowest-effort upgrade from SaaS pilot for a buyer who
cannot accept multi-tenant data plane. Verified only if TEN3 has
landed.

| # | Check | Expected outcome |
|---|-------|------------------|
| B1 | TEN3 dedicated-tenant blueprint lands | `docs/build/slices/TEN3_DEDICATED_TENANT_BLUEPRINT.md` exists |
| B2 | Dedicated DB / storage / vector / graph / audit boundaries are documented | TEN3 §1–§5 cover each plane |
| B3 | Dedicated model gateway posture is documented | TEN3 documents per-tenant gateway scope; no shared egress required |
| B4 | Dedicated SSO posture is documented | TEN3 documents tenant-scoped SSO / OIDC / Azure AD B2C |
| B5 | Onboarding / upgrade / backup paths are documented | TEN3 §6 covers the operator runbook |
| B6 | No production-ready claim is made | TEN3 keeps `production_deployment.status` at `blocked` |

When TEN3 has not landed: record `deferred` in the morning review
note (§N), not `failed`.

---

## §C · Private data plane tier readiness

CLOUD7 §C walks the **control-plane-stays-AbarVa, data-plane-runs-
in-client-cloud** tier — CLOUD1 strategy + CLOUD2 Azure VNet path.
This is the highest-stakes tier for a buyer with hard data
residency or audit requirements.

| # | Check | Expected outcome |
|---|-------|------------------|
| C1 | CLOUD1 four-tier strategy contract is filed | `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md` exists |
| C2 | CLOUD1 control plane vs data plane separation is explicit | §2 of the architecture doc names what AbarVa runs and what client cloud owns |
| C3 | CLOUD1 dependency replacement matrix is filed | §3 maps Vercel → Container Apps / Cloud Run, Supabase → Azure Postgres / Cloud SQL, Vercel Blob → Azure Blob / GCS, Clerk → Azure AD B2C / Identity Platform |
| C4 | CLOUD1 trust implications per tier are documented | §4 cross-references TRUST1 / TRUST2 |
| C5 | CLOUD1 model gateway posture per tier is documented | §5 names client-egress vs AbarVa-egress vs client-owned-contract |
| C6 | CLOUD1 operational responsibilities per tier are documented | §6 names who owns upgrades, backups, rotations, incidents |
| C7 | No production-ready promotion is made | `production_deployment.status` remains `blocked` |

---

## §D · Azure VNet reference lab

CLOUD7 §D walks the **Azure VNet reference lab** — CLOUD2 blueprint
and CLOUD5 Bicep starter. Verified only if CLOUD2 / CLOUD5 have
landed. The lab is the canonical Azure-side posture every private
data plane prospect will want to see before signing.

| # | Check | Expected outcome |
|---|-------|------------------|
| D1 | CLOUD2 Azure VNet blueprint lands | `docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md` exists |
| D2 | Resource list covers VNet, app subnet, PE subnet, Container Apps Env, Container App, Postgres Flexible, Storage, Key Vault, Log Analytics | CLOUD2 §3 enumerates each resource |
| D3 | CLOUD5 Bicep starter parses | `az bicep build --file infra/azure/container-apps-vnet/main.bicep` succeeds |
| D4 | Parameters file uses `<replace-me>` placeholders | `infra/azure/container-apps-vnet/parameters.example.json` carries no real values except the example location |
| D5 | No hardcoded secrets, subscription IDs, or tenant ID literals | grep against `main.bicep` returns nothing matching `[0-9a-f]{8}-[0-9a-f]{4}-` |
| D6 | README marks STARTER / LAB / not production | `infra/azure/container-apps-vnet/README.md` contains the words STARTER, LAB, and "not production" |
| D7 | No live `az deployment group create` is invoked | Validation commands stop at `az bicep build` and `az deployment group what-if` |

When CLOUD2 / CLOUD5 are not installed: record `deferred`.

---

## §E · Docker runtime packaging

CLOUD7 §E walks the **Docker packaging** tier — CLOUD3. Verified
only if CLOUD3 has landed.

| # | Check | Expected outcome |
|---|-------|------------------|
| E1 | Multi-stage `Dockerfile` exists at repo root | At least three stages (deps, build, runtime) |
| E2 | Final stage runs as non-root user | `USER node` or equivalent is set before `CMD` |
| E3 | No baked secrets | grep against `Dockerfile` returns no `ghp_`, `sk-`, `sk-ant-`, `eyJ.eyJ.`, `AKIA` |
| E4 | `.dockerignore` covers `node_modules`, `.env`, `.git`, `reports/` | All four entries present |
| E5 | `scripts/verify-docker-build.sh` exits 0 whether Docker is present or not | Script is honest about Docker absence |
| E6 | No live `docker push` to a registry is invoked | Slice is build-only |

When CLOUD3 is not installed: record `deferred`.

---

## §F · Dataset trust contract

CLOUD7 §F walks the **dataset trust** contract — TRUST1 sharing
levels (L0–L4) and trust ladder (loaded → metadata_only →
sample_summary → audited_summary → decision_grade).

| # | Check | Expected outcome |
|---|-------|------------------|
| F1 | TRUST1 dataset trust model lands | `src/lib/architecture/dataset-trust-model.ts` exists |
| F2 | Five sharing levels are exported (L0–L4) | TRUST1 exports L0_metadata_only, L1_summary_only, L2_aggregated, L3_redacted_raw, L4_sensitive_raw |
| F3 | Five trust ladder states are exported | loaded → metadata_only → sample_summary → audited_summary → decision_grade |
| F4 | L4 sensitive raw is BLOCKED unless explicitly approved | TRUST1 fixture has at least one L4 row with `agentAccessApproved: false` |
| F5 | Approval workflow is not derivable from a summary alone | TRUST1 documents that L1 → L4 transition requires reviewer + approver step |
| F6 | Revoked / expired trust blocks agent use | TRUST1 fixture covers at least one revoked row and one expired row; agent matrix denies access |

---

## §G · Agent data access policy

CLOUD7 §G walks the **agent data access** matrix — TRUST2.

| # | Check | Expected outcome |
|---|-------|------------------|
| G1 | TRUST2 agent data access policy matrix lands | `src/lib/architecture/agent-data-access-policy.ts` exists |
| G2 | Matrix covers all four canonical agents | Atlas, Maestro, Sentinel, Source each have at least one row |
| G3 | Matrix covers all five sharing levels | L0 / L1 / L2 / L3 / L4 each represented |
| G4 | Default-deny posture is honored | Any L4 row with no explicit approval row resolves to `denied` |
| G5 | Approval evidence is required | Each approved row carries `approvedBy`, `approvedAt`, and an evidence reference |
| G6 | Revoked rows resolve to `denied` regardless of prior approval | Matrix fixture covers the revocation case |

---

## §H · Evidence manifest mode

CLOUD7 §H walks the **evidence manifest** mode — EVID2 ledger and
EVID3 claim/support model.

| # | Check | Expected outcome |
|---|-------|------------------|
| H1 | EVID2 evidence ledger lands | `src/lib/evidence/ledger.ts` or equivalent read model exists |
| H2 | Manifest mode is the only public path | No agent emits a claim without an accompanying evidence reference |
| H3 | EVID3 claim/support model exists | Claim → support → counter-support shape documented |
| H4 | Manifest mode is honest about absence | When evidence is missing, the agent surfaces "evidence unavailable" rather than fabricating a citation |
| H5 | Evidence references resolve deterministically in fixtures | No fixture row points to a non-existent evidence id |
| H6 | Evidence ledger is append-only in posture | Documented as immutable; no UPDATE / DELETE path |

---

## §I · Model provider policy

CLOUD7 §I walks the **model provider** policy — MG2 model gateway
contract.

| # | Check | Expected outcome |
|---|-------|------------------|
| I1 | MG2 model gateway contract lands | `docs/architecture/MG2_MODEL_GATEWAY_CONTRACT.md` exists |
| I2 | Per-tier model provider policy is documented | SaaS shared egress / Dedicated tenant-scoped / Private client-egress / Self-Managed client-owned |
| I3 | No direct Anthropic / OpenAI / Cohere SDK call from outside the gateway | grep `from ['"]openai['"]` / `from ['"]@anthropic-ai/sdk['"]` returns matches only inside `src/lib/model-gateway/**` |
| I4 | Egress allowlist is documented per tier | MG2 names the allowed hostnames per tier |
| I5 | No live model call is made by validation commands | Validation suite is fixture-only |
| I6 | No real API key is committed | Repo grep returns no `sk-`, `sk-ant-`, `ghp_`, `eyJ.eyJ.` tokens outside `.env*.example` |

---

## §J · Runtime safety gate

CLOUD7 §J walks the **runtime safety** gate — the deterministic
guardrail that stops the agent from invoking a tool the manifest
forbids or the policy denies.

| # | Check | Expected outcome |
|---|-------|------------------|
| J1 | Runtime safety gate read model lands | Documented in `src/lib/safety/runtime-safety-gate.ts` (or equivalent) |
| J2 | Gate evaluates tool invocation before egress | Documented in the gate contract |
| J3 | Gate denies any tool not in the agent manifest | Fixture covers a "tool not in manifest" denial |
| J4 | Gate denies any data access above the agent's TRUST2 level | Fixture covers an L4 denial for a Tier 2 agent |
| J5 | Gate emits a unified audit event on every decision | AUD2 audit ledger has a `gate_check` and a `gate_transition` row |
| J6 | Gate has no bypass | No code path skips the gate; documented as the only egress |

---

## §K · Unified audit

CLOUD7 §K walks the **unified audit** ledger — AUD2.

| # | Check | Expected outcome |
|---|-------|------------------|
| K1 | AUD2 unified audit event read model lands | `src/lib/architecture/unified-audit-events.ts` exists |
| K2 | All 15 canonical event types are emitted in the fixture | agent_recommendation, agent_handoff, evidence_used, evidence_blocked, tool_invocation, model_gateway_decision, gate_check, gate_transition, deliverable_generated, deliverable_approved, deliverable_superseded, user_action, readiness_update, route_smoke_result, governance_decision |
| K3 | Every event carries `immutable: true`, `traceId`, `tenantKey`, `workObject`, and `createdFrom` | AUD2 fixture asserted by integration test |
| K4 | All three actor kinds (human, agent, system) are represented | AUD2 fixture covers each kind |
| K5 | No live audit ledger persistence is claimed | AUD2 status remains `code_complete`; production audit ledger remains deferred |
| K6 | No fake live audit refresh is shown | UI surfaces honest "deterministic audit seed" disclaimer |

---

## §L · No-fabrication contract

CLOUD7 §L walks the **no-fabrication** contract — the platform-wide
posture that no agent emits a claim without evidence, no UI shows a
fake green CI bar, no surface invents a dollar amount or a citation.

| # | Check | Expected outcome |
|---|-------|------------------|
| L1 | No fake citations | Every claim in a deliverable resolves to an EVID2 evidence id |
| L2 | No fake approvals | Every approved row in any fixture carries a real reviewer + approver pair |
| L3 | No fake dollar amounts | Every dollar figure on any surface resolves to a TRUST1 / TRUST2 sourced value or is labeled as illustrative |
| L4 | No live model claim | No surface or doc claims a model call has been made when validation is fixture-only |
| L5 | No fake live monitoring claim | No "live" chip text in any UI when the underlying API returns `liveStatus: unavailable` |
| L6 | "Honest unavailable" pattern is the default | When data is absent, the surface says so explicitly with a deterministic next-action note |

---

## §M · CI / Vercel signal + security checklist + morning review

CLOUD7 §M walks the **CI / Vercel readiness** ingestion path
(PROD3 / PROD4 / PROD5), the **security review checklist**, and the
**morning review / PR merge** rules.

### §M.1 CI / Vercel signal

| # | Check | Expected outcome |
|---|-------|------------------|
| M1.1 | PROD3 live refresh API is in place | `/api/admin/production-readiness/refresh` returns `liveStatus`, `lastRefreshedAt` |
| M1.2 | PROD4 deployment-status route returns `liveStatus: unavailable` honestly when tokens absent | No fake green chip |
| M1.3 | PROD5 DeploymentStatusCard renders honest unavailable display | Chip "unavailable", "—" for last-checked, deterministic next action mentioning `GITHUB_STATUS_TOKEN` and `VERCEL_STATUS_TOKEN` |
| M1.4 | ESLint passes | `npm run lint` exits 0 |
| M1.5 | Routes-and-disclaimers contract passes | Designated jest suite exits 0 |
| M1.6 | Vercel `abarva` and `nexus` projects show green on the deploy dashboard | Manual check — record commit SHA |
| M1.7 | Supabase Preview skipping is acceptable | The Supabase Preview check is read-only and may skip without blocking the PR |

### §M.2 Security review checklist

| # | Check | Expected outcome |
|---|-------|------------------|
| M2.1 | No secrets in code or manifests | Repo grep returns no live tokens |
| M2.2 | No hardcoded subscription / tenant IDs | grep returns no GUID literals in `infra/**` outside example files |
| M2.3 | Auth is not modified | No file under `src/lib/auth/**` is in the slice's allowedFiles |
| M2.4 | Future-only actions are clearly disabled | Any `<button disabled>` for future-only actions is paired with a deterministic next-action note |
| M2.5 | Hairline borders / canon-compliant chrome | All new surfaces import COLORS / FONT / BORDER / RADIUS / SPACING / TYPE from `@/lib/design/abarva-theme`; no local hex literals |
| M2.6 | Dark surfaces only on Atlas Brief or pattern detail per canon §F | No new dark surface introduced outside canon |
| M2.7 | `.env.*.example` files contain placeholders only | CLOUD8 Jest contract covers this |

### §M.3 Morning review / PR merge rules

| # | Check | Expected outcome |
|---|-------|------------------|
| M3.1 | PR merge gated on `PROD2 passed: true` | If PROD2 fails, do not merge |
| M3.2 | Conservative-status policy preserved | No slice promotes any component beyond its honest status |
| M3.3 | Canonical cherry-pick path honored | TEN1 → TEN2 → TEN3 → TRUST1 → TRUST2 → TRUST3 → CLOUD1 → CLOUD2 → CLOUD3 → CLOUD4 → CLOUD5 → CLOUD7 → CLOUD8 → PROD4 → PROD5 → ADM6 → QA8 |
| M3.4 | Lane agents commit only | No lane agent runs `git push` or `gh pr create` |
| M3.5 | Integration agent owns merges | Integration agent owns cherry-picks, merges, and the morning review note |
| M3.6 | Founder owns the push and merge decisions | Final push / merge requires explicit founder approval |
| M3.7 | Conditional rows recorded as `deferred`, not `failed` | When TEN3 / TRUST3 / CLOUD3 / CLOUD4 / CLOUD5 / PROD4 / ADM6 are not installed, record `deferred` |

---

## §N · Morning review note template

The integration agent records a single-page morning review note
after CLOUD7 has been walked. The template:

```
CLOUD7 morning review — <YYYY-MM-DD>

§A SaaS pilot ........................ <pass|fail|deferred>
§B Dedicated tenant .................. <pass|fail|deferred>
§C Private data plane ................ <pass|fail|deferred>
§D Azure VNet lab .................... <pass|fail|deferred>
§E Docker packaging .................. <pass|fail|deferred>
§F Dataset trust contract ............ <pass|fail|deferred>
§G Agent data access policy .......... <pass|fail|deferred>
§H Evidence manifest mode ............ <pass|fail|deferred>
§I Model provider policy ............. <pass|fail|deferred>
§J Runtime safety gate ............... <pass|fail|deferred>
§K Unified audit ..................... <pass|fail|deferred>
§L No-fabrication contract ........... <pass|fail|deferred>
§M.1 CI / Vercel signal .............. <pass|fail|deferred>
§M.2 Security review checklist ....... <pass|fail|deferred>
§M.3 Morning review / PR merge rules . <pass|fail|deferred>

Slices walked: <list of slice IDs>
Slices deferred: <list of slice IDs not installed>
Blockers preserved: <list of blocker ids>
Promotions made: NONE (CLOUD7 promotes nothing)
Push / merge decision: <DEFER | APPROVE>
```

If any required §A / §C / §F / §G / §H / §I / §J / §K / §L row
fails: do not push, do not merge, do not promote. The runbook is
the deterrent against an honest enterprise pitch becoming a
fabricated one.

---

## Cross-references

- QA8 — `ENTERPRISE_DEPLOYMENT_TRUST_VERIFICATION_RUNBOOK.md`
  (sibling runbook, walks slice contracts as filed)
- CLOUD1 — Enterprise / Private Deployment Strategy
- CLOUD2 — Azure VNet reference lab blueprint
- CLOUD3 — Docker runtime packaging
- CLOUD4 — Local private deployment lab
- CLOUD5 — Azure Container Apps + VNet IaC starter
- CLOUD8 — Env example gitignore policy
- TEN1 / TEN2 / TEN3 — tenant isolation tier vocabulary
- TRUST1 / TRUST2 / TRUST3 — dataset trust + agent data access
- EVID2 / EVID3 — evidence ledger + claim/support
- AUD2 — unified audit event read model
- MG2 — model gateway contract
- PROD3 / PROD4 / PROD5 — production-readiness live refresh +
  deployment-status surface
