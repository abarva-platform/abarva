# 2026-10-06-moves-pack-evidence-family-vocabulary — An archetype may only ask for evidence something declares

## Release ID

`2026-10-06-moves-pack-evidence-family-vocabulary`

## Status

`candidate`

## Plain-English Summary

An archetype pack is the use-case-specific intelligence behind a Move's
deliverables: the exhibits it expects, the tables it fills, and the evidence
families it needs. The evidence families were written as a plain list of short
identifiers, and the contract behind that list accepted any non-empty string.

Those identifiers are not labels. They decide which sections of a deliverable
are grounded against declared evidence, and they become the text of the
retrieval query that goes looking for it. So a misspelled identifier did not
fail — it asked the corpus for evidence under a name no evidence carries, and
the answer came back looking like an answer. Spelling identifiers into words for
retrieval (shipped separately) makes that worse rather than better: a typo now
pulls prose that is merely irrelevant instead of matching nothing at all.

This release declares the vocabulary. Every evidence family the shipped packs
name is now written down once, with a human label and the deliverable surfaces
it grounds — information the pack catalog never held, since a pack names its
families as bare identifiers and nothing said what one is. A pack may name a
family only if that vocabulary holds it, or if the pack itself declares the
family as one it introduces. A firm configuring an archetype of its own can
still bring new evidence families; it just has to say so, and saying so is the
whole difference between a new family and a misspelling. When a rejected
identifier is within three edits of a real one, the refusal names the one it
probably meant.

The release also measures something the product has been carrying as a sentence
in gap lists for several releases. A Move resolves **two** catalogs off the one
archetype it declares, and each keeps its own evidence-family identifiers: 34 on
the pack side, 43 on the discovery side, and — measured, not assumed — **nothing
in common**. The same underlying evidence can therefore be requested twice under
two unrelated names with neither half able to tell. Which families the two
halves should share is a product decision, so this release does not invent a
mapping; it pins the disjointness as a number so the decision is taken against
one.

No shipped behaviour changes. The vocabulary is derived from the shipped packs,
so every built-in pack and every override that keeps a built-in pack's families
validates exactly as before.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves):** the contract a configured archetype pack must
  satisfy gains one rule, and the pack catalog gains a declared evidence-family
  vocabulary beside it. No product surface, route, or rendered output changes.
- **Layer 3 (Canonical model):** untouched. No schema, migration, loader, or
  tenant data is involved; no number anywhere is recomputed.

## Client Applicability

- All clients: no behavioural change. The rule only bites on a configured
  archetype source, which no client has.
- Specific clients: none.
- Internal only: the vocabulary and the disjointness report are developer- and
  operator-facing.
- Public/demo only: none.
- Feature flag: none. The change is additive and behaviour-preserving for every
  shipped input, so it needs no flag seat.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/evidence-family-vocabulary.ts` (new)
  — `PACK_EVIDENCE_FAMILY_VOCABULARY` (34 families, each with a label and what
  it grounds), `isDeclaredPackEvidenceFamily`, `unknownPackEvidenceFamilies`,
  `nearestDeclaredPackEvidenceFamily`, `evidenceFamilyVocabularyOverlap`.
- `src/lib/deliverables/orchestrator/briefs/archetype-packs.ts` — optional
  `declaresEvidenceFamilies` on `ArchetypePack` and its schema (lower_snake
  enforced there, where an identifier is vouched for by nothing else), a
  `superRefine` that refuses a named family nothing declares, and the exported
  `UNKNOWN_EVIDENCE_FAMILY_MESSAGE`.
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-config.test.ts` —
  17 cases added to the already-registered suite; the existing configured-pack
  fixture now declares the two families it brings, which is the refusal biting
  on the one input in the repo that needed the escape hatch.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new test directory, no catalog registration, no generated manual change.

## QA / Validation

Lane: `global-control-lane`. Run in an isolated worktree off `origin/main`
at `3731a69714`.

- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__/archetype-pack-config.test.ts`
  — 33 tests (16 existing, 17 added).
- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__` — 51 suites /
  666 tests. The whole directory, because the pack schema sits in a module many
  suites compose through.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` on all three changed files plus the new module — exit 0.
- **PASS** `npm run audit:lib-orphans` — "No change against the baseline"; the
  new module is reached by product code, not only by its own test.
- **PASS** mutation testing, 9 of 9 killed (whole directory per mutation):
  remove the refusal entirely [5 failures]; ignore the declared-families escape
  hatch [8]; resolve a family with `in` instead of an own-property check, so
  `constructor` reads as declared [2]; drop lower_snake from the declared list
  [1]; let the unknown list repeat an identifier [1]; widen the near-miss
  threshold from 3 edits to 99 [1]; suppress the near-miss suggestion [2];
  compute the shared identifiers off the wrong side of the set difference [2];
  add a vocabulary entry no pack names [1].
- **PASS** pre-fix control: the first mutation above _is_ the pre-fix state
  (`z.string().min(1)` with no vocabulary behind it) and fails 5 cases.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** live signed-in walk. Nothing renders, and no route or rendered
  output changes, so a walk would observe nothing about this release.

One mutation was retired rather than reported as a survivor: removing the
trailing `bestDistance <= MAX_EDITS` check killed nothing, because the ceiling
handed to the distance function already abandons any candidate that far away —
the check was unreachable. It was deleted and `MAX_EDITS` mutated instead, which
is the real gate.

Census note: `testFiles` 2720 → 2722 and `coveredTestFiles` 2556 → 2558. This
change adds **no** test file; the delta is other merges' drift, since the
committed census's drift guard runs on branches only.

## Rollout Plan

Merge to `main` by squash. No runtime rollout: no route, flag, environment
variable, image, worker job, or migration is involved, and no behaviour changes
for any shipped input.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge
  to `main`, unchanged by this release.
- Shared runtime mutators: none. No Azure command is run by or for this release.
- Approved image digest: not applicable — no runtime image change is requested.
- ACA runtime invariant: unchanged; this release asserts nothing about the live
  runtime.
- Worker image invariant: unchanged; no worker job is involved.
- Feature/env flag update path: not applicable — no flag is declared or changed.
- Live signed-in proof required: no. Nothing client-visible changes.

## Rollback Plan

Revert the squash commit. The change is three files plus a regenerated census,
with no migration, no stored state, and no generated artifact beyond the census,
so the revert is complete on its own. If only the refusal needs to be stood
down while the vocabulary is kept, deleting the `superRefine` block restores the
previous `z.string().min(1)` contract without touching anything else.

## Audit Evidence

- PR on `abarva-platform/abarva` from branch
  `moves/family-id-vocabulary-20261006`.
- CI run on that PR, including `npm run release:check`.
- The mutation table above, reproducible by reverting each named line.
- `evidenceFamilyVocabularyOverlap()` output, pinned by two cases in the suite.

## Known Gaps

- **The two halves are still disjoint.** This release measures it (34 pack
  identifiers, 43 discovery identifiers, 0 shared) and refuses to invent a
  mapping, because which families the halves should share is a product decision
  about what a Move asks a client for. The case that pins `shared` as empty is a
  deliberate tripwire: when that decision is taken, it should fail and be
  updated to the new number.
- **Only the pack half is governed.** The discovery blueprint half declares its
  families as full objects with identifiers of their own, and nothing validates
  those against a vocabulary either. The same rule belongs there, but that file
  is the shared edit surface of several open changes this cycle, so the slice was
  taken where it lands without a conflict.
- **No surface renders the labels.** `label` and `grounds` are declared for the
  setup UI that will let a firm pick families from a list, and for the retrieval
  query speller; nothing reads them yet. The identifier set is what this release
  enforces.
- **The near-miss suggestion is edit distance only.** It will not spot a family
  named correctly in a different idiom (a synonym rather than a misspelling);
  that needs the cross-half dictionary above.
- **Concatenated exhibits are still not de-duplicated by key.** A configured
  pack can collide with a deliverable structure's own expected exhibits, which
  inflates the denominator the shortfall figure is printed from. It stays open
  until the pack-config consumer is on `main`.
