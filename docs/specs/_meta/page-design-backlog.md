# AbarVa Page Design Backlog

**The sequenced work queue for every page in the product.**

This document inventories every page across Intelligence, Programs, and Tower. Each page is tiered by priority, tagged with its surface and active agent, mapped to the components it uses, and cross-referenced to the spec that defines its behavior. This is what Codex pulls from when idle. This is what a future human designer works through.

Reads alongside:
- `abarva-design-system-spec.md` — canonical tokens and components
- `abarva-intelligence-design-spec.md`, `abarva-programs-design-spec.md`, `abarva-tower-design-spec.md` — surface specs
- `abarva-agent-architecture-spec.md` — agent behavior per surface

## Document structure

1. How to use this backlog
2. Tier definitions
3. Page inventory · complete list across 3 surfaces
4. Per-page detail cards · Tier 1 and Tier 2 pages fully specified
5. Sprint-sized work packages for Codex
6. Open questions and gaps

---

## 1. How to use this backlog

**For Codex / Claude Code / human designer:**

1. Pick the next page from the current active tier (Tier 1 during demo prep, Tier 2 after demo)
2. Read the page's detail card in Section 4
3. Read the cross-referenced spec sections it points to
4. Read the Design System spec sections relevant to the components listed
5. Produce the page (mockup for design review, then real implementation)
6. Check against the 6-area audit checklist in Design System spec Packet 5.6
7. Mark the page complete in this backlog

**For Anand:**

When you have capacity to review design work, pull the most recently completed pages and audit against the checklist. Redline. Feed back to builder. Repeat.

**For a future design lead:**

This backlog is the work queue and also the scaffolding for a full design system. Pages in higher tiers get polished first; later tiers wait for design partner feedback before locking.

---

## 2. Tier definitions

### Tier 1 · Demo-blocking
Must ship with working visual design before the Prat demo. Failure to ship = demo is not demo-worthy.

### Tier 2 · Design partner readiness
Required to have credible conversations with paying clients post-Prat. Ships in weeks 1-6 after demo.

### Tier 3 · Scale readiness
Needed to operate as a product beyond 3-5 clients. Ships in months 2-6 after demo.

### Tier 4 · Future state
Nice-to-have, specialized, low-frequency. Ships when prioritized by client demand.

---

## 3. Page inventory

### Intelligence surface (Sentinel)

| # | Page | Route | Tier | Surface Spec Ref | Status |
|---|---|---|---|---|---|
| I-1 | Intelligence home / 9-product grid | `/intelligence` | 2 | Intelligence Packet TBD | Designed partially |
| I-2 | Thread list | `/intelligence/threads` | 2 | Intelligence spec | Not designed |
| I-3 | Active thread view | `/intelligence/threads/:id` | 2 | Intelligence + Agent Architecture Packet 4 | Not designed |
| I-4 | Situation Intelligence output | `/intelligence/situation/:id` | 2 | Intelligence spec | Partially designed |
| I-5 | Cost Intelligence output | `/intelligence/cost/:id` | 2 | Intelligence spec | Partially designed |
| I-6 | Risk Intelligence output | `/intelligence/risk/:id` | 2 | Intelligence spec | Partially designed |
| I-7 | People Intelligence output | `/intelligence/people/:id` | 2 | Intelligence spec | Partially designed |
| I-8 | Organization Intelligence output | `/intelligence/organization/:id` | 2 | Intelligence spec | Not designed |
| I-9 | Market Intelligence output | `/intelligence/market/:id` | 2 | Intelligence spec | Not designed |
| I-10 | Technology Intelligence output | `/intelligence/technology/:id` | 2 | Intelligence spec | Not designed |
| I-11 | Time Intelligence output | `/intelligence/time/:id` | 3 | Intelligence spec | Not designed |
| I-12 | Value Intelligence output | `/intelligence/value/:id` | 2 | Intelligence spec | Not designed |
| I-13 | Research source detail | `/intelligence/sources/:id` | 3 | Intelligence spec | Not designed |
| I-14 | Evidence audit panel | N/A (component) | 3 | Agent Architecture Packet 4 | Not designed |
| I-15 | Thread-to-Program promotion UI | N/A (flow) | 2 | Agent Architecture Packet 6 | Not designed |

