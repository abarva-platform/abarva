# 2026-09-26-source-gate-readiness-bypass-removal — Remove the computed-readiness bypass input from the Source stage-gate contract

## Release ID

`2026-09-26-source-gate-readiness-bypass-removal`

## Status

`candidate`

## Plain-English Summary

A sourcing event may only move past a stage when two separate things are true: a human has
ticked the stage's required confirmations, and the stage's own gate criteria, artifacts and
evidence pass the governance readiness model. The shared contract that answers that question
also accepted an optional input which, when set, returned success for a stage whose criteria
were still open — evidence skipped, gate recorded as advanced.

Nothing in the product passed that input. Both live callers — the stage-advance route and the
event approval route — call the contract without it, so no live approval behaviour changes here
and nothing that is approvable today becomes unapprovable. What is removed is the affordance:
one field on one call was the whole distance between "this event's evidence is complete" and
"an authorized approver said so anyway". That conflates same-person decision authority with
permission to skip evidence, which are different things, and the second is not something this
contract should be able to grant to anyone.

After this change an open criterion or evidence requirement is answered the same way for every
caller: a 409 blocker naming what is open, and no stage write. Clearing an individual criterion
still has a legitimate path — the recorded waiver in the criterion-state route, with a signed-in
actor, a written reason and a review time — and that path is untouched. The difference is that
skipping the gate is now always a recorded act with an owner, never an option on a request body.

The result object carried a companion field listing "which blockers were bypassed". With the
bypass gone it could only ever be empty, and it was being written into the event's activity
trail on every promotion. A permanently-empty field named for a capability that no longer
exists is an invitation to repopulate it, so it is removed too rather than left to be read as
evidence that bypassing is a thing the system does.

## Layer Impact

Release lane: `global-control-lane` — shared application/control-plane behaviour for all clients,
unflagged. It is not `client-data-lane`: no schema, RLS, seed, ingestion, retrieval or private
data-plane path is touched.

- **Layer 4 (Products — Source):** the stage-gate advance contract shared by the two Source
  stage-advance surfaces. Strict-mode self-approval rules, append-only approvals, human
  confirmation requirements and the recorded-waiver path are all unchanged; only the
  readiness-bypass input and its now-unreachable result field are gone.
- **Layer 3 (Canonical model):** no schema, no migration, no tenant data touched. No read model
  or projection changed. The activity-trail metadata written on a stage promotion loses one
  key that was always an empty array.
- Layers 1 and 2 (client intake, source adapters): untouched.

## Client Applicability

- All clients: yes, for the control itself — the contract is tenant-agnostic and both callers
  are shared. No tenant-specific behaviour, no tenant data read or written by this change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Deliberately unflagged: a flag here would be a second way to re-enable
  the bypass, which is the thing being removed.

## Changes Included

- `src/lib/source/gate-advance-contract.ts` — removed the `allowComputedReadinessBypass` input
  from `SourceGateAdvanceContractInput`, removed `&& !input.allowComputedReadinessBypass` from
  the readiness gate, removed the `bypassedGovernanceBlockers` field from
  `SourceGateAdvanceContractResult` and its four return sites, and replaced the doc comment that
  described the bypass as a supported pilot affordance with what is true now, including where a
  criterion may still legitimately be cleared.
- `src/lib/source/__tests__/gate-advance-contract.test.ts` — replaced the case that pinned the
  removed behaviour (see QA below for why that is not a weakened test) with two cases that drive
  the real contract with the bypass field still set; retargeted one positive assertion off the
  removed result field onto `readiness.ok`.
- `src/app/api/v1/source/[eventId]/stage/route.ts` — dropped the always-empty
  `bypassedGovernanceBlockers` key from the `stage_promoted` activity metadata.
- `src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts` and
  `src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts` — the contract mocks
  returned the old result shape; updated to match.

No route signature, request body contract, migration, seed, loader, adapter, workflow or
dependency changed.

## QA / Validation

Every number below is measured over one named scope against a clean baseline on the same scope,
never quoted as an absolute repo failure count.

**Baseline, before any edit,** on `origin/main` `fb7487bc0` in a fresh worktree:
`npx jest --runTestsByPath` over the contract suite and the two route suites —
**3 suites, 33 tests, 0 failing.**

**Red first.** The new case was written before the contract was touched and failed on the
unmodified contract: `1 failed, 5 passed of 6` in the contract suite, the failure being
`expect(verdict.ok).toBe(false)` receiving `true` — the bypass converting an open
`gate_criterion_open` into a 200 approval. That is the defect reproduced through the real
`evaluateSourceGateAdvanceContract`, not read out of the source.

**After the fix,** same three suites: **3 suites, 34 tests, 0 failing** (0 failing before, 0
after; one test added).

**Mutation, twice, because one mutation could have been absorbed by a sibling guard:**

