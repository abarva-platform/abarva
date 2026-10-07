# 2026-10-06-moves-value-measurement-contract-structure — The P5 value measurement contract gets a declared structure

## Release ID

`2026-10-06-moves-value-measurement-contract-structure`

## Status

`candidate`

## Plain-English Summary

A Move's phase documents are each built from two halves: a declared SECTION
STRUCTURE for that document type, joined with the USE-CASE PACK for the
archetype the Move declared. The pack is what carries the use case's exhibits,
its tables, and the evidence families the Move collected during Discover.

When a document type has no declared structure, that join does not happen. The
brief builder returns nothing and a generic board-grade brief is used instead,
which resolves no pack at all — no exhibits, no tables, and no section asking
for the use case's evidence. Generation still succeeds and the gate can still
clear, so the loss is silent.

Measured across the twenty canonical phase documents, resolved the way the two
production callers resolve them, four had no structure. Three of those four are
working-session guides. The fourth was the Value Measurement Contract — the P5
document that commits named individuals to the outcomes the Move promises and
to how each one will be measured. It is a gate artifact: a P5 hard-gate
criterion reads its sign-off, and it has its own quality profile requiring six
sections and recorded evidence gaps. It was the only non-guide client-facing
phase document generating with none of the declared use case's evidence
reaching it. A Move could gather a measurement owner's review cadence and a
finance baseline through Discover, have both approved, and then commit to
outcomes in a document that could cite neither.

This release gives that document a structure: seven sections mirroring the
spine the deliverable registry already declares for it, three tables the
document type is built around, explicit evidence landing sites, and a phase
discipline list so it does not turn into a second investment case. It
deliberately does not reuse the neighbouring value-model structure, because a
plan that proposes how value will be measured and a contract that commits
people to it are different instruments.

## Layer Impact

Release lane: `global-control-lane`. The change is shared document-composition
behaviour for all clients, with no feature gate and no client-scoped data.

- **Layer 4 (Products — Moves):** one P5 document type now generates from a
  declared structure joined with the declared archetype's pack, instead of from
  the generic board brief. Its sections, tables, required placeholders and
  evidence grounding all change. No other document type's output changes.
- **Layer 3 (Canonical model):** unchanged. No schema, no migration, no read
  model, no stored value. The declared archetype and the approved evidence this
  document can now cite were already canonical; only what the document asks for
  changed.
- **Layers 1-2 (Intake, adapters):** unchanged.

## Client Applicability

