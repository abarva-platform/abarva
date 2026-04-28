# AbarVa Page Catalog

**Version 1.0 · April 27 2026 · 78 entries across 6 surfaces + components**

This is the design-layer catalog. Every page, state variant, modal, and shared component has a stable ID. Use these IDs as binding spec when briefing Code Desktop, writing tickets, or referencing surfaces in conversation.

The full machine-readable catalog lives in `pages.yaml` alongside this file. This document is the human-browseable index.

---

## How to read an ID

Format: `<SURFACE>-<TYPE>-<VARIANT>`

| Surface code | Surface name |
|---|---|
| `SHL` | Shell · cross-cutting chrome |
| `HOM` | Home · executive landing |
| `SET` | Setup · Steward |
| `PRG` | Programs · Nexus |
| `SRC` | Source · Nexus + Steward |
| `INT` | Intelligence · Sentinel |
| `TWR` | Tower · Atlas |
| `CMP` | Components · shared design-system primitives |

| Type code | Type |
|---|---|
| `IDX` | Index page (default surface entry) |
| `DTL` | Detail page (drilling into a single item) |
| `MOD` | Modal (confirmation, drawer, intake) |
| `FLW` | Flow step (multi-step wizard or origination) |
| `STA` | State variant (overlay or stage of an existing page) |
| `LNS` | Lens (Tower Adoption/Value/Risk views) |
| `EMP` | Empty state |
| `ERR` | Error state |

Variants are phase numbers (`P0`–`P6`), severity codes (`HI`/`MD`/`LO`), sub-section names (`CONN`/`USR`/`AUD`), or descriptive tokens (`VALIDATED`/`INREVIEW`).

---

## Demo data baseline

Every entry's content references this baseline:

- **Tenant**: Apex Retail Group · Locked
- **Flagship program**: `APX-CDP-2026` · Apex Retail CDP Activation
- **Current phase**: P2 Synthesis · Design gate (P2 → P3) pending under Steward
- **Known blockers**: Workshop 5 incomplete · value hypothesis evidence missing · privacy boundary confirmation gaps
- **Evidence coverage**: 36%
- **Linked source event**: AMS Vendor Consolidation 2026 · Stage 7 BAFO · linkedProgramCode `APX-CDP-2026`

---

## Status legend

| Status | Meaning |
|---|---|
| `built` | Mockup HTML exists in `/mnt/user-data/outputs/abarva-mockups` |
| `matched` | Built and matches locked production aesthetic (paper/navy/bold serif) |
| `in-shell` | Built within the new 3-zone shell template |
| `pending` | Spec'd in this catalog but not yet rendered |
| `placeholder` | Acknowledged · awaiting detailed design |
| `in-repo` | Production code exists · catalog references the as-built state |

Build priority: `P0` (required for shell wave) · `P1` (next wave) · `P2` (later)

---

## Shell · cross-cutting chrome

| ID | Name | Status | Priority |
|---|---|---|---|
| `SHL-NAV-DEFAULT` | Standard 5-icon navigation rail · default state | in-shell | P0 |
| `SHL-LOGIN` | Login · pre-tenant entry | built (pre-shell) | P1 |
| `SHL-LANDING` | Public landing · pre-auth | pending | P2 |
| `SHL-AUTH-LOST` | Auth lost · re-authentication | pending | P2 |

---

## Home · executive landing

| ID | Name | Status | Priority |
|---|---|---|---|
| `HOM-IDX-DEFAULT` | Home · executive landing across surfaces | pending | P1 |

---

## Setup · Steward

Sub-navigation: **Connectors · Users · Audit log · Policies · Tenant · Architecture**

| ID | Name | Status | Priority |
|---|---|---|---|
| `SET-IDX-CONN` | Setup · Connectors view (default) | in-shell | P0 |
| `SET-IDX-USR` | Setup · Users view | pending | P1 |
| `SET-IDX-AUD` | Setup · Audit log view | pending | P1 |
| `SET-IDX-POL` | Setup · Policies view | pending | P1 |
| `SET-IDX-TEN` | Setup · Tenant view | pending | P2 |
| `SET-IDX-ARC` | Setup · Architecture view (Atlas + Steward sub-page) | in-repo | P1 |
| `SET-DTL-CONN-DEGRADED` | Connector detail · ServiceNow degraded | built (pre-shell) | P1 |
| `SET-DTL-CONN-HEALTHY` | Connector detail · healthy state | pending | P2 |
| `SET-FLW-CONN-RECONNECT` | Reconnect flow · auth refresh | pending | P1 |
| `SET-FLW-USR-INVITE` | Invite collaborator · 4-step wizard | built (pre-shell) | P1 |
| `SET-MOD-POLICY-REVIEW` | Annual policy review modal | pending | P2 |

