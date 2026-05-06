# Acceptance Demo Script — Flow 2 (A-2)
## Strategic Moves · "New Move" Origination Flow

| Field | Value |
|---|---|
| **Work Package** | A-2 |
| **Doc path** | `docs/design/strategic-moves/specs/acceptance/A2-acceptance-script-flow2.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Ready for execution (Step 8.1 complete) |
| **Companion script** | `A1-acceptance-script-flow1.md` |
| **Trigger** | Step 8.1 ✅ (Originate implementation complete) |
| **Estimated runtime** | Under 5 minutes |
| **Operator** | Claude Code (or Anand) |
| **Observer** | Anand |
| **Author** | Claude Code |

---

## Prerequisites

Before starting:

- [ ] Step 8.1 (Originate implementation) merged to main ✅
- [ ] Demo environment is running (Vercel preview or localhost)
- [ ] Signed in as demo user for **Apex Retail** tenant (`apex` client account, password `Demo2026!`)
- [ ] No existing open origination draft for this user on `/strategic-moves/new` (use a fresh browser session or clear the draft via admin). This ensures Variant 2A is served.
- [ ] Browser dev tools open, console visible
- [ ] Network tab open to monitor `/api/chat/agent` calls

---

## Fixture Input

### CEO note (paste this verbatim in Step 5)

```
From: Marcus Webb, CEO, Apex Retail
To: Operations Leadership Team
Subject: Q2 priority — contact center transformation

Team,

I want us to evaluate whether AI-assisted triage in the contact center
can bring our average handle time under 6 minutes. Right now our agents
average close to 9 minutes per call. Industry benchmarks for best-in-class
retailers run 5–6 minutes. That gap costs us — rough math suggests we're
leaving $3–4M annually in agent capacity alone.

Sarah Chen has been flagging this for six months and I'd like her to take
point on building the business case. Is there a real AI program here?

— Marcus
```

This note is designed to give Nexus enough signal to:
- Extract a hypothesis (AI triage → AHT from 9 min to ~6 min, $3–4M value stake)
- Classify archetype (workflow_automation or ai_product_enablement)
- Identify sponsor candidate (Sarah Chen)

---

## Script

### Step 1 — Land on Strategic Moves dashboard

**Action:** Navigate to `/strategic-moves` as the Apex Retail demo user.

**Expected output:**
- Page title "Strategic Moves" visible
- "+ New Move" button visible in top-right area
- Ribbon shows portfolio summary (Moves, Need Attention, On Track, At Stake)

**Failure criteria:**
- Page 404 or blank
- "+ New Move" button missing
- User not authenticated (redirect to login)

---

### Step 2 — Click "+ New Move"

**Action:** Click the "+ New Move" button.

**Expected output:**
- Browser navigates to `/strategic-moves/new`
- Page loads without error

**Failure criteria:**
- Click has no effect
- Navigation goes to wrong URL
- 404 or server error

---

### Step 3 — Confirm Originate page anatomy

**Action:** Observe the page layout at `/strategic-moves/new`.

**Expected output (per anatomy spec `01-anatomy.md`):**

| Element | Expected state |
|---|---|
| `#orig-page` | Visible, full-viewport layout |
| `#orig-identity` | Identity bar visible at top: "Originating new move · UNTITLED · DRAFT" |
| `#orig-grid` | Two-column layout: chat pane left, canvas pane right |
| `#orig-chat` | Chat pane visible with Nexus header ("NEW MOVE · P0 ORIGINATE") |
| `#orig-chat-message-list` | Contains Nexus first message (non-empty) |
| `#orig-chat-scaffold` | Scaffold step chips visible — 7 steps |
| `#orig-chat-input-area` | Textarea + Send button visible |
| `#orig-canvas` | Canvas pane visible with breadcrumb and "Originate a strategic move" heading |
| `#orig-canvas-brief` | 7 scaffold sections visible, all empty (placeholders showing) |
| `#orig-promote-bar` | Promote bar visible at bottom of canvas |
| `#orig-promote-bar-promote-btn` | Promote button disabled (`aria-disabled="true"`) |
| `#orig-promote-bar-gate-summary` | "0 of 7 sections complete" |
| Phase rail (in canvas pane) | P0 highlighted (active), P1–P5 non-interactive |

**Specific scaffold step chips to verify (in `#orig-chat-scaffold`):**

