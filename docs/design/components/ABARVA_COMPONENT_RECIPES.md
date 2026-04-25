# AbarVa · Component Recipes

Slice ID: DES1 / Component recipes
Document type: per-component design contract.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This document specifies the canonical component recipes future
implementation slices follow. Each recipe describes purpose, props,
visual treatment, behavior, and constraints. Reads in the
`ABARVA_VISUAL_CANON.md` direction; implementations must conform to
both this file and the canon.

Recipes documented here:

1. AbarVaTopNav
2. AgentBriefPanel
3. AgentBadge
4. JourneyRail
5. PhaseCanvas
6. EvidenceChip
7. FileTypeChip
8. PressureCard
9. PatternCard
10. DatasetCard
11. DetailDrawer
12. EmptyInspector

---

## 1. AbarVaTopNav

### Purpose

The single global top nav. Anchors the AbarVa wordmark, the canonical
top-level surfaces, and the operator chip.

### Props (suggested)

```ts
interface AbarVaTopNavProps {
  activeSurface?: 'home' | 'programs' | 'tower' | 'intelligence' | 'source' | 'admin';
  operator: { initials: string; role: string };
  workspaceLabel?: string;
}
```

### Visual treatment

- Height 56 – 64px. Cream background (`#FAFAF9`); 1px bottom border
  (`#E8E6E3`).
- Layout (left → right): wordmark · top-level link row · operator
  chip.
- Wordmark: serif (Georgia / Times New Roman fallback), 18 – 20px,
  weight 600, ink. Click → `/home`.
- Top-level links: 13 – 14px DM Sans. Default `muted`; hover `ink`;
  active surface adds a 2px bottom inset accent (`teal`).
- Operator chip: 13px DM Sans, mono initials in a 28px circle on
  the right.

### Behavior

- No dropdown mega-menus. Sub-surfaces live inside the surface page.
- No banner / promo strip above or below.
- Persists across all surfaces; never animates beyond a 120ms fade
  on activeSurface change.
- Workspace switcher is a separate component below the top nav, not
  embedded inside it.

### Forbidden

- Mark + tagline lockup.
- Animated wordmark.
- Notification bell with badge count on the nav itself.
- Marketing strip / announcement bar.

---

## 2. AgentBriefPanel

### Purpose

The shared panel shell every canonical agent (Atlas / Sentinel /
Steward / Nexus) uses to render its brief. Gives the operator a
consistent "who is speaking" read.

### Props (suggested)

```ts
interface AgentBriefPanelProps {
  agent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  title: string;
  eyebrow: string;            // e.g., "Sentinel brief · pattern detection read model"
  topChips: AgentChip[];      // severity / confidence chips
  briefLines: BriefLine[];    // ≤ 6 label · value rows
  recommendedAction?: { label: string; reason: string; href: string };
  suggestedHandoffs?: AgentHandoff[];
  suggestedFollowUps: AgentFollowUp[]; // exactly 3, all disabled today
  sourceLabel: string;
  interpretationBasis: string;
}
```

### Visual treatment

- Card: `#FFFFFF`, 1px border (`#E8E6E3`), 12px radius, 18 – 22px
  padding.
- 3px **left** border in the agent's accent (canon §H):
  Nexus = teal, Sentinel = amber, Atlas = teal-on-ink chrome (amber
  / red when severity escalates), Steward = muted ink.
- Header: eyebrow (mono), title (serif H3), severity / confidence
  chips at top-right (tooltip = `interpretationBasis`).
- Body: 4 – 6 BriefLine rows (label = 10px mono uppercase / value =
  13px DM Sans).
- Recommended-action panel inside a dashed-border `surface2`
  callout; one sentence + one routed link + one reason caption.
- Follow-up section: eyebrow (`Ask <agent> · suggested follow-ups ·
  <count>`) + three disabled chips.
- Footer caption: 11px italic `mutedSoft`, echoes
  `interpretationBasis`.

### Behavior

- The three follow-up chips always render `disabled` +
  `aria-disabled="true"` until live runtime lands. Sub-label:
  `deferred · live <agent> runtime`.
- Hover tooltip on each chip names the deferral reason.
- No animation beyond a 120ms fade on mount.

### Forbidden

