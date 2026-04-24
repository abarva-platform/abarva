# 04 · Visual and Interaction System

**Document:** AbarVa's visual and interaction system — design tokens, layout zones, component behaviors, and interaction rules
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companions:** Documents 00-03 (read first)
**Framework reference:** Section 10 of Agent-Centric Product Design Framework

This document specifies the visual language and interaction patterns that all five AbarVa surfaces inherit. It is subordinate to document 01 (which says *why* surfaces should feel a certain way) and document 03 (which says *what* agents render on each surface). This document says *how* the rendering looks and behaves.

The document is not a comprehensive design system replacing `src/lib/design-system.ts`. It is the operating-principles layer that governs how that design system is used consistently across surfaces.

## Quality bar

Every AbarVa surface should feel:

- **Premium.** High-craft. Enterprise-grade. Not startup-y.
- **Calm.** Restrained use of color. Measured density. No visual anxiety.
- **High-trust.** Specific over vague. Cited over assertive. Evidence-forward.
- **Structured.** Clear hierarchy. Clear priority. Clear next action.
- **Decision-oriented.** Every view leads to action, not to further browsing.
- **Boardroom-ready.** A CFO or board director could look at any screen without embarrassment.

Every AbarVa surface must avoid feeling:

- **Generic.** Indistinguishable from generic SaaS dashboards.
- **Noisy.** Visually crowded. Too many cards. Too many colors.
- **Chatbot-attached.** Main surface plus chat rail as dominant composition.
- **Procurement-portal-like.** Transactional forms dominating.
- **Consulting-deck-like.** Static content pretending to be live.

## The foundational layout model

Every AbarVa surface composes from five zones. The zones are the vocabulary of the visual system. Component spec decisions reference these zones.

### Zone A · Top header

**Purpose:** Orient the user. Answer "Where am I?"

**Contents:**
- Tenant identifier (top-left, small, persistent)
- Wordmark or page title (primary)
- Breadcrumb (when applicable)
- Persistent navigation (surface switchers)
- Account menu (top-right)

**Constraints:**
- Maximum 64px height on desktop, 48px on mobile
- Background matches surface treatment (dark surfaces use dark header; light surfaces use lighter)
- No primary content lives here — pure navigation

### Zone B · Context strip

**Purpose:** Show work-object-level context. Answer part of "Where am I?" specifically about the work in motion.

**Contents:**
- Work object name and identifier (MRD-01 · Ambient Clinical Value Chain Activation)
- Current phase or stage badge
- Lifecycle status
- Owner or sponsor
- Key metadata (created date, last updated)

**Constraints:**
- Maximum 80px height on desktop
- Appears on detail surfaces only (not on index or landing pages)
- Uses structured typography — tenant name small, work object name prominent, metadata small

### Zone C · Primary workspace

**Purpose:** Where work happens. Answer "What matters right now?" and "What is blocked or at risk?"

**Contents:**
- Agent editorial block (mandatory, at top of zone — leads the surface)
- Evidence blocks (metrics, tables, cards, drawers)
- Action affordances inline with evidence

**Constraints:**
- Takes the largest share of the surface (typically 60-75% of vertical real estate)
- Agent editorial leads; evidence follows below
- Progressive disclosure — essential content above fold, detail in drawers or expandable sections

### Zone D · Agent rail (right)

**Purpose:** Persistent agent guidance. Contextual to the current surface and work object.

**Contents:**
- Agent identifier (which agent is speaking)
- Current turn content (response body, citations, confidence)
- Suggested actions (three plus custom)
- Handoff affordances (if applicable)
- Chat input at bottom of rail

**Constraints:**
- Fixed width on desktop (typically 360-420px)
- Collapsible on mobile (becomes bottom-sheet or full-screen)
- Never decorative — if the rail has no active content, rail hides
- Agent editorial in rail complements main surface editorial, does not duplicate it

### Zone E · Drawer or detail layer

**Purpose:** Progressive disclosure. Detail content that does not fit above fold.

**Contents:**
- Artifact inspection
- Evidence drill-downs
- Citation details
- Historical data (gate history, stage history, audit trail)
- Admin detail views

**Constraints:**
- Opens from explicit user action (click, drawer toggle)
- Does not open modally unless blocking context required
- Preserves context behind it
- Closes cleanly returning to prior state

## Layout compositions per surface

