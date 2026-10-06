# 2026-10-06-blueprint-loader-family-references — a configured discovery archetype may reference a shared evidence family

## Release ID

`2026-10-06-blueprint-loader-family-references`

## Status

`candidate`

## Plain-English Summary

A deploying firm can configure its own discovery archetypes: each one declares
what evidence a Move must gather and who should be interviewed. Until now every
configured archetype had to spell out each evidence family in full — its label,
what it grounds, whether it is required, who likely holds it, and its format —
even when the family was one of the nine canonical ones the product already
defines centrally.

Those canonical definitions, and the composition that resolves a reference to
them, shipped earlier. What was missing is that the contract a configured source
is validated against only accepted fully-written families, so the one thing the
shared library exists to remove was still the only authorable form. The library
was reachable from code and from nothing an operator could write.

This change lets a configured archetype write `{ "ref": "kpi_baseline" }` and
optionally restate just the fields its own context needs — "the same KPI
baseline, but our plant analytics team holds it." References are resolved when
the catalog is built, so everything downstream still reads concrete families and
nothing beyond the loader knows a reference was used.

Four refusals come with it, each for an outcome that would otherwise be wrong
and silent:

- A reference that names no library family rejects the whole configured source,
  as a schema failure already does. A half-composed archetype asks a client for
  an evidence list with a family missing from it, and no screen says one went
  missing.
- A spec that names both `ref` and `id` is refused rather than resolved. The
  fully-written contract strips unrecognised keys, so such a spec would have
  parsed as a written family under the declared `id` with the reference
  dropped — the author's overrides landing on a family that borrows nothing
  from the one they named.
- A reference is strict about its override keys. A reference is mostly absent
  fields, so a misspelled override would otherwise be dropped in silence and
  the archetype would ship the canonical wording while its author read their
  own.
- A reference to a JavaScript object member (`constructor`, `__proto__`,
  `prototype`, and the inherited members generally) names nothing the library
  holds. Read as a plain index these are truthy and are not families, so the
  composed result would carry no id and evidence nobody declared would reach a
  client's request list. Refused at the contract, and separately treated as
  unknown by the resolver itself, which is exported and callable without the
  contract.

The reference contract is validated by dispatching on the presence of `ref`
rather than by trying two alternatives. Trying alternatives reports only
"invalid input", naming neither the field nor the reason, in exactly the
malformed-config case an operator needs the message for.

## Layer Impact

- **Layer 4 (Products — Moves)**, `global-control-lane`. The discovery-archetype
  configuration contract gains an additional authorable form for evidence
  families. No product surface changes, no route changes, and no default
  behaviour changes: with no configured source declared, the built-in catalog is
  returned exactly as before.
- **Layer 3 (Canonical model)** — unchanged. No schema, migration, table, or
  canonical object is touched. The shared library's resolver is hardened to read
  only families it actually holds.
- **Layers 1–2 (Client intake, source adapters)** — untouched.

## Client Applicability

- All clients: yes, as a configuration capability only. No client's behaviour
  changes unless an operator declares a configured source.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The capability is reached only by declaring the
  configured-source path environment variable, which is unset everywhere; with
  it unset the loader short-circuits and does no I/O.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` —
  `EvidenceFamilyRefSchema` (strict; `ref` carries the same key-hazard refusal
  as a declared id), `EvidenceFamilySpecSchema` (dispatch on `ref`, forwarding
  the chosen branch's own issues at their own paths), the `evidenceFamilies`
  field now an array of specs, uniqueness measured on the identity a spec
  declares, and composition in `loadDiscoveryBlueprintCatalog` with reject-whole
  on any composition error.
- `src/lib/deliverables/orchestrator/briefs/discovery-evidence-library.ts` — the
  reference lookup is an own-property read rather than a plain index.
- `src/lib/deliverables/orchestrator/__tests__/discovery-blueprint-config.test.ts`
  — 15 cases appended to the already CI-wired suite.
- `src/lib/deliverables/orchestrator/__tests__/discovery-evidence-library.test.ts`
  — 6 cases appended, covering the resolver's own door.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Lane: `global-control-lane`.

- PASS — `npx jest src/lib/deliverables/orchestrator/__tests__` — 51 suites,
  670 tests. The whole directory, not only the two suites touched: the loader is
  composed through by many suites in it.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
--noEmit` — exit 0.
- PASS — `npx eslint` over the four changed files — exit 0.
- PASS — mutation testing, 9 of 9 mutations killed, each run against the whole
  directory: plain-index lookup (6 failures), both-`ref`-and-`id` refusal
  removed (1), reference no longer strict (1), key-hazard refusal removed (3),
  dispatch replaced by trying alternatives (3), loader storing specs without
  composing (5), composition failure skipping the entry instead of rejecting
  whole (2), uniqueness reading only a written-out id (2), non-object guard
  removed (1).
