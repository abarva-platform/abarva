# 2026-06-06-meridian-phase0-profile-neutralization — Meridian Phase 0 Profile Neutralization

## Release ID

`2026-06-06-meridian-phase0-profile-neutralization`

## Status

`candidate`

## Plain-English Summary

This change neutralizes the Meridian healthcare composite demo tenant profile name used by the Admin Data Loader. The previous profile still attempted to write a prohibited display name during Phase 0, so the live private data-plane run loaded the tables but reported a client-profile update error. This correction lets the next Meridian loader run update the client profile cleanly while preserving the same client id and idempotent row loads.

## Layer Impact

- `client-data-lane`: Updates Meridian-only dataset metadata and Meridian audit expectations. It does not change schema, runtime routes, product UI, auth, or shared application behavior.

## Client Applicability

- All clients: No.
- Specific clients: Meridian healthcare composite demo tenant only.
- Internal only: Loader/audit operators see cleaner run evidence.
- Public/demo only: No public route changes.
- Feature flag: None.

## Changes Included

- Updates `datasets/meridian-health-synthetic-v1/00-profile/enterprise-profile.yaml` so Phase 0 writes `Healthcare Composite Demo Tenant` instead of the prohibited display name.
- Updates Meridian template/catalog display metadata to match the neutral profile label.
- Aligns `scripts/audit/db-substrate-audit.mjs` with the live Meridian client id and the generated dataset's 42 AI initiatives.
- Adds this release record for the controlled client-data-lane change.

## QA / Validation

- PASS: `git diff --check`
- PASS: `TENANT_KEY=meridian DATABASE_URL=postgresql://placeholder tsx scripts/seed/load-tenant-substrate.ts --dry-run --concurrency=2`
- PASS evidence from dry run: Phase 0 reports `updated=1, errors=0`; Phase 2 sees 320 chunks; Phase 3 sees 140 applications; Phase 4 sees 42 AI initiatives; Phase 5 sees 50 vendor contracts.
- PENDING: `npm run release:check -- --base origin/main --head HEAD` after this record-format correction.
- PENDING: Azure Admin Data Loader rerun after PR merge to confirm live Phase 0 reports `updated=1, errors=0`.

## Rollout Plan

Merge this PR to main through the normal PR flow. After merge, rerun the Azure Admin Data Loader for `TENANT_KEY=meridian` using the existing private runner. Confirm the shared runner template is restored to the normal SkyHarbor/OpenAI state after the one-off Meridian execution.

## Rollback Plan

Revert this PR if the neutral profile label causes an unexpected demo-labeling issue. The table loads are idempotent and can be rerun after rollback or after a revised profile label is approved.

## Audit Evidence

- Prior Azure execution `job-skyharbor-load-0528-237ezi9` succeeded for Meridian table loads but logged `Phase 0 client: updated=0, errors=1` because the profile name still contained the prohibited label.
- Dry-run evidence in this branch shows the corrected profile reaches Phase 0 as `updated=1, errors=0`.
- Post-merge evidence should include the next Azure execution id and loader summary.

## Known Gaps

- The live Meridian table rows are already loaded, but the Phase 0 profile update is not clean until this change is merged and the Azure loader is rerun.
- `enterprise_context_source_files` still depends on upstream FK parent rows and is skipped by the live loader; chunk-level provenance remains preserved in `source_doc` and `source_record_id`.
