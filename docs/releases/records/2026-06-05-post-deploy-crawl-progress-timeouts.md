# 2026-06-05-post-deploy-crawl-progress-timeouts — Post-Deploy Crawl Progress And Auth Timeouts

## Release ID

`2026-06-05-post-deploy-crawl-progress-timeouts`

## Status

`candidate`

## Plain-English Summary

The production crawl harness now reports where it is during authenticated QA runs and bounds the Clerk ticket sign-in path. This prevents long silent runs from looking like product work is still progressing when the crawler is actually stuck before producing evidence.

## Layer Impact

`internal-admin`: This changes only the internal post-deploy crawl tooling and logs used by release validation.

`global-control-lane`: No shared user-facing product behavior, route behavior, tenant data, ingestion, or runtime answer path changes.

## Client Applicability

- All clients: No user-facing product behavior changes.
- Specific clients: Meridian/PHS QA benefits immediately because the 50-question crawl can now show progress and fail clearly.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts`: logs crawl plan, persona, surface, and question progress.
- `src/lib/crawl/persona-switcher.ts`: adds bounded Clerk user lookup/token creation and waits for the Clerk session cookie after ticket sign-in.

## QA / Validation

- PASS: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts src/lib/crawl/persona-switcher.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`, then deploy through the normal Vercel production path. The next post-deploy crawl run will emit the progress markers automatically.

## Rollback Plan

Revert the PR. The crawl harness returns to the prior behavior; no database or runtime user-facing state is changed.

## Audit Evidence

- PR URL and CI run after opening the PR.
- GitHub Actions log markers: `crawl_plan`, `crawl_auth_ticket_start`, `crawl_surface_start`, and `crawl_question_complete`.
- Meridian/PHS targeted crawl artifacts after the follow-up run.

## Known Gaps

This does not change answer quality or corpus retrieval. It makes the crawl harness observable enough to prove or diagnose those layers.
