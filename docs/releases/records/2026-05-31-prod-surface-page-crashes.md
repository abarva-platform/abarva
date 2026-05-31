# 2026-05-31-prod-surface-page-crashes — Production Surface Crash Fixes

## Release ID

`2026-05-31-prod-surface-page-crashes`

## Status

`candidate`

## Plain-English Summary

Fixes production crashes on Tower initiative detail and Customer Admin when the live Postgres adapter returns timestamp columns as `Date` objects instead of strings. The change also prevents raw `signal:<uuid>` identifiers from appearing in Tower agent copy.

## Layer Impact

- `global-control-lane`: Shared Tower, Atlas response shaping, and Setup/Admin read surfaces now normalize database dates before rendering user-facing pages.
- `client-data-lane`: No schema or data change. The fix only serializes tenant-scoped read results more defensively.

## Client Applicability

- All clients: Yes, for shared Tower and Customer Admin surfaces.
- Specific clients: Apex Retail surfaced the production repro.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower initiative detail renders decision and renewal dates through safe formatting helpers.
- Tower initiative detail API fails soft when secondary evidence substrate is unavailable, letting the page render the registry data and inline fallback instead of a global error.
- AI initiative read models serialize Postgres `Date` values for vendor renewals, stakeholder interviews, and decisions.
- Customer Admin and Admin Audit read paths tolerate `Date` timestamps.
- Tower response shaping scrubs raw `signal:<uuid>` identifiers from visible agent prose.
- Regression tests cover date serialization and internal signal-id scrubbing.

## QA / Validation

- `npx jest src/lib/admin/ai-initiatives/queries.test.ts src/lib/admin/ai-initiatives/detail-queries.test.ts src/__tests__/integration/tower/tower-date-rendering.test.ts src/lib/agent/__tests__/response-shape.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false` passed.
- Focused ESLint and browser smoke are part of final PR validation.

## Rollout Plan

Merge to main and let the Vercel production deployment pick up the shared Next.js app change.

## Rollback Plan

Revert the PR. No migrations or data-plane changes are involved.

## Audit Evidence

- PR URL and merge SHA after merge.
- Production browser smoke against `/tower?detail=AR-07`, `/admin/customer`, and `/admin/agent-readiness`.

## Known Gaps

None known for the two production crashes reported in screenshots. Broader CXO conversational quality remains covered by the comprehensive Atlas harness.
