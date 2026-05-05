# Workspace Shell Anatomy — elements present in all phase contexts

| | |
|---|---|
| **Work Package** | W-1.1 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-shell.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/15-workspace-v0.2.html` · `16-flow-cascade.html` Flow 1 |
| **Companion** | `SPEC_METHODOLOGY.md` §2.1, `STABLE_ID_CONVENTION.md` |
| **Author** | Claude Code |

---

## Overview

This document inventories every zone, panel, and element that is **present in ALL phase contexts** of the Workspace page (`/strategic-moves/[moveId]`). These are the shell elements that persist regardless of which phase the user is currently viewing (P0 through P5) or which view mode is active (current / past / future / handed-off).

Phase-specific canvas content is documented in the companion `01-anatomy-canvas-p{N}.md` files. View-mode anatomy changes are documented in `01-anatomy-viewmodes.md`.

All downstream spec layers (Layer 2 State, Layer 3 Interactions, Layer 4 Data Binding, Layer 5 Knowledge Surfacing) reference the stable IDs defined here. IDs follow the `{page}-{zone}-{component}[-{qualifier}]` convention in `STABLE_ID_CONVENTION.md`.

---

## S.1 Page wrapper

| Field | Value |
|---|---|
| **ID** | `ws-page` |
| **Element type** | Zone (root container) |
| **Parent** | — (document root) |
| **Visibility** | Always |

**Description:** The outermost container of the `/strategic-moves/[moveId]` route. Establishes the page layout grid: a vertical stack containing the app navigation bar, the identity card, the phase rail, the workspace grid (chat lane left | canvas right), and the sponsor strip above the canvas.

**Children:**
- `ws-nav`
- `ws-breadcrumb`
- `ws-identity`
- `ws-rail`
- `ws-grid`
- `ws-sponsor-strip`

---

## S.2 App navigation bar

| Field | Value |
|---|---|
| **ID** | `ws-nav` |
| **Element type** | Zone (shared shell) |
| **Parent** | `ws-page` |
| **Visibility** | Always |

**Description:** The global application navigation bar. Same shell element on all pages. Contains the AbarVa wordmark, primary nav links, tenant switcher, user avatar, and notification icon. Not specific to the Workspace page — changes tracked at the application shell level.

---

## S.3 Breadcrumb

| Field | Value |
|---|---|
| **ID** | `ws-breadcrumb` |
| **Element type** | Zone |
| **Parent** | `ws-page` |
| **Visibility** | Always |

**Description:** Breadcrumb trail displayed below the navigation bar showing the user's location in the application hierarchy. In the Workspace context always reads: "Strategic Moves > [Move Name]".

**Children:**

### S.3.1 Breadcrumb — Strategic Moves link

| Field | Value |
|---|---|
| **ID** | `ws-breadcrumb-portfolio-link` |
| **Element type** | Link |
| **Parent** | `ws-breadcrumb` |
| **Visibility** | Always |

**Description:** The first crumb. Text: "Strategic Moves". Navigates to the Strategic Moves portfolio view (`/strategic-moves`). Always a clickable link.

**Fields:**
- `label_text`: "Strategic Moves"
- `href`: `/strategic-moves`

### S.3.2 Breadcrumb — Move name

| Field | Value |
|---|---|
| **ID** | `ws-breadcrumb-move-name` |
| **Element type** | Label |
| **Parent** | `ws-breadcrumb` |
| **Visibility** | Always |

**Description:** The second crumb. Displays the name of the current Strategic Move. Not a link — the user is already on this page. Auto-populated from the move's title field. Falls back to "Untitled Move" if title is null.

**Fields:**
- `move_title`: String. Falls back to "Untitled Move" when null.

---

## S.4 Identity card

| Field | Value |
|---|---|
| **ID** | `ws-identity` |
| **Element type** | Panel |
| **Parent** | `ws-page` |
| **Visibility** | Always |

**Description:** Card below the breadcrumb showing the move's persistent identity metadata: program code + phase label (eyebrow), move title, status pill, phase label (text), and value-at-stake range if set. The identity card is read-only on the Workspace page — it is not editable here.

**Children:**

### S.4.1 Identity eyebrow

| Field | Value |
|---|---|
| **ID** | `ws-identity-eyebrow` |
| **Element type** | Label |
| **Parent** | `ws-identity` |
| **Visibility** | Always |

**Description:** Short eyebrow text above the move title. Format: `{PROGRAM_CODE} · {PHASE_LABEL}`. Example: `RETAIL-UNIFIED-2026 · P2 DIAGNOSE`. The program code is the move's short identifier; the phase label is the **short label** from the rail vocabulary (see §S.5 for short vs full name distinction).

**Fields:**
- `program_code`: String. The move's short identifier code (e.g., `RETAIL-UNIFIED-2026`).
- `phase_short_label`: String. Current active phase short name (Originate / Charter / Diagnose / Design / Roadmap / Mobilize). **Substrate gap: see gap-ws-001.**
- `separator`: " · " (middot with spaces)

### S.4.2 Identity title

| Field | Value |
|---|---|
| **ID** | `ws-identity-title` |
| **Element type** | Label |
| **Parent** | `ws-identity` |
| **Visibility** | Always |

**Description:** The full title of the Strategic Move. Read-only on the Workspace page. Falls back to "Untitled Move" if null.

**Fields:**
- `title_text`: String. Falls back to "Untitled Move" when null.

### S.4.3 Status pill

| Field | Value |
|---|---|
| **ID** | `ws-identity-status-pill` |
| **Element type** | Badge/pill |
| **Parent** | `ws-identity` |
| **Visibility** | Always |

**Description:** A colored pill label showing the move's current lifecycle status. Values: Active (green), Paused (amber), Handed Off (blue/neutral).

**Fields:**
- `status_value`: One of: `active` | `paused` | `handed_off`
- `status_label`: Human-readable label: "Active" / "Paused" / "Handed Off"
- `status_color_token`: Phase-appropriate color token

### S.4.4 Phase label (full name, text only)

| Field | Value |
|---|---|
| **ID** | `ws-identity-phase-label` |
| **Element type** | Label |
| **Parent** | `ws-identity` |
| **Visibility** | Always |

**Description:** Full phase name displayed in the identity card below the title. Uses the **full phase name** (not the short rail label). Example: "P2 Discover & Diagnose". This is text only — not interactive, not a navigation control.

**Fields:**
- `phase_full_name`: String. Full phase name from doctrine: "P0 Originate" / "P1 Charter" / "P2 Discover & Diagnose" / "P3 Design Future State" / "P4 Roadmap & Business Case" / "P5 Mobilize & Handoff".

**Note:** The **short rail label** (e.g., "Diagnose") and the **full phase name** (e.g., "P2 Discover & Diagnose") are different strings. Both must reference the same canonical constant. **Substrate gap: see gap-ws-001.**

### S.4.5 Value at stake

| Field | Value |
|---|---|
| **ID** | `ws-identity-value-at-stake` |
| **Element type** | Label |
| **Parent** | `ws-identity` |
| **Visibility** | Conditional — shown only when value range is set (not null) |

**Description:** The value range for this move if specified. Set during P1 Charter (charter value range lock). Format: "$X–$Y" or descriptive range. Hidden until the value range is populated.

**Fields:**
- `value_range_low`: Number or null
- `value_range_high`: Number or null
- `value_range_currency`: String (e.g., "USD")
- `display_text`: Formatted string: "$X–$Y" or "Up to $X"

---

## S.5 Phase rail

| Field | Value |
|---|---|
| **ID** | `ws-rail` |
| **Element type** | Zone |
| **Parent** | `ws-page` |
| **Visibility** | Always |

**Description:** A horizontal rail displayed below the identity card showing the 6-phase progression (P0 through P5) plus a "→ Tower" indicator after P5. The rail is the primary navigation control for switching between phase canvases without URL changes (per D-10 resolution).

**Short labels vs full names (important distinction):**
- Rail phase nodes use **short labels**: Originate, Charter, Diagnose, Design, Roadmap, Mobilize
- Identity card (`ws-identity-phase-label`) uses the **full phase name**: "P0 Originate", "P1 Charter", etc.
- This distinction must be honored in implementation.
- **Substrate gap gap-ws-001**: The constant `PHASE_SHORT_NAMES` does not currently exist in the codebase. See §S.10 substrate gap log.

**Children:**
- `ws-rail-phase-node-p0` through `ws-rail-phase-node-p5`
- `ws-rail-phase-node-p0-label` through `ws-rail-phase-node-p5-label`
- `ws-rail-tower-indicator`
- `ws-rail-connector-0` through `ws-rail-connector-5`

### S.5.1 Phase node — P0 Originate

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p0` |
| **Element type** | Interactive node (button) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Description:** The P0 rail dot. Displays the short label "Originate" (via `ws-rail-phase-node-p0-label`). Visual state: completed (past phases), active (current phase), or future (locked).

