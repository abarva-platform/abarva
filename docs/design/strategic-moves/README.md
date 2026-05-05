# Handoff — Strategic Moves home (P0 / dashboard / detail)

This package is a developer-ready handoff for the **Strategic Moves** surface inside the AbarVa app. It contains everything Codex (or any agent working in the production codebase) needs to recreate the design at high fidelity — without re-deriving spacing, color, copy, or interaction.

## What this is

A high-fidelity HTML prototype of three connected views inside the authenticated AbarVa app:

1. **Dashboard** — the Strategic Moves home. Tenant ribbon, KPI tiles, scatter / cards / kanban map of every active move.
2. **Move detail** — Nexus chat on the left, deliverable/scaffold pane on the right, breadcrumb + phase rail at the top. (Reused shell.)
3. **Originate (P0)** — same shell as detail, but in "drafting a new move" mode. Nexus drafts a 7-section P0 charter; Promote-to-P1 button is gated until all 7 are filled.

It is **a design reference, not production code**. The bundled HTML inlines styles and uses vanilla JS to demonstrate behavior. Recreate it in the AbarVa app codebase using its existing component vocabulary and patterns — see "Component identification" below.

## Fidelity

**High-fidelity.** Colors, typography, spacing, interaction timing, and copy are all canon. Pixel-match the layout. Use the brand and canon tokens from `tokens.css` — do **not** introduce new color, type, or radius values.

## Files in this package

| File | Purpose |
|---|---|
| `README.md` | This document. Self-sufficient — implement from this alone. |
| `14-strategic-moves-home.html` | The prototype. All three views live in one file, toggled by a `showView(name)` function. Inline `<style>` + `<script>`. |
| `15-workspace-v0.2.html` | Move Workspace v0.2 binding reference. Four views (current/past/future/originate-inside-workspace). Supersedes earlier Detail concept. |
| `tokens.css` | Canonical design tokens — colors, type, spacing, radius, motion. The HTML inlines these via `:root`; the production codebase already has them at `tokens.css` / `brand-tokens.css` / `abarva-canon.css`. **Do not duplicate. Map.** |
| `INTEGRATION.md` | What to touch, what to leave alone, where this surface fits in routing and data. **Read this second.** |

---

## Two surfaces, one brand — which is this?

This is a **canon (app)** surface. Background is `--canon-bg-cream` (`#f5f1eb`) with `#ffffff` cards on a warm `--cream` (`#f8f1e5`) page background variant. The Public-site palette (paper `#faf7f1`, navy `#0c1a3a`) does not appear here.

Status colors (red / amber / teal-as-green) are **semantic** — gate blocked, awaiting decision, on-track. Never use them decoratively.

---

## Layout

The whole surface is a single `<main>` per view, rendered at the natural viewport width with a top nav (`<nav class="top">`) above it. Three view containers — `#dashboard-view`, `#detail-view`, `#originate-view` — are siblings; `showView()` toggles `[hidden]` on the inactive ones. There is one persistent floating "Ask Nexus" FAB in the bottom-right that survives across all three views.

### Top nav (`<nav class="top">`)

- Height ~64px, full width, `#ffffff` background, 1px bottom border `--canon-border`.
- Left: AbarVa wordmark (`assets/logos/abarva-wordmark-color.svg`) + breadcrumb `STRATEGIC MOVES`.
- Right: env chip · "+ New Move" CTA button · back button (only visible on detail/originate).
- The "+ New Move" CTA is **black on cream** (not blue) — `background: var(--ink); color: var(--cream)`.

### Dashboard (`#dashboard-view`)

Vertical stack:

1. **Ribbon** (`.ribbon`) — segmented filter row: All · By tenant · By archetype · By phase · By status. Active segment is ink-on-cream pill.
2. **KPI strip** — 4 tiles: Active moves, Value at stake, Gate-blocked, Awaiting decision. Each tile is a card on cream with a serif (Fraunces) numeric value and a mono eyebrow label.
3. **List view** — toggled between three modes via the Tweaks panel (`listView` ∈ `scatter` / `cards` / `kanban`):
   - **Scatter** (`.scatter`) — phase (P0–P7) on the x-axis, value bands on the y-axis. Each move is a circle sized to value, colored by status. Hover → tooltip card. Click → detail.
   - **Cards** (`.cards-grid`) — 3-up grid of move cards. Title (Fraunces 500 / 18px), tenant + archetype eyebrow, status chip, phase rail at the bottom.
   - **Kanban** (`.kanban`) — 8 columns P0…P7, each a stack of move cards. Status chips colored by `--green` / `--amber` / `--red`.
