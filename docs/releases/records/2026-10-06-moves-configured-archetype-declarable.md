# 2026-10-06-moves-configured-archetype-declarable — An archetype a firm configured can finally be declared

## Release ID

`2026-10-06-moves-configured-archetype-declarable`

## Status

`candidate`

## Plain-English Summary

A Move declares which archetype it is — the use-case shape that decides what
evidence the engagement asks a client for and whom it interviews. A deploying
firm can configure archetypes of its own in a declared JSON source instead of
shipping code: the source is validated, the archetype joins the effective
catalog, and generation resolves a Move that declares it.

Nothing could make that declaration. The two places where a human's archetype
choice is turned into a stored value were both bound to the built-in set:

- The picker on the Move origination screen enumerates the built-in catalog, so
  a configured archetype is never offered on the one screen where a person
  declares one.
- The validator behind the submit refuses any identifier the built-in set does
  not hold, and it refuses by throwing. So even an operator who knew the
  identifier and submitted it by hand was rejected at origination.

Those two together meant the declared path could not be exercised end to end at
all. A configured archetype could be authored, validated, reported as applied,
resolved correctly in generation — and never actually declared by anyone, so the
resolution that honours it was unreachable in practice. An operator's whole
experience of configuring an archetype was watching it be accepted and then
seeing every Move go on being graded against the general case.

This release makes the declaration surface read the effective catalog, so an
archetype a firm configured is offered in the picker and accepted by both
validation gates. The picker also lists a firm's own archetypes as theirs rather
than mixing them into the built-in list: an operator has to be able to tell the
archetype they authored from one that shipped with the product, and the
identifier cannot tell them, because replacing a built-in archetype keeps the
built-in identifier while everything behind it — label, evidence families,
interview roster — comes from the firm's source.

One rule is deliberately unchanged. Keyword suggestion still reads only
built-in text, so a configured archetype is reachable by declaration and never
by guesswork. That is the rule this product holds itself to: identity is
declared, never inferred.

No shipped behaviour changes. With no source declared the effective catalog is
the built-in catalog and nothing was applied, so the picker shows the built-in
list in the built-in order, the firm-authored group does not render at all, and
every declaration that was accepted before is accepted identically. No
environment that exists today declares a source.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves):** the origination picker is built from the
  effective archetype catalog instead of the built-in one, and declaration
  validation resolves against the effective catalog. Identical output for every
  input that exists today; the change is which catalog is consulted when a
  source is declared.
- **Layer 3 (Canonical model):** untouched. No schema, migration, loader against
  tenant data, or stored value is involved, and no number anywhere is
  recomputed. What gets stored on a Move is the same declared identifier string
  it always was.

## Client Applicability

- All clients: no behavioural change. The widened reach only bites on a declared
  configured source, which no client has.
- Specific clients: none.
- Internal only: the firm-authored option group is operator-facing and renders
  only on a deployment that configures archetypes.
- Public/demo only: none.
- Feature flag: none. Behaviour is identical for every shipped input and the new
  path is gated by whether an environment declares a source, so it needs no flag
  seat.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-declaration-surface.ts`
  (new) — `listEffectiveDiscoveryArchetypeOptions` and
  `resolveEffectiveDeclaredDiscoveryBlueprint`: the declarable set and the
  declared-identity check, both over the effective catalog. Matching is
  delegated to `resolveDeclaredDiscoveryBlueprint`, so what counts as naming an
  entry cannot drift between offering an archetype and accepting it.
- `src/lib/deliverables/orchestrator/briefs/archetype-config-source.ts` —
  `configuredBlueprintOrigin` is exported rather than module-private, so the
  picker and a resolution answer "whose archetype is this" from one derivation
  instead of two. No behaviour change.
- `src/lib/programs/discovery/discovery-archetype-declaration.ts` — both
  validation gates (`normalizeDiscoveryArchetypeDeclaration` and
  `withDeclaredDiscoveryArchetype`) resolve against the effective catalog.
- `src/app/(maestro)/strategic-moves/new/page.tsx` — the origination screen
  passes the effective option list to the originate client.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — an
  archetype whose entry came from the firm's source is listed under its own
  group label instead of in the built-in group. The group is omitted entirely
  when it would be empty, which is every deployment today, and an option that
  states no origin reads as built-in.
- `src/lib/programs/__tests__/discovery-archetype-declaration.test.ts` — 9 new
  cases, in a directory already swept by a required check.
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
  — 2 new cases, in a file already named by a required check.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new test directory, no new test file, no catalog registration, no flag
registry change, no generated manual change, no migration.

## QA / Validation

Lane: `global-control-lane`. Run in an isolated worktree off `origin/main` at
`ca5ceddb92`.

- **PASS** `npx jest src/lib/programs/__tests__/discovery-archetype-declaration.test.ts`
  — 13 tests.
- **PASS** `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
  — 35 tests.
- **PASS** `npx jest src/lib/programs/__tests__ src/lib/deliverables/orchestrator/__tests__ src/lib/programs/discovery`
  — 173 suites / 1888 tests. The whole of each directory, because declaration
  validation is composed through by many suites.