**Fields:**
- `phase_number`: 0
- `short_label`: "Originate" (**substrate gap gap-ws-001**)
- `visual_state`: One of: `completed` | `active` | `future`
- `is_interactive`: true (in Workspace; unlike Originate page where P0 is non-interactive)

### S.5.2 Phase node label — P0

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p0-label` |
| **Element type** | Label |
| **Parent** | `ws-rail-phase-node-p0` |
| **Visibility** | Always |

**Description:** Short label text for P0 rail node. Value: "Originate".

### S.5.3 Phase node — P1 Charter

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p1` |
| **Element type** | Interactive node (button) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Fields:**
- `phase_number`: 1
- `short_label`: "Charter" (**substrate gap gap-ws-001**)
- `visual_state`: One of: `completed` | `active` | `future`
- `is_interactive`: true when phase is completed or active; state machine governs

### S.5.4 Phase node label — P1

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p1-label` |
| **Element type** | Label |
| **Parent** | `ws-rail-phase-node-p1` |
| **Visibility** | Always |

**Description:** Short label text. Value: "Charter".

### S.5.5 Phase node — P2 Discover & Diagnose

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p2` |
| **Element type** | Interactive node (button) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Fields:**
- `phase_number`: 2
- `short_label`: "Diagnose" (**substrate gap gap-ws-001**)
- `visual_state`: One of: `completed` | `active` | `future`
- `is_interactive`: true when phase is completed or active

