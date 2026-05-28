# 2026-05-28-post-deploy-crawl-fast-playwright — Post-Deploy Crawl Fast Playwright Install

## Release ID

`2026-05-28-post-deploy-crawl-fast-playwright`

## Status

`candidate`

## Plain-English Summary

This release tightens the post-deploy crawl workflow after the first runway fix proved the remaining bottleneck. The main crawl now had enough job time, but still timed out inside `npx playwright install chromium --with-deps` before authenticated crawl execution. The workflow now installs the cached Chromium browser only and skips the expensive OS-level dependency pass on every run.

## Layer Impact

- ci-governance-lane: updates `.github/workflows/post-deploy-crawl.yml` only.
- runtime-app-lane: no runtime code changes.
- client-data-lane: no data changes.

## Client Applicability

All clients benefit indirectly because production deployment evidence should reach the authenticated crawl step instead of failing during browser setup.

## Changes Included

- Change the Playwright setup command from `npx playwright install chromium --with-deps` to `npx playwright install chromium`.
- Reduce the Playwright browser install step timeout from 25 minutes to 10 minutes so cache/install regressions fail quickly and clearly.

## QA / Validation

Validation performed:

```text
npx prettier --check .github/workflows/post-deploy-crawl.yml
npm run release:check -- --base f009b2cc263975da5a78df28d804dfaf19b62da8 --head HEAD
git diff --check
```

Results:

- Prettier workflow formatting check: pass.
- Release control gate: pass.
- Diff whitespace check: pass.

Expected post-merge validation:

- Main `Post-deploy crawl` should get past `Install Playwright Chromium`.
- The workflow should reach `Run authenticated crawl`; any later app/crawl failure should be treated as a real authenticated-crawl finding, not browser setup failure.

## Rollout Plan

Merge after CI is green. This is workflow-only; no runtime app deployment is required beyond confirming the main workflow behavior.

## Rollback Plan

Revert this PR to restore the prior `--with-deps` Playwright install behavior.

## Audit Evidence

- Main run `26608020488` for merge commit `f009b2cc263975da5a78df28d804dfaf19b62da8` failed in `Install Playwright Chromium` after the explicit 25-minute step timeout.
- The authenticated crawl step did not run in that failed workflow.

## Known Gaps

- This does not change the crawler assertions or product behavior.
- If the hosted runner is missing a required Chromium shared library, the next failure will move to the authenticated crawl step; that should be handled with a targeted dependency package list rather than a full `--with-deps` install.
