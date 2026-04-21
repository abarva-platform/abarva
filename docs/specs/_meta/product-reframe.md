# AbarVa · Product Reframe — Four Surfaces Through the Buyer Lens

**Date:** April 20, 2026
**Prompted by:** Anand's question — is "Engagement" the right name, and how do these pages shine with intelligence?
**Purpose:** Strategic reframe of the four product surfaces through the lens of the actual buyer, not the seller. Establish a rename (Engagement → Programs), reframe each surface for its real user, define what "shine with intelligence" means concretely per surface.

---

## The core strategic problem

AbarVa's current nomenclature is **seller-coded**. "Engagement" is what consulting firms *sell*; it's not what buyers *run*. This locks out 40-50% of the addressable market — the Target / Costco / Amazon / Apple class of buyer who doesn't buy consulting but runs massive internal transformation work.

The fix is not superficial renaming. It's **reframing the product around what buyers actually do with it**, then naming each surface honestly against that framing.

---

## Three buyer personas

| Persona | Who | Current model | AbarVa role | Commercial framing |
|---|---|---|---|---|
| **Consulting-displacement** | Fortune 500 healthcare, banks, insurers, public sector — $20M+/year consulting spend | Engage firms for strategic transformations | Replaces consulting engagements | Outcome-share on verified savings |
| **Internal-labor augmentation** | Target, Costco, Amazon, Apple, Walmart — build-internal culture with massive staff aug | Run programs internally with big offshore/onshore analyst teams | Augments internal teams; replaces staff-aug diagnostic/synthesis work | Platform licensing + per-program outcome share |
| **Hybrid** | Most mid-to-large enterprises | Mix: some consulting for bet-the-company, most internal | Both modes available — platform works across | Flexible structure |

**Critical insight:** all three personas do the *same* work on the platform. They run transformation programs, consume intelligence, track portfolios, produce deliverables. Only the commercial framing differs. Therefore the product itself — surfaces, vocabulary, interactions — should be persona-neutral.

---

## The rename: Engagements → Programs

### Why "Programs"

| Criterion | Engagements | Programs |
|---|---|---|
| Target-native? | No | Yes |
| Consulting-client-native? | Yes | Yes |
| Federal/public-sector-native? | Sometimes | Yes |
| Bank-native? | Yes | Yes |
| Implies scope + owner + outcome? | Yes | Yes |
| Implies seller-side transaction? | Yes (problem) | No (solved) |
| Verb-compatible? | Partially | Yes ("run a program") |
| Scales up and down? | Yes | Yes |

"Programs" is the boringest, most-universal, most-enterprise term available. Boring is the goal. Boring means every Fortune 500 already uses this word natively.

### Sub-categories (future — not v1)

If commercial flexibility later requires differentiation, Programs can have sub-types:

- **Transformation programs** — large, multi-month, outcome-based (what Engagement means today)
- **Studies** — smaller, diagnostic-only, "we just need the analysis"
- **Reviews** — recurring governance cadence (quarterly AI review, vendor review)

All v1 programs default to "transformation program" type. Sub-typing is additive later.

### Cascade effects of the rename

| Area | Change needed |
|---|---|
| URL structure | `/engagements/*` → `/programs/*` with 301 redirects from old paths |
| Database tables | Keep internal table names (`engagements`, `engagement_topics`) — they work. No migration cost. Only UI-facing labels change. |
| UI copy | All "Engagement" strings → "Program" across console, nav, labels, buttons, empty states |
| Marketing home | Section 3 "Three products" updates: AbarVa Programs (not Engagements) |
| Investor deck | "AbarVa Engagement" → "AbarVa Programs" in Harvey anchor section |
| Agent vocabulary | Nexus refers to "this program" not "this engagement" in turns |
| API endpoints | Keep internal API naming as-is for now — costly migration. Add aliased endpoints if external clients matter later. |
| Docs + specs | Update references over time; not blocking |

**Estimated effort:** ~4-6h for UI-facing rename. Avoid touching database or API tables — the rename is a label change, not an architectural one.

---

## Per-surface reframing through the buyer lens

Four surfaces. For each: who actually uses it, what they do, what it must show, what "shine with intelligence" means concretely.

---

### Surface 1 · Programs (née Engagements)

**Who uses this daily:**
- At consulting-displacement customer: the Chief Transformation Officer or designated program lead, supported by their ops team
- At Target-class customer: the VP running a specific initiative (e.g., VP Digital Commerce, VP AI Platform), supported by their offshore analyst team
- At hybrid customer: mix of above

**What they do on this surface:**

Daily:
- Review what progressed overnight (Nexus turns, deliverable drafts, pattern matches, vendor intel)
- Respond to gate-approval asks
- Review and refine deliverables

Weekly:
- Sponsor check-in (Phase 3 interview moment)
- Cross-reference against other programs in portfolio
- Share status with exec team (auto-generated briefings)

Monthly:
- Gate reviews, outcome reconciliation, baseline reviews

**What the surface MUST show to earn its place:**