### S.5.6 Phase node label — P2

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p2-label` |
| **Element type** | Label |
| **Parent** | `ws-rail-phase-node-p2` |
| **Visibility** | Always |

**Description:** Short label text. Value: "Diagnose".

### S.5.7 Phase node — P3 Design Future State

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p3` |
| **Element type** | Interactive node (button) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Fields:**
- `phase_number`: 3
- `short_label`: "Design" (**substrate gap gap-ws-001**)
- `visual_state`: One of: `completed` | `active` | `future`
- `is_interactive`: true when phase is completed or active

### S.5.8 Phase node label — P3

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p3-label` |
| **Element type** | Label |
| **Parent** | `ws-rail-phase-node-p3` |
| **Visibility** | Always |

**Description:** Short label text. Value: "Design".

### S.5.9 Phase node — P4 Roadmap & Business Case

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p4` |
| **Element type** | Interactive node (button) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Fields:**
- `phase_number`: 4
- `short_label`: "Roadmap" (**substrate gap gap-ws-001**)
- `visual_state`: One of: `completed` | `active` | `future`
- `is_interactive`: true when phase is completed or active

### S.5.10 Phase node label — P4

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p4-label` |
| **Element type** | Label |
| **Parent** | `ws-rail-phase-node-p4` |
| **Visibility** | Always |

**Description:** Short label text. Value: "Roadmap".

### S.5.11 Phase node — P5 Mobilize & Handoff

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p5` |
| **Element type** | Interactive node (button) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Fields:**
- `phase_number`: 5
- `short_label`: "Mobilize" (**substrate gap gap-ws-001**)
- `visual_state`: One of: `completed` | `active` | `future`
- `is_interactive`: true when phase is completed or active

### S.5.12 Phase node label — P5

| Field | Value |
|---|---|
| **ID** | `ws-rail-phase-node-p5-label` |
| **Element type** | Label |
| **Parent** | `ws-rail-phase-node-p5` |
| **Visibility** | Always |

**Description:** Short label text. Value: "Mobilize".

### S.5.13 Tower indicator

| Field | Value |
|---|---|
| **ID** | `ws-rail-tower-indicator` |
| **Element type** | Label / indicator |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Description:** A text/icon indicator displayed after the P5 node. Text: "→ Tower". Represents the Control Tower surface downstream. This is **non-interactive** — no click handler, no hover affordance. It is a directional indicator pointing to a different surface, not a phase node.

