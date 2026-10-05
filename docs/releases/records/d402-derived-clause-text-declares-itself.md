# 2026-10-05-derived-clause-text-declares-itself — Generated clause text stops claiming to be an extraction

## Release ID

`2026-10-05-derived-clause-text-declares-itself`

## Status

`candidate`

## Plain-English Summary

A governed synthetic contract-depth evidence package held 56 contract-clause rows
whose text was composed by the package generator. Each sentence stated only the
row's own provenance — that something governs it and that it maps to an evidence
row — and none of them said what the clause actually says. Every one of those 56
rows nonetheless carried a review state meaning "reviewed", a confidence of
`0.91`, and a populated page number.

So each row presented itself as a reviewed, page-cited extraction at high
confidence. It was not one. A page citation for text that was never read off
that page is a falsehood, and so is a confidence score for an extraction that
never ran. A uniqueness check passed all 56, because the sentences differ in
their leading concept and trailing evidence-row id and are therefore distinct;
they differ in exactly the way that hides the problem.

This change makes such a row declare itself. The text is kept — removing it
would lose the concept the row names — but the page citation, the confidence
score, the excerpt and the extractor version are now **absent** rather than
asserted, and the row loads **unreviewed**. No clause language was authored:
writing plausible contract prose would have made the metadata true-looking
instead of true, and clause wording is an owner call in any case.

Clearing the columns in the source file was not sufficient on its own, and that
is the part worth reading. Both consumers manufactured the same assertions back
whenever the row was silent: the contract-term load hard-coded a `reviewed`
quality state for every clause and substituted `0.82` for a missing confidence,
and the projection copied the generated sentence into an excerpt field and
stamped an extractor version unconditionally. The classification therefore runs
in code, over the row, at both sinks.

## Layer Impact

Release lane: **`client-data-lane`** — this is a client-scoped dataset, manifest
and ingestion-path change to one governed synthetic evidence package, not shared
app behaviour. No control-plane route, gate or product surface changes, so it is
not `global-control-lane`.

- **Layer 1 (client intake):** the governed package's clause source file now
  leaves confidence and page absent and names its own basis. The change is
  declared in the dataset manifest first and applied from that declaration, so
  the file was not edited out from under its governance.
- **Layer 3 (canonical model):** the canonical clause object carries a text
  basis. A derived row contributes no page reference, no confidence and an
  unreviewed quality state to the contract-term write, and no excerpt,
  extractor version or extraction timestamp to the clause projection.
- **Layer 4 (products):** no product surface, route, component or prompt is in
  this change. Downstream readers that trusted the score and the page citation
  now see them absent, which is the correct input.

## Client Applicability

- All clients: no.
- Specific clients: one synthetic demo package, named in the manifest this
  change updates. No real client engagement is affected; the package is
  demo-only by its own declaration and may not be represented as live truth.
- Internal only: yes — governed synthetic evidence used for demo and build.
- Public/demo only: the package is demo-grade.
- Feature flag: none. This is a dataset and loader correctness change.

## Changes Included

- `src/lib/source/contract-depth-package/clause-text-basis.ts` — **new.** Answers
  "did a document produce this text?" and derives from the answer the fields the
  canonical object may carry. Also exports the governed field set the
  contract-term write uses, so the rule can be driven over the real package
  without a database.
- `src/lib/source/contract-depth-package/projection.ts` — the clause projection
  takes its review state, confidence, page, excerpt, extractor version and
  extraction timestamp from the classification instead of asserting all six.
- `scripts/source/load-contract-depth-package.ts` — the contract-term insert
  takes `page_ref`, `confidence` and `quality_state` from the classification.
  `quality_state` stops being a hard-coded `'reviewed'` literal in the SQL and
  becomes a bound parameter, and is added to the conflict update so a re-load
  cannot leave a stale state behind.
- `docs/governance/dataset-manifests/<package>.json` — declares the derived-text
  basis for the clause file: the column, the row count, the review state, that
  confidence and page are absent, and why.