- Two AgentBriefPanels on the same page (one brief per page).
- Live "Ask <agent>" affordance without runtime support.
- Inventing a dollar amount in any field.
- Real `E-###` citations in any field.

---

## 3. AgentBadge

### Purpose

Inline marker that names which agent is speaking — used in card
headers, table cells, audit rows, drilldowns.

### Props

```ts
interface AgentBadgeProps {
  agent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  status?: 'ready' | 'partial' | 'blocked';
  size?: 'xs' | 'sm';
}
```

### Visual treatment

- Pill: 9 – 10px JetBrains Mono uppercase, weight 700,
  letter-spacing 0.10 – 0.12em.
- Background: agent-accent at 10% opacity.
- Foreground: agent accent at full opacity.
- Optional status suffix: `· <status>` in muted text (e.g.,
  `nexus · partial`).
- Padding: 2 – 4px vertical, 6 – 10px horizontal.
- Radius: 999 (full pill).

### Behavior

- Inline; never block. Always sits next to a label or a name.
- Never animated.
- Never carries a glyph; the agent name is the brand.

---

## 4. JourneyRail

### Purpose

The canonical six-phase rail on the program journey page. Renders
`origination → charter → diagnose → design → execute → verify` with
G1 – G4 gate caps.

### Props

```ts
interface JourneyRailProps {
  phases: Array<{
    index: 1 | 2 | 3 | 4 | 5 | 6;
    key: 'origination' | 'charter' | 'diagnose' | 'design' | 'execute' | 'verify';
    label: string;
    state: 'past' | 'active' | 'future';
  }>;
  gates: Array<{
    afterPhase: 1 | 2 | 3 | 4 | 5;
    label: 'G1' | 'G2' | 'G3' | 'G4';
    status: 'signed' | 'missing_inputs' | 'not_wired';
  }>;
  onPhaseClick?(phaseIndex: number): void;
}
```

### Visual treatment

- Horizontal flex row, full width.
- Each phase node: 28 – 32px diameter circle, 1px border
  (`#E8E6E3`), label below in 11px mono uppercase.
- Active phase: filled in agent accent (teal); future phases: muted
  hairline; past phases: accent-tinted background.
- Gate cap between phases: small pill carrying G1 / G2 / G3 / G4 in
  mono uppercase, plus a status chip beneath.
- Click on phase → routes to phase canvas.

### Behavior

- The rail never invents a `signed_off` state from seed alone.
- Programs in canonical Execute (5) honestly emit no gate cap after
  phase 5 (no exit gate).
- No spring animation; simple 120ms fade on state change.

### Forbidden

- A seventh phase.
- A G5 gate.
- A skipped or invisible gate cap (must surface honestly).

---

## 5. PhaseCanvas

### Purpose

The center-canvas surface inside a phase route — the workshop room.
Hosts deliverable preview, workshop notes, evidence drawer, and
the right-rail Steward gate panel.

### Props

```ts
interface PhaseCanvasProps {
  programCode: string;
  phaseKey: 'origination' | 'charter' | 'diagnose' | 'design' | 'execute' | 'verify';
  activeArtifact: ProgramArtifact;          // PDEL contract
  workshopNotes?: WorkshopNotes;            // MW1 contract
  gatePanel: StewardGatePanel;
}
```

### Visual treatment

- Two-column layout: center canvas (~70%) + Steward gate rail (~30%).
- Center canvas: white card, 24px padding, hosts the renderable
  artifact (`html_render` / `markdown_render` / `note_list`).
- Steward gate rail: white card, 16 – 20px padding, 3px left border
  in muted ink, hosts gate inputs / readiness / blocking items /
  next action.
- Save / stop / start affordances at the top of the canvas in the
  recommended-action band.

### Behavior

- Reads from PDEL `program-artifact-inventory` for the artifact;
  never re-derives.
- Renders `html_render` artifacts via the deliverable canvas
  pipeline (no `dangerouslySetInnerHTML` without sanitization).
- "Advance phase" affordance is **disabled** until the gate's hard
  inputs are captured; sub-label `deferred · gate inputs missing`.
- Workshop notes pane is collapsible; default-open on the active
  phase.

### Forbidden

- Two artifacts open at once (a tab is the future affordance).
- A Nexus brief AND a Steward gate panel on the same canvas
  simultaneously (Steward owns the rail; Nexus is the journey-page
  rail).
- Auto-advance phases.

