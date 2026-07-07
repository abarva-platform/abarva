# 2026-06-02-azure-login-v3 — Azure login action v3

## Release ID

`2026-06-02-azure-login-v3`

## Status

`candidate`

## Plain-English Summary

This release updates the Azure authentication action used by the Azure audit workflows from `azure/login@v2` to `azure/login@v3`. The newer action runs on the current Node 24 action runtime and keeps Azure workflow authentication aligned with the rest of the CI modernization work.

## Layer Impact

`global-control-lane`: CI and Azure governance workflow authentication changes only. No product UI, runtime route, data-plane schema, tenant-scoped data, or client-facing behavior changes.

## Client Applicability

- All clients: Indirectly affected through healthier Azure governance checks.
- Specific clients: None.
- Internal only: CI maintainers and release operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/azure-l1-bicep-whatif.yml`: update Azure login action to v3.
- `.github/workflows/azure-l1-resource-parity.yml`: update Azure login action to v3.
- `.github/workflows/azure-l11-observability-audit.yml`: update Azure login action to v3.
- Add branch-protection alignment comments to the six required path-filtered workflows so their required PR contexts run on this controlled workflow-only change.
- Add this release record for release-control traceability.

## QA / Validation

- PASS: `rg -n "azure/login@v2" .github/workflows || true` returned no remaining v2 workflow usages.
- PASS: `rg -n "azure/login@v3" .github/workflows` showed the three intended Azure workflows.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: Manually dispatched the six path-filtered required workflows on the PR head SHA after GitHub reported missing expected required checks; all six completed successfully before the PR branch was synchronized with path-alignment comments.
- NOT RUN: The three Azure governance workflows themselves were not manually run because they require live Azure credentials and are covered by GitHub workflow execution after merge or manual operator dispatch.
- NOT RUN: GitHub PR checks, including release-control, lint, typecheck/reasoning, hygiene, routes/disclaimers, production readiness, and post-deploy crawl after merge.

## Rollout Plan

Merge to `main`. The three Azure governance workflows will use `azure/login@v3` on their next invocation. No Vercel runtime deploy, database migration, or application feature flag is required.

## Rollback Plan

Revert the PR to restore `azure/login@v2` in the three workflows. No client data rollback or migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2797
- CI run: To be added after PR checks complete.
- Post-deploy crawl: To be added after merge if the standard main crawl runs.

## Known Gaps

This release only updates `azure/login`. `actions/upload-artifact` remains a separate controlled dependency slice.
