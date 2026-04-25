# I1 · Sentinel Pattern Detection Read Model

Slice ID: I1
Slice name: Sentinel Pattern Detection Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Adds a deterministic, seed-backed read model that converts the S9e
Programs → Control Tower signal list into named pattern detections
that a future Intelligence page (and the eventual live Sentinel
runtime) can subscribe to. **No Intelligence UI build, no Sentinel
runtime modification, no Atlas runtime touch, no Nexus runtime touch,
no migrations, no model calls.**

## What changed

- New module
  [src/lib/intelligence/sentinel-pattern-detections.ts](../../../src/lib/intelligence/sentinel-pattern-detections.ts):
  - Public types: `SentinelPatternKey`, `SentinelDetectionConfidence`,
    `SentinelPatternSeverity`, `SentinelPatternHandoffTarget`,
    `SentinelPatternEvidenceSignal`, `SentinelAffectedProgram`,
    `SentinelPatternDetection`, `SentinelPatternDetectionSummary`.
  - `buildSentinelPatternDetectionsForTenant(tenant)` — convenience
    wrapper that runs the S9e tenant signal builder and the detection
    pass.
  - `buildSentinelPatternDetectionsFromProgramSignals(tenant, signals)`
    — pure detection pass over an arbitrary signal list.
  - `summarizeSentinelPatternDetections(detections)` — aggregate
    counts by pattern, confidence, and severity, with stable
    `topConfidence`, `topSeverity`, and sorted unique
    `affectedProgramCodes`.
  - `SENTINEL_PATTERN_KEYS_IN_RANK_ORDER` — canonical pattern key
    list in rank order, useful for callers and tests.
  - Layered exclusively on top of S9e
    (`buildTenantProgramControlTowerSignals`,
    `ProgramControlTowerSignal`, `ProgramPressureSeverity`,
    `ProgramPressureType`, `ProgramSignalSource`) and the seed planner
    (`TenantSeedPlan`). No new Supabase reads, no new state machine,
    no model calls.

- New tests
  [src/__tests__/integration/intelligence/sentinel-pattern-detections.test.ts](../../../src/__tests__/integration/intelligence/sentinel-pattern-detections.test.ts):
  36 deterministic tests covering pattern triggers, stable detection
  IDs, sort ordering, confidence calibration, summary count
  reconciliation, route-href correctness, the empty-tenant edge case,
  and module hygiene (no imports from Intelligence UI, Sentinel
  runtime, Atlas runtime, Nexus runtime, agent runtime, Source UI,
  legacy /programs, mock.ts, auth, or migrations).

## How detections are derived from S9e pressure signals

```text
buildTenantProgramControlTowerSignals(tenant)        ← S9e
        │
        ▼
buildSentinelPatternDetectionsFromProgramSignals    ← I1
        │
        ▼
ReadonlyArray<SentinelPatternDetection>             ← deterministic
```

Each detection is filtered from a subset of the S9e signal list and
composed into a uniform shape. Every detection carries:

```ts
{
  id: string;                       // sentinel:<tenantKey>:<patternKey>
  tenantKey: string;
  tenantName: string;
  patternKey: SentinelPatternKey;
  patternName: string;
  confidence: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  whyItMatters: string;
  affectedPrograms: ReadonlyArray<{
    programCode: string;
    programName: string;
    routeHref: string;              // canonical /tenant/<slug>/programs/<slug>
  }>;
  sourceSignalIds: ReadonlyArray<string>;
  evidenceSignals: ReadonlyArray<SentinelPatternEvidenceSignal>;
  missingInputs: ReadonlyArray<string>;
  recommendedAction: string;
  handoffTargets: ReadonlyArray<'nexus' | 'atlas' | 'steward' | 'sentinel'>;
  routeHref: string;                // future /tenant/<slug>/intelligence/patterns/<patternKey>
  createdFrom: 'deterministic_seed';
}
```

## Initial patterns supported

| Pattern key | Trigger | Default severity | Notes |
|---|---|---|---|
| `value_ledger_incompleteness` | any `value_not_ready` signal | from contributing signals (≥`high`) | Critical signal severity from S9e propagates upward. Steering committees cannot defend dollar claims while seed-only. |
| `evidence_chain_gap` | any `evidence_not_ready` signal | `high` | Findings cannot survive CXO review without per-deliverable E-id citations. |
| `gate_governance_gap` | any `gate_missing_inputs` or `executive_decision_needed` signal | from contributing signals (G3 → `critical`) | Phase advancement cannot be justified from seed alone. |
| `program_context_sparsity` | any `context_insufficient` or `deliverable_coverage_gap` signal | `high` / `medium` | Nexus cannot reach `usable_with_gaps` until seeded. |
| `ai_governance_operating_model_gap` | ≥2 distinct programs each emitting at least one of `value_not_ready` / `evidence_not_ready` / `gate_missing_inputs` / `executive_decision_needed` | `high` (or `critical` when ≥3 programs and any critical contributing signal) | Meta pattern; conservatively suppressed when the gap is local to a single program. |

