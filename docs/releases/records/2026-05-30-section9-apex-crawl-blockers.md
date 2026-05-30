# 2026-05-30-section9-apex-crawl-blockers — Section 9 Apex Crawl Blocker Fixes

## Release ID

`2026-05-30-section9-apex-crawl-blockers`

## Status

`candidate`

## Plain-English Summary

This release fixes the first production blockers found during the Apex Retail
Packet 34 crawl. Admin and evidence pages were vulnerable to Postgres timestamp
values arriving as JavaScript `Date` objects, which can crash React server
rendering. The release also makes several index routes redirect to their
canonical live pages so the crawl no longer treats intentionally nested
surfaces as dead routes.

## Layer Impact

- `runtime-app-lane`: Hardens Setup/Admin, Evidence Ledger, and crawl-index
  routes. Moves tenant-admin access helper out of the Next.js layout export
  surface so App Router type generation stays valid. Moves `/product` into the
  public route group to avoid a clean-checkout Turbopack route conflict.
- `admin-control-lane`: Normalizes TrustSpine, policy, isolation, approval, and
  setup inventory timestamp fields before UI render.
- `evidence-lane`: Normalizes Evidence Ledger freshness values before citation
  rendering.
- `qa-validation-lane`: Adds regression tests for timestamp serialization and
  makes the hygiene build gate use the real `next build` exit code on Node 24.
- `data-plane-lane`: No database mutation in this PR.

## Client Applicability

- All clients: Yes. Timestamp normalization and index redirects are universal.
- Specific clients: First surfaced by the Apex Retail Section 9 crawl.
- Internal only: Mostly, because affected pages are authenticated admin/evidence
  surfaces.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/setup-data-broker.ts`
- `src/lib/programs/approval.ts`
- `src/lib/admin/broker/isolation-posture-broker.ts`
- `src/lib/admin/broker/policy-events-broker.ts`
- `src/lib/evidence/citations.ts`
- `src/lib/admin/tenant-admin-access.ts`
- `src/app/(maestro)/admin/layout.tsx`
- `src/app/(public)/product/page.tsx`
- `src/app/(maestro)/evidence-ledger/page.tsx`
- `src/app/(maestro)/tower/lens/page.tsx`
- `src/app/(maestro)/tower/pressures/page.tsx`
- `src/app/(maestro)/tower/programs/page.tsx`
- `src/app/(maestro)/admin/programs/page.tsx`
- `src/app/(maestro)/admin/segments/page.tsx`
- Focused regression tests for setup-data, isolation posture, policy events,
  evidence citations, and tenant-admin access.
- Hygiene CI alignment with the repo runtime (`node:24-bookworm-slim`) and
  deterministic build-log reporting.

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/broker/__tests__/policy-events-broker.test.ts src/lib/admin/broker/__tests__/isolation-posture-broker.test.ts src/lib/evidence/__tests__/ledger.test.ts --runInBand`
- PASS: `npx jest src/app/'(maestro)'/admin/__tests__/layout-access.test.ts --runInBand`
- PASS: `npx eslint src/lib/admin/setup-data-broker.ts src/lib/programs/approval.ts src/lib/admin/broker/isolation-posture-broker.ts src/lib/admin/broker/policy-events-broker.ts src/app/'(maestro)'/evidence-ledger/page.tsx src/lib/evidence/citations.ts src/app/'(maestro)'/tower/lens/page.tsx src/app/'(maestro)'/tower/pressures/page.tsx src/app/'(maestro)'/tower/programs/page.tsx src/app/'(maestro)'/admin/programs/page.tsx src/app/'(maestro)'/admin/segments/page.tsx src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/broker/__tests__/policy-events-broker.test.ts src/lib/admin/broker/__tests__/isolation-posture-broker.test.ts src/lib/evidence/__tests__/ledger.test.ts`
- PASS: `npx prettier --check src/lib/admin/setup-data-broker.ts src/lib/programs/approval.ts src/lib/admin/broker/isolation-posture-broker.ts src/lib/admin/broker/policy-events-broker.ts src/app/'(maestro)'/evidence-ledger/page.tsx src/lib/evidence/citations.ts src/app/'(maestro)'/tower/lens/page.tsx src/app/'(maestro)'/tower/pressures/page.tsx src/app/'(maestro)'/tower/programs/page.tsx src/app/'(maestro)'/admin/programs/page.tsx src/app/'(maestro)'/admin/segments/page.tsx src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/broker/__tests__/policy-events-broker.test.ts src/lib/admin/broker/__tests__/isolation-posture-broker.test.ts src/lib/evidence/__tests__/ledger.test.ts docs/releases/records/2026-05-30-section9-apex-crawl-blockers.md`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run build`
- PASS: clean-checkout simulation without local `.env.local`: `npm run build`
- PENDING: Production Apex crawl rerun after merge/deploy.

## Rollout Plan

Merge after CI is green. Let Vercel deploy production from main, then rerun the
Apex Section 9 crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR. If the Date-render crash returns, roll forward by restoring the
timestamp-normalization helpers in the affected brokers and Evidence Ledger
renderer.

## Audit Evidence

- Initial failing crawl artifact:
  `audit-artifacts/comprehensive-crawl-2026-05-30/apex-retail/full-module-stress/FULL_MODULE_STRESS_TEST_REPORT.html`
- Focused tests listed in `## QA / Validation`.

## Known Gaps

The initial crawl also flagged educational/marketing pages that intentionally
mention other composite tenants. This PR does not redefine the crawl policy for
sanctioned reference content; it focuses on true runtime blockers and dead
index-route coverage.
