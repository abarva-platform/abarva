# 2026-07-01-tower-real-tenant-label — Tower Real Tenant Label

## Release ID

`2026-07-01-tower-real-tenant-label`

## Status

`candidate`

## Plain-English Summary

Tower now uses real executive tenant names on the CIO command-center surface instead of demo-safe labels like `Airline Demo` or `Industrial Demo`. This keeps the Tower dashboard, aVa chat context, and top navigation aligned with the governed Tower data being displayed.

## Layer Impact

- `global-control-lane`: Updates shared Tower route display-name resolution and top-bar behavior.
- UI/runtime: Adds an explicit opt-in for pages that must preserve a supplied tenant display name instead of applying demo-safe text replacement.
- Data plane: No schema, migration, ingestion, or data mutation.

## Client Applicability

- All clients: Applies to the shared Tower route.
- Specific clients: Validated for SkyHarbor and Lakeshore aliases.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `canonicalCioTowerTenantDisplayName(...)` beside the Tower tenant-key resolver.
- Wires `/tower` to use real Tower tenant display names while retaining canonical Tower tenant keys.
- Adds `preserveTenantName` support to `AppTopBar` / `AppShell`.
- Enables Tower to preserve the real tenant label in top chrome and agent context.
- Adds regression tests for Tower real-name alias resolution and the top-bar preserve contract.

## QA / Validation

- PASS: Focused Jest passed: `npm test -- --runInBand src/lib/cio-tower/__tests__/answer.test.ts src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts` (13 tests).
- PASS: Focused ESLint passed: `npx eslint src/lib/cio-tower/metric-packet.ts src/app/'(maestro)'/tower/page.tsx src/components/shell/AppTopBar.tsx src/components/shell/AppShell.tsx src/lib/cio-tower/__tests__/answer.test.ts src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts`.
- PENDING: `npm run release:check`.
- PENDING: ACA deploy through the repo-owned main deploy workflow.
- PENDING: Signed-in browser proof on `https://app.abarva.ai/tower`.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then verify the live signed-in Tower route.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker behavior changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower route.

## Rollback Plan

Revert the PR or roll ACA back to the prior approved `main` digest. No data rollback is required.

## Audit Evidence

- PR: pending.
- CI: pending.
- Deploy proof: pending.
- Browser proof: pending.

## Known Gaps

This does not change the Tower data model, portfolio value pack, or broader demo-safe naming policy for other surfaces.
