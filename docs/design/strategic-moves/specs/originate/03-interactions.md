# Originate Page · Layer 3 Click & Interaction Inventory

| | |
|---|---|
| **Work Package** | O-3.1, O-3.2, O-3.3, O-3.4 |
| **Doc path** | `docs/design/strategic-moves/specs/originate/03-interactions.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending O-3.5 sign-off |
| **Preceding layers** | `01-anatomy.md` (frozen), `02-state.md` (frozen) |
| **Companion** | `SPEC_METHODOLOGY.md` §2.3, `SPECS_AND_AGENT_TRAINING_WBS.md` §5.1.3 |
| **Author** | Claude Code |

---

## Overview

This document is the complete interaction specification for the Originate page (`/strategic-moves/new`). It covers:

1. **§1 — URL behavior spec (O-3.3, D-10):** How the URL works throughout Originate. No `?phase=0`. No push on interaction.
2. **§2 — Interaction inventory (O-3.1):** One row per interactive element. All clickables from Layer 1 anatomy.
3. **§3 — Keyboard navigation order (O-3.2):** Full Tab order for the page; keyboard shortcuts.
4. **§4 — Loading and error states (O-3.4):** What the user sees during async operations and on failure.
5. **§5 — Draft persistence save triggers:** When auto-save fires per D-11.
6. **§6 — Hard callout: future phase rail nodes are non-interactive.**

All element IDs are from `01-anatomy.md`. All state names are from `02-state.md`.

---

## §1 · URL Behavior Spec (O-3.3 — resolves D-10 for Originate)

### 1.1 Originate URL rules

**Route:** `/strategic-moves/new` — static throughout the entire Originate session.

**Hard rules (per D-10 resolution):**

| Rule | Statement |
|---|---|
| No `?phase=0` | The Originate page does NOT use a `?phase=0` query parameter. There is no phase parameter on this route. Ever. |
| No phase query param | `?phase=N` is a Workspace convention (`/strategic-moves/[moveId]?phase=N`). It does not appear on the Originate route. |
| No draft ID in URL | The draft is resolved server-side by `(user_id, client_id, surface)`. No draft ID appears in the URL. |
| No push on interaction | User interactions on the Originate page do NOT push entries to browser history. The entire session is a single history entry at `/strategic-moves/new`. |
| Reload behavior | Reloading `/strategic-moves/new` restores the open draft (if one exists) via server-side lookup. URL is unchanged. |
| Promote changes route | The only URL change during an Originate session is promotion: on successful promote-to-P1, the browser navigates to `/strategic-moves/[newMoveSlug]`. This is a `router.push()` — a full route change. |
| Back button | Pressing back from Originate goes to wherever the user came from (portfolio, nav). No partial Originate state is preserved in the URL stack. |

### 1.2 URL impact column key (used in §2)

| Value | Meaning |
|---|---|
| `none` | URL does not change |
| `full-route-change` | Browser navigates to a new route (only on successful promote) |

---

## §2 · Interaction Inventory (O-3.1)

### Column definitions

| Column | Content |
|---|---|
| `element-id` | Stable ID from Layer 1 |
| `trigger` | `click`, `keyboard`, `focus`, `change` |
| `action` | What the interaction does |
| `state-change` | Layer 2 state before → after (abbreviated) |
| `side-effects` | Agent rescope, cache invalidation, analytics, draft save |
| `url-impact` | Per §1.2 |
| `keyboard` | Key bindings |
| `focus-target` | Where focus goes after the action |
| `loading-treatment` | What user sees during async ops |
| `error-treatment` | What user sees on failure |

---

### 2.1 Phase rail interactions

#### `orig-rail-phase-node-p0` — P0 active node

| Field | Value |
|---|---|
| **element-id** | `orig-rail-phase-node-p0` |
| **trigger** | `click` |
| **action** | Re-renders the current Originate page state — no navigation, no state change. Equivalent to a no-op click on the already-active node. |
| **state-change** | Same state → Same state (no change) |
| **side-effects** | None. No draft save triggered. No agent rescope. |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | Remains on `orig-rail-phase-node-p0` |
| **loading-treatment** | None — synchronous, no async |
| **error-treatment** | None |

> **Note:** P0 is already the active phase. Clicking it is a deliberate no-op. The element is interactive (focusable, keyboard-accessible) but clicking it produces no visible change other than a brief active/pressed visual state. This is different from the Workspace where clicking a phase node loads that phase's canvas. In Originate, the node merely reflects the user's current phase and cannot navigate elsewhere.

---

#### `orig-rail-phase-node-p1` through `orig-rail-phase-node-p5` — FUTURE PHASE NODES (NON-INTERACTIVE)

**HARD REQUIREMENT (per SPEC_METHODOLOGY.md §2.3, WBS O-3.1):**

> Future phase rail nodes P1–P5 on the phase rail are **completely non-interactive** in the Originate context. They MUST:
> - Have NO click handler attached
> - Have NO hover affordance (no cursor change, no tooltip, no visual feedback on mouseover)
> - Render with `aria-disabled="true"` and `tabIndex="-1"` (excluded from tab order)
> - NOT appear in keyboard navigation order (§3)
> - NOT respond to `Enter` or `Space` keypress even if somehow focused
>
> The cascade implies this but does not explicitly draw the non-interactive state. This document makes it explicit. Any implementation that attaches a click handler or hover affordance to P1–P5 nodes in the Originate context is a spec violation.

| Field | Value |
|---|---|
| **element-id** | `orig-rail-phase-node-p1`, `orig-rail-phase-node-p2`, `orig-rail-phase-node-p3`, `orig-rail-phase-node-p4`, `orig-rail-phase-node-p5` |
| **trigger** | None — no interaction |
| **action** | No action. Element is non-interactive. |
| **state-change** | N/A |
| **side-effects** | None |
| **url-impact** | `none` |
| **keyboard** | None — excluded from tab order (`tabIndex="-1"`) |
| **focus-target** | N/A — cannot receive focus |
| **loading-treatment** | N/A |
| **error-treatment** | N/A |

---

#### `orig-rail-tower-indicator` — Tower indicator

| Field | Value |
|---|---|
| **element-id** | `orig-rail-tower-indicator` |
| **trigger** | None — non-interactive |
| **action** | No action. Purely decorative/informational label. |
| **state-change** | N/A |
| **side-effects** | None |
| **url-impact** | `none` |
| **keyboard** | None — excluded from tab order |
| **focus-target** | N/A |
| **loading-treatment** | N/A |
| **error-treatment** | N/A |

---

### 2.2 Chat lane — input area

#### `orig-chat-input-field` — chat compose textarea

| Field | Value |
|---|---|
| **element-id** | `orig-chat-input-field` |
| **trigger** | `change` (typing), `keyboard` |
| **action** | User types a message. Auto-grows textarea. Updates character count (`orig-chat-input-char-count`). |
| **state-change** | Any state → same state (typing does not change briefCompleteness, sponsorState, foundationState). |
| **side-effects** | `orig-chat-input-submit` transitions from disabled to enabled when field is non-empty and non-whitespace. Character count shows when field has content. |
| **url-impact** | `none` |
| **keyboard** | `Enter` — submits message (see `orig-chat-input-submit`). `Shift+Enter` — inserts newline without submitting. `Escape` — clears field (if no content, focus moves to nearest focusable ancestor). |
| **focus-target** | Stays in `orig-chat-input-field` |
| **loading-treatment** | No loading state for typing itself. After submit, field is cleared and disabled while Nexus responds (see `orig-chat-input-submit`). |
| **error-treatment** | If message exceeds character limit: submit button disables, char count turns red. Field does not prevent typing beyond limit (allows editing down). |

---

#### `orig-chat-input-submit` — send button

| Field | Value |
|---|---|
| **element-id** | `orig-chat-input-submit` |
| **trigger** | `click`, `keyboard` |
| **action** | Submits the composed message to Nexus. Message appends to `orig-chat-message-list`. Input field clears. Nexus begins processing. |
| **state-change** | Any state → S-14 (nexus-responding): input field and submit button disabled, Nexus typing indicator appears in message list. On Nexus response: returns to previous state or advances to next state if scaffold step completes. |
| **side-effects** | (1) Message appended to conversation. (2) If Nexus response marks a scaffold step complete: scaffold step status icon updates, corresponding brief section panel updates, draft auto-save fires (§5). (3) Analytics event: `originate_message_sent`. |
| **url-impact** | `none` |
| **keyboard** | `Enter` in `orig-chat-input-field` (primary); `Enter` or `Space` when submit button is focused directly. |
| **focus-target** | Returns to `orig-chat-input-field` after submission |
| **loading-treatment** | Input field disabled. Submit button shows spinner or disabled state. `orig-chat-message-list` shows Nexus typing indicator (animated dots or skeleton). Duration: until Nexus API response completes (streaming). |
| **error-treatment** | On Nexus API failure: typing indicator disappears. Error message appended to message list: "I encountered an issue. Please try again." Submit button re-enables. Field restores prior content (or blank if cleared). Toast notification (optional): "Message failed to send." Retry by resubmitting. |

---

#### `orig-chat-input-attachment` — attachment / file picker button

| Field | Value |
|---|---|
| **element-id** | `orig-chat-input-attachment` |
| **trigger** | `click` |
| **action** | Opens the system file picker. Accepted file types: `.pdf`, `.docx`, `.txt`, `.md`, `.xlsx`. Single file at a time. |
| **state-change** | → S-15 (attachment-uploading) while file is processed. Returns to prior state after. |
| **side-effects** | (1) Selected file is uploaded to API for Nexus context injection. (2) A file attachment chip appears in the message list above the compose box showing filename and status (uploading → ready). (3) On upload complete: Nexus receives the file as context for the next message; no automatic message is sent. (4) Analytics event: `originate_file_attached`. |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when button is focused — opens file picker |
| **focus-target** | Returns to `orig-chat-input-field` after file picker closes |
| **loading-treatment** | Attachment button shows loading state. File picker progress shown inline in message list (uploading... → ready). Input field remains accessible (user can type while file uploads). |
| **error-treatment** | (1) Unsupported file type: system file picker restricted to accepted types; if bypassed, toast: "Unsupported file type. Accepted: PDF, DOCX, TXT, MD, XLSX." (2) File too large: toast: "File too large. Maximum size is [limit]." (3) Upload failure: toast: "File upload failed. Try again." Attachment chip shows error state. |

---

### 2.3 Chat lane — scaffold steps

#### `orig-chat-scaffold-step-1` through `orig-chat-scaffold-step-7` — scaffold step items

Each scaffold step item is clickable. Clicking expands/collapses detail and shows context for that step.

| Field | Value |
|---|---|
| **element-id** | `orig-chat-scaffold-step-{1..7}` |
| **trigger** | `click` |
| **action** | Expands the scaffold step item to show: (1) The step's full prompt/question. (2) The current extracted content for this step (if any). (3) A "Jump to this step in conversation" affordance (scrolls message list to the relevant conversation segment). |
| **state-change** | No state dimension change. Purely a local UI toggle (expand/collapse). Other steps collapse when one is expanded (accordion behavior). |
| **side-effects** | None. No draft save, no agent rescope. |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` to toggle expand/collapse |
| **focus-target** | Focus stays within the expanded step item. If collapsing: focus returns to the step's summary row. |
| **loading-treatment** | None — synchronous toggle |
| **error-treatment** | None |

