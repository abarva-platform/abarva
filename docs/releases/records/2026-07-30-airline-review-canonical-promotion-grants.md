# 2026-07-30-airline-review-canonical-promotion-grants — Airline Review Canonical Promotion Grants

## Release ID

`2026-07-30-airline-review-canonical-promotion-grants`

## Status

`candidate`

## Plain-English Summary

The Airline review executor can now complete its assigned promotion step after approved review decisions are written. The grant is limited to the canonical Knowledge tables that the review executor writes from accepted, hash-guarded decisions.

## Layer Impact

- `client-data-lane`: Adds least-privilege database grants needed for the Airline lab review identity to promote accepted candidates into canonical Knowledge rows.
- Products: No direct product, UI, Cube, provider, publication, baseline, or active-provider change.

## Client Applicability

- All clients: No.
- Specific clients: Airline lab tenant only.
- Internal only: Governed data-plane execution.
- Public/demo only: Synthetic lab data only.
- Feature flag: Not applicable.

## Changes Included

- `supabase/migrations/20260730234500_airline_review_canonical_promotion_grants.sql`
- Airline PostgreSQL readiness grant plan and role grant matrix.

## QA / Validation

- PASS: `node --check scripts/knowledge/__tests__/run-airline-review-canonical-grant-tests.mjs`
- PASS: `node scripts/knowledge/__tests__/run-airline-review-canonical-grant-tests.mjs`
- NOT RUN: governed migration apply in the Airline lab database, pending merge/deploy.
- NOT RUN: rerun `airline-demo-new-knowledge-review-v1` executor, pending migration apply.

## Rollout Plan

Merge to `main`, let the repo-owned ACA deploy publish the migration file in the runtime image, then apply the SQL through the governed Airline lab migration/operator path. Rerun the failed review executor from the existing review-decision ledger after the grant is live.

## Deployment Authority

- Repo-owned deploy workflow: Required before using the merged runtime image for governed jobs.
- Shared runtime mutators: None.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Required before rerunning the Airline job.
- Worker image invariant: Required for the migration/review worker execution.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Later, after publication, baseline, projections, Cube, and Home/aVa proof.

## Rollback Plan

Revoke the explicit `knowledge` schema/table grants from `airline_demo_new_reviewer` if the review executor contract is changed to use another identity. Do not delete review decisions or canonical data as part of this rollback.

## Audit Evidence

- PR URL: To be added after PR creation.
- Failed review executor evidence: `job-airdn-review-apply-lab-lqedqob`, PostgreSQL `42501 permission denied for schema knowledge`.
- Post-merge evidence must include migration execution ID and rerun review executor ID.

## Known Gaps

- This does not publish domains, activate a baseline, build projections, run Cube parity, prove Home Knowledge, or prove aVa grounding.
