# 2026-10-06-moves-phase-deliverable-archetype-reach — Pin whether a declared archetype reaches what a Move produces

## Release ID

`2026-10-06-moves-phase-deliverable-archetype-reach`

## Status

`candidate`

## Plain-English Summary

A Move's documents are assembled from two halves: a declared **structure** (the section
flow for that kind of document) and the declared **archetype pack** (the exhibits, tables
and evidence families for that kind of work). The code that joins them returns nothing when
a document type has no declared structure, and the generator then falls back to a generic
document that never resolves an archetype at all.

That fall-through is silent, and it is expensive. A Move can declare an archetype, collect
every evidence family that archetype requires, have them approved, and still produce a
document that grounds none of them, carries none of the archetype's exhibits, and receives a
single generic risk register in place of the archetype's tables. Nothing fails: capture
completes, the build succeeds, the gate can clear. The document simply cannot see the
evidence the Move was run to gather.

Nothing in the test suite noticed. This change adds the guard. It does not change any
runtime behaviour — it measures the join, pins it, and records the present cost so the
number can only improve.

Measured on the governed-data-foundation archetype, across the twenty documents the phase
registry builds: **nine have no declared structure**, so they receive none of the
archetype's five exhibits, one of its nine tables (the generic risk register) and none of
its eleven evidence families. All three of the final phase's documents are among the nine,
which makes a Move's hand-off the weakest-grounded thing it produces. Eight documents
receive the pack whole; three are archetype-asset-free by design and are excluded for a
stated reason.

## Layer Impact

Release lane: `global-control-lane` — the guard runs for every client in CI, gated by no
flag and scoped to no tenant. It adds no behaviour, so no client receives a change.

- **Layer 4 (Products — Moves):** test-only. Pins the structure x archetype-pack join that
  decides whether a declared archetype reaches a Move's generated documents. No product
  code changed, so no runtime behaviour changes.
- **Layer 3 (Canonical model):** unchanged. No schema, no migration, no read model.

## Client Applicability

- All clients: no behaviour change. This adds a CI guard only.
- Specific clients: none.
- Internal only: the guard itself (CI).
- Public/demo only: none.
- Feature flag: none. Test-only change, nothing to gate.

## Changes Included

- `src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts` (new, 38
  cases). Placed under `src/lib/reasoning` because that directory is swept whole by the
  required `Typecheck + reasoning-layer tests` check, so the guard can actually fail a
  merge. Registration is evidenced by the census delta below rather than asserted.
- `docs/architecture/test-ci-coverage-census.json` regenerated for the new suite.

What the guard asserts, in both directions:

1. Every phase document that has a structure and takes archetype assets receives the pack
   whole — all five exhibits, all nine tables, and at least one section grounding its
   evidence families. This is what regresses if a structure loses its declared landing
   sites or the join is rewired.
2. The set of phase documents with **no** structure is pinned as a literal and checked both
   ways, so it can only shrink: authoring a structure for one of the nine fails the guard
   until the key is removed from the list, and adding a new phase document without a
   structure fails it too.
3. The cost is pinned explicitly — a structureless document carries none of the archetype's
   exhibits — so the fall-through is a recorded consequence rather than an assumption.

Expected exhibit, table and evidence-family keys are written out as literals, with one case
reconciling those literals against the pack. An earlier draft read them off the pack
directly; two mutations proved that self-fulfilling (dropping an exhibit from the pack
dropped it from the expectation too and the suite stayed green), which is why the literals
are there.

## QA / Validation

- **PASS** `npx jest src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts`
  — 38 passed, 38 total.
- **PASS** `npx jest src/lib/reasoning` (the required check's own scope) — 61 suites, 824
  tests, all passed.
- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__` — 55 suites, 814 tests,
  all passed.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  exit 0.
- **PASS** `npx eslint` on the new file — exit 0.
- **PASS** mutation testing — 9 mutations attempted, 9 killed: drop a pack exhibit; drop a
  pack table; drop a pack evidence family; withhold the pack's exhibits from the join;
  withhold the pack's tables from the join; drop a structure's declared landing sites;
  repoint an existing structure at a structureless document type (kills both directions of
  the pinned list); add a document to a phase's build set; withhold archetype assets from a
  document that should receive them. The first two of these initially SURVIVED and are the
  reason the expectations are literals; they were re-run and killed after the correction.
- **PASS** suite registration proved by census delta, not by assertion: `testFiles`
  2738 -> 2739, `coveredTestFiles` 2574 -> 2575, `pullRequestCoveredTestFiles` 2573 -> 2574,
  `uncoveredTestFiles` unchanged at 164. An unswept suite would have moved the uncovered
  count.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — no diff (test-only change adds no
  tenant-scoped surface).
- **NOT RUN** live signed-in walk. Not applicable: this change adds no product surface and
  alters no runtime path.

## Rollout Plan

Merge to main. No runtime rollout: no product code, no migration, no flag, no image
behaviour change. The guard becomes active on the next CI run of the required
`Typecheck + reasoning-layer tests` check.

## Deployment Authority

- Repo-owned deploy workflow: not engaged; this change does not require a deploy to take
  effect.
- Shared runtime mutators: none. No `az containerapp` command, no traffic shift, no
  revision change.
- Approved image digest: not applicable — no runtime image change is requested or implied.
- ACA runtime invariant: unaffected; no template, traffic or worker image is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: none. No flag is added, read or changed.
- Live signed-in proof required: no. Test-only change with no client-visible surface.

## Rollback Plan

Revert the single commit. The change is additive and test-only, so reverting removes the
guard and restores the prior CI surface exactly; there is no data, schema or runtime state
to unwind and no migration to reverse.

## Audit Evidence

- The PR for this record, and its `Typecheck + reasoning-layer tests` run.
- The suite itself is the evidence of the measurement: the pinned structureless list and the
  per-document cases state the measured position at this commit.
- Census delta recorded under QA / Validation above.
- Mutation results recorded under QA / Validation above.

## Known Gaps

- **The nine structureless documents are not fixed here, only pinned.** Authoring a section
  structure for each is content work with a real regression risk: a structure's required
  sections are enforced by the quality gate, so a structure whose sections the available
  evidence cannot support could turn a document that generates today into one that is held
  below the quality bar. That trade belongs to a product decision and a live walk, not to a
  guard, and it is deliberately out of scope for this change. The three final-phase
  documents are the highest-value candidates, and two of them are gate artifacts.
- The guard measures one archetype — the one whose pack and discovery blueprint name the
  same evidence family ids, which is what makes "the pack reached the brief" and "approved
  evidence reached the section" the same claim. Other archetypes share the same join and the
  same structure set, so the structureless finding is archetype-independent, but their packs
  are not separately pinned.
- Three documents are excluded as archetype-asset-free by design (two withheld inside the
  join itself, one with a dedicated builder that grounds from the discovery blueprint
  instead). The exclusion is pinned with its reason but the dedicated builder's own
  grounding is not re-proved here.
