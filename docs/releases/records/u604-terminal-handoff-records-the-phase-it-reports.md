# u604 — The terminal Tower handoff records the phase it reports

## Release ID

`2026-10-08-terminal-handoff-records-current-phase`

## Status

`candidate`

## Plain-English Summary

Approving the last phase gate is the final step of walking a Move end to end.
The signed-in gate-approval route handles it specially: instead of the ordinary
advance, it runs a terminal handoff that marks the Move complete and hands it to
the Tower.

That handoff wrote three things to the Move's row — the lifecycle state, the
passed-gates array, and the phase lock stamps — and it did not write the one
field that says how far the Move has got. The response it returned said the
Move's new phase was the terminal one. The row still said it was sitting at the
phase before it.

So the reported phase was a claim nothing recorded, and the surfaces that ask a
Move how far it has got could not see the step that had just happened. Three of
them read the phase rather than the lifecycle:

- the advance control, which stops offering itself only once the phase is
  terminal — so it stayed live on a Move that was already finished,
- the executive preview mode, which selects the terminal verification view by
  phase and otherwise falls back to a much earlier interview view, and
- the terminal deliverable set, which is offered only at the terminal phase — so
  the handoff plan, the monitoring plan, the Tower handoff and the outcome
  report were never offered on a Move that had just reached the point of needing
  them.

The other path to the same completed state — the agent-driven close — has always
written the phase alongside the lifecycle state. The two completion paths simply
disagreed, and only the one a person walks through the product was missing it.

This change writes the phase in the handoff, and makes the number reported come
from the handoff itself rather than being restated at the call site, so the
recorded value and the reported value cannot drift apart again.

The deliberate non-change: nothing about whether the gate may be approved moves.
Every precondition, every hard check and every refusal is byte-for-byte
unchanged. This corrects what is recorded after an approval that already
succeeded.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only. Layer 1 (Client Intake), Layer 2 (Source Adapters) and
Layer 3 (Canonical Model) are untouched: no schema, no migration, no adapter, no
intake change and no new read.

The write is one additional column on an UPDATE statement that the same code
path already issues, against a column that already exists and that the other
completion path already sets to the same value. No new statement, no new table,
no new round trip.

## Client Applicability

- All clients: no behaviour change until a Move's terminal gate is approved.
  Before that point the route is byte-for-byte identical, which is asserted by
  the forty-two pre-existing cases in its suite rather than claimed.
- Specific clients: none. No tenant is named in any line of this change, and the
  write is scoped by the same tenant predicate the surrounding update already
  used.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The fix corrects a write on an existing path and
  adds no new gate.

## Changes Included

1. `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`
   - The terminal handoff's engagement UPDATE now sets the current phase to the
     terminal phase, beside the lifecycle state it already set.
   - The terminal phase is a named constant rather than a literal repeated at
     two sites, and the handoff returns the phase it recorded.
   - The call site no longer restates that number; it takes it from the
     handoff's own result. This is the part that prevents the recurrence, not
     the added field.

2. `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`
   - One case: the terminal handoff records the phase it reports, not only the
     lifecycle. It asserts the written value directly, and asserts that the
     reported phase and the transition's target phase both equal it.

## QA / Validation

- **PASS** — route suite: `npx jest --runTestsByPath
  'src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts'
  --runInBand` → 1 suite, 43 tests, 43 passed (42 before this change).
- **PASS** — mutation testing, three mutations, all killed:
  - Dropping the new field from the UPDATE — the exact original defect — fails
    **only the new case**; the two pre-existing terminal-handoff cases stay
    green. That is the evidence the gap was real and unguarded: those cases
    assert the engagement write with a partial object matcher, which cannot
    notice a field that is absent, and they assert the reported phase, which was
    already correct.
  - Setting the constant to the preceding phase — 3 cases fail.
  - Returning a different number from the handoff than the one written, so the
    record and the report disagree — 3 cases fail, caught by the new case's
    agreement assertion.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` → exit 0.
- **PASS** — `npx eslint` over the changed directory → exit 0, no findings.
- **PASS** — behaviours tree, which carries the required named-suite and
  coverage guards: 203 suites, 2111 tests, all passed.
- **NOT RUN** — signed-in walk of a Move through the terminal gate. This record
  may be read as `merged` and `deployed`; it may NOT be read as `live-proven`.
  Proving it needs an authorized signed-in user approving a real terminal gate,
  which is outside this lane.

## Rollout Plan

Rides the normal `main` deploy lane: squash merge to `main`, then the repo-owned
ACA main deploy workflow builds the digest-pinned image and shifts traffic. No
flag to enable, no migration to apply, no data build to run, and no ordering
constraint against any other change.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This change requires no ad-hoc Azure command, no env or flag update, no
revision-weight change and no worker job. The runtime invariant (template image,
100%-traffic revision image and worker job images all matching the approved
digest) is proved by that workflow, not by this record.

## Rollback Plan

Revert the squash commit. The change is one route file and one test file — no
schema, no migration, no backfill, no flag and no new persisted shape — so the
revert is complete and immediate with no cleanup step.

The column written already exists and the other completion path already writes
the same value to it, so a revert cannot strand a row in a shape the product
cannot read: a Move completed while this change was live reads exactly as a Move
completed through the agent-driven close.

## Audit Evidence

- The two completion paths were read side by side rather than inferred. The
  agent-driven close writes the lifecycle state, the status and the current
  phase. The signed-in terminal handoff wrote the lifecycle state, the passed
  gates and the phase lock stamps, and not the current phase.
- The three affected readers were each located in source before the fix was
  written, not assumed: the advance control's terminal guard, the executive
  preview mode selector, and the terminal deliverable-set predicate all compare
  the current phase against the terminal phase.
- The pre-existing suite's blindness is demonstrated by mutation rather than
  argued: reintroducing the defect leaves all forty-two earlier cases green.

## Known Gaps

- **The status column still diverges between the two completion paths.** The
  agent-driven close sets the status to completed as well as the lifecycle
  state; this handoff does not, and this change does not add it. It is left out
  deliberately: at least one listing treats either field as completion, so the
  divergence is not currently user-visible, while writing the status would
  change which lists a finished Move appears in. That is a product call, not a
  correctness fix, and it should be answered before it is written.
- **This route's suite is merge-dark.** The only workflow naming
  `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__` is
  `unit-suites.yml`, whose job is in none of the required contexts, so a
  regression in the live gate-approval route cannot fail a merge — including a
  regression in the case added here. The required catalog already guards the
  superseded gate route's suite and the advance route's approval-gate case, but
  not this one. Wiring it is deliberately NOT in this change: two
  required-coverage wires are in flight and both edit the catalog workflow,
  `unit-suites.yml` and the coverage census, so a third concurrent edit to those
  same three files would collide with both. This is the next candidate once
  those land.
- No signed-in proof. See QA.
