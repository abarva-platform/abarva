# Originate Page · Layer 1 Anatomy

| | |
|---|---|
| **Work Package** | O-1.1 |
| **Doc path** | `docs/design/strategic-moves/specs/originate/01-anatomy.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending O-1.3 sign-off |
| **Reference** | `docs/design/strategic-moves/16-flow-cascade.html` Flow 2, Frame 2 (locked v0.1) |
| **Companion** | `SPEC_METHODOLOGY.md` §2.1, `STABLE_ID_CONVENTION.md` |
| **Author** | Claude Code |

---

## Overview

This document is the complete hierarchical inventory of every zone, panel, and element on the Originate page (`/strategic-moves/new`). Every element that is visible, clickable, or otherwise meaningful has a **stable ID** following the `{page}-{zone}-{component}[-{qualifier}]` convention established in `SPEC_METHODOLOGY.md §3`.

All downstream spec layers (Layer 2 State, Layer 3 Interactions, Layer 4 Data Binding, Layer 5 Knowledge Surfacing) reference the IDs defined here. No element may be referenced in a downstream layer without first appearing in this document.

### Critical layout facts (counterintuitive — read carefully)

1. **The scaffold step list lives in the chat lane (left side), NOT the canvas.** This is the most counterintuitive layout decision on this page. When reading the anatomy below, `orig-chat-scaffold` and all `orig-chat-scaffold-step-{1..7}` are children of `orig-chat`, not `orig-canvas`.
2. **The brief section panels live in the canvas lane (right side), NOT the chat lane.** All `orig-canvas-brief-section-{1..7}` are children of `orig-canvas`.
3. **Scaffold step to brief section correspondence:** Each scaffold step in the chat lane corresponds to exactly one brief section in the canvas. When the user completes a scaffold step (Nexus extracts content from conversation), the corresponding brief section in the canvas updates to reflect that content. This is the core interaction model of the Originate page.

---

## A.1 Page wrapper

| Field | Value |
|---|---|
| **ID** | `orig-page` |
| **Element type** | Zone (root container) |
| **Parent** | — (document root) |
| **Visibility** | Always |

**Description:** The outermost container of the `/strategic-moves/new` route. Establishes the page layout grid: a vertical stack containing the app navigation bar, the identity card, the phase rail, the workspace grid, and the promote bar.

**Children:**
- `orig-nav`
- `orig-identity`
- `orig-rail`
- `orig-grid`
- `orig-promote-bar`

---

## A.2 App navigation bar

| Field | Value |
|---|---|
| **ID** | `orig-nav` |
| **Element type** | Zone (shared shell) |
| **Parent** | `orig-page` |
| **Visibility** | Always |

**Description:** The global application navigation bar. This is the same shell element present on all pages in the application. It contains the AbarVa wordmark, primary nav links, tenant switcher, user avatar, and notification icon. It is not specific to the Originate page — changes to it are tracked in workspace shell anatomy (W-1.1), not here.

**Note:** This element is cross-page. Its anatomy is documented in `specs/workspace/01-anatomy-shell.md` (W-1.1). The ID `orig-nav` is used in Originate-specific state and interaction tables only to reference it as a dependency; its internal elements are not re-inventoried here.

---

## A.3 Identity card

| Field | Value |
|---|---|
| **ID** | `orig-identity` |
| **Element type** | Panel |
| **Parent** | `orig-page` |
| **Visibility** | Always |

**Description:** A card displayed below the navigation bar showing the move's draft identity. Auto-populates during the origination conversation. Contains the draft status eyebrow, an auto-derived title, and a status pill.

**Children:**

### A.3.1 Identity card eyebrow

| Field | Value |
|---|---|
| **ID** | `orig-identity-eyebrow` |
| **Element type** | Label |
| **Parent** | `orig-identity` |
| **Visibility** | Always |

**Description:** Short text label above the title. Displays `DRAFT-{date}` format, e.g. `DRAFT-2026-05-05`. The date is the date the origination session began. Auto-set on page load; not editable by the user at this stage.

**Fields:**
- `draft_label`: Static text "DRAFT"
- `draft_date`: ISO 8601 date string (`YYYY-MM-DD`) of session start

### A.3.2 Identity card title

| Field | Value |
|---|---|
| **ID** | `orig-identity-title` |
| **Element type** | Field (auto-derived text) |
| **Parent** | `orig-identity` |
| **Visibility** | Always |
| **Editable** | Not editable on this page; read-only |

**Description:** The working title of the Strategic Move being originated. Auto-derived by Nexus from the conversation content as scaffold step 1 progresses. Initially displays a placeholder ("Untitled Move" or similar). Updates in real time as Nexus extracts the hypothesis.

**Fields:**
- `title_text`: String. Auto-derived from scaffold step 1 content. Falls back to placeholder if not yet derived.

### A.3.3 Identity card status pill

| Field | Value |
|---|---|
| **ID** | `orig-identity-status-pill` |
| **Element type** | Badge/pill |
| **Parent** | `orig-identity` |
| **Visibility** | Always |

**Description:** A colored pill label showing the current status of the move in the origination workflow. In the Originate context, this will always show "P0 Originate" as the phase label (using the **full phase name**, not the short rail label). See §A.4 note on short vs. full phase naming.

**Fields:**
- `phase_label`: String. Full phase name. Value: "P0 Originate"
- `phase_color`: Visual indicator matching P0 phase color token

---

## A.4 Phase rail

| Field | Value |
|---|---|
| **ID** | `orig-rail` |
| **Element type** | Zone |
| **Parent** | `orig-page` |
| **Visibility** | Always |

**Description:** A horizontal rail displayed below the identity card showing the 6-phase progression (P0 through P5) plus a "→ Tower" indicator after P5. In the Originate context:
- The P0 node is **active** (glowing/highlighted) — always, in Originate
- The P1–P5 nodes are **non-interactive**: no click handler, no hover affordance, disabled semantics
- The "→ Tower" indicator is present but non-interactive (different surface entirely)

**Short labels vs. full names (important distinction):**
- The phase rail uses **short labels**: Originate, Charter, Diagnose, Design, Roadmap, Mobilize
- The identity card (`orig-identity-status-pill`) uses the **full phase name**: "P0 Originate"
- This distinction must be honored in implementation. See substrate gap `gap-orig-001` below.

**Children:**
- `orig-rail-phase-node-p0`
- `orig-rail-phase-node-p1`
- `orig-rail-phase-node-p2`
- `orig-rail-phase-node-p3`
- `orig-rail-phase-node-p4`
- `orig-rail-phase-node-p5`
- `orig-rail-tower-indicator`

### A.4.1 Phase node P0 (active)

| Field | Value |
|---|---|
| **ID** | `orig-rail-phase-node-p0` |
| **Element type** | Interactive node (button) |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Active / glowing — always in Originate context |

**Description:** The P0 phase dot on the rail. Displays the short label "Originate". This is the active node — visually highlighted with a glow or accent to indicate current phase. In the Originate context this node is always active and is non-interactive (no meaningful click action since the user is already on P0).

**Fields:**
- `short_label`: "Originate"
- `phase_number`: 0
- `is_active`: true
- `is_interactive`: false (already on this phase)

### A.4.2 Phase node P1

| Field | Value |
|---|---|
| **ID** | `orig-rail-phase-node-p1` |
| **Element type** | Non-interactive node |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Disabled / future — non-interactive |

**Description:** P1 Charter phase dot. Displays short label "Charter". Non-interactive in Originate context: no click handler, no hover affordance, `aria-disabled="true"` or equivalent disabled semantics.

**Fields:**
- `short_label`: "Charter"
- `phase_number`: 1
- `is_active`: false
- `is_interactive`: false

### A.4.3 Phase node P2

| Field | Value |
|---|---|
| **ID** | `orig-rail-phase-node-p2` |
| **Element type** | Non-interactive node |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Disabled / future — non-interactive |

**Description:** P2 Diagnose phase dot. Short label "Diagnose". Non-interactive in Originate context.

**Fields:**
- `short_label`: "Diagnose"
- `phase_number`: 2
- `is_active`: false
- `is_interactive`: false

### A.4.4 Phase node P3

| Field | Value |
|---|---|
| **ID** | `orig-rail-phase-node-p3` |
| **Element type** | Non-interactive node |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Disabled / future — non-interactive |

**Description:** P3 Design phase dot. Short label "Design". Non-interactive in Originate context.

**Fields:**
- `short_label`: "Design"
- `phase_number`: 3
- `is_active`: false
- `is_interactive`: false

### A.4.5 Phase node P4

| Field | Value |
|---|---|
| **ID** | `orig-rail-phase-node-p4` |
| **Element type** | Non-interactive node |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Disabled / future — non-interactive |

**Description:** P4 Roadmap phase dot. Short label "Roadmap". Non-interactive in Originate context.

**Fields:**
- `short_label`: "Roadmap"
- `phase_number`: 4
- `is_active`: false
- `is_interactive`: false

### A.4.6 Phase node P5

| Field | Value |
|---|---|
| **ID** | `orig-rail-phase-node-p5` |
| **Element type** | Non-interactive node |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Disabled / future — non-interactive |

**Description:** P5 Mobilize phase dot. Short label "Mobilize". Non-interactive in Originate context.

**Fields:**
- `short_label`: "Mobilize"
- `phase_number`: 5
- `is_active`: false
- `is_interactive`: false

### A.4.7 Tower indicator

| Field | Value |
|---|---|
| **ID** | `orig-rail-tower-indicator` |
| **Element type** | Label / indicator |
| **Parent** | `orig-rail` |
| **Visibility** | Always |
| **State** | Non-interactive |

**Description:** A text/icon indicator displayed after the P5 node showing "→ Tower". Represents the Control Tower surface that receives the Move after P5 Mobilize & Handoff. Not clickable, not a phase node — it is a directional indicator to a different surface. Has no hover affordance.

**Fields:**
- `label_text`: "→ Tower"

---

## A.5 Workspace grid

| Field | Value |
|---|---|
| **ID** | `orig-grid` |
| **Element type** | Zone (two-column layout) |
| **Parent** | `orig-page` |
| **Visibility** | Always |
| **Layout** | Two-column: chat lane (left) | canvas lane (right) |

**Description:** The main workspace area of the Originate page. Split into two equal or proportionally-weighted columns:
- **Left column (chat lane):** Contains the Nexus conversation, the scaffold step list, and the chat input. The scaffold step list lives here, not in the canvas.
- **Right column (canvas lane):** Contains the 7 brief section panels. The brief sections live here, not in the chat.

This two-column separation is the defining layout of the Originate page. **The scaffold step list being in the chat lane (left) is the counterintuitive fact that must be preserved in implementation.** It is not an error — it reflects the design intent that the scaffold is part of the conversation experience, not an independent workspace.

**Children:**
- `orig-chat`
- `orig-canvas`

---

## A.6 Chat lane

| Field | Value |
|---|---|
| **ID** | `orig-chat` |
| **Element type** | Zone (left column) |
| **Parent** | `orig-grid` |
| **Visibility** | Always |

**Description:** The left column of the workspace grid. Contains everything in the conversational experience: Nexus messages, the scaffold step list (which lives here, not in the canvas), and the chat input area at the bottom. The chat lane scrolls independently from the canvas lane.

**Children:**
- `orig-chat-message-list`
- `orig-chat-scaffold` (SCAFFOLD STEP LIST — lives here in chat lane, not in canvas)
- `orig-chat-input-area`

### A.6.1 Message list

| Field | Value |
|---|---|
| **ID** | `orig-chat-message-list` |
| **Element type** | List / scroll container |
| **Parent** | `orig-chat` |
| **Visibility** | Always |

**Description:** A scrollable list of messages exchanged between the user and Nexus during the origination conversation. Messages appear in chronological order, oldest at top, newest at bottom. The list auto-scrolls to the latest message when new content arrives.

**Fields:**
- `messages`: Array of message items, each with `role` (nexus | user), `content` (text), `timestamp`

---

## A.7 Scaffold step list (IN CHAT LANE — not canvas)

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold` |
| **Element type** | List |
| **Parent** | `orig-chat` |
| **Visibility** | Always |

