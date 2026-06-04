# AbarVa · Infosec Approval Accelerator

> Living document. Owner: founder. Last updated 2026-05-14.
> Intended audience: customer CISO, security architect, third-party-risk reviewer.
> Companion artifacts: `AGENTS.md` (stack and operational details), `docs/BACKLOG-2026-05-14.md` (roadmap), `src/lib/security/` (control source).

---

## 1. Executive summary

**What AbarVa is.** AbarVa is a tenant-grounded decision OS for C-suite AI and business bets. CXOs use it to evaluate, sequence, and govern strategic moves (e.g. contact-center AI, demand forecasting, value-based-care programs). The application surfaces are Intelligence, Moves, Source, and Tower; each is workflow-anchored and reads from a per-tenant data plane and a shared, non-sensitive industry corpus. Production lives at `app.abarva.ai`. Source-of-truth repo: `abarva-platform/abarva` on GitHub.

**What it is not.** AbarVa is not a system of record for PHI, PII, or transactional financial data. We do not need — and by design refuse — protected health information, full bank-account or card-number data, or other regulated personal identifiers. The product reasons over enterprise context (programs, KPIs, vendor inventories, compliance posture, exec narratives), not over end-customer personal data. This boundary is enforced in code, not just by policy (see §6 and CAIQ rows DSI-01 and DSI-04).

**Four security pillars.** Every customer review converges on the same four questions. We answer each with a specific, code-grounded control:

