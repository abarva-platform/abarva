# AbarVa · Fix Spec v3 · Pre-Prat Quality and Depth Pass

**Context: post-verification run on preview branch. Anand pass identified ~21 issues spanning width/fonts, content depth, dead links, homepage structure, and authenticated home concept. This spec narrows to the 7 items that ship within 48 hours. Everything else is captured in a post-Prat backlog section and parked.**

**For Codex · highest-leverage quality pass before Prat demo**

---

## The one design principle driving all content work

**The Vendor Knowledge Layer is the design DNA.** The Analytics Modernization pattern page works because it has a Vendor Landscape section naming specific tools (Tableau, Fivetran, Snowflake Cortex, Claude Enterprise) grouped by architectural layer. The Change Management topic page fails because it's thin generic bullet points.

**Every content surface (patterns, topics, research, benchmarks) must show the same three signals:**

1. Current knowledge (2026-specific, not 2022-stale references)
2. Architectural opinion (a structural point of view, not neutral framing)
3. Specificity (named tools/practitioners/research, not categorical framing)

Apply this principle to every content surface we ship. If a page doesn't signal all three, it's not done.

---

## Priority summary · 48-hour critical path

| # | Item | Est. hours | Demo impact |
|---|---|---|---|
| 1 | Page width + font size global pass | 1-2 | Universal visibility fix |
| 2 | Homepage metrics restructure | 2-3 | First impression |
| 3 | One pattern page to full depth (Shadow AI or Owned Brand Margin) | 4-6 | Proof of depth |
| 4 | One topic page to full depth (Change Management for AI) | 3-4 | Proof of depth |
| 5 | Dead link audit (ship-or-hide) | 1-2 | Trust puncture prevention |
| 6 | Deliverables content generation (carryover from v2) | 4-6 | Substance at Phase 1 |
| 7 | Authenticated home baseline | 4-6 | Tenant command signal |

**Total estimated: 19-29 hours.** Realistic for Codex at full velocity in 36-hour window.

---

## Fix #1 · Page width and font size global pass

### Observed problem

Program detail page (and other surfaces) render at full viewport width on laptop screens. Text is too small to read comfortably on 13-15" displays. Classic "built on large monitor, viewed on laptop" problem.

### Fix approach

1. Introduce global max-width constraint on primary content areas: `max-width: 1280px; margin: 0 auto;` — content centers on wide viewports, uses full width below
2. Bump base font size: 14px → 16px in root CSS variable
3. Specifically raise:
   - Body/conversation text: 14 → 16px
   - Small labels (JetBrains Mono eyebrows): 11 → 12px
   - Counter values already OK (Georgia display)
   - Side panel text (sponsor card, active patterns, peer decisions): currently too small → raise by 1-2px
