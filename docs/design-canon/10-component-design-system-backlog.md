# File 10 · Component Design System Backlog

**Version:** 1.0 · April 24, 2026
**Owners:** Claude Code primary (implementation), Codex secondary (API response shapes that components consume)
**References:** File 04 four-zone surface design, File 08 agent-Fabric per-turn contract, File 09 per-surface UI pattern, existing `wireframe-component-library.html` (15 primitives), existing exemplar HTML files

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`. Confidence level noted where claims are inferred.

**Applies:** Agent Autonomy Charter (Section 14). Pre-decided items in File 01 Section 15, File 08 Section 17, File 09 Section 18 — don't re-ask.

---

## Section 1 · Why this file exists

Files 04, 08, and 09 describe where each component lives and how surfaces compose them. What they don't specify is the component itself — the visual vocabulary, the interaction grammar, the state variants, the accessibility contract, the React prop shape, the CSS variables. Without this, two developers building two features produce two incompatible implementations of what should be the same thing.

The existing `wireframe-component-library.html` carries 15 primitives at the visual level — they look right. What the library doesn't yet carry is the operational contract per component: when does it enter hover state, how does keyboard focus move through it, what happens when its data is loading or missing, what ARIA role does it play, what props does it accept, how does it behave on mobile.

The three crawler walks exposed component-level gaps directly. Jake's observation that pressure card "Open →" links return blank pages — that's a component behavior gap, not a surface gap. Dr. L's observation that the Vercel dev toolbar rendered over product surfaces — that's a missing access-boundary component. Marcus T's observation that Tower's Value card showed "Projected —" with an em-dash — that's a missing empty-state spec on a component. Each gap traces to a component whose behavior was never fully specified.

This file fills that gap. It is the component-level operational spec. Read by Claude Code when building or modifying any component. Read by designers when making visual decisions. Read by Codex when defining API shapes that components consume.

**What this file is not:** it is not a style guide (typography, color tokens, spacing scale live in the design tokens spec). It is not a pixel-perfect visual redesign of existing primitives — those already look right. It is the operational contract that makes components consistent in behavior across every surface.

---

## Section 2 · How to use this file

This file is the component operational reference. It is read by:

**Claude Code** — primary implementer. Every component has a section here. Before building a component or modifying one, read the relevant section. The section specifies props, states, behavior, accessibility, responsive rules. When a surface in File 09 references a component, that surface inherits this file's spec for that component.

**Codex** — consumer of component data shapes. Several components expect specific API response shapes (pressure card expects a specific object; deliverable row expects specific fields). Codex's API endpoints must match.

**Designers** — reference when making any visual decision on a component. If a visual change is proposed, the relevant section here is the baseline; the change must either update the section or be rejected.

**Crawler personas** — components are tested indirectly through surface walks. When a persona reports "the citation didn't open the drawer" or "the pressure card drill-in was blank," the relevant component section is the truth against which the finding is validated.

---

## Section 3 · Design tokens (anchor for component specs)

Every component in this file references these tokens. Anand has locked these through prior design work. This section is a consolidated reference — not a redefinition.

### 3.1 · Typography

- **Serif display:** Georgia, for hero thesis lines, executive summaries, editorial prose in Rich deliverables. 19-22px typical; 28-44px on marketing surfaces.
- **Sans body:** Inter (or system fallback), 14-16px body, 12-14px secondary. Used across all product surfaces.
- **Mono:** JetBrains Mono, 10-11px uppercase for metadata chips, section labels, agent chat turn headers, pattern tier badges.

### 3.2 · Color — product surfaces

- Cream background: `#F5F1EB` (primary product background)
- Near-black text primary: `#0F0E0C`
- Ink body: `#2C2C2A`
- Muted: `#444441` / `#5F5E5A` / `#888780`
- Border tertiary: `#D3D1C7` / `#B4B2A9` / `#F1EFE8`
- Accent teal (Nexus/primary): `#0F6E56` / `#085041`
- Purple (Fabric brand): `#26215C` / `#3C3489` / `#7F77DD` / `#EEEDFE`
- Blue (outcomes, investor-facing): `#0C447C` / `#185FA5` / `#DCEAF8`
- Amber (valuation, hybrid boundary, scheduled states): `#412402` / `#633806` / `#BA7517` / `#EF9F27` / `#FEF0DA`
- Red (failure, critical, error): `#712B13` / `#A32D2D` / `#D85A30` / `#FAECE7`

### 3.3 · Spacing scale

4px base unit. Common values: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80. Components use this scale, never arbitrary pixel values.

### 3.4 · Radii

- Small (chips, pills): 4px
- Medium (cards, rows): 6-8px
- Large (drawers, modals): 10-12px

### 3.5 · Shadows

- Card shadow: `0 1px 2px rgba(0,0,0,0.04)`
- Drawer shadow: `0 10px 40px rgba(0,0,0,0.08)`
- Hover shadow: `0 2px 8px rgba(0,0,0,0.06)`

### 3.6 · Motion

- Default transition: `200ms ease-out`
- Drawer/overlay: `300ms ease-in-out`
- Micro-interactions (hover, focus): `150ms ease-out`
- Loading breathing: `1000ms ease-in-out` infinite
- Reduced-motion: all transitions collapse to `1ms` when `prefers-reduced-motion: reduce` is set

### 3.7 · Breakpoints

- Mobile: `<640px`
- Tablet: `640-1024px`
- Desktop: `>1024px`
- Wide: `>1440px`

---

## Section 4 · The existing 15 primitives — operational specs

Each primitive has: visual anchor (from `wireframe-component-library.html`), props (React), state variants, accessibility, responsive behavior, common usage.

### 4.1 · Primitive 01 · Navbar

**Visual anchor:** top bar, 56px fixed height, tenant chip on left, zone tabs center, user menu and Queue affordance on right. Background near-black on product surfaces; cream on external surfaces.

**Props:**

```
interface NavbarProps {
  tenant: TenantContext | null;  // null during auth loading
  user: UserContext | null;
  activeZone: 'home' | 'programs' | 'intelligence' | 'tower' | 'admin' | null;
  queueCount: number;  // 0 renders no badge
  onSignOut: () => void;
  onSwitchTenant?: () => void;  // only if user.hasMultiTenantAccess
}
```

**State variants:**
- **Loading (tenant resolving):** tenant chip shows skeleton; zone tabs disabled; user menu shows spinner
- **Signed-out:** redirect to auth; navbar doesn't render
- **Active zone highlighted:** tab receives accent underline and bold weight
- **Queue badge:** small red dot + count if `queueCount > 0`; no dot if zero
- **Multi-tenant user:** tenant chip has dropdown affordance; click opens tenant switcher

**Accessibility:**
- `role="navigation"`, `aria-label="Primary"`
- Zone tabs use `<a>` with `aria-current="page"` on active
- Queue badge has `aria-label="{N} items in queue"`
- Keyboard: Tab through tabs, user menu, Queue. Enter activates.
- Focus ring: 2px accent teal outline with 2px offset

**Responsive:**
- Mobile: zone tabs collapse to hamburger; tenant chip shrinks to logo; user menu becomes avatar-only
- Tablet: full layout with compressed spacing
- Desktop: full layout per exemplar

**Common usage:** Every authenticated surface. Not used on external-facing Home/Platform/Investor.

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — navbar exists; tenant chip behavior during tenant-binding failures (per crawler findings) inconsistent.

### 4.2 · Primitive 02 · Breadcrumb

**Visual anchor:** horizontal crumb trail below navbar. Format `Tenant › Programs › Ambient Clinical › Phase 3 › D17 Decision Memo`. Muted text with separator arrows. Each crumb clickable.

**Props:**

```
interface BreadcrumbProps {
  crumbs: Array<{ label: string; href: string | null }>;
  // final crumb typically has href: null (non-clickable)
}
```

**State variants:**
- **Default:** all crumbs clickable except last
- **Long crumb trail (>5 levels):** middle crumbs collapse into `…` with hover-to-expand
- **Loading crumbs:** skeleton bars matching crumb widths
- **Hover on clickable crumb:** underline + slight color shift

**Accessibility:**
- `<nav aria-label="Breadcrumb">` wrapping `<ol>`
- Non-clickable final crumb has `aria-current="page"`
- Separator arrows `aria-hidden="true"`
- Keyboard: Tab through clickable crumbs

**Responsive:**
- Mobile: collapse to "back" affordance showing only previous crumb + back arrow
- Tablet/Desktop: full trail

**Priority:** `P0 · demo-critical`. Status: `PARTIAL`.

### 4.3 · Primitive 03 · Mono label

**Visual anchor:** JetBrains Mono 10-11px uppercase, letter-spacing 0.08em. Used for metadata headers ("SOURCED FROM"), section dividers, agent turn identifiers ("NEXUS · 3 MIN AGO").

**Props:**

```
interface MonoLabelProps {
  children: React.ReactNode;
  variant?: 'muted' | 'accent' | 'default';
  size?: 'xs' | 'sm';  // 10px or 11px
}
```

**State variants:**
- **Default:** muted color, normal weight
- **Accent:** teal color for CTA-adjacent labels
- **On-hover context:** if wrapping a clickable parent, inherits the parent's hover state

**Accessibility:**
- Pure visual; no interactive role
- Color contrast meets WCAG AA on cream background

**Responsive:** size scales identically; no layout change.

**Priority:** `P1 · seed-critical`. Status: `BUILT`.

