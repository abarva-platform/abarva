# 2026-05-24-p21-crawl-blank-secret-hotfix — Crawl Blank Secret Fallback

## Release ID

`2026-05-24-p21-crawl-blank-secret-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the second post-deploy crawl failure by treating blank GitHub Actions credential secrets as absent. The crawl harness now falls back to the standard demo password and access code when the workflow environment provides empty strings.

## Layer Impact

- `ops-release-lane`: keeps the authenticated post-deploy crawl from stalling on a disabled sign-in button.
- `agent-quality-lane`: restores the route to hard-question transcript capture after deploy.
- `app-control-lane`: no user-facing runtime behavior changes; this is crawl harness only.

## Client Applicability

- All clients: protected indirectly by the post-deploy crawl.
- Specific clients: Apex, Meridian, and First Capital crawl personas.
- Internal only: yes.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/persona-switcher.ts` now ignores empty credential environment values before applying defaults.

## QA / Validation

- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx eslint src/lib/crawl/persona-switcher.ts scripts/crawl scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS: `npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to main. The post-deploy crawl workflow will rerun and should proceed past the disabled-button sign-in failure.

## Rollback Plan

Revert this hotfix if it causes crawl-only regressions. No database or product runtime rollback is required.

## Audit Evidence

- Failed main workflow `26362518965` showed `CRAWL_DEMO_PASSWORD` was empty and the sign-in button remained disabled.
- Local smoke, lint, and typecheck outputs.

## Known Gaps

Live crawl must be rerun after merge to confirm whether the authenticated crawl finds product regressions after sign-in.
