# AbarVa · Page-by-Page Density Plan

**Date:** April 20, 2026
**Context:** Prat demo approaching. Current pages read "light / prototype" despite Pack J data being seeded. The build is functional but visually thin. Need page-by-page redesign toward **enterprise B2B density** — dense with information but not cluttered. Think Snowflake console, Datadog, Workday — not a landing page.
**Audience:** Anand (decide) + Claude Code (implement)
**Effort:** 3-4 days across ~10 surfaces

---

## Why density matters for Prat specifically

Prat Vemana's career signature is **running dense, high-scale consumer commerce products**. Target.com has hundreds of elements per page but feels considered, not cluttered. Target Trend Brain (his NRF 2026 launch) surfaces dense trend data with clear hierarchy. Home Depot.com, Kaiser consumer experience — all dense, all considered.

A sparse page reads as a prototype to his eye. Not because he's being unfair — because his pattern-matching for "ready product" is calibrated against interfaces that carry 3-5× more information per screen than ours currently do.

**This doesn't mean adding clutter.** It means:

- Every page has 4-8 components, not 1-2
- Every metric has context (trend, target, peer benchmark, attribution confidence)
- Every list has meta (who, when, scope, status, size, owner)
- Every action surface has recent-activity pulse
- Every card has multiple data points (~6-10) not 2-3

What separates density from clutter is **ruthless hierarchy**. Primary data gets visual weight (size, color, position). Secondary data gets subdued treatment. Tertiary data tucks into hover reveals or deep links. Nothing gets cut — it just gets ranked.

---

## Current state snapshot (verified today)

