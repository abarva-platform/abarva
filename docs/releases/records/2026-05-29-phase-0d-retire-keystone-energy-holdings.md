# 2026-05-29-phase-0d-retire-keystone-energy-holdings — Retire Keystone Energy Holdings

## Release ID

`2026-05-29-phase-0d-retire-keystone-energy-holdings`

## Status

`candidate`

## Plain-English Summary

Keystone Energy Holdings was a non-canonical synthetic tenant. Its row payloads were archived, engagement-dependent program rows were removed, and the tenant was deleted from the live client control lane.

## Layer Impact

Control lane: Keystone is removed from the live clients table.

Data layer: Keystone client-scoped rows, engagement-dependent rows, and program audit rows were deleted after archive.

Audit lane: pre-delete row exports and archive manifests are published under `verification/phase-0d`.

## Client Applicability

- All clients: tenant allowlist enforcement applies platform-wide.
- Specific clients: Keystone is removed; no active canonical client receives Keystone data.
- Internal only: diagnostic and archive evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/phase0d-tenant-diagnostic.mjs`
- `scripts/phase0d-tenant-cleanup.mjs`
- `verification/phase-0d/diagnostic-data/keystone-energy-holdings/`
- `verification/phase-0d/archives/keystone-energy-holdings-2026-05-29T12-17-44-599Z/MANIFEST.md`

## QA / Validation

- PASS: Keystone row payloads archived before deletion.
- PASS: Keystone client row deleted.
- PASS: Keystone `program_audit_log` rows were archived, then deleted through a scoped temporary bypass of the table's no-delete trigger.
- PASS: `program_audit_log_no_delete` trigger verified enabled after cleanup.
- PASS: retired reference scan found zero Keystone id/key references across tenant-scoped columns.
- PASS: `npm run db:verify:canonical-tenants`.

## Rollout Plan

The live data deletion is already applied. Merge this PR to publish the executable script, release record, and audit evidence.

## Rollback Plan

Restore Keystone from the archived row exports only if a founder-approved rollback is required. Audit-log restoration requires the same scoped trigger-control procedure used for deletion.

## Audit Evidence

- `verification/phase-0d/NON_CANONICAL_TENANT_DIAGNOSTIC.md`
- `verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md`
- `verification/phase-0d/archives/keystone-energy-holdings-2026-05-29T12-17-44-599Z/MANIFEST.md`

## Known Gaps

Some old test and seed code still mentions Keystone. It is no longer present in live client data and should be retired in a follow-up code-content cleanup.