### Programs surface (Nexus)

| # | Page | Route | Tier | Surface Spec Ref | Status |
|---|---|---|---|---|---|
| P-1 | Program portfolio / list | `/programs` | 1 | Programs spec | Designed |
| P-2 | Program Phase 1 · Ideation | `/programs/:id/phase/1` | 1 | Programs spec | Designed |
| P-3 | Program Phase 2 · Validation | `/programs/:id/phase/2` | 2 | Programs spec | Not designed |
| P-4 | Program Phase 3 · Charter | `/programs/:id/phase/3` | 2 | Programs spec | Partially designed |
| P-5 | Program Phase 4 · Diagnosis | `/programs/:id/phase/4` | 2 | Programs spec | Partially designed |
| P-6 | Program Phase 5 · Design | `/programs/:id/phase/5` | 2 | Programs spec | Partially designed |
| P-7 | Program Phase 6 · Build/Deploy | `/programs/:id/phase/6` | 2 | Programs spec | Not designed |
| P-8 | Program Phase 7 · Verify | `/programs/:id/phase/7` | 2 | Programs spec | Not designed |
| P-9 | Artifact workspace (editor) | `/programs/:id/artifact/:artifact` | 2 | Programs spec | Not designed |
| P-10 | Decision log | N/A (right-rail component) | 2 | Programs + Agent Architecture Packet 3 | Not designed |
| P-11 | Program team roster | `/programs/:id/team` | 2 | Programs spec | Partially designed |
| P-12 | Gate criteria view | N/A (phase detail tab) | 2 | Programs spec | Not designed |
| P-13 | Phase 6 handoff ceremony | `/programs/:id/handoff` | 2 | Agent Architecture Packet 6 | Not designed |
| P-14 | Program archive / sunset | `/programs/archive` | 3 | Programs spec | Not designed |

### Tower surface (Atlas)

| # | Page | Route | Tier | Surface Spec Ref | Status |
|---|---|---|---|---|---|
| T-1 | Tower dashboard | `/tower` | 1 | Tower Packet 5-6 | In flight (Codex mockup) |
| T-2 | Signal detail panel | N/A (slide-in on T-1) | 1 | Tower Packet 6 | In flight (Codex mockup) |
| T-3 | Tower mobile CXO view | `/m/tower` | 1 | Tower Packet 7 | In flight (Codex mockup) |
| T-4 | Signals surface (full list) | `/tower/signals` | 2 | Tower spec | Not designed |
| T-5 | Single signal detail page | `/tower/signals/:id` | 2 | Tower Packet 6 | Not designed |
| T-6 | Pipeline Kanban | `/tower/pipeline` | 2 | Tower spec | Not designed |
| T-7 | Use case list (with Views) | `/tower/use-cases` | 2 | Tower Packet 10 | Not designed |
| T-8 | Use case detail (living record) | `/tower/use-cases/:id` | 2 | Tower Packet 10 | Not designed |
| T-9 | Adoption pillar drill-down | `/tower/pillars/adoption` | 2 | Tower Packet 6 | Partially specced |
| T-10 | Cost pillar drill-down | `/tower/pillars/cost` | 2 | Tower Packet 6 | Partially specced |
| T-11 | Inventory pillar drill-down | `/tower/pillars/inventory` | 2 | Tower spec | Not designed |
| T-12 | Value pillar drill-down | `/tower/pillars/value` | 2 | Tower spec | Not designed |
| T-13 | Risk pillar drill-down | `/tower/pillars/risk` | 2 | Tower spec | Not designed |
| T-14 | Data & Integrations | `/tower/data` | 3 | Tower Packet 8 | Not designed |
| T-15 | Uploads | `/tower/data/uploads` | 3 | Tower Packet 8 | Not designed |
| T-16 | Path 3 origination wizard | N/A (modal from T-1/T-2/T-5) | 1 | Tower Packet 12 | Needs design polish |
| T-17 | Attestation inbox (desktop) | `/tower/attestations` | 3 | Tower Packet 9 | Not designed |
| T-18 | Attestation inbox (mobile) | `/m/tower/attestations` | 3 | Tower Packet 7 | Not designed |
| T-19 | Cohort benchmark detail | `/tower/cohort/:metric` | 3 | Tower spec | Not designed |

