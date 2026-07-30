# 2026-07-30-foundation-v2-golden-slice-executor - Isolated Foundation V2 Golden-Slice Executor

## Release ID

`2026-07-30-foundation-v2-golden-slice-executor`

## Status

`candidate`

## Plain-English Summary

Adds the private-operator commands needed to load and independently verify the approved Foundation V2 golden-slice fixtures after the V2-only schema migration has landed. The slice is isolated test data only; it is not a full reload, active baseline, production provider cutover, Knowledge UI cutover, or aVa activation.

The physical tenant key is resolved from the declared canonical Airline Demo tenant registry entry; the approved isolated Foundation release identity remains scoped to the golden-slice proof namespace.

Follow-up repair: the deployed application image does not include Git metadata, so the executor now locates the application root from packaged project markers instead of requiring `.git`. The runtime image also copies the exact approved golden-slice fixture directory needed by the private operator scripts. This preserves the same fixture and migration hash controls while allowing the private operator container to run the proof scripts.

Follow-up repair 2: private operator log retrieval is limited to the execution log tail, so the executor now emits compact pass/fail diagnostics at the end of proof-bundle runs and emits proof bundles after the full JSON body. This keeps local JSON-only test output unchanged while making failed live runs auditable from ACA tail logs.

Follow-up repair 3: the golden-slice DB executor now fails closed unless it runs through a non-BYPASSRLS login that explicitly assumes the isolated no-login writer role. The change adds a constrained reader role for independent verification, FORCE RLS assertions, managed-identity Postgres authentication support, and a governed identity bootstrap command for private operator use.

Follow-up repair 4: the live writer identity may be intentionally denied metadata access to legacy V1 schemas. V1 isolation probes now record denied V1 metadata access as proof data instead of aborting schema readback, and transaction-scoped probes use savepoints so denied metadata checks cannot poison the preflight/apply transaction. This preserves fail-closed Foundation V2 schema/RLS checks while avoiding any grant broadening on V1 schemas.

## Layer Impact

Release lane: `client-data-lane` with `internal-admin` private-operator proof tooling only.

Layer 1 and Layer 2: Reads the approved fixture matrix and records deterministic source-row and source-field identity in the isolated Foundation V2 namespace.

Layer 3: Writes isolated candidate, review and canonical object records under `foundation_v2` only.

Layer 4: Writes isolated publication, non-active test baseline, projection, Cube parity, preview binding and aVa proof records. These are preview/test proof records only.

Cross-cutting governance: Adds deterministic idempotency, transaction rollback, tenant/test namespace isolation, RLS INSERT write policies for a no-login golden-slice writer role, a no-login read-only verifier role, V1 isolation readback and proof-bundle output.

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
- Container-root discovery repair for deployed private-operator images.
- Runtime image packaging for `fixtures/foundation-v2/golden-slice`.
- Packaged-runtime-root test assertion for the no-`.git` container layout.
- ACA-tail-safe compact diagnostics and proof-bundle emission ordering for golden-slice executor runs.
- Identity-control migration enforcing constrained writer/reader role attributes and FORCE RLS across the isolated Foundation V2 tables.
- Managed-identity Postgres connection option for private operator DB execution without logging or persisting database tokens.
- Governed DB identity bootstrap command for mapping a dedicated lab identity to the constrained writer or reader execution role.
- Verifier support for explicit read-only `SET ROLE foundation_v2_golden_slice_reader`.

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
- Repair validation after deployed-container root discovery failure:
  - `npm run test:foundation-v2-package` - passed.
  - `npm run test:foundation-v2-migration:apply` - passed.
  - `npm run test:foundation-v2-golden-slice` - passed.
  - `npm run test:foundation-v2-golden-slice-db` - passed.
  - `npm run lint -- scripts/foundation-v2/golden-slice-support.mjs` - passed.
  - Independent reviewer found the first root-detection repair still missed runtime fixture packaging; Dockerfile and package test were amended accordingly.
- Proof-tail repair validation after live schema-readback proof extraction failed:
  - `npm run test:foundation-v2-golden-slice-db` - passed, including the `proof_tail_capturable` regression.
  - `npm run lint -- scripts/foundation-v2/execute-golden-slice-db.mjs scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` - passed.
