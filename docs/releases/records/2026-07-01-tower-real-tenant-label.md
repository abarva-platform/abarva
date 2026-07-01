# 2026-07-01-tower-real-tenant-label — Tower Real Tenant Label

## Release ID

`2026-07-01-tower-real-tenant-label`

## Status

`candidate`

## Plain-English Summary

Tower now uses real executive tenant names on the CIO command-center surface instead of demo-safe labels like `Airline Demo` or `Industrial Demo`. This keeps the Tower dashboard, aVa chat context, and top navigation aligned with the governed Tower data being displayed.

Follow-up: the signed-in browser proof after the first merge showed the top bar and dashboard were corrected, but the shared aVa dock still demo-mapped its initial quote and thread text. This release now extends the explicit preserve contract into the AgentDock/AtlasChatPanel path so Tower's already-governed real tenant labels survive in the chat rail too.

Second follow-up: the signed-in proof after the aVa dock fix showed one remaining visible demo label in the authenticated user rail (`AbarVa Agent Airline Demo`). Tower now uses the preserved real tenant display name for automation/demo user aliases when the surface explicitly opts into real tenant text preservation.

## Layer Impact

- `global-control-lane`: Updates shared Tower route display-name resolution and top-bar behavior.
- UI/runtime: Adds an explicit opt-in for pages that must preserve a supplied tenant display name instead of applying demo-safe text replacement.
- Shared agent dock: Adds an explicit opt-in for surfaces that must preserve already-governed visible text in agent profile, initial quote, suggestions, placeholder, and thread body.
- Top bar identity rail: When a surface explicitly preserves real tenant text, automation/demo account aliases are replaced by the real tenant display name instead of demo-safe labels.
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
- Enables Tower to preserve the real tenant label through `AtlasChatPanel` and `AgentDock`.
- Prevents the signed-in automation account display from leaking `Demo` labels on Tower when real tenant preservation is enabled.
- Adds regression tests for Tower real-name alias resolution, the top-bar preserve contract, and the aVa dock preserve contract.

## QA / Validation

- PASS: Focused Jest passed: `npm test -- --runInBand src/lib/cio-tower/__tests__/answer.test.ts src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts` (16 tests).
- PASS: Follow-up focused Jest passed: `npm test -- --runInBand src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts` (2 tests).
- PASS: Focused ESLint passed: `npx eslint src/components/agent/AgentDock.tsx src/components/atlas/AtlasChatPanel.tsx src/components/tower/TowerIndexPage.tsx src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts` (existing Tower unused-code warnings only).
- PASS: Follow-up focused ESLint passed: `npx eslint src/components/shell/AppTopBar.tsx src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts`.
- PASS: `npm run release:check`.
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

- PR: #4220 fixed top bar/dashboard labels; follow-up PR pending for the aVa dock preserve path.
- CI: focused local Jest/ESLint passed.
- Deploy proof: pending.
- Browser proof: first deployed proof caught remaining dock text leak: `Airline Demo` and `AbarVa Agent Airline Demo`; the AgentDock follow-up addressed the dock path.
- Browser proof: second deployed proof caught the remaining authenticated user-rail leak: `AbarVa Agent Airline Demo`; this follow-up addresses that exact top-bar identity path.

## Known Gaps

This does not change the Tower data model, portfolio value pack, or broader demo-safe naming policy for other surfaces.
