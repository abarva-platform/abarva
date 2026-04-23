# AbarVa · Page Strategic Purpose Definition

**Version:** 1.0 · April 22, 2026
**Owner:** Anand Sundaram
**Status:** Authoritative alignment document. Every page design decision flows from this.
**Use:** Read before making design changes. If a design change doesn't reinforce the page's declared strategic purpose, it doesn't ship.

---

## Document intent

Seven pages make up the AbarVa surface. Each serves a distinct strategic purpose, speaks to a distinct primary audience, and carries a distinct measure of success. Design decisions become easy when the strategic purpose is non-negotiable; design decisions become sprawling when the purpose is fuzzy. This document fixes the purpose so the design work can compress.

Pages covered: **Home · Programs · Intelligence · AI Control Tower · Platform · Admin · Investor**.

Each section below follows the same shape: Audience, Strategic purpose, What it addresses, Core functionality/workflow, Impact/success measures, Design character, Relationship to other pages. A cross-page coherence map and a design-change priority ranking close the document.

---

## 1 · Home

**Route:** `/`
**Audience:** First-time visitors — prospective CXOs, design partners, investors, analyst/press, category-curious. Mix of qualified (researching a specific problem) and curious (benchmarking the AI-for-enterprise-transformation category).
**Primary user state:** Unqualified, short attention span, first 30 seconds decide whether they stay.

### Strategic purpose

Establish the AbarVa category in under 30 seconds and route the qualified visitor to the surface that will convert them. Home is not a product tour; it is a positioning statement rendered as a page. The job is to plant three claims in the visitor's head — *we are a new category*, *we deliver outcomes not software*, *we are working today* — and hand them the next click.

### What it addresses

- Category ambiguity. "AI for consulting" and "AI for transformation" are crowded with tool vendors. Home has to assert and own the category.
- Credibility asymmetry. A founder-stage company claiming the Harvey-of-enterprise-transformation needs proof on the front door, not a "learn more" buried three clicks deep.
- Audience divergence. CXOs, investors, and design partners want different things. Home has to serve all three without muddling any one.

### Core functionality / workflow

No workflow. Home is narrative + navigation. Primary structural elements:

- **Hero** — single dominant claim. *"Own it. Build it. Keep it."* plus *"Act on intelligence. Before the window closes."*
- **Category thesis** — three-panel argument: the consulting gap, the intelligence moat, the outcome accountability model.
- **Proof strip** — anchored numbers (pattern count, composite tenant count, outcome attestation framework, research publications) presented with restraint.
- **Primary CTAs** — "See it in action" → Programs demo (Morrison golden path); "How it works" → Platform; "Read the research" → Intelligence.
- **Secondary CTA** — "For investors" → gated `/investors` page (token-protected).
- **No dark patterns** — no scroll-jacking, no modal email capture, no chatbot ambush.

### Impact / success measures

- Demo requests per 1,000 visits (north star)
- Click-through rate to Programs, Platform, or Intelligence
- Average scroll depth (should exceed 50% for qualified traffic)
- Time-to-investor-token-request from a Home visit
- Return-visitor rate (category depth signal)

### Design character