1. **A living program, not a chat UI.** The page has to read as *"there is active, structured, intelligent work happening in this program"* not *"here's where I type at an LLM."* That means dense surrounding context: active patterns, assigned topics, peer decisions, contradictions, library references, deliverable progress — all visible in the same viewport as the conversation.

2. **Intelligence woven through every turn.** When the user sends a message, Nexus's response shouldn't feel like a chat reply. It should feel like a briefing — with source citations, referenced patterns, cross-client comparisons, confidence levels, next-step suggestions. Pack D cognitive stages makes the reasoning visible. Source pills make provenance visible. Zone 2 active context panel shows what the platform is thinking about alongside what the user is saying.

3. **Progression, not ping-pong.** A program has phases, gates, milestones. The page must show *where in the program we are, what's next, what's blocking, what's complete*. Phase progress bar with gate markers is the visual anchor.

4. **Outcome visibility.** Every program has value at stake, baseline locked, MTD progress against that baseline. These numbers should be in the meta-strip at top, always visible. The program is not about the dialogue — it's about the outcome the dialogue drives toward.

**What "shine with intelligence" means concretely here:**

Every pixel on this page is doing knowledge work. The right rail isn't decoration — it's showing what the AI is actively reasoning about. The left conversation isn't a chatbot — it's the surface-layer of a 4-layer intelligence system. The top meta-strip isn't breadcrumbs — it's outcome accountability made visible. The bottom phase bar isn't navigation — it's progress through structured work.

When Prat scans this page for 30 seconds, he should count 8-10 things happening simultaneously and conclude: *"this is a product that knows more about what we're trying to do than most of my team would after 3 weeks of ramp-up."*

---

### Surface 2 · Intelligence

**Who uses this:**
- Everyone in the program, across all personas
- Primary power users: the analysts and strategists (at consulting-displacement customer) or the VP + team leads (at Target-class customer)

**What they do on this surface:**

Daily:
- Ask questions — "What's the typical M365 Copilot adoption at Fortune 50 scale?" / "How have other healthcare IDNs handled AI governance?" / "Compare Abridge vs Nuance DAX"
- Browse the library for relevant patterns, vendors, regulations, research
- Cite entries in program work

Weekly:
- Deep-dive research sessions pre-gate
- Competitive intelligence synthesis for exec briefings

**What the surface MUST show to earn its place:**

1. **Search-first feel.** Target Trend Brain, Google, Perplexity — Prat's reflex when he hits a new tool is to search. The Ask Intelligence bar must be the dominant surface, not a sidebar.

2. **Comprehensive, honest library.** Library catalog that's actually complete across 8 categories (Topic, Pattern, Vendor, Regulation, Framework, Benchmark, Research, News). Each entry rich with meta: source, published date, industry tags, usage count across programs. Honest empty states when data is thin.

3. **Citation provenance.** Every Ask Intelligence answer cites sources with clickable pills. No black-box responses.

4. **Curated intelligence, not just indexed data.** The library should feel like a senior consultant's bookshelf, curated with taste — not a dump of everything ever ingested. "Featured" shelf at top surfaces recent/important entries.

**What "shine with intelligence" means concretely here:**

This is the surface where AbarVa's compounding moat is most visible. Every month, the library gets richer. Every program contributes patterns back into it. When Prat queries "how did other IDNs handle AI governance" — the answer he gets should reflect synthesis across dozens of prior programs that touched this, weighted by relevance, cited to specific research. If the answer reads like it came from general LLM knowledge, we lost him. If it reads like it came from a curated, program-backed knowledge system — we have him.

Concretely this means Ask Intelligence, at this point, needs real data under it. Pack B Tier-1 ingestion needs to have run. Without that, Ask IQ is running on fumes and Prat will see through it immediately.

---

### Surface 3 · Control Tower

**Who uses this:**
- The CIO/CPO/CFO — the portfolio-owner, the person accountable for the *whole* AI/transformation spend
- At Target-class customer: Prat himself would live here
- At consulting-displacement customer: CIO + CFO jointly
- This is the **executive-level surface** — different viewing altitude than Programs

**What they do on this surface:**

Monthly, at least:
- Review the whole portfolio — everything AbarVa-delivered AND everything they bought from vendors directly (Copilot, Einstein, ServiceNow agents, etc.)
- Catch contradictions — spend without adoption, adoption without value, value without baseline, risk without governance
- Trigger actions — convert a contradiction into a program, cancel a failing initiative, escalate a governance gap

Quarterly:
- Board-ready portfolio view
- Budget defensibility — "here's every dollar of AI spend, here's what it returned, here's where we're cutting"

Daily (for power users):
- New shadow AI detections
- Trend changes in adoption/cost/value trajectories

**What the surface MUST show to earn its place:**

1. **Portfolio, not program.** This is the view across everything, not inside one program. Client selector at top (for Maestros operating across clients), 5-lens summary tiles at a glance.

2. **Contradictions as the center beam.** The contradiction feed is what makes Tower a product, not a dashboard. Every item has dollar impact, ownership, severity, and a "Trigger program" button. This is the loop back to Surface 1.