**CRITICAL NOTE: This element and all its children live in the chat lane (`orig-chat`), not in the canvas lane (`orig-canvas`). The scaffold step list is part of the conversational experience. Each step becomes the active conversation topic when the user reaches it. Placing this in the chat lane (not the canvas) is the deliberate design intent of the Originate page.**

**Description:** A vertical list of 7 scaffold steps displayed in the chat lane. Each step corresponds to one section of the brief that appears in the canvas lane. The list shows progress: steps that are empty, in-progress, or complete each have a distinct visual state. As the user works through the conversation with Nexus, steps are marked complete as Nexus extracts sufficient content.

**Children:**
- `orig-chat-scaffold-step-1`
- `orig-chat-scaffold-step-2`
- `orig-chat-scaffold-step-3`
- `orig-chat-scaffold-step-4`
- `orig-chat-scaffold-step-5`
- `orig-chat-scaffold-step-6`
- `orig-chat-scaffold-step-7`

### A.7.1 Scaffold step 1: What's the bet / hypothesis

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-1` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** First scaffold step. Topic: "What's the bet / hypothesis" — the core business hypothesis the Move is pursuing. Drives scaffold step 1 of the conversation. When Nexus has extracted enough content from the conversation to populate this section, it marks this step complete and updates `orig-canvas-brief-section-1`.

**Fields:**
- `step_number`: 1
- `step_name`: "What's the bet / hypothesis"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: Extracted summary text (null when empty, partial text when in-progress, full text when complete)

### A.7.2 Scaffold step 2: Archetype classification

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-2` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** Second scaffold step. Topic: "Archetype classification" — classifying the Move into one of the known AI program archetypes (platform modernization, AI product enablement, workflow automation, etc.). Drives step 2 of the conversation. When complete, updates `orig-canvas-brief-section-2`.

