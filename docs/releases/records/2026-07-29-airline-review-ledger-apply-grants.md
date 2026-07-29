# 2026-07-29-airline-review-ledger-apply-grants — Review Ledger Apply Grants

## Release ID

`2026-07-29-airline-review-ledger-apply-grants`

## Status

`candidate`

## Plain-English Summary

The Airline Knowledge review dry-run package now separates deterministic/routine records from judgment-heavy records. The review job needs a narrow database permission to write the approved review ledger rows for those policy-bound batches. This release grants that job write access only to the governance review-ledger tables and keeps publication, baseline activation, candidate mutation, and consumption projections out of scope.

## Layer Impact

- Governance: allows the approved review job to write policy, batch, batch-approval, and decision ledger records.
- Data plane: changes database grants only; it does not load sources, publish domains, activate a baseline, or refresh product projections.

## Client Applicability

- All clients: none.
- Specific clients: Airline Demo New lab execution only.
- Internal only: governed review-ledger application lane.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260729023000_airline_review_ledger_apply_grants.sql`

## QA / Validation

- pass — migration scope review confirms the review identity receives write grants only for `governance.review_policy`, `governance.review_batch`, `governance.review_batch_approval`, and `governance.review_decision`.
- pass — migration explicitly preserves no-access boundaries for `publication` and `consumption` schemas and does not grant schema creation.
- pass — migration is conditional on the managed-identity database role existing, so fresh local replay remains valid while the Airline lab role receives the grants.
- not-run — governed database migration workflow apply; to run after merge.
- not-run — review-ledger apply job; to run only after migration success with explicit package and candidate-manifest hashes.

## Rollout Plan

Merge through PR, let the normal Azure Container Apps main deploy publish the release record, then run the governed lab database migration workflow in apply mode. After migration success, run the review-ledger apply job with explicit package and candidate-manifest hashes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned main deploy workflow after merge.
- ACA runtime invariant: required before using the runtime image for the ledger apply job.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; product proof follows baseline/projection activation, not this grant.

## Rollback Plan

Apply a follow-up migration that revokes `INSERT` and `UPDATE` on the four governance review-ledger tables from the review managed identity. Ledger rows already written remain auditable and append/update governed by candidate keys.

## Audit Evidence

- PR and CI checks for this release.
- Database migration workflow run applying the grant.
- Review-ledger apply job proof bundle with package hash, candidate manifest hash, accepted/deferred counts, and reconciliation.

## Known Gaps

This does not apply review decisions, publish immutable domains, activate a baseline, build projections, switch product providers, or complete analytics parity.
