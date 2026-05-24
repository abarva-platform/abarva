# 2026-05-24-p21-crawl-session-wait-hotfix — Crawl Session Outcome Wait

## Release ID

`2026-05-24-p21-crawl-session-wait-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the third post-deploy crawl failure by waiting for actual sign-in outcomes instead of relying only on a readable `__session` cookie. The crawl helper now accepts redirect or Clerk session state, and reports visible sign-in errors directly.

## Layer Impact

- `ops-release-lane`: makes the authenticated post-deploy crawl compatible with production Clerk cookie behavior.
- `agent-quality-lane`: keeps transcript capture blocked on real auth errors rather than opaque timeouts.
- `app-control-lane`: no user-facing product behavior changes; crawl harness only.

## Client Applicability

- All clients: protected indirectly by the post-deploy crawl.
- Specific clients: Apex, Meridian, and First Capital crawl personas.
- Internal only: yes.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/persona-switcher.ts` now waits for redirect, Clerk session/user state, or a visible sign-in error after submit.
- Sign-in failures now include the form alert text in the thrown crawl error.

## QA / Validation

- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx eslint src/lib/crawl/persona-switcher.ts scripts/crawl scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS: `npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to main. The post-deploy crawl workflow will rerun and should proceed past the session-cookie wait failure.

## Rollback Plan

Revert this hotfix if it causes crawl-only regressions. No database or product runtime rollback is required.

## Audit Evidence

- Failed main workflow `26362798325` timed out waiting for `document.cookie.includes('__session=')` after submit.
- Local smoke, lint, and typecheck outputs.

## Known Gaps

Live crawl must be rerun after merge to confirm whether the authenticated crawl finds real product regressions after sign-in.
