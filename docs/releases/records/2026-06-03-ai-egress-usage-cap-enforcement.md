# 2026-06-03-ai-egress-usage-cap-enforcement — AI Egress Usage Cap Enforcement

## Release ID

`2026-06-03-ai-egress-usage-cap-enforcement`

## Status

`candidate`

## Plain-English Summary

This change wires the tenant usage-cap policy into the shared AI egress runtime.
When a caller supplies tenant cap state, synchronous model calls and streaming
client preflight now evaluate the cap before creating the provider call. Hard
cap violations are denied with audit evidence; alert thresholds are allowed but
stamped into the audit record for notifications/reporting.

## Layer Impact

- `global-control-lane`: Extends the shared AI egress wrapper used by model
  calls and streaming preflight.
- `client-data-lane`: Consumes tenant-scoped usage totals and cap settings when
  provided by callers; this slice does not introduce a new persistence table.

## Client Applicability

- All clients: Applies to AI egress callers that pass `usageCap` state.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/2964.
- Commit: final merge commit pending.
- `src/lib/integrations/ai-egress/types.ts`.
- `src/lib/integrations/ai-egress/call-model.ts`.
- `src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts`.

## QA / Validation

- Passed locally:
  `npx jest src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/integrations/ai-egress/__tests__/tenant-usage-cap-policy.test.ts --runInBand`.
- Passed locally:
  `npx eslint src/lib/integrations/ai-egress/call-model.ts src/lib/integrations/ai-egress/types.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts`.
- Passed locally:
  `npx tsc --noEmit --pretty false`.
- Failed before this evidence update, then passed locally:
  `npm run release:check -- --base origin/main --head HEAD`.
- Passed locally:
  `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge through the protected PR flow. The runtime behavior is active for callers
that pass `usageCap`; follow-on slices need to provide durable usage totals and
tenant cap settings from the data plane.

## Rollback Plan

Revert the PR. Existing AI egress policy enforcement remains in place, but
tenant usage caps will no longer block provider calls until reintroduced.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2964.
- Local QA output: Focused Jest, ESLint, TypeScript, release check, and
  whitespace check passed before PR.
- CI checks: Pending.

## Known Gaps

- This does not create the durable tenant cap settings store.
- This does not calculate weekly customer-facing reports or send cap-alert
  notifications.
- Provider callers must pass `usageCap` state for enforcement; wiring that state
  into every live caller remains a follow-on step.