| ID | Label |
|---|---|
| `#orig-chat-scaffold-step-1` | "What's the bet / hypothesis" |
| `#orig-chat-scaffold-step-2` | "Archetype classification" |
| `#orig-chat-scaffold-step-3` | "Sponsor candidate" |
| `#orig-chat-scaffold-step-4` | "Scope / boundary" |
| `#orig-chat-scaffold-step-5` | "Evidence family selection" |
| `#orig-chat-scaffold-step-6` | "Value hypothesis seed" |
| `#orig-chat-scaffold-step-7` | "Foundation readiness" |

**Failure criteria:**
- Page loads but chat pane is missing
- Canvas pane is missing
- Scaffold section count ≠ 7
- Phase rail is missing
- Promote button is active despite no sections filled

---

### Step 4 — Confirm Nexus first message matches Layer 5 spec (Variant 2A)

**Action:** Read the Nexus first message in `#orig-chat-message-list`.

**Expected output (Variant 2A — empty entry):**

The message must read exactly:

> To start a new Strategic Move, I need four things from you: the outcome you're targeting, who cares about it, what evidence you have, and a rough sense of what value is at stake. You can type a description or paste something — a CEO note, email thread, board memo, or problem statement. Where do you want to start?

**Spec reference:** `docs/design/strategic-moves/specs/originate/05-knowledge-surfacing.md §2A`

**Tolerances:**
- Whitespace normalization is acceptable
- No other additions or truncation permitted

**Failure criteria:**
- First message is the fallback hardcoded placeholder ("To start a new Strategic Move, I need four things from you: the outcome you're targeting, who cares about it, what evidence you have, and a rough sense of what value is at stake. Where do you want to start?") — this is the pre-8.1 mock; it means the server-side first message is NOT being used
- First message is empty or shows a loading spinner that never resolves
- First message is Variant 2B (draft-return form) when this is a fresh session

**Note:** The Variant 2A text is identical in both the spec and the composeOriginateFirstMessage implementation. If the wording differs, the implementation must be corrected before acceptance.

---

### Step 5 — Paste CEO note (Variant 2C input trigger)

**Action:** Click into `#orig-chat-input-area` textarea and paste the full CEO note from §Fixture Input above. Do NOT send yet — first confirm the paste landed cleanly.

**Expected output:**
- CEO note text is visible in the textarea
- Character count is >500 (this is the Layer 5 Variant 2C trigger threshold)
- Send button becomes active

**Action (continued):** Press Enter (or click Send button) to submit.

**Expected output:**
- User turn appears in `#orig-chat-message-list` with the CEO note text
- Empty assistant turn appears with "…" (streaming indicator)
- Network request to `/api/chat/agent` fires (visible in Network tab)
  - Request body: `{ "agentName": "Nexus", "surface": "/strategic-moves/new", ... }`
  - Response status: 200
  - Response `Content-Type: text/event-stream` (SSE streaming)
- Streaming begins — assistant turn text grows progressively

**Failure criteria:**
- No network request fires
- Request returns non-200 status
- Streaming never starts (assistant turn stays empty or "…" forever)
- Console errors during streaming

---

### Step 6 — Confirm Nexus extracts hypothesis, classifies archetype, proposes sponsor

**Action:** Wait for Nexus streaming response to complete. Read the full response.

**Expected output — Nexus response MUST include all of the following:**

1. **Hypothesis extraction** — Nexus identifies the core bet from the CEO note:
   - References AI-assisted triage in the contact center
   - Cites the AHT improvement: "9 minutes" → target under 6 minutes
   - Cites the value stake: approximately $3–4M annually (with `[UNVALIDATED_HYPOTHESIS]` qualifier — AH-ORIG-3 compliance)

2. **Archetype classification** — Nexus classifies this as one of:
   - `workflow_automation` (most likely — AI triage is a process automation)
   - `ai_product_enablement` (acceptable if Nexus reasons AI-first product approach)
   - Confidence band must be stated (e.g., "High confidence" or "Preliminary — confirm with you")

3. **Sponsor candidate** — Nexus identifies Sarah Chen as the sponsor candidate:
   - Must attribute to the CEO note source (AH-ORIG-1 compliance): "Based on Marcus's note, Sarah Chen has been flagging this..."
   - Must NOT assert Sarah Chen is the confirmed sponsor — she is a candidate until confirmed

**Compliance checks:**

