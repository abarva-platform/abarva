# 2026-10-03-rls-precondition-cause-discrimination — L4 isolation precondition reports what it observed

## Release ID

`2026-10-03-rls-precondition-cause-discrimination`

## Status

`candidate`

## Plain-English Summary

The database-tier tenant-isolation suite checks, before it probes anything, that it can
resolve every canonical tenant to a row in the client directory. When it could not, it
stopped and said the rows were *missing*, and told the operator to run a canonicalization
migration.

It was not in a position to say that. All it had established was that **the connection it
was running on saw no row**. The client directory has row-level security enabled with a
single policy scoped to the backend service role, so a connecting role outside that policy
reads zero rows whether the rows are there or not. "The row is absent" and "the row exists
and is filtered from here" were both consistent with what the check saw — and the two have
*opposite* remedies. One is a schema change against a shared control database; the other
must leave that database alone and fix the suite's own credentials. Following the message
when the second was true meant mutating a control database that was already correct, on the
authority of a check that could not tell.

This change makes the check report its observation and classify the cause. It now names, in
the refusal: the role that connected, whether row security is actually enforced against that
role on that table, the number of rows the connection can see, and which privileged vantage
it was able to reach. It then reaches one of three verdicts — `absent`, `invisible`, or
`indeterminate` — and only `absent` prescribes the migration. `indeterminate` is a real
answer rather than a shrug: it means both causes remain open from this vantage, and it says
so instead of guessing.

All three remain refusals. A suite that has probed nothing still must not report a pass.

## Layer Impact

**Release lane: `global-control-lane`.** Shared control-plane behaviour — the isolation
suite's precondition and its runner's exit-code classification — with no feature gate. It is
not `client-data-lane`: no schema, RLS policy, seed, ingestion or retrieval path is touched,
and no tenant data is read or written.

- **Layer 4 / test and control tooling.** The isolation suite's precondition and the exit-code
  classification its runner applies. No product surface, no canonical model object, no tenant
  data, and no product read path changes.
- **No data-plane change.** Nothing is seeded, migrated, canonicalized or written. This change
  deliberately does *not* decide whether the rows are present in any live database — it makes
  the check able to answer that question when it is next run.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator tooling and CI only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `tests/security/rls-regression.sql` — the canonical-tenant precondition now gathers the
  table's row-security state, the connecting role's exemptions, and the row count visible to
  that connection; attempts a borrowed-service-role vantage where one is reachable; and raises
  one of three classified messages.
- `src/lib/security/rls-precondition-classification.ts` — **new.** The precondition classifier,
  extracted from the runner so it can be driven by a test rather than grepped for.
- `scripts/run-rls-regression.ts` — imports that classifier instead of carrying a local regex
  keyed to the old sentence. Without this, the new messages would have been reported as suite
  *failures* (exit 1) rather than as unmet preconditions (exit 2).
- `tests/security/test_rls_precondition_cause.ts` — **new.** Drives the shipped SQL against a
  disposable Postgres over a pair of databases the connecting role cannot tell apart.
- `src/__tests__/behaviors/rls-precondition-classification.test.ts` — **new.** The runner's half,
  driven by execution, with the three messages pinned verbatim from the fixture run.
- `tests/security/rls-regression-contract.test.ts` — the stale string pin is updated, with the
  reason recorded inline rather than deleted.
- `.github/workflows/rls-precondition-cause.yml` — **new.** Runs the fixture proof on a
  pull request against a throwaway Postgres service container.

## QA / Validation

**Baseline measured over the same scope, on the merge base, before any edit.**

| Scope | Before | After |
|---|---|---|
| `tests/security/test_rls_precondition_cause.ts` (new fixture suite) | 6 tests, 2 pass, **4 fail** | 6 tests, **6 pass**, 0 fail |
| `tests/security/rls-regression-contract.test.ts` | 4 tests, 4 pass | 5 tests, 5 pass |
| `src/__tests__/behaviors/rls-precondition-classification.test.ts` (new) | n/a | 7 tests, 7 pass |

The two cases that passed in the red run are the controls, and they *should* pass on the merge
base: the fixture-sanity case (both halves of the pair really do look identical from the
connecting role) and the case that requires the precondition to stay silent when the keys do
resolve. The four that failed are the discrimination and the observation.

Separately, the coupling was proved real rather than assumed: with the SQL changed and the
runner untouched, `tests/security/rls-regression-contract.test.ts` went **1 failed / 3 passed**,
which is the stale pin refusing. The explanatory comment left in the SQL does not satisfy that
pin — checked, because a comment satisfying a gate is the exact defect this backlog was opened
against.

**Mutation checks — five, each one applied as a single substitution, each verified to have
changed the file, and each caught behaviourally.**

| # | Deliberate break | Result |
|---|---|---|
| 1 | The `invisible` branch reports `absent` — i.e. the pre-change conclusion | **1 fail**: the invisible case |
| 2 | Remove the privileged-vantage comparison entirely | **2 fail**: invisible and absent |
| 3 | Keep the cause, drop the observed facts from the message | **1 fail**: the observation case |
| 4 | Relax the refusal from `RAISE EXCEPTION` to `RAISE WARNING` | **4 fail**: all three refusals and the observation |
| 5 | Point the runner's classifier back at the old sentence | **2 fail** in the behaviour suite |

