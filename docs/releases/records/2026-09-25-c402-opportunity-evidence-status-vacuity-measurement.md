# C-402 — Opportunity evidence status: the predicate is sound, its input is a constant

## Release ID

`2026-09-25-c402-opportunity-evidence-status-vacuity-measurement`

## Status

`released`

## Plain-English Summary

A column on the opportunity-evidence table is declared with five legal values. Four
INSERT statements write that column, and every one of them writes the same value as a
hard-coded literal. Nothing computes it. So four of the five legal values are produced
by nothing, and six database predicates plus one lineage metric are written against a
field whose answer is fixed before they ask.

This release does not change that. It **measures** it, and it makes the measurement a
test that runs on every pull request, because the backlog item this closes part of
opens with "prove the predicate is vacuous before changing it" and that proof did not
exist. Three facts that had only been read off the source are now executed:

1. **The six predicates are correct.** Each one is extracted from its migration's own
   bytes and run against seeded rows. An available row reads `present`; the same row
   with any other legal value reads `missing`. So nothing is wrong with the predicates
   — they are simply never given more than one input.
2. **The lineage metric is correct and uninformative.** Its SQL is extracted from the
   report that defines it and run over mixed rows: 3 rows, 1 available. Over rows the
   writers can actually produce, the "available" count equals the row count for every
   size tried, because the only value any writer binds is the one the filter selects.
3. **The writer population is exactly four and every binding is a literal.** The one
   value they can produce is recorded, the four they cannot are named, and a new
   writer, a removed writer, or a writer that starts computing the value all fail the
   test.

Where the authority for this value should live is deliberately left to the owner, with
the numbers attached. Deciding it needs a before/after distribution from a real
database, which is out of reach of an offline run, and the recommendation below says
what to decide and what it would cost.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** test and documentation only. One new behavioural suite, one new measured
  inventory under `docs/architecture/`, and this record. No product code, no migration,
  no loader, no route, no component, no flag, no schema. Nothing under `src/` imports
  the new file and no runtime path reads the new JSON.
- The suite reads four kinds of repository bytes (three cube migrations, one lineage
  report, four loader scripts, one TypeScript union) and executes the SQL it extracts
  in `node:sqlite`. It opens no socket and needs no credentials.

## Client Applicability

- **All clients:** no runtime change of any kind.
- **Specific clients:** none.
- **Internal only:** yes — a CI control and a measured inventory for engineers.
- **Public/demo only:** no.
- **Feature flag:** none.

## Changes Included

- `src/__tests__/behaviors/c402-opportunity-evidence-status-authority.test.ts` — new.
  19 cases. Lives in `src/__tests__/behaviors` because that directory is swept by
  `npm run coverage:behavior-gate`, which runs inside the required *Behavior coverage
  floor* job; `scripts/source/__tests__`, the natural home by subject matter, is named
  by no workflow and no npm script and would have been dark on arrival.
- `docs/architecture/c402-opportunity-evidence-status-sites.json` — new. The measured
  population: declaration, four writers with bindings, reachable and unreachable
  values, six predicate consumers, one metric consumer, an empty application-consumer
  list with the reason it is empty, and three sibling authorities.
- This record.

## QA / Validation

**The new suite.** `npx jest --runTestsByPath src/__tests__/behaviors/c402-opportunity-evidence-status-authority.test.ts`
— the file did not exist before, so 0 cases before and **19 passed, 0 failed** after.

**Six mutations, six caught.** Each mutation was confirmed to have changed the file
(`git diff --numstat`) before its result was believed. Two of them read as survivors on
the first attempt and were not: the `sed` had matched nothing, so the tree was
unmodified and the green run was a run against clean code.

| # | Mutation | Result |
|---|---|---|
| M1 | Drop the `evidence_status` conjunct from one cube predicate | 2 failed / 17 passed |
| M2 | Drop the `FILTER` from the lineage metric | 1 failed / 18 passed |
| M3 | One writer binds a parameter instead of the literal | 2 failed / 17 passed |
| M4 | Add the fifth value to the computed authority's union | 1 failed / 18 passed |
| M5 | One writer omits the column from its INSERT column list | 1 failed / 18 passed |
| M6 | The declaration's `CHECK` loses one legal value | 1 failed / 18 passed |

**The measurement the backlog item asked for.** All four writer literals were changed
to a different legal value and the same two directories were re-run. Compared as
**sets, not counts** — the failing suite paths and the failing case names were captured
before and after and compared verbatim:

- Scope `scripts/source/__tests__` + `src/lib/source/data-model`, clean worktree from
  `origin/main` `2a4e804ef`: **12 failed / 30 passed suites, 2 failed / 212 passed
  cases before; identical after.** Failing-suite set identical: true. Failing-case set
  identical: true. (Ten of the twelve suite failures are `node:test` files that jest
  cannot collect — environment, not product. The two failing cases are pre-existing on
  `main` and unrelated.)
