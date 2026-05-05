# Originate Page · Layer 2 State Inventory

| | |
|---|---|
| **Work Package** | O-2.1, O-2.2, O-2.3 |
| **Doc path** | `docs/design/strategic-moves/specs/originate/02-state.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending O-2.4 sign-off |
| **Preceding layer** | `01-anatomy.md` (frozen) |
| **Companion** | `SPEC_METHODOLOGY.md` §2.2, `SPECS_AND_AGENT_TRAINING_WBS.md` §5.1.2 |
| **Author** | Claude Code |

---

## Overview

This document is the complete state specification for the Originate page (`/strategic-moves/new`). It covers:

1. **§1 — State dimensions** (O-2.1): The parameterization space — three orthogonal dimensions, each with discrete values.
2. **§2 — State matrix** (O-2.2): ~22 rows covering every meaningfully distinct page state. Each row maps to visibility/enabled/disabled per element ID from Layer 1.
3. **§3 — Edge cases** (O-2.3): Five required edge cases called out explicitly as named rows, with handling rules.

All element IDs used in this document are defined in `01-anatomy.md`. Any element not listed in a matrix column behaves as `visible` (default — stable, no state-driven change) unless specified otherwise.

---

## §1 · State Dimensions (O-2.1)

### 1.1 Dimension definitions

Three orthogonal dimensions parameterize Originate page state. Every meaningful state combination is expressible as a tuple `(briefCompleteness, sponsorState, foundationState)`.

#### Dimension A: `briefCompleteness`

Tracks how many of the 7 scaffold sections are in `complete` state. "Complete" means Nexus extracted sufficient content for that section AND the content has been reviewed (or not rejected) by the user.

| Value | Definition | Condition |
|---|---|---|
| `empty` | No sections complete | 0 of 7 scaffold steps have `complete` status |
| `partial` | Some sections complete, not near done | 1–5 of 7 scaffold steps are `complete` |
| `near-complete` | One section away from complete | 6 of 7 scaffold steps are `complete` |
| `complete` | All sections done | 7 of 7 scaffold steps are `complete` |

#### Dimension B: `sponsorState`

Tracks whether a sponsor candidate has been proposed and confirmed through the ACL (access control list of eligible sponsors for this tenant).

| Value | Definition | Condition |
|---|---|---|
| `none` | No sponsor proposed or confirmed | `orig-canvas-brief-section-3` content is null or placeholder |
| `proposed` | Sponsor candidate extracted from conversation but not yet confirmed | Section 3 has a candidate name; scaffold step 3 is `in-progress` or `complete` but not yet signed off |
| `confirmed` | Sponsor candidate confirmed in ACL and sponsor has been notified | Scaffold step 3 is `complete`; sponsor identity resolves in ACL; notification sent |

> **Note on "no sponsor available"** (edge case O-2.3-a): When the tenant ACL has no eligible sponsor, `sponsorState` can only be `none` regardless of what the user types. This is not a `proposed` state because no valid ACL candidate exists. Covered explicitly in §3.

#### Dimension C: `foundationState`

Tracks the aggregate status of the four foundation readiness checks (F1–F4) from scaffold step 7.

| Value | Definition | Condition |
|---|---|---|
| `green` | All four F1–F4 checks resolved with `pass` or acceptable `partial` | All of F1, F2, F3, F4 in `pass` or `partial`; none are `fail` |
| `partial` | Some checks pass, some fail or not yet checked | Mix of `pass`, `partial`, `fail`, `not-checked` across F1–F4 |
| `red` | All four checks are `fail` | F1 = `fail` AND F2 = `fail` AND F3 = `fail` AND F4 = `fail` |

> **F1–F4 definitions** are a substrate gap. See §4 and backlog item B-103. The spec uses the F1–F4 labels as defined in Layer 1 anatomy §A.7.7 and §A.11.7. The specific criteria for each check are to be codified in `src/lib/strategic-moves/originate-constants.ts` (B-103).

### 1.2 Derived computed property: `promoteEnabled`

This is not a dimension — it is a boolean derived from all three dimensions:

```
promoteEnabled = (briefCompleteness === 'complete') AND (sponsorState === 'confirmed')
```

`foundationState` does NOT block promote. F1–F4 issues surface as warnings in the promote bar (`orig-promote-bar-status-text`) but do not disable the promote button. This matches the playbook decision: the promote bar is enabled when brief is complete and sponsor is confirmed; foundation state is advisory.

---

## §2 · State Matrix (O-2.2)

### 2.1 Column key

Each column below refers to an element ID from Layer 1. Cell values:

| Value | Meaning |
|---|---|
| `visible` | Element renders and is visible to the user |
| `hidden` | Element does not render (display:none or not mounted) |
| `enabled` | Element is interactive — responds to click/keyboard |
| `disabled` | Element renders but is not interactive — `aria-disabled="true"`, no click handler |
| `loading` | Element shows a loading state (spinner, skeleton, etc.) |
| `visible+enabled` | Shorthand when both apply |
| `visible+disabled` | Shorthand when visible but not actionable |
| `—` | Not applicable; element has no state-driven visibility or enablement change (default: visible+enabled if interactive, visible if non-interactive) |

Columns listed: element IDs that change behavior across states. Elements not listed remain `visible` and do not change across states.

### 2.2 Matrix

Rows are labeled by a short state name followed by the tuple.

| State name | `briefCompleteness` | `sponsorState` | `foundationState` | `orig-promote-bar-promote-btn` | `orig-promote-bar-status-text` content | `orig-canvas-brief-section-{1..7}-edit-btn` | `orig-chat-input-field` | `orig-chat-input-submit` | `orig-rail-phase-node-p1` through `p5` | `orig-rail-phase-node-p0` | `orig-promote-bar-gate-summary` |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **S-01** blank-slate | `empty` | `none` | `partial` | `visible+disabled` | "Complete all 7 sections to promote" | `hidden` (all) | `enabled` | `disabled` (input empty) | `disabled` (all) | `enabled` (re-renders page state, no nav) | `visible` ("0 of 7 complete") |
| **S-02** in-flight-no-sponsor | `partial` | `none` | `partial` | `visible+disabled` | "Complete all 7 sections and confirm a sponsor" | `visible+enabled` (for complete sections); `hidden` (for incomplete) | `enabled` | `enabled` (when field non-empty) | `disabled` (all) | `enabled` | `visible` ("{N} of 7 complete") |
| **S-03** in-flight-sponsor-proposed | `partial` | `proposed` | `partial` | `visible+disabled` | "Complete all 7 sections to promote" | `visible+enabled` (complete sections) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` |
| **S-04** near-complete-no-sponsor | `near-complete` | `none` | `partial` | `visible+disabled` | "Complete all 7 sections and confirm a sponsor" | `visible+enabled` (6 complete sections) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("6 of 7 complete") |
| **S-05** near-complete-sponsor-proposed | `near-complete` | `proposed` | `partial` | `visible+disabled` | "Complete all 7 sections to promote" | `visible+enabled` | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("6 of 7 complete") |
| **S-06** near-complete-sponsor-confirmed | `near-complete` | `confirmed` | `partial` | `visible+disabled` | "Complete all 7 sections to promote" | `visible+enabled` | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("6 of 7 complete") |
| **S-07** complete-no-sponsor | `complete` | `none` | `green` | `visible+disabled` | "Sponsor confirmation required before promoting" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **S-08** complete-sponsor-proposed | `complete` | `proposed` | `green` | `visible+disabled` | "Confirm sponsor to promote" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **S-09** complete-sponsor-confirmed-green | `complete` | `confirmed` | `green` | `visible+enabled` | "Ready to promote to P1 Charter" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **S-10** complete-sponsor-confirmed-partial | `complete` | `confirmed` | `partial` | `visible+enabled` | "Ready to promote · some foundation checks incomplete (advisory)" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **S-11** complete-sponsor-confirmed-red | `complete` | `confirmed` | `red` | `visible+enabled` | "Ready to promote · all foundation checks failed (advisory — review recommended)" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **S-12** promote-in-flight | `complete` | `confirmed` | `green` | `loading` | "Promoting to P1 Charter..." | `visible+disabled` (all 7 — locked during mutation) | `disabled` | `disabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **S-13** step-completing | `partial` | `proposed` | `partial` | `visible+disabled` | — | `loading` (for the step just completing) | `disabled` (brief — Nexus extracting) | `disabled` | `disabled` (all) | `enabled` | `visible` |
| **S-14** nexus-responding | `partial` | `none` | `partial` | `visible+disabled` | — | — | `disabled` (waiting for Nexus response) | `disabled` | `disabled` (all) | `enabled` | `visible` |
| **S-15** attachment-uploading | `partial` | `none` | `partial` | `visible+disabled` | — | — | `disabled` | `disabled` | `disabled` (all) | `enabled` | `visible` |
| **S-16** draft-restored | `partial` | `proposed` | `partial` | `visible+disabled` | — | `visible+enabled` (complete sections) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` |
| **EDGE-A** no-sponsor-in-acl | `empty` | `none` | `partial` | `visible+disabled` | "No eligible sponsor found for this tenant — contact your AbarVa administrator" | `hidden` (all) | `enabled` | `disabled` | `disabled` (all) | `enabled` | `visible` ("0 of 7 complete") |
| **EDGE-B** foundation-all-red | `complete` | `confirmed` | `red` | `visible+enabled` | "Ready to promote · all foundation checks failed — review recommended but not blocking" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |
| **EDGE-C** archetype-ambiguous | `partial` | `none` | `partial` | `visible+disabled` | "Complete all 7 sections to promote" | `visible+enabled` (section 2 only — shows confidence indicators) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` |
| **EDGE-D** tab-close-resume | `partial` | `proposed` | `partial` | `visible+disabled` | — | `visible+enabled` (complete sections) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` |
| **EDGE-E** concurrent-users | `partial` | `none` | `partial` | `visible+disabled` | — | `visible+enabled` | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` |
| **EDGE-F** submission-error | `complete` | `confirmed` | `green` | `visible+enabled` | "Promote failed — please try again" | `visible+enabled` (all 7) | `enabled` | `enabled` | `disabled` (all) | `enabled` | `visible` ("7 of 7 complete") |

---

## §3 · Edge Cases (O-2.3)

The five required edge cases per WBS §5.1.2 and SPEC_METHODOLOGY.md §2.2. Each is a named row in §2.2 and is documented in full here.

### Edge Case A: No sponsor available in ACL (`EDGE-A`)

**Condition:** The tenant ACL contains no person with a role eligible to be a sponsor for a Strategic Move. This may occur if all eligible persons are on the origination form's exclusion list, if the tenant has no users with `sponsor` authority in `engagement_participants`, or if the ACL query returns an empty result.

**Trigger:** ACL lookup fires on page load and on each `/api/persons` call from the sponsor search in scaffold step 3. Returns empty list.

**Behavior:**
- `sponsorState` is permanently `none` for this session — the user cannot advance to `proposed` or `confirmed` because there are no valid candidates to resolve.
- `orig-canvas-brief-section-3` content area shows an inline warning: "No eligible sponsors found. Contact your AbarVa administrator to add a sponsor to this tenant."
- `orig-promote-bar-status-text` shows: "No eligible sponsor found for this tenant — contact your AbarVa administrator"
- `orig-promote-bar-promote-btn` remains `disabled` even if all 7 sections complete, because `sponsorState !== 'confirmed'`.
- The scaffold conversation can still proceed — the user can continue filling out sections 1, 2, 4, 5, 6, 7. The platform does not block forward progress on non-sponsor sections.
- Brief section 3's `-edit-btn` is hidden (nothing to edit if there is no candidate to link).

**Substrate dependency:** Requires that the ACL lookup at `/api/v1/persons?role=sponsor` (or equivalent) return an empty array rather than an error. The draft state should preserve a flag `sponsorAclEmpty: true` so the warning persists on refresh. See substrate gap B-104 (§4).

**Resolution:** User must contact their AbarVa administrator to add an eligible sponsor before Originate can be completed.

---

### Edge Case B: All foundation checks F1–F4 red (`EDGE-B`)

**Condition:** Scaffold step 7 has been completed by Nexus, but all four foundation readiness checks (F1, F2, F3, F4) are in `fail` state. This means the user has addressed each check in conversation, Nexus has extracted a definitive "fail" for each, and the `orig-canvas-brief-section-7` content reflects all four failures.

**Trigger:** Scaffold step 7 completion fires. Nexus parses F1–F4 into `fail` for all four.

**Behavior:**
- `foundationState` = `red`
- `orig-promote-bar-promote-btn` is `visible+enabled` — promote is NOT blocked by foundation state. Foundation checks are advisory.
- `orig-promote-bar-status-text` shows: "Ready to promote · all foundation checks failed — review recommended but not blocking"
- `orig-canvas-brief-section-7` renders with a visual warning indicator (e.g., red background tint or warning icon on F1–F4 check items).
- The conversation in the chat lane may show a Nexus message flagging the risk: "All foundation checks show concerns. You can still promote to P1, but Charter phase will need to address these gaps."
- Audit log entry at promote time records `foundationState: 'red'` so the P1 Charter team has visibility.

**Design rationale:** Foundation checks are discovery / advisory in nature at P0 Originate. Blocking promote on failed checks would prevent teams with legitimate foundation debt from entering the pipeline. The P1 Charter phase is where foundation remediation is scoped. `red` state is visible but not blocking.

**Substrate dependency:** F1–F4 check values stored in `program_origination_drafts.state` JSONB under `brief.foundationChecks`. See gap B-103 and B-105 (§4).

---

### Edge Case C: Archetype classification ambiguous — two archetypes tie (`EDGE-C`)

**Condition:** Nexus completes scaffold step 2 (archetype classification) but the classifier returns two archetypes with equal or nearly equal confidence scores (within the tie threshold, e.g., <5% confidence difference). There is no clear winner.

**Trigger:** Step 2 completion fires. Classifier (via `/api/v1/programs/originate`) returns two `PatternMatch` entries with confidence scores within the tie threshold.

**Behavior:**
- `orig-chat-scaffold-step-2` status icon does NOT advance to `complete` — it stays `in-progress`.
- `orig-canvas-brief-section-2` renders both candidate archetypes with individual confidence indicators (e.g., "Contact Center AI — 48%" and "Workflow Automation — 45%"). This is the **confidence indicator UI** called out in the anatomy.
- Nexus sends a disambiguation message in the chat: "I see two equally strong pattern matches for this Move: Contact Center AI and Workflow Automation. Can you clarify which angle is primary?" along with two action chips representing the two candidates.
- The user must pick one (via chip or typed response) before step 2 advances to `complete`.
- The brief section 2 edit button (`orig-canvas-brief-section-2-edit-btn`) is visible and shows both candidates, with a note: "Tie — click to resolve".
- `briefCompleteness` does not advance to count section 2 as complete until the tie is resolved.

**Substrate dependency:** The classifier's response must include a `tieBreakerRequired: boolean` field and two `matches` entries when this condition occurs. See gap B-106 (§4).

**Resolution:** User selects one archetype via chip or typed confirmation. Nexus marks step 2 complete, brief section 2 updates to the chosen archetype.

---

### Edge Case D: Tab close mid-origination — draft persistence and return state (`EDGE-D`)

**Resolves D-11 (draft persistence decision).**

**Condition:** The user is mid-origination — some scaffold steps complete, some in-progress — and closes the browser tab (or navigates away from `/strategic-moves/new`).

**Trigger mechanisms:**
- Browser tab close: `beforeunload` event triggers a final draft save attempt.
- Navigation away (clicking nav link, back button, etc.): the React component's `useEffect` cleanup or router `beforePopState` hook fires a draft save.
- Session expiry: handled separately (no save on expiry; draft was last saved at most-recent scaffold step completion).

**Draft persistence behavior (per D-11 resolution):**
- Auto-save fires on **scaffold step completion** — when Nexus marks a step `complete`, the current `OriginationDraftState` (turns + brief + patternMatch) is written to `program_origination_drafts` via `POST /api/programs/origination-draft`.
- Best-effort save also fires on tab close (`beforeunload`) with the current in-flight state, but this may not complete if the browser terminates the request.
- Draft table: `program_origination_drafts` with `surface = '/strategic-moves/new'`. One open draft per `(user_id, client_id, surface)`.
- Draft TTL: 30 days idle (auto-purge at 30 days; user-facing notification at 25 days per D-11).

**Return state when user navigates back to `/strategic-moves/new`:**
- Page loads, fires `GET /api/programs/origination-draft?surface=/strategic-moves/new`.
- If an open draft exists (`committed_engagement_id IS NULL`) and the `sessionId` in the draft matches the current browser session:
  - The workspace hydrates from the draft: conversation turns reload, brief sections repopulate, scaffold step statuses restore.
  - `briefCompleteness` is re-derived from the draft's scaffold step states.
  - `sponsorState` is re-derived from the draft's `brief.sponsor` field.
  - A Nexus message appears: "Welcome back! I've restored your previous work. You were working on [step name]. Ready to continue?"
- If the draft exists but `sessionId` does NOT match (different browser/device):
  - The workspace shows a resume prompt: "You have a draft in progress from [date]. Resume where you left off?" with two CTAs: "Resume" and "Start fresh".
  - "Resume" loads the draft; "Start fresh" abandons the draft (marks `committed_engagement_id` with a sentinel value or deletes the row).
- If no open draft exists: fresh blank state (S-01).

**URL on return:** The URL remains `/strategic-moves/new`. There is NO `?phase=0` parameter and NO draft ID in the URL. The draft is resolved via server-side lookup by `(user_id, client_id, surface)`, not by URL parameter. This is consistent with D-10 (URL behavior) and is the correct pattern.

**State matrix row:** EDGE-D shows the state after successful draft restore — `partial` brief, `proposed` sponsor (if draft had one), `partial` foundation. The page is in state S-16 equivalent.

---

### Edge Case E: Two users open `/new` simultaneously — collision behavior (`EDGE-E`)

**Condition:** Two users from the same tenant (same `client_id`) both navigate to `/strategic-moves/new` at approximately the same time. This is unusual but possible (e.g., two consultants preparing separately).

**Table constraint behavior:**
The `program_origination_drafts` table has a partial unique index on `(user_id, client_id, surface) WHERE committed_engagement_id IS NULL`. Since `user_id` is part of the key, two different users opening `/new` simultaneously is NOT a collision — they each get their own draft row. Each draft is fully isolated.

**Same-user, different tab scenario (true collision):**
If the same user opens `/new` in two browser tabs simultaneously:
- Both tabs share the same draft row (`user_id`, `client_id`, `surface` all identical).
- The **last-write-wins** strategy applies: whichever tab's save fires last overwrites the draft state.
- This is acceptable because: (a) the user is the same person — data is not lost, just the later state wins; (b) the save interval is scaffold step completion, not keystroke-level — a collision requires the user to complete a scaffold step in two tabs simultaneously, which is near-impossible in practice.
- No lock mechanism is implemented for this scenario. No user-facing error is shown.
- If one tab writes `committed_engagement_id` (promote fires), the other tab's subsequent draft save will attempt to update a committed draft row. The `saveDraft` function checks for `committed_engagement_id IS NULL` — if the row is committed, the save silently no-ops. The second tab should detect the committed state on its next poll/save response and redirect the user to the newly created Strategic Move workspace.

**Cross-user, same-client scenario (not a collision, but policy question):**
Two different users (`user_id_1` ≠ `user_id_2`, same `client_id`) each originating separately means two independent moves will be created if both promote. The platform does not prevent this. Duplicate detection is a B-107 backlog item (advisory — Nexus similarity check before promote, out of scope for O-2).

**State matrix row:** EDGE-E represents the normal state for user 2 during a concurrent session. No special UI treatment — each user sees their own independent draft state.

---

## §4 · Substrate Gap Log

Gaps discovered while authoring this state spec. Extends the gaps from Layer 1 anatomy (B-101, B-102, B-103).

| Gap ID | Element(s) | Missing substrate | Impact | Backlog item |
|---|---|---|---|---|
| `gap-orig-004` | `EDGE-A` no-sponsor-in-acl behavior | Draft state needs `sponsorAclEmpty: boolean` field in `OriginationDraftState.brief` to persist the "no ACL candidates" finding across refreshes | Medium — without persistence, the warning disappears on refresh | B-104: Add `sponsorAclEmpty` field to `OriginationDraftState.brief` in `src/lib/programs/origination-drafts.ts` |
| `gap-orig-005` | `EDGE-B` foundation-all-red, `orig-canvas-brief-section-7-f{1..4}` | No structured storage for F1–F4 check values in `OriginationDraftState`. Current `brief` shape has no `foundationChecks` field. | High — F1–F4 state cannot persist across refreshes; promote audit log cannot record foundation state at promote time | B-105: Add `foundationChecks: { f1: string, f2: string, f3: string, f4: string }` to `OriginationDraftState.brief` |
| `gap-orig-006` | `EDGE-C` archetype-ambiguous | Classifier API at `/api/v1/programs/originate` does not return a `tieBreakerRequired` flag or expose the confidence gap between top two matches in a structured way | Medium — without the flag, UI cannot detect tie vs. clear winner; step 2 will advance to `complete` even in ambiguous cases | B-106: Add `tieBreakerRequired: boolean` and `confidenceGap: number` to the `complete` SSE event payload in the originate classifier route |
| `gap-orig-007` | `EDGE-E` same-user concurrent tabs | `saveDraft` function does not return an indicator when the save was rejected because the row is already committed | Low — tab 2 does not know to redirect to the new move; user sees stale state | B-107: `saveDraft` returns `{ saved: boolean, committed: boolean, committedEngagementId: string | null }` so callers can redirect to the workspace |

---

## §5 · Self-QA

Per `EXECUTION_PLAYBOOK.md §2.3` universal self-QA and `§2.4` spec PR additional QA:

| Check | Status |
|---|---|
| 1. Branch named per §2.1 (`spec/originate-l2-state`) | PASS |
| 2. PR title formatted per §2.2 (`[SPEC] Originate Layer 2 State (O-2.1, O-2.2, O-2.3)`) | PASS |
| 3. PR description references work package IDs O-2.1, O-2.2, O-2.3 and links to WBS | PASS (in PR body) |
| 4. Single work package per PR | PASS — O-2.1, O-2.2, O-2.3 are one PR per playbook Step 3.1 |
| 5. Targets `main` | PASS |
| 6. Decision log — no new decisions; substrate gaps logged B-104 through B-107 | PASS |
| 7. Substrate gaps logged with backlog item references | PASS (§4) |
| 8. Internal consistency — all element IDs in matrix reference IDs from Layer 1 | PASS — verified against `01-anatomy.md §A.14` |
| 9. Cascade fidelity — matrix rows describe states from Flow 2 of cascade | PASS |
| 10. Acceptance demo alignment — EDGE-D resolves D-11 as required | PASS |
| 11. Cross-spec consistency — no contradiction with Layer 1 | PASS |
| 12. Substrate verification — all gaps enumerated with backlog items | PASS (§4) |
| Every element from Layer 1 that has state-driven behavior has a column | PASS |
| All 5 required edge cases from WBS O-2.3 present as named rows | PASS — EDGE-A through EDGE-E |
| No "TBD" in any cell | PASS |
| `promoteEnabled` derivation rule explicit | PASS (§1.2) |

---

## §6 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft | Claude Code |
