# INT-1 — J0 Cold Landing · Detailed Design Spec

**Slice:** INT-1 (per `INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md` Part G)
**Status:** Detailed design v1 — awaiting founder review
**Author:** Claude Opus 4.7 (with founder review)
**Date:** 2026-04-30

> **Purpose of this document.** This is the implementation-grade spec
> for INT-1. It supersedes the prose in the spine doc § D.J0 with
> testable requirements, formal state, wireframes, IA, workflows,
> edge cases, acceptance criteria, and a test plan. It is the contract
> between design and engineering for INT-1.
>
> **Scope discipline.** INT-1 ships ONLY the J0 cold-landing surface
> and its card content registry. It does NOT ship the topic browser
> (INT-2), pattern detail (INT-3), Sentinel voice doctrine (INT-4),
> conversational surface (INT-5), tools (INT-6), or any tenant-grounded
> capability (INT-7+). Affordances on J0 that point to those stages
> exist as stubs that load placeholder content until their slices ship.

---

## Part 1 — Premise and scope

### 1.1 What INT-1 delivers

The `/intelligence` page renders a J0 cold-landing experience grounded
in the 10-failure-mode narrative. Cold visitors and authenticated
users alike see the same J0 (personalized overlay is INT-11). The
page is **content-led**, not chat-led — failure-mode cards are the
primary affordance; a chat input is a secondary affordance reachable
from the page header.

INT-1 includes:

1. The J0 page surface (replacing the current chat-dominant
   reshape from PR-INT-B / PR-INT-F).
2. The failure-mode card content registry
   (`src/lib/intelligence/j0-failure-mode-cards.ts`) with all 10
   cards authored to the voice rules in `FAILURE_MODE_CARDS_DRAFT.md`.
3. The card grid component
   (`src/components/intelligence/J0FailureModeGrid.tsx`).
4. The card detail expansion behavior (hover/focus → preview;
   click → transition to J1).
5. Validation tests that block ship when card content fails the
   contract (`citedPatternIds[]` resolves, sign-off metadata set,
   length bounds).
6. Telemetry events for J0 (`j0_loaded`, `j0_card_hovered`,
   `j0_card_clicked`, `j0_browse_topics_clicked`,
   `j0_open_sentinel_clicked`).

INT-1 does NOT include:

1. Topic browser (INT-2). The "Browse topics" affordance is present
   but stubs to a placeholder.
2. Pattern detail rendering (INT-3). The card click transitions to
   `/intelligence/failure-modes/<slug>` which renders a placeholder
   J1 page until INT-2 ships.
3. Conversational surface (INT-5). The "Open Sentinel" affordance
   is present and routes to the existing chat path (preserved from
   the seven shipped PRs).
4. Personalized banner for authenticated users (INT-11).
5. Mode-comparison artifact rendering (INT-5).
6. Audit log writes (INT-10).

### 1.2 Failure modes prevented at this stage

| # | Failure mode | How INT-1 prevents it |
|---|---|---|
| 2 | Empty-state collapse | The page never opens to a chat input; the 10 cards are the primary affordance. Even on cold load with no JS, server-rendered card grid is visible. |
| 8 | Failure-mode narrative absent | The page's headline IS the failure-mode framing. The 10 cards are the platform's contract made narrative. |
| 10 | Demo-fragile | The cards are signed-off content with no dynamic generation. The page renders deterministically; demos cannot drift between sessions. |

### 1.3 Pilot-readiness floor

INT-1 ships when ALL of the following are true:

- All 10 cards are authored, founder-reviewed, signed off
  (`lastReviewedBy` and `lastReviewedAt` set; `lastReviewedBy` is
  not the literal string `"TBD"`).
- The card validation test suite passes (see §10).
- The page passes Lighthouse Performance ≥85 and Accessibility ≥95
  on a fast-3G profile.
- Cold-load (no auth) renders correctly; authenticated-no-personalization
  also renders correctly.
- Telemetry events fire on the documented triggers.
- The 5 demo-robustness questions specific to J0 (see §10) all pass.
- No regressions on existing /programs, /home, /tower routes.

---

## Part 2 — Functional requirements

Each requirement has a stable ID `INT-1-FR-NNN`. Requirements are
testable: each maps to at least one acceptance check in §10.

### 2.1 Page rendering

- **`INT-1-FR-001`** The route `/intelligence` MUST render the J0
  cold-landing surface for any authenticated user with no
  personalization overlay (INT-11 adds the overlay later).
- **`INT-1-FR-002`** The page header MUST be the headline:
  *"Why enterprise AI transformation fails — and how AbarVa prevents
  it."* Headline copy is canonical and stored in the registry, NOT
  hardcoded in component JSX.
- **`INT-1-FR-003`** The page subhead MUST display three depth
  signals: total pattern count from the manifest
  (`getPatternManifestEntries().length`), total research-anchor
  count (sum of `card.citedResearch.length` across all 10 cards),
  and corpus version (from a new `CORPUS_VERSION` constant in the
  registry; v1 starts at `"v1.0.0"`).
- **`INT-1-FR-004`** The page MUST render exactly 10 failure-mode
  cards, one per `FAILURE_MODES` entry, in canonical order
  (`failureModeId` ascending).
- **`INT-1-FR-005`** The page MUST be server-rendered (RSC). The
  card grid contains no client-side data fetching for J0 content;
  cards are statically resolved at build/server-render time from
  the typed registry.
- **`INT-1-FR-006`** The page MUST work without JavaScript enabled
  (cards visible, links followable). Hover/focus expansions
  degrade to "always visible" on no-JS.

### 2.2 Card content

- **`INT-1-FR-010`** Each card MUST render the `oneLineHook` as
  the primary visible text on the card grid.
