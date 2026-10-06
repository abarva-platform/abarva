# 2026-10-04-c576-absent-approved-evidence-snapshot-refusal — Pin the absent-evidence refusal on the premium Move build path

## Release ID

`2026-10-04-c576-absent-approved-evidence-snapshot-refusal`

## Status

`candidate`

## Plain-English Summary

The private operator that builds premium Move artifacts refuses to build when the
approved evidence it was queued against is no longer the current evidence. That
refusal has two causes: the approved evidence *moved* after the build was queued,
or there is *no approved evidence at all*. Only the first cause was asserted by any
test. The second ran in production and was named by nothing, so a change that
stopped refusing an evidence-less build would have passed every check.

This release adds two test cases and changes no product code. One drives the worker
end to end with no approved-evidence snapshot and asserts that the run completes
`blocked` with `stale_approved_evidence_snapshot`, and that no artifact is generated
or persisted. The other asserts the same invariant directly where it is enforced, in
`isApprovedMoveEvidenceBasisCurrent`, which is the case that can fail a merge: it sits
in a directory a required status check already runs.

It also records a measurement that corrects an earlier reading of this defect. The
worker's guard is a two-sided test, `!evidenceBasisIsCurrent || !evidenceSnapshot`,
and the second side looked like an unasserted branch worth a test of its own. It is
not reachable as a deciding cause: the predicate already returns false for an absent
snapshot, so the first side is always true whenever the second would be. Deleting the
second side leaves every behavioral case green — it is the type narrowing two later
lines of the worker depend on, and the typechecker, which is a required check, is what
protects it. A test written to pin it would have asserted nothing and no mutation could
have killed it.

## Layer Impact

Release lane: `global-control-lane` — shared app and control-plane behavior for all
clients, with no feature gate. The change is test-only, so what ships to every client
is the assertion, not a behavior difference.

- **Layer 4 — Products (Moves).** Test-only. The premium Move artifact worker's
  evidence-freshness refusal is unchanged in behavior and now asserted for both of its
  causes.
- **Layer 3 — Canonical model.** No schema, no migration, no read-model change.

## Client Applicability