Each of the five surfaces composes these zones in specific ways. Deviations are violations.

### Programs index

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header (tenant, wordmark, nav)              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone C · Primary workspace                                │
│   [Nexus portfolio editorial — 2-3 sentences]             │
│   [Programs grid or table with status, owner, value]      │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone D · Agent rail (Nexus, portfolio-scoped)             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

No Zone B (no specific work object). Zone D is portfolio-scoped Nexus.

### Program detail

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                       │
├─────────────────────────────────────────────────────────┤
│ Zone B · Context strip (program name, phase, owner)      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone C · Primary workspace                                │
│   [Nexus program editorial — leads the surface]           │
│   [Phase timeline / gate status]                          │
│   [Deliverables grid]                                     │
│   [Risk register / decision queue]                        │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone D · Agent rail (Nexus, program-scoped)               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

Zone B populated. Zone D is program-specific Nexus.

### Source event canvas (Nexus Engagement Canvas)

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                       │
├─────────────────────────────────────────────────────────┤
│ Zone B · Context strip (event name, stage, archetype)    │
├─────────────────────────────────────────────────────────┤
│ Journey Tracker (ten stages, state-aware)                 │
├──────────┬──────────────────────────────┬───────────────┤
│ Left     │                              │                │
│ stage    │ Zone C · Primary workspace   │ Zone D · Rail  │
│ panel    │   [Nexus editorial]          │ (Nexus +       │
│          │   [Active stage workspace]   │ Sentinel +     │
│          │                              │ Steward        │
│          │                              │ participation) │
│          │                              │                │
└──────────┴──────────────────────────────┴───────────────┘
```

Journey Tracker is a Source-specific zone between Context Strip and Primary Workspace. Left stage panel is Source-specific. Both are defined in the Sourcing Workbench Build Pack and inherited here.

### Intelligence library landing

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone C · Primary workspace                                │
│   [Sentinel library narration — leads the surface]        │
│   [Pattern catalog grid — tier-organized]                 │
│   [Recent activity feed]                                  │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone D · Agent rail (Sentinel, library-scoped)            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

No Zone B. Zone D is library-scoped Sentinel.

### Pattern detail (within Intelligence)

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                       │
├─────────────────────────────────────────────────────────┤
│ Zone B · Context strip (pattern name, tier, status)       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone C · Primary workspace                                │
│   [Pattern content — Sections A through J]                │
│   [Evidence drawer affordance]                            │
│   [Cross-references]                                      │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone D · Agent rail (Sentinel, pattern-scoped)            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

Exception to the "agent editorial leads" rule (per the exception noted in document 01): on pattern detail pages, pattern content is the primary content. Sentinel annotates, retrieves, validates — but pattern content leads the surface. This is the pattern-IS-the-content exception.

### Control Tower

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone C · Primary workspace                                │
│   [Atlas portfolio editorial — leads the surface]         │
│   [Pressure cards — 2-4 highest pressures]                │
│   [Portfolio metrics — Use Cases, Contradictions,         │
│    Unowned Risks, Spend, Last-Turn-Ago]                   │
│   [Active programs / events list]                         │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone D · Agent rail (Atlas)                               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

No Zone B. Atlas editorial mandatory at top of Zone C — this is what separates Tower from a dashboard graveyard.

### Setup/Admin landing

```
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone C · Primary workspace                                │
│   [Steward operational editorial — leads the surface]     │
│   [Priority action list]                                  │
│   [Admin category tiles: Users / Connectors / Audit /     │
│    Quality / Patterns]                                    │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Zone D · Agent rail (Steward)                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

No Zone B. Steward editorial mandatory.

## Design tokens

Reference existing tokens in `src/lib/design-system.ts`. The tokens below are the operating principles for how those tokens get applied.

### Color

**Surface treatments:**
- **Dark surfaces** (Programs, Source, Tower, Intelligence library): deep background, cream or off-white text, teal primary accent
- **Light surfaces** (Admin detail pages, specific settings contexts): light background, dark text, teal primary accent

**Semantic colors (applied consistently across surfaces):**
- **Teal** — primary action, active state, agent voice accent
- **Amber** — warning, attention needed
- **Red** — critical, blocking, at-risk
- **Green** — healthy, complete, approved
- **Gray / neutral** — metadata, secondary text, chrome

**Restraint principle:** At any moment on any surface, the total number of distinct accent colors visible should be no more than four. Over-coloration is a canonical anti-pattern (per document 01).

