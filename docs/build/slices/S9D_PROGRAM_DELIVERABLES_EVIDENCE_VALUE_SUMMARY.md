# S9d · Program deliverables, evidence + value readiness summary

Slice ID: S9d
Slice name: Program deliverables, evidence + value readiness summary
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Adds a deterministic, seed-backed Evidence + Value Readiness section
to the canonical Program detail page. Surfaces deliverable tier counts
by requirement, required-but-stub gaps, and explicit honest signals
for evidence and value categories the seed does not yet capture. No
production state machine, no Supabase reads, no model calls.

## What changed

1. **View-model layer extended**
   [src/lib/programs/programs-canonical-view.ts](../../../src/lib/programs/programs-canonical-view.ts):
   - New `ReadinessSignal` enum: `ready` / `partial` / `not_started` /
     `not_seeded`.
   - New types: `DeliverableTierBucket`,
     `DeliverableReadinessByRequirement`, `RequiredStubGap`,
     `EvidenceReadiness`, `ValueReadiness`, `ProgramReadinessSummary`.
   - New helper `buildProgramReadinessSummary(program)` returns:
     - `deliverableTiers` — overall rich/outline/stub/total counts.
     - `byRequirement` — per-requirement (`required` / `optional` /
       `additional`) tier buckets that reconcile to total.
     - `requiredStubGaps` — every `requirement: 'required'` deliverable
       at `renderTier: 'stub'`, sorted deterministically by
       `phaseSpec` then `deliverableCode`.
     - `evidence` — always `signal: 'not_seeded'` with reason and
       three named expected signals (per-deliverable evidence
       references, CXO interview capture, baseline measurements).
     - `value` — always `signal: 'not_seeded'` with reason, the two
       canonical governing gates (G3 design approved with projected
       value, G4 CXO verification of realized outcomes), and four
       named expected signals (projected value with confidence band,
       realized value measurement, variance attribution, dual-ledger
       entries).
     - `summary` — single-line eyebrow string.

2. **Detail component extended**
   [src/components/programs/ProgramCanonicalDetail.tsx](../../../src/components/programs/ProgramCanonicalDetail.tsx):
   - New `<EvidenceValueReadinessSummary>` section rendered between
     `<StewardReadinessPanel>` and `<DataPlaceholders>` inside Zone C.
   - Eyebrow: "Evidence + value readiness · seed-only".
   - Three requirement cards (Required / Optional / Additional) with
     per-bucket Rich / Outline / Stub counts.
   - "Required-but-stub gaps" panel rendered only when gaps exist;
     each gap is a link into the existing
     `tenantDeliverablePath(...)` route, with the deliverable code,
     spec phase, and title.
   - Two readiness cards (Evidence registry / Value ledger) with:
     - Status badge per signal (uppercase NOT SEEDED today).
     - Reason prose.
     - Governing gates list (Value card only).
     - Expected-signals bulleted list.
   - Footer caption: "Composed deterministically from seed state. No
     live agent or model call. Evidence and value seeding are deferred
     to a future seed-population slice."
   - Existing `<DataPlaceholders>` block preserved for the
     value/risk/decisions trio (the new section overlaps semantically
     but provides richer signal).

3. **Tests added**
   [src/__tests__/integration/programs/programs-deliverables-evidence-value.test.ts](../../../src/__tests__/integration/programs/programs-deliverables-evidence-value.test.ts):
   - Deliverable totals: total matches seed; rich+outline+stub equals
     total; per-requirement totals reconcile to seed; per-requirement
     rich+outline+stub reconciles per bucket.
   - Required-but-stub gaps: every required-stub from the seed listed;
     order deterministic by phase then code; every gap entry has a
     resolvable `routePath`.
   - Signals: evidence is `not_seeded` with prose reason and ≥2
     expected signals; value is `not_seeded` with prose reason and ≥2
     expected signals; value names canonical G3 + G4 gates with
     correct labels; **never claims `ready`** while seed lacks
     evidence/value capture.
   - Determinism: identical results across repeated calls; identical
     across all four canonical demo tenants.
   - Empty-deliverables edge: zero-count buckets and `summary` text
     names "no deliverables seeded".
   - Module hygiene: no imports from legacy `/programs`, `mock.ts`,
     preview, demo, Source UI, Nexus runtime, or auth.

## What is seed-backed

- Deliverable tier counts (rich/outline/stub) per requirement bucket
  (required/optional/additional).
- Required-but-stub gap list (sorted, with route paths).
- Spec-phase positions of each gap.
- The single-line summary line.

## What is honestly NOT seeded

- **Evidence registry** — no E-id citations, no per-deliverable
  evidence references, no CXO interview capture, no baseline
  measurements. Signal is `not_seeded`.
- **Projected value** — no per-workstream projected dollars, no
  confidence band, no assumptions. Signal is `not_seeded`.
- **Realized value** — no Phase 6 measurement, no variance
  attribution, no dual-ledger entries. Signal is `not_seeded`.

The new section names each missing kind of signal explicitly so a
future seed-population slice has a clear acceptance list.

## What is deferred

- **Seed-population slice (next)** — populate evidence references and
  value ledger entries on the canonical demo programs. Once seeded,
  `buildProgramReadinessSummary` can promote evidence and value
  signals from `not_seeded` to `partial` / `ready` without changing
  the public API.
- **S9c gate classifier upgrade** — once value and evidence are
  seeded, `buildCanonicalHardGateStrip` can promote G2/G3/G4 from
  `missing_inputs` → `ready` for the right gates.
- **S9e** Programs Control Tower signal emission — Atlas signal
  triggers tied to value variance and evidence-confidence shifts.

## Honest fallbacks used

- Evidence and value signals always render with `signal: 'not_seeded'`
  badges; the readiness card body explicitly names the three or four
  expected signals the seed would need to capture.
- Required-but-stub gap panel is hidden when no gaps exist (no fake
  empty-state).
- The detail-component caption clarifies "Composed deterministically
  from seed state. No live agent or model call."
- Test asserts no `ready` signal can be emitted from seed alone for
  evidence or value categories.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/programs-deliverables-evidence-value.test.ts` — 15 passed
- Regression suites pass against this commit (S9, S9b, S9c, S7).
- `npm run build` — pass

Promotion to `verified` requires a live walk by founder confirming the
new section renders correctly on `/tenant/[slug]/programs/[programSlug]`
for at least two canonical demo tenants — including a tenant whose
seed contains required-but-stub gaps so the gap panel is visible.

## Status

Code complete. Pending founder review.
