# Enterprise AI Readiness Roadmap

> AbarVa's posture for enterprise InfoSec, model-risk, and procurement diligence.
> Status: draft v0.1 — supersedes any ad-hoc AI integration assumptions.
> Scope: every external AI/model/rendering call AbarVa makes — Claude, Gamma, OpenAI, Pinecone, others.
> Owners: Architecture. Reviewers: Product, Security, Legal.

## 0. Executive summary — the core message

AbarVa is **a deterministic decision system with optional AI reasoning and rendering**.

The decision verdict is computed by an auditable expert kernel against curated Domain Function Packs. Large-language models (Claude, GPT, Gemini) and presentation models (Gamma) are *language and rendering* layers, not decision-makers. Every external AI call traverses a single **AI Egress Control Plane** governed by per-tenant policy: data classification, redaction, human approval, audit logging, and provider routing.

This document is the procurement-grade answer to *"are you sending our data to Claude/Gamma and hoping for the best?"*. The answer is no. We do not depend on trust; we depend on controls.

What follows is the roadmap across three dimensions:
- **Architecture** — the AI Egress Control Plane and per-tenant provider routing.
- **Governance artifacts** — Model Use Cards, HITL bill of materials, subprocessor registry, allowed-use matrices, audit schema.
- **Organizational** — SOC 2 path, AI red-team evidence, vendor DPAs, EU AI Act / NIST AI RMF posture.

## 1. AI threat model

### 1.1 Threats

| # | Threat | Vector | Severity |
|---|---|---|---|
| T1 | Confidential data egress to a third-party AI processor | Prompt content sent to Claude/Gamma | High for confidential / restricted classes |
| T2 | Prompt injection via tenant-supplied content | Malicious instructions in a document, email, or context chunk steer the model | High |
| T3 | Cross-tenant data leakage via prompt or output | A bug routes Tenant A's context into Tenant B's call | High — pilot-killing |
| T4 | Hallucinated number presented as fact | Honesty-discipline failure; a fabricated figure reaches a board deck | High |
| T5 | AI self-approval of a control or gate | A bug or misconfigured workflow lets an agent close its own approval | High (regulatory) |
| T6 | Training-data leakage (vendor side) | A provider trains on inputs without ZDR | High for regulated tenants |
| T7 | Vendor breach exposes tenant data | Anthropic / Gamma / Microsoft / AWS breach | Medium — mitigated by minimization + ZDR + customer routing |
| T8 | Service-tier dependency outage | Anthropic outage takes AbarVa down | Medium — mitigated by provider fallback + kernel-only mode |
| T9 | Regulatory non-compliance (EU AI Act, NIST AI RMF, SR 11-7, GDPR) | Use outside the allowed envelope for a high-risk AI system | High in regulated verticals |
| T10 | Output binding to autonomous action | An LLM recommendation triggers a state change without human approval | High |

### 1.2 Controls (the AbarVa side)

- **Deterministic kernel.** The verdict (`fund` / `shape` / `kill`), value forecast (planning range), kill criteria are produced by code, not an LLM. Reproducible per audit.
- **Curated Function Packs.** Industry depth (12 functions × 3 verticals = 36 packs) is hand-authored content, not LLM output. Every benchmark is a labelled planning range; every claim has an evidence anchor.
- **Honesty discipline.** Planning ranges never asserted as fact; absent metrics become *named* seed gaps; the kernel blocks `fund` when monetisation is seed-gapped.
- **R8 — no AI self-approval.** Gates are advanced by humans only. See HITL bill of materials (§8).
- **Injection-defense at context binding.** Untrusted tenant content is fenced as data, never trusted as instructions.
- **Per-tenant RLS.** Enforced on the Azure DB (post-cutover).
- **Egress refusal as default.** Today's Gamma path already refuses `?moveId=` (real-tenant) egress at the route. Layer 1 of the Egress Control Plane extends that posture to every external model call.

### 1.3 Residual risk

Even with all controls, a model is still a model. AbarVa's posture is that AI assists *structure and language*; it does not produce *the decision*. CISO and MRM teams should validate that boundary against the Model Use Cards (§6).

## 2. Tenant AI Policy model

Every tenant carries an AI policy. The Egress Control Plane consults it on every external call.

