# Sentinel internal-consistency guard expansion — design

> Design doc. Owner: founder + AI engineering. Last updated 2026-05-15. Pairs with the existing arithmetic guard in `src/lib/agent/voice-doctrine/sentinel.ts:368` (`detectRankedMoneyOrderingContradiction`) shipped in PR #1932.

---

## Why this exists

The arithmetic guard from PR #1932 catches one specific class of internal-consistency error: ranked money values that are out of order ("true rank is Salesforce $14.6M, Adobe $8.8M, AWS $13.6M" — Adobe ranked above AWS but $8.8M < $13.6M). It's a regex + a numeric sort + a comparison. Cheap, fast, deterministic.

The audit 2026-05-13 found that single fix lifted Sentinel from a B-grade answer to an A-grade one. The same pattern — *catch an obvious internal contradiction before answer commit* — applies to several other failure modes that the model still produces. Each one is a separate post-generation check; together they form a consistency-guard suite.

This doc proposes 8 additional guards, ordered by leverage (highest-impact / lowest-effort first).

---

## Architecture

All guards plug into the existing `validateSentinelVoice(text, options)` entry point. Each guard is a pure function returning `VoiceDriftViolation | null`. Adding a guard = adding one function call in `validateSentinelVoice` + one regex + one comparison. Cheap to add; cheap to remove.

The existing `VoiceDriftViolation.category` already includes `'internal_consistency'`. New checks reuse it.

Failure-mode design: a guard that returns a violation **does not block the answer from being sent**. It writes to the answer's audit metadata so the response carries a reasoning-trace flag. Downstream:
- The Tower right-rail can surface the flag to the CXO ("this answer has 1 internal-consistency warning — review the line marked ⚠️").
- The C5 dashboard's agent-quality sample (PR #1961) ranks flagged answers higher in the "review these" list.
- If 2+ guards fire on the same answer, Sentinel re-generates once before returning.

This is consistent with the design philosophy: don't gag the model, just see what it's doing.

---

## Proposed checks (8)

### G1 — Sum reconciliation
**What.** When Sentinel lists numeric components and a total, the components must sum to the total within rounding tolerance.

**Example failure.** "Q3 spend was $4M on contract A, $3M on contract B, and $2M on contract C, totaling $10M." (4+3+2 = 9, not 10.)

**Regex shape.**
```
/(.*?)(\$?[\d.]+\s*[BMK])(.*?)(?:totaling|total|sum|combined)\s*[:\s]+\$?([\d.]+\s*[BMK])/i
```

**Effort.** ~50 lines + 4 unit tests. Same shape as G0 (the existing arithmetic guard).

**Leverage.** **High.** CFO conversations live and die on this; one off-by-one sum is what makes Sentinel feel "approximate" rather than rigorous.

---

### G2 — Date math
**What.** Statements like "renewal in N months" or "closes in N days" must be consistent with both today's date AND with any quoted absolute date in the same paragraph.

**Example failure.** "Adobe contract renews in 8 months (Sep 30, 2026)." (If today is 2026-05-15, +8 months = 2027-01-15, not Sep 30, 2026.)

**Inputs needed.** A reference to today's date — read from the request context (already injected as `composedAt`).

**Effort.** ~80 lines (date parsing is regex-y). Edge cases: month-end ambiguity, year rollover, "next quarter" relative phrasing.

**Leverage.** **High.** Renewal-calendar conversations are core to the product. Wrong date math here is a credibility hit.

---

### G3 — Percentage bounds
**What.** Numeric values labeled as a percentage must be in [0, 100] for ratios, or [0, ∞) for change-rates with explicit `%` change vocabulary.

**Example failure.** "Margin compression is 142% across the portfolio." (For a margin, 142% is incoherent — margins are ≤ 100%.)

