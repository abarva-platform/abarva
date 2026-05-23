# AbarVa — IT-Productivity Framework Execution Kit
**Azure-native edition · AI-Egress-aware · v2026-05-12**

> One document. Paste-ready. Self-contained. Replaces all prior partial plans.
>
> Convert to DOCX with: `pandoc docs/execution-kit/ABARVA_EXECUTION_KIT.md -o docs/execution-kit/ABARVA_EXECUTION_KIT.docx`

---

## 0. Context & non-negotiable commitments

### 0.1 What this document is
A complete, paste-ready execution kit for building the IT-Productivity decision framework (corpus + Move templates + Source workflows + discovery instruments + workshops + Sentinel reasoning + Tower value tracking + AI trust architecture) inside AbarVa. Designed so that 14+ packets can run in parallel as autonomous agents with pre-approved merge + deploy authority.

### 0.2 Positioning (anchor — do not drift)
**AbarVa is the context-aware, consultant-grade decision OS for C-suite AI and business bets.** Sentinel is a super-smart consultant that can address any business and AI problem, grounded in the client's actual enterprise context (systems, financials, contracts, KPIs, programs, evidence) plus a curated worldview corpus. The buyer is the business CXO (CEO, CFO, COO, CSO, CMO, CDO, BU President); the tech CXO is the gateway, not the destination.

