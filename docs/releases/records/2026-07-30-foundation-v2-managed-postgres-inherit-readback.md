# 2026-07-30-foundation-v2-managed-postgres-inherit-readback — Managed Postgres Identity Readback Repair

## Release ID

`2026-07-30-foundation-v2-managed-postgres-inherit-readback`

## Status

`candidate`

## Plain-English Summary

This repair tightens Foundation V2 identity bootstrap reporting for managed PostgreSQL. The bootstrap continues to fail on real privileged-role risks, including superuser, createdb, createrole, replication, BYPASSRLS, missing login, missing membership, or object-ID mismatch. It now records provider-enforced `INHERIT` as a warning when the operator cannot apply `ALTER ROLE`, instead of blocking the target-scope bootstrap after the non-BYPASSRLS checks have passed.

## Layer Impact

Client-data-lane: Foundation V2 identity bootstrap proof behavior only. No rows are loaded, no publication or baseline is activated, and no product provider is switched by this change.

Internal-admin: The private migration/operator job receives clearer pass/fail semantics for managed PostgreSQL role readback.

## Client Applicability

- All clients: No product-surface change.
- Specific clients: Isolated Foundation V2 lab execution lanes only.
- Internal only: Database identity bootstrap and proof generation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `scripts/foundation-v2/bootstrap-db-identity.mjs` to classify managed PostgreSQL `INHERIT` retention as a warning while preserving fatal checks for privileged attributes and RLS bypass.
- Extended the bootstrap self-test to ensure `rolinherit=true` is not treated as a privileged attribute by itself.

## QA / Validation

- `npm run foundation-v2:db-identity:self-test` passed.
- `npx eslint scripts/foundation-v2/bootstrap-db-identity.mjs` passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps workflow build and deploy a digest-pinned image, then rerun writer and reader identity bootstrap/readback through the private operator job. No Foundation V2 data load starts until the bootstrap and schema preflight gates pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify template image and 100% traffic revision image match the deployed digest before using the job image as proof.
- Worker image invariant: Private operator job must run the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof from this repair alone.

## Rollback Plan

Revert the PR before bootstrap retry if validation fails. If a bootstrap proof has already been generated, supersede it with a new proof after rollback or forward repair; do not edit proof artifacts in place.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5809
- Failed live proof that motivated the repair: `/Users/anand/Downloads/foundation-v2-live-db-execution-20260730/phase-a-identity-gate/writer-bootstrap-aad-target-grants-retry/logs.txt`

## Known Gaps

This does not prove Foundation V2 data ingestion, RLS behavior under data writes, publication, baseline, Cube parity, signed-in Knowledge, or aVa grounding. Those remain gated by the later progressive database execution.
