# Wireframe Requirements by Page

Status: Canonical (CAT1)
Authored: 2026-04-25
Type: Cross-page wireframe contract. Documentation only — no
application code, no runtime modification, no migrations.

This document enumerates the **minimum render contract** every page
wireframe must satisfy to be canon-compliant. It composes from the
visual blueprints under `docs/design/pages/` and the AbarVa Visual
Canon (`docs/design/ABARVA_VISUAL_CANON.md`). For pages where a
dedicated blueprint does not yet exist (Home, Source, Source detail,
Vendor Evaluation, Knowledge Library), this document declares the
inherited blueprint and the deltas the new wireframe must add.

---

## A. Universal wireframe rules

Every page wireframe must:

- Render the canonical top nav (`AbarVaTopNav`) with the page's
  `active` surface key.
- Render exactly one `AgentBriefPanel` for the page's primary
  agent at the top of the content region.
- Hide details behind drawer / drill-down / same-canvas tab swap;
  no modal dialogs.
- Render `EmptyInspector` with a Steward-seeding caption for any
  empty region — never an empty card.
- Hide null-valued metrics rather than render `—`.
- Source all colors from `abarva-theme.ts`. No hex literals in
  components.
- Carry a deterministic basis caption in every drawer footer.

---

## B. Per-page wireframe requirements

### 1. Home / Executive Entry

- **Top nav:** `active="home"`.
- **Above the fold:** `AgentBriefPanel(agent="atlas",
  variant="light")` — light surface (dark surface is reserved for
  Tower).
- **Brief content:** 3–4 lines, single recommended action chip,
  three disabled follow-up chips with `deferred · live atlas
  runtime` sub-label.
- **Below the brief:** operator-queue link + four nav cards
  (Programs / Intelligence / Tower / Setup) — each card carries
  one fact and one verb (no charts).
- **Drawer:** none on the index; recommended-action click navigates
  to the destination surface.
- **Inherited blueprint:** Tower (brief chrome), with the
  light-surface override.
- **Deltas to author:** dedicated Home blueprint **to be
  defined**.

### 2. Setup / Admin

- **Top nav:** `active="admin"`.
- **Above the fold:** `AgentBriefPanel(agent="steward",
  variant="light")`.
- **Five vertical zones:** A · Users & Access, B · Governance,
  C · Connectors & Data Sources, D · Dataset Domain Readiness,
  E · Object Inspector (right-side drawer).
- **Zone D mounts the existing ADM4 `DatasetExplorerPanel`
  unmodified.**
- **Agent Readiness Matrix** below Zone D — agents × dataset
  domains; each cell is an `EvidenceChip`.
- **Drawer:** Zone E `DetailDrawerShell`; `EmptyInspector` when
  no row is selected.
- **Blueprint:** `docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md`.

### 3. Programs

- **Top nav:** `active="programs"`.
- **Above the fold:** `AgentBriefPanel(agent="nexus",
  variant="light")`.
- **MetricStrip:** ≤ 5 metrics; hide null values.
- **Portfolio table:** columns code · name · phase · gate ·
  evidence · steward; hairline-soft row separators; no zebra
  striping; row click → per-program canvas (drilldown).
- **Per-program canvas:** `JourneyRail` (6 phases, 4 gate caps —
  no fake G5), per-phase deliverables, evidence chips,
  `DetailDrawerShell` for any artifact.
- **Drawer width:** 400px (clamp 360–480).
- **Blueprint:** `docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md`.

### 4. Program Workshop Mode

- **Top nav:** `active="programs"` (sub-surface).
- **Above the fold:** none — workshop mode is full-focus center
  canvas.
- **Center canvas:** the active deliverable for the current phase.
- **Left rail:** `JourneyRail` (6 phases · 4 gate caps).
- **Right rail:** gate readiness panel + recommended next workshop.
- **Drawer:** gate readiness drawer on gate-cap click.
- **No chat input. No agent avatar. Atlas does not appear in the
  room — only post-synthesis.**
- **Inherited blueprint:** Programs (per-program canvas section).
- **Deltas to author:** dedicated Workshop Mode blueprint
  **to be defined**.

### 5. Source

- **Top nav:** `active="source"`.
- **Above the fold:** `AgentBriefPanel(agent="nexus",
  variant="light")` summarizing inbound sponsor signal.
- **Filters bar:** sponsor / program / channel / context-quality
  state.
- **Event feed:** chronological list of events; each row carries
  channel chip, sponsor name, deterministic excerpt,
  context-quality chip, optional Sentinel pattern chip.
- **Drawer:** none on the index; row click navigates to event
  detail (page 06).
- **Inherited blueprint:** Programs portfolio table chrome.
- **Deltas to author:** dedicated Source blueprint **to be
  defined** (V1).