### 0.3 Architectural commitments (binding)
1. **Data-layer architecture, not file-bundled.** All corpus / templates / instruments / workshops / gate artifacts live as versioned Postgres records, not `.md` or `.ts` files. Code defines the *engine*; data defines the *content*. The moat compounds only if it's data.
2. **Azure-native end to end.** No Supabase. No Pinecone. No Vercel AI Gateway (deprecated path).
3. **All LLM/Gamma calls go through the AI Egress Control Plane (`callModel()`).** This is enforced by an ESLint import guard — provider SDKs cannot be imported outside `src/lib/integrations/ai-egress/`. Already merged in PR #2258.
4. **Tenant column is `client_id`. Tenant table is `clients`.** (Not `tenants` — that's an aspirational name.)
5. **Honesty discipline in code, not in prompts.** The deterministic kernel computes verdicts; Claude is the language layer. Kill criteria, value math, gate decisions, audit trail — all code, not model output.

### 0.4 Azure service mapping (replaces all Supabase/Pinecone/Anthropic-direct references)

| Layer | Service | Notes |
|---|---|---|
| Relational DB | **Azure Database for PostgreSQL — Flexible Server** | Use existing connection; same SQL/RLS patterns as the prior Supabase migrations |
| Vector / hybrid search | **Azure AI Search** | Indexes: `corpus-global`, `corpus-client-{clientId}`, `templates-global`, etc. Vector + BM25 + filters + result fusion natively. |
| Blob / file storage | **Azure Blob Storage** | Containers per artifact class (instruments, workshop packs, generated PPTX, audit blobs) |
| Auth | **Clerk** | Unchanged for now. Entra External ID migration is a separate, future program (do NOT scope into this kit). |
| Compute | **Azure Container Apps** | Backend/jobs already cut over. Web hosting is still Vercel — cutover is a separate program (see §13). |
| Background jobs | **Azure Container Apps Jobs** | For embeddings backfill, depth-lint sweeps, audit replay |
| Secrets | **Azure Key Vault** (private endpoint) + Container Apps secret refs | `GAMMA_API_KEY` already projected this way |
| Message bus | **Azure Service Bus (Premium, private endpoint)** | For long-running workflow orchestration |
| Observability | **Azure Monitor + Application Insights + Log Analytics** | Egress audit also writes to App Insights for query convenience |
| **Claude (LLM)** | **Claude via Azure AI Foundry — private endpoint** as the default route. Anthropic-direct only for demo tenants without enterprise terms. Routed via `callModel()` per `clients.ai_policy`. |
| **OpenAI / embeddings** | **Azure OpenAI Service** — `text-embedding-3-large` for corpus + template embeddings. Routed via `callModel()`. |
| **Gamma** | Premium PPTX rendering. Routed via `callModel()` with `dataClass`-gated refusal. Blocked for `confidential`/`restricted` unless tenant policy + user approval. |

### 0.5 The AI Egress Control Plane (already live — PR #2258 merged)

Every model/external-AI call MUST go through:

```ts
import { callModel } from '@/lib/integrations/ai-egress';

const result = await callModel({
  tenantId: clientId,           // 'apexretail' | 'meridianhealth' | 'firstcapital' | ...
  userId,                       // Clerk user id
  workflow: 'sentinel-clarify', // namespaced workflow id, used for audit + budget
  prompt,                       // string or structured message array
  dataClass: 'confidential',    // 'public' | 'internal' | 'confidential' | 'restricted'
  provider: 'claude',           // 'claude' | 'gamma' | 'openai-embeddings' | ...
  options: { /* model, max tokens, etc. */ },
});

if (!result.ok) {
  // Structured refusal — surface "AI egress denied: <reason> (audit: <id>)" — never a 500
  return refuse(result.reason, result.auditId);
}
```

**Tables in play:**
- `clients.ai_policy` (JSONB) — per-tenant: `{ allowExternalAI, allowClaude, allowedClaudeRoute, allowGamma, maxDataClass, requireRedaction, requireHumanApprovalForExports, kernelOnlyMode }`
- `ai_egress_audit` — synchronous-write-before-return: `{ id, client_id, user_id, workflow, provider, model, prompt_hash, response_hash, data_class, policy_decision, decided_at, latency_ms, token_in, token_out, artifact_id, artifact_type }`
- `tenant_policy_audit` — every change to `clients.ai_policy` is itself audit-logged (prior JSON, new JSON, actor, reason, timestamp). Loosening a policy is a controlled event.

**Defaults (verified on main):**
- Apex Retail: `allowExternalAI: true, allowClaude: true, allowGamma: true, maxDataClass: 'confidential'`
- Meridian Health: `allowExternalAI: true, allowClaude: true, allowGamma: false, maxDataClass: 'confidential'`
- First Capital / Brindlemark: `allowExternalAI: true, allowClaude: true, allowGamma: false, maxDataClass: 'confidential'`
- New tenant default: `allowExternalAI: false, kernelOnlyMode: true, maxDataClass: 'internal'`

**Out of scope for this kit (separate roadmap items):**
- Layer 2 (PII scanner / NER / redaction)
- Layer 3 (multi-provider routing: Azure Foundry, Bedrock, Vertex implementations beyond Anthropic-direct)
- Layer 4 (BYOK / CMK per tenant)
- Vercel → Azure Container Apps hosting cutover (3–5 weeks of separate work)
- Clerk → Entra External ID migration

---

## 1. The substantive framework — what we're encoding

This section is the *content* the packets will encode into the data layer. Use it as the source-of-truth for authoring packets P6–P9.

### 1.1 The use case
A CTO asks: *"How do I improve productivity of IT resources by leveraging AI-powered SDLC/Product development lifecycle?"*

Honest substantive answer:
- IT spend splits **Run / Grow / Transform** ≈ **60–70% / 15–25% / 10–20%** (regulated industries push Run to 75–80%). AI productivity lift lands very differently per bucket.
- The right CTO answer is **portfolio-segmented**, not "buy Copilot for everyone." Use **Gartner TIME** (Tolerate / Invest / Migrate / Eliminate) × **AI-fit** to decide where tooling investment converts to value.
- Productivity ≠ value. Hours saved evaporate without a **named reallocation queue**.
- Named failure modes: tool sprawl, ghost productivity, security/IP leakage, the **METR 2025** finding (senior engineers on familiar codebases ~19% *slower* with AI tools — opposite of vendor marketing).
- AMS / Infra Managed Services optimization is a **separate workflow in the Source module**, not part of the productivity Move. Different sponsor (Procurement + GC + CFO + CIO) and different cadence.

### 1.2 The 9-gate Move template — "AI-Enabled IT Productivity Program"

| # | Gate | Artifact | Sponsor decision |
|---|---|---|---|
| 0 | **Wave 0 — Alignment** | 16-section Sponsor Charter | Charter signed by CTO + CFO + HEng + HPeople + CISO |
| 0.5 | **Sibling-Move dependency check** | DAG view | Upstream Moves in-flight or risk-accepted |
| 1 | **Discovery (T1 → T2 → T3)** | 12-instrument Discovery Kit | T2 sufficiency for next gate |
| 2 | **Baseline (4–6 wks)** | DORA + SPACE + DevEx baseline, tool footprint | Baseline integrity signed by DevEx Analyst |
| 3 | **Diagnose** | TIME × AI-fit lift matrix per app | CTO accepts segment classification |
| 4 | **Operating Model design** | TOM target state + new roles + ladder rewrite | HPeople + CTO sign target state |
| 5 | **Tooling + Governance design** | Reference architecture + tool selection | CISO + CTO approve |
| 6 | **Business case** | TCO + projected $ by segment + reallocation queue | CFO signs |
| 7 | **Mobilize — Wave 1 pilot (12 wks)** | Cohort, processes piloted | Gate at wk 12: kill / continue / narrow / expand |
| 8 | **Mobilize — Waves 2–4** | Per-wave sub-gate | Per-wave kill criteria |
| 9 | **Operate** | Quarterly reallocation + annual baseline refresh | Steady-state ownership transfer |

Every gate has: required artifacts, sign-off RACI, evidence anchors, **numeric** kill criteria, projected/tracked/verified metric block on Tower, pre-mortem ritual, sensitivity analysis, hand-off ritual to next gate, maturity-model overlay.

### 1.3 Sibling Moves (5 — handled in the Moves module)
1. **Data Foundation for AI** (CTO + CDO)
2. **AI Governance & Policy** (CISO + GC + CTO)
3. **Application Portfolio Rationalization (TIME)** (CIO + CFO)
4. **Talent Strategy — AI-Fluent Engineering Org** (HPeople + CTO)
5. **Mainframe Modernization (sequenced)** (CIO + BU sponsor)

### 1.4 Source-module workflows (separate from Moves)
1. **AMS Portfolio Optimization** — 5 stages: Inventory → Diagnostic (concentration + leakage) → Strategy (per-vendor: keep/renegotiate/consolidate/exit/captive) → Execution (legal + procurement + outcome-based clauses) → Steady-state (scorecard live with productivity, quality, AI-fluency, IP-scan-clean)
2. **Infra MS Optimization** — 5 stages parallel to AMS, scoped to network/datacenter/cloud-ops/security-ops/AIOps/FinOps overlap

### 1.5 The 12-instrument Discovery Kit
1. Application portfolio inventory (CSV + SQL extraction from CMDB + APM)
2. Repo telemetry spec (GitHub/GitLab/Bitbucket + sonarqube + scc + semgrep)
3. DORA baseline kit (LinearB / Sleuth / Jellyfish / DIY SQL)
4. DevEx + SPACE survey (Forsgren template, deployed via Qualtrics)
5. Engineer time-allocation diary (DOCX + privacy/consent + anonymization-at-source)
6. Tool footprint scan spec (SAM integration: Flexera / Snow / ServiceNow SAM)
7. AI tool utilization (Copilot/Cursor admin telemetry; license → activated → DAU → MAU funnel)
8. Contract review checklist (Icertis/Coupa export + manual review)
9. Workflow / value-stream workshop kit (DOCX facilitator + worksheet)
10. Manager interview guide (structured, 60 min)
11. CXO interview guides (5 sub-guides: CTO, CFO, HEng, HPeople, CISO)
12. Industry benchmark pack (curated, cited)

Each instrument has: sample-size math, bias controls, privacy block, validation rules at capture, triangulation plan, calibration questions, data-cleaning checklist, edge-case handling, missing-data sensitivity, refresh cadence.

### 1.6 The 6-block Sentinel reasoning output (for IT-productivity intent)
1. **Clarify** — primary KPI, scope, horizon, definitions
2. **Alignment check** — pull Wave 0 charter status; if missing, surface the 7-item template
3. **Tenant-grounded portfolio segmentation** — TIME × AI-fit matrix with lift projections + confidence intervals
4. **TOM recommendation** — current `org_topology` vs target; new roles (AI Platform, Knowledge Engineer, Fluency Coach, Governance Lead, DevEx Analyst); ladder + comp + geo/sourcing shift
5. **Tooling design + governance** — current `ai_tool_footprint` vs recommended stack; license math; governance posture (model allowlist, retention, indemnity)
6. **Sibling-Move portfolio** — 5 sibling Moves + 2 Source workflows with dependency DAG, projected $ rollup, **one-click "create all"** CTA
+ **Dissent block** + **"what would change my view" hedge** + audit trail anchored to reasoning trace + version-pinned corpus + version-pinned templates.

### 1.7 The 8 metric layers on Tower (projected / tracked / verified per Move)
Adoption · DORA delta · Hours saved · Hours reallocated · License $ · Realized $ value · Process changes shipped · Kill-criteria status. Verified state requires explicit attestation event with audit-log entry.

### 1.8 The 39 corpus patterns to author

| Cluster | IDs |
|---|---|
| Foundation | P-IT-01 Run/Grow/Transform · 02 TIME × AI-fit · 03 Productivity→Value theorem · 04 Mainframe AI: comprehension≫generation · 05 AMS economics under AI |
| Measurement | P-IT-06 DORA-anchored measurement · 15 SPACE + DevEx complement · 20 License $ per realized outcome |
| Contradiction / failure | P-IT-07 METR senior slowdown · 08 Tool sprawl · 09 Ghost productivity · 10 Reallocation gap · 11 Copilot-55% vs METR-19%-slower |
| Process | P-IT-16 10 process redesigns · 17 Wave 0–6 rollout · 21 Reallocation queue mechanics |
| Critical | P-IT-13 Alignment-as-prerequisite · 14 Baseline-before-rollout · 22 Gated kill criteria · 23 Top-10 program risks |
| Reference | P-IT-18 Stack-calibrated lift matrix · 19 Lift-calibration adjusters · 12 Mainframe sunset-as-pilot wedge |
| Discovery | P-IT-24 Tiered discovery T1/T2/T3 · 25 Discovery instrument selection |
| TOM | P-IT-26 Team Topologies + AI · 27 New AI roles · 28 Ladder rewrite (AI Leverage) · 29 Geo + sourcing mix shift |
| Portfolio | P-IT-35 Dependency map · 36 Sibling Move portfolio |
| Vertical overlays | P-IT-37 Healthcare (HIPAA / FDA AI-SaMD) · 38 Financial services (SR 11-7 / OCC / EU AI Act) · 39 EU AI Act + works council |
| Source-module (rehomed) | P-SRC-01 AMS reshape playbook · 02 Outcome-based contracting under AI · 03 AMS sunset clauses · 04 SI concentration risk · 05 Captive (GCC) vs SI under AI |

### 1.9 The 6 depth rubrics (Depth Standard — Packet 0)
- **T** Template/Artifact
- **W** Workshop
- **I** Instrument
- **P** Corpus Pattern
- **G** Move Gate
- **S** Sentinel Output

Each rubric has 10 criteria scored 0–1. Pass threshold = 8/10. Enforced by `npm run lint:depth` in CI; PRs blocked below 8/10.

---

## 2. The Depth Standard — full rubrics

### Rubric T — Template / Artifact
1. **TOC** numbered, depth-tagged (L1/L2/L3), with effort estimate per section
2. **≥2 frameworks layered** (e.g., TIME × Wardley × Team Topologies)
3. **Numerical benchmarks** at every claim with `(range, n, source)`
4. **3+ anti-patterns** named with "this goes wrong when…"
5. **RACI + decision rights** with single accountable owner + named threshold
6. **Sensitivity analysis** — what changes if assumptions shift ±20%
7. **Sequenced sub-steps** with effort + dependency arrows
8. **Quality gate / done definition** — testable criteria
9. **Maturity-model overlay** — current 1–5 stage + next-stage description
10. **Vertical / regional / persona overlay** — how this changes by context

### Rubric W — Workshop
1. Pre-read (15–30 min, sequenced, glossary)
2. Facilitator brief (objectives, success criteria, escalation, time-boxes)
3. Minute-by-minute agenda (every 10 min accounted for)
4. Numerical hypothesis to test (not blank page)
5. Facilitation tactics (push/listen/escalate triggers)
6. Pre-built worksheets / canvases
7. Decision capture template (decision, by whom, why, dissent, follow-ups)
8. Pre-mortem ritual (15 min)
9. Stakeholder map (influence × interest grid, pre-work 1:1s named)
10. Post-read + commitments tracker (within 24h)

### Rubric I — Data-collection instrument
1. Sample size + statistical confidence math
2. Bias controls (response / selection / social-desirability — explicit)
3. Privacy / consent block (anonymization-at-source for person-level data)
4. Validation rules at capture
5. Triangulation plan (no single instrument is the answer)
6. Calibration questions (attention checks)
7. Data-cleaning checklist (15 named steps)
8. Edge-case handling guide
9. Sensitivity to missing data
10. Refresh cadence

### Rubric P — Corpus pattern
1. Quantified claim (number, scope, horizon)
2. 3–5 evidence chunks with primary citation
3. 2+ counterarguments (named, not strawmanned)
4. Calibrated confidence
5. Boundary conditions (when this does NOT apply)
6. 2+ failure modes
7. Maturity-model linkage
8. Vertical overlay
9. Related patterns (graph relationships)
10. Synthesis "so what" paragraph

### Rubric G — Move gate
1. RACI with single accountable owner
2. Required artifacts list + completion criteria
3. Evidence anchors (audit trail)
4. **Numeric** kill criteria
5. Sensitivity analysis at gate
6. Pre-mortem ritual
7. Decision capture + dissent log
8. Time budget (P50/P90)
9. Hand-off ritual to next gate
10. Maturity model — what "great" looks like

### Rubric S — Sentinel reasoning output
1. Clarifying questions if context incomplete
2. Frame named (not just narrative)
3. Tenant evidence cited per claim
4. Corpus pattern cited per recommendation
5. Confidence calibration per recommendation
6. Dissent block (first-class)
7. "What would change my view" hedge
8. Sensitivity to user's top constraint
9. Named next action (Move / workshop / instrument)
10. Audit trail anchored to reasoning trace

---

## 3. Sample artifact TOCs (proof of depth)

### 3.1 Wave 0 Sponsor Charter (~25 pp, 16 sections)
```
0. Executive summary (1 page) — for the CEO
1. Sponsor RACI + decision rights
   1.1 Single accountable owner
   1.2 Decision thresholds ($ / headcount / time / risk)
   1.3 Escalation paths
2. Definition of "productivity"
   2.1 Three viable definitions (hours / velocity / value) with trade-offs
   2.2 Chosen primary + 2 secondary (signed)
3. Definition of "value" (CFO-acceptance criteria, 5 formulations)
4. Reallocation policy (named target queue + cadence + attribution math)
5. IP / security posture (model allowlist, retention, opt-out, audit trail, IP-scan policy)
6. Comms charter (board / eng / customer / works-council)
7. Career-ladder rewrite (AI Leverage as 4th dimension, per-level rubric, comp bands)
8. Kill criteria (numeric thresholds: adoption floor, DORA delta floor, license ceiling, attrition trigger)
9. Risk register — top 10 (owner, impact, mitigation, trigger)
10. Sensitivity analysis (3 scenarios)
11. Pre-mortem (top 5 named failure modes with owners)
12. Maturity baseline (1–5 stage per dimension, target per gate)
13. Vertical overlay (HC / FS / retail / public-sector)
14. Glossary
15. Framework citations
16. Sign-off page (5 signatories)
```

### 3.2 TIME × Wardley × Team Topologies Diagnostic Workshop (3-hour)
```
0. Pre-read (T-72h, 25 min)
   0.1 What each framework contributes
   0.2 Glossary
   0.3 Numerical hypothesis: "60–70% of Run spend is on Tolerate/Eliminate apps"
   0.4 Pre-work: each participant ranks 5 apps on TIME (≤15 min)
1. Facilitator brief (T-48h, facilitator only)
2. Minute-by-minute agenda
   00:00–00:10  Welcome, hypothesis, ground rules
   00:10–00:45  TIME classification (live, full portfolio)
   00:45–00:55  Break
   00:55–01:30  Wardley overlay
   01:30–02:00  Team Topologies overlay
   02:00–02:15  Break
   02:15–02:45  AI-fit cell-by-cell (4×3 matrix)
   02:45–03:00  Decision capture + pre-mortem
3. Worksheets (pre-printed): TIME matrix · Wardley canvas · Team-to-app heat map · AI-fit decision matrix
4. Stakeholder map (pre-work 1:1s for high-influence-low-interest cell)
5. Facilitation tactics (per likely derailment)
6. Decision capture template (with dissent log)
7. Pre-mortem ritual (15 min)
8. Post-read (T+24h)
```

### 3.3 DORA Baseline Kit (instrument)
```
0. Purpose, scope, gate this unlocks
1. Sample size + power
2. Source-system requirements (Git / CI / Ticketing / Incident)
3. SQL extraction templates per source
4. Bias controls (cherry-pick prevention, quiet-period exclusion, confounding events)
5. Privacy / consent (anonymize-at-source above team level)
6. Validation rules (impossible values, missing-data thresholds, outliers)
7. Triangulation plan (cross-check with time-allocation diary + SPACE survey)
8. Calibration questions (self-report vs telemetry delta > 25% flag)
9. Data-cleaning checklist (15 named steps)
10. Edge cases (mainframe-only teams, contractor-heavy, newly-formed)
11. Sensitivity to missing data
12. Refresh cadence
13. Downloadables (SQL files, sample dashboards, survey scripts)
14. Glossary
```

These three TOCs alone are deeper than most Tier-2 consulting deliverables ship — and Tier-1 firms ship this depth only per engagement at $300K–$1M of partner+associate hours. AbarVa ships them **pre-built, tenant-grounded, downloadable on Tuesday**.

---

## 4. Why no consulting firm matches this

| Dimension | Tier-1 firm | AbarVa | Net |
|---|---|---|---|
| Frameworks layered | 2–3 per deliverable | 3+ enforced by lint | Equal-or-better |
| Numerical benchmarks | Strong | Equal — corpus + tenant math | Equal |
| Anti-patterns named | Sometimes | Always — rubric requires 3+ | Better |
| Vertical overlay | One per deliverable | All embedded, conditional per tenant | Better |
| Workshop choreography | Custom per engagement | Pre-built, tested, reused | Faster |
| Tenant context | Researched per engagement (6 wks, $1M+) | Pre-loaded, queryable, continuously updated | 10× faster + cheaper |
| Sensitivity analysis | Sometimes | Always — rubric requires | Better |
| Pre-mortem | Sometimes | Always — every gate | Better |
| **Persistent context that compounds** | None — each engagement starts fresh | **Compounding — Move N learns from Moves 1…N-1** | **Categorically better** |
| Speed | 6–14 weeks | Days | 30× |
| Cost | $500K–$3M | $50–500K subscription | 5–10× |
| Ego / political baggage | Real | None | Better |

The categorical advantage is **persistent context that compounds**. The depth standard makes the framework *equal* on quality; the context layer makes it *better* on outcome.

---

## 5. The 14 packets — orchestration plan

### 5.1 Architecture commitment recap
Data-layer · Azure-native · AI Egress Control Plane is the only path to any LLM/Gamma · `client_id` is the tenant FK · `clients` is the table · ESLint blocks provider SDK imports outside `src/lib/integrations/ai-egress/`.

### 5.2 Repository setup
- Base repo: `/Users/anand/Projects/nexus`
- Each packet runs in its own git worktree under `.claude/worktrees/<packet-slug>/`
- Branch: `feat/p<N>-<slug>` · PR title: `[P<N>] <Title>`

### 5.3 Ownership zones

| Packet | Owns these paths |
|---|---|
| P0 Depth Standard | `docs/standards/DEPTH_STANDARD.md`, `scripts/lint/depth-lint.ts`, `scripts/lint/depth-rubrics/**`, `src/lib/depth/**`, `src/app/(maestro)/admin/depth-scorecard/**`, `.github/workflows/depth-lint.yml` |
| P1 Corpus data layer | `supabase/migrations/*_corpus_*.sql` (migration files use the existing folder name even though target is Azure PG), `src/lib/corpus/**`, `src/app/(maestro)/admin/corpus/**`, `src/app/api/corpus/**`, `scripts/corpus-import/**`, `worldview/` (becomes archived/read-only after migration), `infra/azure/ai-search/corpus-indexes.bicep` |
| P2 Tenant data | `supabase/migrations/*_client_extension_*.sql`, `src/lib/client-data/**`, `scripts/seed/apex-it-productivity.ts` |
| P3 Template data layer | `supabase/migrations/*_templates_*.sql`, `src/lib/templates/**`, `src/app/(maestro)/admin/templates/**`, `src/app/api/templates/**` |
| P4 Instrument data layer | `supabase/migrations/*_instruments_*.sql`, `src/lib/instruments/**`, `src/app/(maestro)/admin/instruments/**`, `src/app/api/instruments/**`, `src/app/(maestro)/programs/[id]/assets/discovery-kit/**`, `infra/azure/blob/instruments-container.bicep` |
| P5 Workshop data layer | `supabase/migrations/*_workshops_*.sql`, `src/lib/workshops/**`, `src/app/(maestro)/admin/workshops/**`, `src/app/api/workshops/**` |
| P6 Pattern authoring | DB records via P1 admin UI; audit log at `docs/corpus-author-log/**` |
| P7 Template authoring | DB records; audit log at `docs/template-author-log/**` |
| P8 Instrument authoring | DB records; audit log at `docs/instrument-author-log/**` |
| P9 Workshop authoring | DB records; audit log at `docs/workshop-author-log/**` |
| P10 Dependency DAG | `supabase/migrations/*_move_dependencies_*.sql`, `src/lib/dependencies/**`, `src/app/(maestro)/tower/portfolio-dag/**`, `src/app/api/dependencies/**` |
| P11 Sentinel reasoning | `src/lib/agents/sentinel-reasoning/**`, `src/app/api/intelligence/ask/route.ts`, `src/app/(maestro)/intelligence/ask/**`, `scripts/eval/sentinel-golden/**` |
| P12 Tower value view | `src/lib/tower/value-states/**`, `src/app/(maestro)/tower/programs/[moveId]/value/**`, `src/app/api/tower/**` |
| P13 Demo + assets | `docs/demo/**`, `src/app/(public)/how-it-works/it-productivity-comparison/**`, `src/app/(public)/how-it-works/frameworks/**` |

Shared (read-only for all): `src/app/layout.tsx`, `src/lib/db/**`, `src/lib/integrations/ai-egress/**` (modified only via coordinated cross-cutting PR), `package.json`, `next.config.ts`, `vercel.ts`, `infra/azure/**` (modified only via coordinated PR).

### 5.4 Parallelization waves

```
WAVE 1 (fire immediately — independent):
  P0 Depth Standard      ──┐
  P2 Client data schema  ──┤  3 in parallel
  P1 Corpus data layer   ──┘

WAVE 2 (fires when P1 lands):
  P3 Template data layer   ──┐
  P4 Instrument data layer ──┤  3 in parallel
  P5 Workshop data layer   ──┘

WAVE 3 (each fires when its upstream lands):
  P6 Pattern authoring     ── depends on P1 + P0
  P7 Template authoring    ── depends on P3 + P0
  P8 Instrument authoring  ── depends on P4 + P0
  P9 Workshop authoring    ── depends on P5 + P0

WAVE 4 (fires when P3 + P7 land):
  P10 Dependency DAG       ──┐
  P12 Tower value view     ──┤  3 in parallel
  P11 Sentinel reasoning   ──┘  (needs P1+P3 records, P0 lint, egress wrapper)

WAVE 5 (fires when P10 + P11 + P12 land):
  P13 Demo + assets
```

### 5.5 Cross-cutting concerns — every agent reads
- **Tenant isolation:** every table has `client_id` + RLS policy matching existing pattern. Inspect 3 recent migrations before authoring.
- **Auth:** server reads tenant from Clerk session via existing `getCtx()`. Never trust client-passed tenant IDs.
- **LLM calls:** ALWAYS via `callModel({ tenantId, userId, workflow, prompt, dataClass, provider, options })` from `src/lib/integrations/ai-egress`. Direct provider SDK imports are blocked by ESLint outside the egress package.
- **Vector / embeddings:** Azure AI Search. Index per namespace (`corpus-global`, `corpus-client-{id}`, `templates-global`). Embeddings via `callModel({ provider: 'openai-embeddings', workflow: 'embed-pattern', ... })` → routes through Azure OpenAI per egress.
- **Blob storage:** Azure Blob containers per artifact class. Use existing helper at `src/lib/azure/blob.ts` if present, else create one inside the owning packet.
- **Error handling:** API routes return `{ ok: true, data } | { ok: false, error: { code, message } }`. Never throw raw errors. Policy denial is `ok: false, error.code='ai-egress-denied'` with audit id.
- **Logging:** structured. App Insights ingest via existing wiring.
- **Audit:** every mutation on corpus/templates/instruments/workshops writes audit row. Every LLM call writes `ai_egress_audit` (already enforced by `callModel`).
- **Versioning:** all artifacts include `version`, `parent_version`, `published_at`, `retired_at`. Version-pinning is mandatory for consumed records.
- **TypeScript strict.** Types regenerated via `npm run db:types`.
- **Tests:** unit (branching logic) + integration (API routes) + Playwright smoke (admin surfaces).
- **Design canon (LOCKED):** bg `#F8F7F4`, Georgia serif normal weight headers, DM Sans body, black/ghost buttons, Snowflake-style sub-nav. No deviation.
- **No "Generated by Claude" comments in committed code.** Commit-message attribution only.

### 5.6 Branch / PR / CI / merge / deploy

**PR template:**
```markdown
## Packet
[P<N>] <Title>

## Upstream dependencies
- [x] P<X> merged at commit <sha>
- [ ] (none)

## Acceptance criteria
- [ ] <criterion>
...

## Schema changes
- Migrations: <list>
- RLS: <yes/no, summary>
- Backfill: <yes/no, plan>

## AI egress impact
- New callModel sites: <list with workflow names + dataClass>
- New tenant policy fields: <list, default values>

## Deploy plan
- Preview: auto via Vercel (until web cutover lands)
- Production: <auto on merge | gated on smoke test>

## Rollback plan
- <how to revert>

## Risk
- <P0/P1/P2 risks>
```

**CI gates (all must pass):**
- `npm run lint` (ESLint — includes the provider-SDK import guard)
- `npm run typecheck`
- `npm run test`
- `npm run lint:depth` (when P0 is live)
- `npm run build`
- `npm run db:migrate:dryrun` (when migrations present)

**Merge authority — pre-approved:** auto-merge own PR when all CI green AND acceptance criteria checked AND no other Wave-N PR open in same ownership zone. Never `--no-verify`, never `--amend` after first push.

**Deploy authority — pre-approved:**
- Preview deploy: automatic
- Production: auto on merge for P0/P2/P3/P4/P5/P10/P12 (additive); gated on smoke test for P1/P11/P13 (behavioral). Smoke spec lives at `scripts/smoke/p<N>-<slug>.spec.ts`. Smoke pass → promote. Smoke fail → automatic Vercel instant-rollback; write `INCIDENT` to status file.

### 5.7 Status tracking
Single file at repo root: `EXECUTION_STATUS.md`. Each packet's agent appends to its section every 30 min and on state change. Read it before every commit. Format:
```
## P<N> — <Title> · @<agent-id> · branch: feat/p<N>-<slug>
- 2026-05-12 14:00 START — read packet, confirmed zone, branched from main
- 2026-05-12 14:30 schema drafted, migration file created
- 2026-05-12 15:00 PR opened as Draft: #1947
- ...
- 2026-05-12 17:15 SMOKE PASS · production live · DONE
```

### 5.8 Conflict resolution
- Migration filename clash → later-to-commit renames + rebases
- Cross-zone change needed → write `COORDINATION NEEDED` to status; wait for `OK PROCEED`
- Hard blocker → write `ESCALATION` block; wait for human
- CI flake → mark `it.skip` with owner + rationale + issue, never delete
- Production smoke fail → auto-rollback, write `INCIDENT`, do not redeploy without diagnosis

---

## 6. The 14 packet prompts (paste-ready)

### Universal prompt header (prepend to every packet)

```
You are an autonomous engineering agent on the AbarVa / Nexus codebase at /Users/anand/Projects/nexus. You have been pre-approved to merge your own PR when CI is green and to deploy to production per the policy in /Users/anand/Projects/nexus/docs/execution-kit/ABARVA_EXECUTION_KIT.md §5.6.

Read the kit §0 through §5 before starting. Especially:
- §0.3 architecture commitments (data-layer, Azure-native, AI Egress Control Plane is the only LLM path)
- §0.4 Azure service mapping (no Supabase, no Pinecone, no Vercel AI Gateway)
- §0.5 AI Egress Control Plane usage (callModel wrapper, ESLint guard, audit table)
- §5.3 ownership zones (only write to your packet's zone)
- §5.5 cross-cutting concerns
- §5.6 branch / PR / CI / merge / deploy policy
- §5.7 status file (append every 30 min and on state change)

Tenant table is `clients`. FK column is `client_id`. Never use `tenants` / `tenant_id` for new code.
Every LLM call goes through callModel(...). Direct provider SDK imports are blocked outside src/lib/integrations/ai-egress/.

Be unsentimental. Use existing patterns. Do not invent. When done: PR merged, production deployed (or smoke-test gated), status file shows DONE.

Your packet follows.
```

---

### PACKET 0 — Depth Standard + lint-as-service

```
PACKET 0 — Depth Standard + lint enforcement

GOAL
Build the rigor enforcement system that ensures every artifact meets a 10-point depth rubric before it ships.

DELIVERABLES
1. /docs/standards/DEPTH_STANDARD.md — canonical document with 6 rubrics (T/W/I/P/G/S), do/don't tables, 1 fully-worked exemplar per rubric.
2. /src/lib/depth/rubrics/{template,workshop,instrument,pattern,gate,sentinel}.ts — typed rubric definitions: criteria, weights, structural-check functions, semantic-check prompts.
3. /scripts/lint/depth-lint.ts — CLI runner:
   - Structural checks (parse artifact, verify required sections)
   - Semantic check via callModel({ provider:'claude', workflow:'depth-lint', dataClass:'internal', prompt:<rubric + artifact> })
   - Output JSON: { artifact_id, rubric_type, total_score, criterion_scores[], reasoning, pass: boolean }
   - CLI: `npm run lint:depth -- --type=pattern --id=<uuid>` and `npm run lint:depth -- --all`
4. /src/lib/depth/lint-service.ts — server-side service the admin UIs call.
   - scoreArtifact(artifactType, content) → same JSON
   - 5-min in-memory cache by content hash
5. /src/app/(maestro)/admin/depth-scorecard/page.tsx — live scorecard.
6. /.github/workflows/depth-lint.yml — CI on PRs touching corpus/template content. Comments scores. Blocks merge if any <8.
7. /docs/standards/exemplars/ — 6 exemplar artifacts.

ACCEPTANCE
- All 6 rubric files exist with typed criteria
- `npm run lint:depth -- --all` clean against exemplars
- /admin/depth-scorecard renders
- CI workflow runs on PR open
- Cost guard: lint-service caches; alert if any single PR triggers >$5 LLM cost

DEPENDENCIES None. Wave 1.

NON-GOALS Do not build corpus tables (P1). Do not author patterns (P6). Do not touch Sentinel.

SMOKE /scripts/smoke/p0-depth-standard.spec.ts:
- POST mock pattern to lint endpoint → score returned
- Visit /admin/depth-scorecard → loads without console errors
- `npm run lint:depth -- --all` → exit 0

DEPLOY Auto on merge.
```

---

### PACKET 1 — Corpus data layer (the foundational change)

```
PACKET 1 — Corpus data layer

GOAL
Convert corpus from /worldview/*.md files into a versioned, reviewable, multi-tenant database with Azure AI Search retrieval and an authoring UI.

DELIVERABLES
1. Migrations under /supabase/migrations/ (folder name retained; target is Azure PG):
   - corpus_patterns (id, slug, title, category, status enum, confidence numeric, version int, parent_version_id, primary_author_id, approved_by_id, published_at, retired_at, search_doc_id text, depth_score numeric, vertical_overlays text[], region_overlays text[], applicable_horizons text[], created_at, updated_at)
   - corpus_pattern_versions (snapshots)
   - corpus_pattern_content (markdown body + structured claims/evidence/counterarguments/synthesis JSON)
   - corpus_pattern_relationships (from_id, to_id, type enum, confidence)
   - corpus_review_state
   - corpus_telemetry (event_type, context_jsonb, client_id, occurred_at)
   - corpus_overlays (overlay_type, overlay_key, content_delta_jsonb)
   - client_private_patterns (mirror + client_id; RLS)
   All with RLS policies. Global readable by authenticated; writable by author/reviewer/admin. Client-private scoped to client.

2. /infra/azure/ai-search/corpus-indexes.bicep — Bicep template for Azure AI Search:
   - Indexes: corpus-global, corpus-client-{clientId} (created per active client via a job)
   - Fields: id, slug, title, category, body, embedding (vector), confidence, depth_score, vertical_overlays, region_overlays, version, client_id (nullable)
   - Hybrid search profile (BM25 + vector + filters)

3. /src/lib/corpus/retrieval.ts — retrieval service
   - searchCorpus(query, opts: { clientId, verticalOverlays?, regionOverlays?, minConfidence?, minDepthScore?, includePrivate?, versionPin? })
   - Hybrid: Azure AI Search semantic + Postgres structured filters + RRF fusion
   - 5-min cache by query hash + opts

4. /src/lib/corpus/authoring.ts — CRUD with workflow
   - createPattern, updatePattern, submitForReview, addReview, approvePattern, publishPattern, retirePattern
   - Audit row + version snapshot per mutation
   - Calls depth-lint-service on approve/publish; blocks if <8
   - Embedding generation via callModel({ provider:'openai-embeddings', workflow:'embed-pattern', dataClass:'internal' })
   - Writes to Azure AI Search index on publish

5. /src/app/api/corpus/* — REST endpoints

6. /src/app/(maestro)/admin/corpus/* — authoring UI
   - List · Editor (structured form + live depth-score widget) · Review queue · Diff view · Relationship graph editor · Publish/retire actions

7. /scripts/corpus-import/migrate-worldview.ts — one-time import of /worldview/*.md
   - Parse YAML frontmatter + content
   - Insert at status='published', version=1
   - Generate embeddings, populate Azure AI Search
   - Idempotent

8. /worldview/README.md — marked READ-ONLY ARCHIVE post-migration

ACCEPTANCE
- Migrations apply via `npm run db:migrate`
- RLS tests pass for cross-client isolation
- `npm run corpus:import` migrates existing /worldview chunks
- /admin/corpus loads, full draft→review→approve→publish flow works
- Depth-lint invoked on approve; blocks if <8
- Azure AI Search index populated; searchCorpus returns version-pinned records

DEPENDENCIES P0 (stub the depth-lint service if not yet live: return {score:10,pass:true}).

NON-GOALS Do not author new pattern content (P6). Do not modify Sentinel (P11). Do not touch Move templates (P3).

SMOKE
- Create draft pattern via API → status=draft
- Submit → status=in_review
- Approve → calls depth-lint
- Publish → status=published, embedding, retrievable

DEPLOY Gated on smoke test.
```

---

### PACKET 2 — Client data schema + Apex seed

```
PACKET 2 — Client data schema + Apex seed

GOAL
Add the 12 client-data tables that hold per-customer evidence. Seed Apex Retail with credible fixture.

DELIVERABLES
1. Migrations (client_id everywhere; RLS):
   - application_portfolio (app_id, name, stack, language, modern/legacy flag, change_rate_per_yr, fte_count, criticality_tier 1-4, time_classification enum, annual_run_cost_usd, ams_vendor_id fk, ams_contract_value_usd, sunset_decision_date nullable, ai_fit_score numeric)
   - org_topology (team_id, name, type enum [stream|platform|enabling|complicated_subsystem], size_fte, span_of_control, geo, owning_apps text[], maturity_stage 1-5)
   - roles_inventory (role_id, title, fte_count, source enum [fte|contractor|si|gcc], geo, ladder_level, function_area)
   - dora_baselines (team_id, app_id nullable, measured_at, deploy_freq_per_week, lead_time_hours, mttr_hours, change_failure_rate_pct, reliability_pct)
   - space_devex_surveys (team_id, surveyed_at, responses_jsonb, n_responses, satisfaction_score, performance_score, activity_score, collab_score, efficiency_score)
   - ai_tool_footprint (tool_name, vendor, licensed_seats, activated_seats, dau, mau, annual_cost_usd, contract_end_date, indemnity_status, retention_policy)
   - vendor_contracts EXTEND (add: ai_usage_clauses bool, indemnity_provided bool, exit_terms_jsonb, concentration_pct numeric, rate_card_vintage date, outcome_based bool)
   - infra_ms_contracts (parallel; for network/datacenter/cloud-ops/security-ops)
   - discovery_instruments (move_id fk, instrument_template_id fk, status enum, owner_id, due_date, completion_pct, evidence_link, t_tier 1-3)
   - move_dependencies (skeleton: from_move_id, to_move_id, relation_type enum [depends_on|triggers|informs|blocks], note)
   - value_states (move_id fk, layer_type enum, projected_jsonb, tracked_jsonb, verified_jsonb, attested_by, attested_at)
   - kill_criteria (move_id fk, gate_id fk, criterion_name, threshold_numeric, current_value, status enum, evaluated_at)
   - risk_register (move_id fk, name, impact 1-5, likelihood 1-5, owner_id, mitigation, trigger_condition, status enum)

   All with client_id, RLS, created/updated/by, soft-delete via deleted_at.

2. Types regenerated via `npm run db:types`.

3. /scripts/seed/apex-it-productivity.ts — credible Apex seed:
   - 100 application_portfolio rows: 70 modern (POS/ecom/supply chain/store ops/CDP/analytics), 20 legacy Java/.NET, 10 legacy AS/400 mainframe (inventory/finance)
   - 12 org_topology teams (6 stream + 2 platform + 2 enabling + 2 complicated_subsystem)
   - 200 roles_inventory rows
   - 6 weeks DORA time-series
   - 1 SPACE/DevEx snapshot
   - AI tools: 200 Copilot seats (130 activated, 80 DAU), 50 Cursor pilot (45/38)
   - 25 vendor contracts; 8 infra_ms contracts (Wipro L1, Kyndryl mainframe AMS, AWS managed, Cisco network, etc.)

4. Honor existing apex-retail / apexretail key mapping (per memory)

ACCEPTANCE
- Migrations clean; RLS verified cross-client
- `npm run seed:apex-it-productivity` idempotent
- Realism: TIME distribution ~30/40/20/10; change-rate skewed; FTE/app realistic
- Cross-client query as Meridian user → 0 Apex rows

DEPENDENCIES None. Wave 1.

NON-GOALS Do not seed Meridian/First Capital here. Do not author corpus content.

SMOKE
- Query application_portfolio for Apex → 100 rows
- Query org_topology → 12 teams
- Cross-client query → 0 leak

DEPLOY Auto on merge.
```

---

### PACKET 3 — Move + Source template data layer

```
PACKET 3 — Move + Source template data layer

GOAL
Make Move templates and Source workflow templates first-class data with authoring UI and instantiation engine.

DELIVERABLES
1. Migrations:
   - move_template_kind (Move | SourceWorkflow)
   - move_templates (id, slug, kind, name, summary, sponsor_raci_jsonb, version, parent_version_id, status, depth_score, published_at, retired_at, vertical_overlays[], horizon_default, intended_personas[])
   - move_template_gates (template_id fk, gate_id, sequence_index, name, sponsor_raci_jsonb, required_artifacts text[], evidence_anchors text[], numeric_kill_criteria_jsonb, sensitivity_analysis_template, pre_mortem_required bool, time_budget_p50_days, time_budget_p90_days, hand_off_ritual, maturity_target int)
   - move_template_artifacts (gate_id fk, artifact_id, name, toc_jsonb, schema_jsonb, template_markdown text, depth_score)
   - move_template_versions (snapshots)
   - move_template_review_state
   - move_instances (extends/replaces existing programs/engagements — coordinate with existing model): instance_id, template_id, template_version_pinned, client_id, sponsor_assignments_jsonb, current_gate, status, artifact_completion_jsonb

2. /src/lib/templates/registry.ts — CRUD + instantiation
   - instantiateTemplate(templateId, version, clientId, options) → move_instances row with pinned version + gate skeleton
   - cloneTemplate(templateId)

3. /src/lib/templates/authoring.ts — workflow + depth-lint (G + T per artifact)

4. /src/app/api/templates/* — REST

5. /src/app/(maestro)/admin/templates/* — authoring UI:
   - List (Move + Source separated tabs)
   - Editor: drag-drop gate sequence, per-gate artifact editor with TOC editor
   - Live depth-score per gate/artifact
   - Diff view
   - Preview as instantiated Move

6. Backward compatibility:
   - Existing /strategic-moves and /programs read from move_instances; adapter so existing UI continues to render
   - Origination: /programs/new?template=<slug>&version=<v> instantiates

ACCEPTANCE
- Migrations + RLS
- Create template → 3 gates × 2 artifacts → publish → instantiate
- Existing UI still renders
- Depth-lint blocks <8

DEPENDENCIES P0 + P2.

NON-GOALS Do not author templates (P7). Do not build DAG (P10).

SMOKE
- Full template → gate → artifact → submit → approve → publish → instantiate → fetch with pinned version

DEPLOY Gated on smoke (touches programs surface).
```

---

### PACKET 4 — Discovery instrument data layer

```
PACKET 4 — Discovery instrument data layer

GOAL
Make 12 discovery instruments first-class data with authoring UI and downloadable rendering service.

DELIVERABLES
1. Migrations:
   - instrument_templates (id, slug, name, category, version, parent_version_id, status, depth_score, format enum [csv|md|json|docx|sql|interactive_form], schema_jsonb, content_template_text, content_blob_ref (Azure Blob URL nullable), sample_size_math_jsonb, bias_controls_jsonb, privacy_block text, validation_rules_jsonb, triangulation_plan_jsonb, edge_case_guide_jsonb, refresh_cadence, t_tier 1-3, owner_role, time_to_complete_days, vertical_overlays[])
   - instrument_template_versions
   - instrument_template_review_state

2. /infra/azure/blob/instruments-container.bicep — Azure Blob container `instruments` with versioning + lifecycle policy

3. /src/lib/instruments/authoring.ts — CRUD + workflow + depth-lint (Rubric I)

4. /src/lib/instruments/render.ts — render service
   - renderInstrument(instrumentId, version, clientId, format) → bytes/string
   - CSV pre-filled with client-specific column hints
   - DOCX via existing docx package
   - SQL parameterized
   - Interactive form returns JSON schema

5. /src/app/api/instruments/* — REST + download

6. /src/app/(maestro)/admin/instruments/* — authoring UI

7. /src/app/(maestro)/programs/[id]/assets/discovery-kit/page.tsx — per-Move kit surface
   - All instruments assigned to Move's gates
   - Status, owner, due, evidence-link, T-tier, completion %
   - Download / upload-back-evidence

ACCEPTANCE
- Migrations + RLS
- Create instrument → schema → content → publish → depth-lint pass
- Render endpoint produces all 6 formats
- Per-Move kit page renders

DEPENDENCIES P0 + P2.

NON-GOALS Do not author 12 instruments (P8).

SMOKE Create instrument → publish → render in 3 formats → download.

DEPLOY Auto on merge.
```

---

### PACKET 5 — Workshop template data layer

```
PACKET 5 — Workshop template data layer

GOAL
Workshop templates as first-class data: pre-reads, minute-by-minute agendas, facilitator briefs, worksheets, decision-capture forms, post-reads.

DELIVERABLES
1. Migrations:
   - workshop_templates (id, slug, name, duration_minutes, version, parent_version_id, status, depth_score, owning_gate_id fk nullable, hypothesis_to_test text, stakeholder_map_jsonb, facilitator_tactics_jsonb, vertical_overlays[])
   - workshop_template_assets (workshop_id fk, asset_type enum [pre_read|agenda|facilitator_brief|worksheet|decision_capture|pre_mortem|post_read|stakeholder_map], sequence_index, name, format, content_text or content_blob_ref, schema_jsonb, time_box_minutes)
   - workshop_template_versions
   - workshop_template_review_state
   - workshop_instances (template_id, version_pinned, client_id, move_instance_id fk, gate_id fk, scheduled_at, status, decisions_jsonb, dissent_log_jsonb, post_read_sent_at)

2. /src/lib/workshops/authoring.ts — CRUD + workflow + depth-lint (Rubric W)

3. /src/lib/workshops/render.ts — facilitator pack
   - renderWorkshopPack(workshopId, version, moveInstanceId) → multi-asset PDF/zip via Azure Blob
   - Tenant context substitution (e.g., TIME workshop pre-read embeds client's app portfolio)

4. /src/app/api/workshops/* — REST + render

5. /src/app/(maestro)/admin/workshops/* — authoring UI with timed-agenda slot system

6. /programs/[id]/workshops/page.tsx — per-Move surface

ACCEPTANCE
- Migrations + RLS
- Create workshop with 8 assets across 5 types
- Render produces valid PDF/zip
- Per-Move surface lists workshops tied to gates

DEPENDENCIES P0 + P2.

NON-GOALS Do not author workshops (P9).

SMOKE Create → add assets → publish → render → download.

DEPLOY Auto on merge.
```

---

### PACKET 6 — Author 39 corpus patterns

```
PACKET 6 — Author 39 corpus patterns

GOAL
Create the 39 patterns from §1.8 as published, depth-lint-passing records in corpus DB via P1 admin UI.

DELIVERABLES
- P-IT-01 through P-IT-29 + P-IT-35, 36 + P-IT-37, 38, 39 + P-SRC-01 through P-SRC-05 = 39 patterns total
- Each ≥8 on Rubric P
- 600–1,200 words body
- 3–5 evidence chunks with primary citations (Gartner, Forrester, DORA, GitHub & METR studies, McKinsey "Unleashing developer productivity," IBM watsonx, Diffblue, Team Topologies (Skelton/Pais), Forsgren DevEx, NIST AI RMF, EU AI Act)
- ≥2 named counterarguments
- Calibrated confidence
- Boundary conditions
- ≥2 failure modes
- Maturity-model linkage
- ≥1 vertical overlay
- ≥2 related-pattern graph links
- Synthesis "so what"

Cite real published sources. Do NOT fabricate.

ACCEPTANCE
- 39 patterns at status=published
- All depth-lint ≥8
- Azure AI Search embeddings generated
- Relationship graph ≥80 edges
- /admin/depth-scorecard shows all passing

DEPENDENCIES P1 + P0 must be merged.

NON-GOALS Do not modify schema. Do not author Move templates (P7).

SMOKE
- count(corpus_patterns where status=published, category like 'it-productivity%' or 'source-optimization%') = 39
- All depth_scores ≥8
- searchCorpus("how do I improve IT productivity with AI") top-5 all relevant

DEPLOY N/A — DB content; status DONE on smoke pass.
```

---

### PACKET 7 — Author Move + Source workflow templates

```
PACKET 7 — Author Move + Source workflow templates

GOAL
Create 8 published templates (6 Moves + 2 Source workflows) via P3 admin UI.

DELIVERABLES
6 Move templates:
1. IT-Productivity (parent, 9 gates per §1.2)
2. Data Foundation for AI
3. AI Governance & Policy
4. App Portfolio Rationalization
5. Talent Strategy — AI-Fluent Eng Org
6. Mainframe Modernization (sequenced)

2 Source workflow templates:
1. AMS Portfolio Optimization (5 stages per §1.4)
2. Infra MS Optimization (5 stages)

Each template:
- Full sponsor RACI per template + per gate
- 4–9 gates
- Per-gate: required artifacts, evidence anchors, numeric kill criteria, sensitivity template, pre-mortem requirement, time budget P50/P90, hand-off, maturity target
- Per artifact: TOC, structured field schema, content markdown template
- Each gate ≥8 on Rubric G; each artifact ≥8 on Rubric T

ACCEPTANCE
- 8 templates at status=published
- All depth-lint pass
- Each instantiable via /programs/new?template=<slug> (or /source/new?template=<slug>)
- IT-Productivity 9 gates render with full artifact TOCs

DEPENDENCIES P3 + P0.

NON-GOALS Do not build DAG (P10). Do not modify Sentinel (P11).

SMOKE
- count(move_templates where status=published) ≥ 8
- Instantiate IT-Productivity for Apex → move_instances row with 9-gate skeleton

DEPLOY N/A — DB content.
```

---

### PACKET 8 — Author 12 discovery instruments

```
PACKET 8 — Author 12 discovery instruments

GOAL
Create 12 published instruments via P4 admin UI per §1.5.

DELIVERABLES
Each instrument ≥8 on Rubric I. Each includes sample-size math, bias controls, privacy block, validation rules, triangulation, calibration questions, data-cleaning checklist, edge-case guide, missing-data sensitivity, refresh cadence.

Special attention:
- Engineer time-allocation diary: privacy/consent block + anonymization-at-source spec
- DORA baseline kit: SQL templates for GitHub + GitLab + Bitbucket + CI extraction script
- CXO interview guide: 5 sub-guides (CTO, CFO, HEng, HPeople, CISO)
- Tool footprint scan: SAM integration specs

ACCEPTANCE
- 12 instruments at status=published
- All depth-lint pass
- Sample render works for each format
- Per-Move kit page surfaces all 12 with download

DEPENDENCIES P4.

SMOKE Render 3 different formats → download all.

DEPLOY N/A.
```

---

### PACKET 9 — Author workshop templates

```
PACKET 9 — Author workshop templates

GOAL
Create ~15 workshops tied to critical gates via P5 admin UI.

DELIVERABLES
Estimated 15 workshops:
- Wave 0 Alignment (IT-Productivity)
- Discovery kickoff (IT-Productivity)
- TIME × Wardley × Team Topologies portfolio diagnostic (per §3.2)
- TOM target-state design
- Tooling architecture decision
- Business case stakeholder alignment
- Wave 1 pilot kickoff
- Vendor concentration & sunset (AMS Optimization)
- FinOps + AIOps maturity (Infra MS)
- AI governance policy
- Data foundation readiness
- Talent strategy: ladder + comp
- Mainframe sunset decision
- Quarterly value verification ceremony (universal)
- Pre-mortem ritual (universal reusable)

Each workshop has 10 Rubric W assets: pre-read · facilitator brief · minute-by-minute agenda · numerical hypothesis · facilitation tactics · worksheets · decision capture · pre-mortem · stakeholder map · post-read.

ACCEPTANCE
- 15 workshops at status=published
- All depth-lint pass
- Render pack works for ≥3 with client-context substitution

DEPENDENCIES P5.

SMOKE Render 3 packs.

DEPLOY N/A.
```

---

### PACKET 10 — Cross-Move / cross-Source dependency DAG

```
PACKET 10 — Cross-Move / cross-Source dependency DAG

GOAL
Wire dependency graph between Move instances and Source workflow instances.

DELIVERABLES
1. Migration refining move_dependencies from P2 skeleton; add indexes for graph traversal; allow cross-module (move_instance ↔ source_workflow_instance)

2. /src/lib/dependencies/* — graph API
   - getMoveDAG(clientId) → nodes + edges with status
   - addDependency, removeDependency
   - proposeSiblingMoves(parentMoveTemplateId) → recommended sibling templates per the pattern set authored in P6/P7

3. /src/app/api/dependencies/* — REST

4. /src/app/(maestro)/tower/portfolio-dag/page.tsx — visualization
   - Use existing graph lib in node_modules (react-flow if present, else recharts/d3-graph)
   - Nodes colored by status; edges by relation type
   - Click node → drill into Move/Source workflow
   - Filter by status, sponsor, dollar-impact

5. Integration with IT-Productivity Move's Charter gate: "Sibling-Move dependency check" sub-gate surfaces recommended DAG; sponsor accepts/declines each sibling with one click; accept creates Move + DAG edges.

ACCEPTANCE
- /tower/portfolio-dag renders for Apex with ≥1 Move
- Creating IT-Productivity with "accept all siblings" creates 5 Moves + 8+ edges
- AMS Optimization Source workflow links to IT-Productivity (relation=informs)

DEPENDENCIES P2 + P3 + P7.

DEPLOY Auto on merge.
```

---

### PACKET 11 — Sentinel reasoning state machine (centerpiece)

```
PACKET 11 — Sentinel reasoning state machine

GOAL
Wire Sentinel's 6-block reasoning loop for IT-productivity-intent questions, reading from corpus + templates data layer, version-pinned, all LLM calls through callModel(...).

DELIVERABLES
1. /src/lib/agents/sentinel-reasoning/intent-classifier.ts
   - Classify incoming questions; route IT-productivity intent to structured loop
   - Keyword + semantic match against corpus_patterns where category='it-productivity'
   - Classifier itself uses callModel({ provider:'claude', workflow:'sentinel-intent', dataClass:'internal' })

2. /src/lib/agents/sentinel-reasoning/state-machine.ts
   6 stages per §1.6, each with typed input/output, persisted as reasoning_trace row:
   - Stage 1 Clarify — callModel({ workflow:'sentinel-clarify', ... })
   - Stage 2 Alignment-Check — query Wave 0 charter; if missing, surface template
   - Stage 3 Portfolio-Segmentation — searchCorpus + query application_portfolio + org_topology → TIME × AI-fit matrix with confidence intervals from P-IT-18/19
   - Stage 4 TOM-Recommendation — query org_topology + roles_inventory + relevant TOM patterns
   - Stage 5 Tooling+Governance — query ai_tool_footprint + ai-governance patterns
   - Stage 6 Sibling-Move-Portfolio — query move_templates + proposeSiblingMoves → 5-Move portfolio with dependency arrows

   All 6 stages append to reasoning_trace with citations + confidence + dataClass tagged per stage.

3. /src/app/api/intelligence/ask/route.ts UPDATE
   - When intent = it-productivity, stream 6-stage output as NDJSON cards
   - Each card: stage name, content, citations, confidence, dissent (final stage), one-click-action

4. /src/app/(maestro)/intelligence/ask/* UPDATE
   - Render 6 stages as expandable cards
   - Citation chips → drill to corpus pattern
   - "Shape Move" CTA on Stage 6 → calls DAG API + instantiates Moves

5. /scripts/eval/sentinel-golden/it-productivity.ts — 10-question golden eval
   - All 6 stages render; ≥3 citations per stage; dissent present; sibling-Move CTA produces ≥4 valid proposals
   - Pass threshold 8/10
   - Each eval call goes through callModel({ workflow:'sentinel-golden-eval' })

6. Version pinning: every Sentinel session pins corpus version + template version it consulted; stored on reasoning_trace for audit replay

7. Sample output passes Rubric S

ACCEPTANCE
- Asking question on Apex CTO persona → 6 cards within 10s
- "Shape Move" → 5+ Move instances + DAG edges
- Tower DAG shows portfolio
- Golden eval ≥8/10
- ai_egress_audit rows present for every Sentinel call with workflow tagged

DEPENDENCIES P0 + P1 + P3 + P10 + content from P6 + P7.

DEPLOY Gated on smoke + golden eval pass on preview.
```

---

### PACKET 12 — Tower tri-state value view

```
PACKET 12 — Tower tri-state value view

GOAL
Per-Move 8-layer projected/tracked/verified value tracking with portfolio rollup.

DELIVERABLES
1. /src/lib/tower/value-states/* — read/write/attest per layer (§1.7)
   - 8 layers × 3 states each
   - projected = calculated from template + client data
   - tracked = live telemetry (seed-stubbed; production wiring later)
   - verified = explicit CFO attestation event with audit-log entry

2. /src/app/api/tower/* — REST

3. /src/app/(maestro)/tower/programs/[moveId]/value/page.tsx — per-Move detail
   - 8 rows × 3 cols with variance + drill-down to evidence
   - Verified attestation button: CFO-role only + audit log

4. /src/app/(maestro)/tower/portfolio/page.tsx UPDATE — portfolio rollup
   - Sum projected $ across active Moves + Source workflows
   - DAG arrows from P10 visible
   - Click → drill to value page

5. Stub population for Apex Moves: projected auto-computed from template + seed; tracked read from DORA + tool footprint seed; verified blank.

ACCEPTANCE
- Open Apex IT-Productivity Move → 8 layers × 3 states render
- Verified attestation works with audit log
- Portfolio sums Apex Moves to single $
- Variance drillable

DEPENDENCIES P2 + P3 + (useful: P7 + P10)

DEPLOY Auto on merge.
```

---

### PACKET 13 — Demo path + assets

```
PACKET 13 — Demo path + assets

GOAL
Demo-able end-to-end on Apex CTO persona with comparison page, public teaser, talking tracks, recorded video.

DELIVERABLES
1. /docs/demo/it-productivity-gold-path.md — minute-by-minute demo script
   - Persona: Apex CTO
   - 6-minute path: Intelligence Enterprise Context → ask question → Sentinel 6 cards → click "Shape Moves" → portfolio DAG → IT-Productivity Move (9 gates + value layers) → AMS Optimization Source workflow (vendor portfolio diagnostic)
   - Failure-mode notes (what to do if X breaks live)

2. /src/app/(public)/how-it-works/it-productivity-comparison/page.tsx — side-by-side comparison
   - Same question
   - Generic LLM answer (cached real Claude call without egress context) vs AbarVa Sentinel answer
   - Visible: citation density, dissent presence, Move workflow, version-pinned audit
   - Highlight AI Egress Control Plane: "Every model call governed by tenant policy, classified by data sensitivity, redacted as needed, logged for audit"

3. /src/app/(public)/how-it-works/frameworks/ai-it-productivity/page.tsx — public teaser
   - 6 headline patterns (publishable subset)
   - "Full corpus — login required" CTA

4. /docs/demo/talking-tracks/*
   - cto-led.md (technical depth-first)
   - cfo-led.md (value + ROI first; emphasize verified-value tri-state)
   - cio-led.md (governance + AI Egress emphasis for InfoSec narrative)
   - joint.md (dual sponsor)

5. Recording — 6-min screencast or annotated storyboard at /docs/demo/screencast-storyboard/

6. Update exec briefs (add "Example: IT-Productivity Decision Framework" section):
   - /Users/anand/Downloads/prat-vemana-abarva-one-pager-context-layer-2026-05-12.html
   - /Users/anand/Downloads/vipin-kamath-abarva-one-pager.html
   - /Users/anand/Downloads/sriram-krishnaswamy-abarva-firstfinancial-brief.html

ACCEPTANCE
- Demo runs end-to-end ≤7 min on Apex without improvisation
- Comparison page loads, both columns populated
- Public teaser live
- Talking tracks documented
- 3 exec briefs updated

DEPENDENCIES All upstream merged.

DEPLOY Gated on Playwright E2E that walks the script.
```

---

## 7. Spawn checklist for you

1. **Commit this kit to main:**
```bash
cd /Users/anand/Projects/nexus
git checkout -b chore/execution-kit
git add docs/execution-kit/ABARVA_EXECUTION_KIT.md
git commit -m "chore: AbarVa IT-productivity execution kit (Azure-native, AI-Egress-aware)"
git push -u origin chore/execution-kit
# Merge to main so worktree branches start from a base that has it
```

2. **Create status file:**
```bash
echo "# Execution Status" > EXECUTION_STATUS.md
git add EXECUTION_STATUS.md
git commit -m "chore: execution status tracking file"
git push
```

3. **Generate DOCX (optional, requires pandoc):**
```bash
brew install pandoc # if needed
pandoc docs/execution-kit/ABARVA_EXECUTION_KIT.md \
  -o docs/execution-kit/ABARVA_EXECUTION_KIT.docx \
  --reference-doc=/path/to/template.docx # optional, for branded styles
```

4. **Fire Wave 1 (3 parallel agents):**
```bash
git worktree add .claude/worktrees/p0-depth-standard -b feat/p0-depth-standard
git worktree add .claude/worktrees/p1-corpus-data-layer -b feat/p1-corpus-data-layer
git worktree add .claude/worktrees/p2-client-data -b feat/p2-client-data
# In each: open Claude Code, paste universal header + that packet's prompt
```

5. **As each Wave-1 packet merges, fire Wave-2 dependents** in new worktrees. Same pattern for Waves 3, 4, 5.

6. **Read `EXECUTION_STATUS.md` to monitor.** Look for `ESCALATION` blocks — those are your only required interventions. `INCIDENT` blocks mean a production smoke failed and Vercel auto-rolled back.

7. **Post-completion sweep (after all 14 merged):**
```bash
npm run eval:sentinel-golden
npm run smoke:demo-path
# Verify /admin/depth-scorecard: all artifacts ≥8/10
```

---

## 8. AI Trust Architecture — Enterprise readiness annex

(Excerpted from the Enterprise AI Readiness Roadmap, PR #2257 → merged. Layer 1 — the Egress Control Plane — already live per PR #2258.)

### 8.1 The procurement narrative (5 points — paste into every CISO meeting)
1. **"Claude is the language layer, not the decision-maker."** The deterministic kernel computes the verdict. Auditable code, not model output.
2. **"Every external AI call goes through the AI Egress Control Plane."** Policy-gated, sensitivity-classified, redacted, logged, replayable.
3. **"You choose the AI route."** Public Anthropic, your Azure Foundry tenant, your Bedrock, your region, your BYOK — we adapt per-tenant.
4. **"Human approval required for every decision that matters."** No AI self-approval of gates. Documented HITL bill of materials.
5. **"Full audit trail, replayable, deletable."** Every model call logged with prompt/response hashes and model version. Right-to-be-forgotten enforced.

### 8.2 What's live today (Layer 1)
- `clients.ai_policy` per-tenant JSONB policy
- `ai_egress_audit` write-before-return synchronous audit
- `tenant_policy_audit` policy-change audit
- `callModel(...)` wrapper as the only path
- ESLint guard blocking provider SDK imports outside the egress package
- Apex/Meridian/First Capital seeded with appropriate policies
- Anthropic-direct route implemented; Foundry/Bedrock/Vertex are switch cases ready for Layer 3

### 8.3 What's NOT in this kit (separate roadmap items)
- **Layer 2:** PII scanner (NER + format regex), redaction/aggregation layer
- **Layer 3:** Azure AI Foundry private endpoint, AWS Bedrock, GCP Vertex implementations
- **Layer 4:** Customer-managed keys (BYOK) per tenant
- **Subprocessor registry** with actual DPAs + ZDR confirmations + retention terms
- **Model Use Cards** per workflow (model, data sent, allowed/disallowed decisions, human approval gates, eval results, failure modes)
- **HITL bill of materials** per workflow (what AI can draft/challenge/summarize vs cannot approve/award/close)
- **Vercel → Azure Container Apps web hosting cutover** (3–5 weeks)
- **Clerk → Entra External ID migration** (separate program)
- **AI red-team report**
- **SOC 2 Type I → Type II track** (Vanta/Drata)
- **EU AI Act / NIST AI RMF conformity roadmap**

### 8.4 Per-tenant AI policy example
```json
{
  "allowExternalAI": false,
  "allowClaude": true,
  "allowedClaudeRoute": "azure-foundry-private",
  "allowGamma": false,
  "maxDataClass": "confidential",
  "requireRedaction": true,
  "requireHumanApprovalForExports": true,
  "kernelOnlyMode": false
}
```

### 8.5 Gamma policy summary
- Refuse on `dataClass=confidential|restricted` unless explicit tenant policy + user approval
- Use AbarVa internal PPTX renderer as default for sensitive decks
- Gamma role: render approved sanitized executive-narrative decks
- AbarVa-side post-render consistency check: no changed numbers, no unsupported claims, no "fund" if kernel says "shape/no-go", all evidence gaps retained

---

## 9. What's intentionally out of scope (do not let agents drift)

- Vercel → Azure Container Apps web hosting cutover (separate program, ~3–5 weeks)
- Clerk → Entra External ID migration (separate program)
- AI Egress Control Plane Layers 2/3/4 (separate roadmap PRs)
- New Move templates beyond the 6 listed in §1.3 + 2 Source workflows in §1.4
- New tenants beyond Apex / Meridian / First Capital
- Multi-language / i18n
- Mobile app surface
- Public API for external integrations
- Customer co-authoring of corpus (designed-for in schema, gated to admins for V1)
- Pricing / billing instrumentation
- SOC 2 / ISO 27001 audit prep

If an agent's work pulls into any of these, write `ESCALATION` to status and stop.

---

## 10. Final go-ahead

When you reply **"fire"**:
1. I commit this kit to main via a `chore/execution-kit` branch
2. Create `EXECUTION_STATUS.md`
3. Spawn the three Wave-1 agents (P0 + P1 + P2) in parallel worktrees with full self-contained prompts
4. Monitor status file for `ESCALATION` / `INCIDENT`; otherwise let them run autonomously to merge + deploy

If you want to adjust scope/priority before firing, reply with edits and I'll iterate.

---

**Document version:** v2026-05-12 · Azure-native · AI-Egress-aware
**Source of truth:** `/Users/anand/Projects/nexus/docs/execution-kit/ABARVA_EXECUTION_KIT.md`
**Convert to DOCX:** `pandoc docs/execution-kit/ABARVA_EXECUTION_KIT.md -o docs/execution-kit/ABARVA_EXECUTION_KIT.docx`
