# C11 · Composite Home Template + 4 Instantiations

**The landing page for every composite tenant. When Prat logs into the composite Target-analog tenant for the first time, this is the surface that greets him. Not a dashboard. Not a menu. The home page is the briefing plus portfolio plus active program context — all shaped by his executive profile.**

**April 21, 2026 · Wave 3 · For Codex execution**

Reads alongside:
- `whats-changed-briefing-engine.md` — the briefing that renders at the top of this page
- `executive-profile-system.md` — the profile that shapes personalization
- Per-tenant intelligence layer overlays — the data this page reads

---

## Part 1 · What this page is

### 1.1 · The anti-dashboard

Traditional enterprise software greets the user with a dashboard of metrics or a menu of capabilities. AbarVa's composite home is neither. It is a briefing surface that puts the user into *their world as it stands right now* within 4 minutes of reading.

The structure (top to bottom):

1. **Opening greeting** — personalized by executive profile, voice-shaped
2. **Briefing** — the 4-minute what's-changed briefing (from Briefing Engine)
3. **Portfolio glance** — the active programs in 2-3 lines each with health signals
4. **Stakeholder lens** — the executives the user most interacts with, with recent-activity context
5. **Drill-through affordances** — to individual programs, people, patterns, contradictions

### 1.2 · The demo moment

Prat lands on this page. The first thing he reads is a greeting that uses his name and opens with a frame he recognizes (compound value, platform leverage). The briefing he scrolls through is specific to his world — not generic retail news, but *his* commitments, *his* programs, *his* priorities, with peer moves he hadn't seen.

The third briefing item makes him pause. He asks "how did you know that?" — the Anticipation moment.

He scrolls down past the briefing to the portfolio glance. Three active programs, each with a one-line status and a health signal. The owned-brand program shows yellow — attention needed. He clicks in.

By the end of 90 seconds on the home page, Prat has formed an impression: this isn't AI theater, this is something that has been paying attention to his world and organized it for him.

### 1.3 · Why one template, four instantiations

Every composite tenant gets the same template structure. The data and personalization differ per tenant and per user. This means:

- One React component hierarchy to build and maintain
- Tenant-specific data loaded via the existing intelligence layer
- Executive profile shapes voice, frames, and emphasis
- Four instantiations = Keystone, Apex, Meridian, First Capital (each with their four composite executives as user-personas)

---

## Part 2 · Design system · must respect

The AbarVa design system is specific and intentional. Every element in this page must honor it. No Tailwind stock components. No generic shadcn patterns. No gradient purple anywhere.

### 2.1 · Typography

