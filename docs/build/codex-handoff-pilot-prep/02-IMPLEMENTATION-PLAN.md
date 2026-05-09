# 02 · Implementation Plan

**Purpose:** the 5 sequenced PRs Codex ships during pilot prep week. Each PR has scope, acceptance criteria, files touched, and test bar. Sequential, not parallel — each PR's pass-rate informs the next.

**Total time estimate:** 4 working days for Codex.

---

## PR 1 · `tower: dynamic todayIso resolution + Apex demo-week pinning`

**Scope:** Fix the stale `todayIso = '2026-05-07'` pin so vendor renewal calculations align with the pilot week. Make `todayIso` resolvable from a small set of strategies.

**Why first:** every other Apex Atlas observation depends on `todayIso`. Without this fix, Codex's reasoning module ships with broken renewal windows.

**Files:**

- `src/app/(maestro)/tower/page.tsx`
  - Replace `function buildTowerToday(): string { return '2026-05-07'; }` with a resolver that prefers `process.env.TOWER_DEMO_TODAY` when set, otherwise pins to a stable demo-week date (e.g. `'2026-05-12'` for the pilot week).
- `src/__tests__/integration/tower/today-resolution.test.ts` (new)
  - Test resolver with env var present
  - Test resolver fallback when env unset
  - Test that all view-models receive the same `todayIso` value

**Acceptance:**

- [ ] `buildTowerToday()` reads `TOWER_DEMO_TODAY` env var with fallback `'2026-05-12'`
- [ ] All existing T-5/T-6/T-7/T-8 tests still pass
- [ ] New test file passes
- [ ] Lint clean
- [ ] Browser smoke: vendor renewal counts match what's expected for `'2026-05-12'`

**Acceptance for the pilot deploy:** set `TOWER_DEMO_TODAY=2026-05-12` (or per-day during pilot) in Vercel env; renewal windows track.

**Time:** ½ day.

---

## PR 2 · `data: Apex substrate augmentation (KPI history + decisions + scenarios + stakeholder notes)`

**Scope:** enrich Apex Retail substrate so Atlas drill-downs and observations have real depth. Today's loaded fixture is shallow (1-2 KPI rows per initiative); Codex augments to 4+ quarters per initiative across 2-3 KPIs + 5+ decisions with dissent + 6+ stakeholder notes with consent mix + 6+ scenarios with probabilities.

**Why second:** Atlas reasoning quality depends on substrate richness. PR 3's eval harness scores higher when PR 2 lands first.

**Files:**

- `docs/build/intelligence/ai-initiatives-package/templates/apex-retail/full_load.json`
  - Add 30-40 new KPI history rows (4 quarters × 2-3 KPIs × 7 initiatives, ~80 total)
  - Add 5-7 decision rows with `dissent_recorded=true` and `dissent_summary` text
  - Add 6-8 scenarios across initiatives (probability_pct distributed 10-80%)
  - Add 6-8 stakeholder notes (mix of `attribution_consent=true` and false)
- `src/scripts/seed/seed-apex-augmentation.ts` (new)
  - Idempotent loader that reads the augmented JSON and writes new rows
  - Uses upsert by natural key (kpi_name + quarter + initiative_id; decision_name + initiative_id; scenario_name + initiative_id)

**Spec for the new content:** see `05-APEX-SUBSTRATE-AUGMENTATION.md`. Codex follows that spec verbatim.

**Acceptance:**

