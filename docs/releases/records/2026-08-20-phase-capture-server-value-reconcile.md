# Release Record — Phase Capture Server-Value Reconcile

## Release ID

`2026-08-20-phase-capture-server-value-reconcile`

## Status

Merged — pending live proof.

## Plain-English Summary

The phase capture surface could display text that the server had not stored,
while marking the section complete. A reload silently changed the value.

The server normalises every capture value on write — `evaluatePhaseCapture`
trims it. The client kept the raw draft. So a value ending in a space was
stored one character shorter than the text on screen, and the two never
converged:

- the section stayed permanently dirty, because draft never equalled persisted;
- the autosave pass therefore re-sent the same value on every cycle, producing
  repeated writes for as long as the page stayed open;
- and the control displayed text that a no-store reload would not reproduce.

> **Correction, added after the live proof of this release.** The first two
> bullets above are wrong, and the third is right for a different reason. The
> save response echoed the _submitted_ values rather than the stored ones, so
> the client's persisted copy matched its draft immediately: there was no
> permanently-dirty section and no repeated-write loop. Measured on the
> deployed build, a save that changed one value produced exactly one write and
> zero further writes in the following six seconds.
>
> What was real is that the client believed a value the database did not hold.
> This release's reconciliation is therefore correct but inert on its own —
> it reconciles against a response that already equals what was sent. It only
> becomes load-bearing once the response reports stored state, which is the
> follow-up release `2026-08-20-phase-capture-response-echoes-stored`.
>
> The mechanism claimed here was inferred from reading the client, not measured.
> That is the error: the reasoning was plausible, the code path was real, and it
> still was not what the running system did.

The fix: after a successful save, adopt the value the server says it stored
rather than assuming it kept what was sent. A key is only reconciled when its
draft is still exactly what was sent — if the user typed while the request was
in flight, their newer text wins. Overwriting it would lose input, which is the
class of defect this same autosave path already had once.

**How this was found.** Not by review — by the live proof for
`2026-08-20-phase-capture-input-integrity`. Typing 640 characters ending in a
space, saving, and reloading returned 639. The badge read complete throughout.
That is a direct breach of the invariant that release had just shipped:

> Done means the value currently visible in the control is reproducible from
> authoritative server state after a no-store reload.

The invariant did its job: it turned a silent one-character difference into a
falsifiable claim, and the claim failed.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 (Products — Moves phase capture surface) only. No canonical model
change, no schema change, no migration. Server-side normalisation is unchanged;
only the client's reconciliation of the acknowledged response changed.

## Client Applicability

All clients receive this change — it is not feature-flagged and no client is
opted out. It affects Moves phase capture for phases 1–5; phase 0 is excluded by
the existing autosave guard.

## Changes Included

- `src/lib/programs/phase-capture-status.ts` — add
  `reconcileDraftWithAcknowledged`, returning the same object identity when
  nothing changed so a no-op save cannot force a render.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — reconcile
  the draft against the acknowledged response after a successful save.
- `src/lib/programs/__tests__/phase-capture-status.test.ts` — 6 further tests.

## QA / Validation

**Status: pass** for everything runnable without a deployed build; live proof
outstanding at time of writing.

- `jest src/lib/programs/__tests__/phase-capture-status.test.ts` — **pass**,
  20/20, including the case that reproduces the live failure (trailing space →
  server trims → badge must still be able to reach Done) and the case that
  guards against the obvious wrong fix (never overwrite text typed while the
  save was in flight).
- `tsc --noEmit` — **pass**, clean.
- `eslint` on all touched files — **pass**, clean.
- `jest src/lib/programs src/components/strategic-moves` — **pass**; the failing
  suite set is byte-identical to the pre-change baseline.
- Live signed-in proof — **pending**: type a value ending in whitespace, save,
  reload, and confirm the visible value round-trips and the badge reaches Done.

## Rollout Plan

Standard main deploy through the repo-owned ACA main deploy workflow. No flag
and no phased rollout: the current behaviour displays unstored text as complete.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only.

## Rollback Plan

Revert the commit and redeploy through the same workflow. No migration to
unwind. Reverting restores the display/stored divergence and the repeated-write
behaviour.

## Audit Evidence

The reserved regression Move used for the live proof was restored afterwards and
the restoration verified two ways: a per-section SHA-256 comparison against
fingerprints captured before the run, and the server's own content-addressed
revision returning to its pre-run value `d66cbb39f61461dd`.

## Known Gaps

- Reconciliation is keyed on "the draft still equals what we sent". If a user
  types and then retypes the identical bytes during a single in-flight request,
  that is indistinguishable from not having typed; the server value is adopted.
  The outcome is the same text either way, so this is benign.
- The server still normalises silently. A user who deliberately ends a value
  with whitespace sees it removed with no explanation. Surfacing that as visible
  normalisation, rather than a silent edit, is a separate UX decision.
- This release does not address the green completion tick appearing against
  sections the user has merely scrolled past, which is a distinct defect in the
  step list.