**Fields:**
- `step_number`: 2
- `step_name`: "Archetype classification"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: Extracted archetype classification and rationale (null when empty)

### A.7.3 Scaffold step 3: Sponsor candidate

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-3` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** Third scaffold step. Topic: "Sponsor candidate" — identifying who should sponsor this Move (executive or senior stakeholder who will commit to it). Drives step 3 of the conversation. When complete, updates `orig-canvas-brief-section-3`.

**Fields:**
- `step_number`: 3
- `step_name`: "Sponsor candidate"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: Extracted sponsor candidate name(s) and context (null when empty)

### A.7.4 Scaffold step 4: Scope / boundary

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-4` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** Fourth scaffold step. Topic: "Scope / boundary" — what is in scope and what is explicitly out of scope for this Move. Drives step 4 of the conversation. When complete, updates `orig-canvas-brief-section-4`.

**Fields:**
- `step_number`: 4
- `step_name`: "Scope / boundary"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: Extracted scope definition and boundary statements (null when empty)

### A.7.5 Scaffold step 5: Evidence family selection

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-5` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** Fifth scaffold step. Topic: "Evidence family selection" — identifying the family of evidence that will be used to evaluate this Move (cost evidence, quality evidence, throughput evidence, etc.). Drives step 5 of the conversation. When complete, updates `orig-canvas-brief-section-5`.

**Fields:**
- `step_number`: 5
- `step_name`: "Evidence family selection"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: Extracted evidence family selections and rationale (null when empty)

### A.7.6 Scaffold step 6: Value hypothesis seed

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-6` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** Sixth scaffold step. Topic: "Value hypothesis seed" — an early-stage hypothesis about what value this Move will deliver, to be refined in later phases. Drives step 6 of the conversation. When complete, updates `orig-canvas-brief-section-6`.

**Fields:**
- `step_number`: 6
- `step_name`: "Value hypothesis seed"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: Extracted value hypothesis text (null when empty)

