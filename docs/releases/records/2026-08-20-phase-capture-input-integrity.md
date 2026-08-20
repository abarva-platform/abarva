# Release Record — Phase Capture Input Integrity

## Release ID

`2026-08-20-phase-capture-input-integrity`

## Status

Merged — pending live proof. This record is upgraded to `live-proven` only after
the signed-in browser proof below is captured.

## Plain-English Summary

Typing into a phase capture field could silently lose characters. On the live app
one character was dropped roughly every 53 typed; a 480-character answer lost 9.
The user saw no error — the text simply did not appear.

Two changes:

1. The autosave effect no longer schedules React state from its own body. It
   marks sections as "Saving" inside the debounce timer instead.
2. The per-section status badge now comes from one shared, unit-tested state
   machine rather than two places reading the same state differently.

**Why the first change is structural and not a debounce tweak.** A keystroke
commits on React's SyncLane, and React flushes passive effects synchronously
inside that commit. A `setState` in this effect's body therefore left DefaultLane
work pending on every keystroke, so React's nested-update counter never reset and
threw at its limit. React 18 only tested for SyncLane here; React 19 widened the
test to include DefaultLane, which is what made the path reachable at all.

The throw surfaced inside the textarea's own `onChange`. React's controlled-input
restore runs in a `finally`, so it wrote the stale committed value back to the DOM
and destroyed the character. This is why the defect survived API and database
testing: the lost characters never reached the request.

Scheduling the status update inside the timer means a keystroke commit leaves no
React lane pending — only a `setTimeout`, which React does not track. The counter
resets on every keystroke, so the failure is unreachable at any typing speed
rather than merely made less likely by slowing input down.

**The badge invariant this encodes.** Done now means exactly one thing: the value
currently visible in the control is reproducible from authoritative server state
after a no-store reload. An in-flight save, a failed save, or any divergence
between the displayed value and the acknowledged server value all prevent Done.
Matching an empty server value reads Open, not Done. Without this the badge is a
completeness decoration rather than a statement about durability.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 (Products — Moves phase capture surface) only. No canonical model change,
no source adapter change, no client intake change, no schema change, no migration.

## Client Applicability

All clients receive this change — it is not feature-flagged and no client is opted out. It affects every Moves phase capture surface for
phases 1–5. Phase 0 is not affected: its autosave path is excluded by an existing
guard.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — move the
  autosave status write out of the effect body into the debounce timer; delegate
  badge derivation to the shared module; unify the second badge site in the finder
  detail pane onto the same derivation.
- `src/lib/programs/phase-capture-status.ts` (new) — pure state machine:
  `resolvePhaseCaptureStatus` and `statusSatisfiesDurabilityInvariant`.
- `src/lib/programs/__tests__/phase-capture-status.test.ts` (new) — 14 tests.

## QA / Validation

**Status: pass** for everything runnable without a deployed build; live proof
outstanding at time of writing.

- `jest src/lib/programs/__tests__/phase-capture-status.test.ts` — **pass**, 14/14.
  Includes an exhaustive sweep asserting the invariant holds across every
  combination of draft value, persisted value and save status.
- `tsc --noEmit` — **pass**, clean.
- `eslint` on both touched files — **pass**, clean.
- `jest src/lib/programs src/lib/deliverables` — **pass**, 4,122 tests passing.
  13 failures are byte-identical to the pre-change baseline, verified by a
  stashed-baseline comparison; none are in the touched paths.
- Live signed-in browser proof — **pending**: rapid typing over 500 characters,
  a 1,000-character paste, rapid successive edits, navigating away immediately
  after typing, a forced save failure, a successful save, and a no-store reload
  confirming the visible value round-trips.

## Rollout Plan

Standard main deploy through the repo-owned ACA main deploy workflow. No feature
flag and no phased rollout: the current behaviour loses user input, so there is no
population for whom the existing path is preferable.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only. No ad-hoc `az containerapp update`,
no branch pipeline, no direct ACR build. Shared web traffic is shifted only by
that workflow, against a digest-pinned image.

## Rollback Plan

Revert the commit and redeploy through the same workflow. No data migration to
unwind and no persisted state depends on either change, so rollback is a pure code
revert. Reverting restores the character-loss defect, which is the reason not to.

## Audit Evidence

- Stashed-baseline test comparison proving the 13 pre-existing failures are
  unchanged by this work.
- Live proof is captured against the reserved regression Move. Its capture values
  are restored after the run and the restoration is confirmed by a no-store
  reload, so the fixture is left byte-identical to its pre-run state.

## Known Gaps

- The live proof is not yet captured; this record may not be called `live-proven`
  until it is.
- The autosave debounce still re-arms on every change to the captured values, so a
  user typing continuously for longer than the debounce window has their save
  deferred until they pause. That is the pre-existing behaviour and is unchanged
  here; converting it to a throttle is a deliberate behaviour change and belongs in
  its own release.
- The status machine models durability, not conflict. A concurrent edit from
  another session is caught by the server-side revision fence, which returns 409;
  the badge surfaces that as a failed save without distinguishing it from a
  transport error.