- [ ] Apex JSON has ≥ 60 new rows distributed across kpi_history, decisions, scenarios, stakeholder_notes
- [ ] All new rows pass schema validation (run via `npx tsx src/scripts/seed/load-ai-initiatives.ts apex-retail --dry-run`)
- [ ] Augmentation seeder runs idempotently (re-running doesn't duplicate)
- [ ] No existing initiative names changed (substrate stable for prior tests)
- [ ] No PII in stakeholder_notes (check: name fields use realistic-but-fictional names)

**Time:** 1 day (the bulk is generating plausible content per the spec).

---

## PR 3 · `atlas: reasoning module v1 (interpretation pass + pattern selection + citation contract)`

**Scope:** the meat. Implement the Atlas reasoning module that runs alongside T-7's deterministic view-model. When `interpretationConfidence >= 'med'`, render Atlas's interpretation; when `'low'`, fall back to T-7. Build the eval harness runner against 24 cases.

**Why third:** depends on PR 1 (today) + PR 2 (rich Apex substrate) for meaningful eval pass.

**Files:**

- `src/lib/tower/atlas-pattern-selectors.ts` (new) — deterministic rule-based pattern selection per `03-SYNTHESIS-PATTERNS.md`
- `src/lib/tower/atlas-citation-validator.ts` (new) — schema-aware validator per `02-SUBSTRATE-CONTRACT.md`
- `src/lib/tower/atlas-interpretation-view.ts` (new) — main reasoning entry point
  - Inputs: `AtlasReasoningInput` bundle
  - Selects patterns (rule-based)
  - Calls LLM with system prompt + selected patterns + substrate slice
  - Validates citations
  - Returns `AtlasInterpretation`
- `src/lib/atlas/prompt.ts` (modify) — add reasoning patterns to system prompt; bump `ATLAS_PROMPT_VERSION` to `'tower-w5-v3-atlas-reasoning'`
- `src/app/(maestro)/tower/page.tsx` (modify) — call `buildAtlasInterpretation` server-side; pass to `TowerIndexPage`
- `src/components/tower/TowerIndexPage.tsx` (modify) — render Atlas interpretation when high-conf; fall back to T-7's `atlasObservationsView` when low-conf
- `src/__tests__/atlas-eval/run-eval.ts` (new) — test runner
- `src/__tests__/atlas-eval/cases/group-a-meridian.yaml` (new) — 8 cases per `07-EVAL-HARNESS.md`
- `src/__tests__/atlas-eval/cases/group-b-apex.yaml` (new) — 8 cases
- `src/__tests__/atlas-eval/cases/group-c-fcf.yaml` (new) — 5 cases
- `src/__tests__/atlas-eval/cases/group-d-refusals.yaml` (new) — 5 cases
- `src/__tests__/atlas-eval/cases/group-e-adversarial.yaml` (new) — 4 cases
- `src/__tests__/atlas-eval/probes/citation-completeness.ts` (new)
- `src/__tests__/atlas-eval/probes/pattern-correctness.ts` (new)
- `src/__tests__/atlas-eval/probes/compression.ts` (new)
- `package.json` — add `test:atlas-eval` script

**Acceptance:**

- [ ] Pattern selection matches the algorithm in `03-SYNTHESIS-PATTERNS.md` (deterministic, testable)
- [ ] Citation validator rejects: unknown fields, cross-tenant leak, uncited numerics
- [ ] Interpretation builder returns `AtlasInterpretation` with all required fields
- [ ] Fallback to T-7 when `interpretationConfidence === 'low'`
- [ ] Eval harness pass rate ≥ 75% across 24 cases (30 with Group E adversarial)
- [ ] Apex tenant pass rate specifically ≥ 80% (pilot tenant)
- [ ] All existing T-5/T-6/T-7/T-8 tests still pass
- [ ] Trace log entry written per render (PR 5 will add the table; PR 3 emits structured logs to stdout for now)

**Time:** 1.5 days.

---

## PR 4 · `metric-explainability: MetricExplanation builder + Ask Atlas chip`

**Scope:** every band tile, pressure card, 2×2 dot, Strategic Bets card gains an "Ask Atlas" affordance. Atlas drills into composition + contributors + levers + confidence floor per `10-METRIC-EXPLAINABILITY.md`.

**Why fourth:** depends on PR 3's reasoning infrastructure for the chat-side response.

**Files:**

- `src/lib/tower/metric-explanation-view.ts` (new) — per-metric explanation builder; matches `MetricExplanation` interface from `10-METRIC-EXPLAINABILITY.md`
- `src/components/tower/MetricProvenance.tsx` (modify) — add "→ Ask Atlas why this is at X" chip at bottom of popover
- `src/components/atlas/AtlasChatPanel.tsx` (modify) — accept `metricContext` prop; pre-fill chat with metric-specific opening
- `src/lib/atlas/orchestrator.ts` (modify) — route `metric_explanation` intent to the explanation builder
- `src/lib/atlas/types.ts` (modify) — add `'metric_explanation'` to `AtlasIntent` union
- `src/__tests__/atlas-eval/cases/group-h-explainability.yaml` (new) — 8 cases per `10-METRIC-EXPLAINABILITY.md`
- `src/__tests__/integration/tower/metric-explanation.test.ts` (new) — unit tests for the builder

**Acceptance:**

- [ ] Every band tile's ⓘ panel shows the "Ask Atlas" chip
- [ ] Clicking the chip opens AtlasChatPanel with the metric pre-loaded
- [ ] Atlas's response cites substrate fields (composition + contributors + excluded + levers)
- [ ] Group H eval cases pass at ≥ 80%
- [ ] Adoption · 50% Meridian drill-down matches the canonical example in `10-METRIC-EXPLAINABILITY.md`

**Time:** 1 day.

---

## PR 5 · `atlas: reasoning trace table + writer + admin viewer stub`

**Scope:** persist every Atlas render's trace per `09-OBSERVABILITY.md`. Operators can sample + grade traces to drive tuning.

**Why fifth:** doesn't block pilot, but operationally critical during pilot to grade what CXOs see.

**Files:**

- `supabase/migrations/20260513140000_atlas_reasoning_traces.sql` (new) — table per `09-OBSERVABILITY.md`
- `src/lib/atlas/reasoning-trace-writer.ts` (new) — writer with schema validation
- `src/lib/tower/atlas-interpretation-view.ts` (modify) — call writer on each render
- `src/app/(maestro)/admin/atlas/traces/page.tsx` (new) — basic admin viewer (list + click-through)
- `src/__tests__/integration/atlas/trace-writer.test.ts` (new)

**Acceptance:**

- [ ] Migration applies clean
- [ ] Trace writer captures all required fields per `09-OBSERVABILITY.md`
- [ ] Citation array is JSONB-validated at write time
- [ ] Admin viewer shows last 100 traces with filters (tenant, prompt_version, fallback_used)
- [ ] Each trace clickable to detail JSON

**Time:** ½ day.

---

## Total time

| PR | Scope | Codex days |
|---|---|---|
| 1 | todayIso fix | 0.5 |
| 2 | Apex substrate augmentation | 1.0 |
| 3 | Atlas reasoning v1 + eval | 1.5 |
| 4 | MetricExplanation + Ask Atlas | 1.0 |
| 5 | Trace log + admin viewer | 0.5 |
| **Total** | | **4.5 days** |

Codex starting Mon 2026-05-12 → done Fri 2026-05-16 with buffer for tuning. Pilot starts the following Monday.

**If pilot is THIS week (2026-05-12 onwards), skip PR 5 to land all critical path by Friday.** Trace log is operationally important but not user-facing.

---

## What Codex does NOT do in any of these PRs

- ❌ Modify Tower's left-rail layout, AppShell, or middleware
- ❌ Touch sibling agents (Sentinel/Steward/Nexus/Source)
- ❌ Auth or RLS changes
- ❌ Any work outside the file lists above
- ❌ Voice tuning of Atlas observations beyond what's directly specified in the training package
- ❌ Add new tabs, lenses, or band tiles
- ❌ Restructure the substrate schema (only adds fields if a migration is named in the spec)

---

## Coordination signals

If Codex hits any of these, stop and escalate:

- A type from a sibling agent's lib needs changing → defer to human review
- A test in Tier 5 starts failing for reasons outside the PR scope → diagnose, don't band-aid
- The eval pass rate drops below 50% on adversarial cases → likely Pattern 02 false positive; tighten triggers and re-run
- A migration touches an existing table's columns → escalate to human

---

## Final shipping discipline

- Each PR's title prefix: `tower:` for Tower-specific, `atlas:` for Atlas-specific, `data:` for substrate
- Each PR includes a "What Codex didn't do" section explaining deferred items
- Each PR's eval pass rate appears in the description
- Auto-merge after CI green; human flag-flip for risky changes (PR 3, PR 5)
