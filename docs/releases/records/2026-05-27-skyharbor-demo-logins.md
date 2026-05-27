# 2026-05-27-skyharbor-demo-logins — SkyHarbor Demo Logins

## Release ID

`2026-05-27-skyharbor-demo-logins`

## Status

`candidate`

## Plain-English Summary

Adds SkyHarbor Air as a first-class demo tenant for sign-in and tenant resolution, with seven demo identities for the airline modernization walkthrough: CTO, CIO, CFO, COO, CISO, Maestro, and Tenant Admin. The provisioning runbook now safely creates missing SkyHarbor client and persona rows without disabling older demo users when `--skip-ban` is supplied.

## Layer Impact

- `app-control-lane`: SkyHarbor role-based demo emails are allowed through the demo-code sign-in path and resolve to the `skyharbor` client key.
- `app-control-lane`: active-client lookup recognizes `skyharbor-air` as the backing tenant slug, including Intelligence inventory substrate routing.
- `app-control-lane`: Setup/Admin allows the canonical tenant-admin demo identities without requiring the founder account.
- `app-control-lane`: SkyHarbor gets tenant-brand fallbacks and avoids hard failure in legacy fixture-backed Programs views.
- `data-plane-lane`: the provisioning script can seed the missing SkyHarbor client row and person membership rows for the demo data plane.

## Client Applicability

- All clients: No intended behavior change.
- Specific clients: SkyHarbor Air only.
- Internal only: Provisioning script safety flag `--skip-ban`.
- Public/demo only: Demo-code auth roster and invite/persona metadata.
- Feature flag: None.

## Changes Included

- PR: `codex/skyharbor-demo-logins`
- Commit: `b83bf65b1 Add SkyHarbor demo logins`
- Script: `scripts/provision-cxo-personas.ts`
- Auth/config: `src/lib/auth/cxo-personas.ts`, `src/lib/auth/canonical-auth-roster.ts`, `src/lib/client-config.ts`, `src/lib/active-client.ts`
- Tenant surfaces: `/home`, `/programs`, `/admin`

## QA / Validation

- Passed: `npx eslint src/lib/client-config.ts src/lib/active-client.ts src/lib/auth/cxo-personas.ts src/lib/auth/canonical-auth-roster.ts 'src/app/(maestro)/admin/layout.tsx' src/lib/agent/tools/intelligence/_shared.ts src/lib/agent/tools/intelligence/__tests__/_shared.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/app/programs/page.tsx src/components/home/HomeTenantHeader.tsx src/components/home/HomeOverviewV2.tsx scripts/provision-cxo-personas.ts`
- Passed: `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/lib/agent/tools/intelligence/__tests__/_shared.test.ts --runInBand -t "infers skyharbor|substrate map"`
- Passed: `npx tsx -e "...skyharbor demo-login registry check..."` verified all seven emails are demo-code allowed, have persona records, and infer `skyharbor`.
- Passed: `npx tsx /tmp/nexus-skyharbor-logins/scripts/provision-cxo-personas.ts --dry-run --skip-ban`
- Passed: `npx tsx /tmp/nexus-skyharbor-logins/scripts/provision-cxo-personas.ts --apply --skip-ban`
- Blocked, unrelated: full repo `npx tsc --noEmit --pretty false` still fails on pre-existing optional-package and Supabase compat factory test debt.

## Rollout Plan

Merge to main, let Vercel production deploy, then use demo-code sign-in with shared demo password `Demo2026!` and OTP `424242`.

## Rollback Plan

Revert the release commit to remove SkyHarbor from code-level auth routing. Clerk users and person rows created by the provisioning script can remain harmless, or be manually disabled if a full rollback is required.

## Audit Evidence

- PR: `https://github.com/anandsundaram-hash/abarva/pull/2377`
- Provisioning apply output: seven SkyHarbor Clerk/person/membership rows created; legacy demo ban skipped.
- CI: release-record gate should pass after this record.

## Known Gaps

- Full repo typecheck remains blocked by existing unrelated dependency/test typing debt (`@azure/*`, `pptxgenjs`, `@resvg/resvg-js`, and Supabase compat test factories).
- The broad tenant-isolation suite still includes a pre-existing Keystone seed-plan mismatch; SkyHarbor-focused tenant-routing regressions pass.
