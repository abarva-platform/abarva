# 2026-09-20-clerk-live-runtime-guard — Clerk Live Runtime Guard

## Release ID

`2026-09-20-clerk-live-runtime-guard`

## Status

`candidate`

## Plain-English Summary

Prevents the shared authenticated application from being released with a Clerk development-instance browser key. The approved deployment workflow now requires the protected production environment to provide a live publishable key and applies that key in the same digest-pinned Container Apps update as the web image.

## Layer Impact

- Release lane: `global-control-lane`.
- Control plane: strengthens the identity-provider configuration gate used by the shared application runtime.
- Product surfaces: no feature, data-model, or tenant-content behavior changes.

## Client Applicability

- All clients: authenticated access uses the same shared Clerk runtime.
- Specific clients: none.
- Internal only: deployment configuration and release validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/aca-main-deploy.yml`
- `src/__tests__/behaviors/aca-clerk-live-config.test.ts`
- This release record.

## QA / Validation

- Pass: focused behavior test verifies the protected environment variable, live-key prefix guard, and same-command digest-pinned environment update.
- Pass: deployment-authority and release checks before merge.
- Not run: live sign-in and verification-email delivery; these require the external Clerk live keys to be installed and deployed first.

## Rollout Plan

1. Configure the matching Clerk live publishable key in the protected GitHub production environment.
2. Rotate the existing Key Vault-backed `clerk-secret-key` to the matching Clerk live secret.
3. Merge through the normal pull-request path so the repo-owned ACA main deployment creates a new digest-pinned revision.
4. Verify the runtime invariant, then perform signed-in and email-delivery proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the workflow's digest-pinned `az containerapp update` only.
- Approved image digest: resolved by the workflow for the exact merged main SHA.
- ACR build policy: unchanged; the repo-owned workflow remains the only shared web-image builder and preserves the Premium registry plus Docker Buildx cache requirements.
- ACA runtime invariant: template image and 100%-traffic revision must match the workflow-resolved digest.
- Worker image invariant: unchanged and still enforced by the workflow.
- Feature/env flag update path: protected production environment variable plus the existing Key Vault-backed ACA secret reference.
- Live signed-in proof required: yes.

## Rollback Plan

Restore the prior matching Clerk key pair, revert this release, and redeploy the prior good main SHA through the repo-owned workflow. Do not mix a publishable key from one Clerk instance with a secret key from another.

## Audit Evidence

- Pull-request diff and CI results.
- ACA deploy workflow artifacts for the merged SHA.
- Runtime environment readback showing a live publishable-key prefix without exposing the key.
- Signed-in browser and verification-email delivery proof.

## Known Gaps

- This repository change does not create a Clerk live instance or supply its credentials. Those external credentials must exist before merge.
