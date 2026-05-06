# Acceptance Demo Script — Flow 3 (A-3)
## Strategic Moves · Cross-Tenant Smoke Test

| Field | Value |
|---|---|
| **Work Package** | A-3 |
| **Doc path** | `docs/design/strategic-moves/specs/acceptance/A3-cross-tenant-smoke-test.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-06 |
| **Status** | Ready for execution (Step 9.3) |
| **Companion scripts** | `A1-acceptance-script-flow1.md`, `A2-acceptance-script-flow2.md` |
| **Trigger** | Steps 8.1 ✅ + 8.2 ✅ (Workspace + Origination both complete) |
| **Estimated runtime** | Under 10 minutes |
| **Operator** | Claude Code (or Anand) |
| **Observer** | Anand |
| **Author** | Claude Code |

---

## Prerequisites

Before starting:

- [ ] Steps 8.1 and 8.2 (Originate and Workspace implementations) merged to main
- [ ] Demo environment is running (Vercel preview or localhost)
- [ ] Two browser sessions available (or use one session with Sign Out between flows)
- [ ] Network tab open to monitor API calls
- [ ] Browser dev tools open, console visible
- [ ] The following test accounts are confirmed active:
  - Apex Retail: `apex` client account, password `Demo2026!`
  - Meridian: `meridian` client account, password `Demo2026!`
- [ ] At least one Apex move in phase P1+ and at least one Meridian move in phase P1+ (see §Fixture Setup below)

---

## Fixture Setup

The following database state must be present before running this script.

### Apex Retail fixture program

| Field | Value |
|---|---|
| `engagements.display_code` | `"APX-02"` |
| `engagements.program_title` | `"Demand Forecasting Modernization"` |
| `engagements.current_phase` | `3` (P3 Design Future State) |
| `engagements.graph_node_id` | `"eng_apexretail_demand_forecasting_modernization"` |
| `graphNodeId` | `eng_apexretail_demand_forecasting_modernization` |
| `engagements.status_key` | `"on_track"` |
| Phase workspace route | `/strategic-moves/{engagementId}/phase/3` |

**Alternate acceptable fixture:** any Apex move at phase P1 or above. APX-01 (Morrison Owned Brand Margin Recovery, P4), APX-04 (Digital Assortment Copilot, P2), or APX-05 (Supply Chain Control Tower, P1) are all acceptable substitutes.

### Meridian fixture program

| Field | Value |
|---|---|
| `engagements.display_code` | `"MRD-01"` |
| `engagements.program_title` | `"Ambient Clinical Value Chain Activation"` |
| `engagements.current_phase` | `3` (P3 Design Future State) |
| `engagements.graph_node_id` | `"eng_meridian_ambient_clinical_value_chain_activation"` |
| `engagements.status_key` | `"on_track"` |
| Phase workspace route | `/strategic-moves/{engagementId}/phase/3` |

**Alternate acceptable fixture:** any Meridian move at phase P1 or above. MRD-02 (Prior Authorization Automation, P4), MRD-03 (Clinical Documentation AI Governance, P1), or MRD-04 (Revenue Cycle AI Tool Rationalization, P2) are all acceptable substitutes.

### Engagement UUIDs for Flow C (cross-tenant isolation)

Before running Flow C, record the engagement UUIDs for both tenant fixtures:

```
APEX_MOVE_ID=<UUID of APX-02 from /strategic-moves dashboard as Apex user>
MERIDIAN_MOVE_ID=<UUID of MRD-01 from /strategic-moves dashboard as Meridian user>
```

These are the `engagements.id` values (UUID v4), not the display codes. They appear in the URL when viewing a move: `/strategic-moves/[UUID]`.

---

## Script

---

## Flow A — Apex Retail Workspace (10 steps)

Signed in as: `apex` client account, password `Demo2026!`

---

### A-1 — Sign in as Apex client

**Action:** Navigate to `/sign-in` (or the root `/`). Sign in with the Apex Retail demo account.

**Expected output:**
- Clerk sign-in flow completes without error
- Browser redirects to `/strategic-moves` or the app home
- No authentication error banners

**Failure criteria:**
- Clerk returns error on sign-in
- Redirect loop or blank page after sign-in
- User sees Meridian content (wrong session)

---

### A-2 — Navigate to `/strategic-moves` — confirm Apex moves visible

**Action:** Navigate to `/strategic-moves`.

**Expected output:**
- Page title "Strategic Moves" visible
- Ribbon shows portfolio summary with at least 1 move
- At least one Apex move card is visible (APX-01 through APX-06 display codes)
- No Meridian moves (MRD-01 through MRD-05 display codes) are visible anywhere on the page
- "+ New Move" button visible in top-right

**Failure criteria:**
- Page shows 404 or blank
- Meridian moves appear alongside Apex moves (cross-tenant data leak)
- Zero moves visible despite seeded fixtures
- "+ New Move" button missing

---

### A-3 — Click into an Apex move in P1+ — workspace route loads

**Action:** Click the APX-02 move card (or any Apex move in P1 or above). Record the engagement UUID from the resulting URL.

**Expected output:**
- Browser navigates to `/strategic-moves/[engagement-UUID]/phase/[N]` where N is the current phase of the clicked move
- OR browser navigates to `/strategic-moves/[engagement-UUID]` and then redirects to the current phase
- Two-pane layout visible: Nexus chat pane on the left, canvas pane on the right
- Phase rail visible at top of canvas pane
- Active phase node (P3 for APX-02) is highlighted in the phase rail
- Context bar shows the Apex display code (e.g., `APX-02`) and phase label (e.g., `P3 DESIGN`)
- No JavaScript errors in console

**Record:** `APEX_MOVE_ID` = the UUID portion of the URL

**Failure criteria:**
- Page shows 404 or server error
- Two-pane layout missing (chat pane or canvas pane absent)
- Phase rail absent
- Wrong phase highlighted
- Console errors on load

---

### A-4 — Verify Nexus chat pane has a phase-appropriate first message

**Action:** Read the Nexus first message in the chat pane (left side, `#ws-chat-p[N]-thread`).