### Cross-surface

| # | Page | Route | Tier | Spec Ref | Status |
|---|---|---|---|---|---|
| X-1 | AbarvaNav (top nav) | Persistent chrome | 1 | Design System Packet 2.9 | Designed |
| X-2 | Marketing home (unauthenticated) | `/` | 3 | — | Designed |
| X-3 | Sign-in / auth | `/auth/*` | 3 | — | Designed |
| X-4 | Settings · user profile | `/settings/profile` | 3 | — | Not designed |
| X-5 | Settings · workspace | `/settings/workspace` | 3 | — | Not designed |
| X-6 | Settings · integrations | `/settings/integrations` | 3 | Tower Packet 8 | Not designed |
| X-7 | Settings · tenancy management | `/settings/tenancy` | 4 | — | Not designed |
| X-8 | Admin · tenant switcher | N/A (nav component) | 1 | — | Designed |
| X-9 | Admin · founder cross-client view | `/admin/founder` | 4 | Tower Packet 4.7 | Not designed |
| X-10 | Error page (404, 500) | N/A | 3 | — | Not designed |
| X-11 | Onboarding flow | `/onboarding/*` | 3 | — | Not designed |

### Backlog totals

- **Intelligence:** 15 pages/components · 0 Tier 1, 11 Tier 2, 3 Tier 3, 1 Tier 4
- **Programs:** 14 pages/components · 2 Tier 1, 11 Tier 2, 1 Tier 3
- **Tower:** 19 pages/components · 4 Tier 1, 12 Tier 2, 3 Tier 3
- **Cross-surface:** 11 pages/components · 3 Tier 1, 6 Tier 3, 2 Tier 4

**Tier 1 (demo-blocking):** 9 pages · most in flight or designed. Gaps: T-16 (Path 3 wizard polish).

**Tier 2 (design partner readiness):** 40 pages · the substantial ongoing design workload.

**Tier 3 (scale readiness):** 13 pages · post-design-partner.

**Tier 4 (future state):** 3 pages · specialized.

---

## 4. Detailed page cards · Tier 1 and key Tier 2

### T-1 · Tower dashboard

**Route:** `/tower`  
**Tier:** 1 (demo-blocking)  
**Active agent:** Atlas (right rail)  
**Purpose:** CXO's single-screen view of portfolio state. The Prat demo opens here.

**Layout reference:** Tower spec Packet 5.3 · 7-zone dashboard grid

**Zones:**
1. Header · client name, date, key counts
2. Top signals strip · horizontal scroll of active signals
3. Pillar cards · 5 cards (Inventory, Adoption, Value, Risk, Cost)
4. Pipeline glance · compact Kanban preview
5. Cohort position · "you vs peers" visualization
6. Recent activity · what changed in last 24h
7. Atlas right rail · always visible 400px panel

**Components from Design System:**
- Card (default, status, metric variants)
- Badge (severity)
- Signal card (Tower-specific composite)
- Pillar card (Tower-specific composite)
- Agent chat panel (Atlas variant)
- Data visualization tokens

**Data rendered:** Apex Retail seed data (see reconciled seed spec). Shadow AI critical signal prominent.

**Acceptance criteria:**
- Renders all 7 zones at 1280px+
- Shadow AI signal visible and immediately understandable as critical
- All 5 pillars show Apex's real numbers
- Atlas rail opens with morning summary
- Click signal card → opens signal detail panel (T-2)
- Cohort position shows "Adoption 13pp below peers"

**Status:** In flight · Codex delivering mockup pass 1

---

### T-2 · Signal detail panel

**Route:** Slide-in from T-1 (400px right-side panel over dashboard)  
**Tier:** 1  
**Active agent:** Atlas (available for follow-up in rail)  
**Purpose:** Full context on a single signal, with Path 3 origination CTA.

