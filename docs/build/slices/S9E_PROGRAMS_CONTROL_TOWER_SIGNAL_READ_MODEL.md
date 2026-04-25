# S9e · Programs → Control Tower signal read model

Slice ID: S9e
Slice name: Programs → Control Tower signal read model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Adds a deterministic, seed-backed read model that converts canonical
Programs state into portfolio pressure signals that Control Tower /
Atlas can later consume. **No Tower UI build, no Atlas runtime
modification, no Nexus runtime touch, no migrations, no model calls.**

## What changed

- New module
  [src/lib/programs/programs-control-tower-signals.ts](../../../src/lib/programs/programs-control-tower-signals.ts):
  - Public types: `ProgramPressureSeverity`,
    `ProgramPressureType`, `ProgramSignalSource`,
    `ProgramControlTowerSignal`, `ProgramControlTowerSignalSummary`.
  - `buildProgramControlTowerSignals(tenant, program)` returns the
    deterministic signal list for one program.
  - `buildTenantProgramControlTowerSignals(tenant)` aggregates across
    every program in the tenant.
  - `summarizeProgramControlTowerSignals(signals)` returns counts by
    type, counts by severity, the top severity present, and the
    sorted unique list of program codes that emitted signals.
  - Layered on top of S9c (`buildCanonicalHardGateStrip`,
    `buildStewardReadinessNote`), S9d (`buildProgramReadinessSummary`),
    and S9b (`buildProgramNexusContextBundle`). No new state machine,
    no new Supabase reads, no model calls.

- New tests
  [src/__tests__/integration/programs/programs-control-tower-signals.test.ts](../../../src/__tests__/integration/programs/programs-control-tower-signals.test.ts):
  27 deterministic tests covering signal emission, severity mapping,
  determinism across calls, route-href correctness, no-fabricated-
  dollar-values, never-claims-evidence-or-value-as-ready,
  per-tenant aggregate parity with per-program concatenation, summary
  count reconciliation, canonical type union compliance, full required
  field set per signal, and module hygiene (no imports from Tower UI,
  Atlas runtime, Nexus runtime, agent runtime, Source UI, mock.ts, or
  auth).

## Signal types emitted

The read model emits six canonical signal types:

| Type | Source helper | Default severity | Notes |
|------|---------------|------------------|-------|
| `gate_missing_inputs` | `buildCanonicalHardGateStrip` (S9c) | `medium` (G1) / `high` (G2, G4) / `critical` (G3) | Emitted only for the gate at the program's current canonical phase. Programs in canonical Execute (spec phase 4) have no exit gate and therefore emit zero gate signals — honest. |
| `evidence_not_ready` | `buildProgramReadinessSummary` (S9d) | `high` | Always `not_seeded` while seed lacks evidence registry. |
| `value_not_ready` | `buildProgramReadinessSummary` (S9d) | `critical` | Highest severity because dollar exposure governs executive decisions. |
| `deliverable_coverage_gap` | `buildProgramReadinessSummary.requiredStubGaps` (S9d) | `medium` (1–2 gaps) / `high` (3+ gaps) | Suppressed when no required-but-stub deliverables exist. |
| `context_insufficient` | `buildProgramNexusContextBundle` (S9b) | `medium` (`pattern_only`) / `high` (`insufficient`/`blocked`) | Only emitted when bundle state is one of those three. |
| `executive_decision_needed` | `buildStewardReadinessNote` (S9c) | `high` (or `critical` when value is `not_seeded`) | Suppressed when Steward has zero blocking items (Execute-phase programs, for example). |

### Signal field set

Every emitted signal carries:

