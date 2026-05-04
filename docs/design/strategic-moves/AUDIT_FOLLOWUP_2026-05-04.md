# Strategic Moves · Audit follow-ups (2026-05-04)

New divergences, open product questions, and process post-mortems surfaced AFTER `AUDIT_2026-05-04.md` was written. Triaged separately so the original audit stays immutable.

Format mirrors the original audit.

---

## F1 — PRs merged into dangling base branches (process issue, 3 occurrences)

- **Severity:** **High** (release-path correctness)
- **Symptom:** Three consecutive PRs merged cleanly on GitHub, but their commits did not reach `main`. Each had been opened against a sibling branch (its predecessor in a stack). By the time each was merged, its base had already merged into `main`, leaving the PR's merge target as an orphan branch tip.
- **Evidence (chronological):**
  - **PR-1501** (PR-2, pixel-match) — merge commit `28cb0523…` reachable only from `fix/strategic-moves-load-design-tokens-2026-05-04-bae9`. Restored via PR-1502.
  - **PR-1503** (PR-3, polish) — merge commit `28970a8c…` reachable only from `fix/strategic-moves-restore-pr2-to-main-bae9`. Restored via PR-1506 (PR-A).
  - **PR-1507** (PR-B, substrate v2 + gate-criteria doctrine) — merge commit `02186c1a…` reachable only from `audit/strategic-moves-audit-status-2026-05-04-bae9` (PR-A's branch tip post-merge). Restored via PR-1508 (this PR).
- **Root cause:** PR bases were set to the predecessor's branch rather than `main`. When the predecessor merged, its branch was not auto-deleted and the stacked PR's base did not auto-retarget. The `ManagePullRequest` tool offers a `base_branch` parameter when creating PRs; three times in a row I set it to the predecessor's branch "so it includes the predecessor's commits." That's the wrong mental model — it only matters what's reachable from `main` at merge time.
- **The actual fix (lesson learned on the third occurrence):** No PR on this project can ever have a `base_branch` other than `main`. Full stop. If a sequential PR needs its predecessor's state for diff hygiene, **branch off the predecessor locally, then push and open the PR against `main`**. The diff will show only the new commits because the predecessor's commits are already merged to main (or will be, at which point the rebase is a no-op).
- **Policy enforcement for me (the agent):** treat `base_branch != 'main'` on any `ManagePullRequest` call as a hard error to self-correct. Branch locally off the latest `origin/main`, push, open PR targeting `main`.
- **Status:** ✅ Mitigated via three restoration PRs (#1502, PR-A #1506, and this one #1508). Going forward, PR-B's lesson is the policy: `base_branch: 'main'` only.

---

## F2 — PR-3 description overclaimed audit coverage

- **Severity:** **Low** (documentation hygiene)
- **Symptom:** PR-3's body asserted "All 49 divergences from AUDIT_2026-05-04.md are now addressed." In practice, #10 (map legend) was not addressed in PR-3. #12 (mini rail on cards) was marked deferred but no follow-up doc existed.
- **Fix:** `AUDIT_STATUS_2026-05-04.md` now walks each divergence with per-row evidence. PR-A closes the #10 gap and logs #12 here.
- **Status:** ✅ Addressed in PR-A.

---

## F3 — Mini phase rail on cards (audit #12) — resolved

- **Severity:** **Medium / resolved**
- **Question:** Should home-view cards render a mini phase rail at the bottom?
- **Reference HTML:** `docs/design/strategic-moves/14-strategic-moves-home.html` `.cards` view does NOT render a mini rail. The rail only appears in detail view's header.
- **Earlier founder prompt (list in initial audit spec):** "card grid (Home) — 3-up grid, Fraunces 18/500 title, tenant + archetype mono eyebrow, status chip, **phase rail at bottom of each card**" — implied a mini rail.
- **Conflict:** reference HTML and earlier spec prose disagree.
- **Resolution 2026-05-04:** Follow reference HTML per `.cursorrules` hard rule: *"The HTML reference is canonical. Where it conflicts with current code, code changes — not the reference."* The earlier spec prose predated the canonical HTML. Cards render no rail. If this needs to change in the future, it's a one-line wire-up of the existing `<PhaseRail size="mini">` variant.
- **Status:** ✅ Closed — follow reference, no rail on cards.

---

## F4 — Milestones backfill template deviation (PR-1505 migration C)

- **Severity:** **Medium** (data)
- **Symptom:** PR-4 / PR-1505 migration C seeded 234 milestone rows against a 6-phase generic template (`charter_signed` / `current_state_mapped` / `target_approved` / `mvp_provisioned` / `production_cutover` / `performance_verified`). Founder spec locked 2026-05-04 specifies archetype-specific templates with 5–7 milestones each (e.g. `platform_modernization` → 7 named milestones; `workflow_automation` → 5 named milestones).
- **Gap:** the current 234 rows don't match the locked templates.
- **Fix:** PR-B migration — delete the 234 rows (stamped `[demo_milestones_backfill_2026_05_04]` so safely reversible) and re-seed with the v2 templates (stamp prefix `[demo_milestones_v2_2026_05_04]`). Runner handles dry-run + apply + report per the PR-3b pattern.
- **Status:** 🟡 Scheduled for PR-B.

---

## F5 — Activity stream missing action types

- **Severity:** **Medium** (data)
- **Symptom:** PR-1505 migration D seeded lifecycle transitions (phase_advanced, approval_submitted, deliverable_signed_off, etc.). Founder spec additionally requires `milestone_completed` (1 per completed milestone) and `sponsor_review_held` (1 per active move, dated within last 30 days).
- **Fix:** PR-B migration — additive insert of the 2 missing action types, stamped `[demo_audit_addendum_2026_05_04]`.
- **Status:** 🟡 Scheduled for PR-B.

---

## F6 — Participants role mix doesn't cover steward / team members

- **Severity:** **Medium** (data)
- **Symptom:** PR-1505 migration B seeded 1 sponsor + 1 lead per move. Founder spec requires 1 sponsor + 1 lead + 1 steward + 0–2 team_members scaled by archetype.
- **Fix:** PR-B migration — additive insert of steward + 0–2 team_members per move, stamped `notification_preferences->>'source' = 'participants_expansion_2026_05_04'`.
- **Status:** 🟡 Scheduled for PR-B.

---

## F7 — Gate criteria doctrine not implemented

- **Severity:** **Medium** (code)
- **Symptom:** `src/lib/programs/transformers.ts` returns 3 synthetic criteria regardless of phase (evidence captured / approvals cleared / oversight flag clear). Founder spec locks a **5-criteria-per-phase doctrine** with named criteria per phase; current phase shows 2–3 of 5 checked deterministically by `hashtext(move.id)`.
- **Fix:** PR-B code change in `transformers.ts` — phase-doctrine table with 40 criteria total (8 phases × 5). Non-data change.
- **Status:** 🟡 Scheduled for PR-B.

---

## F8 — Scatter view SVG rebuild (J2 — explicit defer)

- **Severity:** **Medium / deferred**
- **Symptom:** Current scatter implementation uses absolutely-positioned DOM bubbles. Reference is inline SVG with axes, value rings, animated red rings. PR-3's value-coverage gate hides the current implementation when data is thin, but the SVG rebuild itself was not in scope for any PR so far.
- **Audit items covered by this item:** #43 (tooltip card).
- **Fix:** Dedicated future PR. Will benefit from Wave 1 data (now 50/51 moves have projections).
- **Status:** 🟡 Deferred per J2 lock-in.

---

## Policy going forward

1. **Every PR against this surface cites its audit-doctrine row.** Either `[audit #N]` or `[follow-up F-N]` in the commit message or PR body.
2. **Nothing silently fixed.** If work surfaces a divergence not in the original audit, it's logged here as a new F-row before (or at commit time with) the fix.
3. **All PRs target `main` directly.** No sibling-branch stacking. If a sequential change needs its predecessor's state, branch off the predecessor locally, then push and open the PR against `main`. The `ManagePullRequest` tool's `base_branch` parameter is **always** `'main'` on this surface — treat anything else as a hard error after the three F1 occurrences above.
4. **Vercel preview wait SLA: 10 minutes.** If preview hasn't deployed within 10 minutes of a push, surface and pause.
5. **Data migrations:** dry-run → review report → apply → re-run for idempotency → commit with report in PR body. Every migration stamped for one-statement reversal.