```jsonc
// tenants.ai_policy (JSONB, per tenant)
{
  "allowExternalAI": false,                       // master switch — default off
  "allowClaude": true,
  "allowedClaudeRoute": "azure-foundry-private",  // anthropic-direct | azure-foundry-private | bedrock | gcp-vertex | none
  "allowGamma": false,
  "allowOpenAI": false,
  "maxDataClass": "confidential",                 // public | internal | confidential | restricted
  "requireRedaction": true,
  "requireHumanApprovalForExports": true,
  "dataResidency": "EU",                          // US | EU | UK | unrestricted
  "byokKeyVaultRef": "kv-tenant-acme/key1",       // optional CMK reference
  "promptResponseRetentionDays": 90,              // audit retention window
  "modelFallbackChain": ["claude-azure", "gpt-azure"],
  "kernelOnlyMode": false                         // true => deterministic kernel only, no LLM
}
```

**Defaults are conservative.** A new tenant cannot egress to any provider until the policy is explicitly relaxed by an admin — and the relaxation event itself is logged in the audit trail.

**Enforcement.** Policy is loaded by the Egress Control Plane wrapper at call-time. Misconfiguration fails closed (block + log + surface an honest reason to the user). The wrapper is the only path; direct provider SDK calls outside the wrapper are an architectural violation.

## 3. Provider routing architecture

The wrapper resolves a tenant's AI route at call-time. Four routes are first-class, plus a kernel-only fallback:

| Route key | What it is | Use |
|---|---|---|
| `anthropic-direct` | Anthropic public API, optionally with enterprise terms (ZDR, dedicated capacity) | Demo / low-risk / non-regulated |
| `azure-foundry-private` | Claude via **Microsoft Foundry**, customer's Azure subscription, private endpoint, region-pinned | Default for Azure-first enterprises |
| `bedrock` | Claude on AWS Bedrock — customer's AWS account, region, IAM | AWS-first enterprises |
| `gcp-vertex` | Claude on GCP Vertex AI | GCP-first enterprises |
| `none` | Kernel-only mode | Tenants where no LLM is allowed |

### Microsoft Foundry — the practical nuance

- Foundry hosts Anthropic Claude models and supports a Messages-API style endpoint.
- **Private networking is supported**, but some hosted-agent / tools / traces / workflow-agent features are **partial or limited**.
- AbarVa uses Foundry as a **model route** — a Claude endpoint with private networking — **not** as a hosted-agent runtime. The agent loop runs in AbarVa's own compute; only the model call lands in Foundry. This keeps us inside the supported envelope.

*References:* Microsoft Foundry — Anthropic Claude models; Foundry private link / private networking docs.

### Single call path

```
AbarVa app code
   |
   v
callModel(tenantId, prompt, options)
   |
   +-- load tenant AI policy
   +-- classify payload (data class, PII flags)
   +-- check policy gate          (allow / allow-with-approval / deny)
   +-- redact if requireRedaction (Layer 2)
   +-- resolve AI route from policy
   +-- POST to provider endpoint  (region, ZDR, BYOK as configured)
   +-- on failure: fall back per modelFallbackChain
   +-- log to ai_egress_audit     (§7)
   +-- return response (or honest refusal if policy denied)
```

Application code is unchanged. `callModel(tenantId, prompt, options)` is the only path. The rest of the app does not know — and must not assume — which provider answered.

## 4. Allowed-use matrix (Claude / Gamma / others)

The Egress Control Plane decides per-call. The matrix below is the default floor; per-tenant policy can tighten further but never loosen below this.

| Data class | Workflow | Claude — any route | Claude — private-routed (Foundry/Bedrock/Vertex) | Gamma | OpenAI / embeddings |
|---|---|---|---|---|---|
| **Public** (marketing copy, public spec) | Any | Allow | Allow | Allow | Allow |
| **Internal** (sanitized exec narrative, planning ranges only) | Any | Allow | Allow | Allow with approval | Allow |
| **Confidential** (real value figures, vendor pricing, internal financials) | Reasoning | Allow only on private-routed Claude + ZDR | Allow | **Block** unless tenant explicitly approves a *sanitized brief* | Private-routed only |
| **Restricted** (PII, account numbers, contracts, regulated data) | Reasoning | **Block** | Allow with explicit per-call human approval + audit | **Block absolutely** | **Block** — kernel-only |
| **Any** | Generating a board-grade artifact for a *real* tenant Move via Gamma | n/a | n/a | **Block in pilot.** Sanitized brief opt-in only. | n/a |

### Today's posture (the snapshot)

- **Gamma** is enabled only for the Apex *reference* (synthetic) decks. `?moveId=` egress is refused at the route. This sits in the "Public/Demo" row only.
- **Claude reasoning calls** are currently un-gated at the wrapper level (they are subject to R8 at the workflow level, but not yet routed through the Egress Control Plane). Layer 1 fixes this.

## 5. InfoSec approval checklist

