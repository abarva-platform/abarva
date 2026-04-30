# INT-2 — J1 Oriented Browse · Detailed Design Spec

**Slice:** INT-2 (per `INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md` Part G)
**Status:** Detailed design v1 — awaiting founder review
**Author:** Claude Opus 4.7 (with founder review)
**Date:** 2026-04-30
**Depends on:** INT-1 (merged); spine doc; pattern manifest; canonical FAILURE_MODES table

> **Purpose of this document.** Implementation-grade spec for INT-2,
> the J1 oriented-browse slice. Replaces the prose in the spine doc
> §C.3 + §D.J1 with testable requirements, formal state, wireframes,
> IA, workflows, edge cases, acceptance criteria, and a test plan.
>
> **Scope discipline.** INT-2 ships:
>   1. The topic content registry (10 thesis-led AI-transformation
>      topics).
>   2. `/intelligence/topics` — topic grid (replaces INT-1.7
>      placeholder).
>   3. `/intelligence/topics/[topicId]` — topic deep-dive page.
>   4. Enhanced `/intelligence/failure-modes/[slug]` — extends the
>      INT-1.7 placeholder with cited patterns + contradictions
>      surfaced inline.
>   5. Cross-references between topics, failure modes, and patterns.
>
> INT-2 does NOT ship:
>   - Pattern detail rendering (INT-3 territory). Pattern citations
>     link to existing `/intelligence/patterns/<slug>` which renders
>     pre-INT-3 content.
>   - Sentinel chat from topic context (INT-5 territory). "Ask
>     Sentinel" affordance opens the existing chat at
>     `/intelligence/ask`.
>   - Tenant-context overlays on topics (INT-7 + INT-11 territory).
>     INT-2 is corpus-only.
>   - Mode-comparison artifact (INT-5).

---

## Part 1 — Premise and scope

### 1.1 What INT-2 delivers

