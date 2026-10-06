# 2026-10-05-move-guidance-basis — A Move's evidence guidance declares where its wording came from

## Release ID

`2026-10-05-move-guidance-basis`

## Status

`candidate`

## Plain-English Summary

When a Move asks a client for evidence, each request carries written guidance: an
example template, what the example should contain, why it matters, and the next
action. That wording is picked from a chain of tables. Most links in the chain
are keyed by the **archetype the Move declared**. One link is not: it keyword-matches
the Move's **title** and serves a specialised wording when the title happens to
contain certain words.

Until now the packet carried the wording and nothing else, so a reading selected
by sniffing a Move's title was indistinguishable from one selected by the Move's
declaration. The product's first rule is that identity is declared, never
inferred, and this was an inference presented as if it were a declaration.

Two changes, both additive:

1. Every evidence-need packet now carries `guidanceBasis`, saying which link
   answered: the declared archetype's own table, the cross-archetype table, a
   title-matched table, the generic table, no table at all, or — for the two
   packets whose wording is written for that packet rather than for an evidence
   family — `packet_specific`.
2. The per-archetype guidance coverage report gains `nameSpecialised`: the
   families where the declared path reads only the generic wording while a
   title-matched table holds its own. That is authored guidance no declaration
   can reach. It reports **5** such pairs across the shipped catalog today.

Along the way, the one guidance chain became one function. The coverage report
had its own hand-written copy of the chain, minus the title-matched links, so the
two could drift apart and publish a different reading from the one a Move
receives. The report is now computed through the same resolver, with an empty
Move name so that it reads the declared path only.

No wording changed. No surface renders the new field yet. Which archetype should
declare the title-matched tables is an open product question, recorded below
rather than guessed at here.

## Layer Impact

- **Layer 4 — Products (Moves)**, lane `global-control-lane`. The evidence-need
  packet gains one field and the guidance coverage report gains one field. The
  resolution order of the guidance chain is unchanged, so every existing packet
  receives byte-for-byte the same wording it received before.
- **Layer 3 — Canonical model**: untouched. No schema, migration, loader,
  adapter, seed, or tenant input changed. The archetype catalog is read, never
  written.

## Client Applicability

- All clients: yes, but with no observable change — one additional field on an
  internal data structure that no surface reads yet.
- Specific clients: none.
- Internal only: the `nameSpecialised` report is an internal backlog read.
- Public/demo only: no.
- Feature flag: none. The change is additive and behaviour-preserving, so it
  needs no flag seat; existing wording and ordering are pinned by test.

## Changes Included

- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts` —
  `MoveGuidanceBasis`; `MoveEvidenceNeedPacket.guidanceBasis`;
  `MOVE_NAME_GUIDANCE_TABLES` (the three title-matched tables declared once, in
  precedence order, replacing three hand-written conditional branches);
  `resolveFamilyGuidance` (replaces the private `familyGuidance`);
  `ArchetypeGuidanceCoverage.nameSpecialised`, computed through the resolver.
- `src/lib/programs/phase-progress-readiness.ts`,
  `src/lib/programs/stage-readiness-workbooks/gate-readiness.ts` — the two
  packets built outside the guidance chain declare `packet_specific`.
- `src/lib/programs/evidence-readiness/__tests__/need-packet-archetype-guidance.test.ts`
  — 17 cases appended to the already-CI-wired suite.
- Four test fixtures that build a full packet literal gained the required field.
- `docs/architecture/test-ci-coverage-census.json` — regenerated; see QA.

## QA / Validation

Lane: `global-control-lane`. All commands run locally in an isolated worktree off
`origin/main`.

- **PASS** `npx jest src/lib/programs/evidence-readiness/__tests__/need-packet-archetype-guidance.test.ts`
  — 32 tests (15 pre-existing, 17 added).
- **PASS** `npx jest src/lib/programs/evidence-readiness src/lib/programs/stage-readiness-workbooks src/lib/programs/phase-templates src/lib/programs/__tests__/phase-progress-readiness.test.ts`
  — 21 suites, 169 tests.
- **PASS** `npx jest src/components/strategic-moves src/app/api/v1/deliverables/generate-phase src/app/api/v1/programs`
  — 70 suites, 801 tests. Run because the packet type reaches a client panel, a
  workbook export, and four API routes.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit code 0. The new packet field is required, so the typecheck is what found
  every full-literal construction site.
- **PASS** `npx eslint` on all eight changed files — exit code 0.
- **PASS** mutation testing, 7 of 7 killed (failing-test counts in brackets):
  drop the declared-table link [8]; drop the cross-archetype link [8]; swap the
  precedence of the first two title-matched tables [2]; loosen the
  `nameSpecialised` predicate to "anything but the declared table" [1]; report
  only the first title-matched table per family instead of all of them [2];
  hard-code the packet's basis [6]; give the coverage report a non-empty Move
  name so it stops reading the declared path [2].
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — 11 of 11
  gates.
- **NOT RUN** live signed-in walk. Nothing renders the new field, so there is no
  client-visible behaviour to walk. This record does not claim `live-proven`.

Census attribution: `npm run audit:test-ci-coverage:write` moved `testFiles`
2715 → 2721 and `coveredTestFiles` 2551 → 2557. This change adds **no** test
file — all six are other merges' drift, because the committed census's drift
guard runs on branches only. `npm run audit:tenancy-fence-coverage:write`
produced no change.

## Rollout Plan

Merge to `main` by squash merge with auto-merge armed. No image build, no Azure
Container Apps deploy, no migration, no flag registry change, and no environment
variable is required for this change to be correct: it is library-level and
behaviour-preserving. It reaches the running product with the next deploy made
for other reasons.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  invoked by this change.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: unchanged; this release pins no new digest.
- ACA runtime invariant: not asserted by this record. No runtime update is made,
  so the template image, the 100%-traffic revision image, and the worker job
  images are left exactly as the last deploy left them.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable — no flag is declared, so
  `src/lib/features/registry.ts` is untouched and `npm run docs:nexus-manual`
  is not owed.
- Live signed-in proof required: no. No client-visible surface changes.

## Rollback Plan

Revert the squash commit. There is no migration, no generated data build, no flag
state, and no deployed artifact to unwind, so the revert is complete on its own.

Partial rollback, if the new field turns out to be unwanted while the chain
de-duplication is worth keeping: make `guidanceBasis` optional and drop it from
the two `packet_specific` sites. `resolveFamilyGuidance` and the single-chain
coverage report stand on their own and need no revert.

## Audit Evidence

- The PR for this record, including its CI run.
- The mutation table under QA / Validation: each row names the edit and the
  number of tests that failed because of it.
- `archetypeGuidanceCoverage()` output is pinned by name in the suite, so the
  5 reported title-only pairs and the per-archetype authored/unauthored split are
  inspectable without running the product.

## Known Gaps

- **No surface renders `guidanceBasis`.** A client reading an evidence request
  still cannot tell a title-matched wording from a declared one; only the data
  structure can. Showing it, or suppressing title-matched wording outright, is
  the follow-on and is a product call, not a code call.
- **The title-matched tables still belong to no archetype.** Three such tables
  exist. One was given a declared home in a previous increment; the other two
  are reachable only by matching a Move's title, because the catalog declares no
  archetype they would belong to. Declaring those archetypes is a data-lane
  decision, out of scope here; `nameSpecialised` now states the cost of leaving
  it open.
- **The keyword lists remain duplicated across two modules.** The title-matching
  predicates are kept deliberately in sync with a second resolver's keyword sets
  rather than shared as code. This change did not consolidate them; it only
  collapsed the three branches inside this module into one declared list.
- **26 families across three catalog archetypes still have no authored
  guidance** and fall through to the neutral reading. That backlog is reported by
  `archetypeGuidanceCoverage().unauthored` and is unchanged by this release.
- **The two archetype catalogs' evidence-family vocabularies remain disjoint**
  with no dictionary relating them, and neither is validated against one. Named
  again here; still open.