**What must not happen:**
- Rainbow status systems (six colors for six states)
- Color without text (status color alone without text label is a violation)
- Decorative color (color used for aesthetic variety rather than semantic meaning)

### Typography

**Hierarchy:**
- **Serif (Georgia or equivalent)** — page titles, major headlines, major value figures (dollar amounts, key metrics)
- **Sans-serif (DM Sans or equivalent)** — body copy, table text, action labels, UI chrome
- **Monospace (JetBrains Mono or equivalent)** — labels (11-12px, uppercase), codes, metadata, state chips, technical identifiers

**Size scale (reference, not prescriptive):**
- Display: 32-48px (hero titles, large value figures)
- Heading 1: 24-28px (section titles)
- Heading 2: 18-20px (subsection titles)
- Body large: 16-17px (primary content)
- Body: 14-15px (standard content, tables)
- Small: 12-13px (metadata, labels)
- Micro: 10-11px (monospace labels, chips)

**Hierarchy enforcement:**
- Use size and weight for hierarchy, not color (except for semantic accents)
- Maximum three type sizes per primary view (display plus one body size plus labels)
- Agent editorial uses serif for main narrative; metadata in mono; actions in sans

### Density

Dense but calm. Enterprise users want information density; they do not want visual anxiety.

**Rules:**
- Primary surface content visible without scroll on standard desktop (1440px wide, 900px tall)
- Tables readable and scannable without eye strain
- Card density appropriate — 2-4 cards per row on desktop, 1-2 on mobile
- Whitespace between logical blocks (not inside them)
- No padding-inside-padding (cards inside cards styled as cards)

**What must not happen:**
- Oversized hero panels eating 50%+ of fold
- Single-column sparse layouts on wide screens
- Decorative whitespace implying premium but burying content

### Cards

Cards are for summary and attention surfaces. Cards are not for information architecture.

**Appropriate card uses:**
- Repeated items (deliverable cards, program cards, pattern cards)
- Alert surfaces (critical alerts, pressure cards)
- Compact summary blocks (KPI tiles)
- Action affordances (suggested action cards)

**Inappropriate card uses:**
- Wrapping every page section in a card (creates cards-inside-cards styling)
- Replacing information architecture (using cards instead of sections with hierarchy)
- Decorative grouping (cards without semantic meaning)

### Tables

Tables are for portfolios, comparisons, and audit views.

**Rules:**
- Columns tied to decisions or actions, not raw data dumps
- Sortable on primary columns (status, owner, age, value)
- Filterable when row count exceeds ~20
- Row-level actions visible on hover or persistent affordance
- Alternating row shading is acceptable; heavy borders between rows are not

**What must not happen:**
- Excel-style dense grids with 15+ columns
- Tables without scan-ability (inconsistent alignment, varied cell heights)
- Tables wrapped in cards (adds visual noise)

## Status treatment

Status is the single most repeated UI element across surfaces. Must be treated with discipline.

**Rule: Status is text-first, color-supported.**

Every status must answer:
- What state is this in? (text)
- How long has it been there? (age indicator)
- Who owns it? (owner name)
- What action is needed? (next action text)

**Status chip pattern:**
```
[STATE] · owner · 3d aging · next: action
```

Example:
```
WAITING ON CLIENT · Priya · 4d aging · next: upload baseline
```

Color on the state chip is supplementary. Text carries the meaning.

**What must not happen:**
- State rendered as color alone ("green = good, red = bad" without labels)
- Status without owner
- Status without age
- Status without next action
- Proliferation of statuses (>6 distinct states per surface is a simplification failure)

## Alert severity

Three severity levels. Applied consistently across surfaces.

**Critical** — Blocks progress or creates material governance/value risk.
- Visual: red accent, prominent placement
- Always has owner and next action
- Always has due date
- Examples: scorecard not locked while evaluation begins, required input overdue >5 days, executive approval blocks release

**Warning** — Needs attention soon but not blocking.
- Visual: amber accent, secondary placement
- Owner recommended, not required
- Examples: vendor response nearing due date, artifact needs review, event approaching at-risk threshold

**Info** — Useful operating context.
- Visual: teal or neutral accent, tertiary placement
- Examples: reminder to confirm meeting, value owner assigned, upcoming gate review