### 4.4 · Primitive 04 · Meta chip

**Visual anchor:** small rounded chip, 4px radius, 4-6px vertical padding, 8-10px horizontal padding. Used for tags (archetype, phase, risk tier, regulatory flags).

**Props:**

```
interface MetaChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'teal' | 'purple' | 'amber' | 'red' | 'blue';
  onClick?: () => void;  // clickable chip for filters
  active?: boolean;  // for filter-chip usage
  removable?: boolean;
  onRemove?: () => void;
}
```

**State variants:**
- **Default:** neutral background, muted text
- **Colored variants:** paired fill + text per token palette
- **Active (filter-chip):** inverted colors (filled background, light text)
- **Hover (if clickable):** subtle background darken, cursor pointer
- **Removable:** trailing × icon, click removes and fires `onRemove`
- **Disabled:** reduced opacity, no cursor change

**Accessibility:**
- If clickable, rendered as `<button>`; otherwise `<span>`
- Filter-chip with `aria-pressed="{active}"`
- Removable × has `aria-label="Remove {label}"`
- Keyboard: Enter/Space activates; Delete/Backspace on a removable chip fires onRemove

**Responsive:** size consistent; wrap to new lines in tight containers.

**Priority:** `P1 · seed-critical`. Status: `BUILT`.

### 4.5 · Primitive 05 · Button

**Visual anchor:** primary (filled teal), secondary (outline teal), tertiary (text-only with arrow), destructive (red).

**Props:**

```
interface ButtonProps {
  children: React.ReactNode;
  variant: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}
```

**State variants:**
- **Default / hover / active / focus:** per variant palette
- **Loading:** spinner replaces icon; text optionally changes to "Loading..."; button disabled during loading
- **Disabled:** reduced opacity, `cursor: not-allowed`
- **Focus ring:** 2px accent teal outline with 2px offset (all variants)

**Accessibility:**
- Native `<button>` element
- `aria-busy="true"` during loading
- `aria-disabled="true"` when disabled (also `disabled` attribute)
- Icon-only buttons require `aria-label`
- Keyboard: Enter/Space activates

**Responsive:**
- Mobile: full-width primary CTAs common; use `fullWidth` prop
- Button sizes scale proportionally

**Priority:** `P0 · demo-critical`. Status: `BUILT`.

### 4.6 · Primitive 06 · Editorial callout

**Visual anchor:** prominent prose block with accent-tinted background and left-border accent. Used for Atlas editorial leads on Tower sub-surfaces, agent pressure analysis, Sentinel honest-disclosure prose.

**Props:**

```
interface EditorialCalloutProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'critical' | 'success' | 'info';
  icon?: React.ReactNode;
  agent?: 'nexus' | 'sentinel' | 'atlas' | 'steward';  // tints to agent's palette
  attribution?: string;  // "Atlas · Tower · 2 min ago"
}
```

**State variants:**
- **Tone variants:** neutral (muted border), warning (amber), critical (red), success (teal), info (blue)
- **Agent-tinted:** border and accent pull from agent's color (Nexus teal, Sentinel purple, Atlas amber, Steward muted)
- **Collapsible:** when prose is long, shows "Read more" affordance

**Accessibility:**
- `role="region"` with `aria-label="{tone} callout"` or attribution
- Icon `aria-hidden="true"`
- Collapsible disclosure uses `<details>/<summary>` or button with `aria-expanded`

**Responsive:** padding scales on mobile; no structural change.

**Priority:** `P1 · seed-critical`. Status: `BUILT` visually; agent-tinted variant `MISSING`.

### 4.7 · Primitive 07 · Section card

**Visual anchor:** containing card for grouped content. Cream or white background, subtle border, 6-8px radius, generous internal padding (24-32px). Used for pattern cards, deliverable list containers, grouped info blocks.

**Props:**

```
interface SectionCardProps {
  title?: string;
  headingLevel?: 2 | 3 | 4;
  children: React.ReactNode;
  actions?: React.ReactNode;  // rendered top-right
  density?: 'comfortable' | 'compact';
  clickable?: boolean;
  onClick?: () => void;
  href?: string;  // if clickable, renders as link
}
```

**State variants:**
- **Static (default):** no hover state
- **Clickable:** hover raises shadow slightly, cursor pointer
- **Compact density:** reduced padding for dense lists
- **With actions:** title left, actions right, both aligned to top

**Accessibility:**
- If clickable and has href, renders as `<a>` with descriptive text
- Title uses appropriate heading level to preserve document outline
- Actions are discrete focusable elements, not absorbed into card click

**Responsive:** reduces padding on mobile; actions may wrap below title.

**Priority:** `P1 · seed-critical`. Status: `BUILT`.

### 4.8 · Primitive 08 · KPI card grid

**Visual anchor:** grid of 2-4 cards, each with a large number/value + label + optional context line. Used on Program page, Tower overview, deliverable executive summaries.

**Props:**

```
interface KPICardProps {
  value: string | number;  // "$180M" or "247" or "—" for empty
  label: string;
  context?: string;  // "projected" or "verified" or "per month"
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  onClick?: () => void;  // drill-in
  sparkline?: number[];  // optional inline micro-chart
}

interface KPICardGridProps {
  cards: KPICardProps[];
  columns?: 2 | 3 | 4;  // responsive default
}
```

**State variants:**
- **Default:** value prominent, label below, context below label
- **Empty:** value shows "—" (em-dash) explicitly; context explains why ("pending Phase 5")
- **Loading:** skeleton bar for value, labels visible
- **With trend:** small arrow + delta rendered beside value
- **With confidence:** small mono label HIGH/MEDIUM/LOW
- **Clickable:** hover raises shadow; cursor pointer; drill-in behavior

**Accessibility:**
- Each card wrapped in `<article>` with descriptive `aria-label`
- Value is primary content; label is `<h3>` or appropriate heading
- If clickable, renders as `<a>` or `<button>`
- Trend arrow `aria-label="trending up/down/flat by {value}"`

