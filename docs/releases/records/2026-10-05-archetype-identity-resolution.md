# 2026-10-05-archetype-identity-resolution — One identity rule for both archetype catalogs

## Release ID

`2026-10-05-archetype-identity-resolution`

## Status

`candidate`

## Plain-English Summary

A Move declares an archetype, and that one declared value is read by two
separate catalogs inside the deliverable engine: the catalog that decides what
evidence to gather and who to interview, and the catalog that decides which
exhibits, tables and governance note a deliverable gets. The two catalogs are
written in different naming conventions — one uses lowercase ids with
underscores, the other uppercase — and until now they also matched a declaration
differently. One normalised the declared value before looking it up; the other
looked it up raw and case-sensitively.

The consequence was silent and one-sided. A declaration spelled the way one
catalog is keyed resolved nothing in the other, so a Move kept its
archetype-specific evidence plan and quietly fell back to a generic set of
exhibits, tables and governance language — or the reverse. Nothing failed, and
nothing said so; the deliverable simply stopped being specific to the use case
it was declared as. Concretely, `cloud_modernization`, `cloud-modernization` and
`Cloud Modernization` all resolved the correct blueprint and resolved **no**
artifact pack; only the exact `CLOUD_MODERNIZATION` spelling resolved the pack.

The same raw lookup had a second, sharper failure. Because both catalogs are
plain objects, looking one up with an unchecked declared value also answered
properties every object inherits. A Move declaring the archetype `constructor`
resolved to a built-in function rather than to nothing — a truthy non-entry, so
the engine treated the declaration as satisfied and then read catalog fields off
it. In the deliverable path that threw while composing the brief.

Both catalogs now resolve a declaration through one shared rule that compares
the declared value and every catalog id in normalised form, and that only ever
considers ids the catalog actually declares. Declared identity is still
authoritative and still never inferred: an unrecognised declaration resolves to
nothing and each caller keeps its existing fallback.

## Layer Impact

Release lane: `global-control-lane` — shared deliverable-engine behaviour for all
clients, not feature-gated.

- **Layer 3 (canonical model) — identity resolution only.** How a declared
  archetype token is matched to a catalog entry. No canonical object, schema,
  id, metric or fact value changes, and no data is written or migrated.
- **Layer 4 (products) — Moves deliverable generation.** A Move whose declared
  archetype previously missed one of the two catalogs now reaches both, so its
  deliverable brief carries the archetype's evidence families, exhibits, tables
  and governance note as intended. Deliverables that already resolved both
  catalogs are byte-for-byte unchanged.

No intake tab, source adapter, loader, tenant dataset, migration or data-plane
build is touched.

## Client Applicability

- All clients: yes — this is `global-control-lane` behaviour in the shared
  deliverable engine, not gated.
- Specific clients: none singled out. No tenant key, tenant dataset or
  tenant-scoped config is read or changed by this release.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is strictly additive at the resolution
  boundary — every declaration that resolved before resolves to the same entry,
  and declarations that previously resolved to nothing (or to an inherited
  object property) now resolve correctly or resolve to nothing. A flag was
  considered and rejected: an OFF flag would mean deliberately keeping the
  crash-shaped lookup live.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-identity.ts` — new. Owns
  `normalizeArchetypeId` (moved here from the blueprint catalog, not copied) and
  `resolveArchetypeCatalogEntry`, the single declared-identity rule.
- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` —
  `resolveDeclaredDiscoveryBlueprint` now resolves through the shared rule; its
  private normaliser is gone (one normaliser, so the two catalogs cannot drift).
- `src/lib/deliverables/orchestrator/briefs/archetype-packs.ts` —
  `getArchetypePack` now resolves through the shared rule instead of indexing
  the catalog raw.
- `src/lib/deliverables/orchestrator/__tests__/archetype-identity.test.ts` —
  new suite, 28 cases, in a CI-wired directory
  (`.github/workflows/unit-suites.yml`).
- `docs/architecture/test-ci-coverage-census.json`,
  `docs/security/tenancy-fence-coverage.json` — regenerated.

No route, no flag registry entry, no migration, no script, no component.

## QA / Validation

Lane: `global-control-lane`. All commands run locally on this branch off
`origin/main` at `05896d1a2f`.

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/archetype-identity.test.ts`
  → 28 passed. The new suite.
- **PASS** — `npx jest src/lib/deliverables` → 118 suites, 1368 tests passed.
  The whole tree that consumes both catalogs, not only the suites I expected to
  be related.
- **PASS** — `npx jest src/lib/programs src/app/api/v1/programs` → 307 suites,
  4050 tests passed. The other consumers of both catalogs, including the
  generate route that supplies the declared value.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` → exit 0.
- **PASS** — `npx eslint` over the four changed/added source files → exit 0.
- **PASS** — `npm run audit:lib-orphans` → "No change against the baseline".
  The new module is reached by two product-reachable modules, so it is not an
  orphan reachable only from its own test.
- **PASS** — `npm run audit:test-ci-coverage:write` → `testFiles` and
  `coveredTestFiles` both rise by 3 (this suite plus two that landed on `main`
  ahead of this branch) with the uncovered set unchanged, which is what proves
  the new suite is actually run by a CI job rather than sitting in a dark
  directory.
- **PASS** — `npm run audit:tenancy-fence-coverage:write` → regenerated, no
  fence change (no tenant-scoped read is added).
