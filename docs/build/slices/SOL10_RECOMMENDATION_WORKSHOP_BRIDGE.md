# SOL10 · Recommendation → Program Workshop Bridge

Slice ID: SOL10
Slice name: Recommendation → Program Workshop Bridge
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Pure deterministic library that maps SOL9 solution recommendations
onto recommended workshops, SME role bundles, evidence-need hints,
and deliverable hints that the Program Workshop Mode shell can later
surface without inventing context. **Library only — does not invoke
models, does not read tenant runtime state, does not mutate
persistence.**

## What changed

- New module
  [src/lib/solutions/recommendation-workshop-bridge.ts](../../../src/lib/solutions/recommendation-workshop-bridge.ts):
  - Public types: `RecommendationInputForBridge`,
    `RecommendedWorkshopBundle`, `RecommendedSmeRoleBundle`,
    `EvidenceNeedHint`, `DeliverableHint`,
    `RecommendationWorkshopMap`, `WorkshopBridgeSummary`.
  - Public helpers:
    - `buildRecommendationWorkshopMap(recommendations)` — projects a
      list of recommendations onto a deterministic list of workshop-
      bridge maps.
    - `summarizeWorkshopBridge(maps)` — at-a-glance counts plus
      archetype and first-workshop keys.
    - `getMissingEvidenceForBridge(maps)` — collects every
      `must_capture` and `should_capture` evidence hint across the
      supplied maps.
  - `createdFrom: 'deterministic_recommendation_workshop_bridge_seed'`
    on every emitted map.

- New tests
  [src/__tests__/integration/solutions/recommendation-workshop-bridge.test.ts](../../../src/__tests__/integration/solutions/recommendation-workshop-bridge.test.ts):
  deterministic suite covering byte-equal output across calls, shape
  coverage (every map has at least one workshop, SME, evidence hint,
  and deliverable), first-workshop marking, sparse-input fallback,
  summary reconciliation, missing-evidence aggregation, recommendation
  passthrough, and module hygiene (no clock reads, no live runtime
  imports, no model providers, no random IDs, no forbidden
  directories).

## Public surface

```ts
buildRecommendationWorkshopMap(
  recommendations: readonly RecommendationInputForBridge[],
): readonly RecommendationWorkshopMap[];

summarizeWorkshopBridge(
  maps: readonly RecommendationWorkshopMap[],
): WorkshopBridgeSummary;

getMissingEvidenceForBridge(
  maps: readonly RecommendationWorkshopMap[],
): readonly EvidenceNeedHint[];
```

## Input contract

SOL10 keeps its input shape structural so the bridge runs without a
hard dependency on SOL9. Any object that carries `archetypeKey`,
`archetypeName`, `confidence`, `recommendedComponents`,
`recommendedWorkshops`, `smesRequired`, `architectureBuildingBlocks`,
and `deliverablesGenerated` is accepted. SOL9 outputs match the
contract directly; type-only imports from
`@/lib/solutions/solution-recommendation-engine` are safe in
downstream callers.

## Projection rules (deterministic)

For every input recommendation SOL10 emits exactly one
`RecommendationWorkshopMap`:

- **Workshops.** `recommendedWorkshops` is canonicalized (trim, dedup,
  empty-filter). The first canonical entry is the recommended first
  workshop and is marked `isFirstWorkshop: true`. Each bundle carries
  a deterministic rationale plus an `expectedRoles` hint pulled from a
  canonical workshop-to-roles map. If the recommendation lists no
  workshops the fallback is `current_state_discovery`.
- **SMEs.** `smesRequired` is anchored to the first workshop. The
  per-workshop default role hints are then layered on, deduplicated by
  `(roleKey, workshopKey)`. Every emitted SME bundle carries a stable
  `roleLabel` (canonical lookup with a `humanizeRoleKey` fallback).
- **Evidence needs.** `architectureBuildingBlocks` produce
  `architecture_building_block` hints — the first entry is
  `must_capture`, subsequent entries are `should_capture`.
  `recommendedComponents` produce `current_state_input` hints with
  `should_capture` severity. A `governance_review` hint with
  `nice_to_have` severity is always appended so every map has at least
  one evidence hint, anchored to `governance_risk_review` when present
  or the last canonical workshop otherwise.
- **Deliverables.** `deliverablesGenerated` is mapped onto
  `deliverable_synthesis` when that workshop is recommended, else the
  last canonical workshop. If the recommendation lists no deliverables
  the bridge emits a single `archetype_solution_brief` default so
  downstream renderers always see a handoff target.

## Hard rules

- No imports from `src/lib/source/**`, `src/lib/nexus/**`,
  `src/lib/sentinel/**`, `src/lib/atlas/**`, `src/lib/agent/**`,
  `src/lib/auth/**`, `src/lib/programs/**`, `supabase`.
- No `Math.random`, no clock reads (`Date.now`, `new Date(`), no live
  model calls, no `fetch`, no React hooks, no placeholder copy
  (`Coming soon`, `TBD`, `Lorem ipsum`).
- No live SME directory, no calendar / booking surface, no person
  names — roles only.
- Tests cover module hygiene by reading the file with
  `fs.readFileSync` and asserting forbidden tokens / forbidden imports
  do not appear.

## Validation

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/solutions/recommendation-workshop-bridge.test.ts
npx eslint --max-warnings=0 src/lib/solutions/recommendation-workshop-bridge.ts src/__tests__/integration/solutions/recommendation-workshop-bridge.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Acceptance criteria

- Module exports `RecommendationInputForBridge`,
  `RecommendedWorkshopBundle`, `RecommendedSmeRoleBundle`,
  `EvidenceNeedHint`, `DeliverableHint`, `RecommendationWorkshopMap`,
  `WorkshopBridgeSummary`, `buildRecommendationWorkshopMap`,
  `summarizeWorkshopBridge`, and `getMissingEvidenceForBridge` as the
  canonical contract.
- `buildRecommendationWorkshopMap` is byte-equal across repeated calls
  for the same input and returns one map per recommendation.
- Every emitted map has at least one workshop bundle, one SME bundle,
  one evidence-need hint, and one deliverable hint.
- Exactly one workshop per map is marked as the first workshop, and
  the marker matches `recommendedFirstWorkshopKey`.
- Sparse recommendations (no workshops, no SMEs, no building blocks,
  no deliverables) fall back to `current_state_discovery` and emit the
  default `archetype_solution_brief` deliverable.
- `summarizeWorkshopBridge` reconciles `totalMaps`, `totalWorkshops`,
  `totalSmes`, `totalEvidenceNeeds`, and `totalDeliverables` against
  the bridge map list.
- `getMissingEvidenceForBridge` returns only `must_capture` and
  `should_capture` entries.
- Module imports nothing from forbidden directories; contains none of
  the forbidden tokens (`Math.random`, `Date.now`, `new Date(`,
  `fetch(`, `anthropic`, `openai`, `useState`, `useEffect`,
  `Coming soon`, `TBD`, `Lorem ipsum`).

## Notes

- SOL10 is a *library*, not a UI. The bridge is consumed by future
  Program Workshop Mode surfaces (PW1+) and by Nexus when composing
  per-tenant solution drafts. SOL10 itself does not render or
  persist anything.
- The role hints are *roles*, never person names. Live SME directory
  integration (booking, calendar, availability) is explicitly out of
  scope and remains deferred behind the program_workshop_mode
  blocker.
- The bridge does not promote `agent_runtime` or
  `program_workshop_mode` status; production-readiness notes are
  UNION-updated to record the SOL10 deterministic projection without
  promoting any dimension.
