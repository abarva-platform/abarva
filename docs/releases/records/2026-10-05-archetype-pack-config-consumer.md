# 2026-10-05-archetype-pack-config-consumer — A configured artifact pack reaches what the Move produces

## Release ID

`2026-10-05-archetype-pack-config-consumer`

## Status

`candidate`

## Plain-English Summary

A discovery archetype in Moves is declared in two catalogs. One says what
evidence a Move collects and whom it interviews. The other says what the Move
then **produces** — which exhibits, which tables, and the extra governance
sentence that constrains what may be asserted.

The second catalog was given a configuration contract and an overlay loader in
an earlier release, and that release said plainly that nothing called the
loader yet. Nothing did. Every live path resolved the declared archetype against
the built-in set, so a deploying firm could author a valid configured pack,
watch it validate, and then receive the **generic** exhibits and tables for the
archetype it had just configured. Authorable, validatable, and ignored.

This release closes both ends of that seam, the same way the evidence half was
closed:

- **Supply.** An operator declares a path to the configured pack source in the
  environment, under its own variable, separate from the evidence source's.
  Nothing is searched for; there is no convention path and no directory scan.
  With the variable unset the code performs no filesystem call at all and the
  built-in set stands, which is every environment that exists today.
- **Consume.** Brief composition now resolves the declared archetype against the
  **effective** catalog — the built-in set with a validated configured source
  overlaid — instead of the built-in set alone.

One rule is deliberately **wider** here than in the evidence half, and the
difference is a widening rather than a divergence. There, resolution happens
inside the catalog's own module and a configured entry can only replace what
resolution already chose; reaching a brand-new configured archetype needs a
change in that module, and that gap is still open. Here, resolution is a
normalised walk over whichever catalog it is handed, so resolving against the
effective catalog reaches a newly **added** archetype by declaration with no
change to the resolver at all.

Both outcomes are reported, and reported from what the configured source said it
applied rather than from comparing the resolved pack against the built-in one. A
configured entry that restates a shipped pack field for field is
indistinguishable by value, and an operator told "this came from the built-in
set" for an archetype they just configured cannot tell whether their source was
read at all.

Three failure modes are reported distinctly rather than collapsing into "nothing
happened": no source declared, a declared path that cannot be read or is not
valid data, and a source that fails validation. All three leave the built-in set
in force so the Move still generates — which is exactly why they have to be
distinguishable, or a typo reads as "configuration does nothing".

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour for every
client, and behaviour-identical on every environment that declares no configured
source, which is all of them today.

- **Layer 4 — Products (Moves):** the brief-composition path changes which
  catalog it resolves against. With no source declared the effective catalog is a
  copy of the built-in set and the resolved entry is identical, which is pinned
  by a case that walks every built-in archetype and compares against the
  built-in accessor.
- **Layer 3 — Canonical model:** unchanged. No schema, migration, table, or
  stored object. The configured source is a file an operator declares; nothing
  is written.
- **Layers 1-2 — Intake and adapters:** unchanged.

## Client Applicability

- All clients: no behaviour change. No environment declares the new variable, so
  the resolution answer is identical to before.
- Specific clients: none.
- Internal only: the configured-source path is the foundation for the operator
  setup surface, which is still unbuilt.