**Responsive:**
- Mobile: 2-column grid
- Tablet: 2 or 3 columns
- Desktop: per `columns` prop

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — KPI card exists but empty-state em-dash handling per crawler findings is inconsistent (Marcus T flagged Tower's em-dash on projected value as a gap — the em-dash is correct rendering per this spec, but it requires the `context` prop to explain why, which is missing).

### 4.9 · Primitive 09 · Pressure card

**Visual anchor:** Control Tower's signature component. Card with severity chip (CRITICAL/HIGH/MEDIUM), dollar amount with unit, editorial one-liner (the "headline"), editorial body (2-3 sentences of Atlas analysis), and action affordances.

**Props:**

```
interface PressureCardProps {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  dollarAmount: { value: number; unit: 'per_month' | 'per_year' | 'total'; currency?: 'USD' };
  headline: string;
  body: string;
  derivation?: string;  // how the dollar amount was computed; opens in drawer
  owner?: { id: string; name: string; role: string } | null;  // null if unowned
  relatedPattern?: { slug: string; label: string };  // link to pattern
  relatedProgram?: { slug: string; label: string };  // link to program
  actions: Array<{
    label: string;
    variant: 'primary' | 'secondary' | 'handoff';
    onClick: () => void;
    // handoff variant opens Atlas rail with context
  }>;
  createdAt: string;
  agingDays: number;
}
```

**State variants:**
- **Fresh (< 7 days old):** default visual
- **Aging (7-30 days):** subtle amber accent on severity chip
- **Stale (>30 days):** red accent, "Aging 34 days" mono label
- **Unowned:** red "UNOWNED" chip near severity
- **Resolved:** strikethrough, moved to resolved section (not same visual position)
- **Loading:** skeleton version while fetching
- **Hover:** slight shadow raise

**Accessibility:**
- `<article>` with `aria-labelledby` pointing to headline
- Severity chip with color AND text (not color-only)
- Dollar amount has `aria-label="{amount} {unit}"`
- Actions are discrete `<button>` elements
- Keyboard: Tab through actions; derivation drawer trigger accessible

**Responsive:**
- Mobile: action buttons stack vertically; derivation drawer becomes full-width bottom sheet
- Tablet: actions in row with wrap; body copy unchanged
- Desktop: full layout per exemplar

**Common usage:** Tower overview (3-4 most urgent), Tower sub-surfaces (per-domain pressures), Home's optional pressure-pulse block.

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — pressure card visual exists per crawler reports; derivation drawer missing; drill-in "Open →" broken (leads to blank `/preview/programs` per crawler findings — this is the single most reported pressure-card gap).

### 4.10 · Primitive 10 · Phase timeline

**Visual anchor:** horizontal scrub bar showing all 5 phases (P1 Intake, P2 Diagnosis, P3 Design, P4 Build, P5 Outcome). Current phase prominent; past phases show completion check; future phases show stub dot.

**Props:**

```
interface PhaseTimelineProps {
  phases: Array<{
    number: 1 | 2 | 3 | 4 | 5;
    name: string;
    status: 'complete' | 'current' | 'upcoming';
    dateAchievedOrDue: string;  // ISO
    gateCriterion?: string;  // shown on hover/tooltip
  }>;
  onPhaseClick?: (n: number) => void;
  size?: 'full' | 'mini';  // full for program page, mini for program cards
}
```

**State variants:**
- **Full size:** large scrub bar with phase names below each node, dates, gate criterion tooltip on hover
- **Mini size:** 5 small dots in a row within a card, current marker emphasized
- **Phase hover:** tooltip with gate criterion
- **Phase click:** navigates to phase view (full size only)
- **Gate-review-pending (current phase):** pulse animation on current marker
- **Overdue (current phase past due date):** red accent

**Accessibility:**
- `<nav aria-label="Program phases">`
- Each phase `<a>` with descriptive `aria-label="Phase {N} {name}, {status}, due {date}"`
- Current phase has `aria-current="step"`
- Tooltip is `role="tooltip"` triggered by hover and focus (keyboard accessible)

**Responsive:**
- Mobile (full size): timeline becomes vertical
- Mobile (mini): unchanged, still horizontal dots
- Tablet/Desktop: horizontal per design

**Priority:** `P0 · demo-critical`. Status: `BUILT`.

### 4.11 · Primitive 11 · Deliverable row

**Visual anchor:** horizontal row showing deliverable code, title, tier badge, status, and action affordance. Used on Phase page deliverable lists, Program page current-phase block.

**Props:**

```
interface DeliverableRowProps {
  code: string;  // "D17"
  title: string;
  tier: 'Rich' | 'Outline' | 'Stub';
  status: 'Draft' | 'Ready for review' | 'Approved' | 'Scheduled';
  quality?: number;  // 0-100, only Rich/Outline
  assignedTo?: { id: string; name: string } | null;
  dueDate?: string;  // ISO
  onOpen: () => void;
  onApprove?: () => void;  // shown only if status === 'Ready for review' and user has permission
  compact?: boolean;
}
```

**State variants:**
- **Draft:** muted title, grey status chip
- **Ready for review:** accent status chip, Approve affordance if permission granted
- **Approved:** success chip, approver and date inline
- **Scheduled:** amber chip, no quality score
- **Quality score rendering:** inline numeric with confidence (84/100 shown as "Quality 84" mono label)
- **Hover:** slight row highlight
- **Loading:** skeleton version
- **Overdue:** red chip for due date

**Accessibility:**
- Row wrapped in `<li>` within `<ul>`
- Primary title is `<a>` opening deliverable
- Approve action is discrete `<button>`, not absorbed into row click
- Status chip and tier badge have `aria-label` for screen readers

**Responsive:**
- Mobile: title on top, metadata (tier, status) wraps below; actions at bottom
- Desktop: full horizontal row

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — row exists; Approve affordance and permission gating incomplete per crawler findings.

### 4.12 · Primitive 12 · Gate readiness banner

**Visual anchor:** horizontal banner showing "Gate readiness: X of Y deliverables ready · N pending CXO · M in draft" with a "Request phase gate review →" primary CTA. Used on Phase page.

**Props:**

```
interface GateReadinessBannerProps {
  readyCount: number;
  totalCount: number;
  pendingCXOCount: number;
  draftCount: number;
  canRequestReview: boolean;  // all deliverables complete
  onRequestReview: () => void;
  blockers?: string[];  // surfaces why can't request yet
}
```

**State variants:**
- **Not ready:** banner explains what's still pending; CTA disabled with tooltip explaining blockers
- **Ready:** CTA enabled, prominent
- **Review in progress:** banner changes to "Gate review in progress — [reviewer] · [started]"
- **Approved:** banner shows "Phase gate approved [date]; next phase unblocked"
- **Rejected:** red variant with reason

**Accessibility:**
- `<section role="status">` with `aria-live="polite"` so changes announce to screen readers
- CTA button with descriptive `aria-label` and `aria-disabled` when blockers present

**Responsive:**
- Mobile: stacks vertically, CTA full-width
- Desktop: horizontal layout

**Priority:** `P0 · demo-critical`. Status: `MISSING` per crawler findings — phase-gate affordances not clearly surfaced.

### 4.13 · Primitive 13 · Decision log entry

**Visual anchor:** single entry with date, decision summary (one sentence), brief rationale (one-two sentences). Part of decision log list on Program page.

**Props:**

```
interface DecisionLogEntryProps {
  id: string;
  date: string;  // ISO; rendered as human-readable
  decision: string;  // one-sentence summary
  rationale?: string;  // brief rationale
  attributedTo?: { id: string; name: string; role: string };
  linkedDeliverables?: Array<{ code: string; title: string }>;
  linkedPatterns?: Array<{ slug: string; label: string }>;
  onClickDecision: () => void;  // opens full decision context
}
```

**State variants:**
- **Default:** date in mono, decision prominent, rationale muted
- **Expanded (with rationale visible):** rationale shown under decision
- **Collapsed (rationale hidden):** "Show rationale" link
- **Linked entities:** small chips for linked deliverables and patterns (clickable)
- **Hover:** slight highlight

**Accessibility:**
- `<article>` with `aria-labelledby` pointing to decision text
- Linked entities are discrete links with `aria-label`
- Date has `<time datetime="{ISO}">`

**Responsive:** no layout change; chips wrap.

**Priority:** `P1 · seed-critical`. Status: `BUILT`.

### 4.14 · Primitive 14 · Cross-link item

**Visual anchor:** small card or list item with title + type badge + one-line context. Used in sidebars for related patterns, analogous programs, evidence base entries, citing deliverables.

**Props:**

```
interface CrossLinkItemProps {
  type: 'pattern' | 'program' | 'deliverable' | 'evidence' | 'stakeholder' | 'decision';
  title: string;
  context?: string;  // one-line description
  href: string;
  tierOrPhase?: string;  // tier badge for patterns/deliverables, phase chip for programs
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  compact?: boolean;
}
```

**State variants:**
- **Default:** type icon or label, title clickable, context muted below
- **Broken target:** plain text styled with `broken` class, tooltip "Target unreachable"; logs broken target per File 08 Section 9.4
- **Hover:** underline on title, cursor pointer
- **Compact:** single line, type + title only

**Accessibility:**
- Rendered as `<a>` with `aria-label="{type}: {title}, {context}"`
- Type icon `aria-hidden` when label is explicit
- Broken state announced via `aria-disabled` and `role="link"`

**Responsive:** no layout change.

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — cross-links exist; broken-target handling (per Jake's 404 findings) inconsistent.

### 4.15 · Primitive 15 · Composite footer

**Visual anchor:** bottom-of-page strip with composite disclaimer, pattern authorship disclaimer, tenant disclosure, and small link cluster. Per File 01 Section 15 canonical disclaimer wording.

**Props:**

```
interface CompositeFooterProps {
  variant: 'authenticated' | 'external';
  tenantIsComposite?: boolean;  // shows composite disclaimer
  showPatternDisclaimer?: boolean;  // only needed on pattern pages
  links?: Array<{ label: string; href: string }>;
}
```

**State variants:**
- **Authenticated composite tenant:** "Composite organization built from real-world data." disclaimer
- **Authenticated real tenant:** no composite disclaimer
- **On pattern pages:** "Pattern observations are authored from industry knowledge, not measured outcomes from deployed customers. Every observation card carries a 'Composite' tag."
- **External variant:** minimal footer for marketing surfaces

**Accessibility:**
- `<footer role="contentinfo">`
- Disclaimer text is normal body text, not aside (it's essential context)

**Responsive:** disclaimers stack on mobile; link cluster wraps.

**Priority:** `P0 · demo-critical`. Status: `BUILT`.

---

## Section 5 · New components introduced by File 08 (agent-Fabric contract)

These components don't exist in the current 15-primitive library. They are necessary for File 08's agent-Fabric per-turn contract to render correctly.

### 5.1 · Agent message bubble

**Purpose:** Renders an agent turn response in the agent chat rail. Supports all four agents (Nexus, Sentinel, Atlas, Steward) with voice-contract-appropriate rendering per File 08 Section 5.

**Props:**

```
interface AgentMessageBubbleProps {
  agent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  turnId: string;
  timestamp: string;
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'citation_inline'; placeholder: string; resolved: CitationRef }
    | { type: 'citation_superscript'; number: number; resolved: CitationRef }
    | { type: 'confidence_qualifier'; level: 'HIGH' | 'MEDIUM' | 'LOW'; text: string }
    | { type: 'sparse_disclosure'; text: string }
    | { type: 'handoff_affordance'; toAgent: string; context: string }
    | { type: 'follow_up_chip'; label: string; action: string }
  >;
  qualityIssue?: 'hallucinated_citation' | 'low_confidence_overall' | null;
  retrievalSparsityFlag?: boolean;
}
```

**State variants:**
- **Agent tinted:** bubble border reflects agent's palette (Nexus teal, Sentinel purple, Atlas amber, Steward muted)
- **Loading (generating):** breathing animation, three-dot placeholder, descriptive label ("Nexus is pressure-testing...")
- **Sparse disclosure surfaced:** "Evidence is thin" opens as first substantive line in amber/muted tone
- **Confidence qualifier inline:** small mono chip HIGH/MEDIUM/LOW after qualifying phrase
- **Citation inline pill:** clickable pill with pattern slug + confidence chip
- **Citation superscript:** small `[E3]` superscript, clickable, opens evidence drawer on click
- **Handoff affordance:** prominent button "Hand to Sentinel →" that triggers handoff per File 08 Section 12
- **Follow-up chips:** 1-3 chips rendered below response body per agent voice
- **Quality-issue flagged (hallucinated citation):** subtle warning icon + tooltip "Some citations couldn't be verified; they've been removed"
- **Error state:** error message replaces content ("My reasoning layer is unavailable; retrying...")

**Accessibility:**
- `<article role="log" aria-live="polite">` containing each new message as `aria-live` announces
- Agent name and timestamp in `<header>`
- Citations inline as `<a>` elements with descriptive `aria-label`
- Follow-up chips as `<button>` elements with clear labels
- Handoff affordance has `aria-label="Hand off to {agent}; carries {N} turns of context"`

**Responsive:**
- Mobile: bubble full-width, follow-up chips stack
- Desktop: fixed rail width (360px expanded)

**Priority:** `P0 · demo-critical`. Status: `MISSING`. This component is the primary UI output of File 08's contract. Without it, the per-turn contract has no visible rendering.

### 5.2 · Citation inline pill

**Purpose:** Renders a pattern/program/deliverable citation inline in prose. Per File 08 Section 9.1 "inline-pill" context.

**Props:**

```
interface CitationInlinePillProps {
  targetType: 'pattern' | 'program' | 'deliverable' | 'observation' | 'evidence';
  targetId: string;
  targetSlug?: string;
  targetLabel: string;  // human-readable
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  brokenTarget?: boolean;
  onClick?: () => void;  // defaults to navigation
}
```

**State variants:**
- **Default:** small rounded pill with `[pattern: ambient-intelligence]` or `[E3]` format
- **With confidence:** `[pattern: ambient-intelligence · HIGH]` — mono label suffix
- **LOW confidence:** muted visual with LOW chip; renders only after honest-disclosure prose precedes
- **Hover:** small popover shows target title, tier/type, confidence
- **Broken target:** plain text with `broken` class, strikethrough optional, tooltip "Target unreachable" — never hidden
- **Focused (keyboard):** focus ring

**Accessibility:**
- Rendered as `<a>` with `aria-label="{type} citation: {label}; confidence {level}"`
- Popover is `role="tooltip"`, triggered by hover and focus
- Broken target has `aria-disabled="true"` with tooltip explaining

**Responsive:** no layout change; wraps in prose naturally.

**Priority:** `P0 · demo-critical`. Status: `MISSING`.

### 5.3 · Citation superscript chip

**Purpose:** Renders a numbered evidence citation as superscript (E1-E7 style), clickable to open evidence drawer. Used primarily in Rich tier deliverables (per D17 exemplar) and pattern detail pages.

**Props:**

```
interface CitationSuperscriptChipProps {
  number: number;  // 1-99
  targetRef: CitationRef;
  brokenTarget?: boolean;
  onClick: () => void;  // opens evidence drawer to this citation
}
```

**State variants:**
- **Default:** small superscript number in brackets, baseline-aligned slightly above
- **Hover:** slight background tint, cursor pointer, popover preview
- **Focused:** visible focus ring
- **Active (drawer open to this citation):** background accent
- **Broken:** plain number styled broken, no click

**Accessibility:**
- Rendered as `<button>` (not `<a>`) since action is opening drawer, not navigation
- `aria-label="Citation {number}, opens evidence drawer"`
- Inside prose, uses `<sup>` wrapper

**Responsive:** no change.

**Priority:** `P0 · demo-critical` for Rich tier; `P1` elsewhere. Status: `PARTIAL` — D17 exemplar shows correct rendering; other surfaces inconsistent.

### 5.4 · Evidence drawer

**Purpose:** Right-edge drawer showing grouped citations for a deliverable or pattern. Opens on click of any citation superscript or "Evidence base →" link. Per File 08 Section 9.1 "evidence drawer" context.

**Props:**

```
interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  anchorCitationId?: string;  // scrolls to this citation on open
  citations: Array<{
    id: string;
    type: 'pattern' | 'observation' | 'evidence_source' | 'peer_decision';
    label: string;
    provenance: 'authored' | 'observed' | 'measured' | 'composite';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    body: string;
    href?: string;  // click to navigate to source
    anonymizationStatus: 'tenant_scoped' | 'anonymized' | 'public';
  }>;
  title?: string;
}
```

**State variants:**
- **Closed:** off-canvas, not rendered
- **Opening:** slides in from right, 300ms ease-out
- **Open:** 420px width, full viewport height minus navbar
- **Scrolled to anchor:** if `anchorCitationId` set, scroll to and briefly highlight that citation
- **Citations grouped by type:** each group with a header; collapse/expand per group
- **Empty state:** "No citations found for this artifact" (should rarely occur)
- **Loading:** skeleton citation cards

**Interaction:**
- Close: click outside, Escape key, close chevron
- Click citation body: navigate to source page if `href` present
- Keyboard: Tab cycles through citation items; Enter navigates

**Accessibility:**
- `<aside role="complementary" aria-label="Evidence drawer">`
- Focus trap while open (Tab cycles within drawer; Shift+Tab reverses)
- Escape closes and returns focus to trigger
- `aria-hidden` on body content underneath while drawer is open

**Responsive:**
- Mobile: drawer becomes full-screen overlay; close button prominent
- Tablet: 360px width
- Desktop: 420px width

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — D17 exemplar has evidence drawer; not consistently implemented across surfaces.

### 5.5 · Confidence qualifier chip

**Purpose:** Inline mono-label showing confidence level (HIGH / MEDIUM / LOW) per File 08 Section 9.3 and 10.

**Props:**

```
interface ConfidenceQualifierChipProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  size?: 'xs' | 'sm';
  inline?: boolean;  // rendered inline in prose vs standalone chip
}
```

**State variants:**
- **HIGH:** teal-tinted mono label
- **MEDIUM:** amber-tinted mono label
- **LOW:** red-tinted mono label; in File 08 contract, LOW requires honest-disclosure prose to precede

**Accessibility:**
- `aria-label="Confidence {level}"`
- Purely visual indicator; no interaction

**Responsive:** no change.

**Priority:** `P0 · demo-critical`. Status: `MISSING`.

### 5.6 · Honest-disclosure banner

**Purpose:** Renders sparse-retrieval signal or "evidence is thin" prose per File 08 Section 10.4 at the start of an agent response.

**Props:**

```
interface HonestDisclosureBannerProps {
  variant: 'sparse_retrieval' | 'industry_authored' | 'outside_scope';
  text: string;
  actionLink?: { label: string; onClick: () => void };
}
```

**State variants:**
- **Sparse retrieval:** amber left-border, italic prose, "Evidence on this is thin — here's what we can say."
- **Industry-authored:** neutral border, mono label "AUTHORED" + prose
- **Outside scope:** muted, "That's outside what AbarVa tracks — [brief description]"
- **With action:** optional "what we'd need to answer better →" affordance

**Accessibility:**
- `role="note"` with `aria-label="Honest disclosure"`
- Announced to screen readers via `aria-live="polite"` when agent response is generated

**Responsive:** no change.

**Priority:** `P0 · demo-critical`. Status: `MISSING`.

### 5.7 · Handoff affordance

**Purpose:** Button within an agent response that offers to hand off to a different agent. Per File 08 Section 12.

**Props:**

```
interface HandoffAffordanceProps {
  toAgent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  reason: string;
  contextSummary: string;  // short summary of what gets carried
  onHandoff: () => void;
}
```

**State variants:**
- **Default:** accent-tinted button with agent icon + "Hand to {agent}" label + subtle context chip showing reason
- **Hover:** shows popover preview of what the target agent will see
- **Processing:** disabled + spinner while handoff executes
- **Error:** error tint with "Handoff failed — [retry]"

**Accessibility:**
- `<button>` with descriptive `aria-label="Hand off to {agent}: {reason}"`
- Keyboard: Enter/Space activates

**Responsive:**
- Mobile: full-width button
- Desktop: inline button with max-width

**Priority:** `P1 · seed-critical`. Status: `MISSING` — currently a no-op chip per Dr. L's crawler finding.

### 5.8 · Guided-choice chip

**Purpose:** Pre-written options in an agent rail that the user can click instead of typing. Per File 01 Section 15 pre-decided item: "3-5 option chips + 'something else' text input, always visible, single-click submit."

**Props:**

```
interface GuidedChoiceChipProps {
  id: string;
  label: string;
  agent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  onClick: () => void;
  disabled?: boolean;
  hot?: boolean;  // recommended/highlighted option
}
```

**State variants:**
- **Default:** pill-shaped button with agent-tinted border
- **Hot:** subtle pulse or accent highlight (agent's signature color)
- **Hover:** filled tint
- **Active (currently processing selection):** spinner replaces label
- **Disabled:** muted, no click
- **Single-click submit:** fires immediately, no confirmation step

**Accessibility:**
- `<button role="button">` with clear label
- `aria-pressed` when actively processing
- Keyboard: Tab through chips; Enter submits

**Responsive:**
- Mobile: chips wrap to multiple rows; each full-width or near-full-width
- Desktop: horizontal row with wrap

**Priority:** `P0 · demo-critical`. Status: `BUILT` — Dr. L praised the guided-choice rail as the strongest agent moment in the product.

---

## Section 6 · New components introduced by File 09 (per-surface patterns)

These support the state variants and integrity gates specified in File 09.

### 6.1 · Stub banner

**Purpose:** Scheduled-deliverable banner per Stub tier rendering (File 09 Section 7, D25 exemplar). Shows activation conditions and reads as dignified scheduled artifact, not a "coming soon" placeholder.

**Props:**

```
interface StubBannerProps {
  activationPhase: 1 | 2 | 3 | 4 | 5;
  activationConditions: Array<{
    condition: string;
    state: 'Complete' | 'In progress' | 'Not yet';
  }>;
  prerequisites: Array<{
    code: string;
    title: string;
    state: 'Complete' | 'Ready for review' | 'Draft' | 'Scheduled';
    href: string;
  }>;
  structurePreview: string[];  // 6 items
}
```

**State variants:**
- **Default:** teal-tinted banner with activation phase label, conditions in state-badged list
- **Near-activation (all conditions Complete):** accent highlight indicating ready to activate
- **Some conditions In progress:** neutral state
- **All conditions Not yet:** muted state

**Accessibility:**
- `<section role="status">` with clear heading
- Conditions are `<ul>` with state badges announced via `aria-label`
- Prerequisites are `<a>` elements with descriptive labels

**Responsive:**
- Mobile: conditions stack vertically
- Desktop: 2-column layout

**Priority:** `P0 · demo-critical`. Status: `BUILT` — D25 exemplar renders this correctly; pattern not consistently applied.

### 6.2 · Access-boundary banner

**Purpose:** Rendered when a user hits an access-restricted surface. Per File 09 Section 3.6 error states and File 08 Section 2 tenant-isolation contract.

**Props:**

```
interface AccessBoundaryBannerProps {
  variant: 'admin_restricted' | 'cross_tenant_denied' | 'role_insufficient' | 'session_expired';
  message: string;
  actions: Array<{ label: string; onClick: () => void }>;
  // e.g., [{ label: 'Request access', onClick: ... }, { label: 'Back', onClick: ... }]
}
```

**State variants:**
- **Admin restricted:** honest message "This area is restricted to platform administrators."
- **Cross-tenant denied:** "This tenant's data is not accessible from your account."
- **Role insufficient:** "You don't have permission to view this. [Request access]"
- **Session expired:** "Your session has expired. [Sign back in]" — full-page variant, not inline

**Accessibility:**
- `<section role="alert" aria-live="assertive">` for session-expired
- `<section role="region">` for inline variants
- Actions as `<button>` or `<a>` elements

**Responsive:** full-width on mobile; inline card on desktop.

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — `/platform/admin` shows correct banner; other access scenarios inconsistent.

### 6.3 · Tenant-switcher affordance

**Purpose:** Drop-down in navbar allowing multi-tenant users to switch between their scoped tenants. Depends on DR-06 from remediation backlog (URL param honoring).

**Props:**

```
interface TenantSwitcherProps {
  currentTenant: TenantContext;
  availableTenants: TenantContext[];
  onSwitch: (tenantSlug: string) => void;
}
```

**State variants:**
- **Single tenant user:** not rendered (shows tenant chip as static)
- **Multi-tenant user:** tenant chip has chevron affordance; click opens menu
- **Menu open:** list of tenants with active marker
- **Switching in progress:** loading state while context rebinds
- **Switch error:** error message "Could not switch tenants — [retry]"

**Accessibility:**
- `<button aria-haspopup="menu" aria-expanded="{open}">` for trigger
- `<ul role="menu">` for list
- Each tenant as `<li role="menuitem">`
- Keyboard: Arrow keys navigate, Enter selects, Escape closes

**Responsive:** menu full-width on mobile; dropdown on desktop.

**Priority:** `P2 · Series A`. Status: `MISSING` — tenant-switching not yet required for composite demo tenants; becomes critical when real multi-tenant customers arrive.

### 6.4 · Empty-state card

**Purpose:** Dignified empty-state rendering with honest copy and clear next-step. Per File 09 Section 3.6 and File 01 Section 15 "zero tolerance for placeholder strings."

**Props:**

```
interface EmptyStateCardProps {
  illustration?: React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  variant?: 'quiet' | 'encouraging' | 'instructional';
}
```

**State variants:**
- **Quiet (nothing to do):** "Nothing assigned. [secondary description]"
- **Encouraging (new user onboarding):** "Start your first program → [walks you through intake]"
- **Instructional (waiting on upstream):** "This populates when [upstream event]"
- **No placeholder text:** never shows "Lorem ipsum" or "Coming soon"

**Accessibility:**
- `<section role="status">` with descriptive heading
- Illustrations are `aria-hidden` (decorative); copy carries the meaning

**Responsive:** centered content; illustration scales.

**Priority:** `P1 · seed-critical`. Status: `PARTIAL` — some surfaces (queue, admin) have good empty states; others (programs index when empty) show broken shells instead.

### 6.5 · Tier badge

**Purpose:** Visual indicator of deliverable tier (Rich / Outline / Stub) per File 09 Section 3.4.

**Props:**

```
interface TierBadgeProps {
  tier: 'Rich' | 'Outline' | 'Stub';
  size?: 'sm' | 'md';
  position?: 'inline' | 'header' | 'sidebar';
}
```

**State variants:**
- **Rich:** accent teal badge, prominent in header
- **Outline:** neutral badge
- **Stub:** amber badge indicating scheduled status

**Accessibility:**
- `aria-label="Tier: {tier}"` with tooltip explaining what the tier means
- Color + text (not color-only)

**Responsive:** no change.

**Priority:** `P0 · demo-critical`. Status: `BUILT` — D17 and D25 exemplars render this correctly.

### 6.6 · Portfolio health strip

**Purpose:** Horizontal strip showing program distribution by phase, used on Programs index (File 09 Section 5). "Running work at every phase."

**Props:**

```
interface PortfolioHealthStripProps {
  phaseCounts: { p1: number; p2: number; p3: number; p4: number; p5: number };
  totalPrograms: number;
  onPhaseClick?: (n: number) => void;
}
```

**State variants:**
- **Balanced distribution:** editorial note "Running work at every phase"
- **Concentrated in one phase:** editorial note "All programs in Phase X — consider staggering new work"
- **Sparse portfolio:** muted version with "Add more programs to see distribution" hint
- **Empty:** hidden; empty state card shows instead

**Accessibility:**
- `<nav aria-label="Portfolio by phase">` wrapping phase counts as links
- Counts readable, click navigates to filtered programs index

**Responsive:** horizontal on all viewports; counts stack only if extreme narrow screens.

**Priority:** `P1 · seed-critical`. Status: `PARTIAL` — concept exists in exemplar; implementation on live index is missing per crawler findings.

### 6.7 · Agent rail container

**Purpose:** The collapsed/expanded right-edge container that houses all agent chat. Per File 09 Section 3.1 cross-surface primitive.

**Props:**

```
interface AgentRailContainerProps {
  agent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  expanded: boolean;
  onToggle: () => void;
  notificationCount?: number;
  surfaceContext: { type: 'home' | 'programs' | 'programDetail' | ...; id?: string };
  openingMessage?: AgentMessageBubbleProps;  // per-state from File 08 Section 5
  children?: React.ReactNode;  // chat history when expanded
}
```

**State variants:**
- **Collapsed (default):** 52px width, vertical strip with agent icon
- **Collapsed hover:** width expands to show agent name
- **Expanded:** 360px width, full chat interface
- **Agent working:** breathing animation on icon; "generating" state in chat
- **Agent errored:** red micro-indicator; expanded shows error state
- **Agent unavailable:** muted icon with tooltip
- **Notification present:** small dot + count on icon
- **Mutual exclusivity with document sidebar:** rail collapses when sidebar requested open; Cmd+K toggles rail

**Accessibility:**
- `<aside role="complementary" aria-label="{agent} agent rail">`
- Toggle button has `aria-expanded` and clear label
- Focus management: Cmd+K focus moves to input field when expanded
- Escape key collapses rail

**Responsive:**
- Mobile: floating button bottom-right (not edge strip); expanded becomes full-screen overlay
- Tablet: edge strip; expanded takes 360px
- Desktop: same

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` — rail exists; some states (working, errored, notification) inconsistent.

### 6.8 · Scheduled banner

**Purpose:** Amber-tinted banner used on scheduled deliverables and scheduled phase gates. Signals "this activates under conditions X."

**Props:**

```
interface ScheduledBannerProps {
  scheduledFor: string;  // phase label or date
  conditions: string[];  // activation conditions
  variant?: 'phase' | 'date' | 'conditional';
}
```

**State variants:**
- **Phase-scheduled:** "Activates at Phase N"
- **Date-scheduled:** "Activates on [date]"
- **Conditional:** "Activates when [conditions]"
- **Near activation:** accent highlight
- **Past-due (if scheduled-for date has passed without trigger):** red variant, "Was expected to activate [date]"

**Accessibility:**
- `<section role="status">` with clear message
- Conditions as `<ul>` with state

**Responsive:** stacks vertically on mobile.

**Priority:** `P1 · seed-critical`. Status: `PARTIAL`.

---

## Section 7 · Data-viz components

Components that render quantitative information. Required for Rich tier deliverables and Tower.

### 7.1 · Inline SVG chart

**Purpose:** Inline quantitative visual (line, bar, area chart). Used in Rich tier deliverables (e.g., cumulative margin recovery curve in D17). SVG-based, accessible, no external chart library dependency required.

**Props:**

```
interface InlineSVGChartProps {
  type: 'line' | 'bar' | 'area' | 'stacked_bar';
  data: ChartDataSeries[];
  xAxis: { label: string; ticks: string[] | number[] };
  yAxis: { label: string; format?: 'currency' | 'number' | 'percent' };
  caption?: string;
  annotations?: Array<{ x: number | string; y: number; label: string; tone: 'neutral' | 'accent' }>;
  dimensions?: { width: number; height: number };
  interactive?: boolean;  // hover to reveal tooltips
}
```

**State variants:**
- **Default:** static render
- **With annotations:** labeled markers (e.g., "Breakeven" on margin recovery)
- **Interactive hover:** tooltip shows data point value
- **Loading:** skeleton grid lines
- **Empty:** "No data to display" message
- **Print-friendly:** high-contrast variant for print CSS

**Accessibility:**
- `<figure role="img" aria-label="{descriptive summary}">` wrapping SVG
- Data table alternative rendered as `<table>` below chart (visually hidden, screen-reader accessible, revealed in print)
- Keyboard navigation across annotations

**Responsive:**
- Mobile: chart scales to container width; annotations may reposition
- Desktop: per `dimensions` prop

**Priority:** `P1 · seed-critical` for Rich deliverables; `P2` elsewhere. Status: `PARTIAL` — D17 exemplar has cumulative margin chart; not a reusable component yet.

### 7.2 · Data table with highlights

**Purpose:** Tabular data in Rich tier deliverables (vendor comparison, SKU analysis). Preferred rows visually highlighted.

**Props:**

```
interface DataTableProps {
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center'; format?: string }>;
  rows: Array<Record<string, any> & { highlighted?: boolean; notes?: string }>;
  sortable?: boolean;
  caption?: string;
}
```

**State variants:**
- **Default:** clean table with alternating row backgrounds
- **Highlighted rows:** subtle teal accent background; persistent even when sorted
- **Sortable:** column headers clickable with sort indicators
- **Loading:** skeleton rows
- **Empty:** empty state with message

**Accessibility:**
- Native `<table>` with proper `<thead>`, `<tbody>`, `<th scope="col">`
- `<caption>` describing table purpose
- Highlighted rows have `aria-label="Highlighted: {reason}"` or similar

**Responsive:**
- Mobile: horizontal scroll with sticky first column
- Desktop: full table

**Priority:** `P1 · seed-critical` for Rich deliverables. Status: `PARTIAL` — D17 has instance; not abstracted as reusable.

### 7.3 · Signature pattern diagram (SVG)

**Purpose:** The hero diagram on certain pattern detail pages (e.g., Ambient Intelligence value chain). Per File 09 Section 11 Block 3.

**Props:**

```
interface PatternDiagramSVGProps {
  pattern: string;  // pattern slug
  tenantOverlayState?: Record<string, 'Active' | 'Partial' | 'Not started'>;
  interactive?: boolean;
  dimensions?: { width: number; height: number };
}
```

**State variants:**
- **Global (no tenant):** clean pattern render with neutral colors
- **Tenant-scoped overlay:** each pattern element color-coded per tenant's integration state
- **Interactive hover:** element highlights, tooltip with detail
- **Loading:** skeleton version

**Accessibility:**
- `<figure role="img" aria-label="{pattern} signature diagram">`
- Screen-reader alternative: structured list of pattern elements and their states

**Responsive:**
- Mobile: diagram scales; pinch-zoom enabled
- Desktop: fixed dimensions per exemplar

**Priority:** `P2 · Series A` for most patterns; `P1` for Ambient (already built). Status: `PARTIAL`.

---

## Section 8 · Workflow components

Components that carry approval state, phase gates, and workflow transitions.

### 8.1 · Approval affordance

**Purpose:** Button on Deliverable rows and detail pages that captures an approval action. Per File 09 Section 7 and File 01 Section 15 pre-decided workflow.

**Props:**

```
interface ApprovalAffordanceProps {
  deliverableId: string;
  currentStatus: 'Draft' | 'Ready for review' | 'Approved';
  canApprove: boolean;  // permission check
  onApprove: () => void;
  onRequestChanges?: () => void;
  approverInfo?: { name: string; role: string };  // if Approved
}
```

**State variants:**
- **Draft:** affordance hidden (nothing to approve)
- **Ready for review, canApprove=true:** "Approve decision →" primary button + "Request changes" secondary
- **Ready for review, canApprove=false:** muted "Pending approval from {role}" badge instead of button
- **Approved:** success state with "Approved by {name} on {date}"
- **Processing:** loading state while approval persists

**Accessibility:**
- `<button>` with descriptive `aria-label="Approve decision on {deliverable code}"`
- Confirmation modal for permanent actions

**Responsive:**
- Mobile: full-width primary; secondary below
- Desktop: inline row

**Priority:** `P0 · demo-critical`. Status: `PARTIAL` per Code rollup (Priority 2 workflow shipped at 100%); surface-level affordance not consistently visible per crawler findings.

### 8.2 · Phase-gate indicator

**Purpose:** Visual indicator of gate readiness per-phase. Supports Phase page gate readiness banner (primitive 12) but also as inline indicator on Program detail.

**Props:**

```
interface PhaseGateIndicatorProps {
  phaseNumber: 1 | 2 | 3 | 4 | 5;
  readyCount: number;
  totalCount: number;
  variant?: 'compact' | 'full';
}
```

**State variants:**
- **All ready:** success badge, "Gate ready"
- **Partially ready:** amber, "N of M ready"
- **Not ready:** muted, "Pending"
- **Gate review in progress:** accent, "In review"
- **Approved:** success, "Gate approved [date]"

**Accessibility:**
- `aria-label="Phase {N} gate: {status}, {readyCount} of {totalCount} deliverables ready"`

**Responsive:** no change.

**Priority:** `P1 · seed-critical`. Status: `MISSING`.

### 8.3 · Maestro intake conversational surface

**Purpose:** The primary Nexus conversational front-end for starting a program. Produces GO/REFINE/REDIRECT outcome per File 01 FM-1.

**Props:**

```
interface MaestroIntakeProps {
  tenantContext: TenantContext;
  initialMessage?: string;
  onComplete: (outcome: { type: 'GO' | 'REFINE' | 'REDIRECT'; programData: ProgramIntakeData }) => void;
  onAbandon: () => void;
}
```

**State variants:**
- **Opening:** Nexus introduces, asks for program description
- **Listening:** user input visible; Nexus working indicator
- **Pressure-testing:** Nexus asks clarifying questions; pattern matches surfaced
- **Readiness checked:** tenant readiness inline
- **Adjacent explored:** "have you considered this related problem?" prompts
- **Outcome GO:** confirmation with "proceed to Phase 1" affordance
- **Outcome REFINE:** "additional scoping needed" with next-step prompts
- **Outcome REDIRECT:** "the real problem is [X]" with reframe affordance
- **User abandons:** save draft; can resume

**Accessibility:**
- Chat region `role="log" aria-live="polite"`
- Input is labelled `<textarea>` or `<input>` with clear placeholder
- Status transitions announced

**Responsive:**
- Mobile: full-screen conversational flow
- Desktop: centered conversation container

**Priority:** `P1 · seed-critical`. Status: `MISSING` — per crawler findings, intake is stubbed.

---

## Section 9 · Marketing/external components

Components for Home marketing, Platform, Investor surfaces. Per File 09 Section 16.

### 9.1 · Hero section with positioning statement

**Purpose:** Large hero for external surfaces carrying the positioning sentence.

**Props:**

```
interface HeroSectionProps {
  kicker?: string;  // small label above heading
  heading: string;  // positioning sentence
  subheading?: string;
  primaryCTA?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  visualSignature?: React.ReactNode;  // SVG or graphic
}
```

**State variants:**
- **Default:** large serif heading, muted subheading, primary CTA accent
- **With visual signature:** hero image/SVG on right or behind heading
- **Mobile:** CTA stacks below heading

**Accessibility:**
- Heading is `<h1>` (only one per page)
- CTAs as `<a>` elements

**Responsive:**
- Mobile: centered; visual below heading
- Desktop: 2-column if visual present

**Priority:** `P2 · Series A`. Status: `PARTIAL` — current home hero exists; refresh spec in File 09 Section 16.

### 9.2 · Investor diagram embed

**Purpose:** Renders the four investor SVG diagrams in sequence on the investor page.

**Props:**

```
interface InvestorDiagramEmbedProps {
  diagram: 'category' | 'mechanism' | 'flywheel' | 'valuation';
  caption?: string;
  contextPreamble?: string;  // prose before diagram
}
```

**State variants:**
- **Default:** SVG inline, caption below
- **On-scroll reveal:** subtle entrance animation
- **Reduced-motion:** no animation

**Accessibility:**
- `<figure>` with `<figcaption>`
- Descriptive `aria-label` on SVG summarizing the diagram's claim

**Responsive:** SVG scales to container width.

**Priority:** `P2 · Series A`. Status: `NEW-WORK`.

### 9.3 · "Real Today / Not Yet" honesty column

**Purpose:** The two-column honest-state disclosure on the investor page that Jake praised as "the most honest pre-seed page I've seen this year."

**Props:**

```
interface HonestyColumnProps {
  realToday: string[];  // bullet items
  notYet: string[];  // bullet items
  unlockConditions?: Record<string, string>;  // key = "Not Yet" item; value = what triggers unlock
}
```

**State variants:**
- **Default:** two-column layout with "Real Today" left, "Not Yet" right
- **Items with unlock conditions:** small "?" affordance showing the unlock rule
- **On mobile:** stacks with "Real Today" first

**Accessibility:**
- Each column `<section>` with clear heading
- Items as `<ul>`

**Responsive:** 2-column desktop; stacked mobile.

**Priority:** `P1 · seed-critical`. Status: `BUILT` per Jake's praise.

---

## Section 10 · Error and loading components

### 10.1 · Skeleton screen

**Purpose:** Loading placeholder that mirrors the structure of the content being loaded. Per File 09 Section 3.5.

**Props:**

```
interface SkeletonScreenProps {
  variant: 'home' | 'program' | 'deliverable_rich' | 'deliverable_outline' | 'deliverable_stub' | 'pattern' | 'tower' | 'table';
  dimensions?: { width: string; height: string };
}
```

**State variants:**
- **Pulsing:** subtle breathing animation
- **Reduced-motion:** static skeleton, no animation
- **With progress:** optional inline progress bar if loading exceeds 3s

**Accessibility:**
- `<div role="status" aria-busy="true" aria-label="Loading {variant}">`
- Live region announces when loading completes

**Responsive:** scales to container.

**Priority:** `P1 · seed-critical`. Status: `MISSING` — current loads default to spinners or blanks.

### 10.2 · Error state card

**Purpose:** Inline error rendering. Per File 09 Section 3.6.

**Props:**

```
interface ErrorStateCardProps {
  variant: 'data_load' | 'network' | 'retrieval' | 'generation' | 'unknown';
  message: string;
  actions: Array<{ label: string; onClick: () => void; primary?: boolean }>;
  details?: string;  // optional technical details for diagnostic purposes
}
```

**State variants:**
- **Data load failure:** "This artifact couldn't load. [Retry] · [Report issue]"
- **Network failure:** "Can't reach the server. Check connection. [Retry]"
- **Retrieval failure:** Fabric-specific honest error per File 08
- **Generation failure:** Claude-specific honest error per File 08
- **With details:** expandable "Technical details" disclosure

**Accessibility:**
- `<section role="alert" aria-live="assertive">`
- Actions as `<button>`

**Responsive:** stacks vertically on mobile.

**Priority:** `P0 · demo-critical`. Status: `MISSING`.

### 10.3 · Not-found (404) surface

**Purpose:** Dignified 404 page without inappropriate CTAs per Dr. L's finding. Replaces the current "Open Investor View →" CTA.

**Props:**

```
interface NotFoundSurfaceProps {
  requestedPath: string;
  suggestedPaths?: Array<{ label: string; href: string }>;
}
```

**State variants:**
- **Default:** honest "Page not found" message + "Back to home" + navbar preserved
- **With suggestions:** "Did you mean: [paths]?" based on fuzzy match
- **With report option:** "Report broken link"

**Accessibility:**
- `<section role="main">` with clear heading "Page not found"
- HTTP status 404 returned by server so crawlers/search engines handle correctly

**Responsive:** centered content.

**Priority:** `P0 · demo-critical`. Status: `MISSING` — current 404s include inappropriate investor CTA.

---

## Section 11 · Cross-cutting primitives

### 11.1 · Tooltip

**Purpose:** Small on-hover popover for clarification. Used across many components (confidence indicators, icon buttons, truncated text).

**Props:**

```
interface TooltipProps {
  content: React.ReactNode;
  trigger: React.ReactElement;  // clone and attach listeners
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;  // ms before showing
}
```

**State variants:**
- **Hidden (default):** no render
- **Showing (hover or focus):** small popover with arrow
- **Dismissing (mouse leave):** fades out
- **Touch devices:** long-press reveals; tap elsewhere dismisses

**Accessibility:**
- `role="tooltip"`
- Target element has `aria-describedby` pointing to tooltip
- Keyboard: focus triggers tooltip; Escape dismisses

**Responsive:** auto-placement to stay in viewport.

**Priority:** `P1 · seed-critical`. Status: `BUILT` (assumed via common component library).

### 11.2 · Modal

**Purpose:** Centered overlay for confirmations, settings, multi-step flows. Used sparingly — prefer drawers for context preservation.

**Props:**

```
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;  // if false, requires explicit action
}
```

**State variants:**
- **Closed:** not rendered
- **Opening:** fade + scale
- **Open:** centered, backdrop overlay
- **Dismissible (default):** close on Escape, click backdrop, close button
- **Non-dismissible (confirmations):** requires primary/secondary action

**Accessibility:**
- `<div role="dialog" aria-modal="true" aria-labelledby="...">`
- Focus trap
- Initial focus on primary action or first input

**Responsive:** full-screen on mobile; centered on desktop.

**Priority:** `P1 · seed-critical`. Status: `BUILT` (assumed).

### 11.3 · Toast notification

**Purpose:** Temporary confirmation or error message. Non-blocking.

**Props:**

```
interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;  // auto-dismiss after N ms; default 4000
  action?: { label: string; onClick: () => void };
}
```

**State variants:**
- **Entering:** slides in from top-right
- **Visible:** for `duration`
- **Exiting:** fades out
- **With action:** "Undo" or "View" affordance prevents auto-dismiss until clicked

**Accessibility:**
- `<div role="status" aria-live="polite">` for non-critical
- `<div role="alert" aria-live="assertive">` for errors
- Focusable action inside if present

**Responsive:** top-right desktop; top-center mobile.

**Priority:** `P1 · seed-critical`. Status: `BUILT` (assumed).

### 11.4 · Input field

**Purpose:** Text input used across all forms (Maestro intake, admin provisioning, search).

**Props:**

```
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  type?: 'text' | 'email' | 'number' | 'search' | 'textarea';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
```

**State variants:**
- **Default:** neutral border
- **Focused:** accent border, focus ring
- **Error:** red border, error message below
- **Disabled:** muted, no interaction
- **Loading (async validation):** inline spinner
- **Required:** asterisk next to label

**Accessibility:**
- `<label>` associated with `<input>` via `htmlFor`
- Error message associated via `aria-describedby`
- Required indicator has `aria-required="true"`

**Responsive:** full-width mobile; max-width desktop.

**Priority:** `P0 · demo-critical`. Status: `BUILT`.

---

## Section 12 · Component inventory summary

Summary table of all components in this file with priority and status.

| ID | Component | Introduced by | Priority | Status | Owner |
|----|-----------|---------------|----------|--------|-------|
| 4.1 | Navbar | Original primitive | P0 | PARTIAL | Code |
| 4.2 | Breadcrumb | Original primitive | P0 | PARTIAL | Code |
| 4.3 | Mono label | Original primitive | P1 | BUILT | Code |
| 4.4 | Meta chip | Original primitive | P1 | BUILT | Code |
| 4.5 | Button | Original primitive | P0 | BUILT | Code |
| 4.6 | Editorial callout | Original primitive | P1 | PARTIAL | Code |
| 4.7 | Section card | Original primitive | P1 | BUILT | Code |
| 4.8 | KPI card grid | Original primitive | P0 | PARTIAL | Code |
| 4.9 | Pressure card | Original primitive | P0 | PARTIAL | Code |
| 4.10 | Phase timeline | Original primitive | P0 | BUILT | Code |
| 4.11 | Deliverable row | Original primitive | P0 | PARTIAL | Code |
| 4.12 | Gate readiness banner | Original primitive | P0 | MISSING | Code |
| 4.13 | Decision log entry | Original primitive | P1 | BUILT | Code |
| 4.14 | Cross-link item | Original primitive | P0 | PARTIAL | Code |
| 4.15 | Composite footer | Original primitive | P0 | BUILT | Code |
| 5.1 | Agent message bubble | File 08 | P0 | MISSING | Code + Codex |
| 5.2 | Citation inline pill | File 08 | P0 | MISSING | Code |
| 5.3 | Citation superscript chip | File 08 | P0 | PARTIAL | Code |
| 5.4 | Evidence drawer | File 08 | P0 | PARTIAL | Code |
| 5.5 | Confidence qualifier chip | File 08 | P0 | MISSING | Code |
| 5.6 | Honest-disclosure banner | File 08 | P0 | MISSING | Code |
| 5.7 | Handoff affordance | File 08 | P1 | MISSING | Code + Codex |
| 5.8 | Guided-choice chip | File 08 | P0 | BUILT | Code |
| 6.1 | Stub banner | File 09 | P0 | BUILT | Code |
| 6.2 | Access-boundary banner | File 09 | P0 | PARTIAL | Code |
| 6.3 | Tenant-switcher affordance | File 09 | P2 | MISSING | Code |
| 6.4 | Empty-state card | File 09 | P1 | PARTIAL | Code |
| 6.5 | Tier badge | File 09 | P0 | BUILT | Code |
| 6.6 | Portfolio health strip | File 09 | P1 | PARTIAL | Code |
| 6.7 | Agent rail container | File 09 | P0 | PARTIAL | Code |
| 6.8 | Scheduled banner | File 09 | P1 | PARTIAL | Code |
| 7.1 | Inline SVG chart | File 09 | P1 | PARTIAL | Code |
| 7.2 | Data table with highlights | File 09 | P1 | PARTIAL | Code |
| 7.3 | Signature pattern diagram | File 09 | P2 | PARTIAL | Code |
| 8.1 | Approval affordance | File 09 | P0 | PARTIAL | Code |
| 8.2 | Phase-gate indicator | File 09 | P1 | MISSING | Code |
| 8.3 | Maestro intake | File 09 | P1 | MISSING | Code + Codex |
| 9.1 | Hero section | File 09 | P2 | PARTIAL | Code |
| 9.2 | Investor diagram embed | File 09 | P2 | NEW-WORK | Code |
| 9.3 | Honesty column | File 09 | P1 | BUILT | Code |
| 10.1 | Skeleton screen | File 09 | P1 | MISSING | Code |
| 10.2 | Error state card | File 09 | P0 | MISSING | Code |
| 10.3 | Not-found surface | File 09 | P0 | MISSING | Code |
| 11.1 | Tooltip | Cross-cutting | P1 | BUILT | Code |
| 11.2 | Modal | Cross-cutting | P1 | BUILT | Code |
| 11.3 | Toast | Cross-cutting | P1 | BUILT | Code |
| 11.4 | Input field | Cross-cutting | P0 | BUILT | Code |

**Aggregate:** 47 components. 7 fully BUILT. 18 PARTIAL. 22 MISSING. 1 NEW-WORK.

Of the 22 MISSING, 10 are P0 (demo-critical). The P0 MISSING list is the first build order for Cycle 1:

1. Agent message bubble (5.1)
2. Citation inline pill (5.2)
3. Confidence qualifier chip (5.5)
4. Honest-disclosure banner (5.6)
5. Gate readiness banner (4.12)
6. Error state card (10.2)
7. Not-found surface (10.3)

Plus the P0 PARTIAL list to complete:

8. Pressure card (4.9) — derivation drawer, drill-in fix
9. Deliverable row (4.11) — Approve affordance and permission gating
10. Agent rail container (6.7) — state variants (working, errored, notification)
11. Access-boundary banner (6.2) — all four variants
12. Evidence drawer (5.4) — apply across all surfaces consistently
13. Citation superscript chip (5.3) — apply across all surfaces consistently

---

## Section 13 · Pre-decided items — don't re-ask

In addition to File 01 Section 15, File 08 Section 17, and File 09 Section 18:

- **Design tokens locked per Section 3:** typography (Georgia serif + Inter sans + JetBrains Mono), color palette, spacing scale (4px base), radii (4/6-8/10-12px), shadows, motion (200ms default / 300ms drawer / 150ms micro / 1000ms breathing / 1ms reduced-motion), breakpoints (640/1024/1440px).
- **Component library is the visual canon:** visual changes to existing 15 primitives require Anand sign-off.
- **Accessibility minimum:** WCAG 2.1 AA compliance on every component. Focus rings visible. Keyboard navigation complete. Screen-reader labels explicit. Color never conveys meaning alone.
- **Reduced-motion respected:** every animation collapses to 1ms when `prefers-reduced-motion: reduce` is set.
- **Native elements by default:** `<button>` for actions, `<a>` for navigation, native `<table>`, native `<form>`. Custom components only when native can't express the semantic.
- **Composite disclaimer (File 01 Section 15):** always rendered in composite footer on composite tenants.
- **Pattern authorship disclaimer (File 01 Section 15):** always rendered on pattern pages.
- **No em-dash placeholders without context:** if a KPI value is empty, the context prop explains why ("pending Phase 5"); never an em-dash alone (fixes Marcus T's finding on Tower Value card).
- **Broken targets rendered as broken, not hidden:** per File 08 Section 9.4 — always visible, always logged.

---

## Section 14 · Agent Autonomy Charter (for this file)

### 14.1 · Autonomous authority — self-authorize and merge

**Claude Code self-authorized scopes for File 10:**

- Implementing any component per its section in this file
- Refining visual details within the design tokens from Section 3
- Adding state variants that Section 12 marks as MISSING
- Accessibility improvements (ARIA labels, keyboard navigation, focus management, screen reader alternatives)
- Responsive behavior refinements
- Adding components not yet in this file that emerge as surfaces need them — file-new-component proposal as a section 5-tier entry and implement
- Storybook or component catalog additions for the existing library
- Bug fixes to any component's visual or interaction behavior
- Performance optimizations (memoization, lazy loading, bundle splitting) that don't change the component's API

**Codex self-authorized scopes for File 10:**

- Implementing API response shapes components consume (e.g., `PressureCardProps.derivation` field on the pressure API)
- Implementing auth/permission checks components rely on (e.g., `ApprovalAffordanceProps.canApprove`)
- Graph queries supporting cross-link items with bidirectional resolution

### 14.2 · Requires Anand sign-off before merge

- Visual changes to the 15 existing primitives (per File 09 Section 18 and this file Section 13)
- Changes to design tokens in Section 3
- Adding fundamentally new component categories (e.g., if a surface requires a component that doesn't fit existing patterns)
- Changes to the Autonomy Charter itself
- Changes to canonical disclaimers
- Changes that affect investor-facing polish

### 14.3 · Reporting protocol

Per File 08 Section 18.3. Per-cycle matrix. No aggregate percentages. Partial acceptable if declared.

For File 10 specifically, the matrix columns:
- Component ID (e.g., 5.1 Agent message bubble)
- Requested (from Props and State variants)
- Actual state (COMPLETE / PARTIAL / DEFERRED / NOT STARTED)
- PR reference
- Storybook/catalog entry (YES / NO / N/A)
- Notes

### 14.4 · PR commit discipline

Every PR touching components references File 10 by component ID. Commit messages include `addresses-F10-{id}`. Example: `addresses-F10-5.1 addresses-F08-S5 addresses-F09-S6` for a PR implementing the Agent message bubble component used on the Program page per File 09 Section 6 per File 08 Section 5 voice contract.

### 14.5 · Escalation paths

Per File 08 Section 18.5. Same protocol.

### 14.6 · Definition of done

A component section from this file is DONE when:

- Props interface implemented per spec
- All state variants render correctly per spec
- Accessibility contract met (ARIA, keyboard, focus, screen reader)
- Responsive behavior works per spec on mobile/tablet/desktop
- Component included in component library catalog with examples
- Tests cover state variants and critical interactions
- At least one crawler persona test that depends on this component passes
- PR merged and deployed

### 14.7 · Continuous Execution Protocol

This file's cycles follow File 08 Section 19 verbatim. `CYCLE_STATE.md` is the source of truth. Status emission cadence applies. Continuation default applies. Session kickoff discipline applies. Prohibited behaviors (silent stops, silent scope expansion, skipped status emissions) apply. Every component built this cycle is tracked in the committed queue.

### 14.8 · Collaboration between Codex and Claude Code

Components with data contracts (e.g., Agent message bubble consuming File 08's rendered_response shape) follow integration contract pattern from the April 24 remediation handoff Part 4. Code owns component; Codex owns API response; contract is the Props interface in this file.

---

## Section 15 · Execution discipline

**Ownership:** Claude Code primary. Codex secondary for API shapes components consume. File 04 specifies zone philosophy; File 08 specifies agent contract; File 09 specifies surface composition; File 10 specifies the components themselves.

**Dependencies:**
- File 08 must be implemented at Stages 1-6 before agent-rendering components (Agent message bubble, citation pills, confidence chips, honest-disclosure banner, handoff affordance) are meaningful
- File 09 surface specifications determine which components are needed when
- Remediation backlog routing fixes must clear before citation components can test end-to-end (citations need valid targets)

**Execution order for Cycle 1 (P0 MISSING components):**
1. Agent message bubble (5.1) — most used component, foundation for File 08 rendering
2. Citation inline pill (5.2), citation superscript chip (5.3) completion, evidence drawer (5.4) completion — citation infrastructure
3. Confidence qualifier chip (5.5), honest-disclosure banner (5.6) — honest agent rendering
4. Error state card (10.2), not-found surface (10.3) — remove current inappropriate 404 CTAs
5. Gate readiness banner (4.12) — workflow visibility
6. Approval affordance (8.1) completion — workflow surface
7. Pressure card (4.9) — derivation drawer + drill-in fix
8. KPI card grid (4.8) — empty-state context completion
9. Agent rail container (6.7) — state variants complete

**Cycle 2 (P0 PARTIAL completions and P1 MISSING):**
10. Deliverable row (4.11) — permission gating complete
11. Skeleton screen (10.1) — replace all generic spinners
12. Phase-gate indicator (8.2)
13. Maestro intake (8.3) with GO/REFINE/REDIRECT
14. Portfolio health strip (6.6)
15. Handoff affordance (5.7)
16. Empty-state card (6.4) across all surfaces

**Cycle 3 (P1/P2):**
17. Data table with highlights (7.2) as reusable primitive
18. Inline SVG chart (7.1) as reusable primitive
19. Tenant-switcher affordance (6.3)
20. Investor diagram embed (9.2)
21. Signature pattern diagram (7.3) for patterns beyond Ambient

**Target timeline:**
- Cycle 1: 2 weeks (10 components to complete from P0 MISSING)
- Cycle 2: 1-2 weeks (P1 completions)
- Cycle 3: 1-2 weeks (P1/P2 polish)

**Verification:** Each component has a crawler persona test dependency (per File 09 per-surface crawler tests). After each cycle, re-run affected persona tests. A component is not DONE until the surface test that depends on it passes.

---

## Section 16 · One-line handoff

> 47 components total. 15 existing primitives with operational specs, 14 new components introduced by File 08 and File 09, 4 data-viz components, 3 workflow components, 3 marketing components, 3 error/loading components, 4 cross-cutting primitives. Every component has props, state variants, accessibility contract, responsive behavior, priority, and status. 10 P0 MISSING components are the first build order for Cycle 1. Apply Autonomy Charter in Section 14. Follow Continuous Execution Protocol from File 08 Section 19.

---

*End of File 10 · Component Design System Backlog.*