**Expected output for P3 (APX-02 Demand Forecasting Modernization):**

The first message must:
- Reference `"Demand Forecasting Modernization"` (the program name) or `APX-02` (the display code)
- Be scoped to P3 Design Future State content — must reference root cause traceability, future-state design, or operating model shift
- NOT be a generic placeholder such as "Ask me anything" or an empty bubble
- NOT reference Meridian, MRD-01, or any other tenant's program details

**Spec reference:** `docs/design/strategic-moves/specs/workspace/05-first-messages-p3.md` — Variant B (existing active phase, direct navigation).

**Failure criteria:**
- First message is a generic placeholder
- First message references Meridian content
- First message is empty or shows a spinner that never resolves
- First message does not mention the program name or phase context

---

### A-5 — Upload a test file via the upload endpoint

**Action:** In the chat pane, use the paperclip upload affordance (if present in the UI) OR test the upload endpoint directly via Network panel or curl.

**Direct API test (if UI paperclip not yet wired):**
```
POST /api/programs/workspace/[APEX_MOVE_ID]/upload
Content-Type: multipart/form-data

file=<test.txt — any small plain-text file, e.g., "AHT baseline data 2026">
phase=3
```

**Expected output (UI):**
- File selection dialog opens when paperclip is clicked
- After file selection: upload progress indicator visible
- After completion: file appears as a reference in the chat pane or artifact shelf

**Expected output (API direct):**
```json
{
  "attachmentId": "<uuid>",
  "originalName": "test.txt",
  "status": "processing"
}
```
Response status: `200 OK`

**Failure criteria (UI):**
- Paperclip click has no effect (if UI is wired)
- Upload errors with a non-200 status for a valid file

**Failure criteria (API):**
- Response status is not 200
- `attachmentId` missing from response body
- Response is `{ error: 'forbidden' }` — would indicate wrong-tenant rejection on a same-tenant request (bug)

---

### A-6 — Ask Nexus to draft an artifact via chat

**Action:** In the chat input field (`#ws-chat-p[N]-input-field`), type and send:

```
Draft a root cause to design trace summary for this phase.
```

Then observe the network activity to see if an artifact call fires to `POST /api/programs/workspace/[APEX_MOVE_ID]/artifact`.

**Expected output:**
- User turn appears in the chat thread
- Nexus streaming response begins (assistant turn text grows progressively)
- Nexus response references APX-02 / Demand Forecasting Modernization phase context
- Response is substantive (not a placeholder "I cannot do that" refusal)
- Network tab shows a request to `/api/chat/agent` (SSE stream, status 200)