---

## Programs · Nexus

Phase model: **Originate (P0) → Discovery (P1) → Synthesis (P2) → Design (P3) → Build (P4) → Activate (P5) → Operate (P6)**

| ID | Name | Status | Priority |
|---|---|---|---|
| `PRG-IDX-DEFAULT` | Programs · portfolio index (default) | matched | P0 |
| `PRG-IDX-EMPTY` | Programs · empty state (new tenant) | pending | P1 |
| `PRG-IDX-FILTERED` | Programs · filtered by status | pending | P1 |
| `PRG-FLW-ORIGINATE` | Originate new program · Phase 0 intake | pending | P0 |
| `PRG-DTL-P1` | Program detail · Phase 1 Discovery | pending | P0 |
| `PRG-DTL-P2` | Program detail · Phase 2 Synthesis (current state for APX-CDP-2026) | matched + in-shell | P0 |
| `PRG-DTL-P3` | Program detail · Phase 3 Design | pending | P0 |
| `PRG-DTL-P4` | Program detail · Phase 4 Build | pending | P0 |
| `PRG-DTL-P5` | Program detail · Phase 5 Activate | pending | P1 |
| `PRG-DTL-P6` | Program detail · Phase 6 Operate (post-launch) | pending | P1 |
| `PRG-STA-GATE-PENDING` | Gate review ribbon · active state on any phase detail | pending | P0 |
| `PRG-MOD-GATE-APPROVE` | Gate approval confirmation modal | pending | P0 |
| `PRG-MOD-CONTRADICTION` | Contradiction resolution modal | built (pre-shell) | P1 |
| `PRG-MOD-EVIDENCE-DRAWER` | Evidence drawer · citation drill-in | built (pre-shell) | P1 |
| `PRG-MOD-CUSTOM-ACTION` | Custom action · expanded input | built (pre-shell) | P2 |
| `PRG-STA-PHASE-TRANSITION` | Phase transition animation state | built (pre-shell) | P2 |
| `PRG-STA-FILE-UPLOAD` | File upload + parse pipeline | built (pre-shell) | P1 |
| `PRG-STA-AGENT-HANDOFF` | Agent handoff · Nexus → Sentinel | built (pre-shell) | P1 |
| `PRG-STA-SUGGESTED-ACTION` | Suggested action flow · 3-frame | built (pre-shell) | P1 |
| `PRG-MOD-SCORECARD-OVERRIDE` | Scorecard override · rationale required | built (pre-shell) | P2 |

---

## Source · Nexus + Steward

10-stage tracker: **Plan · RFI · Shortlist · RFP · Q&A · Initial-Bid · BAFO · Selection · Award · Onboard**

| ID | Name | Status | Priority |
|---|---|---|---|
| `SRC-IDX-EVENTS` | Source · events list (default) | in-repo | P0 |
| `SRC-IDX-EMPTY` | Source · empty state (no events) | pending | P2 |
| `SRC-DTL-EVENT` | Source event · canvas (10-stage detail) | in-repo + built (pre-shell) | P0 |
| `SRC-STA-BAFO` | Source · BAFO strategy panel | in-repo | P1 |
| `SRC-STA-PRICING` | Source · pricing normalization | in-repo | P1 |
| `SRC-STA-COMPARISON` | Source · vendor comparison matrix | in-repo | P1 |
| `SRC-STA-RISK` | Source · risk detection | in-repo | P1 |
| `SRC-STA-SIGNALS` | Source · signals stream | in-repo | P1 |
| `SRC-STA-LINKED-PROG` | Source · linked program storyline | pending | P0 |
| `SRC-MOD-VENDOR-RESPONSE` | Vendor response modal · BAFO submission | pending | P2 |
| `SRC-FLW-ORIGINATE` | Originate source event · Phase 0 intake | pending | P1 |
| `SRC-MOD-ACTION-QUEUE` | Source action queue · cross-vendor next moves | in-repo | P2 |

