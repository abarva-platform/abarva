# Source current Client Final restoration

## Release ID

`2026-09-30-source-current-final-restoration`

## Status

`candidate`

## Plain-English Summary

A later draft or quality review could replace the working body's link after a reviewed Client Final had become authoritative. The file cabinet retained the accepted version, while downstream generation read a different link. This change refuses new draft generation while an accepted Client Final is current, makes quality review read-only for that final, and provides a narrow, signed-in restoration action for a drifted working link.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: No supplier, contract, spend, pricing, or approval fact is created or changed.
- Layer 4: Source checks current artifact authority before generation. Restoration reads the existing accepted file, verifies its stored hash, and repairs the event's working body/link with actor and audit metadata. It does not create a new file version, approval, or stage decision.

## Client Applicability

- All clients using Source New Client Final artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reject regeneration when an accepted current Client Final exists for the same tenant, event and artifact.
- Quality-review requests verify the accepted file bytes and working link, assess the unchanged body without an automatic rewrite, and record only a receipt bound to the final ID and file hash. A failed review cannot create or link a draft.
- Fail closed on duplicate or unreadable current authority.
- Show restoration only when the viewed stage's linked ID differs from its current accepted Client Final. Keep ordinary replacement hidden for completed stages.
- Recheck signed-in upload and stage-approval rights, event tenancy, accepted authority, blob path and SHA-256 at action time. Restore only the accepted bytes and link; clear the draft's stale quality receipt and write an audit activity.

## QA / Validation

- Pass: Red-first focused tests, then 37/37 focused tests after implementation.
- Pass: Negative cases cover cross-tenant/event authority, distinct app and registry tenant keys, supersession, missing actor/time, duplicate finals, insufficient rights, mismatched blob hash and idempotence.
- Pass: Five practical mutations were caught: removal of current-authority filtering, hash verification, UI mismatch check, generation rejection and review-only mode.
- Pass: Review-only failure test confirms metadata-only persistence and no rewrite or link mutation.
- Pass: TypeScript with a larger Node heap.
- Not run: Signed-in restoration and downstream replay until the official main deploy.

## Rollout Plan

Open a PR, await applicable CI and review, then squash-merge. Only `.github/workflows/aca-main-deploy.yml` deploys shared ACA runtimes. Prove the digest-pinned web template, 100%-traffic revision and both workers before signed-in restoration and exact downstream replay.

## Deployment Authority

- Repo-owned web deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Database migration or data job: None for this change.
- Shared runtime mutators from this branch: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a PR and the repo-owned main workflow. Accepted versions and their original approvals remain in the file cabinet. Restored working links are auditable and can be inspected against their file hashes.

## Audit Evidence

Private journey ledger records the exact signed-in blocker, event-scoped read-only metadata diagnosis, red/green tests, mutation failures, PR/CI state, runtime digest and signed-in replay. Public artifacts contain only the repair mechanism.

## Known Gaps

This does not apply a separately pending evidence-applicability schema migration or claim Scope exit. A restored final requires a fresh quality review if the prior receipt was attached to the overwritten draft.