**Fields:**
- `label_text`: "→ Tower"

### S.5.14 Rail connectors (×6)

| Field | Value |
|---|---|
| **ID** | `ws-rail-connector-{0..5}` |
| **Element type** | Visual element (line segment) |
| **Parent** | `ws-rail` |
| **Visibility** | Always |

**Description:** Six line segments connecting the phase nodes: connector-0 connects P0→P1, connector-1 connects P1→P2, ..., connector-5 connects P5→Tower indicator. Visual only — not interactive. Color/style reflects whether the connecting phase has been promoted through.

**Instances:** `ws-rail-connector-0`, `ws-rail-connector-1`, `ws-rail-connector-2`, `ws-rail-connector-3`, `ws-rail-connector-4`, `ws-rail-connector-5`

---

## S.6 Workspace grid

| Field | Value |
|---|---|
| **ID** | `ws-grid` |
| **Element type** | Zone (two-column layout) |
| **Parent** | `ws-page` |
| **Visibility** | Always |

**Description:** The main workspace area split into two columns: chat lane (left) and canvas (right). The canvas changes per phase and per view mode. The chat lane is persistent across phase switches but its content rescopes.

**Children:**
- `ws-chat`
- `ws-canvas` (phase-specific canvas, see `01-anatomy-canvas-p{N}.md`)

---

## S.7 Chat lane

| Field | Value |
|---|---|
| **ID** | `ws-chat` |
| **Element type** | Zone (left column) |
| **Parent** | `ws-grid` |
| **Visibility** | Always |

**Description:** The left column of the workspace grid. Contains the Nexus conversation, action chips, and the chat input area. The chat lane is persistent — it does not swap out when the user clicks rail nodes — but its content rescopes to the viewed phase. In `past` and `handed-off` view modes, the chat lane renders in read-only state.

**Children:**
- `ws-chat-header`
- `ws-chat-message-list`
- `ws-chat-chip-list`
- `ws-chat-input-area`

### S.7.1 Chat header

| Field | Value |
|---|---|
| **ID** | `ws-chat-header` |
| **Element type** | Panel header |
| **Parent** | `ws-chat` |
| **Visibility** | Always |

**Description:** The top bar of the chat lane. Displays "Nexus" as the agent label and the current phase context (e.g., "P2 Diagnose"). In `past` or `future` view modes, also shows a view-mode indicator (e.g., "Viewing P1 — read only").

**Fields:**
- `agent_label`: "Nexus"
- `phase_context_label`: Short phase name of the currently viewed phase

### S.7.2 Message list

| Field | Value |
|---|---|
| **ID** | `ws-chat-message-list` |
| **Element type** | List / scroll container |
| **Parent** | `ws-chat` |
| **Visibility** | Always |

**Description:** Scrollable list of messages between the user and Nexus. Messages appear in chronological order, oldest at top, newest at bottom. Auto-scrolls to latest message on new content.

**Children:**
- `ws-chat-nexus-message` (repeating template)
- `ws-chat-user-message` (repeating template)

### S.7.3 Nexus message bubble

| Field | Value |
|---|---|
| **ID** | `ws-chat-nexus-message` |
| **Element type** | List item (template) |
| **Parent** | `ws-chat-message-list` |
| **Visibility** | When Nexus has sent at least one message |

**Description:** A single message bubble from Nexus. Template element — the list manages instances. Contains message text (markdown-rendered), timestamp, and optionally evidence citations.

**Fields:**
- `role`: "nexus"
- `content_text`: String (markdown)
- `timestamp`: ISO datetime
- `evidence_citations`: Array (optional)

### S.7.4 User message bubble

| Field | Value |
|---|---|
| **ID** | `ws-chat-user-message` |
| **Element type** | List item (template) |
| **Parent** | `ws-chat-message-list` |
| **Visibility** | When user has sent at least one message |

**Description:** A single message bubble from the user. Template element.

**Fields:**
- `role`: "user"
- `content_text`: String
- `timestamp`: ISO datetime

### S.7.5 Action chip list

| Field | Value |
|---|---|
| **ID** | `ws-chat-chip-list` |
| **Element type** | List (horizontal row) |
| **Parent** | `ws-chat` |
| **Visibility** | Conditional — visible after first Nexus message; hidden in `past` and `handed-off` view modes |

