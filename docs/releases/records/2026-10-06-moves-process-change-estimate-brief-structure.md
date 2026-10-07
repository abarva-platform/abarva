# 2026-10-06-moves-process-change-estimate-brief-structure — The P3 process change estimate brief gets a declared structure

## Release ID

`2026-10-06-moves-process-change-estimate-brief-structure`

## Status

`candidate`

## Plain-English Summary

A Move's phase documents are each built from two halves: a declared SECTION
STRUCTURE for that document type, joined with the USE-CASE PACK for the
archetype the Move declared. The pack carries the use case's exhibits, its
tables, and the evidence families the Move collected during Discover.

When a document type has no declared structure that join does not happen. The
brief builder returns nothing, a generic board-grade brief is used instead, and
the generic brief resolves no pack at all. Generation still succeeds and the
gate can still clear, so the loss is silent.

This release fixes the case where that silence was most expensive. When a Move
confirms a BOUNDED process-change route at P3 — a limited workflow change with
no material role or accountability change — the P3 design gate does not read one
document, it reads two: the target state architecture AND a process change
estimate brief. Both must be signed off for the gate to clear. The architecture
had a declared structure. The estimate brief had none.

Measured for a Move declaring an archetype whose pack contributes eleven
evidence families, resolved the way the two production callers resolve it:

| | before | after |
| --- | --- | --- |
| sections served | 12, all generic | 7, all declared |
| sections grounding every one of the pack's evidence families | 0 | 5 |
| any one evidence family on any section | no | yes |
| the pack's exhibits and tables that reach the document | 1 of 14 | 14 of 14 |

The single asset that did reach it was not a success. The generic brief carries
a default risk register whose key happens to match a table key the pack also
uses, so an automated "were the use case's assets withheld" check reads false
for this document while nothing use-case-specific had in fact arrived. That
coincidence is worth recording because it is the kind of thing that makes a gap
look closed.

The generic fall-through was also actively WRONG here, not merely thin. Two of
the twelve sections it served contradict this document's own scope discipline as
the deliverable registry states it: an operating-model section, where the
registry's own generation hint explicitly forbids a role-by-role operating
model, and a phase-gates section, which puts internal phase labels into a client
document. A bounded-change instrument whose entire value is what it leaves OUT
is the worst possible case for an open-ended generic brief.

Two existing guards each miss this document, for two different structural
reasons — which is why it survived. The evidence-landing report iterates the
structures catalog, so a type with no structure cannot appear in its output at
all. The phase reach suite iterates the canonical per-phase key list, and this
key is not in it: only the route-aware key function returns it. So this release
also adds the sweep that would have caught it, over every route and every
change-impact combination rather than over the canonical list.

## Layer Impact

Release lane: `global-control-lane`. Shared document-composition behaviour for
all clients, with no feature gate and no client-scoped data.

- **Layer 4 (Products — Moves):** one P3 document type now generates from a
  declared structure joined with the declared archetype's pack instead of from
  the generic board brief. Its sections, tables, phase-discipline constraints
  and evidence grounding all change. No other document type's output changes.
- **Layer 3 (Canonical model):** unchanged. No schema, no migration, no read
  model, no stored value. The declared archetype and the approved evidence this
  document can now cite were already canonical; only what the document asks for
  changed.
- **Layers 1-2 (Intake, adapters):** unchanged.

## Client Applicability

