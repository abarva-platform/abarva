# 2026-10-03-c627-rls-regression-classifier — Make the L4 RLS result verdict a control that runs

## Release ID

`2026-10-03-c627-rls-regression-classifier`

## Status

`candidate`

## Plain-English Summary

The nightly database-tier tenant-isolation check was red, it was the only run of
that workflow in the last 200, and nothing on file said why. This change answers
that, and repairs the part of the check that decides what a run means.

**What the red run actually was.** The harness, not a finding. The isolation
probes never executed: the suite connected, hit a data precondition it requires
before probing, and stopped. So tenant-isolation state for that database is
genuinely *unknown* — it is not a confirmed cross-tenant leak, and it is also
not clean. The workflow reported that correctly, so the half of the item that
asked for the three outcomes to be told apart was already in place.

**What was not in place.** Anything that could test it. The step that decides
GREEN versus LEAK versus NOT CHECKED was eighty-five lines of shell written
inline in the workflow file, deciding a tenant-isolation verdict by first match
over four independent text searches, with no test anywhere and no way to fail in
review. Two inversions it allowed:

1. **A pass could be asserted without a successful run.** The step read the
   isolation suite's own "passed" marker out of the job log and stopped there. It
   captured the exit code of the process that submits and supervises the
   database job, and then used that code in a single line of display text and
   nowhere else. That supervisor fails on its own post-run work — extracting
   proof, sealing, returning the job to idle — independently of whether the
   probe itself passed or failed. So "the probes printed a pass and the run then
   failed" produced a green gate, which is a release on a boundary nobody
   proved.

2. **A real finding could be reported as "could not tell."** The branch for an
   unmet precondition was evaluated before the branch for a detected leak. Both
   are plain text fragments of database error output that this suite's authors
   extend whenever they add a new check, and "could not tell" is the only state
   this workflow has ever reported — so a genuine leak arriving next to any
   precondition noise would have read as more of the same.

The decision logic now lives in one script with a behavioural suite, the
workflow calls that script, and the suite runs on every pull request that
touches it. The precedence follows the cost of being wrong rather than how
specific each marker is: a detected leak outranks everything, because hiding one
is the only outcome that lets a cross-tenant read ship; "could not tell" asserts
nothing and over-alarming is cheap; a pass requires the suite's own marker *and*
a supervisor that succeeded, because a pass is the one verdict that must never
be reached by inference. Every "could not tell" exits non-zero, including the
ones reached because an input was unreadable.

## Layer Impact

**Release lane: `global-control-lane`.** Shared control-plane behaviour — the
verdict of a repository-wide CI gate — applying to every client equally, with no
feature gate and no client-scoped data touched.

- **Layer 4 — Products:** none. No product surface, route, component or tenant
  data is touched.
- **Platform / CI controls:** the L4 database-tier tenant-isolation gate. Its
  verdict is now produced by a tested script instead of untested inline shell,
  and it can fail in review for the first time.
- **Layers 1–3 (intake, adapters, canonical model):** unchanged. This change
  reads a log and an exit code. It opens no database connection, runs no query,
  and writes nothing.

## Client Applicability

