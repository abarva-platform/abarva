# File 09 · Per-Surface UI Pattern Backlog

**Version:** 1.0 · April 24, 2026
**Owners:** Claude Code primary (implementation), Codex secondary (data contracts that surface patterns depend on)
**References:** File 01 failure modes, File 02 pattern library architecture, File 03 knowledge layer, File 04 four-zone surface design, File 07 pitch and external narrative, File 08 agent-Fabric per-turn contract, existing `page-wireframes-and-journey-maps.md`, `abarva-page-density-plan.md`, existing component library and exemplar HTML files

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`. Confidence level noted where claims are inferred.

**Applies:** Agent Autonomy Charter (Section 19). Pre-decided items in Section 18 and File 01 Section 15 — don't re-ask.

---

## Section 1 · Why this file exists

File 04 specifies what each zone is and what each surface feels like at the zone-philosophy level (Tower earned density with Atlas, Programs ruthless minimalism with Nexus, etc.). What File 04 does not specify is the implementation-grade detail: exactly which components compose each surface, how blocks lay out in a grid, what the state variants look like (loading, empty, error, success), how the responsive breakpoints behave, how the drawer drops in, how the evidence citation renders inline vs. in a drawer.

Without that implementation-grade detail, Claude Code improvises per surface. The result is what the three crawler walks found — each surface has its own interpretation of agent anchoring, citation rendering, drawer behavior, cross-link semantics. Dr. L found that Sentinel's guided choices produce substantive responses while free-text silently drops input. Jake found 404 pages with inappropriate "Open Investor View" CTAs. Marcus T found Tower pressure card "Open →" links resolving to blank pages. Every one of those is a UI pattern that was never specified, so each surface picked its own answer.

This file is the implementation-grade specification. It is read alongside File 04 (zone philosophy) and File 08 (agent contract). File 04 says "what." File 08 says "how agents work." File 09 says "how pages are built."

File 09 goes to the block-level layout for every surface. It specifies the component composition referencing the existing `wireframe-component-library.html` 15 primitives. It specifies the state variants per block. It specifies the responsive behavior. It specifies how the agent chat coexists with the page content. It specifies how patterns, evidence, and cross-links render in context.

When Claude Code implements against this file, every surface is consistent — citations look the same across Programs and Tower and Intelligence; drawer behavior is identical everywhere; agent rail expansion follows one pattern; state variants are coherent across the product. That consistency is what makes AbarVa feel like a product rather than a collection of pages.

---

## Section 2 · How to use this file

This file is the UI implementation reference for AbarVa. Read by:

**Claude Code** — primary implementer. For any surface being built or modified, read the relevant section of this file before writing code. The section specifies the block layout, the component composition, the state variants, and the integration with agent chat. When in doubt, the component library exemplars are the source of truth for component behavior; this file specifies how to compose them per surface.

**Codex** — consumer of UI data contracts. Several sections specify the data shape that UI elements expect (e.g., pressure card expects a specific object shape from the Tower API). Codex implements endpoints that produce these shapes.

**Designers** — reference for visual decisions on any surface. If a design decision would diverge from what this file specifies, it must be escalated.

**Crawler personas** — surfaces tested per persona walks. When a persona reports that a citation didn't render correctly or a drawer behaved unexpectedly, the relevant section of this file is the truth against which the finding is validated.

---

## Section 3 · The composition primitives

Every surface in AbarVa composes from the same 15 reusable primitives extracted into `wireframe-component-library.html` (per the April 22 design package). File 09 references these by number:

**01 Navbar** — the top bar. Same across all authenticated surfaces. Tenant chip, zone tabs, user menu, Queue affordance.

**02 Breadcrumb** — path context. `Tenant / Zone / Surface / Sub-surface`. Clickable at every level.

**03 Mono label** — JetBrains Mono 10-11px uppercase for metadata chips, section labels, agent chat headers.

**04 Meta chip** — DM Sans with colored dot for status badges (Phase 3, Rich, Active, Pending). Sized consistently across product.

**05 Button** — primary (filled teal), secondary (outlined), tertiary (text-only). Size tokens sm/md/lg.

**06 Editorial callout** — Georgia serif for pull-quote treatment. Used for pattern thesis lines, pressure card editorial lines, decision memo executive summaries.

**07 Section card** — bordered container with a title row and a body region. The primary page building block.

**08 KPI card grid** — 2-col, 3-col, 4-col responsive. Each KPI card has a label (mono), a value (Georgia serif), and optional trend indicator.

**09 Pressure card** — Tower's editorial-analytical card. Title, editorial paragraph, dollar amount, 2-3 action chips.

**10 Phase timeline** — horizontal 5-phase ribbon with current phase highlighted, gates between phases. Appears on program and deliverable pages.

**11 Deliverable row** — row in a deliverable inventory. ID, name, tier badge (Rich/Outline/Stub), phase, status dot, quality score, open affordance.

**12 Gate readiness banner** — horizontal banner on phase pages. Shows what the gate needs to advance and who's responsible.

**13 Decision log entry** — record of a decision taken on a surface. Timestamp, actor, decision, rationale link.

**14 Cross-link item** — clickable reference to another page (pattern, program, deliverable, observation). Pill or row form.

**15 Composite footer** — always-visible composite tenant disclaimer. "Composite organization built from real-world data."

Every section below composes from these. When a surface needs a component not in the library, the section specifies it as a new primitive and adds it to the library inventory (triggering a component library PR).

---

## Section 4 · Home surface · `/home`

### 4.1 · Purpose

Authenticated landing for tenant users. First thing they see after sign-in. Not the marketing home page (`abarva.ai/`) — that's separate (Section 16).

**Primary user:** Any tenant user. Executive, operator, analyst, admin. Different personas need different surfacing from the same page.

**Strategic purpose:** Orient the user — what changed, what needs attention, what can they do. Route them to wherever they need to go. Do not be a dashboard (that's Tower). Do not be a program list (that's `/tenant/[slug]/programs`). Be an entry-point ribbon.

### 4.2 · Block-level layout

Two-column layout on desktop (1024px+). Single column mobile.

**Left column (primary, 66%):**

- Block H1 · Greeting + tenant context line
- Block H2 · "What needs you" ribbon (Queue summary)
- Block H3 · Portfolio snapshot (program count, phase distribution, open pressures count)
- Block H4 · Recent activity feed (last 5 events across programs)

**Right column (secondary, 34%):**

- Block H5 · Pattern of the day (rotating Sentinel-surfaced pattern relevant to tenant)
- Block H6 · Next actions (2-3 chips — "continue Morrison Phase 3," "review Ambient D17," "check Tower pressures")

### 4.3 · Block specifications

**H1 Greeting + tenant context line**

- Composition: editorial callout (06) above a tenant meta chip row
- Copy template: `Good [morning/afternoon], [first name].`
- Tenant line: `You're on [Tenant Name] · [industry] · [programs count] programs in flight · [phase distribution mini-ribbon]`
- State variants: default (above) vs. first-login (adds a subtle "welcome to AbarVa" pill once)
- Height: fixed 140px desktop, 120px mobile
- Typography: Georgia serif 28px for greeting, DM Sans 14px for tenant line

**H2 "What needs you" ribbon**

- Composition: section card (07) with mono label header "WHAT NEEDS YOU"
- Body: up to 3 queue items rendered as deliverable rows (11) variant
- Each row: item type icon, title, due/age indicator, open affordance
- Click: navigates to `/home/queue` for full queue
- Empty state: `Nothing needs you right now. Your portfolio is current.`
- Error state: Steward editorial line surfacing the data fetch problem (per File 08 honest-disclosure)

**H3 Portfolio snapshot**

- Composition: section card (07) with KPI card grid (08) inside
- KPIs (3-col grid): Programs in flight, Gates approaching (next 14 days), Open pressures with dollar
- Each KPI: mono label, Georgia value, subtle trend arrow if data available
- Click KPI: navigates to the relevant surface (Programs index, Tower, Phase view)

**H4 Recent activity feed**

- Composition: section card (07) with decision log entry (13) rows
- 5 most recent events across all user's programs
- Each row: timestamp (mono), actor, event summary, cross-link to source
- Filter affordance above the feed: `All / Morrison / Ambient Clinical / [+]` pill chips

**H5 Pattern of the day**

- Composition: section card (07) variant with Sentinel voice header
- Mono label: "SENTINEL · PATTERN OF THE DAY"
- Body: pattern thesis line (Georgia pull-quote), 2-line context tying pattern to tenant
- Cross-link (14) to pattern detail page
- Rotates daily via Fabric retrieval (highest-relevance pattern not surfaced in last 7 days)
- State variants: default, first-load-of-session (short animation drawing attention), error (honest "couldn't fetch a pattern today" with retry)

**H6 Next actions**

- Composition: chip row
- 2-3 chips, each a short action verb + noun ("Continue Morrison Phase 3", "Open Ambient D17", "Check Tower pressures")
- Computed by Nexus from program state + user's recent activity
- Click: navigates or opens agent drawer

### 4.4 · Agent anchoring on Home

