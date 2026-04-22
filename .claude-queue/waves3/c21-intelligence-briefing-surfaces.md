# C21 · Intelligence Briefing Surfaces

**The list and detail pages for What's-Changed Briefings. The home page (C11) renders the most recent briefing inline; these pages are for browsing, searching, and deep-reading briefings across time. Where Prat Bet #1 (Anticipation) becomes a navigable surface.**

**April 21, 2026 · Wave 3 · For Codex execution**

Reads alongside:
- `whats-changed-briefing-engine.md` — the briefing engine this renders
- `c11-composite-home-template.md` — the home page where the latest briefing also renders

---

## Part 1 · What these surfaces are

### 1.1 · The two pages

**Briefing list page (`/app/t/[tenant-id]/intelligence/briefings`).** Chronological list of all briefings generated for the user. Searchable, filterable. This is the Memory vibe — the history of what AbarVa was paying attention to across time.

**Briefing detail page (`/app/t/[tenant-id]/intelligence/briefings/[briefing-id]`).** A single briefing rendered in full. Deep-readable. Interactive entity links throughout. Follow-up query affordances. Used when the user wants to revisit a specific briefing, share it, or drill deeply.

### 1.2 · The demo moment

A design partner in month three says: "remember that briefing from two weeks ago where you flagged the regulatory thing? I need to reread that — send it to me." The user opens the briefing list, filters to the past two weeks, finds it. One click, whole briefing rendered. Shareable URL.

That's the Memory vibe made concrete — not just "we generate briefings" but "we preserve the organization's thinking over time."

---

## Part 2 · Briefing list page

### 2.1 · Layout

**Page header.**
- Page title: "Intelligence Briefings" (Georgia 28px white)
- Subtitle: "What's been worth your attention across time." (DM Sans 14px warm off-white, 70% opacity)

