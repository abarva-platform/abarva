# Codex Brief 2 (Revised) — Sentinel Consultant Posture

**Slice ID:** `INT-VOICE.STRAT-2026-05-10c`
**Status:** Implemented in this PR. Replaces the original Brief 2 ("epistemic-honesty librarian with two-tier scoping").
**Founder sign-off:** consultant calibration, locked 2026-05-10.

---

## Why this brief exists

The 2026-05-09 audit caught Sentinel over-refusing on general AI-strategy questions. Brief 2 (original) tried to fix it by adding an "epistemic-honesty" rule and a two-tier scoping that said:

- Tier A — tenant-specific quantitative claims → apply honesty hedging.
- Tier B — general industry / pattern-level intelligence → answer freely.

The 2026-05-10 Apex / Carlos re-test ran the same eight queries and showed the original Brief 2 was *the wrong calibration even though it was directionally right*:

- **Test 4 regressed** from `ship_quality 4.4` to `needs_work 3.8`. Sentinel correctly identified a corpus gap on assortment failure modes, then *suppressed* the actual failure-mode content. The audit scored D1=2 (incomplete) because Sentinel pivoted to adjacent tenant data instead of delivering the asked content.
- **Tests 1, 2, and 4** all scored D1=2 because Sentinel kept opening with academic disclaimers ("not well-indexed in the current Apex Retail source set", "we don't have indexed pattern evidence") *before* delivering whatever answer it had.
- **The two-tier framing** itself read as bureaucratic. Sentinel was performing the framing rather than thinking through the question.

The pattern under all three: **Sentinel was producing search-with-disclaimers in a senior tone, not consulting.**

## The right calibration archetype

Carlos (CIO, Apex Retail, $2B revenue, 400 stores) is paying for the response a senior partner from a top-tier firm would give. That response has specific properties:

1. **Opinions, not summaries.** "My read is X — and here's why." Two or three sentences of reasoning, then move on. Bullets describing a landscape without a recommendation are not what a CXO is paying for.

2. **Confidence calibration in plain language.** Conversational phrases — "I'd put high confidence on this," "less sure on the timing," "this is judgment, not benchmark data." Calibration belongs in *how the claim is phrased*, not in a preamble before it.

3. **Citations conversational, not formal.** Name evidence where it strengthens the argument ("three peer specialty retailers in the corpus saw this"); skip it where it's just decoration.

4. **Disagree when warranted.** If the user proposes a direction the evidence contradicts, push back. Neutral presentation of options is not what a senior consultant does.

5. **One firm anti-fabrication line.** Reason about strategy, patterns, comparisons, recommendations — freely. Don't invent specific tenant facts. Don't fabricate peer statistics. That is the only line.

## What changed in code

### `src/lib/intelligence/ask/synthesizer.ts`

`SYSTEM_PROMPT` rewritten end-to-end. Five named sections:

- **CORE POSTURE** — Form a view, calibrate verbally, cite where it strengthens, disagree when warranted.
- **THE ONE FIRM LINE** — Don't fabricate tenant-specific facts or peer statistics. With concrete examples of fabrication shapes ("73% of retailers…", "Algonomy has 89% market share…").
- **BANNED FRAMINGS** — Retrieval-mechanics phrases that mark the agent as a search UI.
- **ALSO BANNED** — Academic / cover-your-back disclaimers ("based on the limited data available to me…", "at the general AI industry level, not corpus-grounded for [tenant] specifically…", "On the one hand … on the other hand …", "It's important to note…").
- **EXAMPLES** — Two worked examples (common AI bets, failure modes) with verbatim Apex / Carlos 2026-05-10 BAD anchors and consultant-posture GOOD shapes.

Output rules (length budget, plain text only, tenant pinning, evidence priority, handoff to Source / Nexus / Atlas) preserved.

### `src/lib/agent/voice-doctrine/sentinel.ts`

`PATTERN_LEVEL_FALLBACK` rewritten to mirror the consultant posture in the system-prompt body. The earlier "Tier A / Tier B" labels are gone — replaced with the consultant calibration archetype that is the same posture across all question types.

Two new `VoiceDriftCategory` values added:

- `academic_disclaimer` — six regexes catching "based on the limited data available", "at the general AI industry level", "not corpus-grounded for [tenant]", "from a high level…" / "at a high level…" as openers, "on the one hand … on the other hand …", "it's important to note…" as a hedge opener.
- `fabricated_statistic` — two regexes catching peer-prevalence fabrications ("73% of retailers", "47% of peer specialty retailers", etc.) and vendor-share fabrications ("Algonomy has 89% market share").

`SENTINEL_DOCTRINE_VERSION.voice` bumped `0.draft.2026-05-10b` → `0.draft.2026-05-10c`.

### `src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts`

- Stale "Tier A / Tier B" describe block removed.
- Stale "MANDATORY ANSWER SHAPES with 3-5 / 3-6 mandates" describe block removed.
- New `PATTERN_LEVEL_FALLBACK consultant posture` describe block — 11 assertions covering archetype, opinion-formation directive, verbal calibration, conversational citation, disagreement directive, the one firm anti-fabrication line, banned framings, banned academic disclaimers, the ~80% no-corpus-hit doctrine line, surface inclusion, and Source-surface omission.
- New `Ask synthesizer prompt — consultant posture` describe block — 7 assertions over the synthesizer source: senior-consultant archetype, CORE POSTURE section, THE ONE FIRM LINE with concrete fabrication examples, BANNED FRAMINGS list, banned academic disclaimers, both worked examples with verbatim BAD anchors, GOOD examples demonstrating consultant posture (push-back, verbal confidence, handoff to Source).
- New `academic_disclaimer` and `fabricated_statistic` test describe blocks asserting each new banned-pattern regex flags as expected and a clean consultant-posture answer passes without flag.

## What stays out of scope

- **Sentinel→Nexus continuity** (the original Codex Brief 3) — separate work stream. Test 5B in the 2026-05-10 audit still failed with `HISTORY_TRUNCATION_LOSS`. Continuity architecture is not yet wired.
- **Frontend table rendering for Nexus** — Test 6 / Test 8 showed table cells populated with sentence fragments. That is a Nexus prompt concern, not a Sentinel one.
- **Source-agent and Nexus consultant posture** — covered in Codex Brief 6. Recommended next PR.

## Verification

- All five Sentinel-touched files pass jest, eslint, tsc, and `npm run build`.
- The verbatim Apex / Carlos 2026-05-10 over-refusal response is locked in as a regression fixture in `sentinel.test.ts` and trips the validator with three retrieval-mechanics hits and (after this brief) is referenced as the canonical BAD anchor in the synthesizer prompt's worked examples.
- The post-hoc validator (`checkSentinelVoice`) now flags academic disclaimers and the obvious shape of fabricated peer statistics. False-positive risk on the vendor-share regex is acknowledged: a real tenant fact like "Apex Retail has 8% specialty market share" would be flagged for human triage; that is the right cost ratio given the alternative is shipping fabrications.

## Reading the prompt

The new `SYSTEM_PROMPT` in `src/lib/intelligence/ask/synthesizer.ts` is the canonical reference. It is intentionally written as a brief from a partner to a junior consultant — not as a procedural rulebook. If a future change needs to reshape the posture, the brief should be revised in the same register.
