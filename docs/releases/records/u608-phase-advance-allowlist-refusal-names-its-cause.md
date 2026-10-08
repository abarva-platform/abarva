# u608 — The phase-advance refusal names the access it needs

## Release ID

`2026-10-08-phase-advance-allowlist-refusal-detail`

## Status

`candidate`

## Plain-English Summary

One API route advances a Move from one phase to the next, and it is the only
product path that does so. The first thing it does is check the caller's
allowed-program list. If the Move the caller asked to advance is not on that
list, the route refuses.

That refusal said nothing. It answered the single word `forbidden` and no
sentence. Both product controls that call the route show the response's `detail`
sentence and, when there is none, fall back to a generic message: one says
"Failed to advance phase", the other "Phase advance failed — please try again".
So the one refusal a user can never clear by retrying was the one that told them
to retry, and it was indistinguishable from a transient fault or a bug.

The guard twenty-four lines below it — the one that checks whether the caller may
approve gates at all — already carried a sentence: "Only an authorized workspace
user can approve a phase gate." Two sibling authorization guards in the same
route, both answering 403, and only one of them legible. This closes that
asymmetry.

The list is restrictive in three live cases, not one. An account with no program
grants gets an empty list; an account whose membership is explicitly
program-scoped gets an empty list; and a participant-scoped account gets exactly
the program ids it participates in. Only an administrator or a client-wide
member bypasses the fence with a null list. So the fence is on the ordinary
path, not an edge, and the two cases deserve different sentences: an account
with no grants at all needs to be told that, while an account with some grants
needs to know the requested Move is not among them.

The refusal is deliberately silent about the requested Move. For a restricted
caller the fence answers **before** the Move row is ever read, so a nonexistent
id, another client's id, and an unauthorized id in the caller's own client all
arrive at the same branch. The sentence therefore describes only the caller's
own grants — never the requested record, never the requested id, and never any
granted id. A case pins that a nonexistent id and a foreign id produce
byte-identical refusals, and another pins that the count comes from the list
length rather than a de-duplicated set, so nobody can later "improve" the count
into a signal about the list's contents.

The status code does not move. The fence answered 403 before and answers 403
now. The cross-tenant denial contract is a separate path — a restricted caller
never reaches it, and an unrestricted caller still gets 404 from the Move read —
and the mutation that changes this refusal to 404 is caught.

Every one of the twelve pre-existing cases in the route's own suite set the
allowed-program list to null, so this fence — the route's first guard — had no
test coverage of any kind. It now has four route-level cases and sixteen unit
cases.

No decision changes. A request the route permitted before is still permitted,
and a request it refused before is still refused, by the same predicate. Only
the refusal gained prose.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 3 (Canonical Model) and Layer 4 (Products) are untouched in substance: no
schema change, no read model change, no projection change, no change to which
records any caller may reach. The change is confined to the text of one refusal
response on one mutation route, plus the tests that pin it.

Layer 1 (Client Intake) and Layer 2 (Source Adapters): unchanged.

No gate rule, gate criterion, deliverable registry entry, phase model entry or
capture contract is touched. No authorization decision is widened or narrowed.

## Client Applicability

- All clients: yes. The route serves every client, and the improved refusal
  applies wherever the allowed-program list is restrictive.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional because it cannot refuse or
  permit anything the previous code did not.

## Changes Included

- `src/lib/programs/phase-advance-authorization-outcome.ts` — new module.
  `resolvePhaseAdvanceAllowlistRefusal` returns `null` when the allowed-program
  list permits the request and otherwise the refusal body. No database access
  and no `server-only` import, so a suite exercises it directly.
- `src/app/api/v1/programs/[programId]/advance/route.ts` — the hand-rolled fence
  predicate is replaced by a call to that module; the bare
  `{ error: "forbidden" }` becomes the module's body. Same position in the
  route, same status, same error code.
- `src/lib/programs/__tests__/phase-advance-authorization-outcome.test.ts` —
  new suite, 16 cases: the inherited decision across every shape of list
  (including a matrix case that runs the replaced predicate as the oracle), the
  prose, and the three no-disclosure properties.
- `src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts` — four
  cases on the fence itself: the two refusals reach the caller with their
  sentences, the Move row is not read before the fence answers, and a
  restricted caller granted the Move still advances.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `src/lib/programs/__tests__/phase-advance-authorization-outcome.test.ts`:
  16 of 16.
- **PASS** — `src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts`:
  16 of 16 (12 pre-existing, 4 new).
