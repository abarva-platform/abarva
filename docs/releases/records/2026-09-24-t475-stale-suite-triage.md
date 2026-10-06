# 2026-09-24-t475-stale-suite-triage — Sixth and last governed-risk stale-suite draw: twelve suites executed, three red, and one green suite a mutation proved is not load-bearing

## Release ID

`2026-09-24-t475-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

The repository has roughly 2,400 Jest suites under `src/`. A measurement script
answers, per file, whether any CI workflow actually reaches it. Four hundred and
seven of them are reached by nothing and have never been looked at. Five earlier
passes picked the highest-risk of those, ran each one by hand, and wrote down
what should happen to it. This is the sixth and last pass the risk ranking can
supply.

Twelve suites were drawn, and each was executed on its own before any judgement
was written. Nine passed and three failed — and the three failures had been
sitting there unseen for six days, sixteen days and seventy-three days
respectively, because nothing runs them.

The part worth reading is what happened to the nine that passed. Passing is not
the same as protecting anything, so each one had a single deliberate break
introduced into the code it tests, and was re-run to see whether it noticed.
Eight noticed. One did not: the contract-evidence persistence suite is titled
"builds a **tenant-scoped** manifest", and when every evidence row was made to
carry a hard-coded tenant instead of the real one, all three of its cases still
passed. The manifest's own tenant fence is checked; the per-row fence, which is
the one that reaches the evidence table, is not. That suite is therefore **not**
credited for CI, and a control beside this record makes it impossible to credit
it later without adding the missing assertion first.

Three findings the draw was not looking for:

1. **One red suite was red for the opposite of the reason expected.** The
   Intelligence read-model suite contains two cases that contradict each other.
   An older one expects a configuration item to be counted as an
   application/service; a newer one, added deliberately in #7795, asserts it must
   not be — and passes. The later, deliberate behaviour is right, so the older
   expectation is stale, not a live defect. The same change added an eighteen-row
   table with one case per documented record-type alias pair, and all eighteen
   pass, so the "a test per aliased pair" half of backlog item 9 is already met.
   Nothing caught the contradiction because the file runs in no CI job.

2. **The risk ranking is directory-grained.** The census computes governed risk
   over every test file in a directory and a file inherits its neighbours' band.
   Measured by calling that same function once per directory and once per file:
   six of the twelve carry the tenant-scoped-read signal on their own imports and
   six inherit it from a sibling. "Twelve highest-risk untriaged suites" should be
   read as "twelve suites inside the highest-risk untriaged directories".

3. **The ranking is exhausted, the debt is not.** It can only rank files in the
   twelve of a hundred and ninety-two directories it assigns any signal to —
   twenty-six files of four hundred and seven, 6.4% of the untriaged unrun
   population. A hundred and eighty directories carry no signal at all, and
   nothing today can tell whether that means "low risk" or "the resolver could not
   follow its imports".

No file judged here was edited. A triage records a verdict and hands it on.

## Layer Impact

Release lane: **`global-control-lane`** — shared control-plane behaviour (a governed
triage record and the control that keeps it honest), applying to every client because
it is not feature-gated. No client-scoped data, schema, RLS, ingestion or retrieval is
touched, so this is not `client-data-lane`.

- **Control / tooling only.** One new governed record under
  `docs/architecture/`, one new behavioural control under
  `src/__tests__/behaviors/`, and two functions in the census script changed from
  private to exported so the record can call the real risk classifier instead of
  keeping a second copy of the rule.
- **No canonical model, product surface, route, prompt or dataset changes.**
  Nothing under `src/app`, `src/components` or `src/lib` product code is touched.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — engineering triage record and its guard.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/architecture/t475-stale-suite-triage.json` — the record. Every count in
  it is read out of a Jest `--json` run by a script rather than typed.
- `src/__tests__/behaviors/t475-stale-suite-triage-record.test.ts` — the control.
  Twenty-one cases, including three new ones this draw forced: a suite cannot be
  credited for CI unless a mutation of its subject was caught; a green suite whose
  mutation escaped is forced to carry `repair` and to say what escaped; and every
  case title the verdict was written about is pinned to the live file, so a suite
  rewritten under a stale verdict turns the control red.
- `scripts/quality/test-ci-coverage-census.mjs` — `controlPaths` and
  `governedRiskForDirectory` exported. No behaviour change; the census output is
  byte-identical and its own suites are unchanged and green.

## QA / Validation

**Re-verification before any code.** The census was re-derived on this base
(`15e0e99945fde5b9fc52b3cdc6cc3466dea60900`) rather than read from the committed
snapshot, as the item demanded. Pool of untriaged and uncovered rows: 26.
Excluding by exact path the 85 distinct paths already judged in the five
committed records leaves exactly the twelve the item names, all band `high`,
score 10, signal `tenant_scoped_read`.

**Correction, recorded rather than restamped.** This run's claim line said 14 of
the 26 were band critical. That is wrong. The 26 split 3 critical / 23 high; it
is 14 rows — 3 critical and 11 high — that a prior record already judged. The
number was real and attached to the wrong property.

**Per-suite execution.** Twelve runs, each `npx jest --runTestsByPath <path>
--no-coverage --ci --json --outputFile`, between 07:42:45Z and 07:42:54Z, before
any verdict was written. Every run reports `numTotalTestSuites` 1, exactly one
entry in `testResults`, and `numTotalTests` greater than zero — asserted, because
a run that matched no file reports zero and a green exit code hides it. Totals:
12 executed, 9 green, 3 red, 64 tests, 59 passed, 5 failed, 0 pending.

