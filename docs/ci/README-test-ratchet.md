# The test ratchet

`scripts/ci/test-ratchet.mjs` runs a surface's Jest suites and compares the
result against a recorded baseline of what was already failing.

## Why it exists

The repository has roughly 2,200 Jest test files. CI runs about 120 of them. The
rest pass or fail on whichever machine last ran them, and nobody finds out
either way — a red test reached `main` this way, and every check on its pull
request was green.

The obvious fix is to run everything and fail on red. That cannot be adopted as
written, because the surfaces are already red: a full local run finishes in
about 75 seconds and reports several hundred failing suites. A check that is red
on the day it lands teaches everyone to ignore it, which leaves the repository
worse off than before, because now there is a check as well as no signal.

So the baseline records exactly which suites fail today and by how much, and the
check fails on any movement away from it.

## What it fails on

- **A suite that was passing and now fails.** The ordinary case.
- **A suite that was already failing and now fails more.** The failing count is
  compared, not just the name, so a new break inside a broken file is caught.
- **A suite that could not run before and now runs.** A different condition from
  either, and worth noticing.
- **A suite that has been fixed.** This is the ratchet. If a repaired suite left
  its old entry in the baseline, the baseline would keep room for a failure that
  no longer exists, and the surface could quietly get worse again without ever
  exceeding it. The message says to re-record.
- **Fewer tests than the floor.** A green run proves the tests that ran passed.
  It proves nothing about what is still tested: a deleted suite, a skipped
  `describe`, or a renamed directory all leave a passing run behind them.

## Using it

```bash
# check (what CI runs)
node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json

# re-record, after fixing something or after adding tests
node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json --update
```

A baseline declares the Jest paths for its surface, a floor, and the known
failures. Adding a surface is a new baseline file and a workflow step.

## What the baseline is not

It is a record of what was already broken when the check landed. It is not a
budget. Adding an entry to it by hand, rather than by re-recording after a
deliberate decision, is how a ratchet becomes a rubber stamp.
