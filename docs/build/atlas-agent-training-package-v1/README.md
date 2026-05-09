# Atlas Agent Training Package · v1.1.0

**Locked:** 2026-05-09
**Surface:** Tower CFO View (and CIO View when it ships)
**Agent:** Atlas — the CIO chief-of-staff who lives on Tower
**Outcome:** A tightly-scoped training package that closes the 8/10 → 10/10 CXO-grasp gap. Moves Atlas from rule-based template substitution to grounded reasoning AND makes every displayed metric interrogable on demand, without breaking the substrate-to-surface contract built by the Tower Fix Package + AI Initiatives Substrate Package.

**v1.1 adds** Metric Explainability — the contract that says every number Atlas displays, Atlas can explain. When a CFO asks "why is Meridian's adoption at 50%?", Atlas drills into substrate composition, contributor rows, exclusions, levers, and confidence floor.

---

## Why this package exists

After Tower T-1 through T-8 shipped, every visible region of Tower CFO View binds to per-tenant substrate:

- Band tiles aggregated from `ai_initiatives` + `ai_initiative_vendors`
- Pressure cards composed from `status_flag` + `status_summary` + vendor renewal windows
- Atlas observations synthesized from initiatives + vendors + composed pressures
- Strategic Alignment 2×2 plotted from real `display_id` + `name`
- Lens toggle reframes hero tile + pressure ranking + Atlas re-anchors

The data is honest. The composition is templated.

That gap — templated vs. interpreted — is where Atlas (the agent) takes over. The pre-T-9 view-models pick the top pressure and substitute names; they don't *reason* about why two value-lags share a root cause, or what's hiding behind a ratio that looks healthy. Atlas should.

This package teaches Atlas the surface, the substrate, the patterns, the voice, the boundaries, and the eval bar. It's substrate-aware without being substrate-rewriting. It's a training contract, not an implementation.

---

## What's in the box

```
atlas-agent-training-package-v1/
├── README.md                          (this file)
├── master-prompt.md                   orchestration · execution order for Claude Code
├── 00-CURRENT-STATE.md                honest audit of Atlas + Tower today (2026-05-09)
├── 01-ROLE-AND-VOICE.md               who Atlas is · senior advisor voice · what Atlas owns
├── 02-SUBSTRATE-CONTRACT.md           data Atlas reads · field-level provenance · what's queryable
├── 03-SYNTHESIS-PATTERNS.md           how Atlas composes observations · 6 named patterns with examples
├── 04-DECISION-INVENTORY.md           CFO postures Atlas supports · what to surface for each decision
├── 05-BOUNDARIES-AND-HANDOFFS.md      what Atlas refuses · when Sentinel/Steward/Nexus/Source own it
├── 06-QUALITY-BAR.md                  template-grade vs insight-grade · 6 worked examples
├── 07-EVAL-HARNESS.md                 test inputs + expected output shapes · 24 cases · 4 lenses
├── 08-FAILURE-MODES.md                hallucination prevention · refusal patterns · the dangerous middle
├── 09-OBSERVABILITY.md                what Atlas logs to traces · how to grade a turn
└── 10-METRIC-EXPLAINABILITY.md  ★NEW  every number Atlas displays, Atlas can explain · drill-down contract
```

Total: ~2900 lines of grounded prose. No code in this package — implementation is a follow-up wave that consumes this.

---

## How to execute

For an engineer or another AI tasked with implementing Atlas's reasoning layer:

1. Read **master-prompt.md** for execution order
2. Read **00-CURRENT-STATE.md** to understand what's already shipped (don't re-implement)
3. Read **01-ROLE-AND-VOICE.md** to understand who Atlas is
4. Read **02-SUBSTRATE-CONTRACT.md** to understand the data Atlas operates on
5. Read **03-SYNTHESIS-PATTERNS.md** for the 6 patterns Atlas should master
6. Read **05-BOUNDARIES-AND-HANDOFFS.md** to know when to defer
7. Read **06-QUALITY-BAR.md** to understand the bar
8. Read **07-EVAL-HARNESS.md** to know how Atlas will be graded
9. Read **08-FAILURE-MODES.md** to know what to refuse
10. Read **09-OBSERVABILITY.md** for the trace shape
11. Read **10-METRIC-EXPLAINABILITY.md** for the drill-down contract — Atlas as the live encyclopedia for every displayed number
12. Then implement, test against the eval harness, ship

---

## Doctrine constraints · do not violate

These are inherited from the existing Tower + AI Initiatives doctrine. The Atlas training does not relax any of them.

1. **Decision instrument, not a dashboard.** Atlas surfaces postures, not status.
2. **Every numeric claim traces to substrate.** No invented numbers. No "approximately." If the value isn't in the registry or computed deterministically from it, Atlas doesn't say it.
3. **Missing inputs read as invitations.** Atlas names the integration that would unlock the metric. Never errors-out, never hides the gap.
4. **Confidence indicators on every claim.** Solid HIGH · dashed MED · dotted LOW. Atlas inherits the field-level confidence_level and surfaces it.
5. **Three Tests gate respected.** Atlas does not compose claims that fail template-loadable + integration-target-exists + source-allows. Defers explicitly.
6. **Action-direction language.** Verb-leading. "Open re-baseline review." Not "Re-baseline review available."
7. **No corporate fluff.** No cheerleading. No filler. Senior advisor voice.

---

## What this package is NOT

- **Not an implementation.** No TypeScript, no view-model rewrites, no DB migrations.
- **Not a rebuild.** The deterministic Atlas observations view (T-7) stays. Atlas reasoning runs *alongside* it, not instead of it.
- **Not a chat polish.** Voice and tone are spec'd, but the Atlas chat surface (right rail input) is out of scope.
- **Not a full RAG/agent stack.** Tool-belt today (`query_portfolio_aggregates`, `query_signals`, etc.) is sufficient. This package shapes the prompt + reasoning, not the harness.

---

## Done state

After this package + its implementation wave land:

- ✅ Atlas observations on Tower CFO right rail are graded against the 24-case eval harness; ≥ 75% pass
- ✅ Every observation traces every numeric claim to a registry field
- ✅ Atlas defers in the 5 named refusal cases instead of speculating
- ✅ "If you only do one thing today" is interpretation, not template substitution
- ✅ Pattern detection across multiple pressures works (e.g., "two value-lags share a root")
- ✅ Atlas's voice is consistent with the senior-advisor system prompt today
- ✅ Every band tile / pressure card / 2×2 dot / Strategic Bets card has an "Ask Atlas" affordance; Atlas drills into composition + contributors + levers + confidence floor on demand (v1.1)
- ✅ The 8/10 CXO-grasp re-score for Meridian persona becomes 9-10/10

---

## Recommended package order

This package is ready to ship now. Recommended sequencing:

1. **Atlas Agent Training Package v1.0.0** (this one) · 0 PRs · documentation only
2. **Atlas reasoning layer implementation** · 2-3 PRs · consumes this package + the existing tool-belt
3. **Atlas eval harness wiring** · 1 PR · automates the grading
4. **Atlas trace export to /admin/atlas/traces** · 1 PR · operational visibility

Total: ~5 PRs from training to graded production.
