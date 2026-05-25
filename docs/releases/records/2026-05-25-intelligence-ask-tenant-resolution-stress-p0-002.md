# 2026-05-25-intelligence-ask-tenant-resolution-stress-p0-002 — Intelligence Ask Tenant Resolution (STRESS-P0-002..005)

## Release ID

`2026-05-25-intelligence-ask-tenant-resolution-stress-p0-002`

## Status

`candidate`

## Plain-English Summary

After PR #2341 fixed the hardcoded tenant pin in the Sentinel ask synthesizer, the stress-test verification probe found the cross-tenant leak still persisted — because three layers ABOVE the synthesizer hardcoded `apexretail` / `Apex Retail Group` for every request, regardless of the authenticated user's tenant. This patch resolves the active tenant from the authenticated session in the server-rendered Intelligence Ask page, threads it through to the client component as required props, and removes the hardcoded `activeClient: 'Apex Retail Group'` and `initialClient: 'apexretail'` strings. Also replaces the Apex-flavored placeholder question with a tenant-agnostic one.

## Layer Impact

`agent-reasoning-lane`: the authenticated session's tenant now flows correctly from the server-rendered page through the client component into the `/api/intelligence/ask` request body and ultimately into the synthesizer's tenant-identity pin.

`client-data-lane`: no schema change.

`audit-lane`: no audit-table change.

## Client Applicability

- All clients: yes, every authenticated user on `/intelligence/ask` regardless of vertical.
- Specific clients: Meridian Health verification surfaced the residual leak after PR #2341.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/intelligence/ask/page.tsx`: resolves active tenant from `getActiveClientRow(null)` (uses auth session per `getActiveClientKey` precedence), passes display name to `AppShell.topBarProps.tenantName`, passes client key + display name to `SentinelReasoningCards` as required props.
- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: removes hardcoded `initialClient = 'apexretail'` default; removes hardcoded `activeClient: 'Apex Retail Group'` in `surfaceContext`; uses new required `initialClientDisplayName` prop; replaces Apex-flavored `DEFAULT_QUESTION` placeholder.
- `scripts/smoke/intelligence-ask-tenant-resolution.spec.ts`: 10 source-text assertions that verify the hardcoded strings are absent and the resolved-tenant prop wiring is in place.

## QA / Validation

- `npx jest scripts/smoke/intelligence-ask-tenant-resolution.spec.ts` → 10 / 10 passing
- `npx jest src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts` → 22 / 22 passing (no regression from PR #2341)
- `npx eslint` on the two changed `.tsx` files → clean
- `npx tsc --noEmit` → clean for the changed files

## Audit Evidence

- Pre-fix verbatim agent response (still asserting "you're Apex Retail Group" on Meridian session despite PR #2341 merged) captured in `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/transcripts/intelligence-ask-q1-VERIFICATION-AFTER-PR2341.txt`
- That artifact also documents the 4-layer chain that produced the leak

## Rollout Plan

- Merge PR to `main`.
- Auto-deploys via Vercel on merge (preview verified on PR).
- Post-deploy verification: re-run Q1 ("What do you know about us?") on `/intelligence/ask` as Meridian CDIO; assert response cites Meridian-grounded facts and does NOT contain "Apex Retail" / "you're Apex" / any non-Meridian active-tenant assertion.

## Rollback Plan

`git revert <commit-sha>` → re-deploy. No schema migrations to back out. No env-var changes.

## Known Gaps

- This fix addresses the `/intelligence/ask` surface specifically. Other Sentinel-reasoning surfaces (Source intake, Nexus origination, Move-detail chat) may have analogous hardcoded-tenant defects in their page server components or client request bodies. A follow-up audit pass once this verification passes should grep `'Apex Retail Group'\|'apexretail'` across `src/app/(maestro)/` and `src/app/` and confirm no other hardcoded-tenant defaults exist.
- The smoke test in `scripts/smoke/` is source-text-based, not a live-UI E2E. The authoritative verification is the post-deploy Q1 probe captured in the audit artifacts directory.
- The `DEFAULT_QUESTION` placeholder is now tenant-agnostic but is still a hardcoded English string. For multi-tenant deployments with locale variation, this would need i18n — out of scope here.
- PR #2343 (Codex's earlier route-fallback improvement) is left in place; this PR does not modify the API route. The route already resolves correctly via `getActiveClientRow` for locked-tenant personas; the leak was strictly upstream of the route.