INT-2 closes the "browse mode without a thesis" failure mode (#7) and
the "search-results page" failure mode (#5). The J1 surface gives the
user two anchored entry points after they leave J0:

- **Failure-mode anchored** — clicked a J0 card; lands on the
  failure mode's J1 surface with full narrative + cited patterns +
  cited contradictions + cited research surfaced inline.
- **Topic anchored** — clicked "Browse topics →" from J0; lands on a
  10-topic grid with each topic's thesis up top; clicks into a
  topic for the deep-dive.

Both surfaces share a common discipline: **synthesis up top, evidence
below**. The user reads AbarVa's point of view first; the corpus depth
backs it. This is the wire that prevents J1 from drifting into
search-results shape.

### 1.2 Failure modes prevented at this stage

| # | Failure mode | How INT-2 prevents it |
|---|---|---|
| 7 | Browse mode without a thesis | Topic registry's `thesis` field is the headline of every topic page. Cards in the grid show the thesis as primary content, not the title alone. |
| 5 | Search-results page | J1 surfaces synthesize first (failure-mode narrative or topic thesis), surface evidence (patterns / contradictions / research) below in structured groups — not as a flat list. |
| 4 | Voice drift | Topic content is written in Sentinel's librarian voice (citation-first, contradiction-aware). Same voice rules as the J0 cards (no marketing). Validation enforces. |

### 1.3 Pilot-readiness floor

INT-2 ships when ALL of the following are true:

- All 10 topic entries are authored, founder-reviewed, signed off
  (`lastReviewedBy` is not the literal string `"TBD"` or
  Claude-draft).
- Topic registry validation tests pass (see §10).
- `/intelligence/topics` and `/intelligence/topics/<topicId>`
  render with corpus depth visible on cold load.
- `/intelligence/failure-modes/<slug>` is enhanced beyond the
  INT-1.7 placeholder — pattern citations resolve to displayable
  metadata, contradictions surface inline, research anchors render
  with source labels.
- Cross-references between topics ↔ failure modes ↔ patterns work
  end-to-end without 404s.
- Telemetry events fire on the documented triggers (§2.6).
- E2E coverage for the new surfaces.
- No regressions on INT-1 surface (`/intelligence`, J0 card grid,
  affordances).

---

## Part 2 — Functional requirements

Each requirement has a stable ID `INT-2-FR-NNN`. Requirements are
testable: each maps to at least one acceptance check in §10.

### 2.1 Topic content registry

- **`INT-2-FR-001`** A typed `J1_TOPICS` registry MUST exist at
  `src/lib/intelligence/j1-topics.ts` containing exactly 10
  `TopicEntry` records.
- **`INT-2-FR-002`** Each `TopicEntry` MUST have:
  - `topicId` — stable string, kebab-case, unique
  - `title` — display title, ≤60 chars
  - `thesis` — AbarVa's point of view, 2-4 sentences, ≤300 chars
  - `whatIndustryGetsWrong` — contradiction-aware framing, 2-4
    sentences
  - `whatGoodLooksLike` — concrete prevention/discipline, 2-4
    sentences with phase / pattern / corpus reference
  - `associatedPatternIds[]` — pattern manifest entry IDs (≥1, ≤6)
  - `associatedFailureModeIds[]` — `FAILURE_MODES.id`s the topic
    intersects (0..3); enables topic ↔ failure-mode cross-links
  - `exampleProgramArchetypes[]` — short labels (e.g. "CDP
    activation", "Demand forecasting") that anchor the topic
    in real program shapes; ≥2
  - `lastReviewedBy` / `lastReviewedAt` — sign-off discipline
- **`INT-2-FR-003`** Every `associatedPatternIds[]` entry MUST
  resolve via `getPatternManifestEntry`. Validation test enforces.
- **`INT-2-FR-004`** Every `associatedFailureModeIds[]` entry MUST
  resolve via `FAILURE_MODES`. Validation enforces.
- **`INT-2-FR-005`** Topic content MUST NOT use marketing
  vocabulary (same forbidden list as J0: unlock, accelerate,
  leverage, empower, revolutionary, cutting-edge, game-changer,
  best-in-class, next-generation). Word-boundary regex enforces.
- **`INT-2-FR-006`** Every topic MUST reference a phase / gate /
  pattern / corpus concept concretely in `whatGoodLooksLike` (no
  abstractions). Tested via regex similar to J0.

### 2.2 `/intelligence/topics` grid

- **`INT-2-FR-010`** The route `/intelligence/topics` MUST render a
  grid of all 10 topics. Public route (no auth gate).
- **`INT-2-FR-011`** Each topic card on the grid MUST display:
  - Topic title (Cormorant Garamond serif)
  - Thesis (sans body, 2-4 sentences)
  - Depth signal: `N patterns · M failure modes · K archetypes`
- **`INT-2-FR-012`** Click on a topic card navigates to
  `/intelligence/topics/<topicId>`.
- **`INT-2-FR-013`** Page header reads **"AI transformation
  topics"** with a subhead naming AbarVa's editorial discipline
  ("organized by AbarVa's point of view, not as a wiki").
- **`INT-2-FR-014`** Page MUST be server-rendered (RSC); no
  client-side data fetching for the grid content.
- **`INT-2-FR-015`** Page MUST work without JS (cards visible,
  links followable).
- **`INT-2-FR-016`** Breadcrumb back to `/intelligence` MUST be
  present at the top of the page.

### 2.3 `/intelligence/topics/[topicId]` deep-dive

- **`INT-2-FR-020`** Route renders the topic's full deep-dive:
  thesis up top, "what industry gets wrong" + "what good looks
  like" sections, associated patterns + failure modes + program
  archetypes, "Ask Sentinel about this topic" affordance.
- **`INT-2-FR-021`** `generateStaticParams()` pre-renders all 10
  canonical topic IDs at build time.
- **`INT-2-FR-022`** Unknown `topicId` triggers `notFound()` →
  Next.js 404.
- **`INT-2-FR-023`** Page header structure (top → bottom):
  - Breadcrumb (`Intelligence → Topics → <title>`)
  - Topic title (Cormorant Garamond serif display)
  - Thesis (prominent)
  - Two-column grid on desktop: "What industry gets wrong" |
    "What good looks like" (collapses to single-column on
    mobile)
  - Associated patterns section — pattern cards that link to
    `/intelligence/patterns/<slug>` (existing INT-3-stub route)
  - Associated failure modes section — link cards back to
    `/intelligence/failure-modes/<slug>`
  - Example program archetypes — chip list
  - Affordances: "Ask Sentinel about this topic →"
    (`/intelligence/ask`), "← All topics"
- **`INT-2-FR-024`** Pattern citations render with the pattern's
  name + category (resolved via `getPatternManifestEntry`). If the
  manifest entry is missing, render an inline error chip rather
  than crashing.

### 2.4 Enhanced `/intelligence/failure-modes/[slug]`

- **`INT-2-FR-030`** Existing INT-1.7 page is enhanced — same
  layout but the "Patterns · N" section now renders pattern cards
  (not just monospace IDs) with name + category + link to
  `/intelligence/patterns/<slug>`.
- **`INT-2-FR-031`** New section: "Related topics" — shows topics
  whose `associatedFailureModeIds[]` includes this failure mode's
  id. Renders as link cards back to `/intelligence/topics/<topicId>`.
- **`INT-2-FR-032`** Existing INT-1.7 sections (research anchors,
  example scenarios, why-it-kills, what-good-looks-like, INT-2
  notice) MUST be preserved. The "Coming with INT-2" notice gets
  REPLACED with a brief contextual nav block ("Explore related
  topics ↓ · Ask Sentinel about this →").

### 2.5 Cross-references and routing

- **`INT-2-FR-040`** From a topic deep-dive, clicking an
  associated pattern navigates to `/intelligence/patterns/<slug>`
  (existing route — INT-3 enhances; INT-2 just links).
- **`INT-2-FR-041`** From a topic deep-dive, clicking an
  associated failure mode navigates to
  `/intelligence/failure-modes/<slug>`.
- **`INT-2-FR-042`** From a failure mode page, clicking a related
  topic navigates to `/intelligence/topics/<topicId>`.
- **`INT-2-FR-043`** All cross-reference links MUST be `<a>`
  elements (semantic, no JS click handlers required to navigate).

### 2.6 Telemetry

- **`INT-2-FR-050`** On `/intelligence/topics` page load, emit
  `j1_topics_loaded` with `{ visitor_type, tenant_key,
  topic_count, time_to_paint_ms? }`.
- **`INT-2-FR-051`** On topic-card click in the grid, emit
  `j1_topic_clicked` with `{ topic_id, rank_in_grid,
  time_to_click_ms }`.
- **`INT-2-FR-052`** On `/intelligence/topics/[topicId]` page load,
  emit `j1_topic_deep_dive_loaded` with `{ topic_id, visitor_type,
  tenant_key }`.
- **`INT-2-FR-053`** On pattern citation click within a topic
  page, emit `j1_topic_pattern_clicked` with
  `{ topic_id, pattern_id }`.
- **`INT-2-FR-054`** On failure-mode citation click within a topic
  page, emit `j1_topic_failure_mode_clicked` with
  `{ topic_id, failure_mode_id }`.
- **`INT-2-FR-055`** On "Ask Sentinel about this topic" click,
  emit `j1_topic_open_sentinel_clicked` with `{ topic_id }`.
- **`INT-2-FR-056`** On `/intelligence/failure-modes/[slug]` page,
  add `j1_failure_mode_topic_clicked` for clicks on the new
  "Related topics" section.

---

## Part 3 — Non-functional requirements

### 3.1 Performance

- **`INT-2-NFR-001`** `/intelligence/topics` First Contentful Paint
  <1.0s on Fast 3G.
- **`INT-2-NFR-002`** `/intelligence/topics/[topicId]` LCP <1.8s
  on Fast 3G.
- **`INT-2-NFR-003`** Topic registry adds <30KB to JS bundle
  (gzipped). Cards render server-side; no client-side hydration
  for content.
- **`INT-2-NFR-004`** All 10 topic deep-dive pages
  pre-rendered at build via `generateStaticParams()`.

### 3.2 Accessibility

- **`INT-2-NFR-010`** WCAG 2.1 AA conformance.
- **`INT-2-NFR-011`** Topic grid uses `role="list"` /
  `role="listitem"` semantics; deep-dive uses `<main>` landmark
  with `<section>` subdivisions, each with an `<h2>`.
- **`INT-2-NFR-012`** All cross-reference links are keyboard-
  focusable; focus-visible outline applies (global CSS rule).
- **`INT-2-NFR-013`** Two-column "what gets wrong" / "what good
  looks like" layout collapses to single column on mobile and
  honors `prefers-reduced-motion`.
- **`INT-2-NFR-014`** Color contrast on every text element ≥4.5:1
  body, ≥3:1 headings.

### 3.3 SEO

- **`INT-2-NFR-020`** Each topic deep-dive has a unique
  `<title>` and `<meta description>` (the topic's thesis,
  truncated to 160 chars).
- **`INT-2-NFR-021`** Topic content rendered in initial HTML
  (no client-side fetching) so crawlers see depth.

### 3.4 Authentication boundary

- **`INT-2-NFR-030`** `/intelligence/topics` and
  `/intelligence/topics/[topicId]` are public routes (corpus
  doctrine, not tenant data). Same gate-removal pattern as
  `/intelligence` per INT-1.3 D1.
- **`INT-2-NFR-031`** "Ask Sentinel about this topic" link
  navigates to `/intelligence/ask` which IS auth-gated.

---

## Part 4 — Wireframes (text-annotated)

### 4.1 `/intelligence/topics` desktop layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  AppRail (76px)  │  AppTopBar — "Intelligence · Topics"                    │
│                  ├─────────────────────────────────────────────────────────┤
│                  │  ← Intelligence                                          │
│                  │                                                         │
│                  │  AI TRANSFORMATION TOPICS                                │
│                  │                                                         │
│                  │  AI transformation topics                                │
│                  │  [Cormorant Garamond serif display, 32px,                │
│                  │   ink-black, max-width 720px]                            │
│                  │                                                         │
│                  │  What enterprises grapple with — organized by            │
│                  │  AbarVa's point of view, not as a wiki.                  │
│                  │                                                         │
│                  │  ┌─────────────────┐ ┌─────────────────┐                │
│                  │  │ Topic 1         │ │ Topic 2         │                │
│                  │  │  Title          │ │  Title          │                │
│                  │  │  Thesis text…   │ │  Thesis text…   │                │
│                  │  │                 │ │                 │                │
│                  │  │ N patterns ·    │ │ N patterns ·    │                │
│                  │  │ M FMs · K archs │ │ M FMs · K archs │                │
│                  │  └─────────────────┘ └─────────────────┘                │
│                  │  (10 cards · 2-3 cols on desktop · 1 col mobile)         │
│                  │                                                         │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

**Topic card:**
- Width: dynamic, ~340px (filling 2-col grid with 16px gap, max 1100px)
- Height: variable (content-driven), min 220px
- Title: Cormorant Garamond, 22px, weight 400, ink-black
- Thesis: DM Sans body, 13px, ink-soft, line-height 1.55, displayed in full (not truncated)
- Depth signal: mono 10px, ink-stone, baseline-aligned bottom
- Hover: border lift + shadow (matches J0 card pattern)
- Click: navigates to `/intelligence/topics/<topicId>`

### 4.2 `/intelligence/topics/[topicId]` desktop layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Intelligence · Topics · <title>                                          │
│                                                                            │
│  TOPIC                                                                     │
│  <Topic Title>                                                             │
│  [Cormorant Garamond serif display]                                        │
│                                                                            │
│  <Thesis>                                                                  │
│  [Sans body, 16px, ink-soft, max-width 640px]                              │
│                                                                            │
│  ┌──────────────────────────────────┬──────────────────────────────────┐  │
│  │ WHAT INDUSTRY GETS WRONG         │ WHAT GOOD LOOKS LIKE             │  │
│  │ <2-4 sentences>                  │ <2-4 sentences>                  │  │
│  │ [Paper-soft bg, mono kicker,     │ [Mint-tinged kicker, paper-soft  │  │
│  │  sans body 14px, ink-black]      │  bg, sans body 14px, ink-black]  │  │
│  └──────────────────────────────────┴──────────────────────────────────┘  │
│  (collapses to single-column at <768px)                                    │
│                                                                            │
│  ASSOCIATED PATTERNS · N                                                   │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐          │
│  │ Pattern Name                │ │ Pattern Name                │          │
│  │ Category · subtitle         │ │ Category · subtitle         │          │
│  │ → /intelligence/patterns/.. │ │ → /intelligence/patterns/.. │          │
│  └─────────────────────────────┘ └─────────────────────────────┘          │
│                                                                            │
│  RELATED FAILURE MODES · M                                                 │
│  [#3 The Untestable Foundation →] [#5 The Workflow That Wasn't →]          │
│  (inline link chips)                                                       │
│                                                                            │
│  EXAMPLE PROGRAM ARCHETYPES                                                │
│  [CDP activation] [Demand forecasting] [Vendor consolidation]              │
│  (chip list)                                                               │
│                                                                            │
│  ┌──────────────────────────────────────┐                                  │
│  │ Ask Sentinel about this topic →      │                                  │
│  │ [Ghost button, ink-black, primary]   │                                  │
│  └──────────────────────────────────────┘                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Enhanced `/intelligence/failure-modes/[slug]` layout

The existing INT-1.7 layout is preserved with two changes:

1. **Patterns section gains card rendering.** Currently:
   ```
   PATTERNS · 2
   pattern_ai_use_case_portfolio
   pattern_ai_governance_operating_model
   ```
   Becomes:
   ```
   PATTERNS · 2
   ┌──────────────────────────────┐
   │ AI Use Case Portfolio        │
   │ Management                   │
   │ AI Strategy & Investment     │
   │ → /intelligence/patterns/... │
   └──────────────────────────────┘
   ┌──────────────────────────────┐
   │ AI Governance Operating Model│
   │ Risk & Governance            │
   │ → /intelligence/patterns/... │
   └──────────────────────────────┘
   ```

2. **New section: Related topics.** Inserted between
   "Example scenarios" and the contextual-nav block. Renders
   topics whose `associatedFailureModeIds[]` includes the
   current failure mode. Empty state: "No topics currently
   reference this failure mode."

3. **INT-2 notice REPLACED.** The "Coming with INT-2" aside is
   removed (we're past INT-2 now); replaced with a contextual
   nav block: "Related topics ↓ · Ask Sentinel about this →".

### 4.4 Mobile layout

- `/intelligence/topics`: single-column card grid, full-bleed on mobile.
- `/intelligence/topics/[topicId]`: two-column "what gets wrong" /
  "what good looks like" collapses to single column at <768px.
  Pattern cards stack single-column. Chips wrap.

### 4.5 No-JS fallback

All routes server-render; cross-reference links are real `<a>`
elements with `href`; no JS needed for navigation. Telemetry and
hover micro-interactions degrade silently.

---

## Part 5 — State machine

INT-2 has minimal client-side state. The state model is:

```
                          ┌─────────────────────┐
                          │   J0 (INT-1)        │
                          └──────────┬──────────┘
                                     │
                  ┌──────────────────┼─────────────────┐
                  │ click J0 card    │ click "Browse   │
                  │                  │  topics"        │
                  ▼                  ▼                 │
        ┌────────────────────┐  ┌──────────────────┐   │
        │ J1 — failure-mode  │  │ J1 — topic grid  │   │
        │ /intelligence/     │  │ /intelligence/   │   │
        │ failure-modes/     │  │ topics           │   │
        │ <slug>             │  └────────┬─────────┘   │
        └────────┬───────────┘           │             │
                 │                       │ click topic │
                 │ click related         ▼             │
                 │ topic                ┌─────────────┐│
                 │                      │ J1 — topic  ││
                 ├──────────────────────│ deep-dive   ││
                 │                      │ /topics/    ││
                 │                      │ <topicId>   ││
                 ▼                      └──────┬──────┘│
        ┌──────────────────────┐               │       │
        │ J2 (INT-3 stub) —    │               │       │
        │ pattern detail or    │               │       │
        │ contradiction detail │               │       │
        └──────────────────────┘               │       │
                                               │       │
                                               ▼       │
                                       J3 (INT-5 stub) │
                                       /intelligence/ ◄┘
                                       ask
```

### 5.1 State definitions

- **`J1_FAILURE_MODE`** — `/intelligence/failure-modes/<slug>`.
  Server-rendered. Enhanced beyond INT-1.7 with cited patterns
  + related topics.
- **`J1_TOPIC_GRID`** — `/intelligence/topics`. Server-rendered
  10-card grid.
- **`J1_TOPIC_DEEP_DIVE`** — `/intelligence/topics/<topicId>`.
  Server-rendered topic page with thesis + corpus depth.
- **`NAVIGATE_TO_J2`** — clicked a pattern citation →
  `/intelligence/patterns/<slug>` (INT-3 territory).
- **`NAVIGATE_TO_J3`** — clicked "Ask Sentinel" affordance →
  `/intelligence/ask`.

### 5.2 Persistence

- **URL state.** Topic identity is in the URL
  (`/intelligence/topics/<topicId>`). No query params at INT-2.
- **No client-side state.** Pages are server-rendered; no React
  state survives a refresh.

### 5.3 Edge / error states

- **Unknown `topicId`** — `notFound()` → 404. No silent fallback.
- **Pattern manifest entry missing** for a `associatedPatternIds[]`
  entry — render an inline error chip on the topic page; log
  server-side warning. Validation test catches this at build.
- **Empty `associatedFailureModeIds[]`** for a topic — the
  "Related failure modes" section renders an empty state ("No
  failure modes currently mapped to this topic"); the section
  doesn't disappear.
- **`prefers-reduced-motion`** — no transitions on card hover or
  section expansions.

---

## Part 6 — Information architecture

### 6.1 URL structure

| URL | Surface | Owner |
|---|---|---|
| `/intelligence` | J0 cold landing | INT-1 (shipped) |
| `/intelligence/failure-modes/<slug>` | J1 failure-mode anchored | **INT-2 (enhanced)** |
| `/intelligence/topics` | J1 topic grid | **INT-2 (this slice)** |
| `/intelligence/topics/<topicId>` | J1 topic deep-dive | **INT-2 (this slice)** |
| `/intelligence/patterns/<patternSlug>` | J2 pattern detail | INT-3 |
| `/intelligence/contradictions/<id>` | J2 contradiction detail | INT-3 |
| `/intelligence/ask` | J3 conversation | INT-5 (preserved chat at INT-1.7) |

### 6.2 `topicId` derivation

`topicId` is kebab-case lowercase, derived from the topic's `title`
following the same pattern as `slugifyEditorialName` for J0 cards
but exported as `slugifyTopicTitle` for clarity. Examples:

- "AI use case portfolio management" → `ai-use-case-portfolio-management`
- "Pilot-to-production scaling" → `pilot-to-production-scaling`
- "Workflow and operating-model change" →
  `workflow-and-operating-model-change`

The slug is computed at registry time and stored as `topicId`. A
test enforces uniqueness.

### 6.3 Cross-reference matrix

| From | To | Mechanism |
|---|---|---|
| J0 card | J1 failure-mode anchored | INT-1.3 navigation |
| J0 affordance "Browse topics" | J1 topic grid | INT-1.5 navigation |
| J1 topic grid | J1 topic deep-dive | Topic card click |
| J1 topic deep-dive | Pattern detail (INT-3) | Pattern citation |
| J1 topic deep-dive | J1 failure-mode anchored | "Related failure modes" |
| J1 failure-mode anchored | J1 topic deep-dive | "Related topics" (NEW INT-2) |
| J1 failure-mode anchored | Pattern detail (INT-3) | Enhanced pattern cards (NEW INT-2) |
| J1 any | J3 chat | "Ask Sentinel" affordance |
| J1 any | J0 / Topic grid | Breadcrumb |

### 6.4 Sharing semantics

- Sharing `/intelligence/topics/<topicId>` URL: recipient lands
  on the topic deep-dive directly. Public route.
- Sharing `/intelligence/failure-modes/<slug>` URL: same.

---

## Part 7 — Workflows

### 7.1 Workflow 1: User clicks "Browse topics" from J0

| Step | Owner | Action | Latency budget | Failure path |
|---|---|---|---|---|
| 1 | User | Click "Browse topics →" | 0 | — |
| 2 | Client | `j0_browse_topics_clicked` telemetry fires (INT-1.5) | <50ms | — |
| 3 | Browser | Navigate to `/intelligence/topics` | <100ms | — |
| 4 | Server | Resolve route; render `IntelligenceTopicsPage` server component | 50ms | Error → `error.tsx` |
| 5 | Server | Read `J1_TOPICS` registry; validate (10 topics, all `associatedPatternIds` resolve) | 5ms | Validation fail → render error placeholder for affected topics |
| 6 | Server | Stream RSC response with topic grid HTML | 200ms | — |
| 7 | Browser | First paint of topic grid | 800ms (FCP) | — |
| 8 | Client | Hydrate; emit `j1_topics_loaded` telemetry | 200ms | — |

### 7.2 Workflow 2: User clicks a topic from the grid

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Click topic card | 0 | — |
| 2 | Client | Emit `j1_topic_clicked` with topic_id + rank + time-to-click | <50ms | — |
| 3 | Browser | Next.js router pushes to `/intelligence/topics/<topicId>` | <100ms | — |
| 4 | Server | `generateStaticParams` pre-rendered the topic page; serve from cache | 50ms | If `topicId` unknown → `notFound()` 404 |
| 5 | Browser | Render topic deep-dive | 1.5s LCP | — |
| 6 | Client | Emit `j1_topic_deep_dive_loaded` telemetry | 100ms | — |

### 7.3 Workflow 3: User clicks a pattern citation on a topic page

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Click pattern card | 0 | — |
| 2 | Client | Emit `j1_topic_pattern_clicked` telemetry | <50ms | — |
| 3 | Browser | Navigate to `/intelligence/patterns/<slug>` | <100ms | — |
| 4 | Server (INT-3 territory) | Render pattern detail page | varies | INT-3 ships this; today renders existing pre-INT-3 content |

### 7.4 Workflow 4: User on a failure-mode page clicks "Related topics"

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Click related-topic link chip | 0 | — |
| 2 | Client | Emit `j1_failure_mode_topic_clicked` telemetry | <50ms | — |
| 3 | Browser | Navigate to `/intelligence/topics/<topicId>` | <100ms | — |

---

## Part 8 — Component breakdown

### 8.1 New files

- **`src/lib/intelligence/j1-topics.ts`** — typed `TopicEntry`,
  `J1_TOPICS` registry (10 entries), `slugifyTopicTitle`,
  validation helpers, helper accessors
  (`getTopicById`, `getTopicsByFailureModeId`,
  `getTotalAssociatedPatternCount`).
- **`src/lib/intelligence/__tests__/j1-topics.test.ts`** —
  validation suite (~20 tests).
- **`src/components/intelligence/J1TopicGrid.tsx`** — server-
  rendered grid of topic cards.
- **`src/components/intelligence/J1TopicCard.tsx`** — single
  topic card on the grid.
- **`src/components/intelligence/J1TopicDeepDive.tsx`** — topic
  deep-dive page composition (server component).
- **`src/components/intelligence/J1TopicTelemetryBridge.tsx`** —
  client island that listens for J1 CustomEvents → PostHog.
- **`src/components/intelligence/J1TopicCardLink.tsx`** — small
  client wrapper for the topic grid card to capture click
  telemetry (mirrors `J0AffordanceLink`).
- **`src/app/intelligence/topics/[topicId]/page.tsx`** — dynamic
  route for topic deep-dive.

### 8.2 Modified files

- **`src/app/intelligence/topics/page.tsx`** — replaced (was INT-1.7
  placeholder); now renders the full `J1TopicGrid` with
  registry-driven content.
- **`src/app/intelligence/failure-modes/[slug]/page.tsx`** —
  enhanced: pattern citations rendered as cards with name +
  category; new "Related topics" section; "Coming with INT-2"
  notice replaced with contextual nav.

### 8.3 Files NOT touched

- `src/lib/intelligence/j0-failure-mode-cards.ts` — survives.
- `src/components/intelligence/J0*` — survive.
- `src/proxy.ts` — `/intelligence/topics` and
  `/intelligence/topics/[topicId]` already public per INT-1.3
  (no change needed; the pattern was set there).

### 8.4 testid markers

- `intelligence-j1-topics-page`
- `intelligence-j1-topics-grid`
- `intelligence-j1-topic-card-{topicId}`
- `intelligence-j1-topic-deep-dive-page`
- `intelligence-j1-topic-pattern-card-{patternId}`
- `intelligence-j1-topic-failure-mode-link-{failureModeId}`
- `intelligence-j1-topic-ask-sentinel`
- `intelligence-j1-failure-mode-related-topic-{topicId}`
- `intelligence-j1-failure-mode-pattern-card-{patternId}`

---

## Part 9 — Open decisions

1. **Topic count: 10 or fewer?** The spine doc proposes 10 topics
   (§C.3). Reducing to 6-8 would be tighter but requires editorial
   reconsolidation. **Recommendation: 10, matching the spine doc.**
2. **`associatedFailureModeIds[]` mapping policy.** Some topics
   map cleanly to ≥1 failure mode (e.g. "Data foundation
   readiness" → FM #3); some don't (e.g. "Specialized industry
   applications" cuts across many). Recommendation: 0..3 per topic;
   encourage but don't require. Validation rule: `length <= 3`.
3. **"Ask Sentinel about this topic" UX.** Currently the affordance
   navigates to `/intelligence/ask` without context. INT-5 will
   pass topic context as a conversation primer (per spine §D.J3.4).
   At INT-2 the affordance just navigates; the conversation primer
   is INT-5 territory. **Recommendation: ship without primer at
   INT-2; INT-5 enhances.**
4. **Topic editorial cadence.** Quarterly review per spine doc §H Q3.
   **Confirm: quarterly.**
5. **Two-column "what gets wrong / what good looks like" layout.**
   Wireframe shows side-by-side on desktop. Mobile collapses. Some
   topics may have asymmetric content (much longer "what good looks
   like" than "what industry gets wrong"). The columns equalize via
   CSS Grid; content can flow.
6. **Pattern card content on failure-mode pages.** Should the card
   render the pattern's `shortDescription` from the manifest, or
   just the name + category? **Recommendation: name + category +
   one-line description (truncated at 120 chars). Caps card height.**
7. **Cross-tenant privacy.** Topic content is corpus doctrine, not
   tenant data — no cross-tenant concern. Confirmed.
8. **Sign-off labeling discipline.** Same as INT-1: cards land as
   `lastReviewedBy: "Claude Opus 4.7 (draft pending founder
   ratification)"`; founder ratifies by editing.

---

## Part 10 — Acceptance criteria + test plan

### 10.1 Acceptance criteria

- [ ] **AC-1** All 10 topics in `J1_TOPICS` with no `lastReviewedBy
  === "TBD"`.
- [ ] **AC-2** Topic registry validation suite passes (see §10.2).
- [ ] **AC-3** `/intelligence/topics` renders all 10 topic cards
  server-side with thesis visible.
- [ ] **AC-4** `/intelligence/topics/<topicId>` renders the
  deep-dive for any of the 10 canonical topic IDs.
- [ ] **AC-5** Unknown `topicId` returns 404 via `notFound()`.
- [ ] **AC-6** `/intelligence/failure-modes/<slug>` enhanced page
  renders pattern cards (name + category + link) and "Related
  topics" section.
- [ ] **AC-7** All cross-reference links navigate to existing,
  non-404 routes.
- [ ] **AC-8** Mobile layout: topic grid single-column, deep-dive
  two-column collapses to single.
- [ ] **AC-9** All J1 telemetry events fire on documented triggers.
- [ ] **AC-10** No regressions on INT-1 surface.

### 10.2 Topic registry validation tests

`src/lib/intelligence/__tests__/j1-topics.test.ts`:

```typescript
describe('J1 topic registry', () => {
  it('contains exactly 10 topics', () => { ... });
  it('every topicId is unique and url-safe', () => { ... });
  it('every title is under 60 chars', () => { ... });
  it('every thesis is 2-4 sentences (200-400 chars)', () => { ... });
  it('every whatIndustryGetsWrong is 2-4 sentences', () => { ... });
  it('every whatGoodLooksLike is 2-4 sentences', () => { ... });
  it('every associatedPatternIds[] entry resolves', () => { ... });
  it('every associatedFailureModeIds[] entry is in 1..10', () => { ... });
  it('every topic has 1-6 associatedPatternIds', () => { ... });
  it('every topic has 0-3 associatedFailureModeIds', () => { ... });
  it('every topic has at least 2 exampleProgramArchetypes', () => { ... });
  it('no topic has lastReviewedBy starting with "TBD"', () => { ... });
  it('no topic content uses banned marketing language', () => { ... });
  it('whatGoodLooksLike references phase / pattern / corpus', () => { ... });
  it('slugifyTopicTitle produces expected forms', () => { ... });
  it('helper getTopicById returns the right topic', () => { ... });
  it('helper getTopicsByFailureModeId returns linked topics', () => { ... });
  // ...
});
```

### 10.3 Component tests

- `J1TopicGrid` renders 10 topic cards with stable testids
- `J1TopicCard` renders title + thesis + depth signal
- `J1TopicDeepDive` renders thesis, what-gets-wrong, what-good-looks-like sections
- Failure-mode page renders pattern cards (regression test for the enhancement)

### 10.4 E2E tests (`tests/e2e/intelligence-j1.spec.ts`)

- Cold load of `/intelligence/topics` — 10 cards visible
- Click a topic → navigates to deep-dive
- Deep-dive shows thesis + what-gets-wrong + what-good-looks-like
- Pattern card click → navigates to `/intelligence/patterns/<slug>`
- Related-topic chip on failure-mode page → navigates to topic deep-dive
- Unknown topic ID → 404
- Mobile (<768px): grid single-column, deep-dive collapses

---

## Part 11 — Sliced implementation plan within INT-2

| Sub-slice | Scope | Owner | Blocks |
|---|---|---|---|
| **INT-2.0** | This document signed off; open decisions resolved | Founder review | All sub-slices below |
| **INT-2.1 + 2.2** | Topic registry shape + 10 topics authored + validation suite | Claude (draft) + Founder (ratify) | INT-2.3 |
| **INT-2.3** | `J1TopicGrid` + `J1TopicCard` + `/intelligence/topics` page | Claude | INT-2.4 |
| **INT-2.4** | `J1TopicDeepDive` + `/intelligence/topics/[topicId]` route + enhanced `/intelligence/failure-modes/[slug]` | Claude | INT-2.5 |
| **INT-2.5** | Mobile + accessibility | Claude | INT-2.6 |
| **INT-2.6** | PostHog telemetry wiring | Claude | INT-2.7 |
| **INT-2.7** | E2E + regression suite | Claude | INT-2 close |

---

## Part 12 — Migration from current state

| What | From | To |
|---|---|---|
| `/intelligence/topics` | INT-1.7 placeholder (5 thesis previews + INT-2 notice) | Full grid of 10 topics from registry |
| `/intelligence/topics/[topicId]` | Did not exist (404) | Full topic deep-dive |
| `/intelligence/failure-modes/[slug]` | INT-1.7 placeholder + cited pattern IDs as monospace text | Enhanced with pattern cards (name + category + link) + Related topics section |
| Pattern manifest dependency | Only used by J0 + tools | Now also used by topic registry validation |
| Cross-references | One-way (J0 → J1 placeholder) | Bidirectional (J1 ↔ J0; J1 ↔ J3) |

INT-1 surface is unchanged. The 7 PRs from INT-1 (registry, grid, page reshape, mobile, a11y, telemetry, E2E) all survive.

---

## Part 13 — Reviewer instructions

Read in this order:

1. **Part 1** — confirm scope boundaries.
2. **Part 9 (open decisions)** — verdicts needed:
   - D1: 10 topics or fewer?
   - D2: 0..3 `associatedFailureModeIds` policy
   - D3: Pattern card content shape on failure-mode pages
   - D4: Sign-off labeling discipline (same as INT-1)
3. **Part 4 (wireframes)** — confirm layout.
4. **Part 2 (FRs)** + **Part 3 (NFRs)** — flag missing or
   over-specified requirements.
5. **Part 7 (workflows)** — confirm transitions match intended UX.
6. **Part 10 (AC + test plan)** — the contract for "done."
7. **Part 12 (migration)** — confirm acceptable transition from
   INT-1.7 state.

**Two decisions block INT-2.0 → INT-2.1 start:**

- **D1 — topic count.** 10 (recommended) or trimmed?
- **D2 — pattern card content shape.** Name + category + 1-line
  description (recommended) or richer/sparser?

If D1, D2, and items 3-4 are confirmed, INT-2.0 closes and
INT-2.1+2.2 starts.

---

**End of INT-2 Detailed Design Spec v1.**
