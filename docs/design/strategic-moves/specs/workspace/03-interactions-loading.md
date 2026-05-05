# Workspace Loading and Error States — per-interaction UX

| | |
|---|---|
| **Work Package** | W-3.6 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-loading.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | Per-phase canvas interaction files · `03-interactions-shell.md` · `03-interactions-viewmodes.md` |
| **Author** | Claude Code |

---

## Overview

This document consolidates the loading and error state UX patterns across all Workspace interactions. It defines the patterns by interaction category, not by individual element — individual element treatments are in the per-interaction files. Use this document to ensure consistency across implementations.

---

## 1 · Loading state categories

### 1.1 Inline mutation (edit/save, gate toggle, attest)

**Trigger:** User saves a section, toggles a gate item, attests a panel.

**Loading treatment:**
- The triggering element (button or checkbox) shows a brief loading indicator (spinner or opacity change).
- The section/panel being saved shows a subtle "Saving..." text indicator.
- Duration: typically < 500ms. If longer: indicate with spinner.
- The element is disabled (non-interactive) while the mutation is in flight.

**Success treatment:**
- Loading indicator removes.
- Updated content is displayed.
- For section saves: edit mode closes; edit button re-appears.
- No toast on success — inline content update is sufficient feedback.

**Error treatment:**
- Inline error message adjacent to the element: "Could not save changes. Try again."
- For gate toggles: element reverts to pre-click state.
- No toast for inline mutations — keep error close to the element.

---

### 1.2 Full-canvas loading (view mode switch, phase promote)

**Trigger:** Rail click to past/future phase; promote/advance button click; page load with `?phase=N`.

**Loading treatment:**
- Canvas area shows **skeleton screens**: content shape placeholders for panels, sections, and chat messages.
- Skeleton screens animate (pulse/shimmer).
- Duration: typically 200–800ms depending on data fetch.
- Chat lane and canvas skeleton load simultaneously.
- Rail node transition animation (glow moves to new active node) triggers immediately; skeleton appears simultaneously.

**Success treatment:**
- Skeletons replaced by real content.
- For phase promote: canvas switches to new phase; chat lane rescopes to new phase context.
- For past/future mode: canvas shows phase-appropriate read-only content.

**Error treatment:**
- If past phase data fails: "Unable to load P{N} history. Try again." inline message in canvas area with a retry button.
- If future phase data fails: "Unable to load P{N} preview." inline message in canvas area.
- Skeleton replaced by error state; retry button focused.

---

### 1.3 Page-level loading (promote / handoff completion)

**Trigger:** Promote button or handoff button — these are significant state transitions.

**Loading treatment:**
- Full-canvas (or full-screen) loading overlay with text:
  - Promote P0→P1: "Promoting to P1 Charter..."
  - Promote P1→P2: "Advancing to P2 Diagnose..."
  - Promote P2→P3: "Advancing to P3 Design Future State..."
  - Promote P3→P4: "Advancing to P4 Roadmap & Business Case..."
  - Promote P4→P5: "Advancing to P5 Mobilize & Handoff..."
  - Handoff: "Completing Tower handoff..."
- Rail animation: active node transitions to new phase during loading.
- Duration: typically 1–3s (gate evaluation + DB writes).
- User cannot interact with canvas during this state.

**Success treatment:**
- Loading overlay removes.
- New phase canvas appears.
- Chat lane rescopes to new phase.
- URL updates (see `03-interactions-url.md`).

**Error treatment:**
- If gate evaluation fails: "Gate requirements not met. Review criteria." Banner or modal; gate panel scrolled into view and highlighted.
- If network/server error: "Could not advance phase. Try again." error toast; state reverts to pre-promote state; URL unchanged.

---

### 1.4 Chat message send (Nexus response)

**Trigger:** User sends a message to Nexus via `ws-chat-send-button` or Enter key.

**Loading treatment:**
- User's message appears immediately in `ws-chat-message-list` (optimistic append).
- Nexus "typing indicator" bubble appears (three dots / pulse animation).
- `ws-chat-input-field` is NOT disabled — user can start composing the next message.
- `ws-chat-send-button` is disabled until the current response is complete (to prevent message queue collisions) OR is allowed per streaming behavior (product decision; spec the default as: send button re-enables after message sent, not after response received).

**Success treatment:**
- Nexus message replaces typing indicator.
- Chat scrolls to the new Nexus message.

