# 01 · Context Bundle

**Purpose:** the exact set of files Codex should read before starting any work. Ordered for progressive context build-up.

If Codex reads these in order, it ends with full understanding of: the Tower surface, the substrate schema, the Atlas contract, the eval bar, the pilot scenarios.

---

## Reading order (45-60 minutes for a careful read)

### Tier 1 · Doctrine & current state (read first)

```
docs/build/atlas-agent-training-package-v1/README.md
docs/build/atlas-agent-training-package-v1/master-prompt.md
docs/build/atlas-agent-training-package-v1/00-CURRENT-STATE.md
docs/build/codex-handoff-pilot-prep/README.md
docs/build/codex-handoff-pilot-prep/00-CODEX-OPERATING-MODEL.md
```

This sets up: what Tower is, what's shipped, what Codex should/shouldn't take.

### Tier 2 · Atlas contracts (the spec Codex implements against)

```
docs/build/atlas-agent-training-package-v1/01-ROLE-AND-VOICE.md
docs/build/atlas-agent-training-package-v1/02-SUBSTRATE-CONTRACT.md
docs/build/atlas-agent-training-package-v1/03-SYNTHESIS-PATTERNS.md
docs/build/atlas-agent-training-package-v1/04-DECISION-INVENTORY.md
docs/build/atlas-agent-training-package-v1/05-BOUNDARIES-AND-HANDOFFS.md
docs/build/atlas-agent-training-package-v1/06-QUALITY-BAR.md
docs/build/atlas-agent-training-package-v1/07-EVAL-HARNESS.md
docs/build/atlas-agent-training-package-v1/08-FAILURE-MODES.md
docs/build/atlas-agent-training-package-v1/09-OBSERVABILITY.md
docs/build/atlas-agent-training-package-v1/10-METRIC-EXPLAINABILITY.md
```

These 10 files are Codex's contract for what Atlas must do. Implementation must match.

### Tier 3 · Pilot mechanics (the operational layer)

```
docs/build/codex-handoff-pilot-prep/02-IMPLEMENTATION-PLAN.md
docs/build/codex-handoff-pilot-prep/03-PILOT-PREP-CHECKLIST.md
docs/build/codex-handoff-pilot-prep/04-CXO-SCENARIO-CATALOG.md
docs/build/codex-handoff-pilot-prep/05-APEX-SUBSTRATE-AUGMENTATION.md
docs/build/codex-handoff-pilot-prep/06-CRITICAL-PATH.md
```

### Tier 4 · Existing code surface (reference only, don't read end-to-end)

#### Tower view-models (already shipped, Codex extends these)

```
src/lib/tower/band-metrics-view.ts          ← T-5 · band tile aggregation
src/lib/tower/pressure-cards-view.ts        ← T-6 · pressure card composition
src/lib/tower/atlas-observations-view.ts    ← T-7 · deterministic Atlas observations (the FALLBACK Codex's reasoning runs alongside)
src/lib/tower/strategic-alignment-2x2-view.ts  ← T-4 · 2×2 plotting
src/lib/tower/metric-provenance.ts          ← T-4 · ⓘ panel content
src/lib/tower/deferred-metrics.ts           ← T-4 · "Coming next" block
```

#### Atlas existing code (Codex extends, doesn't rewrite)

```
src/lib/atlas/types.ts                  ← AtlasTenancyCtx, AtlasIntent, etc.
src/lib/atlas/prompt.ts                 ← system prompt (Codex extends with reasoning patterns)
src/lib/atlas/orchestrator.ts           ← turn handler (Codex hooks into this)
src/lib/atlas/tool-belt.ts              ← 8 query functions (Codex uses these as-is)
src/lib/atlas/repository.ts             ← DB layer for Atlas tables
src/lib/atlas/classifier.ts             ← intent routing
src/lib/atlas/scripted-engine.ts        ← pre-canned responses for known intents
src/lib/atlas/llm.ts                    ← LLM call wrapper
```

#### Substrate query layer (Codex uses as-is)

```
src/lib/admin/ai-initiatives/queries.ts        ← listInitiativesForClient, listVendorsForClient, etc.
src/lib/admin/ai-initiatives/detail-queries.ts ← per-initiative detail (KPIs, vendors, decisions, scenarios, stakeholder notes)
```

#### Components (Codex modifies)

```
src/components/tower/TowerIndexPage.tsx     ← main canvas; SubstrateKpi + SubstratePressure live here
src/components/tower/MetricProvenance.tsx   ← ⓘ panel (Codex adds "Ask Atlas" chip)
src/components/atlas/AtlasRail.tsx          ← Atlas chat surface
src/components/atlas/AtlasChatPanel.tsx     ← chat panel
src/app/(maestro)/tower/page.tsx            ← Tower page (Codex adds reasoning view-model build)
```

#### Substrate templates (Codex augments)

```
docs/build/intelligence/ai-initiatives-package/templates/apex-retail/full_load.json
docs/build/intelligence/ai-initiatives-package/templates/meridian-health/full_load.json
docs/build/intelligence/ai-initiatives-package/templates/first-capital-financial/full_load.json
```

#### Schema (read for reference)

```
supabase/migrations/20260507230500_ai_initiatives_registry.sql      ← AIR-1 · spine
supabase/migrations/20260507233000_ai_initiatives_widen_outcome_status.sql ← AIR-1b
supabase/migrations/20260502171000_private_setup_ai_initiatives.sql ← per-tenant private plane (different from registry)
```

### Tier 5 · Tests (Codex extends)