### A.7.7 Scaffold step 7: Foundation readiness

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-7` |
| **Element type** | List item |
| **Parent** | `orig-chat-scaffold` |
| **Visibility** | Always |

**Description:** Seventh and final scaffold step. Topic: "Foundation readiness (F1–F4 checks)" — four foundational readiness checks that must be addressed before the Move can be promoted from P0 to P1 Charter. F1–F4 checks cover data readiness, stakeholder availability, executive alignment, and scope clarity. Drives step 7 of the conversation. When complete (all four checks addressed), updates `orig-canvas-brief-section-7`.

**Fields:**
- `step_number`: 7
- `step_name`: "Foundation readiness"
- `status_icon`: One of: `empty` | `in-progress` | `complete`
- `step_content`: F1–F4 check results (null when empty)
- `f1_status`: One of: `not-checked` | `pass` | `fail` | `partial`
- `f2_status`: One of: `not-checked` | `pass` | `fail` | `partial`
- `f3_status`: One of: `not-checked` | `pass` | `fail` | `partial`
- `f4_status`: One of: `not-checked` | `pass` | `fail` | `partial`

---

## A.8 Scaffold step status icons (cross-cutting pattern)

| Field | Value |
|---|---|
| **ID** | `orig-chat-scaffold-step-{1..7}-status-icon` |
| **Element type** | Icon (per step) |
| **Parent** | Each `orig-chat-scaffold-step-{N}` |
| **Visibility** | Always |

**Description:** Each scaffold step item has a status icon showing its completion state. Three states:
- `empty`: Step not yet started. No content extracted. Visual: empty circle or dash.
- `in-progress`: Conversation is active on this step; Nexus is extracting content. Visual: spinning indicator or partial fill.
- `complete`: Nexus has extracted sufficient content for this step. Visual: checkmark or filled circle.

This element is documented as a cross-cutting element pattern shared by all 7 scaffold step items. It does not get individual IDs beyond the parent step — the status icon is an attribute of the step, not a standalone element.

---

## A.9 Chat input area

| Field | Value |
|---|---|
| **ID** | `orig-chat-input-area` |
| **Element type** | Zone (sticky bottom bar within chat lane) |
| **Parent** | `orig-chat` |
| **Visibility** | Always |

**Description:** The input area at the bottom of the chat lane. Sticky — stays visible as the message list and scaffold list scroll above it. Allows the user to type messages to Nexus. This is the primary interaction point for driving the scaffold conversation forward.

**Children:**
- `orig-chat-input-field`
- `orig-chat-input-submit`
- `orig-chat-input-attachment`
- `orig-chat-input-char-count`

### A.9.1 Chat input text field

| Field | Value |
|---|---|
| **ID** | `orig-chat-input-field` |
| **Element type** | Field (auto-grow textarea) |
| **Parent** | `orig-chat-input-area` |
| **Visibility** | Always |

**Description:** A multi-line text input field for composing messages to Nexus. Auto-grows vertically as the user types. Spellcheck enabled. Enter key submits (Shift+Enter for newline). Placeholder text changes depending on the active scaffold step.

**Fields:**
- `placeholder_text`: Context-dependent. Defaults to "Message Nexus..." or step-specific prompt.
- `value`: Current draft text
- `spellcheck`: true
- `max_rows`: Configurable (at least 5 rows before scroll)

### A.9.2 Submit button

| Field | Value |
|---|---|
| **ID** | `orig-chat-input-submit` |
| **Element type** | Button |
| **Parent** | `orig-chat-input-area` |
| **Visibility** | Always |
| **Enabled** | When `orig-chat-input-field` has non-empty, non-whitespace content |

**Description:** Submits the composed message to Nexus. Also activated by Enter key when input field has focus (Shift+Enter inserts newline instead). Visual: send icon (arrow or paper plane).

### A.9.3 Attachment button

| Field | Value |
|---|---|
| **ID** | `orig-chat-input-attachment` |
| **Element type** | Button |
| **Parent** | `orig-chat-input-area` |
| **Visibility** | Always |

**Description:** Opens the file attachment flow for uploading documents (PDF, DOCX, XLSX) relevant to the origination conversation. Triggers a file picker. Attached files are processed by Nexus as context for the scaffold conversation. Visual: paperclip icon.

### A.9.4 Character count

| Field | Value |
|---|---|
| **ID** | `orig-chat-input-char-count` |
| **Element type** | Label |
| **Parent** | `orig-chat-input-area` |
| **Visibility** | Conditional — visible when input field has content |

**Description:** Displays the current character count of the message being composed, relative to the maximum allowed length. Format: `{current}/{max}`. Visual feedback changes (e.g., color shift) as the user approaches the limit.

**Fields:**
- `current_count`: Integer
- `max_count`: Integer (implementation-defined limit)

---

## A.10 Canvas lane

| Field | Value |
|---|---|
| **ID** | `orig-canvas` |
| **Element type** | Zone (right column) |
| **Parent** | `orig-grid` |
| **Visibility** | Always |

**Description:** The right column of the workspace grid. Contains the 7 brief section panels — one for each scaffold step. The brief sections live here, not in the chat lane. The canvas lane scrolls independently from the chat lane.

As the user progresses through the scaffold conversation in the chat lane, the corresponding brief section panels here update with the content extracted by Nexus. The canvas provides a persistent, editable view of the brief being built.

**Children:**
- `orig-canvas-brief-section-1`
- `orig-canvas-brief-section-2`
- `orig-canvas-brief-section-3`
- `orig-canvas-brief-section-4`
- `orig-canvas-brief-section-5`
- `orig-canvas-brief-section-6`
- `orig-canvas-brief-section-7`

---

## A.11 Brief section panels (x7)

Each of the 7 brief section panels corresponds to one scaffold step. When a scaffold step in the chat lane is completed (Nexus extracts content), the corresponding brief section panel in the canvas updates.

### A.11.1 Brief section 1: What's the bet / hypothesis

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-1` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-1` |

**Description:** Canvas panel for the "What's the bet / hypothesis" section of the origination brief. Displays the content extracted by Nexus from scaffold step 1. Initially shows an empty/placeholder state. Updates when scaffold step 1 reaches `complete` status.

**Fields:**
- `section_label`: "What's the bet / hypothesis"
- `section_number`: 1
- `content_area`: Text content extracted from scaffold step 1. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-1` status: `empty` | `in-progress` | `complete`
- `is_editable`: true (user can directly edit canvas content)