| Surface | Density read | Evidence |
|---|---|---|
| **Home** | Medium-decent | Alerts populated with real Pack J data, Ask IQ bar prominent. But "$0M tracked savings" + "$0M outcome fees" land as failure. |
| **Engagements list** | Thin | 4 data points per card (name · phase · sponsor · industry). No scope, progress, value, activity signal. |
| **Engagement console** | Unknown (page timing out in browser — likely heavy code but sparse render) | Need visual audit |
| **Control Tower** | Unknown | Need audit |
| **Intelligence Library** | Medium (after today's fix) | Vendor grouping now works; topics and patterns count TBD after L2 retrieval |
| **Marketing home** | Heavy — works well | Refresh shipped today with 4-layer architecture, agent atlas, deployment section |

**Honest read:** the marketing home is now significantly denser than several product pages. That's backwards. Prat will notice.

---

## Page-by-page plan

Each section follows the same structure:
- **Current state** — what's there now
- **Target state** — what it should become
- **Components to add** — specific UI additions
- **Data required** — what needs seeding to populate
- **Effort** — estimated Claude Code hours

Ordered by Prat demo criticality.

---

### 1 · Engagement Console (`/engage/[id]` or `/engagements/[id]`)

**This is the hero surface.** Prat spends the longest here. Must feel like the inside of a live consulting program, not a chat UI.

**Current state:** Based on code we know exists — conversation panel, patterns panel, peer decisions, chained patterns, deliverables card, topics link. Likely renders as a 2-column layout with chat dominating. Turns seeded (8-12 via today's Meridian work) but surrounding context may be thin.

**Target state:** A **4-zone console** that feels like mission control for a transformation program.

```
┌────────────────────────────────────────────────────────────────┐
│ ENGAGEMENT HEADER · dense meta-strip                           │
│ [Name · Phase Gate · Baseline Locked · Value at Stake · MTD]   │
├──────────────────────────────┬─────────────────────────────────┤
│ ZONE 1 · CONVERSATION (60%)  │ ZONE 2 · ACTIVE CONTEXT (40%)  │
│                              │ · VIP greeting (first-load)     │
│  Turn history                │ · Active patterns (Pack C)      │
│  Cognitive stages            │ · Assigned topics (Pack L)      │
│  Source pills                │ · Peer decisions                │
│  Ask input                   │ · Chained patterns              │
│                              │ · Contradictions surfaced       │
│                              │ · Recent library refs           │
├──────────────────────────────┴─────────────────────────────────┤
│ ZONE 3 · DELIVERABLES STRIP · horizontal scroll                │
│ [Brief · Diagnosis · Options · Business Case · Gate Pack ...]  │
├────────────────────────────────────────────────────────────────┤
│ ZONE 4 · PHASE PROGRESS + GATE STATUS                          │
│ [●━━━●━━○━━○━━○ Phase 2 · Design · gate approved Apr 17]       │
└────────────────────────────────────────────────────────────────┘
```

**Components to add:**

- **Engagement meta-strip** (top): name, phase with gate status, baseline amount ($ locked), value at stake, MTD spend against phase budget, last activity timestamp, sponsor initials badge. ~8 data elements in one horizontal strip.
- **Active contradictions panel** (Zone 2): 2-3 contradictions from Tower filtered to this engagement's client. "Abridge $340K/mo + Nuance DAX $138K/mo · regional overlap · no consolidation owner named."
- **Recent library references panel** (Zone 2): last 5 library entries Nexus cited in this engagement. Deep-links to library.
- **Deliverables strip** (Zone 3): horizontal scrollable row of deliverable cards. Each card: title, % complete, last-edited timestamp, assignee, gate-status badge. Click → deliverable detail. Currently probably just names in a list — needs to be visually rich.
- **Phase progress bar** (Zone 4): visual phase timeline with gate markers. Shows exactly where engagement sits. Gate history (approved Apr 17, etc.) visible.
- **Activity pulse** (could go in Zone 2 or header): last 5 events — turn, deliverable edit, pattern triggered, gate approved, baseline updated. Timestamps.

**Data required:**

- Turn history depth ≥15 turns per demo engagement (not just 8-12)
- 2-3 deliverables per engagement with % complete + version history
- Phase history with gate approvals logged
- Activity events (turns, edits, gates, pattern triggers) with timestamps
- Engagement meta — value at stake, baseline locked value, MTD spend

**Effort:** ~10-14h. This is the biggest surface.

---

### 2 · Control Tower main (`/tower`)

Second-most-touched surface. Must look like a cockpit, not a list.

**Current state:** Need visual audit. Known: contradictions firing on Pack J data per Claude Code Q2 work. Structure likely: contradictions feed + maybe 5 lens summaries.

**Target state:** **5-lens cockpit with contradiction feed as center beam.**

```
┌────────────────────────────────────────────────────────────────┐
│ TOWER · [Client selector: Meridian | First Capital | Apex]    │
├────┬────────┬────────┬────────┬────────┬───────────────────────┤
│ INV│ ADOPT  │ VALUE  │ RISK   │ COST   │ 5-LENS SUMMARY TILES  │
│ 42 │ 68%    │ $14.2M │ 8 gaps │ $9.5M/m│ (each drillable)      │
├────┴────────┴────────┴────────┴────────┴───────────────────────┤
│ ACTIVE CONTRADICTIONS · 12 · sorted by dollar impact           │
│                                                                  │
│ CRITICAL · $478K/mo · Abridge + Nuance DAX regional overlap...│
│ HIGH · $340K/mo · Copilot 32% adoption on 28K seats...        │
│ HIGH · $182K/mo · 3 personalization vendors, unclear attrib.. │
│ MED · $95K/mo · ServiceNow + Freshservice redundancy...       │
│ ... (infinite scroll)                                          │
├────────────────────────────────────────────────────────────────┤
│ TRAJECTORY CHART · Cost vs Value over 6 months                │
│ [sparkline + trendline showing divergence or convergence]     │
├────────────────────────────────────────────────────────────────┤
│ SHADOW AI DISCOVERY · 14 detected · sorted by risk            │
│ [list with source: Zscaler | Netskope | Expense feed]         │
└────────────────────────────────────────────────────────────────┘
```

**Components to add:**

- **5-lens summary tiles** (top row): Inventory count, Adoption %, Value tracked, Risk gaps, Monthly cost. Each tile is a clickable drill into its dedicated sub-page.
- **Contradiction feed** (center): 12+ entries, sorted by dollar impact, with severity color coding. Each entry: severity chip, monthly impact, 1-line summary, "Trigger engagement" button. Today's "so-what framing" work gets deployed here.
- **Cost/value trajectory chart**: line chart showing cost line and value line over 6 months. Divergence visible.
- **Shadow AI section**: 14 detected items, source of detection (Zscaler feed, expense anomaly, Netskope, etc.), risk rating.
- **Client selector**: dropdown to switch between Meridian / First Capital / Apex so Prat can navigate between them.

**Data required:**

- Pack J already provides inventory counts, shadow AI counts, vendor overlap data
- Need: 6-month trajectory data per client (synthetic monthly cost + value snapshots)
- Need: adoption % rollups per client
- Need: risk gap counts with categories (data classification, governance, vendor posture)

**Effort:** ~8-10h

---

### 3 · Engagements List (`/engagements`)

Thin today (4 data points per card). Needs significant upgrade.

**Current state verified today:** Cards show name · phase · sponsor · industry. Nothing else.

**Target state:** Each card becomes an **engagement summary artifact** with 10-12 data points.

```
┌────────────────────────────────────────────────────────────────┐
│ MERIDIAN ANALYTICS MODERNIZATION · HEALTHCARE_IDN              │
│ Phase 2 · Design · gate Apr 17 approved                       │
│ Sponsor: Sarah Chen, CIO · 9 hospitals · $14.2B revenue       │
│                                                                  │
│ ● VALUE AT STAKE $24M over 18mo · baseline locked Apr 3       │
│ ● 3 deliverables in draft · Business Case 80%                 │
│ ● 12 patterns active · 4 contradictions flagged               │
│ ● Last turn 2 hours ago · 47 turns total                      │
│ ● Next gate: Design approval · Apr 28                         │
│                                                                  │
│ [Continue engagement →]                                        │
└────────────────────────────────────────────────────────────────┘
```

**Components to add per card:**

- Value at stake (primary metric, Georgia large)
- Baseline locked date
- Deliverables count + top deliverable % complete
- Active patterns count + contradictions count
- Last activity timestamp + total turn count
- Next gate date
- Client meta (size, scale)
- Sponsor with title

**Effort:** ~4h

---

### 4 · Engagement Topics (`/engagements/[id]/topics`)

Just built tonight. Likely thin until v2 retrieval is tested.

**Target state:** Two-column layout — assigned topics (left, rich) + topic library (right, browsable).

**Components to add:**

- **Assigned topic cards** (left column): each topic has title, tagline, diagnostic question count + progress ("8 of 17 answered"), key patterns surfaced, last-activity timestamp, "Continue" CTA
- **Topic library** (right column): 12 topics grouped by industry (Healthcare, FinServ, Retail, General). Each tile: title, tagline, "Assign" button.
- **Topic detail modal** (on click): full diagnostic questions, vendor landscape, phase playbook, common contradictions, success signals, failure modes. This is the "senior consultant's workbook" surface.

**Data required:**

- Fill out JSONB fields on at least the 2-3 topics likely triggered in demo: AI Governance, Vendor Rationalization, Analytics Modernization. Empty JSONB is fine for the other 9.

**Effort:** ~5h

---

### 5 · Intelligence Library (`/intelligence/library`)

Vendor grouping fix shipping. Overall density needs review.

**Target state:** **Snowflake-marketplace-grade catalog.**

**Components to add:**

- **Hero search bar** (already there via Ask prompt — good)
- **Category facets with counts** (left rail): Topic · Pattern · Vendor · Regulation · Framework · Benchmark · Research · News
- **Featured shelf** (top): 6 curated tiles — "New Genome patterns this week," "Most-referenced vendors," "Recent research"
- **Main grid**: filtered by facet, each tile with: title, subtitle, source, published date, industry tags, engagement usage count ("Referenced in 3 engagements"). Cards should be information-rich — no bare names.
- **Detail modal on click**: full entry with source attribution, full content, related entries, engagements that referenced it.

**Effort:** ~6h (vendor fix already queued)

---

### 6 · Tower sub-pages (projects / staff-aug / tech-stack / volumetrics)

Four sub-surfaces under Tower. Each needs dense data view.

**Target state per sub-page:**

- **Tower/Projects**: full project table — name, vendor, phase, budget, spent, adoption %, value-attributed, risk score. ~40 rows (projects) per client.
- **Tower/Staff-aug**: headcount table — role, vendor (Accenture / TCS / Wipro / Infosys etc.), on/offshore ratio, $/month, skills coverage, utilization %. This specifically lands with Target's staff-aug story. **Critical for Prat**.
- **Tower/Tech-stack**: vendor inventory — by category (AI platforms · Data · Commerce · Productivity · Infra · Security). Overlap detection highlights.
- **Tower/Volumetrics**: usage trends — transactions, API calls, storage, user seats across all vendors. Monthly trajectory.

**Data required:** Pack J has most of this. Needs render fleshing out.

**Effort:** ~3h per sub-page = ~12h total. Staff-aug sub-page is highest priority for Prat — ship that first even if others stay lighter.

---

### 7 · Home (`/home`)

Medium-decent already. Two specific fixes:

**Current state:** Alerts + queue working well with real vendor names.

**Target state additions:**

- Replace `$0M tracked savings` with actual values — even mock data for demo is better than zero. Or reframe as "tracked savings year-to-date" with a target number.
- Replace `$0M outcome fees this quarter` similarly.
- Add **"Recent insights" panel** below alerts showing cross-client meta-patterns — "Healthcare engagements deploying ambient doc before governance maturity surface 3.2× more shadow AI." This is the emergent intelligence layer made visible.
- Add **"Activity feed" panel** (below queue) — last 10 platform events: turns, deliverables, gates, ingestion runs.

**Effort:** ~3h

---

### 8 · Engagement Deliverables (implicit page — surface inside engagement)

Currently probably a list of names. Should become a real deliverables workspace.

**Target state:** Deliverable detail view with:

- Title + type (Charter / Diagnosis / Options / Business Case / Gate Pack)
- Version history sidebar
- Main content area (renders the deliverable)
- Review rubric panel (right): quality score per dimension (rigor, specificity, financial modeling, peer benchmarking)
- Source citations inline
- "Regenerate with Nexus" action

**Data required:** 2-3 deliverables per demo engagement with real content drafted. This is substantive content work — ~2h per deliverable to write convincingly.

**Effort:** ~8h (UI + content)

---

### 9 · Intelligence Ask (`/intelligence/ask`)

Currently functional. Minor density additions.

**Target state additions:**

- **Suggested queries strip** below search bar: "What's the typical Copilot adoption at Fortune 50 scale?" · "Compare ambient documentation vendors" · "What are recent healthcare AI governance patterns?" — seeds user's thinking.
- **Recent queries** (user-scoped) — last 5 Ask IQ queries for continuity.
- **Related library entries** panel in answer view (right rail).

**Effort:** ~3h

---

### 10 · Intelligence Patterns (`/intelligence/patterns`)

Legacy pattern browser (relocated from /intelligence today).

**Target state:** Each pattern card shows code, title, trigger conditions, evidence templates, industry, engagement occurrences ("Matched 12 engagements, precedent-linked 4 times"), last-refined date. Currently probably thin.

**Effort:** ~3h

---

## Sample data seeding plan

Pack J covers client/use-case/contradiction layer. Demo needs more:

### Engagement depth (per demo engagement)

- **15+ turn history** with realistic dialogue (currently ~8-12). Turns that surface contradictions, ask diagnostic questions, reference patterns, cite library entries.
- **2-3 deliverables in draft** (Charter, Diagnosis, Business Case outline) with actual content — not empty shells
- **Gate history**: Phase 0 approved, Phase 1 approved, Phase 2 in review
- **Phase progress**: charter complete, diagnosis 80%, design in progress, execute not started, verify not started

### Cross-engagement

- **Activity event stream** — 30-50 events across engagements (turns, edits, gates, patterns, ingestion)
- **Insights (emergent patterns)** — 6-8 detected meta-patterns across engagements for the "Recent insights" panel

### Tower

- **6-month trajectory data** per client (synthetic cost + value monthly snapshots)
- **Staff-aug headcount breakdown** — ~40 roles per client, with vendor, on/offshore split, utilization. Critical for Prat.
- **Shadow AI discovery events** with source attribution (Zscaler, Netskope, expense feed, browser extension detection)

### Intelligence

- **Library entry counts** — ensure each category has 10+ entries (Topic, Pattern, Vendor, Regulation, Framework, Benchmark, Research)
- **Fill out JSONB on 3 key topics** (AI Governance, Vendor Rationalization, Analytics Modernization) with realistic vendor_landscape, phase_playbook, common_contradictions content

### Effort for data seeding

- Engagement depth: ~4h to write quality turn histories + deliverable drafts
- Cross-engagement: ~2h for event stream + insights
- Tower trajectories + staff-aug: ~3h
- Library fill-outs: ~2h
- **Total data seed work: ~11h**

---

## Design system guardrails (while adding density)

Density without clutter requires discipline:

1. **Typography scale**: use 3 sizes max per page — headline (Georgia 20-32px), body (13-14px), meta (11px mono). Don't invent intermediate sizes.
2. **Color hierarchy**: INK for primary, MUTE for secondary, severity colors (coral/amber/teal) reserved for specific signal types. No decorative color.
3. **Whitespace is content**: even at high density, keep 20-32px between logical groups. Density comes from information per component, not packing components tighter.
4. **Right-align numbers**: all $ amounts, percentages, counts right-aligned and monospaced. Reads as serious software.
5. **Consistent card anatomy**: every card = eyebrow label (mono, teal, uppercase) + title (body weight) + supporting data (subdued) + CTA. Same pattern across all pages.
6. **Cognitive load cap**: no more than 8 top-level sections per page. If you need more, use tabs or progressive disclosure.

---

## Recommended execution order

Given ~3-4 days before Prat and ~60h of scoped work:

**Day 1 (Monday morning)**
- Engagement Console redesign — 4-zone layout, meta strip, activity pulse (~10h)
- Home zero-metrics fix + recent insights panel (~3h)

**Day 2 (Monday afternoon / Tuesday morning)**
- Engagements list cards density pass (~4h)
- Tower main 5-lens cockpit (~8h)
- Tower/staff-aug sub-page (Prat-critical) (~3h)

**Day 3 (Tuesday afternoon)**
- Engagement Topics page density (~5h)
- Engagement Deliverables detail view (~6h)
- Data seeding — engagement turn histories, deliverable drafts (~6h)

**Day 4 (Wednesday / Prat-day-minus-1)**
- Intelligence Library featured shelf + detail modals (~4h)
- Intelligence Ask suggested queries + recent (~3h)
- Final data seeding pass + verification walkthrough (~4h)
- Micro-interactions pass (the supervised one Codex deferred) (~3h)

**Total:** ~59h = 3 full working days with parallel Claude Code + Codex tracks.

**Cuts if time runs short (in this order):**
1. Tower/projects, tech-stack, volumetrics sub-pages (keep staff-aug)
2. Intelligence Patterns redesign
3. Engagement Deliverables detail (keep list)
4. Library featured shelf (keep grid)

---

## What to tell Claude Code (and what to tell Codex)

**Claude Code tracks (backend + data + retrieval + page logic):**
- Engagement Console restructure + meta strip + activity pulse
- Home zero-metrics data resolution
- Engagements list card data assembly
- Tower main 5-lens aggregation queries
- Engagement Deliverables detail + generation pipeline
- All data seeding scripts (turn history, deliverables, trajectories, insights, shadow AI events, staff-aug)

**Codex tracks (pure frontend + visual + component):**
- Engagement meta-strip component
- Phase progress bar visual
- Deliverable card component
- Tower cockpit lens tiles
- Cost/value trajectory chart component (recharts)
- Staff-aug headcount table
- Library featured shelf component
- Ask suggested queries strip
- Micro-interactions pass (supervised)

**Parallelizable.** Claude Code on data assembly and page logic, Codex on components. Meet in the middle via typed props interfaces.

---

## Decision requested from Anand

1. **Confirm priority order** above, or re-sequence if you have a different demo flow in mind
2. **Confirm cut order** if time runs short
3. **Name 2-3 deliverables worth writing in full** for the demo engagement (Charter? Diagnosis? Business Case? Gate Pack?) — content lift is real, want to target the ones Prat will open
4. **Staff-aug page content** — confirm whether the vendor names should be real (Accenture/TCS/Wipro/Infosys showing as Meridian/First Capital/Apex vendors) or anonymized ("Fortune 50 IT services firm"). Real names hit harder but carry attribution risk

Once decided, I can write task briefs for Claude Code and Codex in the same work-queue format we've been using. Each brief points to a section of this plan with explicit acceptance criteria.

---

## Strategic frame

The marketing home is now denser than several product pages. That's the specific problem. A visitor who reads the marketing page and then logs in to the product should feel **continuous density escalation** — from the landing page to the engagement console, the information density should climb, not drop.

When Prat lands in an engagement, he should see more going on than any consulting deck he's ever been presented. That's the "whoa" moment where product beats consulting — not in the first 8 seconds of his login (the VIP greeting handles that), but in the 30-second scan of the engagement console when he realizes every pixel is doing work.

Build toward that. Cut what doesn't fit.