```
src/__tests__/integration/tower/tower-t5-band-metrics.test.ts        ← 23 tests · band aggregation
src/__tests__/integration/tower/tower-t6-pressure-cards.test.ts      ← 17 tests · pressure cards
src/__tests__/integration/tower/tower-t7-atlas-observations.test.ts  ← 19 tests · Atlas observations (deterministic)
src/__tests__/integration/tower/tower-t8-lens-toggle.test.ts         ← 17 tests · lens toggle
src/__tests__/integration/tower/tower-t4-strategic-alignment-2x2.test.ts  ← 27 tests
src/__tests__/integration/tower/tower-t4-metric-provenance.test.ts   ← 11 tests
src/__tests__/integration/tower/tower-t4-deferred-metrics.test.ts    ← 7 tests
src/__tests__/integration/tower/tower4-lens-tabs.test.ts             ← 27 tests
```

---

## What NOT to read (avoid context bloat)

These are out of scope for the pilot and will distract:

- ❌ `src/lib/sentinel/**` (sibling agent, not Atlas's surface)
- ❌ `src/lib/nexus/**` (sibling agent)
- ❌ `src/lib/source/**` (sibling agent)
- ❌ `src/components/intelligence/**` (separate surface, not Tower)
- ❌ `src/lib/programs/**` (program instances, not AI initiatives — different substrate)
- ❌ `docs/build/intelligence/INT-*` (intelligence v3 docs, separate workstream)

If Codex finds itself reading these, it's drifted off scope.

---

## Specific files Codex modifies in the 5 PRs

(Per `02-IMPLEMENTATION-PLAN.md`)

### PR 1: today fix + Apex augmentation

```
M  src/app/(maestro)/tower/page.tsx                ← buildTowerToday() resolves dynamically
A  scripts/augment-apex-substrate.ts                ← ad-hoc augmentation script
M  docs/build/intelligence/ai-initiatives-package/templates/apex-retail/full_load.json   ← new rows
A  src/__tests__/integration/tower/today-resolution.test.ts
```

### PR 2: KPI history + decisions + scenarios for Apex

```
M  docs/build/intelligence/ai-initiatives-package/templates/apex-retail/full_load.json
A  src/scripts/seed/seed-apex-augmentation.ts
```

### PR 3: Atlas reasoning module v1

```
A  src/lib/tower/atlas-interpretation-view.ts       ← new reasoning module
A  src/lib/tower/atlas-pattern-selectors.ts         ← deterministic pattern selection
A  src/lib/tower/atlas-citation-validator.ts        ← citation contract enforcement
M  src/lib/atlas/prompt.ts                          ← add reasoning patterns to prompt
M  src/app/(maestro)/tower/page.tsx                 ← wire interpretation alongside T-7
M  src/components/tower/TowerIndexPage.tsx          ← render from interpretation when high-conf
A  src/__tests__/atlas-eval/cases/                  ← 24 case YAMLs
A  src/__tests__/atlas-eval/run-eval.ts             ← test runner
A  src/__tests__/atlas-eval/probes/                 ← citation_completeness, pattern_correctness, compression
```

### PR 4: MetricExplanation builder + "Ask Atlas" chip

```
A  src/lib/tower/metric-explanation-view.ts         ← per-metric explanation builder
M  src/components/tower/MetricProvenance.tsx        ← add "Ask Atlas" chip + onClick
M  src/components/atlas/AtlasChatPanel.tsx          ← accept metricKey context param
M  src/lib/atlas/orchestrator.ts                    ← route metric_explanation intent
A  src/__tests__/atlas-eval/cases/group-h/          ← 8 explainability cases
```

### PR 5: trace log table + writer

```
A  supabase/migrations/20260513140000_atlas_reasoning_traces.sql
A  src/lib/atlas/reasoning-trace-writer.ts
M  src/lib/tower/atlas-interpretation-view.ts       ← invoke trace writer
A  src/__tests__/integration/atlas/trace-writer.test.ts
```

---

## Tooling Codex needs

```
# Run tests
npm run test:nav
npm run test:behaviors
npm run test:integration

# Type check
npx tsc --noEmit -p tsconfig.json

# Lint touched files
npx eslint <path>

# Run the eval harness (after PR 3)
npm run test:atlas-eval

# Browser smoke (after substrate augmentation)
npx playwright test tests/e2e/tower-pilot-smoke.spec.ts

# DB migrations (manual paste — see memory note: db:migrate runner)
npm run db:migrate
```

---

## Substrate access at runtime

Codex's reasoning module reads via the existing `src/lib/admin/ai-initiatives/queries.ts` API — no new query layer. The bundle Atlas sees per turn:

```ts
{
  tenant: { name, clientId },
  todayIso,
  lens,
  bandMetrics,        // T-5 output
  pressuresView,      // T-6 output
  alignment2x2View,   // T-4 output
  initiatives,        // raw rows from listInitiativesForClient
  vendors,            // raw rows from listVendorsForClient
  // KPIs, decisions, scenarios, stakeholderNotes via tool-belt as needed
}
```

---

## Quick orientation if Codex is starting cold

If Codex has never seen this codebase:

1. Read `CLAUDE.md` (root) for stack overview
2. Read `AGENTS.md` (root) for Cursor Cloud specifics
3. Read this README (already done if you're here)
4. Read the Tier 1 + Tier 2 files above (~45 min)
5. Skim Tier 4 files for ~15 min
6. Start PR 1 from `02-IMPLEMENTATION-PLAN.md`

If Codex is already working in this repo, skip directly to Tier 1.