- **Wordmark:** Georgia serif — "Abar" 17px 800 white, "Va" 23px 900 teal
- **Page headings (H1):** Georgia serif, 28-32px, white, tight line-height (1.1)
- **Section headings (H2):** DM Sans 18-20px, 700, white, letter-spacing slightly tightened
- **Intelligence names / labels:** JetBrains Mono, 11px, teal, UPPERCASE, letter-spacing 0.05em
- **CXO questions / section taglines:** DM Sans 16-18px, 600-700, white
- **Body text:** DM Sans 14-15px, 400-500, warm off-white (#E8E8E8 or similar, never pure white)
- **Small labels / metadata:** DM Sans 11-12px, 600, teal or warm off-white 70% opacity
- **Nav links:** DM Sans 14px 600 white → 700 teal on hover
- **Tagline usage:** DM Sans 10px 700 white, uppercase-when-present

### 2.2 · Color palette

- **Background:** near-black (not pure black — something like #0A0A0B or #0D0E10)
- **Card backgrounds:** subtle elevation (e.g., #13141A, with 1px border of #1F2028)
- **Accent — teal:** the existing brand teal (match the wordmark color)
- **Text primary:** warm off-white (#E8E8E8)
- **Text secondary:** warm off-white 60-70% opacity
- **Health signals:** avoid red-yellow-green stoplight cliche. Use: teal (good), amber (attention), soft red (concern) — but sparingly, more through text than icons

### 2.3 · Spatial principles

- Generous whitespace — let content breathe
- Intentional asymmetry — the briefing section wider than the portfolio glance, not equal columns
- Vertical rhythm — consistent spacing between sections, but scale the spacing for hierarchy (more space before/after major sections)
- Mobile: single column; desktop: primary content column with optional right-rail context

### 2.4 · Motion

- Subtle stagger on initial content reveal (100ms delays between sections)
- No bouncy transitions, no modal overlays for standard interactions
- Hover states should feel deliberate — gentle color shifts, micro-underlines on interactive text
- Loading states: skeleton shimmer in brand color, not generic gray

---

## Part 3 · Page structure and components

### 3.1 · Section 1 · Top nav and opening

**Top navigation (persistent across authenticated surfaces).**

Left side:
- AbarVa wordmark (links to composite home)
- Current tenant name in small JetBrains Mono, 11px, teal, uppercase (e.g., "APEX RETAIL GROUP")

Center:
- Tenant context switcher (if user has access to multiple tenants)
- Primary surface switcher: Briefing · Programs · Intelligence · Portfolio · Admin
  - Each a DM Sans 14px 600 link
  - Current surface: 700 teal
  - Other surfaces: white → teal on hover

Right side:
- Search (Cmd+K trigger)
- User identity (avatar or initials, clickable for profile/settings)

**Opening greeting (below nav, above briefing).**

Structured as:
- Small timestamp: "Tuesday, April 21, 2026 · 9:42 AM"
- Personalized greeting: "Good morning, Prat." (Georgia, 28px, white)
- One-line framing: "Four things worth about four minutes of your attention this morning — one of them is genuinely new." (DM Sans, 16px, warm off-white, 80% opacity)

The framing line comes from the briefing's opening_line field. Voice-shaped per executive profile.

### 3.2 · Section 2 · Briefing (primary content)

The What's-Changed Briefing (from Briefing Engine, B1) renders here as the primary content of the page.

**Layout.**
- Single column, max-width ~720px for readability
- Briefing sections rendered in composition order (not fixed)
- Each section has: category label (JetBrains Mono 11px teal uppercase), section items below

**Per-briefing-item render.**
- **Headline:** DM Sans 17-18px, 700, white
- **Context paragraph:** DM Sans 14-15px, 400-500, warm off-white, readable line-height (1.6-1.7)
- **Why it matters:** DM Sans 14px, 500, white (slightly emphasized vs context)
- **Recommended action:** italicized or delineated with a teal left border, DM Sans 14px, 500
- **Drill-through affordances:** subtle link underlines on entities mentioned (KPIs, initiatives, people, patterns)

**Interaction model.**
- Click an entity link → navigate to that entity's detail page (C12 for executives, C14 for KPIs, C15 for patterns, etc.)
- Click "Ask a follow-up" at the bottom of each item → opens the conversational surface with that item as context
- Dismiss item (subtle X or "not relevant") → logged for adaptation
- Mark as read — implicit on scroll past

**Empty state.**
- If no briefing has generated yet: a simple "Your briefing will appear here once we've synthesized this morning's changes" — don't fake a briefing.

**Stale briefing indicator.**
- If briefing is >12 hours old, small JetBrains Mono label "BRIEFING · 14 HOURS OLD · GENERATING REFRESH"

### 3.3 · Section 3 · Portfolio glance (right-rail on desktop, below briefing on mobile)

A compact view of the user's programs with health signals.

**Layout.**
- On desktop: right sidebar, ~320px wide, docked to briefing column
- On mobile: horizontal-scroll cards or vertical list below briefing

**Per-program card.**
- Program name (DM Sans 14px 700 white)
- Phase indicator (JetBrains Mono 11px teal uppercase: "PHASE 3 · DECISION" etc.)
- Health signal (single word: "On track" / "Attention" / "At risk" — teal / amber / soft red, never red-yellow-green stoplight)
- One-line status (DM Sans 12px 500 warm off-white)
- Most recent update timestamp (DM Sans 11px 600 teal)

**Click target.**
- Whole card → navigate to program detail page

**Limit.**
- Top 4-5 programs by user relevance (owned, sponsored, or heavily-engaged)
- "View all N programs" link at bottom of list → program index

### 3.4 · Section 4 · Stakeholder lens (secondary content, below briefing)

A compact surface showing the executives the user most interacts with.

**Layout.**
- Horizontal row of 4-6 executive cards on desktop
- Vertical stack on mobile

**Per-executive card.**
- Avatar or initials in circle (subtle background)
- Name (DM Sans 14px 700 white)
- Role (DM Sans 12px 500 warm off-white)
- Recent-context tag (JetBrains Mono 10px teal: "3 OPEN DECISIONS" or "NEW COMMITMENT LANDED" or "MEETING IN 2 HOURS")

**Click target.**
- Card → navigate to that executive's profile page (C12)

**Selection logic.**
- Executives the user sponsors with, reports to, or has most interaction-log activity with
- Maximum 6 shown; overflow link "See full stakeholder map"

### 3.5 · Section 5 · Footer / context bar

A low-emphasis bar at the bottom:
- Data freshness indicator ("Intelligence layer last refreshed 14 minutes ago")
- Small trust indicators (e.g., "Your data stays in your tenant. Read our architecture.")

No social proof garbage. No testimonial carousel. This is a working surface, not a marketing page.

---

## Part 4 · Data dependencies

Each component pulls from specific data sources. Component builds with loading states; data renders when available.

### 4.1 · Opening greeting data

- **Source:** Executive Profile System (Drop 5)
- **Fields used:** preferred_name, communication_style (framing preferences), decision_patterns (first-question patterns)
- **Fallback:** If profile absent, use "Good morning" with no name; generic professional framing

### 4.2 · Briefing data

- **Source:** What's-Changed Briefing Engine (B1)
- **Fields used:** entire Briefing entity with populated sections
- **Fallback:** Graceful empty state if no briefing available

### 4.3 · Portfolio glance data

- **Source:** existing programs data (initiatives tagged as active, phase metadata)
- **Computation:** join on user's program membership; health signal derived from latest operating review or phase-gate status
- **Fallback:** "No active programs yet" state

### 4.4 · Stakeholder lens data

- **Source:** executive profiles + interaction log + program relationships
- **Computation:** union of (people who sponsor programs user is on) + (people user has recent interactions with) + (people user reports to)
- **Fallback:** Render empty if no data

### 4.5 · Footer data

- **Source:** intelligence layer metadata (last refresh timestamps per telemetry source)
- **Computation:** minimum freshness across sources in user's scope

---

## Part 5 · Four tenant instantiations

The template is one component. The four instantiations differ only in:

1. Tenant context (the tenant ID determines data scope)
2. Per-tenant branding allowances (none significant — AbarVa brand stays primary)
3. Per-tenant sector-specific content where it surfaces through data

Specifically:

### 5.1 · Keystone Energy Holdings · composite home

- Opening greeting for Jonathan Aldridge: "Morning, Jonathan."
- Briefing leads with regulatory and operational items (Jonathan's preferred frames)
- Portfolio glance shows Data Center Load Interconnection Program, Grid Modernization, Storm Response Coordination, AI Platform Program
- Stakeholder lens shows CEO Marcus Kittrell, Rachel Navarro (Chief Regulatory Officer), James Oppenheim (relevant operational role), Derek Reyes (workforce)

### 5.2 · Apex Retail Group · composite home

- Opening greeting for Prat Vemana-analog (Marcus Whitfield as CCO, or Prat himself as CIPO when demoing): "Morning, Marcus." / "Morning, Prat."
- Briefing leads with KPI drift on digital/customer metrics, peer moves, pattern shifts
- Portfolio glance shows Digital Commerce Modernization, Owned Brand Expansion, Customer Experience Transformation, AI Platform Program
- Stakeholder lens shows CEO, CFO Morrison, CMO Chen-Matsuda, CDO (Digital), and other Executive Committee members

### 5.3 · Meridian Health System · composite home

- Opening greeting for Dr. Linda Chen-Winters: "Good morning, Dr. Chen-Winters."
- Briefing leads with MLR movement, VBC commitment status, MA star rating, clinical quality
- Portfolio glance shows VBC Progression Program, Revenue Cycle Modernization, Clinical Excellence, Health Plan Growth, AI Platform Program
- Stakeholder lens shows CEO, CFO, CMO, Chief Population Health Officer, Health Plan leadership

### 5.4 · First Capital Financial · composite home

- Opening greeting for Daniel Kovač: "Morning, Daniel."
- Briefing leads with NIM trends, regulatory exam status (with legal-privileged treatment), credit quality, deposit franchise
- Portfolio glance shows BSA/AML Modernization (legal-privileged treatment), Deposit Franchise Protection, Cross-Franchise Deepening, Wealth Expansion, AI Platform Program
- Stakeholder lens shows CEO, President, Chief Risk Officer, Chief Compliance Officer, Head of Wealth

---

## Part 6 · Implementation specs

### 6.1 · Routing

- URL pattern: `/app/t/[tenant-id]` or `/app/tenants/[tenant-id]` (respect existing conventions)
- Default landing after login: user's default tenant's composite home
- Tenant switcher in nav: dropdown listing user-accessible tenants

### 6.2 · Component hierarchy

```
<CompositeHome tenantId={id} userId={user.id}>
  <TopNav tenant={tenant} currentUser={user} />
  <OpeningGreeting profile={userProfile} briefing={briefing} />
  <BriefingSurface briefing={briefing} onItemInteract={logInteraction} />
  <PortfolioGlance programs={userPrograms} />
  <StakeholderLens executives={stakeholders} />
  <ContextFooter freshness={dataFreshness} />
</CompositeHome>
```

### 6.3 · Data loading strategy

- Server-side render the static scaffolding
- Client-side fetch the briefing (may still be generating)
- Prefer progressive enhancement: page visible with structure immediately, briefing and data fill in
- Show skeleton loaders for each section while data fetches
- Never show "loading..." spinners — use subtle shimmer placeholders in brand color

### 6.4 · Accessibility

- Semantic HTML throughout (`<nav>`, `<main>`, `<section>`, `<article>`)
- All interactive elements keyboard-accessible
- Color contrast ratios AA minimum (check warm off-white on near-black)
- Motion respects prefers-reduced-motion

### 6.5 · Responsive breakpoints

- Desktop large: ≥1280px — primary content + right-rail layout
- Desktop: 1024-1279px — same layout, narrower columns
- Tablet: 768-1023px — primary column full width, right-rail becomes horizontal scroll
- Mobile: <768px — single column stack, all sections full-width

### 6.6 · Performance

- First meaningful paint ≤1.5 seconds on broadband
- Initial JavaScript bundle scoped to home page essentials (don't ship all routes)
- Images (avatars) lazy-loaded
- Briefing data progressive: core text first, metadata (evidence counts, linked entities) second

---

## Part 7 · Interaction specs

### 7.1 · Entity link interactions

Throughout the briefing, entities are clickable links. Clicking navigates to:
- Person → Executive profile page (C12)
- KPI → KPI detail page (C14)
- Pattern → Pattern detail page (C15)
- Initiative → Initiative detail page (C13)
- Contradiction → Contradiction detail page (part of Contradiction Engine surface)

Entity links are visually subtle — underline on hover, teal color, no other chrome. Don't chunk the text with buttons and badges.

### 7.2 · Follow-up query

At the bottom of each briefing item, a subtle affordance: "Ask a follow-up →"

Clicking opens the conversational surface (existing AbarVa agent chat) with:
- The briefing item pre-loaded as context
- A ready-to-send starter like "Tell me more about this"
- The user can refine or send as-is

### 7.3 · Program card click

Navigates to that program's detail page (C17).

### 7.4 · Executive card click

Navigates to that executive's profile page (C12).

### 7.5 · Tenant switcher

Dropdown menu in nav. Options are tenants the user has access to. Selecting switches tenant context; URL updates; page re-renders with new tenant data.

---

## Part 8 · Edge cases and empty states

### 8.1 · New user, no data yet

First login on a fresh tenant before data ingestion completes:
- Greeting still personalized
- Empty state in briefing area: "Your intelligence layer is still populating. You'll see your first briefing once ingestion completes — typically 24-48 hours."
- Portfolio glance shows programs if any exist, otherwise empty state with helper text
- Stakeholder lens shows executives from directory if populated

### 8.2 · Briefing generation failed

Rare. Show:
- Last known good briefing with timestamp
- Small retry affordance

### 8.3 · User has no active programs

Portfolio glance shows:
- Empty state copy explaining programs haven't been initiated yet
- Link to start a program intake conversation

### 8.4 · Stale intelligence layer

Context footer shows honest freshness. If very stale (>24 hours for a tenant that should refresh daily), small warning indicator.

---

## Part 9 · Testing

### 9.1 · Visual regression tests

- Snapshot tests across all four tenant instantiations
- Mobile, tablet, desktop breakpoints
- With briefing, without briefing, with empty states

### 9.2 · Interaction tests

- Click through each entity link type
- Follow-up query flow
- Tenant switcher
- Program card navigation
- Executive card navigation

### 9.3 · Data loading tests

- Initial render with no data
- Progressive data fill
- Error states on data fetch failure
- Stale data indicators

### 9.4 · Personalization tests

- Different executive profiles produce different opening lines
- Voice shaping visible in greeting and briefing framing
- Appropriate frames used per executive

---

## Part 10 · Non-goals for this drop

- No editing or administration surfaces (Steward territory — C26)
- No cross-tenant synthesis view (Atlas territory — C24-C25)
- No complex dashboard widgets (this is intentionally not a dashboard)
- No email/notification integration (future)
- No A/B testing framework (future)
- No customizable layout (template is opinionated; per-user customization is future)

---

## Part 11 · Ingestion notes for Codex

### 11.1 · Dependencies

This page depends on:
- Briefing Engine schema and data (B1 from Wave 2)
- Executive Profile schema and data (Drop 5 from Wave 1)
- Tenant intelligence layer overlays for all four composites
- Existing programs/initiatives schema

If any dependencies aren't yet ingested, this page can scaffold with empty states and fill in as they land.

### 11.2 · Design system compliance

Every component must use the AbarVa design system:
- Typography (Georgia, DM Sans, JetBrains Mono)
- Color palette (near-black, warm off-white, teal accent)
- No generic Tailwind stock components
- No purple gradients, no shadcn defaults
- No stoplight red-yellow-green (use teal/amber/soft-red only sparingly)

If design system tokens aren't yet extracted to a centralized theme file, that extraction is part of this work (small scope).

### 11.3 · Incremental delivery

Acceptable to ship in two iterations if needed:
- Iteration 1: Template + data loading + opening greeting + briefing + portfolio glance
- Iteration 2: Stakeholder lens + polish + tenant instantiations

Both iterations deliver user-visible value.

### 11.4 · Coordination with other wave 3 packs

Several wave 3 pages deep-link from this one. Landing pages first (C11 + C21 Briefing) enables the other pages (C12 executive profiles, C14 KPI detail, C15 pattern detail) to be built without guessing at navigation patterns.

---

**END C11 · COMPOSITE HOME TEMPLATE**

*Demo-critical. The first surface Prat sees when he logs in. Template-driven across four composite tenants. Graceful degradation when dependencies not fully landed.*
