# AbarVa Expert Posture Pivot · Execution Plan

**Context:** After the 2026-05-09 audit and follow-up review, AbarVa is pivoting agent posture from "corpus-grounded with citation discipline" to "senior expert advisor across retail, healthcare, financial services AI." This package implements that pivot across all three agents and updates the audit rubric.

**This is a substantive voice change.** Every agent response will sound different after this ships — sharper, more opinionated, more confident, more conversational. That's the right voice for AbarVa's marketing claim and for the F100 CTO test.

---

## The package · four artifacts

| Artifact | Purpose | Time | Run order |
|---|---|---|---|
| `CURSOR_BRIEF_A_SENTINEL.md` | Updates Sentinel's system prompt to expert posture | 1 day | First |
| `CURSOR_BRIEF_B_NEXUS.md` | Updates Nexus's system prompt to expert posture | 1 day | After A |
| `CURSOR_BRIEF_C_SOURCE.md` | Updates Source-agent's system prompt to expert posture | 1 day | After B |
| `AUDIT_PROMPT_V3.md` | New audit rubric scoring against expert posture | Use during re-test | After all three |

---

## Run order

**Day 1 · Brief A (Sentinel)**
- Cursor locates Sentinel's current system prompt
- Replaces conversational/role section with the expert-posture version
- Adds five few-shot examples that demonstrate the posture
- Shows diff, waits for approval, commits, deploys
- Verify with the 4 verification queries in Brief A

**Day 2 · Brief B (Nexus)**
- Same process, specialized for Move-shaping
- The Sentinel→Nexus continuity from Codex Brief 3 should already be in place; this builds on it
- Verify Nexus picks up handoffs and responds with expert posture

**Day 3 · Brief C (Source-agent)**
- Same process, specialized for vendor selection
- Verify Source pushes back on weak selections, asks clarifying questions, doesn't fabricate

**Day 4 · Re-test with Audit v3**
- Run the 8-test audit pass from `RETEST_RUNBOOK.md` again
- Use `AUDIT_PROMPT_V3.md` instead of the prior audit prompt
- Compare results

---

## What this depends on

This package assumes the three earlier Codex Briefs have shipped:

- **Brief 1 (Truncation):** must be fixed before any audit is meaningful
- **Brief 2 (Original Sentinel epistemic posture):** is **superseded** by Brief A in this package — the expert posture is the corrected version
- **Brief 3 (Sentinel→Nexus continuity):** must be in place; Brief B builds on it

If Brief 2 (original) already shipped, that's fine — Brief A here replaces it. The earlier rule was correct on safety but too defensive on usefulness. The new version corrects.

If you haven't shipped Brief 2 yet, **skip it entirely** and ship Brief A instead. The expert posture is the better starting point.

---

## Expected outcomes after this pivot

When you re-run the 8-test audit pass with the updated agents and Audit v3:

| Metric | Pre-pivot baseline (2026-05-09) | Post-pivot target |
|---|---|---|
| advisor_grade | 1 of 8 | 6-7 of 8 |
| needs_work | 4 of 8 | 1-2 of 8 |
| fail | 4 of 8 | 0 of 8 |
| Dominant failure mode | IGNORED_TENANT_CONTEXT, NO_HANDOFF, HALLUCINATED_SPECIFICITY | None expected; possibly ACADEMIC_FLAGGING (partial pivot symptom) |
| Voice quality | Mixed — some grounded, some refusing, some over-formal | Consistent senior-advisor voice across all three agents |

If after the re-test you still see CORPUS_REFUSAL appearing, the prompt didn't deploy correctly — investigate before proceeding.
If you see ACADEMIC_FLAGGING, that's a partial-pivot symptom — reinforce with a few additional few-shot examples and re-test.

---

## What to watch for during the re-test

**The good signs:**
- Agents form views ("my read is...") instead of summarizing options
- Confidence calibration in plain language ("high confidence on this," "less sure on the timing")
- Agents push back when warranted instead of rubber-stamping
- Agents ask clarifying questions when the answer would change based on user intent
- Evidence is cited where it strengthens the argument, not as compliance
- Off-domain questions get brief, confident decline + redirect

**The warning signs:**
- "The corpus doesn't have..." anywhere → prompt didn't deploy
- "At the general AI industry level, not corpus-grounded for X..." → academic flagging crept in; needs reinforcement
- Agents listing options without forming a view → opinion-formation rule not landing
- Fabricated peer percentages or vendor metrics → no-fabrication rule needs reinforcement
- Agents validating user preferences without independent assessment → push-back rule needs reinforcement

---

## Important: what didn't change

Some things explicitly stay the same:

- **The corpus structure and content** — same five entity types, same provenance discipline, same cross-references. The agents reason from corpus *more naturally*; they don't reason from a different corpus.
- **The tenant overlay logic** — tenant context still scopes and weights corpus retrievals. Agents are smarter about *using* tenant context, not different in *receiving* it.
- **The handoff architecture** — Codex Brief 3's continuity still applies. Sentinel→Nexus handoffs still produce structured payloads; Nexus still picks them up.
- **The truncation fix** — Brief 1 still required. None of this matters if responses cut off mid-sentence.
- **Lane discipline** — agents still hand off when questions are squarely in another agent's territory.

The pivot is about **voice and posture**, not architecture or capability.

---

## After the pivot lands

When the re-test confirms the pivot worked:

1. **Update the marketing page** — the "AI Success Platform" positioning now has agents that demonstrate the claim. The marketing voice and the agent voice are aligned.
2. **Schedule the F100 CTO test** — the platform's first impression is now of a senior advisor, not a search engine. Right voice for that audience.
3. **Save advisor_grade responses as future few-shot material** — each strong response is training data for the next iteration.
4. **Audit cadence** — weekly sampling using Audit v3 to catch drift.

---

## Honest one-line summary

**The pivot is from "search-with-discipline" to "senior consultant who happens to have a corpus."** That's the platform's value claim. This package is what makes the agents demonstrate it.
