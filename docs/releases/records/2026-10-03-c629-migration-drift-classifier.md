# 2026-10-03-c629-migration-drift-classifier — the nightly drift check tells a finding apart from a failure to look

## Release ID

`2026-10-03-c629-migration-drift-classifier`

## Status

`candidate`

## Plain-English Summary

Every night a read-only job compares the migration files in this repository
against the ledger of migrations the database records as applied, and reports
whether they agree. On 2026-10-03 that job went red with "2 migrations
committed but not applied". **That verdict was correct**, and the two
migrations are named below; the red is a real finding, not a broken check.

But the code that reached that correct verdict could not have reached three of
its four other verdicts correctly, and the ways it failed are each a way for a
monitor to look like it is working:

1. **"No drift" was concluded from a missing sentence, not a present one.**
   The migration runner prints a positive marker when everything is applied.
   The check never looked for it — it looked for the *absence* of the drift
   header instead. So a run whose log was cut off part-way, or whose inner
   output was lost, was reported as "all migrations in the repository are
   recorded as applied", **and exited 0**, so the nightly passed green. The
   workflow's own comment says a check that could not reach the database has
   found nothing, not "nothing wrong". The clean branch was the one place that
   rule was not applied.

2. **Two real findings were reported as "the check could not run."** The
   runner has two other things it can discover: that an already-applied
   migration file was edited after it ran (the ledger no longer describes what
   actually executed — the more serious of the two drift kinds), and that a
   pending migration contains destructive SQL nobody has audited. Both leave
   the runner with a non-zero exit code by design, and a non-zero exit was read
   as a harness failure. The operator was told to go and check the Azure login
   and the database secret, for a finding the run had actually made.

3. **The headline count was re-derived instead of read.** The runner states how
   many migrations are pending. The check threw that number away and recounted
   by matching filenames against a 14-digit-timestamp pattern. 42 of the 392
   migration files here use a three-digit prefix instead, so a pending legacy
   migration was dropped from both the list and the count — and if only such
   migrations were pending, the summary would have read "**0** migration(s)
   committed but not applied" while still failing the job: a drift verdict
   naming no migration at all.

The classifier now lives in a repo-owned script with a behavioral test that
drives it over all five log shapes, it requires a positive marker before
reporting clean, it keeps the five outcomes apart in the exit code as well as
the wording, and it reads the runner's own count.

## Layer Impact

**Release lane: `internal-admin`.** This is an AbarVa-only operations
capability — a nightly monitor an operator reads. It is not
`global-control-lane`: no shared app or control-plane behavior any client
reaches changes, feature-gated or otherwise.

- **Layer 4 — products:** none. No product surface, route, read model or
  tenant-facing behavior changes.
- **Platform / CI tooling:** the nightly migration-drift workflow and one new
  CI script. Read-only throughout; this lane runs `db:migrate:dry` and nothing
  else, and that is unchanged.

No canonical model, adapter, intake or tenant data is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — an operator-facing CI control
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/ci/classify-migration-drift.mjs` — new. Classifies a dry-run log
  into `CLEAN` (exit 0), `DRIFT_PENDING` / `DRIFT_LEDGER` / `DRIFT_BLOCKED`
  (exit 1) or `NOT_CHECKED` (exit 2). Findings are evaluated **before** the
  wrapper's exit code, deliberately: two of them exit non-zero by design, so
  reading the exit code first is precisely how a finding came to be reported as
  a failure to look.
- `.github/workflows/migration-drift-nightly.yml` — the `Classify result` step
  calls that script instead of re-implementing it in 40 lines of inline bash.
  The reasoning behind each of the five outcomes is kept in the workflow as a
  comment so the next reader does not have to re-derive it.
- `src/__tests__/behaviors/c629-migration-drift-classifier.test.ts` — new, 11
  cases. Drives the real CLI as a child process over log files the test writes,
  so it needs no database, no Azure and no private network. Case 1 uses the
  live run's own log bytes, including the Azure container-log line prefixes,
  which nothing previously exercised. Case 11 asserts the workflow actually
  invokes the script and that the replaced inline regex cannot come back.

## QA / Validation

**The finding itself, re-verified before any code was written.** Run
`37121960240`, `schedule`, head `26a2ed5c68`, `createdAt`
2026-10-03T12:09:34Z, `updatedAt` 2026-10-03T12:12:48Z, conclusion `failure`
at step 10 `Classify result`. Evidence artifact 11273289968,
`dry/04-logs.txt`:

```
Pending migrations (2):
   - 20261002060000_home_active_assessment_tenant_fk.sql
   - 20261002172500_source_nda_esign_envelopes.sql

