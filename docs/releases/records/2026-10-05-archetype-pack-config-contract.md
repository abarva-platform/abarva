# 2026-10-05-archetype-pack-config-contract — A config contract for the artifact half of an archetype

## Release ID

`2026-10-05-archetype-pack-config-contract`

## Status

`candidate`

## Plain-English Summary

A "discovery archetype" in Moves is declared in two places. One catalog says what
evidence to collect and whom to interview; the other says what the resulting
documents must contain — which exhibits, which tables, and the extra governance
sentence that constrains what may be asserted.

The first catalog already accepted configuration: a deploying firm could add or
override an archetype by supplying validated data, without shipping code. The
second did not. So "configure an archetype without writing code" was only half
true — a configured archetype gathered the right evidence and then produced the
generic set of exhibits and tables, because the artifact half could only be
extended by editing a source file.

This release gives the artifact catalog the same contract: a schema describing
what a configured entry must satisfy, and a loader that overlays a validated
configured source onto the built-in set. As with the existing half, an invalid
source is rejected **whole** — the built-in set is returned untouched and the
validation errors are reported — so a malformed configuration can never leave
the catalog half-applied.

Two things the loader does that the existing half does not, both answering a
question a setup screen has to answer honestly:

1. **It says what each configured entry actually did** — added a new archetype,
   or replaced a built-in one. Those two outcomes are one typo apart: an id
   intended to be new that happens to match a built-in silently replaces the
   shipped archetype, and a flat list of "applied" ids reports that as a
   successful addition. The outcome is now named per entry, in source order.
2. **It refuses a source that declares the same id twice.** Previously the later
   entry would quietly win and the id would simply appear twice in the applied
   list, giving the operator who wrote both definitions no signal that one was
   discarded.

Nothing calls the loader yet. This is a seam, exactly as the first half was on
the day it landed: the built-in set is returned unchanged when no configuration
is supplied, which is every code path in the product today.

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour, available to
every client, and in this release inert because nothing calls it yet.

- **Layer 4 — Products (Moves):** additive only. New exported schema, loader,
  and validator in the deliverable-orchestrator brief layer. No existing export
  changed signature or behaviour; the existing lookup path is untouched.
- **Layer 3 — Canonical model:** unchanged. No schema, migration, or stored
  object. The configured source is an in-memory value supplied by a caller.
- **Layers 1-2 — Intake and adapters:** unchanged.

## Client Applicability

- All clients: no behaviour change. The new code is unreferenced by any product
  or operator entry point; `audit:lib-orphans` reports no change against its
  baseline because the module it was added to is already reached.
