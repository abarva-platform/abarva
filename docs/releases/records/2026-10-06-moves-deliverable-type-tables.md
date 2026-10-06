# 2026-10-06-moves-deliverable-type-tables — A deliverable type may ask for the tables it is built around

## Release ID

`2026-10-06-moves-deliverable-type-tables`

## Status

`candidate`

## Plain-English Summary

Every non-bespoke artifact brief is composed from two independent declarations: a **deliverable
structure** (what this artifact type always needs, whichever use case it is written for) and an
**archetype pack** (what this use case needs, whichever artifact type it is). For exhibits, both
sides are heard — the structure's exhibits are concatenated with the pack's, and the code comment
beside that line says exactly why: "a business case and an architecture doc under the same
archetype must not get the same exhibit list."

**For tables, only one side was heard.** `composeBrief` took its tables from the archetype pack
alone and ignored the structure entirely, and the structure had no field in which to say otherwise.
So the sentence the exhibit comment forbids was true of tables all along. Measured over the shipped
catalogs:

- **7** distinct table signatures across the **105** composable briefs, against **37** distinct
  exhibit signatures.
- Within a single archetype, **3** signatures total — one of which is the empty set the two
  approval instruments get and one of which belongs to the discovery plan's own builder. So **18 of
  the 21** shipped structures received the **identical** table set.

Concretely, under one archetype a Target State Architecture was asked for a vendor pricing template
and a volume baseline; a Roadmap was asked for an application inventory; and a Requirements
Traceability document — whose own sections are a requirements baseline, an evidence-to-design
trace, and a gap register — was asked for neither of the two tables it exists to carry. This is not
cosmetic: `expectedTables` is written into the model prompt (`prompt-builder`) and into the
retrieval queries (`generate-service`), so it is the instruction the document is drafted against
and part of what the corpus is searched for.

This change gives `DeliverableStructure` an `expectedTables` field, declares it on the four
deliverable types that are built around a table no pack supplies, and joins the two sides through
one shared rule.

**The join is shared on purpose.** The exhibit join and the table join had already drifted once —
that drift *is* this defect. One function, `composeArtifactAssets`, now performs both: concatenate
structure-first, keep the first entry per key. The de-duplication is the second half of the fix and
is not decoration. A configured pack is validated for uniqueness *within itself* and cannot know
which keys a structure already declares, so an operator may legitimately name a key that collides.
A duplicated expectation is not harmless: the quality gate prints `N of M received` straight off
the expectation array's length, so a duplicate inflates `M` with something nothing can satisfy, and
the greedy one-to-one match then reports an exhibit that **was** delivered as missing — the "right
count, wrong diagnosis" failure that match was rewritten to remove, arriving from the request side
instead of the produced side.

Strictly additive to every brief the product composes today: no brief loses a table it had, no
exhibit list changes, and the default risk register still stands in for an unresolved pack.

## Layer Impact

Release lane: `global-control-lane` — shared deliverable-brief composition for all clients, with
no flag. No client data, schema, retrieval index or tenant scope is touched.

- **Layer 1 (client intake):** none.
- **Layer 2 (source adapters):** none.
- **Layer 3 (canonical model):** none. No table, column, migration, read model or metric. The two
  catalogs this reads are code-owned product configuration, not tenant data.
- **Layer 4 (products):** Moves and Source deliverable generation. Four deliverable types now
  request a table they could not previously ask for, which reaches the drafting prompt and the
  retrieval query text. Every other brief composes byte-for-byte as before.
- **Tooling/tests:** one new module and cases appended to two already-registered suites.

## Client Applicability

