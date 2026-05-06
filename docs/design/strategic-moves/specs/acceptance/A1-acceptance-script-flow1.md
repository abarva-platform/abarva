# Acceptance Demo Script — Flow 1 (A-1)
## Strategic Moves · "Need Attention" Workspace Flow

| Field | Value |
|---|---|
| **Work Package** | A-1 |
| **Doc path** | `docs/design/strategic-moves/specs/acceptance/A1-acceptance-script-flow1.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Ready for execution (requires Step 8.2 — Workspace implementation) |
| **Companion script** | `A2-acceptance-script-flow2.md` |
| **Triggers** | Steps 8.1 ✅ + 8.2 (Workspace implementation complete) |
| **Estimated runtime** | Under 5 minutes |
| **Operator** | Claude Code (or Anand) |
| **Observer** | Anand |
| **Author** | Claude Code |

---

## Prerequisites

Before starting:

- [ ] Step 8.2 (Workspace implementation) merged to main
- [ ] Demo environment is running (Vercel preview or localhost)
- [ ] Signed in as demo user for **Apex Retail** tenant (`apex` client account, password `Demo2026!`)
- [ ] At least one Strategic Move for Apex Retail is in **P2 Diagnose** phase with `gateState: 'partial'` (amber status). See §Fixture Setup below.
- [ ] Browser dev tools open, console visible

---

## Fixture Setup

The following database state must be present before running this script. Configure via the admin seed or direct DB mutation.

### Program: Apex Retail Contact Center AI

| Field | Value |
|---|---|
| `engagements.program_title` | `"Contact Center AI"` |
| `engagements.current_phase` | `2` (P2 Diagnose) |
| `engagements.display_code` | `"APX-001"` |
| `engagements.status_key` | `"gate_blocked"` |
| `charter.sponsor_name` | `"Sarah Chen"` |
| `charter.primary_success_metric` | `"Average Handle Time (AHT) in minutes"` |
| `charter.value_range` | `"$2.8M–$4.2M [PRELIMINARY_ESTIMATE]"` |
| Gate criteria met | GC-P2-1 ✅, GC-P2-2 ✅, GC-P2-3 ✅, GC-P2-4 ✅, GC-P2-5 ❌ (baseline not closed) |
| `gateState` | `"partial"` |
| `statusColor` | `"amber"` |
| `statusText` | `"Gate partial"` |
| `statusDescription` | `"1 gate criterion outstanding"` |

**Result of setup:** APX-001 appears in "Need Attention" on the dashboard with amber color strip.

---

## Script

### Step 1 — Land on Strategic Moves dashboard

**Action:** Navigate to `/strategic-moves`.

**Expected output:**
- Page title "Strategic Moves" visible
- "+ New Move" button visible in top right
- Ribbon shows `needAttention` count ≥ 1, styled with attention color (amber/red tint)
- "Need Attention" row in ribbon shows a count ≥ 1

**Failure criteria:**
- Page shows 404 or blank
- Ribbon count shows 0 need attention
- "+ New Move" button missing

---

### Step 2 — Confirm "Need Attention" drilldown is visible

**Action:** Observe the Need Attention drilldown links below the ribbon (no interaction yet).

**Expected output:**
- At least one drilldown row is visible under the ribbon
- APX-001 row shows: `└─ APX-001 · [status description]`
- Row links to `/strategic-moves/[engagement-id]`
- The attention row appears above the Portfolio Map

**Failure criteria:**
- No drilldown rows appear despite `needAttention > 0` in ribbon
- Row links to wrong URL

---

### Step 3 — Click first Need Attention banner row → workspace opens

**Action:** Click the first Need Attention drilldown row (APX-001).

**Expected output:**
- Browser navigates to `/strategic-moves/[engagement-id]`
- Workspace loads with two-pane layout: chat left, canvas right
- Phase rail visible at top of canvas pane; P2 node is highlighted (active phase)
- Status banner in canvas pane is amber (not red, not green)
- Status banner text: "Gate partial" (or equivalent gate-partial description)
- P0 and P1 nodes in the phase rail are visually closed/completed
- P2 node in the phase rail has active/amber styling
- No JavaScript errors in console

**Failure criteria:**
- Page loads wrong move
- Phase rail shows incorrect active phase
- Status banner color does not match amber gating state
- Console errors on load

---

### Step 4 — Confirm Nexus first message matches Layer 5 spec

**Action:** Observe the Nexus first message in the chat pane (left side).

**Expected output (Variant B — gate partial, mid-P2):**

Nexus opening message must:
- Reference that APX-001 / Contact Center AI is in P2 Diagnose
- Identify which gate criteria are passing (4 of 5) and which is outstanding
- Reference Sarah Chen as the committed sponsor (from charter)
- Reference AHT as the primary success metric to baseline
- Suggest a starting point (e.g., "close the baseline panel" or "complete the P2.3 data readiness step")
- NOT assert any dollar value is validated (must show `[PRELIMINARY_ESTIMATE]` qualifier if citing the value range)
- NOT fabricate any diagnostic finding without evidence — Nexus must ask or surface what's known

**Exact spec reference:** `docs/design/strategic-moves/specs/workspace/05-first-messages-p2.md` — Variant B (mid-P2, gate partial).

**Failure criteria:**
- Nexus first message is a generic placeholder ("Ask me anything")
- Nexus cites a dollar figure without `[PRELIMINARY_ESTIMATE]`
- Nexus names a sponsor not found in the charter
- Nexus says "gate is ready" when it is partial

---

### Step 5 — Observe gate criteria in canvas pane

**Action:** Read the gate criteria list in the canvas pane.

**Expected output:**
- Gate criteria section shows 5 rows (GC-P2-1 through GC-P2-5)
- 4 rows have checkmark / complete styling
- 1 row (GC-P2-5 — baseline closed) has incomplete/missing styling
- Gate summary shows "4 of 5 criteria met" (or equivalent)

**Failure criteria:**
- Gate list shows 0 criteria
- All 5 criteria shown as met when fixture has 1 outstanding
- Gate summary count is wrong

---

### Step 6 — Click missing gate criterion

**Action:** Click the incomplete gate criterion (GC-P2-5 — baseline not closed).

**Expected output (per Layer 3 interactions spec `03-interactions-canvas-p2.md`):**
- Action drawer opens OR inline expansion reveals what is needed to close this criterion
- Drawer/expansion describes the evidence needed to close the baseline criterion
- Nexus chat pane updates with a message scoped to the selected criterion (Nexus responds to the gate-criterion click interaction)

**Note:** If the Workspace implementation uses an inline gate-criterion panel rather than a drawer, that is acceptable — check `03-interactions-canvas-p2.md` for the implemented interaction pattern.

**Failure criteria:**
- Click has no visible effect
- No Nexus response to gate criterion interaction
- Drawer opens for wrong criterion

---

### Step 7 — Simulate signoff (test fixture)

**Action:** In the test fixture, manually advance `GC-P2-5` to `passed` state (using admin or dev fixture tooling). If a "Simulate completion" dev button exists in the gate panel, use it.

**Expected output:**
- Gate criterion row GC-P2-5 visually updates to completed/checkmark styling
- Gate summary updates to "5 of 5 criteria met"
- Status banner transitions from amber to green (gate ready)
- "Promote to P3" (or equivalent promote action) becomes active/clickable
- Promote button is no longer disabled

**Failure criteria:**
- Gate criterion does not update reactively
- Gate summary count remains at 4 of 5
- Promote button remains disabled after all 5 criteria met
- Status banner does not change color

---

### Step 8 — Click Promote → P3 Design opens

**Action:** Click the "Promote to P3" (or equivalent promote) action button.

**Expected output:**
- Navigation or view transition occurs
- Canvas pane updates to P3 Design content
- Phase rail updates: P2 node visually closes; P3 node becomes active
- Nexus emits a P3 first message (rescope to P3 Design context)
- P3 first message matches Layer 5 spec Variant A ("just promoted from P2") from `05-first-messages-p3.md`
- P3 first message references the program name and notes P3 Design is beginning

**Failure criteria:**
- No navigation/transition occurs
- Phase rail still shows P2 as active
- Nexus does not emit a new first message for P3
- Wrong Nexus message variant (e.g., Variant B when Variant A is expected for fresh promotion)

---

### Step 9 — Verify URL behavior (D-10 resolution)

**Action:** Observe the URL before and after promotion.

**Expected behavior per D-10 resolution:**
- On initial navigation from the dashboard attention row, URL is `/strategic-moves/[engagement-id]` (no `?phase=N` query param from the rail click)
- After promotion from P2 → P3, the URL may include `?phase=3` (the promotion action emits a deep-link URL)
- Reloading the page with `?phase=3` in the URL reopens the workspace at P3
- Clicking P2 node in the phase rail (to review past phase) does NOT push `?phase=2` to browser history
- Only deep-link arrivals (attention banner, promotion event, shared URL) emit `?phase=N`

**Verification commands:**
1. Check URL after clicking attention banner → confirm no `?phase=N` appended at initial load
2. Complete promotion → confirm `?phase=3` is appended (or that the URL reflects new phase)
3. Press browser back → confirm landing is correct per D-10
4. Reload at `?phase=3` → confirm workspace opens at P3

**Failure criteria:**
- Rail clicks push `?phase=N` to browser history
- Reload does not preserve phase state when `?phase=N` is in URL
- No URL change whatsoever after promotion (acceptable if D-10 resolves to URL-stateless — check decision log)

---

### Step 10 — Verify P2 node visually closed in phase rail

**Action:** Observe the phase rail after promotion.

**Expected output:**
- P2 node in the phase rail has "completed/past" styling — distinct from the P3 active node
- P2 node is clickable (past phase view mode is accessible)
- Clicking P2 node opens the P2 canvas in "past view" (read-only) without changing the active phase
- P3 node has "current" styling

**Failure criteria:**
- P2 and P3 nodes are styled identically
- P2 node is no longer clickable after promotion
- Clicking P2 node navigates away from the workspace

---

## Pass criteria

The script passes if ALL of the following are true:

- [x] Steps 1–10 complete without error
- [x] Status banner correctly reflects amber → green transition in Step 7
- [x] Phase rail transitions correctly in Step 8 and Step 10
- [x] Nexus first messages in Steps 4 and 8 match the Layer 5 spec variants (checked against `05-first-messages-p2.md` and `05-first-messages-p3.md`)
- [x] URL behavior in Step 9 matches D-10 resolution
- [x] No unhandled JavaScript console errors during the run

---

## Fail actions

| Failure | Classification | Next step |
|---|---|---|
| Page 404 or blank | Blocker | Fix routing; re-run |
| Nexus first message is a placeholder | Blocker | Investigate agent route wiring for Workspace; compare with Originate implementation |
| Gate summary count wrong | Blocker | Fix gate criteria query; re-run |
| Promote button never enables | Blocker | Fix gate-state → button-disabled binding |
| Phase rail does not transition | Blocker | Fix phase rail reactive binding |
| URL not matching D-10 | Non-blocker | Verify D-10 decision log; document as v0.2 if accepted behavior differs |
| Minor visual styling difference | Non-blocker | Log as v0.2 polish item |

---

## References

- `docs/design/strategic-moves/specs/workspace/05-first-messages-p2.md` — P2 first-message variants
- `docs/design/strategic-moves/specs/workspace/05-first-messages-p3.md` — P3 first-message variants
- `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p2.md` — Gate criterion interaction
- `docs/design/strategic-moves/specs/workspace/03-interactions-url.md` — URL behavior (D-10)
- `docs/design/strategic-moves/specs/workspace/05-fixtures.md` — FX-W2-3 (gate-partial P2 fixture)
- `docs/design/strategic-moves/EXECUTION_PLAYBOOK.md §11.4` — High-level acceptance demo script (Demo A)
- `docs/design/strategic-moves/SPECS_AND_AGENT_TRAINING_WBS.md §12 D-10` — URL behavior decision