4. **Sort** — also tweakable: `value` / `phase` / `status` / `name`.

Tweaks panel persists `listView` and `sort` to disk via the host edit-mode protocol — production should persist via user preferences instead.

### Move detail (`#detail-view`)

Two-pane shell (`.detail-shell`):

- **Left, 480px wide** — `.chat-pane`. Nexus avatar header, scrollable thread of bubbles (`.bubble.nexus` and `.bubble.user`), suggested-prompt chips, input row with up-arrow send.
- **Right, fluid** — `.detail-pane`. Breadcrumb + title (Fraunces 28px / 700) + meta + phase rail (P0–P7 dots, current phase active). Below the head: detail body — currently a placeholder section showing the move charter, sponsor, value range, gate criteria, evidence trail.

The phase rail (`.detail-rail` → `.rail-track` + `.rail-line` + `.dot` + `.rail-labels`) is the single most identifying piece of this design. It is reused in the Originate view.

### Originate / P0 (`#originate-view`)

Same `.detail-shell` as detail. Same 480px chat on the left, same right pane. Differences:

- **Top context bar** (`.origin-context`) — replaces the breadcrumb. Shows `↳ ORIGINATING NEW MOVE · UNTITLED · DRAFT` with a `✕ Cancel` button on the right.
- **Left pane** — Nexus chat seeded with two opening bubbles. Below the thread, a `.start-from-block` lists 5 entry-point chips: Intelligence finding · Foundation Readiness gap · Pre-mortem result · Cross-industry transfer · Blank hypothesis. Clicking a chip greys all chips (`.used`) and triggers Nexus to draft 2–4 sections of the scaffold, with a stagger of ~380ms between fills.
- **Right pane** — `.scaffold-list`: 7 numbered rows (`.scaffold-row`) for the P0 charter sections. Empty rows are dashed-border + greyed empty-state copy. Filled rows are solid-border, white background, with a green dot indicator (`.scaffold-indicator.filled`).
- **Footer** (`.scaffold-foot`) — `Promote to P1 Charter` button. Disabled until all 7 sections are filled. Helper text `N of 7 sections complete`.

The 7 P0 sections are: `hypothesis`, `archetype`, `sponsor`, `tenant`, `foundation`, `value`, `evidence`. Order matters — they map to the P0 charter template in the canon.

**Cancel behavior.** If the user clicks Cancel with **0** sections filled, exit silently to dashboard. Otherwise show a confirm dialog (`.confirm-overlay`) with three actions: `Continue working` · `Discard` · `Save as draft` (primary).

---

## Components — reuse the existing canon vocabulary

This surface is built almost entirely from primitives that already exist in `wireframe-component-library.html` (canon vocabulary) and the AbarVa public-site components. Map, don't rebuild.

| Block in the prototype | Existing component to use | Notes |
|---|---|---|
| Top nav with wordmark + breadcrumb | `<canon-navbar>` / `Navbar` | Add the "+ New Move" slot if not present. Black-CTA variant. |
| Mono eyebrow label (e.g. `STRATEGIC MOVES`, `PLATFORM MODERNIZATION`) | `.av-eyebrow` (from `tokens.css`) | Already canonical. Color via `.stone` / `.teal` / `.amber` / `.red`. |
| Status chip (red / amber / teal) | Canon `<chip>` / `Chip` | Variants `gate-blocked` / `awaiting-decision` / `on-track` / `validated`. |
| Move card | Canon `<section-card>` / `SectionCard` | Wrap with the phase rail at the bottom. |
| Phase rail (P0–P7 dots) | **New shared component.** | Extract `.detail-rail` markup into `<phase-rail current="P3" />`. Reused in both detail and originate. |
| Scatter dot | New, but trivial — `<button>` with absolute position. | Tooltip is a single shared `#tooltip` div, positioned by JS. |
| KPI tile | Canon `<kpi-tile>` / `KpiTile` | Already exists. Value (Fraunces 500 / 32px), eyebrow, optional delta. |
| Ribbon / segmented filter | Canon `<segmented>` | If missing, build as a flex row of buttons with `aria-pressed`. |
| Bubble (chat) | New for this surface. | Two variants: `.nexus` (cream, left-aligned) and `.user` (ink, right-aligned). 60ch max width. |
| Suggested-prompt chip | Canon `<chip>` (clickable variant). | Same as the ribbon segments visually. |
| Confirm dialog | Existing canon `<dialog>` / `Dialog`. | Three-button footer: secondary · danger · primary. |
| Tweaks panel | **Prototype-only.** | Do **not** ship in production. Used here to expose `listView` and `sort` toggles. In the app, these are user preferences. |
| Floating Ask Nexus FAB | Canon `<nexus-fab>` if it exists, else new. | Sits bottom-right. Black with white V monogram. |

