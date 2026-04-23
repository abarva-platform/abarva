# Page-Agent Coherence Work Order

**Purpose:** Wire the page and the agent as one system, not two. Every visual element has a corresponding conversational affordance; every conversational move has a corresponding page state; every click renders in-place or navigates to a canonical destination. No dead ends. No orphan pages.

**Core design principle:** The page and the agent are two views of the same state. When the user's attention shifts on the page, the agent follows. When the agent suggests an action, the page reflects it. There is no seam between them.

**This work order covers three items:**

1. **Attention-event protocol** — how the page tells the agent what the user is looking at
2. **Drawer-over-page pattern** — how cross-surface handoffs preserve context
3. **Dead-link QA sweep** — pre-demo defect sweep across every clickable element

Apply the Agent Autonomy Charter. Decide and move on Tier 1/2, flag and proceed on Tier 3.

---

## Section 1 · Attention-event protocol

### 1.1 · What this is and why

Every significant UI element emits an "attention event" to the agent context provider when the user interacts with it. The agent reads the event and updates its active conversation topic silently. The agent does not narrate every click ("you clicked the KPI strip. you clicked the decision log.") — that's noise. The agent updates state and surfaces a new prompt only when the context genuinely introduces a decision opportunity or the user pauses long enough to imply "what next?"

The goal: when a user clicks a pressure card on Control Tower, Atlas is already thinking about that specific pressure by the time the user looks at the rail. The agent doesn't ask "what would you like to discuss?" because Atlas already knows.

### 1.2 · Event taxonomy

Four event types cover 95% of interactions:

**`focus`** — user is looking at a specific element (click, hover-with-dwell, scroll-into-view with dwell threshold)
- Payload: element kind, element identifier, surface, tenant, timestamp
- Example: `{ kind: 'pressure-card', id: 'ambient-overlap', surface: 'tower', tenant: 'meridian-health', ts: ... }`

**`select`** — user explicitly selected or drilled into something
- Payload: element kind, element identifier, action taken
- Example: `{ kind: 'deliverable-row', id: 'D17', action: 'open' }`

**`complete`** — user finished a discrete action (form submission, choice click, navigation completion)
- Payload: action kind, result
- Example: `{ kind: 'guided-choice', result: 'assign-owner', chosen: 'CMIO' }`

**`idle`** — user paused beyond a threshold (4-6 seconds of no interaction on the current page)
- Payload: duration, last event
- Signal: agent may surface a proactive prompt

### 1.3 · Implementation shape

```tsx
// src/lib/agent-context/attention-events.ts
type AttentionEvent =
  | { type: 'focus'; kind: ElementKind; id: string; ... }
  | { type: 'select'; kind: ElementKind; id: string; action: string; ... }
  | { type: 'complete'; kind: ActionKind; result: string; ... }
  | { type: 'idle'; duration: number; lastEvent: AttentionEvent; ... };

export function useAttentionEvents() {
  const { emit } = useAgent();
  return { emit };
}
```

Every significant UI element wraps itself in or imports a hook that emits on interaction:

```tsx
<PressureCard
  id="ambient-overlap"
  onClick={() => {
    emit({ type: 'select', kind: 'pressure-card', id: 'ambient-overlap', action: 'open' });
    navigate(pressureCardHref);
  }}
/>
```

Wrapper components handle the emission automatically — `<FocusableCard>`, `<ClickableRow>`, `<ExpandableSection>` — so page authors don't write the emit call manually.

### 1.4 · What the agent does with the event

The agent context provider maintains a "current focus" that updates on every `select` event. The rail's opening prompt re-renders based on current focus. The agent does **not** narrate the focus change — silent state update only.

Proactive prompts surface only on:
- `idle` event after a threshold (4-6 sec dwell)
- `complete` event where a natural next action follows (e.g., user assigned an owner → agent suggests "queue a reminder before the council meeting")
- Explicit user re-engagement (user clicks the rail or types in the free-text field)

### 1.5 · Silent-update examples

- User clicks D17 in the Phase 3 deliverable list → Nexus silently updates context to D17; when user later clicks the rail, the opening prompt is about D17
- User hovers on a KPI card for 2 seconds → Nexus silently notes the focus; next prompt references that KPI
- User clicks the source-pattern link → Sentinel inherits the handoff context (see Section 2); doesn't re-ask what pattern is being discussed

