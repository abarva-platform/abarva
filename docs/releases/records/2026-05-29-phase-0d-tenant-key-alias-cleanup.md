# 2026-05-29-phase-0d-tenant-key-alias-cleanup — Tenant-Key Alias Cleanup

## Release ID

`2026-05-29-phase-0d-tenant-key-alias-cleanup`

## Status

`candidate`

## Plain-English Summary

Legacy tenant-key aliases in Source and program control tables were rewritten to canonical tenant keys. This closes the red guard from `db:verify:tenant-keys`.

## Layer Impact

Control lane: canonical tenant keys are now enforced consistently across Source/program state tables.

Data layer: 575 rows were updated from historical aliases such as `apexretail`, `meridian`, and old Northstar keys to canonical keys.

QA lane: the existing tenant-key verifier now passes against live data.

## Client Applicability

- All clients: canonical tenant-key enforcement applies platform-wide.
- Specific clients: Apex, Meridian, and Northstar had alias rows rewritten.
- Internal only: archive manifest and verification evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/phase0d-tenant-key-alias-cleanup.mjs`
- `scripts/verify-tenant-key-canonical.ts`
- `verification/phase-0d/archives/tenant-key-alias-cleanup-2026-05-29T12-24-02-987Z/MANIFEST.md`

## QA / Validation

- PASS: 575 alias rows were archived and rewritten to canonical keys.
- PASS: `npm run db:verify:tenant-keys`.
- PASS: `npm run db:verify:canonical-tenants`.
- PASS: focused tenant alias Jest suite.

## Rollout Plan

The live data rewrite is already applied. Merge this PR to publish the executable script, release record, and audit evidence.

## Rollback Plan

Restore prior alias values from the archived row exports if a rollback is required, then rerun the tenant-key verifier to confirm the expected red state.

## Audit Evidence

- `verification/phase-0d/archives/tenant-key-alias-cleanup-2026-05-29T12-24-02-987Z/MANIFEST.md`
- `verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md`

## Known Gaps

The codebase still contains some non-runtime legacy seed/test references to retired tenants. Those should be handled in a follow-up code-content cleanup, separate from live DB canonicalization.
