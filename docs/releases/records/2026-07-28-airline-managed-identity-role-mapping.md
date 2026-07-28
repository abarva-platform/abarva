# 2026-07-28-airline-managed-identity-role-mapping — Airline Managed Identity Role Mapping

## Release ID

`2026-07-28-airline-managed-identity-role-mapping`

## Status

`candidate`

## Plain-English Summary

This release candidate makes the Airline tenant PostgreSQL security readiness script bind each managed-identity database user to its intended least-privilege role. The prior readiness script created and granted the tenant roles, but did not durably attach the managed identities to those roles, so governed jobs could authenticate and still lack table privileges.

## Layer Impact

- `CANONICAL MODEL`: No schema shape changes. This only fixes tenant database role membership for governed processing.
- `PRODUCTS`: No product UI, API, answer, or runtime behavior changes.
- `OPERATIONS`: Airline tenant ACA jobs can use their intended managed identities instead of relying on administrator credentials for review-ledger work.

## Client Applicability

- All clients: No.
- Specific clients: Airline tenant execution environment only.
- Internal only: Yes, for governed tenant-load operations.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/12-postgres-security-plan/phase2b3c2c-postgres-readiness.sql`: adds idempotent managed-identity-to-role grants for ingest, review, publish, read, evaluator, and admin identities when those database roles exist.

## QA / Validation

- PASS: SQL reviewed for idempotent guarded role grants.
- PASS: `npm run release:check`.
- Pending: governed ACA validation job applying the readiness SQL.
- Pending: actual managed-identity privilege proof for the review job identity.

## Rollout Plan

Merge to main, deploy the repo-owned ACA image if required by release policy, then rerun the governed Airline PostgreSQL readiness job. After the role membership proof passes, rerun the approved review-ledger apply job with the previously approved package and manifest hashes.

## Deployment Authority

- Repo-owned deploy workflow: Yes, if this release is merged through main.
- Shared runtime mutators: None.
- Approved image digest: Pending.
- ACA runtime invariant: Pending if deployed.
- Worker image invariant: Pending if deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: No, this is data-plane operator readiness.

## Rollback Plan

Role grants can be reverted by applying the prior readiness script and revoking the six managed-identity role memberships. No tenant facts, publications, projections, or product baselines are mutated by this release.

## Audit Evidence

- PR URL: Pending.
- ACA readiness job execution: Pending.
- Managed-identity privilege proof: Pending.
- Review-ledger apply retry: Pending.

## Known Gaps

This does not apply review decisions, publish domains, activate a baseline, build projections, or select any runtime provider.