- All clients: yes — brief composition is shared, and the four affected deliverable types compose
  the same way for every client
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none. The change is additive and backward-compatible: a structure that declares
  nothing composes exactly as it did, which is the behaviour pinned by the "loses no table the
  archetype pack already supplied" case over all 105 briefs.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/artifact-asset-composition.ts` — **new.**
  `composeArtifactAssets` (the one join for both asset kinds) and `assetKeyCollisions` (reports
  a collision as well as resolving it, so an operator is told rather than losing a declaration
  silently). Imported by `artifact-brief-registry.ts`, so it is a reachable module, not an orphan.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — `expectedTables?` added to
  `DeliverableStructure`, with the measurement above stated in its doc comment, and declared on
  four structures: `moves/requirements_traceability` (traceability matrix + gap register),
  `moves/estimate_model` (estimate build-up and basis of estimate),
  `moves/readiness_and_change_plan` (stakeholders, decision rights and readiness) and
  `source/evaluation_workbook` (criteria, weights and scoring basis, declared
  `client_to_complete` because the panel sets the scores).
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — `composeBrief` routes both its
  exhibit list and its table list through `composeArtifactAssets`.
- `src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts` — 14 cases appended
  (49 → 63).
- `src/lib/deliverables/orchestrator/__tests__/c514-expected-exhibit-shortfall.test.ts` — 1 case
  appended (7 → 8): a colliding configured pack, loaded through the shipped pack loader, composed,
  and driven into the real quality validator, asserting the denominator counts distinct
  expectations and the delivered exhibit is not named missing.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- `docs/releases/records/2026-10-06-moves-deliverable-type-tables.md` — this record.

## QA / Validation

Lane: **Moves CODE lane**, local validation on an isolated worktree off `origin/main` at
`91d90ad59f`, then re-validated after merging `origin/main` in at `755d266171`.

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__` → **52 suites, 672 tests, 0
  failing**. Measured baseline on a pristine `origin/main` worktree: the same 52 suites, **657**
  tests — so the 15 appended cases are the whole delta and no existing case changed verdict. The
  whole directory is run rather than the two changed suites, because `artifact-brief-registry` is
  composed through by many suites in it.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` → exit
  `0`. The exit code is the verdict: a bare run exits `134` on an out-of-memory crash and emits
  nothing, which reads as clean.
- **PASS** — `npx eslint` on all five changed/added source and test files → exit `0`.
- **PASS** — `npm run audit:lib-orphans` → "No change against the baseline." The new module is
  reached by product code, not only by its own test.
- **PASS** — `npm run audit:test-ci-coverage:write` → "committed census matches this run". Both
  appended suites were already registered in `.github/workflows/unit-suites.yml`; no new test file
  and no new directory.
- **PASS** — re-run of the same four checks after merging `origin/main` in at `755d266171`:
  `npx jest src/lib/deliverables/orchestrator/__tests__` → **52 suites, 739 tests, 0 failing**
  (the test total moved because `main` added cases, not this branch); `tsc --noEmit` → exit `0`;
  `eslint` on the five changed files → exit `0`; `release:check` → 11 of 11 gates passed. The
  merge itself was census-only, so no expectation was conformed and no guard was re-derived.
- **NOT RUN** — signed-in walk. This change alters the brief handed to the drafting model; proving
  it end to end means generating a deliverable of one of the four affected types, which is a
  data-plane action this lane does not take. Named in **Known Gaps**.

### Mutation results

Eleven mutations, each applied alone against the committed tree and reverted immediately, each
scored by running the **whole** directory (52 suites / 672 tests):

| mutation | result |
|---|---|
| table join reverted to pack-only (the pre-change behaviour) | **KILLED** — 3 failing |
| de-duplication removed from the join (plain concatenation) | **KILLED** — 4 failing, across 2 suites |
| the pack's entry wins a collision instead of the structure's | **KILLED** — 4 failing |
| key-less assets collapsed together instead of kept | **KILLED** — 1 failing |
| `assetKeyCollisions` always returns empty | **KILLED** — 2 failing |
| `requirements_traceability`'s declared key renamed | **KILLED** — 2 failing |
| `estimate_model`'s declared key renamed | **KILLED** — 2 failing |
| `readiness_and_change_plan`'s declared key renamed | **KILLED** — 1 failing |
| `evaluation_workbook`'s declared key renamed | **KILLED** — 1 failing |
| `composeBrief`'s exhibit join reverted to a raw spread | **SURVIVED — diagnosed** |
| the structure's tables withheld alongside the pack's | **SURVIVED — diagnosed** |