**Rules:**
- Critical alerts surface first (top of list)
- Each alert includes owner and next action
- Alerts link to the relevant work object (event, program, artifact, scorecard, ledger)
- Resolved alerts do not dominate the active dashboard — they archive quickly

**Anti-patterns:**
- Decorative alerts with no owner
- Alerts with no action
- Hiding aging
- Merging severity levels into one generic warning
- Color without text

## Agent rail behavior

The right rail (Zone D) is the persistent agent surface. Rules:

**Rail contents by state:**

**Active state (agent has responded, suggested actions available):**
- Agent identifier (which agent)
- Response body with citations and confidence
- Suggested actions (three plus custom)
- Handoff affordance if applicable
- Chat input at bottom

**Idle state (no active conversation):**
- Agent-generated contextual prompt for the current surface
- Suggested starting actions (three plus custom)
- Chat input at bottom

**Hidden state (agent has no value to add on current surface):**
- Rail collapses or hides
- Not a blank rail

**Rules:**
- Never decorative — rail always has content or hides
- Never competing with main surface editorial — rail complements, does not duplicate
- Citations in rail are clickable, open evidence drawer
- Handoff affordances are visible when agents hand off
- Model-tier badge (Opus for Nexus/Sentinel, Sonnet for Atlas/Steward) subtly visible for transparency

## Drawer behavior

Drawers (Zone E) open on user action for progressive disclosure.

**Drawer types:**

**Artifact drawer** — Opens when user clicks an artifact reference. Shows artifact metadata (type, tier, status, owner, confidence, citations). Opens artifact body if requested.

**Evidence drawer** — Opens when user clicks a citation. Shows evidence source, confidence, provenance, timestamp. Opens source artifact if available.

**Detail drawer** — Opens from expand affordance. Shows detail content that did not fit above the fold.

