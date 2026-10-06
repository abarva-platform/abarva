# 2026-09-19-agent-program-tool-controls-ci — Run the agent program-tool control suites in CI, and cover the one gate they missed

## Release ID

`2026-09-19-agent-program-tool-controls-ci`

## Status

`candidate`

## Plain-English Summary

The ten test suites that prove what an AI agent is and is not allowed to do to a
Program ran nowhere. They sit in `src/lib/agent/tools/__tests__`, they drive the
real tool handlers — the phase advance that must never approve its own gate, the
program commit, the deliverable sign-off, the registry's surface gate — and no
npm script and no workflow executed them. Every one of them was green, and green
in a place nobody looked. The coverage census ranks that directory **first** on
governed risk: it is the only uncovered directory carrying all three signals at
once (a declared AI surface control, an approval or lifecycle write, and a
tenant-scoped read).

Running them was not enough on its own, because a suite that nobody runs is also
a suite nobody has checked for holes. Nine deliberate breakages of real controls
were tried against the directory first. Eight failed the suites. One did not:
deleting the publish-rights gate on the single-deliverable sign-off left all ten
suites green, because no test in the directory ever supplied an access policy, so
that branch was unreachable from the suite. The batch sibling `complete_deliverables`
already had the equivalent case; the single-deliverable tool did not. This change
adds it, in both directions, and wires the directory into the AI surface control
catalog job.

No product code changed.

## Layer Impact

`global-control-lane`.

- **Products (layer 4):** none. No route, component, or answer path changed.
- **Canonical model (layer 3):** none.
- **Source adapters (layer 2) / client intake (layer 1):** none.
- Test and CI tooling only.

## Client Applicability

- All clients: no behavior change.
- Specific clients: none.
- Internal only: yes — CI coverage and test scope.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one appended step,
  `Exercise agent program-tool control suites`, running
  `npx jest src/lib/agent/tools/__tests__ --runInBand`.
- `src/lib/agent/tools/__tests__/completeDeliverable.test.ts` — three cases
  covering the publish-rights gate on deliverable sign-off: it refuses an
  unentitled session, it still saves that session's draft, and it signs off for
  an entitled one.

## QA / Validation

Measured from a dedicated worktree branched at exact `origin/main` `440016702`.

**Baseline, before any edit.** `npx jest src/lib/agent/tools/__tests__` —
10 suites, 69 tests, **0 failing**. The census on that same commit reports **403**
suites reached by a pull-request workflow and puts this directory at **rank 1** of
the uncovered governed-risk list.

**Are these suites worth gating?** Nine control mutations, run against the
directory before the new cases existed. Each was applied to product code, the
directory was run, and the file restored.

| # | Mutation | Result on the base suite |
|---|---|---|
| 1 | `advance_phase` — drop the human-rationale gate | caught (1 failed / 68) |
| 2 | `advance_phase` — advance instead of queuing an approval request | caught (2 failed / 67) |
| 3 | `advance_phase` — `bypass_gate` no longer needs gate-approval rights | caught (1 failed / 68) |
| 4 | registry — drop the defence-in-depth surface gate in `executeTool` | caught (2 failed / 67) |
| 5 | `commit_program` — drop the create-programs entitlement gate | caught (1 failed / 68) |
| 6 | `complete_deliverable` — drop the publish-rights gate on sign-off | **SURVIVED — 10 suites, 69 tests, 0 failing** |
| 7 | `complete_deliverables` (batch) — same gate, batch tool | caught (1 failed / 68) |

**The survivor, closed.** With the three new cases the directory is 10 suites /
**72** tests, 0 failing, and mutation 6 is caught (1 failed / 71). Two further
mutations on the repaired gate are also caught, so the new cases pin the gate's
shape and not merely its presence:

| # | Mutation | Result after the change |
|---|---|---|
| 6 | drop the publish-rights gate on sign-off | caught (1 failed / 71) |
| 8 | over-broad repair — refuse every write, not only sign-off | caught (1 failed / 71) |
| 9 | gate refuses an entitled session too | caught (1 failed / 71) |

The change is a test addition, so there is no red-then-green to quote: the
control was already correct in product code and the tests pass on first run. What
was missing was the test, and mutation 6 is the measurement that demonstrates it —
surviving before, failing after.

**Wiring mutation.** Replacing the new workflow step's command with `echo skipped`
and re-running the census moves suites reached by a pull-request workflow
**413 → 403** and returns `src/lib/agent/tools/__tests__` to **rank 1** of the
uncovered governed-risk list. With the step in place it leaves that list
entirely, and uncovered `critical` directories fall 53 → 52.

**Scope baseline.** `npx jest src/lib/agent/tools` (the wider tree, which includes
directories this change does not gate): **3 failing before, 3 failing after** —
the same two suites both times, 121 tests before and 124 after. Those two are
recorded under Known Gaps.

**Other checks.** `npx jest src/__tests__/behaviors/test-ci-coverage-census.test.ts`
12/12. Node 24 `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
with `tsconfig.tsbuildinfo` removed first — **exit 0**, judged by exit status, not
by grep. Scoped ESLint clean.

## Rollout Plan

Merge to `main` through the repo-owned path. The new step runs on every pull
request and merge group. No runtime rollout, no image change, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unaffected; the merge deploy will be read back as usual.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Test and CI configuration only; no product
  code, route, component, or data-plane path changed.

## Rollback Plan

Revert the commit. The workflow step disappears and the three test cases with it;
nothing else is affected. No migration, no data.

## Audit Evidence

- The pull request for this record, and its `AI surface control catalog` job log —
  the step must appear as `PASS` over the ten suite files, not merely as a
  configured step.
- `node scripts/quality/test-ci-coverage-census.mjs` before and after, for the
  413/403 wiring measurement.
- The mutation table above is reproducible: each row is one edit to the named
  product file, one run of the directory, and a restore.

## Known Gaps

- **Two sibling suites are red and are also in no CI job.**
  `src/lib/agent/tools/intelligence/__tests__` fails 3 tests on clean `main`
  (`sentinel-tools.test.ts` ×2, `_shared.test.ts` ×1). They are outside this
  change's directory and outside the step it adds, they were red before it and
  are red after it, and they are not repaired here — importing a known-red suite
  into a merge gate is the thing this lane does not do. Recorded as a backlog
  item for triage.
- **The publish-rights gate fails open when the caller supplies no access
  policy.** The condition is `wantsSignOff && ctx.accessPolicy && …`, so a caller
  that omits the policy skips the check entirely; the batch sibling has the same
  shape. Whether that is correct is a product call about what an absent policy
  means, and it is not answered here. No test in this change blesses the
  fail-open — a test that pins a gap reads later as a control.
- Deployment inclusion and the runtime invariant read-back follow the merge as
  usual; neither is claimed by this record.
