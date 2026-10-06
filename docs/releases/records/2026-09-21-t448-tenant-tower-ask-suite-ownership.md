# 2026-09-21-t448-tenant-tower-ask-suite-ownership - Tenant, Tower, and Ask suite ownership

## Release ID

`2026-09-21-t448-tenant-tower-ask-suite-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request CI now owns ten previously unrun tenant-resolution, Tower projection, notification-action, and Intelligence Ask suites. The tenant suites derive their coverage from the canonical tenant-key authority, and the write/send suites remain bounded to fake or mocked data transports.

## Layer Impact

- `global-control-lane`: test ownership, tenant test coverage, coverage census, and release evidence only.
- Layer 4 Products: no application implementation changed; existing behavior receives additional pull-request regression coverage.
- No client intake, source adapter, canonical model, schema, migration, tenant data, authentication, authorization, or runtime behavior changes.

## Client Applicability

- All clients: indirect regression-protection benefit only.
- Specific clients: none.
- Internal only: pull-request CI and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add the ten measured files to one exact-file pull-request workflow command.
- Expand each tenant suite over `CANONICAL_TENANT_KEYS` instead of a second tenant list.
- Add a behavior contract that holds canonical-key imports, exact workflow ownership, and the four census rows.
- Refresh the generated test-to-CI coverage census.

## QA / Validation

All ten files loaded, collected, ran, and passed before wiring. The tenant expansion adds six authority-derived cases to each of the three tenant suites.

| suite | loaded | collected | run | green | tests before | tests after | non-test importer audit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `aliases.test.ts` | yes | yes | yes | yes | 1 | 7 | `aliases.ts`: 101 |
| `foundation-tenants.test.ts` | yes | yes | yes | yes | 2 | 8 | `foundation-tenants.ts`: 11 |
| `resolveTenant.test.ts` | yes | yes | yes | yes | 14 | 20 | `resolveTenant.ts`: 10 |
| `project-tower-mart-client-resolver.test.ts` | yes | yes | yes | yes | 2 | 2 | `project-tower-mart.ts`: command-line entry point; 0 module importers |
| `project-tower-mart-source-contracts.test.ts` | yes | yes | yes | yes | 2 | 2 | `project-tower-mart.ts`: command-line entry point; 0 module importers |
| `project-tower-mart-write.test.ts` | yes | yes | yes | yes | 1 | 1 | `project-tower-mart-write.ts`: 1 |
| `save-preferences.test.ts` | yes | yes | yes | yes | 9 | 9 | `save-preferences.ts`: 1 |
| `send-test.test.ts` | yes | yes | yes | yes | 6 | 6 | `send-test.ts`: 1 |
| `route.source-contract-authority.test.ts` | yes | yes | yes | yes | 17 | 17 | `route.ts`: framework-owned route entry point; 0 module importers |
| `route.telemetry.test.ts` | yes | yes | yes | yes | 15 | 15 | `route.ts`: framework-owned route entry point; 0 module importers |

Before: 10 loaded / 10 collected / 10 run / 10 green, 69 of 69 tests passed. After: 10 loaded / 10 collected / 10 run / 10 green, 87 of 87 tests passed. Quarantines: 0.

Boundary findings:

- Tower source-contract and write cases use in-memory fake clients. The write case asserts successful serialization and insert construction; it does not assert a refused write, and it has no live data-plane target.
- Notification preference and test-send cases replace the Postgres write client. The test-send happy path verifies queued database records, not an external delivery, and no live transport is reachable.
- Both Ask route suites replace model, data, auth, session-memory, and telemetry boundaries.

The rebased pre-wire census recorded 2,346 test files, 1,758 covered, 1,755 pull-request covered, 588 uncovered, and 204 uncovered directories. The refreshed census records 2,347 test files, 1,769 covered, 1,766 pull-request covered, 578 uncovered, and 200 uncovered directories.

Mutation checks: 2 of 2 caught. Removing one Ask file from the workflow failed both the exact ownership assertion and the resulting 1-of-2 partial census row. Replacing the canonical tenant-key import with a local list failed the tenant-authority assertion. Both mutations were reverted and the passing controls rerun.

## Rollout Plan

Merge through the protected pull-request path. The unit workflow begins enforcing the ten suites on subsequent pull requests. No application, data-plane, or external-transport rollout is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; this candidate does not request a deployment.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged and not inspected.
- Worker image invariant: unchanged and not inspected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; no product behavior changed, and none is claimed.

## Rollback Plan

Revert the workflow step, tenant test expansions, ownership behavior test, census refresh, and this release record. No schema, migration, data, transport, or runtime rollback is required.

## Audit Evidence

- Red-first ownership output recorded the three missing tenant-authority imports, missing workflow command, and four uncovered census rows.
- Focused before and after Jest outputs record 69 and 87 passing tests respectively.
- Mutation output records the missing-path and local-list defects described above.
- The generated census and local validation commands provide candidate evidence. PR and CI evidence are added by the repository pull-request flow.

## Known Gaps

- The Tower write suite proves successful query construction only; it is not a refused-write control.
- No data-plane, external-send, runtime, browser, or signed-in proof was attempted or claimed.
