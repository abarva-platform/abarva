# 2026-07-30-foundation-v2-db-identity-bootstrap - Foundation V2 DB Identity Bootstrap

## Release ID

`2026-07-30-foundation-v2-db-identity-bootstrap`

## Status

`candidate`

## Plain-English Summary

Adds a narrowly scoped operator bootstrap path for Foundation V2 golden-slice execution. The change lets the private operator create and verify dedicated database principals, then run the existing golden-slice executor and verifier with managed-identity PostgreSQL tokens instead of an admin database URL.

## Layer Impact

Lane: `internal-admin`, `client-data-lane`.

Layer 3: Adds operational support for isolated Foundation V2 proof tables only. It does not broaden canonical product data access.

Cross-cutting governance: Preserves fail-closed execution when the bound database session can bypass row-level security, and adds a non-password managed-identity path for the executor and verifier.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: Foundation V2 isolated lab proof execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/bootstrap-db-identity.mjs`
- `scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`
- `package.json`
- Follow-up repair: bootstrap now reads and enables the Azure PostgreSQL AAD extension in the target database before looking for `pgaadauth_create_principal`, and emits extension/function readback in failure proofs.
- Follow-up repair: managed-identity token binding now uses the Azure Container Apps job endpoint/header contract before falling back to VM-style IMDS, so private operator jobs can request PostgreSQL Entra tokens from their assigned user identities.
- Follow-up repair: AAD extension creation is scoped inside a savepoint, so an extension permission failure does not abort the whole bootstrap transaction before function and principal readback can be reported.

## QA / Validation

- Pass: `node --check scripts/foundation-v2/bootstrap-db-identity.mjs`
- Pass: `node --check scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- Pass: `npm run foundation-v2:db-identity:self-test`
- Pass: `npm run test:foundation-v2-golden-slice-db`
- Pass: `npm run test:foundation-v2-package`
- Follow-up validation:
  - Pass: `node --check scripts/foundation-v2/bootstrap-db-identity.mjs`
  - Pass: `npm run foundation-v2:db-identity:self-test`
- Follow-up validation for Container Apps managed-identity token binding:
  - Pass: `node --check scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- Follow-up validation for AAD extension savepoint handling:
  - Pass: `node --check scripts/foundation-v2/bootstrap-db-identity.mjs`
  - Pass: `npm run test:foundation-v2-golden-slice-db` covers the ACA token binding markers.
- Follow-up repair: optional AAD extension creation and principal readback now use savepoints so failed optional probes cannot abort the bootstrap transaction before structured proof is emitted.
- Blocked: live DB identity gate remains blocked until the bootstrap runs as the server Microsoft Entra administrator identity, creates the dedicated non-bypass database principals, and the private operator job runs the golden-slice scripts with managed-identity PostgreSQL auth.

Not run yet: live golden-slice database execution; this release only adds the bootstrap and managed-identity execution path needed before that run.

## Rollout Plan

Merge to main, let the repo-owned Azure Container Apps deploy workflow build and deploy the digest-pinned image, then run identity bootstrap and golden-slice proof through the private ACA operator job. The shared web runtime traffic shift remains controlled only by the repo-owned deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: verify template image and traffic revision digest before live proof claims
- Worker image invariant: no worker image change
- Feature/env flag update path: none
- Live signed-in proof required: yes before any product readiness claim

## Rollback Plan

Revert this release from main and redeploy via the repo-owned workflow. Any database principals created by a lab bootstrap can be revoked from the no-login writer role without touching V1 data, publications, baselines, product providers, or tenant production data.

## Audit Evidence

To be filled after PR, CI, merge, deploy and operator execution proof are complete.

## Known Gaps

This change does not certify the golden slice by itself. Certification still requires non-bypass identity preflight, J0-L12 database execution, independent readback, RLS positive and negative tests, publication/baseline proof, projection and Cube parity proof, and signed-in product/aVa proof where applicable.