- `src/lib/governance/dataset-manifest.ts` — the manifest schema gains that
  declaration as an optional, strictly-shaped field. The schema is
  `z.strict()`, so the manifest change above failed
  `validate:context-corpus manifests` with an unrecognised key until the field
  existed. `confidence` and `source_page` are typed as the literal string
  `"absent"`, so the declaration cannot smuggle a placeholder number back in,
  and `reason` has a minimum length so the field cannot be satisfied by a
  one-word note.
- `<package>/source-files/contract_clauses.csv` — 56 rows rewritten **from that
  manifest declaration**, not by hand. Header and line endings untouched; the
  diff is 56 changed lines.
- `<package>/qa/layer-2-adapter-preview/contract_clause_adapter.json` and
  `<package>/qa/layer-projection-preview/source.contract_pdf_clause_extractions.json`
  — regenerated by the repo-owned preview generator in the same change. These
  held 56 and 56 copies of the same sentence with the same metadata; a stale
  preview would have contradicted the source file with no test noticing.
- `src/lib/source/contract-depth-package/__tests__/clause-text-basis.test.ts` —
  **new**, driven over the real package.
- `.github/workflows/integrity.yml` — runs the new suite in the required
  `Routes and disclaimers` job.
- `src/__tests__/behaviors/t451-source-program-suite-ci-coverage.test.ts` — the
  new suite is **declared** in the owned-suite list for its directory. See the
  caused-and-fixed red below; nothing in that suite is weakened.

## QA / Validation

**Red first, over the real package, then green.**
`npx jest --runTestsByPath src/lib/source/contract-depth-package/__tests__/clause-text-basis.test.ts`

- Before the fix: **3 failed / 17 passed of 20.** The three failures were the
  end-to-end halves — the source file, the projection output and the committed
  preview layers. The classifier-only cases passed, because the classifier is
  the part that existed first.
- After the fix: **21 passed / 21.** The extra case is the mutation diagnosis
  below.

**Scope baseline, same scope both sides, measured against this branch's own
merge-base rather than a moving `main`:**
`npx jest src/lib/source/contract-depth-package scripts/source/__tests__`

- Merge-base: 15 suites failed, 13 passed (28); **2 tests failed**, 78 passed (80).
- This branch: 15 suites failed, 14 passed (29); **2 tests failed**, 98 passed (100).
- The same two failures on both sides, confirmed by name:
  `deletes only the requested opportunity version on a rerun` and
  `does not promote an authored opportunity amount without a governed sizing claim`.
  Both pre-exist and neither is in this change's scope. The 15 failing suites are
  `node --test` files that the jest pattern selects and cannot run; also
  identical on both sides.

**Nine mutations, nine caught, and one of them had to be earned.** Each reverts
one half of the fix; the number is the count of failing tests it produced.

| # | Mutation | Caught |
|---|---|---|
| 1 | Projection asserts the generated sentence as `source_excerpt` again | 1 |
| 2 | Projection stamps `extractor_version` unconditionally again | 1 |
| 3 | Projection reads the row's `confidence`, defaulting to `0.82` | 1 |
| 4 | Projection reads the row's `review_state` instead of the verdict | 1 |
| 5 | Classifier's absence pattern narrowed to the one sentence on disk | 4 |
| 6 | Classifier gives a derived row `0.82` instead of absent | 5 |
| 7 | Classifier lets a row's own `review_state` decide, dropping the text test | 2 |
| 8 | Dataset half reverted: page, score and `reviewed` state restored on 56 rows | 1 |
| 9 | Committed adapter preview reverted to the old metadata | 1 |

Mutation 4 **survived the first run and was diagnosed before being reported as a
gap.** With the source file now declaring its own basis, reading `review_state`
verbatim and reading it from the verdict produce the same string over that
input, so the mutation changed no behaviour given the current dataset — but it
left the projection's override path unpinned, which is a real gap and not a
false survivor. A case was added that drives the projection with a row that
*lies*: content-free text carrying the old reviewed state, `0.91` and a page.
The classifier's override was already covered on its own; the projection's use
of it was not. Mutation 4 now fails that case. The restored baseline returns to
21 of 21.

