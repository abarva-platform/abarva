# 2026-06-20-deploy-authority-kernel — Deploy Authority Kernel

## Release ID

`2026-06-20-deploy-authority-kernel`

## Status

`candidate`

## Plain-English Summary

This release turns the ACA deploy-collision failure into a repo-enforced control. Shared Product/Lab Container Apps traffic can only be mutated by the main deploy workflow, runtime images must stay pinned by digest, and release evidence must separate merged, deployed, flagged, and live-proven states.

## Layer Impact

`global-control-lane`: adds release-control and CI governance for shared runtime deploy authority.

`internal-admin`: gives operators a runbook for safe feature/env updates during the Azure environment migration.

## Client Applicability

- All clients: protected indirectly because shared runtime drift can affect every tenant.
- Specific clients: not client-specific.
- Internal only: applies to AbarVa operators and repo automation.
- Public/demo only: not public/demo specific.
- Feature flag: no runtime feature flag; this is a repo/kernel guardrail.

## Changes Included

- Hardens `.github/workflows/aca-main-deploy.yml` so shared deploys must run from `origin/main` HEAD and verify ACA template/traffic image invariants after traffic shift.
- Adds `scripts/release-control/check-deploy-authority-policy.mjs` and imports it from `scripts/release-check.mjs`.
- Requires worker job updates to use digest-pinned images in `scripts/deploy/update-worker-jobs.sh`.
- Adds deployment authority fields to `AGENTS.md`, `.github/pull_request_template.md`, and `docs/releases/templates/release-record-template.md`.
- Adds `docs/runbooks/deploy-authority-and-runtime-invariant.md`.

## QA / Validation

Passed local validation before PR:

- `npm run release:deploy-authority:check -- --base origin/main --head HEAD`
- `bash -n scripts/deploy/update-worker-jobs.sh`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The next `ACA main deploy` workflow run becomes the only repo-owned shared web traffic mutator and will fail if it is not deploying `origin/main` HEAD. The release-control CI gate starts enforcing deploy-authority markers and changed-file scans on future PRs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy only; ad-hoc env/flag updates must include the approved digest-pinned image and must be documented.
- Approved image digest: recorded by each ACA main deploy run in `audit-artifacts/aca-main-deploy/image.txt`.
- ACA runtime invariant: template image, 100 percent traffic revision image, and approved image digest must match.
- Worker image invariant: deliverable worker jobs must be updated to the same digest-pinned image when in scope.
- Feature/env flag update path: include digest-pinned `--image` on `az containerapp update`; image-less env-only updates are forbidden.
- Live signed-in proof required: affected clients and routes/artifacts must be browser-proven before any release is called live-proven.

## Rollback Plan

Revert this PR if the release-control gate blocks an urgent unrelated PR incorrectly. For runtime deploys, use the prior ACA traffic revision recorded in the deploy evidence bundle and shift traffic back only after verifying the revision image digest.

## Audit Evidence

Audit evidence will include the PR, release-control CI result, deploy workflow diff, and local validation output. For runtime use, inspect each ACA deploy evidence artifact for image, template, active revision, worker jobs, traffic before/after, and signed-in proof.

## Known Gaps

This release prevents new repo-authorized drift paths and hardens future deploys. It does not mutate the currently live ACA app or deactivate historical stale revisions; that remains an operator action with live Azure approval.
