# 2026-10-05-moves-charter-assumption-resolution-write-plan — Moves: decide what resolving a carried charter assumption is allowed to do (flag-gated)

## Release ID

`2026-10-05-moves-charter-assumption-resolution-write-plan`

## Status

`candidate`

## Plain-English Summary

P1 Charter lets someone answer a field from an assumption, naming an owner and
the plan for validating it. P2 Discover inherits those assumptions and, since
the previous increment, stops listing one as open once a resolution stands
against it. Nothing can record a resolution, so the inherited list is still work
nobody can close from the screen it is shown on.

This increment adds the decision half of that write: given the loaded charter
capture rows and a submitted finding, it says either "persist exactly this
record onto exactly this row" or names the reason the write is refused. It is a
pure module with no caller yet — the API persistence and the P2 control are the
next increments — so no resolution can be recorded by this change alone.

The reason the decision is its own module, rather than inline in a route, is
that every refusal it carries describes a write that would have produced a
believable row. A recorded resolution renders as "Discover checked this". A
write that lands against a field that was never an assumption, or against
wording the person has since rewritten, does not read as an error on screen — it
reads as a validation that never happened. There is no safe degraded write here,
so each case is a named refusal and the stored state is left untouched:

- the flag is off, or this is not P2 (the phase whose work the validation plan
  describes);
- the submitted finding has no usable outcome, or an outcome with a blank note —
  the product's claim is that Discover validated the assumption, and an outcome
  with nothing behind it would carry that claim with no finding;
- the section is not one of the canonical charter fields, which is what stops a
  resolution being stamped onto an unrelated capture row;
- the charter field has no capture row to write onto;
- the field is not standing on an open assumption against its **current**
  answer — it was answered from approved evidence or a plain assertion, or
  someone edited the answer after the basis was declared, which clears it;
- a resolution already stands against this answer. The inherited list excludes a
  resolved assumption, so a second write can only arrive from a client working
  off a stale list, and overwriting would erase the first finding with nothing
  left pointing at it.

A permitted write pins the record to the revision of the answer it was written
about, the same way the basis pins its own, so the read can never show a finding
against wording it was not about. It carries every other key on the row through
unchanged, the recorded basis included: a finding says what Discover found, it
does not re-declare how Charter knew.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_assumption_resolution_v1`, tenant list empty). Layer 4 (Products
· Moves) only. No canonical-model change, no intake-template change, no source
adapter touched, no schema or migration. The module reads the capture-module
rows the host already loads and returns a plain object; it performs no read and
no write of its own.

## Client Applicability

- All clients: No (tenant list is empty, and the module has no caller).
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_charter_assumption_resolution_v1` (tenant policy, list
  empty). The flag is one conjunct of the decision; with it unresolved the
  module returns the `inactive` refusal.

## Changes Included

- `src/lib/programs/charter-assumption-resolution-write.ts` (new) — the pure
  write decision: `planCharterAssumptionResolutionWrite` returning either a
  write plan (target row, stamped record, the row's full next state) or one of
  six named refusals, plus `charterSectionModuleKey` for the row a charter
  section's answer and basis live on.
- `src/lib/programs/__tests__/charter-assumption-resolution-write.test.ts`
  (new) — 22 cases: the permitted write and each refusal, including the
  edited-answer and already-resolved cases that a believable-but-wrong write
  would otherwise pass.
- This release record.

No registry change: the flag already exists and its summary already states that
the write path and its control are a later slice, which remains true after this
increment. No generated-artifact churn — `src/lib/programs/__tests__` is run as
a whole directory by an existing required workflow job, so neither the CI
surface catalog nor the test-CI coverage census changes.

## QA / Validation

- `jest src/lib/programs/__tests__/charter-assumption-resolution-write.test.ts`
  — **PASS**: 22/22.
- `jest src/lib/programs/__tests__/` (the whole directory, not only the new
  suite) — **PASS**: 107 suites, 1010/1010.
- Mutation check on the new guards — **PASS**, 5 mutations, 5 deaths: dropping
  the already-resolved refusal fails 1; dropping the unknown-section refusal
  fails 1; widening the assumption check to "any basis" fails 1; dropping the
  row-state spread fails 2; dropping the phase conjunct from the activation
  check fails 1. The mutator asserts its pattern matches exactly once before
  writing, so none of these is a silently-unapplied mutation read as a survivor.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, whole project.
- `eslint` — **PASS**: 0 errors, 0 warnings on both new files.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: 11 of 11
  gates.
- Signed-in live walk — **NOT RUN**. The flag's tenant list is empty and the
  module has no caller, so there is nothing to walk. This record does not claim
  `live-proven`.
- Phone-width layout — **NOT RUN**: this increment renders nothing.

## Rollout Plan

Merge to `main` via squash PR with auto-merge. The module has no caller and the
flag's tenant list is empty, so merging changes no runtime behaviour on any
surface. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. Enrolling a tenant remains a separate controlled change and should
still wait for the persistence and the control, since an enrolled tenant has no
way to submit a finding until then.

## Rollback Plan

Revert the PR. Nothing imports the module, no schema changed, and no resolution
can have been written by this code, so there is no data to migrate or clean up
and no other surface changes behaviour either way.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var, secret, or
scale setting. No data-build job. The merged code is unreachable at runtime
until a later increment calls it and a separate controlled change enrols a
tenant.

## Known Gaps

- **The persistence is not wired.** This is the decision only. The API route
  that applies `nextState` to the named capture-module row, under the usual
  tenant fencing and capture-revision handling, is the next increment. Deliberate
  split: the decision is where every refusal lives, and it is testable without a
  request.
- **The P2 control is not built.** The screen that shows an inherited assumption
  still has no way to record a finding against it. That is the increment after
  the persistence, and it should be designed from the existing charter-basis
  control rather than improvised.
- **Re-resolving is refused, not supported.** A standing resolution against the
  current answer cannot be replaced. If recording a second, different finding
  turns out to be a real need, it wants a history rather than an overwrite; the
  refusal is the conservative placeholder, not a decision that one is unwanted.
- **No case covers a resolution submitted while the answer is being edited
  concurrently.** The revision pin means such a write refuses or lands against
  the wording it was written about, so neither outcome is wrong, but the
  interleaving is not exercised anywhere.
- The surrounding charter-basis family's earlier gaps are unchanged by this
  increment: an insert still records a basis before the answer is saved
  (non-atomic by choice), and nothing flag-gated in this family has been
  measured at phone width.

## Audit Evidence

- The suite above is the behavioural record; it is run by the existing required
  workflow job that sweeps `src/lib/programs/__tests__` as a directory.
- The mutation results in QA / Validation are the evidence that each refusal is
  load-bearing rather than decoration.
- `npm run release:check -- --base origin/main --head HEAD`: 11 of 11 gates PASS.
