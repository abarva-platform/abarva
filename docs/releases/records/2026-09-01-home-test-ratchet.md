# 2026-09-01-home-test-ratchet — Cover the whole Home surface, against a baseline

## Release ID

`2026-09-01-home-test-ratchet`

## Status

`candidate`

## Plain-English Summary

The guard added earlier today ran two Home directories: 315 tests. The Home
surface has 582, across 68 suites. The other 267 were still running nowhere.

They were not running because they do not all pass. Eighteen of the 68 suites are
failing on `main` right now — 36 tests — most of them on legacy Home paths that
the current surface replaced.

That is why this is a ratchet rather than a plain pass/fail. A check that is red
on the day it lands teaches everyone to ignore it, which leaves the repository
worse off than before: now there is a check as well as no signal. So the baseline
records exactly what was already broken, and the check fails on any movement away
from it.

It only moves one way. A repaired suite fails the check until its entry is
removed from the baseline, because a baseline that keeps room for a failure that
no longer exists lets the surface get worse again without ever exceeding it.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-4:** unchanged. No product, data or schema change.
- **CI:** the Home workflow now runs every Home suite; one new script, one
  baseline, one document. The single-purpose floor script it replaces is removed.

## Client Applicability

- No client-visible change. This is delivery control.
- Feature flag: none.

## Changes Included

- `scripts/ci/test-ratchet.mjs` (new) — runs a surface's suites, compares against
  a baseline, and can re-record one.
- `docs/ci/home-test-baseline.json` (new) — the Home paths, a floor of 550, and
  the 18 suites failing at the time of recording.
- `docs/ci/README-test-ratchet.md` (new) — what it fails on and why the baseline
  is not a budget.
- `.github/workflows/home-surface-guard.yml` — runs the ratchet.
- `scripts/ci/assert-home-test-floor.mjs` — removed; the ratchet subsumes it, and
  two mechanisms for one job is how one of them silently stops working.

## What prompted it

Measuring what CI actually runs, after the earlier finding that it ran no Home
tests at all:

- 2,203 Jest test files in the repository; **119 run in CI**
- a full local run takes **75 seconds** and reports 853 failing tests across 407
  failing `.test` suites
- sampled by area, on `main`: Tower 18 failing, Source 58, Intelligence 29,
  Agent 23, Knowledge 48, Admin 9, Programs 8, Deliverables 3, Atlas 2, Pricing 0

Runtime is not the reason those tests are not running.

## QA / Validation

- PASS against the recorded baseline: 546/582, 18 failing suites, no movement
- PASS every direction of movement, each provoked and observed:
  - a new failure in a suite that was green — exit 1, `NEW FAILURE` and the count
  - an extra failure inside an already-failing suite — exit 1, `WORSE`
  - a baselined suite that has been fixed — exit 1, naming it and the re-record
    command
  - paths matching no tests — exit 1 on the floor
- The workflow this replaces ran green on its own pull request in 1m7s

## Rollout Plan

Merge to `main`. The workflow reports on the next pull request.

## Deployment Authority

- Repo-owned deploy workflow: not involved; CI only
- Shared runtime mutators: none
- ACA runtime invariant: not affected
- Live signed-in proof required: no

## Rollback Plan

Revert. Nothing depends on the script or the baseline.

## Audit Evidence

- The four provoked movements above, each with its exit code and the message it
  printed.
- The measurement of what CI runs is reproducible: the workflows and the npm
  scripts they invoke are the only sources of Jest paths, and the full local run
  that produced the failure counts finishes in 75 seconds.
- The baseline is machine-recorded from a Jest report, never hand-written.

## Known Gaps

- Still reporting, not blocking. Under the current speed-mode ruleset a red check
  does not stop a merge; making it required is a repository-settings decision.
- Home only. The same measurement says Tower, Source, Intelligence, Agent and
  Knowledge each have failing suites nothing runs. The script takes a baseline
  path precisely so adding one of them is a file and a workflow step, but adopting
  it for a surface means someone owns that surface's baseline, and that is a
  decision rather than a patch.
- The 18 baselined suites are not fixed. Several test Home paths that the current
  surface replaced and may be better deleted than repaired; that judgement needs
  the sunset decision, not a test fix.