### Real components vs mock data

**Real (lift the markup + behavior):**
- The 3 views and their shell (`.detail-shell`, `.chat-pane`, `.detail-pane`).
- The phase rail (`.detail-rail`).
- The scaffold rows (`.scaffold-row` / `.scaffold-row.filled`) with their fill-in animation.
- The originate context bar (`.origin-context`).
- The confirm dialog.
- The status-color system on cards/chips.

**Mock data (replace with real fetches):**
- The `moves` array (line ~647 in the HTML) — seven sample moves across four composite tenants. Replace with `GET /api/strategic-moves?tenant=...`.
- The KPI tile values — derived from `moves`. In production, derive on the server.
- The Nexus chat threads (detail and originate) — seeded for visual completeness. Real threads come from `GET /api/agents/nexus/threads/:moveId`.
- The Intelligence findings (A1/A2/A3), Foundation gaps (F1/F2), pre-mortems (PM-007/PM-009), and cross-industry transfers (T-014/T-021/T-033) referenced by the Originate flow — **these are reachable in the canon today** via Intelligence and Foundation modules. The originate view should call them, not hard-code them.

---

## Design tokens — already mapped

Every color, size, and radius in the prototype maps directly to a token in `tokens.css`. The HTML inlines the relevant subset under `:root`. **Do not introduce new tokens. Do not adjust any token value.**

### Colors used on this surface

| Prototype variable | tokens.css token | Hex |
|---|---|---|
| `--page-bg` | `--canon-bg-surface` | `#ffffff` |
| `--cream` | (close to `--canon-bg-cream`) | `#f8f1e5` |
| `--cream-2` | hero variant | `#faf6ec` |
| `--ink` | `--abarva-ink-black` | `#000000` |
| `--ink-2` | `--canon-gray-900` | `#2c2c2a` |
| `--panel` | `--abarva-navy-ink` | `#0c1a3a` |
| `--gray` | `--abarva-stone` | `#888780` |
| `--gray-dk` | `--abarva-slate` | `#5F5E5A` |
| `--blue` | `--abarva-signal-blue` | `#0066CC` |
| `--blue-dk` | `--abarva-signal-blue-dark` | `#0052a3` |
| `--gold` | (eyebrow gold — see note) | `#9C7B3F` |
| `--green` / `--green-bg` | `--canon-teal` / `--canon-teal-light` | `#1d9e75` / `#e1f5ee` |
| `--amber` / `--amber-bg` | `--canon-amber` / `--canon-amber-light` | `#ba7517` / `#faeeda` |
| `--red` / `--red-bg` | `--canon-red` / `--canon-red-light` | `#a32d2d` / `#fceded` |

> **Note on `--gold`.** This was used in the prototype for mono eyebrow labels inside the Nexus dark panel. Production should use `--abarva-signal-blue` on the dark panel — gold is **not** a sanctioned token. See INTEGRATION.md for the substitution.

### Type

- **Display titles** (move name, view title): Fraunces 500/700, 28px / 18px, letter-spacing -0.3px to -0.025em.
- **Body**: Inter 400/500/600, 13–14px, line-height 1.45–1.5.
- **Mono eyebrows**: JetBrains Mono 600, 9–11px, letter-spacing 1.2–1.5px (=0.12em), uppercase.

### Radius

- 6px — chips, small buttons.
- 8px — primary buttons, inputs, cards inside cards.
- 10px — scaffold rows, promote button.
- 12px — confirm dialog, FAB tooltip.
- 16px — tweaks panel.

### Motion

- 120ms — micro-feedback (button hover background).
- 150–200ms — color/opacity transitions.
- 240–360ms — view transitions, scaffold fill-in (`cubic-bezier(0.2, 0.7, 0.2, 1)`).

---

## Interactions

### Dashboard
- Click a scatter dot or card → `openMove(idx)` → switches to detail view.
- Hover a scatter dot → `#tooltip` positions itself near the cursor; shows move title + meta.
- Tweaks panel `listView` toggle → `setListView(view)` swaps `.cards-grid` / `.scatter` / `.kanban` visibility.

### Detail
- Back button (top-right) → `showView('dashboard')`.
- Suggested-prompt chip → appends as a user bubble + Nexus reply (canned in prototype; real wire connects to Nexus).
- Send button or Enter → same.

