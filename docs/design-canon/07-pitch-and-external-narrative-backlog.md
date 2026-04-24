# File 07 · Pitch and External Narrative Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Anand primary author; Claude Code implements investor page, Platform page, and external-facing surfaces
**References:** Files 01-06 — the product spec is the pitch foundation

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`.

**Applies:** Integrity disciplines from prior files. Nothing claimed externally that the product can't demonstrate.

---

## Section 1 · Premise

The product specification in Files 01-06 *is* the pitch. Twelve failure modes addressed by specific architectural mechanisms equals the structure. The pattern-driven knowledge layer as flywheel equals the moat. Four-zone segmentation with agent orchestration equals the product claim. Alternative workflow shapes equal the addressable-market claim.

This file translates the product spec into external communication. It specifies what gets said, to whom, in what sequence, with what honesty about current state, and through what channels.

Four audiences, each with their own framing:

- **Anthology Fund (Anthropic-adjacent venture)** — thesis fit, ecosystem alignment, model partnership optionality
- **Prat (Fortune 40 CIPO, design partner prospect)** — product substance, failure-mode prevention, design partner value
- **Other seed investors** — valuation framing, flywheel thesis, velocity signal
- **Design partner prospects beyond Prat** — product fit, collaboration model, deal mechanics

Plus the surfaces users see before they engage: Platform page (product overview), Investor page (investor-gated deeper look), Home page (top of funnel).

---

## Section 2 · The twelve-failure-mode pitch structure

### 2.1 · Why this is the structure

The pitch is inverted from "here's what we do" to "here's why AI programs fail, and here's how we prevent each failure." This framing earns attention because every buyer has lived the failures. It's diagnostic before it's promotional.

Structure for every conversation:

**Opening frame.** "AI programs are failing at a 70-85% rate across enterprise. The failures are predictable. Here are twelve specific reasons. Every program failure you've seen maps to one or more of them."

**The twelve.** Walk through (or summarize, depending on conversation depth):
1. Wrong use case selection
2. Data readiness gap
3. Insufficient C-suite and change leadership
4. Cross-functional misalignment on problem definition
5. Wrong solution architecture
6. Bad ROI or uncontrolled cost
7. Wrong human-agent operating model
8. No pattern-based pressure-testing
9. No ongoing value tracking
10. No visibility-driven action on drift
11. Wrong vendor or partner selection
12. No learning capture to compound

**The mechanism.** "AbarVa is the first product architected specifically to prevent each of these failures systematically, not incidentally." Then walk through the specific mechanisms (from File 01) for the failure modes that most resonate with the specific buyer.

**The moat.** "The mechanisms combine into a flywheel. Every program generates data that trains the patterns, the patterns make every subsequent program better, the knowledge layer compounds into specialized intelligence that neither a generic AI workflow tool nor a consulting firm can match."

**The velocity.** "We're at [current state] today with [specific capabilities demonstrable]. The twelve-month path takes us to [specific capabilities]. Here's the velocity signal: what changed between [previous touch] and now."

### 2.2 · Honest current-state representation

The pitch must be honest about what's built, what's in progress, what's on the roadmap. Overclaim kills seed fundability faster than underclaim.

For each failure mode, framing:

- **Strong today:** specific product capability demonstrable in the live product
- **In progress:** specific build underway, timeline visible
- **Design partner collaboration:** explicit invitation to co-build with a named prospect
- **Roadmap:** honest future-state, not overclaimed

File 01 is the audit source. Every claim in the pitch traces to a row in File 01.

### 2.3 · What the pitch doesn't do

Doesn't claim AI can replace consulting wholesale. The product does the work with AI plus on-call human expertise — this framing is more credible and more defensible.

Doesn't compare directly to named consulting firms (McKinsey, BCG, Bain). The product is differentiated by shape, not by "we beat McKinsey." Comparative framings are distracting.

Doesn't name actual clients. Demo tenants are composites. "Composite organization built from real-world data" wording exact.

Doesn't overclaim pattern library depth. Honest count of authored patterns, clear priority for which get built when, explicit framing of assembly methodology as the scaling mechanism.

---

## Section 3 · The flywheel and model-partnership framing

### 3.1 · The valuation argument

Three claims stack:

**Claim one: AbarVa as standalone product has a defensible business.** Fortune 500 enterprise AI program support. Outcome-as-a-service revenue model. Premium multiples over standard SaaS because contracts are multi-million, long-duration, difficult to displace once embedded.

**Claim two: AbarVa with pattern library has a compounding moat.** Every program refines patterns. Patterns refine every subsequent program. Organizations using AbarVa become systematically better at AI transformation than organizations that don't. This moat compounds with tenant count and program volume.

**Claim three: AbarVa with model-partnership has a category-defining position.** Structured interaction data at volume becomes training data for specialized AI models. Neither a model company (Anthropic, OpenAI) nor a workflow product alone can produce this data. The partnership creates proprietary capability for both parties.

The combination moves the valuation conversation from "good enterprise SaaS" ($100M-$1B territory) to "category-defining flywheel" ($10B+ territory).

### 3.2 · The analogy

Oracle and Cohere. Oracle is building industry-trained AI models with Cohere as partner because Oracle alone can't build the model layer and Cohere alone can't access Oracle's enterprise data. The combination creates something neither could alone.

AbarVa's analog: AbarVa alone can't economically train pattern-specialized models. Anthropic or OpenAI alone can't access structured transformation interaction data. The combination produces category-defining intelligence.

Harvey for legal also relevant: Harvey became valuable because it sits at the intersection of legal workflow data and AI capability, generating training signal no model company can produce alone. AbarVa sits at the equivalent intersection for enterprise transformation.

### 3.3 · How to introduce this framing

Early in investor conversations. Not as a concluding "vision slide" but as the reason the standalone product valuation isn't the right valuation to anchor on.

Explicit: "the standalone product is a good enterprise SaaS company. The flywheel with model partnership is a generational outcome. We're pricing and raising for the latter because that's what the architecture is built to enable, and we're demonstrating the data substrate accumulating today."

### 3.4 · What the demo must show to support this

The demo needs to visibly demonstrate:

- Interaction data accumulating in structured form (not just as logs; as training-ready structured events)
- Pattern refinement as a mechanism (even if most refinement is manual today, the pipeline is visible)
- Provenance chain end-to-end (claim → source; agent response → patterns cited → evidence referenced)
- Scale narrative explicit and sensible (four tenants today, 40 tenants year 1, 400 tenants year 3, then model-specialization economically viable)

Without this demonstrated in the demo, the flywheel framing becomes unsupported narrative. With it, the framing is defensible.

---

## Section 4 · Anthology-specific positioning

### 4.1 · Anthology's thesis (inferred)

Anthropic's Anthology Fund invests in AI-native companies that are strategically relevant to Anthropic's ecosystem. Investments typically signal either "this is a differentiated use case of Claude/frontier models" or "this is a workflow-layer opportunity that generates data differentiating Anthropic's models over time."

AbarVa fits the second thesis directly. The pitch to Anthology should lean into ecosystem alignment, not just standalone product quality.

### 4.2 · Anthology pitch emphasis

**Ecosystem alignment.** AbarVa is built on Claude. The architectural commitments (retrieval on every turn, pattern-driven composition, structured data generation) are specifically designed to leverage frontier-model capabilities that Claude provides uniquely well.

**Data generation.** Every AbarVa interaction produces structured data that no generic Claude API usage generates. Transformation programs have specific structure (phases, decisions, outcomes, attribution) that make their data uniquely valuable for training.

**Partnership optionality.** When data volume warrants, AbarVa is structurally prepared for a model-training partnership. The anonymization, provenance, curation discipline is built. The data substrate is pattern-scoped. The generation interface is model-agnostic. All architectural choices preserve this optionality.

**Differentiated use case.** Enterprise transformation is a high-stakes, high-value, historically under-served category for AI. Consulting firms are the status quo alternative. AbarVa represents a specific category opportunity that Anthropic doesn't compete in and benefits from seeing mature.

### 4.3 · Anthology-specific artifacts needed

**Investor page content** tailored to this framing. Gated access at `abarva.ai/investors?access=<token>`.

**Model partnership framework document** — specific proposal for how AbarVa would share data with Anthropic, what anonymization applies, what commercial structure would govern it, what training outcomes are plausible. This is thesis material, not transactional.

**Technical architecture deep-dive** — specifically showing how AbarVa's architecture preserves and enables model-specific optionality. Written for Anthropic's technical reviewers.

---

## Section 5 · Prat-specific positioning

### 5.1 · Prat's context (from memory)

Fortune 40 CIPO with $80M+ AI budget across portfolio. Deep skepticism earned from three AI-hype products in the last year that failed to deliver platform-level value. Values substance over polish. Editorial voice matters to him. Dismisses clutter fast. 15-minute attention window before deciding whether to send his team.

Already cultivated as design partner prospect.

### 5.2 · Prat pitch emphasis

**Design partner framing, not vendor selling.** The ask is co-build, not buy. Prat gets early access to a product being built specifically to address the failures he's personally experienced. He gets influence on roadmap. He gets the CIPO-council insights AbarVa is building (via his input).

**Fortune 40 composite tenant.** Prat sees that AbarVa is building for organizations his size explicitly. The composite Fortune 40 tenant demonstrates understanding of his scale, his AI estate complexity, his governance requirements.

**Tower as the first-impression differentiator.** His 15 minutes matters most in Tower. Substance of pressure cards, editorial lines, action affordances. The test is whether Tower earns three-minute first interest.

**Twelve failure modes as diagnostic.** Prat has lived most of them. Walking through them positions the conversation as "we're building a product that prevents the specific failures you've experienced" rather than "we're selling something."

**Velocity signal.** Prat has seen AbarVa before. What's changed between previous touch and now is a signal of build velocity. Showing meaningful progress in short cycles earns continued engagement.

### 5.3 · Design partner deal mechanics

**Commitment model:** $0 license fee for 12 months in exchange for design-partner engagement (structured feedback cycles, pilot program deployment, case study contribution with appropriate anonymization).

**Program commitment:** one real transformation program deployed through AbarVa in the engagement period. AbarVa maestro included.

**Case study rights:** AbarVa gets permission for composite case study (fully anonymized) after program completion. Prat's name and organization's name may be used as design partner with explicit approval per use.

**Board representation:** optional observer seat if valuable to both parties.

**Graduation to paid:** at 12-month mark, standard Tier 2 or Tier 3 pricing applies.

### 5.4 · What the Prat demo must show

The demo walk specifically designed for Prat:

- Tower first, with strong editorial pressure cards, action affordances working, cross-agent handoff via drawer
- Morrison as transformation program example (familiar CFO-oriented framing)
- Ambient as healthcare program example (cross-industry breadth)
- Twelve failure modes matrix as conversation anchor
- Model partnership framing as closing
- Ask: will you engage as design partner?

---

## Section 6 · Other seed investor positioning

### 6.1 · General seed investor pitch

For investors other than Anthology, lean on:

**Category definition.** "Enterprise AI transformation is the largest unaddressed category in enterprise AI. Consulting firms serve the top 1% but don't scale. Generic AI workflow tools don't solve the transformation-specific failures. AbarVa is the category creator for pattern-driven AI transformation."

**Moat mechanics.** The flywheel framing from Section 3. Pattern library plus data substrate plus model partnership optionality.

**Commercial model.** Outcome-as-a-service with premium multiples. Contract sizes $350K-$1.6M per engagement. Named tiers with human-layer inclusion. Unit economics compelling at scale.

**Founding velocity.** Founder left senior consulting role (domain credibility); prototype built demonstrated technical feasibility before founding; product shipped to production in 60 days from founding (velocity signal).

**Design partner traction.** Named design partner (Prat, once engaged) plus pipeline of similar prospects.

**$8M at $25M cap framing.** This valuation is anchored on the flywheel thesis, not the standalone product. For investors who want standalone-product-price, we're not the right fit.

### 6.2 · What differentiates seed pitch from Series A pitch

Seed pitch leans on vision and velocity. Series A pitch will lean on traction and unit economics.

Seed-appropriate claims: architectural thesis validated through design partner deployment; pattern library assembly methodology working; knowledge layer demonstrably preventing failure modes in demo programs.

Series A-appropriate claims: deployed at 10+ enterprise tenants; outcome attribution defensible; revenue at $5M+ ARR; pattern library at scale with cross-tenant learning flows measurable.

---

## Section 7 · Design partner prospect positioning

### 7.1 · Who beyond Prat

The initial design partner cohort (goal: 3-5 by seed close) should include:

- A Fortune 40-50 CIPO (Prat prototype)
- A healthcare system CIO/CMIO (Meridian prototype)
- A retail CFO or strategy officer (Apex prototype)
- A technology company AI platform VP (Dara prototype)

Each prototype corresponds to a composite tenant already built, so the design partner sees the product tailored to their organizational shape.

### 7.2 · Design partner conversation structure

**Opening:** "We're building a product that systematically addresses the twelve failure modes of enterprise AI programs. You've experienced most of them. We want to build with you, not sell to you."

**Middle:** Walk the relevant composite tenant, demonstrate twelve-mode matrix, show their industry-relevant use case pattern, surface the adjacent capabilities.

**Ask:** Design partner engagement on terms described in Section 5.3.

**Close:** Their specific value exchange — what they uniquely contribute (industry insight, specific use case patterns, feedback on high-stakes workflows) and what they uniquely get (early access, roadmap influence, strategic positioning in their industry).

### 7.3 · Deal size and terms

Design partner engagements are strategic, not commercial in year one. Structured as described in Section 5.3.

Graduation to paid contracts expected at 12-month mark with pricing tier appropriate to organization size.

Pipeline target: 5 design partner engagements by seed close, 10 by Series A.

---

## Section 8 · External-facing surface content

### 8.1 · Home page — `abarva.ai`

**Purpose:** Top of funnel. Positioned for qualified inbound. Not optimized for broad SEO; optimized for credibility when a CIO lands here after a referral.

**Key messages:**

- Hero: "Act on intelligence. Before the window closes." (existing tagline — tested and keep)
- Subhero: explicit framing of the category — enterprise AI transformation done by AI plus on-call human expertise, with pattern-driven intelligence
- Proof points: twelve failure modes addressed (brief summary)
- Design partner cohort (composite references with permission)
- Platform page CTA

**What not to put on Home:**
- Pricing (that's for qualified conversation)
- Detailed technical architecture (that's Platform page)
- Broad audience content (this is qualified audience only)

**Current state:** Exists with existing hero and tagline. Content refresh needed to align with twelve-mode framing.

**Status:** **PARTIAL**. Refresh priority P1.

### 8.2 · Platform page — `abarva.ai/platform`

**Purpose:** Product overview for qualified prospects. Answers "what does the product do and how does it work?"

**Structure:**

- Overview section: the four zones, the agent roster, the pattern library, the knowledge layer
- Twelve failure modes as product-capability map (condensed version of File 01 matrix for external audience)
- Architectural overview with the flywheel framing
- Current-state honesty (what's built, what's in progress, design partner opportunities)
- Demo request CTA

**Audience:** CIOs, CTOs, VPs of AI/data, senior transformation leaders qualified enough to understand the value proposition.

**Design discipline:** substance over marketing polish. The page should feel like it was written by someone who knows what they're talking about, not by a marketing agency.

**Current state:** Unclear. Likely placeholder or partial. Status: **PARTIAL or MISSING**.

### 8.3 · Investor page — `abarva.ai/investors?access=<token>`

**Purpose:** Gated deeper look for qualified investors. Access by token only.

**Structure:**

- Thesis: category definition, flywheel mechanics, model-partnership framing
- Product: architectural overview, the twelve failure modes, differentiated capabilities
- Current state: honest representation with velocity signals
- Market: Fortune 500 addressable, consulting alternative, pricing, unit economics
- Team: founder background, advisory relationships
- Round: $8M at $25M cap, use of funds, milestones, partnership aspirations
- Ask: partner meeting or check

**Current state:** Gated page exists per memory. Content may be partial. Status: **PARTIAL**.

### 8.4 · Gaps with priority

- [P0 demo-critical] Home page refreshed to twelve-mode framing aligned
- [P0 demo-critical] Platform page with substantive content matching File 04 design discipline
- [P0 demo-critical] Investor page content tailored to Anthology thesis and seed investor audience
- [P1 seed-critical] Design partner outreach materials (deck, structured conversation guide)
- [P1 seed-critical] Model partnership framework document for Anthropic conversations
- [P2 Series A] Series A positioning materials
- [P2 Series A] Customer-facing case studies (once deployments produce attested outcomes)

---

## Section 9 · Message discipline across channels

### 9.1 · Consistent claims

Whatever is said in the pitch must be demonstrable in the product (or explicitly flagged as roadmap). Every claim has a File 01 row or is honestly labeled as future-state.

### 9.2 · Composite language

All external references to tenants use "composite organization built from real-world data" language exactly. Never "our customer Meridian" or "Apex Retail, a client." Always composite.

### 9.3 · Pattern authorship disclaimer

External materials describing pattern library include the authorship disclaimer: patterns are authored from industry knowledge, not measured outcomes from deployed customers. Intellectual honesty earns credibility; overclaim destroys it.

### 9.4 · Velocity framing

External communications emphasize velocity — what's shipped, what's in flight, what's next. Founder-founder conversations, investor touches, design partner updates all lead with velocity as signal.

Weekly or bi-weekly cadence of update touches for active prospects.

### 9.5 · Avoid

- Direct comparison to McKinsey/BCG/Bain by name
- Claims of AI replacing consulting wholesale (instead: AI plus on-call human expertise)
- Overclaim on pattern library maturity
- Implication that demo programs are real deployments
- References to prior employer, CADE, or specific named organizations from Anand's consulting history (per memory guardrails)

---

## Section 10 · Channels and cadence

### 10.1 · Anthology Fund channel

Relationship building through Anthropic-adjacent network. Introductions via advisors. Formal pitch when initial thesis resonates.

Cadence: monthly touch pre-pitch, weekly during active evaluation.

### 10.2 · Other seed investors

Founder-to-founder warm intros. Angel introductions. Targeted direct outreach for specific thesis fit investors.

Cadence: monthly touch pre-pitch.

### 10.3 · Design partner prospects

Direct relationship (Prat already cultivated). Warm introductions for other prototypes. Industry-event engagement.

Cadence: weekly touch during active engagement period.

### 10.4 · Public surface

Home page, Platform page, Investor page (gated). Social presence minimal — this isn't a broad-audience product. LinkedIn updates from founder for velocity signaling.

### 10.5 · Press and analyst

Not in seed scope. Series A may warrant selective analyst engagement (Gartner AI transformation coverage).

---

## Section 11 · Current state summary

**Pitch structure:** Spine exists (twelve failure modes, flywheel framing, honest current-state). Needs formalization into pitch deck and structured collateral.

**Home page:** Exists with current hero; needs content refresh.

**Platform page:** Partial/missing. Requires substantive build aligned with product spec.

**Investor page:** Partial. Gated access exists; content needs tailoring.

**Design partner materials:** Missing. Structured outreach deck, conversation guide, deal terms document.

**Model partnership framework:** Missing. Document specifically for Anthropic audience.

**Public tagline:** Strong. "Act on intelligence. Before the window closes." Keeps.

---

## Section 12 · Priority sequencing

### P0 — Demo-critical

- Pitch deck structured around twelve failure modes
- Investor page content aligned with thesis
- Platform page substantive content
- Home page refresh
- Demo script tailored for each audience type

### P1 — Seed-critical

- Design partner outreach materials (deck + conversation guide + deal terms)
- Model partnership framework document
- Velocity update rhythm established (weekly investor touches, bi-weekly broader updates)
- Case study template for composite write-ups

### P2 — Series A prep

- Customer-facing case studies from attested deployments
- Series A positioning materials
- Selective analyst engagement
- Industry-event presence

---

## Section 13 · Acceptance criteria

**Pitch:**
- Twelve failure modes as backbone, specific mechanism per mode, honest current-state per mode
- Flywheel framing integrated
- Velocity signal strong and specific
- Audience-specific emphasis (Anthology, Prat-type, other seed investors, design partners)

**External surfaces:**
- Home, Platform, Investor pages all reflect same structural framing
- Substance-first, marketing-polish second
- Composite language disciplined throughout
- Pattern authorship disclaimer on any pattern-library external representation

**Design partner engagement:**
- 5 prospects in active conversation by seed close
- Prat engaged as design partner by seed close
- Deal terms standardized for replication

**Investor engagement:**
- Anthology engaged with thesis-aligned conversation
- 10+ seed investors contacted, 3-5 in active evaluation
- $8M at $25M cap positioned credibly

---

## Section 14 · Pre-decided items

- "Act on intelligence. Before the window closes." tagline stays
- Composite language non-negotiable
- Pattern authorship disclaimer non-negotiable
- No direct comparison to named consulting firms
- Flywheel framing leads valuation conversation
- Twelve failure modes lead every pitch
- Current state honest; overclaim prohibited
- Design partner model: $0 year one, $X/year after graduation

---

## Section 15 · One-line handoff

> Product spec (Files 01-06) is the pitch foundation. Twelve failure modes are the pitch structure. Flywheel and model-partnership framing drive valuation positioning. Anthology, Prat, other seed investors, design partner prospects each get audience-specific emphasis within consistent framing. Home, Platform, Investor pages refreshed to match. Velocity signal continuous. Apply integrity disciplines from prior files throughout.

---

*End of File 07 · Pitch and External Narrative Backlog.*

---

# All seven files complete — package summary

**Location:** `/mnt/user-data/outputs/`

1. `01-failure-mode-capability-matrix-backlog.md` — north star
2. `02-pattern-library-architecture-backlog.md` — three-tier pattern structure, assembly methodology
3. `03-knowledge-layer-architecture-backlog.md` — retrieval, feedback, provenance, SLM path
4. `04-four-zone-surface-design-backlog.md` — Tower, Admin, Programs, Intelligence
5. `05-workflow-mechanics-backlog.md` — state machine, upload, human layer, workshop mode
6. `06-alternative-workflow-shapes-backlog.md` — vendor selection, procurement, crisis, regulatory, M&A
7. `07-pitch-and-external-narrative-backlog.md` — twelve modes as pitch spine, flywheel, audience framing

**Total:** approximately 60,000 words of comprehensive product specification.

**Dispatch protocol:** when Claude Code and Codex finish current work, hand off all seven files as a package. Priority sequencing within each file guides execution order. File 01 is the north star; all others reference it.

**Pre-decided items:** scattered across files in pre-decided sections. Agents don't re-ask settled decisions.

**Agent Autonomy Charter:** applies throughout. Decide and move on Tier 1/2, flag and proceed on Tier 3, stop only on Tier 4.
