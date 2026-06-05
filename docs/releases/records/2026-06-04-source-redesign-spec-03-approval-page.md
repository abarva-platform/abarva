# 2026-06-04-source-redesign-spec-03-approval-page — Source Approval Page

## Release ID

`2026-06-04-source-redesign-spec-03-approval-page`

## Status

`candidate`

## Plain-English Summary

Source events that are waiting for client approval now have a dedicated approval page. The page shows the captured intake facts, approval route, self-approval notice, human rationale field, confirmation checkbox, one primary Approve action, a secondary co-approver route, and lower-prominence request/reject decisions.

## Layer Impact

`global-control-lane`: Adds shared Source approval UI and lifecycle action routes.

`client-data-lane`: Adds lifecycle transition writes and activity-log writes for approval, co-approval routing, request-changes, and rejection actions. No schema migration is included.

## Client Applicability

- All Source-enabled clients: The approval page and action endpoints apply to any persisted Source event in `waiting_on_client`, `waiting_on_co_approver`, or `draft_revision`.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/approval/page.tsx`: Adds the server-rendered approval page and redirects non-approval lifecycle states away from the page.
- `src/components/source/approval/*`: Adds the approval card, routing panel, facts review, and inline intake chat trail.
- `src/app/api/v1/source/events/[eventId]/approve/route.ts`: Logs approval/rejection activity and closes rejected events as `closed_rejected`.
- `src/app/api/v1/source/events/[eventId]/route-to-co-approver/route.ts`: Adds a governed co-approval lifecycle action.
- `src/app/api/v1/source/events/[eventId]/request-changes/route.ts`: Adds a governed request-changes lifecycle action.
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`: Adds a lifecycle-only transition method for Source events.
- `src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts`: Covers the new transition method.
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`: Covers the approval action hierarchy and human-confirmation guard.
- `tests/e2e/source/approval-page.spec.ts`: Adds an E2E/static contract guard for the approval surface.

## QA / Validation

- PASS: `npx playwright test tests/e2e/source/approval-page.spec.ts --workers=1` — 1 test passed.
- PASS: `npm test -- --runInBand src/components/source/approval/__tests__/EventApprovalCard.test.tsx src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts` — 27 tests passed. Jest emitted existing duplicate manual mock warnings for markdown/GFM mocks.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `npx tsc --noEmit --skipLibCheck`.
- PASS: `npx eslint src/app/(maestro)/source/events/[eventId]/approval/page.tsx src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/ApprovalRoutingPanel.tsx src/components/source/approval/IntakeFactsReview.tsx src/components/source/approval/IntakeChatTrail.tsx src/app/api/v1/source/events/[eventId]/approve/route.ts src/app/api/v1/source/events/[eventId]/route-to-co-approver/route.ts src/app/api/v1/source/events/[eventId]/request-changes/route.ts src/lib/data-plane/write-adapters/sourceWriteAdapter.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts src/components/source/approval/__tests__/EventApprovalCard.test.tsx tests/e2e/source/approval-page.spec.ts --max-warnings 0`.

## Rollout Plan

Merge after Spec 4 routing guard is deployed and this candidate's CI, local QA, and design-fidelity checks pass. The page becomes the routing target for waiting Source events.

## Rollback Plan

Revert this release candidate. The Spec 4 routing guard should not be left pointing at a missing approval page; if rollback is needed after deploy, either revert Spec 4 together or adjust the guard target in a follow-up.

## Audit Evidence

- Contract references: `docs/build/source-design/03-build-specs.html` Spec 3, `docs/build/source-design/04-design-module-review.md` Spec 3 revisions, and `docs/build/source-design/05-wireframe-atlas.html` Atlas §3.
- Local QA output will be captured in the PR body before merge.

## Known Gaps

- Spec 2 direct routing from `/source/new` to `/approval` is stopped under G8 until `SourceOriginatePage.tsx` is authorized for the intake completion footer slice.
- Co-approver identity is represented in the UI but the current event substrate does not yet persist a named co-approver field. The action records a lifecycle transition and audit row without sending external notification.
