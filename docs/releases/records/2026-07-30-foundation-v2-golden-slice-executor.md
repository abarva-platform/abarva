# 2026-07-30-foundation-v2-golden-slice-executor - Isolated Foundation V2 Golden-Slice Executor

## Release ID

`2026-07-30-foundation-v2-golden-slice-executor`

## Status

`candidate`

## Plain-English Summary

Adds the private-operator commands needed to load and independently verify the approved Foundation V2 golden-slice fixtures after the V2-only schema migration has landed. The slice is isolated test data only; it is not a full reload, active baseline, production provider cutover, Knowledge UI cutover, or aVa activation.

The physical tenant key is resolved from the declared canonical Airline Demo tenant registry entry; the approved isolated Foundation release identity remains scoped to the golden-slice proof namespace.

## Layer Impact

Release lane: `client-data-lane` with `internal-admin` private-operator proof tooling only.

Layer 1 and Layer 2: Reads the approved fixture matrix and records deterministic source-row and source-field identity in the isolated Foundation V2 namespace.

Layer 3: Writes isolated candidate, review and canonical object records under `foundation_v2` only.

Layer 4: Writes isolated publication, non-active test baseline, projection, Cube parity, preview binding and aVa proof records. These are preview/test proof records only.

Cross-cutting governance: Adds deterministic idempotency, transaction rollback, tenant/test namespace isolation, RLS INSERT write policies for a no-login golden-slice writer role, V1 isolation readback and proof-bundle output.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: Foundation V2 isolated lab proof for the approved synthetic golden-slice namespace.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/foundation-v2/golden-slice-support.mjs`
- `scripts/foundation-v2/execute-golden-slice-db.mjs`
- `scripts/foundation-v2/verify-golden-slice-db.mjs`
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`
- `fixtures/foundation-v2/golden-slice/release-contract.json`
- `supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql`
- Package scripts for schema readback, apply, verify, and local tests.

## QA / Validation

- `node --check scripts/foundation-v2/golden-slice-support.mjs ...` - passed.
- `npm run test:foundation-v2-package` - passed.
- `npm run test:foundation-v2-migration` - passed.
- `npm run test:foundation-v2-migration:apply` - passed against a temporary local PostgreSQL cluster.
- `npm run test:foundation-v2-golden-slice` - passed.
- `npm run test:foundation-v2-golden-slice-db` - passed.
- Temporary local PostgreSQL replay with both migrations - passed:
  - schema readback: `FOUNDATION_V2_SCHEMA_READBACK_PASSED`
  - preflight: `FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_PASSED`
  - apply: `FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_APPLIED`
  - verify: `FOUNDATION_V2_GOLDEN_SLICE_CERTIFIED`
  - idempotency rerun: `FOUNDATION_V2_GOLDEN_SLICE_ALREADY_APPLIED_EXACT_MATCH`
- DB-backed negative regression checks - passed:
  - superuser/BYPASSRLS-capable schema readback fails closed
  - non-writer operator schema readback fails closed
  - wrong-tenant writer-role insert fails RLS
  - missing namespace writer-role insert fails RLS
  - tampered persisted gate proof fails exact-match idempotency
  - tampered Cube parity proof fails verifier
  - tampered product projection authority fails verifier
  - tampered aVa baseline/projection binding fails verifier
  - tampered baseline hash fails verifier
  - tampered field lineage fails verifier
- `npm run release:check` - passed.
- `npm run lint -- scripts/foundation-v2/...` - passed after installing worktree dependencies with `npm ci`.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` - passed.
- `npx gitleaks git --redact --no-banner` - passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the digest-pinned image, then run the golden-slice schema readback, writer, and verifier through the private ACA operator job with `DATABASE_URL` supplied as a Key Vault secret reference.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: `scripts/ops/submit-aca-operator-job.mjs` against `job-abarva-private-operator-eus`
- Approved image digest: resolved after merge/deploy
- ACA runtime invariant: required after deployment
- Worker image invariant: private operator job must run the deployed digest-pinned image
- Feature/env flag update path: None
- Live signed-in proof required: No production route cutover; proof is private operator output only

## Rollback Plan

Application rollback is the standard ACA main rollback to the prior digest. The executor writes only isolated Foundation V2 records and is idempotent; it does not destructively clean up or alter V1 records. Any data-plane mismatch fails closed and requires a follow-up repair rather than manual deletion.

## Audit Evidence

- Migration apply run `30542593396`
- Migration `20260730120000_foundation_v2_golden_slice_core.sql`
- Migration SHA-256 `4f0f696495fa09ea54159ee2eab40aeac522de2965644978be9d865b7149dd7f`
- Write-policy migration `20260730133000_foundation_v2_golden_slice_write_policies.sql`
- Write-policy migration SHA-256 `4f8ecd6a9a5fabd7a3e8b40eb79bbb2742348d294444db241b8748d81b4e354d`
- Release contract SHA-256 `4e73c95d0ba3a6478b4beb529b7bd74c161f985c161af9a442a4d93eb86ebfa3`
- Local DB replay proof work dir `/tmp/foundation-v2-db-replay-final2-bg8AuO/proof`
- Operator execution and final proof bundle to be added after deployment

## Known Gaps

This release does not authorize full reload, offline augmentation ingestion, live review-decision application, live canonical promotion, live domain publication, live baseline activation, production provider cutover, production Knowledge UI cutover, production aVa activation, V1 deletion, or security weakening.
