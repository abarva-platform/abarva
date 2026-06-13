# 2026-06-13-setup-node-v6-workflow-alignment - Setup Node v6 Workflow Alignment

## Release ID

`2026-06-13-setup-node-v6-workflow-alignment`

## Status

`candidate`

## Plain-English Summary

Aligns the remaining GitHub Actions workflows from `actions/setup-node@v4` to `actions/setup-node@v6`, matching the repository's Node 24 execution standard and the already-updated production-readiness workflows.

## Layer Impact

- `global-control-lane`: Updates CI workflow infrastructure used by all product and client lanes.
- `internal-admin`: Keeps release, browser, accessibility, bundle, coverage, backend, and SBOM checks on the same GitHub Actions Node setup version.

## Client Applicability

- All clients: CI gates apply to all client-impacting product changes.
- Specific clients: None.
- Internal only: CI and release-control infrastructure.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/accessibility-axe.yml`
- `.github/workflows/backend-load-regression.yml`
- `.github/workflows/browser-matrix-smoke.yml`
- `.github/workflows/bundle-budget.yml`
- `.github/workflows/coverage-threshold.yml`
- `.github/workflows/license-sbom-compliance.yml`
- `.github/workflows/lighthouse-ci.yml`

## QA / Validation

- Pass: `npm run release:check`
- Pass: `rg "actions/setup-node@v4|actions/setup-node@v5" .github/workflows` returns no matches

## Rollout Plan

Merge to `main`. The next PR run exercises the updated workflow actions. No app runtime deployment occurs from this PR.

## Rollback Plan

Revert this PR to restore the previous workflow action references.

## Audit Evidence

- PR URL
- CI output
- Local release-control output
- Search proof that no `setup-node@v4` or `setup-node@v5` workflow references remain

## Known Gaps

This PR does not update application dependencies. Production and development dependency group PRs remain separate and require their own release records and validation.
