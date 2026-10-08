# u620 — A failed sign-off criterion states which of its four states it is in

## Release ID

`2026-10-08-deliverable-signoff-diagnosis`

## Status

`candidate`

## Plain-English Summary

Five HARD gate criteria — one for every phase boundary from the charter onward —
are a single call to the same predicate, which asks "is this document signed
off?" and answers with a bare `true`/`false`. That predicate refuses for four
structurally different reasons:

1. no such document exists on the Move at all,
2. the document exists but is not recorded as signed off,
3. it is signed off, but the approved artifact it points at does not belong to
   this Move — wrong workspace, wrong Move, not a generated deliverable, or
   superseded, and
4. it is signed off, but it was approved against an older evidence basis than
   the evidence now approved for that phase.

All four arrived at the reader as one sentence: the criterion's own description,
which restates the criterion rather than the cause. "Discovery synthesis report
signed off" is what a blocked reader saw whether there was no report, a draft
report, a mis-linked report, or a correctly signed report whose evidence basis
had moved underneath it. Those four states need four different, mutually
exclusive actions, and the reader was given none of them.

State (2) is the one that most needs saying, because the obvious remedy is the
wrong one. Re-running the phase build replaces the document with a fresh
unapproved draft, which clears the very sign-off the gate is waiting for — the
live workspace already carries that hazard as a comment beside the control. A
sentence that prescribed a rebuild there would prescribe the one action that
cannot work, so only states (1), (3) and (4) may mention regenerating.

State (4) is the one most likely to be met on a walk, and the most confusing
when it is: the document is visibly signed off on the same screen that reports
the sign-off criterion as failed. The natural order of work produces it —
approving evidence for a phase after a document for that phase was signed moves
the basis the signature was recorded against.

This release turns the predicate's verdict into a named cause and gives each
cause a sentence that names exactly one next action. The document's name is read
from the deliverable registry rather than typed into the sentence, so a renamed
document renames itself in these messages. The gate reason already reaches the
screen — the standalone workspace joins the failed hard checks' reasons into the
blocked message, and the advance route puts them in its `detail` — so no client
change is needed for the better sentence to be read.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 3 (canonical model) and layer 4 (products) only, and within layer 4 only
the message a blocked reader is given:

- **No gate verdict changes.** The pass/fail answer of every criterion is
  byte-for-byte what it was. The predicate's boolean is now derived from a
  verdict object (`signOffVerdict(row).ok`), and every one of its other callers
  reads that same boolean through an unchanged `isSignedOff`. What changed is
  only the `reason` string attached to a check that was already failing.
- No schema, migration, RLS policy, read model, route contract, or deliverable
  generation path changes. No tenant data is read that was not already read.
- No new runtime dependency, no image or workload change.

## Client Applicability

- All clients: yes — any blocked sign-off criterion now states its cause. No
  client's gate opens or closes differently as a result.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This is a strictly additive diagnostic on an existing
  failure path, so gating it would only delay the better sentence.

## Changes Included

- `src/lib/programs/deliverable-signoff-diagnosis.ts` (new, pure) — the cause
  union, the registry-backed document label, and the sentence per cause. The
  ladder carries a defensive final arm so a cause added to the union without an
  arm still yields a stated cause rather than an empty string; the module
  documents that this arm is unreachable from today's caller, which asks for a
  sentence only when the verdict failed.
- `src/lib/programs/governance.ts` — the sign-off predicate becomes
  `signOffVerdict(row): { ok, cause, status }`, with `isSignedOff(row)` kept as
  `signOffVerdict(row).ok` so all other callers are unchanged. The two early
  "this approval is not evaluable, leave the recorded sign-off standing" exits
  return the same pass they returned before. The five single-call HARD criteria
  (`charter_signed_off`, `discovery_report_signed_off`,
  `readiness_and_change_plan_signed_off`, `handoff_package_signed_off`,
  `value_measurement_contract_signed_off`) read the cause and set the failure
  reason from it.
- `src/lib/programs/__tests__/deliverable-signoff-diagnosis.test.ts` (new) — 21
  cases over the pure module.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — 7 cases at
  the gate level, reading `failedChecks[].reason` directly rather than through a
  partial matcher.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/deliverable-signoff-diagnosis.test.ts`:
  21 of 21.
- **PASS** — `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts`:
  59 of 59 (52 pre-existing, 7 new). The 52 pre-existing cases passing unchanged
  is the regression proof for the predicate refactor.
- **PASS** — `npx jest src/lib/programs/__tests__`: 180 suites, 2,389 tests.
- **PASS** — `npm run test:behaviors`: 208 suites, 2,163 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`:
  exit 0.
- **PASS** — `npx eslint` over all four changed/added source and test files:
  exit 0, no warnings.
