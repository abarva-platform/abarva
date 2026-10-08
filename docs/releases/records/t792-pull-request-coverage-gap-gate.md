# 2026-10-05-pull-request-coverage-gap-gate — A suite that could fail no merge, and a gate on that state

## Release ID

`2026-10-05-pull-request-coverage-gap-gate`

## Status

`candidate`

## Plain-English Summary

One unit test in this repository was run by CI, passed, and could not have stopped
anything. It was reached only by a workflow that fires on manual dispatch and after a
deployment has already happened — so it ran green *after* the deploy it might have
stopped. To a reviewer, that looks identical to a test that is protecting something.

This change does two things. It adds a pull-request-triggered invocation for that test,
so a change that breaks it now fails before merge. And it adds a check that fails when
*any* test file is in that state, so the next one is caught automatically instead of by
accident.

The underlying measurement already existed and was read by nothing. The coverage census
prints two numbers side by side — how many test files a workflow runs, and how many a
pull-request workflow runs. Those numbers differed by one. No script, workflow, or gate
consumed the difference, and the committed census recorded only the totals, not which
file was in the gap, so identifying it required recomputing the census from internals the
module does not export.

## Layer Impact

Release lane: `global-control-lane` — shared CI and test-control behaviour for all
clients, with no feature gate. No client data, schema, tenant scope or product surface is
touched.

- **Test and CI control plane** — a new check and its own behaviour suite, one exact test
  path added to an existing pull-request job, two steps added to an existing
  pull-request-triggered workflow, and the committed coverage census refreshed. This is
  backlog lane T (tests, validators, CI and platform tooling).
- **Layer 4 (products)** — no product behaviour changes.

No product layer changes. No canonical model, adapter, intake, or product surface is
touched. No runtime code is modified: the only source file involved is read by the test,
not changed.

## Client Applicability

- All clients: no change. Nothing client-visible, no tenant data, no rendered surface.
- Specific clients: none.
- Internal only: yes — CI behavior only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/check-pull-request-coverage-gap.mjs` (new) — fails when any test file
  is reached by a workflow and by no `pull_request` or `merge_group` workflow. Exports the
  predicate so it is testable without a census run.
- `scripts/quality/check-pull-request-coverage-gap.test.mjs` (new) — twelve cases over the
  predicate, its verdict text, and the resolver caveat.
- `.github/workflows/unit-suites.yml` — adds a step running
  `src/lib/ecl/__tests__/product-provider.test.ts` by exact path. The pre-deploy gate
  keeps its own invocation; this adds the merge-blocking one it never had.
- `.github/workflows/test-ci-coverage-census.yml` — runs the new check and its own test on
  every pull request and merge group.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

Measured against `main` at `10fbd48e7d`, merged into this branch. Every number below is from a
command run in this change, over the same scope before and after, and re-measured on each new
base rather than carried forward — `main` moved three times while this was open.

**The defect, measured.** A fresh census on the unmodified base:

```
testFiles 2714   coveredTestFiles 2550   pullRequestCoveredTestFiles 2549
```

One file accounts for that difference, and on this commit it is the only instance in
2,714 test files:

```
src/lib/ecl/__tests__/product-provider.test.ts
  covered: true, pullRequestCovered: false, via: ["script-file"]