**Error treatment:**
- If send fails: "Unable to send message. Try again." toast.
- User's message remains in input field (not lost).
- Typing indicator removed.

---

### 1.5 File upload (artifact shelf)

**Trigger:** User selects a file via `ws-canvas-p{N}-artifact-shelf-upload-btn`.

**Loading treatment:**
- Upload progress indicator within the artifact shelf area (progress bar or spinner).
- Artifact shelf still shows existing tiles; new tile appears as a placeholder during upload.
- Duration: variable (file size dependent).

**Success treatment:**
- Placeholder tile becomes the real artifact tile.
- No toast on success — the tile appearing is the confirmation.

**Error treatment:**
- "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." inline error adjacent to upload button.
- Placeholder tile removed.

---

### 1.6 Notification dispatch (sponsor signoff, review request)

**Trigger:** Sponsor signoff request, business case approve, review request button.

**Loading treatment:**
- Button shows spinner; label changes to "Sending..." or "Requesting...".
- Duration: typically < 1s.

**Success treatment:**
- Button label changes to "Requested" / "Sent" (permanent confirmation state).
- Element may become non-interactive after success (request is a one-time action).

**Error treatment:**
- "Could not send request. Check that sponsor is in the system." error toast.
- Button state reverts to pre-click state.

---

## 2 · Error state catalog

| Error type | Element | Message | User action |
|---|---|---|---|
| Inline save failure | Section edit mode | "Could not save changes. Try again." | Retry button inline |
| Gate toggle failure | Gate item | "Could not update gate item. Try again." | Retry (re-click) |
| Past phase load failure | Canvas area | "Unable to load P{N} history. Try again." | Retry button |
| Future phase load failure | Canvas area | "Unable to load P{N} preview." | Retry button |
| Phase promote failure (gate) | Gate panel | "Gate requirements not met. Review criteria." | Gate panel in view |
| Phase promote failure (network) | Toast | "Could not advance phase. Try again." | State reverts |
| Handoff failure | Toast | "Could not complete handoff. Try again." | State reverts |
| Chat send failure | Toast | "Unable to send message. Try again." | Message preserved in input |
| File upload failure | Shelf area | "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." | Retry upload |
| Signoff request failure | Toast | "Could not send request. Check sponsor is in the system." | Button reverts |
| Tower acceptance submit failure | Toast | "Could not submit to Tower. Try again." | Button reverts |
| Artifact open failure | Panel | "Could not load artifact." | Retry within panel |
| Signoff record load failure | Panel | "Could not load signoff record." | Retry within panel |

---

## 3 · Loading skeleton spec

### 3.1 Canvas skeleton

When the canvas area is loading (rail click, page load, promote transition), each canvas panel shows a skeleton:

- Panel container: full width, visible border/card shape.
- Panel header: skeleton bar (~60% width, ~16px height).
- Content rows: 2–4 skeleton rows (varying width: 100%, 80%, 95%, 70%) at ~12px height with ~8px spacing.
- Panel action area: skeleton button shape (~80px wide).

### 3.2 Chat lane skeleton

- `ws-chat-message-list`: 3–5 skeleton message bubbles (alternating left/right to suggest conversation structure).
- `ws-chat-input-area`: always visible and interactive during canvas load (chat lane is independent of canvas data load).

### 3.3 Rail transitions

Rail nodes show an animated glow/pulse on the newly active node during a phase transition. Connectors fill in when the transition completes. This is not a loading skeleton — it is a success animation.

---

## 4 · Toast notifications

Toasts are used for async errors that are not inline-contextual (network errors, dispatch failures). They should:

- Appear at a fixed position (top-right or bottom-center — implementation decision; not specified here at L3).
- Auto-dismiss after 5 seconds OR on user dismissal (✕ button).
- Be role="alert" / aria-live="assertive" for screen readers.
- NOT be used for success states of non-critical actions (inline confirmation is preferred).

---

## Self-QA

| Check | Status |
|---|---|
| All loading state categories documented (6 categories) | PASS |
| Error catalog covers all async operations | PASS |
| Chat send loading treatment specified (optimistic append + typing indicator) | PASS |
| Phase promote loading treatment (full-canvas overlay + text) specified | PASS |
| Skeleton spec for canvas and chat documented | PASS |
| Toast behavior documented | PASS |
| File upload progress treatment documented | PASS |
| Error state user-action column specified for all errors | PASS |