**Layout reference:** Tower spec Packet 6 · Signal detail panel

**Anatomy:**
- Title bar · Signal name + severity badge + close X
- Context · one-line summary + detected timestamp
- Evidence section · contradicting data points, sources
- Cohort context · "retail peers n=7, you at 2.1× median"
- Recommended action · Path 3 CTA
- History · event log

**Components:**
- Slide-in panel
- Badge (severity)
- Evidence list (Intelligence-style pattern reused)
- Button (primary CTA)
- Timeline (small)

**Acceptance criteria:**
- Opens smoothly from T-1 signal click
- All evidence data points render
- "Originate Program" CTA is the visual anchor
- Close via X or Escape

**Status:** In flight · Codex mockup pass 1

---

### T-3 · Tower mobile CXO view

**Route:** `/m/tower`  
**Tier:** 1  
**Active agent:** Atlas (bottom dock)  
**Purpose:** Phone-native triage view for CXOs on the move.

**Layout reference:** Tower spec Packet 7

**Anatomy:**
- Header · client name + greeting
- Atlas morning summary card · "Good morning. Portfolio snapshot..."
- Signals carousel · horizontal scroll cards
- Pillar tiles · 2x3 grid (6 tiles, includes Tower overall)
- Atlas bottom dock · collapsed input, expand on tap

**Components:**
- Card (metric variant)
- Badge (severity)
- Agent chat panel (Atlas mobile variant)

**Acceptance criteria:**
- Renders on 375px viewport
- One-thumb navigation
- Atlas responds to 4 scripted patterns
- Bottom dock reachable without reaching

**Status:** In flight · Codex mockup pass 1

---

### T-16 · Path 3 origination wizard

**Route:** Modal from T-1, T-2, T-5  
**Tier:** 1  
**Active agent:** Atlas → Nexus transition  
**Purpose:** 3-step flow from signal to newly originated Program.

**Layout reference:** Tower spec Packet 12 · Path 3 flow

**Anatomy:**
- Wizard modal with 3-step progress indicator
- Step 1 · Confirm context (signal summary, impact, affected use cases)
- Step 2 · Review pre-populated charter (editable: name, problem, scope, metrics)
- Step 3 · Confirm and create (summary view + "Create Program" button)
- On submit: redirect to `/programs/:new-program-id/phase/1`

**Components:**
- Wizard modal
- Input, textarea
- Card (context summary)
- Button (primary, secondary)

**Acceptance criteria:**
- Progress indicator clear
- Step 1 content comes from signal data
- Step 2 charter pre-populated from Atlas handoff payload
- Step 3 shows summary + final confirm
- Success redirects to destination Program
- Signal status updates to ACTIONED

**Status:** Needs design polish · existing backend functional, UI needs pass

---

### P-2 · Program Phase 1 · Ideation

**Route:** `/programs/:id/phase/1`  
**Tier:** 1  
**Active agent:** Nexus (right rail)  
**Purpose:** Where users land after Path 3. Refine charter, prepare for Validation.

**Layout reference:** Programs spec + Agent Architecture Packet 3

**Anatomy:**
- Phase ribbon at top (Phase 1 highlighted)
- Main content · charter workspace (editable)
- Right rail · Nexus chat + decision log
- Banner at top · "Originated from Tower signal: Shadow AI" (if Path 3 origination)

**Components:**
- Phase ribbon
- Card (artifact workspace)
- Agent chat panel (Nexus variant)
- Decision log card
- Banner (origination context)

**Acceptance criteria:**
- Banner appears when origination context exists
- Charter draft fields pre-populated from handoff
- Nexus opening message acknowledges Tower handoff
- Save draft auto-persists every 5s
- "Advance to Phase 2" button enables when gate criteria met

**Status:** Backend complete · UI exists · needs design polish for Path 3 arrival experience

---

### I-3 · Active thread view

**Route:** `/intelligence/threads/:id`  
**Tier:** 2  
**Active agent:** Sentinel (main content, no rail)  
**Purpose:** Where strategy research actually happens.

**Layout reference:** Intelligence spec + Agent Architecture Packet 4

