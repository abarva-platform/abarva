# 2026-09-26-source-gate-readiness-invariant-guard — Guard the Source stage-gate readiness invariant without naming the input it refuses

## Release ID

`2026-09-26-source-gate-readiness-invariant-guard`

## Status

`candidate`

## Plain-English Summary

A sourcing event may only move past a stage when a human has ticked the stage's required
confirmations **and** the stage's own gate criteria, artifacts and evidence pass the governance
readiness model. An earlier release removed an optional input on that shared contract which,
when set, returned success for a stage whose criteria were still open, and it left behind two
tests that send that exact field name and assert the contract refuses it.

Those two tests are worth having and they cannot do the job on their own, because a test can
only send a field name that already exists. Measured before this change, on the merge base: add
one clause to the readiness branch of the real contract reading a *differently named* field —
`skipReadiness` — and all 6 cases in that suite stay green, along with 52 tests across the two
stage-advance routes and the governance model. The protected shape is "an input that waives
computed readiness"; what was actually protected was one spelling of it.

This release states the rule over the **result** instead of over any input name. The suite now
drives the real contract through an input object that passes every field the contract's own
interface declares straight through, and answers "yes" to every other name — a name nobody has
written yet included. Over six distinct readiness-failure modes, in two answer shapes (a plain
boolean, for a flag compared with `=== true`; and a nested object that is truthy at any depth,
for an options bag), it asserts two things: the contract's success path stays unreachable, and
the contract consulted no field outside its declared surface at all. The second is the stronger
half — it fails on a renamed opt-in even where that opt-in did not manage to flip the outcome.

Excusing a name is still possible and is now a visible act: it takes an edit to the suite's
declared-field list, which a reviewer reads in the diff. A field genuinely added to the
contract's input type and *not* added to that list fails the typecheck, so the list cannot drift
quietly into excusing something by omission.

No production behaviour changes. One doc comment and one test file; the contract's executable
code is byte-identical to the merge base.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behaviour for all clients, unflagged.
Not `client-data-lane`: no schema, RLS, seed, ingestion, retrieval or private data-plane path is
touched.

- **Layer 4 (Products — Source):** test coverage and one doc comment on the stage-gate advance
  contract shared by the two Source stage-advance surfaces. No executable change.
- **Layer 3 (Canonical model):** untouched. No migration, no projection, no tenant data read or
  written.
- Layers 1 and 2 (client intake, source adapters): untouched.

## Client Applicability

- All clients: the control is tenant-agnostic, and so is the guard over it. No tenant-specific
  behaviour and no tenant data involved.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none, and deliberately: a flag over a test guard would be a way to turn the
  guard off.

## Changes Included

- `src/lib/source/__tests__/gate-advance-contract.test.ts` — added a `describe` block holding the
  result-level invariant: six readiness-failure modes (open criterion, unscaffolded stage gate,
  unresolvable criterion id, missing approval reason, non-adjacent promotion, terminal closure
  with an open criterion) crossed with two undeclared-field answers (boolean, permissive nested
  object), each asserting `ok === false` and an empty undeclared-read list; two positive controls
  asserting a ready stage is still approved through the same wrapper; the declared-field
  allowlist; and a compile-time exhaustiveness check over the contract's input type.
- `src/lib/source/gate-advance-contract.ts` — doc comment only. Records that the invariant is
  held by a name-independent guard and what to do when a field is legitimately added. No
  executable line changed.

## QA / Validation

Every number below is from this branch, over a scope stated with it, against a clean baseline of
the same scope taken by restoring both files from `origin/main` in the same worktree.

**The gap is real, measured rather than asserted.** With `&& (input as { skipReadiness?: boolean
}).skipReadiness !== true` added to the readiness branch of the unmodified contract:
`src/lib/source/__tests__/gate-advance-contract.test.ts` 6 of 6 green,
`src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts` +
`src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts` +
`src/lib/source/__tests__/source-governance-enforcement.test.ts` 52 of 52 green. A waiver under
a new name was invisible to all 58.

**Baseline / after, same scope, clean:**

- `npx jest src/lib/source/__tests__ --no-coverage --ci` — before: 83 suites, 796 tests, 0
  failing. After: 83 suites, 810 tests, 0 failing. (+14: 12 matrix cases, 2 positive controls.)
