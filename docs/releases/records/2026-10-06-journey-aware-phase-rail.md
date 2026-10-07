# Source — the phase rail stops promising a phase the journey never visits

## Release ID

2026-10-06-journey-aware-phase-rail

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

The Source New phase rail showed every phase an event had not reached as **"Later"**, whether or not
the event's journey would ever visit it. A renegotiation does not go to market, and the rail said it
would — telling an operator to expect work that will never arrive.

A phase whose journey declares it skipped now reads **"Not on this path"**.

Two journeys are defined. `competitive_rfp` skips nothing. `contract_optimization` declares
`skippedStageKeys` including `rfp`, which is the only canonical stage the market-package phase
stands for — so that phase is off the path for a renegotiation, and now says so.

## The boundary that makes this safe

**Only a declared motion may put a phase off the path, never an inferred one.**

`getSourceJourneyForEvent` infers a motion from free text when none is recorded. That inference is
not strong enough to tell an operator a phase will never happen, and wiring the rail to it directly
is worse than the behaviour it replaces:

The workspace fixture's trigger reads *"A contract is nearing renewal."* The resolver reads that as
a renegotiation — yet **an approaching renewal is the classic trigger for a competitive re-bid**,
which very much does go to market. Acting on the inference marked the market package "Not on this
path" for any event whose trigger mentioned a renewal. That was measured, not predicted: wiring it
without the guard failed **6 of the rail's own rendering tests**, and the fixtures those tests use
have no declared motion at all.

So the off-path claim is gated on a governed `sourcingMotion` field being present. An unread motion
behaves exactly as this surface did before the field existed.

The check also runs **after** the current-phase branch, deliberately: where the event actually is
beats what its journey declared, so a stage resolving to a phase the journey calls skipped surfaces
as `current` rather than hiding behind an off-path label.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product). One new `SourceNewPhaseState` value and its label, four journey read-through
exports, an optional view field, and one line of page wiring. No schema change, no migration, no
new query. The journey resolver itself is untouched — this is a read-through of a decision it
already makes.

## Client Applicability

**All clients**, with no per-client gating and no feature flag. Visible only on events that record a
`sourcingMotion` of `contract_optimization`; every other event renders exactly as before.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts` — the `off_path` state, its label, the four journey
  exports, the declared-motion guard, and the consumer in `sourceNewPhaseState`.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — optional `sourcingMotion` on the
  view.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` — passes the event's motion.
- `src/lib/source/new-workspace/phase-state.test.ts` — 11 cases appended to the existing suite.

**Attribution.** The four journey exports and the view field are ported from
`exec/run-20261005T1455Z` (PR #9036, *"pin the journey-blind phase rail and carry the journey onto
the workspace"*), which has been conflicting since 5 October. That PR added the logic and the
plumbing but **no consumer** — nothing rendered differently. This change adds the consumer, the
`off_path` state, and the declared-motion guard that makes acting on the journey safe. It was
rebuilt on a fresh branch rather than pushed to that lane's branch.

No new test file and no census or workflow edit: the cases are appended to a suite
`unit-suites.yml` already names.

## QA / Validation

| Check | Status |
|---|---|
| `phase-state.test.ts` | PASS — 50 cases, 11 appended |
| Rail-rendering suite `SourceNewWorkspace.test.tsx` | PASS — 139 tests, no regression |
| All `src/lib/source/new-workspace` suites | PASS — 13 suites, 138 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — a phase with no stages counts as skipped | PASS — **7 cases** failed as intended |
| Mutation — `some()` instead of `every()` | PASS — failed as intended |
| Mutation — off-path checked before the current branch | PASS — failed as intended |
| Mutation — drop the off-path branch (PR #9036 as written) | PASS — failed as intended |
| Mutation — collapse the label onto "Later" | PASS — failed as intended |
| Mutation — drop the declared-motion guard | PASS — 1 case here and **6 in the rail suite** |
| Signed-in acceptance | NOT RUN |

The first mutation matters more than its size suggests: `every()` over an empty array is `true`, so
removing the zero-length check reports `request` and `suppliers` — which stand for no canonical
stage — as off-path for every event.

The reachability of the new state was measured rather than assumed: `contract_optimization`'s
declared `skippedStageKeys` contain `rfp`, and `rfi` stands for exactly `["rfp"]`, so the branch is
reachable from a real journey rather than only from a fixture.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The rail returns to showing "Later" for phases a journey never visits.

## Audit Evidence

- A mutation that removes the declared-motion guard fails here **and** fails 6 of the rail's own
  rendering tests, so the inference boundary cannot be removed quietly.
- A control in the inferred-motion case asserts that the resolver really does infer the skipping
  journey from that trigger text, so the guard is measured rather than passing against a journey
  that never skipped anything.
- A mutation restoring PR #9036's shape — the logic with no consumer — fails, which is what
  distinguishes this change from it.

## Known Gaps

- **This does not make the rail navigable.** Clicking a phase still does not show what was recorded
  there; the workspace renders only the current stage's panel. That was observed signed in on the
  deployed product and is a separate, larger piece of work. The phrase "carry the journey onto the
  workspace" in #9036's title refers to carrying the journey *definition*, not the recorded content.
- **Only an event with a declared motion benefits.** Events whose motion is unread render exactly as
  before, which is most of them. Recording the motion is a separate slice.
- The journey resolver's free-text inference is left as it is. This change declines to act on it;
  it does not fix it. An approaching renewal still resolves to a renegotiation, which is wrong often
  enough to matter and is worth filing against the resolver rather than the rail.
- Only `rfi` can be off-path today, because no defined journey skips both of `define`'s stages and
  the other two phases stand for no canonical stage.
- Not deployed and not live-proven. No signed-in readback.