### 1.6 · Pre-decided taxonomy (don't re-ask)

- Element kinds: `pressure-card`, `deliverable-row`, `kpi-card`, `chart-point`, `table-row`, `evidence-citation`, `pattern-card`, `program-card`, `phase-timeline-node`, `nav-link`, `sidebar-item`. Extend additively if new kinds appear; don't rename.
- Idle threshold: 5 seconds.
- Focus events emit on click and on 1-second hover dwell (not on hover alone — noisy).
- Complete events always trigger an agent prompt evaluation; focus events trigger only if no proactive prompt has surfaced in the last 10 seconds.

### 1.7 · Acceptance

- [ ] Attention-event system exists as a React context with typed event shapes
- [ ] At least 10 wrapper components emit events
- [ ] Agent rail's opening prompt updates silently on `select` events
- [ ] Proactive prompts surface only on `idle`, `complete`, or explicit re-engagement
- [ ] Integration test: user clicks pressure card, rail's next render shows pressure-specific opening prompt
- [ ] No console narration or UI chrome narrating focus changes

---

## Section 2 · Drawer-over-page pattern

### 2.1 · What this is and why

When a cross-surface handoff occurs (e.g., Atlas hands to Sentinel because the user clicked "see related pattern" on a Tower pressure card), the target surface should load as a right-side drawer over the current page, not as a navigation away. User dismisses the drawer and is back on Tower exactly where they left off — same scroll position, same conversation history, same focused element.

This prevents the "lost in nav" feeling during cross-agent moments and is what makes the four-surface product feel coherent rather than modal.

### 2.2 · When to use drawer vs. navigation

**Use drawer (over-page render):**
- Cross-surface handoff where the user is mid-task on the source surface
- Pattern detail invoked from a deliverable ("see related pattern" on D17 → pattern page as drawer over D17)
- Pattern detail invoked from a Tower pressure ("see related pattern" on pressure card → pattern as drawer over Tower)
- Evidence source expanded from an inline citation (E1 chip → drawer with evidence detail)
- Related program invoked from a pattern ("applicable program" on Ambient pattern → program page as drawer over pattern)

**Use navigation (page-level route change):**
- User explicitly navigates (clicks nav link, clicks breadcrumb, clicks a CTA labeled "Open →")
- User opens a deliverable from a phase view (primary task, not secondary reference)
- User switches tenants
- User clicks "go to source" / "open full page" from inside a drawer (drawer promotes to full page)

**Rule of thumb:** if the user is going somewhere to read reference material that supports their current task, drawer. If the user is switching their primary task, navigate.

### 2.3 · Drawer behavior spec

**Size:** 70-75% of viewport width; full viewport height; slides in from right edge.

**Dismissal:** ESC key, click outside the drawer, explicit close button in top-right. All three preserve source page state.

**Promotion:** "Open full page →" button in drawer top-right converts the drawer to a real navigation. Drawer dismisses; browser navigates to the drawer's content URL. Source page state lost (user chose to leave).

**Stacking:** maximum one drawer at a time. If user opens a drawer-from-a-drawer (e.g., inside a pattern drawer, clicks an evidence source), the nested drawer replaces the current drawer. Breadcrumb inside the drawer shows both levels.

**URL handling:** drawer content has a URL fragment (e.g., `?drawer=pattern:ambient-clinical-value-chain`) so the state is shareable/bookmarkable. Back button closes the drawer first; then navigates the source page.

**Agent rail behavior:** when a drawer opens with cross-agent content, the agent rail shows a brief transition indicator (Atlas → Sentinel), then the target agent takes primary. When drawer dismisses, rail returns to source agent with prior history preserved.

### 2.4 · Implementation shape

```tsx
// src/lib/drawer/DrawerProvider.tsx
type DrawerState = {
  open: boolean;
  content: { url: string; type: 'pattern' | 'evidence' | 'program' | 'deliverable'; id: string };
  sourceSurface: Surface;
  sourceScrollY: number;
};

export function useDrawer() { ... }

<button onClick={() => openDrawer({
  type: 'pattern',
  id: 'ambient-clinical-value-chain',
  tenantScoped: true,
})}>
  See related pattern
</button>
```