### Originate (P0)
- "+ New Move" button → `openOrigination()` → resets `originState`, seeds two opening Nexus bubbles, switches to originate view.
- Click a `.start-chip` → `originStart(entry)` → greys all chips, pushes user message, pushes 1–2 Nexus replies, then staggers `fillSections({...})` over ~380ms each.
- Free-form input → `originSend()` → fills the next empty section in order with the user's text.
- `Promote to P1 Charter` (`#origin-promote-btn`) → only enabled when all 7 sections are filled. In production: POST to create the move, navigate to its detail page.
- `✕ Cancel` → if 0 filled, exit silently. Otherwise open `.confirm-overlay`.
- Esc key → same as Cancel.

### Cross-cutting
- The floating Ask Nexus FAB sits on every view. Click → opens the global Nexus session (out of scope for this handoff; a separate component already exists).

---

## State

For the originate view specifically:

```ts
type OriginSectionKey =
  | 'hypothesis' | 'archetype' | 'sponsor' | 'tenant'
  | 'foundation' | 'value'     | 'evidence';

type OriginState = Partial<Record<OriginSectionKey, string /* HTML */>>;

type OriginEntry =
  | 'intel' | 'foundation' | 'premortem' | 'transfer' | 'blank' | null;
```

The prototype stores section content as HTML strings (`<strong>` allowed) — production should store structured values and render with a sanitizer.

---

## Assets

- `assets/logos/abarva-wordmark-color.svg` — top-nav wordmark.
- `assets/logos/abarva-monogram-v-white.svg` — FAB glyph.

Both are already in the AbarVa repo. The prototype loads from a relative path; in production, import via the app's existing logo component.

---

---

## Move Workspace v0.2

v0.2 is the binding reference spec for the Move Workspace surface. Implementation pending. Supersedes any earlier Workspace concept; Detail page evolves into Workspace per the navigation pivot.

**File:** `15-workspace-v0.2.html`

### Four views

| View | Section ID | Description |
|------|-----------|-------------|
| View A — Current | `#view-a` | Active phase (P4 Build shown). Full workspace shell: chat pane + canvas with gate criteria, artifact shelf, and context rail (team / value / activity). |
| View B — Past | `#view-b` | Reviewing a completed phase (P2 Diagnose). Read-only retrospective: closed gate, signed deliverables, "Jump to current" affordance. |
| View C — Future | `#view-c` | Previewing an upcoming phase (P6 Verify). Dashed borders, scheduled artifacts, gate preview with roadmap helper. |
| View D — Originate inside Workspace | `#view-d` | P0 origination rendered inside the Workspace shell (not the standalone originate page). Chat drives a 7-section scaffold with section-by-section fill-in. Promote locked until sponsor signs. |

### Key design elements

- **Phase rail** — clickable, navigates between past/current/future views in a single workspace. Done dots are filled ink, current is blue with halo, future is dashed.
- **Gate panel** — criteria checklist with promote button; disabled until gate passes. Past gates show "Closed" stamp.
- **Artifact shelf** — grouped by required/optional, status vocabulary: signed / drafting / not started / scheduled / not active.
- **Context rail** — tabbed panel (Sponsor & team / Value at stake / Recent activity) adapts per temporal state.
- **Nav placeholder** — spec explicitly notes "Global AbarVa nav assumed above · not redrawn" — same constraint as `14-strategic-moves-home.html`.

### Footnotes (v0.2 → v0.3)

1. **Confidence bands** on value ranges and role templates (e.g., "Verify owner: Finance-of-record + observer") are aspirational v2 features pending substrate support. Shown as design language only.
2. **Tower references** — the "Handoff Plan" deliverable is bound to `tower_handoff_plan` catalog code that will resolve once the Tower surface is designed; treated here as a generic handoff artifact.

---

## Acceptance checklist

- [ ] All three views render at parity with the prototype, using existing canon components.
- [ ] Tokens map 1:1 to `tokens.css` — no new color/type/radius values introduced.
- [ ] Phase rail extracted as a shared component (used in detail + originate).
- [ ] Originate scaffold fills in with the same staggered animation (~380ms between rows).
- [ ] Promote button enables only when all 7 sections are filled.
- [ ] Cancel-with-content opens the confirm dialog; Cancel-empty exits silently.
- [ ] Esc key dismisses the dialog if open, else cancels origination.
- [ ] Scatter / cards / kanban list views toggle from a user preference (not a tweaks panel).
- [ ] Status colors are semantic — never used decoratively.
- [ ] No tweaks panel ships in production.
- [ ] No gradients, no decorative SVG icons, no emoji, no stock illustration.
