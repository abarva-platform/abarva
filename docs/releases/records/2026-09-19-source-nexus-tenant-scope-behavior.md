# 2026-09-19-source-nexus-tenant-scope-behavior — Source Nexus Tenant-Scope Behavior Coverage

## Release ID

`2026-09-19-source-nexus-tenant-scope-behavior`

## Status

`candidate`

## Plain-English Summary

The Source Nexus tenant-scope suite now drives the actual ask and export routes instead of reading route files for implementation strings. It proves the route resolves a Source event only for the active client, fails closed for another active client, and passes the resolved active client key into both aVa answer context and the contract-optimization export lookup.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products: Source route behavior is now covered by executable tests. No Source product runtime code changes in this release.

Control plane / CI: One repaired Source integration suite leaves quarantine and returns to the default Source integration workflow.

## Client Applicability

- All clients: yes, through shared Source route behavior coverage.
- Specific clients: none.
- Internal only: CI and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Replaced `src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts` source-string checks with route behavior tests.
- Removed `source-nexus-route-tenant-scope.test.ts` from `scripts/quality/source-integration-quarantine.json`.
- Added this release record.
- No migrations, schema changes, tenant-data writes, approval actions, auth weakening, prompts, model provider changes, or deployment workflow changes.

## QA / Validation

- Failing-first focused run on the base suite: `npx jest src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts --runInBand` failed with 3 failed / 4 passed tests. The failing assertions were source-string checks for retired implementation details and tenant-specific display rewrites.
- After repair: `npx jest src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts --runInBand` passed with 4/4 tests.
- Behavioral coverage added:
  - Same-client ask route resolves through the active client key.
  - Other-client ask route returns `404 not_found` and does not build a response or call the model.
  - aVa model context receives the resolved active client key and event-scoped evidence context.
  - Contract-optimization export lookup uses the resolved active client key.
- Mutation check: temporarily passing a foreign client key into the Source ask lookup made the focused suite fail 2/4, with same-client lookup returning 404 and the aVa model call never happening. The mutation was reverted before final validation.

## Rollout Plan

Merge through PR. The Source integration workflow will include this suite by default after the quarantine entry is removed. The normal ACA deploy workflow may publish the resulting image after merge, but this release is test coverage only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if merged to `main`.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not applicable before merge.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is executable route/export coverage with no runtime behavior change.

## Rollback Plan

Revert the PR. That restores the previous quarantined source-string suite and quarantine entry.

## Audit Evidence

- PR for this release.
- Focused Jest output before and after repair.
- Source integration workflow execution after PR creation.
- Claim-log entries for item T-028.

## Known Gaps

Signed-in Source acceptance was not performed and is not claimed. This release changes test coverage only.
