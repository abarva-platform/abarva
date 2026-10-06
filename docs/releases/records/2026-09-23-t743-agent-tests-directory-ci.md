# 2026-09-23-t743-agent-tests-directory-ci — Run the agent-runtime unit suites by directory, not by name

## Release ID

`2026-09-23-t743-agent-tests-directory-ci`

## Status

`candidate`

## Plain-English Summary

`src/lib/agent/__tests__` holds 33 test suites covering the agent runtime — tenant guardrails,
untrusted-content handling, restricted-output policy, retrieval leak checks, response shape. CI ran
five of them. The other 28 ran nowhere, and nothing in the repository had declared them skipped.

Nobody decided that. The suites were wired into CI by naming files one at a time, as each became
somebody's item, and a command that names three files cannot name a fourth file written afterwards.
Every suite added to that directory since those commands were written fell outside CI by omission.
That is the same shape as the incident this backlog exists against: a control that is not run is
indistinguishable from a control that does not exist.

This change names the **directory** once, in a job that runs on every pull request. The 33 suites
that exist today are reached, and so is the 34th, whenever somebody writes it, with no workflow
edit. The whole directory runs in under a second, so the cost is not the reason it was not done.

Before wiring anything, the nine suites nobody had yet judged were executed individually: 73 tests,
73 passed. An unexamined red suite swept into a blocking job is how a lane gets stuck, so the
examination came first.

## Layer Impact

Release lane: **`global-control-lane`** — shared control-plane behaviour (CI coverage of the agent
runtime's own suites), applying to every client because it is not feature-gated. No client-scoped
data, schema, RLS, ingestion or retrieval is touched, so this is not `client-data-lane`.

- **Control plane / CI tooling only.** No product code, no data plane, no runtime behaviour, no
  schema, no tenant data. Two workflow files, one committed census, two behavioural control suites
  and one evidence record.
- **No canonical model impact.** Nothing under `src/lib/**` or `src/app/**` is edited; the suites
  under judgement are run, not changed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI coverage of the agent-runtime unit suites
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — the step that named three files from
  `src/lib/agent/__tests__` is replaced by `npx jest src/lib/agent/__tests__ --runInBand`. This job
  has no `paths:` filter, so it runs on every pull request.
- `.github/workflows/atlas-quality.yml` — the two steps naming
  `retrieval.azure-context.test.ts` and `visible-answer-contract.test.ts` are removed, along with
  the two `paths:` entries that existed for them. Both suites are still run, by the required job
  above. See **QA / Validation**: this removal is not a tidy-up, it is the remedy an existing
  control demanded.
- `src/__tests__/behaviors/t743-agent-tests-directory-ci.test.ts` — new. Holds the directory wire
  in place, including a case that writes a suite the workflow has never heard of and re-measures
  coverage.
- `src/__tests__/behaviors/t557-unrun-suite-wiring.test.ts` — updated for three files whose wiring
  mechanism changed. Not weakened; see below.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.
- `docs/architecture/t743-agent-tests-directory-wiring.json` — the evidence record: per-file
  execution counts, mutation results, census arithmetic, and the three control collisions.

## QA / Validation

**Re-verified on `origin/main` `54f8dde70` before any edit, by executing the census rather than
reading it:** `src/lib/agent/__tests__` — 33 test files, 5 covered, 28 untriaged and unrun, 0
declared quarantines, `high` governed-risk band.

**The nine unjudged suites, executed one at a time before anything was wired.** T-742 had judged 19
of the 28; these are the other nine. 9 suites, 73 tests, 73 passed, 0 failed, 0 pending. Per-file
counts are in the evidence record.

**The directory as a unit** — because nine files passing separately does not prove they pass
together, and together is what CI does: `npx jest src/lib/agent/__tests__ --runInBand` → 33 suites,
592 tests, 592 passed, 0 failed, 0.84s.

**Red first, then green, on the new control.** Before the workflow change: 3 failed / 3 passed of 6.
After: 6 passed / 0 failed. The most useful of the three failures is the last case, which adds a
34th suite to the directory and re-runs the census: it read `5 of 34 covered` before the change and
reads fully covered after. That is the acceptance's own sentence — a file that does not exist yet is
reached — answered by measurement rather than by reading the workflow.

**Four mutations, four caught**, baseline restored to 6 passed after each:

| mutation | cases that failed |
|---|---|
| restore the three named files in place of the sweep | 3 |
| delete the sweep step entirely | 3 |
| keep the sweep, but give its workflow a `paths:` filter | 1 |
| create a sibling directory the jest path regex also selects | 1 |

**Scope baseline over the same scope, both sides.** `npx jest src/__tests__/behaviors`: **112
suites, 1009 tests, 0 failing before → 113 suites, 1013 tests, 0 failing after.** The "before" was
taken in this worktree with the workflow restored to `HEAD` and the new guard removed, not quoted
from memory. Nothing was failing on either side, so no pre-existing failure is being carried.

**Three existing controls went red on this change. All three were resolved by discharging what they
asked for, and none by relaxing an assertion.**

1. `named-suite-requiredness.test.ts` — *"2 named suite(s) in a non-required job"*. Once the required
   job swept the directory, the two steps in `atlas-quality.yml` became suites named in a job that
   does not block a merge while a required job already runs them, which that control refuses: the
   quotable line ends up being the one with no authority. Its own message names the remedy — *"drop
   it and read PASS &lt;path&gt; out of the required job's own log"* — and that is what was done.
2. `t557-unrun-suite-wiring.test.ts` — six cases demanding that three of this directory's files be
   named by **exact path**, with a comment saying a directory sweep *"would cover the file and leave
   this empty, which is the distinction the acceptance turns on"*. That is a real conflict between
   two items, not a stale test, so it was settled explicitly rather than edited away. T-557 requires
   exact paths because, in *its* draw, an ancestor sweep would also have wired three suites verdicted
   `rewrite_as_behavior` — "reached" had to mean "named individually" or its negative cases meant
   nothing. That reason is intact and still governs the other ten files. It does not hold here: this
   directory has no withheld file and no `rewrite_as_behavior` file, and all 33 suites were executed
   before the sweep was written. So the three files move into a partition whose cases assert the
   same **subject** — on disk, absent from the unrun set, reached by a pull-request command — while
   allowing that command to be the ancestor directory, and the partition's own size is pinned (10
   exact-path / 3 directory) so it cannot quietly become a case about nothing.
