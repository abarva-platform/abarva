# 2026-09-20-gate-census-shape-drift — answering a question the author left open

## Release ID

`2026-09-20-gate-census-shape-drift`

## Status

`candidate`

## Plain-English Summary

The committed coverage census is the input to which directory gets wired next.
It went stale twice in one day and nothing noticed — once from another change,
once from a change made in this same session.

There is now a gate. `--check` fails when the census's **coverage shape** has
drifted, and a behaviour case enforces it on every run of the behaviours suite.

## The gate is on the shape, not the counts, and that was measured

The script's author had already written the report and deliberately stopped
short of enforcing it, leaving the reason in a comment:

> "Printing the drift costs nothing and does not enforce anything. It also
> answers the question that has to come before enforcement: whether a check
> that fails on disagreement would fire on every unrelated PR that adds a test,
> or only when the file is genuinely stale. Enforce first and you learn that by
> being wrong in public."

That question now has an answer, and it is the unwelcome one. **A gate on the
counts would fire on nearly every pull request.** Measured directly: adding one
ordinary test to an already-covered directory moves three counts —
`testFiles`, `coveredTestFiles`, `pullRequestCoveredTestFiles` — and moves the
directory sets by **zero**.

So a counts gate would fail pull requests that did nothing wrong, and teach
people to regenerate a two-thousand-line generated file to get green. The gate
is therefore on the **sets**: which directories are uncovered or partially
covered. That fires only when the wiring itself changed, which is the thing the
census is consulted for. The counts remain a report, exactly as the author left
them.

## The script printed a finding and exited 0

Worth recording, because it was nearly gated on as-is: running the census
against a stale committed file printed **"committed census is STALE"** and
exited **0**. A CI step added around the existing behaviour would have passed
while drift accumulated — a report that prints a finding and exits zero, which
is a shape this repository has been bitten by before.

`--check` is opt-in rather than a change to the default, so every existing
caller keeps the non-enforcing behaviour the author chose.

## The gate perturbed the instrument it was gating

The first attempt added a workflow step running the script. CI rejected it, and
the rejection was correct.

Invoking `scripts/quality/test-ci-coverage-census.mjs` from a workflow puts that
script into the set of commands a workflow reaches — so the census scanned its
own source for Jest invocations and found one it cannot resolve to literal
paths: `["jest", ...paths, …]`, quoted inside its own documentation of the
ratchet hop. `indeterminateInvocations` went from **0 to 1**, and three sibling
guards failed exactly as designed, because an unresolved invocation makes the
census's covered count an upper bound and they refuse to read a guess.

A gate that makes its own subject unmeasurable is worse than no gate. The
enforcement therefore lives in a behaviour case, where it does not appear in
the reachable-command set. `--check` is kept for anyone running it by hand, and
`indeterminateInvocations` is back to **0** with all three guards green.

This is worth recording as a shape: *a check placed inside the thing it
measures can change the measurement.* Nothing warned about it, and the only
reason it was caught is that the sibling guards assert the measurement is
resolvable before trusting it.

## Layer Impact

- `global-control-lane`. One analysis script and its behaviour suite. No
  product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI tooling
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — `describeShapeDrift` plus a
  `--check` flag.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — two cases, both
  driving the real CLI.
- No workflow step — see below. The enforcement is a behaviour case.

## QA / Validation

Measured on base `af1d589c6`.

| What | Result |
|---|---|
| Census behaviour suite | **28 tests passing** (26 before, 2 added) |
| `--check` on a clean tree | **exit 0** — green on arrival |
| Runtime of `--check` | **~4s** |
| `indeterminateInvocations` after the change | **0** — the three sibling guards pass |
| Regeneration is deterministic | two consecutive runs **byte-identical**, no timestamp fields |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

### It was demonstrated live, unplanned, on this very branch

While this change was being written, another agent's merge landed and added one
test file. The counts report immediately went stale — `testFiles` 2338 → 2339,
`coveredTestFiles` 1639 → 1640 — and the coverage shape did not move.

`--check` on this branch exits **0**.

That is the author's question answered outside a fixture: a counts gate would
have failed this pull request, which changed nothing about which directory is
wired. The shape gate stays quiet, which is the entire reason it is on the
shape.

### Both directions, and the negative control is the point

| Perturbation of the committed census | `--check` |
|---|---|
| a directory added to the uncovered **set** | **exit 1**, and it names the directory |
| only the **counts** changed | **exit 0**, drift still reported |
| unmodified | exit 0 |

The second row is the design claim, tested rather than asserted: this is the
case that fires on every pull request adding a test, and the gate stays quiet
for it.

| Mutation of the gate itself | Result |
|---|---|
| remove `process.exitCode = 1` | **the gate case fails** |
| as shipped | 28 pass |

Determinism was checked before building anything, because an equality gate over
a non-deterministic generator would flap rather than fail.

## Rollout Plan

Merge to `main`. The behaviour case runs wherever the behaviours suite runs and
fails only when a directory's coverage state changed without the census being
refreshed. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state.

## Audit Evidence

- The measured effect of adding one ordinary test: three counts move, the sets
  do not.
- The two-direction perturbation table and the gate mutation.
- The determinism check.

## Known Gaps

- **The counts can still go stale silently**, by design. That is the trade: a
  stale count mis-states a total, a stale shape mis-ranks the queue, and only
  the second is worth failing a pull request over. Anyone quoting a census
  total should still regenerate first.
- **It cannot tell a legitimate wiring change from a forgotten refresh.** Both
  look like shape drift, and both are fixed the same way — regenerate — so the
  gate's message says that rather than guessing intent.
- **Nothing gates the census outside the behaviours suite**, so a context that
  does not run it is not covered.
- **The gate cannot be run as a workflow step**, for the reason above. That is
  a constraint of this instrument, not a preference, and a future reader who
  moves it into a workflow will reintroduce the unresolved invocation.
