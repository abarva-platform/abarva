# Source NDA demo webhook secret transfer

## Release ID

`2026-10-02-source-nda-demo-webhook-secret`

## Status

`candidate`

## Plain-English Summary

Adds a manual, lab-only path to transfer a provider-issued webhook HMAC secret from an encrypted GitHub environment secret into the private Azure Key Vault. It does not generate a secret, enable the integration, send envelopes, or record an executed NDA.

## Layer Impact

Release lane: `internal-admin`. No canonical or client data changes. This is an internal operations control for a future Source e-signature workflow.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: authorized lab operators.
- Public/demo only: the demo provider environment.
- Feature flag: none; the workflow is manual-only.

## Changes Included

- Dispatch-only `.github/workflows/source-nda-demo-webhook-secret.yml`.
- In-network Key Vault writer and owner-only temporary ACA job-spec generator.
- Focused absence, secret-reference, failure, and no-output tests.
- No migration, product route, or shared web-runtime mutation.

## QA / Validation

- Pass: focused tests for metadata-only absence, existing-secret refusal, secret reference, owner-only temporary file, and silent failure.
- Pass: workflow structure, shell syntax, lint, typecheck, and release checks before PR.
- Not run: provider secret transfer requires the operator to create the encrypted environment secret and separately dispatch the manual workflow.

## Rollout Plan

Merge through a PR. The repo-owned ACA main workflow must deploy the script in a digest-pinned image. The operator places the provider-issued value in the `SOURCE_NDA_DEMO_WEBHOOK_HMAC` encrypted secret of the `production` GitHub environment, dispatches this workflow on `main` with `STORE_LAB_WEBHOOK_SECRET`, then deletes the GitHub environment secret after successful cleanup. The workflow refuses an existing vault secret and never emits the value. It creates a temporary job secret in ACA, whose job and identity are removed at the end.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for image delivery only.
- Shared runtime mutators: none in this release.
- Approved image digest: verified by the manual workflow before the one-off job starts.
- ACA runtime invariant: web template and 100% revision checked by the manual workflow.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: future e-signature round trip, not this secret transfer.

## Rollback Plan

Do not dispatch the manual workflow. If a completed transfer must be reversed, disable or delete the lab vault secret through a separately authorized private-network operation, revoke provider HMAC use, and remove the encrypted GitHub environment secret. No automatic secret deletion or rotation is attempted.

## Audit Evidence

PR and checks, manual workflow run ID, job success/failure status, temporary grant and job cleanup. No secret-bearing job spec or container log is uploaded as an artifact.

## Known Gaps

The temporary bootstrap identity has metadata-list and set permission at vault scope for the duration of the one-off job, but no permission to read secret values. The writer targets only the named lab secret. Key Vault SET creates a new version when another actor creates the same name after the metadata check; the workflow serializes its own dispatches but cannot atomically exclude an out-of-band writer. Provider configuration, webhook verification, and signed-in completion remain separate work.