(--dry mode, no changes)
```

and `dry/summary.json`: `"status": "Succeeded"`, `"ok": true`, image
`acrabarvalab001.azurecr.io/abarva/web@sha256:1085c95a1e6a8e7a3570ef75c61df500350941444f5753f438fb90539750148b`,
script `db:migrate:dry`, container `db-migrate`. So the operator job ran to
completion and the comparison is real: **the migrations directory and the live
`schema_migrations` ledger disagree on exactly those two rows, and the
repository side is the right one** — both are committed and unapplied. Applying
them is a separate, mutating dispatch; see Known Gaps.

`npm run db:migrate --dry-run` from this machine is not an available second
opinion: the control database sits on a private Azure network that localhost
cannot reach, which is the entire reason this workflow goes through an operator
job. The `db:migrate:dry` output quoted above **is** that comparison, run on
the deployed image through that job.

**Verdict preserved on the real input.** Replaying `dry/04-logs.txt` through
the new classifier returns `DRIFT_PENDING · 2 migration(s) committed but not
applied` naming both files — identical to what the live run reported. The
replaced logic, extracted verbatim to a scratch script and run on the same
bytes, returns the same thing. Nothing about the one input the nightly has
actually seen changes; the fix is about the four it has not.

**Old versus new, same three inputs, same commands.** The replaced inline
classifier was run verbatim beside the new one:

| input | old verdict | old exit | new verdict | new exit |
|---|---|---|---|---|
| log truncated after the connect line, wrapper rc 0 | `CHECKED, NO DRIFT · All migrations in the repository are recorded as applied` | **0 (green)** | `NOT_CHECKED` | 2 |
| `Migration drift detected`, wrapper rc 1 | `NOT CHECKED · the check could not run` | 1 | `DRIFT_LEDGER`, names the file | 1 |
| `Pending migrations (1):` naming `054_program_demo_users.sql` | `DRIFT · **0** migration(s)`, empty list | 1 | `DRIFT_PENDING · 1 migration(s)`, names the file | 1 |

The first row is worse than the item describes: it is not merely a misleading
summary, it is a **green nightly**.

**Red first.** The suite was written against a CLI that did not exist:
`11 failed, 11 total`. After the script: `11 passed, 11 total`.

**Five deliberate breaks, each hash-verified as having actually changed the
file, each restored to the pristine hash afterwards** — a mutation that changes
nothing reads exactly like one that was caught:

| mutation | cases failed |
|---|---|
| A · check the wrapper exit code before the findings (the original defect) | 2 |
| B · fall through to `CLEAN` instead of `NOT_CHECKED` (the false clean) | 1 |
| C · restore the 14-digit timestamp regex for name extraction | 1 |
| D · collapse `NOT_CHECKED` onto the finding exit code | 4 |
| E · unwire the script from the workflow | 1 |

**Same-scope baseline, measured on both sides rather than read off a log.**
`npx jest src/__tests__/behaviors --no-coverage --ci`, with the before-numbers
taken by moving the two new files aside and restoring the workflow to pristine
`465f1e421f`, then restoring mine and confirming all three files by sha256:

- before: `179 passed, 179 total` suites / `1870 passed, 1870 total` tests, exit 0
- after: `180 passed, 180 total` suites / `1881 passed, 1881 total` tests, exit 0

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit
**0**, `0` occurrences of `error TS`, judged by exit code. `npx eslint` on both
new files exit **0**.

**One repository rule broken by this change, caught by its own gate, and fixed
the way the rule prescribes.** The first version added a step to this nightly
that ran the new behavioral test by name before trusting the classifier. That
is forbidden: `named-suite-requiredness` refused it —

> `named by "Compare migrations dir against live schema_migrations" in
> .github/workflows/migration-drift-nightly.yml, which does not block a merge`
> / `already run by required "Behavior coverage floor"`

— because the quotable line would then belong to a run with no authority to
block, which is the exact failure mode `docs/ci/README-suite-wiring.md` exists
against. Measured: `1 failed, 179 passed, 180 total` with the step, `180
passed, 180 total` without it. The step was dropped rather than the rule
bent, and the workflow now carries a comment recording why a step naming that
suite must not come back. The test still runs on every pull request inside the
required `Behavior coverage floor` job, which is strictly stronger than a
nightly-only step.

## Rollout Plan

Merge to `main`. No image build, migration apply, flag or env change is needed
for this to take effect: the workflow reads its own definition from the default
branch on the next scheduled run, and the behavioral test runs on the next pull
request. The first scheduled run after merge is at 07:00 UTC.

## Deployment Authority

- Repo-owned deploy workflow: not applicable. This changes no runtime, image,
  flag, env var, scale, secret or traffic weight.
- Shared runtime mutators: none. The nightly lane remains read-only and still
  runs `db:migrate:dry` and nothing else.
- Approved image digest: unchanged; this release does not deploy.
- ACA runtime invariant: not asserted and not required — no runtime is touched.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** There is no product surface here. The
  acceptance proof is a scheduled run of the workflow, listed in Known Gaps.

## Rollback Plan

Revert the single commit. The replaced inline classifier returns with it, and
no state anywhere has to be undone — nothing was applied, migrated, deployed
or written outside the repository.

## Audit Evidence

- The run that found it: `https://github.com/abarva-platform/abarva/actions/runs/37121960240`
- Its evidence artifact: `https://github.com/abarva-platform/abarva/actions/runs/37121960240/artifacts/11273289968` — `dry/04-logs.txt` and `dry/summary.json` are the two files quoted above
- The behavioral test, runnable without any credential:
  `npx jest --runTestsByPath src/__tests__/behaviors/c629-migration-drift-classifier.test.ts --no-coverage --ci`
