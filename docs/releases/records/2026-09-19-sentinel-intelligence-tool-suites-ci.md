# 2026-09-19-sentinel-intelligence-tool-suites-ci — Sentinel intelligence-tool suites run in CI, and stop naming a retired corpus id

## Release ID

`2026-09-19-sentinel-intelligence-tool-suites-ci`

## Status

`candidate`

## Plain-English Summary

Five test suites cover the advisor tools that search the pattern corpus, walk a
pattern's neighbourhood and look up evidence. They ran in no CI job, and three of
their cases had been failing for months without reporting to anybody.

The cause was not a broken tool. The corpus re-keyed its entries — identifiers
that used to read `pattern_<name>` are now `PAT-<code>` — and three cases still
named an identifier from the old scheme, so the tool correctly answered "no such
pattern" and the cases correctly went red.

Two further problems came out of the same root and neither was in the report:

- A fourth case wrapped every assertion in `if (both calls succeeded)`. Once the
  named identifier stopped resolving, neither call succeeded, the branch never
  ran, and the case stayed **green while asserting nothing**.
- The tool's own input schema is handed verbatim to the model on every advisor
  turn, and it offered that same retired identifier as its worked example. A
  model following the tool's documentation got a not-found answer.

The repair does not substitute today's identifier for yesterday's, because that
only moves the expiry date. The suites now choose their subject from the live
corpus by the property each case needs, and fail closed if the corpus has no such
entry. The schema stops naming an identifier at all and tells the model to take
one from the search tool, which reads the live corpus and cannot go stale.

## Layer Impact

- `global-control-lane` — one advisor tool's input schema wording changes for all
  clients. No behaviour, no data, no gate changes: the schema text is
  documentation the model reads, and the identifier it named could not be acted
  on.
- Test and CI configuration otherwise. No route, component, prompt assembly,
  schema, migration or data-plane path is touched.

## Client Applicability

State exactly who receives the change.

