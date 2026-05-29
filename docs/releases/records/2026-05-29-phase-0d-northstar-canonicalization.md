# 2026-05-29-phase-0d-northstar-canonicalization — Northstar Tenant-Key Canonicalization

## Release ID

`2026-05-29-phase-0d-northstar-canonicalization`

## Status

`candidate`

## Plain-English Summary

Northstar's live client row now uses `northstar-clinical`, and its enterprise context chunks were updated from the old `northstar-medtech` tenant key to the same canonical key.

## Layer Impact

Control lane: Northstar now resolves through the canonical five-tenant allowlist.

Data layer: 878 Northstar context chunks were moved to the canonical tenant key.

Retrieval layer: Northstar context retrieval should no longer depend on the retired `northstar-medtech` substrate key.

## Client Applicability

- All clients: canonical tenant validation applies platform-wide.
- Specific clients: Northstar Clinical Technologies receives the data-key update.
- Internal only: archive manifest and verification evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/config/tenants/CANONICAL_TENANTS.ts`
- `src/lib/tenant/aliases.ts`
- `scripts/phase0d-northstar-canonicalize.mjs`
- `verification/phase-0d/archives/northstar-canonicalization-2026-05-29T12-22-23-461Z/MANIFEST.md`

## QA / Validation

- PASS: 878 `enterprise_context_chunks` rows updated from `northstar-medtech` to `northstar-clinical`.
- PASS: post-update scan found zero `northstar-medtech` rows in tenant-scoped DB columns.
- PASS: `npm run db:verify:canonical-tenants`.
- PASS: `npm run db:verify:tenant-keys`.
- PASS: focused tenant alias Jest suite.

## Rollout Plan

The live data update is already applied. Merge this PR to publish the executable script, release record, and audit evidence.

## Rollback Plan

Restore the archived row payload for Northstar by running the inverse tenant-key update from `northstar-clinical` to `northstar-medtech`, then revert the code/config change.

## Audit Evidence

- `verification/phase-0d/archives/northstar-canonicalization-2026-05-29T12-22-23-461Z/MANIFEST.md`
- `verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md`

## Known Gaps

Some loader scripts still contain historical Northstar dataset names. Those are not live tenant rows, but future loader cleanup should align script defaults to `northstar-clinical`.
