# 2026-06-02-source-wave2-hardening — Source L6 Refresh Hardening

## Release ID

`2026-06-02-source-wave2-hardening`

## Status

`candidate`

## Plain-English Summary

This release tightens Source findings from the second-pass L6 QA audit. It prevents Postgres numeric strings from corrupting Source dollar math, strips foreign `client` query parameters from the `/source/*` tree for non-admin users, gives users a visible way to request missing evidence, explains the `Waiting on Client` lifecycle badge, raises Source chat response capacity so deep vendor/pricing answers do not stop around the previously observed 4,567-character cutoff, and pins the legacy Pricing/BAFO virtual-scaffold behavior with regression coverage.

## Layer Impact

- `global-control-lane`: Source UI, proxy, and value-read behavior are shared application behavior.
- `client-data-lane`: Numeric coercion protects client-scoped Source financial values read from the data plane without changing stored data.

## Client Applicability

- All clients: receive the Source value coercion, evidence request CTA, lifecycle tooltip, and `/source/*` query-param stripping.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/usd-amount.ts`: shared Source USD coercion helper.
- `src/lib/source/queries.ts`: coerces persisted `estimated_value_usd` before portfolio/value-ledger mapping.
- `src/lib/source/value-chain.ts`: coerces value-state, value-chain, and event amounts before savings math.
- `src/app/api/chat/agent/route.ts`: gives Source surfaces a 4,096-token response budget, matching the richer program-surface budget.
- `src/components/source/canvas/workspace-tabs/EvidenceTab.tsx`: adds a mailto `Request evidence` CTA for `Not Requested` evidence rows.
- `src/components/source/EventLifecycleStatusBadge.tsx`: adds a native tooltip explaining `Waiting on Client`.
- `src/proxy.ts`: includes `/source/*` in non-admin foreign `client` param stripping defense-in-depth.
- `src/lib/source/canvas-substrate/__tests__/scaffold.test.ts`: proves legacy events still surface Pricing and BAFO artifact/evidence/gate scaffolds.

## QA / Validation

- PASS: `npx jest src/lib/source/canvas-substrate/__tests__/scaffold.test.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/lib/source/__tests__/usd-amount.test.ts src/lib/source/__tests__/source-event-row-mapping.test.ts src/components/source/__tests__/EvidenceTab.test.tsx src/components/source/__tests__/EventLifecycleStatusBadge.test.tsx src/__tests__/integration/source/source-authenticated-route-smoke.test.ts --runInBand` — 7 suites / 53 tests passed.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`, then deploy the Next.js app to production through the standard Vercel production deployment path. No database migration is required for this slice.

## Rollback Plan

Revert the application commit. No data migration rollback is required.

## Audit Evidence

After merge, inspect the PR diff, CI output, Vercel deployment, and a signed-in Source smoke test that verifies `/source/events?client=<foreign>` redirects without the `client` parameter while displaying only the active tenant.

## Known Gaps

Live-session validation of the Source chat truncation fix is still recommended after deployment. Pricing/BAFO stage content depth remains separate backlog unless addressed in a later slice.