- Public/demo only: none.
- Feature flag: none. The behaviour is gated by whether an operator declares a
  path at all — absent declaration is the current behaviour, exactly.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-identity.ts` — adds
  `resolveArchetypeCatalogKey`, which answers **which** catalog key a declared
  token matched rather than the entry. `resolveArchetypeCatalogEntry` becomes a
  wrapper over it, so there is still exactly one implementation of what a
  declared token matches and the two cannot drift.
- `src/lib/deliverables/orchestrator/briefs/archetype-config-source.ts` — the
  declared-path reader is generalised behind one shared helper taking the
  environment key, so both halves share the short-circuit, the reject-whole
  behaviour, and the error shape. Adds
  `ARCHETYPE_PACK_CONFIG_PATH_ENV`, `readConfiguredArchetypePackSource`,
  `EffectiveArchetypePackCatalog`, `loadEffectiveArchetypePackCatalog`,
  `ArchetypePackOrigin`, `ConfiguredArchetypePackResolution`, and
  `resolveConfiguredArchetypePack`.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — brief
  composition resolves through `resolveConfiguredArchetypePack` instead of the
  built-in accessor. Two call sites, plus the import. The second is the
  evidence-landing report that landed on `main` after this branch opened: its
  own doc comment promises the report is taken from "the resolver the product
  uses", and leaving it on the built-in accessor would have made it report the
  seed's families while composition carried the configured ones — a
  disagreement on exactly the deployment the report exists to explain. With no
  source declared the two resolvers answer identically, so this is inert on
  every environment that exists today.
- `src/lib/deliverables/orchestrator/__tests__/archetype-config-source.test.ts` —
  two expectations conformed to rules `main` merged while this branch was open,
  not relaxed. (1) The configured pack fixture now declares its own evidence
  family: a pack may only NAME a family something declares, and the fixture's
  family is the pack's own, so `declaresEvidenceFamilies` is the escape hatch
  that rule ships for this case. (2) The landing-site expectation becomes two
  keys, because the structure under test now DECLARES `maturity_gaps` as an
  archetype-evidence site alongside the inferred `current_state`. Both keys are
  written out as literals rather than derived from the structure, so a
  declaration going missing fails the case instead of shrinking the
  expectation.
- `src/lib/deliverables/orchestrator/__tests__/archetype-config-source.test.ts` —
  20 cases appended to the suite that already pins the evidence half, so the two
  halves of one seam are read together. No new file and no new directory, so no
  CI wiring question arises. The twentieth is the landing report's own guard,
  and it exists because the second call site above was otherwise unpinned:
  nothing failed on the wrong resolver, since the two agree wherever no source
  is declared. It asserts the report calls a configured deployment grounded,
  and separately that the built-in pack's families appear in no section of the
  brief actually served — so the two resolvers provably disagree in that
  scenario rather than coinciding.
- `docs/architecture/test-ci-coverage-census.json` — regenerated after merging
  `main` in. The delta (`testFiles` 2727 → 2728, `coveredTestFiles`
  2563 → 2564, `uncoveredTestFiles` unchanged) is **not** this change: no test
  file was added here, and the uncovered count moving would be the signal that
  one had been added outside a wired directory. It is accumulated drift from
  other merges, which the committed census does not pick up because its drift
  guard runs on branches only. The regenerated run then reports
  `census drift: committed census matches this run`.

## QA / Validation

Lane: `global-control-lane`.

| check | command | result |
|---|---|---|
| the amended suite | `npx jest src/lib/deliverables/orchestrator/__tests__/archetype-config-source.test.ts` | **PASS** — 36/36 (16 pre-existing + 20 new) |
| whole suite directory (the CI job's own scope) | `npx jest src/lib/deliverables/orchestrator/__tests__` | **PASS** — 52 suites, 744 tests, re-run after merging `main` in |
| typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| lint | `npx eslint <the four changed source files>` | **PASS** — exit 0 |
| orphan reachability | `npm run audit:lib-orphans` | **PASS** — no change against baseline |
| coverage census | `npm run audit:test-ci-coverage:write` | **PASS** — regenerated, then matches this run |
| fence census | `npm run audit:tenancy-fence-coverage:write` | **PASS** — already current, no diff |
| release gates | `npm run release:check -- --base origin/main --head HEAD` | **PASS** |
| live signed-in walk | — | **NOT RUN** — no route, component, or client-visible surface changed, and no environment declares the new variable. This record does not claim `live-proven`. |

**Guard strength (mutation check).** Each guard was removed one at a time against
the restored baseline, with the mutator asserting a single textual match so a
silent no-op edit could not read as a survivor. The whole suite directory was
run each time, not only the amended suite, because the wiring line sits in a
module several suites compose through. 8 of 8 killed:

| mutation | failures |
|---|---|
| revert brief composition to the built-in accessor | 2 |
| revert the landing report to the built-in accessor | 1 |
| the pack reader reads the evidence half's environment variable | 12 |
| decide where the entry came from by comparing it with the built-in one | 1 |
| resolve the declaration against the built-in set, not the effective catalog | 2 |
| the key resolver answers the normalised declaration instead of the catalog's own spelling | 15 |
| a source that fails validation still reports itself as in effect | 2 |
| drop the short-circuit for a declared path that cannot be read | 1 |

The restored baseline then ran 744/744 green, so the harness was executing the
suites rather than reporting an empty run.

Two guards were considered and **not** added. A helper listing the built-in ids,
so a setup surface could warn before a typo replaced a shipped archetype, was
written and removed: nothing calls it, so it changes no behaviour and would read
as a surviving mutation. And no by-name refusal of inherited object members was
added on this side — the effective catalog is built on a null prototype and
resolution walks own keys only, which is both effective and observable, and the
suite asserts it directly.

## Rollout Plan

Merge to `main` via squash. No runtime rollout step: no route, component,
migration, worker job, image, or flag changed, and no environment declares the
new variable, so the next ordinary deploy of `main` carries a behaviour-identical
product. Declaring the variable on an environment is a separate, deliberate
operator act with its own record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — not
  invoked by this release beyond the ordinary `main` cadence.
- Shared runtime mutators: none. No `az containerapp` command is required or
  implied, and this release sets no environment variable on any shared runtime.
- Approved image digest: not applicable — no runtime update requested.
- ACA runtime invariant: unchanged; this release asserts nothing about it.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none; this release declares no flag. The new
  environment variable is operator-declared and unset everywhere.
- Live signed-in proof required: **no** — no client-visible surface changed.

## Rollback Plan

Revert the squash commit. The only behavioural lines are the two resolution
calls — brief composition and the evidence-landing report — and reverting them
restores the built-in accessor exactly;
the rest is additive exports and test cases. There is no data, migration, flag,
or deployed artifact to unwind. If an environment had already declared the new
variable, reverting silently returns it to the built-in set for that
environment — so unset the variable first, then revert, so the operator sees the
change as theirs rather than as a regression. If the revert lands after another
change touches the census, re-run
`npm run audit:test-ci-coverage:write`.

## Audit Evidence

- PR URL and CI run: recorded on the pull request opened for this branch.
- Mutation results and command transcripts: the QA table above.
- Census delta and its attribution: the Changes Included entry above.

## Known Gaps

1. **The effective catalog is rebuilt on every call and never cached.** With no
   source declared that is one object copy and no filesystem call; with one
   declared, the file is read once per composed brief. The first environment to
   declare a source is also the first that would need an invalidation story, so
   guessing at one now would be untested. Same gap, same reason, as the evidence
   half.
2. **The evidence half still cannot reach a newly added archetype by
   declaration.** Its resolution lives inside its own catalog module, which has
   several changes in flight; widening it there is its own slice. This release
   does not narrow the gap, and the suite pins the current fall-through so it
   cannot read as a working path.
3. **Nothing surfaces the reported state to a human.** The resolution carries
   which source answered, whether an entry added or replaced, the declared path,
   and the validation errors — and no screen renders any of it, so an operator's
   only feedback on a rejected source is that the output looks generic. That
   surface is the setup-UI slice.
4. **A configured pack can collide with the deliverable structure's own expected
   exhibits.** Composition concatenates the structure's expected exhibits with
   the pack's with no de-duplication by key. There are no collisions among the
   built-in entries, which is why no guard is added here — it would be
   unkillable — but a configured pack can now actually produce one, and the
   shortfall count downstream reads straight off the array length, so a
   duplicate inflates the denominator and the shortfall can never close. This is
   the next correctness item in this area and it is newly reachable **because**
   of this release.
5. **A pack's evidence family names are free strings checked against no
   vocabulary.** They become retrieval query text, so a typo degrades retrieval
   silently rather than failing. Configuration widens the blast radius: the
   built-in names were at least reviewed in code.
6. **The two catalogs still declare disjoint id sets**, so a declaration gets
   archetype-specific output from at most one of them. That is a product decision
   about which archetypes each catalog should declare, not a resolution defect,
   and it is unchanged here.