### 2.5 · Pre-decided behaviors (don't re-ask)

- Drawer width: 72% viewport; on mobile, full-width overlay
- Animation: 200ms slide-in from right; 150ms slide-out
- Only one drawer at a time; nested drawers replace current
- ESC, click-outside, and close button all dismiss
- Drawer content URL in fragment, not full URL (source page URL preserved)
- Back button dismisses drawer before navigating source page
- Agent rail: target agent takes primary when drawer has cross-agent content; reverts on dismiss

### 2.6 · Acceptance

- [ ] Drawer component exists; triggers from any context with `openDrawer({...})`
- [ ] Pattern detail loads as drawer from Tower pressure cards, deliverable pages, program pages
- [ ] Evidence citations (E1, E2, ...) open evidence detail as drawer
- [ ] Drawer dismiss preserves source page scroll, focus, and agent conversation state
- [ ] "Open full page" promotes drawer to navigation
- [ ] URL fragment reflects drawer state; bookmarkable
- [ ] Back button closes drawer before navigating
- [ ] Agent rail handles agent handoff during drawer transitions
- [ ] Mobile: drawer becomes full-width overlay; all other behaviors preserved

---

## Section 3 · Dead-link QA sweep

### 3.1 · What this is and why

Systematic sweep catching every "looks-like-a-link-but-isn't" defect, every 404, every orphaned legacy route, every missing destination across the authenticated surfaces. Runs before demo rehearsal, not during. Four-layer approach.

### 3.2 · Layer 1 — automated link crawler (extended from Tier 1)

Tier 1 already built a link crawler. Extend its coverage:

- Crawl every route returned by the canonical URL patterns (Part 4.1 of seed spec)
- For each page, follow every `<a href>` and every `<button onClick>` that triggers navigation
- Assert 200 responses; flag 3xx/4xx/5xx with specific URLs
- Assert no redirect chain longer than 1 hop
- Assert no external navigation to `nexus-vert-kappa.vercel.app` or any pre-canon URL
- Assert no links to `abarva.local`, `localhost`, or unresolved template strings

**Report shape:**

```
reports/link-crawler-{timestamp}.json
{
  summary: { totalRoutes, totalLinks, dead, redirects, external_flagged },
  dead_links: [{ from: url, to: url, reason: string }],
  redirects: [{ from, to, hops }],
  external_flagged: [{ from, to }]
}
```

**Acceptance:** zero dead links; zero pre-canon URLs; redirects only for canonical path cleanup.

### 3.3 · Layer 2 — DOM integrity linter

Automated check scanning the rendered DOM of every page for "looks-like-a-link-but-isn't" patterns:

- `<a href="#">` or `<a href="">`  (placeholder hrefs)
- `<a href="javascript:void(0)">` (no-op hrefs)
- `<button onClick="">` with no handler
- Clickable elements with `cursor: pointer` but no navigation target or event handler
- Text strings matching `{{...}}`, `${...}`, `TBD`, `Coming soon`, `placeholder`, or `Lorem ipsum`
- Empty button or link elements (no text content, no aria-label)

**Implementation:** run this as a Playwright or Jest DOM test against the rendered output of every canonical route. Fail the build on any violation.

**Report shape:**

```
reports/dom-integrity-{timestamp}.json
{
  summary: { totalPages, violations },
  violations: [{ page: url, element: selector, kind: string, snippet: string }]
}
```

**Acceptance:** zero violations across all canonical routes. CI gate blocks merges with any violation.

### 3.4 · Layer 3 — manual walk checklist

Before demo rehearsal, a human walks the three critical click paths end-to-end. Recorded for regression diffing.

**Walk 1 — Prat golden path:**

1. Home → Apex Retail tenant selected
2. Programs → Morrison program page
3. Phase 3 view → D17 Decision Memo
4. D17 exec summary, KPI strip, recommendation body, data table, chart, decision log, risks
5. D17 cross-links: source pattern (drawer), prerequisite D16, downstream D18/D19
6. Back to D17 → Phase 4 view → D19 Delivery Plan
7. D19 back to Morrison program
8. Morrison → Phase 5 → D25 Stub (activation state)
9. Phase 5 → D26, D27, D28 all as Stubs (all render)
10. Source pattern link → Owned Brand Margin Recovery (drawer)
11. Pattern "applicable programs" → Morrison back-link works
12. Control Tower → three pressure cards
13. "See related pattern" from ambient overlap pressure → Ambient pattern (drawer)
14. Dismiss drawer → back on Tower with scroll preserved
15. Tenant switch to Meridian → everything re-scopes