**Description:** A row of suggested action chips displayed below the first Nexus message. Chips are phase-specific and state-dependent (Layer 5 Knowledge Surfacing defines exact chips per phase). Tapping a chip fills the input field or sends a pre-formed message.

**Children:**
- `ws-chat-chip-{n}` (n = 1..N, where N varies by phase)

### S.7.6 Action chip (individual)

| Field | Value |
|---|---|
| **ID** | `ws-chat-chip-{n}` |
| **Element type** | Button (chip style) |
| **Parent** | `ws-chat-chip-list` |
| **Visibility** | When `ws-chat-chip-list` is visible |

**Description:** An individual suggested action chip. Label and action are phase-specific. The numeric qualifier `{n}` indexes from 1. Exact chip set per phase is documented in Layer 5 specs.

**Fields:**
- `chip_label`: String
- `chip_action`: Either a pre-formed message to send, or a fill action for the input field

### S.7.7 Chat input area

| Field | Value |
|---|---|
| **ID** | `ws-chat-input-area` |
| **Element type** | Zone (sticky bottom bar within chat lane) |
| **Parent** | `ws-chat` |
| **Visibility** | Always |

**Description:** The input area at the bottom of the chat lane. Sticky — stays visible as the message list scrolls above it. Disabled (read-only appearance, non-interactive) in `past` and `handed-off` view modes.

**Children:**
- `ws-chat-input-field`
- `ws-chat-attach-button`
- `ws-chat-send-button`

### S.7.8 Chat input field

| Field | Value |
|---|---|
| **ID** | `ws-chat-input-field` |
| **Element type** | Field (auto-grow textarea) |
| **Parent** | `ws-chat-input-area` |
| **Visibility** | Always |

**Description:** Multi-line text input for composing messages to Nexus. Auto-grows vertically. Spellcheck enabled. Enter key submits (Shift+Enter for newline). Placeholder: "Message Nexus..." (may be phase-specific per Layer 5). Disabled in `past` and `handed-off` view modes.

**Fields:**
- `placeholder_text`: "Message Nexus..." (phase-context variants defined in Layer 5)
- `value`: Current draft text
- `spellcheck`: true
- `is_disabled`: false in `current` and `future` view modes; true in `past` and `handed-off`

### S.7.9 Attach button

| Field | Value |
|---|---|
| **ID** | `ws-chat-attach-button` |
| **Element type** | Button |
| **Parent** | `ws-chat-input-area` |
| **Visibility** | Always |

**Description:** Opens the file attachment flow. Allows uploading documents (PDF, DOCX, XLSX) as context for the Nexus conversation. Visual: paperclip icon. Disabled in `past` and `handed-off` view modes.

### S.7.10 Send button

| Field | Value |
|---|---|
| **ID** | `ws-chat-send-button` |
| **Element type** | Button |
| **Parent** | `ws-chat-input-area` |
| **Visibility** | Always |

**Description:** Submits the composed message to Nexus. Enabled only when `ws-chat-input-field` has non-empty, non-whitespace content. Also activated by Enter key when input has focus. Disabled in `past` and `handed-off` view modes.

---

## S.8 Sponsor strip

| Field | Value |
|---|---|
| **ID** | `ws-sponsor-strip` |
| **Element type** | Zone (horizontal strip above canvas) |
| **Parent** | `ws-page` |
| **Visibility** | Conditional — present when a sponsor is assigned to the move |

**Description:** A horizontal strip positioned above the canvas (below the rail, above the main content area). Displays sponsor identity and signoff status. Provides a context-appropriate action button (e.g., "Request Review" when awaiting sponsor signoff; "View Signoff" when signed). Hidden when no sponsor is assigned to the move.

**Children:**
- `ws-sponsor-strip-name`
- `ws-sponsor-strip-role`
- `ws-sponsor-strip-status`
- `ws-sponsor-strip-action-btn`

### S.8.1 Sponsor name

| Field | Value |
|---|---|
| **ID** | `ws-sponsor-strip-name` |
| **Element type** | Label |
| **Parent** | `ws-sponsor-strip` |
| **Visibility** | When `ws-sponsor-strip` is visible |

**Description:** The sponsor's full name. Falls back to "Sponsor not named" if the sponsor ID resolves but the name is missing.

**Fields:**
- `sponsor_name`: String

