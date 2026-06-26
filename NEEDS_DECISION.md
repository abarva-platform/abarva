# Tower Demo-Readiness Stop: Isolation Decision Needed

Date: 2026-06-26
Branch: `codex/tower-demo-readiness-audit`
Base: `origin/main` at `3843ce562`

## Stop Reason

The Tower demo-readiness runbook requires the Tower repair lane to operate on the isolated `tower_*` plane only:

> Tower reads and writes `tower_*` only. It must not read the operational corpus where the real-client tenant alias lives.

Clean-main audit found active Tower code paths that read non-`tower_*` sources. Per the runbook, this is a stop condition before canonical-key normalization, leak-guard work, evidence-bridge repair, vendor deduplication, or answer composer changes.

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

The requested Gate A-D repairs are explicitly scoped to an isolated `tower_*` plane. Today, the clean-main Tower path can still synthesize its visible read model from:

- `enterprise_context_records`
- `ai_control_tower_lens_mv`
- `ai_control_*` tables
- local synthetic fallback paths in the AI Control Tower read model

Proceeding with Tower-specific repair while these paths remain active would make proof ambiguous: a passing screenshot could be backed by the context projection instead of the intended Tower plane.

## Decision Needed

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

## Recommended Decision

Choose option 2 only as a transitional bridge: permit upstream context reads exclusively inside a server-side `tower_*` materialization job, then require all runtime Tower surfaces and answer paths to read only `tower_*` read models.

That preserves traceability and avoids blocking demo-readiness on a full ingestion redesign, while still preventing the visible Tower surface from reaching directly into operational context.

## Current Status

- Snapshot/repair tasks: not started.
- Data mutations: none.
- Destructive actions: none.
- Files changed: this stop artifact only.

