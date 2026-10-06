# 2026-10-05-discovery-evidence-family-library — Discovery archetypes: a reusable evidence-family library

## Release ID

`2026-10-05-discovery-evidence-family-library`

## Status

`candidate`

## Plain-English Summary

An archetype in the discovery catalog says what evidence a Move must gather.
Until now every archetype had to spell out each evidence family in full —
label, what it grounds, whether it is required, who likely holds it, what format
to ask for. That is the cost a deploying firm pays per archetype, and it is
where drift starts. The built-in seed already proves it: the same family id is
written four different ways across archetypes, because nothing held one
canonical definition for it.

This change adds a library of canonical evidence families and lets an archetype
**reference** one instead of retyping it, restating only the fields its own
context genuinely needs:

1. **A canonical library of nine families.** Five are the general-case
   archetype's own wording, verbatim — that archetype *is* the general case, so
   copying it is what makes "canonical" checkable rather than a sixth opinion.
   Four are the value and governance families the specific archetypes already
   repeat.
2. **Composition with overrides.** A reference carries the family id, so a
   reference can never rename the family it points at — including when a
   configured source (JSON or a table, which is not type-checked) smuggles an
   `id` of its own. An archetype that wants different wording states the
   override explicitly instead of diverging by accident.
3. **Rejected whole, never half-composed.** An unknown reference or a duplicate
   id is an error and the archetype does not compose. A partly composed
   archetype would produce an evidence request a client cannot satisfy, with
   nothing on screen saying a family went missing.
4. **A drift reading.** `sharedEvidenceFamilyDrift` reports, per
   archetype/family pair, which fields are restated. Nine pairs restate at least
   one field today, and the list is pinned in the suite so a wording change on
   either side is a deliberate edit rather than a silent divergence. Drift is
   not a failure — restating who holds the evidence is the point of overrides.

Nothing in the built-in seed is recomposed by this pass, so resolution behaviour
is byte-for-byte unchanged. The seam is what a configured source, and the setup
UI that follows it, compose against.

## Layer Impact

Release lane: `global-control-lane` — shared discovery-archetype composition for
all clients. Purely additive: no existing archetype, resolution path, or product
surface reads the new code, so behaviour on merge is unchanged for every Move.

- `3 CANONICAL MODEL` / archetype composition: a new
  `discovery-evidence-library` module holds the canonical families and the
  composition decision; the catalog module re-exports them and gains a
  read-only `discoveryCatalogSharedFamilyDrift()` over its own seed.
- `4 PRODUCTS` (Moves): no product surface changes. No route, component, API, or
  deliverable reads the new exports in this pass.

## Client Applicability

- All clients: no behaviour change. The composition seam is unreferenced by any
  resolution path.
- Specific clients: none targeted.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none needed — the change adds exports and changes no existing
  code path, so there is nothing to gate.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-evidence-library.ts` (new)
  — `SHARED_EVIDENCE_FAMILIES` (nine canonical families);
  `EvidenceFamilyRef` / `EvidenceFamilySpec` / `isEvidenceFamilyRef`;
  `composeEvidenceFamilies` (reference resolution, field overrides,
  unknown-reference and duplicate-id errors); `composeDiscoveryBlueprint`
  (reject-whole, empty-evidence refusal); `sharedEvidenceFamilyDrift`.
- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` — re-exports
  the library so a configured source composes against the module that owns the
  catalog, and adds `discoveryCatalogSharedFamilyDrift()`. No existing export,
  archetype, or resolution branch is touched.
- `src/lib/deliverables/orchestrator/__tests__/discovery-evidence-library.test.ts`
  (new) — 25 cases on the already-run orchestrator `__tests__` CI path.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Lane: `global-control-lane`.

- `jest` (new library suite) — **PASS**: 25/25.
- `jest` (`src/lib/deliverables/orchestrator/__tests__/` +
  `src/lib/programs/discovery/__tests__/`) — **PASS**: 54 suites, 615 tests.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0.
- `eslint` (both changed modules + the new suite) — **PASS**: 0 errors,
  0 warnings.
- Mutation check on the new module — **PASS**: 8 mutations staged (each asserted
  to match exactly once), 8 killed. The id-pinning mutation survived the first
  pass because the type forbids an `id` on a reference; the untyped
  configured-source case it actually guards was missing from the suite and was
  added, after which it is killed.
- `audit:test-ci-coverage:write` — **PASS**: `coveredTestFiles` 2547 → 2550 with
  `uncoveredTestFiles` unchanged at 164 (the new suite plus two that drifted in
  from `main`), which is what says the suite is CI-registered.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: all
  gates green locally.
- Signed-in walk — **NOT RUN**: nothing renders. No product surface reads the new
  exports, so there is nothing to walk.

## Rollout Plan

Merge to `main` via squash PR, auto-merge armed. Ships with the next ACA web
image via the repo-owned `aca-main-deploy` workflow. No flag and no behaviour
change on merge: the composition seam is additive and unreferenced.

## Rollback Plan

Revert the PR. The change adds one module, re-exports from a second, and one
test suite; nothing reads them, so reverting restores the prior tree exactly,
with no data, migration, or flag impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, env var, or secret.

## Known Gaps

- **The configured-source loader does not compose yet.** The contract and loader
  land separately; teaching the loader to accept references (so a configured
  archetype can say `{ "ref": "cost_baseline" }` instead of six fields) is the
  next slice, and it is the one that makes this library reachable from data.
- **The seed is not recomposed.** Every built-in archetype still writes its
  families out in full. Recomposing them is cosmetic churn with real regression
  risk and no user benefit until the loader composes, so it is deliberately not
  in this pass. The drift list is the honest record of what recomposition would
  have to preserve.
- **Interview rosters have no library.** Only evidence families compose; a
  roster is still written out per archetype. The same reference-plus-override
  shape applies and is a clean follow-up.
- **Drift is reported, not resolved.** Nine archetype/family pairs restate at
  least one field. Deciding which of those are deliberate and which are
  accidents of authoring is a product call, not a code change.
- **No setup UI.** Choosing families for an archetype without code is the phase
  after this one.
- **No signed-in visual proof** — nothing renders from this pass.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- The no-behaviour-change claim rests on the diff: no existing export,
  archetype, or resolution branch in `discovery-blueprint.ts` is modified, and
  the 54-suite regression run over both discovery test directories is green.
- The drift list and the composition refusals are pinned in
  `discovery-evidence-library.test.ts`.