**Anatomy:**
- Left sidebar · thread list
- Main content · thread timeline (user questions + Sentinel responses interleaved)
- Evidence panel · collapsible right panel listing sources cited in thread
- Inline · evidence weight badges, Intelligence product invocations, Genome pattern references

**Components:**
- Left sidebar nav
- Agent chat panel (Sentinel variant, inline not rail)
- Badge (evidence weight)
- Card (source citation)
- Tabs (evidence | decisions | exports)

**Acceptance criteria:**
- Thread opens with Sentinel's framing question
- Evidence weights render inline on Sentinel messages
- Source citations clickable → source detail
- Promote to Program button available when thread matures
- Input at bottom supports multi-line with Shift+Enter

---

### P-13 · Phase 6 handoff ceremony

**Route:** `/programs/:id/handoff`  
**Tier:** 2  
**Active agent:** Nexus (leading) → Atlas (receiving)  
**Purpose:** The attested transition from delivery to steady-state. Deliberately weighty.

**Layout reference:** Agent Architecture Packet 6.4

**Anatomy:** Full-screen takeover, 3 columns

- Left column · Context (Program summary, phases completed, key decisions)
- Center column · Handoff checklist (8 items with green/yellow/red status)
- Right column · Ceremony (attester sign-off + Transition to Tower button)

**Components:**
- Layout (3-column full-screen)
- Card (checklist items)
- Badge (status indicators)
- Button (large, primary, disabled until checklist complete)
- Signature affordance (custom)

**Acceptance criteria:**
- 8 checklist items render with computed state
- "Attest now" enables for authorized attester only
- Signature captures timestamp + hash
- "Transition to Tower" enables when all green
- Two-phase commit on submit
- Success animation (motion.duration.deliberate) before redirect
- Rollback on failure

---

### T-8 · Use case detail (living record)

**Route:** `/tower/use-cases/:id`  
**Tier:** 2  
**Active agent:** Atlas (right rail)  
**Purpose:** Single-use-case view spanning all 5 pillars + lifecycle history.

**Layout reference:** Tower spec Packet 10

**Anatomy:**
- Header · use case name, lifecycle stage, owner, sponsor
- Tabs · Overview, Pillars, Timeline, Attestations, Links
- Overview · compact card showing all 5 pillars' current state
- Pillars · drilldown into each pillar for this use case
- Timeline · lifecycle events (Program phases + Tower events)
- Attestations · attestation history + trustworthiness score
- Links · Path 3 origination signal (if any), related Programs, related patterns

**Components:**
- Tabs
- Card (metric, status, default)
- Badge (severity, agent)
- Timeline (vertical)
- Agent chat panel (Atlas)

**Acceptance criteria:**
- All 5 pillars' data renders correctly
- Trustworthiness score prominent with computation transparency
- Lifecycle timeline includes Program phase events + Tower events
- Stale attestation surfaces warning banner

---

### I-1 · Intelligence home / 9-product grid

**Route:** `/intelligence`  
**Tier:** 2  
**Active agent:** Sentinel (via tile click)  
**Purpose:** The Intelligence "front door." Grid of 9 Intelligence products + thread list.

**Layout reference:** Intelligence spec

**Anatomy:**
- Header · "Intelligence" + ask-input ("Ask intelligence anything...")
- 9 product tiles in 3x3 grid
- Below: recent threads list

**Each tile:**
- Intelligence name in `type.intel.name` (JetBrains Mono teal uppercase)
- CXO question (e.g., "What's actually broken — and what's it costing us?") in `type.body.lg` bold white
- Small icon
- Short description
- Invoke CTA (button · "Start Situation Intelligence")

**Components:**
- Card (interactive variant)
- Input (search/ask)
- Button (secondary)
- List (for recent threads)

**Acceptance criteria:**
- 9 tiles render with canonical names + questions
- Ask-input initiates new thread
- Tile click initiates product-specific thread
- Recent threads shown with title + last activity timestamp

---

## 5. Sprint-sized work packages for Codex

When Codex has capacity, the right work package is sized to one focused session (2-4 hours). Here are the packages in priority order.

### Sprint A · Tower mockup pass 2 (2-3 hours)

