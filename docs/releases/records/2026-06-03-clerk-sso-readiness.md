# 2026-06-03-clerk-sso-readiness — Clerk SSO Readiness Contract

## Release ID

`2026-06-03-clerk-sso-readiness`

## Status

`candidate`

## Plain-English Summary

Adds a concrete corporate SSO readiness contract for Clerk Organizations,
SAML/OIDC federation, and client-scoped role mapping. This does not configure a
live customer IdP, but it gives the pilot team an executable gate and evidence
checklist before marking SSO ready.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: identity, access governance, pilot readiness, and operator
  runbooks.
- Runtime impact: no production route behavior, user metadata, database schema,
  or live Clerk configuration changes.

## Client Applicability

- All clients: future pilot/client SSO rehearsals use this contract.
- Specific clients: none configured by this PR.
- Internal only: verifier, runbook, claim contract, and evidence manifest.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/security/clerk-sso-claim-contract.md`
- `docs/runbooks/enterprise-sso-connectivity-test-plan.md`
- `docs/build/CLERK_SSO_READINESS_2026-06-03.md`
- `scripts/auth/verify-clerk-sso-readiness.mjs`
- `package.json`

## QA / Validation

- Pass: `npm run auth:clerk-sso:verify`
- Pass: `npx jest src/lib/admin/__tests__/users-access-sso.test.ts --runInBand`
- Pass: `git diff --check`
- Pass after QA wording fix: `npm run release:check -- --base origin/main --head HEAD`
- Blocked/not run: live Clerk Organization, SAML/OIDC, domain verification, and
  client IdP sign-in evidence are external setup steps and remain out of scope
  for this repository-only PR.

## Rollout Plan

Merge to `main`. Operators can use the runbook and verifier before a client SSO
rehearsal. Live Clerk Organization, domain, SAML/OIDC, and metadata changes
remain manual/external until client IdP details are available.

## Rollback Plan

Revert this documentation and verifier commit. No live auth, data, or schema
rollback is required because this PR does not change runtime authentication
behavior.

## Audit Evidence

- This release record.
- `docs/security/clerk-sso-claim-contract.md`
- `docs/build/CLERK_SSO_READINESS_2026-06-03.md`
- Local verifier output.
- Pull request diff and CI checks.

## Known Gaps

- Does not provision Clerk Organizations or SAML/OIDC.
- Does not validate a live client IdP.
- Does not update production Clerk user metadata.
- T034 remains `In progress` until live SSO configuration, route-smoke, and
  tenant-isolation evidence are captured.
