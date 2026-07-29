# 2026-07-29-foundation-evaluator-governance-readiness — Evaluator Governance Readiness

## Release ID

`2026-07-29-foundation-evaluator-governance-readiness`

## Status

`candidate`

## Plain-English Summary

The foundation evaluator identity now receives read-only access to governance records in the standard PostgreSQL readiness package. This promotes a recovery finding into the reusable tenant readiness generator so metric parity, readback, and reconciliation jobs can inspect accepted gaps and review state without a one-off database grant.

## Layer Impact

- `client-data-lane`: updates the tenant PostgreSQL identity and RLS readiness artifacts for foundation execution tenants.
- `internal-admin`: strengthens reusable execution readiness so the same identity mapping and evaluator access contract can be replayed before later tenant runs.

## Client Applicability

- All clients: none directly.
- Specific clients: foundation execution tenants that use the Phase 2B-3C PostgreSQL readiness package.
- Internal only: yes, governed data-plane execution readiness.
- Public/demo only: no runtime UI change.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-phase2b3c-postgres-plan.mjs`
- Generated PostgreSQL readiness artifacts under the tenant Phase 2B-3C execution packages.

## QA / Validation

- `node scripts/knowledge/build-phase2b3c-postgres-plan.mjs` — passed; regenerated readiness packages for both execution tenants.
- Generated validation summaries — passed, including `evaluator_governance_read` and `managed_identity_role_inheritance`.
- `node --check scripts/knowledge/build-phase2b3c-postgres-plan.mjs` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge through PR. This release updates generated execution-readiness artifacts and the source generator. It does not apply a database migration, run a pipeline stage, change ACA traffic, or mutate tenant records by itself. The updated SQL must be applied only through the governed migration/bootstrap stage when an execution authority record permits it.

## Deployment Authority

- Repo-owned deploy workflow: not required for the readiness artifact itself; required only if a later executable image change is bundled.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable for this artifact-only correction.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; signed-in proof remains a downstream product activation gate.

## Rollback Plan

Revert this PR to remove evaluator read access to governance from the generated readiness package. If already applied in a tenant database, apply a follow-up governed migration that revokes evaluator `USAGE` and `SELECT` on `governance` tables, after confirming metric parity/readback no longer depends on those reads.

## Audit Evidence

- PR and CI checks for this release.
- Generated validation summaries in the tenant execution packages.
- Future governed migration/bootstrap execution record when the SQL is applied.

## Known Gaps

This does not activate a provider, create tenant-user mappings, perform signed-in proof, or complete module cutover. It only removes a repeatable identity-readiness gap from the foundation execution package.