- All clients: yes, for the P5 Value Measurement Contract only. Any Move that
  generates this document gets the structured version.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This is a brief-composition default, not a gated surface.
  A Move that declares no archetype resolves no pack and composes the structure
  alone, which is still a better-formed document than the generic brief and
  asserts nothing it cannot cite.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/structure-value-measurement-contract.ts`
  — NEW. The structure itself, in its own module so the shared structures
  catalog takes a two-line change.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — one
  import, one catalog array entry.
- `src/lib/reasoning/__tests__/moves-value-measurement-contract-structure.test.ts`
  — NEW. 13 cases on the structure's own load-bearing properties.
- `src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts`
  — the structureless literal shrinks by this key, and two new cases measure
  the same question through the mapping production applies rather than through
  the registry key, because measuring only the registry key reported five
  documents as ungrounded that are in fact grounded.
- `src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts`,
  `.../archetype-pack-governed-data-foundation.test.ts` — sibling guards that
  pin counts this structure changes, updated with their arithmetic restated.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration. No route. No script. No flag. No env var.

## QA / Validation

- **PASS** `npx jest src/lib/reasoning src/lib/deliverables` — 191 suites,
  2490 tests, 3 snapshots.
- **PASS** `npx jest src/lib/source/deliverables src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts`
  — 2 suites, 16 tests. The two consumers of the structures catalog outside the
  directories above.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over all six changed source and test files — exit 0.
- **PASS** Mutation pass, 8 mutations, 8 killed: dropping the declared evidence
  landing sites (5 cases fail); dropping one of them (3); giving a structure
  table a key the pack already uses (1); adding a phase-discipline topic that
  matches one of the document's own section titles (1); asserting the revision
  route instead of asking for it (1); dropping a required section below the
  quality profile's floor (1); relaxing the fixed-structure flag (1); and
  removing the catalog entry, which is also the baseline check and fails 17.
- **PASS** Baseline check. With the catalog entry removed and both suites kept,
  17 cases fail — the suites genuinely depend on the change rather than
  passing either way.
- **PASS** `npm run audit:test-ci-coverage:write` — regenerated, drift clean.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — no change produced.
- **NOT RUN** Live signed-in walk. This is a brief-composition change with no
  rendered surface of its own; proving the document's new shape end to end
  needs a Move that has reached P5 with approved evidence, which is a data and
  human-approval step outside this lane.

### The measurement, before and after

Asked for each of the twenty canonical phase documents under a declared
archetype, resolved through the mapping production applies:

| | before | after |
|---|---|---|
| receive the pack's exhibits and all its evidence families | 16 | 17 |
| no declared structure, so receive neither | 4 | 3 |
| of those, working-session guides | 3 | 3 |
| of those, gate artifacts | 1 | 0 |

## Rollout Plan

Merge to main. No runtime rollout, no image build, no flag, no migration. The
structure is resolved in-process at brief composition time, so it takes effect
for documents generated by any build that contains the merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  and not invoked by this release.
- Shared runtime mutators: none. This release changes no Container App
  template, image, traffic weight, scale, secret, env var, or flag.
- Approved image digest: not applicable — no deploy is part of this release.
- ACA runtime invariant: unaffected. Nothing here can shift traffic or create a
  revision.
- Worker image invariant: unaffected. No worker job changes.
- Feature/env flag update path: not applicable. No flag is added or read.
- Live signed-in proof required: not for this release to be correct, since it
  changes no route and no screen. It IS required before anyone claims the P5
  document is live-proven for a client; see Known Gaps.

## Rollback Plan

Revert the PR. The whole change is one new module, two lines in the structures
catalog, test files, and a regenerated census — nothing persisted, nothing
migrated, nothing deployed. Reverting restores the generic brief for this
document type immediately, with no data to unwind. Documents already generated
from the structured brief are unaffected by the revert; they are stored
records, not re-derived.

## Audit Evidence

- The pull request and its CI run.
- `src/lib/reasoning/__tests__/moves-value-measurement-contract-structure.test.ts`
  — the structure's properties, each case naming the failure it prevents.
- `src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts`
  — the before/after counts in the table above are the subject of its two new
  cases, so the claim is checked rather than asserted here.
- The mutation and baseline results listed under QA.

## Known Gaps

- **Three working-session guides still have no declared structure**
  (`planning_workshop_guide`, `mobilization_workshop_guide`,
  `execution_kickoff_guide`). Deliberately out of scope. One guide type already
  has a structure and grounds evidence while being withheld the pack's exhibits
  and tables by name, so the pattern for authoring these exists; whether the
  other three should follow it is a product judgment about what a facilitation
  guide may assert, not a defect to fix silently. The reach suite now pins this
  set in both directions, so it can only shrink.
- **The registry spine is mirrored, not derived.** The structure's seven
  sections mirror the five the deliverable registry declares for this document
  plus two additions. A test fails if the registry's count changes, so a
  divergence is visible — but nothing makes the two the same object, and a
  registry section reworded without renumbering would not be caught.
- **The committed-outcome register's columns are not reconciled with the
  pack's own baseline table.** Both now reach this document. They ask for
  different things (the document type's commitment register versus the use
  case's baseline conditions) and neither is wrong, but no case checks that a
  generated document does not state the same baseline twice in two shapes.
- **The census hunk carries one file that is not from this change.**
  Regenerating the coverage census on an unmodified base already moves the test
  file count by one, so the committed census on the base branch was stale by
  one file before this branch existed. This branch's own contribution is the
  second of the two. The census stores counts and no file list, so the stale
  entry cannot be named from the artifact itself; it is recorded here rather
  than presented as this change's.
- **No live proof.** Flagged for the human-in-the-loop lane: a signed-in walk
  of a Move at P5 with approved evidence is what would show the new sections
  and tables in a real generated document, and that needs a Move advanced by
  the data lane and approved by an authorized user.
