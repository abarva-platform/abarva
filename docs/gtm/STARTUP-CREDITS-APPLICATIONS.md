# AbarVa · Startup Credits — Application Drafts

> Last updated 2026-05-14. Pre-fills for the two credit programs called out in backlog D5. Founder reviews + submits.

## Why apply to both

AbarVa is at the intersection of two cost curves that dominate pre-seed burn for an AI-native enterprise SaaS: cloud infrastructure and frontier-model inference. Microsoft for Startups credits subsidize the in-progress Azure lab (PRs #1938, #1940 — Container Apps + private Postgres in eastus2) and underwrite the future client-VPC SKU that enterprise pilots will require for security review. Anthropic Startup Program credits subsidize the model-cost runway through first pilot — Claude is not a peripheral integration, it is the reasoning substrate behind all four AbarVa surfaces (Intelligence, Moves, Source, Tower).

Combined, the two programs cover an estimated $30–150k of pilot-phase infrastructure and model spend, which is the difference between a 12-month and a 24-month runway at current burn. Both programs require a formal legal entity (D4 dependency) and a working reference deployment — AbarVa has the latter live at `app.abarva.ai`; the former is the only material gating step before submission.

---

## Part 1 · Microsoft for Startups (Azure for Startups)

### Company name
AbarVa

### Website
`abarva.ai` (marketing) · `app.abarva.ai` (product, live reference deployment)

### Founded
2026 — _formal Delaware C-corp incorporation date TBD (D4 dependency)_

### Headquarters location
_TBD — founder to confirm primary business address._

### Founder(s)
Anand Sundaram (sole founder, pre-seed)

### Number of employees
1 (founder)

### Stage
Pre-seed, bootstrapped

### Industry / vertical
Enterprise SaaS · Applied AI · Decision intelligence for the C-suite

### One-line description
AbarVa is the tenant-grounded decision OS that turns the C-suite's AI and business bets into evidence-backed, auditable moves.

### Detailed company description
AbarVa is a decision operating system for C-suite executives navigating the most consequential bet of this decade: where to place AI and business capital so it lands. Every CIO, CDO, CDAO, and CFO is being asked to evaluate dozens of AI-flavored proposals each quarter — from contact-center automation to demand forecasting to clinical-documentation AI — without the analyst bench or the consultant runway to triage them rigorously. Consultants don't scale, internal strategy teams are thin, and the AI vendor noise floor is rising.

AbarVa is the tenant-grounded layer that sits between the executive and the chaos. It ingests a tenant's own enterprise context — segments, signals, prior moves, KPIs, organizational structure — and pairs that context with a constellation of specialist agents fronting four product surfaces: Intelligence (pattern-to-Move funnel), Moves (program origination and execution), Source (vendor/RFP triage), and Tower (portfolio health). Every reasoning step is grounded in the tenant's data via a hardened broker contract; nothing the user sees is generic LLM output unmoored from their reality.

The founder-led pre-seed team has shipped a working product across three reference tenants (Apex Retail, Meridian Health, First Capital Financial), completed a nine-PR security audit cycle (PRs #1923–#1933), and stood up an Azure deployment foundation (PRs #1938, #1940) in preparation for the first enterprise pilot.

### Product description / what does your product do
AbarVa delivers four tightly-integrated product surfaces, each fronted by a named agent backed by dozens of specialist sub-agents.

- **Intelligence (Sentinel-front):** A pattern-to-Move funnel that surfaces tenant-specific signals — operational anomalies, market shifts, peer benchmarks, internal misalignment patterns — and converts them into candidate moves the executive can act on. Sentinel orchestrates a catalog of analytical specialists; the user sees one chat surface.
- **Moves (Nexus-front):** Program origination, phase-gated execution, and gate-approval workflow. Executives originate programs from Intelligence signals or cold; AbarVa pre-fills the program brief from tenant context (org, prior moves, similar programs at peer tenants) and tracks each program through configurable phase gates.
- **Source (Sentinel-front):** Vendor and RFP triage. Pre-filled briefings compare vendors against the tenant's actual stack, constraints, and prior procurement decisions.
- **Tower (Atlas-front):** Portfolio-health view across all active moves, programs, and bets; surfaces drift, blocked gates, and capital exposure.

The architectural keystone is the `AgentContextBroker` contract: app-tier code never directly touches the enterprise data room, vector store, or graph — it always goes through the broker, which enforces tenant-scoped data access, per-user RLS (six migrations, 108 tests landed in Phase 5), and audit logging. This is the deployment-day promise that lets us pass a CISO's security review.

Three reference tenants are live today: Apex Retail (consumer), Meridian Health (provider), and First Capital Financial (banking).

### Why are you applying for Microsoft for Startups
AbarVa's pilot pipeline includes Fortune-500 healthcare and financial-services targets whose security review will require Azure deployment behind their own VNet — what we internally call the B4 client-VPC pattern. We have already begun the Azure migration: PRs #1938 and #1940 stood up the Azure lab foundation with Container Apps, Postgres Flexible Server (eastus2), Key Vault, and a private VNet. We need to extend that foundation into a production-grade SKU with private endpoints, Front Door + WAF, API Management, Defender, and Sentinel-grade observability — none of which are free.

A three-lane architecture (Control plane / Private-Data plane / Intelligence-Model plane) means the Azure footprint is non-trivial even at single-pilot scale, and the per-tenant client-VPC SKU multiplies it. Microsoft for Startups credits would underwrite the Azure lab through pilot launch and let us validate the client-VPC SKU against a real enterprise security review without burning runway on infrastructure that has to exist regardless of revenue timing. It also unlocks Microsoft's enterprise co-sell motion, which directly maps to our ICP.

### What Azure services do you / will you use
- **Azure Container Apps** — primary compute for the Next.js 16 app and worker services. Already provisioned (#1938).
- **Azure Database for PostgreSQL Flexible Server** — primary OLTP for tenant data and metadata. Already provisioned in eastus2 (#1938).
- **Azure Key Vault** — secrets, signing keys, per-tenant credentials. Already provisioned.
- **Azure Blob Storage** — evidence ledger, document corpus, generated deliverables.
- **Private Endpoint + Virtual Network** — private connectivity between Container Apps and Postgres; required posture for B4 client-VPC SKU.
- **Log Analytics + Application Insights** — telemetry, audit log retention, gate-event tracing.
- **Azure AI Search (planned)** — hybrid retrieval over tenant corpus; current Pinecone footprint migrates here for Azure-native deployments.
- **Azure Front Door + WAF (planned)** — edge routing, DDoS posture, geo-fencing for regulated tenants.
- **Azure API Management (planned)** — per-tenant rate limiting, partner API surface, audit gateway.
- **Azure Service Bus (planned)** — durable workflow events for the broker contract and gate-approval pipeline.
- **Microsoft Defender for Cloud (planned)** — continuous posture management; required artifact for CISO review.
- **Azure Cost Management** — per-tenant cost attribution, FinOps reporting.
- **Azure AI Foundry (evaluation)** — secondary model surface for Azure-OpenAI-required tenants; Claude remains the primary reasoning model.

### Expected monthly Azure spend over next 12 months
- **Months 1–3 (lab + dev):** ~$1,000/mo. Single Container Apps environment, dev-tier Postgres, minimal observability.
- **Months 4–9 (first pilot ramp):** ~$5,000–$10,000/mo. Production-grade Postgres, private endpoints, Front Door/WAF, Defender, full Log Analytics retention.
- **Months 10–12 (first production tenant + client-VPC SKU validation):** ~$15,000–$30,000/mo. Per-tenant isolated stack, API Management, Service Bus, AI Search at production scale.

**Year-one estimate: ~$120,000–$180,000.**

### Funding raised to date
None — bootstrapped by the founder.

### Revenue
Pre-revenue. Pilot LOI conversations in progress; no signed pilot at the date of this application.

### Customers / pilots
- **Reference deployments (live):** Apex Retail (consumer), Meridian Health (provider), First Capital Financial (banking) — three industry-grounded tenant configurations live at `app.abarva.ai` with real schema, ingested context, and end-to-end agent flows.
- **Pilot pipeline:** active CXO-level conversations across retail, healthcare, and financial services. No signed pilots yet — honesty matters more than puffery here.

### Why now — market timing
AI buying decisions are landing on every CXO's desk faster than any prior technology wave: contact-center automation, demand forecasting, clinical-documentation AI, code-generation, agent platforms — each pitched as transformative, each requiring capital and organizational commitment. The traditional triage layer — consultants and internal strategy teams — does not scale to the cadence or volume. Boards are demanding AI bets; CFOs are demanding evidence; CIOs are caught between.

AbarVa is the tenant-grounded layer that makes those bets land with evidence. We tie every move proposal to the tenant's own data, prior decisions, organizational context, and peer benchmarks. We are arriving at the moment when "we tried an AI pilot and it didn't ship" has become the dominant CXO narrative — the market is primed for a decision OS, not another point AI tool. Twelve months from now, the executives who navigated 2026 well will be defined by the quality of their triage; AbarVa is the tool that defines that quality.

### Anything else we should know
At pre-seed stage, AbarVa has already completed a nine-PR security audit cycle (PRs #1923–#1933) closing 10/10 P0 and 16/17 P1 audit items, including per-user RLS across six migrations with 108 tests, broker-boundary enforcement (the broker contract is a hard architectural seam — app-tier code physically cannot bypass it), Clerk JWT hardening, and a sensitive-upload guardrail. This is engineering rigor that most pre-seed AI-SaaS companies defer until Series A. We are designing for the CISO review on day one because our ICP requires it.

---

## Part 2 · Anthropic Startup Program

### Company name + website
AbarVa · `abarva.ai` · product reference deployment at `app.abarva.ai`

### Founder(s) + LinkedIn
Anand Sundaram — _LinkedIn URL TBD (founder to provide before submission)._

### Company stage + funding status
Pre-seed, bootstrapped. No outside capital raised to date.

### What does your product do
AbarVa is a tenant-grounded decision operating system for C-suite executives. Four product surfaces — Intelligence, Moves, Source, and Tower — help executives triage AI and business bets with evidence drawn from their own enterprise context, not generic LLM output. Each surface is fronted by a named Claude-backed agent (Sentinel, Nexus, Sentinel, Atlas respectively) orchestrating a catalog of specialist sub-agents, all routed through a hardened broker contract that enforces tenant scope before any reasoning step.

Reference deployments are live for three industries: Apex Retail (consumer), Meridian Health (provider), First Capital Financial (banking). The product is functional end-to-end — context ingestion, agent reasoning, program origination, gate-approval workflow, audit ledger — with active pilot conversations across the same three verticals.

Claude is not a peripheral integration. It is the reasoning substrate. Sentinel's pattern-to-Move funnel, Nexus's program brief pre-fill, Atlas's portfolio drift summary, and Steward's setup-time configuration are all Claude-driven. Without Claude, AbarVa is a database; with Claude grounded in tenant context, AbarVa is the decision OS.

### How are you using Claude
Claude powers four named, user-facing agents, each fronting one of AbarVa's four product surfaces:

- **Sentinel (Intelligence + Source surfaces):** Pattern-to-Move funnel and vendor/RFP triage. Sentinel orchestrates dozens of analytical specialists behind a single chat surface; the user never sees the specialist layer.
- **Nexus (Moves surface):** Program origination, phase-gated execution, gate-approval reasoning. Nexus pre-fills program briefs from tenant context (org structure, prior moves, similar programs at reference tenants) and walks executives through gate decisions.
- **Atlas (Tower surface):** Portfolio-health summarization, drift detection, gate-blockage explanations across all active programs.
- **Steward (Setup / admin surface):** Tenant onboarding, source-of-truth configuration, agent-trace audit views.

Every Claude call is wrapped by the `AgentContextBroker` contract, which enforces tenant-scoped data access before context reaches Claude. App-tier code physically cannot import the data room, vector store, or graph directly — it must go through the broker. This is the architectural seam that lets us pass enterprise security review.

Two specific prompt-engineering investments worth flagging: an arithmetic guard for Sentinel introduced in PR #1932 (Claude is asked to externalize numerical reasoning rather than guess), and a tenant-key normalization at the broker layer (Apex tenant key has two valid forms — `apexretail` in the app tier and `apex-retail` in the broker — the broker maps before context assembly).

### Estimated monthly Anthropic API spend
- **Months 1–3 (lab + dev):** ~$500/mo. Internal usage, dogfooding across reference tenants.
- **Months 4–9 (first pilot ramp):** ~$3,000–$5,000/mo. First pilot tenant in active use; CXO-cadence reasoning calls plus background pattern scans.
- **Months 10–12 (multi-pilot):** ~$10,000–$20,000/mo. Two to three pilot tenants, full Intelligence pattern-scan cadence, Tower portfolio drift jobs.

**Year-one estimate: ~$80,000–$150,000.**

### Why are you applying for the founder credit
AbarVa is pre-seed and bootstrapped. Claude is the core differentiator — not a feature we could swap out. Our cost structure for the next twelve months is dominated by two line items: Azure infrastructure (covered by a parallel Microsoft for Startups application) and Anthropic API spend. The Anthropic founder credit window aligns precisely with our pilot ramp: months 4–12 are when we move from internal dogfooding to multi-pilot production, and that is exactly the window in which model spend compounds.

The credit underwrites the runway from internal validation to first signed pilot without forcing us to either (a) downshift to a weaker model at exactly the moment quality matters most, or (b) burn equity-bridge capital on inference. We are designing the product around Claude's strengths in nuanced enterprise reasoning; the credit is the difference between proving that thesis on schedule and stretching the proof point past the next fundraise.

### What model are you using
Claude Sonnet 4.5 / 4.6 / 4.7 family across all four surface-fronting agents (Sentinel, Nexus, Atlas, Steward) and the specialist catalog behind them. We track model-version upgrades closely and re-tune prompts on each major release; current production agents are pinned to Claude Opus 4.7 for the most reasoning-heavy specialist paths and Sonnet 4.6/4.7 for high-volume orchestration paths.

### Production traffic estimate
Honest answer: low call volume, high value per call. AbarVa is CXO-facing, not consumer-facing. A typical pilot tenant generates tens to low-hundreds of reasoning calls per day, each consuming significant tenant context (segments, prior moves, org structure) and producing executive-grade output. Token volume per call is high; total call count is modest. As pilots scale, the dominant growth axis is breadth of context per call (richer tenant grounding) more than raw call frequency.

### Integration architecture
Direct Anthropic API integration today via the official `@anthropic-ai/sdk` package, called only from server-side routes inside Next.js 16 App Router. The `AgentContextBroker` contract is the sole code path that constructs a Claude request — app-tier surfaces (Intelligence, Moves, Source, Tower) call the broker, never the Anthropic SDK directly. The broker enforces tenant scope, applies prompt-caching where appropriate, and writes an audit-ledger entry per call.

Per-tenant rate limiting is implemented at the broker layer (not at the SDK layer) so it survives any future provider swap or AI Gateway adoption. Vercel AI Gateway and Anthropic's Managed Agents are under evaluation for the next architectural cycle, primarily for unified cost telemetry across the specialist catalog and for failover posture during pilot SLAs. No production traffic moves to a gateway until cost-attribution parity with the broker audit ledger is confirmed.

---

## Submission checklist

- [ ] Verify Delaware C-corp formation (D4 dependency) — both programs require a legal entity
- [ ] LinkedIn profile up to date
- [ ] Founder bio (1–2 paragraphs) attached to both
- [ ] Reference deployment URL (`app.abarva.ai`) tested before submission
- [ ] Estimated 12-month Azure spend signed off by founder
- [ ] Estimated 12-month Anthropic spend signed off by founder
- [ ] Headquarters / business address confirmed
- [ ] Formal incorporation date confirmed
- [ ] Submission date logged below

## Submission log

| Program | Submitted | Result | Notes |
|---|---|---|---|
| Microsoft for Startups | _TBD_ | _TBD_ | — |
| Anthropic Startup Program | _TBD_ | _TBD_ | — |
