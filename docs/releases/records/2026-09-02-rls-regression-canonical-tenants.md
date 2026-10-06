# 2026-09-02-rls-regression-canonical-tenants — RLS Regression Canonical Tenant Source

## Release ID

`2026-09-02-rls-regression-canonical-tenants`

## Status

`candidate`

## Plain-English Summary

The tenant-isolation regression suite now derives its probe tenant keys from the canonical enterprise-context tenant constant instead of maintaining a separate SQL list. This removes a stale fixture path that could prevent the suite from reaching a real tenant-isolation verdict.

## Layer Impact

Release lane: `global-control-lane`.

Client intake and canonical model: no tenant data changes, schema changes, or intake changes.

Products: no user-facing product behavior changes.

Operations and security validation: the RLS regression runner now supplies code-derived canonical tenant keys to the SQL probe before it runs read-only checks.

## Client Applicability

- All clients: security validation coverage only; no product runtime behavior change.
- Specific clients: none.
- Internal only: yes, this changes an internal regression harness.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/run-rls-regression.ts` supplies `ENTERPRISE_CONTEXT_CANONICAL_TENANT_KEYS` to the SQL session through a temp table.
- `tests/security/rls-regression.sql` consumes the runner-provided tenant table and fails as not checked if it is missing or empty.
- `tests/security/rls-regression-contract.test.ts` pins the no-hand-typed-tenant-list contract.

## QA / Validation

- `npx tsx -e "import { ENTERPRISE_CONTEXT_CANONICAL_TENANT_KEYS } from './src/lib/enterprise-context/schema'; ..."` passed and resolved the expected code-derived tenant set.
- `/Users/anand/Projects/nexus/node_modules/.bin/jest tests/security/rls-regression-contract.test.ts --runInBand` passed.

## Rollout Plan

Merge to main. The next repo-owned Azure Container Apps main deploy builds the updated image. After deploy, dispatch the RLS regression workflow from `main` to establish the live control-database verdict.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: determined by the main deploy workflow after merge.
- ACA runtime invariant: prove after deploy before claiming the harness is live.
- Worker image invariant: operator job image must match the deployed digest before live proof.
- Feature/env flag update path: none.
- Live signed-in proof required: no, this is an operator security workflow.

## Rollback Plan

Revert the PR. The previous harness behavior returns after the next main deploy, with the known limitation that the SQL carries its own tenant fixture list.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7322.
- Local contract test output from this branch.
- Post-merge main deploy run.
- Post-deploy RLS regression workflow dispatch output.

## Known Gaps

The context-database RLS target still requires a context database secret on the operator job before that target can be checked.
