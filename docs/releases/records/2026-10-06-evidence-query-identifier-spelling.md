# 2026-10-06-evidence-query-identifier-spelling — the retrieval query spells out the identifiers it was built from

## Release ID

`2026-10-06-evidence-query-identifier-spelling`

## Status

`candidate`

## Plain-English Summary

Before a deliverable is written, the orchestrator searches the client's governed
corpus for the evidence each section needs. It builds those searches out of the
brief: the deliverable's type, the declared archetype, each section's title and
intent, the evidence families the section expects, and every expected exhibit
and table.

Most of those pieces are **identifiers** — machine names with underscores in
them, like `run_cost_baseline` or `governed_facts`. A brief is right to declare
identifiers; identity is declared, never inferred. But the identifiers were
going to the search engine as the search *text*, and an underscore is a word
character. That broke the search in two ways at once:

1. **The words inside an identifier were not searchable words.** The searchable
   fields of the governed-context index declare the Lucene English analyzer
   (`src/lib/azure-search/index-contracts.ts`), whose tokenizer joins across an
   underscore. A document that says "application inventory" in a sentence is
   indexed as two words; the query term was one word with an underscore in the
   middle, so it could not meet it.
2. **The retriever's own topical gate could not read the query.** Before running
   its structured passes — the extra, narrower searches that pull records of a
   given kind rather than prose — the retriever tests the query against a list of
   topic words. Those tests are word-anchored, and a word boundary needs a
   non-word character on one side. Underscore is a word character, so a query
   assembled from identifiers failed tests that the very same words in a
   sentence would have passed.

The second one is measurable from inside the repo, and it was measured by
calling the retriever's own gate on every search the shipped catalogs build —
1,661 of them, across 21 deliverable structures and 5 archetypes:

| declared archetype | searches built | earned structured passes before | after |
|---|---|---|---|
| `AMS_IT_OUTSOURCING` | 325 | 60 | 70 |
| `ERP_SI_SELECTION` | 343 | 78 | 79 |
| `CLOUD_MODERNIZATION` | 307 | 78 | 79 |
| `AI_PDLC` | 325 | **114** | **325** |
| `ANALYTICS_CAPABILITY_REPATRIATION` | 361 | 186 | 196 |
| **all** | **1,661** | **516** | **749** |

The worst case is the one whose name is the problem. The archetype for
artificial-intelligence work declares itself `AI_PDLC`, and the gate's first
topic word is `ai` — which a word-anchored test can never find inside
`AI_PDLC`. So 211 of that archetype's 325 searches were denied the structured
passes because of the underscore alone. Every one of its 325 now earns them.

The fix is one rule at one boundary: when a query is **built**, each identifier
in it is followed by its own words. `run_cost_baseline` goes out as
`run_cost_baseline run cost baseline`. Both spellings are carried rather than
one replacing the other, so no term that reached the index before stops reaching
it — the change can only widen what a search can match, never narrow it.

Two things are deliberately left alone. A caller's own `evidenceQuery` is
authored text and goes to the retriever exactly as written, identifiers and all.
And the retriever's topic list is not widened to tolerate underscores: other
callers hand it ordinary sentences, and teaching every caller's gate to read
identifiers is a much larger change than spelling them correctly at the one
place that produces them.

## Layer Impact

Release lane: `global-control-lane` — shared product behaviour for all clients;
additive at the query level, since every term sent before is still sent.

- **Layer 4 (Products).** The retrieval searches a deliverable build issues now
  carry the words of the identifiers they were already carrying. No brief, no
  section, no exhibit and no table declaration changes; the identifiers the
  brief declares are untouched, because they are identity.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, read model,
  metric or fact is touched. Nothing here calculates a value.
- **Layers 1–2 (Intake, adapters).** Unchanged. No index definition, no indexer
  and no ingestion path is modified; the analyzer is only *read* here, to
  explain why an identifier is the wrong text.

## Client Applicability