---

## 6. EvidenceChip

### Purpose

Inline chip that names an evidence reference — used inside cards,
drawers, audit rows, pattern detail evidence trail rows.

### Props

```ts
interface EvidenceChipProps {
  state: 'not_seeded' | 'partial' | 'cited' | 'quality_checked' | 'usable_as_evidence' | 'blocked';
  label?: string;        // optional friendly label (e.g., "evidence · cited")
  tooltip?: string;
}
```

### Visual treatment

- Pill: 10px JetBrains Mono uppercase, weight 700.
- Background: state-tinted (10% accent opacity).
- Foreground: state accent (teal for usable_as_evidence /
  quality_checked / cited; amber for partial; red for blocked;
  muted for not_seeded).
- Padding: 2px vertical, 6 – 8px horizontal. Radius 999.

### Behavior

- Hover tooltip names the state in plain language.
- Never carries a real `E-###` citation today; the chip names the
  state, not the reference.
- Click is a no-op until the evidence inspector slice lands.

### Forbidden

- Claiming `cited` / `quality_checked` / `usable_as_evidence` while
  the seed lacks the underlying state.
- Inventing a fake `E-###` value.
- Animating the chip.

---

## 7. FileTypeChip

### Purpose

Names the artifact's file type or render mode — used inside artifact
cards (PDEL contract).

### Props

```ts
interface FileTypeChipProps {
  type: 'DOC' | 'PDF' | 'XLS' | 'PPT' | 'NOTE' | 'HTML' | 'DATA';
}
```

### Visual treatment

- Pill: 10px JetBrains Mono uppercase, weight 700, letter-spacing
  0.12em.
- Background: `surface2`. Foreground: `muted`.
- Padding: 2px vertical, 6px horizontal. Radius 4 (square-ish).

### Behavior

- Inline; sits next to the artifact title.
- Never carries a glyph or icon.
- Never indicates download status; downloadability is a separate
  affordance.

---

## 8. PressureCard

### Purpose

Tower / Programs pressure surfacing. One card per top-N pressure
signal.

### Props

```ts
interface PressureCardProps {
  signal: ProgramControlTowerSignal; // S9e contract
  routeHref: string;                  // canonical Programs detail
  position: 1 | 2 | 3;                // top-3 only on the Tower
}
```

### Visual treatment

- White card, 1px border, 3px **top** border in the severity accent
  (red `critical`, amber `high`, accent `medium`, mutedSoft `low`).
- Eyebrow: `<severity> pressure · <programCode>` in mono uppercase.
- Title: serif H3.
- Summary: 13px DM Sans `muted`.
- Missing-inputs preview: top 3 + "+ N more" overflow.
- Recommended-action row.
- "Open program →" affordance at the bottom.

### Behavior

- Card body never invents a dollar amount.
- Card never claims `evidence_status: ready` while seed lacks
  evidence.
- Top three on the Tower; expansion to N on the Programs surface is
  allowed.

### Forbidden

- A fourth pressure card on the Tower.
- A pressure card without a "Open program →" route.
- Animating the card.

---

## 9. PatternCard

### Purpose

Sentinel pattern surfacing on the Intelligence landing. One card
per I1 detection.

### Props

```ts
interface PatternCardProps {
  detection: SentinelPatternDetection; // I1 contract
  card: SentinelPatternCard;            // I2 view contract
}
```

### Visual treatment

- White card, 1px border, 3px **top** border in the severity accent.
- Eyebrow: pattern name in agent accent (mono uppercase).
- Severity + confidence MiniChips at top-right.
- Title: serif H3.
- Summary: 13px DM Sans body.
- `whyItMatters` italic caption (muted).
- 2-cell stat grid (`Programs` / `Source signals`).
- Affected program list (top 4 + "+ N more"). Each program code
  links to canonical Programs detail.
- Collapsible `Missing inputs · <count>` `<details>` block.
- Recommended-action row.
- Handoff chips (per handoff target).
- "Open pattern detail →" affordance at the bottom.

### Behavior

- Card body never invents a dollar amount.
- Card never claims a real `E-###` citation.
- "Open pattern detail →" routes to
  `/tenant/<routeSlug>/intelligence/patterns/<patternKey>`.

### Forbidden

- A pattern card without a routing affordance.
- Inventing a non-canonical pattern key.
- Animating beyond a 120ms fade.