| Rule | Required behavior | Check |
|---|---|---|
| AH-ORIG-1 (sponsor sourcing) | Must cite the CEO note as source for Sarah Chen; must not assert confirmation | ✅ / ❌ |
| AH-ORIG-2 (archetype confidence) | Must label archetype with confidence band | ✅ / ❌ |
| AH-ORIG-3 (value unvalidated) | Must label any $ figure with `[UNVALIDATED_HYPOTHESIS]` | ✅ / ❌ |
| AH-ORIG-4 (benchmark citation) | If citing industry benchmarks (5–6 min best-in-class), must cite the source or label as unverified | ✅ / ❌ |

**Failure criteria:**
- Nexus response is generic / does not extract from the pasted note
- Nexus asserts Sarah Chen "is the sponsor" (not candidate)
- Nexus cites $3–4M without `[UNVALIDATED_HYPOTHESIS]` qualifier
- Nexus classifies archetype with no confidence qualifier
- No archetype classification at all

---

### Step 7 — Verify scaffold updates: sections fill on canvas

**Action:** Observe `#orig-canvas-brief` on the right side. Check `#orig-promote-bar-gate-summary`.

**Expected output:**
- At minimum 3 scaffold sections should be auto-filled from the Nexus response via `brief-progress` artifact:
  - `#orig-canvas-brief-section-1` (Problem statement / bet): filled with extracted hypothesis text
  - `#orig-canvas-brief-section-2` (Archetype): filled with classification
  - `#orig-canvas-brief-section-3` (Sponsor candidate): filled with "Sarah Chen"
- Each filled section transitions from empty state (italic placeholder text) to populated state (content text with green/filled visual treatment)
- Gate summary updates from "0 of 7" to "3 of 7 sections complete" (or more)
- The scaffold step chips for steps 1, 2, 3 in `#orig-chat-scaffold` show checkmark (✓) indicators

**Network verification:**
- Check that the `/api/chat/agent` SSE response included `[[artifact:brief-progress]]` markers in the stream (visible in Network tab raw response)

**Failure criteria:**
- Canvas sections remain empty after Nexus response
- Gate summary stays at "0 of 7"
- Scaffold chips do not show checkmarks
- `brief-progress` artifact not present in SSE stream

---

### Step 8 — Confirm sponsor (test fixture)

**Action:** In the chat, send the message: `"Sarah Chen confirmed — she's the sponsor."`

**Expected output:**
- User turn added to `#orig-chat-message-list`
- Nexus responds acknowledging sponsor confirmation
- If Nexus emits another `brief-progress` artifact, section 3 status may upgrade to "confirmed"
- Nexus may advance to ask about scope or evidence family (next scaffold step in sequence)
- Gate summary may advance to 4 of 7 if sponsor confirmation triggers a field update

**Failure criteria:**
- Nexus response ignores the confirmation message
- Streaming error during this turn

---

### Step 9 — Verify promote-readiness gate summary

**Action:** Observe `#orig-promote-bar-gate-summary`. All 7 sections must be complete before the Promote button enables.

**Current state after Steps 5–8:** Approximately 3–4 of 7 sections filled. The promote button should remain disabled.

**Expected output:**
- `#orig-promote-bar-gate-summary` shows correct "N of 7 sections complete" where N = number of filled scaffold sections
- `#orig-promote-bar-promote-btn` has `aria-disabled="true"` and is visually disabled
- Status text below promote button: "Complete all 7 sections to promote."

**Verification:** Confirm promote button is non-interactive (click should not fire).

**Failure criteria:**
- Gate summary count is wrong (off by more than 1)
- Promote button is active despite < 7 sections filled

---

### Step 10 — Simulate full completion and Promote

**Option A — Complete via conversation** (preferred for acceptance demo):
Continue chatting with Nexus to fill all remaining scaffold sections (steps 4–7). Use these seed messages if needed:
- Step 4 (Scope): `"Scope this to the inbound voice channel only, excluding chat and email."`
- Step 5 (Evidence family): `"For evidence, let's use operational metrics and a vendor assessment."`
- Step 6 (Value hypothesis): `"Value hypothesis: reducing AHT by 30% saves 2.5 FTE annually at fully-loaded cost of $85K each."`
- Step 7 (Foundation readiness): `"Data access is available via the call center platform API. No major infrastructure gaps."`

Once all 7 sections are filled:

