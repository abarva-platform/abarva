# Strategic Moves · Audit follow-ups (2026-05-04)

New divergences, open product questions, and process post-mortems surfaced AFTER `AUDIT_2026-05-04.md` was written. Triaged separately so the original audit stays immutable.

Format mirrors the original audit.

---

## F1 — PR-2 and PR-3 merged into dangling base branches (process issue)

- **Severity:** **High** (release-path correctness)
- **Symptom:** PR-2 (#1501) and PR-3 (#1503) both merged cleanly on GitHub, but their commits did not reach `main`. Both had been opened against a sibling branch (PR-1's branch for PR-2, PR-1502's branch for PR-3). By the time each was merged, its base had already merged into `main`, leaving the PR's merge target as an orphan branch tip.
- **Evidence:**
  - PR-1501 merge commit `28cb0523…` reachable only from `fix/strategic-moves-load-design-tokens-2026-05-04-bae9` remote branch, not from `main`. Restored via PR-1502.
  - PR-1503 merge commit `28970a8c…` reachable only from `fix/strategic-moves-restore-pr2-to-main-bae9` remote branch, not from `main`. PR-3's 3 commits (default cards, scatter gate, detail-shell) restored via this PR (PR-A).
- **Root cause:** Draft PRs stacked on a sequence of sibling branches (PR-1 → PR-2 → PR-3 → PR-3b → PR-4) where each PR's base was its predecessor. When the predecessor merged to `main`, its branch was not automatically deleted and the stacked PR's base did not auto-retarget.
- **Fix:** `AUDIT_FOLLOWUP` hard rule going forward — **all PRs target `main` directly** and rebase on top as upstream lands. No more stacked-PR-over-sibling-branch patterns on this project.
- **Status:** ✅ Mitigated via PR-1502 (PR-2 restoration) and this PR (PR-3 restoration). New PRs (PR-A, PR-B, all subsequent) target `main`.

---

## F2 — PR-3 description overclaimed audit coverage

- **Severity:** **Low** (documentation hygiene)
- **Symptom:** PR-3's body asserted "All 49 divergences from AUDIT_2026-05-04.md are now addressed." In practice, #10 (map legend) was not addressed in PR-3. #12 (mini rail on cards) was marked deferred but no follow-up doc existed.
- **Fix:** `AUDIT_STATUS_2026-05-04.md` now walks each divergence with per-row evidence. PR-A closes the #10 gap and logs #12 here.
- **Status:** ✅ Addressed in PR-A.

---

## F3 — Mini phase rail on cards (audit #12) — product decision needed

- **Severity:** **Medium / deferred pending product call**
- **Question:** Should home-view cards render a mini phase rail at the bottom?
- **Reference HTML:** `docs/design/strategic-moves/14-strategic-moves-home.html` .cards view does NOT render a mini rail. (The rail only appears in detail view's header.)
- **Earlier founder prompt (list in initial audit spec):** "card grid (Home) — 3-up grid, Fraunces 18/500 title, tenant + archetype mono eyebrow, status chip, **phase rail at bottom of each card**" — which does imply a mini rail.
- **Conflict:** the reference HTML and the spec prose disagree.
- **Current state:** No mini rail. `PhaseRail` component supports a `size="mini"` variant (built in PR-2 commit 1 for exactly this case but not wired in).
- **Decision tree (pick one):**
  - **(a)** Follow reference HTML → no rail on cards. Keep current behavior. Close this item.
  - **(b)** Follow spec prose → add `<PhaseRail current={move.currentPhase} size="mini" showLabels={false} />` to each `.card`. One-line change per card; no migration.
- **Status:** ❌ Open. Awaiting founder pick between (a) and (b).

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
3. **All PRs target `main` directly.** No sibling-branch stacking.
4. **Vercel preview wait SLA: 10 minutes.** If preview hasn't deployed within 10 minutes of a push, surface and pause.
5. **Data migrations:** dry-run → review report → apply → re-run for idempotency → commit with report in PR body. Every migration stamped for one-statement reversal.