### Confidence calibration

| Distinct affected programs | Per-pattern detections | Meta `ai_governance_operating_model_gap` |
|---|---|---|
| ≥3 | `high` | `high` |
| 2 | `medium` | `medium` |
| 1, with a critical contributing signal or ≥2 contributing signals | `medium` | n/a (suppressed) |
| 1 weak signal only | `low` | n/a (suppressed) |

Every confidence value today is bounded by the seed's information
content — no detection can claim cross-program governance evidence
that has not been captured. This mirrors S9g's confidence cap on the
Atlas brief (`medium`).

### Sort order (stable across calls)

1. severity desc (`critical` → `high` → `medium` → `low`)
2. confidence desc (`high` → `medium` → `low`)
3. pattern key rank asc:
   1. `ai_governance_operating_model_gap`
   2. `value_ledger_incompleteness`
   3. `gate_governance_gap`
   4. `evidence_chain_gap`
   5. `program_context_sparsity`
4. id asc

This places the meta operating-model pattern first when severity and
confidence tie, then dollar-defensibility (value), then gate
governance, then evidence chain, then context sparsity.

## What is deterministic today

- Detection list is byte-equal across repeated calls for the same
  tenant.
- Detection IDs follow the canonical pattern
  `sentinel:<tenantKey>:<patternKey>` and are unique within a tenant.
- `routeHref` for the detection itself points to the future
  `/tenant/<routeSlug>/intelligence/patterns/<patternKey>` route. The
  route does not yet render; I2 will land it.
- Each affected program's `routeHref` resolves to the canonical
  `/tenant/<routeSlug>/programs/<programSlug>` detail (already wired
  via S9 / S9b / S9c / S9d).
- No detection invents a dollar amount in any string field (test
  enforced).
- `createdFrom` is always `deterministic_seed` (test enforced).
- No detection emits a timestamp or random id (test enforced via
  cross-call JSON-equality plus ISO/epoch regex scans).

## What is NOT yet live Sentinel runtime

- No streaming pattern compose, no Claude / OpenAI / Pinecone
  invocation.
- No persistence of detections; every call rebuilds from seed.
- No recurrence tracking — a future Sentinel persistence slice can
  dedup detections by id and surface "this pattern recurred N
  steering touchpoints in a row".
- No live retrieval — confidence cannot promote to `high` from
  seed alone for single-program detections; only cross-program scope
  can.
- No notification or alert delivery; no Atlas editorial composition
  yet wired (the meta pattern names that handoff target but does not
  invoke it).

## What is deferred to I2 Intelligence page

- **Intelligence page slice (I2)** — render the detection list on a
  tenant Intelligence surface, list affected programs with the S9e
  signal evidence drawer, and link out to the canonical Programs
  detail. The route `routeHref` field is intentionally pre-stamped so
  I2 only adds rendering, not a contract change.
- **Sentinel runtime subscriber slice** — wire a live Sentinel
  listener that subscribes to detection deltas, classifies recurrence,
  and updates the operating-model confidence to `high` once cross-
  steering recurrence is observed.
- **Persistence + recurrence slice** — append-only detection log
  keyed by detection id, replay safely across reruns.
- **Atlas editorial handoff** — compose portfolio editorial for the
  meta pattern when `confidence === 'high'`.
- **Notification / steering-touchpoint export** — render the
  detection list into a steering-committee summary export.
- **Live evidence + value signals** — once a future seed-population
  slice lands, `evidence_not_ready` / `value_not_ready` severities can
  drop, and these detections will automatically thin out without any
  change here.

## Honest fallbacks used

- Empty-tenant detection list is `[]`, not a fabricated detection.
  `summary.totalCount === 0`, `topConfidence === null`,
  `topSeverity === null`.
- Single-program detections cap at `medium` (with critical signal) or
  `low` (without) — never `high`. Tests assert this explicitly.
- The meta pattern is suppressed unless ≥2 distinct programs share
  the gap; this prevents a one-program operating-model claim, which
  the seed cannot defend.
- Every detection's `evidenceSignals` field is a sorted projection of
  the originating S9e signals, not an independent claim. A test
  asserts every `signalId` and `sourceSignalIds[i]` resolves back to
  the originating S9e signal list.
- `createdFrom: 'deterministic_seed'` is a forward-compat marker so a
  future runtime-derived detection source can coexist without
  confusion.
- Detection module never imports Intelligence UI, Sentinel runtime,
  Atlas runtime, Nexus runtime, agent runtime, Source UI, legacy
  /programs routes, mock.ts, auth, or supabase. Tests assert this
  with a static-source check.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/sentinel-pattern-detections.test.ts` — 36 passed
- Regression suites pass (S7, S9e, S9f, S9g).
- `npm run build` — pass

Promotion to `verified` requires a live walk by founder confirming
that for at least two canonical demo tenants the detection list maps
cleanly onto the eventual Intelligence page UI (I2).

## Status

Code complete. Pending founder review.