- **PASS** — mutation testing, **12 designed, 12 killed**:
  1. all five call sites reverted to the bare boolean, dropping the reason — 7
     cases fail. **This is the decisive one**: it is the proof that the named
     cause reaches the gate verdict a reader actually sees, rather than being
     computed and discarded.
  2. the `absent` sentence rewritten — 2 fail.
  3. the "do not re-run the build" clause deleted — 2 fail.
  4. `absent` collapsed into `not_signed_off` in the verdict — 1 fails.
  5. `linked_artifact_integrity` collapsed into `evidence_basis_stale` — 1 fails.
  6. the label ignores the registry title and prints the raw key — 12 fail.
  7. the defensive final arm returns an empty string — 4 fail.
  8. a blank or padded recorded status is no longer normalized — 2 fail.
  9. the discovery-report call site names the charter instead — 2 fail.
  10. the recorded status is dropped from the verdict — 3 fail.
  11. the verdict's pass object flipped to a failure — 24 fail, which is what
      guards the two unevaluable-basis arms that must leave a recorded sign-off
      standing.
  12. `isSignedOff` stops reading the verdict and returns `true` — 10 fail.
- **PASS** — `npm run audit:test-ci-coverage`: committed census matches.
  Measured honestly: the base commit carries **+2 inherited drift** (committed
  2869, a regen of the base alone reads 2871), and the one new test file makes
  2872, so this record's regen is `+3` of which `+1` is this change.
- **NOT RUN** — signed-in walk. No Move has been taken through a gate with these
  sentences on screen. See Known Gaps.
- **NOT RUN** — `npm run test:integration` and the e2e suite: neither exercises
  the gate reason string, and both need credentials this lane does not hold.

## Rollout Plan

Merges to `main` behind the standard required checks and ships with the next
`main` deploy through the repo-owned ACA main deploy workflow. No flag to flip,
no data migration, no ordering constraint against any other change. The new
sentences appear the first time a reader is blocked by one of the five criteria
after that deploy.

## Deployment Authority

The repo-owned ACA main deploy workflow (`.github/workflows/aca-main-deploy.yml`)
only. This change does not touch the deploy lane, any Container App template,
any revision weight, or any image tag, and nothing in it may be deployed by a
feature-branch, local, or ad-hoc Azure command. No worker job image changes.

## Rollback Plan

Revert the squash commit. The change is additive on an existing failure path and
holds no state: there is no written record, no schema object, and no cached
value to unwind, so a revert restores the previous generic sentence immediately
and nothing else. No data repair step. The refactored predicate is reverted with
it in the same commit, and because `isSignedOff` kept its signature and its
boolean, no other call site needs touching either way.

## Audit Evidence

- Mutation 1 above is the reachability evidence: the reason is read by
  `MovesPhaseStandaloneClient`, which joins the failed hard checks' reasons into
  the blocked message, and by the advance route, which puts them in `detail`.
  Both readers were verified to read `check.reason` before the fix was written.
- The "do not rebuild" constraint in the `not_signed_off` sentence is pinned by
  its own case, so a later edit cannot quietly prescribe the action the live
  surface documents as destructive to the sign-off.
- Labels are asserted equal to `DELIVERABLE_REGISTRY`'s own `documentTitle` for
  all five keys, so a renamed document fails a test rather than degrading a
  sentence to a bare identifier.

## Known Gaps

- **Not `live-proven`.** Nothing here has been seen on a signed-in walk. The
  sentences are pinned by tests at the gate level, not by a human reading them
  on screen.
- **`business_case_approved` is out of scope.** It is also a HARD criterion and
  also reports only its own description, but it refuses through a different,
  asynchronous helper (`meetsApprovalBar`) rather than this predicate. Giving it
  the same treatment is a separate, larger change and is deliberately not
  attempted here.
- **The soft criteria that call the predicate are unchanged**, including
  `tower_handoff_plan_accepted`, `funding_approval_recorded` and
  `sponsor_alignment_confirmed`, and so are the criteria where the predicate is
  one term of a longer disjunction (`launch_readiness_attested`,
  `tower_cadence_defined`, `p5_open_risks_recorded`,
  `discovery_baseline_attested`). In a disjunction the cause of one false term
  is not the cause of the criterion's failure, so attributing it would be wrong,
  not merely incomplete.
- **The `linked_artifact_integrity` sentence names four possible ownership
  faults without saying which one applies.** The predicate's integrity check is
  a single conjunction, so the specific field is not separated today. Splitting
  it is a further increment of the same kind.
- **One pre-existing formatting warning is left in place.** `governance.ts` does
  not satisfy the formatter at an import statement on the base commit, and that
  statement was restored to its base form rather than reformatted, so this
  change neither adds nor removes an unclean line.
