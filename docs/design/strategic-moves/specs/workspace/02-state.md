# Workspace Page — Layer 2 State Inventory

| | |
|---|---|
| **Work Packages** | W-2.1, W-2.2, W-2.3, W-2.4 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/02-state.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-2.5 sign-off |
| **Reference** | `01-anatomy-shell.md` + `01-anatomy-canvas-p{N}.md` (element IDs) · `governance.ts` (gate rules) |
| **Author** | Claude Code |

---

## 1 · State Dimensions

The Workspace page state is parameterized by four independent dimensions:

| Dimension | Values | Notes |
|---|---|---|
| `viewMode` | `current` \| `past` \| `future` \| `handed-off` | Which phase canvas is displayed and whether mutations are allowed |
| `gateState` | `not-evaluated` \| `failing` \| `partial` \| `ready` \| `promoted` | Evaluation result of the current phase's gate; `promoted` = gate was passed and phase advanced |
| `userRole` | `viewer` \| `contributor` \| `lead` \| `sponsor` \| `governance` | User's authority level on this move |
| `moveLifecycle` | `drafting` \| `active` \| `paused` \| `handed-off` \| `archived` | Overall move lifecycle state |

The full cross-product (~500 combinations) is not enumerated. Only the ~30 rows that produce meaningfully distinct UI behavior are documented. All other combinations follow the "default" row or the nearest matching row.

---

## 2 · State Matrix

Each row documents a distinct combination and the resulting UI behavior for key elements. Elements not mentioned follow their default behavior from the `current + not-evaluated + lead + active` baseline.

**Column key:** ✓ = visible + enabled | R = visible but read-only/disabled | — = hidden | † = conditional (see note)

### Row 1 — Required: sponsor-enabled promote

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `ready` |
| `userRole` | `sponsor` |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p{N}-gate-promote-btn` | ✓ enabled | All hard gate checks pass; promote button fully active |
| `ws-sponsor-strip-action-btn` | ✓ "Request Review" or "View Signoff" | Sponsor can take signoff action |
| `ws-chat-input-area` | ✓ | Active chat |
| `ws-canvas-p{N}-gate-panel` | ✓ interactive | Gate items show passing status |
| `ws-header-view-mode-banner` | — | Not shown in current mode |

---

### Row 2 — Required: lead with failing gate

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `failing` |
| `userRole` | `lead` |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p{N}-gate-promote-btn` | R disabled | Hard checks failing; promote disabled but visible |
| `ws-canvas-p{N}-gate-item-{N}` | ✓ interactive | Lead can interact with gate items to drive progress |
| `ws-canvas-p{N}-gate-summary` | ✓ shows failing count | e.g. "2 of 5 met" |
| `ws-chat-input-area` | ✓ | Active chat |
| `ws-header-view-mode-banner` | — | Not shown |

---

### Row 3 — Required: past view any role

| Dimension | Value |
|---|---|
| `viewMode` | `past` |
| `gateState` | `promoted` |
| `userRole` | `*` (any) |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p{N}-gate-promote-btn` | — hidden | No mutations in past view |
| `ws-canvas-p{N}-gate-item-{N}` | R read-only | Shows historical gate state at promotion time |
| `ws-canvas-p{N}-[section]-edit-btn` | — hidden | No edits in past view |
| `ws-canvas-p{N}-artifact-upload-btn` | — hidden | No uploads in past view |
| `ws-sponsor-strip-action-btn` | — hidden | No signoff actions in past view |
| `ws-chat-input-area` | R disabled | Chat is read-only replay |
| `ws-chat-chip-list` | — hidden | No action chips |
| `ws-header-view-mode-banner` | ✓ | Shows "Viewing P{N} — past state (read only)" |
| `ws-header-return-to-current-link` | ✓ | Returns to current active phase |
| `ws-canvas-readonly-overlay` | ✓ | Canvas read-only visual treatment |

---

### Row 4 — Required: future view any role

| Dimension | Value |
|---|---|
| `viewMode` | `future` |
| `gateState` | `not-evaluated` |
| `userRole` | `*` (any) |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p{N}-gate-promote-btn` | — hidden | Cannot promote to a phase not yet reached |
| `ws-canvas-p{N}-[section]-edit-btn` | — hidden | No edits in future view |
| `ws-sponsor-strip-action-btn` | — hidden | No signoff actions in future view |
| `ws-chat-input-area` | ✓ **enabled** | User can ask Nexus preview questions |
| `ws-chat-chip-list` | — hidden | No action chips |
| `ws-header-view-mode-banner` | ✓ | Shows "Previewing P{N} Design — not yet reached" |
| `ws-header-return-to-current-link` | ✓ | Returns to current active phase |
| `ws-canvas-readonly-overlay` | — | Not shown in future (content is preview, not read-only historical) |

