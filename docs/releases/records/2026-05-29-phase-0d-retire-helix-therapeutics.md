# 2026-05-29-phase-0d-retire-helix-therapeutics — Retire Helix Therapeutics

## Release ID

`2026-05-29-phase-0d-retire-helix-therapeutics`

## Status

`candidate`

## Plain-English Summary

Helix Therapeutics was a non-canonical synthetic tenant. Its row payloads were archived and the tenant was removed from the live client control lane.

## Layer Impact

Control lane: Helix is removed from the live clients table.

Data layer: Helix client-scoped rows were deleted after archive.

Audit lane: pre-delete row exports and archive manifests are published under `verification/phase-0d`.

## Client Applicability

- All clients: tenant allowlist enforcement applies platform-wide.
- Specific clients: Helix is removed; no active canonical client receives Helix data.
- Internal only: diagnostic and archive evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/phase0d-tenant-diagnostic.mjs`
- `scripts/phase0d-tenant-cleanup.mjs`
- `verification/phase-0d/diagnostic-data/helix-therapeutics/`
- `verification/phase-0d/archives/helix-therapeutics-2026-05-29T12-17-44-599Z/MANIFEST.md`

## QA / Validation

- PASS: Helix row payloads archived before deletion.
- PASS: Helix client row deleted.
- PASS: retired reference scan found zero Helix id/key references across tenant-scoped columns.
- PASS: `npm run db:verify:canonical-tenants`.

## Rollout Plan

The live data deletion is already applied. Merge this PR to publish the executable script, release record, and audit evidence.

## Rollback Plan

Restore Helix from the archived row exports only if a founder-approved rollback is required.

## Audit Evidence

- `verification/phase-0d/NON_CANONICAL_TENANT_DIAGNOSTIC.md`
- `verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md`
- `verification/phase-0d/archives/helix-therapeutics-2026-05-29T12-17-44-599Z/MANIFEST.md`

## Known Gaps

Some old seed scripts still mention Helix. They are not live client rows and should be retired in a follow-up code-content cleanup.
