# Workspace Shell Interactions

| | |
|---|---|
| **Work Package** | W-3.1 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-shell.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **Reference** | `01-anatomy-shell.md` (element IDs) · `02-state.md` (state names) · D-10 (URL behavior) |
| **Author** | Claude Code |

---

## Overview

This document specifies every interaction on Workspace shell elements (nav, breadcrumb, identity, rail, chat lane, sponsor strip). Interactions are identified by element ID from Layer 1.

**Column definitions:**
- `element-id`: Stable ID from Layer 1
- `trigger`: `click` / `keyboard` / `hover` / `focus`
- `action`: `mutation` / `navigation` / `panel-toggle` / `modal-open` / `url-param-change` / `view-change`
- `state-change`: Before state → after state (Layer 2 state names)
- `side-effects`: Agent rescope, cache invalidation, analytics event
- `url-impact`: `none` / `query-param` / `full-route-change`
- `keyboard`: Key binding or `none`
- `focus-target`: Which element receives focus after action
- `loading-treatment`: What user sees during async operation
- `error-treatment`: What user sees on failure

---

## Rail Interactions

### INT-WS-R-01: Click active phase node (already on this phase)

| Field | Value |
|---|---|
| **element-id** | `ws-rail-phase-node-p{N}` where N = current active phase |
| **trigger** | `click` |
| **action** | no-op |
| **state-change** | none |
| **side-effects** | none |
| **url-impact** | `none` |
| **keyboard** | `none` |
| **focus-target** | element retains focus |
| **loading-treatment** | none |
| **error-treatment** | none |

**Note:** Clicking the currently active phase node does nothing. No state change, no animation beyond the click affordance.

---

### INT-WS-R-02: Click a past phase node (completed phase)

| Field | Value |
|---|---|
| **element-id** | `ws-rail-phase-node-p{N}` where N < current active phase |
| **trigger** | `click` |
| **action** | `view-change` |
| **state-change** | `viewMode: current → past` |
| **side-effects** | Chat lane switches to read-only replay for past phase; canvas switches to past-phase canvas; view mode banner appears |
| **url-impact** | `none` — rail clicks do NOT push to URL history (D-10 resolution) |
| **keyboard** | `Enter` or `Space` when node has focus |
| **focus-target** | `ws-canvas-p{N}` (first focusable element in the switched canvas) |
| **loading-treatment** | Brief loading indicator while past phase content loads; skeleton screens for canvas content |
| **error-treatment** | If past phase data fails to load: "Unable to load P{N} history. Try again." inline message in canvas area |

**D-10 note:** Rail clicks change the displayed canvas WITHOUT pushing a history entry. Browser Back from within a rail-navigated view goes to the previous full page (not to the previous rail state).

---

### INT-WS-R-03: Click a future phase node (not yet reached)

| Field | Value |
|---|---|
| **element-id** | `ws-rail-phase-node-p{N}` where N > current active phase |
| **trigger** | `click` |
| **action** | `view-change` |
| **state-change** | `viewMode: current → future` |
| **side-effects** | Chat lane shows Nexus preview message for future phase; canvas switches to future-phase canvas (preview content); view mode banner appears; action chips hidden |
| **url-impact** | `none` — no URL change for rail clicks (D-10) |
| **keyboard** | `Enter` or `Space` when node has focus |
| **focus-target** | `ws-canvas-p{N}` or `ws-chat-input-field` (future mode chat is enabled) |
| **loading-treatment** | Skeleton screen while future canvas content loads |
| **error-treatment** | "Unable to load P{N} preview." inline message |

---

### INT-WS-R-04: Click Tower indicator

| Field | Value |
|---|---|
| **element-id** | `ws-rail-tower-indicator` |
| **trigger** | `click` |
| **action** | no-op |
| **state-change** | none |
| **side-effects** | none |
| **url-impact** | `none` |
| **keyboard** | `none` |
| **focus-target** | none |
| **loading-treatment** | none |
| **error-treatment** | none |