- **PASS** — Mutation testing, **12 applied, 12 killed**. Each mutator asserted
  its anchor matched exactly once before writing, so no mutation silently
  applied to nothing:
  1. drop the null-list bypass → 12 fail
  2. drop the list-membership bypass → 4 fail
  3. make the empty-list branch unreachable → 2 fail
  4. always pluralise the count → 1 fail
  5. count a de-duplicated set instead of the list length → 1 fail
  6. change the refusal's error code → 2 fail
  7. echo the requested id into the sentence → 2 fail
  8. empty the sentence on the no-grants branch → 3 fail
  9. route reverts to the bare `{ error: "forbidden" }` → 2 fail
  10. route answers 404 instead of 403 → 3 fail
  11. remove the fence from the route entirely → 3 fail
  12. let "please try again" into the sentence → 1 fail
  Baseline restored and re-verified green afterwards (32 of 32).
- **PASS** — `src/__tests__/integration/programs/programs-mutation-routes-tenant-guards.test.ts`:
  40 of 40. This suite pins the cross-tenant denial status for this route and is
  the contract a named refusal can break; it mocks the allowed-program list as
  null, so it never exercised this fence and is unmoved by the change.
- **PASS** — neighbouring advance surfaces, 25 of 25 across the route's
  approval-gate suite, both phase-advance control suites, and the program detail
  gate-approval controls suite.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all four changed or added source files, exit 0.
- **PASS** — coverage census regenerated honestly: testFiles 2861 → 2862,
  coveredTestFiles 2697 → 2698, pullRequestCoveredTestFiles 2696 → 2697, each a
  single honest +1 for the one new suite. `uncoveredTestFiles` unchanged at 164.
  The new suite needs no workflow edit: `src/lib/programs/__tests__` is swept as
  a directory by the required `AI surface control catalog` job.
- **PASS** — `npm run audit:tenancy-fence-coverage:write` produced no diff.
- **NOT RUN** — live signed-in walk. See Known Gaps.

## Rollout Plan

Squash merge to `main`, then the repo-owned ACA main deploy workflow carries it
to the shared Product/Lab web runtime on its normal path. No ordering
constraint against any other release, no migration, no backfill, no flag to
enable, and no data change. The route behaves identically for every caller it
previously permitted.

## Deployment Authority

Not applicable beyond the standard repo-owned path. This release does not
change Azure Container Apps configuration, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic weights, DNS, or
environment promotion.

- Repo-owned deploy workflow: untouched.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image change in this
  release; the next main deploy builds and pins as usual.
- ACA runtime invariant: unaffected by this change; the standard post-deploy
  proof still governs the deploy that carries it.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, to call it `live-proven` — see Known Gaps.
  Merge and deploy alone do not earn that word.

## Rollback Plan

Revert the pull request. The new module has exactly one caller and no
persistence, so a revert restores the prior bare refusal with no data,
migration, or deployment consequence, and no state to unwind. The module, the
route call site and the tests must be reverted together — reverting the route
alone would leave the route's four new cases asserting prose the route no longer
sends.

Nothing in this release writes to any table, so there is no partial-write state
a rollback must repair.

## Audit Evidence

- The new module's doc comment records why the fence is reachable three ways,
  why the refusal withholds existence information, and why the error code and
  status are unchanged.
- The route suite's new describe block carries a comment recording that every
  pre-existing case set the list to null, so the gap this closes is documented
  where someone deleting the cases would read it.
- The matrix case in the unit suite runs the replaced predicate as its own
  oracle, so a future change to the decision — as opposed to the prose — fails
  against the behaviour this release inherited rather than against a
  hand-written table.
- Mutation results above, with per-mutation failure counts.

## Known Gaps

- **Live signed-in walk owed.** Nothing in this release is `live-proven`. The
  regression direction matters most: a caller who could advance a phase before
  must still advance it, because that is the demo walk's own path. The new
  refusal direction needs an account with a restrictive allowed-program list to
  observe, which is an authorization setup step, not a code step.
- **The route's 500 catch-all is still illegible on one of the two controls.**
  It emits its prose under `message`, not `detail`. The program detail surface
  reads `detail ?? message` and shows it; the phase-advance control reads only
  `detail`, so an internal error reads there as the same generic "Failed to
  advance phase". Deliberately left out of this release: giving it a `detail`
  is a judgement call about whether a raw internal error string should reach a
  product user, and it is a different defect from the fence.
- **The sibling `canApproveGates` guard was left in place, unmoved.** Folding it
  into the same module would have moved it ahead of the Move read and changed
  which of 403 and 404 a caller sees for a nonexistent id. That reordering is
  not worth bundling with a prose fix.
- **`/api/programs/phase-gate` is a second, dark route** with three further
  phase-1-to-phase-2 preconditions of its own. It has no product fetcher — an
  existing comment in `src/lib/programs/approved-gate-phases.ts` already records
  this — so its refusals reach no user and are not touched here. Retire-or-mount
  is a product call, not a defect.