3. **Cost vs value trajectory.** The board-level question — "what are we getting for AI spend?" — answered visually. Line chart showing cost and value over time. Divergence or convergence visible at a glance.

4. **Shadow AI discovery.** What you can't see. Detection from Zscaler, Netskope, expense anomaly. Categorized by risk. This is where Tower earns its "we see what vendors don't tell you" positioning.

**What "shine with intelligence" means concretely here:**

Tower earns the CIO's trust when it surfaces something their team missed. The Abridge + Nuance DAX overlap. The $182K/mo Copilot waste. The shadow Midjourney deployment in marketing. Each one of these has to feel like "AbarVa found something for me that I wouldn't have found." That's the product.

If Tower looks like yet another AI analytics dashboard — it fails. Every Fortune 500 CIO has seen a dozen of those. The differentiator is the contradiction engine: finding misalignments across dimensions (cost vs adoption, value vs baseline, risk vs governance) that vendor dashboards can't catch because vendor dashboards only track themselves.

---

### Surface 4 · Platform

**Who uses this:**
- Internal AbarVa team (Maestros) setting up clients
- Client admins managing data sources, users, integrations
- **NOT a primary user surface.** This is the "plumbing."

**What they do on this surface:**

- Configure data sources (upload files, set up API integrations, manage ingestion schedules)
- Manage users (add team members, assign roles, set permissions)
- Monitor platform health (ingestion runs, API usage, model costs, system status)
- Administer settings (client metadata, governance policies, audit logs)

**What the surface MUST show to earn its place:**

1. **Coverage visibility.** At a glance, is the data layer healthy? Tier-1 integrations connected? Last ingestion run successful? How much client data has AbarVa indexed?

2. **User hygiene.** Who has access to what? Recent activity? Orphaned accounts?

3. **Cost transparency.** LLM consumption trajectory. Not hidden — visible, so the admin can see that AbarVa isn't burning money silently.

4. **Boring competence.** This surface should feel like a well-run admin panel. Not exciting. Reassuring. Everything labeled clearly, logs accessible, operations succeed or fail visibly.

**What "shine with intelligence" means concretely here:**

Platform doesn't need to "shine" in the same way the other three do. It needs to *disappear* — to feel so obviously reliable that the user doesn't think about it. When Prat's security team or data team pokes at Platform, they should find it boring in the good way: clean RBAC, obvious audit trails, transparent metrics, no surprises.

The intelligence on this surface is architectural, not visual: role-scoped permissions enforce privacy boundaries at the data layer (the `public:*`, `client:<id>:*`, `engagement:<id>:*` namespaces). But that architecture is shown through the UI — not by explaining it verbosely, but by making it obviously work: sign in as a client_viewer, see only 3 nav items; sign in as admin, see 5; sign in as Maestro across 3 clients, see the client selector. The architecture is the UX.

---

## The strategic frame

AbarVa is **infrastructure for enterprise transformation work**. Neutral on whether that work was previously done by consulting firms, internal teams, offshore analysts, or a mix. The platform doesn't care. The surfaces are designed around what the work *is*, not who was doing it before.

- **Programs** — where transformation work gets structured and executed
- **Intelligence** — where transformation knowledge compounds across programs
- **Control Tower** — where portfolio-level transformation spend gets governed
- **Platform** — where the plumbing runs

This framing sells to Target and to healthcare IDNs and to banks and to hybrids. Same product, same positioning, different commercial contracts.

---

## Decision requested from Anand

1. **Approve the rename Engagements → Programs?** If yes, ship as a single UI-copy pass (~4-6h Codex work) — no database migrations, no API changes. URL redirects `/engagements/*` → `/programs/*`.

2. **Approve the buyer-neutral framing?** If yes, marketing home + investor page get a small revision pass to lead with "infrastructure for transformation work" framing, with the consulting-displacement and internal-labor-augmentation paths as dual value props, not a single message.

3. **Approve the per-surface reframing?** If yes, the density plan I drafted earlier gets rewritten through these lenses. Specifically:
   - Programs surface leads with program-scope meta + intelligence weaving (not chat-first)
   - Intelligence leads with search dominance + library as curated bookshelf
   - Tower leads with contradiction engine + cost/value trajectory + shadow AI
   - Platform leads with boring reliability + architectural privacy visibility

4. **Pick one surface to nail first before Prat?** My recommendation: **Programs**. It's the hero surface, the most time-spent, the one where the rename + reframe + density combine to make the biggest impact. Tower is a close second.

---

## What this does not require

- No database migrations
- No API rewrites  
- No fundamental architecture changes
- No rebuild of any product functionality

This is a **language and framing change** supported by **visual density work**. Everything we've built tonight and in prior sessions remains. The product didn't change; the story around it sharpened.

**If the rename is approved, this becomes one of the cheapest high-leverage changes you could make before Prat.** A single UI-copy pass + nav label update + investor page adjustment. Total ~6-8h Codex work. Unlocks 40-50% of the addressable market that bounces off consulting-firm language.
