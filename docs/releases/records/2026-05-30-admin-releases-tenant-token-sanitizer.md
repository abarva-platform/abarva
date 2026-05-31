# 2026-05-30-admin-releases-tenant-token-sanitizer — Release Ledger Tenant Token Sanitizer

## Release ID

`2026-05-30-admin-releases-tenant-token-sanitizer`

## Status

`candidate`

## Plain-English Summary

This release closes a remaining `/admin/releases` tenant-isolation gap found during the live Meridian route walk. Older release records could still expose standalone `Apex` wording and the `retail-v1` overlay token even after full tenant names were redacted. The ledger parser now neutralizes those short-form tokens before release history is rendered in tenant-visible admin pages.

## Layer Impact

- `global-control-lane`: hardens the shared admin release ledger renderer for every tenant.
- `internal-admin`: improves AbarVa operator audit history without changing seeded release markdown files.

## Client Applicability

- All clients: release-ledger text is sanitized consistently before rendering.
- Specific clients: Meridian Health was the live failing route-walk tenant; Apex, SkyHarbor, First Capital, and Northstar receive the same protection.
- Internal only: admin release ledger and audit evidence surfaces.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/admin/release-ledger.ts`
- `src/lib/admin/__tests__/release-ledger.test.ts`
- Adds redaction for standalone `Apex` and `retail-v1` release-record tokens.

## QA / Validation

- FAIL before fix: production Meridian walk failed on `/admin/releases` with `Apex retail-v1` release-record text.
- PASS expected: focused release-ledger Jest coverage for standalone `Apex` and `retail-v1` redaction.
- PASS expected: targeted ESLint on release-ledger source and test.
- PASS expected: `npm run release:check`.
- PASS expected: post-deploy Meridian admin isolation walk.

## Rollout Plan

Merge to `main`; Vercel production deploys the parser change automatically. After deployment, rerun the Meridian admin route walk against `https://app.abarva.ai`.

## Rollback Plan

Revert this release commit to restore the previous sanitizer. Rollback would reintroduce the known `/admin/releases` leak, so only use it if the parser breaks the release ledger route.

## Audit Evidence

- Live Playwright failure on `/admin/releases`: `Apex retail-v1` text detected in a Meridian session.
- Pull request and CI checks for this release.
- Post-deploy Playwright route walk output.

## Known Gaps

This release sanitizes the release-ledger parser rather than rewriting historical release markdown. Other tenant-visible surfaces that render raw release markdown directly would need separate hardening if introduced later.