---

## 10. DatasetCard

### Purpose

Per-dataset surfacing inside the ADM4 explorer (and any future
dataset drilldown).

### Props

```ts
interface DatasetCardProps {
  domain: DatasetExplorerDomainRollup; // ADM4 view contract
  variant: 'rollup' | 'row';
}
```

### Visual treatment

#### Rollup variant

- White card, 1px border, 3px **left** border in status accent.
- Header: ordinal (`01` – `12`, mono) + status pill (top-right).
- Domain name (serif).
- 3-cell stat grid (`loaded` / `avail` / `usable`).
- Optional blocked + orphan callout rows (red / amber).
- "Top: <name>" italic caption when a top item exists.

#### Row variant

- White card, 1px border, 3px **left** border in usability accent.
- Title row: dataset name (DM Sans body 13px weight 600) + usability
  chip top-right.
- Metadata grid: `source` / `parse` / `fresh` / `scope` / `owner` /
  `connector` (mono 11px).
- Linked-programs / linked-patterns rows with EvidenceChips +
  routing.
- Missing-metadata amber callout when present.
- Steward guidance italic body.
- AgentBadge row for `agentsAllowedToUse`; honest "No agent allowed
  to use today." when empty.

### Behavior

- Rollup variant clicks open the domain's row list (collapsible
  detail).
- Row variant clicks open the future inspector drawer; today the
  affordance is honest no-op.

### Forbidden

- Claiming a non-null `connector` until a live sync engine lands.
- Showing a fake download URL in the row metadata.
- Inventing a dollar amount in any cell.

---

## 11. DetailDrawer

### Purpose

Right-side overlay that hosts per-object detail (dataset row, user,
connector, evidence row, audit row, pattern row).

### Props

```ts
interface DetailDrawerProps {
  open: boolean;
  title: string;
  eyebrow: string;
  onClose(): void;
  children: React.ReactNode;
}
```

### Visual treatment

- Right-aligned overlay, 360 – 480px wide on desktop; full-screen
  sheet on narrow viewports.
- White surface, 1px left border (`#E8E6E3`), 24px padding.
- Header: eyebrow (mono uppercase) + title (serif H3) + plain-text
  "Close ✕" affordance top-right.
- Body: caller-provided content with consistent spacing (12 – 16px
  between rows).
- Footer caption: deterministic-source label.

### Behavior

- Closes on `Esc`, on click outside, and on the explicit "Close ✕"
  affordance.
- 120ms fade animation on open / close. No slide / spring.
- Single drawer instance per page (only one open at a time).
- Drawer state is preserved on mode switches inside the parent
  surface (canon §K progressive-disclosure rule).

### Forbidden

- A modal-style centered dialog.
- A drawer that occupies more than 50% of the viewport on desktop.
- Drawer that closes mid-edit without confirmation.

---

## 12. EmptyInspector

### Purpose

Honest placeholder rendered in Zone E (and other inspector slots)
when nothing is selected.

### Props

```ts
interface EmptyInspectorProps {
  caption: string; // describes WHY the slot is empty
  routeHint?: { label: string; href: string }; // optional next step
}
```

### Visual treatment

- Dashed-border container: `surface2` background, 1px dashed border
  (`#E8E6E3`), 10px radius, 12 – 14px padding.
- Body: 11 – 12px italic `mutedSoft`.
- Optional route hint as a small `accent` link at the bottom.

### Behavior

- Always renders the caption explicitly. Never blank.
- The caption must name **why** the slot is empty (e.g., "Object
  inspector slot · selecting a row will open the detail drawer
  here once the inspector slice lands.").
- No animation; never auto-shifts.

### Forbidden

- An EmptyInspector with no caption.
- An EmptyInspector that pretends to be a loading spinner.
- A second EmptyInspector inside the same parent surface.

---

## Acceptance for `verified` promotion

A component implementation slice is `verified` when:

- The component matches the recipe's visual treatment and behavior.
- Props match the recipe's suggested shape (or a documented
  evolution lands as a canon revision).
- All canon §H, §I, §J, §K, §L rules are honored.
- No-fabrication rules from `ABARVA_VISUAL_CANON.md` §L are
  honored.
- Module hygiene (the component imports only what its recipe
  permits — `next/link` + the read model + sibling components).