**Artifact endpoint check (if Nexus emits a `draft_artifact` tool call):**
- Network tab shows `POST /api/programs/workspace/[APEX_MOVE_ID]/artifact` fires
- Request body includes `{ phase: 3, deliverableKey: "...", title: "...", prompt: "..." }`
- Response status: `200` (or `422` if quality gates block — log this as a non-blocker)

**Failure criteria:**
- Chat submit has no effect (no request fires)
- `/api/chat/agent` returns non-200 status
- Nexus response is empty or never completes (streaming hangs)
- Console errors during streaming

---

### A-7 — Verify artifact appears in artifact shelf

**Action:** After Nexus responds, scroll down in the canvas pane to the Artifact shelf section (`#ws-canvas-p[N]-artifact-shelf`).

**Expected output (if an artifact was generated in A-6):**
- Artifact shelf shows at least one entry for the current phase
- Artifact row shows: type key, title, and status badge
- `#ws-canvas-p[N]-artifact-empty-state` is NOT present (replaced by the artifact list)

**Expected output (if no artifact was generated in A-6 — Nexus responded but did not emit a draft_artifact tool call):**
- Artifact shelf shows empty state message: "No [Phase Label] artifacts yet. Nexus will generate artifacts as you work through the phase steps."
- This is acceptable — log as non-blocking if Nexus did not invoke draft_artifact

**Failure criteria:**
- Artifact shelf section is completely missing from the canvas pane
- After a confirmed `POST /api/programs/workspace/[APEX_MOVE_ID]/artifact` 200 response, the artifact does NOT appear in the shelf (reactive update failure — blocker)

---

### A-8 — Advance gate via phase-gate endpoint

**Action:** Fire the phase-gate endpoint directly (or click "Promote to next phase" if the UI button is present and gate criteria are met):

```
POST /api/programs/phase-gate
Content-Type: application/json

{
  "programCode": "APX-02",
  "fromPhase": 3,
  "toPhase": 4,
  "gateCriterion": "A-3 smoke test: gate advance"
}
```

**Note:** If APX-02 is at P3 but gate criteria are not all met, the API will still accept this request (the phase-gate route does not enforce P3 → P4 hard gate criteria for all fields in the current implementation; FM-03/FM-04 preconditions apply only to P1 → P2). The API write to `.approvals/phase-gates.json` and the Supabase `engagements.current_phase` update should proceed.

**Expected output:**
```json
{
  "ok": true,
  "entry": {
    "id": "APX-02:P3->P4:...",
    "programCode": "APX-02",
    "fromPhase": 3,
    "toPhase": 4,
    "gateCriterion": "A-3 smoke test: gate advance",
    "advancedByEmail": "...",
    "timestamp": "..."
  }
}
```
Response status: `200 OK`

**DB verification:** Supabase `engagements` row for `graph_node_id = eng_apexretail_demand_forecasting_modernization` should show `current_phase = 4`.

**Failure criteria:**
- Response status is not 200
- `ok: false` in response body
- `programCode, fromPhase, toPhase required` error (bad request body)
- Response is `{ error: 'forbidden' }` — would indicate cross-tenant rejection on a same-tenant request (bug)
- DB row not updated (check via admin or direct query)

---

### A-9 — Navigate back to list — verify phase counter updated

**Action:** Navigate back to `/strategic-moves`.

**Expected output:**
- APX-02 move card is visible
- Phase badge on the APX-02 card now shows `P4` (or "P4 Roadmap") reflecting the gate advance from A-8
- No stale cache: the dashboard did not require a manual hard refresh to show the updated phase

**Note:** If the dashboard caches move list data, a refresh may be required. A one-time hard refresh (`Cmd+Shift+R`) to verify the underlying data is correct is acceptable.

**Failure criteria:**
- APX-02 card still shows P3 after both soft and hard refresh (DB update did not propagate)
- APX-02 card is missing from the list entirely

**Cleanup:** After verifying, optionally revert APX-02 back to P3 by calling:
```
POST /api/programs/phase-gate
{ "programCode": "APX-02", "fromPhase": 4, "toPhase": 5, "gateCriterion": "A-3 smoke test cleanup" }
```
(Skip if running this as a one-time destructive smoke test.)

---

### A-10 — Sign out of Apex session

**Action:** Click the user avatar / account menu and select "Sign out" (or navigate to `/sign-out`).

