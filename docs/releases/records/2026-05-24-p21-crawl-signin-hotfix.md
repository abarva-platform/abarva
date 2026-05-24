# 2026-05-24-p21-crawl-signin-hotfix — Crawl Sign-In Selector Fix

## Release ID

`2026-05-24-p21-crawl-signin-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the first post-deploy crawl failure by aligning the crawl harness with the current invite-only sign-in form. The harness now fills email, password, and access code fields using the current placeholders while retaining compatibility with the older Clerk-style placeholders.

## Layer Impact

- `ops-release-lane`: unblocks the automated post-deploy crawl workflow that P21 installed.
- `agent-quality-lane`: keeps hard-question transcript capture reachable after authenticated sign-in.
- `app-control-lane`: no runtime product UI behavior changes; only the crawl utility changes.

## Client Applicability

- All clients: protected indirectly because the post-deploy crawl can authenticate again.
- Specific clients: Apex, Meridian, and First Capital crawl personas.
- Internal only: yes, this affects the operator crawl harness.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/persona-switcher.ts` now targets the current sign-in fields and fills the `424242` access code by default, overridable through `CRAWL_DEMO_CODE`.

## QA / Validation

- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx eslint src/lib/crawl/persona-switcher.ts`
- PASS: `npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to main. The post-deploy crawl workflow will rerun on the merge and exercise the fixed sign-in path.

## Rollback Plan

Revert this hotfix if it causes crawl-only regressions. No database or product runtime rollback is required.

## Audit Evidence

- Failed main workflow `26362150790` showed timeout waiting for the old email placeholder.
- Hotfix smoke, lint, and typecheck outputs.

## Known Gaps

Live crawl must be rerun after merge to confirm the next blocker, if any.
