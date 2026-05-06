# Workspace Layer 5 — First-Message Scaffold · P5 Mobilize & Handoff

| Field | Value |
|---|---|
| **Work Package** | W-5.2 (P5) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-first-messages-p5.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-1.2 P5 (`01-anatomy-canvas-p5.md`), T-P5 (`agent-training/p5-mobilize.md`), T-X.2 (`agent-training/00-global-behavioral-rules.md`) |
| **References** | `PHASE_MODEL_V2_DOCTRINE.md` §P5, gap-ws-p5-001 (B-120 — P5→Tower gate not yet in `governance.ts`) |
| **Author** | Claude Code |

---

## Overview

This document specifies Nexus's knowledge surfacing behavior when a user opens the P5 Mobilize & Handoff canvas in the Workspace. P5 carries the Handoff-not-Acknowledgment Authority (R7, T-P5): Nexus must consistently distinguish explicit Tower acceptance — a named individual confirming readiness — from passive acknowledgment (sending the package, attending a meeting, silence).

This is the most consequential distinction in P5. A move that is acknowledged but not truly accepted arrives in Tower with a team that is not committed. P5 exists to prevent that.

This document covers:

- What patterns load when P5 canvas activates (§1)
- What Nexus says on page open — four entry variants (§2)
- Evidence rules specific to P5 (§3)
- Anti-hallucination rules (§4)
- Gate context awareness (§5)
- Handoff-not-acknowledgment authority and Tower acceptance status (§6)

All element IDs referenced are defined in `01-anatomy-canvas-p5.md`.

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load when P5 canvas activates)

| Pattern source | File | Rationale |
|---|---|---|
| `PAT-PRG-001` (P5 team assembly + handoff subset) | `src/lib/intelligence/program-lifecycle-patterns.ts` | Team assembly protocol, RACI finalization, handoff package structure |
| `seed-patterns-delivery.ts` | `src/lib/intelligence/seed-patterns-delivery.ts` | RACI finalization, delivery team confirmation patterns, readiness verification |

**Load trigger:** Pattern bundle loads when `ws-canvas-p5` becomes the active canvas zone.

### 1.2 Optional patterns (loaded on demand)

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-change-management.ts` | `ws-canvas-p5-raci-panel-status` advances to `in-progress` | Change management readiness verification patterns for the handoff package |

---

## Section 2 — First-Message Scaffold

Four variants based on context when user opens the P5 canvas.

---

### Variant A — Just promoted from P4 (fresh P5 entry)

**Context:** Move was just promoted to P5. `GATE-P4` record has a fresh `CONTINUE_TO_P5` verdict. This is the user's first open of the P5 canvas.

**Template:**

> P4 gate passed — business case approved, {p4_hard_count} hard criteria met. P5 begins now: mobilize the delivery team and assemble the Tower handoff package.
>
> P5 has five steps: team assembly and RACI confirmation, handoff package assembly, readiness verification, explicit Tower acceptance, and gate-out. P5 ends when a named Tower representative explicitly confirms the package is executable — not when the package is sent, not when Tower attends a session.
>
> {tower_metric_plan_status}First: let's confirm the delivery team. For each workstream from the P4 roadmap, we need a named delivery lead with confirmed availability. Ready to go through the workstreams?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{p4_hard_count}` | Integer | Count of `ws-canvas-p4-gate-item-{1..5}` with passing status at time of P4 promotion | Number of hard criteria met in P4 gate |
| `{tower_metric_plan_status}` | String | EC-P5-3: check if `tower_metric_plan_drafted` artifact exists | If exists: `""` (empty — confirmed by P4 entry criteria). If missing: "One issue: the Tower metric plan is missing from P4. This should have been completed in P4 — P5 operationalizes it, it does not create it. We cannot assemble the handoff package without it. Confirm whether this was completed and where it is, or flag that we need to return to P4 to close it. " |

**Why Nexus states the P5 mission explicitly:** Variant A explicitly names what "done" means in P5 (named Tower acceptance, not package delivery). This inoculates against the most common failure pattern — teams treating the handoff session as the finish line. Nexus establishes the standard in the opening message.

---

### Variant B — Mid-P5 (workstreams activated, progress tracking)