What every diligence cycle will demand. *Status* = today; *Need* = before that diligence is passable.

| # | Item | Status today | Need |
|---|---|---|---|
| 1 | Subprocessor list (Anthropic, Gamma, OpenAI, Microsoft, AWS, Pinecone, Neo4j, Resend, PostHog, Clerk, Supabase) | Implicit — not formally published | Public list + linked DPAs |
| 2 | DPA + ZDR confirmation per vendor | Not centrally stored | Subprocessor registry table — actual contract reference + signed-on date |
| 3 | Data residency per tenant | Not enforced | Tenant `dataResidency` policy + routing |
| 4 | Customer data used for training | Vendor terms-dependent | ZDR confirmed in writing per vendor for enterprise tenants |
| 5 | Prompt / response logging | Partial | Full audit-and-replay schema (§7) |
| 6 | Encryption at rest + BYOK / CMK | At rest yes; BYOK no | Tenant `byokKeyVaultRef` honored end-to-end |
| 7 | PII handling | Not scanned | PII detection + redaction (Layer 2) |
| 8 | Right-to-delete | Not exercised | Documented workflow + vendor-confirmed deletion |
| 9 | Model risk documentation (MRM / SR 11-7) | None | One Model Use Card per workflow (§6) |
| 10 | AI red-team evidence | None | Internal red-team report — jailbreak, cross-tenant probe, kernel coercion |
| 11 | SOC 2 status | Pre-SOC 2 | Vanta/Drata track → Type I → Type II roadmap |
| 12 | Tenant isolation proof | Per-user RLS enforced post-Azure cutover | RLS pen-test report + design doc |
| 13 | Human-approval proof (HITL) | R8 enforced in code; not formally documented | Formal HITL bill of materials (§8) |
| 14 | EU AI Act / NIST AI RMF readiness | Not assessed | Risk-class self-assessment per high-risk use; conformity roadmap |
| 15 | Security questionnaire (CAIQ) | None | Drafted standard response |

## 6. Model Use Card — template + worked example

Every AI-using workflow carries a Model Use Card. This is the artifact a CIO / MRM team will ask for first.

### 6.1 Template

```yaml
workflow: <name>
purpose: <what business job this workflow does>
data_in:
  fields: [list]
  data_classes: [public | internal | confidential | restricted]
  pii: [yes | no — types]
model:
  primary: <model + version>
  fallback_chain: [list]
  route_options: [list]
allowed_to_do:
  - <action>
not_allowed_to_do:
  - <action>
human_approval_gates:
  - <step that requires human>
evaluations:
  - benchmark: <name>
    score: <value or range>
    sample_size: <n>
failure_modes:
  - <mode> -> <mitigation>
fallback_when_unavailable: <kernel-only | human-only | queue>
retention: <log retention days>
last_reviewed: <date>
reviewer: <human>
```

### 6.2 Worked example — Costed Business Case (board-grade)

```yaml
workflow: board-grade-business-case
purpose: produce a board-grade costed business case for a Move
data_in:
  fields: [move.baseline_metrics, move.charter, bound Function Pack]
  data_classes: [internal, confidential]
  pii: no
model:
  primary: claude-3.7-sonnet (route per tenant policy)
  fallback_chain: [gpt-4-via-foundry, kernel-only]
  route_options: [anthropic-direct, azure-foundry-private, bedrock, gcp-vertex]
allowed_to_do:
  - language polishing of pack-bound section content
  - generating prose from structured kernel output
not_allowed_to_do:
  - inventing or altering benchmark figures (planning ranges only, verbatim from pack)
  - producing the verdict (kernel-only)
  - claiming sources not in the pack's evidence anchors
human_approval_gates:
  - gate approval (R8 — AI cannot self-approve)
  - publishing the artifact externally
evaluations:
  - benchmark: honesty-discipline-eval
    score: pending (target 100% planning-range preservation, zero fabricated numbers)
    sample_size: pending
failure_modes:
  - hallucinated benchmark -> caught by pack-content invariant check pre-render
  - fabricated `fund` -> impossible (kernel deterministic)
  - prompt injection via uploaded doc -> fenced as data (Threat T2 mitigation)
fallback_when_unavailable: kernel-only (renders the deck without LLM polish)
retention: 365 days
last_reviewed: 2026-05-22
reviewer: TBD
```

A Model Use Card exists for *every* workflow that touches a model — bet-selection, intelligence reasoning, source-event triage, evidence ingestion, and any others.

## 7. AI Egress Audit Schema

Every external call to a model or rendering provider produces a row. The audit log is the diligence artifact.