### 6. Source · Artifacts, Reviews, Approvals

- **Top nav:** `active="source"`.
- **Center canvas:** artifact body (deterministic excerpt in v2).
- **Right rail:** review state, named reviewer, named approver,
  evidence usability state.
- **Footer CTA:** single primary action — "Approve"
  (Steward-only); secondary actions as muted text-links.
- **Drawer:** none on the page (the page IS the detail).
- **Inherited blueprint:** Programs (right-rail chrome) + Setup
  Zone E (object inspector).
- **Deltas to author:** dedicated artifact-detail blueprint **to
  be defined** (V1).

### 7. Vendor Evaluation

- **Top nav:** `active="tower"` (V2 may promote to dedicated
  surface).
- **Above the fold:** `AgentBriefPanel(agent="atlas",
  variant="light")` — vendor lens framing.
- **Vendor table:** name · capability tier · contract end · spend
  tier · concentration metric.
- **Pattern strip:** ≤ 3 Sentinel pattern cards (vendor
  concentration / contract risk).
- **Drawer:** vendor detail drawer with substitution candidates,
  linked programs, Steward attestation.
- **Inherited blueprint:** Tower lens chrome.
- **Deltas to author:** dedicated Vendor Evaluation blueprint
  **to be defined** (V2).

### 8. Intelligence

- **Top nav:** `active="intelligence"`.
- **Above the fold:** `AgentBriefPanel(agent="sentinel",
  variant="light")`.
- **Active Patterns strip:** horizontal scroller, ≤ 6 cards
  visible, ordered severity DESC then confidence DESC.
- **Dynamic Insight Canvas (DIC):** four tabs Summary · Evidence ·
  Programs · Actions; same-canvas swap on tab change.
- **Drawer:** `DetailDrawerShell` for Sentinel response (single-turn).
- **No chat input.**
- **Blueprint:** `docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md`.

### 9. AI Control Tower

- **Top nav:** `active="tower"`.
- **Above the fold:** `AgentBriefPanel(agent="atlas",
  variant="dark")` — `navyDark` surface (the only dark surface in
  the platform).
- **Scorecards row:** ≤ 5 scorecards, each one fact + one verb.
- **Active Lens region:** exactly 1 lens visible at a time.
- **Pressure cards row:** ≤ 3 `PressureCard` entries; severity
  sorted; ties broken by program code ASC.
- **Drawer:** `Ask Atlas` `DetailDrawerShell` (single-turn).
- **No charts on the index.**
- **Blueprint:** `docs/design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md`.

### 10. Data, Evidence, Knowledge Layer

- **Top nav:** the layer surfaces are cross-page; they do not
  introduce a new top-nav entry.
- **Setup data zone:** inherits Setup Zone D.
- **Intelligence library:** inherits Intelligence card + drawer
  chrome with a library-specific list shape.
- **Evidence drawer (cross-page):** opens from any E-### click;
  body renders source artifact + quality-check state; footer
  caption names the deterministic basis.
- **Inherited blueprints:** Admin Setup (Zone D / E) + Intelligence
  (drawer + card chrome).
- **Deltas to author:** dedicated Knowledge Library blueprint
  **to be defined** (V1).

---

## C. Common primitives

Every wireframe in this catalog is built from the canonical
primitives in `src/components/abarva/`:

- `AbarVaTopNav` — top nav bar (52–56px, light).
- `AbarvaWordmark` — wordmark (no SVG).
- `AgentBriefPanel` — brief panel (light or dark variant; agent
  accent borders).
- `AgentBadge` — agent footer badge.
- `MetricStrip` — calm strip of ≤ 5 metrics.
- `JourneyRail` — six-phase + four-gate rail (Programs).
- `PatternCard` — Sentinel pattern card (Intelligence).
- `PressureCard` — Atlas pressure card (Tower).
- `EvidenceChip` — evidence lifecycle chip.
- `FileTypeChip` — file-type chip (DOC / PDF / XLS / PPT / NOTE /
  HTML / DATA).
- `DetailDrawerShell` — right-side drawer (clamped 360–480px).
- `EmptyInspector` — honest empty caption.

No wireframe may introduce a new primitive without a slice contract
authoring it (see DES2 · Core UI Primitives).

---

## D. Acceptance criteria

A wireframe is canon-compliant when:

1. It satisfies the universal rules in §A.
2. It satisfies the per-page requirements in §B for its surface.
3. It uses only the primitives listed in §C; new primitives are
   slice-gated.
4. It cites its blueprint reference (or declares the inherited
   blueprint + deltas if the dedicated blueprint is to be defined).
5. Every drawer footer names the deterministic basis caption.