```ts
{
  id: string;                 // sig:<tenantKey>:<programSlug>:<type>:<suffix>
  tenantKey: string;
  tenantName: string;
  programCode: string;
  programName: string;
  type: ProgramPressureType;
  severity: ProgramPressureSeverity;
  title: string;
  summary: string;
  source: ProgramSignalSource;
  routeHref: string;          // /tenant/<routeSlug>/programs/<programSlug>
  missingInputs: ReadonlyArray<string>;
  recommendedAction: string;
  evidenceStatus: ReadinessSignal;
  valueStatus: ReadinessSignal;
  gateStatus: 'all_clear' | 'missing_inputs' | 'not_wired';
  createdFrom: 'deterministic_seed';
}
```

### Sort order (stable across calls)

1. severity desc (critical → high → medium → low)
2. type rank asc: `executive_decision_needed` (1) → `value_not_ready`
   (2) → `gate_missing_inputs` (3) → `evidence_not_ready` (4) →
   `context_insufficient` (5) → `deliverable_coverage_gap` (6)
3. id asc

This places the most actionable executive signal first, dollar
exposure second, the canonical gate that's currently missing inputs
third, and bookkeeping signals after.

## How this feeds future Control Tower / Atlas

- A future Tower UI slice can render these signals as pressure cards
  without re-deriving them: pass
  `buildTenantProgramControlTowerSignals(tenant)` straight into a
  card component.
- A future Atlas signal-emission slice can subscribe to
  `summarizeProgramControlTowerSignals(...)` to drive portfolio
  editorial ("3 critical pressures across 2 programs; G3 is the most
  rationalizable decision").
- Because the read model is pure and seed-only, the same shape can be
  re-used in CI signal validation and persona crawler reports.
- Signal IDs are stable, so a future persistence layer can dedupe
  alerts across runs without losing identity.

## What is intentionally NOT wired yet

- No Tower UI changes. Pressure-card rendering is deferred.
- No Atlas runtime subscription, no portfolio editorial composition.
- No persistence of signals; every call rebuilds from seed.
- No real evidence or value capture; signals always report
  evidence/value as `not_seeded` until a future seed-population slice
  lands.
- No production gate state machine; signals reflect S9c's seed-only
  classifier.
- No notification/alert delivery (email, Slack, in-app banner).
- No SLA / aging on signals (timestamps are absent because the read
  model is deterministic and time-free).

## What is deferred

- **Tower UI consumer slice (next, when ready)** — render pressure
  cards using this read model; wire `routeHref` to the canonical
  Programs detail.
- **Atlas signal subscriber slice** — pipe summary counts into
  portfolio editorial composition.
- **Seed-population slice** — when evidence and value are seeded,
  `evidence_not_ready` / `value_not_ready` / `executive_decision_needed`
  severities can drop without changing the read model's public API.
- **Persistence slice** — append-only signal log, dedup by id, alert
  cadence, recall window.

## Honest fallbacks used

- Every signal carries `createdFrom: 'deterministic_seed'` — a
  forward-compat marker so a future run-time-derived signal source can
  coexist without confusion.
- Every signal records `evidenceStatus` and `valueStatus` from S9d's
  `buildProgramReadinessSummary` rather than asserting fresh state.
- A per-program signal list is **never empty** for seeded programs:
  evidence and value signals always appear; gate and executive signals
  appear when the program's canonical phase carries them. Test
  asserts no signal claims evidence/value as `ready` while the seed
  lacks them.
- A test asserts no signal emits a dollar amount in any string field;
  the seed has no value capture so any dollar value would be
  fabricated.
- Programs in canonical Execute phase emit zero `gate_missing_inputs`
  signals because no canonical hard gate exits Execute — this is
  deliberate honest behavior, not a bug. The sanity test acknowledges
  it explicitly.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/programs-control-tower-signals.test.ts` — 27 passed
- Regression suites pass (S7, S9, S9b, S9c, S9d).
- `npm run build` — pass

Promotion to `verified` requires a live persona-walk by founder or
crawler that confirms the signal list for at least one canonical demo
tenant maps cleanly onto the eventual Tower pressure-card UI.

## Status

Code complete. Pending founder review.