**Children:**
- `orig-canvas-brief-section-1-label`
- `orig-canvas-brief-section-1-content`
- `orig-canvas-brief-section-1-status`
- `orig-canvas-brief-section-1-edit-btn`

### A.11.2 Brief section 2: Archetype classification

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-2` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-2` |

**Description:** Canvas panel for the "Archetype classification" section. Displays archetype extracted from scaffold step 2. Updates when scaffold step 2 reaches `complete` status.

**Fields:**
- `section_label`: "Archetype classification"
- `section_number`: 2
- `content_area`: Extracted archetype classification. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-2` status
- `is_editable`: true

**Children:**
- `orig-canvas-brief-section-2-label`
- `orig-canvas-brief-section-2-content`
- `orig-canvas-brief-section-2-status`
- `orig-canvas-brief-section-2-edit-btn`

### A.11.3 Brief section 3: Sponsor candidate

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-3` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-3` |

**Description:** Canvas panel for the "Sponsor candidate" section. Updates when scaffold step 3 reaches `complete` status.

**Fields:**
- `section_label`: "Sponsor candidate"
- `section_number`: 3
- `content_area`: Extracted sponsor candidate. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-3` status
- `is_editable`: true

**Children:**
- `orig-canvas-brief-section-3-label`
- `orig-canvas-brief-section-3-content`
- `orig-canvas-brief-section-3-status`
- `orig-canvas-brief-section-3-edit-btn`

### A.11.4 Brief section 4: Scope / boundary

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-4` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-4` |

**Description:** Canvas panel for the "Scope / boundary" section. Updates when scaffold step 4 reaches `complete` status.

**Fields:**
- `section_label`: "Scope / boundary"
- `section_number`: 4
- `content_area`: Extracted scope definition. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-4` status
- `is_editable`: true

**Children:**
- `orig-canvas-brief-section-4-label`
- `orig-canvas-brief-section-4-content`
- `orig-canvas-brief-section-4-status`
- `orig-canvas-brief-section-4-edit-btn`

### A.11.5 Brief section 5: Evidence family selection

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-5` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-5` |

**Description:** Canvas panel for the "Evidence family selection" section. Updates when scaffold step 5 reaches `complete` status.

**Fields:**
- `section_label`: "Evidence family selection"
- `section_number`: 5
- `content_area`: Extracted evidence family selections. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-5` status
- `is_editable`: true

**Children:**
- `orig-canvas-brief-section-5-label`
- `orig-canvas-brief-section-5-content`
- `orig-canvas-brief-section-5-status`
- `orig-canvas-brief-section-5-edit-btn`

### A.11.6 Brief section 6: Value hypothesis seed

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-6` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-6` |

**Description:** Canvas panel for the "Value hypothesis seed" section. Updates when scaffold step 6 reaches `complete` status.

