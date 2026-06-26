# Tower Demo-Readiness Stop: Isolation And Portfolio Decisions Needed

Date: 2026-06-26
Branch: `codex/tower-demo-readiness-audit`
Base: `origin/main` at `3843ce562`

## Stop Reason

The Tower demo-readiness runbook requires the Tower repair lane to operate on the isolated `tower_*` plane only:

> Tower reads and writes `tower_*` only. It must not read the operational corpus where the real-client tenant alias lives.

Clean-main audit found active Tower code paths that read non-`tower_*` sources. The updated brief also requires an explicit holding-company path before work can proceed: Path A (schema-ready gaps) or Path B (labeled synthetic operating companies with reconciled consolidation).

Per the runbook, these are stop conditions before canonical-key normalization, leak-guard work, evidence-bridge repair, vendor deduplication, spend realism repair, portfolio hierarchy modeling, or answer composer changes.

## Evidence

### 1. Visible `/tower` route calls the current-state builder

File: `src/app/(maestro)/tower/page.tsx`

- Imports `buildAtlasTowerCurrentState` from `@/lib/atlas/tower-grounding`.
- Calls `buildAtlasTowerCurrentState(...)` for the signed-in client before rendering `TowerIndexPage`.

### 2. Current-state builder falls back to an enterprise-context projection

File: `src/lib/atlas/tower-grounding.ts`

- Line 13 imports `listProjectedTowerReadModelForClient` from `@/lib/tower/tower-semantic-projection`.
- Lines 240-245 call that projection when Tower admin initiatives/vendors are empty.

### 3. Projection reads `enterprise_context_records`

File: `src/lib/tower/tower-semantic-projection.ts`

- Lines 64-66 define the projection source as `'enterprise_context_records' | 'ai_control_tower' | 'empty'`.
- Lines 341-365 issue two SQL queries directly against `enterprise_context_records`.
- Lines 334-339 include Lakeshore alias expansion: `lakeshore-industries` and `lakeshore-holdings`.

### 4. AI Control Tower read model uses a context-layer materialized projection

File: `src/lib/ai-control-tower/read-model.ts`

- Lines 6-10 import `getControlTowerLensProjection`.
- Lines 1189-1200 call the projection before synthetic fallback.

File: `src/lib/tower/control-tower-lens-projection.ts`

- Lines 1-16 describe `ai_control_tower_lens_mv` as a materialized projection of the committed context layer.
- Lines 512-519 read from table `ai_control_tower_lens_mv`.

## Why This Blocks The Requested Repair

The requested Gate A-F repairs are explicitly scoped to an isolated `tower_*` plane. Today, the clean-main Tower path can still synthesize its visible read model from:

- `enterprise_context_records`
- `ai_control_tower_lens_mv`
- `ai_control_*` tables
- local synthetic fallback paths in the AI Control Tower read model

Proceeding with Tower-specific repair while these paths remain active would make proof ambiguous: a passing screenshot could be backed by the context projection instead of the intended Tower plane.

## Additional Stop Condition: Portfolio Path

The updated brief defines two mutually exclusive Lakeshore holding-company paths:

- **Path A (schema-ready):** add hierarchy/scope/allocation fields, render Level 1 consolidated Tower, and show Level 2/Level 3 as named gaps until operating-company data exists.
- **Path B (labeled synthetic opcos):** generate operating companies under `lakeshore-holdings`, with synthetic revenue/employees/industry profiles, attributed budgets/vendors/initiatives, and Gate F reconciliation.

The brief says: if the portfolio path/profile is unspecified, STOP -> `NEEDS_DECISION.md`.

No portfolio path/profile was provided in the task. That means Gate F cannot be implemented honestly yet.

## Decisions Needed

### 1. Runtime isolation decision

Choose one path before implementation continues:

1. **Strict Tower isolation now**
   - Disable/remove Tower runtime fallback reads from `enterprise_context_records` and `ai_control_tower_lens_mv`.
   - Add a `tower_*` read-model schema and loader/projection that receives copied, cited, tenant-scoped data from the approved source registry.
   - Gates A-D run only against `tower_*` tables.

2. **Allow a temporary projection bridge**
   - Explicitly approve `enterprise_context_records`/`ai_control_tower_lens_mv` as read-only upstream sources.
   - Require a materialization step into `tower_*` tables before UI rendering and aVa answers.
   - Gates A-D run against the materialized `tower_*` output, not directly against the upstream projection.

3. **Keep current mixed path for demo only**
   - Fastest, but violates the runbook isolation rule.
   - Not recommended; evidence would remain ambiguous and the Lakeshore alias/leak risk stays harder to fence.

### 2. Lakeshore portfolio path decision

Choose one path:

1. **Path A: schema-ready, no synthetic opcos yet**
   - Build the hierarchy fields and Tower read models.
   - Populate consolidated Level 1 only from current sourced data.
   - Render Level 2/Level 3 portfolio-company comparison and drill-down as named gaps.
   - Fastest honest path; best if the demo should not introduce new synthetic opcos yet.

2. **Path B: labeled synthetic opcos**
   - Requires a portfolio profile before generation: number of companies, industries, revenue bands, employee bands, and allocation rules.
   - All generated rows must be flagged `is_synthetic = true`.
   - Gate F must reconcile consolidated totals exactly and prevent double-counting shared costs.

## Recommended Decision

Choose runtime isolation option 2 plus portfolio Path A for the next PR:

- Permit upstream context reads exclusively inside a server-side `tower_*` materialization job.
- Require all runtime Tower surfaces and answer paths to read only `tower_*` read models.
- Add the holding-company hierarchy contract now.
- Keep Level 1 consolidated Tower populated.
- Render Level 2/Level 3 as named gaps until the operating-company synthetic profile is explicitly approved.

That preserves traceability, fixes the runtime ambiguity, avoids inventing opcos, and gives the CIO surface a truthful path to demo-readiness.

## Current Status

- Snapshot/repair tasks: not started.
- Gates A-F: not started.
- Data mutations: none.
- Destructive actions: none.
- Files changed: this stop artifact only.