Each step: does it render correctly, does the click lead where expected, does the back-button preserve state, does the agent rail update context.

**Walk 2 — Anthology investor path:**

1. Investor page landing (assumes one exists — if not, flag)
2. Traction section with product proof links
3. Morrison link opens Morrison program (new tab)
4. Ambient pattern link opens pattern page (new tab)
5. Control Tower link opens Tower (new tab)
6. Back to investor page → FAQ section
7. Data room request form submission

**Walk 3 — Design partner path:**

1. Home → Platform page
2. Architecture section → agent roster → integrations → pricing
3. "Request technical deep dive" CTA

**Recording:** walks 1-3 recorded (screen + voiceover). Saved to `docs/walk-validation/{date}-walks/`. Regressions identified by diffing recordings across rehearsals.

**Acceptance:** all three walks pass without defect on T-7 rehearsal. Defects logged and fixed before T-3.

### 3.5 · Layer 4 — production 404 monitoring

Tier 3 item 3.7 formalized:

- Vercel middleware logs any 404 occurring in production
- Log structure: user agent, referrer, requested path, timestamp
- Alert threshold: >3 distinct 404s in a 10-minute window
- Alerts route to Anand + Claude Code's active session

**Acceptance:** monitoring active; baseline report (first week of data) filed.

### 3.6 · Sweep cadence

- **Layers 1-2 (automated):** run on every PR; block merges on failure
- **Layer 3 (manual walks):** T-7 days before demo, T-3, T-1
- **Layer 4 (production monitoring):** continuous; active before demo

### 3.7 · Pre-decided rules (don't re-ask)

- Zero tolerance for dead links in CI — build fails on any violation
- Zero tolerance for pre-canon URLs (`nexus-vert-kappa.vercel.app`, `abarva.local`, `localhost`) in rendered pages
- External links always open in new tabs with explicit indicator (small external-link icon)
- Internal links never open in new tabs unless user explicitly opted (via cmd+click, etc.)
- Placeholder strings (`TBD`, `Coming soon`, `{{var}}`) are always violations — no exceptions
- Walk recordings saved to `docs/walk-validation/`; committed to repo

### 3.8 · Acceptance (sweep)

- [ ] Layer 1 crawler extended and reporting clean
- [ ] Layer 2 DOM linter added as CI gate; reporting clean
- [ ] Layer 3 walk checklist documented; first walk recorded
- [ ] Layer 4 production monitoring active
- [ ] Full sweep completes with zero defects before T-3 rehearsal

---

## Section 4 · Supporting design principles (apply across all three items)

### 4.1 · Mode-matching prompt length

The agent uses four distinct conversation modes; page-agent wiring should respect all four.

- **Opening mode** (short) — one-sentence situational read + one-sentence question + 3-4 guided choices + "something else" escape. Used when user lands on a page fresh.
- **Reasoning mode** (longer) — 2-4 paragraphs, named trade-offs, sourced claims, followed by 3-4 guided choices. Used when user asks the agent to think through something.
- **Drafting mode** (task-length) — output length determined by the task. Guided choices appear after draft completes. Used when agent produces content.
- **Confirming mode** (terse) — one line. Used on routine confirmations.

Don't force uniform length. Match the mode to the interaction.

### 4.2 · Guided-choice as the primary affordance

- 3-5 option chips. Never more than 5; past 5 the list stops feeling like guidance and starts feeling like a menu.
- "Something else" free-text input is always visible (not hidden behind a toggle), positioned below the chips.
- Chips and free-text submit to the same handler. Free text that matches a chip's intent is treated as the chip selection.
- Chips are single-click submit (not select-then-confirm).

### 4.3 · Silent state updates, surfaced prompts

- Agent updates internal context on every `focus` and `select` event silently. No narration.
- Agent surfaces a new prompt only on: `idle` threshold exceeded, `complete` event with natural next action, explicit user re-engagement (click rail, type in free text).
- Rule of thumb: if the prompt wouldn't pass the "is this genuinely useful right now?" test, don't surface it.