**Note**: Source is largely shipped per the build dump (Waves 14–16, slices SRC11–SRC30). Pre-shell mockup `04-source-canvas.html` shows the original 3-column 240+center+380 canvas. Shell adapter needs to collapse to 2-pane (agent column + work pane) and shift the 10-stage tracker to the middle strip. The Source ↔ Program linkage chip (`SRC-STA-LINKED-PROG`) is critical for the demo storyline and not yet built.

---

## Intelligence · Sentinel

Pattern tiers: **M · Meta** (foundational frameworks) · **T1 · Craft** (how-to) · **T3 · Use-case** (applied templates)

| ID | Name | Status | Priority |
|---|---|---|---|
| `INT-IDX-DEFAULT` | Intelligence · library index (all tiers) | matched + in-shell | P0 |
| `INT-IDX-FILTERED-M` | Intelligence · M-tier filter active | pending | P1 |
| `INT-IDX-FILTERED-T1` | Intelligence · T1-tier filter active | pending | P1 |
| `INT-IDX-FILTERED-T3` | Intelligence · T3-tier filter active | pending | P1 |
| `INT-IDX-FILTERED-INREVIEW` | Intelligence · In review filter active | pending | P1 |
| `INT-DTL-VALIDATED` | Pattern detail · validated state (T3-H01 Ambient) | matched | P0 |
| `INT-DTL-INREVIEW` | Pattern detail · in review state | pending | P1 |
| `INT-DTL-CANDIDATE` | Pattern detail · candidate state | pending | P1 |
| `INT-DTL-DEPRECATED` | Pattern detail · deprecated state | pending | P2 |
| `INT-MOD-SUBMIT` | Pattern submission modal | pending | P1 |
| `INT-IDX-SOLUTIONS` | Solution archetypes · sub-section of Intelligence | in-repo | P1 |

---

## Control Tower · Atlas

Lenses: **Adoption · Value · Risk** (per Wave 32 doc spec)

| ID | Name | Status | Priority |
|---|---|---|---|
| `TWR-IDX-PORTFOLIO` | Tower · portfolio default (cross-program pressures) | matched + in-shell | P0 |
| `TWR-IDX-FILTERED-HIGH` | Tower · high severity filter active | pending | P1 |
| `TWR-IDX-FILTERED-RESOLVED` | Tower · resolved pressures (history) | pending | P1 |
| `TWR-DTL-PRESSURE-HIGH` | Pressure detail · high severity (AI Cloud Spend) | matched | P0 |
| `TWR-DTL-PRESSURE-MEDIUM` | Pressure detail · medium severity | pending | P1 |
| `TWR-DTL-PRESSURE-LOW` | Pressure detail · low watch | pending | P1 |
| `TWR-IDX-PROG-SCOPE` | Tower · program-scope view (zoomed to single program) | pending | P0 |
| `TWR-LNS-ADOPTION` | Tower · Adoption lens | pending | P1 |
| `TWR-LNS-VALUE` | Tower · Value lens (post-launch outcome realization) | pending | P0 |
| `TWR-LNS-RISK` | Tower · Risk lens | pending | P1 |
| `TWR-IDX-OUTCOME` | Tower · outcome realization (post-launch tracking) | pending | P0 |
| `TWR-MOD-NEW-PRESSURE` | Set new pressure modal | pending | P2 |
| `TWR-STA-ACTIVITY-EXPANDED` | Cross-program activity stream · expanded view | pending | P2 |

**Note**: `TWR-IDX-PROG-SCOPE` is the long-scroll page where program-specific metrics live. Founder explicitly called for vertical depth here ("page can roll down to show more data below... we don't have to cramp everything up"). `TWR-LNS-VALUE` and `TWR-IDX-OUTCOME` together are the surfaces that close the "did it deliver?" loop in the product story.

---

## Components · shared design-system primitives

