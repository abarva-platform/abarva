# 2026-10-02-source-nda-esign-deploy-config — Demo NDA deployment configuration

## Release ID

`2026-10-02-source-nda-esign-deploy-config`

## Status

`candidate`

## Plain-English Summary

The main deployment can now pass the optional NDA e-signature identifiers to the web runtime. It defaults to disabled and rejects an incomplete or non-demo provider configuration before building. Existing document upload remains available. This release does not send an envelope, receive a webhook, or record an executed NDA.

## Layer Impact

- Release lane: `experimental`.
- Layer 4 Products: optional Source runtime configuration and disabled-state presentation.
- Layer 3 Canonical Model and Layer 2 Source Adapters: no data or adapter changes.

## Client Applicability

- All clients: the main deployment explicitly disables the provider unless configured; existing upload behavior continues.
- Internal synthetic lab only: a complete demo configuration may be staged in GitHub's production environment variables, but activation requires the later send/callback capability and its own acceptance.
- Real clients: no production provider mode is permitted.

## Changes Included

- Seven Source NDA environment variables are mapped from environment variables in the repo-owned ACA main workflow.
- A deploy preflight accepts only disabled or complete demo settings with a versioned key in the lab vault and a test inbox.
- Canonical revision reuse rejects configuration drift instead of silently keeping an older setting.
- Public deployment evidence redacts Source NDA environment values before upload; the ACA update log projects only the revision name.

## QA / Validation

- Passed red-first workflow/configuration tests, including missing setting, non-demo mode, wrong key URL, and public-evidence redaction.
- Removing the test inbox from the deploy arguments made the focused test fail; the change was restored.
- Focused tests, TypeScript, scoped ESLint, shell syntax and release checks are recorded with the PR.
- No live signing or callback acceptance is claimed.

## Rollout Plan

Squash-merge through a PR. Only `.github/workflows/aca-main-deploy.yml` deploys the digest-pinned image and updates the shared web runtime. The provider variable defaults to `disabled`. Stage the seven non-secret variables in the GitHub production environment only when the downstream send/callback flow and credential operations are ready; changing variables on an already deployed commit requires a new main commit, because canonical revision reuse refuses config drift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- ACR build policy: the existing main-only Premium-registry Buildx/cache and digest-pinned image path is unchanged.
- Shared runtime mutators: this workflow alone.
- Approved image digest: resolved by the main workflow after merge.
- ACA runtime invariant: verify the web template, 100%-traffic revision and required worker images all match that digest.
- Feature/env flag update path: GitHub production environment variables, consumed only by a new main deployment.
- Live signed-in proof required: provider status and, after future slices, a synthetic envelope round trip.

## Rollback Plan

Set the provider variable to `disabled` in the GitHub production environment and release a new main commit through the repo-owned deploy workflow. Revert this PR by PR if the mapping itself must be removed. Do not mutate ACA traffic or environment outside that workflow.

## Audit Evidence

Focused tests, mutation failure, PR checks, official ACA deploy run, and read-only digest/runtime verification.

## Known Gaps

The webhook secret transfer, envelope migration apply, OAuth consent, callback, send and embedded-signing surfaces, and the signed-in demo round trip remain separate work. This release does not authorize or imply any of them.
