# 2026-10-03-sec-p0-probe-verdict-distinction — SEC-P0 probe verdicts: not-run is not a leak

## Release ID

`2026-10-03-sec-p0-probe-verdict-distinction`

## Status

`candidate`

## Plain-English Summary

The scheduled cross-tenant probe suite has three possible outcomes — all probes
ran and were refused, a probe reached data it should not have, or no probe ran
at all because the suite could not resolve its target or its caller identity.
The suite has always distinguished them by exit code (0, 1, 2), and nothing
read that distinction: GitHub reports a job as `failure` for the second and the
third alike. So a run that executed nothing was indistinguishable, in the run
list, from a run that executed everything and found a boundary open.

That is a gate you cannot read, and the consequence is the one this repository
has paid for before — the unresolved-configuration path is the path these runs
actually take, and because it wears the same appearance as a finding, neither
state gets acted on.

This change makes the three outcomes structurally distinct. A new emitter is
the single place that turns the suite's exit code into a named verdict and
publishes it four ways: a one-line `SEC-P0 VERDICT:` token on stdout, a GitHub
annotation whose title differs per verdict, a job-summary block, and an
uploaded artifact named after the verdict so the run page states the outcome
without anyone opening a log. A run that could not probe is still red, because
a security control that did not run must be loud — it just no longer reads as
a finding.

It does not make the suite able to probe. That needs credentials an operator
holds; see Known Gaps. Operational history, run ids and the configuration state
are recorded in the internal execution register rather than here.

## Layer Impact

- `internal-admin`: GitHub Actions security-probe orchestration and a new
  verdict-emitting script. No product runtime, route, data-plane, schema, RLS,
  auth, or UI behavior changes. No probe assertion is added, removed, loosened
  or renamed — `tests/security/sec-p0-cross-tenant-probes.sh` is unchanged.

## Client Applicability

- All clients: indirectly — the probe control covers tenant boundaries for
  every deployed client, and this change makes its reported state legible
  rather than changing any boundary.
- Specific clients: none.
- Internal only: yes, CI/security operations.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `scripts/security/sec-p0-probe-verdict.mjs`: the verdict table
  (`PROBES_CLEAN`, `CROSS_TENANT_LEAK`, `NOT_RUN_CONFIG_UNRESOLVED`,
  `NOT_RUN_HARNESS_ERROR`), `verdictForExit`, and the emitter. It preserves the
  suite's documented exit contract exactly and re-exits with the code it
  received.
- Updates `.github/workflows/sec-p0-post-deploy.yml`:
  - the probe step now runs `sec-p0-probe-verdict.mjs --run` instead of calling
    the suite bare;
  - the `Resolve environment URLs` step no longer decides the red — its
    duplicate required-secret `exit 2` is reduced to a warning, because the
    suite applies the same rule itself and reaching the emitter is what
    produces a verdict. The unknown-environment branch routes through the
    emitter too;
  - two steps publish the verdict as an artifact named
    `sec-p0-verdict-<VERDICT>`, always, so the run page names the outcome;
  - the header comment documents the four verdicts in place of two exit codes.
- Adds `src/__tests__/behaviors/c628-sec-p0-probe-verdict-distinction.test.ts`,
  six cases, in a directory the CI coverage census already reports as fully
  covered.

## QA / Validation

Baseline measured over the same scope on the merge base `c793d23337`.

- **Red first**: the new suite on the unmodified tree — **6 failed / 6 total**.
  After the change — **6 passed / 6 total**. Command:
  `npx jest --runTestsByPath src/__tests__/behaviors/c628-sec-p0-probe-verdict-distinction.test.ts`.