- Identity-control validation before governed lab identity bootstrap:
  - `node --check scripts/foundation-v2/execute-golden-slice-db.mjs` - passed.
  - `node --check scripts/foundation-v2/verify-golden-slice-db.mjs` - passed.
  - `node --check scripts/foundation-v2/bootstrap-db-identity.mjs` - passed.
  - `npm run test:foundation-v2-migration` - passed.
  - `npm run test:foundation-v2-migration:apply` - passed against a temporary local PostgreSQL cluster with all 21 tables under RLS and FORCE RLS.
  - `npm run test:foundation-v2-package` - passed.
  - `npm run test:foundation-v2-golden-slice` - passed.
  - `npm run test:foundation-v2-golden-slice-db` - passed with separate local writer and reader logins, explicit `SET ROLE`, superuser fail-closed proof, wrong-tenant rejection, idempotency and tamper detection.
- V1 metadata-denial repair validation after live writer schema readback failed closed:
  - `npm run lint -- scripts/foundation-v2/execute-golden-slice-db.mjs scripts/foundation-v2/verify-golden-slice-db.mjs scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` - passed.
  - `npm run test:foundation-v2-golden-slice-db` - passed with V1-shaped schemas/tables present but inaccessible to the Foundation V2 writer/reader replay roles.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the digest-pinned image, apply the identity-control migration through the governed migration job, create or reuse the dedicated lab managed identities, bootstrap the database principals through the governed admin path, and then run schema readback, writer preflight/apply, and independent verifier through the private ACA operator job using managed-identity Postgres authentication.

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
- PR #5785 merged to `main` as `4ee99a79db5cd5ccb5ab9d7a77dd1fef70b76271`.
- ACA deploy run `30548314618` passed runtime invariant and health.
- Deployed ACA revision `ca-abarva-web-lab-eastus--m4ee99a79`.
- Deployed image `acrabarvalab001.azurecr.io/abarva/web@sha256:0d09e007f3c8a2452709cb594b1d66f0dc1625b46c13398deb7a494bbeab1960`.
- Governed database migration apply workflow `30549834377`.
- Migration apply operator executions:
  - preflight `job-abarva-private-operator-eus-28dn5v0`
  - apply `job-abarva-private-operator-eus-o2shjv4`
  - schema readback `job-abarva-private-operator-eus-det3tuy`
  - ledger `job-abarva-private-operator-eus-5ff8tnv`
  - repository readback `job-abarva-private-operator-eus-kmhcgog`
  - artifact acceptance readback `job-abarva-private-operator-eus-183nrkk`
- First live golden-slice schema readback execution `job-abarva-private-operator-eus-h2g11if` failed closed before DB proof because container root discovery required `.git`; repair is scoped to packaged app root detection.
- Second live golden-slice schema readback execution `job-abarva-private-operator-eus-vp5d9dr` reached private DB schema and policy readback but failed closed; proof extraction was blocked by ACA tail-only log capture. The second follow-up repair makes proof and compact failure diagnostics tail-capturable before the next live rerun.
- Identity-control migration `20260730152000_foundation_v2_golden_slice_identity_controls.sql`
- Identity-control migration SHA-256 `0e839d8112cdb7049b2979c5259571cca686ddc6650082163e248bf99985f550`
- Local identity-control replay proof from `npm run test:foundation-v2-golden-slice-db`: schema `FOUNDATION_V2_SCHEMA_READBACK_PASSED`, preflight `FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_PASSED`, apply `FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_APPLIED`, verify `FOUNDATION_V2_GOLDEN_SLICE_CERTIFIED`, idempotency `FOUNDATION_V2_GOLDEN_SLICE_ALREADY_APPLIED_EXACT_MATCH`.
- Live writer target bootstrap repair proof: `job-abarva-private-operator-eus-b6nytyx`, proof `/tmp/foundation-v2-db-identity-writer-target-20260730T200814Z/proof/FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.json`, status `FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PASSED`.
- Live reader bootstrap proof:
  - principal `job-abarva-private-operator-eus-a3yzo3s`, proof `/tmp/foundation-v2-db-identity-reader-principal-20260730T201007Z/proof/FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.json`, status `FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PASSED`
  - target `job-abarva-private-operator-eus-bm5ja6s`, proof `/tmp/foundation-v2-db-identity-reader-target-20260730T201222Z/proof/FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.json`, status `FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PASSED`
- First live writer schema readback after identity bootstrap: `job-abarva-private-operator-eus-dc1680b`, failed closed with `permission denied for schema source_registry`; repair 4 keeps the V1 denial as isolation evidence and prevents transaction aborts during V1 probes.

## Known Gaps

This release does not authorize full reload, offline augmentation ingestion, live review-decision application, live canonical promotion, live domain publication, live baseline activation, production provider cutover, production Knowledge UI cutover, production aVa activation, V1 deletion, or security weakening.