**The absence pattern is derived from what the generator emits, not from the
happy path.** It is two independent structural markers, both required and in any
order, rather than a regex over the sentence on disk — which is why mutation 5
kills four cases. Six positive variants are covered: the sentence as written, a
plural subject with plural rows, a different year, the markers re-ordered, past
tense with a gerund, and an empty cell. Four guardrails assert that genuine
clause language is **not** swallowed, including a clause that mentions
governance and one that cites an evidence row while still stating an obligation
— an over-broad absence pattern would be the worse defect, because it would mark
real extractions unreviewed and strip their page citations.

**Count pinning.** Every assertion is `toHaveLength(56)`, never
`.filter(...).length > 0`, which stays green when 55 of 56 regress.

**Negative case from a genuinely extracted row: the package has none, stated
here rather than asserted.** All 56 rows match the content-free shape, measured
by regex over the parsed CSV. There is no extracted row in this package to draw
a negative case from, so the extracted branch is covered by constructed rows
that exercise the classifier and the projection directly, and the package-level
assertions pin 56 of 56 derived with 0 extracted.

**The suite is wired into a required context, and the two claims are reported
separately because they are different claims.**

- *Census visibility*, by the delta rather than by grepping the census for the
  filename: `testFiles` 2710 → 2711, `coveredTestFiles` 2546 → **2547 (+1)**,
  `uncoveredTestFiles` 164 → **164 (unchanged)**, `pullRequestCoveredTestFiles`
  2545 → 2546. Measured at this branch's merge-base and at this branch.
- *Requiredness*: the suite runs in the `Routes and disclaimers` job, which is
  one of the 19 contexts in `docs/ci/required-status-checks.json`. It was
  deliberately not wired into the unit-suites workflow, whose job name is in
  none of those 19, so a suite registered only there cannot fail a merge. The
  two suites already in this test directory are reached by that non-required
  workflow alone; they count as covered and still gate nothing. This step is the
  directory's first required reader.

**A finding about the prescribed proof instrument itself.** The coverage census
enumerates test files under `src/` only. The suite was first written under
`scripts/source/__tests__/`, next to the loader it constrains, and the census
delta came back **zero on every count** — the file was invisible to the
instrument, staged or not. So the census cannot evidence a suite placed under
`scripts/`, and a zero delta there means "not measured", not "not covered". The
suite now lives in the test directory of the module it tests, which is both the
canonical home and inside the census's reach. Filed as a follow-up below.

**A required check went red because of this change, and was fixed by declaring
the suite rather than by weakening anything.** `Behavior coverage floor` — one
of the 19 required contexts — failed on the pull request. **It was not the
coverage percentage**, which is the obvious failure mode for adding a test; it
was a single test failure, 1 of 2050, in
`src/__tests__/behaviors/t451-source-program-suite-ci-coverage.test.ts`, case
`measures exactly the eight named suites`.

Attributed by execution across bases rather than assumed: that suite **passes
6 of 6 at the merge-base `ad0209f7ed` and fails on this branch**, so it is this
change's doing. The cause is the gate working as designed. T-451 declares the
exact suite list of four *wholly owned* directories, and
`src/lib/source/contract-depth-package/__tests__` is one of them — precisely so
that a new suite cannot arrive there unowned. It caught the file this change
moved into that directory for the census-visibility reason above.

The fix declares the suite: the list gains `clause-text-basis.test.ts`,
`toHaveLength(8)` becomes `9` because there are genuinely nine owned suites, and
the test's title is corrected from "eight" to "nine" so it does not lie. **No
assertion is loosened and no bound is lowered.** Every ownership assertion still
runs and still holds — the directory is named by a workflow jest command, and
the census reports it neither partially covered nor uncovered.

**The declaration was mutation-checked in both directions**, so it is not a
number changed to turn red green: dropping the new suite from the list while
leaving the count at 9 fails the case (1 of 6), and keeping the suite while
reverting the count to 8 also fails it (1 of 6). Restored: 6 of 6.

After the fix the whole behaviours directory is **197 suites / 2050 tests, 0
failing**, and the real gate `npm run coverage:behavior-gate` **exits 0**:
lines 90.08 and statements 90.08 against a floor of 90, functions 70.54 against
60, branches 71.89 against 50.

**Governance gate.** `npm run validate:context-corpus` → **passed**, all five
checks (`exceptions`, `tenant-coverage`, `agent-readiness`, `duplicates`,
`manifests`). It failed first, with `Unrecognized key: "derived_text_declarations"`,
which is the gate doing its job: the manifest schema is strict and a new
declaration has to be added to it deliberately. `npx jest src/lib/governance` →
**8 suites, 126 tests passed**, identical to the merge-base.

