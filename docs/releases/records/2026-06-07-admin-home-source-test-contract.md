# 2026-06-07-admin-home-source-test-contract — Admin Home Source Test Contract

## Release ID

`2026-06-07-admin-home-source-test-contract`

## Status

`candidate`

## Plain-English Summary

The Admin home source test now matches the current Admin Control Center copy and behavior. The application UI did not change; this aligns the guardrail with the existing read-only Admin home that routes operators to Data Loads instead of embedding upload controls.

## Layer Impact

- `global-control-lane`: Updates a route-level test contract for the shared Admin/Setup control surface. There is no runtime component, API, schema, or data-plane behavior change.

## Client Applicability

- All clients: The Admin home test guard applies to the shared Admin surface.
- Specific clients: None.
- Internal only: Release-control evidence and source test alignment.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `src/app/(maestro)/admin/__tests__/page-source.test.ts` to assert the current Admin Control Center wording and read-only data-load handoff.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/admin/__tests__/page-source.test.ts' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts src/__tests__/integration/admin/steward-setup-control-center.test.ts src/__tests__/integration/admin/setup-chat-rail-agent-first.test.ts src/__tests__/integration/admin/admin-surface-completeness.test.ts` — passed.
- `npx eslint 'src/app/(maestro)/admin/__tests__/page-source.test.ts'` — passed.

## Rollout Plan

Merge to `main`. No runtime rollout, migration, feature flag, or manual operator action is required.

## Rollback Plan

Revert the test and release-record commit. Because there is no runtime behavior change, rollback is limited to source-control history.

## Audit Evidence

- PR diff for the Admin home source test update.
- Local Jest and ESLint command output recorded in the agent session.

## Known Gaps

Jest reports pre-existing duplicate manual mock warnings for markdown parser mocks; those warnings are outside this change.
