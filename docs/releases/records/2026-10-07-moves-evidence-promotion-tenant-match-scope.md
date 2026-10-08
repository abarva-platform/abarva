# 2026-10-07 — Move evidence promotion tenant match scope

## Release ID

`2026-10-07-moves-evidence-promotion-tenant-match-scope`

## Status

`candidate`

## Plain-English Summary

A reviewer could see a Move's pending current-state evidence in the cabinet but could not approve it. The reader that lists pending evidence already matches every tenant key that one tenant's own evidence may be stored under, because two producers write those rows under two different names for the same tenant. The governed promotion that flips a review to approved still matched a single one of those names, so when the other producer had written the row the update matched nothing, every fallback missed the same row, and the request came back as "no pending review" for the item displayed on screen. The phase could not be exited through the product and nothing on the surface explained why. The promotion now matches the same tenant key set the reader matches. The values it writes are unchanged, so a promotion cannot re-key the row it matched, and the set is one tenant's own keys only.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: no schema, migration, or stored-value change. Row ownership is unchanged; only which existing rows a tenant-scoped update may match.
- Layer 4 product projection: the evidence review control in the current-state cabinet now succeeds for rows it already displays. No route contract, response shape, or display logic changes.

## Client Applicability

- All clients: the promotion predicate now agrees with the read predicate. For a client whose rows all carry one key this is a no-op.
- Specific clients: clients whose app client key and canonical substrate key differ are the ones that could not approve displayed evidence.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none. This repairs an existing control rather than adding one.

## Changes Included

- `decideEvidenceReview` matches the tenant's own key set on its pending-review lookup, its update predicate, its already-decided fallback, and its evidence-item fallback.
- A new suite pinning that promotion scope, including the fence that keeps the widened set per-tenant.
- Test/CI coverage census regenerated.

Deliberately unchanged: the row-creation idempotency check in `ensureEvidenceReviewForUploadedEvidence` stays keyed to the single app client key, because that path decides which key a NEW row carries rather than which existing rows belong to this tenant.

## QA / Validation

- PASS: new promotion scope suite, 9 cases.
- PASS: owning suite directory and the current-state route suites — 153 suites, 1952 tests.
- PASS: TypeScript project typecheck, exit 0.
- PASS: ESLint on both changed files, exit 0.
- PASS: mutation check. Narrowing each of the four widened predicates back to a single key is caught, one site at a time, 4 of 4. Widening the set across tenants is also caught, so the fence cases are not vacuous.
- PASS: coverage census regenerated; covered test files 2653 to 2654 with uncovered unchanged, so the new suite is swept by a required job rather than dark.
- NOT RUN: live signed-in approval of displayed pending evidence. That needs a deployed image and an authorized human reviewer, and it is the proof that closes this.

## Rollout Plan

Merge through a PR with squash. The repository-owned ACA main workflow builds and deploys a digest-pinned image. Verify the runtime invariant, then have an authorized reviewer approve one displayed pending evidence item and confirm the readiness family moves from review required to committed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only the repository-owned main workflow.
- Approved image digest: record from the main deploy before claiming the change is live.
- ACA runtime invariant: verify the Container App template image, the 100% traffic revision image, and required worker job images all match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — an approval that succeeds on an item the cabinet lists as pending.

## Rollback Plan

Revert this commit. The change is confined to the match predicates of one function plus a test; it writes no new values and performs no migration, so reverting restores the previous single-key matching with no data to undo. Rows approved while it is deployed stay approved and remain correct, because they were this tenant's rows under this tenant's own key either way.

## Audit Evidence

The PR and merge commit, this record, the new suite and its mutation results recorded above, the coverage census delta, and after deployment the ACA image digests plus the signed-in approval proof.

## Known Gaps

- The live signed-in approval is not yet performed, so this is not live-proven.
- One previously loaded synthetic source set is still keyed to the canonical substrate key. This change makes that readable AND approvable, which removes the need for the separate re-key repair to unblock review; the repair record stays open on its own terms and is not superseded by this change.
- Other writers against the same tables were not swept in this change. Only the promotion path was measured and fixed here; a sweep of the remaining single-key match predicates is owed separately.