- All clients: no behavior change — no product code was modified.
- Specific clients: none.
- Internal only: the CI assertions.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/__tests__/approved-move-evidence-snapshot.test.ts` — one case:
  `isApprovedMoveEvidenceBasisCurrent` refuses a null snapshot, pinned twice with every
  other conjunct of that early return satisfied (revision present, phase in range,
  `generatedAt` parseable) so a sibling arm cannot cover for the deleted one.
- `src/scripts/__tests__/process-deliverable-queue.test.ts` — one case: a queued premium
  phase build whose approved-evidence loader returns `null` completes `blocked` /
  `stale_approved_evidence_snapshot`, with `generateArtifact` and
  `persistMoveGeneratedArtifact` never called.

No product file changed. No workflow changed; see **QA / Validation** for why a wiring
step was considered and rejected.

## QA / Validation

Base `e08beb6ab5`. Every number below is from a run in this worktree, not inherited.

**The item's stated baseline is stale, and I re-measured rather than quoting it.** The
backlog row names `2 failed / 12 passed / 14 total` as the baseline to beat, measured
2026-10-03. With the exact command CI runs, that suite is `14 passed / 0 failed / 14
total` on `e08beb6ab5`: the two fixtures were repaired by PR #8907 before this work
started, which is what that row's own recommendation asked for. So this release does
not repair what its headline describes.

Clean baseline, same scope, same commands:

- `npx jest --runTestsByPath src/scripts/__tests__/process-deliverable-queue.test.ts --no-coverage --ci` → 14 passed, 0 failed.
- `npx jest src/lib/programs/__tests__ --runInBand` (the required job's own step) → 103 suites, 914 passed, 0 failed.

After, same commands: 15 passed / 0 failed, and 103 suites / 915 passed / 0 failed.
**0 failing before, 0 after**; the two added cases are the only delta.

**Mutation 1 — the guard arm that enforces the invariant.** Delete `!snapshot ||` from
the early return of `isApprovedMoveEvidenceBasisCurrent`
(`src/lib/programs/approved-move-evidence-snapshot.ts`). `git diff --numstat` showed
`1 1` before each run, so the mutation was not a no-op.

- The two new cases, and only those two, fail: `2 failed / 23 passed / 25 total` across
  both suites, the named failures being *refuses an absent approved-evidence snapshot
  rather than reading through it* and *blocks a queued phase build when the approved
  evidence snapshot is absent entirely*.
- The required job's own command reds with it: `npx jest src/lib/programs/__tests__
  --runInBand` goes from `914 passed / 0 failed` to `1 failed / 913 passed`, and the
  one failure is the new case. That is the merge-blocking run, and it now has a line to
  quote.

**Mutation 2 — the arm that looked like the gap, and is not.** Delete
`|| !evidenceSnapshot` from `src/scripts/process-deliverable-queue.ts:127`
(`numstat 1 1`).

- Behaviorally invisible: `25 passed / 0 failed` across both suites, including the new
  absent-snapshot case. No behavioral test can kill it, because an absent snapshot
  falsifies the first operand too.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 1**,
  `TS18047` at `process-deliverable-queue.ts(223,29)` and `TS2345` at `(225,46)`. The
  arm is the narrowing those two lines need, and `Typecheck + reasoning-layer tests` is
  a required context, so it is already protected — by the typechecker, not by a suite.
- This is why no case was written against it. An assertion no mutation can kill is not
  evidence; it is the shape this backlog exists against.

**Wiring, considered and deliberately not changed.** The worker suite is named by path
only in `unit-suites.yml`'s job `Unit suites that pass on main`, which is not among the
19 required contexts read from the rulesets API at 22:58Z. A step naming it inside a
required job was considered and rejected: `scripts/quality/check-named-suite-requiredness.mjs`
states that a suite only a non-required job runs is not a violation and that the control
is not a lever for making every workflow required, and `src/scripts/__tests__` is swept
by no required job. The blocking assertion therefore lives in
`src/lib/programs/__tests__`, which the required `AI surface control catalog` job sweeps
by directory, and the worker case stands as the end-to-end reachability proof in the job
that runs it. `node scripts/quality/check-named-suite-requiredness.mjs` → exit 0,
36 directories swept by a required job.

Other checks, all from this worktree:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → exit 0, no output (baseline exit 0, no output).
- `npx eslint` on both changed files → exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → recorded on the PR.

## Rollout Plan

Merge to `main`. Test-only; no image build, no migration, no flag, no runtime rollout.
The assertions take effect on the next pull request, in the required `AI surface control
catalog` job and in `Unit suites that pass on main`.

## Deployment Authority

Not required: this release changes two test files and cannot affect Azure Container
Apps, deploy workflows, runtime images, flags, environment variables, worker jobs,
traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: unchanged (`.github/workflows/aca-main-deploy.yml`).
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release.
- ACA runtime invariant: unaffected — no runtime template or traffic change.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no. No product surface changes, so there is nothing a
  signed-in walk could falsify that CI does not already cover.

## Rollback Plan

Revert the squash commit. Two test cases are removed and the product returns to the
prior assertion set; no data, migration, or runtime state is involved.

## Audit Evidence

- PR URL and its CI run, recorded on the pull request.
- The two mutation runs above, each with its `git diff --numstat` and its named failing
  or surviving cases.
- `npx jest src/lib/programs/__tests__ --runInBand` before and under mutation 1, which is
  the required job's own command.
- `node scripts/quality/check-named-suite-requiredness.mjs` exit 0.
- Register line for item C-576 in the operator claim log, stamped at the instant of
  writing.

## Known Gaps

- **The gated half of C-576 is not triggered and was not touched.** It conditions on the
  worker still refusing *with* a current snapshot in the fixture; it does not, so the
  product decision it names — which behavior is correct for a premium run whose approved
  evidence moved after queueing — is not reached and was not guessed.
- The worker-level case cannot fail a merge on its own, by the deliberate choice recorded
  above. The invariant it covers can, through the predicate case in the required job.
- The second arm of the worker's guard is covered by the typechecker alone. That is
  adequate and recorded, not a gap to be closed with a test; a behavioral assertion
  against it would be unkillable.
