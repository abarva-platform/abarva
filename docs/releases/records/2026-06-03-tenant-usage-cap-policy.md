# 2026-06-03-tenant-usage-cap-policy — Tenant AI Usage Cap Policy

## Release ID

`2026-06-03-tenant-usage-cap-policy`

## Status

`candidate`

## Plain-English Summary

This change adds a reusable tenant usage-cap policy for AI egress. Given a
tenant's current usage, a pending model call, and configured token/cost caps,
the policy returns `allow`, `alert`, or `block` with deterministic audit
metadata. This gives the token/consumption meter a tested cap-enforcement
contract before the enforcement is wired into every model-provider path.

## Layer Impact

- `global-control-lane`: Adds shared AI egress usage-cap policy code and tests.
  No runtime provider path is blocked by this slice yet.

## Client Applicability

- All clients: Applies as the default control contract once wired into model
  preflight/provider paths.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/2962.
- Commit: final merge commit pending.
- `src/lib/integrations/ai-egress/tenant-usage-cap-policy.ts`.
- `src/lib/integrations/ai-egress/__tests__/tenant-usage-cap-policy.test.ts`.
- `src/lib/integrations/ai-egress/index.ts` export.

## QA / Validation

- Passed locally:
  `npx jest src/lib/integrations/ai-egress/__tests__/tenant-usage-cap-policy.test.ts --runInBand`.
- Passed locally:
  `npx eslint src/lib/integrations/ai-egress/tenant-usage-cap-policy.ts src/lib/integrations/ai-egress/__tests__/tenant-usage-cap-policy.test.ts src/lib/integrations/ai-egress/index.ts`.
- Passed locally:
  `npx tsc --noEmit --pretty false`.
- Failed before this evidence update, then passed locally:
  `npm run release:check -- --base origin/main --head HEAD`.
- Passed locally:
  `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge through the protected GitHub PR flow. This makes the pure policy available
to AI egress callers; runtime cap enforcement still requires a follow-on wiring
slice.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2962.
- Local QA output: Focused Jest, ESLint, TypeScript, release check, and
  whitespace check passed before PR.
- CI checks: Pending.

## Known Gaps

- This slice does not yet block live provider calls. It supplies the tested
  decision contract and audit metadata for the next enforcement step.
- Weekly customer-facing usage reports and cap-alert notifications remain
  follow-on work.