4. Test breakpoints: 1280px (13" laptop), 1440px (14" MacBook Pro), 1920px (monitor), 2560px (27" 5K)

### Validation test

- Open program detail page on 1440px viewport
- All text readable without zoom
- Content feels centered/intentional, not "stretched to fill"
- Same check at 1280px, 1920px, 2560px

### Exception note

Some surfaces genuinely want edge-to-edge — the 5-phase visualization bar on program detail, data-dense tables. These can opt out of the max-width via a `.full-bleed` class. Most content shouldn't.

---

## Fix #2 · Homepage metrics restructure

### Observed problem

Four stat cards ($800B, 73%, 0%, 48h) render as equal-weight floating cards on the right of the hero. They mix problem stats ($800B, 73%) with product commitments (0%, 48h) — categorically different claims presented identically. Reads as "four random numbers" rather than a narrative.

### Fix approach

Restructure the homepage around three narrative sections:

**Section 1 · Hero (keep as is)**
- "Act on intelligence. Before the window closes."
- Subhead describing the platform

**Section 2 · The problem we're solving** (new treatment)
- Eyebrow: THE TRANSFORMATION VALUE GAP
- Two large numbers side by side: $800B and 73%
- Narrative paragraph connecting them: "$800B of global consulting spend. 73% of enterprise AI programs with no verified ROI. The transformation market is structurally broken — the value leaks between strategy, programs, and outcomes."

**Section 3 · Own it · Build it · Keep it** (insert here — already designed)
- Three-beat journey narrative from Wave 3 spec
- Visual from the Own/Build/Keep diagram

**Section 4 · How it works · three planes**
- (existing — keep)

**Section 5 · The commitments we make** (new treatment for 0%, 48h)
- Eyebrow: OUR COMMITMENT
- Two stat cards: 0% fee before verified outcomes · 48h to first situation intelligence
- Narrative paragraph: "No retainer. No hourly. No vaporware diagnostics. You see intelligence in 48 hours. You pay only after verified outcomes."

**Section 6 · Intelligence Suite (9 products) — keep**

**Section 7 · Transformation Genome moat — keep**

**Section 8 · Closing CTA — keep**

### Why this works

- Separates problem stats from product claims (they're different rhetorical moves)
- Gives each number its own weight and narrative connection
- Own it / Build it / Keep it becomes the spine
- Homepage reads like editorial argument, not dashboard

### Copy ownership

Anand writes final copy for sections 2, 3, 5 in his voice. Codex implements structure and placeholders; copy swap happens after.

---

## Fix #3 · One pattern page to full depth

### Observed problem

Current pattern pages vary wildly in depth. Analytics Modernization has a Vendor Landscape section that signals real knowledge. Change Management and others are thin — single-word triggers, pattern references shown only as codes, no evidence base.

### Fix approach

Pick **Shadow AI Governance** (cross-sector, demo-relevant) OR **Owned Brand Margin** (retail, aligned with Prat's industry) — whichever Codex can populate fastest with real content.

Build to this full structure:

**Section 1 · Header**
- Pattern name (Georgia 32px)
- Pattern ID + maturity badge (e.g., "F008 · Maturity v3")
- Sector × Function × Objective tags (e.g., "CROSS-SECTOR · FRONT OFFICE · PROTECT")
- One-sentence problem description

**Section 2 · The failure mode**
- 2-3 paragraphs describing the specific failure this pattern names
- What it looks like when active in an organization
- Why it's persistent (what structural dynamics keep it in place)

**Section 3 · Typical triggers**
- 5-7 specific triggers (not single words — full descriptive phrases)
- Example for Shadow AI: "Business unit procures GenAI tools outside IT governance · Pilot-to-production migration without security review · Vendor contracts bypassing master data agreements"

**Section 4 · Pattern signature (telemetry view)**
- What data tells you this pattern is active
- 3-5 observable signals with source type
- Example: "Cloud provider audit logs show >15 distinct AI vendor APIs · Procurement shows AI tool spend growing >50% YoY without central governance · HR security training completion drops on AI-specific modules"

**Section 5 · Vendor and capability landscape (the magic section)**

For Shadow AI, this means naming the actual vendor landscape:
- Detection tools: Palo Alto Panther, Wiz, Orca Security
- Governance platforms: Credo AI, Holistic AI, FairNow
- Policy engines: OneTrust, Drata, Vanta (where AI policy lives)
- Training/awareness: KnowBe4, SANS AI track, emerging AI-specific vendors

Grouped by architectural layer. Opinion expressed ("the AI-specific governance category is still emerging; most enterprises default to extending existing GRC").

For Owned Brand Margin, this would be:
- Pricing/elasticity: Revionics, Blue Yonder, PROS
- Trade promotion management: Accenture TPM, SAP TPM, proprietary
- Cost analytics: Coupa, Jaggaer, internal build
- Margin attribution: proprietary internal capability, emerging AI-native tools

**Section 6 · Diagnostic questions by phase**
- (existing structure)
- Keep format, ensure content depth matches Analytics Modernization

**Section 7 · Common contradictions**
- 3-5 contradictions this pattern surfaces
- Example: "Sponsor committed to AI-native transformation but refuses centralized procurement review · Board asking for AI ROI while tolerating decentralized tool sprawl"

**Section 8 · Historical instances (anonymized)**
- "Observed in 7 enterprises across the Transformation Genome"
- Sector distribution: retail (3), financial services (2), healthcare (1), utility (1)
- Outcomes: 4 resolved, 2 partial, 1 reversed
- Anonymized example vignettes (sector + scale + specifics, no names)

**Section 9 · Intervention menu with effectiveness**
- 3-5 intervention options
- Each: description, typical effectiveness (based on historical instances), time horizon, resource requirement
- Example intervention for Shadow AI: "AI tool marketplace with centralized procurement (85% effectiveness · 3-6 months · requires CIO + CFO sponsorship)"

**Section 10 · Failure modes**
- Known ways resolution fails
- Each with short description and typical frequency
- Example: "Governance-before-productivity stalls adoption · Central team becomes bottleneck · Exceptions process creates shadow IT 2.0"

**Section 11 · Evidence base**
- Research references (named: Gartner reports, McKinsey quarterly articles, MIT Sloan research)
- Frameworks this pattern extends or contradicts
- Seminal case studies (with citations where public)

**Section 12 · Related patterns and topics**
- Upstream patterns (what often precedes this)
- Downstream patterns (what often follows)
- Related topics from the topic library
- All as clickable links

**Section 13 · Maestro rubric (AbarVa IP layer)**
- What a Maestro probes for when this pattern is suspected
- Specific conversation starters and follow-up questions
- Red flags that confirm the pattern
- Signals that the pattern is resolving

### Validation test

- Navigate to the pattern detail page
- Every section populated with real content (no placeholder)
- Vendor Landscape section signals current 2026 knowledge
- Evidence base cites real sources
- Click-through to related patterns works
- A CXO reading this page thinks "these people know this space"

Pass criteria: page feels like a research report, not a summary card.

---

## Fix #4 · One topic page to full depth

### Observed problem

Change Management for AI topic page is thin (4 single-word triggers, 3 patterns shown as codes only, no evidence base, no practitioner naming).

### Fix approach

Pick **Change Management for AI**. Build to parallel structure as patterns but with topic-specific sections:

**Section 1 · Header**
- Topic name
- Maturity, diagnostic question count, linked pattern count (existing)

**Section 2 · The concept**
- 2-3 paragraphs explaining what this topic covers
- Why it matters specifically for AI programs (vs. generic change management)
- Historical arc (where AI change management differs from IT change management)

**Section 3 · Typical triggers**
- 5-7 specific, descriptive triggers (upgrade existing 4 single words)

**Section 4 · Conceptual landscape**
- Frameworks relevant to this topic (named: Kotter's 8-step, ADKAR, Prosci, Sarah Robb O'Hagan's approach)
- Which apply to AI specifically vs. require extension
- AbarVa's opinion on which work best for which contexts

**Section 5 · Practitioner landscape**
- Named practitioners known for work in this topic
- Research groups doing serious work here (MIT CSAIL, Stanford HAI, Wharton AI Initiative)
- Books and authoritative sources
- Emerging voices worth tracking

**Section 6 · Diagnostic questions by phase**
- (existing structure — upgrade content depth)

**Section 7 · Common contradictions**
- (upgrade existing)

**Section 8 · Key patterns linked**
- Not just F001/F012/F014 codes — each pattern rendered as a card with name and one-line description, clickable to pattern detail

**Section 9 · Evidence base**
- Research citations
- Case studies (named where public, anonymized from Genome where not)
- Empirical data on change management effectiveness in AI contexts

**Section 10 · Maestro rubric**
- Same AbarVa IP layer as patterns

### Validation test

- Navigate to the topic detail page
- All sections populated
- Conceptual landscape and practitioner landscape signal real thought leadership
- Linked patterns render as cards with descriptions, not just codes

Pass criteria: page reads like a serious briefing on the topic, not a checklist.

---

## Fix #5 · Dead link audit · ship or hide

### Observed problem

Multiple nav links and inline references go to 404:
- Benchmarks
- Research
- `/intelligence/briefing`
- `/intelligence/people`
- "Platform" nav link
- "Read Meridian case" homepage CTA
- Others TBD

### Fix approach

Audit every nav link, inline CTA, and referenced URL across the platform. For each:

**Option A · Ship baseline content**
- If the surface can have minimal-but-real content in <2 hours, ship it

**Option B · Hide from nav**
- If shipping content would take >2 hours, remove from nav until it exists
- Leave URL route in place (returns 404 with helpful message if visited directly)

**Option C · Redirect to nearest live surface**
- For CTAs that can redirect to an existing page (e.g., "Read Meridian case" → Meridian tenant home), do that

### Validation test

- Navigate every nav item from every page
- Click every inline CTA
- No 404s reachable from user navigation
- Surfaces that 404 are hidden from nav

Pass criteria: no user-discoverable 404 anywhere on the happy path.

---

## Fix #6 · Deliverables content generation (carryover)

### Observed problem

Deliverables counter shows numbers (1-4 on seeded programs) but clicking Deliverables shows empty shell. Charter page renders blank.

### Fix approach

Already specced in Fix Spec v2 item #6. Reiteration here because it's critical path and wasn't resolved in v2 ship:

**At Phase 0 gate-pass, generate:**
1. **Charter** — structured document: program name, sponsor/co-sponsor, framing (archetype/objective/function), scope in/out, gate conditions, first deliverables for Phase 1
2. **Hypothesis tree skeleton** — root node (the problem), empty branches for root causes (populate during Phase 1)
3. **Workstream charter drafts** — one per diagnostic cut the Nexus identified in Phase 0

**During Phase 1 turns, auto-populate:**
4. **Hypothesis tree branches** — root causes discussed populate as tree nodes with evidence links
5. **Stakeholder map** — interview targets with role, what to ask each, status
6. **Data requests log** — what data needed, from whom, status (requested/received/analyzed)
7. **Diagnostic findings draft** — live document updated as findings emerge

**At Phase 1 exit:**
8. **Phase 1 report** — synthesis of findings, evidence, hypothesis validation status

**Each deliverable has:**
- Name
- Status (draft, in review, approved)
- Owner (agent or executive)
- Last updated timestamp
- Structured content (markdown or JSON rendered)
- Evidence links to source turns/data
- Clickable to full artifact view

### Validation test

- Complete Phase 0 intake on any tenant
- Click Deliverables
- See Charter, Hypothesis Tree, Workstream Charters, all populated
- After 10 Phase 1 turns, return to Deliverables
- See Hypothesis Tree with populated branches, Stakeholder Map started, Data Requests logged

Pass criteria: Deliverables surface reads as real work product, not placeholder.

---

## Fix #7 · Authenticated home baseline

### Observed problem

When a user logs into a tenant, the home surface doesn't immediately convey "this is your enterprise, rendered." There's no at-a-glance sense of tenant data breadth or navigation affordance to the full inventory.

### Fix approach (baseline — not full dashboard)

This is a minimum-viable version of a larger Tenant Intelligence Command Center concept (see Post-Prat Backlog section for the full vision).

**Baseline structure:**

**Section 1 · Greeting (existing)**
- Keep voice-shaped greeting with user name

**Section 2 · Tenant data breadth row (NEW)**
A horizontal row of 6-8 chips, each representing a data domain:
- Programs · [count]
- Executives · [count]
- Strategic Priorities · [count]
- KPIs · [count]
- IT Systems · [count]
- Financial Lines · [rough sum]
- Customers · [count or tier]
- Connected Sources · [count]

Each chip:
- Label (JetBrains Mono 11px teal uppercase)
- Count (Georgia 20-22px white)
- One-line context (DM Sans 12px warm off-white)
- Clickable → navigates to that domain's index/detail page

This row signals "AbarVa has modeled your enterprise at breadth" without needing to display raw data.

**Section 3 · Briefing (existing)**
- Keep current briefing composition

**Section 4 · Portfolio glance (existing)**
- Keep current structure

**Section 5 · Stakeholder lens (existing)**
- Keep current structure

**Section 6 · Footer with access governance indicator (NEW)**
- Small text: "Your intelligence layer is accessible to [N] authorized Maestros · [last updated timestamp]"
- Click → admin view of access governance (see post-Prat for full flow)

### Validation test

- Log into Apex Retail as any user
- Tenant data breadth row renders with real counts
- Each chip links to a meaningful destination (existing page or placeholder with "coming soon" message)
- Access governance indicator renders

Pass criteria: first impression when logging in signals "this is your enterprise" within 2 seconds of page load.

### Demo note

For Prat demo specifically, the counts matter. Make sure Apex Retail has realistic numbers:
- 15-20 programs across phases
- 8-12 executives with profiles
- 6-10 strategic priorities
- 35-50 KPIs
- 120-200 IT systems (from tech stack catalog)
- $2-3B financial scale rendered as approximation
- 25M-35M customers (realistic for Target-scale retailer)
- 50-100 connected data sources

These seed values should be verified before demo.

---

## Post-Prat backlog · captured and parked

These items from the April 21 quality pass are real and important but cannot ship in 48 hours. Capture them as post-Prat scope:

### Content depth expansion

1. Full pattern library depth · 19 remaining patterns to Vendor-Knowledge-Layer depth (estimated: 40-60 hours, ~2-3 packs per week post-seed)
2. Full topic library depth · remaining topics to parallel depth (estimated: 20-30 hours)
3. Research page · editorial depth with published analyses (estimated: 30-40 hours ongoing)
4. Benchmark engine · cross-tenant anonymized benchmark data (estimated: 60-80 hours, depends on cross-tenant data pipeline)
5. Solutions library page (C3) · industry × function × objective matrix (estimated: 20-30 hours)

### Tenant Intelligence Command Center (full)

6. Full IT tech stack dashboard · filterable, drill-down, segment lighting (estimated: 40-60 hours)
7. Financial inventory dashboard · budget allocation by segment, trend visualization (estimated: 40-60 hours)
8. KPI catalog surface · "what's available" with metadata, access governance, freshness (estimated: 30-40 hours)
9. Customer segment inventory · who, how many, tier, activity (estimated: 30-40 hours)
10. Vendor/partner inventory · same treatment as tech stack (estimated: 30-40 hours)
11. Policy and compliance inventory · what's in place, what's in review (estimated: 30-40 hours)

### Access governance

12. Admin access governance flow · approve/deny maestro access to programs (estimated: 40-60 hours)
13. Audit log of data access · who viewed what, when (estimated: 20-30 hours)
14. Role-based access controls · Maestro, Sponsor, Observer, Admin roles (estimated: 30-40 hours)
15. Data masking for unauthorized viewers · see metadata without raw values (estimated: 40-60 hours)

### Platform features

16. Platform page tech stack catalog expansion · budget allocation, vendor contracts, renewal dates (estimated: 30-40 hours)
17. Client data submenu navigation · breadth-first IA for tenant data (estimated: 30-40 hours)
18. Cross-reference layer · "this pattern shows up in 3 of your programs" surfacing (estimated: 20-30 hours)

**Total post-Prat backlog: 530-710 hours.** Represents ~4-6 months of focused engineering at full velocity. Not all demo-critical. Sequenced post-seed based on design partner feedback.

---

## What Anand owns (non-delegable)

1. Copy for homepage sections 2, 3, 5 (restructured layout per Fix #2)
2. Pattern selection: Shadow AI vs. Owned Brand Margin for Fix #3
3. Opinion statements in pattern/topic content (the "AbarVa point of view" — only you have this)
4. Final approval on which dead links get shipped vs. hidden (Fix #5)

---

## Verification after ship

Claude-in-Chrome re-runs the same CXO-persona test with these additional checks:

- [ ] Page width and fonts comfortable on 1440px viewport
- [ ] Homepage narrative flows across 8 sections coherently
- [ ] One pattern page renders at full depth with Vendor Landscape
- [ ] One topic page renders at full depth with Conceptual and Practitioner landscapes
- [ ] No 404s reachable from nav
- [ ] Deliverables populated after Phase 0 and Phase 1
- [ ] Authenticated home shows tenant data breadth row

Pass all 7 = pre-Prat quality gate cleared.

---

**END FIX SPEC v3**

*7 items. 19-29 hours. 36-hour window. Vendor Knowledge Layer is the design DNA. Everything else captured in post-Prat backlog.*
