# 2026-06-02-data-load-center-readiness-view — Data Load Center Readiness View

## Release ID

`2026-06-02-data-load-center-readiness-view`

## Status

`candidate`

## Plain-English Summary

The admin Data Load Center now shows loader readiness, pilot data-plane verifier posture, and next actions in one place. Operators can see which load controls are ready, which parts are audit-only or fail-closed, and where to start a governed load, run the verifier, or review quarantine.

## Layer Impact

- `client-data-lane`: Strengthens the client-scoped private data-plane readiness view using existing verifier and audit-only ledger contracts. No database migration, schema change, or live data write is introduced.
- `internal-admin`: Improves the AbarVa/admin setup entrypoint at `/admin/setup` so operators can inspect load posture before pilot use.

## Client Applicability

- All clients: `/admin/setup` displays the new readiness, verifier, and next-action status section through the existing admin shell.
- Specific clients: Apex Retail, Meridian Health, SkyHarbor, and other admin-resolved clients see the same readiness contract, with tenant-specific template context already handled by the existing model.
- Internal only: Yes, this is an admin/operator surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/setup-data-load-center.ts` now derives pilot verifier posture from the T341 env-key contract and exposes loader readiness from the audit-only ingestion ledger contract.
- `src/components/admin/SetupDataLoadCenter.tsx` adds a compact loader readiness, pilot verifier posture, and launch actions section above the dimension library.
- `src/lib/admin/__tests__/setup-data-load-center.test.ts` covers fail-closed verifier posture, live-ready key-name posture, audit-only ledger status, and launch affordances.
- `src/app/(maestro)/admin/setup/__tests__/page-source.test.ts` locks the Data Load Center source against the open template-preflight slice.

## QA / Validation

- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest --runTestsByPath 'src/lib/admin/__tests__/setup-data-load-center.test.ts' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' --runInBand`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint 'src/lib/admin/setup-data-load-center.ts' 'src/components/admin/SetupDataLoadCenter.tsx' 'src/lib/admin/__tests__/setup-data-load-center.test.ts' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts'`
- PASS: `git diff --check origin/main...HEAD`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI passes. The readiness view becomes active through the normal Next.js/Vercel deployment. No migration, Azure resource deploy, queue change, or environment-variable change is required.

## Rollback Plan

Revert the PR to restore the previous Data Load Center presentation. No data rollback is required because this release does not write customer data or change schema.

## Audit Evidence

- PR URL and CI run once opened.
- Local focused Jest, diff-check, and release-check output.
- Source files listed in Changes Included.

## Known Gaps

The view reports current readiness and audit-only posture; it does not make the pilot data plane live-ready, add durable commit tables, apply migrations, run live Azure/Clerk verification, or modify upload/template preflight behavior.
