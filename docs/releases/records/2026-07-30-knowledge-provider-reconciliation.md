# Knowledge Provider Reconciliation — PR A

## Release ID

`2026-07-30-knowledge-provider-reconciliation`

## Status

`candidate`

## Plain-English Summary

An earlier session built a new Knowledge UI for tenant `airline-demo-new` (PR #5772, branch
`feat/knowledge-ui-airline-demo-new`) with its own provider abstraction, before discovering that a
more mature "Home/Knowledge vNext" provider system already existed on `main` (built via PR #5688).
This release does the reconciliation work: it produces a full comparison of the two systems (a
49-row classification matrix, a component-to-query mapping for PR #5772's ~53 components, a tenant
activation dependency record, and related planning docs), and it ships a new
`KnowledgeUiViewModelAssembler` module that sits between the real, already-merged
`KnowledgeConsumptionProvider` and future UI components. It introduces a new 11-value
`ComponentReadinessState` enum that replaces the ad-hoc 5-value readiness enum PR #5772's duplicate
provider used, and it defines the nine airline-specific business-problem lenses as an
assembler-layer concept over the real, generic 6-value `KnowledgeLens` filter.

This release ships **no visual change** — there is no UI wired to the assembler yet (that is PR B's
scope). It is a data-composition-layer PR only, reviewable independently of any UI rewrite.

## Layer Impact

- **Lane:** `global-control-lane` (shared library code, no tenant-scoped schema/data changes).
- **Layer:** Application/library layer only. New module: `src/lib/knowledge/view-model/` (types,
  readiness derivation, source-incompleteness allow-list, the nine airline lenses, the assembler
  implementation, and unit tests). One small extension to existing contract tests
  (`src/lib/knowledge/consumption-contracts/__tests__/vnext-contract.test.ts`, two new assertions).
  One new eslint rule scoped to the new directory (`eslint.config.mjs`).
- **No data-plane changes.** No migrations, no Postgres/Azure calls, no Cube changes, no tenant
  registry changes. `src/lib/knowledge/providers/` (the duplicate provider from PR #5772) does not
  exist on `main` and is not introduced by this release — see "Known Gaps" and the full writeup in
  `reports/airline-knowledge-provider-reconciliation-2026-07-30/DUPLICATE_FILES_TO_REMOVE.md`.

## Client Applicability

- **All clients:** No — this release adds a library module with no route or component wiring it to
  any surface yet. It has zero runtime effect on any client today.
- **Specific clients:** None (not wired to any surface).
- **Internal only:** N/A.
- **Public/demo only:** N/A.
- **Feature flag:** None needed — the new module is inert (unimported by anything reachable from a
  route) until PR B wires it up.

## Changes Included

- `reports/airline-knowledge-provider-reconciliation-2026-07-30/` — 10 planning/reconciliation
  documents (`KNOWLEDGE_PROVIDER_RECONCILIATION_MATRIX.csv`, `DUPLICATE_FILES_TO_REMOVE.md`,
  `VIEW_MODEL_ASSEMBLER_INTERFACES.md`, `COMPONENT_TO_QUERY_MAPPING.md`,
  `TENANT_ACTIVATION_DEPENDENCY.md`, `CURRENTLY_RENDERABLE_COMPONENTS.md`,
  `SOURCE_INCOMPLETE_COMPONENTS.md`, `PROPOSED_PR_SEQUENCE.md`, `TEST_PLAN.md`,
  `RISK_ASSESSMENT.md`).
- `src/lib/knowledge/view-model/types.ts` — new: `ComponentReadinessState` (11-value enum), the nine
  `AirlineLensId` values, `ViewModelEnvelope<T>`, `AssemblerQuery`, and every view-model payload
  interface + the `KnowledgeUiViewModelAssembler` interface itself.
- `src/lib/knowledge/view-model/readiness.ts` — new: `deriveReadiness()`, the single function mapping
  real governance signals onto the new 11-value enum.
- `src/lib/knowledge/view-model/source-incomplete.ts` — new: the fixed allow-list of fields known
  today to be source-incomplete for `airline-demo-new` (leadership/perspective content).
- `src/lib/knowledge/view-model/lenses.ts` — new: the nine airline lens definitions and resolution
  logic.
- `src/lib/knowledge/view-model/assembler.ts` — new: `createKnowledgeUiViewModelAssembler()`,
  composing the real 8 `KnowledgeConsumptionProvider` queries into 15 view-model methods.
- `src/lib/knowledge/view-model/index.ts` — new: barrel export.
- `src/lib/knowledge/view-model/__tests__/deriveReadiness.test.ts`,
  `lenses.test.ts`, `assembler.test.ts` — new: unit tests (see QA/Validation).
- `src/lib/knowledge/consumption-contracts/__tests__/vnext-contract.test.ts` — modified: two new
  `it()` blocks asserting the exact `AUTHORITY_STATES`/`FRESHNESS_STATES` enumerations (extension,
  not duplication, of existing coverage).
- `eslint.config.mjs` — modified: one new `no-restricted-imports` block scoped to
  `src/lib/knowledge/view-model/**`, preventing it from importing the frozen duplicate provider or
  UI component internals.
- This release record.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p tsconfig.json` — passes clean, exit
  code 0, full tree (the repo's default heap limit OOMs on this machine per
  `feedback_typecheck_workflow_artifact`; the larger heap is the known workaround, not a scope
  narrowing).
- `npx eslint src/lib/knowledge/view-model src/lib/knowledge/consumption-contracts/__tests__/vnext-contract.test.ts`
  — zero errors, zero warnings.
- `npx jest src/lib/knowledge/consumption-contracts src/lib/knowledge/consumption-client src/lib/knowledge/view-model`
  — 7 test suites, 101 tests, all passing (0 failing). This includes the pre-existing
  `consumption-contracts`/`consumption-client` suites (unmodified except the two-assertion extension
  above) plus the 3 new `view-model` suites.
- Per this repo's own convention (`feedback_tsjest_misses_type_errors`), the green `tsc --noEmit` run
  is treated as the authoritative type-correctness signal, not the jest run alone.
- Manual review: confirmed no file under `src/components/knowledge/**` was modified (read-only
  reference only), confirmed no file under `src/lib/knowledge/providers/**` was created (that path
  does not exist on `main` — see Known Gaps), confirmed `git diff --stat origin/main` touches only
  the files listed above.

## Rollout Plan

1. Merge PR to `main` (squash) — no runtime rollout, this is an inert library addition.
2. No ACA image behavior changes as a result of this release alone (the module is not imported by any
   route yet).
3. PR B (a separate, follow-up PR) will import and wire this assembler to the migrated
   `src/components/knowledge/**` UI — see `reports/airline-knowledge-provider-reconciliation-2026-07-30/PROPOSED_PR_SEQUENCE.md`.

## Deployment Authority

Not applicable — this release does not affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, or DNS. It is a library-only addition with
no route reachable from it yet.

## Rollback Plan

- **Code revert:** Revert this PR's commit(s). Since nothing imports `src/lib/knowledge/view-model/**`
  yet, this is a zero-blast-radius revert — no other code path depends on it.
- No migration rollback required (no schema changes).
- No feature flag to unset.

## Audit Evidence

- PR: opened against `main` from `feat/knowledge-provider-reconciliation`, not merged (link recorded
  in the PR itself once opened).
- `reports/airline-knowledge-provider-reconciliation-2026-07-30/` — the full reconciliation record,
  including citations to specific files/lines read (e.g.
  `clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/foundation-closure-authority-record-20260729.json`,
  `src/lib/knowledge/consumption-server/shape.ts`, `src/app/api/knowledge/consumption/_shared.ts`)
  supporting every classification and finding.
- TypeScript/ESLint/Jest command output as described above (re-runnable by any reviewer).

## Known Gaps

- **`src/lib/knowledge/providers/` (PR #5772's duplicate provider) does not exist on `main`** — it
  exists only on the unmerged `feat/knowledge-ui-airline-demo-new` branch. This release therefore
  documents the deprecation-header text and disposition for those files
  (`DUPLICATE_FILES_TO_REMOVE.md`) rather than literally editing them; PR B is the earliest point at
  which those files can be touched at all (it necessarily rebases/reopens PR #5772's UI commits).
- **The nine airline lens ids are partially unconfirmed placeholders** (`network_scheduling`,
  `safety_compliance`) — the approved HTML prototype the task brief names as authoritative is not
  present anywhere in this repo's git history. PR B must confirm the full lens set against the real
  prototype before shipping the lens picker UI. See `VIEW_MODEL_ASSEMBLER_INTERFACES.md` §2 and
  `RISK_ASSESSMENT.md`.
- **Two of the task's named "required reading" reports do not exist in git history on any branch**
  (`KNOWLEDGE_UI_DATA_BINDING_MATRIX.csv`, `airline-e2e-data-quality-lineage-audit-2026-07-29.md`),
  nor do four docs the duplicate provider's own comments cite. This release relied on the duplicate
  provider's extensive inline documentation plus direct evidence found on `main` instead — see
  `RISK_ASSESSMENT.md` for the full list and what was used in their place.
- **Contract/registry drift discovered, not fixed:** `consumption.technology_estate_v1` and
  `consumption.data_product_inventory_v1` already have real rows in the `airline-demo-new` baseline
  per its foundation-closure record, but neither is in `CONSUMPTION_PROJECTION_REGISTRY.json`'s 14
  names, the `ProjectionName` TS union, or `consumption-server/reader.ts`. Flagged for the data-plane
  lane in `TENANT_ACTIVATION_DEPENDENCY.md` and `RISK_ASSESSMENT.md`; not fixed here (out of this
  lane's scope).
- Assembler methods are deliberately NOT implemented for every `MISSING_PROVIDER_QUERY` /
  `MISSING_CONSUMPTION_PROJECTION` matrix row (Goals, Purpose statements, Decision lanes,
  Contradictions, 3 of 8 Explore inventory kinds, metric trajectories, decision-readiness quadrant) —
  per the instruction to prefer composing the real 8 queries over inventing new provider surface
  area. PR B must render those sections' absence honestly (see `COMPONENT_TO_QUERY_MAPPING.md`).