- PASS — `npm run audit:test-ci-coverage:write`, `npm run
audit:tenancy-fence-coverage:write`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN — live signed-in walk. Nothing renders differently: no surface, route,
  flag, or default-path behaviour changes, and the capability is unreachable
  without an operator-declared configuration path.
- NOT RUN — `npm run docs:nexus-manual`. No flag registry change.

Census attribution: the regenerated census moves `testFiles` 2720 → 2722 and
`coveredTestFiles` 2556 → 2558. **None of that delta is this change** — it adds
no test file, appending to two already-registered suites. Regenerating on a
pristine `origin/main` with no working-tree changes produces the same 2722/2558,
so the committed counts were already stale; the drift guard runs on branches
only.

## Rollout Plan

Merge to `main` via squash. No runtime rollout: no image build, no deploy, no
migration, no flag, no environment variable change. The capability becomes
authorable the moment the code is on main and takes effect only where an
operator declares a configured source.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image is built or pinned
  here.
- ACA runtime invariant: unaffected; no Container App template, traffic weight,
  or revision is touched.
- Worker image invariant: unaffected; no worker job is added or changed.
- Feature/env flag update path: none. No entry is added to the flag registry.
- Live signed-in proof required: no. This release makes no claim of
  `live-proven` and changes no client-visible behaviour.

## Rollback Plan

Revert the squash commit. The change is additive at the contract: reverting
restores a contract that accepts only fully-written families. A configured
source written with references would then be rejected whole with an unknown-key
error rather than silently misread, so no configured archetype can be left
half-applied by the rollback. No migration, no data backfill, and no deployed
artifact to unwind.

## Audit Evidence

- PR on `abarva-platform/abarva` (link in the PR description), with its required
  checks.
- Mutation results above, reproducible by reverting each named guard and running
  `npx jest src/lib/deliverables/orchestrator/__tests__`.
- `npm run release:check -- --base origin/main --head HEAD`, 11 gates.

## Known Gaps

- **An added archetype still cannot be reached by declaration on the discovery
  half.** A configured entry whose id matches what resolution already chose
  overrides it; a brand-new id joins the effective catalog but declared matching
  happens inside the blueprint module against the built-in catalog. The
  artifact-pack half already resolves against whichever catalog it is handed.
  The gap is pinned by a test asserting today's fall-through so it cannot read
  as a working path. Closing it means a change inside the module several open
  PRs are editing, which is why it is not in this slice.
- **The built-in catalog is still not recomposed into references.** Every
  built-in override restates the field anyway, so recomposition shrinks nothing
  while carrying real regression risk. The drift report says how far each
  built-in archetype has moved from the canonical wording; it is a reading, not
  a failure.
- **Evidence-family names are still checked against no shared vocabulary on the
  artifact-pack half.** That half lists the families an archetype's exhibits
  rely on as free strings, and those strings become retrieval query text, so a
  typo degrades retrieval rather than failing. References give the discovery
  half a checked vocabulary; the two halves' vocabularies remain disjoint with
  no dictionary relating them.
- **A configured pack can still collide with a structure's expected exhibits.**
  Expected exhibits are concatenated with no dedupe by key, and the shortfall
  figure counts the array, so a duplicate inflates the denominator. Unreachable
  until the pack configuration consumer is on main, which it is not yet.
- No setup UI. Configuring an archetype remains a declared JSON file, not a
  screen.
