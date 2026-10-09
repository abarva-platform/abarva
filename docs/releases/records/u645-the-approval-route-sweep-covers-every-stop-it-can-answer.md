# u645 — The approval route's refusal sweep covers every stop it can answer

## Release ID

`2026-10-09-u645-origination-close-stop-sweep-derived`

## Status

`candidate`

## Plain-English Summary

Approving the first phase gate of a Move goes through one server route, and that
route has one product caller. When the phase-0 close cannot finish, the route is
what tells the signed-in person why: it returns a named code and an authored
sentence per cause, and the rule it must hold is that only a genuine gate
verdict may call itself a blocked gate. Every other stop — the Move's record
could not be read, no such Move exists for this workspace, the Move had already
left phase 0, the documents already recorded could not be read, the brief could
not be built, the close threw — gets its own code, its own sentence, and a
different next action.

One test in that route's suite is the only place those claims are checked across
the whole group of non-verdict stops: that the answer is a 409, that the sentence
is non-empty, that it never tells a product user to read a server log, and that
it does not borrow the word "gate". The group it walked was a list typed by hand
when there were four such stops.

The close helper now reports six. Two were added in the change immediately
before this one, which did not touch this suite — so two stops that the first
step of every Move can now produce reached this route with nothing here
exercising them. Every case stayed green, because a sweep over a hand-typed list
cannot fail for a list that stopped growing.

This change does not alter what the route answers. Measured: all six stops
already produce a 409, a distinct code, their own sentence, and none says
"gate". What changed is that the group is no longer retyped. The module that
classifies the outcomes already holds a classification the compiler requires to
be exhaustive — a missing outcome there does not compile — and this exports the
non-verdict group derived from it. The route's sweep imports that group, so it
cannot fall behind the union again, and it additionally asserts that the route
passes each stop's OWN code and sentence through rather than collapsing the
group onto one of them.

Because a sweep over a group is only as good as the group, the group's own shape
is pinned too: its size is asserted against the full outcome roster minus the
two excluded arms, and each member is cross-checked against an independent
property — a non-verdict stop is exactly an outcome whose error code is neither
absent nor the gate-blocked code.

## Layer Impact

Release lane: `global-control-lane`. The change is shared app-layer test and
classification code with no feature gate and no client-scoped data path.

- **Products (Moves)** — test and classification only. The route's responses,
  status codes, sentences and control flow are unchanged; a new derived export
  is added to an existing pure module.
- No change to the canonical model, source adapters or client intake.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The exported group and the suite changes are
  flag-independent.

## Changes Included

- `src/lib/programs/origination-close-outcome.ts` — new derived export
  `ORIGINATION_CLOSE_NON_GATE_STOPS`, filtered from the existing
  compiler-checked `OUTCOME_KIND` record. No existing export, sentence or code
  changed.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`
  — the non-verdict stop sweep now iterates the derived group (4 → 6 stops),
  asserts per-stop code and sentence pass-through, and gains a case pinning the
  group's size and membership against an independent property.

## QA / Validation

- `npx jest --runTestsByPath` on the gate-approval route suite and the
  origination-close-outcome suite: **PASS** — 71 tests, 2 suites, 0 failures.
- Mutation testing, **6 designed mutants / 6 killed**: **PASS**
  - mislabel a non-verdict stop as the gate verdict → 3 fail
  - let the derived group keep the success arm → 2 fail
  - let the derived group keep the gate verdict → 2 fail
  - route collapses every stop's sentence onto one outcome's → 3 fail
  - route hardcodes the gate-blocked code → 3 fail
  - the unreadable-documents sentence loses its "nothing was added" claim → 1 fail
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`:
  **PASS** (exit 0).
- `npx eslint` on every changed file: **PASS** (exit 0).
- `npx prettier --check` on every changed file: **PASS**.
- `npm run audit:test-ci-coverage:write` and
  `npm run audit:tenancy-fence-coverage:write`: **PASS** — regenerated honestly;
  no count moved, because no test file was added or removed.
- `npm run release:check -- --base origin/main --head HEAD`: see the PR run.
- Live signed-in walk: **NOT RUN** — see Deployment Authority.

## Rollout Plan

Merge to `main` through the repo-owned squash merge. No runtime rollout is
required or performed: nothing in a served response changes, so there is no
image to build and no revision to shift. The change becomes effective for CI on
merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — not
  invoked by this change.
- Shared runtime mutators: none. This change performs no Azure operation.
- Approved image digest: unchanged; no runtime update is part of this release.
- ACA runtime invariant: not applicable — no runtime update.
- Worker image invariant: not applicable — no worker job changed.
- Feature/env flag update path: not applicable — no flag introduced or changed.
- Live signed-in proof required: **no**. There is no observable product change
  to prove. The route's responses were measured as unchanged by the suite above.

## Rollback Plan

Revert the single squash commit. No migration, no data write, no flag and no
runtime state are involved, so the revert is complete on merge. Reverting
restores the hand-typed group and re-opens the coverage hole; it changes no
served response.

## Audit Evidence

- The PR and its CI run.
- The mutation table under QA / Validation: the six designed mutants and which
  cases each one fails.
- The derived group's measured contents at this commit: 8 outcomes in the
  roster, 6 non-verdict stops, the two exclusions being the success arm and the
  gate verdict.

## Known Gaps

- The two most recently added outcomes are now swept against this route, and
  they were measured as already answered correctly. This release closes a
  coverage hole; it does not fix a wrong answer, and it should not be read as
  having found one.
- The suite mocks the close helper, so the LABEL each case asserts is one the
  case hands itself. That is the right split — the route's duty is to pass the
  label through, and the producer side is pinned by the close helper's own
  suites — but it means nothing here proves the helper reports the stop it
  should for a given failure.
- The same hand-typed-group risk exists wherever else a suite enumerates a
  union by hand. This release fixes one instance; the class has not been swept
  repo-wide.
- The first blocking step of the end-to-end path remains outside code: the
  archetype declaration and the pending-evidence load are owed to the data
  lane, and the in-app evidence approval and signed-in walk are owed to a human
  approver. Nothing in this release changes that.