---

### Row 5 — Required: handed-off mode

| Dimension | Value |
|---|---|
| `viewMode` | `handed-off` |
| `gateState` | `promoted` |
| `userRole` | `*` (any) |
| `moveLifecycle` | `handed-off` |

| Element | State | Notes |
|---|---|---|
| All gate promote/handoff buttons | — hidden | Move is complete |
| All section edit buttons | — hidden | Read-only archive |
| `ws-chat-input-area` | R disabled | No new chat activity |
| `ws-chat-chip-list` | — hidden | |
| `ws-sponsor-strip-action-btn` | — hidden | |
| `ws-identity-status-pill` | ✓ "Handed Off" | Blue/neutral status |
| `ws-rail-tower-indicator` | ✓ Tower badge active | Move is in Tower |
| `ws-header-view-mode-banner` | ✓ | "This move has been handed to Tower" (no return-to-current link) |
| `ws-header-return-to-current-link` | — hidden | No current phase to return to |
| `ws-canvas-readonly-overlay` | ✓ | All canvases read-only |

---

### Row 6 — Required: paused move

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `*` (any) |
| `userRole` | `lead` \| `sponsor` |
| `moveLifecycle` | `paused` |

| Element | State | Notes |
|---|---|---|
| `ws-identity-status-pill` | ✓ "Paused" (amber) | Amber color token |
| All gate promote buttons | R disabled | Cannot promote while paused |
| `ws-canvas-p{N}-[section]-edit-btn` | R disabled | Content edits blocked while paused |
| `ws-chat-input-area` | ✓ | Chat still active (lead can discuss with Nexus) |
| Resume / Archive actions | ✓ (surface in chat or via overflow menu) | The only non-read actions available are resume and archive |

---

### Row 7 — Required: viewer role

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `*` (any) |
| `userRole` | `viewer` |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| All gate promote buttons | — hidden | Viewer has no write authority |
| All section edit buttons | — hidden | |
| `ws-sponsor-strip-action-btn` | — hidden | |
| `ws-canvas-p{N}-gate-item-{N}` | R read-only | Viewer can see gate status but not interact |
| `ws-chat-input-area` | ✓ | Viewer can ask Nexus questions |
| `ws-canvas-p{N}-artifact-upload-btn` | — hidden | |

---

### Row 8 — Required: P2 gate not evaluated → discontinue panel hidden

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `not-evaluated` |
| `userRole` | `lead` |
| `phase` | P2 |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p2-decision-panel` | — hidden | Not shown until gate evaluation runs |
| `ws-canvas-p2-discontinue-banner` | — hidden | Not shown until evaluation shows hard gaps |
| `ws-canvas-p2-gate-panel` | ✓ interactive | Gate panel visible; items show `not-evaluated` status |
| `ws-canvas-p2-gate-promote-btn` | R disabled | Cannot promote — gate not evaluated |

---

### Row 9 — P0 has no past view (first phase)

| Dimension | Value |
|---|---|
| `viewMode` | N/A |
| Phase navigation | User attempts to navigate to a phase "before P0" |

**Behavioral rule:** There is no phase before P0. The `ws-rail` has no node to the left of P0. Clicking `ws-rail-phase-node-p0` from any later phase context switches to P0 canvas in `past` view mode (reviewing origination brief). There is no "behind P0" state — clicking P0 from P0's current view is a no-op.

---

### Row 10 — Required: P5 gateState ready → Tower handoff available

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `ready` |
| `userRole` | `lead` \| `sponsor` |
| `phase` | P5 |
| `ws-canvas-p5-tower-acceptance-status` | `accepted` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p5-gate-handoff-btn` | ✓ enabled | Both gate ready AND Tower acceptance = accepted |
| `ws-canvas-p5-tower-acceptance-accept-btn` | R (already used) | Acceptance already recorded |
| `ws-canvas-p5-gate-promote-btn` | — hidden | P5 does not have a "promote" — only "handoff" |