- **PASS** `npx jest src/components/strategic-moves/__tests__` — 37 suites /
  537 tests. The whole directory, because the picker lives in a component other
  suites in it render.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` on all seven changed files — exit 0.
- **PASS** `npm run audit:lib-orphans` — "No change against the baseline"; the
  new module is reached by the product, not by its test only.
- **PASS** mutation testing, **10 of 11 killed**: revert the first validation
  gate to built-in-only resolution [1 failure]; revert the second gate [1];
  build the option list from the built-in catalog [2]; derive an entry's origin
  by comparing it against the built-in catalog instead of reading what the
  source applied [1]; report a configured addition as a replacement [1]; revert
  the origination screen to the built-in-only option list [2]; let the built-in
  group keep the firm's archetypes as well [1]; treat an option that states no
  origin as the firm's own [1]; render the firm-authored group unconditionally
  [1]; change the firm-authored group's label [1].
- **PASS** pre-fix control: the first, second and sixth mutations above together
  _are_ the pre-fix state, and the suites fail on each.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** live signed-in walk. Every rendered difference requires a declared
  configured source, which no environment has, so a walk would observe the
  screen exactly as it is today. Noted as a Known Gap.

Census note: `testFiles` 2727 → 2730 and `coveredTestFiles` 2563 → 2566. This
change adds **no** test file at all — both new case sets went into existing
files. The whole delta is measured, not assumed: a pristine `origin/main`
worktree regenerates to exactly 2730 / 2566 / 2565 against a committed
2727 / 2563 / 2562, so every one of the three is drift that was already on
`main`. `docs/security/tenancy-fence-coverage.json` regenerates unchanged.

## Rollout Plan

Merge to `main` via squash. No runtime rollout step: no migration, no flag, no
environment variable, no image or traffic change, and no behavioural difference
on any environment that does not declare a configured archetype source. The
change becomes active for a deployment at the moment that deployment declares
one, which is the same condition that already governs the rest of this engine.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the
  only path that may ship this to a shared runtime.
- Shared runtime mutators: none in this change. No `az containerapp` command,
  no revision weight, no Container App template edit.
- Approved image digest: not applicable — this release requests no deploy. The
  next main deploy carries it under that workflow's own digest pinning.
- ACA runtime invariant: unchanged by this release; nothing here edits env vars,
  flags, scale, secrets or images.
- Worker image invariant: unchanged. No worker job is involved.
- Feature/env flag update path: none. No entry is added to the flag registry.
- Live signed-in proof required: no. Nothing a signed-in walk can reach changes
  until a deployment declares a configured archetype source.

## Rollback Plan

Revert the squash commit. The change is self-contained in five source files plus
two test files, adds no migration and no stored field, and writes nothing — the
value stored on a Move is the same declared identifier string as before, so a
revert leaves no data behind that the reverted code cannot read. A Move
originated while this was live and declaring a configured archetype would, after
a revert, hold an identifier the built-in catalog does not know; resolution
already treats an unknown declaration as a fall-through to inference and reports
it as `unknownDeclaration`, so such a Move degrades to the general case rather
than failing. No such Move can exist today, because no environment declares a
source.

## Known Gaps

- **One surviving mutation, diagnosed.** Dropping the suggestion filter from the
  firm-authored group changes nothing observable: keyword suggestion reads only
  built-in text by design, so the firm-authored subset of the suggested set is
  always empty and that filter can never fire. The filter is kept because it is
  correct under both readings, and it is unobservable rather than untested.
- **Suggestion is still built-in-only.** A firm that configures an archetype can
  declare it but will never see it proposed from a Move's text, even though
  suggestion is explicitly a proposal for a human to confirm and not an
  authority. Widening it is a product decision about whether a firm's own
  keywords may rank, not a defect in this slice.
- **Nothing reports an inert or rejected source to the person.** A source that
  fails validation falls back whole to the built-in catalog, which is the safe
  outcome — but the operator sees the built-in list and no explanation. The
  state and the errors are both carried on the effective catalog already; what
  is missing is a surface, which is the setup screen still to be built.
- **The origination screen's wiring is pinned against its source text**, not by
  rendering it, because it is a server component behind authentication and
  tenancy. The assertion checks both directions — the effective list is called
  and the built-in-only list is not — and it fails on a revert, but it is a
  source assertion rather than a behavioural one.
- **The effective catalog is read per call and not memoised.** Unchanged by this
  release and still waiting on the first deployment that declares a source,
  which is the first one that would need a cache-invalidation story.

## Audit Evidence

- PR: opened against `main` in `abarva-platform/abarva`; squash merge.
- CI: the required `AI surface control catalog` check runs both changed test
  files — one through its `src/lib/programs/__tests__` directory step, one by
  exact path.
- Mutation log: the eleven mutations and their per-mutation suite results are
  listed under QA / Validation above.
- Census proof: the pristine-`origin/main` regeneration figures quoted under QA
  / Validation are reproducible by regenerating the census in a clean worktree
  at `ca5ceddb92`.