- Specific clients: none.
- Internal only: the contract is the foundation for the operator setup surface.
- Public/demo only: none.
- Feature flag: none required — no call site, so there is no behaviour to gate.
  The loader's no-configuration path returns the built-in set unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-packs.ts` — adds
  `ExpectedExhibitSchema`, `ExpectedTableSchema`, `ArchetypePackSchema`,
  `ArchetypePackCatalogSchema`, `ArchetypePackConfig`, `AppliedArchetypePack`,
  `LoadedArchetypePackCatalog`, `loadArchetypePackCatalog`, and
  `validateBuiltInArchetypePackCatalog`. Appended at the tail; the existing
  catalog and lookup are unmodified.
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-config.test.ts` —
  new suite, 16 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated;
  `coveredTestFiles` 2550 → 2551, `uncoveredTestFiles` unchanged, which is the
  proof the new suite is swept by a CI job rather than sitting in a dark
  directory.

## QA / Validation

Lane: `global-control-lane`.

| check | command | result |
|---|---|---|
| new suite | `npx jest src/lib/deliverables/orchestrator/__tests__/archetype-pack-config.test.ts` | **PASS** — 16/16 |
| whole suite directory (the CI job's own scope) | `npx jest src/lib/deliverables/orchestrator/__tests__ --ci` | **PASS** — 46 suites, 543 tests |
| typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| lint | `npx eslint <the two changed files>` | **PASS** — exit 0 |
| orphan reachability | `npm run audit:lib-orphans` | **PASS** — no change against baseline |
| coverage census | `npm run audit:test-ci-coverage:write` | **PASS** — committed census matches |
| fence census | `npm run audit:tenancy-fence-coverage:write` | **PASS** — already current, no diff |
| release gates | `npm run release:check -- --base origin/main --head HEAD` | **PASS** |
| live signed-in walk | — | **NOT RUN** — no runtime surface changed; nothing to walk |

**Guard strength (mutation check).** Each new guard was removed one at a time
against the restored baseline, with the mutator asserting a single textual match
so a silent no-op edit could not read as a survivor. 6 of 6 killed:

| mutation | failures |
|---|---|
| outcome always reports `added` | 2 |
| drop the duplicate-id refusal | 1 |
| copy the built-in set into a plain object instead of a null prototype | 1 |
| drop exhibit-key uniqueness | 1 |
| drop the id-shape regex | 1 |
| drop table-key uniqueness | 1 |

The restored baseline then ran 16/16 green, so the harness was genuinely
executing the suite rather than reporting an empty run.

One guard was considered and **not** added: a by-name refusal of `__proto__`,
`constructor` and `prototype` as ids. The id shape this catalog keys by is
upper-case, and none of those three can match it, so such a refusal would change
no behaviour and would read as a surviving mutation. The returned catalog is
built on a null prototype instead, which is both effective and observable — a
lookup answers only ids the catalog actually holds, and the test asserts that
directly. That difference is what mutation 3 above measures.

## Rollout Plan

Merge to `main` via squash. No runtime rollout: no route, component, migration,
flag, environment variable, image, or worker job changed, and the new code has
no call site. The next deploy of `main` carries it inertly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — not
  invoked by this release beyond the ordinary `main` cadence.
- Shared runtime mutators: none. No `az containerapp` command is required or
  implied.
- Approved image digest: not applicable — no runtime update requested.
- ACA runtime invariant: unchanged; this release asserts nothing about it.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none; this release declares no flag.
- Live signed-in proof required: **no** — no client-visible surface changed.
  This record does not claim `live-proven`.

## Rollback Plan

Revert the squash commit. The change is additive and unreferenced, so a revert
removes the new exports and the suite and restores the previous file exactly;
there is no data, migration, flag, or deployed artifact to unwind, and no caller
that could break. If a revert happens after another change touches the same
file, re-run `npm run audit:test-ci-coverage:write` to bring the census back in
line with the reverted suite count.

## Audit Evidence

- PR URL and CI run: recorded on the pull request opened for this branch.
- Mutation results and command transcripts: the QA table above.
- Census delta: `docs/architecture/test-ci-coverage-census.json` in this diff.

## Known Gaps

1. **No call site.** The loader is a seam. Deciding where a configured source is
   read from — a file, a stored record, or the operator setup surface — and
   wiring the effective catalog through brief composition is the next slice, and
   it will need a flag because it changes what the product composes.
2. **The two catalogs still declare disjoint id sets.** A declaration resolves an
   entry in at most one of them and falls back to the generic path in the other.
   That is a product decision about which archetypes each catalog should declare,
   not a defect in resolution, and it is unchanged here.
3. **The duplicate-id refusal is not symmetric across the two halves.** The
   evidence-and-interview half still lets a configured source declare the same id
   twice, with the later entry winning silently. Fixing it belongs in that file,
   which currently has several open changes in flight; doing it here would have
   collided with them for no added safety in this half.
4. **Outcome reporting is likewise not symmetric.** The other half still reports a
   flat list of applied ids and so cannot distinguish an addition from a
   replacement. Same reason for leaving it.
5. **The seed is not recomposed** onto the new schema's shared shapes. The
   built-in entries are validated against the contract but still spell out every
   field, which is deliberate: recomposition carries regression risk and buys
   nothing until a configured source can reference shared pieces.
