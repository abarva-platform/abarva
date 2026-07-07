# 2026-06-03-customer-admin-weekly-usage-report — Customer Admin Weekly Usage Report

## Release ID

`2026-06-03-customer-admin-weekly-usage-report`

## Status

`candidate`

## Plain-English Summary

Adds a customer-admin weekly usage report summary to the read-only customer
admin workspace. The report rolls up tenant-scoped AI-egress usage metadata,
shows whether a client-facing report is ready, displays token-cap posture, and
states the overage policy in the same place as document economics.

## Layer Impact

- `internal-admin`: gives customer admins and AbarVa operators a read-only
  report-readiness view for usage, cap posture, and overage communication.
- `global-control-lane`: consumes shared AI-egress usage-cap audit metadata, but
  does not change provider routing or enforcement behavior.

## Client Applicability

- All clients: available in the customer-admin workspace when tenant-scoped
  audit metadata exists.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/admin/customer-admin-read-model.ts`
- `src/lib/admin/__tests__/customer-admin-read-model.test.ts`
- `src/app/(maestro)/admin/customer/page.tsx`
- This release record.

## QA / Validation

- Pass: `npx jest src/lib/admin/__tests__/customer-admin-read-model.test.ts --runInBand`
- Pass: `npx eslint src/lib/admin/customer-admin-read-model.ts src/app/(maestro)/admin/customer/page.tsx src/lib/admin/__tests__/customer-admin-read-model.test.ts`
- Blocked locally: `npx tsc --noEmit --pretty false` could not complete
  because the shared local dependency install is missing
  `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. The errors
  are outside this slice.
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge through the protected PR path. The customer-admin page will show the
report-readiness summary immediately for authorized tenant admins after the app
deploys the merged commit.

## Rollback Plan

Revert this PR if the read model or customer-admin page misstates report
readiness. Runtime AI-egress cap enforcement is unaffected by this UI/read-model
change.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2968
- Backlog rows: `T033`, `T059`.
- Local QA commands listed above.

## Known Gaps

- The view is based on the current AI-egress audit read window, not a durable
  scheduled weekly email or invoice system.
- Full local TypeScript is blocked by missing optional dependency packages in
  the linked local install, not by this slice.
- T033 and T059 remain `In progress` until durable live cap settings, alert
  delivery, and customer-facing weekly reporting cadence are evidenced.