**Context:** User returns to a P5 canvas where `ws-canvas-p5-raci-panel-status = in-progress` or `complete`, and `ws-canvas-p5-handoffpack-panel-status` is `incomplete` or `ready`. Team assembly is underway or complete; handoff package assembly is in progress.

**Template:**

> P5 is underway. Team assembly: {raci_status}. Handoff package: {handoff_status}. {readiness_gaps}
>
> {tower_acceptance_reminder}Next: {next_step_name} — {next_step_description}. Where do you want to continue?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{raci_status}` | String | `ws-canvas-p5-raci-panel-status` | "complete" or "in progress ({N} roles confirmed)" |
| `{handoff_status}` | String | `ws-canvas-p5-handoffpack-panel-status` + count of `ws-canvas-p5-handoffpack-item-{n}-status = 'Present'` | "{N} of {total} components present" or "not yet started" |
| `{readiness_gaps}` | String | Any `ws-canvas-p5-raci-role-{n}-person` fields that are empty | If gaps: "{count} workstream(s) still need named leads. " If none: `""` |
| `{tower_acceptance_reminder}` | String | `ws-canvas-p5-tower-acceptance-status` | If `not-submitted`: "Tower acceptance has not been initiated. The handoff package must be submitted to Tower before acceptance can be recorded — and submission is not acceptance. " If `submitted` or `acknowledged`: "Tower has received the package — but receipt is not acceptance. The gate requires a named individual to confirm the package is executable. " If `accepted`: `""` |
| `{next_step_name}` | String | Derived from first incomplete P5 step in sequence | Display name |
| `{next_step_description}` | String | Static lookup — see table below | One-line description |

**Next step descriptions:**

| Incomplete step | Name | Description |
|---|---|---|
| `ws-canvas-p5-raci-panel-status != complete` | Team assembly | Confirm a named delivery lead for every workstream from the P4 roadmap |
| `ws-canvas-p5-handoffpack-panel-status != ready` | Handoff package | Assemble all phase artifacts (P0–P4) into the Tower-formatted package |
| Readiness verification not logged | Readiness verification | Confirm data access, tooling, change management, no open blockers |
| `ws-canvas-p5-tower-acceptance-status` in `{not-submitted, submitted}` | Tower acceptance | Submit package to Tower and pursue explicit named acceptance |

---

### Variant C — Tower acceptance in progress (handoff package ready, awaiting explicit acceptance)

**Context:** `ws-canvas-p5-handoffpack-panel-status = ready` and `ws-canvas-p5-tower-acceptance-status` is `submitted` or `acknowledged`. The package has been sent to Tower; formal acceptance is pending.

**CRITICAL — Handoff-not-Acknowledgment Authority (R7):** This variant is the primary site of R7 enforcement. Nexus must surface the distinction between acknowledged and accepted in every session where status is `submitted` or `acknowledged`. The gate-out action (`ws-canvas-p5-gate-handoff-btn`) remains disabled until status is `accepted`.

**Template:**

> Handoff package is ready. Tower acceptance status: **{acceptance_status_label}**.
>
> {acceptance_status_message}
>
> {what_still_needed}The gate cannot close until Tower acceptance is confirmed with: a named individual, their role, the confirmation date, and an explicit statement that the package is executable. Who is the named Tower representative reviewing the package?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{acceptance_status_label}` | String | `ws-canvas-p5-tower-acceptance-status` | Display value: "Submitted — awaiting review" or "Acknowledged — not yet accepted" |
| `{acceptance_status_message}` | String | Derived from status | If `submitted`: "The package has been sent. Tower receiving the package is not the same as Tower accepting it — there is no confirmation yet that the program is executable as specified." If `acknowledged`: "Tower has acknowledged receipt. Acknowledgment is not acceptance. 'Noted' or 'received' does not meet the P5 gate requirement. The gate requires explicit confirmation that the package is executable." |
| `{what_still_needed}` | String | Always present | "What is still needed: " followed by one of the required acceptance format components missing from `ws-canvas-p5-tower-acceptance-acceptor` / `ws-canvas-p5-tower-acceptance-timestamp` — or `""` if those are already populated |

**Nexus behavior when user claims acceptance occurred informally:**

If a user says "Tower said it looks good" or "we had the handoff meeting and everyone agreed":
> "That's a good sign, but it's not the acceptance record I need. The gate requires: [Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified. Can you get that confirmation in writing or in a recorded session? 'Looks good' from a general meeting doesn't close the gate."

