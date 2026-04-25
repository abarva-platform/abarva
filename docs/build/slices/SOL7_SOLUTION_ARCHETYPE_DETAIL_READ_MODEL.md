# SOL7 · Solution Archetype Detail Read Model

Slice ID: SOL7
Slice name: Solution Archetype Detail Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Pure deterministic projection of a canonical solution archetype into a
canvas-ready detail view. Programs, Atlas, and Steward subscribe to this
read model so the archetype detail surface renders against a typed,
deterministic projection rather than a free-form record. **Library
only — does not generate live archetypes, invoke models, or read tenant
state.**

## What changed

- New module
  [src/lib/solutions/solution-archetype-detail-view.ts](../../../src/lib/solutions/solution-archetype-detail-view.ts):
  - Public types: `SolutionArchetypeLike`,
    `SolutionArchetypeDetailView`, `SolutionArchetypeCanvasSection`,
    `SolutionArchetypeReadinessSummary`.
  - Public helpers:
    - `buildSolutionArchetypeDetailView(archetype)` — full canvas-ready
      view with `missingInputPrompts`, `recommendedNextAction`, and the
      `basis` / `createdFrom` markers.
    - `buildSolutionArchetypeCanvasSections(archetype)` — exactly 12
      canvas sections in canonical render order with `layoutHint` and
      `evidenceLinkRequired` flags.
    - `summarizeSolutionArchetypeReadiness(archetype)` — readiness
      level (`usable` / `partial` / `weak`) plus the recommended next
      action.
  - Re-exports for test introspection:
    `SOLUTION_ARCHETYPE_CANVAS_SECTION_KEYS_IN_ORDER`,
    `SOLUTION_ARCHETYPE_VIEW_BUILDER_VERSION`.

- New tests
  [src/__tests__/integration/solutions/solution-archetype-detail-view.test.ts](../../../src/__tests__/integration/solutions/solution-archetype-detail-view.test.ts):
  Deterministic suite covering view determinism, section projection,
  missing-input + next-action derivation for both fully-populated and
  partial fixtures, canonical canvas-section ordering, layout-hint
  vocabulary, evidence-link flags, readiness summary thresholds,
  no-fabricated-dollars, and module hygiene.

## Twelve canvas sections (canonical render order)

| # | Section key | Title | Layout hint | Evidence link required |
|---|---|---|---|---|
| 1 | `brief` | Brief | paragraph | no |
| 2 | `business_outcomes` | Business outcomes | list | yes |
| 3 | `current_state_inputs` | Current-state inputs required | list | yes |
| 4 | `patterns_and_failure_modes` | Patterns and failure modes | two_column | yes |
| 5 | `solution_components` | Solution components | list | no |
| 6 | `architecture` | Architecture building blocks | list | no |
| 7 | `workshops` | Workshops required | list | no |
| 8 | `smes` | SMEs required | list | no |
| 9 | `build_buy_partner` | Build / buy / partner considerations | list | no |
| 10 | `governance_risk` | Governance and risk considerations | list | yes |
| 11 | `deliverables` | Deliverables generated | list | no |
| 12 | `value_metrics` | Value metrics | metric_strip | yes |

The `agent_partition` layout hint is reserved for a future agent-roles
section; it is part of the canonical vocabulary today even though no
default section consumes it. Downstream renderers may compose an agent
partition from `view.agentRoles` when they choose to surface the four
canonical agents on the canvas.

## Detail view shape

`SolutionArchetypeDetailView` is the surface contract consumed by the
detail page renderer. It carries:

- `archetypeKey` — canonical key.
- `summary` — `name`, `sector`, `capabilityFamily`, `problemStatement`.
- 12 projected arrays — one per canonical canvas section, plus
  `agentRoles`.
- `missingInputPrompts` — derived from any required-input array that
  is empty. Empty for a fully-specified archetype.
- `recommendedNextAction` — derived: when any required input is
  missing, propose scheduling the archetype's `recommendedFirstWorkshop`;
  otherwise propose proceeding to architecture composition.
- `basis` — `{ source: 'deterministic_solution_archetype_registry',
  viewBuilderVersion: 'sol7.v1' }`.
- `createdFrom` — `'deterministic_seed'`.

## Readiness summary

`summarizeSolutionArchetypeReadiness` returns:

- `archetypeKey` — passthrough.
- `totalSections` — always 12.
- `sectionsWithBody` — count of sections whose `body` array is
  non-empty.
