# 2026-06-01-source-apex-l6-hardening — Source Apex L6 Hardening

## Release ID

`2026-06-01-source-apex-l6-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens the Apex Retail Source event experience after the L6 crawl found buyer-facing scaffold leaks, a visually blank scorecard route, and a raw value-proof database error. Legacy persisted Source events with no canvas substrate now self-heal by running the existing idempotent scaffold routine on first open, empty canvas messaging no longer exposes developer commands, scorecard pages render in an explicit two-column layout, value-proof failures show business-safe copy, and event-code lookups tolerate lowercase shared links.

## Layer Impact

- `global-control-lane`: Source route rendering, event lookup, value-proof display, and canvas scaffold recovery change for all client Source users.
- `client-data-lane`: The detail page may insert missing canvas scaffold rows for a persisted legacy Source event when all artifact, gate, and evidence rows are absent. It uses the existing idempotent scaffold routine and only runs for UUID-backed persisted events with an active client.

## Client Applicability

- All clients: Yes, for Source event detail, scorecard, and value-proof routes.
- Specific clients: Apex Retail is the directly audited client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source event detail route: lazy legacy canvas substrate recovery for persisted events with no artifact/gate/evidence rows.
- Document tab: business-safe empty-state copy; no `npm run db:backfill:source-canvas` instruction is shown to users.
- Gate criterion API: business-safe criterion-not-found detail.
- Source event-code read adapter: case-insensitive event-code lookup for Supabase and Azure Postgres adapters.
- Event value-proof route: raw loader errors are logged server-side and replaced with a safe “value proof not loaded yet” warning.
- Scorecard route: explicit two-column layout wrapper so the scorecard panel remains visible beside the Sentinel column.
- Focused regression tests for canvas empty-state copy, value-proof safe copy, scorecard layout, and case-insensitive event-code lookup.

## QA / Validation

- PASS: `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx src/__tests__/integration/source/source-scorecard-governance.test.ts src/__tests__/integration/source/source-value-ledger-shell.test.ts src/lib/data-plane/read-adapters/__tests__/source-events-read-adapter.test.ts src/components/source/__tests__/AdminSourceEventApprovalQueue.test.tsx --runInBand`
- PASS: `git diff --check`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run build`
- BLOCKED: local Playwright Apex browser smoke on `http://localhost:3000` could not authenticate because `/api/auth/demo-code-sign-in` returned `clerk_not_configured` in local keyless Clerk mode.
- NOT RUN: production or preview browser crawl on Apex Retail after deployment.

## Rollout Plan

Merge to main after CI is green. Vercel production deployment makes the route and component changes active. No manual migration is required because the recovery path uses the existing idempotent scaffold routine only when a legacy persisted event has no substrate rows.

## Rollback Plan

Revert this PR if route rendering or scaffold recovery regresses. Rollback removes the lazy recovery and restores previous route behavior. Any scaffold rows inserted before rollback are idempotent canonical rows and do not require deletion.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- Deployment: pending.
- Browser crawl: pending.
- Relevant L6 source: Apex Retail audit dated June 1, 2026, approximately 5:56 PM to 6:05 PM PT.

## Known Gaps

- Clerk production keys are not changed here.
- RSC prefetch 503s are not fixed here.
- Tower outcome-report DOCX/XLSX export behavior is not changed here.
- Source CXO PPTX and Deal Pack live download behavior must still be retested after deployment.
- BAFO/pricing savings proof remains unproven until event-level pricing/TCO evidence is visible and CFO-auditable.