3. `test-ci-coverage-census.test.ts` — the committed census no longer described the repository.
   Refreshed with `npm run audit:test-ci-coverage:write`.

**Census arithmetic, with the part this change did not cause split out.** The committed census was
already stale by +7 test files before this change, and refreshing folds that in.

| | committed before | committed after | pre-existing drift | caused here |
|---|---|---|---|---|
| test files | 2401 | 2409 | +7 | +1 (the new control) |
| covered | 1917 | 1954 | +8 | +29 |
| uncovered | 484 | 455 | −1 | −28 |
| untriaged unrun | 435 | 406 | — | −28 |
| `high` governed-risk directories | 12 | 11 | — | −1 |

**Typecheck** `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` → **exit 0**, judged by exit code (a bare run exits 134 on this machine and emits no
diagnostics). **ESLint** over both changed suites → exit 0.

**CI, on the pull request** — the acceptance requires the new-file proof to be watched rather than
read, so a deliberately failing throwaway suite was pushed into the directory and the run observed;
see **Audit Evidence** for the run ids and the result.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is imported by `src/**` product code,
and no image, flag, environment variable, migration or worker job is touched. The deploy workflow
will run on the merge commit as it does for any merge, and that deploy carries no behaviour from
this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image behaviour changes
- ACA runtime invariant: proved on the merge commit as part of the ordinary main deploy; recorded in
  the pulse entry for this item
- Worker image invariant: unchanged
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — this release changes no product surface

## Rollback Plan

Revert the pull request. The only effect is that CI stops running 28 agent-runtime suites and the
census returns to reporting the directory as partially covered; no runtime state, data or schema is
involved, so rollback is a single revert with no migration constraint.

## Audit Evidence

- Pull request and its full check list
- `docs/architecture/t743-agent-tests-directory-wiring.json` — per-file execution counts, mutation
  table, census split, control collisions
- The CI run in which the directory sweep went **red** on a throwaway suite added to the directory
  with no workflow edit, and the following run in which it went green once the file was removed
- `src/__tests__/behaviors/t743-agent-tests-directory-ci.test.ts` in the required job's log

## Known Gaps

- **`T-744` is not closed by this release and is not made worse by it.** One case in
  `module-v6-answer-contract.test.ts` asserts route behaviour by reading route source text. The
  sweep runs that suite, so the case now executes in CI where it did not before — which is better
  than unrun and still not a behavioural proof. T-744 owns replacing it.
- The five suites this directory already had in CI are now reached through the directory rather than
  by name. Anyone reading a workflow for a file path will no longer find them there; the census and
  the two control suites are the place that answers "is this file reached", and both were used here
  rather than a grep.
- The `high` governed-risk band still holds 11 directories. This closes the second-ranked one; the
  ranking's top entry, `src/__tests__/integration`, is unaffected by this change.
