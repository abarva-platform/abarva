# 2026-10-05 — Synthetic supplier scale fixture

## Release ID

`2026-10-05-source-synthetic-supplier-scale`

## Status

`candidate`

## Plain-English Summary

Adds a larger fictional supplier test pool to exercise Source candidate filtering across category-routed sourcing archetypes. It does not declare a client-approved panel or change supplier contact authority.

## Layer Impact

Release lane: `public-demo`. Layer 1: a synthetic lab fixture only. Layer 3: an optional, separately approved canonical load could add fictional supplier identities. Layer 4: no product code changes; the current Source projection would read canonical rows only after a governed load.

## Client Applicability

Public/demo lab only. No real client is affected and no feature flag changes.

## Changes Included

Versioned CSV, governance manifest, field guide, package validation test, and an explicit v1/v2 choice in the manual operator workflow. V2 is dry-run only; its apply branch refuses before Azure login. The original fixture remains unchanged.

## QA / Validation

Pass: red-first focused Jest suite (four package tests after fixture creation); deleting one v2 candidate made the scale assertion fail at 49, then the exact CSV hash was restored. Pass: manifest validation, local exact-hash loader dry run (50 planned suppliers, zero writes), and Node 24 TypeScript check. The workflow selector's focused red-first test and hosted CI/release-check statuses are recorded in the PR before merge.

## Rollout Plan

Merge publishes test data and enables manual v2 dry runs through the repo-owned operator workflow. The ACA main workflow may build the new commit, but no vendor rows are written by deployment. A separate exact-hash approval and load gate are required for any v2 lab apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Operator workflow: manual dry run only for v2; no v2 apply.
- Approved image digest: established by that workflow after merge, not by this record.
- ACA runtime invariant: verify separately if claiming deployment.
- Worker image invariant: verify separately if claiming deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: only after a separately authorized dataset apply; merge alone is not product acceptance.

## Rollback Plan

Do not dispatch an apply. If this fixture has not been loaded, revert the repository change. If loaded later, use a separately reviewed, tenant-scoped retirement plan; do not delete canonical rows ad hoc.

## Audit Evidence

PR checks, CSV hash, dry-run plan and proof, and separate canonical and signed-in readbacks if a load is later approved.

## Known Gaps

The current registry loader is synthetic-only. Real client onboarding requires a private owner-supplied extract, identity review and a separate adapter. This release does not provide NDA contacts for the added fictional suppliers.
