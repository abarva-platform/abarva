# 2026-05-28-post-deploy-crawl-system-chrome — Post-Deploy Crawl System Chrome

## Release ID

`2026-05-28-post-deploy-crawl-system-chrome`

## Status

`candidate`

## Plain-English Summary

This release removes Playwright browser installation from the post-deploy crawl path. Two main runs proved browser setup was the blocker: the Chromium download reached 100%, then the install process hung until timeout before the authenticated crawl could start. The crawl harness now supports a Chromium channel override and the workflow uses GitHub-hosted runner system Chrome.

## Layer Impact

- ci-governance-lane: updates `.github/workflows/post-deploy-crawl.yml`.
- verification-lane: updates `scripts/crawl/post-deploy-harness.ts` launch options.
- runtime-app-lane: no product runtime behavior changes.
- client-data-lane: no data changes.

## Client Applicability

All clients benefit indirectly because production deployment verification should reach authenticated app crawling instead of failing in browser setup.

## Changes Included

- Add `PLAYWRIGHT_CHROMIUM_CHANNEL` support to the post-deploy crawl harness.
- Set `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` in the post-deploy crawl workflow.
- Replace Playwright browser cache/install steps with a deterministic `google-chrome --version` check.

## QA / Validation

Validation performed:

```text
npx prettier --check .github/workflows/post-deploy-crawl.yml
npx eslint scripts/crawl/post-deploy-harness.ts
npm run release:check -- --base 00703bbd729cba8b28201a8271b60ef10fd1e236 --head HEAD
git diff --check
```

Results:

- Prettier workflow formatting check: pass.
- Focused ESLint: pass.
- Release control gate: pass.
- Diff whitespace check: pass.

Expected post-merge validation:

- Main `Post-deploy crawl` should pass `Verify system Chrome`.
- The workflow should reach `Run authenticated crawl`; any later failure should be treated as real crawl/product signal.

## Rollout Plan

Merge after CI is green. This is workflow and verification harness only; production app deployment smoke is still useful for alias sanity but no app runtime change is expected.

## Rollback Plan

Revert this PR to restore Playwright-managed browser installation.

## Audit Evidence

- Main run `26608020488` timed out after 25 minutes in `npx playwright install chromium --with-deps`.
- Main run `26609305256` timed out after 10 minutes in `npx playwright install chromium`; logs showed the 170.4 MiB browser download reached 100% quickly, then the install process hung until timeout.
- In both runs, `Run authenticated crawl` did not execute.

## Known Gaps

- This assumes GitHub-hosted `ubuntu-latest` continues to provide system Chrome.
- If future hosted runners remove Chrome, the workflow will fail quickly at `Verify system Chrome` with a clear setup error.
