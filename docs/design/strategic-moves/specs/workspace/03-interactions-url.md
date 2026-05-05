# Workspace URL State Spec — ?phase=N behavior and deep-link handling

| | |
|---|---|
| **Work Package** | W-3.4 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-url.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `03-interactions-shell.md` (URL state spec, D-10 resolution) · `02-state.md` (URL state column) |
| **Author** | Claude Code |

---

## Overview

This document is the canonical URL behavior spec for the Workspace page. It consolidates the D-10 resolution from `03-interactions-shell.md` and provides the complete reference for how `?phase=N` is added, read, preserved, and ignored.

---

## 1 · Base URL structure

```
/strategic-moves/[moveId]
```

Where `[moveId]` is the move's database ID (UUID or slug). The base URL always resolves to the move Workspace. Without a `?phase=N` param, the page renders at the current active phase in `current` view mode.

---

## 2 · When `?phase=N` IS added or updated

### 2.1 After promote/advance (phase transition)

When the user clicks a promote/advance button and the gate evaluation succeeds, the URL **updates** to `?phase=N+1`.

| Promote action | URL result |
|---|---|
| P0 promote → P1 | `?phase=1` |
| P1 advance → P2 | `?phase=2` |
| P2 promote → P3 | `?phase=3` |
| P3 promote → P4 | `?phase=4` |
| P4 promote → P5 | `?phase=5` |
| P5 handoff → Tower | No URL change (moveLifecycle changes; route stays at `?phase=5` or base) |

URL update on promote is a `pushState` — it IS a browser history entry. Browser Back after a promote returns to the previous phase URL (or base URL if this was the first promote from the base URL).

### 2.2 Attention banner click from portfolio

When the user clicks an attention banner in the portfolio dashboard (e.g., "2 moves need attention"), the navigation target is `?phase=N` where N is the phase that needs attention.

### 2.3 Shared URL / deep link

When a user explicitly copies the URL from the browser address bar (with `?phase=N`) and shares it, the recipient lands at the Workspace rendered at phase N.

### 2.4 Portfolio phase drill

Clicking a phase context item in the portfolio view (e.g., a phase-specific card or link) navigates to `?phase=N`.

---

## 3 · When `?phase=N` is NOT added

### 3.1 Rail clicks

Rail clicks (`ws-rail-phase-node-p{N}`) do NOT push to URL history and do NOT add `?phase=N` to the URL. This is the D-10 resolution. Rail navigation is **in-memory view switching** only.

**Rationale:** If rail clicks pushed URL history, every exploration of past phases would pollute Browser Back, making it unintuitive. The user expects Browser Back to return to the previous page, not to the previous rail state.

### 3.2 View mode banner "Return to Current" click

Returning to current via the banner link does not change the URL (it was not changed when entering past/future mode, so no change is needed on return).

### 3.3 Any non-promote canvas interactions

Section edits, gate item toggles, artifact uploads, chat messages — none of these change the URL.

---

## 4 · URL on page load / reload

### 4.1 No `?phase=N` param

Page renders the Workspace at the current active phase in `current` view mode.

### 4.2 `?phase=N` where N = current active phase

Page renders in `current` view mode for phase N (normal working state).

### 4.3 `?phase=N` where N < current active phase (past phase)

Page renders in `past` view mode for phase N. The view mode banner is shown. `ws-header-return-to-current-link` is visible.

### 4.4 `?phase=N` where N > current active phase (future phase)

Page renders in `future` view mode for phase N. The view mode banner is shown.

### 4.5 `?phase=N` where N is invalid (out of range)

Page falls back to current active phase in `current` view mode. Invalid `?phase` param is silently ignored (no error page).

---

## 5 · Browser Back / Forward behavior

| Action | Browser Back result |
|---|---|
| Promoted P0→P1 (URL now `?phase=1`) | Returns to base URL or `?phase=0` (pre-promote state) |
| Navigated to Workspace via attention banner (`?phase=2`) | Returns to portfolio page |
| Clicked P2 rail node (no URL change) | Returns to **previous full page** (pre-Workspace URL) |
| Used Return to Current link (no URL change) | Returns to previous full page |

Since rail clicks do not push history, Browser Back from within a rail-navigated session exits the Workspace entirely (or returns to the URL that was current when the session started). This is intentional per D-10.

---

## 6 · URL state and SSR / hydration

When a request arrives at the server with `?phase=N`, the server renders the correct view mode and phase content. The client then hydrates with the same state. No flash of wrong phase should occur.

| Concern | Treatment |
|---|---|
| SSR with `?phase=N` past | Server renders past view mode skeleton; client hydrates with full conversation replay |
| SSR with `?phase=N` future | Server renders future view mode skeleton; client hydrates with Nexus preview message |
| SSR with `?phase=N` current | Server renders active phase content; standard hydration |

---

## 7 · Canonical URL determination

For sharing purposes, the canonical URL for a move at a specific phase is:

```
/strategic-moves/[moveId]?phase=N
```

The canonical URL for the current working state (always follows active phase):

```
/strategic-moves/[moveId]
```

A "Copy link to this phase" action (if exposed) should produce `?phase=N` for the phase currently shown on screen.

---

## Self-QA

| Check | Status |
|---|---|
| All cases where ?phase=N IS added documented | PASS |
| All cases where ?phase=N is NOT added documented | PASS |
| Rail click D-10 resolution stated with rationale | PASS |
| Page load behavior for all ?phase=N variants documented | PASS |
| Invalid ?phase fallback documented | PASS |
| Browser Back behavior per action documented | PASS |
| SSR / hydration notes included | PASS |
| Canonical URL determination documented | PASS |
