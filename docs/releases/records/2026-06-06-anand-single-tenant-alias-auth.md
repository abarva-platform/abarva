# 2026-06-06-anand-single-tenant-alias-auth — Anand Operator Alias Auth

## Release ID

`2026-06-06-anand-single-tenant-alias-auth`

## Status

`candidate`

## Plain-English Summary

Anand's client-specific operator logins now use the verified `anand.sundaram+client@thesundaram.com` plus-address pattern. Each alias remains a separate single-tenant identity and can be routed to the intended client even if stale metadata is present.

## Layer Impact

- `global-control-lane`: Updates shared sign-in and tenant-routing allowlists for founder/operator aliases.
- `internal-admin`: Applies only to Anand operator identities used for client-specific pilot access.

## Client Applicability

- All clients: No buyer-facing behavior changes.
- Specific clients: Apex, Meridian/PHS, SkyHarbor, Lakeshore, First Capital, and Northstar operator aliases for Anand.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds Anand single-tenant operator aliases to the demo ticket sign-in allowlist.
- Adds exact `thesundaram.com` plus-address client inference for Anand aliases only.
- Adds tenant-isolation and sign-in route tests covering the new aliases.

## QA / Validation

- PASS: `git diff --check`
- PASS: `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/__tests__/integration/demo-code-sign-in-route.test.ts --runInBand`
- PASS: `npx eslint src/lib/auth/canonical-auth-roster.ts src/lib/auth/demo-code.ts src/lib/client-config.ts src/lib/auth/access-routing.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/__tests__/integration/demo-code-sign-in-route.test.ts`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED before record update: `npm run release:check -- --base origin/main --head HEAD` required this section to state pass/fail/blocked status explicitly.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment. Clerk user records were already migrated separately so the runtime can resolve the new aliases as soon as this release is live.

## Rollback Plan

Revert this PR. Clerk user email aliases can remain in place because user metadata still pins each account to one client.

## Audit Evidence

- Clerk migration report: `reports/auth-access-reset-2026-06-06/06-anand-plus-alias-migration.json`
- PR, CI, and post-deploy smoke evidence to be added after merge.

## Known Gaps

This does not make SMS codes possible for all Anand aliases because Clerk requires phone numbers to be unique per user. Email plus-addressing is the supported shared-inbox route.