- All clients: yes, for the P3 process change estimate brief only, and only on
  the bounded process-change route that can request it.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This is a brief-composition default, not a gated surface.
  A Move that declares no archetype resolves no pack and composes the structure
  alone — still a better-formed document than the generic brief, and one that
  asserts nothing it cannot cite.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/structure-process-change-estimate-brief.ts`
  — NEW. The structure itself, in its own module so the shared structures
  catalog takes a two-line change rather than an edit to a file every document
  type shares.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — one
  import, one catalog array entry.
- `src/lib/reasoning/__tests__/moves-process-change-estimate-brief-structure.test.ts`
  — NEW. 20 cases: the structure's own load-bearing properties, the gate and
  route linkage that make it matter, and the route-aware sweep described above.
- `src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts`,
  `.../archetype-pack-governed-data-foundation.test.ts` — sibling guards that
  pin counts this structure changes, updated with their arithmetic restated
  rather than renumbered.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration. No route. No script. No flag. No env var.

## QA / Validation

- **PASS** `npx jest src/lib/deliverables src/lib/reasoning` — 191 suites, 2492
  tests.
- **PASS** `npx jest src/lib/source/deliverables src/lib/programs/__tests__` —
  126 suites, 1277 tests. The structures catalog's consumers outside the two
  directories above, including the production key mapping.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over all five changed source and test files — exit 0.
- **PASS** Mutation pass, 11 mutations, 11 killed. Dropping the declared
  evidence landing sites entirely (5 cases fail); dropping one of them (3);
  adding a judgment section as a landing site (2); relaxing the fixed-structure
  flag (1); replacing the document type's own tables (2); giving one of them a
  key the pack already uses (4); replacing the phase-discipline topic list (1);
  dropping a required section (1); changing a judgment section's grounding mode
  to assert client facts (1); renaming a section key (5); and removing the
  catalog entry, which is also the baseline check and fails 16.
- **PASS** Baseline check. With the catalog entry removed and all three suites
  kept, 16 cases fail — the suites genuinely depend on the change rather than
  passing either way.
- **PASS** `npm run audit:test-ci-coverage:write` — regenerated, drift clean.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — no change produced.
  This release adds no tenant-scoped read or write.
- **NOT RUN** Live signed-in walk. This is a brief-composition change with no
  rendered surface of its own. Proving the document's new shape end to end needs
  a Move that has reached P3 with a confirmed bounded process-change route and
  approved evidence, which is a data and human-approval step outside this lane.

## Rollout Plan

Merge to main. No runtime rollout, no image build, no flag, no migration. The
structure is resolved in-process at brief composition time, so it takes effect
for documents generated by any build containing the merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  and not invoked by this release.
- Shared runtime mutators: none. This release changes no Container App template,
  image, traffic weight, scale, secret, env var, or flag.
- Approved image digest: not applicable — no deploy is part of this release.
- ACA runtime invariant: unaffected. Nothing here can shift traffic or create a
  revision.
- Worker image invariant: unaffected. No worker job changes.
- Feature/env flag update path: not applicable. No flag is added or read.
- Live signed-in proof required: not for this release to be correct, since it
  changes no route and no screen. It IS required before anyone claims this
  document is live-proven for a client; see Known Gaps.

## Rollback Plan

Revert the PR. The whole change is one new module, two lines in the structures
catalog, test files, and a regenerated census — nothing persisted, nothing
migrated, nothing deployed. Reverting restores the generic brief for this
document type immediately, with no data to unwind. Documents already generated
from the structured brief are unaffected by the revert; they are stored records,
not re-derived.

## Audit Evidence

- The pull request and its CI run.
- `src/lib/reasoning/__tests__/moves-process-change-estimate-brief-structure.test.ts`
  — every figure in the "after" column of the table above is the subject of a
  case there, so the claim is checked rather than asserted here. The gate and
  route linkage that make the document load-bearing are pinned in the same file.
- The mutation and baseline results listed under QA.

## Known Gaps

- **The route-aware sweep excludes one document by decision, not by
  derivation.** A planning workshop guide still has no structure and is named in
  an exclusion list with its reason. Whether a facilitation guide should assert
  client facts is a product judgment that has not been taken; one guide type
  already has a structure and grounds evidence while being withheld the pack's
  exhibits and tables by name, so the pattern for taking it exists. The sweep
  pins the exclusion in both directions, so the set can only shrink.
- **The sweep covers P3 only.** It enumerates every route and change-impact
  combination for the design phase, because that is the only phase whose key
  list is route-dependent today. If another phase gains a route-dependent key
  list, nothing extends the sweep to it automatically.
- **The registry spine is mirrored, not derived.** The structure's seven
  sections mirror the six the deliverable registry declares for this document,
  plus an executive opener. A case fails if the registry's count changes, so a
  divergence is visible — but nothing makes the two the same object, and a
  registry section reworded without renumbering would not be caught.
- **The document type's own tables are not reconciled with the pack's.** Both
  now reach this document. The workflow delta table and the pack's process-scope
  table ask for different things and neither is wrong, but no case checks that a
  generated document does not describe the same scope twice in two shapes.
- **The coincidental key collision is recorded, not fixed.** The generic
  brief's default risk register shares a table key with the pack's, which is why
  an assets-withheld check read false for this document before the change. The
  collision is harmless now that the document composes properly, but the same
  coincidence would mask the next structureless document type with that key.
- **The census hunk carries two files that are not from this change.**
  Regenerating the coverage census on an unmodified base already moves the test
  file count by two, so the committed census on the base branch was stale by two
  files before this branch existed. This branch's own contribution is the third.
  The census stores counts and no file list, so the stale entries cannot be
  named from the artifact itself; this is recorded here rather than presented as
  this change's.
- **No live proof.** Flagged for the human-in-the-loop lane: a signed-in walk of
  a Move at P3 on a confirmed bounded process-change route, with approved
  evidence, is what would show the new sections and tables in a real generated
  document. That needs a Move advanced by the data lane and approved by an
  authorized user.
