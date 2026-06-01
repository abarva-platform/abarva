# 2026-06-01-pilot-security-retention-audit — Pilot Security Retention Audit Policy

## Release ID

`2026-06-01-pilot-security-retention-audit`

## Status

`candidate`

## Plain-English Summary

This release defines the pilot private data-plane guardrails for malware scanning, encryption/key posture, retention/deletion, and audit exports. It makes the first policy decisions executable in code: files cannot be parsed until malware scanning is clean, regulated pilot data requires CMK/BYOK-grade posture, retention windows are deterministic, and audit exports have a tenant-scoped manifest contract.

## Layer Impact

- `client-data-lane`: Adds policy contracts that govern private data-plane processing before live customer files move through upload, scan, parse, commit, rollback, or export.
- `global-control-lane`: Adds a typed admin policy module and tests for future Setup Data Load Center and audit-export UI/API binding.

## Client Applicability

- All clients: The policy is tenant-scoped and applies to all canonical tenants once follow-on wiring uses it.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air remain the first browser/API QA focus.
- Internal only: No AbarVa-only admin route changes.
- Public/demo only: None.
- Feature flag: No feature flag; this is an inert policy/contract slice until wired by follow-on runtime code.

## Changes Included

- `src/lib/admin/pilot-data-plane-security-policy.ts`
- `src/lib/admin/__tests__/pilot-data-plane-security-policy.test.ts`
- `docs/platform-design/wireframes/setup-admin/setup-data-load-center-home-wireframe-2026-06-01.html`
- `docs/security/PILOT_PRIVATE_DATA_PLANE_SECURITY_RETENTION_POLICY_2026-06-01.md`
- `docs/build/PILOT_PRIVATE_DATA_PLANE_FULL_SCOPE_BACKLOG_2026-06-01.md`

## QA / Validation

- Passed: `npx jest src/lib/admin/__tests__/pilot-data-plane-security-policy.test.ts --runInBand`
- Passed: `npx eslint src/lib/admin/pilot-data-plane-security-policy.ts src/lib/admin/__tests__/pilot-data-plane-security-policy.test.ts`
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `git diff --check origin/main...HEAD`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run: Browser visual QA, because this slice adds a static HTML wireframe and no runtime route changes.

## Rollout Plan

Merge to `main` after green CI. No database migration or production environment change is required for this policy slice. Follow-on slices should wire the policy to the landing-zone worker, Setup Data Load Center, audit export API, retention sweeper, and tenant isolation smoke.

## Rollback Plan

Revert the PR. Because this release does not change runtime routing, migrations, or production configuration, rollback only removes the policy contract and docs.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2737
- CI checks: to be added after GitHub Actions completes.
- Policy contract smoke: `src/lib/admin/__tests__/pilot-data-plane-security-policy.test.ts`
- Policy authority: `docs/security/PILOT_PRIVATE_DATA_PLANE_SECURITY_RETENTION_POLICY_2026-06-01.md`
- Setup/Admin home wireframe: `docs/platform-design/wireframes/setup-admin/setup-data-load-center-home-wireframe-2026-06-01.html`

## Known Gaps

Follow-on rows T365-T368 still need observability/cost guardrails, tenant isolation tests, legal/data-use policy pack, and full SSO-to-output smoke. Runtime wiring for malware scanner invocation, audit-export API, and retention sweeper is intentionally next-slice work.