```

Its only reach was `COMMAND_CHECKS` in
`scripts/ecl/run_product_ecl_predeploy_gate.mjs`, whose only caller is
`ecl-product-live-proof.yml` — `workflow_dispatch`, and `workflow_run` after a deploy
completes. Neither trigger is `pull_request` or `merge_group`.

**The new gate fails before the fix and passes after.** Exit codes read directly, not
through a pipe:

```
base, before wiring:   exit 1, names the file
after wiring:          exit 0, "pull-request coverage gap: none"
```

**The gate can fail — eight mutations of its predicate, verdict and caveat, all killed.**
Each mutation run as its own command, against its own baseline:

| mutation | result |
|---|---|
| drop the `covered === true` conjunct | 3 of 9 failed |
| `!file.pullRequestCovered` instead of `!== true` | 1 of 9 failed |
| truthy `file.covered` instead of `=== true` | 1 of 9 failed |
| drop `via` from the reported row | 1 of 9 failed |
| verdict always reports "none" | 2 of 9 failed |
| caveat printed unconditionally | 2 of 12 failed |
| caveat never printed | 1 of 12 failed |
| caveat default flipped on | 1 of 12 failed |

Restored baseline: 12 of 12 passing. The first mutation is the one worth stating — without
the `covered` conjunct the check sweeps in all 164 files that run nowhere at all, under a
message saying they run green after a deploy, which they do not. That population is a
different defect with a different remedy and is already reported as `uncoveredTestFiles`.

**The wiring is mutation-proved, not merely green.** Replacing the new step with
`echo skipped` and re-measuring:

```
step present:  coveredTestFiles 2550   pullRequestCoveredTestFiles 2550   gate exit 0
echo skipped:  coveredTestFiles 2550   pullRequestCoveredTestFiles 2549   gate exit 1
```

`pullRequestCoveredTestFiles` moves by exactly one and `coveredTestFiles` does not move at
all. That difference is the whole of what was wrong with this file; a change moving both
counts would have wired something else. After the fix the file's `via` reads
`["command", "script-file"]` — the pre-deploy invocation retained, the pull-request one
added.

**The wired suite was run before wiring, and is not vacuous.** 1 suite, 4 tests, 0
failures, 0.066s. It is a behavioural suite and not a source-text scanner: 0 `readFileSync`
and 0 `toContain` in 47 lines. Proved against three inversions of the fence it guards,
each run as its own command, 4 of 4 passing in each baseline:

| inversion | result |
|---|---|
| `allowLegacyQuery` hard-coded `true` | 1 of 4 failed |
| the explicit-ECL-request branch removed | 1 of 4 failed |
| the environment rollback to legacy disabled | 1 of 4 failed |

The first is the governed one: it is what keeps a `legacy` provider request from routing
product reads off the ECL serving provider without the named diagnostic override.

**Census refresh, with the delta attributed.** The committed census was already five test
files stale before this change, from other merges. Decomposed rather than quoted as one
number:

| | testFiles | covered | pullRequestCovered | uncovered |
|---|---|---|---|---|
| committed on `main`, before | 2714 | 2550 | 2549 | 164 |
| measured on `main`, before this change | 2714 | 2550 | 2549 | 164 |
| committed, after | 2714 | 2550 | 2550 | 164 |

**The pre-existing lag is now zero**, so the artifact's diff in this change is a single line and
that line is this change: `pullRequestCoveredTestFiles` 2549 -> 2550, with `testFiles`,
`coveredTestFiles` and `uncoveredTestFiles` all unmoved. The lag read +5/+5/+5 when this branch
opened, then +1/+1/+1, then +2/+2/+2, and is zero now because siblings refreshed the artifact
three times while this was open and the last refresh caught up with the tree. It was restated
against the current base each time rather than carried forward — which is what makes it possible
to say the remaining one-line diff is attributable to this change and nothing else. The committed artifact's diff is three lines,
all counts; the coverage shape did not change. `audit:test-ci-coverage:check` exits 0.

**The resolver caveat.** The census credits coverage only through commands it could resolve
and publishes `indeterminateInvocations` for the rest; its own method note says coverage is
an upper bound while that set is non-empty. The same caveat reaches this gate, so an
unresolved invocation could make a genuinely reached file look like a wiring gap. The gate
still fails rather than abstaining — the census fails its own run rather than skipping a
list it cannot resolve, and a gate that goes quiet on an input it cannot read is the shape
this backlog exists against — but it prints the unresolved count beside the finding so a
resolver gap cannot be booked as a wiring gap. The set is 0 on this commit, so the branch
is exercised by its test and not by the repository.

**Other checks.** `npx eslint` on both new files: exit 0, no findings. Both modified
workflows parse as YAML. Typecheck run over the repository; no TypeScript file is modified
by this change.

## Rollout Plan

Merge to main. No runtime rollout: no image build, no Azure Container Apps deploy, no
migration, no flag. The change takes effect on the next pull request, which is when the
new steps first run.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy workflows,
runtime images, flags, environment variables, worker jobs, traffic, DNS, or environment
promotion. It adds two steps to pull-request-triggered CI workflows and changes no
runtime.

- Repo-owned deploy workflow: not involved.
- Shared runtime mutators: none.
- Approved image digest: not applicable, no runtime change.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no — nothing rendered or served changes.

## Rollback Plan

Revert the commit. The two new workflow steps stop running, the new check and its test are
removed, and the census artifact returns to its previous counts. Nothing persists outside
the repository, so there is no state to unwind and no migration constraint.

## Audit Evidence

- The PR and its CI run, including the two new steps in `Test CI coverage census` and the
  new step in `Unit suites`.
- `node scripts/quality/check-pull-request-coverage-gap.mjs --json` — prints both census
  counts and the gap, so the assertion is checkable in one command.
- `node --test scripts/quality/check-pull-request-coverage-gap.test.mjs` — 12 of 12.
- `npm run audit:test-ci-coverage:check` — exit 0 against the refreshed artifact.

## Known Gaps

- **The gate's job is not a required status check.** `Test CI coverage census` is not among
  the 19 contexts the `main` ruleset requires, and neither is `Unit suites that pass on
  main`, which carries the new wiring step. Both run on `pull_request`, so both are visible
  on every PR and both can go red — but under the current speed-mode ruleset a red
  non-required check does not block a squash merge. The census's own definition of
  `pullRequestCovered` is about the trigger, not the required-check roster, and this change
  closes the gap by that definition. Promoting either job into the required set is a
  repository-settings decision and is not taken here.
- **The two known earlier instances were found by accident; this gate replaces that
  mechanism but not the ranking's blind spot.** The governed-risk directory ranking cannot
  surface a file in a fully covered directory, which is why this one survived eleven triage
  rounds. The new check is a function of the whole tree and does not depend on a draw, but
  the ranking itself is unchanged.
- **An id-range decision is owed.** Claude Code's `T-500`–`T-599` and the shared
  `T-400`–`T-499` bands are both 0 of 100 free, so the backlog's id-band rule has no number
  left to allocate in this lane. `T-792` was taken from a gap inside the already-used range
  after verifying it is unspent in the backlog, the claim register, the pulse file and the
  repository. That is a stopgap, not a rule; the band allocation needs widening.
- No change to the counts gate. Turning census count drift into a failure remains
  explicitly reserved, per the decision recorded at the top of
  `test-ci-coverage-census.yml`, and this change does not touch it.
