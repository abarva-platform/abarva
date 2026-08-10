# 2026-08-10-source-contract-optimization-approval-ledger — Source Contract Optimization Approval Ledger

## Release ID

`2026-08-10-source-contract-optimization-approval-ledger`

## Status

`candidate`

## Plain-English Summary

Source approval and evidence intake now follow the event's actual sourcing journey and fail closed when progression cannot be proven. Contract-optimization events show the contract-optimization sequence instead of the longer competitive-sourcing sequence, approval history carries the human rationale where recorded, malformed XLSX uploads return an actionable parser error, and contract-optimization journey detection is driven by a governed event profile rather than by tenant identity.

## Layer Impact

- `global-control-lane`: Source event approval and Source event canvas approval workspace render the correct approval journey for the event, route stage approvals only from successful backend advancement, and surface recorded approval rationale.
- Canonical model: No schema or data model changes.
- Source adapters: No adapter or template changes. File parsing behavior is hardened for existing CSV/XLSX intake.

## Client Applicability

- All clients: Yes, journey-aware approval ledgers apply wherever Source resolves an event journey.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/approval-ledger-model.ts` accepts a journey-specific stage list.
- `src/lib/source/approval-ledger.ts` passes the stage list into the pure ledger model and reads approval notes for rationale display.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` passes the resolved event journey into the canvas approval ledger.
- `src/app/(maestro)/source/events/[eventId]/approval/page.tsx` resolves the event journey and passes it into the standalone approval ledger.
- `src/app/api/v1/source/events/[eventId]/approve/route.ts` resolves the contract-optimization journey from an event profile for any tenant and returns an error if the approval is recorded but the stage cannot advance.
- `src/components/source/approval/EventApprovalCard.tsx` and `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` display recorded approval rationale.
- `src/lib/source/facts/extraction/file-to-rows.ts` wraps corrupt XLSX parse failures with a user-actionable message.
- Tests prove skipped stages do not appear for contract-optimization journeys, approval rationale is preserved, stage-advance failures fail closed, non-SkyHarbor tenants can use the same profile-driven journey detection, and corrupt XLSX uploads are rejected clearly.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/__tests__/approval-ledger.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.approvalLedger.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx src/lib/source/facts/extraction/__tests__/file-to-rows.test.ts 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts' --runInBand` passed: 6 suites, 38 tests.
- `npx eslint 'src/lib/source/approval-ledger-model.ts' 'src/lib/source/approval-ledger.ts' 'src/lib/source/__tests__/approval-ledger.test.ts' 'src/app/(maestro)/source/events/[eventId]/page.tsx' 'src/app/(maestro)/source/events/[eventId]/approval/page.tsx' 'src/app/api/v1/source/events/[eventId]/approve/route.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts' 'src/components/source/approval/EventApprovalCard.tsx' 'src/components/source/approval/__tests__/EventApprovalCard.test.tsx' 'src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx' 'src/lib/source/facts/extraction/file-to-rows.ts' 'src/lib/source/facts/extraction/__tests__/file-to-rows.test.ts'` passed.
- `npm run release:check` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed.
- `docs/testing/source-contract-optimization-path-a-browser-audit-2026-08-10.md` now separates the 7-stage incumbent contract-optimization audit from the 11-stage new sourcing event audit.

## Rollout Plan

Merge through the normal PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Retest a contract-optimization event approval workspace and confirm only the journey stages render, stage approval advances visibly, approval rationale appears after approval, CSV and XLSX intake have clear parser outcomes, and the separate New Event path retains the competitive-sourcing journey.

## Rollback Plan

Revert the PR. The ledger will return to the previous global stage-order behavior.

## Audit Evidence

- PR URL after creation.
- Focused Jest and ESLint output listed above.
- Browser audit screenshots in `/Users/anand/Downloads/source-contract-optimization-path-a-audit-20260810T040733Z`.

## Known Gaps

- The prior browser audit found stage advancement did not visibly advance after clicking the Scope gate. This candidate now fails closed on a backend stage-advance write failure and removes the client-side fallback that could mask the problem, but live signed-in proof is still required before calling that fixed.