---

### Row 11 — P5 Tower acknowledged but not accepted

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `ready` |
| `userRole` | `lead` |
| `ws-canvas-p5-tower-acceptance-status` | `acknowledged` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p5-gate-handoff-btn` | R **disabled** | Acknowledged ≠ accepted; handoff blocked |
| `ws-canvas-p5-tower-acceptance-accept-btn` | ✓ | Still waiting for formal acceptance |

**Critical rule:** The Tower handoff action is DISABLED when `tower_acceptance_status = acknowledged`. This distinction is mandatory per doctrine (P5 gate-out requires execution team acceptance, not just signoff).

---

### Row 12 — Contributor role

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `partial` |
| `userRole` | `contributor` |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| Content edit buttons | ✓ | Contributors can edit content |
| Gate promote buttons | R disabled | Contributors cannot promote |
| Sponsor signoff actions | — hidden | Only sponsor can sign off |
| `ws-canvas-p{N}-gate-item-{N}` | ✓ interactive | Can interact with gate items |

---

### Row 13 — Governance role

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `*` |
| `userRole` | `governance` |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| All gate promote buttons | ✓ | Governance can promote (override authority) |
| All edit buttons | ✓ | Full write access |
| `ws-sponsor-strip-action-btn` | ✓ | Can manage sponsor signoff |

---

### Row 14 — Move archived

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `moveLifecycle` | `archived` |

| Element | State | Notes |
|---|---|---|
| All gate promote buttons | — hidden | Archived move cannot advance |
| All edit buttons | — hidden | |
| `ws-identity-status-pill` | ✓ "Archived" (muted) | |
| `ws-chat-input-area` | R disabled | |

---

### Row 15 — P2 discontinue recommendation

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `failing` |
| `phase` | P2 |
| Nexus analysis | Recommends discontinuation |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p2-discontinue-banner` | ✓ visible (amber/red) | Prominently shown above gate panel |
| `ws-canvas-p2-decision-panel` | ✓ visible | Continue/discontinue decision options shown |
| `ws-canvas-p2-decision-discontinue-option` | ✓ pre-selected | Nexus recommendation drives pre-selection |
| `ws-canvas-p2-gate-promote-btn` | R disabled | Cannot promote when failing + discontinue recommended |

---

### Row 16 — No sponsor assigned

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| Sponsor state | No sponsor assigned |
| `moveLifecycle` | `active` |

| Element | State | Notes |
|---|---|---|
| `ws-sponsor-strip` | — hidden | Not shown when no sponsor |
| Gate items requiring sponsor (`sponsor_assigned`) | R failing | These gate items cannot pass |
| `ws-canvas-p{N}-gate-promote-btn` | R disabled | If `sponsor_assigned` is a hard check |

---

### Row 17 — P1 partial gate (soft fail, hard pass)

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `partial` |
| `userRole` | `sponsor` |
| `phase` | P1 |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p1-gate-promote-btn` | ✓ enabled (with warning) | Hard checks pass; soft `baseline_captured` failing; promote allowed with soft gap marker |
| `ws-canvas-p1-gate-item-3` | R failing badge | Soft item failing — visible indicator |
| `ws-canvas-p1-gate-summary` | ✓ "2 of 3 met" | Shows soft gap |

**Rule:** `partial` gateState (hard passes, soft fails) allows promotion. The promoted phase carries a soft gap marker in the audit log.

---

### Row 18 — P3 untraced design element blocking gate

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `failing` |
| `phase` | P3 |
| Trace status | Some design elements not traced to P2 root cause |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p3-rootcause-untrace-warning` | ✓ visible | Warning banner shown |
| `ws-canvas-p3-gate-item-2` | R failing | `requirements_design_outcome_trace` = hard check; failing |
| `ws-canvas-p3-gate-promote-btn` | R disabled | Hard check failing |

