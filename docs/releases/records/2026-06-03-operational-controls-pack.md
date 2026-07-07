# 2026-06-03-operational-controls-pack - Operational Readiness Controls

## Release ID

`2026-06-03-operational-controls-pack`

## Status

`candidate`

## Plain-English Summary

Adds three operating runbooks for pilot readiness: one product feedback intake
and triage process, one customer-safe Now/Next/Later roadmap process, and one
financial spend approval control. These are founder/operator controls, not
runtime product changes.

## Layer Impact

- Internal admin: defines AbarVa operating process for product intake, roadmap
  communication, and spend approval.
- Global control lane: gives release and roadmap work a consistent operating
  wrapper, but does not change application runtime behavior.

## Client Applicability

- All clients: customer-safe roadmap and feedback status language can be used
  with any pilot client.
- Specific clients: none.
- Internal only: spend approval thresholds and internal triage mechanics.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/runbooks/product-feedback-triage.md`
- `docs/runbooks/product-roadmap-horizons.md`
- `docs/runbooks/spend-approval-controls.md`

## QA / Validation

- `git diff --check origin/main...HEAD`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The runbooks become the source-of-truth operating documents
for the product feedback loop, public-ish roadmap cadence, and spend approval
thresholds. No deployment, migration, feature flag, or customer data movement is
required.

## Rollback Plan

Revert the docs PR if the controls are replaced or rejected. Because this is
documentation-only, rollback does not affect runtime behavior or client data.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2970
- CI checks: pending on PR #2970.
- Local validation: `git diff --check origin/main...HEAD`; `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

- These runbooks define the operating process. A live issue board, customer
  roadmap artifact, and vendor/spend register still need to be created or
  nominated as the operational system of record.
