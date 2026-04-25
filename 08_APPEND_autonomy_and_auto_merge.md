## Autonomy, approval boundaries, and auto-merge · Cycle 4 revision

**Added:** Cycle 4 canon revision session · April 24, 2026
**Addresses:** Conflict C10 from canon-vs-existing cross-check documented in commit `1653852`

This section reconciles the **10-item approval boundary** specified in document 00 with the **4-tier autonomy charter** specified in `docs/design-canon/agent-autonomy-decision-charter.md`. Both documents govern. They address different decision scopes.

### Scope separation

The approval boundary and the autonomy charter govern different categories of decisions.

**Canon approval boundary (doc 00 items 1-10):** governs *slice initiation*. What must be true before an implementation slice starts. Checks whether specs exist, wireframes exist, Context Bundle definitions exist, agent contracts exist, acceptance criteria exist, anti-patterns are named, and founder has approved the specific slice.

A slice without all 10 prerequisites met is not ready to start. This applies at cycle-scope-lock time and at session-start time, before any code is written.

**Autonomy charter Tiers 1-4:** governs *micro-decisions inside an already-approved slice*. Tier 1 decisions ("decide and move") cover variable naming, helper function placement, obvious refactors within the slice's file set, and similar low-stakes choices that don't require documentation. Tier 2 decisions ("decide with documented rationale") cover slightly more consequential choices that leave a trail but don't require founder approval.

These two layers compose correctly:

1. Founder approves a slice (canon approval boundary — all 10 prerequisites satisfied)
2. Implementing agent executes the slice, making Tier 1 and Tier 2 decisions autonomously within the approved scope
3. Tier 3 and Tier 4 decisions (larger impact, require approval) escalate to founder even within an approved slice
4. Any scope expansion beyond what the slice authorized → stop and ask (violates both canon and charter)

The canon approval boundary is the outer gate. The autonomy charter governs behavior inside the gate.

### Where the two docs must align

Both documents must make the scope separation explicit. This section serves that purpose for the canon side. A reciprocal note in `docs/design-canon/agent-autonomy-decision-charter.md` acknowledging the canon approval boundary is Cycle 5+ cleanup scope.

### Auto-merge authority retirement at Cycle 4+

A specific consequence of the canon approval boundary: **the auto-merge authority established in `memory/feedback_auto_merge_authority.md` for Cycle 3 retires at Cycle 4+.**

**Why:** That memory granted pre-approval to self-merge Code-lane PRs during the Wave 1 P0 sweep. That authority was appropriate for Cycle 3's execution character (rapid tactical fixes against a defined P0 list). It is incompatible with the canon approval boundary's item 8 ("Founder approves the slice explicitly") at slice initiation, and with item 10's verification requirement after implementation.

**What changes for Cycle 4+:**

- Every C4-Dxx slice requires explicit founder approval at scope lock (canon doc 00 item 8)
- Implementation proceeds only against locked specs
- Code-lane PRs do NOT auto-merge — they require founder review of the commit diff and the implementation review packet before merge
- Crawler persona verification runs after merge before any item is declared complete (canon F9.1 prevention)

**What stays the same:**

- Inside an approved slice, the autonomy charter's Tier 1/2 autonomy preserves velocity for micro-decisions
- Code-lane ownership of implementation work is unchanged — this is about the merge/approval gate, not about who writes the code
- Reporting discipline per doc 08 Section "Reporting standards" governs all sessions

### Founder action required

Before Cycle 4 scope locks, founder should either:

1. **Formally retire `memory/feedback_auto_merge_authority.md`** — delete or annotate as CYCLE-3-ONLY with an explicit expiration note, OR
2. **Approve the retirement implicitly** by answering Q1/Q2/Q3 and locking Cycle 4 scope — the act of locking scope against this canon constitutes acceptance of this reconciliation

Silence is not acceptance. If founder wants to preserve auto-merge authority in a modified form for Cycle 4 (e.g., pre-approved auto-merge for a specific slice after explicit spec-lock), that modification needs to be documented before Cycle 4 execution begins.

### Failure mode this prevents

This reconciliation prevents Failure Mode F9.1 (self-attested progress without independent verification) and F9.2 (cycle scope drift). Auto-merge authority at Cycle 4+ without spec-lock discipline would reproduce exactly the Cycle 1/2 failure mode where agents reported items closed after merge and crawler personas later revealed the underlying defects remained.