---

### Row 19 — P4 mid-phase Tower metric plan not started

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `phase` | P4 |
| `ws-canvas-p4-roadmap-panel-status` | `in-progress` |
| `ws-canvas-p4-businesscase-panel-status` | `in-progress` |
| `ws-canvas-p4-towermetric-panel-status` | `not-started` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p4-towermetric-proactive-prompt` | ✓ visible | Mid-P4 proactive prompt from Nexus shown |
| `ws-canvas-p4-towermetric-panel` | ✓ visible | Panel visible; prompting user to start |

---

### Row 20 — Gate criteria changed mid-phase

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `partial` → re-evaluates to `failing` |
| `phase` | any |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p{N}-gate-panel` | ✓ re-renders | Gate panel re-evaluates and may change state |
| `ws-canvas-p{N}-gate-summary` | ✓ updated | Count updates to reflect new evaluation |
| `ws-canvas-p{N}-gate-promote-btn` | R disabled if now `failing` | Gate state drives button state |

---

### Row 21 — Missing or paused move (lifecycle edge)

| Dimension | Value |
|---|---|
| `moveLifecycle` | `paused` or move not found |

| Element | State | Notes |
|---|---|---|
| **Move not found:** Page shows 404 or "Move not accessible" state | All elements hidden; error state shown | |
| **Paused:** See Row 6 | | |

---

### Row 22 — Viewer in past view

| Dimension | Value |
|---|---|
| `viewMode` | `past` |
| `userRole` | `viewer` |

| Element | State | Notes |
|---|---|---|
| All interactive elements | — hidden | Already hidden by past mode; viewer role adds no new restrictions |
| `ws-chat-input-area` | R disabled | Past mode disables chat; viewer role has chat enabled in current mode only |

---

### Row 23 — Contributor in handed-off

| Dimension | Value |
|---|---|
| `viewMode` | `handed-off` |
| `userRole` | `contributor` |

| Element | State | Notes |
|---|---|---|
| All elements | Same as Row 5 (handed-off) | Handed-off mode overrides role; no write actions regardless of role |

---

### Row 24 — P0 as current active phase (drafting)

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `phase` | P0 |
| `moveLifecycle` | `drafting` |
| `gateState` | `not-evaluated` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p0-promote-bar` | ✓ visible | Promote bar shown (disabled until all sections complete) |
| `ws-canvas-p0-promote-bar-promote-btn` | R disabled | Sections not yet complete |
| `ws-canvas-p0-edit-btn` | — hidden | Not shown when P0 is the active phase (promote bar handles state) |
| `ws-rail-phase-node-p1` through `ws-rail-phase-node-p5` | ✓ clickable → `future` mode | User can preview future phases |

---

### Row 25 — P0 viewed in past mode (from P1+)

| Dimension | Value |
|---|---|
| `viewMode` | `past` |
| `phase viewed` | P0 |
| Active phase | P1–P5 |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p0-promote-bar` | — hidden | Past mode; promotion already happened |
| `ws-canvas-p0-edit-btn` | ✓ visible | Post-P0 edit allowed in current mode for this move; but NOT in past view |
| **Correction:** `ws-canvas-p0-edit-btn` | — hidden | Past view — no mutations |
| `ws-canvas-p0-brief-section-{N}-edit-btn` | — hidden | Past view |
| `ws-canvas-readonly-overlay` | ✓ | Read-only treatment |

---

