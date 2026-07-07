# 2026-06-02-browser-matrix-smoke — Browser Matrix Smoke Gate

## Release ID

`2026-06-02-browser-matrix-smoke`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable browser matrix smoke gate so public AbarVa surfaces are checked across desktop Chrome, desktop Firefox, Safari-equivalent WebKit, mobile Chrome, and mobile Safari before releases.

## Layer Impact

Internal admin and release QA: adds a CI workflow, Playwright configuration, smoke test, and runbook. No product UI, runtime data path, schema, migration, or private data-plane behavior changes.

## Client Applicability

- All clients: Benefit from broader release QA before shared app changes reach production.
- Specific clients: None.
- Internal only: Workflow, runbook, and release evidence are operated by AbarVa engineering.
- Public/demo only: The smoke suite covers public bootstrap routes.
- Feature flag: None.

## Changes Included

- `playwright.browser-matrix.config.ts`
- `tests/browser-matrix/public-surface-smoke.spec.ts`
- `.github/workflows/browser-matrix-smoke.yml`
- `package.json` browser matrix scripts
- `docs/runbooks/browser-matrix-smoke.md`

## QA / Validation

- `npm run browser:matrix:list` — pass; listed 35 tests across 5 browser projects.
- `npm run build` — pass.
- `npm run browser:matrix` — pass; 35/35 tests passed locally after installing Playwright Chromium, Firefox, and WebKit browsers.
- `git diff --check` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `npm run secrets:staged` — pass expected before PR after staging.

## Rollout Plan

Merge to `main`. The GitHub Actions workflow becomes active on future pull requests and can also be run manually through workflow dispatch.

## Rollback Plan

Revert the PR to remove the workflow, config, smoke suite, package scripts, runbook, and release record. No migration or tenant-data rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Browser Matrix Smoke GitHub Actions run.
- Local command output from the QA / Validation section.

## Known Gaps

This gate covers public bootstrap surfaces only. Authenticated tenant workflows still require existing focused e2e and integration suites. Marketing routes such as `/product`, `/architecture`, `/known-limitations`, `/responsible-ai`, and `/model-card` currently live under `src/app/(public)` but are auth-required by `src/proxy.ts`, so they are not included in this public bootstrap gate.
