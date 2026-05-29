# 2026-05-29-phase-0d-retire-brindlemark-financial — Retire Brindlemark Financial

## Release ID

`2026-05-29-phase-0d-retire-brindlemark-financial`

## Status

`candidate`

## Plain-English Summary

Brindlemark Financial was a duplicate financial-services tenant shell. Its substrate was archived, merged into First Capital, and the duplicate client row was deleted.

## Layer Impact

Control lane: Brindlemark is removed from the live clients table and First Capital remains the canonical financial-services tenant.

Data layer: Brindlemark rows were moved to First Capital across client-scoped and tenant-id-scoped tables.

Audit lane: pre-merge row exports and archive manifests are published under `verification/phase-0d`.

## Client Applicability

- All clients: tenant allowlist enforcement applies platform-wide.
- Specific clients: First Capital receives the merged Brindlemark substrate.
- Internal only: diagnostic and archive evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/phase0d-tenant-diagnostic.mjs`
- `scripts/phase0d-tenant-cleanup.mjs`
- `verification/phase-0d/diagnostic-data/brindlemark-financial/`
- `verification/phase-0d/archives/brindlemark-financial-2026-05-29T12-17-44-599Z/MANIFEST.md`

## QA / Validation

- PASS: duplicate `person_client_memberships` were removed before merge.
- PASS: Brindlemark rows were merged into First Capital and Brindlemark client row deleted.
- PASS: retired reference scan found zero Brindlemark id/key references across tenant-scoped columns.
- PASS: `npm run db:verify:canonical-tenants`.

## Rollout Plan

The live data merge is already applied. Merge this PR to publish the executable script, release record, and audit evidence.

## Rollback Plan

Restore Brindlemark from the archived row exports if a rollback is required, then reinsert the archived client row and move First Capital rows carrying the archived Brindlemark identifiers back to the restored client id.

## Audit Evidence

- `verification/phase-0d/NON_CANONICAL_TENANT_DIAGNOSTIC.md`
- `verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md`
- `verification/phase-0d/archives/brindlemark-financial-2026-05-29T12-17-44-599Z/MANIFEST.md`

## Known Gaps

Brindlemark remains accepted as a legacy alias in app-level tenant alias resolution so stale links route to First Capital instead of a dead tenant shell.