- All clients: the advisor tool schema wording, which changes no output.
- Specific clients: none.
- Internal only: the test suites and the CI step.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/agent/tools/intelligence/patternNeighborhood.ts` — the input-schema
  description and the matching doc comment stop naming a retired corpus
  identifier and point at the search tool instead. Handler logic unchanged.
- `src/lib/agent/tools/intelligence/__tests__/sentinel-tools.test.ts` — the three
  neighbourhood cases derive their subject from the live corpus; the
  no-neighbours case now exercises the branch its name describes rather than
  re-asserting the previous case; the depth case asserts both calls succeeded
  before comparing them; one new case refuses an unresolvable identifier in the
  schema the model reads.
- `src/lib/agent/tools/intelligence/__tests__/_shared.test.ts` — the corpus
  scoring case asserts the scorer's contract over a sample of real entries
  instead of pinning one entry's rank; one new case records a measured weakness
  in the scorer, named as such.
- `.github/workflows/ai-surface-control-catalog.yml` — one appended step runs the
  directory on every pull request.

## QA / Validation

Measured on exact `origin/main` `57d8443e4` before any edit, and after, with the
same command either side.

- **The three reported failures, and what each turned out to be.** All three are
  stale, none is a product regression; the identifier they name resolves to
  nothing under either its identifier or its slug, confirmed by driving the real
  manifest lookup rather than reading the source.
  - `patternNeighborhoodTool › emits pattern-match + graph-neighborhood
    artifacts for each neighbor (depth=1)` — **stale**. Names the retired
    identifier; the handler returns `pattern_not_found`, which is correct.
  - `patternNeighborhoodTool › does not emit graph-neighborhood when there are no
    neighbors` — **stale, and its name did not describe it even when it was
    green**. Its own comment recorded that it asserted the contrapositive of the
    case above, so the handler's `neighbors.length > 0` guard had never been
    exercised.
  - `scorePatternsByKeyword › finds at least one real corpus pattern by signature
    keywords` — **stale, and never a relevance assertion**. Scores count query
    tokens present, so the four-token query maxes out at 4 and **72 of 3,569
    corpus entries reach it**; rank 1 among them is decided by insertion order.
    Substituting the entry's current identifier would still fail, because a
    different entry sorts ahead of it.
- **A fourth defect, not in the report, found by the same root cause.** `walks
  deeper than depth=1 when requested` guarded its comparison behind
  `if (depth1.success && depth2.success)`. Expressed as a measurement rather than
  a description: reintroducing the retired identifier fails **2** cases on the
  repaired suite and failed **1** on `main` — the depth case was silently green
  the whole time.
- **Suite, same five files either side:** 5 suites, 2 failed / 3 passed and 48
  tests, 3 failed / 45 passed **before** → 5 suites / 50 tests / **0 failing**
  after.
- **Scope baseline, `npx jest src/lib/agent/tools`, measured either side by
  restoring the changed files:** 16 suites, 2 failed / 14 passed and 124 tests,
  3 failed / 121 passed **before** → 16 suites / 126 tests / **0 failing** after.
- **Nine mutations, nine caught**, each file byte-restored and the restore
  confirmed with `diff -q`:
  - drop the `neighbors.length > 0` guard → 1 failed / 49 (the branch that had
    never been exercised)
  - stop writing per-neighbour cards → 1 / 49
  - ignore the requested depth → 1 / 49
  - put the retired worked identifier back in the schema the model reads → 1 / 49
  - stop sorting scored patterns → 1 / 49
  - make matching word-boundary aware → 1 / 49, which proves the
    recorded-weakness case is live rather than decorative
  - make the derived neighbourhood subject the retired identifier → 2 / 48
  - make the isolated subject a connected one → 1 / 49
  - empty the scorer's sample, so its loop would assert nothing → 1 / 49
- **Wiring mutation.** Replacing the appended step with `echo skipped` moves
  pull-request-workflow-reached suites **420 → 415**, fully covered directories
  **61 → 60**, and uncovered `high` governed-risk directories **114 → 115**.
- `tsc --noEmit` exit 0 with `tsconfig.tsbuildinfo` removed beforehand, 0
  diagnostics; `eslint` exit 0 with no output; `release:check` exit 0 — all
  judged by exit code.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps workflow builds and deploys
the merge SHA as it does for any merge. Nothing needs enabling: the CI step is
active on the next pull request, and the schema wording ships with the image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No manual Azure command is used.
- Shared runtime mutators: none. No `az containerapp update`, no traffic weight
  change, no environment or flag change.
- Approved image digest: whatever the repo-owned workflow builds for the merge
  SHA; read back after the run rather than asserted here.
- ACA runtime invariant: to be proven after the deploy run — Container App
  template image equal to the 100%-traffic revision image, revision healthy.
- Worker image invariant: both non-manual delivery worker jobs to read back on
  the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**. The only product-visible change is the
  wording of a tool schema the model reads; no rendered output, copy, route or
  data path changes, so no browser session could observe a difference.

## Rollback Plan

Revert the merge commit. There is no migration, no data write and no flag, so a
revert restores the previous state completely. Reverting also restores the retired
identifier in the tool schema and returns the five suites to red and unwatched,
which is the state this change left.

## Audit Evidence

- The pull request and its checks, including the `AI surface control catalog` job
  log showing the appended step executing and naming the five suite files — the
  step is confirmed running before merge, not merely declared.
- The before/after suite and scope measurements above, each produced with the
  same command on both sides.
- The nine mutation results above, with the case count each produced.
- The CI-coverage census delta from the wiring mutation.

## Known Gaps

- **The keyword scorer matches short tokens inside unrelated words.** Matching is
  a substring test, so a two-letter token hits words that merely contain it, and
  a four-token query scores 3,524 of 3,569 corpus entries above zero with 72 tied
  at the top. This change records the behaviour in a named case rather than
  changing it: the scorer is the live retrieval path for an advisor tool, so
  narrowing it changes what a reader is shown and needs its own review of what it
  would start excluding. Raised as its own backlog item.
- **The retired identifier is cited elsewhere.** Two intelligence content modules
  still cite identifiers from the old corpus scheme. That is the already-open
  registry-integrity item, it needs a content decision, and nothing here touches
  it.
- **The appended step is not itself a declared control**, so deleting it breaks
  no gate — the standing open question about where suites of this kind belong,
  unchanged by this record.
- Deploy digest and runtime invariant are owed after merge and are not claimed
  here.