The last two change no behaviour and so cannot be killed, which is stated in the code beside the
two lines rather than left for a reader to rediscover. The exhibit join's de-duplication cannot
bite while every shipped pack's exhibit keys are disjoint from every structure's — re-probed here
across all 105 briefs, by key and by the validator's own loose identity, and zero collide. It
becomes reachable through `composeBrief` once a configured pack is resolved there, which is a
separate open item; until then the rule is exercised through the function's own door, which is
exported and callable, and that door is what the appended validator case drives. The withheld-side
mutation is unobservable because neither withheld instrument declares a table **or** an exhibit, so
gating the structure's side would change nothing; the rule is written to match the exhibit line,
which has always been ungated.

Two of the four declaration mutations survived a first pass, and the gap was real rather than
cosmetic: the case that checked each declared table reached the brief read its expected keys **off
the declaration it was checking**, so renaming a key renamed it on both sides and the case still
passed. The keys are now written out in the test and cross-checked against the catalog, which is
what turned those two into kills.

### Census attribution

The regenerated census moves `testFiles` 2727 → 2728 and `coveredTestFiles` 2563 → 2564, with
`uncoveredTestFiles` unchanged. **None of that is this change** — it adds no test file, and a new
test file outside a wired directory would move the uncovered count, which is the number to watch.
The committed census was again one behind after merging `main` in; the delta belongs to earlier
merges whose census hunks were dropped, and the regenerated run reports "committed census matches
this run". Verified before writing this line, not assumed.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds the merge commit as it
builds every merge. There is no flag to enable, no migration to run, no worker job to trigger and
no image or environment change. Behaviour reaches a deliverable the next time one of the four
affected types is generated.

## Rollback Plan

Revert the commit. There is no persisted state to unwind: the change adds a pure function, an
optional catalog field, four catalog declarations, and tests. Any deliverable already generated
keeps the brief it was generated against — briefs are composed per request and not stored as
configuration. A revert restores the pack-only table list immediately, with no data repair.

## Deployment Authority

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift, no revision weight
  change, no registry or pruning action
- Approved image digest: not applicable — this change requests no runtime update
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none. No entry in the flag registry changed, so the generated
  manual needs no regeneration
- Live signed-in proof required: no for merge. A generation walk is owed before this is described
  as proven in a drafted document, and is filed in **Known Gaps**

## Audit Evidence

- The PR carrying this record, and its CI run.
- The eleven mutation results above, each reproducible by applying the named edit alone and running
  the directory.
- The measurement the field's doc comment states (7 table signatures vs 37 exhibit signatures over
  105 briefs; 18 of 21 structures identical within one archetype) is derived from the shipped
  catalogs and re-derivable from them; the post-change count of 27 distinct table signatures is
  pinned as a case, so the number cannot drift unremarked.
- `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

- **No generated deliverable has been inspected.** The four new tables reach the drafting prompt
  and the retrieval query text, and whether the model fills a basis-of-estimate table well is a
  quality question this change does not answer. A generation walk over one of the four types is the
  proof, and it is data-plane work; filed separately rather than claimed here.
- **A configured pack's table and exhibit keys are still checked against nothing but themselves.**
  The join now resolves a collision and reports it, but nothing refuses one at load time and no
  surface shows the report. Wiring `assetKeyCollisions` into the configuration preflight is the
  natural next step and needs the preflight's own merge first.
- **The exhibit half of the de-duplication is unreachable through `composeBrief` today**, because
  pack resolution there reads the built-in catalog. It becomes live with the configured-pack
  consumer; the rule is in place ahead of it deliberately, so the two joins cannot drift apart
  again in between, and it is exercised through the function's exported door meanwhile.
- **Seventeen structures still declare no tables of their own**, and that is a product judgement
  rather than an omission: a table a use case happens to want belongs with the archetype pack. The
  four taken here are the ones whose own sections name a table no pack supplies. The remaining
  candidates should be argued one at a time, not declared in bulk.
- **`expectedTables` has no vocabulary**, exactly as the pack half's evidence families did not
  until recently. A declared table's key is a free string, and it becomes retrieval query text, so
  a typo searches the corpus under a name nothing carries. Worth the same treatment, and left to
  its own change.
