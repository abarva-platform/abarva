# 2026-07-30-foundation-v2-isolated-healthcare-lane - Foundation V2 Isolated Healthcare Lane

## Release ID

`2026-07-30-foundation-v2-isolated-healthcare-lane`

## Status

`candidate`

## Plain-English Summary

Adds a parameterized Foundation V2 execution context so Healthcare can run as a physically isolated golden-slice lane. The same approved Foundation V2 contract can now render SQL and operator commands for a Healthcare schema, Healthcare roles, Healthcare release identity, and Healthcare proof package without reusing another domain's runtime tables or role grants.

## Layer Impact

Lane: `internal-admin`, `client-data-lane`.

Layer 1: Declares the synthetic Healthcare tenant key for isolated proof input.

Layer 3: Adds isolated Foundation V2 schema rendering and Healthcare execution configuration. No production canonical tables, active baselines, product providers, or runtime Knowledge bindings are changed.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: Healthcare Foundation V2 isolated lab proof execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/golden-slice-support.mjs`
- `scripts/foundation-v2/render-isolated-schema-sql.mjs`
- `scripts/foundation-v2/execute-golden-slice-db.mjs`
- `scripts/foundation-v2/verify-golden-slice-db.mjs`
- `scripts/foundation-v2/bootstrap-db-identity.mjs`
- `fixtures/foundation-v2/healthcare-golden-slice/*`
- `datasets/tenant-inputs/tenant-input-registry.json`
- `package.json`

## QA / Validation

- Pass: `node --check scripts/foundation-v2/golden-slice-support.mjs`
- Pass: `node --check scripts/foundation-v2/render-isolated-schema-sql.mjs`
- Pass: `node --check scripts/foundation-v2/execute-golden-slice-db.mjs`
- Pass: `node --check scripts/foundation-v2/verify-golden-slice-db.mjs`
- Pass: `node --check scripts/foundation-v2/bootstrap-db-identity.mjs`
- Pass: `node --check scripts/foundation-v2/verify-cross-domain-isolation-db.mjs`
- Pass: Healthcare context executor self-test with pinned fixture SHA `fda3a9c3f96e6dab6c8ebc0abff0379a1a572b36401f679dc0b52b57e1ad345d`
- Pass: `npm run foundation-v2:healthcare:render-isolated-schema -- --out-dir /tmp/foundation-v2-healthcare-render-check-2`
- Pass: `npm run test:foundation-v2-golden-slice-db`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: added-line restricted-token guard

## Rollout Plan

Merge to main, let the repo-owned Azure Container Apps deploy workflow build and deploy the digest-pinned image, then use the private ACA operator job to render/apply the isolated Healthcare schema, bootstrap Healthcare identities, run schema readback, and only then begin J0-J12 database execution with per-layer reconciliation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: required before any live proof claim
- Worker image invariant: use the same digest-pinned image as the deployed runtime
- Feature/env flag update path: none
- Live signed-in proof required: yes before any product/aVa readiness claim

## Rollback Plan

Revert this release from main and redeploy through the repo-owned workflow. Any isolated Healthcare lab schema or role grants created by operator execution can be dropped or revoked without touching another domain's schema, publications, baselines, projections, providers, or product routes.

## Audit Evidence

To be filled after PR, CI, merge, deploy and operator execution proof are complete.

## Known Gaps

This change does not certify Healthcare. Certification still requires Healthcare-specific managed identities, isolated schema apply/readback, cross-domain negative access tests, J0-J12 job-at-a-time execution, per-layer reconciliation, PostgreSQL/Cube parity proof, provider proof, signed-in Knowledge proof, and aVa grounding/refusal proof.
