# 2026-06-03-compensation-framework - Compensation Framework

## Release ID

`2026-06-03-compensation-framework`

## Status

`candidate`

## Plain-English Summary

Adds an early-company compensation framework for AbarVa before the first hire.
It defines default vesting, planning ranges for early roles, offer approval
steps, exception rules, advisor-equity guidance, and records to keep for
diligence.

## Layer Impact

- Internal admin: creates a founder/operator people-ops control for hiring and
  offer approval.
- Global control lane: no runtime impact, but supports company readiness before
  scaling pilot delivery.

## Client Applicability

- All clients: none directly.
- Specific clients: none.
- Internal only: compensation planning, hiring governance, and offer records.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/people/COMPENSATION_FRAMEWORK.md`

## QA / Validation

- `git diff --check origin/main...HEAD` - passed.
- ASCII scan for `docs/people/COMPENSATION_FRAMEWORK.md` and this release
  record - passed.
- `npm run release:check -- --base origin/main --head HEAD` - passed with no
  release-relevant files detected by the gate.

## Rollout Plan

Merge to `main`. Use the framework before sending any employee, advisor, or
contractor offer. No runtime deployment, data migration, or feature flag is
required.

## Rollback Plan

Revert this docs PR if the framework is replaced or rejected. No runtime or
data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2974
- CI checks: pending on PR #2974.
- Local validation: diff check, ASCII scan, and release gate passed.

## Known Gaps

- This framework is not legal, tax, or compensation advice. Final offers,
  equity grants, and exception approvals still require founder approval and
  appropriate legal or compensation review.