- **Four deliberate mutations, each caught:**
  | # | Mutation | Result |
  |---|---|---|
  | 1 | `verdictForExit(2)` returns `CROSS_TENANT_LEAK` — the two reds collapse | 3 failed / 3 passed — cases 1, 2, 4 |
  | 2 | probe step calls `bash tests/security/sec-p0-cross-tenant-probes.sh` bare | 1 failed / 5 passed — case 6 |
  | 3 | the resolve step's bare `exit 2` restored | 1 failed / 5 passed — case 6, naming the offending line |
  | 4 | the not-run annotation title set equal to the leak title | 1 failed / 5 passed — case 2 |
  Restored to the unmutated tree after each: 6 passed / 6 total.
- **Case 5 uses independent truth for "a leak"**: it drives the real bash suite
  against a throwaway local HTTP server that answers `200` to every request.
  All 8 probes expect a refusal, so the suite computes `0 passed, 8 failed` and
  exits 1 on its own; the test asserts the verdict that follows, not the
  failure. The stub and the suite run in a child process because `spawnSync`
  blocks the caller's event loop — the first draft listened in-process and hung
  for its whole timeout, which read as the emitter failing rather than as a
  test defect.
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  — **exit 0**, 0 `error TS`.
- Pass: `npx eslint` on both new files — exit 0, no findings.
- Pass: `bash -n` on the unchanged probe suite and on each `run:` block of the
  workflow, executed under `set -eo pipefail` as Actions runs them.
- Pass: `node scripts/quality/test-ci-coverage-census.mjs --check` — exit 0,
  coverage shape matches the committed census. The counts drift by +1 test file
  in an already-covered directory, which that gate reports and does not fail
  on, by its own documented design; the committed census is owned by another
  open pull request and is not touched here.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- **Not run: the probe suite against a deployed environment.** It needs a
  signed-in session credential held as a repository secret. See Known Gaps.

## Rollout Plan

Merge to `main`. No runtime rollout: this changes a scheduled GitHub Actions
workflow and adds a script that only Actions invokes. The next scheduled run
(03:00 UTC) exercises the new path. No image build, no Container App update, no
migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, untouched.
- Shared runtime mutators: none. No `az` command, no revision, traffic,
  template, env var, secret or scale change.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: unaffected; the merge still triggers the repo-owned
  deploy, and that run's template/100%-traffic/worker digest equality will be
  recorded as usual.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no for this change. The probe suite's own
  green run against a deployed environment IS required to close the underlying
  item and is explicitly owed, not claimed.

## Rollback Plan

Revert the single squash commit. The probe suite file is unchanged, so a revert
restores the previous workflow exactly and loses only the verdict emission. No
state, schema or data is written by anything here, so there is nothing to undo
beyond the files.

## Audit Evidence

- PR URL: recorded on the pull request opened from
  `exec/c628-sec-p0-probe-verdict-distinction`.
- Workflow run history and the configuration state this was filed against are
  cited by run id in the internal execution register, not reproduced here.
- The first scheduled run after merge: its uploaded artifact is named for
  whichever verdict the run reaches, which is itself the evidence that the
  emission works.
- Reproduce the distinction locally without any credential:
  `node scripts/security/sec-p0-probe-verdict.mjs --from-exit 2` and
  `--from-exit 1` print different verdict tokens, severities and annotation
  titles, and exit 2 and 1 respectively.

## Known Gaps

- **This change does not give the suite the ability to probe.** Doing so
  requires an operator to provision the probe inputs the workflow header
  documents for one environment — a base URL, the second tenant's client id,
  and a session cookie or full cookie header for a caller in the first tenant.
  Minting a session credential and storing it as a repository secret is an
  operator action and was not taken here.
- Once those secrets exist, the item's remaining acceptance is one green run on
  the then-current deployed SHA, carrying the `PROBES_CLEAN` verdict. That is
  owed and is not claimed by this release.
- The run *list* page shows a conclusion, not a verdict, so the distinction is
  published on the run page (annotation title, job summary, artifact name) and
  in the exit code rather than in the list cell. GitHub offers no way for a
  step's result to change a run's conclusion to a third state; a follow-up
  could split the two reds into two workflows if list-cell distinction is
  judged necessary.
