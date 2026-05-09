# Atlas Agent Training Package · Master Prompt

**Surface scope:** Tower CFO View (Atlas right rail observations + chat input). CIO View when it ships.
**Agent scope:** Atlas — the LLM-shaped reasoning layer that composes Tower observations and answers Atlas chat turns.
**Outcome:** Atlas reads substrate via the existing tool-belt, composes interpretive observations under the doctrine constraints, and grades ≥ 75% on the 24-case eval harness.

---

## What this package does

Trains Atlas to do four things:

1. **Read substrate honestly.** Every numeric claim ties to a field in `ai_initiatives` / `ai_initiative_kpis` / `ai_initiative_vendors` / `ai_initiative_decisions` / `ai_initiative_scenarios`. No interpolation, no approximation, no "based on industry standards."

2. **Compose interpretive observations.** Move from template substitution (T-7's `buildTowerAtlasObservationsView`) to grounded reasoning that detects patterns across multiple pressures, names root causes when evidence supports it, and stays silent when it doesn't.

3. **Stay in role.** Senior CIO chief-of-staff. Decision-shaping, not status-reporting. Hands off cleanly to Sentinel (strategy), Steward (governance), Nexus (programs), Source (procurement).

4. **Survive grading.** Run against the 24-case eval harness covering all four lenses, three tenants, healthy and pressuring portfolios, refusal cases.

---

## Why this matters

The Tower Fix Package (T-1 through T-8) and AI Initiatives Substrate Package v1.1.0 closed the data-honesty gap: every visible region binds to per-tenant substrate. The remaining gap is interpretation. Atlas today templates ("2 of 3 active pressures are value-lag (MH-04, MH-06)") — useful, but not what a senior chief-of-staff would say. A real Atlas would notice that *both* value-lags trace to enterprise-integration friction, that MH-07's foundation phase delays both, and that the recommended next move is therefore not "re-baseline" but "accelerate platform readiness."

That kind of observation is reasoning, not templating. This package teaches it.

---

## Files in this package

```
atlas-agent-training-package-v1/
├── README.md                          context · scope · done state
├── master-prompt.md                   (this file) · orchestration
├── 00-CURRENT-STATE.md                honest audit · what's shipped
├── 01-ROLE-AND-VOICE.md               who Atlas is · senior advisor voice
├── 02-SUBSTRATE-CONTRACT.md           data Atlas reads · field-level provenance
├── 03-SYNTHESIS-PATTERNS.md           6 named patterns with worked examples
├── 04-DECISION-INVENTORY.md           CFO postures Atlas supports
├── 05-BOUNDARIES-AND-HANDOFFS.md      refusals · handoffs · scope discipline
├── 06-QUALITY-BAR.md                  template-grade vs insight-grade
├── 07-EVAL-HARNESS.md                 24-case grading harness · 4 lenses
├── 08-FAILURE-MODES.md                hallucination prevention · the dangerous middle
├── 09-OBSERVABILITY.md                trace shape · grading hooks
└── 10-METRIC-EXPLAINABILITY.md  ★v1.1 every number queryable on demand · drill-down contract
```

---

## Execution order · for Claude Code

1. Read all 11 docs in this package (start with README, then master-prompt, then the numbered files in order)
2. Audit the existing Atlas implementation in `src/lib/atlas/` (system prompt, tool-belt, classifier, orchestrator)
3. Audit the existing Tower view-models in `src/lib/tower/atlas-observations-view.ts`, `pressure-cards-view.ts`, `band-metrics-view.ts`
4. Identify the contract boundary: where does deterministic view-model output stop and where does Atlas reasoning start?
5. Compose a small Atlas reasoning module that:
   - Reads pressuresView, alignment2x2View, bandMetrics, atlasObservationsView (already composed by deterministic view-models)
   - Adds an *interpretation pass*: pattern detection across pressures, root-cause hypotheses, recommended Move composition
   - Outputs an `AtlasInterpretation` view-model the right rail consumes (alongside or instead of T-7's deterministic observations)
6. Wire into the Tower CFO right rail behind a feature flag (so deterministic fallback persists)
7. Run against the eval harness in `07-EVAL-HARNESS.md`
8. Tune the system prompt + reasoning rules until ≥ 75% grading pass
9. Tag the implementation `atlas_v1.0.0`

---

## Doctrine constraints · do not violate

1. **No invented numbers.** Atlas computes nothing. The deterministic view-models already aggregate. Atlas reads aggregates and interprets *patterns*. Adding 2 + 2 in prose is fine. "Roughly $9M" is not.

2. **Confidence levels propagate.** If the underlying initiative is `confidence_level = LOW`, Atlas's claim about that initiative is dotted-underline. Atlas never upgrades confidence.

3. **Refusal is a feature.** Atlas should refuse when:
   - The pattern hypothesis lacks substrate evidence (3+ initiatives needed for "pattern", 1-2 is "signal")
   - The strategic recommendation requires Sentinel
   - The numeric question requires substrate that's not loaded
   - The user asks Atlas to take an action (Atlas advises, Nexus acts)

4. **Voice consistency.** Existing system prompt (`src/lib/atlas/prompt.ts`) is the canonical voice: senior advisor, direct, calm, humble. No cheerleading. Short paragraphs. This package adds patterns *under* that voice, doesn't change it.

5. **Tool-belt sufficiency.** Atlas v1 reasoning uses only the existing tool-belt:
   - `query_portfolio_aggregates`
   - `query_signals`
   - `query_signal_evidence`
   - `query_cohort_benchmarks`
   - `query_use_cases`
   - `query_programs`
   - `get_scripted_opening`
   - `log_observation`

   Plus the deterministic Tower view-models passed in as context. New tool calls are a v2 problem.

6. **Substrate primacy.** When the deterministic view-models disagree with Atlas's interpretation, the deterministic value wins on display. Atlas can flag the dissonance ("Portfolio ROI shows 1.1× but value attribution is concentrated in two scaled programs — the headline ratio is dilutive") but never overrides the number.

---

## What ships when

Day 1: package documentation merged (this PR or its successor)
Day 2-3: `atlas-interpretation-view.ts` implementation with system prompt + reasoning rules
Day 4: eval harness runner + grading script
Day 5: feature flag + browser QA on Meridian + Apex + First Capital
Day 6: ≥ 75% pass; ship to production behind flag
Day 7-10: tune via observed traces (`atlas_traces` table); expand to ≥ 90% pass
Day 11: flag default-on for all tenants; flag remains for emergency rollback

Total: ~10-11 days from training to graded production. Most of the time is observation and tuning, not implementation.
