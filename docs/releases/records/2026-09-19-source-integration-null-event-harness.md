# 2026-09-19-source-integration-null-event-harness — Source Integration Null-Event Harness

## Release ID

`2026-09-19-source-integration-null-event-harness`

## Status

`candidate`

## Plain-English Summary

Two Source integration suites were failing before they reached their intended assertions because the seeded event reader returned `null` for a declared demo tenant. The mounted Source event route treats a missing or unauthorized event as `notFound`, so component tests should not pass `null` into the canvas. This change adds the missing seed-authority mapping for that declared tenant, gives the repaired integration suites explicit tenant context, and removes only the two suites that now run green from quarantine.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source event read/render tests now exercise the mounted route's tenant-scoped event contract instead of constructing impossible `null` component state.

Control/tooling: the Source integration quarantine shrinks by two suites, so those suites run on every PR through the existing Source integration workflow.

## Client Applicability

- All clients: no production runtime behavior change for real client data.
- Specific clients: none.
- Internal only: Source integration test harness and release governance.
- Public/demo only: declared demo seed-event access in the local/test seed path.
- Feature flag: none.

## Changes Included

- `src/lib/source/queries.ts` now recognizes the declared demo tenant's seed events in the same seed fallback that already gates other demo tenants.
- `src/test/source-integration-tenant.ts` provides explicit active-client, tenancy, access-policy, and no-DB event-adapter mocks for Source integration suites.
- `source-bafo-negotiation-panel.test.ts` and `source-sourcing-tools.test.ts` import that harness and now run under the same tenant authority expected by the mounted Source route.
- `scripts/quality/source-integration-quarantine.json` removes those two suites from quarantine.

## QA / Validation

Red-first reproduction on current `origin/main`: the selected Source integration cluster failed because `getSourcingEvent(...)` returned `null`, producing null-property throws and `notFound` route termination.

Focused validation after the fix:

- `npx jest src/lib/source/__tests__/queries-tenant-scope.test.ts src/__tests__/integration/source/source-bafo-negotiation-panel.test.ts src/__tests__/integration/source/source-sourcing-tools.test.ts --runInBand --silent` — 3 suites / 23 tests passed.
- `npm run check:source-integration-quarantine` — 9 excluded of 93 suites; 84 run on every PR.
- `npx jest src/__tests__/integration/source --no-coverage --ci $(node scripts/quality/source-integration-ignore-args.mjs) --runInBand` — 84 suites / 690 tests passed.

Mutation check: temporarily removing the seed-authority mapping failed the two new query assertions, all three BAFO panel cases, and the blocked-stage sourcing-tool case. The line was restored and the focused suites passed again.

## Rollout Plan

Merge to `main`. No Azure Container Apps deploy, migration, data build, feature flag, or tenant-data operation is required because this is a seed-reader/test-control change.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; no product UI/runtime path changes.

## Rollback Plan

Revert this PR. The two repaired suites would return to quarantine and the declared seed tenant would again fail closed for those seeded events.

## Audit Evidence

- Focused Jest and Source integration command outputs from the PR run.
- Quarantine validator output showing 9 excluded suites and 84 included suites.
- Mutation check output showing the seed-authority mapping is load-bearing.

## Known Gaps

Seven Source integration suites remain quarantined. Some now fail on stale copy or route-contract assertions rather than the null-event cluster, and they remain assigned to their own backlog items. This record does not claim signed-in acceptance, tenant data mutation, deploy, or live proof.