| ID | Name | Status |
|---|---|---|
| `CMP-APP-SHELL` | AppShell · the workspace template | in-shell |
| `CMP-NAV-RAIL` | NavRail · 76px icon nav | in-shell |
| `CMP-TOP-BAR` | TopBar · 48px | in-shell |
| `CMP-MIDDLE-STRIP` | MiddleStrip · 44px slot-based | in-shell |
| `CMP-AGENT-COLUMN` | AgentColumn · 480px conversation pane | in-shell |
| `CMP-WORK-PANE` | WorkPane · right-side scrollable container | in-shell |
| `CMP-WORK-SECTION` | WorkSection · titled section within WorkPane | in-shell |
| `CMP-EVIDENCE-ROW` | EvidenceRow · pattern for evidence/check items | in-shell |
| `CMP-DELIVERABLE-CARD` | DeliverableCard · program deliverable summary | in-shell |
| `CMP-CONNECTOR-CARD` | ConnectorCard · connector health card | in-shell |
| `CMP-PRESSURE-MINI` | PressureMini · compact pressure summary | in-shell |
| `CMP-PHASE-DOT` | PhaseDot · phase indicator | in-shell |
| `CMP-STATUS-PILL` | StatusPill · semantic color pills | in-shell |
| `CMP-AGENT-GLYPH` | AgentGlyph · agent identity mark | in-shell |
| `CMP-LINKED-PROGRAM-CHIP` | LinkedProgramChip · cross-surface link | pending |

---

## Build priority summary

### P0 · required for shell wave (SHELL-1..6)

These are the surfaces the shell must support out of the gate. 23 entries.

`SHL-NAV-DEFAULT` · `SET-IDX-CONN` · `PRG-IDX-DEFAULT` · `PRG-FLW-ORIGINATE` · `PRG-DTL-P1` · `PRG-DTL-P2` · `PRG-DTL-P3` · `PRG-DTL-P4` · `PRG-STA-GATE-PENDING` · `PRG-MOD-GATE-APPROVE` · `SRC-IDX-EVENTS` · `SRC-DTL-EVENT` · `SRC-STA-LINKED-PROG` · `INT-IDX-DEFAULT` · `INT-DTL-VALIDATED` · `TWR-IDX-PORTFOLIO` · `TWR-DTL-PRESSURE-HIGH` · `TWR-IDX-PROG-SCOPE` · `TWR-LNS-VALUE` · `TWR-IDX-OUTCOME` · plus 14 P0 components.

### P1 · next wave · post-shell adapters

Filter variants, additional phase details (P5/P6), in-review pattern variants, medium/low pressure details, lens views, modal flows. ~30 entries.

### P2 · later · awaiting input or lower-leverage

Empty states, error states, advanced modals, deprecated patterns, expanded activity. ~15 entries.

---

## Repo cross-reference

Every catalog entry includes a `repo_slices` field in `pages.yaml` mapping to slice IDs in `docs/backlog/backlog-registry.json`. The catalog is the design layer; the registry is the build layer. Together they form the complete spec.

When briefing Code Desktop, paste the relevant catalog entries as the design contract, and reference the slice IDs as the build contract. Both vocabularies converge on the same surface.

---

## Open design questions tracked here

These are decisions that may change as we get further into shell wave 1:

1. **Architecture as sub-page vs surface** — currently sub-page of Setup (`SET-IDX-ARC`). Could be elevated to its own rail icon if enterprise positioning demands it.
2. **Outcome realization placement** — currently lives inside Tower (`TWR-IDX-OUTCOME` and `TWR-LNS-VALUE`). Could be elevated to a sixth rail icon if "did it deliver?" earns the visual weight.
3. **Solution Intelligence placement** — currently a sub-section of Intelligence (`INT-IDX-SOLUTIONS`). Could be its own surface if archetypes become a primary navigation path.
4. **Source 10-stage tracker placement** — middle strip vs. top of working pane vs. its own zone. Current spec puts it in middle strip; needs validation in shell adapter.
5. **Per-step entries for invite wizard** — currently one entry (`SET-FLW-USR-INVITE`) representing all four steps. Could be split into `-1` through `-4` if step-specific specs diverge meaningfully.

---

## Recommended catalog hygiene

When this catalog moves into the repo (likely `docs/platform-design/page-blueprints/PAGE_CATALOG.md`):

- Treat `pages.yaml` as the source of truth. The markdown is generated.
- Add a CI check that validates referenced `repo_slices` exist in `backlog-registry.json`.
- Add a CI check that referenced `mockup_file` paths resolve.
- Whenever a new page is built in code, the corresponding catalog entry's `mockup_status` flips and the slice IDs are added.
- Whenever a new design state is identified, a new catalog entry is added before any code is written.

---

*"One template, four jobs. The agent never moves; the work changes." — Workspace architecture · Apr 27 2026*