Light cream hero (#F5F1EB iridescent). Georgia serif wordmark for gravitas. Short, strong verbs. Generous whitespace. No stock illustrations of "diverse teams around laptops." The aesthetic should read closer to a research institute than a SaaS landing page. When in doubt, remove.

### Relationship to other pages

Home is the front door that funnels to the three conversion surfaces: **Programs** (product demo), **Platform** (technical credibility), **Intelligence** (moat evidence). It also gates access to **Investor** via token. Home never replaces these pages; it routes to them. If a visitor needs a question answered that Home doesn't route to, Home is failing.

---

## 2 · Programs

**Route:** `/tenant/{tenant_slug}/programs` and per-program subroutes
**Audience:** CXOs, transformation leaders, program owners, maestros, and their teams inside client tenants. The primary operational users of the product.
**Primary user state:** Logged in, mid-engagement, running real work. High context, high stakes.

### Strategic purpose

Programs is the product. It is the decision-grade AI Program Operating System where actual enterprise transformation work happens — intake, diagnosis, design, build, outcome — with full evidence trail, hard phase gates, and outcome accountability. Everything AbarVa sells converges here. Every other surface either feeds Programs or consumes from Programs.

### What it addresses

- The fragmentation of consulting work across docs, emails, slides, spreadsheets, and Slack threads, with no single source of truth.
- The loss of context between phases when a program moves from one consulting team to another.
- The absence of outcome accountability in traditional consulting — deliverables ship, invoices clear, impact is unmeasured.
- The asymmetric visibility gap — the CXO gets polished slides, while the working state is opaque.
- The inability to compound learning across programs, because every engagement starts from zero.

### Core functionality / workflow

- **Maestro Intake Interface** — conversational front door; exact/partial/no match logic against the pattern library; outputs a program charter.
- **5-phase timeline** with hard gates (Intake & Framing → Diagnosis & Analysis → Design & Decision → Build & Deliver → Outcome & Accountability). No phase advances without its gate criterion met.
- **Deliverable registry per program** — every deliverable at its declared fidelity tier (Rich / Outline / Stub), with breadcrumbs, cross-links, and tenant-specific bindings.
- **Intervention portfolio + decision log** — the running record of what was decided, by whom, on what evidence.
- **CXO touch moments** — Phase 3 interview (20-40 min), Phase 4 validation (30 min). The CXO's time is expensive and metered.
- **Outcome measurement + dual-ledger reconciliation** — savings calculated two ways (AbarVa ledger + client finance ledger), reconciled before attestation.
- **Cross-program view** — portfolio rollup across all programs in a tenant, with phase state and outcome projection.
- **Pattern injection** — relevant patterns from Intelligence surface inline during the program (not a separate destination).

### Impact / success measures

- Program cycle time (Phase 1 → attested outcome)
- Outcome attribution rate (share of client-booked savings traceable to AbarVa programs)
- CXO NPS at Phase 4 validation
- Deliverable reuse rate across programs (artifact → pattern contribution)
- Maestro hours consumed per program (against bundled allotment)
- Phase gate pass rate on first review (quality signal)

### Design character

Dark near-black working zone. Dense information. Decision-forward — the page makes it obvious what the next decision is. Tables, timelines, decision logs. Content before chrome. No cheerful illustrations; this is where real work happens. Typography tight, spacing earned. Mobile responsive but desktop-primary.

### Relationship to other pages

- **Consumes from Intelligence:** patterns inject into relevant phases; analogous programs surface at intake; benchmarks pre-populate diagnosis.
- **Feeds Intelligence:** completed programs contribute observations, outcome deltas, and new anti-patterns back to the pattern library.
- **Feeds AI Control Tower:** program state rolls up to the executive portfolio view.
- **Feeds Investor:** the Morrison golden path is the product demo embedded in the investor narrative.

---

## 3 · Intelligence

**Route:** `/intelligence` (library), `/intelligence/patterns/{slug}` (pattern detail), `/tenant/{tenant_slug}/intelligence/...` (tenant-scoped)
**Audience:** Three distinct users on one surface:
1. CXOs browsing for relevance ("is my problem in here?") — the pre-sales user.
2. Maestros and consultants using patterns during active programs — the in-program user.
3. Investors and analysts understanding the differentiated asset — the diligence user.

### Strategic purpose

Expose and operationalize the Transformation Genome — the compounding pattern library that makes AbarVa's advice demonstrably better than alternatives. Intelligence has two jobs that must coexist: it is a **credible, browsable body of knowledge** that a CXO or investor can read and be convinced by, AND it is an **invokable capability** that gets pulled into programs at the right moment. The first job makes the moat visible; the second makes it productive.

### What it addresses

- The "consulting black box" — advice delivered without provenance or structure. Intelligence makes every claim traceable to a pattern, an observation, an evidence source.
- The loss of learning across engagements. Each program enriches Intelligence; Intelligence enriches each new program.
- The credibility gap at the top of the funnel. CXOs and investors need something substantive to read before they believe the company has depth.
- The "just a wrapper" objection. Intelligence is the asset that makes AbarVa not-a-wrapper.

### Core functionality / workflow

- **Pattern library** — browse/search/filter by vertical (healthcare, retail, finserv, energy) × function (front/middle/back office) × archetype (5 archetypes). Each pattern card: outcome claim, evidence count, freshness, applicable tenants.
- **Pattern detail pages** — the full pattern pack rendered: identity, classification, detection signals, diagnostic questions, interventions, anti-patterns, vendor landscape, regulatory considerations, observations, success measures, timeline, governance mechanism, sector variants, related patterns. Long-form, scannable with a persistent sidebar.
- **Tenant-scoped pattern views** — how a given pattern applies to *this* tenant: which signals are observed, which interventions would apply, which analogous programs already ran in the platform.
- **Cross-client intelligence** — analogous programs (anonymized where required), outcome deltas across the graph, emergent patterns awaiting curation.
- **Research publications** — external-facing thought leadership; positions AbarVa as the category-defining intellectual voice.
- **Pattern contribution flow** — how in-flight programs feed observations back (for authenticated tenant users).

### Impact / success measures

- Pattern views per program (in-program utilization)
- Pattern → engagement conversion from external traffic
- Inbound interest generated by research publications
- Time-to-relevant-pattern on Maestro intake (latency to surface the right match)
- Pattern freshness index (share of patterns with observations in last 90 days)
- Citation rate in external content (category authority signal)

### Design character

Academic-grade depth with product-grade navigation. Pattern pages read like research reports — long prose, proper citations, serious tone — but navigate like a product — sidebar, cross-links, search, filters, tenant context switches. Light landing, dark pattern-detail working zone. Never feels like a marketing glossary; always feels like a research body.

### Relationship to other pages

- **Consumed by Programs:** patterns inject into relevant phases in real time.
- **Feeds AI Control Tower:** patterns power the "what's in our estate / what should we do about it" analysis.
- **Feeds Investor:** Intelligence is the moat. The investor page links to three canonical patterns as proof.
- **Consumed by Home:** the "Read the research" CTA routes here.

---

## 4 · AI Control Tower

**Route:** `/tenant/{tenant_slug}/tower` (tenant-scoped) and `/operations/tower` (AbarVa ops rollup)
**Audience:** Enterprise CIOs, CAIOs, Chief Risk Officers, Chief Data Officers, AI Council members. Not program owners — the portfolio-level AI estate owners. **This is the Prat-resonant surface.**
**Primary user state:** Executive, time-poor, high-signal — checks the surface in 5-minute windows between meetings, needs the top three things that matter to jump out.

### Strategic purpose

Give the enterprise the consolidated view of its entire AI estate — tools, models, vendors, programs, risks, outcomes, spend — that no existing vendor dashboard provides today. The AI Control Tower is the surveillance + governance + rationalization surface for the portfolio level, exactly where the CIO/CAIO persona feels the most pain and has the least tooling. This is arguably the single most commercially resonant page in the product for the Prat-class buyer, because it is the dashboard the CIO actually checks on Monday morning.

### What it addresses

- **AI sprawl.** Every enterprise has 40-120 AI-adjacent tools. Nobody has the inventory. Control Tower does.
- **Shadow AI.** Activations the central team didn't sanction (Einstein, Copilot, Now Assist, Gemini turn-on). Surface them.
- **Vendor overlap.** Seven tools that do the same thing. Rationalization recommendations with sanctioned-catalog reasoning.
- **Model risk.** Which models are in production, at what risk tier, with what MRM status, with what drift in the last 30 days.
- **Regulatory exposure.** EU AI Act classification, NIST AI RMF alignment, SR 11-7 compliance (for banks), ISO 42001 posture, HIPAA considerations (for healthcare).
- **AI Council operating rhythm.** Cadence, open decisions, risk-tiered approval queue, meeting outputs.
- **Program portfolio visibility.** Every program across every phase, with outcome projection and risk flags.
- **Spend rationalization.** What is the enterprise spending on AI, where, with what ROI.

### Core functionality / workflow

- **Estate inventory** — AI tools (sanctioned / shadow / hidden-activation / unsanctioned); vendors; models; data products. Filter by business function, risk tier, spend bucket.
- **Vendor portfolio** — overlap matrix, rationalization recommendations with evidence, contract renewal calendar, negotiation leverage notes.
- **Model inventory** — per-model card: risk tier, MRM status, last validation date, drift score, owner, escalation path.
- **AI Council workspace** — meeting cadence, decisions log, open items queue, risk-tiered approvals (fast track → full review), voting record.
- **Regulatory posture** — per-framework heat map (EU AI Act, NIST AI RMF, SR 11-7, ISO 42001, sector-specific). Gap analysis with remediation tasks.
- **Program portfolio rollup** — all programs, phase state, phase-aging, outcome projection, risk flags, cross-tenant view (for AbarVa ops).
- **Spend + ROI view** — AI estate cost, allocation by business function, ROI per sanctioned tool, overage/waste detection.
- **Alerts & watchlist** — config-driven: model drift over threshold, new shadow activation detected, regulatory update affects classification, program outcome miss risk.

### Impact / success measures

- Estate consolidation — vendor count reduction over 6/12 months
- Shadow AI discovery rate (rate of new activations detected within 30 days)
- Risk-tiered approval coverage (% of models passing through governance vs. bypassing)
- Model drift detection lead time (detect-before-harm metric)
- AI Council decision velocity (average days from proposal to decision)
- Spend rationalization ($ removed from redundant vendor contracts)
- Regulatory posture score (aggregate compliance heat)
- Executive engagement — weekly active CIO/CAIO viewers

### Design character

Executive dashboard density. Tall information architecture. KPI strips → heat maps → drill-downs. Charts with restraint; no dashboard porn. Dark near-black working zone. Typography optimized for legibility at executive browsing pace (headline → sub-metric → evidence link). Mobile acceptable but desktop-primary — CIOs drill in from desks. Every alert is actionable — no "5 things need your attention" without a one-click action. Serious, clinical, respectful of executive time.

### Relationship to other pages

- **Aggregates from Programs:** program portfolio rollup is a direct feed.
- **Aggregates from Intelligence:** pattern library powers "why this vendor overlap matters" reasoning.
- **Independent of Home:** Control Tower is never linked from the marketing front door; it is accessed only by authenticated enterprise users.
- **Feeds Investor:** the Control Tower surface is the single most compelling screenshot in the investor deck, because it visibly demonstrates CIO-grade product depth.

---

## 5 · Platform

**Route:** `/platform`
**Audience:** Technical evaluators, design partners' CTO/CIO staff, investors evaluating engineering depth, AI practitioners, enterprise architecture review boards.
**Primary user state:** Skeptical, diligent, checking for substance. Reading to disqualify, not to be dazzled.

### Strategic purpose

Prove the platform works. Show the architecture, the agent roster, the integration surface, the data model, the security posture, and the pricing discipline. Platform is the credibility page — the surface that either earns or loses trust with a technical reader. It is not a marketing page dressed up as tech; it is a technical page that happens to be public.

### What it addresses

- "Is this real engineering or vapor?" The three-layer stack, the agent roster, the ingestion pipeline, the graph schema — all visible in enough depth that an architect can evaluate.
- "How does it plug into my stack?" Connector catalog, data model, identity integration, deployment model.
- "What does it cost?" Explicit pricing tiers with bundled hours, transparent overage pricing. No "contact sales" for base pricing.
- "Who built this?" Team credibility in the context of platform claims.

### Core functionality / workflow

Mostly narrative + reference; minimal interactive workflow. Core sections:

- **Architecture explainer** — three-layer stack (Postgres facts · Pinecone meaning · graph wisdom). Diagrams, not prose alone.
- **Agent roster** — Nexus (Programs), Sentinel (Intelligence), Atlas (Tower), Steward (Platform). Each agent: scope, model, prompts, evaluation posture, latency budget.
- **Integration catalog** — the connectors that exist; connector roadmap; custom integration SLA.
- **Data model** — entities, relationships, RLS posture, tenancy model, data residency options.
- **Security + compliance** — SOC 2 status/timeline, data handling, encryption, model provider posture, audit logging.
- **Developer / partner API** — public API surface (when available), webhook model, extensibility points.
- **Pricing** — three tiers ($350K / $800K / $1.6M) with bundled maestro hours (240 / 520 / 1,040), overage rate, what's included, what's not.

### Impact / success measures

- Design partner technical due-diligence completion rate (pass/fail on first review)
- Time from first Platform visit to integration conversation
- Investor deep-read signal (time-on-page for Platform during diligence windows)
- Inbound from technical content (architect-level interest signal)

### Design character

Clean technical depth. Diagrams matter more than prose. Architectural elegance — the page itself should demonstrate the design sensibility. Mostly light, with dark code/architecture sections. Not marketing; not dry docs either. Closer to a Stripe or Vercel docs/platform page than a typical vendor "platform overview."

### Relationship to other pages

- **Referenced from Home:** the "How it works" CTA.
- **Referenced from Investor:** technical due-diligence on the seed round will route through Platform.
- **Independent of Programs, Control Tower, Intelligence:** Platform is read, not worked in.

---

## 6 · Admin

**Route:** `/admin` (AbarVa ops) and `/tenant/{tenant_slug}/admin` (client admin)
**Audience:** AbarVa operations team (tenant provisioning, support, platform operations) and client-side admins (IT, security, procurement, identity, data engineering).
**Primary user state:** Operational, task-driven, time-constrained. Visits Admin to get a specific thing done and leave.

### Strategic purpose

Make AbarVa operable at enterprise scale with minimum services overhead. Admin is the plumbing — tenant provisioning, user management, data connections, entitlements, billing, audit. Its strategic job is to eliminate the services-heavy onboarding that would otherwise limit scale: every hour saved in manual onboarding is an hour of maestro capacity recovered for actual program work.

### What it addresses

- Enterprise procurement and security requirements that demand SSO, SCIM, audit, data residency, role-based access.
- The onboarding toil that traps early-stage companies in professional-services drag.
- Client-side IT teams that need self-service configuration without ticketing back to AbarVa support.
- Audit and governance requirements for enterprise sales cycles.

### Core functionality / workflow

- **Tenant management** (AbarVa ops) — create, configure, archive tenants; tier assignment; maestro hour pool setup.
- **User roles and entitlements** — RBAC, SSO (OIDC/SAML), SCIM provisioning, role templates per tier.
- **Data source configuration** — connectors (systems list), sync state, error log, credential rotation, retry control.
- **Entitlement and billing** — pricing tier, maestro hour consumption, overage status, invoice history, contract renewal.
- **Audit log** — who did what, when, to what. Exportable for compliance.
- **Observability** (AbarVa ops) — tenant health, generation quality metrics, alert routing.
- **Support tooling** (AbarVa ops) — impersonation with audit trail, ticket integration, incident posture.

### Impact / success measures

- Tenant time-to-productive-use (hours from contract signature to first program charter)
- Support ticket volume per tenant (lower is better)
- Audit log completeness (no gaps — hard requirement)
- SSO/SCIM adoption rate among enterprise tenants
- Self-service completion rate (tenant admins completing tasks without AbarVa support)

### Design character

Utility-grade. Operational clarity above all. Not pretty — reliable. Dense forms when forms are needed. No unnecessary animation. Fast. Keyboard-friendly. Looks like a workshop, not a showroom. Dark working zone. Error states are loud; success states are quiet.

### Relationship to other pages

- **Foundation for Programs, Control Tower, Intelligence:** Admin provisions the tenants and users those surfaces serve.
- **Never surfaced to Home, Investor, Platform:** Admin is internal-facing; it has no external-facing narrative job.

---

## 7 · Investor

**Route:** `abarva.ai/investors?access=<token>` (token-gated)
**Audience:** Gated — Anthology Fund, Shail Jain, strategic angels, Series A prospects cultivated but not yet in term-sheet conversation. Not public.
**Primary user state:** Evaluative, diligence-oriented, reading to form conviction. Usually revisits multiple times during a decision cycle.

### Strategic purpose

Close the seed round. Tell the complete AbarVa story with investment framing — market, moat, traction, team, ask — in a way that builds conviction faster than a deck can. Investor is a living page, not a slide export; it updates as traction compounds, which itself is a signal (a page that changes between two investor visits signals velocity).

### What it addresses

- The asymmetry of investor diligence — limited attention windows across many deals. Make it easy to get to conviction.
- The Harvey AI analogy that anchors the pitch — the page puts the framing up front and lets the investor verify it.
- The depth gap between deck and product — the page links to live product surfaces (the Morrison path on Programs, the Control Tower, canonical Intelligence patterns).
- The trust gap with a founder-stage company — the page's own polish and depth is itself evidence.

### Core functionality / workflow

- **Category thesis** — the Harvey AI analogy, $800B TAM framing, category-definition argument.
- **Differentiated moat** — the four compounding assets (Transformation Genome, Adaptive Strategy Intelligence, Outcome Interpretability Layer, Research Publication Program). Each with evidence.
- **Product proof** — live links: Morrison path on Programs; Ambient path on Programs; Control Tower; canonical Intelligence patterns. Investors can click through.
- **Traction** — composite reference tenants (explicitly labeled as demo scenarios, not customers), design partners in pipeline (role-level by default; named only with consent), revenue run rate and projection once applicable (zero until real — don't decorate), ARR bridge to Series A.
- **Team** — Anand's pedigree, advisors (Shail), hire plan for the seed round.
- **Financial ask** — $8M at $25M cap, use-of-proceeds breakdown, milestones to Series A trigger ($5M ARR → $100M pre-money), timeline.
- **Data room link** — for investors past initial conviction, the gated data room (financials, cap table, architecture documentation, pipeline references where consented — no fabricated customer references until real signed customers exist).
- **FAQ** — the questions every investor asks, answered in writing.

### Impact / success measures

- Conviction-building velocity (time from first visit to term-sheet conversation)
- Return-visit rate (repeat visits during a decision cycle)
- Data-room request rate (advanced-diligence signal)
- Investor referrals generated from this page
- Term-sheet close velocity (seed round closing calendar)

### Design character

Confident but not showy. Harvey-grade polish rendered as a living page. Data-rich. Anchors on numbers, not adjectives. Light hero sections transition to dark data-heavy working sections. Long-form but scannable. Every claim has a link to supporting evidence (a pattern, a program path, a publication). No stock "hockey stick" illustrations. When a number updates, the "Last updated" timestamp shows — the page is alive.

### Relationship to other pages

- **Gated via Home:** the "For investors" CTA issues tokens (or exists on a separate dedicated entry).
- **Consumes from every other page:** Investor pulls live content from Programs (Morrison path), Control Tower (CIO-grade screenshot), Intelligence (three canonical patterns), Platform (architecture diagram). The page is an aggregator, not a duplicator.
- **Closed-world:** never indexed; every external reference uses a token. Offline "deck export" available but the page is the canonical.

---

## Cross-page coherence map

The seven pages are not independent; they form a coherent system with specific flow relationships.

**Marketing ↔ Product flows (outside → in):**

- Home → Platform (technical credibility)
- Home → Intelligence (moat evidence)
- Home → Programs demo (product proof — Morrison golden path)
- Home → Investor (token-gated)

**Product ↔ Product flows (inside):**

- Programs ↔ Intelligence: patterns inject into programs in real time; completed programs contribute observations back. Bidirectional; high-frequency.
- Programs → AI Control Tower: program portfolio rolls up to the executive view. Unidirectional aggregation.
- Intelligence → AI Control Tower: patterns power the Tower's analysis of estate, vendor overlap, regulatory posture.
- Admin → every authenticated surface: provisions tenants, users, data, entitlements.

**Investor narrative flow:**

- Investor aggregates from Programs (Morrison), Control Tower (CIO depth screenshot), Intelligence (three canonical patterns), Platform (architecture diagram), Home (category framing). Investor is an aggregator; it does not originate content.

**Zones by visual register:**

- **Light hero zones:** Home, Intelligence landing, Platform landing, Investor hero, Programs tenant-shell entry.
- **Dark working zones:** Programs (deliverable pages and working surfaces), AI Control Tower (all surfaces), Admin (all surfaces), Intelligence pattern-detail pages, Investor data-heavy sections.

**Access control zones:**

- **Public:** Home, Platform, Intelligence landing + publications.
- **Token-gated:** Investor.
- **Authenticated-tenant:** Programs, AI Control Tower, Intelligence tenant-scoped, Admin (client-side).
- **AbarVa ops only:** Admin (ops-side), Operations Control Tower rollup.

---

## Shared design principles (applied to every page)

These hold across the surface; individual page character refinements ride on top.

- **Every page owns a single dominant outcome.** If you cannot state the outcome in one sentence, the page is overloaded.
- **Decision-forward, not dashboard-forward.** Show the decision that needs making, not the data exhaust. Data supports decisions; it does not replace them.
- **Dark working zones, light marketing zones.** The visual register signals to the user whether they are marketing-reading or working.
- **Composite disclaimer on every tenant reference.** Non-negotiable. "Composite organization built from real-world data" chip on every tenant page.
- **Never reference forbidden companies.** CADE, Accenture, Dell, McKinsey, Deloitte, BCG, Bain, Huron, Navigant, Presbyterian, PHS, MD Anderson, CommonSpirit, HP Inc. Enforced across every surface.
- **Mobile responsive; desktop primary.** Every surface works on mobile. Programs, Control Tower, Admin are desktop-first by user reality.
- **Content before chrome.** Chrome (nav, sidebars, badges) earns its space only by serving content. When content is thin, chrome is thinner.
- **Every link goes somewhere real.** No `href="#"`. No "Coming soon" ever — Stubs are first-class render states, not dead ends.
- **Performance budget applies everywhere.** FCP ≤ 1.5s, LCP ≤ 2.5s on 3G Fast. No exceptions, even for marketing pages.

---

## Design-change priority ranking

Not every page deserves the same design investment. Priority order for the next 30 days, calibrated to Prat demo + Anthology Fund pitch + seed close:

**Tier 1 — must be polished before Prat demo and Anthology pitch:**

1. **Programs** — the product. Morrison golden path at Rich fidelity. Every click works. This is the single most investment-worthy surface because it IS the thing being sold.
2. **AI Control Tower** — the Prat-resonant surface. The single most commercially compelling page for the CIO-class buyer. Tower carries the "dashboard the CIO checks Monday morning" ambition. If Tower lands, Prat signs.
3. **Investor** — gated, needs to be Harvey-grade before any serious investor visit. Anthology Fund cannot see a half-finished page.

**Tier 2 — should be strong before broader outbound:**

4. **Home** — positioning anchor. Already light-hero; ensure messaging is tight and routes work. Medium lift if the three-panel thesis holds up.
5. **Intelligence** — moat evidence. Pattern library is substantial (the design pack delivered); the landing page and navigation need polish so the depth is discoverable.

**Tier 3 — functional-only acceptable in the near term:**

6. **Platform** — credibility. Needs to be present and accurate; does not need to be beautiful yet.
7. **Admin** — utility. Ship functional; design is utility-grade; beauty is not the job.

---

## How to use this document

- **Before any design change,** read the target page's section. If the change does not reinforce the declared strategic purpose, do not ship it.
- **When scoping a sprint,** use the priority ranking to allocate design and engineering hours.
- **When onboarding a new contributor** (designer, agent, engineer), this is the first document they read.
- **When in doubt about a page's scope,** the strategic purpose section is the tiebreaker. If a proposed feature does not fit, it belongs on a different page — or not at all.
- **When pages start drifting into each other** (Programs growing a dashboard that should be on Control Tower; Home growing product functionality), this document is the reset.

---

*End of Page Strategic Purpose Definition.*