- **`INT-1-FR-011`** Each card MUST display a depth signal beneath
  the hook: pattern count + research-anchor count for that
  specific card. e.g. *"4 patterns · 3 research anchors"*.
- **`INT-1-FR-012`** Each card MUST display the `editorialName`
  (e.g. *"The Phantom Sponsor"*) and the canonical name (e.g.
  *"Lack of executive sponsorship"*) — editorial as primary,
  canonical as smaller-font subtitle.
- **`INT-1-FR-013`** The card grid MUST NOT use marketing
  language anywhere (no "transform", "unlock", "accelerate",
  "leverage", "empower"). A unit test enforces this with a
  forbidden-phrases list.
- **`INT-1-FR-014`** Cards with `lastReviewedBy === "TBD" ||
  lastReviewedBy === "TBD — founder review pending"` MUST NOT
  render in production. The page degrades to a "card content
  pending review" placeholder for those cards. The card
  validation test fails CI on TBD content.

### 2.3 Card interaction

- **`INT-1-FR-020`** On hover or keyboard focus on a card, the
  `oneLineHook` MUST expand to show the first 2 sentences of
  `expandedNarrative` (the "preview"). The expansion completes
  within 100ms of the trigger.
- **`INT-1-FR-021`** The expansion MUST be reversible: leaving
  hover or losing focus collapses back to the hook within 100ms.
- **`INT-1-FR-022`** Clicking or pressing Enter/Space on a card
  MUST navigate to `/intelligence/failure-modes/<slug>`, where
  `<slug>` is the failure mode's editorial name slugified
  (`'The Phantom Sponsor'` → `'phantom-sponsor'`).
- **`INT-1-FR-023`** If the user has `prefers-reduced-motion`,
  the expansion MUST be instantaneous (no transition).

### 2.4 Page affordances

- **`INT-1-FR-030`** The page MUST render a "Browse topics"
  affordance in the header. INT-1 stubs this to navigate to
  `/intelligence/topics` which renders a "coming with INT-2"
  placeholder. The affordance is functional in the IA sense —
  not greyed out — to avoid signaling "broken".
- **`INT-1-FR-031`** The page MUST render an "Open Sentinel"
  affordance in the header. INT-1 wires this to navigate to
  `/intelligence/ask` which preserves the chat surface from PR-INT-B.
  (INT-5 will replace this with the J3 mode-comparison surface.)
- **`INT-1-FR-032`** The "Browse topics" and "Open Sentinel"
  affordances MUST be visually secondary to the card grid — smaller
  type, subdued contrast, top-right of the page header. The card
  grid MUST be the visual focus.

### 2.5 Mobile rendering

- **`INT-1-FR-040`** On viewports `<768px wide`, the card grid
  MUST collapse to a single-column vertical list with the 5
  most-cited failure modes shown by default and a "Show all 10"
  affordance to reveal the rest. "Most-cited" is determined by
  pattern count + research-anchor count combined.
- **`INT-1-FR-041`** On mobile, hover-based interactions MUST
  degrade to tap-to-expand behavior. Tapping a card expands it;
  tapping again navigates.
- **`INT-1-FR-042`** The "Show all 10" affordance MUST be
  keyboard-focusable and accessible to screen readers.

### 2.6 Telemetry

- **`INT-1-FR-050`** On J0 page load, the client MUST emit a
  `j0_loaded` event with payload `{ visitor_type: 'cold' |
  'authenticated', tenant_key: string | null, corpus_version:
  string, total_patterns: number, total_research_anchors: number }`.
- **`INT-1-FR-051`** On card hover/focus, the client MUST emit
  `j0_card_hovered` with `{ failure_mode_id: number, editorial_name:
  string, dwell_ms: number }`. Dwell is measured at hover-end.
- **`INT-1-FR-052`** On card click, the client MUST emit
  `j0_card_clicked` with `{ failure_mode_id, editorial_name,
  rank_in_grid: number, time_to_click_ms: number }`. Rank is
  the visual position (1..10) at the time of click. Time-to-click
  is from page-load to click.
- **`INT-1-FR-053`** On affordance clicks, the client MUST emit
  `j0_browse_topics_clicked` and `j0_open_sentinel_clicked`
  events with `{ time_to_click_ms }`.
- **`INT-1-FR-054`** Telemetry events MUST flush via PostHog
  (existing posthog client) with no PII (no user email; tenant
  key only when authenticated).

---

## Part 3 — Non-functional requirements

### 3.1 Performance

- **`INT-1-NFR-001`** First Contentful Paint <1.0s on Fast 3G
  (Lighthouse desktop emulated mobile profile).
- **`INT-1-NFR-002`** Largest Contentful Paint <1.8s on Fast 3G.
  LCP element is the card grid container.
- **`INT-1-NFR-003`** Time to Interactive <2.5s on Fast 3G.
- **`INT-1-NFR-004`** Total Blocking Time <200ms.
- **`INT-1-NFR-005`** Cumulative Layout Shift <0.1.
- **`INT-1-NFR-006`** The card content registry adds <50KB to the
  JS bundle (gzipped). Achieved by tree-shaking unused fields and
  by server-rendering the card grid (only the interactive
  expansion handlers ship to the client).

### 3.2 Accessibility

- **`INT-1-NFR-010`** WCAG 2.1 AA conformance verified by `axe-core`
  in CI.
