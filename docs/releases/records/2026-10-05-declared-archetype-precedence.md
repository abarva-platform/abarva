# 2026-10-05-declared-archetype-precedence — Declared archetype resolution prefers a known catalog archetype

## Release ID

`2026-10-05-declared-archetype-precedence`

## Status

`candidate`

## Plain-English Summary

Field-safety fix for how a Move's declared archetype is resolved.
`resolveDeclaredProgramArchetypeId` returned the *first non-empty* of
`functionPackKey → charter.classification.archetype → program.archetype`. So a
`functionPackKey` that is not an archetype would **shadow** a valid archetype
declared in the charter classification, and the declaration would silently not
take — forcing the data-plane to overload `program.archetype` (which drives
phase logic) to declare a discovery blueprint.

Now the resolver **prefers the first candidate that names a known catalog
archetype**. A declared identity wins regardless of field order, so a
non-archetype `functionPackKey` cannot shadow a charter-declared archetype, and
`program.archetype` need not be overloaded. When no candidate matches the
catalog, the first non-empty value is returned as the inference seed — identical
to the prior behavior, so undeclared Moves are unaffected.

## Layer Impact

Release lane: `global-control-lane` — shared archetype resolution. Behavior is
unchanged when no field names a catalog archetype.

- `3 CANONICAL MODEL` / archetype layer: `resolveDeclaredProgramArchetypeId`
  (`src/lib/programs/discovery/evidence-readiness.ts`) now consults the catalog
  (`resolveDeclaredDiscoveryBlueprint`) to pick a declared archetype across the
  candidate fields, rather than taking the first non-empty regardless of meaning.

## Client Applicability

- All clients: applies wherever a Move declares a catalog archetype in any of
  the candidate fields; undeclared Moves are unaffected.
- Specific clients: none targeted.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — additive precedence refinement; backward-compatible.

## Changes Included

- `src/lib/programs/discovery/evidence-readiness.ts` —
  `resolveDeclaredProgramArchetypeId` prefers a candidate that resolves to a
  known catalog archetype, falling back to first-non-empty as the inference
  seed; removed the now-unused `firstNonEmptyString` helper.
- `src/lib/programs/discovery/__tests__/evidence-readiness.test.ts` — precedence
  cases: non-archetype `functionPackKey` does not shadow a charter declaration;
  `program.archetype` need not be overloaded; a catalog archetype in
  `functionPackKey` is honored; inference-seed fallback preserved.

## QA / Validation

- `jest` (`evidence-readiness`) — **PASS**: 23/23 (incl. 4 new precedence cases).
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag; undeclared Moves unchanged.
Unblocks declaring a Move's archetype via the charter classification without
overloading phase fields (data-plane lane).

## Rollback Plan

Revert the PR. The change refines a resolution precedence and removes a dead
helper; reverting restores first-non-empty precedence with no data, migration,
or behavior impact for undeclared Moves.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- No signed-in visual proof (not possible off the private data plane here).
- The data-plane declaration of a specific Move (which field to write, verifying
  existing values) remains the data-plane lane's step; this fix makes the
  charter-classification field a safe place to declare.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.
- The shadowing fix and inference-seed fallback are covered by
  `evidence-readiness.test.ts`.
