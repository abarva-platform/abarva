# 2026-06-03-token-consumption-overage-policy — Token Consumption Overage Policy

## Release ID

`2026-06-03-token-consumption-overage-policy`

## Status

`candidate`

## Plain-English Summary

Adds a governed token-consumption and overage policy for pilot commercial
operations. The policy defines the included monthly token allowance, overage
rate, hard-cap posture, client notification expectation, approval owner, and
operator runbook for handling exceptions.

## Layer Impact

- `internal-admin`: gives AbarVa operators and the founder a repeatable
  workflow for usage alerts, cap exceptions, and reconciliation.
- `global-control-lane`: aligns commercial policy with shared AI-egress usage
  cap controls, but this release does not change runtime enforcement code.

## Client Applicability

- All clients: applies as the default pilot commercial posture unless a signed
  SOW supersedes it.
- Specific clients: none.
- Internal only: operator runbook and approval evidence handling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/gtm/pilot-pricing-and-packaging.md`
- `docs/runbooks/token-consumption-overage-policy.md`
- This release record.

## QA / Validation

- `git diff --check origin/main...HEAD`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` through the protected PR path. The policy becomes the current
internal commercial operating guidance after merge. Client-specific activation
still requires SOW/order-form alignment, runtime usage-cap settings, and account
owner communication.

## Rollback Plan

Revert the PR if the policy is superseded or rejected. If a client-specific SOW
already references different terms, the signed SOW controls until the commercial
owner updates it.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2966
- Local QA commands listed above.
- Backlog row: `T059`.

## Known Gaps

- Founder or delegated commercial owner still needs to approve final customer
  terms for a live SOW.
- Runtime cap settings, cap alerts, and weekly customer-facing usage reporting
  must be evidenced before T059 can be marked `Done`.