- **`INT-1-NFR-011`** All cards keyboard-focusable in canonical
  order (failure mode #1 first).
- **`INT-1-NFR-012`** Card hover/focus expansion MUST also be
  triggered by keyboard focus, NOT only by mouse hover.
- **`INT-1-NFR-013`** Card click MUST be invokable by Enter and
  Space keys.
- **`INT-1-NFR-014`** Page MUST have semantic landmarks: `<main>`
  for the card grid container, `<header>` for the page header,
  `<nav aria-label="Intelligence affordances">` for the
  Browse-topics / Open-Sentinel link group.
- **`INT-1-NFR-015`** Card grid MUST have `role="list"` with each
  card as `role="listitem"`. The interactive card itself is a
  semantic `<a>` (link) so screen readers announce destination.
- **`INT-1-NFR-016`** Color contrast on every text element ≥4.5:1
  for body, ≥3:1 for headings.
- **`INT-1-NFR-017`** `prefers-reduced-motion` honored: no
  animation/transition on expansion.

### 3.3 Browser support

- **`INT-1-NFR-020`** Latest two versions of Chrome, Edge, Firefox,
  Safari (desktop + iOS Safari, Android Chrome).
- **`INT-1-NFR-021`** Graceful degradation on no-JS — server-rendered
  cards fully visible and clickable.
- **`INT-1-NFR-022`** Print stylesheet does NOT need to be polished
  (out of scope for v1).

### 3.4 SEO

- **`INT-1-NFR-030`** Page rendered server-side with full card
  content visible to crawlers. Each card's `oneLineHook` and
  `expandedNarrative` are present in the initial HTML.
- **`INT-1-NFR-031`** Meta tags: `<title>Intelligence · Why AI
  programs fail | AbarVa</title>` (canonical title), description
  meta references the 10-failure-mode framing, OpenGraph image is
  the card grid (deferred — placeholder OK at INT-1).
- **`INT-1-NFR-032`** Canonical URL set to `/intelligence` (no
  trailing slash).

### 3.5 Authentication boundary

- **`INT-1-NFR-040`** J0 content is identical for cold visitors and
  authenticated users (no personalization at INT-1 — that's INT-11).
  But the existing `/intelligence` route is auth-gated by the proxy
  middleware (`authRequiredRoutes`); cold-visitor cold-landing
  requires removing that gate, which is outside INT-1 scope.
  **Open decision: see §9 Open Decisions item 1.**

---

## Part 4 — Wireframes (text-annotated)

Layout decisions follow the locked design system per
`design_system.md` user memory: `#F8F7F4` paper background, Georgia
serif normal weight for display, DM Sans body, black/ghost buttons.

### 4.1 Desktop layout (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [76px AppRail]                                                                │
│           ┌──────────────────────────────────────────────────────────────────┤
│           │ AppTopBar — tenant name "Apex Retail Group" · [Locked badge]      │
│           │                                                                  │
│           │ Context: "Intelligence · Why AI programs fail"                   │
│           ├──────────────────────────────────────────────────────────────────┤
│           │                                                                  │
│           │   [PAGE HEADER ZONE — 200px tall, paper bg]                      │
│           │                                                                  │
│           │       Why enterprise AI transformation fails —                   │
│           │       and how AbarVa prevents it.                                │
│           │       ─────────────────────────────────                          │
│           │       [Georgia serif, 36px, font-weight 400, ink black,          │
│           │        max-width 720px, line-height 1.15]                        │
│           │                                                                  │
│           │       17 patterns · 30 research anchors · corpus v1.0.0          │
│           │       [DM Sans, 12px, ink-muted, mono digits]                    │
│           │                                                                  │
│           │                              [Browse topics →]  [Open Sentinel →]│
│           │                              [secondary affordances, top-right]  │
│           │                                                                  │
│           ├──────────────────────────────────────────────────────────────────┤
│           │                                                                  │
│           │   [CARD GRID ZONE — fills viewport remainder]                    │
│           │                                                                  │
│           │   5 cols × 2 rows                                                │
│           │   gap: 16px                                                      │
│           │   max-width: 1280px                                              │
│           │   padding: 0 48px                                                │
│           │                                                                  │
│           │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│           │   │ #1   │ │ #2   │ │ #3   │ │ #4   │ │ #5   │                  │
│           │   │      │ │      │ │      │ │      │ │      │                  │
│           │   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│           │                                                                  │
│           │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│           │   │ #6   │ │ #7   │ │ #8   │ │ #9   │ │ #10  │                  │
│           │   │      │ │      │ │      │ │      │ │      │                  │
│           │   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│           │                                                                  │
│           │                                                                  │
│           └──────────────────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────────────────┘
```

**Card dimensions (desktop):**

- Card width: dynamic, ~240px (filling 5-col grid with 16px gap inside max-width 1280px)
- Card height: 220px (collapsed) → 320px (expanded on hover/focus)
- Card border: 1px solid CARD_LINE (paper-soft tone, design system token)
- Card border-radius: 10px
- Card padding: 16px

### 4.2 Card structure (collapsed state)

```
┌────────────────────────────────────────┐
│ #1 · LACK OF EXECUTIVE SPONSORSHIP     │   ← canonical name, mono 9px,
│                                        │      uppercase, ink-muted
│                                        │
│ The Phantom Sponsor                    │   ← editorial name, Georgia serif
│                                        │      18px, ink-black, weight 400
│                                        │
│ Programs that fail because the         │   ← oneLineHook, DM Sans 13px,
│ sponsor was named on a slide and       │      ink-slate, line-height 1.5
│ never on a calendar.                   │
│                                        │
│                                        │
│                                        │
│                                        │   [vertical breathing room]
│                                        │
│ 2 patterns · 3 anchors                 │   ← depth signal, mono 10px,
│                                        │      ink-stone, baseline-aligned
└────────────────────────────────────────┘
   ▲
   │ Hover/focus border-color shifts to ink-black (1px)
   │ Cursor: pointer
   │ Card lifts 1px (subtle shadow change)
```

### 4.3 Card structure (expanded state — on hover or keyboard focus)

```
┌────────────────────────────────────────┐
│ #1 · LACK OF EXECUTIVE SPONSORSHIP     │
│                                        │
│ The Phantom Sponsor                    │
│                                        │
│ Programs that fail because the         │
│ sponsor was named on a slide and       │
│ never on a calendar.                   │
│ ─────────────────────────              │   ← rule line (1px ink-line)
│                                        │
│ Most enterprise AI programs are        │   ← preview from expandedNarrative
│ launched with a sponsor named in       │      (first 2 sentences),
│ the steering committee deck. Most      │      DM Sans 12px, ink-slate
│ of those sponsors never appear on      │
│ the program's calendar in a way        │
│ that matters.                          │
│                                        │
│ 2 patterns · 3 anchors    Read more →  │   ← affordance hint (mono 10px,
│                                        │      ink-black, right-aligned)
└────────────────────────────────────────┘
```

The expansion grows the card from 220px to ~320px tall. Adjacent
cards in the grid do NOT shift; the expanded card overlays slightly
beyond its row (z-index lift). On keyboard focus, the expansion is
permanent until focus moves; on hover, the expansion follows the
mouse.

### 4.4 Page header zone — affordances detail

```
[Browse topics →]    [Open Sentinel →]
 ┌──────────────┐    ┌──────────────┐
 │ ghost button │    │ ghost button │
 │ DM Sans 13px │    │ DM Sans 13px │
 │ ink-black    │    │ ink-black    │
 │ 1px border   │    │ 1px border   │
 │ 6px radius   │    │ 6px radius   │
 │ 8px 12px pad │    │ 8px 12px pad │
 └──────────────┘    └──────────────┘
```

Both affordances live top-right of the page header zone, separated
from the headline by ≥120px horizontal space (ensures visual
secondary-ness).

### 4.5 Tablet layout (768–1023px)

Card grid collapses to **3 columns × 4 rows**. Two cards in the
last row align left (cells 9 and 10 occupy positions 1 and 2 of
row 4); cells 11 and 12 do not exist (no placeholder cells).

Affordances move below the headline (still top of page) on a single
horizontal row.

### 4.6 Mobile layout (<768px)

```
┌──────────────────┐
│ AppTopBar        │
├──────────────────┤
│                  │
│ Why enterprise   │
│ AI transformation│
│ fails — and how  │
│ AbarVa prevents  │
│ it.              │
│                  │
│ 17 patterns ·    │
│ 30 anchors       │
│                  │
│ [Browse topics]  │
│ [Open Sentinel]  │
│                  │
├──────────────────┤
│ Card #1          │
│ ────────────     │
│ Card #2          │
│ ────────────     │
│ Card #3          │
│ ────────────     │
│ Card #4          │
│ ────────────     │
│ Card #5          │
│ ────────────     │
│                  │
│ [Show all 10 →]  │
│                  │
└──────────────────┘
```

Cards stack single-column. Tap-to-expand replaces hover. The
"Show all 10" affordance reveals cards #6–#10 inline (no
new page).

### 4.7 No-JS fallback

When JavaScript is unavailable, all 10 cards render in expanded
form (full preview always visible). The page is fully usable;
hover-only behavior and tap-to-expand are JS-dependent so they
gracefully degrade.

---

## Part 5 — State machine

INT-1's J0 surface has minimal state. The state model is:

```
                 ┌───────────────────────┐
                 │                       │
                 │   J0_LANDING (initial)│ ← URL: /intelligence
                 │                       │
                 └─────────┬─────────────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                      │
        │ hover/focus      │ click card           │ click affordance
        ▼                  ▼                      ▼
┌─────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐
│ J0_CARD_PREVIEW │  │ NAVIGATE_TO_J1       │  │ NAVIGATE_TO_J2/J3 stub │
│                 │  │                      │  │                       │
│ (transient,     │  │ URL: /intelligence/  │  │ URL: /intelligence/   │
│  no URL change) │  │ failure-modes/<slug> │  │ topics or /ask        │
└────────┬────────┘  └──────────────────────┘  └───────────────────────┘
         │
         │ leave hover / lose focus
         ▼
   J0_LANDING
```

### 5.1 State definitions

- **`J0_LANDING`** (initial) — page loaded, all 10 cards rendered
  in collapsed state, no card has focus.
- **`J0_CARD_PREVIEW`** — exactly one card has hover or keyboard
  focus, expanded state visible. URL unchanged. State is purely
  client-side.
- **`NAVIGATE_TO_J1`** — terminal state of INT-1's responsibility;
  router has begun navigation to `/intelligence/failure-modes/<slug>`.
  The downstream surface (J1, INT-2 territory) takes over.
- **`NAVIGATE_TO_J2/J3 stub`** — terminal; navigates to
  `/intelligence/topics` (J1, INT-2) or `/intelligence/ask`
  (J3, existing chat from PR-INT-B preserved).

### 5.2 Persistence

- **URL state.** Card preview state is NOT in the URL. Card click
  navigation IS. This means:
  - Refreshing on a previewed card → lose preview, return to landing.
  - Sharing `/intelligence` URL → recipient lands on J0 landing.
  - Deep-linking to `/intelligence/failure-modes/phantom-sponsor` →
    loads J1 (INT-2) directly with the failure mode opened. (At
    INT-1, this URL renders the placeholder.)
- **Session storage.** None at INT-1. INT-11 may add
  "user-most-recently-viewed-failure-mode" to bias card sort order
  on return; not in INT-1.
- **No client-side state survives a page refresh.** This is
  intentional — failure-mode discovery is meant to be deterministic.

### 5.3 Edge / error states

- **Card content fails validation.** If `card.lastReviewedBy ===
  "TBD"` or related, the affected card position renders a
  "Content pending review" placeholder. The remaining 9 cards
  render normally. CI fails the build if any cards have
  unreviewed content (validation test).
- **Pattern manifest entry not found** for a `citedPatternIds[]`
  entry. The depth-signal count uses what resolves; missing
  entries are silently dropped (with a warning logged
  server-side). The card itself still renders. CI test
  enforces all `citedPatternIds[]` resolve at build time.
- **Research anchor URL 404.** The card content registry doesn't
  link out at INT-1; this becomes relevant in INT-3 (J2 pattern
  detail). N/A here.
- **Auth state changes mid-session.** J0 content is
  auth-independent at INT-1. State changes (sign in / sign out)
  do not affect J0 rendering. INT-11 introduces auth-driven
  rendering and must handle this case then.
- **`prefers-reduced-motion` set.** Card expansion is instantaneous
  (no transition). The expansion mechanism still works; only the
  animation timing changes.

---

## Part 6 — Information architecture

### 6.1 URL structure

| URL | Surface | Owner |
|---|---|---|
| `/intelligence` | J0 cold landing — card grid | **INT-1 (this slice)** |
| `/intelligence/failure-modes/<slug>` | J1 oriented browse — failure-mode topic | INT-2 |
| `/intelligence/topics` | J1 oriented browse — topic grid | INT-2 |
| `/intelligence/topics/<topicId>` | J1 deep-dive — topic page | INT-2 |
| `/intelligence/patterns/<patternSlug>` | J2 — pattern detail (this URL already exists in current code) | INT-3 |
| `/intelligence/contradictions/<id>` | J2 — contradiction detail | INT-3 |
| `/intelligence/signals/<id>` | J2 — signal detail (already exists) | INT-3 |
| `/intelligence/ask` | J3 — Sentinel conversation | INT-5 (currently stubbed by preserving the existing chat at this URL) |
| `/intelligence/validate` | J5 — synthesis validation | INT-8 |

### 6.2 Slug derivation

`<slug>` for failure modes is the editorial name lowercased,
spaces and special chars replaced with hyphens, leading article
"the" dropped:

- `'The Phantom Sponsor'` → `'phantom-sponsor'`
- `'The Pilot-to-Production Gap'` → `'pilot-to-production-gap'`
- `'The Workflow That Wasn't'` → `'workflow-that-wasnt'`

A test enforces uniqueness across all 10 slugs.

### 6.3 Deep-link behavior

- `/intelligence#card-1` is NOT a supported deep-link (anchor IDs
  on cards are for accessibility only, not routing).
- `/intelligence/failure-modes/<slug>` is the canonical deep-link.
  At INT-1, the destination renders a placeholder page with the
  failure mode's full narrative (rendered server-side from the
  registry) and a "Coming with INT-2: full topic surface" notice.
- `/intelligence?ref=<source>` query parameter is preserved in
  telemetry but does NOT affect rendering. Allowed values include
  `linkedin`, `twitter`, `email`, `direct`, etc. Untracked refs
  are normalized to `unknown`.

### 6.4 Header / breadcrumb model

J0 has no breadcrumb (it's the entry surface). The page header IS
the headline, not "Home > Intelligence". Breadcrumb appears on J1
and deeper.

### 6.5 Sharing semantics

- Sharing `/intelligence` URL: recipient lands on J0 landing.
- Sharing `/intelligence/failure-modes/<slug>` (once INT-2 ships):
  recipient lands on J1 with that failure mode opened. At INT-1,
  this URL works (returns the placeholder page with content).
- A "share this card" affordance is NOT in INT-1 scope. Cards
  are linkable by their canonical URL only.

---

## Part 7 — Workflows

Each workflow names: actor, trigger, system response sequence,
owner per step (client/server), latency budget, failure path.

### 7.1 Workflow 1: Cold visitor lands on /intelligence

| Step | Owner | Action | Latency budget | Failure path |
|---|---|---|---|---|
| 1 | Browser | Request `GET /intelligence` | — | — |
| 2 | Vercel/Next.js (RSC) | Resolve route; load `IntelligenceIndexPage` server component | 50ms | Server error → render `error.tsx` |
| 3 | Server | Read `J0_FAILURE_MODE_CARDS` registry; validate (10 cards, sign-off, slug uniqueness) | 5ms | Validation fail → log error; render placeholder for affected cards |
| 4 | Server | Compute depth signals (pattern count, anchor count) by reading `getPatternManifestEntries()` and summing card citations | 10ms | Manifest read fail → fall back to hardcoded constants; log error |
| 5 | Server | Stream RSC response with header zone + card grid (server-rendered HTML) | 100ms | — |
| 6 | Browser | Receive HTML; first paint of header zone | 800ms (FCP) | — |
| 7 | Browser | LCP at card grid container | 1.8s (LCP) | — |
| 8 | Browser | Hydrate `J0FailureModeGrid` client island for hover/focus expansion | 200ms post-FCP | If JS fails to load → cards remain in expanded state (no-JS fallback per FR-006) |
| 9 | Client island | Emit `j0_loaded` telemetry event via PostHog | — | If PostHog fails → log to console; do not block UI |
| 10 | Browser | TTI; user can interact | 2.5s | — |

### 7.2 Workflow 2: User hovers a card

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Mouse enters card boundary | 0 | — |
| 2 | Client | `onMouseEnter` fires; record start timestamp | 0 | — |
| 3 | Client | Apply `data-state="preview"` to card; CSS expansion takes over | 100ms (transition end) | If `prefers-reduced-motion` → no transition |
| 4 | Client | Render preview text (first 2 sentences of `expandedNarrative`) — this is in the DOM at server-render time, just hidden via CSS | 0 | — |
| 5 | User | Mouse leaves card | varies | — |
| 6 | Client | `onMouseLeave` fires; compute dwell-ms from start timestamp | 0 | — |
| 7 | Client | Reverse expansion via CSS | 100ms | — |
| 8 | Client | Emit `j0_card_hovered` telemetry with dwell-ms (after a 250ms debounce so flickering hovers don't spam) | — | PostHog fail → console log |

### 7.3 Workflow 3: User clicks a card

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Click on card | 0 | — |
| 2 | Client | `onClick` fires; emit `j0_card_clicked` telemetry synchronously | <50ms | Telemetry fail → log; do not block navigation |
| 3 | Client | Resolve target URL: `/intelligence/failure-modes/<slug>` | <5ms | Slug derivation fail (shouldn't happen; test enforces) → fallback to canonical name slug |
| 4 | Browser | Next.js router pushes to target URL | <100ms | If router fail → emit error telemetry; full page navigation |
| 5 | Server (target route) | Renders J1 placeholder (INT-2) or J1 surface (post-INT-2) | 200ms | — |
| 6 | Browser | New page renders | 1.5s | — |

### 7.4 Workflow 4: User clicks "Open Sentinel"

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Click on "Open Sentinel" affordance | 0 | — |
| 2 | Client | `onClick` fires; emit `j0_open_sentinel_clicked` | <50ms | — |
| 3 | Client | Navigate to `/intelligence/ask` (which preserves the existing chat surface from PR-INT-B at INT-1; INT-5 replaces) | <100ms | — |

### 7.5 Workflow 5: User on mobile taps "Show all 10"

| Step | Owner | Action | Latency | Failure path |
|---|---|---|---|---|
| 1 | User | Tap on "Show all 10" button (mobile only) | 0 | — |
| 2 | Client | Toggle `data-show-all="true"` on grid container; CSS reveals cards #6–#10 | 200ms (slide-down transition) | reduced-motion → instant |
| 3 | Client | Scroll to card #6 (smooth) | 400ms | — |
| 4 | Client | Emit `j0_show_all_clicked` telemetry (NEW EVENT — adds to FR-053 list; reflected in §2.6) | — | — |

(Note: this introduces a sixth telemetry event. **Spec correction**:
add `j0_show_all_clicked { time_to_click_ms, viewport_width }` to
the FR-050..054 set. See §9 Open Decisions item 7.)

---

## Part 8 — Component breakdown

INT-1 introduces or modifies the following files.

### 8.1 New files

- **`src/lib/intelligence/j0-failure-mode-cards.ts`** — typed
  `FailureModeNarrativeCard` interface, `J0_FAILURE_MODE_CARDS`
  registry with all 10 cards, `CORPUS_VERSION` constant, slug
  derivation helpers, validation function.
- **`src/lib/intelligence/__tests__/j0-failure-mode-cards.test.ts`** —
  validation test suite (see §10).
- **`src/components/intelligence/J0FailureModeGrid.tsx`** — client
  island; receives the registry via props (passed in from server
  component); handles hover/focus expansion + click navigation +
  telemetry; mobile responsive logic.
- **`src/components/intelligence/J0FailureModeCard.tsx`** —
  individual card component (used inside the grid).
- **`src/components/intelligence/__tests__/J0FailureModeGrid.test.tsx`** —
  component tests (render, keyboard, click).
- **`src/app/intelligence/failure-modes/[slug]/page.tsx`** — J1
  placeholder page (renders the failure-mode narrative + "Coming
  with INT-2" notice).

### 8.2 Modified files

- **`src/app/intelligence/page.tsx`** — server component; reads
  the card registry, computes depth signals, renders the page
  structure with `J0FailureModeGrid` client island.
- **`src/components/intelligence/IntelligenceIndexPage.tsx`** — the
  page composition that I shipped in PR-INT-B/F gets reshaped:
  - Header copy changes from *"Ask Sentinel about the corpus"* to
    *"Why enterprise AI transformation fails — and how AbarVa prevents it."*
  - Subhead changes from filter-pill summary to depth-signal summary.
  - The chat-dominant `IntelligenceAgentCanvas` is REMOVED from
    this page.
  - The collapsed pattern-library `<details>` accordion is REMOVED
    (the pattern-library browse-mode is INT-2 territory; not a
    fallback affordance).
  - Card grid replaces the canvas as the primary content.
  - Header gets the two new affordances (Browse topics,
    Open Sentinel).

### 8.3 New files for the preserved chat (transitional)

- **`src/app/intelligence/ask/page.tsx`** — minimal page that
  renders the preserved chat surface (`IntelligenceAgentCanvas`
  from PR-INT-B). This is the "Open Sentinel" target until INT-5
  ships the proper J3.

### 8.4 Files NOT touched

- `src/lib/intelligence/sentinel-broker-adapter.ts` — survives.
- `src/lib/agent/tools/intelligence/*` — survives (still
  registered for `/intelligence` surface; reachable from
  `/intelligence/ask`).
- `src/lib/agent/artifacts.ts` — survives.
- `src/components/intelligence/SentinelReactivePanel.tsx` —
  survives (used by `/intelligence/ask`).
- `src/components/intelligence/IntelligenceAgentCanvas.tsx` —
  survives, moved to `/intelligence/ask`.

### 8.5 testid markers (for E2E tests)

- `intelligence-j0-page` — root container
- `intelligence-j0-headline` — H1
- `intelligence-j0-subhead` — depth signals
- `intelligence-j0-card-grid` — grid container
- `intelligence-j0-card-{failureModeId}` — each card (1..10)
- `intelligence-j0-affordance-browse-topics`
- `intelligence-j0-affordance-open-sentinel`
- `intelligence-j0-show-all` — mobile expand button

---

## Part 9 — Open decisions

These are flagged here, not buried. They block INT-1 ship until
resolved.

1. **Auth gate on `/intelligence`.** Currently the proxy middleware
   (`src/proxy.ts`) auth-gates all `/intelligence/*` routes. The
   spine doc envisions cold visitors landing on J0 at the public
   surface (`abarva.ai/intelligence`). Decision options:
   - **A.** Remove `/intelligence(.*)` from `authRequiredRoutes` so
     cold visitors can hit J0. Pro: matches spine doc cold-landing
     intent. Con: leaks corpus content publicly (acceptable since
     pattern manifest is doctrine, not tenant data).
   - **B.** Keep the auth gate; cold visitors hit J0 via a separate
     public marketing site that mirrors content. Pro: cleaner
     separation. Con: requires duplicating content + risks drift.
   - **C.** Remove gate for `/intelligence` only (not its
     subpaths); subpaths that need tenant data stay gated. Pro:
     middle ground. Con: complexity in middleware.
   - **Recommendation**: A, with the explicit understanding that
     pattern manifest content is corpus doctrine and not tenant
     data. Founder must approve.

2. **Editorial names for failure modes #2–7, #9, #10.** I have
   placeholder drafts in `FAILURE_MODE_CARDS_DRAFT.md`. Founder
   needs to approve, replace, or assign.

3. **`citedPatternIds[]` per card.** I picked patterns by judgment
   for #1 and #8; the corpus has 17 patterns and the choice is
   somewhat arbitrary. Founder may want to specify which patterns
   ground each card.

4. **Card sort order.** Spec says canonical (`failureModeId`
   ascending). The spine doc D.J0.9 Q1 considers
   tenant-relevance reordering for authenticated users, deferred
   to INT-11. Confirm INT-1 ships canonical-only.

5. **Mobile card sort for "5 most-cited shown by default".** The
   sort logic uses `pattern_count + anchor_count`. If two cards
   tie, secondary sort is `failureModeId` ascending. Confirm.

6. **`/intelligence/failure-modes/<slug>` placeholder content
   shape.** Options:
   - Render only the editorial name + "INT-2 coming" notice.
   - Render the editorial name + the full `expandedNarrative`
     text from the card (server-side from the registry).
   - Render the full card content + "Topic surface coming
     with INT-2" notice with the card content above.
   - **Recommendation**: third option. Even at INT-1, the
     deep-link gives the user something substantive
     (the full narrative they would have seen in J1 anyway).

7. **Telemetry event for "Show all 10" mobile.** §7.5 introduces
   a sixth event not listed in §2.6. Spec should be self-consistent.
   **Resolution: add to FR-053 explicitly.** I'll patch §2.6 in
   the next revision.

8. **Browser support for CSS Grid `subgrid`.** Card grid uses
   CSS Grid. If we use `subgrid` for inner card alignment,
   Safari <16 fails. Decision: do NOT use `subgrid`; flexbox
   inside cards instead. Confirmed.

---

## Part 10 — Acceptance criteria + test plan

### 10.1 Acceptance criteria for INT-1

INT-1 is "done" when ALL of the following are demonstrated:

- [ ] **AC-1** All 10 failure-mode cards exist in
  `J0_FAILURE_MODE_CARDS` with no `lastReviewedBy === "TBD"`.
- [ ] **AC-2** All cards pass the registry-validation test suite
  (see §10.2 below).
- [ ] **AC-3** `/intelligence` renders the J0 page server-side with
  card grid visible without JS.
- [ ] **AC-4** Card grid is keyboard-navigable; Tab moves to next
  card, Enter/Space activates.
- [ ] **AC-5** Card hover/focus expansion works on desktop;
  tap-to-expand works on mobile.
- [ ] **AC-6** Mobile (<768px) renders 5 cards by default with
  "Show all 10" affordance.
- [ ] **AC-7** Lighthouse Performance ≥85 on Fast 3G profile.
- [ ] **AC-8** Lighthouse Accessibility ≥95.
- [ ] **AC-9** axe-core: zero accessibility violations.
- [ ] **AC-10** All telemetry events fire as documented in §2.6 +
  §9.7 patch.
- [ ] **AC-11** No regressions on `/programs`, `/home`, `/tower`
  (existing E2E suite passes).
- [ ] **AC-12** `/intelligence/ask` preserves the existing chat
  surface from PR-INT-B (regression test against the chat panel
  loading).
- [ ] **AC-13** All open decisions in §9 have founder verdict
  recorded.
- [ ] **AC-14** Demo-robustness test: 5 hand-authored prompts
  produce expected J0 behavior (see §10.3).

### 10.2 Card registry validation tests

`src/lib/intelligence/__tests__/j0-failure-mode-cards.test.ts`:

```typescript
describe('J0 failure-mode card registry', () => {
  it('contains exactly 10 cards', () => { ... });
  it('has one card per FAILURE_MODES entry', () => { ... });
  it('cards are in canonical order (failureModeId ascending)', () => { ... });
  it('every failureModeId resolves to a real FAILURE_MODES entry', () => { ... });
  it('every citedPatternIds[] entry resolves via getPatternManifestEntry', () => { ... });
  it('no card has lastReviewedBy === "TBD" (or starts with "TBD")', () => { ... });
  it('every card has at least 2 citedResearch entries', () => { ... });
  it('every card has at least 2 exampleScenarios', () => { ... });
  it('every oneLineHook is under 100 characters', () => { ... });
  it('every expandedNarrative word count is between 200 and 600', () => { ... });
  it('all editorial names produce unique slugs', () => { ... });
  it('no card content uses forbidden marketing phrases', () => {
    const FORBIDDEN = ['transform', 'unlock', 'accelerate', 'leverage', 'empower', 'revolutionary', 'cutting-edge'];
    // assert FORBIDDEN[i] does not appear in any card text
  });
  it('CORPUS_VERSION is a valid semver string', () => { ... });
});
```

### 10.3 Demo-robustness prompts for J0

Founder runs these on the live page; each must produce the
expected behavior. Failures are blocking.

1. **Cold load** — visit `/intelligence` in incognito; verify
   page renders, all 10 cards visible, no JS errors in console.
2. **Keyboard nav** — Tab through every card; verify focus
   ring visible; verify Enter on a focused card navigates.
3. **Mobile view** — narrow viewport to 375px; verify 5 cards
   visible + "Show all 10" affordance; tap to expand and reveal
   remaining 5.
4. **No-JS** — disable JS in DevTools; reload `/intelligence`;
   verify all 10 cards visible in expanded form, all card
   links followable.
5. **Accessibility audit** — run axe-core extension on the
   page; expect 0 violations.

### 10.4 Component tests

`J0FailureModeGrid.test.tsx`:

- Renders 10 cards on desktop viewport.
- Hover triggers `data-state="preview"` on the hovered card only.
- Click on card #1 navigates to `/intelligence/failure-modes/phantom-sponsor`.
- Mobile viewport renders 5 cards + Show All button.
- Reduced-motion preference disables transitions.

### 10.5 E2E tests (Chrome MCP / Playwright)

- Cold load → all 10 cards visible.
- Click card #8 → URL becomes `/intelligence/failure-modes/pilot-to-production-gap`.
- Click "Open Sentinel" → URL becomes `/intelligence/ask` and chat surface loads.
- Click "Browse topics" → URL becomes `/intelligence/topics` and placeholder loads.

---

## Part 11 — Sliced implementation plan within INT-1

INT-1 itself is one slice but it has internal sub-stages that ship
in order. Each sub-stage is independently mergeable.

| Sub-slice | Scope | Owner | Blocks |
|---|---|---|---|
| **INT-1.0** | This document signed off; open decisions resolved | Founder review | All sub-slices below |
| **INT-1.1** | Card registry shape + validation test suite (no card content yet beyond #1 and #8 from FAILURE_MODE_CARDS_DRAFT.md) | Claude | INT-1.2 |
| **INT-1.2** | Cards #2–7, #9, #10 authored to voice rules; founder review | Claude (draft) + Founder (review) | INT-1.3 |
| **INT-1.3** | `J0FailureModeGrid` + `J0FailureModeCard` components; `/intelligence/page.tsx` reshape | Claude | INT-1.4 |
| **INT-1.4** | Mobile responsive + keyboard + accessibility + reduced-motion | Claude | INT-1.5 |
| **INT-1.5** | Telemetry events wired to PostHog | Claude | INT-1.6 |
| **INT-1.6** | E2E + Lighthouse + axe-core in CI | Claude | INT-1 close |
| **INT-1.7** | `/intelligence/failure-modes/<slug>` placeholder page; `/intelligence/ask` chat-preservation page | Claude | INT-1 close |

INT-1 closes when 1.0 through 1.7 are merged.

---

## Part 12 — Migration from current state

Current shipped state (after PR-INT-A through PR-INT-G) on
`/intelligence`:

- Page header: *"Ask Sentinel about the corpus"*
- Sentinel agent canvas (chat dominant, ~60% width)
- Sentinel reactive panel (right, ~35% width)
- Pattern library `<details>` accordion (collapsed by default)
- Filter pills above
- Stale tools wired (`search_patterns`, `pattern_neighborhood`,
  `evidence_lookup`, `validate_synthesis`)

INT-1 transition:

| What | From | To |
|---|---|---|
| Page header | "Ask Sentinel about the corpus" | "Why enterprise AI transformation fails — and how AbarVa prevents it." |
| Primary content | `IntelligenceAgentCanvas` | `J0FailureModeGrid` |
| Secondary content | Pattern library accordion | (removed at INT-1; reappears as part of J1 in INT-2) |
| Filter pills | Above page | (removed; topic browser in INT-2 carries the filtering) |
| Affordances | None | "Browse topics" + "Open Sentinel" in header |
| `/intelligence/ask` | Did not exist | New route hosting the preserved chat (relocated from `/intelligence`) |
| Tools registered for `/intelligence` | All four | (no longer applicable; chat moved to `/intelligence/ask`. Tools should re-register for that surface or stay registered for `/intelligence` if J3 expands the chat back into J0 — TBD per INT-5 design) |

The 7 PRs already shipped are NOT reverted. Their plumbing (broker
boundary, surface canonicalization, artifact channel, tenant-key
mapping) survives unchanged. The *page* gets reshaped.

---

## Part 13 — Reviewer instructions

Read in this order:

1. **Part 1 (premise + scope)** — confirm INT-1 boundaries match
   what you want shipped before INT-2 starts.
2. **Part 9 (open decisions)** — these block ship; founder verdict
   needed on items 1 (auth gate), 2 (editorial names), 3 (cited
   patterns), 4 (sort order), 5 (mobile sort), 6 (placeholder
   content shape), 7 (already self-resolved by adding to FR-053),
   8 (already self-resolved).
3. **Part 4 (wireframes)** — confirm the card grid layout and
   interactions match what you visualized.
4. **Part 2 (functional requirements)** + **Part 3 (non-functional
   requirements)** — flag any requirement that's wrong, missing,
   or over-specified.
5. **Part 7 (workflows)** — confirm the user actions and system
   responses match the experience you intend.
6. **Part 10 (acceptance criteria + test plan)** — these become
   the contract for "done."
7. **Part 12 (migration)** — confirm the transition from shipped
   state to INT-1 state is acceptable (specifically: chat moves
   to `/intelligence/ask`; pattern library accordion is removed).

**The two decisions that decide whether INT-1 starts:**

- **D1 — auth gate on `/intelligence`** (§9 item 1): does cold-visitor
  J0 land on the same URL as authenticated J0? If yes, the proxy
  middleware needs a change.
- **D2 — placeholder shape for `/intelligence/failure-modes/<slug>`**
  (§9 item 6): how much of the card content does the placeholder
  render?

If D1 and D2 are answered and items 2–5 are confirmed, INT-1.0 is
done and INT-1.1 can start.

---

**End of INT-1 Detailed Design Spec v1.**
