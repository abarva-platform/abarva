# Strategic Moves Detail Pages — Stable ID Convention

| | |
|---|---|
| **Work Package** | F-03 |
| **Doc path** | `docs/design/strategic-moves/specs/STABLE_ID_CONVENTION.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Binding reference for all Strategic Moves spec and implementation work |
| **Parent doc** | `SPEC_METHODOLOGY.md` §3 (convention summary lives there; this doc extends it) |
| **Companion** | `SPECS_AND_AGENT_TRAINING_WBS.md` F-03 |

---

## Purpose

This document is the **extended reference** for the stable ID convention introduced in `SPEC_METHODOLOGY.md §3`. That section states the pattern and lists nine seed examples. This document:

1. Defines each segment of the pattern precisely
2. Lists the **complete zone vocabulary** for each page
3. Provides at least 25 concrete examples covering all major element categories
4. Documents **collision rules** for elements that share a natural name
5. Lists anti-pattern examples with corrections and rationale
6. Provides a **validation checklist** that spec authors run before opening a PR

Every spec document (Layer 1 through Layer 5, both pages) must use IDs that conform to this convention. Any ID that fails the validation checklist in §6 must be corrected before the PR is opened.

---

## 1 · Full Convention Statement

Every element on either Strategic Moves detail page has a **stable ID** of the form:

```
{page}-{zone}-{component}[-{qualifier}]
```

The qualifier segment is optional. All other segments are required.

### 1.1 Segment definitions

| Segment | Required | Allowed values | Notes |
|---|---|---|---|
| `page` | Yes | `ws`, `orig` | `ws` = Workspace (`/strategic-moves/[moveId]`); `orig` = Originate (`/strategic-moves/new`). Always first. |
| `zone` | Yes | See §2 | Top-level layout region. Must be from the zone vocabulary for this page. |
| `component` | Yes | Hyphenated noun phrase | Names the element. Use the most specific noun available. No verbs. No adjectives that encode state. |
| `qualifier` | Optional | Phase shortcode, numeric index, or field shortcode | Required whenever two or more elements in the same zone would otherwise share the same `{page}-{zone}-{component}` prefix. See §4 for collision rules. |

### 1.2 Formatting rules

- **All lowercase.** No camelCase, no PascalCase, no underscores.
- **Hyphens only** as word separators within a segment. A segment boundary is also represented by a hyphen — context disambiguates because zone values are from a fixed vocabulary (§2).
- **No trailing hyphens.** `orig-chat-scaffold-step-` is invalid; `orig-chat-scaffold-step-3` is correct.
- **No state encoding.** The ID names the element, not the element's current state. The Layer 2 state matrix tracks state. An ID like `ws-canvas-gate-item-failing` is an anti-pattern (see §5).
- **No positional encoding** beyond index qualifiers (`-1`, `-2`, `-3`) that reflect a stable model-defined order, not layout position. `ws-canvas-gate-criterion-top` is wrong; `ws-canvas-gate-criterion-1` is correct.
- **Maximum length guideline:** aim for IDs that fit on one line in a markdown table cell. If an ID exceeds ~50 characters, the component segment is probably too verbose — shorten it.

### 1.3 Phase shortcodes

| Shortcode | Phase full name |
|---|---|
| `p0` | Originate |
| `p1` | Charter |
| `p2` | Discover & Diagnose |
| `p3` | Design Future State |
| `p4` | Roadmap & Business Case |
| `p5` | Mobilize & Handoff |

The shortcode always uses a lower-case `p` followed immediately by the digit. No space, no dash between `p` and the digit.

> **Substrate gap — `PHASE_SHORT_NAMES` constant:** The constant `PHASE_SHORT_NAMES` mapping shortcode → display label does not currently exist in the codebase. Rail node anatomy specs must note this gap. Do not invent or hard-code the mapping in spec docs — log it as a backlog item (B-030 or equivalent) and reference it. This is a Layer 1 (anatomy) substrate gap, not a spec authoring gap. The convention above is the authoritative source until the constant is created.

---

## 2 · Zone Vocabulary

Zone is the second segment of every ID. It identifies the top-level layout region. The zone must be from the vocabulary below — do not invent new zone values. If a genuine new zone is added to either page's design, that requires an amendment to this document before IDs using the new zone appear in any spec.

### 2.1 Workspace zones (`ws-*`)

| Zone | Description |
|---|---|
| `shell` | Persistent shell-level elements that exist across all phase contexts (the AppShell wrapper, global nav). Use sparingly — most Workspace elements belong to a more specific zone. |
| `rail` | The left-side vertical phase rail. Includes phase dot nodes, rail container, and the Tower indicator at the bottom of the rail. |
| `chat` | The chat lane on the right side of the Workspace. Includes input, message list, chips, and any inline scaffold rendered within the chat lane. |
| `canvas` | The central canvas pane. Phase-specific content lives here: gate panel, artifact shelf, current-phase deliverable areas. |
| `header` | The top bar of the Workspace page. Includes breadcrumb, page-level actions, and promote button when applicable. |
| `identity` | The identity card or identity panel that surfaces move metadata (move name, phase label, sponsor, etc.). |
| `breadcrumb` | The breadcrumb trail component. Child of `header` in layout but given its own zone because its element set is self-contained and referenced frequently in Layer 3 interaction specs. |
| `sponsor-strip` | The sponsor acknowledgment strip. Separate zone because it can be present or absent depending on move state. |
| `gate-panel` | The gate evaluation panel within the canvas. Gate criteria items and the promote action live here. Given a dedicated zone to avoid long IDs under `canvas`. |
| `artifact-shelf` | The artifact shelf component within the canvas. Artifact items and upload actions live here. |

### 2.2 Originate zones (`orig-*`)

| Zone | Description |
|---|---|
| `shell` | Persistent shell-level elements on the Originate page (AppShell wrapper). Use sparingly. |
| `rail` | The phase rail on the Originate page. P0 node is active; P1–P5 nodes are present but disabled (non-interactive). |
| `chat` | The chat lane on the Originate page. Critically: the **scaffold step list lives here**, not in the canvas. The chat input and progress chips also live here. |
| `canvas` | The canvas pane on the Originate page. Critically: the **brief section panels live here**, not in the chat lane. |
| `header` | Top bar of the Originate page. Move title placeholder, back navigation. |
| `identity` | Identity card or move metadata area on the Originate page. |
| `brief` | The brief zone groups elements that are part of the brief document taking shape in the canvas. Child of `canvas` in layout but given its own zone to keep brief-section IDs readable. |
| `scaffold` | The scaffold zone groups elements that are part of the origination scaffold in the chat lane. Child of `chat` in layout but given its own zone to keep scaffold-step IDs readable. |
| `promote-bar` | The promote action bar that appears at the bottom of the Originate page once origination is sufficiently complete (brief complete, sponsor identified). |

> **Placement reminder:** These two notes from `SPEC_METHODOLOGY.md §2.1` are load-bearing and counter-intuitive. Violating them is the most common anatomy error:
> - The scaffold step list uses zone `scaffold` — it lives in the **chat lane**, not the canvas.
> - Brief section panels use zone `brief` — they live in the **canvas pane**, not the chat lane.

---

## 3 · Extended Example Set

All examples below conform to `{page}-{zone}-{component}[-{qualifier}]`. Each is annotated with its element category and which cascade frame it corresponds to.

### 3.1 Workspace — Phase rail nodes (Flow 1, Frame 1)

| ID | Element | Notes |
|---|---|---|
| `ws-rail-phase-node-p0` | Rail dot for P0 Originate | Completed state when viewed from P2+ context |
| `ws-rail-phase-node-p1` | Rail dot for P1 Charter | Completed state when viewed from P2+ context |
| `ws-rail-phase-node-p2` | Rail dot for P2 Discover & Diagnose | Current active phase in Flow 1 Frame 1 |
| `ws-rail-phase-node-p3` | Rail dot for P3 Design Future State | Future/locked state in Flow 1 Frame 1 |
| `ws-rail-phase-node-p4` | Rail dot for P4 Roadmap & Business Case | Future/locked state |
| `ws-rail-phase-node-p5` | Rail dot for P5 Mobilize & Handoff | Future/locked state |
| `ws-rail-tower-indicator` | The "→ Tower" indicator at the rail bottom | Not a phase node; different element type. Only shown when P5 is complete or in Tower handoff context. Substrate gap: short-name constant missing (see §1.3). |

> **Note:** The short-name label displayed on each rail dot (e.g., "Diagnose" for P2) is data, not a separate element ID. The dot itself gets the ID above; the label text is a child text node of that element. Do not create a separate ID for the label unless the spec requires targeting it for interaction.

### 3.2 Workspace — Gate panel items (Workspace canvas, Flow 1)

The gate panel in Workspace Flow 1 shows 5 criteria for the P2→P3 promotion gate.

| ID | Element | Notes |
|---|---|---|
| `ws-gate-panel-header` | Gate panel header / title bar | Contains phase label and gate status summary |
| `ws-gate-panel-criterion-1` | Gate criterion item #1 | Numeric qualifier — see §4.1 for collision rules |
| `ws-gate-panel-criterion-2` | Gate criterion item #2 | |
| `ws-gate-panel-criterion-3` | Gate criterion item #3 | |
| `ws-gate-panel-criterion-4` | Gate criterion item #4 | |
| `ws-gate-panel-criterion-5` | Gate criterion item #5 | P2→P3 gate has 5 criteria in Flow 1 |
| `ws-gate-panel-promote-action` | Promote button within the gate panel | Distinct from `ws-header-promote-button` which is the header-level CTA |
| `ws-gate-panel-status-badge` | Overall gate status badge (passing/failing/partial) | |

### 3.3 Workspace — Chat lane elements

| ID | Element | Notes |
|---|---|---|
| `ws-chat-input` | The text input field (the chat compose box) | |
| `ws-chat-send-button` | Send / submit button for chat input | |
| `ws-chat-message-list` | The scrollable container holding chat messages | |
| `ws-chat-message-item` | Individual message bubble | No qualifier here — the list manages instances; Layer 1 documents the template element |
| `ws-chat-chip-rail` | The container holding suggested action chips | |
| `ws-chat-chip-item` | Individual action chip | Template element; qualifier added when chips are fixed and enumerable per phase |

### 3.4 Originate — Canvas brief sections (Flow 2)

The Originate page canvas shows a brief taking shape. Flow 2 shows 7 sections in the brief.

| ID | Element | Notes |
|---|---|---|
| `orig-brief-section-hypothesis` | Brief section: hypothesis statement | Named by content, not by position |
| `orig-brief-section-trigger` | Brief section: trigger / problem statement | |
| `orig-brief-section-archetype` | Brief section: archetype classification | |
| `orig-brief-section-sponsor` | Brief section: sponsor candidate field | |
| `orig-brief-section-value-idea` | Brief section: initial value idea | |
| `orig-brief-section-scope` | Brief section: scope boundaries | |
| `orig-brief-section-risks` | Brief section: initial risk flags | |
| `orig-brief-complete-indicator` | The completeness indicator at the top of the brief canvas | Shows percentage or traffic-light status |

### 3.5 Originate — Chat scaffold steps (Flow 2)

The scaffold step list lives in the chat lane (`scaffold` zone). Flow 2 shows a 7-step scaffold.

| ID | Element | Notes |
|---|---|---|
| `orig-scaffold-step-list` | The container for all scaffold steps | |
| `orig-scaffold-step-1` | Scaffold step 1 (first question / prompt) | Numeric qualifier |
| `orig-scaffold-step-2` | Scaffold step 2 | |
| `orig-scaffold-step-3` | Scaffold step 3 | |
| `orig-scaffold-step-4` | Scaffold step 4 | |
| `orig-scaffold-step-5` | Scaffold step 5 | |
| `orig-scaffold-step-6` | Scaffold step 6 | |
| `orig-scaffold-step-7` | Scaffold step 7 | |
| `orig-scaffold-progress-bar` | Progress indicator across scaffold steps | Displays completion fraction |

### 3.6 Originate — Chat lane other elements

| ID | Element | Notes |
|---|---|---|
| `orig-chat-input` | The chat compose field on the Originate page | |
| `orig-chat-send-button` | Send button for chat input | |
| `orig-chat-message-list` | Scrollable message history container | |
| `orig-chat-chip-rail` | Suggested action chips container | |

### 3.7 View mode variants

View modes (`past`, `future`, `handed-off`) change the visibility and enablement of elements but do not change element IDs. The same `ws-rail-phase-node-p2` ID is used regardless of whether the page is in `current` or `past` view mode. The Layer 2 state matrix captures how the element behaves in each view mode. Do not encode view mode in the ID.

The following IDs illustrate elements that appear or change markedly across view modes:

| ID | Present in view modes | Notes |
|---|---|---|
| `ws-header-view-mode-banner` | `past`, `future`, `handed-off` | The banner that signals non-current context |
| `ws-header-view-mode-label` | `past`, `future`, `handed-off` | Text label inside the banner (e.g., "Viewing P1 Charter — past state") |
| `ws-header-return-to-current-link` | `past`, `future`, `handed-off` | Navigation action to return to current phase context |
| `ws-canvas-readonly-overlay` | `past`, `handed-off` | Overlay that prevents editing; not present in `current` or `future` modes |

### 3.8 Identity card fields

| ID | Element | Notes |
|---|---|---|
| `ws-identity-move-name` | Move name text | |
| `ws-identity-phase-label` | Current phase label | Short name from rail vocabulary (substrate gap: `PHASE_SHORT_NAMES`) |
| `ws-identity-sponsor-name` | Sponsor name field | |
| `ws-identity-sponsor-avatar` | Sponsor avatar image | |
| `ws-identity-move-archetype` | Move archetype classification tag | |
| `ws-identity-last-updated` | Last-updated timestamp | |
| `orig-identity-move-name` | Move name field on Originate page | Editable at origination time |
| `orig-identity-phase-label` | Phase label on Originate page | Always "Originate / P0" at this route |

### 3.9 Sponsor strip elements

| ID | Element | Notes |
|---|---|---|
| `ws-sponsor-strip-container` | The sponsor strip panel | Zone is `sponsor-strip`; this is the root element |
| `ws-sponsor-strip-name` | Sponsor name within the strip | |
| `ws-sponsor-strip-role` | Sponsor role / title within the strip | |
| `ws-sponsor-strip-avatar` | Sponsor avatar within the strip | |
| `ws-sponsor-strip-commitment-badge` | Badge showing sponsor commitment status (proposed / signed) | |

### 3.10 Artifact shelf items

| ID | Element | Notes |
|---|---|---|
| `ws-artifact-shelf-container` | The artifact shelf root element | Zone is `artifact-shelf` |
| `ws-artifact-shelf-item` | Individual artifact card (template element) | Qualifier added when artifact slots are fixed and enumerable per phase |
| `ws-artifact-shelf-upload-action` | Upload / attach action button on the shelf | |
| `ws-artifact-shelf-empty-state` | Empty state shown when no artifacts exist | |

### 3.11 Promote button variants

There are two promote-related buttons, one in the header and one inside the gate panel. They are distinct elements with distinct IDs.

| ID | Element | Notes |
|---|---|---|
| `ws-header-promote-button` | Primary promote CTA in the page header | Visible when gate is `ready` or `partial` in current view mode |
| `ws-gate-panel-promote-action` | Promote action within the gate panel | Secondary surface for the same action; listed separately because it has different interaction behavior (opens confirmation modal vs direct in header) |
| `orig-promote-bar-promote-button` | Promote to P1 button in Originate promote bar | On the Originate page; only shown when brief is sufficiently complete |
| `orig-promote-bar-save-draft-button` | Save draft button in the promote bar | Adjacent to promote; saves current brief state without promoting |

---

## 4 · ID Collision Rules

A collision occurs when two or more elements in the same zone would naturally receive the same `{page}-{zone}-{component}` string. The qualifier segment resolves collisions. This section defines the rule for each collision category.

### 4.1 Multiple items of the same kind in a zone (numeric suffix)

When a zone contains a list of items that are structurally identical (gate criteria, scaffold steps, brief sections), use a numeric qualifier.

**Rule:** Qualifier is a positive integer starting at 1, ordered by the model-defined sequence of the items. Do not use 0-based indexing.

```
ws-gate-panel-criterion-1
ws-gate-panel-criterion-2
ws-gate-panel-criterion-3
```

If a gate phase later gains or loses criteria, re-number from 1 in the amendment PR for that anatomy file. IDs are stable within a spec version, not across amendments.

### 4.2 Same element in multiple phases (phase qualifier)

When the same logical element exists across multiple phases and needs to be referenced independently (most commonly in canvas anatomy files), add the phase shortcode.

```
ws-canvas-deliverable-panel-p2
ws-canvas-deliverable-panel-p3
ws-canvas-deliverable-panel-p4
```

When a phase-specific element also has multiple instances within that phase, combine qualifiers:

```
ws-canvas-deliverable-item-p2-1
ws-canvas-deliverable-item-p2-2
ws-canvas-deliverable-item-p3-1
```

Phase qualifier comes before index qualifier. The pattern is `{page}-{zone}-{component}-{phase}-{index}`.

### 4.3 Same element in multiple view modes (base ID only — do not encode mode)

**Rule: do not encode view mode in the ID.** The same element has the same ID in all view modes. The Layer 2 state matrix and Layer 3 interaction spec describe how the element behaves per mode.

Correct: `ws-header-promote-button` (used in all view mode specs — Layer 2 records that it is disabled in `past` mode)

Wrong: `ws-header-promote-button-current`, `ws-header-promote-button-past` — these would be two separate IDs implying two separate DOM elements, which they are not.

Exception: when a different element is conditionally rendered instead of the base element in a specific mode (e.g., a read-only overlay replaces the editable field), that replacement element gets its own ID (e.g., `ws-canvas-readonly-overlay`). The two IDs are then mutually exclusive in the state matrix.

### 4.4 Elements shared between pages

No element is shared between the Workspace and Originate pages. The phase rail exists on both pages but is a separate DOM subtree. Always prefix with the correct page segment (`ws` or `orig`). Do not create a shared "cross-page" ID.

### 4.5 Shell-level vs zone-level

The `shell` zone is reserved for elements that are truly above the page's zone hierarchy (e.g., the AppShell container itself). Elements inside the header, rail, or other zones belong to those zones, not to `shell`. When in doubt, prefer the more specific zone.

---

## 5 · Anti-Patterns

Each entry shows the wrong ID, the corrected ID, and the rule it violates.

### AP-1 Generic button name

| Wrong | `ws-canvas-button-1` |
|---|---|
| Correct | `ws-gate-panel-promote-action` |
| Rule violated | Component segment must name the element, not use a generic type + index. Zone is also wrong (`canvas` is too broad; `gate-panel` is the correct zone). |

### AP-2 Positional naming

| Wrong | `orig-chat-first-step` |
|---|---|
| Correct | `orig-scaffold-step-1` |
| Rule violated | "first" is a positional adjective that becomes wrong if items are reordered. Use the stable model-defined index instead. Zone is also wrong (`scaffold` is the correct zone for scaffold steps). |

### AP-3 State encoded in ID

| Wrong | `ws-gate-panel-criterion-failing-3` |
|---|---|
| Correct | `ws-gate-panel-criterion-3` |
| Rule violated | `failing` is a state value, not an element name. The state matrix (Layer 2) records that `ws-gate-panel-criterion-3` has a `status` dimension with values `not-evaluated`, `failing`, `passing`. Do not encode state in IDs. |

### AP-4 View mode encoded in ID

| Wrong | `ws-header-promote-button-disabled` |
|---|---|
| Correct | `ws-header-promote-button` |
| Rule violated | `disabled` is a state, not an element name. The state matrix records this element as disabled in `past` and `handed-off` modes. The element ID is the same regardless of mode. |

### AP-5 Implementation detail in ID

| Wrong | `ws-canvas-react-gate-panel-wrapper` |
|---|---|
| Correct | `ws-gate-panel-container` |
| Rule violated | `react` is an implementation detail; `wrapper` is a layout concept, not a semantic name. IDs must be technology-agnostic and semantically meaningful. Also, `gate-panel` is its own zone — use `ws-gate-panel-container` rather than nesting under `canvas`. |

### AP-6 Camel case

| Wrong | `origChatScaffoldStep3` |
|---|---|
| Correct | `orig-chat-scaffold-step-3` |
| Rule violated | All IDs are lowercase with hyphen separators. No camelCase or PascalCase. |

### AP-7 Wrong page prefix for a shared-looking element

| Wrong | `ws-rail-phase-node-p0` used for the Originate page rail |
|---|---|
| Correct | `orig-rail-phase-node-p0` |
| Rule violated | The Originate page has its own phase rail. Its elements use the `orig` prefix. Using `ws` for Originate rail nodes creates ambiguity and breaks the collision rules (both pages would have a `ws-rail-phase-node-p0`). |

### AP-8 Zone invented without vocabulary update

| Wrong | `orig-leftpane-brief-section-1` |
|---|---|
| Correct | `orig-brief-section-hypothesis` (or numbered variant if not yet named by content) |
| Rule violated | `leftpane` is not in the zone vocabulary. New zone values must be added to this document (§2) before being used in spec IDs. Use `brief` (defined in §2.2) instead. Component segment should use a content-based name, not a sequence number, when the sections are semantically distinct. |

### AP-9 Underscore separator

| Wrong | `ws_gate_panel_criterion_1` |
|---|---|
| Correct | `ws-gate-panel-criterion-1` |
| Rule violated | Hyphens only. Underscores are not allowed in element IDs. |

### AP-10 Missing qualifier on colliding elements

| Wrong | Two elements both named `orig-brief-section` (one for hypothesis, one for trigger) |
|---|---|
| Correct | `orig-brief-section-hypothesis` and `orig-brief-section-trigger` |
| Rule violated | When a zone contains multiple instances of the same element type, a qualifier is required. Use a content-based qualifier when the sections are semantically distinct, or a numeric qualifier when they are structurally identical and ordering is stable. |

---

## 6 · Validation Checklist

Before opening a spec PR that introduces new element IDs, run these five questions against every ID in the document:

```
[ ] 1. Page prefix correct?
        Is the first segment `ws` for Workspace or `orig` for Originate?
        Does the route for the ID's element match the declared page?