### S.8.2 Sponsor role

| Field | Value |
|---|---|
| **ID** | `ws-sponsor-strip-role` |
| **Element type** | Label |
| **Parent** | `ws-sponsor-strip` |
| **Visibility** | When `ws-sponsor-strip` is visible |

**Description:** The sponsor's role or title (e.g., "VP Operations"). Falls back to empty string if role is not set.

**Fields:**
- `sponsor_role`: String (may be empty)

### S.8.3 Sponsor signoff status

| Field | Value |
|---|---|
| **ID** | `ws-sponsor-strip-status` |
| **Element type** | Badge/pill |
| **Parent** | `ws-sponsor-strip` |
| **Visibility** | When `ws-sponsor-strip` is visible |

**Description:** Shows the sponsor's current signoff status for the active phase gate. Values: "Pending Review", "Signed Off", "Requested".

**Fields:**
- `signoff_status`: One of: `not_requested` | `requested` | `signed_off`
- `status_label`: "Pending Review" / "Requested" / "Signed Off"

### S.8.4 Sponsor action button

| Field | Value |
|---|---|
| **ID** | `ws-sponsor-strip-action-btn` |
| **Element type** | Button |
| **Parent** | `ws-sponsor-strip` |
| **Visibility** | When `ws-sponsor-strip` is visible and `viewMode = current` |

**Description:** Context-sensitive action button in the sponsor strip. Label and behavior vary by signoff state:
- When `signoff_status = not_requested` or `requested`: Label = "Request Review" — sends a signoff request to the sponsor.
- When `signoff_status = signed_off`: Label = "View Signoff" — opens the signoff record in a panel or modal.

Hidden in `past`, `future`, and `handed-off` view modes (no signoff actions applicable).

**Fields:**
- `action_label`: "Request Review" | "View Signoff"
- `signoff_status_ref`: References `ws-sponsor-strip-status`

---

## S.9 Substrate gap log

Substrate gaps discovered during Layer 1 shell anatomy work.

| Gap ID | Element | Missing substrate | Impact | Backlog item |
|---|---|---|---|---|
| `gap-ws-001` | `ws-rail-phase-node-p{0..5}-label`, `ws-identity-eyebrow`, `ws-identity-phase-label` | The constant `PHASE_SHORT_NAMES` (mapping phase number 0–5 → short display label: "Originate", "Charter", "Diagnose", "Design", "Roadmap", "Mobilize") does not currently exist in the codebase. The rail nodes require short labels; the identity card requires both short (eyebrow) and full names (phase label). Without a canonical constant, implementations will hardcode strings inline and diverge from the `PHASE_MODEL_V2_DOCTRINE.md` definitions. | Medium — multiple components will independently define the same strings with risk of divergence | B-101: Add `PHASE_SHORT_NAMES` and `PHASE_FULL_NAMES` constants to `src/lib/strategic-moves/phase-labels.ts` (or equivalent); export both keyed by phase number 0–5; reference from `PhaseRail` component and identity card. This gap was also logged for the Originate page as `gap-orig-001`. |

---

## S.10 Element ID quick-reference table

