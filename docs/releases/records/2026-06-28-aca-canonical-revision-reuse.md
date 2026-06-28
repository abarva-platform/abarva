# 2026-06-28-aca-canonical-revision-reuse — ACA Canonical Revision Reuse

## Release ID

`2026-06-28-aca-canonical-revision-reuse`

## Status

`candidate`

## Plain-English Summary

The ACA main deploy workflow can now recover a healthy approved main revision when traffic drifts away from it. If the canonical `m<main-sha>` revision already exists, the workflow reuses that digest-pinned image instead of rebuilding a different image under the same revision suffix and failing before traffic can be restored.

## Layer Impact

- `global-control-lane`: updates the shared Azure Container Apps deploy workflow only. It does not change product UI, tenant data, schemas, or feature flags.

## Client Applicability

- All clients: yes, because `app.abarva.ai` is the shared Product/Lab runtime.
- Specific clients: none.
- Internal only: deploy workflow behavior.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/aca-main-deploy.yml`: adds an existing-canonical-revision detection step and uses that digest as the expected image when present.

## QA / Validation

- Pending CI on PR.
- Expected live proof after merge: workflow dispatch or push deploy restores 100% ACA traffic to the canonical main revision and `npm run deploy:aca-runtime-invariant` passes inside the workflow.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow run, and verify the active traffic revision matches the latest approved main revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: GitHub OIDC deploy identity only.
- Approved image digest: existing digest-pinned canonical revision or newly built main image.
- ACA runtime invariant: enforced by `scripts/deploy/check-aca-runtime-invariant.mjs`.
- ACR build policy: unchanged; newly built images still come from the repo-owned Docker Buildx path against the approved Premium ACR. This change only skips the build when the approved canonical main revision already exists and is digest-pinned.
- Worker image invariant: unchanged; worker jobs still update to the resolved image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower signed-in proof after traffic restoration.

## Rollback Plan

Revert this workflow change if it causes deploy workflow issues. Runtime rollback remains the existing ACA traffic shift back to the previous healthy revision recorded in deploy evidence.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- ACA deploy run: pending after merge.
- Tower browser proof: pending after deploy.

## Known Gaps

This does not investigate the earlier actor that moved traffic back to `0000178`; it makes the repo-owned deploy path able to recover the approved canonical revision without a manual traffic mutation.
