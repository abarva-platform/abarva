# MEMBER AI ASSIST — Owner Decision Dossier (MOVES-REMEDIATION-001)

Status: **closed — owner chose P3 and the governed correction was executed/proven on 2026-07-23.**
This dossier remains as the decision record explaining why the Move was returned to P3 rather than
ratified at P4.

## 2026-07-23 closure update

After this dossier was first written, owner authorization was supplied and the team executed the
P3 correction through the sanctioned ACA operator path:

- PR #5496 implemented the dedicated correction script and tests.
- PR #5497 corrected the script's identity guardrail from the historical/display label
  `HEALTHCARE_PROVIDER-MEMBER-2026` to the live database graph node
  `eng_member_ai_assist_mrp7yhe4`.
- Corrected inspect proof: `beforePhase=4`, `afterPhase=4`, `planStatus=would_correct`,
  `mutationApplied=false`.
- Apply proof: `beforePhase=4`, `afterPhase=3`, `planStatus=would_correct`,
  `mutationApplied=true`.
- Idempotency proof: `beforePhase=3`, `afterPhase=3`, `planStatus=already_at_target`,
  `mutationApplied=false`.
- Signed-in browser proof now confirms the Move opens at
  `/strategic-moves/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/phase/3` and renders
  `MEMBER AI ASSIST` at P3 `Choose the Approach`.

The access limitation described below was true when this dossier was first drafted. It is now
superseded by the later Meridian automation-agent proof.

## 0. Historical note: the discrepancy that originally blocked this dossier

The prior remediation record
(`docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md`) states the Move's
current phase is **P4**, disputed. While preparing this dossier, a direct, live, signed-in read of
the Strategic Moves list (`https://app.abarva.ai/strategic-moves`, timestamped observation below)
showed:

```text
MOVE: MEMBER AI ASSIST
GRAPH NODE ID: HEALTHCARE_PROVIDER-MEMBER-2026
PHASE SHOWN: P3 Design Future State
PROGRESS: 60%
STATUS BADGE: AWAITING DECISION
LAST ACTIVITY: Today
```

**This shows P3, not P4.** I could not go deeper (open the Move's detail page to confirm
deliverables/approvals/gate state) because the signed-in browser session I was using for this
tenant expired mid-investigation, and re-authenticating requires a one-time email code this
environment has no way to receive. I am reporting this discrepancy exactly as observed, rather than
guessing at an explanation or completing the rest of this dossier from the earlier, now-possibly-stale
incident record.

**Do not treat this document's earlier sections (below) as reflecting confirmed current state** —
they are the honest, direct result of what I could and could not verify. Read §5 first for what
this actually means for your decision.

## 1. What I directly observed (timestamped, this session)

- **Source**: signed-in browser session, `https://app.abarva.ai/strategic-moves` list view.
- **Method**: `get_page_text` (a real, authenticated read of the rendered page — not an API call I
  constructed, not an inference from code).
- **Result**: MEMBER AI ASSIST shown at **P3 Design Future State**, 60% complete, status badge
  "AWAITING DECISION," last activity "Today."
- **What happened next**: the same browser tab's session subsequently expired (redirected to a
  Clerk-hosted re-authentication page requiring a one-time email code) before I could open the
  Move's phase-detail page to confirm the underlying `deliverables_v2`/approval/gate state behind
  this list-view summary. A second browser tab was signed in under a different tenant ("FS Demo")
  and has no tenant-switcher available — each signed-in identity maps to exactly one client
  workspace in this application, confirmed by the sign-in page's own text ("Each email is mapped to
  one client workspace. No tenant switcher is used").

## 2. What this could mean (possibilities, not conclusions)

1. **A governed correction already happened**, outside this session, moving the Move back to P3 —
   in which case the disputed-P4 record is now historical and this dossier's remaining questions
   (return to P3 vs. ratify P4) may already be moot.
2. **The Move was never durably at P4 in the way the original incident record assumed** — e.g., the
   list view's "phase" field and the specific gate-record fields the original incident traced
   (`deliverables_v2`, `phase_gate_decision` artifacts) could be reading from different underlying
   state, and a closer look might reconcile them without any correction having occurred.
3. **The list view is showing stale/cached data** and the Move is still genuinely at P4 underneath —
   the "Last activity: Today" datapoint argues against this (something changed recently), but I
   cannot rule it out without the deeper read I could not complete.

**I am not asserting which of these is true.** Distinguishing between them requires exactly the
deeper, signed-in investigation this document's access constraint prevented me from finishing.

## 3. What the original incident record already established (still valid, unaffected by the discrepancy above)

These are unchanged from the original record and remain valid regardless of which possibility in §2
turns out to be correct — they describe how a P3→P4 transition of this kind could happen, not
which phase is currently authoritative:

1. **Which endpoint was called**: `POST /api/v1/programs/:id/phase-gate-approval` — the signed-in
   Moves workspace's phase-gate approval path.
2. **Whether an override flag was sent**: No — the route's accepted body was `{ phase, rationale }`
   only; no override/bypass field existed then or now.
3. **Who/what initiated it**: The signed-in Moves workspace's "Approve & Build" flow, which — before
   this session's fixes (PR #5158, #5159) — called gate-approval before generation had actually
   completed, against fabricated evidence.
4. **Whether `evaluateGate()` passed or was bypassed**: It genuinely passed — against fabricated,
   self-signed placeholder evidence, not a bypass.
5. **Why the UI allowed it**: The sequencing bug (item 3) combined with the fabrication bug.
6. **Whether "(override)" was a real bypass**: No — confirmed a mislabeled soft-carry pass; fixed in
   PR #5160.

## 4. Root-cause fixes already shipped, unaffected by this discrepancy

PR #5158 (fabrication removed), #5159 (queue/approve decoupled), #5160 (honest labeling), #5161
(regression suite), #5166 (phase-capture evidence-integrity loophole closed) — all merged, deployed,
and runtime-verified. None of these altered MEMBER AI ASSIST's own data.

## 5. What this meant for the decision

At the time this dossier was drafted, the discrepancy in §0-§2 meant the original requested fields
(authoritative artifacts present, exact approvals present/missing, gate criteria pass/fail today,
consequences of each option) could not be completed responsibly without confirming the authoritative
phase.

That is now resolved. The owner decision was to return to P3, and the correction proof chain
confirms the Move now opens at P3 in the signed-in phase-detail page, not merely the list view.

The corrective conclusion is therefore: P4 should not be ratified from the disputed state; P3 is the
authoritative phase until P3 design evidence and deliverables are regenerated/revalidated through
the fixed gate path.

**The Move's phase was touched only after explicit authorization and only through the audited
operator correction described in the closure update.**

## 6. Access constraint — for the record

This environment's browser automation session for this specific tenant expired during the first
dossier pass. That limitation was later resolved by using the approved Meridian automation-agent
storage state, which produced the signed-in browser proof cited in the 2026-07-23 closure update.