- `missingInputCount` — count of derived missing-input prompts.
- `readinessLevel`:
  - `usable` — all 12 sections populated AND no missing-input prompts.
  - `partial` — at least 9 of 12 sections populated (75% threshold).
  - `weak` — fewer than 9 sections populated.
- `recommendedNextAction` — same derivation as the detail view.

## Deterministic invariants

- The detail view is byte-equal across repeated calls (test enforced
  for both fully-populated and partial fixtures).
- Canvas sections render in canonical order regardless of input
  ordering of the source archetype's arrays (test enforced).
- `layoutHint` is drawn from the closed vocabulary
  `list | paragraph | two_column | metric_strip | agent_partition`
  (test enforced).
- The five canonical evidence-anchored sections (business outcomes,
  current-state inputs, patterns and failure modes, governance and
  risk, value metrics) carry `evidenceLinkRequired: true` (test
  enforced).
- Fully-populated archetypes return `readinessLevel: 'usable'` with an
  architecture-composition next action (test enforced).
- Partial archetypes return `readinessLevel: 'weak'` or `'partial'`
  with a Schedule / intake next action (test enforced).
- `basis.source === 'deterministic_solution_archetype_registry'` and
  `createdFrom === 'deterministic_seed'` (test enforced).
- Serialised view contains no invented dollar amounts (test enforced).

## SOL3 integration (deferred)

SOL3's `solution-archetype-registry.ts` is being authored in a parallel
worktree and is **not** importable from this worktree. To keep SOL7
landable in isolation, the read model declares a local structural type
`SolutionArchetypeLike` that captures the canonical archetype shape:

- `key`, `name`, `sector`, `capabilityFamily`, `problemStatement`.
- 12 archetype arrays: `businessOutcomes`,
  `currentStateInputsRequired`, `patternsUsed`,
  `failureModesAddressed`, `solutionComponents`,
  `architectureBuildingBlocks`, `workshopsRequired`, `smesRequired`,
  `buildBuyPartnerConsiderations`, `governanceRiskConsiderations`,
  `deliverablesGenerated`, `valueMetrics`.
- `agentRoles`: `{ nexus, sentinel, atlas, steward }`.
- `recommendedFirstWorkshop`.
- `createdFrom: 'deterministic_solution_archetype_registry'` marker.

A follow-up slice will:

1. Replace direct fixture construction with calls into the SOL3
   registry's lookup helpers.
2. Confirm structural compatibility by typing the registry record as
   `SolutionArchetypeLike` at the call site.
3. Add a regression test that round-trips at least one canonical
   registry archetype through `buildSolutionArchetypeDetailView` and
   asserts the projection covers every canonical section.

The structural type is intentionally permissive on field ordering and
identity so the SOL3 registry can evolve internal record structure
without breaking SOL7's contract.

## What is NOT yet wired to runtime

- No detail page renderer: SOL7 produces the read model only.
  Programs / Tower binding lands in a follow-up slice.
- No persistence: every call rebuilds from the supplied input record.
- No live LLM invocation: derivation of `missingInputPrompts` and
  `recommendedNextAction` is pure rule-based logic.
- No Source / Sentinel / Atlas / Nexus runtime imports.

## What is deferred

- **SOL3 wiring** — call `getSolutionArchetypeByKey` from the registry
  and pass the record into `buildSolutionArchetypeDetailView`.
- **SOL8 — Solution Archetype Detail Renderer** — consumes the read
  model and renders the 12 canvas sections plus the agent partition.
- **SOL9 — Tenant-specific archetype overlay** — overlays captured
  current-state inputs and SME assignments onto the archetype before
  building the detail view.

## Honest fallbacks used

- Detail view content is a pure projection of the source archetype;
  no language implies live retrieval or runtime computation.
- Missing-input prompts name the responsible canonical agent (Steward,
  Nexus, Atlas) rather than inventing a tenant-specific actor.
- The `recommendedNextAction` falls back to
  `current_state_discovery` when the archetype's
  `recommendedFirstWorkshop` is empty, so downstream renderers always
  receive a non-empty action string.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced).
- No banned phrases ("Coming soon", "TBD", "Lorem ipsum") in source
  (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/solution-archetype-detail-view.test.ts`
  — all tests pass
- `npm run build` — pass

## Status

Code complete. Pending founder review and SOL3 wiring follow-up.