**Note:** `ws-rail-tower-indicator` is non-interactive. It is a directional label, not a navigation control. No click handler. `aria-hidden` or `role="presentation"`.

---

### INT-WS-R-05: Rail keyboard navigation

| Field | Value |
|---|---|
| **element-id** | `ws-rail` (tab stop context) |
| **trigger** | `keyboard` |
| **action** | `view-change` |
| **state-change** | As per click interactions above |
| **keyboard** | Tab to focus rail; Arrow Left / Arrow Right to move between phase nodes; Enter or Space to activate the focused node |
| **focus-target** | The phase node that was activated |

---

## Breadcrumb Interactions

### INT-WS-BC-01: Click portfolio link

| Field | Value |
|---|---|
| **element-id** | `ws-breadcrumb-portfolio-link` |
| **trigger** | `click` |
| **action** | `navigation` (full route change) |
| **state-change** | leaves Workspace page |
| **side-effects** | none |
| **url-impact** | `full-route-change` → navigates to `/strategic-moves` |
| **keyboard** | `Enter` when focused |
| **focus-target** | portfolio page's first focusable element |
| **loading-treatment** | Next.js navigation loading indicator |
| **error-treatment** | Standard navigation error handling |

---

## View Mode Banner Interactions

### INT-WS-VMB-01: Click Return to Current link

| Field | Value |
|---|---|
| **element-id** | `ws-header-return-to-current-link` |
| **trigger** | `click` |
| **action** | `view-change` |
| **state-change** | `viewMode: past|future → current` |
| **side-effects** | Canvas switches back to current active phase; view mode banner hides; chat resumes active state; action chips re-appear |
| **url-impact** | `none` — no URL change (D-10) |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p{activePhase}` first focusable element |
| **loading-treatment** | Brief canvas loading |
| **error-treatment** | If current phase data fails: error state in canvas |

---

## Chat Lane Interactions

### INT-WS-CHAT-01: Send message (click send button)

| Field | Value |
|---|---|
| **element-id** | `ws-chat-send-button` |
| **trigger** | `click` |
| **action** | `mutation` (sends message to Nexus) |
| **state-change** | Chat message list updates; input field clears; Nexus processes and responds |
| **side-effects** | Nexus may rescope based on message content; analytics: `chat_message_sent` event |
| **url-impact** | `none` |
| **keyboard** | `Enter` (when `ws-chat-input-field` has focus and not pressing Shift) |
| **focus-target** | `ws-chat-input-field` (after send, focus stays on input) |
| **loading-treatment** | Nexus message bubble shows typing indicator while response generates |
| **error-treatment** | If send fails: "Unable to send message. Try again." toast; message stays in input field |

---

### INT-WS-CHAT-02: Shift+Enter in chat input (insert newline)

| Field | Value |
|---|---|
| **element-id** | `ws-chat-input-field` |
| **trigger** | `keyboard` |
| **action** | `panel-toggle` (inserts newline) |
| **state-change** | Input field grows by one row |
| **side-effects** | none |
| **url-impact** | `none` |
| **keyboard** | `Shift+Enter` |
| **focus-target** | `ws-chat-input-field` (retains focus) |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-CHAT-03: Click attach button

| Field | Value |
|---|---|
| **element-id** | `ws-chat-attach-button` |
| **trigger** | `click` |
| **action** | `modal-open` (opens file picker) |
| **state-change** | File picker opens; on file selection, file is queued for upload |
| **side-effects** | File uploaded as context for Nexus; Nexus may ingest and reference file in subsequent messages |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | File picker (OS dialog); on close, focus returns to `ws-chat-input-field` |
| **loading-treatment** | Upload progress indicator in chat lane while file uploads |
| **error-treatment** | "File upload failed. Accepted formats: PDF, DOCX, XLSX. Max size: Xmb." error message |

---

### INT-WS-CHAT-04: Click action chip

| Field | Value |
|---|---|
| **element-id** | `ws-chat-chip-{n}` |
| **trigger** | `click` |
| **action** | `mutation` (sends pre-formed message or fills input) |
| **state-change** | Either: (a) fills `ws-chat-input-field` with chip text (user reviews before sending) OR (b) sends the chip's message directly. Behavior determined by chip type (defined in Layer 5). |
| **side-effects** | If sent: same as INT-WS-CHAT-01 |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | `ws-chat-input-field` |
| **loading-treatment** | See INT-WS-CHAT-01 if sent directly |
| **error-treatment** | See INT-WS-CHAT-01 |

---

## Sponsor Strip Interactions

### INT-WS-SS-01: Click "Request Review" button

| Field | Value |
|---|---|
| **element-id** | `ws-sponsor-strip-action-btn` (when label = "Request Review") |
| **trigger** | `click` |
| **action** | `mutation` (creates signoff request) |
| **state-change** | `ws-sponsor-strip-status`: `not_requested → requested`; button label changes to "Requested" (pending); Nexus notified |
| **side-effects** | Notification sent to sponsor; audit log entry: `{action: 'sponsor_review_requested', by: userId, at: timestamp}`; analytics event |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-sponsor-strip-status` (updated to "Requested") |
| **loading-treatment** | Button shows loading spinner; "Requesting review..." text |
| **error-treatment** | "Could not send review request. Check sponsor is in the system." error toast; button state reverts |