[ ] 2. Zone is in the vocabulary?
        Is the second segment in the zone vocabulary for this page (§2.1 or §2.2)?
        If a new zone was needed, was §2 of this document amended first?

[ ] 3. Component segment is semantic, not positional, state-based, or implementation-based?
        Does the component segment name what the element IS, not where it is, what state it's in,
        or what technology renders it?

[ ] 4. Qualifier used correctly for collisions?
        If two or more elements in the same zone share the same natural name, is a qualifier present?
        Is the qualifier a phase shortcode (§1.3), a numeric index (§4.1), or a content-based
        shortcode (§4.4)? Is view-mode NOT encoded in the ID (§4.3)?

[ ] 5. No encoding of transient state?
        Does the ID remain valid regardless of what state the element is in?
        Can it appear in the state matrix as a column header without confusion?
```

A PR fails self-QA if any ID in the document fails any of these questions. Fix the IDs before requesting review — the reviewer will apply the same checklist.

---

## 7 · Self-QA: 5 Sample IDs from Cascade Frame 2 (Originate Page)

The following five IDs are produced from Flow 2, Frame 1 of the cascade (Originate page, blank state) to demonstrate the convention is unambiguous in practice.

| Cascade element | ID | Zone | Notes |
|---|---|---|---|
| The active P0 dot on the phase rail | `orig-rail-phase-node-p0` | `rail` | Active (current) phase node on Originate page |
| The hypothesis input panel in the canvas | `orig-brief-section-hypothesis` | `brief` | First brief section; named by content, not position |
| Step 1 of the origination scaffold in the chat lane | `orig-scaffold-step-1` | `scaffold` | In chat lane — counter-intuitive placement; zone reflects this |
| The chat compose input at the bottom of the chat lane | `orig-chat-input` | `chat` | Top-level chat input; no qualifier needed (only one) |
| The promote to P1 button in the promote bar | `orig-promote-bar-promote-button` | `promote-bar` | Promote bar appears once brief is sufficiently complete |

All five pass the §6 validation checklist: correct page prefix, zone in vocabulary, semantic component, no state encoding, qualifiers used correctly.

---

## 8 · References

| Document | Path | Section |
|---|---|---|
| Spec Methodology | `docs/design/strategic-moves/specs/SPEC_METHODOLOGY.md` | §3 (convention summary) |
| Phase Doctrine | `docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md` | Rail labels, phase names |
| WBS | `docs/design/strategic-moves/SPECS_AND_AGENT_TRAINING_WBS.md` | F-03 work package |
| Execution Playbook | `docs/design/strategic-moves/EXECUTION_PLAYBOOK.md` | §2 (PR conventions, self-QA) |

---

## 9 · Document Evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial release — full zone vocabulary, 25+ examples, collision rules, 10 anti-patterns, validation checklist | Claude Code |