- The lineage report's own `node:test` suite, which is the only coverage the metric
  has: `node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
  — **18 tests, 18 pass, exit 0 before and after.**
- Repository-wide, exactly **one** test file mentions the literal at all, and it tests
  the computed rule rather than any writer.

So: four writers can be changed to emit a value that makes six readiness predicates
and one lineage metric report the opposite of what they report today, and nothing in
the repository notices. That is the "gates are unguarded" figure the item asked to be
stated rather than asserted.

**The directory the suite joins.** `npm run coverage:behavior-gate` — exit 0,
**130 of 130 suites and 1,229 of 1,229 cases pass** with the new suite included, and
coverage stays above all four floors (lines 91.06 ≥ 90, statements 91.06 ≥ 90,
functions 70.03 ≥ 60, branches 69.73 ≥ 50). This release modifies no existing file, so
the other 129 suites are byte-identical to `main` and their 1,210 cases were green
before by the same run.

**Toolchain.** `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144
npx tsc --noEmit --pretty false` — **exit 0**, 0 diagnostics, judged by exit code with
the build-info removed first. `npx eslint` on the new suite — exit 0.

## What the measurement found that the item did not say

Four corrections and additions, each verified by reading the current tree:

1. **Six predicate sites, not four.** A third migration carries the same pair and the
   item names only two migrations. All six are byte-identical and all six are now
   executed by the suite.
2. **The column has no application consumer at all.** One application query selects
   `evidence.*` from the table, but the mapper beside it projects six other fields and
   drops this one. So the value reaches the process and is discarded. This is the fact
   that most changes the cost of each option below: retiring the column touches
   migrations and one report, not a product surface.
3. **The computed sibling is at a different grain.** The existing rule that derives the
   same spelling of this enum answers it per ledger *kind* over a set of lines, not per
   evidence *row*. Reusing it verbatim would change the grain of the fact, so "extract
   it so one rule has one home" is not the one-line reuse it reads as.
4. **The fifth value is unreachable by construction, not merely unwritten.** The
   TypeScript union for this enum has four members and does not include it; the
   sibling persisted column of the same name has a four-value `CHECK` that also
   excludes it. No rule in the repository can produce it.

One further correction, to a claim made in this run's own claim line before the file
was read: the sibling migration site is a *declaration* of a different table's column,
not a fifth writer. There are four writers, exactly as the item says.

## Recommendation for the decision that stays with the owner

**Derive the column in the loaders, and the rule already exists in the same file.**
About 170 lines below one of the four constants, the same loader computes a *claim*-
level evidence status with a real SQL `CASE`: it counts how many of the evidence row's
source references resolve against the record-snapshot table, and writes one value when
that count is above zero and another when it is not. That is precisely a per-row,
earned evidence status, it is already trusted enough that a live product adapter
filters on its results, and it is expressed in SQL, which a migration-owned projection
can use and a TypeScript function cannot.

So the recommended shape is: the four writers bind the same resolved-reference test
they already compute one function call away — available when the row's reference
resolves, missing when it does not, not-established when the row carries no reference —
and the six predicates keep the text they have, because the measurement above shows
that text is already correct. That resolves the item's "do not leave both" without
inventing a rule and without a new column.

**On the unreachable fifth value:** the recommended rule cannot produce it either, and
neither can any existing derivation. It should be dropped from the `CHECK`, or a
writer that produces it should be named. An enum member produced by nothing is a gate
that cannot fail.

**What is still owed before that change lands, and why it is not in this release:** the
item requires the affected cube's value distribution stated before and after for one
tenant. Every value a cube emits for this field would move, by design — that is the
intended effect and the reason the change needs to be measured rather than reviewed —
and the distribution can only be read from the governed data plane, which an offline
run cannot reach. The projections are migration-owned, so the change is an authored
migration plus its rollback, and the apply stays with the owner.

## Rollout Plan

Merge to `main`. There is no runtime rollout: no image needs to change for this to take
effect, because nothing at runtime reads either new file. The suite begins running on
the next pull request through the *Behavior coverage floor* job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, untouched.
- Shared runtime mutators: none. This release changes no Container App, revision,
  image, env var, flag, scale setting or secret.
- Approved image digest: not applicable — no runtime image change is required.
- ACA runtime invariant: unaffected; no deploy is needed for this release to be true.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** The release adds a test and a document; there
  is no rendered surface, no route and no answer path, so a signed-in pass would have
  no subject.

## Rollback Plan

Revert the pull request. Deleting the two new files and this record returns the
repository to its prior state exactly; no migration, data or runtime state is involved.

## Audit Evidence

- The pull request and its checks.
- The new suite, which recomputes every number in the QA section from the repository on
  each run rather than storing them.
- `docs/architecture/c402-opportunity-evidence-status-sites.json` — the measured
  population, with the reason line numbers are recorded but not asserted.

## Known Gaps

- **The defect is measured, not fixed.** Four writers still bind a literal; four of five
  legal values are still produced by nothing; the six predicates and the one metric are
  still vacuous in production. The authority decision, the fate of the unreachable
  value, and the authored migration all remain open, and the item stays open with this
  record as the measurement it asked for first.
- **The cube distribution is not stated.** It needs the governed data plane.
- **The inventory records the current state, so it must be updated in the change that
  fixes this.** The suite will fail and name itself when a writer starts computing the
  value, which is the intended behaviour: the measurement moves in the same commit as
  the fix.
- **The repository's existing enum-reachability audit answers only one direction.** It
  proves that no comparison targets a value the `CHECK` forbids, and it passes clean
  today. It does not ask whether a permitted value is produced by nothing, which is
  this defect. Widening it repository-wide is well outside this item and is filed
  separately.