**Rules:**
- Drawers open from explicit user action (click on affordance)
- Drawers preserve context behind them (not modal unless blocking)
- Drawers close cleanly to prior state
- Drawers are not primary workspace — don't put scorecard editors or full artifact bodies in drawers
- Drawer width appropriate for content (typically 480-640px; don't make full-width drawers)

## Journey tracker behavior

Specific to Source event canvas (and potentially future workflow-shape surfaces).

The journey tracker must reflect real workflow state. Not decorative.

**Tracker must show:**
- Active stage (prominent)
- Complete stages (visible but de-emphasized)
- Blocked stages (amber or red accent)
- Approval-needed stages (distinct styling)
- Future locked stages (grayed)
- Readiness score where applicable (percentage or chip)

**Click behavior:**
- Click on current stage → navigates to stage workspace
- Click on complete stage → shows completed work read-only
- Click on blocked/approval stage → opens gate detail
- Click on future locked stage → shows what's needed to reach it

**Anti-patterns:**
- Decorative tracker with no state logic
- Tracker showing all stages as same-weight circles without status
- Tracker that doesn't respond to clicks
- Tracker that changes visual treatment without underlying state change

## Interaction patterns

### Primary actions

Primary action is always visible and always clear.

**Rules:**
- One primary action per zone (Zone C has one; Zone D rail has one)
- Primary action uses teal (active state color)
- Primary action text is specific ("Schedule touchpoint", not "Take action")
- Secondary actions are text-style, not button-style (to preserve primary's primacy)

### Confirmation flows

Decisions that commit or lock require explicit confirmation.

**Rules:**
- Approvals, locks, releases show confirmation modal with specifics
- Confirmation modal names what is being committed, what changes, who is recorded as approver
- Cancel is always available in confirmation
- Non-reversible actions double-confirm with explicit "I understand" affordance

### Error states

Errors happen. Render them well.

**Rules:**
- Specific error text, not generic ("Failed to load" is insufficient; "Failed to load program MRD-01 — retry" is better)
- Retry affordance where applicable
- Escalation path where applicable (contact admin, see Steward)
- Never silent failure — user sees the error explicitly

### Loading states

Loading is acknowledged, not hidden.

**Rules:**
- Skeleton screens for predictable content shapes (tables, cards, editorial blocks)
- Spinners only for ambiguous durations
- Progress indicators for known-duration operations (file parse, pattern authoring)
- No "loading..." text alone — use skeleton or spinner

### Empty states

Empty states are first-class design, not afterthoughts.

**Rules:**
- Explicit empty state text explaining what is expected
- Call-to-action guiding user to populate (when actionable)
- Dignified when populated later ("No contradictions surfaced yet — Diagnose phase is in progress" is dignified; "No data" is not)

## Agent editorial rendering

The most important rendering in the system. Zone C's agent editorial block.

**Structure:**

```
┌─────────────────────────────────────────────────────────┐
│ [Agent identifier · confidence · context used]           │
│                                                           │
│ [Editorial prose — 2-4 paragraphs of agent synthesis]    │
│                                                           │
│ [Citations inline as clickable chips]                    │
│                                                           │
│ [Primary action or decision prompt]                       │
└─────────────────────────────────────────────────────────┘
```

**Rules:**
- Agent identifier visible (which agent is speaking, with model tier badge)
- Confidence qualifier visible (HIGH / MEDIUM / LOW)
- Context used surfaced (what files, patterns, prior turns informed this)
- Editorial prose uses serif for main narrative
- Citations inline as chips, clickable to open evidence drawer
- Primary action or decision prompt at close

**Word count discipline:**
- Nexus editorial: 100-250 words typical, can extend for complex program synthesis
- Sentinel editorial: 150-300 words typical, library state can be shorter
- Atlas editorial: 50-150 words MAX (enforced)
- Steward editorial: 50-120 words typical (operational conciseness)

## Agent voice rendering

Each agent has a visual signature beyond just text voice.

**Nexus:**
- Accent color: teal (active state color)
- Icon: abstract glyph signaling maestro
- Typography: serif for editorial, sans for action chips

**Sentinel:**
- Accent color: subdued teal, slightly cooler
- Icon: abstract glyph signaling librarian
- Typography: serif for editorial, slightly more formal tone

**Atlas:**
- Accent color: warm accent (slightly amber-leaning)
- Icon: abstract glyph signaling executive
- Typography: serif for headline, concise prose

**Steward:**
- Accent color: neutral (gray-leaning)
- Icon: abstract glyph signaling operations
- Typography: mono-leaning for operational content

Visual signatures are subtle — users recognize the agent via accent and voice without needing to read identifiers.

## Mobile behavior

All surfaces are mobile-responsive. Specific rules.

**Zone collapses on mobile:**
- Zone D (agent rail) becomes bottom-sheet or full-screen overlay
- Zone E (drawer) becomes full-screen overlay
- Zone C (primary workspace) takes full width

**Content priority on mobile:**
- Agent editorial remains at top
- Metrics and tables become scrollable cards
- Journey tracker compresses but remains state-aware

**Interaction adjustments:**
- Suggested actions stack vertically
- Chat input pinned to bottom of agent sheet
- Drawer swipe-to-close enabled

## Global interaction rules

### Clicks on citations

Citations are clickable. Always. Open evidence drawer with source specifics.

### Clicks on pattern references

Pattern references in agent prose are clickable. Navigate to pattern detail or open pattern preview.

### Clicks on work object references

Program names, sourcing event names, deliverable names clickable. Navigate to the work object.

### Clicks on confidence qualifiers

HIGH / MEDIUM / LOW chips clickable. Open explanation of why this confidence level was assigned (references Context Bundle quality scores).

### Clicks on suggested actions

Immediate execution — no confirmation unless the action is committing. "Schedule touchpoint" opens scheduling; "Show missing inputs" opens detail; "Generate draft" starts artifact authoring.

### Keyboard accessibility

- Tab navigation follows visual order
- Enter submits primary actions
- Escape closes drawers and modals
- Cmd/Ctrl+K opens agent input anywhere
- Arrow keys navigate suggested actions

## Platform-wide anti-patterns

Repeated from document 00 with specific visual implications.

**Agent-as-rail anti-pattern.** Rendering agent content in right rail while main surface renders metadata and grids. **Visual implication:** Violates agent-editorial-leads rule. Zone C must open with agent editorial.

**Dashboard-graveyard anti-pattern.** Pages filled with metrics that do not synthesize. **Visual implication:** Violates Atlas editorial requirement on Tower. Atlas must compose at top.

**Chatbot-attached anti-pattern.** Main surface plus chat rail as dominant composition. **Visual implication:** Violates agent-editorial-leads rule. The agent does not live in a chat rail; the agent leads the surface.

**Generic-chat anti-pattern.** Free-form chat with no suggested actions. **Visual implication:** Violates three-choices-plus-custom requirement (document 05).

**Color-without-text anti-pattern.** State indicated by color alone. **Visual implication:** Violates status treatment rules.

**Card-sprawl anti-pattern.** Every section wrapped in a card. **Visual implication:** Violates card usage rules.

**Over-coloration anti-pattern.** Rainbow of accent colors on a single surface. **Visual implication:** Violates color restraint rules.

**Template-deck anti-pattern.** Static content pretending to be generated. **Visual implication:** Violates "Rich tier requires substance" per document 03 artifact rules.

**Decorative tracker anti-pattern.** Journey tracker without state logic. **Visual implication:** Violates journey tracker behavior rules.

**Missing-evidence anti-pattern.** Claims without citations. **Visual implication:** Violates agent editorial rendering rules — citations mandatory.

## The compositional test

Every surface must pass this test at design review:

1. **Does agent editorial lead the surface?** (agent-editorial-leads rule)
2. **Does the surface answer the five questions within three seconds?** (five-question test)
3. **Are citations visible and clickable?** (evidence-backed rule)
4. **Does the rail complement or duplicate?** (rail-behavior rule)
5. **Is hierarchy clear from typography alone?** (hierarchy-via-type rule)
6. **Is color restrained to four accents or fewer?** (color-restraint rule)
7. **Do errors and empty states have dignified treatment?** (error/empty rules)
8. **Is agent voice visually signaled?** (agent-voice rendering)
9. **Does the primary action reveal itself within the first visual scan?** (primary-action rule)
10. **Is this mobile-responsive in a non-degraded way?** (mobile behavior)

A surface failing any of these tests requires rework before implementation.


## GPT refinement addendum · Visual system as agent interface

The visual system should not merely make AbarVa attractive. It should make agent intelligence **legible**. Users should be able to see what the agent knows, what it is acting on, and where confidence is weak.

### New visual primitives for context-aware product design

Add these platform-wide primitives:

1. **Context Strip** — compact row showing work object, stage/status, owner, value/risk, and next action.
2. **Agent Rail** — persistent right-side or contextual agent surface with summary, risks, next action, and suggested actions.
3. **Context Used Chip Group** — shows event, pattern, artifact, uploaded file, evidence, or value ledger used in an answer.
4. **Confidence Qualifier** — low/medium/high with reason, not decorative badge.
5. **Readiness Meter** — stage/artifact/scorecard readiness with blockers.
6. **Gate State Badge** — not started, active, blocked, needs approval, complete, reopened.
7. **Evidence Drawer** — reveals citations, file extracts, pattern sections, and provenance.
8. **Action Bar** — 3 suggested actions plus custom input or action button.

### Above-the-fold rule

Every work-object page must show above the fold:

- the object name
- the current stage/status
- the value/risk relevance when available
- the primary owner or next-action owner
- the current agent recommendation
- the next action or blocker

If a senior user must scroll or ask a chatbot to learn what matters, the page has failed.

### Design density guidance

AbarVa should use high information value and low visual noise:

- Prefer one decisive table over six cards when comparing operational items.
- Prefer one agent recommendation panel over scattered helper text.
- Prefer progressive drawers for evidence and artifacts.
- Avoid visual decoration that does not encode state, confidence, risk, value, or action.
- Do not use color as the only carrier of meaning.

### Agent response rendering

Agent responses should render as structured advisory blocks, not generic chat bubbles when the content is workflow-critical.

Recommended structure:

```text
Answer / recommendation
Context used
Confidence and reason
Risks or missing inputs
Recommended next action
Suggested actions
Evidence / citation chips
```

For simple conversational follow-up, a compact chat style is acceptable. For decisions, artifacts, scorecards, and executive summaries, structured rendering is mandatory.

### Visual anti-pattern escalation

The following are severity-one design failures:

- Agent rail present but not context-aware.
- Journey tracker present but not tied to real state.
- Confidence badge without reason.
- Artifact card without tier or missing-input state.
- Table row without next action.
- Empty prompt box as the primary interaction.
- Dashboard KPIs that do not lead to a decision.

These failures should block implementation approval.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with specific visual markups
2. Cross-check against `src/lib/design-system.ts` token consistency
3. Cross-check against design canon file 10 (component design system)
4. Cross-check against framework section 10 (Visual and Interaction Framework)
5. Explicit founder sign-off

No surface redesign proceeds against this document until AUTHORED-LOCKED.
