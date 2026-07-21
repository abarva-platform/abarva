# MEMBER AI ASSIST — Owner Decision Dossier (MOVES-REMEDIATION-001)

Status: **partial — a live-observation discrepancy blocks completing this dossier; owner input
required before proceeding further.** This is additive; it does not change the Move's phase, gate
state, or any production data. **No live phase transition was run or attempted.**

## 0. Read this first: an unresolved discrepancy

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

## 5. What this means for your decision — recommendation

Given the discrepancy in §0-§2, **I cannot respons­ibly complete the original dossier's requested
fields** (authoritative artifacts present, exact approvals present/missing, gate criteria pass/fail
today, consequences of each option) **without first confirming which phase is actually current**.
Presenting a confident "gate criteria pass/fail today" analysis built on a possibly-stale premise
(P4) when the Move may already show P3 would be exactly the kind of unverified claim this whole
audit exists to prevent.

**Recommended next step (your action, not mine)**: from your own signed-in session (which has
access to the Meridian Health / MEMBER AI ASSIST tenant workspace), open the Move's detail page and
confirm:
- The `currentPhase` value the phase-detail page itself reports (not just the list view's summary
  badge).
- Whether a `phase_gate_decision` artifact exists for a P3→P4 *or* a P4→P3 transition dated after
  the original 2026-07-20 incident record, which would explain the discrepancy directly.
- The real `deliverables_v2` rows and their `signed_off`/lifecycle status for this Move's P3
  artifacts.

Once you've confirmed the actual current phase, the remaining dossier work (artifacts present,
approvals present/missing, gate pass/fail, consequences of each option, recommended option, named
approver, remediation conditions) can be completed accurately — either by me, in a subsequent
session with working tenant access, or by you directly, in under the time it would take to review a
dossier built on an unconfirmed premise.

**The Move's phase has not been touched, and will not be, without your explicit instruction.**

## 6. Access constraint — for the record

This environment's browser automation session for this specific tenant expired mid-investigation.
Recovery requires a one-time email verification code this environment cannot receive (no email
inbox access). A second browser identity available in this environment is scoped to an unrelated
tenant ("FS Demo") with no in-app tenant-switching capability (confirmed via the sign-in page's own
disclosure: "Each email is mapped to one client workspace. No tenant switcher is used"). This is a
genuine environment/access limitation, not a decision to stop investigating — flagged here exactly
as the standing execution directive requires ("pause only when... credentials or permissions are
unavailable," stated plainly, not used as a blanket excuse to avoid the rest of the work already
completed in this program).
