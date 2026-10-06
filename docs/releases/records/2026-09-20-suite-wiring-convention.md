# 2026-09-20-suite-wiring-convention — Settling a divergence by measuring it

## Release ID

`2026-09-20-suite-wiring-convention`

## Status

`candidate`

## Plain-English Summary

Three agents wired previously-unrun test suites into CI on the same afternoon and picked two
different patterns: two built a dedicated workflow, one added a step to an existing job. The
question was whether to convert the odd one out.

Measured rather than argued, and the measurement went against the assumption:

- **Queue time is zero for all three workflows.** A dedicated workflow carries no queueing
  penalty on this runner setup, and no queueing benefit. The axis the choice is usually
  argued on does not separate them.
- **The job hosting the step has 66% headroom** — slowest sampled run 246s against a 720s
  timeout. Its timeout comment records a real scare, but that was against the old 300s
  ceiling.
- **A dedicated workflow pays its own checkout and install.** One run took 375s where its
  median is under 100s, which is what a cold install looks like.

What a dedicated workflow actually buys is **failure attribution** — the suite family's own
name in the checks list. That is worth having, and it is not worth rewriting three working
wirings to get retroactively.

So nothing is converted. The convention is written down instead, with the numbers, where
the next person making this choice will be standing.

## Layer Impact

- `global-control-lane`. One documentation file and a comment in one CI workflow. No
  product surface, tenant data, schema, projection, migration, code path, or runtime
  behaviour. No workflow step was added, removed, or changed.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI convention
- Public/demo only: no · Feature flag: none

## Changes Included

- `docs/ci/README-suite-wiring.md` — new. The measurement, the two patterns, and which to
  pick.
- `.github/workflows/ai-surface-control-catalog.yml` — a comment beside the step pointing at
  it. Comment only.

## QA / Validation

| What | Result |
|---|---|
| The step's exact command, unchanged | 22 suites, 211 tests, all passing |
| Workflow step intact and pointer present | verified by reading the file back |
| `release-check` | passed |

Job durations were read from GitHub read-only; nothing was dispatched or re-run.

| workflow | runs sampled | duration | queue |
|---|---|---|---|
| the job holding the step | 6 | 160–246s | 0s |
| dedicated workflow A | 4 | 45–375s | 0s |
| dedicated workflow B | 3 | 102–149s | 0s |

### The double-run is left in place, deliberately, with a number

A coverage workflow names two `AgentDock` suites individually while the directory step
sweeps the same directory, so they run twice per pull request. **Measured: 1.8 seconds, 63
tests.**

They answer different questions — one measures coverage on two named files, the other
asserts nothing in the directory is unrun — so removing either stops one of those questions
being asked. Excluding two files from a directory sweep would also reintroduce the
hand-maintained list the sweep exists to avoid. The reasoning is recorded so the next reader
does not have to rediscover that the overlap is intentional.

## Rollout Plan

Merge to `main`. Nothing executes differently. No image build, migration, flag, or runtime
change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting removes a document and a
comment.

## Audit Evidence

- The PR diff — one document, one comment.
- The run durations above, read from GitHub read-only.
- The 1.8s measurement of the overlapping suites.

## Known Gaps

- **This changes nothing about what runs.** It is a decision and its evidence. If the
  expectation was that the outlier would be converted, the measurement is the argument
  against doing so, and it is here to be disagreed with.
- **Sample sizes are small** — six runs, four runs, three runs, all from one afternoon. The
  zero queue time in particular is a property of this runner setup today and would change on
  a busy account.
- The convention does not cover suites that are slow enough to distort any host job. It says
  to check the host's durations first, which is the same measurement, not a rule.
