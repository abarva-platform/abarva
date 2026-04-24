# S9 · Programs canonical index/detail proof

Slice ID: S9
Slice name: Programs canonical index/detail proof
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Implements the first canonical Programs surface aligned to the S8
Programs Page Readiness Contract. Narrow scope: index + detail proof
only. No live agent binding, no model calls, no Supabase calls. Seed
data only.

## What this slice implemented

1. **Deterministic view-model helper** at
   [src/lib/programs/programs-canonical-view.ts](../../../src/lib/programs/programs-canonical-view.ts):
   - `CANONICAL_SIX_PHASES` and `CANONICAL_FOUR_GATES` constants per
     S8 contract §H.
   - `mapSpecPhaseToCanonicalIndex(spec)` mapping the seed's 5 spec
     phases (Intake & Framing → Outcome & Accountability) onto canonical
     phases 2–6. Canonical phase 1 (Origination) is pre-seed.
   - `statusForCanonicalPhase(program, canonicalIndex)` returning
     `complete` / `active` / `pending` / `origination_pre_seed`.
   - `summarizePortfolio(tenant)` returning program count, active /
     completed counts, programs by canonical phase, deliverable tier
     counts, and a deterministic recommended-first-program slug.
   - `summarizeProgram(program)` returning a canonical phase view and
     deliverable tier counts.
   - `buildPortfolioGuidance(tenant, summary)` and
     `buildProgramEditorial(view)` deterministic prose builders.
   - `HONEST_FALLBACK_LABELS` for surfaces without seed data (gate
     state, value, risk register, decisions pending, Origination).

2. **Canonical Programs index component** at
   [src/components/programs/ProgramsCanonicalIndex.tsx](../../../src/components/programs/ProgramsCanonicalIndex.tsx).
   Five-zone-inspired layout:
   - Zone A: header with tenant name + portfolio overview.
   - Zone B: context strip (programs, active, completed, deliverables,
     rich-tier count).
   - Zone B+: canonical six-phase distribution band (counts per phase).
   - Zone C: program grid with link cards (code, archetype, name, role
     in demo, current canonical phase, status, deliverable count).
   - Zone D: deterministic Nexus-style portfolio guidance panel with
     recommended-first-program link.
   - Zone E: not present in S9 (drawer wiring deferred).

3. **Canonical Program detail component** at
   [src/components/programs/ProgramCanonicalDetail.tsx](../../../src/components/programs/ProgramCanonicalDetail.tsx).
   Five-zone-inspired layout:
   - Zone A: program header.
   - Zone B: context strip (current canonical phase, spec phase,
     status, deliverables, rich-tier count).
   - Zone C: Nexus deterministic editorial → six-phase canonical
     timeline (clickable to existing phase routes for canonical 2–6) →
     four hard-gate strip (informational status only) → honest
     placeholder cards for value / risk / decisions → deliverable
     summary list grouped by spec phase with tier badges.
   - Zone D: existing `<NexusProgramRail>` component imported verbatim.
     Rewrite of the rail is deferred to S9b.
   - Zone E: not present in S9.

4. **Route wiring**:
   - [src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx](../../../src/app/%28maestro%29/tenant/%5BtenantSlug%5D/programs/page.tsx)
     now renders `<ProgramsCanonicalIndex>` (replacing
     `SeedProgramsIndex`). `assertTenantAccess` and `notFound` behavior
     unchanged.
   - [src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx](../../../src/app/%28maestro%29/tenant/%5BtenantSlug%5D/programs/%5BprogramSlug%5D/page.tsx)
     now renders `<ProgramCanonicalDetail>` (replacing
     `SeedProgramOverview`). Guard behavior unchanged.

5. **Tests** at
   [src/__tests__/integration/programs/programs-canonical-surface.test.ts](../../../src/__tests__/integration/programs/programs-canonical-surface.test.ts).
   Pure deterministic coverage of the view-model layer; no React
   render harness was added.

## What this slice intentionally deferred

- **Live agent binding** of `<NexusProgramRail>` to AgentResponse +
  honest-disclosure metadata → **S9b**.
- **Hard-gate state machine** + Steward gate-state badges → **S9c**.
  Today the gate strip is informational only, derived from canonical
  phase index. Each gate is labeled "cleared / in flight / pending"
  with an honest-fallback caption that the state machine is not yet
  wired.
