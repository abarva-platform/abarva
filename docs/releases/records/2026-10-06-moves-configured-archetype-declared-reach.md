# 2026-10-06-moves-configured-archetype-declared-reach — A configured archetype a firm adds can finally be chosen

## Release ID

`2026-10-06-moves-configured-archetype-declared-reach`

## Status

`candidate`

## Plain-English Summary

A Move declares which archetype it is — the use case shape that decides what
evidence the engagement asks a client for and whom it interviews. A deploying
firm can configure archetypes of its own in a declared JSON source instead of
shipping code: the source is validated, the archetype joins the effective
catalog, and the loader reports it as applied.

It could not be chosen. Every path that turns a Move's declared archetype into a
blueprint was bound to the built-in set, so a configured archetype that
**replaced** a shipped one worked, and a configured archetype that **added** a
new one was validated, held in the catalog, listed as applied — and selectable
by nothing. An operator saw their archetype accepted and watched every Move go
on being graded against the general case, with nothing anywhere saying why. The
other half of this engine already resolved against whichever catalog it was
handed; this half did not, and the asymmetry was the whole defect.

This release makes the declaration resolve against the **effective** catalog, so
a Move declaring a configured archetype gets it. Two things had to hold at once,
and the second is easy to lose:

- Resolving against the effective catalog only helps the declared path. When a
  Move declares nothing, keyword inference answers with one of the shipped
  archetypes — so the replacement rule still has to be applied afterwards, or a
  configured source silently stops reaching every Move that declared nothing,
  which is most of them.
- Keyword inference reads only shipped text and is deliberately left that way. A
  configured archetype is reachable by declaration and never by guesswork, which
  is the rule this product already holds itself to: identity is declared, never
  inferred.

Making a configured archetype selectable also made one class of configured
identifier dangerous for the first time, so this release refuses it. Archetype
identifiers are matched in a normalised form — separators collapsed, case
folded — and the contract admitted identifiers that are different as keys and
identical as declarations, `a__b` against `a_b` being the plain case. Two of
those put the result at the mercy of key order: the configured entry is reported
as applied while a Move declaring either spelling resolves the other. The loader
now rejects such a source whole and names the identifier it collides with,
including when the collision is with a shipped archetype — the likelier of the
two typos. An identifier that is exactly equal to a shipped one is untouched:
that is the replacement rule, not a collision.

The outcome is also now reported rather than implied. A resolution says whether
the blueprint came from the shipped set, from a configured replacement, or from
a configured addition — three states a typo apart, which a deploying operator
could previously not tell apart at all.

No shipped behaviour changes. With no source declared, every resolution is the
shipped resolution it has always been, and no environment that exists today
declares one.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves):** archetype resolution takes the catalog it is
  to resolve against, and both Discovery Plan hosts now resolve against the
  effective catalog. The resolved blueprint is identical for every input that
  exists today; the change is which catalog is consulted when a source is
  declared.
- **Layer 3 (Canonical model):** untouched. No schema, migration, loader against
  tenant data, or stored value is involved; no number anywhere is recomputed.

## Client Applicability

- All clients: no behavioural change. The new reach only bites on a declared
  configured source, which no client has.
- Specific clients: none.
- Internal only: the resolution origin and the loader's refusal are developer-
  and operator-facing.
- Public/demo only: none.
- Feature flag: none. Behaviour is identical for every shipped input and the new
  path is gated by whether an environment declares a source, so it needs no flag
  seat.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` —
  `resolveDeclaredDiscoveryBlueprint` and `resolveDiscoveryBlueprintWithBasis`
  take a catalog, defaulting to the shipped one, so every existing caller is
  unchanged; new exported `DiscoveryBlueprintCatalog` type; the loader refuses a
  configured identifier that cannot be declared unambiguously
  (`ambiguousDeclarationErrors`).
- `src/lib/deliverables/orchestrator/briefs/archetype-config-source.ts` —
  `resolveDiscoveryBlueprintFromConfiguredCatalog`, the entry point a generation
  path should use, plus `ConfiguredBlueprintOrigin`
  (`seed` / `configured_override` / `configured_addition`) derived from what the
  source applied, never from comparing the resolved entry with the shipped one.
  `applyConfiguredBlueprintOverride` is kept and is still a step inside the new
  entry point; its doc now says it can only ever replace, by construction, since
  it is handed a blueprint and not a declaration.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — both Discovery
  Plan hosts (the generic builder and the Moves one) resolve through the new
  entry point.
- `src/lib/deliverables/orchestrator/__tests__/archetype-config-declared-reach.test.ts`
  (new, in the CI-wired directory) — 17 cases.
- `docs/architecture/test-ci-coverage-census.json`,
  `docs/security/tenancy-fence-coverage.json` — regenerated.

No new test directory, no catalog registration, no flag registry change, no
generated manual change.

## QA / Validation

Lane: `global-control-lane`. Run in an isolated worktree off `origin/main` at
`b318fdb8d6`.

- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__/archetype-config-declared-reach.test.ts`
  — 17 tests.
- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__` — 53 suites /
  741 tests. The whole directory, because resolution sits in a module many
  suites compose through.
- **PASS** `npx jest src/lib/programs/discovery src/lib/programs/__tests__` —
  118 suites / 1089 tests. These are the other callers of the two resolution
  functions whose signatures changed.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` on all four changed files — exit 0.
- **PASS** mutation testing, 13 of 13 killed (whole directory per mutation):
  ignore the catalog argument in declared resolution [6 failures]; resolve the
  explicit declaration against the shipped catalog [1]; resolve the
  archetype-as-declaration branch against the shipped catalog [4]; skip the
  ambiguity refusal [2]; drop the refusal's exact-equality exemption so a
  replacement is refused [10]; omit shipped identifiers from the collision set
  [1]; omit configured identifiers from it [1]; drop the replacement step from
  the new entry point [1]; resolve inside the entry point against the shipped
  catalog [4]; derive the origin by comparing values instead of reading what was
  applied [3]; call an addition a replacement [1]; revert the generic Discovery
  Plan host to shipped-only resolution [2]; revert the Moves host [2].
- **PASS** pre-fix control: the ninth and thirteenth mutations above together
  _are_ the pre-fix state, and the suite fails on both.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** live signed-in walk. No route, rendered output, or client-visible
  text changes, and the new path requires a declared source no environment has,
  so a walk would observe nothing about this release.

Census note: `testFiles` 2725 → 2727 and `coveredTestFiles` 2561 → 2563. This
change adds **one** test file. The other increment is measured, not assumed: a
pristine `origin/main` worktree regenerates to 2726 / 2562 against a committed
2725 / 2561, so `main`'s census was already one behind. The whole
`docs/security/tenancy-fence-coverage.json` delta reproduces on pristine
`origin/main` too, so none of it is this change's.

## Rollout Plan

Merge to `main` by squash. No runtime rollout: no route, flag, environment
variable, image, worker job, or migration is involved, and no behaviour changes
for any shipped input.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to
  `main`, unchanged by this release.
- Shared runtime mutators: none. No Azure command is run by or for this release.
- Approved image digest: not applicable — no runtime image change is requested.
- ACA runtime invariant: unchanged; this release asserts nothing about the live
  runtime.
- Worker image invariant: unchanged; no worker job is involved.
- Feature/env flag update path: not applicable — no flag is declared or changed.
- Live signed-in proof required: no. Nothing client-visible changes.

## Rollback Plan

Revert the squash commit. The change is three source files, one new test file,
and two regenerated reports, with no migration, no stored state, and no
generated artifact beyond those reports, so the revert is complete on its own.

Two narrower stand-downs, if only part needs to go:

- To keep the new reach but drop the collision refusal, delete the
  `ambiguousDeclarationErrors` call in the loader; nothing else reads it.
- To stand down the reach while keeping everything else, point both Discovery
  Plan hosts back at the shipped-only resolution. The resolution functions'
  catalog parameters default to the shipped catalog, so no other caller has to
  change.

## Audit Evidence

- PR on `abarva-platform/abarva` from branch
  `moves/discovery-added-by-declaration-20261006`.
- CI run on that PR, including `npm run release:check`.
- The mutation table above, reproducible by reverting each named line.
- The suite's two host cases, which assert the added archetype's evidence family
  and interview role appear in the generated brief for both Discovery Plan hosts
  and are absent before the source is declared.

## Known Gaps

- **Nothing on a surface says which archetype decided a Move, or where it came
  from.** The resolution now carries whether the blueprint was shipped, replaced
  or added, and whether a supplied declaration named nothing at all, and no
  screen renders any of it. An operator still diagnoses a configured source by
  reading output. The setup UI is the place for it.
- **The effective catalog is re-read on every resolution.** With no source
  declared that is no work at all, so this is not a cost today; a deployment
  that declares one is the first that would need a cache and an invalidation
  story.
- **The discovery half's evidence families are still validated against no
  vocabulary.** The pack half now refuses a family nothing declares; this half
  takes any identifier, and those identifiers become retrieval query text. The
  same rule belongs here.
- **The two halves' family vocabularies remain disjoint** — measured at 34 and
  43 identifiers with none shared. Unchanged by this release and still a product
  decision.
- **Concatenated exhibits are still not de-duplicated by key**, which inflates
  the denominator a shortfall figure is printed from once a configured pack can
  collide with a deliverable type's own expected exhibits. It stays open until
  the pack-config consumer is on `main`.
- **The collision refusal is exact-normalisation only.** It catches two
  identifiers that read as the same archetype; it does not catch two that mean
  the same thing in different words, which needs the vocabulary work above.
