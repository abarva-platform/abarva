# 2026-07-30-foundation-v2-managed-postgres-role-hardening — Managed Postgres Role Hardening Repair

## Release ID

`2026-07-30-foundation-v2-managed-postgres-role-hardening`

## Status

`candidate`

## Plain-English Summary

This repair keeps the Foundation V2 identity-control migration compatible with managed PostgreSQL operators that can create and grant roles but are denied direct role-attribute changes. The migration now creates missing roles with strict defaults, handles provider-level `ALTER ROLE` denial explicitly, and leaves non-BYPASSRLS execution proof to the dedicated identity bootstrap and readback gates before any data load.

## Layer Impact

Client-data-lane: Foundation V2 schema and identity-control migration behavior only. No product routes, providers, publications, baselines, or existing client data are changed by this code update.

Internal-admin: The Azure Container Apps migration job can now complete the identity-control migration in managed PostgreSQL environments where top-level role alteration is denied.

## Client Applicability

- All clients: No direct product-surface change.
- Specific clients: Isolated Foundation V2 lab execution lanes only.
- Internal only: Migration operator, identity bootstrap, and verification flow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `supabase/migrations/20260730152000_foundation_v2_golden_slice_identity_controls.sql` to handle insufficient `ALTER ROLE` privilege while preserving strict create-time role attributes.
- Updated Foundation V2 migration SHA readback expectations.
- Added a focused regression assertion to the Foundation V2 migration-apply test.

## QA / Validation

- `npm run test:foundation-v2-migration:apply -- --proof-output /Users/anand/Downloads/foundation-v2-live-db-execution-20260730/phase-a-schema-substrate/identity-controls-managed-postgres-regression.json` passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deployment workflow build and deploy the digest-pinned image, then rerun the forced identity-control migration apply through the private migration job. After the migration succeeds, rerun writer and reader identity bootstrap/readback before any Foundation V2 data load.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify template image and 100% traffic revision image match the deployed digest before using the job image as proof.
- Worker image invariant: Private operator job must run the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof from this repair alone; required later for product binding and Knowledge proof.

## Rollback Plan

Revert the PR before applying the identity-control migration if validation fails. If the repaired migration has already been applied to a lab database, do not edit the ledger by hand; apply a forward repair migration that restores the prior stricter behavior once an operator with sufficient role-admin privilege is available.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5807
- Local proof: `/Users/anand/Downloads/foundation-v2-live-db-execution-20260730/phase-a-schema-substrate/identity-controls-managed-postgres-regression.json`
- Failed live proof that motivated the repair: `/Users/anand/Downloads/foundation-v2-live-db-execution-20260730/phase-a-schema-substrate/force-apply-identity-controls/logs.txt`

## Known Gaps

This does not prove Foundation V2 data ingestion, RLS behavior under the final writer/reader managed identities, publication, baseline, Cube parity, signed-in Knowledge, or aVa grounding. Those remain gated by the later progressive database execution.