Home has a collapsed agent rail at 40-60px on the right edge. The rail is Nexus (Home is a Programs-zone-adjacent surface; Nexus is the default agent when no specific zone agent is more appropriate). On click, rail expands to 320-400px.

Nexus opening prompt on Home:

> `Morrison is Phase 3, sitting on D17 decision. Ambient is Phase 2, diagnosis active. Marcus T asked for a CFO-relevant view on the Owned Brand estimate derivation. Want to pick up Morrison, pull up Marcus's question, or triage the Tower pressures?`

(Specific to user's last session. Replaced by first-session prompt for first-load.)

### 4.5 · State variants

**First-load-of-session:** H1 shows welcome pill, H2 shows loading skeleton, H4 shows "loading recent activity" state, others render immediately from cached data.

**Empty tenant (new tenant just onboarded):** H2 "Nothing yet — ready to start your first program?" with CTA to Maestro Intake. H3 KPIs all show zeros. H4 feed empty with "Your activity will appear here." H5 surfaces a starter pattern. H6 shows "Start first program" as the only chip.

**Loading:** Skeleton states for H2, H3, H4, H5. H1 renders immediately.

**Error:** Any block that fails data fetch shows a short honest Steward line inline ("couldn't load [block name]; retry") without breaking the page.

### 4.6 · Responsive behavior

- Desktop ≥1024px: two-column layout per Section 4.2
- Tablet 768-1023px: single column, H2/H3/H4 full width, H5/H6 stacked below
- Mobile <768px: single column, tighter spacing, H3 KPI grid collapses to 1-col
- Navbar (01) collapses to hamburger on mobile

### 4.7 · Current state and gaps

**Current state:** Jake's crawler report describes `/home` as "C11 composite home" with 10 programs listed for Meridian, 28 executives, 38 KPIs, 71 sources, 156 systems, $3.1B opex. This suggests the current home is a KPI-heavy tenant overview, not the entry-point ribbon specified above. Status: **PARTIAL** — page exists but doesn't match this specification.

**Gaps with priority:**
- [P0 demo-critical] Block H1 greeting with tenant context line per Section 4.3
- [P0 demo-critical] Block H2 "What needs you" ribbon wired to Queue data
- [P0 demo-critical] Block H6 next actions computed from Nexus
- [P1 seed-critical] Block H5 pattern of the day rotating via Fabric
- [P1 seed-critical] Nexus anchoring per Section 4.4 with session-specific opening
- [P2 Series A] First-session welcome treatment
- [P2 Series A] Trend arrows on KPI cards (requires historical data)

### 4.8 · Acceptance criteria

- User lands on `/home`, sees greeting + tenant context within 1 second
- H2 renders at least one queue item or an honest empty state
- All KPIs in H3 are clickable and navigate correctly
- H4 feed shows real recent activity, not placeholder
- H6 chips navigate or open drawers correctly
- Nexus rail present, collapsed by default, expands on click
- Mobile and tablet breakpoints render correctly
- No dead links, no placeholder strings (per File 01 Section 15 zero-tolerance)

### 4.9 · Crawler persona test

Dr. L (Meridian CMIO) lands on `/home`. Expected: greeting "Good morning, Dr. L" (or equivalent), Meridian tenant context line, "What needs you" shows her outstanding approvals and reviews, portfolio snapshot shows Meridian's 10 programs with phase distribution, recent activity feed shows what happened across her programs, pattern of the day surfaces a healthcare-relevant pattern, next actions offer "Continue Ambient Clinical Phase 2" or similar. Nexus rail present, opens with Dr. L-specific context. If the page shows generic tenant data without personalization or the queue is empty with no honest explanation, the pattern is not executed.

---

## Section 5 · Programs index · `/tenant/[slug]/programs`

### 5.1 · Purpose

Portfolio view for a specific tenant. Lists all programs with phase distribution, filter/sort affordances, start-new-program CTA.

**Primary user:** Maestro (Maya), Executive (Prat-type reviewing portfolio), Analyst.

**Strategic purpose:** Orient user to the tenant's full AI program portfolio. Make phase distribution visible. Enable navigation into any program. Enable starting a new program.

### 5.2 · Block-level layout

Single column with hero strip at top, filter bar, program card grid.

**Block P1** · Hero portfolio health strip (4-col KPI card grid)
**Block P2** · Filter bar (phase, archetype, status)
**Block P3** · Program card grid (3-col desktop, 2-col tablet, 1-col mobile)
**Block P4** · Start new program CTA (floating or bottom)

### 5.3 · Block specifications

**P1 Hero portfolio health strip**

- Composition: KPI card grid (08) 4-col
- KPIs: Programs in flight, Phase distribution mini-ribbon, Portfolio value at stake, Gates approaching
- Each KPI clickable: KPI 1 → filter to in-flight, KPI 2 → stay and scroll, KPI 3 → Tower, KPI 4 → filter to gate-approaching
- Editorial line above grid (per `wireframe-programs-index.html` exemplar): `Apex Retail — running work at every phase.`
- Copy adapts per tenant

**P2 Filter bar**

- Composition: pill chip row
- Filter groups: Phase (1-5 + All), Archetype (5 program types + All), Status (In flight / On hold / Complete + All)
- Active filter highlighted teal
- "Clear filters" text button on the right when any filter active

**P3 Program card grid**

- Composition: 3-col grid of section cards (07) with program-card layout inside
- Each program card:
  - Header: program name (Georgia), archetype meta chip (04), tier badge if applicable
  - Body: current phase indicator with mini phase timeline (10), sponsor line, last activity line
  - Footer: cross-link (14) to open, pressure indicator if applicable (pressure count + dollar)
- Hero program (Morrison on Apex, Ambient Clinical on Meridian) marked with a subtle "HERO" mono label in the corner
- State variants: default, on-hold (muted treatment), complete (subtle check mark), needs-attention (amber accent)
- Click anywhere on card: navigate to program page

**P4 Start new program CTA**

- Composition: primary button (05) floating bottom-right or inline below grid
- Label: "Start a new program"
- Click: navigate to `/tenant/[slug]/programs/new` (Maestro Intake Interface)

### 5.4 · Agent anchoring

Nexus rail collapsed by default. Expands on click.

Nexus opening prompt on Programs index:

> `Apex Retail has 6 programs. Morrison Phase 4 Verify needs CFO decision by end of week. Owned Brand Acceleration Phase 3 Decision has the sponsor question pending. Want to open Morrison, triage what's pending, or start a new program?`

### 5.5 · State variants

**Empty (new tenant):** P1 KPIs show zeros. P3 grid shows single card "Start your first program" with CTA. P4 CTA is the only visible action.

**Loading:** Skeleton cards in P3 grid. P1 KPI values show pulse animation.

**Filtered to empty:** "No programs match current filters. Clear filters or start a new program." with clear-filters link.

### 5.6 · Responsive behavior

- Desktop: 3-col grid
- Tablet: 2-col grid
- Mobile: 1-col grid, filter bar horizontally scrollable

### 5.7 · Current state and gaps

**Current state:** `wireframe-programs-index.html` exemplar exists for Apex Retail. Per Jake and Marcus T crawler reports, the Programs route has been broken (redirect loops, "ERR_TOO_MANY_REDIRECTS," blank pages). Status: **PARTIAL** — exemplar exists, production route broken per remediation backlog DR-01/DR-02.

**Gaps with priority:**
- [P0 demo-critical] Route resolution per DR-01/DR-02 (dependency)
- [P0 demo-critical] Implementation per this section's layout for both Apex and Meridian tenants
- [P0 demo-critical] Nexus anchoring per Section 5.4
- [P1 seed-critical] Filter bar functional (all filters applying correctly)
- [P1 seed-critical] Hero program marker rendering correctly
- [P2 Series A] Advanced sort (by value at stake, by phase urgency)

### 5.8 · Acceptance criteria

- Programs index loads for any tenant the user has access to
- All 6 Apex programs visible; Meridian programs visible when on Meridian
- Morrison marked as hero on Apex; Ambient Clinical marked as hero on Meridian (confirm per seed spec)
- Clicking a program card navigates to the program page successfully
- Filters work (clicking Phase 3 filter hides programs not in Phase 3)
- "Start new program" CTA navigates to Maestro Intake

### 5.9 · Crawler persona test

Marcus T (Apex CFO) lands on `/tenant/apex-retail/programs`. Expected: 6 programs visible, Morrison marked hero, phase distribution shows work at every phase, Morrison clickable and navigates to program page. Nexus opens with Apex-specific context mentioning Morrison. If Marcus T cannot reach Morrison from this page (as the April 24 crawl found), the pattern is not executed.

---

## Section 6 · Program page · `/tenant/[slug]/programs/[program]`

### 6.1 · Purpose

Canonical authenticated working surface. The page where the real transformation work happens. Phase timeline, current phase focus, open decisions, pressures, cross-links.

**Primary user:** Maestro, Executive sponsors, Analysts on the program team.

**Strategic purpose:** Be the room where the program's current thinking lives. The agent (Nexus) is anchored here. The page shows phase state, what's decided, what's open, what's pressuring the program.

### 6.2 · Block-level layout

Main content area with right sidebar (when Nexus collapsed). When Nexus expanded, sidebar hides, content area narrows to accommodate.

**Main content (when sidebar visible):**

- Block PP1 · Program header + phase timeline
- Block PP2 · Current phase focus (the phase the program is in)
- Block PP3 · Deliverable inventory (current phase expanded, others collapsed)
- Block PP4 · Decision log
- Block PP5 · Pressures & contradictions

**Right sidebar (collapsed by default to 60px, expands to 320px on click):**

- Block PP6 · Cross-links (related patterns, related programs, evidence base)

### 6.3 · Block specifications

**PP1 Program header + phase timeline**

- Composition: editorial callout (06) + phase timeline (10)
- Header: `[Program Name]` in Georgia 32px
- Sub-header: `[Tenant Name] · Phase [N] [Phase Name] · Sponsor [Name], [Role]`
- Phase timeline (10): 5-node horizontal ribbon with current phase highlighted, gates between phases
- Each phase clickable: navigate to phase page for that phase

**PP2 Current phase focus**

- Composition: section card (07) with title "Phase [N] · [Phase Name]"
- Body: phase expectations (short prose), gate readiness banner (12) if gate approaching, key questions being worked
- Editorial: Nexus-synthesized line tying the phase state to what matters (e.g., `"Decision is taking shape; the pushback to pre-write is the sequencing choice."`)

**PP3 Deliverable inventory**

- Composition: section card (07) with deliverable rows (11) inside
- Current phase deliverables expanded: show each with tier badge, status, quality score, open affordance
- Other phases collapsed: show phase header as click-to-expand
- Click any deliverable row: navigate to deliverable page

**PP4 Decision log**

- Composition: section card (07) with decision log entries (13)
- Last 5-10 decisions shown, reverse chronological
- Each entry: timestamp, actor, decision summary, rationale cross-link
- "View all decisions" affordance at bottom if more than rendered count

**PP5 Pressures & contradictions**

- Composition: section card (07) with pressure cards (09) inside
- 2-3 most urgent pressures for this program
- Each pressure: editorial line, dollar/impact indicator, action affordances
- Contradictions counter at top right (e.g., `25 tracked · $522K/mo attributed`)
- Click any pressure: open detail drawer (not navigate away)

**PP6 Right sidebar · Cross-links**

- Composition: stacked cross-link items (14) grouped by category
- Categories: Related patterns, Related programs (same archetype, same tenant), Evidence base (source documents)
- Each group collapsible; default expanded

### 6.4 · Agent anchoring on Program page

Nexus rail collapsed-narrow by default at the right edge. Expands to 320-400px on click. When expanded, right sidebar (PP6) hides; main content narrows.

Nexus on Program page is the most central agent anchor in the product. Nexus has synthesized program state into the most relevant open questions.

Nexus opening prompt on Morrison Phase 3 (per File 04 Section 4.5):

> `Morrison is Phase 3. D17 is waiting for Dr. L's interview. Want to walk through the decision memo, review the intervention portfolio, or prep the interview?`

Opening prompt varies by phase and program state. Computed on each visit.

### 6.5 · Drawer behaviors

- Click pressure card (PP5): opens drawer over page showing pressure detail + Atlas editorial analysis + action chips. Dismiss returns to program page with state preserved.
- Click cross-link to pattern (PP6): opens pattern detail as drawer. Full pattern page accessible via "Open full page →" in drawer.
- Click cross-link to related program: navigates (not drawer) since that's a zone change.

Drawer specs per File 04 Section 6.2.

### 6.6 · State variants

**Program not started (Phase 0):** PP2 shows "Intake pending" with CTA to Maestro Intake. PP3 shows no deliverables yet. PP4 empty. PP5 shows any tenant-level pressures relevant.

**Program on hold:** PP1 phase timeline has "On Hold" indicator overlay. PP2 shows "Paused since [date]; [reason]" with resume affordance.

**Program complete (Phase 5 reached):** PP1 timeline shows all phases complete. PP2 shows outcome attestation summary. PP3 shows all deliverables with final tier and quality scores.

### 6.7 · Responsive behavior

- Desktop ≥1280px: main + sidebar as specified
- Desktop 1024-1279px: sidebar narrower (280px), content narrower
- Tablet: sidebar hides, surfaces as tab below content
- Mobile: all blocks stack vertically, Nexus rail becomes bottom-anchored

### 6.8 · Current state and gaps

**Current state:** `wireframe-programs-page.html` exemplar exists (Ambient Clinical on Meridian). Per crawler reports, the route `/engagements/{id}` loops with ERR_TOO_MANY_REDIRECTS. Status: **PARTIAL** — exemplar high-quality, production route broken per remediation backlog.

**Gaps with priority:**
- [P0 demo-critical] Route resolution per DR-01 (dependency)
- [P0 demo-critical] Full program page implementation for Morrison (Apex) and Ambient Clinical (Meridian)
- [P0 demo-critical] Nexus anchoring per Section 6.4 with dynamic opening
- [P0 demo-critical] Pressure card drawer behavior per Section 6.5
- [P1 seed-critical] Decision log showing real decisions
- [P1 seed-critical] Cross-links sidebar functional with related patterns/programs
- [P1 seed-critical] State variants per Section 6.6
- [P2 Series A] Multi-user workshop mode co-presence indicators

### 6.9 · Acceptance criteria

- Program page loads for any accessible program; no redirect loops
- Phase timeline renders correctly with current phase highlighted
- Deliverable rows clickable and navigate to deliverable pages
- Decision log shows real decisions with functional cross-links
- Pressure card click opens drawer (not navigation)
- Right sidebar shows related patterns and programs with working links
- Nexus rail expands on click; opens with program-specific context

### 6.10 · Crawler persona test

Dr. L opens Ambient Clinical Value Chain Activation program page from home. Expected: program header with "Meridian Health · Phase 2 Design · Sponsor Dr. Elena Vasquez," phase timeline with Phase 2 highlighted, deliverable inventory showing 23 deliverables with D01 quality 84/100 and D27 scheduled stub, decision log showing recent decisions with cross-links, pressure cards for ambient overlap, right sidebar with Ambient Intelligence pattern cross-link. Nexus opens with Phase 2 diagnosis-specific context. If any of these fail, the pattern is not executed.

---

## Section 7 · Phase page · `/tenant/[slug]/programs/[program]/phase/[n]`

### 7.1 · Purpose

All deliverables for a specific phase. Gate status. Phase-specific actions.

**Primary user:** Same as program page, but zoomed into one phase.

### 7.2 · Block-level layout

- Block PH1 · Phase header + breadcrumb
- Block PH2 · Gate readiness banner (prominent)
- Block PH3 · Deliverable inventory (all deliverables for this phase expanded)
- Block PH4 · Phase-specific decision log
- Block PH5 · Advance-phase affordance (if gate ready)

### 7.3 · Block specifications

**PH1 Phase header + breadcrumb**

- Composition: breadcrumb (02) + editorial callout (06)
- Breadcrumb: `Apex / Programs / Morrison / Phase 3 Decision`
- Editorial line: `Phase 3 Decision · The where-and-how of the intervention portfolio.`

**PH2 Gate readiness banner**

- Composition: gate readiness banner (12) component
- State variants: ready (teal), in progress (neutral), blocked (amber), failed (red)
- Body: checklist of gate conditions with status per condition
- Owner chips: who's responsible for each condition
- "Advance to Phase [n+1]" button appears when ready; disabled when not

**PH3 Deliverable inventory**

- Composition: section card (07) with deliverable rows (11)
- All deliverables for this phase expanded
- Sort: by deliverable code (D15, D16, D17, D18, D19)
- Row variants: Rich (full badge, high quality), Outline (mid badge, medium quality), Stub (subtle badge, scheduled indicator)

**PH4 Phase-specific decision log**

- Similar to program page decision log but filtered to this phase

**PH5 Advance-phase affordance**

- Composition: primary button (05) large
- Label: "Advance to Phase [n+1]"
- State: enabled when PH2 banner is "ready"; disabled with tooltip otherwise
- Click: confirmation modal with gate checklist + sponsor approval required

### 7.4 · Agent anchoring

Nexus rail same behavior as program page. Opening prompt phase-specific:

> `Phase 3 has 5 deliverables. D15 Intervention Portfolio and D17 Decision Memo are ready for your review. D16 Business Case needs the sensitivity analysis. Want to open one, or see what the gate check wants?`

### 7.5 · Current state and gaps

**Status:** Exists per File 04 Section 4.6 as PARTIAL. Per crawler reports, route may share the broken `/engagements` redirect loop.

**Gaps with priority:**
- [P0 demo-critical] Route resolution (DR-01 dependency)
- [P0 demo-critical] Implementation per this section
- [P1 seed-critical] Advance-phase affordance with real gate validation and sponsor approval flow

### 7.6 · Acceptance criteria

- Phase page loads for any phase of any accessible program
- Gate readiness banner accurately reflects gate state
- All deliverables for the phase visible and clickable
- Advance-phase button enabled only when gate is ready

---

## Section 8 · Deliverable page · `/tenant/[slug]/programs/[program]/deliverables/[code]`

### 8.1 · Purpose

The working surface where substance lives. A specific deliverable at its declared tier (Rich / Outline / Stub).

**Primary user:** Maestro reviewing or editing; sponsor reviewing; analyst contributing.

### 8.2 · Tier-specific layout

Three tier variants per `programs-seed-and-deliverable-generation-enhancement-spec.md`. File 09 codifies the pattern per tier.

### 8.3 · Rich tier layout

The full-fidelity deliverable. Reference: `wireframe-d17-morrison-decision-memo.html`.

**Blocks:**

- DL1 · Deliverable header + breadcrumb + tier badge "RICH"
- DL2 · Executive summary (editorial callout Georgia 19px)
- DL3 · KPI strip (4-card grid with critical numbers from the deliverable)
- DL4 · Recommendation body (prose with inline evidence citations)
- DL5 · Data table (if applicable)
- DL6 · Inline SVG chart (if applicable; e.g., cumulative margin recovery over time)
- DL7 · Decision log (phase-specific decisions)
- DL8 · Risks with mitigations (if decision-grade deliverable)
- DL9 · Sticky right sidebar with section nav + cross-links + evidence base + analogous programs

**Specifications:**

**DL2 Executive summary**

- Georgia 19px, max 4 sentences
- Opens with the recommendation, not the context
- Pull-quote treatment with visible accent border left

**DL4 Recommendation body with inline evidence**

- Evidence citations as superscript chips per File 08 citation grammar (e.g., `[E1]`, `[E7]`)
- Hover on citation: tooltip with source, confidence, link to evidence page
- Click citation: open evidence drawer with full source content
- Each citation carries confidence indicator per File 08 Section 9.3

**DL5 Data table**

- DM Sans, standard enterprise table
- Key rows highlighted (preferred suppliers, primary recommendations) with subtle teal accent
- Sort affordances on columns
- Export to CSV affordance in top right (P1 Series A)

**DL6 Inline SVG chart**

- SVG generated client-side from data the page fetched
- Includes axes, legend, breakeven/threshold markers
- Accessible with alt-text describing the data
- Printable

**DL9 Sticky right sidebar**

- Section anchor nav (jump to each block)
- Cross-links to patterns cited (with bidirectional wiring per File 08 PA-01/PA-02)
- Evidence base (list of sources referenced, each clickable)
- Analogous programs (3-5 most similar programs from graph retrieval)
- Sponsor-of-record chip

### 8.4 · Outline tier layout

Mid-fidelity deliverable. Structure correct but less depth.

**Blocks:**

- Same DL1, DL2 as Rich
- DL3 KPI strip condensed (2-card)
- DL4 recommendation body shorter, fewer inline citations
- DL5-DL6 if applicable
- No DL7-DL8 (decision log and risks collapsed)
- Sidebar (DL9) lighter — section nav + 2-3 cross-links

Outline is a legitimate render tier — not "coming soon." The tier badge says "OUTLINE" and the deliverable is substantive at its declared depth.

### 8.5 · Stub tier layout

Scheduled deliverable that hasn't activated yet. Reference: `wireframe-d25-stub-scheduled.html`.

**Blocks:**

- DL1 deliverable header + breadcrumb + tier badge "SCHEDULED STUB"
- DL10 · Scheduled banner (teal, honest)
- DL11 · Activation conditions (list with state badges per condition: In progress / Not yet / Complete)
- DL12 · Prerequisite deliverables (what must complete first)
- DL13 · Structure preview (what sections will exist when activated)
- Full navigation preserved so clicks don't dead-end

Stub tier is a first-class render state — never 404, never "coming soon" placeholder. The user knows exactly when this deliverable will activate and what must happen first.

### 8.6 · Agent anchoring on deliverable pages

Nexus rail collapsed by default. Deliverable pages are where Nexus is most useful — it knows the deliverable content and can pressure-test, regenerate, or explain.

Nexus opening prompts per tier:

**Rich:**
> `D17 is drafted with three levers, parallel-track sequencing, $4.2-6.8M capital range. The sequencing decision is the one place I'd want your input — or Marcus T.'s. Want to pressure-test the sequencing, review the supporting evidence, or regenerate with different assumptions?`

**Outline:**
> `D15 Intervention Portfolio is outlined. Want me to expand to full depth, or move on to the decision memo?`

**Stub:**
> `D25 activates when Morrison reaches Phase 5. I can show what triggers it or queue a reminder when Phase 4 closes.`

### 8.7 · Evidence drawer

When a citation `[E7]` is clicked in DL4, an evidence drawer opens (not navigation). Drawer contents:

- Evidence source full title and publication metadata
- Excerpt that the citation references (the specific claim supported)
- Confidence qualifier per File 08 Section 10
- Provenance: authored-from-industry-knowledge vs measured-outcome vs composite
- Link to pattern page that contains this evidence (bidirectional wiring per File 08 PA-01)

Drawer dismisses on ESC, click-outside, or close button. State preserved on dismiss.

### 8.8 · Approval flow

When user is authorized to approve this deliverable (maestro, sponsor), an "Approve decision" button appears at the bottom of the recommendation body (DL4) for decision-grade deliverables.

Click "Approve decision":
- Confirmation modal listing what the approval means and what phase gate conditions it satisfies
- On confirm: approval recorded, decision log entry appended (PP4 / PH4 updates), gate readiness banner updates, Steward logs the approval to audit
- No silent approval — always confirmed and logged

### 8.9 · State variants

**Draft:** subtle "DRAFT" chip in header, "Regenerate" affordance prominent, approval disabled until ready
**Ready for review:** "READY FOR REVIEW" chip, review affordances prominent
**Approved:** "APPROVED" chip with actor + timestamp, approval history visible
**Superseded:** "SUPERSEDED" chip with cross-link to successor deliverable

### 8.10 · Current state and gaps

**Current state:** Rich exemplar D17 exists. Stub exemplar D25 exists. Per crawler reports, deliverable routing is broken (`/preview/deliverables/D17` returns 404, `/engagements/{id}` loops). Status: **PARTIAL** — exemplars high-quality, production route broken.

**Gaps with priority:**
- [P0 demo-critical] Route resolution (DR-01/DR-02 dependency)
- [P0 demo-critical] Rich tier implementation for Morrison D17, D15, D19 and Ambient D01, D07, D17, D27
- [P0 demo-critical] Outline tier implementation for remaining P0 deliverables
- [P0 demo-critical] Stub tier per D25 pattern for all scheduled deliverables
- [P0 demo-critical] Evidence drawer per Section 8.7 with pattern bidirectional wiring
- [P0 demo-critical] Approval flow per Section 8.8
- [P1 seed-critical] State variants per Section 8.9
- [P2 Series A] Collaborative editing with co-presence

### 8.11 · Acceptance criteria

- Every deliverable in the portfolio opens (Rich, Outline, or Stub — not 404)
- Tier badge matches declared tier per seed spec
- Rich deliverables include at least DL1, DL2, DL4, DL9
- Evidence citations resolve and drawer opens on click
- Pattern cross-links in sidebar resolve bidirectionally
- Approval flow records decision to log and updates gate readiness
- Stub pages show activation conditions honestly, never "coming soon"

### 8.12 · Crawler persona test

Marcus T opens D17 Morrison Decision Memo. Expected: header "D17 Decision Memo · Morrison Owned Brand Margin Recovery · Phase 3 · Rich," executive summary opens with three-option framing and recommendation, KPI strip with $180-240M range + confidence interval + payback window, recommendation body with inline evidence citations [E1]-[E7], data table with SKU-level unit economics and preferred suppliers highlighted, inline SVG chart showing cumulative margin recovery with breakeven marker, decision log entries, risks with mitigations, sticky sidebar with section nav + Owned Brand Margin Recovery pattern cross-link. Approve decision button visible (Marcus is authorized). If any of these fail, the pattern is not executed.

---

## Section 9 · Maestro Intake Interface · `/tenant/[slug]/programs/new`

### 9.1 · Purpose

The front door of Programs zone. Conversational intake that produces GO / REFINE / REDIRECT outcome per File 01 FM-1.

**Primary user:** Anyone starting a new program — maestro, sponsor, or executive.

**Strategic purpose:** Pressure-test whether this is the right program to run at this time for this tenant. Not order-taking — pattern-backed pressure-testing.

### 9.2 · Block-level layout

Conversation-centric layout. The agent conversation IS the page.

- Block MI1 · Breadcrumb + intake header (minimal)
- Block MI2 · Conversation area (full width, dominant)
- Block MI3 · Outcome ribbon (appears when GO/REFINE/REDIRECT decision ready)

### 9.3 · Block specifications

**MI1 Intake header**

- Breadcrumb (02): `Apex / Programs / New`
- Short editorial line: `Tell me what you're trying to accomplish. I'll pressure-test against the pattern library and your tenant's readiness.`
- No chrome beyond this. Minimum scaffolding.

**MI2 Conversation area**

- Full-width conversation with Nexus (or a dedicated Maestro Intake agent variant of Nexus)
- Free-text primary input with suggested starter prompts (File 04 Section 4.5):
  > "I need to optimize vendor spend" · "We're rationalizing our AI estate" · "Ambient clinical rollout" · "Something else"
- Each turn follows File 08 agent contract
- Conversation progresses through stages:
  - Intake: user describes the problem in their own words
  - Pattern match: Nexus surfaces closest pattern matches with confidence
  - Tenant readiness check: Nexus overlays tenant data (portfolio, capability, posture)
  - Adjacent use case exploration: Nexus offers reframings or related problems
  - Outcome decision: GO / REFINE / REDIRECT

**MI3 Outcome ribbon**

- Appears when Nexus has enough to propose an outcome
- Three variant treatments:
  - **GO** (teal): "Pattern match strong. Tenant ready. Scope clear. Ready to start Phase 1."
  - **REFINE** (amber): "Pattern match partial, tenant readiness uncertain. Recommend a scoping session with [named roles]."
  - **REDIRECT** (purple): "The real problem is adjacent. [Proposed reframing]. Want to explore that instead?"
- Each variant has primary action: GO → "Start Phase 1"; REFINE → "Schedule scoping session"; REDIRECT → "Explore reframing"
- Secondary action: "Keep discussing" (returns to MI2)

### 9.4 · Current state and gaps

**Current state:** Per `abarva-nexus-agent-spec.md` and File 04, intake exists but GO/REFINE/REDIRECT not explicitly present. Per Jake crawler, Nexus responses are templated. Status: **PARTIAL**.

**Gaps with priority:**
- [P0 demo-critical] Nexus wired per File 08 contract (retrieval every turn)
- [P0 demo-critical] GO/REFINE/REDIRECT outcome logic with visible rationale
- [P0 demo-critical] Pattern confidence scoring surfaced in conversation
- [P1 seed-critical] Tenant readiness inline integration
- [P1 seed-critical] Adjacent use case suggestion from graph
- [P2 Series A] Intake conversation state persisted across sessions

### 9.5 · Acceptance criteria

- User completes intake in under 15 minutes wall time for typical program
- Outcome ribbon appears with rationale referencing specific patterns
- Confidence scores visible to user
- GO outcome creates a new program in Phase 1 and navigates to program page
- REFINE and REDIRECT outcomes do not create a program but record the intake for follow-up

### 9.6 · Crawler persona test

Marcus T proposes "improve owned-brand margin by using AI." Expected: Nexus pressure-tests, retrieves Owned Brand Margin Recovery pattern with high confidence, surfaces pattern signals, surfaces adjacent pattern (supplier concentration), proposes GO with rationale citing the specific pattern and tenant fit. If Nexus returns a templated response without pattern-backed rationale, the pattern is not executed.

---

## Section 10 · Control Tower · `/tenant/[slug]/tower`

### 10.1 · Purpose

Executive's portfolio-level view. File 04 Section 2 covers zone-level spec. File 09 covers implementation.

**Primary user:** CIO/CAIO-class executives. 15-minute attention window.

### 10.2 · Block-level layout

- Block CT1 · Hero editorial line
- Block CT2 · Pressure card row (3-4 cards)
- Block CT3 · Portfolio KPIs strip (6-card: Inventory / Adoption / Value / Risk / Cost / Contradictions)
- Block CT4 · Segmented drill-down (tabs: By BU / By Function / By Risk Tier / By Outcome Stage)
- Block CT5 · Active programs summary
- Block CT6 · Recent changes feed

Right sidebar with Atlas rail collapsed-narrow.

### 10.3 · Block specifications

**CT1 Hero editorial line**

- Composition: editorial callout (06)
- Georgia serif 22-24px
- Copy: Atlas-generated synthesis of current tenant state — e.g., `"Ambient vendor sprawl at $1.6M/mo; AI governance lagging NIST coverage; three programs stalled."`
- Updated per visit (cached 30 min)

**CT2 Pressure card row**

- Composition: 3-4 pressure cards (09) in horizontal strip
- Ordered by urgency (dollar × unresolved-time)
- Each pressure card:
  - Title (editorial line): `"$522K/mo — Three ambient tools, one problem, no owner"`
  - Dollar amount with context (per month, projected, realized)
  - Editorial body paragraph (2-3 sentences)
  - Action chips: "Assign owner", "Open investigation", "Defer to council", "Escalate"
  - Expand affordance: click to open drawer with pressure detail + Atlas editorial analysis
- Action chips route per File 04 Section 2.3: Assign → Nexus creates program; Investigation → Steward audit; Defer → Council agenda; Escalate → sponsor chain

**CT3 Portfolio KPIs strip**

- Composition: 6-card KPI grid (08)
- KPIs:
  - Inventory (programs + vendors count, categorized)
  - Adoption (active users, engagement rate)
  - Value (realized vs projected, from D17/D27 per File 08 CT-03/CT-04)
  - Risk (risk register rollup, bias incidents)
  - Cost (monthly spend decomposed: LLM, Compute, License)
  - Contradictions (tracked contradictions count with dollar attribution)
- Each KPI clickable: opens drill-down on that dimension

**CT4 Segmented drill-down**

- Composition: tab row + table below
- Tabs: By BU / By Function / By Risk Tier / By Outcome Stage
- Active tab shows a segmented table with per-segment KPIs and drill-in affordance
- Default tab: By BU

**CT5 Active programs summary**

- Composition: condensed program card row (similar to P3 but more compact)
- Shows top 5 active programs with name, phase, status indicator
- "Open all programs →" link to `/tenant/[slug]/programs`

**CT6 Recent changes feed**

- Composition: decision log entry (13) rows
- Tenant-wide recent events — decisions approved, phases advanced, patterns cited, programs started
- Filter to specific event type affordance

### 10.4 · Agent anchoring

Atlas rail collapsed-narrow at 40-60px. Expands to 320-400px on click.

Atlas opening prompt per File 04 Section 2.5:

> `Three unowned pressures today. $1.3M/mo cloud spend, $1.3M/mo governance gap, $522K/mo ambient overlap. Want to triage the highest-dollar, assign owners, or brief me on what changed since your last check?`

### 10.5 · Drawer behaviors

- Pressure card expand: drawer with full pressure analysis, history, related patterns, action chips
- KPI drill-in: drawer with per-KPI decomposition
- Program card click: navigate (not drawer — zone change)

### 10.6 · State variants

**First-visit for this user on this tenant:** Atlas opens with tenant orientation rather than delta-since-last-visit.

**No pressures:** CT2 shows "No unowned pressures today. Portfolio is well-owned." Small visual of all green indicators.

**Loading:** Skeletons for CT2 and CT3 KPIs.

### 10.7 · Current state and gaps

**Current state:** Per Jake and Dr. L crawler reports, Tower is the richest surface in the product. Pressure cards render with dollar amounts and editorial lines. Stats strip shows 42 use cases / 25 contradictions / 3 unowned / $1.2M/mo. Dr. L notes "REDESIGN PREVIEW · SANDBOX ROUTE" banner on the only Tower she could reach. Drill-ins 404 or blank. Status: **PARTIAL**.

**Gaps with priority:**
- [P0 demo-critical] Strip "REDESIGN PREVIEW" banner (CT-01 in remediation backlog)
- [P0 demo-critical] Pressure card "Open →" drill-ins resolve correctly (CT-02)
- [P0 demo-critical] Realized-vs-projected value tracking populated (CT-03/CT-04)
- [P0 demo-critical] Atlas anchoring per Section 10.4 with proactive opening
- [P1 seed-critical] Cross-link from pressure cards to relevant patterns (CT-05)
- [P1 seed-critical] Cost decomposition drill-in working
- [P1 seed-critical] CT5 Ambient Clinical Value Chain Activation visible in active programs list (CT-07)

### 10.8 · Acceptance criteria

- Tower loads for any authenticated tenant user in under 2 seconds
- Hero editorial line tenant-specific and current
- Pressure cards with real dollar amounts and action chips
- KPIs populated with real data (not em-dash or placeholder)
- All drill-ins resolve correctly (no 404, no blank)
- Atlas rail present with proactive opening prompt
- No QA/sandbox banners visible to end users

### 10.9 · Crawler persona test

Marcus T opens Tower on Apex Retail. Expected: Tower shows Apex-specific portfolio, pressure cards with dollar amounts traceable to underlying programs, realized-vs-projected visible for Morrison, drill-ins resolve. If em-dash in Projected value column or "Open →" goes to blank page, pattern is not executed.

---

## Section 11 · Tower sub-surfaces

File 04 Section 2.2 lists five sub-surfaces: Vendor Portfolio, Shadow AI, Regulatory Posture, AI Council, Model Inventory. File 09 covers each at block level.

### 11.1 · Common pattern across Tower sub-surfaces

All five sub-surfaces share a common layout pattern:

- Block TS1 · Breadcrumb + sub-surface header + editorial summary line
- Block TS2 · Dominant visualization or data grid appropriate to the sub-surface
- Block TS3 · Action/insight panel (right side or below)
- Atlas rail anchored same as Control Room

Each sub-surface has its own content specification below; the layout pattern is consistent.

### 11.2 · Vendor Portfolio · `/tenant/[slug]/tower/vendors`

**Purpose per File 04 Section 2.2:** All AI vendors in the estate. Overlap detection. Rationalization recommendations.

**TS2 dominant visualization:** Vendor grid — card per vendor with capability tags, spend, performance indicators, overlap markers. Sortable by spend, by overlap severity, by renewal date.

**TS3 insight panel:**
- Rationalization recommendations (Atlas-authored with pattern backing)
- Renewal calendar (approaching cliffs highlighted)
- Spend trajectory chart (inline SVG)
- Partnership / strategic vendor identification

**Atlas opening:** `47 AI vendors in the estate. 14 are overlap candidates. The ambient triad is the most expensive unresolved. Want the rationalization recommendation, the vendor-by-vendor breakdown, or a sort by renewal date?`

**Status:** Stub route exists. Full implementation missing. **MISSING**.

**Gaps:** [P0 demo-critical] Full implementation as exemplar fidelity (sets pattern for other 4 sub-surfaces).

### 11.3 · Shadow AI · `/tenant/[slug]/tower/shadow-ai`

**Purpose per File 04:** AI tools in use outside formal governance. Detection and triage.

**TS2 dominant visualization:** Detected tools list with source (procurement records, SSO logs, connector scans). Grouped by risk tier.

**TS3 insight panel:**
- Ownership gap flagging (tools without identified owners)
- Triage actions per tool: bring under governance, approve, block
- Detection source distribution (how each tool was found)

**Atlas opening:** `23 shadow AI tools detected. 8 are high-risk (sensitive data, unapproved vendors). 4 have no identified owner. Want to triage high-risk, find owners, or see the detection sources?`

**Status:** Stub. **MISSING**.

**Gaps:** [P1 seed-critical] Full implementation.

### 11.4 · Regulatory Posture · `/tenant/[slug]/tower/regulatory`

**Purpose per File 04:** Framework coverage (NIST AI RMF, EU AI Act, sector-specific). Gaps. Remediation.

**TS2 dominant visualization:** Framework coverage heat map (matrix of frameworks × coverage areas with % coverage per cell, color-coded).

**TS3 insight panel:**
- Gap inventory per framework (sortable by severity)
- Remediation roadmap with ownership per item
- Notable recent policy changes affecting coverage

**Atlas opening:** `NIST AI RMF coverage is 62% — 12 gaps. RADV is the one that concerns me given your MA exposure. Want the RADV-specific gap list, a framework-level heat map, or the remediation roadmap?`

**Status:** Stub. **MISSING**.

**Gaps:** [P1 seed-critical] Full implementation.

### 11.5 · AI Council · `/tenant/[slug]/tower/council`

**Purpose per File 04:** Agenda, decisions, approvals, minutes for AI governance body.

**TS2 dominant visualization:** Upcoming meeting agenda with pre-reads. Approval queue table below.

**TS3 insight panel:**
- Past decisions with rationale and outcomes (paginated)
- Council membership and attendance
- Pre-read generation affordance (Nexus handoff)

**Atlas opening:** `Apr 24 meeting has 4 agenda items. The ambient vendor decision is the biggest. Want the pre-read, the approval queue, or the decision log from last session?`

**Status:** Stub. **MISSING**.

**Gaps:** [P1 seed-critical] Full implementation.

### 11.6 · Model Inventory · `/tenant/[slug]/tower/models`

**Purpose per File 04:** All production AI models. Bias incidents. Drift. Risk tiering.

**TS2 dominant visualization:** Model grid with risk tier, last audit, drift indicators. Sortable.

**TS3 insight panel:**
- Bias incident log with post-mortems
- Drift watchlist
- Risk-tier portfolio rollup

**Atlas opening:** `37 models in production. Two bias incidents in 90 days. Drift watchlist has 5 models. Want the bias incident post-mortem, the drift watchlist, or a risk-tier rollup?`

**Status:** Stub. **MISSING**.

**Gaps:** [P1 seed-critical] Full implementation.

---

## Section 12 · Admin landing and sub-surfaces

Per File 04 Section 3. File 09 specifies implementation.

### 12.1 · Admin landing · `/tenant/[slug]/admin`

**Block layout:**

- Block A1 · Breadcrumb + admin header
- Block A2 · Admin navigation grid (5-card grid with each card linking to sub-surface)
- Block A3 · Recent admin activity feed
- Block A4 · System health indicators

Steward rail collapsed. Summoned when needed.

**A2 admin navigation grid cards:**
- Users · count + status indicators
- Data Connectors · count + health indicators
- Entitlements · count + alerts
- Audit Log · 24h event count + anomaly indicator
- Billing and Usage · current period summary

Click any card: navigate to sub-surface.

**Status:** Per Code rollup, admin page exists with "Admin surfaces" plain-anchor nav row added for crawler discovery. Status: **PARTIAL**.

### 12.2 · Users · `/tenant/[slug]/admin/users`

**Block layout:**

- Block AU1 · Breadcrumb + user management header
- Block AU2 · User list table (full-width, with filter + search + invite CTA)
- Block AU3 · Role assignment quick-actions (when user selected)
- Block AU4 · SSO configuration panel

**Table columns:** Email, Name, Role, Last active, Status (active/pending/suspended), Actions (edit role / revoke / impersonate for admins).

**Invite flow:** Click "Invite user" → modal with email + role + program-access scope → send → Clerk handles invitation.

**Status:** Partial per File 04. **PARTIAL**.

### 12.3 · Data Connectors · `/tenant/[slug]/admin/connectors`

**Block layout:**

- Block AC1 · Breadcrumb + connectors header with health summary line
- Block AC2 · Connector grid (card per connector with status indicator)
- Block AC3 · New connector configuration wizard (modal-triggered)

**Connector card:** System logo (Epic, SAP, Salesforce), connector name, last sync timestamp, status dot (healthy/degraded/broken), credential expiry indicator, actions (test, reconfigure, rotate credentials).

**Status:** Missing or stub. **MISSING**.

### 12.4 · Entitlements · `/tenant/[slug]/admin/entitlements`

**Block layout:**

- Block AE1 · Header
- Block AE2 · Role matrix (roles × permissions, editable by admin)
- Block AE3 · Program-level override list (users/groups with program-specific access)
- Block AE4 · Feature flag management

**Status:** Missing. **MISSING**.

### 12.5 · Audit Log · `/tenant/[slug]/admin/audit`

**Block layout:**

- Block AL1 · Header with filter bar (date range, actor, event type)
- Block AL2 · Event log table (reverse chronological)
- Block AL3 · Export affordance (CSV for compliance)

**Event table columns:** Timestamp, Actor, Event type, Entity, Details, IP, User agent.

**Status:** Per Code rollup, `/platform/admin/audit` exists. **PARTIAL**.

### 12.6 · Billing and Usage · `/tenant/[slug]/admin/billing`

**Block layout:**

- Block AB1 · Current period summary
- Block AB2 · Usage breakdown (by zone, by agent, by program)
- Block AB3 · Invoice history

**Status:** Missing. **MISSING**. [P2 Series A].

### 12.7 · Steward anchoring

Steward rail collapsed-narrow. Per File 04 Section 3.4, Steward is less proactive than other agents — summoned when user needs help. Opening prompt per sub-surface per File 04 Section 3.5.

### 12.8 · Gaps with priority

- [P0 demo-critical] Users sub-surface end-to-end (provisioning with Clerk invite)
- [P1 seed-critical] Data Connectors management
- [P1 seed-critical] Entitlements management
- [P1 seed-critical] Audit Log with compliance export
- [P1 seed-critical] Steward anchoring with summonable pattern
- [P2 Series A] Billing and Usage

---

## Section 13 · Intelligence library · `/intelligence` and `/tenant/[slug]/intelligence/patterns/[slug]`

Per File 04 Section 5. File 09 covers implementation-grade detail.

### 13.1 · Intelligence library · `/intelligence`

**Purpose:** Grid of all patterns. Filter by vertical, archetype, capability, phase.

**Block layout:**

- Block IL1 · Breadcrumb + library header with editorial summary line
- Block IL2 · Filter bar (vertical / archetype / capability / phase / search)
- Block IL3 · Pattern card grid (3-col desktop)
- Block IL4 · Sentinel chat slot (expanded or rail per user preference)

**IL3 pattern card:**
- Pattern thesis line (Georgia pull-quote truncated to 2 lines)
- Meta chips (04): vertical, archetype, tier (1/2/3)
- Observation count + freshness timestamp
- Evidence count
- Confidence indicator (HIGH/MEDIUM/LOW)
- Applicability to current tenant (Active / Partial / Not Started — from graph)
- Click: navigate to pattern detail page

**Status:** Preview Intelligence shipped per PR #120. Currently shows 17 patterns (per Dr. L crawler). **PARTIAL**.

**Gaps:**
- [P0 demo-critical] Pattern count canonical and consistent (PA-07 dependency)
- [P0 demo-critical] Applicability overlay per pattern for current tenant
- [P0 demo-critical] Sentinel free-text wired per File 08 (AG-03)
- [P1 seed-critical] Pattern search with semantic matching

### 13.2 · Pattern detail (global) · `/intelligence/patterns/[slug]`

**Purpose:** Full pattern page, not tenant-scoped.

**Block layout (matches `wireframe-pattern-ambient-clinical.html` exemplar):**

- Block PD1 · Breadcrumb + pattern header
- Block PD2 · Hero thesis (pull-quote treatment)
- Block PD3 · Meta chip row (tier, vertical, archetype, observations count, evidence count, confidence, freshness)
- Block PD4 · Signature value chain SVG (if pattern has a value chain structure like Ambient Clinical)
- Block PD5 · Part A · Identity prose
- Block PD6 · Part C · Detection signals (numbered list)
- Block PD7 · Part E · Interventions (list with success rates)
- Block PD8 · Part I · Observations (composite scenario cards)
- Block PD9 · Sticky right sidebar with:
  - Section anchor nav
  - Applicable tenants chips
  - Regulatory chips (HIPAA / Part 2 / RADV / Info Blocking for clinical patterns)
  - Related patterns cross-links
  - Sentinel chat slot (collapsed rail)

File 02 specifies all 18 parts A-R for each pattern. Rich patterns render all parts. P0 patterns render at this depth; later patterns render progressively.

**Status:** Ambient Clinical exemplar exists. Other patterns partial. **PARTIAL**.

**Gaps:**
- [P0 demo-critical] 7 P0 Tier 3 patterns rendered at exemplar fidelity
- [P0 demo-critical] Bidirectional wiring — pattern page shows citing deliverables (PA-03/PA-04 dependency)
- [P0 demo-critical] Real freshness and evidence counts (PA-05/PA-06)
- [P1 seed-critical] All 13 retrofitted patterns rendered at this depth
- [P1 seed-critical] Pattern categorization correct (PA-09 — Ambient under HEALTHCARE not UNSCOPED)

### 13.3 · Pattern detail (tenant-scoped) · `/tenant/[slug]/intelligence/patterns/[slug]`

**Purpose:** Same pattern with tenant-specific overlay.

**Block layout:** Same as global PD1-PD9, plus:

- Block PD10 · Tenant-specific overlay (above PD5, below PD4):
  - Tenant integration state per stream (Active / Partial / Not started)
  - Programs in this tenant applying this pattern (cross-links)
  - Tenant-specific observations (observations contributed by this tenant)
  - Tenant-specific pressures tied to this pattern (from Tower)

**Status:** Per PR #108, bidirectional tracing wired. Active/Partial/Not Started overlay partial. **PARTIAL**.

**Gaps:**
- [P0 demo-critical] Meridian's Ambient pattern with working overlay at exemplar fidelity
- [P1 seed-critical] Tenant-specific observations rendering correctly
- [P1 seed-critical] Tenant-specific pressures linked from pattern page (cross-link with CT-05)

### 13.4 · Sentinel anchoring on Intelligence

Sentinel rail collapsed-narrow on library and pattern detail pages. Expands on click.

Sentinel opening per File 04 Section 5.5.

---

## Section 14 · Queue · `/home/queue`

### 14.1 · Purpose

User's assigned tasks across all programs, approvals, and phase-gate items.

**Primary user:** Any user — items assigned to them.

### 14.2 · Block layout

- Block Q1 · Breadcrumb + header with counts
- Block Q2 · Three sections per existing implementation (per Dr. L crawler):
  - Open tasks
  - Recent approvals (you approved)
  - Phase gates (you advanced)
- Block Q3 · Filter/sort affordance

### 14.3 · Each section

- Section header (mono label + count)
- Row list of items
- Each row: item type icon, title, context (program name), age/due indicator, open affordance
- Empty state: honest prose per section (Dr. L noted current implementation does this well: "Ask a teammate to assign you a task — or use the approval buttons on deliverables")

### 14.4 · Agent anchoring

No dedicated agent on Queue — Nexus rail from Home carries over (since Queue is Home-adjacent).

### 14.5 · Current state

Per Dr. L crawler: `/home/queue` renders cleanly with honest empty states. Status: **PARTIAL** — structure good, data empty because deliverables not yet approvable (DR-01 dependency).

**Gaps:**
- [P1 seed-critical] Queue populates once deliverable routing unblocked and approvals flow working

---

## Section 15 · Programs-adjacent · `/persons/[id]` (stakeholder pages)

### 15.1 · Purpose

Stakeholder detail pages. Per Dr. L crawler, currently all 404.

### 15.2 · Block layout

- Block SP1 · Stakeholder header (name, role, tenant, avatar)
- Block SP2 · Programs they sponsor or participate in
- Block SP3 · Recent decisions and activity
- Block SP4 · Contact affordance (email, schedule, etc.)

### 15.3 · Status

All `/persons/*` 404 per crawler. **MISSING**.

**Gaps:** [P1 seed-critical] Implement stakeholder pages per PW-07 in remediation backlog.

---

## Section 16 · External-facing surfaces

Per File 07 primarily, but implementation-grade spec lives here.

### 16.1 · Marketing Home · `abarva.ai/` (not `/home`)

**Purpose:** Unauthenticated landing. Positioning. CTA to request access or learn more.

**Block layout (per `home-page-hero.svg` from April 23 design session):**

- Block HM1 · Hero (positioning statement + clarifying line + Fabric visual + primary CTA)
- Block HM2 · Platform link + Investor link + Contact link in navbar
- Block HM3 · Composite footer with disclaimers

Minimal content beyond hero. Marketing Home is deliberately restrained.

**Status:** Per Code rollup, some home content exists. Needs refresh to match April 23 design session. **PARTIAL**.

**Gaps:**
- [P2 Series A] Implement per `home-page-hero.svg` (CD-04 in remediation backlog)

### 16.2 · Platform · `abarva.ai/platform`

**Purpose:** Public-facing explanation of how AbarVa works. Technical evaluators, investors.

**Block layout:**

- Block PL1 · Hero ("Most AI programs don't fail in execution. They fail in planning.")
- Block PL2 · Part 1 diagram embedded — problem + Fabric + outcomes (`platform-part1-problem-fabric-outcomes.svg`)
- Block PL3 · Narrative prose explaining the mechanism
- Block PL4 · Part 2 diagram embedded — five-phase mechanism (`platform-part2-mechanism.svg`)
- Block PL5 · Architecture detail (named agents, phases, knowledge layer)
- Block PL6 · CTA strip + composite footer

**Status:** Per Jake crawler, Platform page is "operational rather than marketing" with named agents, 5-phase pipeline, knowledge layer. Solid foundation. Needs diagrams embedded. **PARTIAL**.

**Gaps:**
- [P2 Series A] Embed Part 1 and Part 2 diagrams (CD-01/CD-02)
- [P2 Series A] Fabric naming pass throughout copy (CD-05)

### 16.3 · Investor · `/preview/investor` (or `abarva.ai/investors?access=TOKEN`)

**Purpose:** Token-gated investor page. Anthology-critical external artifact.

**Block layout:**

- Block IN1 · Hero positioning
- Block IN2 · Diagram 1 · Category opportunity (`investor-diagram-1-category-opportunity.svg`)
- Block IN3 · Prose on empty quadrant
- Block IN4 · Diagram 2 · Mechanism (`investor-diagram-2-mechanism.svg`)
- Block IN5 · Prose on Fabric as moat
- Block IN6 · Diagram 3 · Flywheel (`investor-diagram-3-flywheel.svg`)
- Block IN7 · Prose on compounding
- Block IN8 · Diagram 4 · Valuation curve (`investor-diagram-4-valuation-curve.svg`)
- Block IN9 · Real Today / Not Yet honesty column (Jake's praise point — keep prominently)
- Block IN10 · Team + ask + use of funds
- Block IN11 · Composite footer with disclaimers

**Status:** v1.1 per Code rollup, 85% polish. Jake reports strongest surface in the product with "Real Today / Not Yet" praised as best pre-seed he's seen. Needs four diagrams embedded. **PARTIAL**.

**Gaps:**
- [P2 Series A] Embed four diagrams (CD-03)
- [P2 Series A] Investor copy polish (EN-03)

---

## Section 17 · Current state and gaps — summary

Aggregate across sections:

- **Home** (Section 4): PARTIAL — route exists, doesn't match spec
- **Programs index** (Section 5): PARTIAL — exemplar exists, production broken
- **Program page** (Section 6): PARTIAL — exemplar exists, production broken
- **Phase page** (Section 7): PARTIAL
- **Deliverable pages** (Section 8): PARTIAL — Rich + Stub exemplars exist, production broken
- **Maestro Intake** (Section 9): PARTIAL — exists but templated per crawler
- **Control Tower** (Section 10): PARTIAL — richest surface, drill-ins broken
- **Tower sub-surfaces** (Section 11): MOSTLY MISSING — 4 of 5 stubs
- **Admin** (Section 12): PARTIAL — landing + users exist, rest stub
- **Intelligence library** (Section 13): PARTIAL — shipped but needs depth
- **Queue** (Section 14): PARTIAL — structure good, empty due to upstream
- **Stakeholder pages** (Section 15): MISSING — all 404
- **Marketing Home** (Section 16.1): PARTIAL
- **Platform page** (Section 16.2): PARTIAL — needs diagrams embedded
- **Investor page** (Section 16.3): PARTIAL — strongest, 85% polish

Of surfaces specified:
- 0 BUILT
- 12 PARTIAL
- 3 MISSING (Tower sub-surfaces count as 1 collectively)

P0 demo-critical work concentrates in: Home, Programs index, Program page, Deliverable pages, Maestro Intake, Control Tower, Intelligence pattern detail. Plus dependencies on File 08 agent contract and remediation backlog routing fixes.

---

## Section 18 · Pre-decided items — don't re-ask

In addition to File 01 Section 15 (global) and File 08 Section 17 (agent contract):

- **Composition from 15 primitives:** all surfaces compose from the component library. New primitives added only when needed and logged in a library PR.
- **Drawer specifications fixed:** 72% viewport width, 200ms slide-in, 150ms slide-out, ESC/outside-click/close to dismiss, URL fragment preserves state.
- **Agent rail behavior:** collapsed-narrow default 40-60px, expands to 320-400px on click, mutual exclusivity with document sidebar.
- **Citation grammar fixed:** inline superscript for evidence [E1] [E7], pill chips for patterns/programs/deliverables, confidence indicators on every citation.
- **Evidence drawer behavior fixed:** opens over page, dismissible, bidirectional link to pattern.
- **Approval flow fixed:** confirmation modal required, decision log entry on approval, gate readiness updates.
- **Stub is first-class:** never 404, never "coming soon," always shows activation conditions honestly.
- **Three render tiers fixed:** Rich (all components per exemplar), Outline (reduced components, still substantive), Stub (scheduled with activation conditions).
- **State variants required:** every block spec includes loading, empty, error, success states.
- **Responsive breakpoints:** desktop ≥1024px, tablet 768-1023px, mobile <768px.
- **Tenant chrome always visible:** composite footer on every tenant surface, tenant chip in navbar.
- **Demo-rendering disclaimer on Rich deliverables:** per File 01 Section 15.
- **Authorship disclaimer on patterns:** per File 01 Section 15.

---

## Section 19 · Agent Autonomy Charter (for this file)

### 19.1 · Autonomous authority — self-authorize and merge

**Claude Code self-authorized scopes for File 09:**

- Implementing any surface per the layout specified in Sections 4-16
- Adjusting block composition when the spec allows discretion (marked in spec as "or equivalent")
- Implementing state variants per the specs
- Implementing responsive breakpoints per the specs
- Wiring agent rail behavior per File 04 Section 2.4/3.4/4.4/5.4 and File 08
- Implementing drawer behaviors per Section 18
- Fixing integrity-level issues (broken links, placeholder strings, missing disclaimers) on any surface
- Accessibility improvements
- Performance optimizations that don't change the visible composition
- Minor copy edits that don't change the argument or claim
- Adding a new component to the component library when needed by a surface implementation (requires companion library PR)

**Codex self-authorized scopes for File 09:**

- Implementing data contracts that surfaces depend on (API shapes for KPIs, pressure cards, deliverable rows, pattern cards, etc.)
- Wiring File 08 agent contract to the surfaces where agents are anchored
- Implementing graph queries supporting cross-links and bidirectional wiring
- Migrations supporting new fields surfaces require
- Fixing routing/auth issues per remediation backlog DR-01 through DR-10

### 19.2 · Requires Anand sign-off before merge

- Changes to the block-level layout of any surface (e.g., moving or removing a block specified in this file)
- Changes to the 15-primitive component library (visual or interaction changes to primitives)
- Changes to the drawer specifications
- Changes to agent voice renderings beyond what Sections 4-13 specify
- Changes to the pre-decided items in Section 18
- New surfaces not specified in this file
- Copy changes that affect positioning, pitch, or investor-facing claims
- Canonical disclaimer changes (per File 01 Section 15)

### 19.3 · Reporting protocol

Per File 08 Section 18.3. Matrix per cycle. No aggregate percentages. Partial acceptable if declared.

For this file, the matrix includes:
- Surface (from Sections 4-16)
- Block (from block-level specs)
- Requested (from acceptance criteria)
- Actual state (COMPLETE / PARTIAL / DEFERRED / NOT STARTED)
- PR reference
- Crawler persona test result (PASS / FAIL / NOT YET TESTED)

### 19.4 · PR commit discipline

Every PR references File 09 sections it implements. Commit messages include `addresses-F09-S{section}`. If a PR also addresses File 01 failure modes or File 08 agent contract items, include those references too.

### 19.5 · Escalation paths

Per File 08 Section 18.5. Same protocol.

### 19.6 · Definition of done

A surface section from this file is DONE when:

- Every block specified is implemented with the composition indicated
- State variants per Section 18 are present (loading, empty, error, success)
- Responsive breakpoints work per Section 18
- Agent anchoring wired per File 04 and File 08
- Integrity gates pass (no broken links, no placeholder strings, disclaimers present)
- At least one crawler persona test passes against the surface
- No crawler persona test fails because of this surface
- PR merged and deployed

### 19.7 · Collaboration between Codex and Claude Code

Surfaces depending on data contracts (e.g., Tower pressure cards depending on pressure-card API) follow integration contract pattern from the April 24 remediation handoff Part 4. Owner of record per section table leads; secondary reviews.

### 19.8 · Continuous Execution Protocol

This file's cycles follow File 08 Section 19 verbatim. `CYCLE_STATE.md` at the repo root is the authoritative cycle-position record. Status emission cadence applies (every PR, every CI failure, every state change, every 30 min active work). Continuation default applies — after every unit of work, pull the next item from the committed queue and continue without waiting for user input unless explicitly blocked per File 08 Section 19.5 escalation thresholds. Session kickoff discipline applies — every new session begins with read CYCLE_STATE.md, emit STATUS, execute next item. Prohibited behaviors per File 08 Section 19.8 apply — stopping mid-cycle without signal, silent scope expansion or reduction, skipping status emissions are violations that Anand will call out.

---

## Section 20 · Execution discipline

**Ownership:** Claude Code primary. Codex secondary for data contracts the surfaces depend on.

**Dependencies:**
- File 08 agent contract must be at least at Stage 1-3 implementation before agent anchoring feels substantive on any surface
- Routing/auth fixes from remediation backlog (DR-01 through DR-10) must be in before surfaces can be crawled end-to-end
- File 02 pattern library must be at depth before Intelligence sections (13) feel credible
- File 03 knowledge layer must populate for Tower KPIs and pressure cards to surface real data

**Execution order:**

Cycle 1 (demo-viability P0):
1. Deliverable routing and session fixes (remediation backlog DR-01 through DR-10) — unblocks everything
2. Program page (Section 6) for Morrison and Ambient Clinical — the demo spine
3. Deliverable pages Rich (Section 8) for Morrison D17, D19 and Ambient D01, D17 — the demo substance
4. Control Tower (Section 10) polish and drill-in fixes — executive surface
5. Nexus + Sentinel free-text wiring per File 08 — makes agent claims true
6. Home (Section 4) per spec — acquisition-to-product arc
7. Pattern detail pages (Section 13) for P0 patterns — moat evidence
8. Maestro Intake (Section 9) with GO/REFINE/REDIRECT — front door

Cycle 2 (seed-critical P1):
9. Admin sub-surfaces (Section 12)
10. Tower sub-surfaces (Section 11) — Vendor Portfolio first as pattern
11. Remaining pattern detail depth
12. Queue population (Section 14)
13. Stakeholder pages (Section 15)
14. Atlas + Steward free-text wiring per File 08

Cycle 3 (experience and polish P2):
15. Marketing surfaces (Section 16) with diagrams embedded
16. Advanced interactions (multi-user workshop, filter enhancements)
17. Performance optimization
18. Mobile responsive polish

**Target timeline:** Cycle 1 is 2 weeks of focused parallel work. Cycle 2 is 1-2 weeks. Cycle 3 is 1-2 weeks.

**Verification:** Crawler persona re-runs (Jake, Dr. L, Marcus T) at the end of each cycle. Every persona must be able to reach their critical surfaces and receive substantive responses per File 08.

---

## Section 21 · One-line handoff

> Every surface in AbarVa composes from 15 primitives, renders 4 state variants, anchors its zone's agent per File 08, shows honest empty states, enforces tenant isolation, and never 404s or strings placeholder text. Sections 4-16 specify block-level layout for each surface. Pre-decided items in Section 18 — don't re-ask. Apply autonomy charter in Section 19. Follow Continuous Execution Protocol from File 08 Section 19.

---

*End of File 09 · Per-Surface UI Pattern Backlog.*
