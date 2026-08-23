# 2026-08-23-source-lane5-smoke-harness-fix — Source Evidence Table Smoke Contract

## Release ID

`2026-08-23-source-lane5-smoke-harness-fix`

## Status

`candidate`

## Plain-English Summary

This change updates the Source new-event journey smoke test to assert the compact evidence-table labels introduced by the Source Lane 5 polish release. It is a test-contract correction only; it does not change product runtime behavior, data, parsing, workflow gates, or customer-visible copy.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source test coverage only. The smoke harness now protects the current Source evidence intake presentation contract.

## Client Applicability

- All clients: Applies to shared Source quality checks.
- Specific clients: None.
- Internal only: CI/test harness behavior.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx` to check `Evidence needed`, `Where to get it`, `Template / grain`, `Required`, and `Next action`.

## QA / Validation

Pass:

- `npm run qa:source-new-event-journey-smoke`

Pending after this record is added:

- `npm run release:check`

Not run:

- Signed-in browser proof, because this PR changes only the smoke harness and has no runtime UI change beyond the already-merged Source Lane 5 release.

## Rollout Plan

Merge to main through the protected PR path. There is no data-plane, parser, migration, feature-flag, or runtime behavior change.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this test-only change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, test-only harness alignment.

## Rollback Plan

Revert the PR if the smoke harness needs to be restored to the prior table-label contract.

## Audit Evidence

- PR URL after opening.
- Local command output for `npm run qa:source-new-event-journey-smoke`.
- Local command output for `npm run release:check`.

## Known Gaps

None known for this test-only correction.