- The replay that shows the live verdict is preserved:
  `node scripts/ci/classify-migration-drift.mjs --rc 0 --log <artifact>/dry/04-logs.txt`
- The next scheduled run of `Migration drift · nightly prod check` after merge

## Known Gaps

- **The drift itself is still present and is not closed by this release.**
  `20261002060000_home_active_assessment_tenant_fk.sql` and
  `20261002172500_source_nda_esign_envelopes.sql` are committed and unapplied.
  Applying them is a mutating dispatch of `db-migration-lab.yml` with
  `mode=apply`, which requires an explicit confirmed dispatch and is outside
  what this lane may run. It is **owed**, not done, and the nightly will keep
  reporting `DRIFT_PENDING` — correctly — until someone applies them.
- **No run of the repaired classifier exists yet.** It is proven by its
  behavioral suite over all five shapes, and by replay against the live log,
  but the first scheduled run on `main` has not happened. Until it has, this
  record is `candidate`: merged is not deployed and deployed is not
  live-proven.
- The clean path's own caveat is unchanged and worth repeating: this control
  compares the migrations directory against the `schema_migrations` ledger. A
  migration recorded as applied whose objects are absent from the database is
  still not detected by anything.
- `migration-drift-pr.yml` was checked and does **not** share this classifier
  — the `Pending migrations` marker had exactly one consumer. No second site
  needs the same repair.
