# 2026-09-15 — Source Contract Intelligence Migration Repair

## Release ID

`2026-09-15-source-contract-intelligence-migration-repair`

## Status

`candidate`

## Plain-English Summary

Repairs the SQL expression that creates the hardened Source contract-intelligence projection. The projection remains additive, explicit-archetype-only, and fail-closed when reviewed purpose or benchmark evidence is absent.

## Layer Impact

`client-data-lane`; Layer 3 canonical/read model and Layer 4 Source projections.

- L3: allows the hardened contract-intelligence view migration to apply cleanly.
- L4: preserves the existing governed read path; no intended layout or wording change.

## Client Applicability

- All clients: the additive migration and read-path repair are reusable and isolated by client context.
- Specific clients: none.
- Internal only: migration and operator-job diagnostics.
- Public/demo only: synthetic lab validation only; no real client data is included.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260914153000_source_contract_intelligence_read_model_hardening.sql`
- Migration repair release record
- PR #7709

## QA / Validation

- Local diff validation: passed.
- Fresh Postgres migration replay: passed in CI.
- Backend load regression: passed in CI.
- Full PR checks: in progress until merge; the earlier failed live job was caused by the missing database secret binding and the corrected job reached the SQL statement before exposing this migration syntax issue.
- Azure schema apply and package reload: not yet completed.

## Rollout Plan

Merge through protected `main`, deploy through the repo-owned ACA workflow, apply the pending migration through the digest-pinned ACA operator Job, verify both migration records and the hardened view, then run approved Source package jobs with row-count and quality-gate readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository workflow only
- Approved image digest: assigned by the ACA workflow after merge
- ACA runtime invariant: template image and 100% traffic revision must match the approved digest
- Worker image invariant: the governed operator Job must record the same digest in its proof bundle
- Feature/env flag update path: none
- Live signed-in proof required: Source portfolio, Contract 360, and contract-intelligence tabs after migration and reload

## Rollback Plan

Revert the repair through a new PR and redeploy the prior approved digest. The provenance migration applied in the prior step is additive and already applied; do not delete its rows during rollback. Reconcile data only through the governed ACA Job after the replacement migration is approved.

## Audit Evidence

- PR #7709 and CI migration-replay result
- ACA deploy run, merge SHA, image digest, revision, and runtime invariant
- Schema-job execution logs and migration readback
- Source data-build job proof bundles and signed-in readback, when executed

## Known Gaps

- Azure has not yet received the repaired read-model migration.
- The Source contract packages have not yet been reloaded under this release.
- The shared mixed depth package remains blocked until its managed-services lanes are enriched; only packages with passing quality gates may load.
