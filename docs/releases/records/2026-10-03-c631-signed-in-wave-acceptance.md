# Signed-in acceptance walk for the 2026-10-02 product wave

## Release ID

2026-10-03-c631-signed-in-wave-acceptance

## Status

Documentation only. `deployed` once merged; no signed-in acceptance is owed for
this change itself, and none is applicable — see Known Gaps.

## Plain-English Summary

A wave of product merges went out on 2026-10-02 and nobody had signed in and
looked at any of it. Tests passing and a green deploy are not the same thing as
a person reading the surface, and the backlog item this closes exists because
that gap kept being recorded as if it were acceptance.

So somebody signed in and looked. This change adds the result to the shared
acceptance matrix: one block, one row per surface, each marked pass, fail or
blocked, with what was actually observed written next to it. Three surfaces
pass. One fails and is filed. Four are blocked and each says what would unblock
it and why this run was not allowed to do it — three of those four would have
needed an action that writes, and an unattended run does not discover whether a
gate holds by trying to walk through it.

The walk also found a defect nobody was looking for: four numbers are printed
to an executive with a space in the middle of the decimal.

## Layer Impact

Layer 4 (Products) only, and only as evidence *about* it. This change ships two
markdown documents. It alters no route, component, control, validator, flag,
environment variable, scale rule, secret, schema or dataset, and touches no
lane's runtime behaviour: not the data plane, not the control plane, not the
canonical model.

## Client Applicability

None directly. The walk was performed against the composite reference tenant, a
synthetic portfolio the surface labels `DEMO · CANDIDATE — UNREVIEWED`. No real
client data was read, and no tenant data was written.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — a new dated block for
  the 2026-10-02 wave: the runtime invariant read before and after, ten result
  rows, the stated limits, a second reading of an existing open item, and two
  observations recorded as needing a product call rather than filed as defects.

## QA / Validation

The deliverable here is a measurement, so the validation is the measurement's
own discipline rather than a test count.

- **Runtime invariant, before and after the walk, read independently with
  read-only `az` rather than taken from the deploy's claim.** 16:07:25Z and
  16:17:21Z both returned template image = sole 100%-traffic revision
  `ca-abarva-web-lab-eastus--me0854427` (Healthy / Running) = both delivery
  worker jobs = `sha256:e57ba358…f89b`. Unchanged across both reads, which is
  how "no deploy during the walk" is evidenced rather than asserted.
- **The walk was deferred until the invariant held.** At 16:04:53Z template and
  serving revision disagreed because a deploy was in flight; starting then would
  have put a traffic shift inside the walk.
- **Before / after is not the applicable measure and that is a statement, not an
  omission.** Nothing executable changed, so there is no guard to break, no
  suite whose count could move, and no mutation to run. A before/after number
  here would be ceremony.
- Claims were checked against each merge's own stated behaviour, including its
  negative claims, by measurement rather than by reading for tone: zero currency
  or percentage tokens in the industry band, zero digits outside its two group
  counts, zero `risk score` occurrences, zero sponsor-approval controls, 6 of 6
  approver cells naming the authorized workspace user, 3 of 7 export elements
  present.
- The decimal defect was isolated before filing: reproduced in the raw server
  response (1,188,437 bytes) to rule out a client transform, and contrasted
  against 9 correct renderings of the same figure and 680 correct decimals in
  the same payload to establish the generator is inconsistent rather than
  uniformly broken.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded in
  Audit Evidence.

## Rollout Plan

Merge through the protected PR path, then the repo-owned ACA main deploy
workflow, as for any other merge. Nothing to enable, flag or stage: the change
is inert at runtime.

## Deployment Authority

The repo-owned `aca-main-deploy` workflow on `main`, and nothing else. No
feature-branch, local or ad-hoc Azure command touched the shared runtime during
this work. Every Azure call made was read-only (`az containerapp show`,
`revision list`, `job show`).

## Rollback Plan

Revert the PR and redeploy through the same workflow. There is no data, schema
or configuration state to reverse, and reverting removes a record of a
measurement rather than restoring a behaviour.

## Audit Evidence

- The matrix block itself, naming the walker, the window (16:07:25Z–16:17:21Z),
  the SHA and the two invariant reads.
- Deploy run `aca-main-deploy` 37135052683 on `e085442776`, `createdAt`
  2026-10-03T15:57:02Z, `updatedAt` 2026-10-03T16:06:59Z, success.
- Merge times quoted from GitHub's own `mergedAt` for all twelve PRs the item
  names, not from an executor clock.
- Items filed from the walk: **U-554** (export omits four of the seven context
  elements its merge claims) and **C-637** (broken decimals in generated
  narrative). A second, independent reading of the already-open **U-553** is
  recorded in the matrix rather than refiled.
- `release-check`: 11 of 11 gates passed locally before the PR was opened.

## Known Gaps

- **No signed-in acceptance is claimed for this change and none is applicable.**
  It ships two documents and no product surface. What it live-proves is other
  merges.
- **Four of the ten rows are `blocked`, and they stay owed.** The server-side
  half of the sole-approver change needs a committed approval by a second
  identity; the premium readiness accounting needs a generation run; the
  truthfulness statements need a tenant whose record reaches the state that
  renders them; the lab e-signature path needs provisioning that the runtime
  does not currently carry. Each is named in its row with what would unblock it.
- **The walk's SHA is shared with another open item.** `e085442776` is also the
  SHA named by C-635, whose own three merges this walk does not prove. The
  matrix says so explicitly so the rows are not over-credited.
- **One row is blocked by an undistinguished cause**, and is recorded as such
  rather than resolved by guessing which of two readings is true.
- The walk observed one refusal-shaped surface as a refusal and did not attempt
  the action behind it.