After Anand's review of pass 1.
- Apply Anand's redlines
- Align to Design System spec (tokens, components)
- Ensure mobile (T-3) works on 375px
- Run 6-area audit checklist

### Sprint B · Tower Path 3 wizard polish (2 hours)

- Design 3-step wizard using Design System modal + wizard pattern
- Verify progress indicator, content per step, CTA
- Mock the transition animation to Programs Phase 1

### Sprint C · Programs Phase 1 arrival polish (2 hours)

- Design the "arrived from Tower signal" banner
- Verify Nexus opening message context
- Polish charter workspace for pre-populated fields

### Sprint D · Intelligence home grid (3 hours) · [Tier 2 start]

- Build I-1 from spec
- Focus on the 9-tile grid visual polish
- Recent threads list below

### Sprint E · Intelligence active thread (4 hours) · [Tier 2]

- Build I-3 with Sentinel chat pattern
- Evidence weight badge inline
- Left sidebar thread list

### Sprint F · Tower Signals surface (3 hours) · [Tier 2]

- Build T-4 (full signals list)
- Build T-5 (single signal page, non-modal variant)
- Filter/sort patterns

### Sprint G · Phase 6 handoff ceremony (4 hours) · [Tier 2]

- Build P-13 full-screen 3-column ceremony UI
- Checklist rendering with state
- Signature affordance + animation

### Sprint H · Tower pillar drill-downs (4 hours × 5 pillars) · [Tier 2]

- Build T-9 through T-13 (one sprint per pillar)
- Reuse drill-down pattern
- Cohort comparison consistent across all

### Sprint I · Programs Phase 2-7 variations (2-3 hours × 6 phases) · [Tier 2]

- Build P-3 through P-8
- Reuse phase detail pattern
- Phase-specific artifact types

### Sprint J · Use case detail + Pipeline (4 hours) · [Tier 2]

- Build T-8 (use case detail · tabs)
- Build T-6 (Pipeline Kanban)

**Total Tier 2 sprints:** ~40-60 hours of design work. 6-8 weeks at Codex's idle-time pace.

---

## 6. Open questions and gaps

1. **Intelligence product output pages** (I-4 through I-12) are specified conceptually but not at the level of "what does this page LOOK like." Each Intelligence product produces a different output shape (Situation gives a diagnosis deck, Cost gives a spend analysis, Risk gives a control matrix). These 9 pages collectively are the biggest open design work.

2. **Artifact workspace** (P-9) — the rich editor for Program artifacts — needs a dedicated design pass. Options: build on top of an existing editor (Tiptap, Lexical, Notion-style), design from scratch, embed Markdown editor. This decision affects Phase 3-6 page designs.

3. **Onboarding flow** (X-11) — how does a new client first experience AbarVa? Currently no design. Low priority pre-design-partner but becomes critical as the product enters the market.

4. **Settings and admin** (X-4 through X-7) — functional but unstyled. Fine for M1/M2, needs polish in M3/M4.

5. **Error pages** (X-10) — should reflect AbarVa voice (honest, action-oriented, not cute).

6. **Microinteractions** — subtle motion, hover polish, transition refinements. Currently an open Prat-task. Can be its own sprint once major pages are locked.

7. **Light mode** — deferred in Design System spec. Revisit when a client requests it or when marketing demands light-mode screenshots.

---

## 7. Status

**Backlog totals:** 59 pages/components inventoried across 4 categories.  
**Tier 1 (demo):** 9 pages · 5 shipped or in flight, 4 needing attention (especially T-16).  
**Tier 2 (design partner):** 40 pages · substantial sustained design effort.  
**Tier 3 (scale):** 13 pages · lower priority.  
**Tier 4 (future):** 3 pages · specialized.

**Next actions:**
- Codex completes Sprint A (Tower mockup pass 2) after Anand's review
- Then Sprint B (Path 3 polish) and Sprint C (Phase 1 arrival polish) to close Tier 1
- Then move into Tier 2 in sprint order D → E → F → G → H → I → J

This document is versioned alongside the product. Update tier assignments, mark pages complete, add new pages as scope expands.

---