- `npx jest src/app/api/v1/source --no-coverage --ci` — before: 33 suites, 229 tests, 0 failing.
  After: identical, 33/229/0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, judged by
  exit code rather than by grepping for diagnostics.
- `npx eslint src/lib/source/__tests__/gate-advance-contract.test.ts
  src/lib/source/gate-advance-contract.ts` — exit 0.

**Proven in the direction that matters — four mutations of the real contract, not of a fixture.**
Each was applied to the shipped code, measured, and reverted:

1. *A differently named boolean flag* (`skipReadiness !== true` on the readiness branch): 12 of
   20 red. All 6 boolean-answer cases red on `ok`, and all 6 options-bag cases red on the
   undeclared-read list — the second group catches the renamed field even though the bag never
   satisfied `=== true`. The 6 pre-existing name-based cases stayed green, which is the point:
   they could not see this.
2. *An options-bag waiver under a new name* (`!input.pilotOverrides?.waiveReadiness`): 12 of 20
   red, by the mirror of the above. The 6 pre-existing cases stayed green again.
3. *The readiness gate disabled outright* (`if (false)`): 15 of 20 red, so the new block is not
   only sensitive to renamed opt-ins and the guard as a whole genuinely decides.
4. *A new field added to the contract's input type and not to the suite's allowlist*: `tsc` exit
   1 with `Type '"pilotOverrides"[]' is not assignable to type 'never[]'`, naming the unlisted
   field. The exhaustiveness check runs; it is not a comment.

**Where the guard runs.** `.github/workflows/ai-surface-control-catalog.yml` names this suite
explicitly in the Source stage promotion gate step, and `.github/workflows/unit-suites.yml` runs
`src/lib/source/__tests__` as a whole. The assertions are inside a suite two workflows already
execute, so this is not coverage added outside every routine scope.

**No green test was weakened, replaced or deleted.** All 6 pre-existing cases are unmodified and
still green; the only edit outside the new block is the import statement gaining a type import.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and deploys as usual.
No migration, no flag flip, no data build, no manual runbook step. Nothing in the deployed image
behaves differently — the change is a test guard plus a comment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the merge. No
  workflow file changed in this release.
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
- Live signed-in proof required: **no.** No rendered surface changes and no executable line
  changes, so there is nothing a signed-in session could observe that it could not observe on the
  merge base. Recorded as not-owed with that reason rather than left blank.

## Rollback Plan

Revert the squash commit and redeploy through the same repo-owned workflow. No migration to
unwind, no data written, no state to reconcile. A revert removes a guard rather than restoring a
behaviour, so the question a reverter should answer first is which readiness-waiving input the
guard is in the way of — that is the thing it exists to make visible.

## Audit Evidence

- PR URL and CI run for this branch (recorded on the PR).
- The measured pre-change gap, the clean baselines, and the four mutation results quoted above,
  each reproducible by the commands named in QA.
- `.github/workflows/ai-surface-control-catalog.yml` Source stage promotion gate step and
  `.github/workflows/unit-suites.yml` `src/lib/source/__tests__` step, which are where the new
  assertions run in CI.
- ACA deploy run keyed at or after the merge SHA, and the independently read digest triple.

## Known Gaps

- **A waiver read from something other than the input object is still out of reach.** The guard
  covers the contract's input surface. A readiness waiver sourced from a module-level flag, an
  environment variable, or a second exported overload would not be caught by it, because no input
  answer reaches those. Named here rather than implied by the guard's presence.
- **The two answer shapes are complementary, not exhaustive.** A boolean cannot be walked and a
  bag cannot satisfy `=== true`, so both are driven; a waiver keyed on a *specific* non-boolean
  value (`mode === "pilot"`) would receive the permissive object and not match. Adding an answer
  shape is a one-line edit to the same list.
- **The choice of shape, and what the other one would have cost.** The alternative the item
  allowed was to bind a named review obligation to the file instead of testing anything. It was
  rejected because it is unfalsifiable by construction: a review rule passes whenever nobody
  reads it, and this backlog exists because a gate that could not fail was treated as a gate. The
  executable route costs what is in this diff — roughly 300 test lines, a `Proxy`, and a
  compile-time list someone must extend when they add a field, which is a real and recurring tax
  on anyone widening the contract's input. That tax is the control: widening the waiver surface
  should cost a line a reviewer sees.
