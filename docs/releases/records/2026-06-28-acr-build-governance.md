# 2026-06-28-acr-build-governance — ACR Build Governance

## Release ID

`2026-06-28-acr-build-governance`

## Status

`candidate`

## Plain-English Summary

This release makes the slow-build registry decision enforceable. The shared Azure Container Apps deploy lane now asserts that `acrabarvalab001` is Premium before it builds, uses Docker Buildx with GitHub Actions cache for the web image, and records ACR SKU plus usage evidence. The agent/runbook/checklist policy now blocks ad-hoc ACR web builds and unsafe pruning patterns.

## Layer Impact

`global-control-lane`: changes shared release governance, the repo-owned ACA deploy workflow, and release-control checks for all Product/Lab clients.

No application runtime behavior or tenant data changed.

## Client Applicability

- All clients: yes, through the shared Product/Lab deployment lane.
- Specific clients: not applicable.
- Internal only: operator governance and CI enforcement.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `.github/workflows/aca-main-deploy.yml`: asserts ACR Premium, captures ACR usage evidence, logs in to ACR, and builds/pushes via Docker Buildx with `cache-from: type=gha` and `cache-to: type=gha,mode=max`.
- `AGENTS.md`: mandates the ACR build and registry policy for all agents.
- `.github/PULL_REQUEST_TEMPLATE.md`: adds ACR Premium, cache, and prune checklist items.
- `docs/runbooks/deploy-authority-and-runtime-invariant.md`: documents the ACR build policy and prune safety process.
- `scripts/release-control/check-deploy-authority-policy.mjs`: enforces the new ACR build policy, Buildx cache markers, and prune guardrails through `npm run release:check`.

## QA / Validation

Validation status: local checks passed before PR.

- `npm run release:check -- --base origin/main --head HEAD` passed.
- `node scripts/release-control/check-deploy-authority-policy.mjs --base origin/main --head HEAD` passed.
- Workflow was not executed from this branch because shared ACA traffic may only be shifted by the repo-owned main deploy workflow after merge.

## Rollout Plan

Merge to `main`. The next repo-owned `ACA main deploy` run uses the Buildx cache-backed image build and fails closed if `acrabarvalab001` is not Premium. No manual Azure mutation is required from this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned ACA main deploy only.
- Approved image digest: resolved by the deploy workflow after the cached Buildx push.
- ACA runtime invariant: checked by `scripts/deploy/check-aca-runtime-invariant.mjs` after deployment.
- Worker image invariant: worker jobs are updated to the same digest-pinned image by `scripts/deploy/update-worker-jobs.sh`.
- Feature/env flag update path: unchanged; must include digest-pinned `--image` for shared runtime changes.
- Live signed-in proof required: unchanged; required after deployment for affected client surfaces.

## Rollback Plan

Revert this PR to restore the prior deploy workflow and release-control policy. If a main deploy using this workflow fails before traffic shift, the existing ACA revision remains live. If it fails after traffic shift, use the deploy evidence `traffic-before.json` and runtime invariant evidence to shift traffic back to the previous healthy revision.

## Audit Evidence

- PR URL: pending.
- CI: `release-control` runs `npm run release:check`.
- Runtime deploy evidence after merge: `aca-main-deploy` artifact with `acr-policy.txt`, `acr-usage.json`, `image.txt`, traffic JSON, and runtime invariant output.

## Known Gaps

This PR does not perform an actual prune. It defines and enforces the dry-run-first prune process. The first prune should be a separate operator action with reviewed dry-run output.