- **Deliverable evidence + value summary** rendering with citations
  → **S9d**. The deliverable list shows tier badges and links into the
  existing per-deliverable route; it does not yet render evidence
  chains or projected/realized value.
- **Atlas signal emission** wiring on portfolio changes → **S9e**.
- Full Origination phase (canonical phase 1) workflow — the seed does
  not yet capture this state; the timeline labels phase 1 as
  pre-seed informational.
- Phase and deliverable subroutes (`phase/[phaseNum]`,
  `deliverables/[deliverableCode]`) — out of S9 scope; left wired
  through the existing `SeedRouteShell` paths.

## Data source used

Seed-only. The components consume `TenantSeedPlan` and
`ProgramSeedPlan` from
`src/lib/deliverables/seed-route-resolver.ts::findTenantByRouteSlug`
and `findProgramByRoute`, which assemble from
`buildAllProgramsSeedPlan()` over `TENANT_PORTFOLIOS`
(`intelligence/seeds/tenant-portfolios/{apexretail,meridian,arcturus,keystone}.json`).

The Supabase query helpers in [src/lib/programs/queries.ts](../../../src/lib/programs/queries.ts)
are not called from these surfaces in S9.

## Routes touched

- `/tenant/[tenantSlug]/programs` → renders `<ProgramsCanonicalIndex>`
- `/tenant/[tenantSlug]/programs/[programSlug]` → renders
  `<ProgramCanonicalDetail>`

Sub-routes (`phase/[phaseNum]`, `deliverables/[deliverableCode]`) are
**not** modified by this slice.

## Acceptance criteria (manifest)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Founder can open canonical Programs index/detail and answer status, value, risk, gate, and next action within 3 seconds. | Met for status / phase / next-action. Value, risk, decisions are honest-fallback placeholders pending S9d. |
| 2 | Nexus recommendation is grounded in available context and does not fabricate missing deliverable content. | Met — editorial prose is composed deterministically from seed state with no fabrication. |
| 3 | Tenant guard remains enforced. | Met — `assertTenantAccess` is invoked in both routes before any data read. |
| 4 | Legacy `/programs` and preview/demo routes are not extended. | Met — no edits to `src/app/programs/**`, `(maestro)/preview/**`, `demo/**`, `mock.ts`, `ProgramSurface.tsx`, `NexusPanel.tsx`, `PortfolioIndex.tsx`, or `ProgramsCanonShell.tsx`. |

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` — pass
- `npm run build` — pass
- `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` — pass (S7 regression)

## Honest fallbacks used

- **Origination (canonical phase 1):** seed cannot capture this state
  today; rendered as `Pre-seed` in the timeline with a caption
  referencing `HONEST_FALLBACK_LABELS.origination`.
- **Hard-gate state machine:** gate strip status is informational only,
  derived from canonical phase index, with the caption
  `HONEST_FALLBACK_LABELS.gateState`.
- **Value at stake / risk register / decisions pending:** rendered as
  dashed placeholder cards with explicit "not yet captured in seed"
  captions.

## Next slices

- **S9b** Programs Nexus rail metadata binding — bind
  `<NexusProgramRail>` (or successor) to `RenderedResponse` +
  `honest_disclosure` metadata + Context Bundle scoring so confidence,
  context-used, and missing-inputs render from measured state.
- **S9c** Program phase / hard-gate status rendering — wire the four
  gates to a Steward-owned state machine; replace informational status
  labels with verified gate decisions and audit events.
- **S9d** Program deliverables evidence/value summary — extend the
  deliverable list with tier-aware evidence chains and projected /
  realized value strips with citation chips.
- **S9e** Programs Control Tower signal emission — wire Atlas signal
  triggers (program at-risk, variance threshold, gate hold, new
  blocker) to Tower pressure cards.

## Status

Code complete pending founder review. Promotion to `verified` requires
a live walk by founder or a named persona crawler that confirms:

- Canonical index and detail render at least one canonical demo
  tenant's portfolio without 500.
- Nexus editorial reads cleanly to a CIO in three seconds.
- Steward gate-state placeholder reads honestly and does not promise
  state machine behavior.
- Tenant guard returns 403 on cross-tenant URL.