### 4.4 · No orphan navigation

- Every click either renders in-place (expansion, drawer, sidenote) or navigates to a canonical URL (Part 4.1 patterns).
- No `href="#"`, no `onClick=""`, no "coming soon."
- External links open in new tabs with explicit indicator.
- Internal navigation respects back-button: user can always retrace without losing state.

### 4.5 · Same-page rendering rules

| Interaction | Pattern |
|---|---|
| Expand row detail | In-place row expansion |
| Expand chart data point | Right-side drawer with breakdown |
| Expand evidence citation | Sidenote popover OR drawer depending on length |
| Expand related content | Drawer |
| Cross-surface reference | Drawer with target agent taking primary |
| Primary task switch | Navigation to canonical URL |
| Tenant switch | Full page reload with full re-scope |

---

## Section 5 · Implementation order

Execute in this order. Items 1-3 are independent; items 4-6 build on earlier infrastructure.

1. **Layer 1 link crawler extension** — highest leverage; runs on every PR; catches regressions immediately
2. **Layer 2 DOM integrity linter** — next CI gate; catches the "looks-like-a-link" defects
3. **Attention-event protocol** — agent-centric foundation for remaining agent anchoring work
4. **Drawer component** — unlocks the cross-surface handoff pattern; required for Atlas → Sentinel flows
5. **Drawer wiring** — pattern detail as drawer, evidence as drawer, related programs as drawer
6. **Manual walk checklist** — run first walk after items 1-5 are in place; document defects

---

## Section 6 · Integration with existing work

- **Tier 1 link crawler (shipped)** — extended here, not replaced
- **Agent anchoring guide (shipped)** — this work order provides the wiring layer for the anchoring contract
- **Wave 2 agent primitives (PR #114)** — the drawer component uses these; the guided-choice input is already built
- **Morrison Rich authoring (in flight)** — the attention-event wrappers applied to Rich deliverables; no content rework needed

---

## Section 7 · Autonomy reminders

Per the Agent Autonomy Charter:

- Tier 1 decisions: decide silently and move
- Tier 2 decisions: decide, document inline, don't flag
- Tier 3 decisions: decide, flag with recommendation and cost of delay, proceed with default
- Tier 4 decisions: stop only for integrity conflicts, seed narrative impact, security, >2x scope, or demo-path defects

Pre-decided for this work order (don't re-ask):

- Event taxonomy and thresholds (Section 1.6)
- Drawer sizing, animation, dismissal, URL handling (Section 2.5)
- QA sweep cadence and tolerance rules (Section 3.7)
- Conversation mode definitions (Section 4.1)
- Guided-choice pattern (Section 4.2)

---

## Section 8 · Completion protocol

Per-item PRs. One item per PR. Clear commit messages referencing section numbers.

When items complete:

- Update `WAVE-2-AGENT-COORDINATION.md` with status
- Append completion summary to `reports/page-agent-coherence-completion-{timestamp}.md`
- Document any flags raised and defaults taken

End-of-cycle summary when all three items complete:

- Single summary in coordination file with status per item
- Walk recording #1 filed
- Sweep report (Layers 1-2) attached

---

## Section 9 · What this buys

When all three items complete:

- The page and the agent move in lockstep. Users never have to repeat themselves to the agent about what they're looking at.
- Cross-surface handoffs preserve context. Atlas handing to Sentinel feels like a continuation, not a detour.
- Dead-link defects are caught at CI, not at rehearsal. Demo day has zero broken clicks.
- The four-layer QA protocol catches ~99% of defects. Production monitoring catches the long tail.

This is the infrastructure that makes the product feel alive rather than assembled. Every interaction reinforces page-agent coherence. Every navigation is canonical. Every click works.

---

## Section 10 · One-line handoff

> Three items: attention-event protocol (Section 1), drawer-over-page pattern (Section 2), dead-link QA sweep (Section 3). Design principles in Section 4. Order in Section 5 — link crawler and DOM linter first, attention events next, drawer component and wiring after, manual walk last. Apply autonomy charter; pre-decided items in Sections 1.6, 2.5, 3.7. Integration test acceptance at the end of each section. Coordination file updates per completion protocol.

---

*End of Page-Agent Coherence Work Order. Execute.*