- All clients: yes. Every tenant's deliverable generation builds its searches
  through this one function, so every tenant gets the wider searches. Nothing is
  removed from any search, so no tenant can retrieve less than it did.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none, and deliberately. The change is additive at the level the
  retriever sees — a strict superset of the terms each query already sent — so
  an off switch would gate recall the product wants in every case. The function
  takes no tenant, so a tenant-scoped flag would have to be threaded through the
  generate service to reach it, which is a larger change than the fix.

## Changes Included

- `src/lib/deliverables/orchestrator/generate-service.ts` — new exported
  `spellIdentifiersAsWords`, applied to every query the section/exhibit/table
  walk builds and to the fallback query, and explicitly **not** to a caller's
  `evidenceQuery`.
- `src/lib/azure-search/tenant-context-retriever.ts` — the structured-pass gate
  is exported so the code that builds query text can be tested against the real
  rule instead of a copy of it that could drift from it. No behaviour change.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts` — 9 cases added
  to the suite that already covers this builder, in a CI-wired directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Lane: `global-control-lane` (shared product behaviour for all clients, additive
at the query level).

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/surface.test.ts`
  — 32 tests (23 existing, 9 added).
- **PASS** — `npx jest src/lib/deliverables src/lib/azure-search` — 127 suites,
  1,491 tests. The whole of both trees was run, not only the two touched
  suites, because the changed function sits on the path every deliverable build
  takes and the exported gate is in the retriever every search goes through.
- **PASS** — `npx jest src/lib/corpus src/app/api/v1/deliverables` — 7 suites,
  45 tests, the other callers of the retriever and the route above the service.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit code 0.
- **PASS** — `npx eslint` on all three changed source files — exit code 0.
- **PASS** — `npm run audit:lib-orphans` — no change against the baseline. No
  module was added, so nothing can be reached only by its own test.
- **PASS** — `npm run audit:tenancy-fence-coverage:write` — no change. No
  tenant-scoped read path is touched; the tenant filter the retriever pins is
  not part of the query text.
- **PASS** — `npm run audit:test-ci-coverage:write` — committed census matches
  this run after regeneration. See the attribution note below.
- **PASS** — mutation testing, 9 behavioural mutations, 9 killed (failures per
  mutation, of 634 in the directory): spelling returns the query unchanged [6];
  a consuming capture group instead of a lookahead [1]; the identifier dropped
  and only the words kept [3]; the pattern narrowed to lower case so the
  archetype id is left alone [3]; a caller's `evidenceQuery` respelled too [1];
  the fallback query left unspelled [1]; exhibit and table queries left
  unspelled while section queries are spelled [2]; underscores deleted rather
  than turned into spaces [7]; and, on the consumer side, the retriever's gate
  forced to fire always, which is what proves the gate cases assert the real
  rule [1].
- **NOT RUN** — live signed-in walk. Nothing renders a retrieval query, so there
  is no surface to walk; and the claim this change makes about *recall* cannot
  be settled from a UI. See Known Gaps.
- **NOT RUN** — measurement against a live index. Deliberately out of this
  lane's authority and not required for the two defects above, one of which is
  proven by the index contract in the repo and the other by calling the
  retriever's own gate.

Two mutations initially survived, and in both cases the test was wrong rather
than the code:

- The lookahead-versus-consuming-group mutation passed, because every identifier
  shipped today has segments of two characters or more — and with two-character
  segments, consuming the character to the right of an underscore never eats the
  character the next pair needs on its left. The shape that discriminates is a
  one-character segment (`tier_1_cost` comes back half-spelled as `tier 1_cost`),
  which a configured catalog is free to declare. The case now uses that input.
- A mutation moving the spelling to after the dedupe rather than before it
  survived and **is not a gap**: spelling appends rather than rewrites, so it
  cannot make two different queries equal, and the dedupe therefore sees the
  same collisions on either side of it. The code comment claiming the order
  mattered was wrong and has been corrected rather than given an unkillable
  test.