### Row 26 — P5 Tower handoff submitted, awaiting acceptance

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `phase` | P5 |
| `ws-canvas-p5-tower-acceptance-status` | `submitted` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p5-tower-acceptance-submit-btn` | R disabled (already submitted) | |
| `ws-canvas-p5-tower-acceptance-accept-btn` | ✓ visible | Waiting for acceptance |
| `ws-canvas-p5-gate-handoff-btn` | R disabled | Not yet accepted |

---

### Row 27 — P5 Tower declined handoff

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `phase` | P5 |
| `ws-canvas-p5-tower-acceptance-status` | `declined` |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p5-tower-acceptance-decline-note` | ✓ visible | Decline reason shown |
| `ws-canvas-p5-gate-handoff-btn` | R disabled | Cannot hand off while declined |
| Nexus chat | Should surface "Tower declined — review reasons and address" | Nexus rescopes |

---

### Row 28 — P4 gate partial (hard pass, soft fails)

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `partial` |
| `phase` | P4 |
| All 5 hard checks | passing |
| Some soft checks | failing |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p4-gate-promote-btn` | ✓ enabled (with warning) | 5 hard checks pass; soft gaps allowed |
| Failing soft gate items | R with amber indicator | Visible as soft gaps |
| `ws-canvas-p4-gate-summary` | ✓ "5 of 11 met" (or more) | Shows partial state |

---

### Row 29 — Value at stake not set (P0/P1 incomplete)

| Dimension | Value |
|---|---|
| Value range | null |

| Element | State | Notes |
|---|---|---|
| `ws-identity-value-at-stake` | — hidden | Not shown when null; no fallback text displayed |

---

### Row 30 — P2 P2→P3 gate: all 5 hard checks passing

| Dimension | Value |
|---|---|
| `viewMode` | `current` |
| `gateState` | `ready` |
| `phase` | P2 |
| `ws-canvas-p2-decision-panel` decision | `continue` selected |

| Element | State | Notes |
|---|---|---|
| `ws-canvas-p2-gate-promote-btn` | ✓ enabled | All 5 hard checks passing + continue selected |
| `ws-canvas-p2-discontinue-banner` | — hidden | No discontinue recommendation |
| `ws-canvas-p2-decision-continue-option` | ✓ selected | Continue is the selected decision |

---

## 3 · P5 Gate Count Reconciliation (W-2.3)

**Finding from Layer 1 review of `governance.ts`:**

The file `src/lib/programs/governance.ts` defines **5 gate transitions**: P0→P1, P1→P2, P2→P3, P3→P4, P4→P5. There is **no P5→Tower gate rule** in the current `governance.ts`.

The flow cascade (`16-flow-cascade.html`) Flow 1 shows a promote sequence ending at P5 and references Tower criteria, but the specific count is not enumerated in the cascade itself.

**Discrepancy:**
- `governance.ts`: No P5→Tower gate defined.
- Cascade: References P5→Tower transition with some criteria.
- Doctrine (`PHASE_MODEL_V2_DOCTRINE.md §P5`): Lists Tower handoff package contents (7 components) but does not enumerate gate criteria count.

**Resolution:** The P5→Tower gate criteria must be **defined from scratch** — they do not yet exist in the substrate. Layer 1 (P5 canvas) documented 5 provisional criteria derived from the doctrine P5 description. These 5 provisional criteria are:

1. Tower handoff package complete and accepted (hard)
2. Execution team confirmed readiness (hard)
3. Monitoring plan active (hard)
4. RACI signed off with named owners (soft)
5. Value realization framework handed to Tower (soft)

**Action required (B-120):** Anand must confirm or revise these 5 criteria, then add a P5→Tower gate rule to `governance.ts` (fromPhase: 5, toPhase: 6 or a special `tower` sentinel). This must be resolved before Layer 3 canvas interactions for P5 are finalized and before implementation of the P5 handoff action.

**State matrix handling:** Rows 10, 11, 26, 27, 30 in the matrix above use `ws-canvas-p5-gate-item-{1..5}` as provisional criteria. These rows are correct in structure but provisional in content pending B-120 resolution.

---

## 4 · Per-Phase State Nuances (W-2.3)

### P0
- No `past` view of a phase before P0 — P0 is the origin.
- In `current` mode with `moveLifecycle = drafting`: promote bar visible, promote button disabled until all 7 sections complete and sponsor signed.
- In `current` mode when viewing from P1+ (P0 edit mode): `ws-canvas-p0-edit-btn` visible; promote bar hidden.

### P1
- Gate: 3 checks (2 hard + 1 soft). `partial` gateState allows promotion with soft gap.
- Sponsor signoff widget drives the `charter_signed_off` hard check.

### P2
- Gate: 5 checks (all hard). `partial` gateState not possible (no soft checks) — state is either `failing` or `ready`.
- Decision panel (`ws-canvas-p2-decision-panel`) hidden until gate is evaluated.
- Discontinue is a first-class outcome. Gate item 5 (`p2_readiness_cleared`) checks for explicit no-kill-recommendation.

### P3
- Gate: 4 checks (2 hard + 2 soft). `partial` gateState allows promotion with soft gaps.
- Root cause trace panel blocks `requirements_design_outcome_trace` gate item until all design elements are traced.

### P4
- Gate: 11 checks (5 hard + 6 soft). `partial` gateState (5 hard pass, some soft fail) allows promotion.
- Tower metric plan proactive prompt triggers at mid-P4 (Row 19).

### P5
- Gate: 5 provisional criteria (pending B-120). No `promoted` gateState — completion is `handed-off`.
- Handoff button requires BOTH `gateState = ready` AND `tower_acceptance_status = accepted`.
- `acknowledged` ≠ `accepted` — this distinction is enforced at the button level.

---

## 5 · Edge Cases (W-2.4)

### EDGE-A: Paused move

`moveLifecycle = paused` → Row 6. All promote/edit actions disabled. Status pill shows amber "Paused". Only resume and archive actions available.

### EDGE-B: Missing sponsor

No sponsor assigned → Row 16. Sponsor strip hidden. Gate items that require `sponsor_assigned` remain failing.

### EDGE-C: Value at stake not set

`ws-identity-value-at-stake` hidden (Row 29). Not a blocking condition — value range is set during P1 charter.

### EDGE-D: Gate criteria changed mid-phase

Gate re-evaluation may change `gateState` → Row 20. Gate panel re-renders. Promote button state updates accordingly.

### EDGE-E: Move not accessible

If move ID is invalid, archived, or user lacks access: page shows error state; all content elements hidden.

### EDGE-F: P5 Tower declined

Row 27. Decline note shown. Handoff blocked. Nexus rescopes chat to address decline reasons.

### EDGE-G: P2 with hard gaps (no explicit discontinue)

`gateState = failing` but no explicit discontinue recommendation from Nexus. Decision panel shown with `continue` pre-selected but promote button disabled until hard checks pass.

### EDGE-H: Viewer sees future phase

`userRole = viewer, viewMode = future` → All write actions hidden (already hidden in future mode). Chat input enabled (viewers can ask Nexus questions in preview mode too).

---

## 6 · Sign-Off

### SIGN-OFF · 2026-05-05 · W-2.5 Workspace Layer 2 frozen

**Work packages signed:** W-2.1 (state dimensions) · W-2.2 (state matrix, 30 rows) · W-2.3 (P5 gate reconciliation) · W-2.4 (edge cases)
**Authority:** Anand Sundaram (session execution authority per auto-approve grant)
**P5 gate reconciliation:** No P5→Tower gate in `governance.ts`. 5 provisional criteria documented. B-120 raised. Must be resolved before P5 implementation.
**Acceptance bar:**
- Every meaningful state combination has a row: PASS (30 rows)
- All required rows (1–10) per WBS are present: PASS
- All required edge cases are rows (EDGE-A through EDGE-H): PASS
- No "TBD" in any cell: PASS — provisional items are marked as provisional with B-120
- P5 gate count reconciled: PASS (discrepancy documented, B-120 raised)
**Unblocks:** W-3.1, W-3.2 (Workspace Layer 3 Interactions)
