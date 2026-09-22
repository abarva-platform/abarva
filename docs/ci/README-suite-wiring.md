# Wiring a previously-unrun test suite into CI

Three agents wired unrun component suites into CI on the same afternoon and picked two
different patterns. This records what was measured and which to pick, so the next one is
not a coin flip.

## The two patterns

| pattern | example |
|---|---|
| a **dedicated workflow** | `source-component-suites.yml`, `agent-route-suites.yml` |
| a **step in an existing job** | the component-directory step in `ai-surface-control-catalog.yml` |

## What was measured

Real GitHub runs, read-only, on 2026-09-20:

| workflow | runs sampled | duration | queue time |
|---|---|---|---|
| AI Surface Control Catalog (holds a step) | 6 | 160–246s | **0s** |
| Source Component Suites (dedicated) | 4 | 45–375s | **0s** |
| Agent Route Suites (dedicated) | 3 | 102–149s | **0s** |

Three things follow, and two of them contradict what the choice is usually argued on:

- **Queue time is zero for all of them.** A dedicated workflow carries no queueing penalty
  on this runner setup — and no queueing benefit either. The axis people reach for first
  does not separate the two.
- **The catalog job has room.** Its slowest sampled run is 246s against a 720s timeout, 66%
  spare. Its timeout comment records a real scare, but that was against the *old* 300s
  ceiling; a step is not currently near it.
- **A dedicated workflow pays its own setup.** It checks out and installs on its own runner.
  One Source Component Suites run took 375s where its median is under 100s, which is what a
  cold install looks like. That is real runner time bought for something.

What it buys is **failure attribution**: a dedicated workflow puts the suite family's own
name in the checks list, so a red check says which body of tests broke rather than naming
the job that happens to host it.

## Which to pick

- Use a **dedicated workflow** when the suite family has an owner who should see its name
  in the checks list, or when it is large enough that hosting it distorts another job.
- Use a **step in an existing job** when the suites are small and already thematically owned
  by that job — the catalog step runs four directories in about four seconds.
- **Do not convert an existing one on consistency grounds alone.** The measurement above
  found no cost difference worth the churn, and converting buys a fourth duplicated setup
  for a naming benefit. Consistency is worth having in the *next* choice, not in rewriting
  the last three.

Before adding a step to an existing job, check that job's recent durations against its
timeout. Before adding a workflow, copy the trigger, concurrency and timeout shape of one of
the two above rather than inventing a third.

## A suite named by two workflows

`coverage-threshold.yml` names `AgentDock.test.tsx` and `AgentDock.structured-parts.test.tsx`
individually; the catalog's directory step sweeps the same directory, so those two run twice
per pull request.

Measured: **1.8 seconds, 63 tests.** It is left in place deliberately. The two runs answer
different questions — one measures coverage on two named files, the other asserts that
nothing in the directory is unrun — and removing either would mean one of those questions
stops being asked. Excluding two files from a directory sweep would also reintroduce the
hand-maintained list the sweep exists to avoid.

If a future overlap is expensive rather than 1.8 seconds, decide which list owns the file
rather than deleting whichever is easier to edit.

## The rule: a named suite belongs in a job that can block a merge

The paragraph above settles the *cost* of naming a suite that a sweep runs again. It does
not settle the question that cost it something, and T-595 is where that surfaced.

> **A workflow step may name an individual test suite by path only if the job hosting that
> step is a required status check on `main`, whenever a required job already runs that
> suite.**

Why requiredness and not duplication. Three suites in `src/__tests__/behaviors` were named
by exact path in `unit-suites.yml` and `integration-suites.yml`. Neither
`Unit suites that pass on main` nor `Integration suites that pass on main` is a required
context; `Behavior coverage floor` is, and it sweeps the whole directory. So all three
blocked a merge — **nothing was unprotected** — but the *named, quotable* line in the log
belonged to a check that cannot block a merge, and the merge-blocking run was anonymous
inside a sweep. A closure note then quoted the named step as its CI proof. That is a true
sentence about a real run being read as evidence of something it does not establish, and no
amount of care about *which* line you quote fixes it: the log offers the misleading one
first.

The AgentDock pair above is not an instance of this. Both of its runs — the named steps in
`coverage-threshold.yml` and the catalog's directory sweep — are inside required jobs, so
either is honest to quote. Where the name lives is the thing; the duplicated second is not.

What the rule does **not** say. A suite that only a non-required job runs may be named there:
naming it is how it runs at all, and this rule is not a lever for making every workflow
required. `unit-suites.yml` names dozens of suites nothing else reaches, and all of them are
fine.

So, when you want a control's execution self-evident in the log rather than inferable from a
job's exit code — which is a good reason, and why T-590 named a step in the first place —
put the named step in a required job. The floor in `coverage-threshold.yml` is the usual
home: it already runs the whole behaviors directory, so a named step there costs about a
second and makes the name and the gate the same run.

### The control

`npm run audit:named-suite-requiredness` (`scripts/quality/check-named-suite-requiredness.mjs`)
enforces it, and runs in the required floor job — for the same reason the steps it polices do.
Its behaviour is pinned by `src/__tests__/behaviors/named-suite-requiredness.test.ts`.

Requiredness is not derivable from any file in this repository; it lives in GitHub repository
settings. `docs/ci/required-status-checks.json` mirrors the `main` ruleset, and the control
narrows the staleness that invites from both sides: a mirrored context that names no job in
`.github/workflows` fails, and a declared indirect sweep — the floor's sweep lives inside
`scripts/ci/check-behavior-coverage.mjs`, not in YAML a reader can see — fails unless that
script still passes the directory to jest. Neither can see a context **added** to the ruleset
and never written down. Update the mirror in the same pull request that changes the ruleset.
