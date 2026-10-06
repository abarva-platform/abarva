# 2026-09-16 Source Event Policy Scope

## Release ID

`2026-09-16-source-event-policy-scope`

## Status

`candidate`

## Plain-English Summary

Fresh database installations should not grant every database role unrestricted access to sourcing events. This migration removes an older broad policy and ensures only the service role gets the unrestricted policy. An already-correct policy is left intact.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 data access policy for sourcing-event records. No records or product projections change.

## Client Applicability

- All clients: Shared database policy wherever this migration is applied.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

`20260916201000_source_events_service_policy_scope.sql` and `scripts/qa/source-events-rls-policy-smoke.sh`.

## QA / Validation

Local isolated Postgres behavior test reproduces the prior cross-tenant read bypass, verifies the scoped policy blocks cross-tenant reads and inserts, reruns the migration idempotently, and reintroduces the broad policy as a mutation probe. Deployment readback is tracked separately; no client data was modified.

## Rollout Plan

Merge by reviewed PR, then apply via the manual lab migration workflow after separate approval. Do not substitute a web deployment for the migration. Read back `pg_policies` after apply; no data reload is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for code image only.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Verify separately if the code image deploys.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for any claim that tenant access behavior changed in the product.

## Rollback Plan

Do not restore the broad policy. If the migration interrupts an authorized caller, diagnose its database role and grant path, then use a reviewed corrective policy scoped to that role. Database migration history is append-only.

## Audit Evidence

Local smoke-test output; read-only deployed `pg_policies` inspection; manual migration workflow status and later apply/readback when approved.

## Known Gaps

The privileged application connection bypasses RLS and relies on separate application tenant checks. Cross-tenant product behavior has not been live-proven by this migration test.
