# Release Record — Phase Capture Save Response Reports Stored State

## Release ID

`2026-08-20-phase-capture-response-echoes-stored`

## Status

Merged — pending live proof.

## Plain-English Summary

The phase-capture save endpoint described what the caller had sent rather than
what it had written.

The route normalises every value before persisting it (`evaluatePhaseCapture`
trims), but built its response from the raw merged request. Two consequences,
both user-visible:

1. **The client displayed text the database did not hold.** A value ending in a
   space was reported saved at its full length while the stored string was one
   character shorter. The section reported complete, and a reload silently
   changed the value — a direct breach of the invariant that Done means the
   visible value is reproducible from server state after a no-store reload.
2. **The returned revision did not match the one a later read computes.**
   `revision` was hashed over the un-normalised values while GET hashes the
   stored ones. The client echoes that revision on its next write as
   `expectedRevision`, so the user's _following_ edit would be rejected as a
   stale revision with no concurrent writer anywhere.

The fix derives both `values` and `revision` from the evaluation — the same
normalised values the write loop persists.

**How this was found.** By the live proof for
`2026-08-20-phase-capture-server-value-reconcile`, which did not behave as that
release predicted. A client-side reconciliation had been added on the assumption
that the response reported stored state; measuring the deployed build showed the
response echoed the request instead, making the reconciliation inert. That
release record has been corrected in this change. The client-side
reconciliation is retained and becomes load-bearing now that the response tells
the truth.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 (Products — Moves phase capture API). No canonical model change, no
schema change, no migration. Persistence behaviour is unchanged; only the
response payload changed, to describe what persistence actually did.

## Client Applicability

All clients receive this change — it is not feature-flagged and no client is
opted out. It affects Moves phase capture saves for every phase.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-capture/route.ts` — derive the POST
  response's `values` and `revision` from the evaluation's normalised sections.
- `src/lib/programs/__tests__/phase-capture-response-contract.test.ts` (new) —
  5 tests asserting the save revision equals the revision a later read computes,
  plus the negative case proving a raw-request response would not.
- `docs/releases/records/2026-08-20-phase-capture-server-value-reconcile.md` —
  correction of the mechanism claimed in the preceding record.

## QA / Validation

**Status: pass** for everything runnable without a deployed build; live proof
outstanding at time of writing.

- `jest .../phase-capture-response-contract.test.ts` — **pass**, 5/5.
- `jest .../phase-capture-status.test.ts` — **pass**, 20/20.
- `tsc --noEmit` — **pass**, clean. `eslint` — **pass**, clean.
- Failing-suite set byte-identical to the pre-change baseline.
- Live signed-in proof — **pending**: save a value with surrounding whitespace,
  confirm the response reports the stored value, confirm the on-screen value
  survives a no-store reload, and confirm a second consecutive edit saves
  without a spurious 409.

## Rollout Plan

Standard main deploy through the repo-owned ACA main deploy workflow. No flag
and no phased rollout.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only.

## Rollback Plan

Revert and redeploy through the same workflow. No migration to unwind. Stored
data is unaffected either way: the write path already normalised, and this
release does not change what is written.

## Audit Evidence

The reserved regression Move used for the live proofs was restored after each
run and the restoration verified two ways: per-section SHA-256 against
fingerprints captured before the run, and the server's content-addressed
revision returning to its pre-run value `d66cbb39f61461dd`.

## Known Gaps

- Normalisation remains silent. A user who deliberately ends a value with
  whitespace now sees it removed on save rather than after a reload, which is
  better but still unexplained. Surfacing it as visible normalisation is a
  separate UX decision.
- The spurious-409 path is fixed at its source but has no regression test at the
  HTTP layer, because the route requires tenancy and a database. The contract
  test asserts the property the route depends on; a route-level test would need
  the integration harness.
- The green completion tick still appears against sections the user has merely
  scrolled past. That is a distinct defect in the step list, untouched here.