**Subtlety.** "AI initiatives are at 141% of committed value" (Meridian's Ambient AI card from the audit) IS valid — exceeding a commitment > 100%. Don't false-positive these. The guard checks the **noun the percentage modifies** against an allowlist of "can-exceed-100%" nouns.

**Effort.** ~60 lines + an explicit allowlist (commitment-rate, run-rate, growth, etc.).

**Leverage.** Medium. The risk is high (one egregious false claim sinks confidence) but the model rarely produces this.

---

### G4 — Currency unit consistency
**What.** Within a comparison line, all money values must use the same unit (don't mix $M with $K).

**Example failure.** "AWS is $13.6M, well above Adobe's $8800K." (Same scale, different units, fine arithmetically — but reads as if the model couldn't normalize.)

**Effort.** ~30 lines. Detect adjacent money values; reject if units differ when both are < $1B.

**Leverage.** Low/medium. Quality-of-output issue more than correctness.

---

### G5 — Named-entity consistency
**What.** Within a single answer, the same person's name should be spelled consistently (Carlos / Carlos Rivera / C. Rivera all OK; "Charlie Rivera" is a fabrication).

**Approach.** Extract candidate name spans (regex on capitalized-multi-word phrases that don't appear in a generic-noun list). Cluster by last-name + first-initial. Flag if a cluster contains multiple first-names.

**Effort.** ~120 lines + a 10-row test fixture. NLP-flavored but tractable.

**Leverage.** **High** when it fires. Hallucinated alternative-spelling first names are the kind of error a CXO catches and never recovers from.

---

### G6 — Pattern-citation validity
**What.** When Sentinel cites a pattern ID (P-HC-014, PAT-AI-005, F200), that ID must exist in the corpus.

**Approach.** Maintain a set of valid pattern IDs (cheap; the seed files declare them). Regex-extract `\b(?:P|PAT|F)-?[A-Z0-9-]{2,}\b` candidates from the answer; cross-check against the set.

**Effort.** ~40 lines. The pattern-ID set is already available via `src/lib/intelligence/generated/pattern-manifest.json`.

**Leverage.** **High.** This is the citation-discipline contract — Sentinel claiming "binding pattern P-HC-099" when no such pattern exists is the worst kind of hallucination because it sounds authoritative.

---

### G7 — Time-tense consistency
**What.** Within a single sentence, future-tense markers ("will", "in N days", "by Q3") shouldn't mix with past-tense markers ("did", "closed", "shipped Q2").

**Example failure.** "The Adobe contract closed last quarter, but renewal arrives in 8 months." (Possible but contradictory — if it closed, it isn't pending renewal.)

**Approach.** Light part-of-speech tagging of verbs is overkill; a regex on common tense markers gets 80% coverage.

**Effort.** ~80 lines + careful test corpus (high false-positive risk).

**Leverage.** Medium. Lower-frequency error but high-confusion-cost when it happens.

---

### G8 — Forward-reference integrity
**What.** Answer says "as I noted in point 3" but only lists points 1-2. Or "see footnote 5" but no footnotes exist.

**Approach.** Detect numbered-list scaffolds and the highest declared index. Detect inline back-references (`point N`, `item N`, `footnote N`, `(see N)`). Compare.

**Effort.** ~50 lines.

**Leverage.** Low. Aesthetic. Worth doing only after the higher-leverage guards land.

---

## Cross-turn consistency (separate work)

A different class of consistency — *across* turns in a multi-turn session, Sentinel shouldn't contradict itself. The audit's continuity check (Q5: "Repeat the top 3 KPI pressures you named") tests this manually. Automating it is harder because it requires session memory + semantic comparison, not regex.

Out of scope for this doc. Tracked separately as a future Atlas-eval task.

---

## Rollout

| Phase | Guards | Effort | When |
|---|---|---|---|
| 1 | G1 sum reconciliation + G2 date math + G6 pattern-citation validity | ~3 days | Immediately after this doc lands |
| 2 | G3 percentage bounds + G5 named-entity consistency | ~3 days | After Phase 1 is in production for 1 week + we have telemetry on false-positive rate |
| 3 | G4 currency units + G7 tense + G8 forward refs | ~2 days | When Phase 1 + 2 are stable |

Each guard ships behind the **A3 feature-flag contract** (PR #1943) — `sentinel_guard_<name>` with policy `platform`, so we can toggle individual guards off if false-positive rate spikes for one customer.

---

## How we measure success

Two metrics:

1. **False-positive rate per guard.** A guard that flags > 5% of clean answers gets disabled until tuned. The C5 dashboard agent-quality sample (PR #1961) is the labeled corpus for this.

2. **Caught-violation rate.** Of the answers the model produces, what fraction has ≥1 guard fire? Audit baseline today: ~0.5% (the existing arithmetic guard catches ~1 of 200 answers in our test corpus). After Phase 1, expect 2-5% — most of the lift from G1 + G6. After Phase 2, expect 5-10%.

We **want** the caught-violation rate to be non-zero in production. A rate of 0 means we're not catching things — the model is making errors we're missing.

---

## Implementation notes

- All guards live in `src/lib/agent/voice-doctrine/sentinel-consistency-guards.ts` (new file).
- Each exports a single function `detect<Name>(text, ctx?): VoiceDriftViolation | null`.
- The dispatcher in `validateSentinelVoice` accumulates violations across all guards.
- Unit tests live alongside; each guard ships with a green test corpus + 3-5 red test corpus rows.
- Performance: the existing `detectRankedMoneyOrderingContradiction` runs in microseconds. All proposed guards are similar shape (regex + small numeric / set compare). No latency regression even at Phase 3 (8 guards total).

---

## What this design does NOT cover

- **Cross-turn (session-level) consistency** — see "Cross-turn consistency" above.
- **Semantic equivalence checks** — would the model agree with itself if asked the same question phrased differently? (LLM-as-judge work; separate item.)
- **Grounding completeness** — does the answer cite every claim, or does it slip in unsupported text? Citation-density is a separate guard category.
- **Tone/voice consistency** — different doctrine, covered by the existing voice doctrine in `sentinel.ts` (banned phrases, structural-element requirement, word-cap).

---

## Companion artifacts

- `src/lib/agent/voice-doctrine/sentinel.ts` — existing arithmetic guard + voice doctrine
- `src/lib/intelligence/generated/pattern-manifest.json` — pattern-ID source of truth for G6
- `docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md` — agent-quality sample panel that surfaces flagged answers (Phase 2 spec; implementation in PR #1961)
- `src/lib/features/` — A3 feature-flag contract per-guard toggles
- `docs/BACKLOG-2026-05-14.md` — add "Sentinel guard expansion · Phase 1" as a follow-up engineering item