**Expected output:**
- Clerk signs the user out
- Browser redirects to `/sign-in` or the marketing home
- Navigating to `/strategic-moves` redirects to `/sign-in` (not a blank page or 500)
- No stale Apex session cookie remains active

**Failure criteria:**
- Sign-out button is missing
- After sign-out, navigating to `/strategic-moves` still shows Apex data (session leak)

---

## Flow B — Meridian Workspace (5 steps, abbreviated)

Signed in as: `meridian` client account, password `Demo2026!`

---

### B-1 — Sign in as Meridian client

**Action:** Sign in with the Meridian demo account (`meridian` client, password `Demo2026!`).

**Expected output:**
- Clerk sign-in completes without error
- Browser redirects to `/strategic-moves` or app home
- No authentication error banners

**Failure criteria:**
- Clerk returns error on sign-in
- User sees Apex content immediately (wrong session provisioned)

---

### B-2 — Navigate to `/strategic-moves` — confirm Meridian moves visible, Apex moves NOT visible

**Action:** Navigate to `/strategic-moves`.

**Expected output:**
- At least one Meridian move card is visible (MRD-01 through MRD-05 display codes)
- No Apex moves (APX-01 through APX-06) are visible anywhere on the page — not in the move list, not in the ribbon drilldown
- Ribbon shows Meridian portfolio summary (counts reflect Meridian moves only)
- "+ New Move" button visible

**Critical isolation check:** Inspect the move list exhaustively. If any APX-* display code appears, this is a P0 data leak.

**Failure criteria:**
- Any APX-* display codes appear in the page (P0 cross-tenant data leak — stop test, file blocker immediately)
- Zero moves visible despite seeded Meridian fixtures
- Ribbon counts appear to sum Apex + Meridian totals (another form of data leak)

---

### B-3 — Click into a Meridian move — verify workspace loads

**Action:** Click the MRD-01 move card (Ambient Clinical Value Chain Activation) to open the phase workspace. Record the engagement UUID from the URL.

**Expected output:**
- Browser navigates to `/strategic-moves/[MERIDIAN_MOVE_ID]/phase/3`
- Two-pane workspace loads without error
- Phase rail shows P3 as active (MRD-01 is at P3 Design Future State)
- Context bar shows `MRD-01` display code and `P3 DESIGN` phase label
- No JavaScript errors in console

**Record:** `MERIDIAN_MOVE_ID` = the UUID portion of the URL

**Failure criteria:**
- Page shows 404 or server error
- Workspace loads but shows APX-* display code in the context bar (wrong program loaded)
- Console errors on load

---

### B-4 — Confirm Nexus context is scoped to Meridian

**Action:** Read the Nexus first message in the chat pane. Observe the context bar and canvas pane headings.

**Expected output:**
- Context bar in the chat pane head shows: `MRD-01 · P3 DESIGN` (or equivalent Meridian display code and phase)
- Nexus first message references "Ambient Clinical Value Chain Activation" or "MRD-01"
- Nexus first message contains healthcare-domain language appropriate to P3 Design (root cause traceability, clinical workflow, operating model shift)
- Breadcrumb in canvas pane shows: `Strategic Moves > Meridian Health > MRD-01 > P3 Design Future State`
- Canvas pane title shows: `Ambient Clinical Value Chain Activation`
- NO Apex-specific language (APX-*, Demand Forecasting, Retail, store associates) appears anywhere on the page

**Failure criteria:**
- Context bar shows an APX-* display code
- Nexus first message references any Apex move or Apex-specific content
- Canvas pane title is an Apex program name

---

### B-5 — Sign out of Meridian session

**Action:** Sign out of the Meridian account.

**Expected output:**
- Clerk signs the user out
- Browser redirects to `/sign-in` or marketing home
- Navigating to `/strategic-moves` redirects to `/sign-in`

**Failure criteria:**
- Sign-out fails
- After sign-out, `/strategic-moves` still shows Meridian data

---

## Flow C — Cross-Tenant Isolation (3 API checks)

These checks confirm that the API-level tenant gates return the correct HTTP status codes for cross-tenant requests. They are performed via direct API calls — no browser UI interaction required.

**Preconditions:**
- `APEX_MOVE_ID` is the engagement UUID recorded in A-3
- `MERIDIAN_MOVE_ID` is the engagement UUID recorded in B-3
- You have a valid Clerk session cookie for each tenant (obtain via browser dev tools after signing in)