**Filter bar (below header, horizontal row).**
- Date range selector (defaults to past 30 days)
- Category filter (all / KPI drift / pattern shift / peer move / regulatory / commitment / contradiction)
- Search input (DM Sans, placeholder "Search briefing content...")
- User filter (for admin contexts where browsing multiple users' briefings — most users see only their own)

**Briefing list (main content area).**
- Each briefing rendered as a card
- Reverse chronological order (most recent first)

### 2.2 · Per-briefing card

**Card structure:**
- Date and time (JetBrains Mono 11px teal uppercase: "TUE · APR 21 · 9:42 AM")
- Briefing headline derived from opening_line or composed summary (Georgia 18px white, 2-line clamp)
- Preview text from first section (DM Sans 13px warm off-white, 3-line clamp, ellipsis truncation)
- Metadata row at bottom (DM Sans 11px, 500):
  - Section count ("4 sections · 7 items")
  - Reading time ("4 min read")
  - Interaction indicator if applicable ("You opened this · clicked 3 items")

**Card interactions:**
- Click card body → navigate to briefing detail
- Hover: subtle teal border glow, cursor pointer

**Card visual style:**
- Dark card background with subtle border
- Generous padding (24-32px)
- ~16-24px gap between cards

### 2.3 · Infinite scroll or pagination

- Load 20 briefings initially
- Infinite scroll loads more as user scrolls to bottom
- Skeleton shimmer during load
- "No more briefings in this range" when exhausted

### 2.4 · Empty states

- No briefings yet: "Your first briefing will appear here once we've processed a day of intelligence layer changes."
- No results for search/filter: "Nothing matches these filters. Try broadening your date range or clearing the search."

### 2.5 · Sidebar context (optional, right rail)

- Total briefings in date range
- Interaction summary (user opened N, clicked through to M items, asked K follow-ups)
- Most-surfaced entities this period (top KPIs, people, patterns by briefing mentions)

This sidebar is secondary; mobile hides it.

---

## Part 3 · Briefing detail page

### 3.1 · Layout

**Page header.**
- Back link to briefing list ("← All briefings" · DM Sans 12px teal)
- Generation timestamp (JetBrains Mono 11px teal: "GENERATED TUE · APR 21 · 9:42 AM")
- Briefing title derived from opening_line or composed summary (Georgia 28-32px white)

**Opening greeting.**
- Rendered prominently at the top (DM Sans 16-18px warm off-white)
- Same structure as inline briefing on home page

**Sections (main content).**
- Each briefing section rendered as a distinct block
- Category label header (JetBrains Mono 11px teal uppercase)
- Items within section rendered with full detail

**Closing recommendation (at bottom).**
- Rendered as the closing line (DM Sans 16px warm off-white)
- If recommendations suggest next conversations, make them actionable

### 3.2 · Per-briefing-item render

**Same structure as on home page, expanded for deeper reading:**

- Headline (DM Sans 19-20px 700 white)
- Context paragraph (DM Sans 15px warm off-white, line-height 1.7)
- Why it matters (DM Sans 14-15px 500 white)
- Recommended action (delineated with teal left border, DM Sans 14px 500)

**Plus, on detail page but not home:**

- Full evidence chain (expandable section)
- Linked entities listed explicitly (e.g., "This item touches: [KPI] Same-day fulfillment · [Program] Digital Commerce Modernization · [Person] Marcus Whitfield")
- Confidence indicator (if low confidence, explicit callout)
- Source attribution for external signals (e.g., "Source: Target investor day transcript, Apr 20, 2026")
- Timestamp of last data refresh relevant to this item

**Item-level interactions:**
- Entity links clickable as usual
- "Ask a follow-up" opens conversational agent surface
- "Share this item" copies a link back to this detail page scoped to item
- "Mark as dismissed" removes from attention (logged for adaptation)
- "Mark as read" (implicit on scroll past; explicit button for accessibility)

### 3.3 · Timeline context (subtle footer on detail page)

Small section at bottom:
- "Previous briefing: [link to previous in user's timeline]"
- "Next briefing: [link to next]"
- "This briefing covered changes from [timestamp A] to [timestamp B]"

Enables users to walk backward and forward through their intelligence history.

### 3.4 · Share affordance

Small share button (discreet, not prominent):
- Copy shareable URL (authenticated to viewer; link doesn't bypass auth)
- Option to share specific item rather than whole briefing

### 3.5 · Print / export (low priority, ship if time)

- Clean print stylesheet
- Export to PDF preserving formatting

---

## Part 4 · Interactions beyond rendering

### 4.1 · Dismiss item

User clicks dismiss on a briefing item. Behavior:
- Item fades out in place (doesn't remove from briefing; marks as dismissed)
- Dismissal logged via user_dismissed_items on briefing entity
- Adaptation layer uses dismissal signal for future briefing category weighting

### 4.2 · Follow-up query

User clicks "Ask a follow-up" on an item. Behavior:
- Conversational agent surface opens (modal or side panel)
- Agent pre-loaded with the briefing item as context
- Starter prompt like "Tell me more about this" or user types their own
- Follow-up query logged for adaptation

### 4.3 · Feedback on briefing

At the bottom of the detail page, a subtle row:
- "Was this briefing helpful?" · [Helpful · Redundant · Incomplete · Other]
- User_feedback field on briefing entity captures response
- Adaptation layer uses feedback to tune composition

Don't make this intrusive — small, typographic, easy to skip.

### 4.4 · Save / bookmark

Optional. User can save a briefing for later reference. Saved briefings show in a subfolder of the list page.

---

## Part 5 · Integration with home page

The composite home page (C11) renders the most recent briefing inline. The list and detail pages are for:
- Browsing historical briefings
- Deep-reading a specific briefing
- Sharing
- Searching across briefings

The home page briefing section has a subtle link at the bottom: "View all briefings →" which navigates to the list page.

The list page has no special treatment for "today's briefing" — it's just the first one. When a user wants today's briefing, they go to home (C11), not to the list.

---

## Part 6 · Data dependencies

### 6.1 · Briefing data

- **Source:** Briefing entity from Briefing Engine (B1)
- **Fields used:** entire briefing with all sections and items
- **Access scope:** user can see only briefings generated for them (respects dual-scope model)

### 6.2 · User interaction data

- **Source:** briefing entity's user interaction fields (user_viewed_at, user_dwell_time_seconds, user_clicked_sections, user_followup_queries, user_dismissed_items, user_feedback)
- **Writes:** interactions logged back to briefing entity on user actions

### 6.3 · Entity resolution

- **Source:** intelligence layer graph
- **Computation:** briefing item's linked_entities render as navigable links to their detail pages

---

## Part 7 · Implementation specs

### 7.1 · Routing

- List page: `/app/t/[tenant-id]/intelligence/briefings`
- Detail page: `/app/t/[tenant-id]/intelligence/briefings/[briefing-id]`

### 7.2 · Component hierarchy

```
<BriefingListPage>
  <PageHeader />
  <FilterBar filters={filters} onChange={setFilters} />
  <BriefingCardList briefings={briefings} />
  <SidebarContext stats={periodStats} />
</BriefingListPage>

<BriefingDetailPage>
  <PageHeader briefing={briefing} />
  <OpeningSection briefing={briefing} />
  <BriefingSections sections={briefing.sections} />
  <ClosingSection briefing={briefing} />
  <TimelineContext previous={previous} next={next} />
  <FeedbackBar briefing={briefing} />
</BriefingDetailPage>
```

### 7.3 · Data loading

- List page: server-render first 20 briefings; infinite-scroll for more
- Detail page: server-render briefing; client-side for user interaction logging

### 7.4 · Design system

Matches C11 — Georgia serif, DM Sans, JetBrains Mono, near-black background, teal accent, warm off-white text. Same discipline.

### 7.5 · Accessibility

- All interactions keyboard-accessible
- Screen reader friendly (semantic headings, proper landmarks)
- Color contrast AA minimum

### 7.6 · Performance

- List page: lazy-load everything below fold
- Detail page: prioritize rendering the briefing text; defer secondary content

---

## Part 8 · Edge cases

### 8.1 · Empty briefing list

Graceful empty state as described in Part 2.4.

### 8.2 · Briefing not found (detail page)

404 with navigation back to list.

### 8.3 · Briefing scoped to different user

If user navigates to a briefing URL they don't have access to: 403 with explanation that briefings are scoped to their user.

### 8.4 · Very old briefings

Briefings older than 6 months may be archived to cold storage. Loading may be slower but still accessible.

### 8.5 · Briefing with empty sections

Some briefings may have only 1-2 populated sections (e.g., weekend with no peer moves and no regulatory changes). Render gracefully — don't show empty section headers.

---

## Part 9 · Testing

### 9.1 · Visual tests

- List page with 0, 1, 20, 100+ briefings
- Detail page with briefings of varying length and section count
- Mobile, tablet, desktop breakpoints
- Entity link rendering

### 9.2 · Interaction tests

- Filter changes update list
- Search updates list
- Infinite scroll loads more
- Dismiss item updates state
- Follow-up query opens agent surface
- Feedback logged
- Share link copied
- Previous/next navigation works

### 9.3 · Data tests

- User sees only their briefings
- Dual-scope filtering enforced on briefing items
- Interactions logged correctly

---

## Part 10 · Non-goals

- No cross-user briefing sharing beyond links (no team inbox)
- No email delivery of briefings (that's separate delivery channel work, future)
- No briefing generation triggers from UI (generation is automatic + event-driven)
- No manual briefing composition (briefings are AI-composed)
- No briefing templates or customization beyond preferences (preferences configured elsewhere)

---

## Part 11 · Ingestion notes for Codex

### 11.1 · Dependencies

- Briefing Engine schema and data (B1 from Wave 2)
- Design system from C11 (shared tokens, components)

### 11.2 · Coordination with C11

C11 and C21 share components:
- Briefing item renderer
- Entity link component
- Follow-up query flow

Build these as shared components so both pages use the same implementation.

### 11.3 · Interaction logging

Every user interaction (view, click, dismiss, follow-up, feedback) logs to the briefing entity. Make sure the write path is resilient — don't fail user interactions if logging fails.

### 11.4 · Progressive enhancement

Detail page should be readable even if JavaScript fails to load — progressive enhancement for interactive features.

---

**END C21 · INTELLIGENCE BRIEFING SURFACES**

*Where Prat Bet #1 (Anticipation) becomes navigable across time. The Memory vibe made concrete.*
