# 2026-10-05-discovery-blueprint-id-keyable — A configured blueprint id must be an id the catalog can hold

## Release ID

`2026-10-05-discovery-blueprint-id-keyable`

## Status

`candidate`

## Plain-English Summary

A narrow correctness fix to the Phase-2 configurable-archetype loader
(`2026-10-05-discovery-blueprint-config-loader`). That loader overlays a
validated configured source onto the built-in catalog and reports which ids it
`applied`. Three ids that the snake_case id rule accepts are not usable as
catalog keys, and one of them made the loader report a lie:

- `__proto__` is a setter inherited from `Object.prototype`. Writing it does
  **not** add a catalog entry — it changes the catalog object's prototype. The
  configured blueprint therefore never joined the catalog, while the loader's
  `applied` list still named it. An operator reading "applied" would believe a
  configured archetype was live when nothing could resolve it.
- `constructor` and `prototype` read back as inherited built-ins, so a lookup
  for either returns something truthy that is not a blueprint at all.

Two changes, each independently sufficient against the `__proto__` case:

1. **The contract rejects them.** `blueprintId` and evidence-family `id` now
   refuse `__proto__`, `constructor` and `prototype` by name, with an error that
   says so. Consistent with the loader's existing promise, the configured source
   is rejected **whole** and the built-in catalog is returned untouched — a
   declaration the catalog would silently drop is not a declaration.
2. **The effective catalog has no prototype.** It is built on
   `Object.create(null)`, so it answers only ids it was given (no inherited
   member can be read back as an archetype) and writing any id always produces
   an own key, which is what makes `applied` truthful by construction.

An id that merely *contains* a reserved word (`constructor_handover`) is still
accepted; only the exact three are refused.

## Layer Impact

Release lane: `global-control-lane` — shared orchestrator contract + loader. No
runtime behavior change for any current caller: nothing in the product reads an
external configured source yet, and no built-in id is affected.

- `3 CANONICAL MODEL` / archetype layer: a tightened id contract and a
  prototype-free effective catalog. Additive to the schema; no data, migration,
  or surface change.

## Client Applicability

- All clients: no visible change. The loader has no wired external source, so
  the fix is on the seam, ahead of the first configured source.
- Specific clients: none.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — the change can only narrow what a *future* configured
  source may declare, and the built-in catalog declares none of the three ids.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` —
  `UNUSABLE_CATALOG_KEYS` + a shared `.refine` on `blueprintId` and
  `EvidenceFamilySchema.id`; the effective catalog in
  `loadDiscoveryBlueprintCatalog` is now prototype-free.
- `src/lib/deliverables/orchestrator/__tests__/discovery-blueprint-config.test.ts`
  — nine added cases in the existing CI-wired suite: each unusable id rejected
  whole at blueprint level and at family level (seed keys unchanged), a
  reserved-word-containing id still accepted, the effective catalog answering
  `undefined` for five inherited members, and every `applied` id being an own
  key.

## QA / Validation

Lane: `global-control-lane`.

- `npx jest src/lib/deliverables/orchestrator/__tests__/discovery-blueprint-config.test.ts`
  — **PASS**: 15/15 (6 pre-existing + 9 added).
- `npx jest src/lib/deliverables/orchestrator/__tests__` (whole CI-wired dir)
  — **PASS**: 45 suites, 536 tests.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0.
- `npx eslint` on both changed files — **PASS**: 0 problems.
- Mutation check of the two guards — **PASS**, 4 of 4 mutations killed:
  blueprint-id refine removed → 3 failures; family-id refine removed → 3;
  prototype-free catalog reverted → 1; both guards reverted (the pre-fix state)
  → 4. Restored baseline green at 15/15, confirming the suite distinguishes the
  fix from the defect rather than passing either way.
- `audit:test-ci-coverage:write` — **PASS**: census unchanged (cases were added
  to an already-covered suite, no new file).
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: 11/11
  gates.
- Signed-in live walk — **NOT RUN**: no surface changes and no caller reads a
  configured source, so there is nothing a walk could observe. Not claimed as
  live-proven.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag, no migration, no data build.

## Rollback Plan

Revert the PR. The change is additive within one module (two schema refinements
plus the catalog object's prototype) and has no persisted state, so reverting
restores the prior loader exactly and affects nothing else.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy`
workflow on merge to `main`; shifts no shared traffic and touches no Container
App template, revision weight, env var, or secret.

## Known Gaps

- **The honesty of `applied` is now structural, not reported.** The loader still
  has no way to tell an operator *why* a source was rejected other than the
  error strings; there is no surface that renders them. That is the setup-UI
  follow-on.
- The two archetype catalogs (discovery blueprints and artifact packs) still
  declare disjoint id sets. That is a product decision for the later phases, not
  a resolution defect, and it is unchanged here.
- Still no external configured source wired, so the tightened contract is
  exercised only by tests. The first real source should be manifest-governed.
- Reserved-word rejection is by exact match on three names. If the id rule is
  ever widened beyond `[a-z0-9_]`, the list needs revisiting (e.g. mixed-case
  `Object.prototype` members would then become expressible).

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- The over-claim and each guard are covered by
  `discovery-blueprint-config.test.ts`; the mutation results above record that
  removing either guard fails that suite.
