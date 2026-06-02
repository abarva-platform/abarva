# 2026-06-02-github-actions-checkout-v6 — GitHub Actions checkout v6

## Release ID

`2026-06-02-github-actions-checkout-v6`

## Status

`candidate`

## Plain-English Summary

This release updates remaining GitHub Actions workflows from `actions/checkout@v4` to `actions/checkout@v6`. The update keeps CI on the current Node 24 action runtime and aligns the older workflows with the release, crawl, no-auto, and secret-scanning workflows that already use checkout v6.

## Layer Impact

`global-control-lane`: CI and release-control infrastructure for the shared repository changes. No product UI, runtime route, data-plane schema, client data, or tenant-scoped behavior changes.

## Client Applicability

- All clients: Indirectly affected through shared CI reliability.
- Specific clients: None.
- Internal only: CI maintainers and release operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Update remaining `.github/workflows/*.yml` uses of `actions/checkout@v4` to `actions/checkout@v6`.
- Add this release record so the CI dependency update is auditable and release-control compliant.

## QA / Validation

- PASS: `rg -n "actions/checkout@v4" .github/workflows || true` returned no remaining v4 workflow usages.
- PASS: `git diff --check`.
- PASS: `rg -n "actions/checkout@v6" .github/workflows | wc -l` returned 39 checkout v6 workflow usages.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN: GitHub PR checks, including release-control, lint, typecheck/reasoning, hygiene, routes/disclaimers, production readiness, and post-deploy crawl after merge.

## Rollout Plan

Merge to `main`. GitHub Actions will use checkout v6 on the next workflow invocation. No Vercel runtime deploy, database migration, or manual operator action is required.

## Rollback Plan

Revert the PR to restore the previous checkout action versions. Because this is CI configuration only, rollback does not require data migration or client communication.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI run: To be added after PR checks complete.
- Post-deploy crawl: To be added after merge if the standard main crawl runs.

## Known Gaps

This release only updates `actions/checkout`. Other action/runtime dependency updates, including `actions/upload-artifact`, `azure/login`, and `actions/setup-node`, remain separate controlled slices.