**Mutation of the nine green suites — 8 caught, 1 escaped.**

| suite | mutation | result |
|---|---|---|
| data-plane azure-read | select-only SQL guard returns instead of throwing | caught, 1 case |
| data-plane objectStorage | upsert upload condition inverted | caught, 2 cases |
| candidate-supplier registry | empty-tenant fail-closed guard removed | caught, 1 case |
| event-candidate acceptance | acceptance rationale minimum removed | caught, 1 case |
| event-candidate authority | pre-query identity fence weakened OR → AND | caught, 1 case |
| contract-evidence persistence | per-row `tenant_key` replaced with a constant | **ESCAPED, 0 cases** |
| contract-evidence persistence | manifest `tenant_key` replaced with the same constant | caught, 1 case |
| contract-evidence read-model | USD rendering branch made unreachable | caught, 1 case |
| contract-intelligence prompt | unrealized-value evidence rule deleted | caught, 1 case |
| contract-intelligence provenance | client_record claim no longer needs a source ref | caught, 1 case |

The escape was proven to be a real behaviour change and not a no-op edit: a
throwaway probe built the payload under the mutation and printed row-level
`tenant_key` equal to the injected constant, against a manifest `tenant_key` still
equal to the fixture's own. The probe
file was deleted and the tree verified clean with `git status --porcelain`. Every
mutation was reverted the same way and the tree was clean before anything was
written.

**Mutation of the control itself — 8 applied, 8 caught.** Each was applied to a
copy of the record, the control re-run, and the record restored from a
byte-identical backup: promoting the escaping suite to `wire_into_ci` (2 cases
fail); claiming the escaped mutation was caught (2); pinning a case title the
suite does not contain (1); inflating one row's own-import signal (1); declaring
the red-suite control vacuous (1); pointing a credited row's mutation at a module
that does not exist (1); dropping every pinned case title (1); restating a verdict
count (1).

**Red first.** With the record absent — the state of `origin/main` — the control
fails to load: 1 suite failed, 0 tests. It is 21 passed with the record present.

**Scope baseline, `npx jest src/__tests__/behaviors`.** Before, on a tree reverted
to `origin/main`: 114 suites, 0 failing, 1029 tests, 0 failing. After: 115 suites,
0 failing, 1050 tests, 0 failing. Same condition both sides, warm Jest cache.

**A pre-existing race found while baselining, and reported rather than folded in.**
On a cold Jest cache the same directory is red on `origin/main`: three runs out of
three failed 4, 4 and 3 suites, every failure naming
`src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts`. That file is
written and deleted mid-run by `t743-agent-tests-directory-ci.test.ts` — which is
that suite's whole point — and four suites that enumerate and then read every test
file under `src/` race against it. Warm cache: 0 failing, four runs out of four.
The moving count is what distinguishes a race from a broken assertion. Measured on
a reverted tree; filed as T-759, not fixed here.

**Typecheck** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` after removing `tsconfig.tsbuildinfo`: exit 0, judged by the exit code, zero
diagnostic lines. **ESLint** on both changed source files: exit 0. **Census** still
runs: exit 0, output shape unchanged.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` product code changed and
nothing imports `scripts/quality/*` at runtime. The repo-owned ACA deploy workflow
will build and ship the merge commit as it does for any change to `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by this change.
- Approved image digest: whatever the repo-owned workflow produces for the merge
  commit; this change does not select or pin one.
- ACA runtime invariant: to be proven after merge from the deploy run keyed to the
  merge SHA — template image, 100%-traffic revision image and both worker job
  images equal.
- Worker image invariant: same run, same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and none is claimed.** No product surface or
  route changes, so there is nothing a signed-in session could show.

## Rollback Plan

Revert the PR. Three files, two of them new; no migration, no data, no runtime
state. Reverting removes the record and its control and restores the two census
functions to private.

## Audit Evidence

- `docs/architecture/t475-stale-suite-triage.json` — per-suite run counts read from
  Jest JSON, per-suite mutation result, per-suite case titles pinned to the file,
  per-row governed risk as ranked and as derived from the file's own imports.
- `src/__tests__/behaviors/t475-stale-suite-triage-record.test.ts` — the control
  that fails if any of the above stops being true. Runs in the gated behaviours
  directory.
- The five sibling records this draw is asserted disjoint from: `t472`, `t509`,
  `t550`, `t556`, `t742`.
- PR checks on the branch.

## Known Gaps

- **The eight credited suites are not wired into CI by this change.** Wiring is
  T-754 and carries the wiring mutation the five prior draws used. As with every
  prior draw, the triage records a verdict and does not edit what it judges.
- **The one escape is not repaired**, only recorded and blocked from being
  credited. T-755.
- **The two stale expectations are not re-baselined**, only diagnosed with the
  change that made each stale. T-756.
- **The dead enterprise-read loader is not retired or re-wired** — that is a
  decision, not a code choice, and it is named as one. T-757.
- **The census cannot yet distinguish an unclassified directory from an
  unresolvable one.** T-758.
- **The cold-cache race in the behaviours directory is not fixed.** T-759.
- **Census drift is reported by an npm script that no workflow runs**, and the
  committed census is stale by eleven files at this base. T-760.