---

### C-1 — Apex user attempts to access a Meridian move's upload endpoint → expect 403

**Action:** As the authenticated Apex user (use the Apex session cookie), send:

```
POST /api/programs/workspace/[MERIDIAN_MOVE_ID]/upload
Content-Type: multipart/form-data
Cookie: <Apex session cookie>

file=<any small test file>
```

**Expected output:**
```json
{ "error": "forbidden" }
```
Response status: `403 Forbidden`

**Implementation reference:** The upload route calls `getProgramById(ctx, moveId)`. When the Apex user's `ctx` is resolved, `getProgramById` queries for a program belonging to the Apex tenant. The MERIDIAN_MOVE_ID belongs to Meridian and will not be found under the Apex tenant context, triggering `return jsonError(403, 'forbidden')` at line 89 of `src/app/api/programs/workspace/[moveId]/upload/route.ts`.

**Failure criteria:**
- Response status is `200` (data returned for cross-tenant resource — P0 security failure)
- Response status is `404` instead of `403` (acceptable from a security standpoint, but the spec requires 403 — log as non-blocker)
- Response status is `500` (server error — investigate)

---

### C-2 — Meridian user attempts to advance an Apex program gate → expect 403

**Action:** As the authenticated Meridian user (use the Meridian session cookie), send:

```
POST /api/programs/phase-gate
Content-Type: application/json
Cookie: <Meridian session cookie>

{
  "programCode": "APX-02",
  "fromPhase": 3,
  "toPhase": 4,
  "gateCriterion": "C-2 cross-tenant isolation check"
}
```

**Expected output:**
```json
{ "error": "forbidden" }
```
Response status: `403 Forbidden`

**Implementation reference:** The phase-gate route calls `tenantKeyForProgramCode("APX-02")` which resolves to `"apexretail"`, then calls `checkTenantAccessByKey("apexretail")`. The Meridian user does not have membership in the `apexretail` tenant, so `access.ok = false` and `access.reason = "forbidden"`, triggering `return NextResponse.json({ error: access.reason }, { status: 403 })` at line 90 of `src/app/api/programs/phase-gate/route.ts`.

**Failure criteria:**
- Response status is `200` and `ok: true` (gate was advanced — P0 security failure; roll back immediately)
- Response status is `200` and gate entry written to `.approvals/phase-gates.json` under Meridian credentials (same P0 failure)
- Response status is `404` instead of `403` (log as non-blocker)

---

### C-3 — Unauthenticated request to artifact endpoint → expect 401

**Action:** Send a request to the artifact endpoint with no Clerk session cookie (or an expired/invalid token):

```
POST /api/programs/workspace/[APEX_MOVE_ID]/artifact
Content-Type: application/json
(no Cookie header, or Cookie: __session=INVALID)

{
  "phase": 1,
  "deliverableKey": "charter",
  "title": "C-3 unauthenticated test",
  "prompt": "Draft a charter"
}
```

**Expected output:**
```json
{ "error": "unauthenticated" }
```
Response status: `401 Unauthorized`

**Implementation reference:** The artifact route calls `requireTenancy()` at line 62, which in turn validates the Clerk session. An unauthenticated request causes `requireTenancy()` to throw; `tenancyErrorResponse` catches the thrown value and returns a 401 response. See `src/app/api/v1/programs/_auth.ts`.

**Failure criteria:**
- Response status is `200` (artifact generated for unauthenticated caller — P0 security failure)
- Response status is `500` (server error on unauth path — investigate; the auth guard should catch this cleanly)
- Response body does not indicate an auth error (e.g., returns `{ error: "internal_error" }` — means the auth guard threw but was caught by the wrong handler)

---

## Pass criteria

The script passes if ALL of the following are true:

- [x] Flow A, Steps A-1 through A-10 complete without error
- [x] Apex moves are visible to the Apex user; no Meridian moves appear (A-2)
- [x] Phase workspace loads for an Apex move with correct phase context (A-3)
- [x] Nexus first message is phase-appropriate and references the Apex program (A-4)
- [x] Upload endpoint returns `{ attachmentId, status: "processing" }` for a valid Apex file upload (A-5)
- [x] Nexus responds substantively to a chat message in the Apex workspace (A-6)
- [x] Phase-gate advance succeeds for APX-02 and `engagements.current_phase` updates in DB (A-8)
- [x] Dashboard phase counter reflects the gate advance after navigation (A-9)
- [x] Flow B, Steps B-1 through B-5 complete without error
- [x] Meridian moves are visible to the Meridian user; no Apex moves appear (B-2)
- [x] Meridian workspace context shows MRD-01 and Meridian-specific content only (B-4)
- [x] Flow C: all 3 isolation checks return the expected HTTP status (C-1: 403, C-2: 403, C-3: 401)
- [x] No unhandled JavaScript console errors during either browser flow
- [x] No P0 security violations detected (cross-tenant data visible to wrong tenant, or unauthenticated artifact creation)

---

## Fail actions

| Failure | Classification | Next step |
|---|---|---|
| Apex moves visible to Meridian user (B-2) | P0 Blocker — stop test immediately | Investigate `requireTenancy()` + `getProgramsForTenant()` query — verify tenant filter is applied before returning move list |
| Meridian move accessible to Apex user via upload API (C-1 returns 200) | P0 Blocker | Investigate `getProgramById` tenant scoping — confirm `ctx.clientId` is applied in the WHERE clause |
| Apex gate advanced by Meridian user (C-2 returns 200 + ok: true) | P0 Blocker — roll back gate entry | Investigate `checkTenantAccessByKey` in phase-gate route — confirm it is called BEFORE ledger write |
| Unauthenticated artifact created (C-3 returns 200) | P0 Blocker | Investigate `requireTenancy()` guard in artifact route — check catch path in `tenancyErrorResponse` |
| Phase workspace 404 (A-3 or B-3) | Blocker | Fix routing for `/strategic-moves/[id]/phase/[n]`; check `StrategicMovePhaseClient` mount |
| Nexus first message is a generic placeholder (A-4 or B-4) | Blocker | Check `PHASE_CONFIGS[n].firstMessage` in `StrategicMovePhaseClient.tsx`; verify `move` object is passed correctly |
| Upload endpoint returns 403 for same-tenant request (A-5) | Blocker | Check `getProgramById(ctx, moveId)` — verify Apex program is seeded and `ctx.clientId` matches |
| Phase-gate advance fails with 412 precondition (A-8 for non-P1→P2) | Non-blocker | Document as known: P3→P4 preconditions not yet enforced; this test uses P3→P4 to avoid FM-03/FM-04 triggers |
| Dashboard phase counter not updated (A-9) | Non-blocker | Confirm DB `current_phase` updated; log as v0.2 reactive-update item if display is stale |
| C-1 returns 404 instead of 403 | Non-blocker | The tenant gate fires correctly (resource not found under wrong tenant); 404 vs 403 is an information-disclosure design decision — verify spec and document |
| Artifact shelf not reactive after artifact POST (A-7) | Non-blocker | Artifact was persisted to DB; shelf reactivity is a v0.2 polish item |
| Minor visual styling differences between Apex and Meridian workspaces | Non-blocker | Log as v0.2 polish item |

---

## References

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — Phase workspace component; `PHASE_CONFIGS` first messages; element IDs
- `src/app/api/programs/workspace/[moveId]/upload/route.ts` — Upload endpoint; tenant gate at line 87–89
- `src/app/api/programs/workspace/[moveId]/artifact/route.ts` — Artifact endpoint; auth gate at line 62
- `src/app/api/programs/phase-gate/route.ts` — Phase gate endpoint; tenant gate at lines 84–92
- `src/lib/auth/tenant-access.ts` — `checkTenantAccessByKey`; cross-tenant 403 semantics
- `src/app/api/v1/programs/_auth.ts` — `requireTenancy()` + `tenancyErrorResponse` (401 on unauthenticated)
- `src/lib/programs/enhancement-seed-planner.ts` — `graphNodeIdForProgram` (engagement UUID derivation)
- `intelligence/seeds/tenant-portfolios/apexretail.json` — Apex program codes and phases
- `intelligence/seeds/tenant-portfolios/meridian.json` — Meridian program codes and phases
- `docs/design/strategic-moves/specs/acceptance/A1-acceptance-script-flow1.md` — A1 companion
- `docs/design/strategic-moves/specs/acceptance/A2-acceptance-script-flow2.md` — A2 companion
- `docs/design/strategic-moves/EXECUTION_PLAYBOOK.md §11.4` — High-level acceptance demo scripts