1. **Tenancy isolation.** Every cross-tenant route flows through `requireTenancy()` and Phase 5 row-level security on Supabase; locked-role pinning at the resolver prevents URL- or body-controlled tenant rebinding (PR #1923, #1924, #1930).
2. **Sensitive-data rejection at the edge.** All file uploads run through `evaluateSensitiveUpload` — a five-classification taxonomy that auto-quarantines anything flagged `regulated_phi_pii_suspected` and routes financial restricted material to elevated-control storage. Wired on 7/7 upload routes after the 2026-05-13 cycle.
3. **Broker contract.** No application-tier code reads tenant data directly. The `AgentContextBroker` is the single contract for retrieving facts, embeddings, graph fragments, and evidence — auditable, rate-limitable, and the natural place to attach policy (PR #1933 routed `/api/intelligence/query` through it; remaining surfaces enumerated in §7).
4. **Audit and pen-test.** Eight SEC-P0 cross-tenant probes from the 2026-05-13 audit B-agent are the seed of a permanent regression suite. The `incident-response-runbook.ts` and `security-posture-model.ts` modules formalize incident handling and posture reporting.

**Deployment options.** AbarVa can run as managed SaaS in our Azure tenancy (private VNet, private endpoints, Key Vault, public network disabled on storage — PR #1938; private-only Postgres Flexible Server — PR #1940), or be deployed via Bicep modules into the customer's own Azure subscription so that no tenant data leaves the customer boundary. Section 5 enumerates what's the same and what's different between the two modes. We tell customers up front: managed SaaS is appropriate for the pilot phase of most accounts; in-VPC deployment is the production target for regulated industries (healthcare, banking, defense).

---

## 2. Architecture in one diagram

```
                    ┌──────────────────────────────────────────────┐
                    │  CLIENT (browser)                            │
                    │  Clerk session · short-lived JWT             │
                    └─────────────────┬────────────────────────────┘
                                      │ TLS 1.2+
                    ┌─────────────────▼────────────────────────────┐
                    │  APPLICATION TIER (Next.js 16, Azure CA)     │
                    │  ───────────────────────────────────────     │
                    │  · requireTenancy() guard on every cross-    │
                    │    tenant route (PR #1923, #1924)            │
                    │  · sensitive-upload-guard on all 7 ingest    │
                    │    endpoints (src/lib/security/...)          │
                    │  · locked-role pinning (PR #1930)            │
                    └─────────────────┬────────────────────────────┘
                                      │   ← THE ONLY data path
                    ┌─────────────────▼────────────────────────────┐
                    │  AgentContextBroker                          │
                    │  (contract: getFacts, getEmbeddings,         │
                    │   getGraph, getEvidence)                     │
                    │  · enforces tenant_key on every read         │
                    │  · audit log per call                        │
                    └────┬───────────────────────────────┬─────────┘
                         │                               │
         ┌───────────────▼─────────┐         ┌───────────▼─────────────┐
         │  PER-TENANT DATA PLANE  │         │  SHARED INDUSTRY CORPUS │
         │  · Postgres FlexServer  │         │  · Public/industry      │
         │    (private endpoint)   │         │    benchmarks, frame-   │
         │  · Phase 5 RLS active   │         │    works, patterns      │
         │  · Pinecone NS = tenant │         │  · No tenant data       │
         │  · Neo4j (optional)     │         │                         │
         └─────────────────────────┘         └─────────────────────────┘
```

This maps onto the three-lane Azure model documented in our internal AZLAB9 design (and partially landed via PR #1938 + #1940):

- **Lane A — Control Plane.** Identity (Clerk + Entra ID federation planned), Key Vault, deployment pipeline, observability. Shared across tenants but tenant-scoped data never sits here.
- **Lane B — Private Data Plane.** Per-tenant Postgres Flexible Server (private endpoint, public network disabled, customer-controlled retention). Per-tenant Pinecone namespace. Per-tenant Azure Blob landing zone in Tier-2 ingestion (B-backlog A2b).
- **Lane C — Intelligence / Model Plane.** Anthropic Claude and OpenAI calls flow from the application tier; the broker strips tenant identifiers from prompts where corpus retrieval is the only need, and tenant facts pass through with explicit tenant binding when reasoning over that tenant's data. No model provider receives raw uploaded artifacts; only broker-mediated, tenant-scoped excerpts.

---

## 3. Four-tier ingestion model

Different segments have different sensitivity and refresh cadence, so they get different ingestion paths. The sensitive-data scan applies to all four.

| Tier | Channel | Use case | Sensitive-data scan |
|---|---|---|---|
| **1. App upload** | AbarVa UI (browser file picker) | Ad-hoc: policy doc, single vendor contract, org chart update, exec interview transcript. Pilot default for low-volume / unstructured / one-off content. | `evaluateSensitiveUpload` — pattern-based, 5-class taxonomy. Wired on all 7 upload routes after 2026-05-13. |
| **2. Azure landing zone** | Per-tenant Azure Blob container; customer drops via Azure Storage Explorer / AzCopy / their ETL job | Recurring structured data: KPI snapshots, program inventory, IT financials, contract registry, operating telemetry. Production default for weekly/monthly refresh. | Same `evaluateSensitiveUpload` invoked by the scheduled pickup job before the broker pipeline. Failed-scan blobs moved to a quarantine container. |
| **3. Direct integration** | Azure Data Share, Snowflake Data Share, point connector (ServiceNow, Workday, Coupa) | Live operational signals: incidents, change tickets, vendor renewals. Enterprise tier — when trust is established. | Schema-time filter (we never request PHI/PII columns) plus row-level scan in the ingestion adapter. Per-connector pre-flight review. |
| **4. In-VPC ingestion** | AbarVa stack deployed into customer's Azure subscription (B4); data never leaves their tenancy | Regulated industries (healthcare, banking, defense). Required for some accounts before they'll sign. | Same controls; data plane lives entirely in customer subscription, customer holds keys, customer holds logs. |

Common controls across all tiers: TLS 1.2+ in transit (1.3 + mTLS on Tier 2–4 in production), AES-256 at rest (customer-managed keys via Key Vault on production target), audit log on every ingest event, customer-deletable on demand, quarantine container for failed scans surfaced to admin (B5c — planned).

---

## 4. Pre-filled CAIQ-Lite control matrix

| Control ID | Domain | Question | Status | Evidence | Notes |
|---|---|---|---|---|---|
| AIS-01 | Application & Interface Security | Is there a documented tenancy isolation model with code-level enforcement? | In place | `requireTenancy()` guard on 8 cross-tenant routes; PR #1923, PR #1924 | Canonical pattern. Failure mode is "deny" — missing context → 401/403, not silent fall-through. |
| AIS-02 | Application & Interface Security | Are tenant context resolutions protected against URL/body parameter override? | In place | Locked-role pinning at resolver; PR #1930 | Prevents an authenticated user of tenant A from forcing reads against tenant B by manipulating `tenant_key` in the request. |
| AIS-03 | Application & Interface Security | Is there a documented data-access broker pattern instead of direct data-tier reads from app code? | In place | `AgentContextBroker` contract; PR #1933 routed `/api/intelligence/query` through it | Enforced by lint rule and code review (`feedback_broker_boundary.md`). Remaining surfaces in §7. |
| AIS-04 | Application & Interface Security | Is role-based access control implemented? | In place | Clerk roles + per-route `requireRole()` checks; gate self-approval model (`project_gate_approval_model.md`) | Pilot mode allows any user to self-approve; production target restricts to admin / maestro. Gap tracked as B-120. |
| AAC-01 | Audit Assurance & Compliance | Is there an audit log for security-relevant events? | In place (foundation) | `src/lib/security/incident-response-runbook.ts`, `security-posture-model.ts` | Ingest events, cross-tenant denials, sensitive-upload quarantines all logged. SIEM streaming planned (see SEF-02). |
| AAC-02 | Audit Assurance & Compliance | Has the application been independently audited (SOC 2, ISO 27001)? | Planned | Roadmap entry; no certification today | SOC 2 Type 1 readiness target Q3 of pilot year; full Type 2 after 12-month observation window. Honest gap, see §7. |
| BCR-01 | Business Continuity & Resilience | Are databases backed up with point-in-time recovery? | In place (inherited) | Azure Postgres Flexible Server PITR per Azure default; PR #1940 | 7-day PITR window default; configurable to 35 days. Customer can opt for geo-redundant backup. |
| BCR-02 | Business Continuity & Resilience | Is there a documented RTO/RPO? | Planned | RTO 4h / RPO 1h target for pilot; not yet load-validated | Will be exercised as part of the pilot deployment runbook (C1). |
| CCC-01 | Change Control | Are all production changes managed via pull request with code review? | In place | GitHub PR-based workflow on `abarva-platform/abarva`; merge requires green CI | Every cited PR (#1923–#1940) is auditable in repo history. |
| CCC-02 | Change Control | Are CI gates enforced (typecheck, lint, test, security regression)? | In place (partial) | `npm run test:nav`, `test:behaviors`, `test:integration`; ESLint 9 flat config; nightly drift check | E2E suite for cross-tenant probes lands as part of A1 (open backlog item). |
| DSI-01 | Data Security & Lifecycle | Is sensitive data identified and classified on ingest? | In place | `src/lib/security/sensitive-upload-guard.ts`; 5-class taxonomy (`public` / `internal` / `confidential_business` / `restricted_financial` / `regulated_phi_pii_suspected`) | Wired on 7/7 upload routes after the 2026-05-13 cycle. Pattern-based today; Purview integration is B5b. |
| DSI-02 | Data Security & Lifecycle | Is data encrypted in transit? | In place | TLS 1.2+ enforced at Azure Container Apps ingress; PR #1938 | Production target TLS 1.3 + mTLS on Tier 2–4 ingestion. |
| DSI-03 | Data Security & Lifecycle | Is data encrypted at rest? | In place | AES-256 default on Azure Storage + Postgres; PR #1938, PR #1940 | Customer-managed keys via Key Vault — see EKM-02. |
| DSI-04 | Data Security & Lifecycle | Is PHI/PII handling explicitly scoped out of the product? | In place | `sensitive-upload-guard.ts` auto-quarantines `regulated_phi_pii_suspected`; integration tier filters PHI/PII columns at schema | Documented in §6 of this artifact and in AGENTS.md. |
| DSI-05 | Data Security & Lifecycle | Can customers delete their data on demand? | In place (pilot) / Planned (UI) | Customer-deletable via support today; admin UI for self-service deletion is part of B5c | Auditable retention windows per ingestion segment are a production target. |
| DCS-01 | Datacenter Security | Are physical and environmental controls inherited from a recognized cloud provider? | In place (inherited) | Microsoft Azure (eastus2 default); inherits Azure's SOC 2, ISO 27001, HIPAA, FedRAMP Moderate attestations | Customer can pin to other Azure regions on request. |
| EKM-01 | Encryption & Key Management | Is there a managed-secrets service? | In place | Azure Key Vault provisioned in scale-test foundation; PR #1938 | Application secrets (Clerk, Supabase, Anthropic, OpenAI) all loaded from Key Vault in production. |
| EKM-02 | Encryption & Key Management | Are customer-managed keys (CMK / BYOK) supported? | Planned | `docs/architecture/adr/ADR-0012-cmk-byok-readiness.md`; `docs/architecture/azure/CMK_BYOK_READINESS_PLAN.md` | Customer-owned Private Data Plane is the first key-custody path. Managed-SaaS BYOK remains planned until the readiness gates pass. |
| GRM-01 | Governance & Risk Management | Is Azure Policy / Defender for Cloud enabled? | Planned | Defender for Cloud + Azure Policy baseline is part of the Azure hardening backlog (B-cluster) | Pilot accounts get baseline policies (deny public storage, require private endpoints, require TLS); fully tracked in B-backlog. |
| GRM-02 | Governance & Risk Management | Is there a documented risk register and review cadence? | Planned | Founder-led monthly review today, no formal register artifact yet | Honest gap. Will be formalized before first production contract per §7. |
| HRS-01 | Human Resources | Are personnel background-checked and bound by confidentiality? | In place (founder-only) | Single-founder company; founder under standard confidentiality obligations to all current customers | Sub-contractors added under written NDA and access reviewed per engagement. Hiring scale-out is a post-pilot concern. |
| IAM-01 | Identity & Access Management | Is there an enterprise identity provider integration? | In place / Planned | Clerk today (email/password + Google + Microsoft SSO); Entra ID federation planned for enterprise SSO | Clerk JWT template `supabase` emits `tenant_key` / `role` / `sub` claims used by Phase 5 RLS. |
| IAM-02 | Identity & Access Management | Is multi-factor authentication available? | In place | Clerk MFA (TOTP + WebAuthn) available; enforced per-tenant at admin's discretion | Production target: MFA mandatory for all admin / maestro roles. |
| IAM-03 | Identity & Access Management | Is row-level security enforced at the data tier? | In place | Phase 5 RLS active on `authenticated` reads; 6 migrations + 108 tests shipped 2026-05-07 (`project_per_user_rls_pilot_ready.md`) | Pen-test scheduled before first real customer (see TVM-02). |
| IPY-01 | Interoperability & Portability | Is data stored in standard formats with no proprietary lock-in? | In place | Postgres (standard), Parquet for analytic exports, JSON for API payloads | Customer-initiated export is a documented support workflow; self-service export is a production target. |
| IVS-01 | Infrastructure & Virtualization | Is the application deployed on infrastructure with private networking? | In place | Azure Container Apps + private VNet + private endpoints on Storage and Postgres; PR #1938, PR #1940 | Public network disabled by default on Storage and Postgres in the scale-test foundation. |
| IVS-02 | Infrastructure & Virtualization | Are management endpoints protected from public access? | In place | Private endpoint on Postgres Flexible Server (PR #1940); Storage public network disabled (PR #1938) | Management access via Azure RBAC + just-in-time access. |
| MOS-01 | Mobile Security | Is there a mobile app? | Not applicable | Web-only product | Browser-targeted; standard CSP, HSTS, secure cookie policy. |
| SEF-01 | Security Incident Mgmt | Is there an incident response process? | In place (foundation) | `src/lib/security/incident-response-runbook.ts` codifies playbook; founder + on-call SRE (C2) | Post-incident review template is a planned artifact, tracked in C-cluster. |
| SEF-02 | Security Incident Mgmt | Are security events streamed to SIEM / SOC? | Planned | Audit log exists; SIEM-streamable target in production ingestion model (§3) | Customer-side SOC integration (Splunk / Sentinel) supported via Azure Event Hub bridge once the production audit log lands. |
| STA-01 | Supply Chain | Is there a dependency-review process for third-party packages? | Planned | GitHub Dependabot enabled on `abarva-platform/abarva`; Snyk evaluation pending | Honest gap. Adding automated SAST/DAST is a pre-production target. |
| STA-02 | Supply Chain | Are sub-processors disclosed? | In place (DPA-bound) | Sub-processor list: Microsoft Azure (infra), Clerk (auth), Supabase (Postgres / RLS), Anthropic (LLM), OpenAI (LLM, embeddings), Pinecone (vector), Resend (email), Stripe (billing), PostHog (analytics) | Customer-facing DPA template enumerates these; opt-out paths available for optional providers (Pinecone, Neo4j, OpenAI). |
| TVM-01 | Threat & Vulnerability Mgmt | Is there a documented pen-test playbook? | In place | 2026-05-13 audit B-agent pen-test playbook; 8 SEC-P0 cross-tenant probes (PR #1923) | Becomes a permanent regression suite under backlog A1. |
| TVM-02 | Threat & Vulnerability Mgmt | Has an independent third-party pen-test been performed? | Planned | Self-audit complete; independent pen-test commissioned before first production contract | Honest gap. Target firm engaged Q+1 of pilot. |

---

## 5. Deployment options

### Option A — Managed SaaS (AbarVa Azure tenancy)

The default for pilot accounts. AbarVa hosts the application tier, the per-tenant data plane, and the shared corpus in our Azure tenancy. Customer interacts with `app.abarva.ai` over TLS. All controls in §2 and §4 apply.

- **Same as in-VPC:** every code-level control (tenancy isolation, broker, sensitive-upload guard, RLS, audit log).
- **Different:** infrastructure runs in our Azure subscription. Customer-managed keys (EKM-02) and customer-side SIEM streaming (SEF-02) are roadmap items here.

Right for: most pilot phases, non-regulated industries, customers who want fastest time-to-value.

### Option B — In-VPC deployment (customer Azure subscription)

AbarVa stack deployed via Bicep modules into the customer's own Azure subscription. Customer holds the network, the keys, and the logs. AbarVa retains operational responsibility (deployment automation, upgrades, support) under a shared-responsibility model documented in the SoW.

- **Same as managed SaaS:** application behavior, broker contract, ingestion model, code-level controls.
- **Different:** infrastructure runs in customer subscription. Customer controls Key Vault, network topology, audit log destination, retention. AbarVa accesses only via just-in-time, time-boxed, role-scoped Entra ID assignments — audited by customer.

Right for: healthcare, banking, defense, any account whose policy precludes data egress to a SaaS vendor. Tracked as backlog item B4. Bicep parameter files per customer.

---

## 6. Data handling commitments

- **We do not accept PHI, full PII, or regulated personal identifiers by design.** The `sensitive-upload-guard` auto-quarantines uploads classified `regulated_phi_pii_suspected`; integration-tier connectors filter such columns at the schema level; customer DPAs name this restriction explicitly. If a customer needs an AI surface over PHI/PII, AbarVa is not the right product — we will say so in the first call.
- **Retention is segment-scoped and customer-deletable.** Enterprise context (programs, KPIs, vendor inventories, exec narratives) is retained for the contracted period; ad-hoc evidence has a shorter default window (90 days unless extended). Customer deletion requests are honored within 30 days; for in-VPC deployments the customer can delete instantly without involving us.
- **No tenant data in shared corpus.** The shared industry corpus contains only public/industry frameworks, patterns, and benchmarks. Tenant uploads never enter the shared corpus; the broker contract enforces this directionality.
- **No tenant data in model-provider training.** Anthropic and OpenAI calls are made under their enterprise no-training terms. Sub-processor list is enumerated under CAIQ STA-02.
- **Cross-tenant access returns 403, verified.** The 2026-05-13 audit B-agent ran 8 SEC-P0 cross-tenant probes against every multi-tenant route; all 8 return 403. The same probes become a permanent regression suite under backlog A1.
- **SIEM streaming on customer demand.** Audit log foundation exists today; SIEM bridge to customer Splunk / Sentinel is available as a deployment option in Q+1 (CAIQ SEF-02).
- **Customer can demand a fresh cross-tenant 403 demo at any time.** Part of the pilot deployment runbook. Section 8 enumerates this as a deliverable.

---

## 7. Open items — honest list

The following are not in place today. We name them up front so a customer who signs an LOI is not surprised at due-diligence stage.

| Gap | Backlog ID | Honest status | Commitment |
|---|---|---|---|
| SOC 2 Type 1 certification | n/a (D-cluster) | Not certified. Readiness roadmap articulated; auditor not yet engaged. | Engage SOC 2 auditor before first production contract. Type 1 in pilot year, Type 2 after 12-month observation. |
| Microsoft Purview content-scan integration | B5b | Pattern-based detection only today. | Purview integration replaces / augments pattern detection across all ingestion tiers. |
| Quarantine + audit dashboard UI | B5c | Quarantine container exists; admin UI does not. | Admin UI: list of quarantined uploads with reason, ability to release after review or hard-delete. SIEM-friendly audit stream. |
| Customer-managed keys (BYOK) in managed-SaaS | CAIQ EKM-02 | Microsoft-managed keys today. Customer-owned Private Data Plane is the first key-custody path. | Managed-SaaS BYOK remains planned until the gates in `docs/architecture/azure/CMK_BYOK_READINESS_PLAN.md` pass. |
| Independent third-party pen-test | CAIQ TVM-02 | Self-audit complete; independent test not yet commissioned. | Independent firm engaged before first production contract. Report shareable under NDA. |
| Bicep modules for in-VPC deployment | B4 | Scaffolded; not yet customer-deployable end-to-end. | Reference deployment via Apex / Meridian / First Capital demo planes (B2) lands first; per-customer parameter files follow. |
| Self-service customer-data deletion UI | DSI-05 | Customer-deletable via support today. | Self-service UI in admin surface; auditable retention windows per segment. |
| Formal risk register and review cadence | CAIQ GRM-02 | Founder-led monthly review; no formal register. | Risk register and quarterly review cadence formalized before first production contract. |
| SAST / DAST in CI | CAIQ STA-01 | Dependabot enabled; SAST/DAST not yet wired. | Snyk or equivalent in CI before first production contract. |
| Sentinel arithmetic prompt-tuning beyond PR #1932 | A1 follow-on | One audit-flagged arithmetic issue closed; broader prompt-tuning ongoing. | Continuous as part of model-evaluation harness. |

---

## 8. Next steps for a customer security review

**What AbarVa needs from the customer.**

- [ ] Named security contact (single point of escalation during the review).
- [ ] Target deployment option (managed SaaS vs in-VPC per §5).
- [ ] List of must-have controls beyond this CAIQ — anything customer-specific (e.g. CMK from day one, named SIEM destination, specific Azure region).
- [ ] SoW + DPA template review window (we offer ours; we'll redline yours).
- [ ] Mutual NDA for sharing the self-audit pen-test playbook output and any artifacts not in this public document.

**What the customer can expect from AbarVa.**

- [ ] This artifact (`docs/security/INFOSEC-ACCELERATOR.md`) updated through the date of the review.
- [ ] Live demo: cross-tenant request returns 403. Run any of the 8 SEC-P0 probes against the production app — auditor's choice.
- [ ] Walkthrough of the broker boundary in source code (`AgentContextBroker` + the 8 cross-tenant routes touched in PR #1923–#1933).
- [ ] DPA template + sub-processor disclosure (CAIQ STA-02).
- [ ] Architecture review session (CISO / security architect + founder).
- [ ] For in-VPC option: Bicep module walkthrough + reference deployment in our demo planes (B2).
- [ ] Commitment dates for any open items in §7 the customer cares about, signed into the SoW.

**Cadence for the review itself.**

1. **Day 0** — customer receives this document.
2. **Day 3–5** — questionnaire walk-through call (this doc is the script; deviations land as redlines).
3. **Day 7–10** — architecture session + live cross-tenant demo.
4. **Day 14** — redline returned; SoW + DPA finalized.
5. **Day 21** — pilot deployment kicked off per the runbook (backlog C1).

Most pilot security reviews close in three weeks against this artifact. If a customer needs a deeper review (in-VPC option, full SOC 2 review, customer red-team), we will say so up front and extend the timeline rather than overcommit.

---

*Maintainer note: when a row in §4 transitions from Planned to In place, update the row, link the PR, and date-stamp the change log below.*

**Change log**

- 2026-05-14 — Initial issue. Authored after the 2026-05-13 audit arc (PR #1923–#1933) and the Azure scale-test foundation (PR #1938, #1940).