Mutation 4 is worth a note, because the first attempt at it was a false catch. A static guard
in the fixture test asserted the extracted SQL still contained `RAISE EXCEPTION`, so relaxing
to a warning failed at import — which *looks* like a catch but proves only that a word is still
in the file. That guard was narrowed so the refusal is proven by driving the block instead. The
mutation is now caught by four behavioural assertions.

A second false signal was found and removed the same way: the fixture's setup hook was not
re-runnable (a role holding granted privileges cannot be dropped), so a second run collapsed in
the hook and reported every case as failing — indistinguishable, from the outside, from a caught
mutation. The hook now sheds what each fixture role owns first, the suite is green across two
consecutive runs, and the workflow runs it **twice** so a regression there cannot pass for a catch.

**What was measured about Postgres, because it decided the design and contradicts the obvious
approach.** Policy role matching is inheritance-aware. Of the three shapes a connecting role can
have against a `FOR ALL TO <service role>` policy:

- an inheriting member of that role sees every row, because the policy applies through the
  membership — it never reaches this precondition at all;
- a non-member sees zero rows **and** is refused `SET ROLE`, so it has no unfiltered read to
  compare against;
- a `NOINHERIT` member sees zero rows and may still borrow the role on demand.

So the positive discrimination is reachable in exactly one of the three shapes, and is *not*
reachable in the shape most likely to be running in the lab today. That is precisely why the
third verdict exists and why it withholds the remedy rather than defaulting to one. A
discrimination by unique-constraint probe would work from any role, and was rejected: this suite
is documented and relied upon as strictly read-only and safe against production, and that
invariant is worth more than a third branch.

**Gates run locally:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
with `tsconfig.tsbuildinfo` removed first — **exit 0**, judged by exit code, not by grepping for
`error TS`. Scoped ESLint over all six changed files — clean. `node scripts/release-check.mjs
--base origin/main --head HEAD`.

**Not verified in this change, and named as not verified:** nothing here says whether the
canonical rows are present or absent in any live database. That question is the separate P0
item this one was required to settle first, and settling it needs a run of the suite in the
private network through its own operator job. No such run was performed, and no isolation claim
is made for any deployed SHA.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys as usual;
the suite file ships inside the runtime image, which is how the scheduled lane reads it. No
migration to apply, no flag to flip, no data build, no worker change. Nothing becomes isolation-
proven as a result of this release — it changes what the next run of that lane is able to say.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`
- Shared runtime mutators: none in this change
- Approved image digest: recorded against the merge SHA after the deploy run completes
- ACA runtime invariant: to be proved after merge — Container App template image, the
  100%-traffic revision image and both delivery-worker job templates matching one digest
- Worker image invariant: same digest as above
- Feature/env flag update path: none
- Live signed-in proof required: **no.** This change has no product surface. The proof it does
  owe is a run of the isolation lane, which is an operator action in the private network.

## Known Gaps

- **Whether the canonical rows are actually present in any live database is still unknown, and
  this change does not answer it.** It makes the check able to answer it on its next run. The
  separate P0 item that question belongs to names this one as its prerequisite, and that item
  stays open.
- **The positive discrimination is unreachable from the role shape most likely running in the
  lab today.** A connecting role that is not a member of the backend service role has no
  unfiltered read to compare against, so it will return `indeterminate` rather than naming a
  cause. That is the honest verdict for that vantage, not a defect — but it means the operator
  action that actually closes the question is to re-run the lane from a vantage that can
  compare. Which vantage the private operator job connects as was not established in this
  change, and is not asserted here.
- **The new workflow names one suite, and a repo control decided which one.**
  `scripts/quality/check-named-suite-requiredness.mjs` — which runs inside the required
  `Behavior coverage floor` job — refused the first version of this workflow, because it named
  the behaviour suite that the required job already sweeps. That makes the quotable line the one
  that cannot block a merge while the blocking line stays anonymous. The workflow now names only
  the contract test, which no required job sweeps; the behaviour suite's result is read out of
  the required job's own log. Caught locally before CI reached it, and the audit now passes.
- **The new workflow is not a required status check.** It runs on pull requests touching the
  named paths, and it passes; whether the branch ruleset requires it is a repository setting,
  not something this PR can change. Until it is required, a future PR could merge past a red
  run of it. Making it required is an operator action and is owed.
- **The three pinned messages are a copy, by construction.** They are checked to be verbatim
  prefixes of the shipped suite's real output, and the contract test holds the suite and the
  classifier to one shared token so a rewording cannot drift silently. But if the suite's
  prose changes, the pins are re-captured from the fixture run — they are not generated.
- **Not run here:** the full repository unit suite. The three affected suites, the typecheck
  and scoped lint were run; wider regression is left to CI.

## Rollback Plan

Revert the PR. The precondition returns to its previous single message and the runner to its
previous regex; the two must move together, which is why they are in one PR. No migration was
applied, so there is nothing to unwind in any database, and no tenant data was touched at any
point.

## Audit Evidence

- PR URL and its CI run, including the new `L4 precondition tells absent from invisible` job
- The red-first baseline and the five mutation results in **QA / Validation** above, each
  reproducible by applying the named substitution and re-running the fixture suite
- The three classified messages, captured verbatim from the shipped SQL driven against a
  disposable Postgres, pinned in `src/__tests__/behaviors/rls-precondition-classification.test.ts`
  and mechanically checked to be verbatim prefixes of that captured output
- `docs/governance` policy unaffected; no dataset manifest required, as no dataset is loaded