Census attribution: `testFiles` 2715 → 2721 and `coveredTestFiles` 2551 → 2557
with `uncoveredTestFiles` unchanged. This change adds **no** test file — the
cases were appended to a suite that is already registered — so all six are other
merges' drift, which the committed census picks up because its drift guard runs
on branches only.

## Rollout Plan

Merge to `main` by squash. No migration, no data write, no stored state, no
environment variable, no flag, and no image deploy is required for this to be
correct. It takes effect for a deployment the next time that deployment is built
and deployed from `main` through the repo-owned workflow, at which point the
runtime invariant and the live proof apply to that deploy, not to this merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path that may shift shared web traffic.
- Shared runtime mutators: none in this change. No `az containerapp` command, no
  traffic weight, no revision template edit, no scale or secret change.
- Approved image digest: not applicable — no runtime update is part of this
  release.
- ACA runtime invariant: unchanged; this release asserts no `live-proven` claim.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: none; no flag and no environment variable is
  added or read.
- Live signed-in proof required: no for this merge. A deployment that wants to
  claim improved retrieval in production owes its own measurement against the
  live index, which is a data-lane activity.

## Rollback Plan

Revert the squash commit. The change is one pure function plus the call sites
that apply it, one `export` keyword on an existing function, and test cases;
there is no state, no migration, no stored artifact and no configuration, so a
revert returns every query to the exact text it had before and is complete the
moment the revert is deployed. A partial rollback is available without a revert:
making `spellIdentifiersAsWords` return its argument restores the previous query
text at one line, and that is precisely the mutation the suite kills, so the
tests will say so loudly rather than silently.

## Audit Evidence

- PR: opened against `main` in `abarva-platform/abarva` from
  `moves/evidence-query-vocabulary-20261006`; CI run on the PR head.
- The suite named above, which pins the mechanism against the retriever's own
  exported gate rather than a copied pattern, asserts the whole-catalog
  invariant that every identifier a query carries is accompanied by its words,
  and pins the one input that must **not** be respelled.
- The before/after table in the summary, produced by calling the retriever's
  gate over all 1,661 searches the shipped catalogs build, once on
  `origin/main` and once on this branch.
- `npm run release:check -- --base origin/main --head HEAD` run locally before
  the PR was opened.

## Known Gaps

- **Whether keeping the identifier is worth anything is unproven.** Both
  spellings are carried because the identifier's retrieval value cannot be
  settled from inside the repo: it would take a read of a live index to learn
  whether any document holds a family id verbatim. Keeping it is the choice that
  cannot lose a match that exists today; the cost is query length, which doubles
  in the worst case (999 to 1,999 characters, well inside the query limits).
  Dropping it is a one-line follow-on once someone with data-lane authority has
  measured it.
- **The recall claim is argued, not measured.** That the analyzer joins across an
  underscore is the documented behaviour of the analyzer the index contract
  declares, not something this change observed. The structured-pass figures are
  measured; the prose-matching improvement is inferred from the contract.
- **The two archetype catalogs' evidence-family vocabularies are still
  disjoint and still validated against no dictionary.** A family id that is a
  typo still becomes a search for words nobody uses — now spelled as words,
  which arguably makes a typo retrieve *more* irrelevant prose than an
  unmatchable token did. Naming the vocabulary is the next correctness item in
  this neighbourhood and has been carried on the gap list since the landing
  sites were declared.
- **The retriever's topic list is unchanged and still word-anchored.** Any other
  producer of query text that assembles identifiers has the same defect; only
  this one boundary was audited and fixed. A grep for the fields that carry
  identifiers found no second producer today, but nothing stops one being added.
- **Exhibit and table query text still carries enum values** (`governed_facts`,
  `conceptual_architecture`) that are now spelled out as words and so become
  ordinary search terms. That is the intended consequence of one uniform rule
  over the assembled query, but it means an enum rename changes retrieval text;
  no test guards an enum against being renamed into words that mean something
  else in a corpus.
