# 2026-05-28-post-deploy-crawl-playwright-runway — Post-Deploy Crawl Playwright Runway

## Release ID

`2026-05-28-post-deploy-crawl-playwright-runway`

## Status

`candidate`

## Plain-English Summary

This release fixes the post-deploy crawl workflow runway. Recent main deploy crawls were cancelled before the authenticated crawl began because the Playwright Chromium install consumed the 30-minute job budget. The workflow now caches Playwright browsers and gives the job enough time to finish dependency setup and run the actual crawl.

## Layer Impact

- ci-governance-lane: updates `.github/workflows/post-deploy-crawl.yml` only.
- runtime-app-lane: no runtime code changes.
- client-data-lane: no data changes.

## Client Applicability

All clients benefit indirectly because production deployment evidence should reliably reach the authenticated crawl step.

## Changes Included

- Increase post-deploy crawl job timeout from 30 to 60 minutes.
- Add Playwright browser cache for `~/.cache/ms-playwright`.
- Add a bounded 25-minute timeout to the Playwright Chromium install step so future failures are explicit at the install step.

## QA / Validation

Validation performed:

```text
npx prettier --check .github/workflows/post-deploy-crawl.yml
npm run release:check -- --base 8c0d6717dab034acb6f4e91113d210ef1a5ab2e6 --head HEAD
git diff --check
```

Results:

- Prettier workflow formatting check: pass.
- Release control gate: pass.
- Diff whitespace check: pass.

Expected post-merge validation:

- Main `Post-deploy crawl` should reach `Run authenticated crawl` instead of cancelling inside `npx playwright install chromium --with-deps`.

## Rollout Plan

Merge after CI is green. This is workflow-only; no production app deployment smoke is required beyond confirming the workflow runs on main.

## Rollback Plan

Revert this PR to restore the prior workflow timeout and install behavior.

## Audit Evidence

- Failed/cancelled runs observed on main before this fix were cancelled during `Run npx playwright install chromium --with-deps`, before authenticated crawl execution.

## Known Gaps

- This does not change the authenticated crawler itself or its assertions. It only fixes the workflow runway so the crawler can execute.
- The first run after this change may still spend time populating the Playwright cache; subsequent runs should be faster.
