# 2026-09-26-t480-home-route-group-ci-wiring — Wire the two unrun Home route-group suites, and prove the selection

## Release ID

`2026-09-26-t480-home-route-group-ci-wiring`

## Status

`candidate`

## Plain-English Summary

Two existing test suites on the Home surface were not being run by any continuous-integration
job, so nothing reported whether they passed. This adds them to the pull-request test job and
adds a test that checks the wiring actually works.

The reason they were unreachable is worth stating plainly, because it is subtle and it is almost
certainly not unique to these two files. When Jest is handed a bare path, it treats that path as
a **regular expression**, not as a literal location on disk. One of the repository's test-gate
baselines names the directory `src/app/(maestro)/home`. In a regular expression, `(maestro)` is a
capture group, so the pattern matches `src/app/maestro/home` — a directory that does not exist —
and therefore selects nothing at all beneath the route group. Measured: given that baseline's five
directory entries verbatim, Jest selects 84 files and **not one** of them sits under a
parenthesised segment.

The coverage census credits the baseline's directory name as coverage regardless, so neither
directory ever appeared in the "no workflow runs this" report. That half is a separate filed item
(`T-487`) and is deliberately not changed here.

**The item as filed overstated its own scope, and this record corrects that.** `T-480` says
fourteen suites need wiring. The triage record it derives from — `docs/architecture/t479-stale-suite-triage.json`
— judges only **two** of them `wire_into_ci` and twelve `already_selected_no_action`, because a
baseline genuinely does select those twelve. That record's own follow-on note says so: "only the
rows with `selectedByAWorkflowCommand` false actually need wiring". Re-measured independently here
before any edit rather than taken from the record.

## Layer Impact

Release lane: `global-control-lane` — shared continuous-integration behaviour for the whole
repository, not scoped to a client and not feature-gated. It is the lane by elimination as much as
by fit: nothing here touches client-scoped data, admin capability, a public route or a flag.

- **No product layer.** Nothing under `src/` that ships to a client changes. The two wired suites
  are not edited — the item forbids it and they were not touched.
- **Test/tooling only.** One step added to an existing pull-request job, one new behavioral test.

## Client Applicability

- All clients: no change
- Specific clients: none
- Internal only: yes — continuous-integration scope only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — new step `Run the T-480 Home route-group suites`, added to
  the existing `unit-suites` job so it inherits that job's requiredness rather than declaring a new
  gate. Runs both files with `--runTestsByPath`, each path double-quoted.
- `src/__tests__/behaviors/t480-home-route-group-suite-ci-wiring.test.ts` — new, three cases.

No suite under `src/app/(maestro)/home/__tests__` was modified. No baseline was modified.

## QA / Validation

**The two wired suites, measured individually before wiring**, with the command the triage protocol
prescribes and every count read out of the run's own JSON rather than typed:

| suite | suites | tests | passed | failed | skipped |
|---|---|---|---|---|---|
| `home-page-ecl-route.test.tsx` | 1 | 3 | 3 | 0 | 0 |
| `no-readmin-reexports.test.ts` | 1 | 7 | 7 | 0 | 0 |

**The new step, run exactly as the workflow writes it:** 2 suites, 10 tests, all passing.

**Red first.** The new test on unmodified `main`: **2 failed, 1 passed of 3**. After the step was
added: **3 passed of 3**.

The one case that passed before the fix is the negative control, and it passing first is the point —
it establishes on unmodified code that the regex trap is real, so the selection assertion beside it
is measuring something. It was separately shown to discriminate in both directions: the same path
with the parentheses escaped selects the file, unescaped selects nothing.

**Five mutations, five caught, and which case fired is recorded** because a second guard absorbing a
mutation reads exactly like a guard that works:

| mutation | result | which case failed |
|---|---|---|
| M1 drop `--runTestsByPath` from the step | caught | names-by-exact-path **and** selection |
| M2 unquote both paths | caught | names-by-exact-path only |
| M3 delete the step entirely | caught | names-by-exact-path **and** selection |
| M4 typo one path (`reexport` for `reexports`) | caught | names-by-exact-path **and** selection |
| M5 replace both paths with the route-group directory (the trap form) | caught | names-by-exact-path **and** selection |

M2 is caught by one case only. That is honest rather than ideal: with `--runTestsByPath` present,
an unquoted path still reaches Jest correctly once a shell has parsed it, so the quoting assertion
is a separate guard against a shell-level failure and not a second proof of selection.

**Clean baseline over the same scope**, run in a separate worktree at the same commit rather than
from a stash, both sides `src/__tests__/behaviors`:

| | suites | tests | failing suites | failing tests |
|---|---|---|---|---|
| before (`e439b4154`) | 138 | 1345 | 0 | 0 |
| after | 139 | 1348 | 0 | 0 |

**0 failing before, 0 failing after.** The new suite contributes 3 tests. The behaviors scope was
fully green on an unmodified tree in this run, which is worth recording because a recent note
reported 3–5 suites failing there under a full parallel run; that did not reproduce today.

- Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after deleting
  `tsconfig.tsbuildinfo` — **exit 0**, no diagnostics. Judged on the exit code, per `T-040`.
- ESLint on the new test — exit 0, clean.
- The workflow was parsed as YAML and the new step's `run` value read back from the parse tree, so
  the quoting is verified as YAML sees it and not only as the file reads.
- `scripts/quality/test-ci-coverage-census.mjs --check` — **exit 0**, shape unchanged.

## Rollout Plan

Merge to `main`. The new step runs on the next pull request and on every one after. There is no
runtime rollout: nothing under `src/` that the application serves is changed, no image, no flag, no
environment variable, no migration.

## Deployment Authority

- Repo-owned deploy workflow: not exercised by this change
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime artifact changes
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no.** The change alters which tests a continuous-integration job
  selects. There is no user-visible surface in it, and a signed-in session could not observe it.

## Rollback Plan

Revert the commit. Removing the step returns the two suites to being unrun; removing the test
returns the behaviors scope to 138 suites. No state, no data, no migration to unwind.

## Audit Evidence

- The pull request and its checks.
- The new step's own run in the `unit-suites` job log — the direct evidence that both files are
  selected and green on a real runner, rather than only on this machine.
- `docs/architecture/t479-stale-suite-triage.json` — `counts.wire_into_ci` is 2, and
  `followOnItems.T-480` states that a row a baseline already selects needs no wiring. That is the
  record this change reads `T-480`'s real scope out of.

## Known Gaps

- **The census still credits an unmatchable baseline path as coverage.** That is why wiring these
  two changed no census count: the directory was already reported as covered. Filed as `T-487` and
  deliberately untouched here.
- **Both ratchet baselines still carry unescaped route-group segments**, so they still select nothing
  beneath them. Filed as `T-486`, and it is blocked on a decision rather than on code: escaping them
  turns both gates red on failures that exist today and that neither gate can currently see. This
  change deliberately routes around that decision instead of pre-empting it — the two suites are
  wired by exact path in a job, which needs no baseline edit and reveals no new failure.
- **The twelve other suites `T-480` names need no wiring** and none was added for them. The item's
  text should be read against the triage record, not on its own.
- The committed coverage census's *counts* remain behind the tree, as they are on `main` today. The
  census workflow's own written decision is that counts are a report and not a gate; a refresh was
  measured (`+1` test file attributable to this change, the rest pre-existing drift that moved again
  on the next merge) and deliberately left out so this diff stays the two files the item is about.