1. Reinstating the removed condition (`!readiness.ok && !(input as …).allowComputedReadinessBypass`)
   turns the contract suite red at exactly the new case — `1 failed, 5 passed of 6`, naming
   "has no input that converts an open gate criterion into an approval". So the new test fails
   for the reason it claims, and it is the test carrying this guarantee.
2. Disabling the readiness gate altogether (`if (false)`) turns **3** of the 6 red — the new
   case plus the two pre-existing readiness cases. So the readiness gate is not redundant: the
   removal left a guard that genuinely decides, rather than one whose work another branch does.

Restoring the file returns the suite to 6 passed.

**The replaced test, stated rather than buried.** `"preserves pilot computed-readiness bypass
without bypassing confirmations"` was green and is gone. It was not weakened to make a suite
pass: it pinned exactly the behaviour this release removes, so it had to become its opposite or
the change could not exist. Its second half — that a bypass never waives human confirmations —
is preserved as its own case, which now sends the same field and still gets a 422
`confirmations_required`, so the confirmation guarantee is still asserted with the bypass-shaped
input present and not merely in its absence.

**What the new tests do not prove,** written into the test file itself rather than left implied:
a bypass reintroduced under a *different* field name would pass them, because a test can only
send a field name that exists. The sibling case with no extra input at all is what catches an
unconditional bypass. The shape that remains uncovered is precisely "a new opt-in nobody passes
yet", which is a code-review obligation, not a testable one.

**Wider sweeps, all green:** `src/lib/source/__tests__` plus `src/__tests__/behaviors` —
226 suites, 2318 tests, 0 failing. All Source v1 API routes (`src/app/api/v1/source`) —
33 suites, 229 tests, 0 failing.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after
deleting `tsconfig.tsbuildinfo` — **exit 0, zero diagnostics.** The exit code is what is judged
here, not a grep of the output: a bare `npx tsc --noEmit` exits 134 on this host with no
diagnostics at all, and the stale build-info has previously reported both a false clean and a
false error.

**Lint:** `npx eslint` over the five changed files — exit 0.

**CI coverage of the new assertions is wired, not merely available.** The contract suite is
already named in a job step in `.github/workflows/ai-surface-control-catalog.yml` ("Exercise the
Source stage promotion gate"), so the new cases run on every PR. They were deliberately added
to that suite rather than to a new file whose runner would have had to be established first — a
test no job executes proves nothing.

No live approval was performed, no tenant row was read or written, no ACA job was run.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow then builds and deploys as
usual. No migration, no flag flip, no data build, no manual runbook step. The change is pure
application code and takes effect with the deployed image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the merge.
  No workflow file changed in this release.
- Shared runtime mutators: none. No `az containerapp update`, no traffic weight change, no env
  var, secret, scale or flag mutation by hand from this branch.
- Approved image digest: assigned by the main deploy workflow for the merge commit; recorded
  against this release once the run completes.
- ACA runtime invariant: to be proven after deploy by reading Azure directly — the web Container
  App template image, the image on the Healthy 100%-traffic revision, and the required worker job
  images must all equal the same digest-pinned reference. The workflow's own summary is not the
  evidence.
- Worker image invariant: same digest as web; no worker template change in this release.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: **no.** This is a server-side control with no rendered surface.
  Its behaviour is the HTTP outcome of the two stage-advance routes, and both are covered by
  suites that drive them. Proving it by signing in would require attempting a real stage advance
  against a tenant event with an open gate criterion, which is a tenant mutation this lane must
  not perform. Recorded as not-owed, with that reason, rather than left blank.

## Rollback Plan

Revert the squash commit and redeploy through the same repo-owned workflow. No migration to
unwind, no data written, no state to reconcile. The revert restores the bypass input, which is
why the two new test cases are the thing to look at if a revert is ever proposed: if something
turns out to need the bypass, the answer is a recorded waiver on the criterion, not the input.

## Audit Evidence

- PR URL and CI run for this branch (recorded on the PR).
- The red-first, green-after and two mutation results quoted above, each reproducible by the
  commands named in QA.
- `.github/workflows/ai-surface-control-catalog.yml` step "Exercise the Source stage promotion
  gate", which runs the suite carrying the new assertions.
- ACA deploy run keyed at or after the merge SHA, and the independently read digest triple.

## Known Gaps

- A readiness bypass reintroduced under a new field name is not detectable by these tests, for
  the reason given in QA. It is a review obligation.
- The backlog item that produced this change also asserted that the approval route currently
  opts callers into the bypass when strict mode is off. That half is **false on
  `origin/main` `fb7487bc0`** and was reported back to the backlog with the measurement rather
  than coded against: `allowComputedReadinessBypass` occurred in exactly two files, the contract
  and the contract's own test, and neither route passed it. The stage route does compute a
  `canPilotSelfApprove` flag, but spends it only on an activity-metadata label. So this release
  removes a dormant affordance; it does not close a live hole, and should not be read as having
  closed one.