```sql
CREATE TABLE ai_egress_audit (
  id                    UUID PRIMARY KEY,
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  user_id               UUID NULL REFERENCES users(id),
  workflow              TEXT NOT NULL,           -- e.g. 'board-grade-business-case'
  artifact_id           UUID NULL,               -- the artifact this call produced/influenced
  provider              TEXT NOT NULL,           -- 'anthropic' | 'gamma' | 'openai' | ...
  route                 TEXT NOT NULL,           -- 'azure-foundry-private' | ...
  model                 TEXT NOT NULL,           -- model name + version
  data_class            TEXT NOT NULL,           -- 'public' | 'internal' | 'confidential' | 'restricted'
  policy_decision       TEXT NOT NULL,           -- 'allow' | 'allow-with-approval' | 'deny'
  approver_user_id      UUID NULL,               -- the human who approved, if required
  redaction_applied     BOOLEAN NOT NULL,
  prompt_hash           TEXT NOT NULL,           -- sha256 of prompt (or sanitized prompt)
  response_hash         TEXT NULL,               -- sha256 of response
  prompt_snapshot_ref   TEXT NULL,               -- optional pointer to encrypted prompt store
  response_snapshot_ref TEXT NULL,               -- optional pointer to encrypted response store
  latency_ms            INTEGER NULL,
  rate_limit_remaining  INTEGER NULL,
  credits_deducted      INTEGER NULL,
  status                TEXT NOT NULL,           -- 'success' | 'failed' | 'denied' | 'timeout'
  error_message         TEXT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_egress_audit_tenant_time     ON ai_egress_audit (tenant_id, created_at);
CREATE INDEX idx_ai_egress_audit_workflow_time   ON ai_egress_audit (workflow, created_at);
CREATE INDEX idx_ai_egress_audit_provider_time   ON ai_egress_audit (provider, created_at);
```

**Snapshot stores** (`prompt_snapshot_ref`, `response_snapshot_ref`) point to an encrypted blob store with per-tenant CMK encryption — populated only when policy requires full replayability beyond hash. Default: hashes only; full snapshots for regulated tenants only, within `promptResponseRetentionDays`.

**Replay** is a separate service: given an audit row, reconstruct the call and its result, within the snapshot retention window. This is the artifact a legal-hold or MRM-audit request will demand.