---

### INT-WS-SS-02: Click "View Signoff" button

| Field | Value |
|---|---|
| **element-id** | `ws-sponsor-strip-action-btn` (when label = "View Signoff") |
| **trigger** | `click` |
| **action** | `panel-toggle` (opens signoff record panel/drawer) |
| **state-change** | Signoff record panel opens (drawer or modal); shows signoff timestamp, signatory, any notes |
| **side-effects** | none (read-only view) |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First focusable element in signoff panel |
| **loading-treatment** | Panel opens; signoff record loads within panel |
| **error-treatment** | "Could not load signoff record." message within panel |

---

## URL State Spec (W-3.4 — Shell-level URL behavior)

### Base URL

```
/strategic-moves/[moveId]
```

Where `[moveId]` is the move's database ID (UUID or slug).

### When `?phase=N` is appended

The `?phase=N` query parameter is appended **ONLY** in these cases:

1. **Attention banner click** — The portfolio dashboard shows attention banners ("2 Need Attention"). Clicking a banner navigates to `?phase=N` where N is the phase that needs attention.
2. **Shared URL** — When a user copies and shares the Workspace URL for a specific phase, they include `?phase=N`.
3. **Portfolio drill** — Clicking a phase context in the portfolio view navigates to `?phase=N`.

**Rail clicks do NOT add `?phase=N` to the URL.** Rail navigation is in-memory view switching, not URL navigation (D-10 resolution).

### After promote

When a user promotes the move to the next phase (e.g., P2→P3), the URL **updates** to `?phase=3` (or updates an existing `?phase=N` param). This IS a URL change because it reflects a state change in the move, not just a view change.

### Page reload

If the URL contains `?phase=N` when the page reloads, the page renders the Workspace at phase N in `current` view mode (if N is the current active phase) or in `past` view mode (if N is a past phase). The `?phase=N` param is preserved through reload.

### Browser back/forward

Since rail clicks do NOT push history, browser Back from within a rail-navigated view returns to the **previous page** entirely (not to the previous rail state). This is the correct behavior per D-10 — rail navigation should not pollute browser history.

---

## Self-QA

| Check | Status |
|---|---|
| All rail interactions documented (click past, future, active, tower) | PASS |
| Rail click URL behavior matches D-10 exactly | PASS — no history push for rail clicks |
| Promote URL update documented | PASS |
| All chat lane interactions documented | PASS |
| Sponsor strip interactions documented | PASS |
| Breadcrumb interaction documented | PASS |
| Keyboard equivalents specified for all interactive elements | PASS |
| Loading and error treatment for every async interaction | PASS |
| Focus targets specified | PASS |
