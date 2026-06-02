# 2026-06-02-source-prod-isolation-fix — Source Cross-Tenant Event Isolation

## Release ID

`2026-06-02-source-prod-isolation-fix`

## Status

`candidate`

## Plain-English Summary

This release closes a Source security gap found by the production E2E bar: a canonical client admin could receive broad Source-event access even while acting under another active client. The fix limits canonical-admin elevation to the user's inferred home client, adds a tenant-safe event lookup API that returns 404 for missing or cross-tenant events, and adds Source E2E specs that preserve the production failure as an executable regression gate.

## Layer Impact

- `global-control-lane`: shared Source access-policy behavior changes for all authenticated clients.
- `client-data-lane`: Source event lookup now re-verifies persisted event `client_key` against the active client before returning data.
- `internal-admin`: no intended admin UX change, but cross-tenant canonical-admin elevation is no longer allowed outside the user's home client.

## Client Applicability

- All clients: Source event access policy and event lookup route.
- Specific clients: Apex Retail and Meridian Health are covered by the new production E2E regression.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Tighten `loadUserSourceAccessPolicy` canonical-admin shortcut so unlimited Source scope only applies when `activeClientKey` matches `inferClientKeyFromEmail(ctx.email)`.
- Add defense-in-depth client-key verification in `getSourcingEvent`.
- Add `GET /api/v1/source/events/[eventId]` with anti-enumeration 404 behavior.
- Add Source E2E specs and auth harness for Golden Event, cross-tenant isolation, and separation-of-duties governance.
- Add `.auth/` to `.gitignore` so Playwright Clerk storage state is never committed.
- Align the `apex-vp-sourcing` E2E alias to the provisioned canonical Apex CIO approver account.

## QA / Validation

- PASS: `npx jest src/lib/auth/__tests__/source-access-policy.test.ts --runInBand`
- PASS: `npx tsx scripts/provision-cxo-personas.ts --dry-run`
- PASS: `npx tsx scripts/provision-cxo-personas.ts --apply` updated 22 canonical Clerk/Supabase personas; banned 0 legacy accounts.
- FAIL, unrelated existing repo issue: `npx tsc --noEmit --pretty false` currently fails on pre-existing seed script `PatternSeed` type errors outside this release.
- FAIL before deployment, expected: `BASE_URL=https://app.abarva.ai SOURCE_AUTH_REFRESH=1 npx playwright test tests/e2e/source/ --reporter=list` still reports the production 200-vs-404 isolation failure because this code is not deployed yet.
- IMPROVED: after persona alignment, the Golden Event spec no longer fails on retired `demo-apexretail+clerk_test`; it reaches the Source UI and times out on the missing stage-advance control.

## Rollout Plan

Merge to `main`, allow Vercel production deployment, then rerun `BASE_URL=https://app.abarva.ai SOURCE_AUTH_REFRESH=1 npx playwright test tests/e2e/source/cross-tenant-isolation.spec.ts --reporter=list` to verify the P0 security finding flips from 200 to 404.

## Rollback Plan

Revert this release commit if legitimate home-tenant Source admin access regresses. The new event-detail API route is additive and safe to leave in place, but can also be reverted with the same commit if needed.

## Audit Evidence

- Production failure packet: `reports/2026-06-02-source-xtenant-isolation/raw.json`
- Source E2E audit packet: `reports/source-golden-event/2026-06-02-00-46-51/`
- Unit regression: `src/lib/auth/__tests__/source-access-policy.test.ts`
- Production retest evidence should be attached after deployment.

## Known Gaps

- Full Source Golden Event E2E remains red on product readiness items such as stage-advance control visibility, artifact backing, and value-ledger linkage.
- Separation-of-duties still depends on the new Source event GET route being deployed before the first API lookup can pass against production.
- Existing repo-wide TypeScript check fails on unrelated seed script `PatternSeed` errors.
