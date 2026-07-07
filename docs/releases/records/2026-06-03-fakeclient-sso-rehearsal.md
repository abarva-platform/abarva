# 2026-06-03-fakeclient-sso-rehearsal — FakeClient SSO Rehearsal Kit

## Release ID

`2026-06-03-fakeclient-sso-rehearsal`

## Status

`candidate`

## Plain-English Summary

Adds a concrete FakeClient corporate SSO rehearsal kit so the team can test the
enterprise identity path before a real client connects Microsoft Entra/AD. The
kit defines synthetic users, Entra groups, Clerk Organization expectations,
SAML/OIDC plus SCIM evidence, route smokes, tenant-isolation checks, and
rollback evidence.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: identity rehearsal, admin readiness, and SSO evidence process.
- Runtime impact: no production auth behavior, Clerk metadata, user records, or
  data-plane access changes.

## Client Applicability

- All clients: future SSO rehearsals can reuse the pattern.
- Specific clients: `fakeclient` rehearsal only; no real customer is configured.
- Internal only: AbarVa operators running pilot readiness rehearsal.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `config/sso/fakeclient-entra-clerk-rehearsal.json`
- `docs/runbooks/fakeclient-entra-sso-rehearsal.md`
- `docs/build/FAKECLIENT_SSO_REHEARSAL_2026-06-03.md`
- `scripts/auth/verify-fakeclient-sso-rehearsal.mjs`
- `package.json`

## QA / Validation

- Pass: `npm run auth:fakeclient-sso:verify`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked/not run: live Entra tenant, Clerk Organization, SAML/OIDC connection,
  SCIM provisioning, 10-user sign-in proof, route smoke, tenant-isolation probe,
  and rollback transcript are external setup/evidence steps.

## Rollout Plan

Merge to `main`. Operators can use the manifest, runbook, and verifier before a
real client SSO setup. No live identity provider configuration is changed by the
PR.

## Rollback Plan

Revert the PR. No production auth or data rollback is required.

## Audit Evidence

- This release record.
- FakeClient rehearsal manifest.
- Runbook.
- Verifier output.
- Pull request and CI checks.

## Known Gaps

T138 and T140 remain `In progress` until live Entra/Clerk setup, SCIM
provisioning, route smokes, tenant-isolation probes, and rollback transcript are
captured.