**Fields:**
- `section_label`: "Value hypothesis seed"
- `section_number`: 6
- `content_area`: Extracted value hypothesis. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-6` status
- `is_editable`: true

**Children:**
- `orig-canvas-brief-section-6-label`
- `orig-canvas-brief-section-6-content`
- `orig-canvas-brief-section-6-status`
- `orig-canvas-brief-section-6-edit-btn`

### A.11.7 Brief section 7: Foundation readiness

| Field | Value |
|---|---|
| **ID** | `orig-canvas-brief-section-7` |
| **Element type** | Panel |
| **Parent** | `orig-canvas` |
| **Visibility** | Always |
| **Linked scaffold step** | `orig-chat-scaffold-step-7` |

**Description:** Canvas panel for the "Foundation readiness (F1–F4 checks)" section. The most gate-critical section: all four foundation readiness checks (F1–F4) must be addressed for the promote bar to enable. Updates when scaffold step 7 reaches `complete` status.

**Fields:**
- `section_label`: "Foundation readiness"
- `section_number`: 7
- `content_area`: F1–F4 check results. Null / placeholder when empty.
- `status_icon`: Mirrors `orig-chat-scaffold-step-7` status
- `f1_check`: `not-checked` | `pass` | `fail` | `partial`
- `f2_check`: `not-checked` | `pass` | `fail` | `partial`
- `f3_check`: `not-checked` | `pass` | `fail` | `partial`
- `f4_check`: `not-checked` | `pass` | `fail` | `partial`
- `is_editable`: true

**Children:**
- `orig-canvas-brief-section-7-label`
- `orig-canvas-brief-section-7-content`
- `orig-canvas-brief-section-7-status`
- `orig-canvas-brief-section-7-edit-btn`
- `orig-canvas-brief-section-7-f1`
- `orig-canvas-brief-section-7-f2`
- `orig-canvas-brief-section-7-f3`
- `orig-canvas-brief-section-7-f4`

### A.11.8 Brief section sub-elements (cross-cutting pattern)

Each brief section panel (1–7) has four sub-elements that follow a consistent pattern. Documented here once rather than repeated for each section.

| Sub-element suffix | ID pattern | Element type | Description |
|---|---|---|---|
| `-label` | `orig-canvas-brief-section-{N}-label` | Label | Section title heading |
| `-content` | `orig-canvas-brief-section-{N}-content` | Field (editable text) | The extracted or user-edited content |
| `-status` | `orig-canvas-brief-section-{N}-status` | Icon | Status indicator: `empty` / `in-progress` / `complete` |
| `-edit-btn` | `orig-canvas-brief-section-{N}-edit-btn` | Button | Triggers inline edit mode for this section's content |

Visibility rule for `-edit-btn`: always visible when the section is in `in-progress` or `complete` state; hidden (or visually suppressed) when `empty`.

---

## A.12 Promote bar

| Field | Value |
|---|---|
| **ID** | `orig-promote-bar` |
| **Element type** | Zone (sticky bottom bar, full-width) |
| **Parent** | `orig-page` |
| **Visibility** | Always |

**Description:** A sticky bar fixed at the bottom of the page, below the workspace grid. Contains the gate summary, the promote button, and status text. The promote bar is **disabled** until all scaffold sections are complete AND a sponsor candidate has been signed off. It is **enabled** only when all 7 scaffold sections are in `complete` state AND the sponsor state is `signed`.

**Children:**
- `orig-promote-bar-gate-summary`
- `orig-promote-bar-promote-btn`
- `orig-promote-bar-status-text`

### A.12.1 Gate summary

| Field | Value |
|---|---|
| **ID** | `orig-promote-bar-gate-summary` |
| **Element type** | Label |
| **Parent** | `orig-promote-bar` |
| **Visibility** | Always |

**Description:** A count showing how many of the 7 scaffold sections are complete. Format: "{X} of 7 sections complete" or similar. Updates in real time as scaffold steps are marked complete.

**Fields:**
- `complete_count`: Integer 0–7
- `total_count`: 7 (constant)
- `display_text`: "{complete_count} of 7 complete"

### A.12.2 Promote button

| Field | Value |
|---|---|
| **ID** | `orig-promote-bar-promote-btn` |
| **Element type** | Button (primary action) |
| **Parent** | `orig-promote-bar` |
| **Visibility** | Always |

**Description:** The primary action button for promoting the Move from P0 Originate to P1 Charter.

**States:**
- **Disabled** (default): All 7 sections not yet complete, or sponsor not signed. Visual: muted/greyed with no hover affordance. `aria-disabled="true"`.
- **Enabled**: All 7 scaffold sections are `complete` AND sponsor state is `signed`. Visual: full color, hover affordance active.

**Fields:**
- `button_label`: "Promote to P1 Charter" (or equivalent)
- `is_enabled`: Boolean. `true` only when all 7 sections complete AND sponsor signed.

### A.12.3 Promote bar status text

| Field | Value |
|---|---|
| **ID** | `orig-promote-bar-status-text` |
| **Element type** | Label |
| **Parent** | `orig-promote-bar` |
| **Visibility** | Always (content changes based on state) |

**Description:** Explanatory text in the promote bar that communicates why the promote button is disabled (when it is) or confirms readiness (when it is enabled).

**Fields:**
- `status_message`: Context-dependent string. Examples:
  - "Complete all 7 sections to promote" (when sections incomplete)
  - "Sponsor signature required" (when sections complete but sponsor not signed)
  - "Ready to promote to P1 Charter" (when all gates met)

---

## A.13 Substrate gap log

Substrate gaps discovered during Layer 1 anatomy work. Each gap is assigned a numbered ID and tracked to a backlog item. Per `SPEC_METHODOLOGY.md §2.4`, no "TBD" — each gap maps to a concrete backlog item.

| Gap ID | Element | Missing substrate | Impact | Backlog item |
|---|---|---|---|---|
| `gap-orig-001` | `orig-rail-phase-node-p0` through `orig-rail-phase-node-p5`, `orig-identity-status-pill` | Constant `PHASE_SHORT_NAMES` does not exist in the codebase. Rail dots use short labels (Originate, Charter, Diagnose, Design, Roadmap, Mobilize); identity card uses full phase names (P0 Originate, etc.). There is no single source of truth for this mapping. | Medium — without this constant, implementations will hardcode strings inline and diverge from each other and from the doctrine defined in `PHASE_MODEL_V2_DOCTRINE.md`. | B-101: Add `PHASE_SHORT_NAMES` constant to `src/lib/strategic-moves/phase-labels.ts` (or create that file if absent); export both short and full label arrays keyed by phase number; reference from PhaseRail component and identity card. |
| `gap-orig-002` | `orig-chat-scaffold-step-{1..7}`, `orig-canvas-brief-section-{1..7}` | No database schema exists for origination draft persistence. Scaffold step state (`empty` / `in-progress` / `complete`) and brief section content extracted by Nexus need to be stored durably. The current `engagements` table has no `origination_draft` column or associated draft table. | High — without persistence, closing the browser tab loses all origination progress. Resolves D-11 (draft persistence decision). | B-102: Design and migrate `origination_drafts` table with columns for `engagement_id`, `scaffold_step_states` (JSONB), `brief_section_content` (JSONB), `sponsor_state`, `created_at`, `updated_at`. Schema to be confirmed in O-4 (Layer 4 Data Binding). |
| `gap-orig-003` | `orig-canvas-brief-section-7-f1` through `-f4` | No definition of F1–F4 foundation readiness checks in the codebase. The criteria for F1, F2, F3, F4 are not codified as a constant, enum, or schema anywhere. | Medium — without a canonical F1–F4 definition, implementation will fabricate check criteria; Nexus behavior will be undefined. | B-103: Define foundation readiness checks F1–F4 in `src/lib/strategic-moves/originate-constants.ts`. Exact criteria to be confirmed in O-2 (Layer 2 State spec) and O-5 (Layer 5 Knowledge Surfacing) before implementation. |

---

## A.14 Element ID quick-reference table

Complete list of all stable IDs defined in this document, for cross-reference by downstream layers.

| Stable ID | Type | Zone | Description |
|---|---|---|---|
| `orig-page` | Zone | root | Page root container |
| `orig-nav` | Zone | shell | App navigation bar (shared) |
| `orig-identity` | Panel | identity | Identity card |
| `orig-identity-eyebrow` | Label | identity | DRAFT-{date} eyebrow |
| `orig-identity-title` | Field | identity | Auto-derived move title |
| `orig-identity-status-pill` | Badge | identity | Phase status pill (full name: "P0 Originate") |
| `orig-rail` | Zone | rail | Phase rail |
| `orig-rail-phase-node-p0` | Node (active) | rail | P0 Originate node (always active here) |
| `orig-rail-phase-node-p1` | Node (disabled) | rail | P1 Charter node (non-interactive in Originate) |
| `orig-rail-phase-node-p2` | Node (disabled) | rail | P2 Diagnose node (non-interactive in Originate) |
| `orig-rail-phase-node-p3` | Node (disabled) | rail | P3 Design node (non-interactive in Originate) |
| `orig-rail-phase-node-p4` | Node (disabled) | rail | P4 Roadmap node (non-interactive in Originate) |
| `orig-rail-phase-node-p5` | Node (disabled) | rail | P5 Mobilize node (non-interactive in Originate) |
| `orig-rail-tower-indicator` | Label | rail | "→ Tower" indicator (non-interactive, different surface) |
| `orig-grid` | Zone | grid | Two-column workspace grid |
| `orig-chat` | Zone | chat | Chat lane (left column) |
| `orig-chat-message-list` | List | chat | Nexus conversation messages |
| `orig-chat-scaffold` | List | chat | **Scaffold step list — IN CHAT LANE, not canvas** |
| `orig-chat-scaffold-step-1` | List item | chat | Step 1: What's the bet / hypothesis |
| `orig-chat-scaffold-step-2` | List item | chat | Step 2: Archetype classification |
| `orig-chat-scaffold-step-3` | List item | chat | Step 3: Sponsor candidate |
| `orig-chat-scaffold-step-4` | List item | chat | Step 4: Scope / boundary |
| `orig-chat-scaffold-step-5` | List item | chat | Step 5: Evidence family selection |
| `orig-chat-scaffold-step-6` | List item | chat | Step 6: Value hypothesis seed |
| `orig-chat-scaffold-step-7` | List item | chat | Step 7: Foundation readiness (F1–F4 checks) |
| `orig-chat-input-area` | Zone | chat | Chat input area (sticky bottom) |
| `orig-chat-input-field` | Field | chat | Auto-grow textarea (Enter submits, Shift+Enter newline) |
| `orig-chat-input-submit` | Button | chat | Submit message button |
| `orig-chat-input-attachment` | Button | chat | File attachment button (paperclip) |
| `orig-chat-input-char-count` | Label | chat | Character count display (conditional) |
| `orig-canvas` | Zone | canvas | Canvas lane (right column) |
| `orig-canvas-brief-section-1` | Panel | canvas | Brief section 1: Hypothesis (linked to scaffold step 1) |
| `orig-canvas-brief-section-2` | Panel | canvas | Brief section 2: Archetype (linked to scaffold step 2) |
| `orig-canvas-brief-section-3` | Panel | canvas | Brief section 3: Sponsor (linked to scaffold step 3) |
| `orig-canvas-brief-section-4` | Panel | canvas | Brief section 4: Scope (linked to scaffold step 4) |
| `orig-canvas-brief-section-5` | Panel | canvas | Brief section 5: Evidence family (linked to scaffold step 5) |
| `orig-canvas-brief-section-6` | Panel | canvas | Brief section 6: Value hypothesis (linked to scaffold step 6) |
| `orig-canvas-brief-section-7` | Panel | canvas | Brief section 7: Foundation readiness (linked to scaffold step 7) |
| `orig-canvas-brief-section-1-label` | Label | canvas | Section 1 title label |
| `orig-canvas-brief-section-1-content` | Field | canvas | Section 1 editable content |
| `orig-canvas-brief-section-1-status` | Icon | canvas | Section 1 status icon |
| `orig-canvas-brief-section-1-edit-btn` | Button | canvas | Section 1 inline edit trigger |
| `orig-canvas-brief-section-2-label` | Label | canvas | Section 2 title label |
| `orig-canvas-brief-section-2-content` | Field | canvas | Section 2 editable content |
| `orig-canvas-brief-section-2-status` | Icon | canvas | Section 2 status icon |
| `orig-canvas-brief-section-2-edit-btn` | Button | canvas | Section 2 inline edit trigger |
| `orig-canvas-brief-section-3-label` | Label | canvas | Section 3 title label |
| `orig-canvas-brief-section-3-content` | Field | canvas | Section 3 editable content |
| `orig-canvas-brief-section-3-status` | Icon | canvas | Section 3 status icon |
| `orig-canvas-brief-section-3-edit-btn` | Button | canvas | Section 3 inline edit trigger |
| `orig-canvas-brief-section-4-label` | Label | canvas | Section 4 title label |
| `orig-canvas-brief-section-4-content` | Field | canvas | Section 4 editable content |
| `orig-canvas-brief-section-4-status` | Icon | canvas | Section 4 status icon |
| `orig-canvas-brief-section-4-edit-btn` | Button | canvas | Section 4 inline edit trigger |
| `orig-canvas-brief-section-5-label` | Label | canvas | Section 5 title label |
| `orig-canvas-brief-section-5-content` | Field | canvas | Section 5 editable content |
| `orig-canvas-brief-section-5-status` | Icon | canvas | Section 5 status icon |
| `orig-canvas-brief-section-5-edit-btn` | Button | canvas | Section 5 inline edit trigger |
| `orig-canvas-brief-section-6-label` | Label | canvas | Section 6 title label |
| `orig-canvas-brief-section-6-content` | Field | canvas | Section 6 editable content |
| `orig-canvas-brief-section-6-status` | Icon | canvas | Section 6 status icon |
| `orig-canvas-brief-section-6-edit-btn` | Button | canvas | Section 6 inline edit trigger |
| `orig-canvas-brief-section-7-label` | Label | canvas | Section 7 title label |
| `orig-canvas-brief-section-7-content` | Field | canvas | Section 7 editable content |
| `orig-canvas-brief-section-7-status` | Icon | canvas | Section 7 status icon |
| `orig-canvas-brief-section-7-edit-btn` | Button | canvas | Section 7 inline edit trigger |
| `orig-canvas-brief-section-7-f1` | Field | canvas | F1 foundation check result |
| `orig-canvas-brief-section-7-f2` | Field | canvas | F2 foundation check result |
| `orig-canvas-brief-section-7-f3` | Field | canvas | F3 foundation check result |
| `orig-canvas-brief-section-7-f4` | Field | canvas | F4 foundation check result |
| `orig-promote-bar` | Zone | shell | Promote bar (sticky bottom, full-width) |
| `orig-promote-bar-gate-summary` | Label | shell | "X of 7 complete" counter |
| `orig-promote-bar-promote-btn` | Button | shell | Promote to P1 Charter (disabled until all gates met) |
| `orig-promote-bar-status-text` | Label | shell | Explanatory text (why disabled / ready) |

---

## A.15 Self-QA

Per `EXECUTION_PLAYBOOK.md §2.3` universal self-QA and `§2.4` spec PR additional QA:

| Check | Status |
|---|---|
| 1. Branch named per §2.1 (`spec/originate-l1-anatomy`) | PASS |
| 2. PR title formatted per §2.2 (`[SPEC] Originate Layer 1 Anatomy (O-1.1)`) | PASS |
| 3. PR description references work package ID O-1.1 and links to WBS | PASS (in PR body) |
| 4. Single work package per PR (O-1.1 only) | PASS |
| 5. Targets `main` | PASS |
| 6. Decision log — no new decisions made; gaps logged as backlog items B-101, B-102, B-103 | PASS |
| 7. Substrate gaps logged with backlog item references | PASS (§A.13) |
| 8. Internal consistency — no downstream references (this is Layer 1, no downstream yet) | PASS |
| 9. Cascade fidelity — all elements from cascade Flow 2 Frame 2 documented | PASS |
| 10. Acceptance demo alignment — not contradicted | PASS |
| 11. Cross-spec consistency — first spec for Originate, no prior contradictions | PASS |
| 12. Substrate verification — all substrate gaps enumerated in §A.13 | PASS |
| Every clickable from cascade has a stable ID | PASS — see §A.14 |
| scaffold-in-chat-lane explicitly stated (not just implied) | PASS — stated in §A.5, §A.6, §A.7 header, and §A.14 |
| PHASE_SHORT_NAMES substrate gap logged | PASS — `gap-orig-001` in §A.13 |
| All 7 scaffold step IDs present (`orig-chat-scaffold-step-1` through `-7`) | PASS — §A.7.1–A.7.7 and §A.14 |
| All 7 brief section IDs present (`orig-canvas-brief-section-1` through `-7`) | PASS — §A.11.1–A.11.7 and §A.14 |

---

## A.16 Document change log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft | Claude Code |