**Expected output:**
- All 7 scaffold sections in `#orig-canvas-brief` are filled (content visible in each)
- All 7 scaffold chips in `#orig-chat-scaffold` show ✓ checkmarks
- `#orig-promote-bar-gate-summary` shows "Ready to promote"
- `#orig-promote-bar-promote-btn` is active (`aria-disabled` removed, button clickable)

**Action:** Enter a move name in the program name input field (e.g., "Contact Center AI Transformation"). Then click the Promote button.

**Expected output:**
- `POST /api/programs/origination-submit` request fires (visible in Network tab)
- Request body includes: `programName`, `problemStatement`, `targetOutcome`, `classification`, `sponsor`
- Response includes `{ ok: true, engagementId: "..." }`
- Browser navigates to `/strategic-moves/[engagementId]`
- New workspace opens at P1 Charter phase
- Phase rail shows P0 closed, P1 active
- Nexus emits P1 first message (Variant A — just promoted from P0)
- Portfolio count on `/strategic-moves` increments (verify by navigating back)

**Failure criteria:**
- Promote button click fires but `origination-submit` returns error
- `engagementId` missing from response
- Navigation does not occur
- New workspace opens at wrong phase (should be P1)
- Nexus does not emit P1 first message

---

## Pass criteria

The script passes if ALL of the following are true:

- [x] Variant 2A first message matches spec exactly (Step 4)
- [x] Nexus extracts hypothesis, archetype, and sponsor from pasted CEO note (Step 6)
- [x] All three AH-ORIG compliance checks pass (Step 6)
- [x] Canvas scaffold sections fill reactively via `brief-progress` artifact (Step 7)
- [x] Gate summary count is accurate throughout (Steps 7, 9)
- [x] Promote button disabled until all 7 sections complete (Step 9)
- [x] Origination submit succeeds and redirects to Workspace at P1 (Step 10)
- [x] Portfolio count increments after successful promotion (Step 10)
- [x] No unhandled JavaScript console errors during the run
- [x] `/api/chat/agent` SSE stream contains `brief-progress` artifact markers (Step 7 network check)

---

## Fail actions

| Failure | Classification | Next step |
|---|---|---|
| Variant 2A text is wrong | Blocker | Compare `composeOriginateFirstMessage.ts` against spec §2A; update text |
| Nexus does not extract from CEO note | Blocker | Check T-P0 pack loading in `route.ts`; verify `surface === '/strategic-moves/new'` block |
| AH-ORIG-3 violation ($$ without label) | Blocker | File bug against Nexus system prompt AH rules; re-test |
| `brief-progress` artifact absent from stream | Blocker | Check `composeBriefProgressCadenceDirective` includes `/strategic-moves/new`; check `surfacesWithArtifactChannel` set |
| Canvas sections do not fill | Blocker | Check `applyBriefProgressArtifact` in `StrategicMoveOriginateClient.tsx` |
| Promote submit fails | Blocker | Check `/api/programs/origination-submit` route; verify surface allowlist |
| Portfolio count does not increment | Non-blocker | Log as v0.2 real-time update item; count will be correct on refresh |
| Variant 2B served instead of 2A | Non-blocker (if draft exists) | Clear draft via admin; re-run |

---

## Optional extension: Variant 2B test

If a draft was created during the run above, navigate away and return to `/strategic-moves/new` to test Variant 2B.

**Expected output:**
- Nexus first message starts with "Welcome back."
- References the last completed scaffold step by name and number
- References the next incomplete step with its one-line description
- Does NOT show the 2A "Where do you want to start?" form

**Spec reference:** `docs/design/strategic-moves/specs/originate/05-knowledge-surfacing.md §2B`

---

## References

- `docs/design/strategic-moves/specs/originate/01-anatomy.md` — Stable element IDs
- `docs/design/strategic-moves/specs/originate/05-knowledge-surfacing.md` — First-message variants, AH rules
- `docs/design/strategic-moves/specs/workspace/05-first-messages-p1.md` — P1 Variant A (post-promotion)
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — Client implementation
- `src/components/strategic-moves/composeOriginateFirstMessage.ts` — Server first-message composer
- `src/app/api/chat/agent/route.ts` — Agent route surface registration
- `src/lib/programs/failure-mode-prompt.ts` — `composeBriefProgressCadenceDirective`
- `docs/design/strategic-moves/EXECUTION_PLAYBOOK.md §11.4` — High-level acceptance demo script (Demo B)
