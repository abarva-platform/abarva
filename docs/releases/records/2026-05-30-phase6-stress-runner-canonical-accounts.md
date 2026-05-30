# 2026-05-30-phase6-stress-runner-canonical-accounts — Stress Runner Account Alignment

## Release ID

`2026-05-30-phase6-stress-runner-canonical-accounts`

## Status

`candidate`

## Plain-English Summary

The Phase 6 stress runner was still trying to sign in to an old Apex demo account that is no longer part of the five canonical tenants. This aligns the runner with the canonical Apex CIO account and adds explicit override environment variables so future validation can test a tenant with a specific Clerk persona without editing the script.

## Layer Impact

- `qa-validation-lane`: Fixes Phase 6 validation harness setup for canonical tenant testing.
- `runtime-app-lane`: No app runtime behavior changes.
- `data-plane-lane`: No database, tenant data, RLS, migration, or corpus changes.

## Client Applicability

- All clients: Validation tooling can now override persona/client key for any tenant run.
- Specific clients: Apex Retail validation now defaults to `cio@apex-retail.example.com`.
- Internal only: Yes, this is an internal audit script change.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates the Apex stress-runner persona from the retired `demo-apexretail+clerk_test@abarva.com` account to `cio@apex-retail.example.com`.
- Adds `STRESS_PERSONA_EMAIL` override support.
- Adds `STRESS_CLIENT_KEY` override support.
- Adds `firstcapital` as an alias for the existing `arcturus` First Capital runner profile.

## QA / Validation

- PASS: `node --check scripts/audit/run-full-module-stress.mjs`.
- PASS: `git diff --check`.
- Pending: `npm run release:check -- --base origin/main --head HEAD`.
- Pending: PR CI.
- Pending: Phase 6 reruns using canonical tenant accounts.

## Rollout Plan

Merge after CI passes. This is an audit-script-only change and does not require production deployment.

## Rollback Plan

Revert this PR to restore the prior stress-runner account defaults. No production rollback, database rollback, or environment rollback is required.

## Audit Evidence

- Harness file: `scripts/audit/run-full-module-stress.mjs`.
- Apex failure that triggered this fix: Phase 6 run attempted `demo-apexretail+clerk_test@abarva.com` and Clerk returned no user.

## Known Gaps

This fixes validation-account alignment only. It does not convert tenant expected-answer JSON assets into a generic 25-question live scorer; that remains a separate validation-harness improvement.