---

### Variant D — Handed-off state (Tower has accepted — read-only workspace)

**Context:** `ws-canvas-p5-tower-acceptance-status = accepted` AND `engagements.status = 'handed_off'`. Move has completed P5 and is in Tower. The workspace is read-only.

**Template:**

> This Move has been handed off to Tower. Accepted by **{acceptor_name}**, {acceptor_role}, on {acceptance_date}.
>
> The workspace is in read-only view. All P0–P5 artifacts are preserved. Atlas is now active for this program. {atlas_signal}
>
> You can review any phase canvas in view-only mode. No changes can be made after handoff.

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{acceptor_name}` | String | `ws-canvas-p5-tower-acceptance-acceptor` | Name of the Tower representative who accepted |
| `{acceptor_role}` | String | Role recorded at acceptance time | Role of the accepting party |
| `{acceptance_date}` | String | `ws-canvas-p5-tower-acceptance-timestamp` | Formatted date of acceptance |
| `{atlas_signal}` | String | Atlas agent activation status | If Atlas is confirmed active: "Atlas is tracking the Tower metric plan signals defined in P4." If Atlas activation status is unknown: `""` |

**Fallback if acceptor data is missing:** If `ws-canvas-p5-tower-acceptance-acceptor` is empty despite `status = accepted`, surface a data quality note: "Acceptance was recorded but the acceptor name is missing from the record. This is a data quality gap — the audit log should be reviewed to confirm who accepted and when."

---

## Section 3 — Evidence Rules

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Named delivery lead confirmation** | A specific individual's name appearing in user input or uploaded RACI/org chart, plus an explicit confirmation that the individual has been notified and has accepted the role. "We'll ask [Name]" is not confirmation. | Cannot mark a workstream as having a confirmed lead without explicit confirmation. Ask: "Has [Name] been informed they are the lead for this workstream and confirmed they are available?" |
| **Handoff package completeness** | All required artifact categories from P0–P4 must be present in `ws-canvas-p5-handoffpack-checklist`. Each component must have `Present` or `Signed` status. A component cannot be marked Present without a linked artifact. | Cannot mark handoff package `ready` with any checklist component showing `Missing`. Name the missing component and ask for the artifact or upload. |
| **Tower acceptance** | Named individual confirmation in writing or recorded session that the package is executable as specified. Required fields: name, role, confirmation date, explicit statement. | Cannot set `ws-canvas-p5-tower-acceptance-status = accepted` without all four fields. The prohibition on self-approval applies: the person who assembled the package cannot confirm Tower acceptance. |
| **Tower metric plan presence** | `tower_metric_plan_drafted` artifact from P4.3 must exist and be linked in the handoff package. | If absent at P5 entry, this is a P4 gap — flag per EC-P5-3 and do not proceed with handoff package assembly until resolved. |
| **Readiness verification** | Confirmation that data access, tooling, and change management activities are in place. Must be explicit user confirmation per workstream — cannot be inferred from the P4 roadmap. | Readiness verification cannot be marked complete without explicit per-workstream confirmation. Ask workstream by workstream. |

---

## Section 4 — Anti-Hallucination Rules

---

**Rule AH-P5-1** (Acknowledgment presented as acceptance)

- **Trigger:** Nexus is about to assess or report `ws-canvas-p5-tower-acceptance-status` and the status is `submitted` or `acknowledged`
- **Prohibition:** Nexus MUST NOT describe the current state as "accepted" or imply the gate condition is met when status is `submitted` or `acknowledged`
- **Test prompt:** "Tower got the package and we had the kickoff — we're done, right?"
- **Expected refusal behavior:** "Not yet. Tower receiving the package is not the same as Tower accepting it. The gate requires a named individual to explicitly confirm the package is executable. Has anyone on the Tower side made that explicit confirmation — in writing or in a recorded session?"

---

**Rule AH-P5-2** (Self-approval of Tower acceptance)

- **Trigger:** The user attempting to record Tower acceptance (`ws-canvas-p5-tower-acceptance-accept-btn`) is the same user who assembled the handoff package
- **Prohibition:** Nexus MUST NOT permit the same individual to both assemble the handoff package and confirm Tower acceptance
- **Test prompt:** Program manager who built the package tries to click "Record Tower acceptance"
- **Expected refusal behavior:** "Tower acceptance must come from the receiving party — someone from the delivery team or Tower side who is accepting the package, not the person who assembled it. Who on the Tower side has reviewed and accepted?"

---

**Rule AH-P5-3** (Team assembly with role titles, not names)

- **Trigger:** A workstream in `ws-canvas-p5-raci-role-{n}-person` is populated with a role title ("CTO", "IT Lead", "The data team") instead of a named individual
- **Prohibition:** Nexus MUST NOT confirm team assembly for any workstream that has a role title instead of a named individual
- **Test prompt:** "Add IT team as the lead for the data pipeline workstream"
- **Expected refusal behavior:** "I can't mark that workstream as assembled with 'IT team' — I need a named individual. Who specifically from IT is the accountable lead for this workstream?"

---

**Rule AH-P5-4** (Handoff package marked complete with missing artifacts)

- **Trigger:** User attempts to mark handoff package as `ready` or submit it to Tower with any `ws-canvas-p5-handoffpack-item-{n}-status = 'Missing'`
- **Prohibition:** Nexus MUST NOT allow the handoff package to be submitted to Tower with missing components
- **Test prompt:** "Let's submit the handoff package now — we can send the missing stuff later"
- **Expected refusal behavior:** "The handoff package has {count} missing component(s): {missing_item_names}. Tower cannot review an incomplete package. Let's close the gaps first. Which of these can you upload or confirm now?"

---

**Rule AH-P5-5** (Gate close without named acceptance)

- **Trigger:** User attempts `ws-canvas-p5-gate-handoff-btn` when `ws-canvas-p5-tower-acceptance-status != accepted`
- **Prohibition:** Nexus MUST NOT allow the Tower handoff action to proceed without explicit acceptance
- **Test prompt:** "We've been in contact with Tower — let's close out the gate"
- **Expected refusal behavior:** "Tower acceptance requires a named individual to confirm the package is executable. Who has confirmed, and what exactly did they say? The gate needs: [Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified."

---

## Section 5 — Gate Context Awareness

**Gate structure:** P5→Tower gate. Note: per gap-ws-p5-001 / B-120, `governance.ts` does not yet define a P5→Tower gate rule. The criteria below are provisional from the anatomy document pending B-120 resolution.

**Provisional gate items (5):**

| Gate item | Canvas element | Status | Criterion |
|---|---|---|---|
| 1 | `ws-canvas-p5-gate-item-1` | Provisional | Tower handoff package complete and accepted |
| 2 | `ws-canvas-p5-gate-item-2` | Provisional | Execution team confirmed readiness |
| 3 | `ws-canvas-p5-gate-item-3` | Provisional | Monitoring plan active |
| 4 | `ws-canvas-p5-gate-item-4` | Provisional | RACI signed off with named owners |
| 5 | `ws-canvas-p5-gate-item-5` | Provisional | Value realization framework handed to Tower |

**Note on gate status:** Nexus should surface the B-120 gap when users ask about gate criteria: "The P5→Tower gate criteria are provisional — B-120 is outstanding to define these in the substrate. The current criteria shown are from the anatomy design and should be treated as working criteria until B-120 closes."

**Proactive gate surfacing rules:**

| Trigger | Nexus behavior |
|---|---|
| User asks "are we ready to hand off?" | Report: "{count} of 5 gate criteria passing (provisional). {any_blocking_item}. Tower acceptance status: {acceptance_status}." |
| `ws-canvas-p5-tower-acceptance-status` is `acknowledged` | Nexus proactively surfaces: "Gate item 1 (Tower handoff accepted) cannot pass with 'acknowledged' status. Explicit acceptance is required." |
| User clicks `ws-canvas-p5-gate-handoff-btn` before `accepted` status | AH-P5-5 fires — block and redirect. |
| `ws-canvas-p5-tower-acceptance-status` transitions to `accepted` | Nexus acknowledges the transition: "Tower acceptance confirmed. Gate item 1 can now pass. Review remaining gate items before initiating handoff." |

---

## Section 6 — Handoff-not-Acknowledgment Authority (R7) and Tower Acceptance Status

This section is first-class. It defines how R7 manifests across all P5 first-message variants and subsequent conversation.

### 6.1 What R7 requires

Per `00-global-behavioral-rules.md` Rule 7 and T-P5 Handoff-not-Acknowledgment Authority:

**What counts as explicit acceptance:**
- Named delivery owner confirms in writing or in a recorded session that they have reviewed the handoff package and accept it
- Named Tower receiver explicitly states the move is executable as handed off
- The P5 gate record includes: name, role, confirmation date, and explicit statement

**What does NOT count as acceptance:**

| Claim | Why it fails | Nexus response trigger |
|---|---|---|
| "Tower team was sent the handoff package" | Sending ≠ accepting | AH-P5-1 |
| "Tower team was in the room for the handoff session" | Attendance ≠ acceptance | AH-P5-1 |
| "We've heard no objections from Tower" | Silence ≠ acceptance | AH-P5-1 |
| "The sponsor said it looks good" | General approval ≠ named Tower acceptance | AH-P5-1 |
| "The handoff was acknowledged" | Acknowledgment ≠ acceptance | AH-P5-1 |
| Program manager self-records Tower acceptance | Assembler ≠ acceptor | AH-P5-2 |

### 6.2 Acceptance status state machine and Nexus behavior

| Status value | `ws-canvas-p5-tower-acceptance-status` | What Nexus says in first message | Gate-out enabled? |
|---|---|---|---|
| `not-submitted` | Package not yet sent to Tower | Surface Variant B or C with reminder to submit | No |
| `submitted` | Package sent, no response yet | "Submitted — awaiting Tower response. Submission is not acceptance." | No |
| `acknowledged` | Tower has replied but not explicitly accepted | "Acknowledged — not accepted. 'Received' does not meet the gate requirement." | No |
| `accepted` | Named individual has explicitly confirmed | Variant D: confirm acceptor name, role, date | Yes |
| `declined` | Tower has declined the package | Surface decline note, indicate loop-back to P3/P4 as required | No — loop back required |

### 6.3 Required acceptance record format

Before Nexus allows `ws-canvas-p5-tower-acceptance-accept-btn` to record acceptance, all four fields must be confirmed:

1. **Acceptor name** (`ws-canvas-p5-tower-acceptance-acceptor`) — the named individual, not "the Tower team"
2. **Acceptor role** — their role and relationship to the program
3. **Confirmation date** (`ws-canvas-p5-tower-acceptance-timestamp`) — when the confirmation was made
4. **Explicit statement** — what they said, verbatim or in direct summary: "[Name] confirmed the handoff package has been reviewed and is executable as specified"

If any of the four fields is missing when the user attempts to record acceptance, Nexus asks for the missing field before proceeding.

### 6.4 Declined state handling

If Tower declines, Nexus must surface the `ws-canvas-p5-tower-acceptance-decline-note` and identify the appropriate loop-back:

> "Tower has declined the handoff package. The decline note says: {decline_note}. This typically requires returning to [P3 / P4] to address [specific concern]. The workspace must reopen the relevant phase to resolve the decline before resubmitting. Which phase does this concern trace to?"

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with work package, date, status, dependencies | PASS |
| Pattern bundle covers team assembly and delivery patterns | PASS |
| Four variants cover: fresh P5, mid-P5, Tower acceptance in progress, handed-off | PASS |
| Variant A explicitly names the P5 mission (named acceptance, not package delivery) | PASS |
| Variant B includes `{tower_acceptance_reminder}` to surface R7 proactively | PASS |
| Variant C is the primary R7 enforcement site — `acknowledged` vs `accepted` distinction explicit | PASS |
| Variant D covers read-only post-handoff state with acceptor record | PASS |
| Handoff-not-Acknowledgment authority is its own section (§6) with state machine | PASS |
| AH-P5-2 (self-approval block) explicitly coded | PASS |
| AH rules use AH-P5-{N} IDs from T-P5 | PASS — AH-P5-1 through AH-P5-5 |
| B-120 gap (P5→Tower gate not in governance.ts) surfaced in gate section | PASS |
| Declined state handling included (loop-back path) | PASS |
| Evidence rules cover: team confirmation, handoff completeness, Tower acceptance, TMP presence | PASS |
| All variables have type, source, description | PASS |
| No "TBD" or vague sections | PASS |
| Context is workspace (existing move at P5), not originate | PASS |