**Other checks:** `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 0**, judged by exit code and run with the
build-info removed first. `npx eslint` over the changed files and the whole
changed module directory → **exit 0**. `node scripts/quality/test-ci-coverage-census.mjs --check` → **exit 0**: the coverage
*shape* matches the committed census, so the committed artifact needs no edit;
the count line reports the +1 drift and enforces nothing.

## Rollout Plan

Merge to `main`. No runtime rollout, no migration, no feature flag, no deploy
step is required for the change to be correct: the dataset, its manifest, the
classifier and both preview layers are repository files. The new assertions
reach a database only the next time the governed operator data-build job is run
for this package, which is a separate, approved action and is not performed
here.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command, revision, traffic weight,
  env var, flag or worker job is touched.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: not applicable to this change's correctness. Whatever
  digest is serving when this merges continues to serve.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and the reason is stated rather than
  left as an unexplained ceiling.** No product surface, route, component, API
  handler or model prompt is in the diff. The behaviour changed is a loader
  write, a projection mapping and a dataset file. There is nothing a signed-in
  walk could observe that the suite does not already assert, until the governed
  data-build job is separately run and a surface reads the result.

## Rollback Plan

Revert the squash commit. Nothing is written to any database by this change, so
there is no migration to unwind and no data to repair. If only the dataset half
needs reverting, re-running the repo-owned preview generator after restoring the
source file restores both preview layers; the code half fails closed in the safe
direction on its own, because a derived row would simply continue to load
page-less and unreviewed.

## Audit Evidence

- The pull request and its CI run, including the `Routes and disclaimers`
  required job, where the new suite's step appears by name.
- The red-first and green numbers above, reproducible with the single
  `--runTestsByPath` command quoted.
- The nine mutations, each a one-line revert of a named expression, with the
  surviving-then-killed case documented rather than quietly fixed.
- The census delta at the merge-base and at the branch head.
- The dataset manifest, which now states the declaration the source file was
  rewritten from.

## Known Gaps

- **`Fence coverage matches the committed census` is red on this pull request and
  this change did not cause it.** Running the check at the merge-base
  `ad0209f7ed` and on this branch gives byte-identical output: one route,
  `src/app/api/v1/source/[eventId]/award/route.ts`, "not in the committed
  census". That route arrived in the merge-base commit itself without the census
  being refreshed; this change adds no API route and contributes zero fence
  drift. The check is also not one of the 19 required contexts, read by name
  from `docs/ci/required-status-checks.json` rather than off the rollup. Left
  for its own item: the one-command fix would make this diff
  un-attributable.

- **The loader's SQL parameters are not driven end-to-end.** The governed field
  set is behaviourally tested over all 56 real rows through its exported
  function, and the `quality_state` literal in the insert is gone. What is
  reviewed rather than executed is the last step — that those three values sit
  in the right positional slots of the insert. Driving it would need a database
  this lane may not reach. The positional mapping was checked against the column
  list by hand and the diff is fifteen lines.
- **The coverage census does not see test files under `scripts/`** (`collectTestFiles`
  is rooted at `src`). The repository has test files there, and for them the
  prescribed "prove it by the census delta" check cannot answer. Worth either
  widening the census root or recording that `scripts/` suites are out of its
  scope, so a future zero delta is not read as a failure. Filed, not fixed here.
- **The committed preview layers for this package were already stale before this
  change**, independently of the clause rows: regenerating produced additive
  keys in both quality-gate files and four preview files the generator now emits
  that were never committed, from a later adapter feature. That drift was
  deliberately **excluded** from this change to keep the diff attributable, and
  it remains open. Nothing in this change depends on it.
- **No extracted clause row exists in this package**, so the extracted branch of
  the classification is proven on constructed rows rather than on governed data.
  Stated above rather than asserted as an absence a fixture could not reach.
- **The governed data-build job has not been run** with the corrected dataset, so
  no database currently holds the corrected rows. That is the separate, approved
  operator action the manifest requires and is explicitly out of scope.
