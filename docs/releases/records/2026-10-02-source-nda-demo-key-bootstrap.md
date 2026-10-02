# Source NDA demo signing key bootstrap

## Release ID

`2026-10-02-source-nda-demo-key-bootstrap`

## Status

`candidate`

## Plain-English Summary

Adds a manual, lab-only way to create the demo e-signature login key inside the private Azure Key Vault and return only its public key for provider registration. It does not send envelopes, handle webhook secrets, or enable signing in the product.

## Layer Impact

Release lane: `internal-admin`. No canonical or client data changes. This is an internal operations control for a future Source workflow integration.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: authorized lab operators.
- Public/demo only: the demo provider environment.
- Feature flag: none; the workflow is manual-only.

## Changes Included

- Dispatch-only `.github/workflows/source-nda-demo-key-bootstrap.yml`.
- Private-network key bootstrap and public-proof scripts with negative tests.
- No migration, route, secret, or shared runtime template change.

## QA / Validation

- Pass: focused Node behavior tests for create/read idempotency, fail-closed authorization, non-exportability, least-privilege key operations, and public proof parsing.
- Pass: workflow YAML parse and read-only live topology checks before release.
- Not run: Azure provisioning and provider public-key upload require a separately authorized workflow dispatch.

## Rollout Plan

Merge through a PR. The repo-owned ACA main deploy must first place these scripts in the digest-pinned image. An authorized operator may then dispatch the workflow on main, choose `create`, and type `CREATE_LAB_KEY`. The job runs in the private ACA environment with a temporary identity. Only the public PEM is emitted for provider upload.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for image delivery only.
- Shared runtime mutators: none in this release.
- Approved image digest: verified by the manual workflow before a job is started.
- ACA runtime invariant: web template and 100% revision checked by the manual workflow.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: future e-signature round trip, not this key bootstrap.

## Rollback Plan

Do not dispatch the manual workflow. If already dispatched, revoke the key-scoped runtime signing assignment and disable the lab key through a separately authorized operator action. Do not delete or rotate the key automatically; provider registration may refer to its public key. The one-off job and temporary identity are removed by the workflow.

## Audit Evidence

PR and checks, manual workflow run ID, preflight JSON, public-key proof, temporary-identity cleanup, and the provider's demo app key registration. Public proof contains no private key.

## Known Gaps

The provider adapter, webhook secret intake, envelope lifecycle, and signed-in round trip are separate work. No claim of a completed integration or live signature is made here.