**Policy-change events** (a tenant's `ai_policy` is modified) are themselves logged — to `tenant_policy_audit` with the prior/next snapshot — so a CISO can show a clean chain of who approved each loosening.

## 8. Human-in-the-loop bill of materials

Per workflow, what the AI can and cannot do — explicit, documented, enforced.

| Workflow | AI can | AI cannot |
|---|---|---|
| Discover Brief | Draft section prose from pack outline + tenant baseline | Invent metrics; assert a sourceless claim; resolve a seed gap |
| Charter Skeleton | Draft a charter from pack + baseline; suggest kill criteria | Approve the charter for funding (R8) |
| Costed Business Case | Polish section prose; summarize for the audience | Produce the verdict (kernel-only); alter a planning range; assert a haircut value |
| Solution Architecture | Map pack reference patterns to the Move | Choose a vendor; specify a contract |
| Estimate & Financial Model | Polish narrative; format the cost build-up | Change the rate card; alter an effort estimate |
| CFO Pack | Summarize for a CFO audience | Decide funding; change the value forecast |
| Mobilize Packet | Draft readiness sections | Issue a go-decision (kernel + human only) |
| Master Dossier | Assemble + summarize the assembled book | Override any sub-deck's verdict |
| Bet Selection (Intelligence) | Score archetypes per the pack | Recommend funding without a kernel-derived business case |
| Source Event Triage | Flag, classify, summarize | Close a control; award a vendor; deny a renewal autonomously |
| Gate advancement (any phase) | Recommend + draft justification | Approve the gate (R8) |
| Evidence ingestion | Extract + classify | Trust unsigned / unsourced evidence |

This matrix is published to customers as part of the procurement materials.

## 9. Implementation roadmap

### 9.1 Technical layers

| Layer | Scope | Order | Size |
|---|---|---|---|
| **Layer 1 — Foundational** | `tenants.ai_policy` JSONB; `ai_egress_audit` table; `callModel(tenantId, ...)` wrapper that loads policy + checks gate + logs; classification placeholder; **Gamma blocked for confidential+ unless explicitly approved**; route all existing Claude calls through the wrapper; default policies set conservatively | First | M–L |
| **Layer 2 — Redaction + PII** | PII scanner (NER + regex for SSN/EIN/account formats); sanitization to planning-range form; vendor-label genericization; original/redacted diff retained per policy | Second | L |
| **Layer 3 — Provider routing live** | The 4 routes implemented (`anthropic-direct`, `azure-foundry-private`, `bedrock`, `gcp-vertex`); per-tenant route assignment; fallback chain; kernel-only mode | Third | M |
| **Layer 4 — BYOK + residency** | Customer-managed key support; region pinning per tenant; tenant-side delete workflow + vendor confirmations | Fourth | M |

### 9.2 Organizational tracks (in parallel)

- **SOC 2 Type I** (Vanta or Drata).
- **AI red-team report** — jailbreak attempts, cross-tenant probe, kernel-coercion attempts, the honesty-discipline preservation test.
- **Subprocessor registry contents** — each vendor's DPA + ZDR confirmation collected and stored.
- **RLS pen-test** on Azure (already noted in the cutover plan).
- **Model Use Cards** drafted per workflow.
- **HITL bill of materials** (§8) published to procurement.
- **EU AI Act risk-class self-assessment** per high-risk workflow (credit underwriting, hiring, regulated decisions).
- **NIST AI RMF mapping** for US enterprise customers.
- **Security questionnaire** (CAIQ) — drafted standard response.

### 9.3 First build slice — Egress Control Plane v1

The first slice that lands code:

1. `tenants.ai_policy` JSONB column + conservative defaults migration.
2. `ai_egress_audit` table + indexes.
3. `src/lib/integrations/ai-egress/` package — `callModel` wrapper, policy gate, classification placeholder, audit emit, refusal path.
4. Move existing Claude calls behind the wrapper (one workflow at a time).
5. Move the existing Gamma path behind the wrapper — keeps the reference-only refusal, adds the policy gate + audit row.
6. Tests — policy denials produce honest refusals; allowed calls produce audit rows; classification placeholder labels confidential by default until Layer 2 lands.

This is the slice that lets us pass the first serious InfoSec questionnaire — *"yes, every external AI call is policy-gated and audited; here is the schema and the wrapper."*

## 10. The procurement narrative (the five lines)

For the CXO deck and the security questionnaire:

1. **Claude is the language layer, not the decision-maker.** Verdicts come from a deterministic, auditable kernel.
2. **Every external AI call goes through the AI Egress Control Plane.** Policy-gated, sensitivity-classified, redacted, logged, replayable.
3. **You choose the AI route.** Public Anthropic, your Azure tenant via Foundry, your Bedrock, your region, your BYOK — we adapt per-tenant.
4. **Human approval is required for every decision that matters.** R8 — no AI self-approval. HITL bill of materials documented per workflow.
5. **Full audit trail. Replayable. Deletable.** Every model call logged with prompt/response hashes and model version; right-to-be-forgotten honored end-to-end.

What's missing from this list, by design: *"trust us."*

---

## Appendix A — Today's snapshot

| Item | State |
|---|---|
| Function Packs — 36 across 3 verticals | Shipped, depth-checked, in production |
| Expert kernel running for any real Move; `function_pack_key` first-class column | Shipped (#2241–#2255) |
| All 8 board-grade decks generic for any Move | Shipped (#2245–#2254) |
| Gamma integration — reference decks only | In draft PR #2256, **held pending Layer 1** |
| AI Egress Control Plane | Not yet built — Layer 1 is next |
| Per-tenant RLS (Azure) | Enforced post-Azure cutover |
| 9 Azure hardening items (Service Bus / Key Vault / Search / Cosmos / Storage RBAC scopes) | Tracked separately on the cutover plan |
| Outbound email provider | Per cutover plan |

## Appendix B — References

- AbarVa Domain Function Pack spec (`docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md`).
- Audit 2026-05-13 fixes (memory).
- R8 — no AI self-approval of gates (gate-approval-model memory).
- Microsoft Foundry — Anthropic Claude models documentation.
- Microsoft Foundry — private link / private networking documentation (note partial support for hosted-agent features).
- SR 11-7 — US OCC/Fed model-risk guidance (covered as one of the FS Function Packs).
- EU AI Act — risk classes for AI systems.
- NIST AI Risk Management Framework.
- Cloud Security Alliance — CAIQ standard questionnaire.

## Appendix C — What this document is not

- Not a security policy. It is the *architecture* and *roadmap*. The security policy is a separate document owned by Security/Legal.
- Not a vendor-due-diligence pack. The subprocessor registry (when populated per §5) is the artifact for that.
- Not final. It is v0.1 — to be reviewed by Security, Legal, and Product, and revised before the first regulated-customer engagement.
