# 00 · Codex Operating Model

**Purpose:** define what Codex should take, what it should escalate, and how to know the difference. This is the "scope discipline" doc that keeps Codex in lane.

---

## What Codex is great at (take these)

### Implementation matching tight specs

The Atlas Training Package v1.1 is unusually well-bounded for an LLM. Every contract is stated as a TS interface or an algorithm. Codex can implement these without judgment calls:

- ✅ `MetricExplanation` builder per `10-METRIC-EXPLAINABILITY.md`
- ✅ Pattern selection rules per `03-SYNTHESIS-PATTERNS.md` (deterministic)
- ✅ Citation contract validator per `02-SUBSTRATE-CONTRACT.md`
- ✅ `atlas_reasoning_traces` migration + writer per `09-OBSERVABILITY.md`
- ✅ `AtlasReasoningInput` bundling in `page.tsx` per `00-CURRENT-STATE.md`

### Schema-valid fixture generation

Substrate augmentation is generative work over a stable schema. Codex thrives:

- ✅ Per-initiative KPI history rows (4+ quarters, schema-valid kpi_value/quarter/confidence_level)
- ✅ Decision rows with `dissent_recorded` flags + `dissent_summary` text
- ✅ Stakeholder note rows with `attribution_consent` mix
- ✅ Scenario library entries with `probability_pct` distribution
- ✅ Vendor renewal date adjustments to align with pilot week

### Test/eval harness mechanics

- ✅ 24 case YAMLs from the structure in `07-EVAL-HARNESS.md`
- ✅ Test runner that loads cases + runs probes + emits pass/fail
- ✅ Browser-based smoke tests (Playwright spec)
- ✅ Per-CXO walkthrough scripts as markdown

### Repetitive view-model work

- ✅ Per-tile `MetricExplanation` shape (similar across 5 tiles, mostly mechanical)
- ✅ Pattern composer for each of 6 patterns (well-shaped per spec)
- ✅ Trace shape + writer (deterministic JSON construction)

---

## What Codex should escalate (don't take these)

### Voice tuning

The "senior advisor, no fluff" voice is subjective. Codex's natural mode is fluent re-write — exactly the failure mode in `06-QUALITY-BAR.md`. **Codex should generate observations and flag them for human voice review, not ship voice changes alone.**

- ❌ Tuning Atlas system prompt phrasing for tone
- ❌ Deciding which adjective to drop
- ❌ Picking between two equally-grounded observations
- 👉 *Instead:* generate 3 alternative phrasings; flag for human pick

### Refusal calibration

The "dangerous middle" cases (`05-BOUNDARIES-AND-HANDOFFS.md`) need careful calibration. Too refusal-heavy → Atlas feels evasive. Too refusal-light → Atlas hallucinates. Codex tends to over-attempt.

- ❌ Tuning refusal triggers
- ❌ Picking when to defer to Sentinel vs. attempt
- ❌ Adjusting confidence floors on weak-evidence claims
- 👉 *Instead:* implement the refusal patterns as specified; surface borderline cases in trace logs for human review

### Cross-package architecture

- ❌ New surfaces (CIO View, /admin/atlas dashboard structure)
- ❌ Sibling-agent integrations (Sentinel ↔ Atlas, Steward ↔ Atlas)
- ❌ Tenant onboarding flows
- ❌ Auth + RLS changes
- 👉 *Instead:* implement within existing surface boundaries; flag if needs cross-package coordination

### Product judgment

- ❌ Whether to ship a feature for the pilot or defer
- ❌ Whether the eval pass rate is good enough
- ❌ Whether substrate augmentation is "demo theatrical" vs. real
- 👉 *Instead:* deliver per spec; let human review the result for product fit

---

## How Codex should signal escalation

When Codex hits a judgment call:

1. **Don't ship a guess.** Implement what the spec says verbatim; if spec is silent, stop.
2. **Open a follow-up issue or comment** describing the call needed.
3. **Continue with non-blocking work** in parallel.
4. **Flag in PR description** the unresolved question.

---

## Codex's working bounds

### Allowed file changes

```
src/lib/atlas/                          ← reasoning module
src/lib/tower/                          ← view-model extensions for explainMetric
src/components/tower/MetricProvenance.tsx  ← Ask Atlas chip
src/app/(maestro)/tower/page.tsx        ← view-model wiring + todayIso fix
src/scripts/seed/load-ai-initiatives.ts ← substrate augmentation
src/__tests__/atlas-eval/               ← new test directory
supabase/migrations/                    ← new trace table migration
docs/build/codex-handoff-pilot-prep/    ← updates to this package
```

### Out of bounds for Codex (without explicit human ok)

```
src/components/shell/                   ← AppShell + middleware-shaped surfaces
src/lib/auth/                           ← tenancy + RLS
src/lib/sentinel/                       ← sibling agent
src/lib/nexus/                          ← sibling agent
src/lib/source/                         ← sibling agent
supabase/migrations/ (cross-table changes other than the trace migration)
package.json / tsconfig.json / next.config
```

---

## How Codex should structure each PR

Each PR Codex opens should include:

1. **Title:** scope + intent (e.g. `atlas: implement reasoning module v1 per training package`)
2. **What changed:** file list with line-count delta
3. **Spec reference:** which training-package file(s) drove the implementation
4. **Tests:** new test count + pass count
5. **Eval pass rate** (if Atlas-related): % of 24 cases passing
6. **Manual review needed?** explicit list of judgment-call items for human review
7. **Pilot impact:** how this affects the 25-item PILOT_PREP_CHECKLIST

---

## Coordination with Claude (when Claude IS available)

Some work needs Claude even with Codex driving:

- **Initial reasoning prompt drafting.** Claude wrote the existing prompt voice; Codex extends it but Claude's review on first iteration improves it.
- **Pattern 02 false-positive tuning.** Subtle judgment call that benefits from a Claude pass.
- **Pilot retrospective.** After CXOs test, Claude can grade the trace log against the failure modes.

Suggested split:
- Codex: implementation, fixtures, eval harness, smoke tests
- Claude: voice review (1 hour), borderline refusal calibration (1 hour), pilot retro (2 hours)

That's ≤ 4 hours of Claude time across the whole pilot week. Achievable on a constrained budget.

---

## Failure mode: Codex over-implementing

The biggest risk with Codex is "ships everything in spec without judgment." The training package has 13 files; Codex might try to implement all of them at once. Force discipline:

1. **Scope each PR to ONE training-package file.**
2. **Land sequentially, not in parallel.** Each PR's eval pass informs the next.
3. **Stop when the 25-item checklist is green for v1.** v2 expansion happens after pilot.
4. **Don't auto-ship reasoning prompts.** Every prompt change goes through eval harness; failed eval = revert.

---

## What a successful Codex handoff looks like

By Friday 2026-05-11:

- 5 PRs merged (per `02-IMPLEMENTATION-PLAN.md`)
- 24-case eval at ≥ 75% pass
- 25-item checklist green
- Apex substrate augmented with 60+ new rows (KPIs, decisions, scenarios, stakeholder notes)
- "Ask Atlas" wired on every band tile
- Trace log capturing every render + drill-down

Codex doing 80% of this independently, Claude reviewing 20% of voice + judgment.