| Stable ID | Type | Zone | Description |
|---|---|---|---|
| `ws-page` | Zone | root | Page root container |
| `ws-nav` | Zone | shell | App navigation bar (shared) |
| `ws-breadcrumb` | Zone | breadcrumb | Breadcrumb trail |
| `ws-breadcrumb-portfolio-link` | Link | breadcrumb | "Strategic Moves" portfolio link |
| `ws-breadcrumb-move-name` | Label | breadcrumb | Current move name (last crumb) |
| `ws-identity` | Panel | identity | Identity card |
| `ws-identity-eyebrow` | Label | identity | Program code + phase short label eyebrow |
| `ws-identity-title` | Label | identity | Move title (read-only on workspace) |
| `ws-identity-status-pill` | Badge | identity | Active / Paused / Handed Off status |
| `ws-identity-phase-label` | Label | identity | Full phase name (text only, not interactive) |
| `ws-identity-value-at-stake` | Label | identity | Value range if set (conditional) |
| `ws-rail` | Zone | rail | Phase rail (P0–P5 + Tower) |
| `ws-rail-phase-node-p0` | Node | rail | P0 Originate phase node |
| `ws-rail-phase-node-p1` | Node | rail | P1 Charter phase node |
| `ws-rail-phase-node-p2` | Node | rail | P2 Diagnose phase node |
| `ws-rail-phase-node-p3` | Node | rail | P3 Design phase node |
| `ws-rail-phase-node-p4` | Node | rail | P4 Roadmap phase node |
| `ws-rail-phase-node-p5` | Node | rail | P5 Mobilize phase node |
| `ws-rail-phase-node-p0-label` | Label | rail | P0 short label: "Originate" |
| `ws-rail-phase-node-p1-label` | Label | rail | P1 short label: "Charter" |
| `ws-rail-phase-node-p2-label` | Label | rail | P2 short label: "Diagnose" |
| `ws-rail-phase-node-p3-label` | Label | rail | P3 short label: "Design" |
| `ws-rail-phase-node-p4-label` | Label | rail | P4 short label: "Roadmap" |
| `ws-rail-phase-node-p5-label` | Label | rail | P5 short label: "Mobilize" |
| `ws-rail-tower-indicator` | Label | rail | "→ Tower" indicator (non-interactive) |
| `ws-rail-connector-0` | Visual | rail | Connector segment P0→P1 |
| `ws-rail-connector-1` | Visual | rail | Connector segment P1→P2 |
| `ws-rail-connector-2` | Visual | rail | Connector segment P2→P3 |
| `ws-rail-connector-3` | Visual | rail | Connector segment P3→P4 |
| `ws-rail-connector-4` | Visual | rail | Connector segment P4→P5 |
| `ws-rail-connector-5` | Visual | rail | Connector segment P5→Tower |
| `ws-grid` | Zone | canvas/chat | Two-column workspace grid |
| `ws-chat` | Zone | chat | Chat lane (left column) |
| `ws-chat-header` | Panel | chat | "Nexus" label + phase context header |
| `ws-chat-message-list` | List | chat | Scrollable message area |
| `ws-chat-nexus-message` | List item | chat | Nexus message bubble (template) |
| `ws-chat-user-message` | List item | chat | User message bubble (template) |
| `ws-chat-chip-list` | List | chat | Action chips container (conditional) |
| `ws-chat-chip-{n}` | Button | chat | Individual action chip (n=1..N, phase-specific) |
| `ws-chat-input-area` | Zone | chat | Sticky chat input bar |
| `ws-chat-input-field` | Field | chat | Auto-grow textarea (Enter submits, Shift+Enter newline) |
| `ws-chat-attach-button` | Button | chat | File attachment button (paperclip) |
| `ws-chat-send-button` | Button | chat | Send message button |
| `ws-sponsor-strip` | Zone | sponsor-strip | Sponsor acknowledgment strip (conditional) |
| `ws-sponsor-strip-name` | Label | sponsor-strip | Sponsor name |
| `ws-sponsor-strip-role` | Label | sponsor-strip | Sponsor role/title |
| `ws-sponsor-strip-status` | Badge | sponsor-strip | Sponsor signoff status pill |
| `ws-sponsor-strip-action-btn` | Button | sponsor-strip | "Request Review" / "View Signoff" (current view mode only) |

---

## S.11 Self-QA

| Check | Status |
|---|---|
| Every clickable from cascade has an ID | PASS — rail nodes, chip buttons, send button, attach button, sponsor action, breadcrumb link all have IDs |
| Every visible field has an ID | PASS — all identity card fields, breadcrumb labels, chat message templates, sponsor strip fields |
| Every container has an ID | PASS — ws-page, ws-nav, ws-breadcrumb, ws-identity, ws-rail, ws-grid, ws-chat, ws-chat-input-area, ws-sponsor-strip |
| PHASE_SHORT_NAMES substrate gap logged | PASS — gap-ws-001 in §S.9, aligned with Originate gap-orig-001 |
| Short label vs full phase name distinction stated | PASS — §S.5 and §S.4.4 |
| Tower indicator documented as non-interactive | PASS — §S.5.13 |
| Rail connectors documented | PASS — §S.5.14, IDs ws-rail-connector-{0..5} |
| IDs follow {page}-{zone}-{component}[-{qualifier}] convention | PASS — all IDs use ws- prefix, correct zone vocabulary |
| No state encoding in IDs | PASS |
| No "TBD" in any field | PASS |