> **Note on step completion:** Step completion is NOT triggered by clicking the step item. Steps are completed by Nexus when it extracts sufficient content through conversation. The click here is informational navigation only — it does not advance the scaffold.

---

### 2.4 Canvas lane — brief section edit buttons

#### `orig-canvas-brief-section-{1..7}-edit-btn` — inline edit triggers

One per brief section panel. Visible only when section status is `in-progress` or `complete` (hidden when `empty` per Layer 2).

| Field | Value |
|---|---|
| **element-id** | `orig-canvas-brief-section-{N}-edit-btn` (N = 1 through 7) |
| **trigger** | `click` |
| **action** | Opens inline edit mode for the corresponding brief section's content area (`orig-canvas-brief-section-{N}-content`). The content area becomes an editable textarea pre-populated with current content. A "Save" and "Cancel" button appear. |
| **state-change** | No state dimension change. The section's edit mode is a local UI state. |
| **side-effects** | (1) On "Save" within inline edit: content is persisted to draft via `POST /api/programs/origination-draft`. Draft auto-save fires. (2) On "Cancel": content reverts to pre-edit value. No save. (3) If user edits section 3 (sponsor): `sponsorState` may change depending on what they edit. |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` on edit button opens inline editor. Within inline editor: `Ctrl+Enter` / `Cmd+Enter` saves. `Escape` cancels. |
| **focus-target** | On open: focus moves into the content textarea. On save: focus returns to `orig-canvas-brief-section-{N}-edit-btn`. On cancel: same. |
| **loading-treatment** | "Save" button shows spinner while draft save request in-flight. Content area temporarily read-only during save. |
| **error-treatment** | On save failure: toast "Failed to save — please try again." Content reverts to pre-edit value. User can retry. |

---

### 2.5 Promote bar

#### `orig-promote-bar-promote-btn` — promote to P1 Charter button

This is the most consequential interaction on the page. Disabled by default; enabled only when `briefCompleteness = 'complete'` AND `sponsorState = 'confirmed'` (per Layer 2 §1.2).

| Field | Value |
|---|---|
| **element-id** | `orig-promote-bar-promote-btn` |
| **trigger** | `click` |
| **action (when disabled)** | No action. `aria-disabled="true"` prevents click handling. Visual state: muted/greyed, no hover affordance, no cursor change. |
| **action (when enabled)** | Triggers the promote-to-P1-Charter mutation. (1) Opens a confirmation dialog: "Promote this move to P1 Charter? This will create a Strategic Move in the portfolio." with "Promote" and "Cancel" buttons. (2) On "Promote" confirmation: fires `POST /api/programs/origination-submit` with the full origination brief. (3) On success: marks draft as committed (`markDraftCommitted`), then navigates to `/strategic-moves/[newMoveSlug]`. (4) On failure: see error treatment. |
| **state-change** | Enabled + clicked → S-12 (promote-in-flight). All interactive elements lock. On success: full route change. On failure: returns to S-09/S-10/S-11. |
| **side-effects** | (1) `POST /api/programs/origination-submit` — creates engagement record in DB. (2) `markDraftCommitted` — sets `committed_engagement_id` on draft row. (3) Portfolio draft count updates. (4) Analytics event: `originate_promoted_to_p1`. (5) Audit log entry: `{ action: 'move_promoted_p0_to_p1', by: userId, at: timestamp, prev: { phase: 0, briefCompleteness: 'complete', sponsorState: 'confirmed' }, next: { phase: 1, engagementId: newId } }`. (6) Nexus receives a context reset for the new P1 workspace. |
| **url-impact** | `full-route-change` — navigates to `/strategic-moves/[newMoveSlug]` on success |
| **keyboard** | `Enter` or `Space` when button is focused and enabled. When disabled: no response to keyboard input. |
| **focus-target** | While confirmation dialog is open: focus trapped within dialog. On dialog cancel: focus returns to `orig-promote-bar-promote-btn`. On success: page navigates away (no focus target needed). |
| **loading-treatment** | S-12 state: entire page locks — all interactive elements disabled. Promote button shows "Promoting..." text with spinner. Canvas sections show disabled overlay. Duration: until API response. |
| **error-treatment** | On `POST /api/programs/origination-submit` failure: (1) Page unlocks (exits S-12). (2) `orig-promote-bar-status-text` shows "Promote failed — please try again". (3) Toast: "Something went wrong. Please try again or contact support." (4) Error details logged to console. Promote button returns to enabled state. |

---

### 2.6 Identity card (non-interactive elements)

The identity card elements (`orig-identity`, `orig-identity-eyebrow`, `orig-identity-title`, `orig-identity-status-pill`) are **non-interactive** display elements. They update in real time as Nexus extracts content but do not respond to user interaction. No click handlers, no hover affordance, no keyboard interaction.

| Element | Interaction |
|---|---|
| `orig-identity-title` | Non-interactive. Auto-derives from scaffold step 1 content. Read-only at this stage. |
| `orig-identity-eyebrow` | Non-interactive. Static DRAFT-{date}. |
| `orig-identity-status-pill` | Non-interactive. Always shows "P0 Originate". |

---

## §3 · Keyboard Navigation Order (O-3.2)

### 3.1 Tab order — full page

Tab order traverses focusable elements in document order. Non-interactive elements (`orig-rail-phase-node-p1` through `p5`, `orig-rail-tower-indicator`, identity card fields) are excluded from tab order (`tabIndex="-1"`).

**Tab order sequence (document order):**

1. `orig-nav` — global nav elements (handled by AppTopBar; not re-specified here)
2. `orig-rail-phase-node-p0` — P0 active rail node (focusable; click = no-op)
3. *(P1–P5 nodes and Tower indicator: NOT in tab order — `tabIndex="-1"`)*
4. `orig-chat-message-list` — scrollable region (focusable as scroll container, `tabIndex="0"`)
5. `orig-chat-scaffold-step-1` through `orig-chat-scaffold-step-7` — each step item in order
6. `orig-chat-input-attachment` — attachment button
7. `orig-chat-input-field` — chat textarea (primary interaction target — should receive focus on page load)
8. `orig-chat-input-submit` — send button
9. `orig-canvas-brief-section-1-edit-btn` (only when visible — hidden when section is `empty`)
10. `orig-canvas-brief-section-2-edit-btn` (only when visible)
11. `orig-canvas-brief-section-3-edit-btn` (only when visible)
12. `orig-canvas-brief-section-4-edit-btn` (only when visible)
13. `orig-canvas-brief-section-5-edit-btn` (only when visible)
14. `orig-canvas-brief-section-6-edit-btn` (only when visible)
15. `orig-canvas-brief-section-7-edit-btn` (only when visible)
16. `orig-promote-bar-promote-btn` — always in tab order even when disabled (`tabIndex="0"`, `aria-disabled="true"`)

> **Note:** Tab position 16 (`orig-promote-bar-promote-btn`) is always focusable so screen reader users can discover it and hear the status text. The ARIA description on the button references `orig-promote-bar-status-text` when disabled, informing users why promote is not available.

### 3.2 Keyboard shortcuts

| Shortcut | Scope | Effect |
|---|---|---|
| `Enter` | `orig-chat-input-field` focused | Submits message (same as clicking `orig-chat-input-submit`) |
| `Shift+Enter` | `orig-chat-input-field` focused | Inserts newline in message |
| `Escape` | `orig-chat-input-field` focused | Clears field if empty; if content present, no effect (preserve content) |
| `Cmd+Enter` / `Ctrl+Enter` | Within inline section editor (after edit-btn opens editor) | Saves the edit |
| `Escape` | Within inline section editor | Cancels edit, restores prior content |
| `Enter` / `Space` | `orig-chat-scaffold-step-{N}` focused | Toggles expand/collapse of that step |
| `Enter` / `Space` | `orig-chat-input-attachment` focused | Opens file picker |
| `Enter` / `Space` | `orig-canvas-brief-section-{N}-edit-btn` focused | Opens inline editor for that section |
| `Enter` / `Space` | `orig-promote-bar-promote-btn` focused AND enabled | Triggers promote (same as clicking) |
| `Enter` / `Space` | `orig-promote-bar-promote-btn` focused AND disabled | No effect (aria-disabled blocks handler) |

### 3.3 Initial focus on page load

On initial page load (fresh or draft restore), focus is set to `orig-chat-input-field`. This is the primary interaction point for the page and the correct starting focus for both keyboard and assistive-technology users.

### 3.4 Focus trap — confirmation dialog

When the promote confirmation dialog opens (triggered by clicking enabled `orig-promote-bar-promote-btn`), focus is trapped within the dialog:
- Tab cycles through dialog's "Promote" and "Cancel" buttons only
- `Escape` closes dialog (equivalent to "Cancel")
- On dialog close without action: focus returns to `orig-promote-bar-promote-btn`

---

## §4 · Loading and Error States (O-3.4)

### 4.1 Loading states

| Interaction / Trigger | Element(s) in loading state | Visual treatment | Duration |
|---|---|---|---|
| Message submit (`orig-chat-input-submit`) | `orig-chat-input-field` (disabled), `orig-chat-input-submit` (spinner), `orig-chat-message-list` (Nexus typing indicator) | Input disabled; typing dots or animated skeleton in message list | Until Nexus streaming response completes |
| File attachment upload | `orig-chat-input-attachment` (loading state), file chip in message list (progress bar) | Button animates; inline chip shows upload progress | Until file upload API responds |
| Scaffold step completing | Corresponding `orig-canvas-brief-section-{N}` (skeleton/loading overlay) | Section panel shows content loading skeleton | Until extraction completes (sub-second to a few seconds) |
| Promote-to-P1 in flight | All interactive elements on page disabled; `orig-promote-bar-promote-btn` shows "Promoting..." + spinner | Entire page locks: canvas sections show disabled overlay; promote button shows progress | Until `POST /api/programs/origination-submit` responds |
| Draft save (background) | None — silent background save | No visible loading state. Draft saves are silent. Optional: brief "Saved" indicator in promote bar for 2 seconds after save. | Until `POST /api/programs/origination-draft` responds |
| Page load / draft restore | `orig-chat-message-list` (skeleton), `orig-canvas` sections (skeleton) | Skeleton loading state for message list and brief sections | Until `GET /api/programs/origination-draft` responds and hydration completes |

### 4.2 Error states

| Error condition | Trigger | User-facing treatment | Recovery |
|---|---|---|---|
| Nexus API failure (message send) | `POST` to chat agent route fails | Typing indicator disappears; error message in chat: "I encountered an issue. Please try again." Submit re-enables. | User retries by sending message again |
| File upload failure | Upload API call fails | File chip shows error state with retry icon. Toast: "File upload failed. Try again." | User clicks retry on chip or re-attaches file |
| Inline section edit save failure | `POST /api/programs/origination-draft` fails during edit save | Toast: "Failed to save — please try again." Content reverts. Edit mode remains open so user can retry. | User clicks Save again in inline editor |
| Promote mutation failure | `POST /api/programs/origination-submit` fails | Page unlocks. `orig-promote-bar-status-text` shows "Promote failed — please try again". Toast with error. Promote button re-enables. | User retries promote |
| Draft load failure (page load) | `GET /api/programs/origination-draft` fails | Page loads in blank state (S-01). Informational toast: "Couldn't restore your previous session. Starting fresh." | User starts a new origination. Draft may still exist on server and be retrieved on next page load. |
| No sponsor in ACL | ACL lookup returns empty | `orig-canvas-brief-section-3` shows inline warning (see EDGE-A, Layer 2). Promote bar shows advisory. | User contacts administrator |
| Promote blocked by validation | Submit API returns 400 with validation errors | Validation errors displayed in promote bar and/or toast. Specific fields flagged. | User addresses validation errors |
| Session expired | Auth token expires during session | Global auth redirect. Draft was last saved at most-recent scaffold step completion. Work is not lost. | User logs back in; navigates back to `/strategic-moves/new`; draft restored. |

---

## §5 · Draft Persistence Save Triggers (D-11)

Per D-11 resolution (auto-save on scaffold step completion). Documented here as part of the interaction spec because each save is triggered by a specific interaction event.

| Save trigger | When | What is saved | API call |
|---|---|---|---|
| Scaffold step completion | Nexus marks a scaffold step `complete` (extraction finishes) | Full `OriginationDraftState`: turns array + brief fields + patternMatch | `POST /api/programs/origination-draft` with `{ surface: '/strategic-moves/new', state: currentState }` |
| Inline section edit save | User clicks "Save" within an inline brief section editor | Updated brief field for the edited section | `POST /api/programs/origination-draft` |
| Page / tab close (best-effort) | `beforeunload` event fires | Most recent in-flight state | `POST /api/programs/origination-draft` (may not complete if browser terminates request aggressively) |
| Promote success | After `POST /api/programs/origination-submit` succeeds | Draft marked committed via `markDraftCommitted` | Internal: sets `committed_engagement_id` on draft row |

**Save debouncing:** No debouncing applied to scaffold step completion saves — each completion event triggers exactly one save. Background saves do not block the UI (fire-and-forget with silent retry on failure).

**Draft state shape** (for reference): `{ sessionId?: string, turns: ChatTurn[], brief: BriefDraft | null, patternMatch: PatternMatchCard | null }` — as defined in `src/lib/programs/origination-drafts.ts`.

---

## §6 · Hard Callout: Future Phase Rail Nodes

This section restates the most important constraint for implementers, as required by `SPEC_METHODOLOGY.md §2.3` and `SPECS_AND_AGENT_TRAINING_WBS.md` O-3.1.

**`orig-rail-phase-node-p1`, `orig-rail-phase-node-p2`, `orig-rail-phase-node-p3`, `orig-rail-phase-node-p4`, `orig-rail-phase-node-p5` are non-interactive in the Originate context.**

Implementation checklist:
- [ ] No `onClick` handler attached to P1–P5 nodes
- [ ] No `onMouseEnter`/`onMouseOver` handler (no hover CSS, no tooltip)
- [ ] `aria-disabled="true"` attribute set
- [ ] `tabIndex="-1"` — excluded from keyboard focus order
- [ ] Visual state: muted/dimmed, visually distinct from the active P0 node
- [ ] CSS cursor: `not-allowed` or `default` (NOT `pointer`)

The phase rail on the Workspace page IS interactive (clicking a rail node loads that phase). On the Originate page, it is NOT. This asymmetry is intentional and load-bearing — the Originate page has no concept of "navigate to a different phase." There is only one phase here: P0 Originate. The rail serves as a progress indicator only.

---

## §7 · Self-QA

Per `EXECUTION_PLAYBOOK.md §2.3` universal self-QA and `§2.4` spec PR additional QA:

| Check | Status |
|---|---|
| 1. Branch named per §2.1 (`spec/originate-l3-interactions`) | PASS |
| 2. PR title formatted per §2.2 (`[SPEC] Originate Layer 3 Interactions (O-3.1, O-3.2, O-3.3, O-3.4)`) | PASS |
| 3. PR description references work package IDs O-3.1–O-3.4 and links to WBS | PASS |
| 4. Single work package per PR | PASS |
| 5. Targets `main` | PASS |
| 6. Decision log — no new decisions; D-10 and D-11 explicitly resolved in this doc | PASS |
| 7. Substrate gaps — no new gaps beyond those in Layer 1 and Layer 2 | PASS |
| 8. Internal consistency — all element IDs reference Layer 1; all states reference Layer 2 | PASS |
| 9. Cascade fidelity — all clickables from Flow 2 Frame 2 covered | PASS |
| 10. Acceptance demo alignment — promote flow matches WBS §11.4 demo B steps 9–10 | PASS |
| 11. Cross-spec consistency — no contradiction with Layer 1 or Layer 2 | PASS |
| 12. Substrate verification — all interactions map to existing API routes or backlog items | PASS |
| Every clickable from Layer 1 has an interaction row | PASS — all 9+ interactive elements covered |
| Keyboard navigation order specified end-to-end | PASS (§3) |
| URL behavior aligns exactly with D-10 | PASS (§1) — no `?phase=0`, no push on interaction |
| Future phase nodes P1–P5 documented as non-interactive | PASS (§2.1 and §6) |
| Draft save triggers documented per D-11 | PASS (§5) |
| All loading and error states documented | PASS (§4) |
| Promote button: disabled until 7 complete AND sponsor confirmed | PASS (§2.5) |
| Promote success: full-route-change to `/strategic-moves/[slug]` | PASS (§2.5) |

---

## §8 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft | Claude Code |
