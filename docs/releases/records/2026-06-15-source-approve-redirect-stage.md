# 2026-06-15-source-approve-redirect-stage — Approval lands on the stage it advanced to

## Release ID

`2026-06-15-source-approve-redirect-stage`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Follow-up fix for Strategy-at-P0. When approving the intake advanced the event to Scope, the approval card still
redirected to a **stale `?stage=strategy` URL** — it was built from the event's stage *before* approval — so the
operator landed back on the now-completed Strategy view (all gates cleared, a redundant "Advance to Scope"
button) instead of in Scope. It looked stuck even though the advance + gate-waivers + memo all succeeded.

This makes the approval **land on the stage the event actually advanced to**: the approve route already returns
`advancedToStage` in its response; the card now redirects to that stage (e.g. `?stage=scope`) instead of the
pre-approve `currentStageHref`. When nothing advanced, behavior is unchanged.

## Layer Impact

- `global-control-lane`: `EventApprovalCard` reads `advancedToStage` from the approve response and redirects to
  it after a successful approve. No schema, API, or server change — the field was already returned by the
  approve route.

## Client Applicability

- All clients: approval redirects to the correct post-approve stage.
- Specific clients: SkyHarbor — where Strategy-at-P0 advances to Scope; this lands the operator in Scope.
- Internal only: None.
- Public/demo only: None.
- Feature flag: effective only when an advance occurs (Strategy-at-P0, `source_strategy_at_p0`); no flag of its
  own.

## Changes Included

- `EventApprovalCard.tsx`: add `advancedToStage` to `ActionResult`; redirect to
  `/source/events/{id}?stage={advancedToStage}` after approve when present, else the prior `currentStageHref`.

## QA / Validation

- PASS: `npx eslint` clean · `tsc --noEmit` clean.
- Pending: live on ACA — approve a fresh SkyHarbor intake and confirm you land directly on **Scope** (not the
  completed Strategy view with a redundant advance).

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift traffic → approve a fresh event and confirm Scope
landing.

## Rollback Plan

Revert the PR — restores the prior redirect (lands on the pre-approve stage). No data/schema to unwind.

## Audit Evidence

PR diff (ActionResult field + redirect target + this record), CI checks, local eslint/tsc output, the live
screenshot of the stale Strategy view with 3/3 cleared + the redundant advance dialog that motivated it, and
the post-deploy capture of an approval landing directly in Scope.

## Known Gaps

- This fixes the *view* the operator lands on; it does not change the underlying advance/gate logic (which was
  already working). The broader durable async approval-time generation remains a separate follow-on.
