# 2026-06-03-client-approval-audit-export — Client Approval Audit Export

## Release ID

`2026-06-03-client-approval-audit-export`

## Status

`candidate`

## Plain-English Summary

Adds a client-exportable approval audit log for tenant-scoped program approval
records. Authorized users can download JSON or CSV evidence from the admin
Audit approvals tab, and the API never accepts a tenant key from the caller.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: admin audit, AI liability defense, and approval governance.
- Runtime impact: authenticated read-only export route over existing approval
  records. No schema changes, no migrations, and no new external service.

## Client Applicability

- All clients: available to authenticated users in their active client scope.
- Specific clients: none.
- Internal only: admin/control surface and audit export API.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/api/admin/programs/approvals/export/route.ts`
- `src/app/api/admin/programs/approvals/export/__tests__/route.test.ts`
- `src/lib/ai-liability/approval-audit-export.ts`
- `src/lib/ai-liability/__tests__/approval-audit-export.test.ts`
- `src/lib/programs/approval.ts`
- `src/components/setup/SetupAuditPage.tsx`

## QA / Validation

- Pass: focused Jest for approval audit export library and route.
- Pass: TypeScript compile check.
- Pass: release control check.
- Pass: whitespace check.

## Rollout Plan

Merge to `main`. The admin audit approvals tab exposes export links, and the
API is available immediately for authenticated tenant-scoped users.

## Rollback Plan

Revert this PR. No data rollback is required because the route is read-only and
uses existing approval records.

## Audit Evidence

- Pull request and CI checks.
- Focused Jest output.
- Release control output.
- The export response headers include `x-abarva-audit-export:
client-approval-audit` and `x-abarva-audit-record-count`.

## Known Gaps

This closes the self-serve route/UI foundation for program approvals. T217
should remain `In progress` until live authenticated browser proof confirms
the export in a deployed client tenant and other consequential approval
surfaces are included or explicitly tracked separately.