- **PASS** — mutation proof, eight single-site mutations applied one at a time
  with the replacement count asserted to be exactly 1, each run as its own
  explicit jest invocation, and the baseline re-confirmed at 28 passing
  afterwards. All eight were killed: matching on the raw id instead of its
  normalised form (3 failed), indexing the catalog directly instead of walking
  its declared ids (6), dropping the normalises-to-nothing guard (1), dropping
  the nothing-declared guard (1), reverting the pack lookup to a raw index (9),
  dropping the lowercase step of normalisation (5), dropping the
  separator-collapse step (6), and matching the declared id before normalising
  (3).
- **NOT RUN** — signed-in browser walk. This release makes no claim to be
  live-proven; see Rollout Plan and Known Gaps.
- **NOT RUN** — `npm run test:e2e`, `npm run test:integration`. No route,
  component or data-plane surface changed, and the integration suites that hit
  the data plane need credentials this lane does not hold.

Three mutations survived an earlier revision of the resolver and each was
diagnosed rather than reported as a test gap: all three were redundancy in my
own code — two matching rules that the normalised comparison already subsumed,
and a trimmed-empty check the normalises-to-nothing guard already covered. The
resolver was simplified to one rule and the survivors stopped existing. The
eight mutations above are against the simplified version.

## Rollout Plan

Merge to `main` via squash. No runtime rollout step of its own: the change is
library code with no flag, no migration and no env var, so it becomes active on
the next shared Product/Lab web image that the repo-owned ACA main deploy
workflow builds and deploys. This release does not deploy, does not shift
traffic and does not update any Container App.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This
  release adds no deploy step and changes no workflow.
- Shared runtime mutators: none. No `az containerapp` command, no traffic
  weight change, no revision change, no registry push from this branch.
- Approved image digest: not applicable — no runtime update is performed here.
  The change ships with whichever `main-<sha>` image the main deploy workflow
  builds after merge.
- ACA runtime invariant: not asserted by this release and not claimed. Whoever
  next deploys `main` proves template image, 100%-traffic revision image and
  worker job images match the approved digest.
- Worker image invariant: unaffected. No worker job code or image changes.
- Feature/env flag update path: none required. No flag is added, enabled or
  read, so `npm run docs:nexus-manual` is not triggered.
- Live signed-in proof required: not for merge. Required before anyone calls the
  corrected resolution live-proven on `app.abarva.ai`.

## Rollback Plan

Revert the squash commit on `main` and merge the revert; there is nothing else
to undo. No migration, no data write, no flag state, no generated dataset and no
stored artifact is produced, so revert is complete and immediate. If a revert
lands after a deploy, the next repo-owned main deploy carries the reverted code,
or roll the shared web Container App back to the previously approved
digest-pinned revision via the operator runbook. Reverting restores the raw
lookups, including the inherited-property path, so prefer a forward fix.

## Audit Evidence

- PR: opened against `main` in `abarva-platform/abarva`; CI run attached to the
  PR head commit.
- The new suite is the executable evidence: it pins each spelling of every
  declared id in both catalogs, pins that inherited object properties resolve to
  nothing in both, pins that a brief still composes when the declared value is
  an inherited property name, and pins that neither catalog declares two ids
  that normalise alike (which is what makes the single rule unambiguous).
- Census and fence artifacts regenerated in the same commit, so the committed
  counts match a clean run.
- Mutation results are recorded in QA / Validation above rather than as a
  committed artifact; they are reproducible by re-applying the eight listed
  single-site edits.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed, so this release records
  `merged`/`deployed` at most. Nobody may call the corrected resolution
  live-proven until a signed-in walk on a deployed, digest-verified build shows
  a Move whose declared archetype previously missed one catalog now carrying
  that archetype's exhibits and evidence families.
- **The two catalogs still declare disjoint id sets.** This release makes a
  declaration resolve consistently; it does not make the vocabularies overlap.
  Today no single declared id exists in both catalogs, so a Move still gets
  archetype-specific output from at most one of them and the generic fallback
  from the other. That is the substantive gap and it is a product decision about
  which archetypes each catalog should declare, not a resolution bug. It is not
  addressed here and should be taken up with the setup-UI work that lets
  archetypes be configured without code.
- **The fallback value `strategic_move`** supplied by the generate route when a
  Move declares nothing names an entry in neither catalog. That is unchanged and
  intentional for now: it resolves to nothing and each caller's own fallback
  applies. Whether an undeclared Move should instead resolve an explicit
  general-case entry in both catalogs is open.
- **The config overlay that landed on `main` while this branch was open can
  claim to apply a blueprint it did not.** Its id schema permits
  `[a-z0-9_]+`, which admits `__proto__`; assigning that key on a plain object
  sets the prototype instead of adding an own id, so the entry never joins the
  catalog while the loader's `applied` list still names it. Verified
  independently of this change. Resolution here is already immune — it walks the
  catalog's own declared ids, so such an entry can never be returned, whereas a
  raw index would have returned it. The over-claim in `applied` is on the write
  side, in code that landed minutes before this merge, and is deliberately left
  for its own narrow fix rather than widened into this release.
- **Nothing surfaces which catalog answered.** A deployer still cannot see, in
  the product, that a declaration reached one catalog and not the other. Making
  that visible belongs with the blueprint-resolution-basis work already in
  flight.