- All clients: no behaviour change. This is a CI control.
- Specific clients: none.
- Internal only: yes — governance and release tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/security/classify-rls-regression.mjs` (new) — the verdict, as a
  module with a CLI. Pure: it reads a log and an exit code, and decides.
- `scripts/security/classify-rls-regression.test.mjs` (new) — 17 behavioural
  cases.
- `.github/workflows/rls-regression.yml` — the `Classify result` step now calls
  the control instead of re-implementing it; a `pull_request`-triggered
  `classifier-contract` job runs the suite; and the live-database job carries an
  explicit guard so that trigger can never reach it.
- `package.json` — `test:rls-classifier`.

No migration, no SQL change, no runtime image change.

## QA / Validation

**Red first, same scope.** The suite was written against a faithful port of the
inline shell as it stands on `main`, before anything was changed:

- `node --test scripts/security/classify-rls-regression.test.mjs`
  — **7 passed / 6 failed** on the status-quo logic.
- The same suite after the repair — **17 passed / 0 failed**.

The six red cases were: a pass asserted over a failed supervisor; an unreadable
supervisor exit code reaching a pass; a leak masked by a precondition marker; a
leak masked by a pass marker; the command-line exit codes for all four verdicts;
and the workflow still deciding inline.

Case 2 runs over the **real** container log of the red run, quoted from its own
uploaded evidence, so the detector is calibrated on a known positive rather than
only on constructed input.

**Mutation pass — 14 mutations, 14 caught.** Each was confirmed to change the
file before the suite ran, so a no-op edit cannot be mistaken for a caught one:

| # | Mutation | Verdict |
|---|---|---|
| M1 | a pass no longer requires a successful supervisor (the status quo) | caught by 4 cases |
| M2 | an unreadable supervisor exit code treated as success | caught by 1 |
| M3 | the leak marker never recognised | caught by 5 |
| M4 | the empty-log branch removed | caught by 1 — **see below** |
| M5 | no verdict annotates, so a red names nothing | caught by 2 |
| M6 | the summary stops quoting the suite's own line | caught by 2 |
| M8 | an unrecognised flag ignored instead of refused | caught by 1 |
| M9 | the command always exits 0 | caught by 2 |
| M10 | an inline text search re-added beside the control | caught by 1 |
| M11 | precondition branch moved ahead of the leak branch | caught by 1 |
| M12 | leak branch moved after the pass branch | caught by 2 |
| M13 | the live-database job's trigger guard removed | caught by 1 |
| M14 | that guard keeps one trigger and drops the other | caught by 1 |
| M15 | the contract job gated off pull requests instead | caught by 1 |

**M4 survived its first form and is recorded in the suite.** Removing the
empty-log branch left the verdict and the exit code unchanged — an empty log
simply fell through to "reached no verdict" and was still non-zero — so a case
asserting only those two passed through the wrong branch. The two branches send
an operator to different places, one to the supervisor and the Container App and
one to the database and the deployed image, so the case now asserts which branch
fired. That is the distinction the branch exists for.

**Other checks**, all from the item's own worktree on merge base `26a2ed5c68`:

- `npx eslint scripts/security/classify-rls-regression*.mjs` — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, empty output, judged by exit code.
- The workflow file parses as YAML and both jobs resolve, checked by loading it.

**Not validated, and not claimed:** nothing here was executed against a
database. The control's whole design is that it decides from a log and an exit
code, so its suite needs no network, no secret and no Azure — which is also why
it can run in review at all.

## Rollout Plan

Merge to `main`. There is no runtime rollout: no image, no Container App
template, no environment variable, no flag. The repaired verdict takes effect on
the next run of the workflow — the nightly schedule, or a manual dispatch.

## Deployment Authority

- Repo-owned deploy workflow: not involved. This change ships no image and
  mutates no Container App.
- Shared runtime mutators: none. No `az containerapp update`, no job execution,
  no traffic or revision change.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: not applicable, and none is claimed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product surface changes. The proof
  owed instead is a run of the workflow itself, recorded under Known Gaps.

## Rollback Plan

Revert the commit. The previous inline logic returns with it, and nothing else
depends on the new script. No migration, so no migration rollback. No data was
written, so there is nothing to undo.

## Audit Evidence

- The red run this was filed on, and its uploaded evidence bundle, which carries
  the container log quoted in case 2.
- The pull request, and its `RLS result classifier contract` check — the first
  time this gate has had one.
- `node --test scripts/security/classify-rls-regression.test.mjs`, 17/0.
- The red-first and mutation numbers above, reproducible from the PR's own
  history.

## Known Gaps

1. **The next scheduled run will still be red, and that is correct.** The
   precondition that stopped the probes is a state of the live database, not of
   this code; nothing here fixes it, and fixing it needs a data-plane build this
   lane must not run. What changes is that the red now names its verdict and its
   reason, and quotes the suite's own line. Filed as a separate data-plane item.
2. **The precondition's message asserts a cause it has not established.** It
   reports the required rows as absent and prescribes a migration. An equally
   consistent reading is that the rows exist and this connection cannot see
   them: the table has row-level security enabled with a single policy scoped to
   the service role, and the precondition runs before the suite assumes any
   role. The two readings have opposite remedies — one is a migration, the other
   would send an operator to mutate a database that is already correct — and the
   check cannot currently tell them apart. Filed separately; out of scope here.
3. **One run, proven once.** The repaired classifier has been proven against
   logs, including a real one, and not yet against a live scheduled run. A run
   of the workflow after merge is owed.
