# 2026-09-21-ratchet-dark-directories-outside-src-tests

## Release ID

`2026-09-21-ratchet-dark-directories-outside-src-tests`

## Status

`candidate`

## Plain-English Summary

A test directory that no workflow runs is dark, and a suite in it proves
nothing while looking like coverage. There is already a ratchet refusing a new
dark tree — and it is scoped to `src/__tests__`, which is **5 of the 180**
directories the census reports as uncovered.

The other **175** — every `__tests__` directory under `src/app` and `src/lib` —
were governed by nothing.

| | |
|---|---|
| Uncovered directories | 180 |
| Governed by the existing ratchet | **5** |
| **Governed by nothing until now** | **175** |

## Why now

Three separate changes on one day added a test directory under `src/app` or
`src/lib` that no workflow ran. Two were caught only because the census was run
by hand; the third reached CI and failed the coverage gate there, after review.

A suite added beside the code it tests is dark on arrival, and nothing says so.

## What it does

The same ratchet, applied to the rest of the tree: the count of dark
directories outside `src/__tests__` must equal a recorded figure. Wiring a
directory is always allowed and needs no edit here — except to lower that
figure, which is the point.

**The assertion is equality, deliberately.** Being under the ceiling fails as
loudly as being over: a silent decrease means someone wired a directory and
left the recorded number lying, and the next dark directory would then be
measured against a ceiling with room in it.

Coverage is resolved through the census's own four-hop resolver, not by
searching a workflow file for a string — a wrapper script that shells out to
jest satisfies a string search and registers nothing. The suite refuses to read
a guess: if the census reports any unresolved jest invocation, its uncovered
list is an upper bound, and that case fails first.

## Mutation results — both were real changes, not edits to the constant

| Mutation | Result |
|---|---|
| a new dark directory appears (`src/lib/mutation-probe/__tests__`) | **175 → 176, fails** |
| an existing dark directory is wired in the workflow | **175 → 174, fails** |

The second is the half that ratchets usually miss.

## Layer Impact

- `global-control-lane`. One new behaviour suite in a directory CI already
  runs. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — new.

## QA / Validation

Measured on base `03f9fa8fa`.

| What | Result |
|---|---|
| New suite | **3 passed** |
| The existing `src/__tests__` ratchet | **4 passed**, untouched |
| Census `--check` | exit **0**, shape unchanged |
| Vacuity floor (`> 50` dark directories, all under `src/`) | asserted |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

### The census was deliberately not regenerated

Regenerating produced a **3,987-line** diff. The gated fields had moved by
exactly `+1` test file and `+1` covered — this change's own suite — and the
coverage shape was unchanged, so `--check` passes without it. The rest of that
diff is stale detail in sections the drift check does not compare, and carrying
it here would bury a two-file change and conflict with every other lane.

## Rollout Plan

Merge to `main`. Green on arrival at the measured figure. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. 175 directories go back to being governed by nothing.

## Audit Evidence

- The census split: 180 uncovered, 5 under the existing ratchet, 175 outside.
- Both mutation results, each produced by a real change.

## Known Gaps

- **It counts directories, not files.** Adding a dark suite to a directory that
  is already dark does not move the number, and that is the common case among
  the 551 unrun files.
- **175 is a ceiling, not a target.** Nothing here wires anything, and nothing
  obliges anyone to lower it.
- **The committed census's detail sections are thousands of lines stale** and
  nothing gates them. The drift line reports the counts; it does not compare
  the evidence lists or rankings that make up most of the file.
