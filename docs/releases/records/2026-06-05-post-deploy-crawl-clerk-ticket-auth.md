# 2026-06-05-post-deploy-crawl-clerk-ticket-auth — Post-Deploy Crawl Clerk Ticket Auth

## Release ID

`2026-06-05-post-deploy-crawl-clerk-ticket-auth`

## Status

`candidate`

## Plain-English Summary

The post-deploy crawl harness now signs in crawler personas with Clerk server-issued sign-in tickets when `CLERK_SECRET_KEY` is available. This removes the brittle dependency on demo-password secrets for production QA crawls and lets the crawler use the same authenticated tenant sessions without exposing passwords.

## Layer Impact

- `global-control-lane`: production QA automation auth behavior changes for all post-deploy crawl personas.
- `internal-admin`: improves internal release validation and rollback evidence generation.

## Client Applicability

- All clients: crawl personas can authenticate through Clerk ticket bootstrap.
- Specific clients: Meridian/PHS crawl validation is the immediate unblock.
- Internal only: post-deploy QA harness.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/crawl/persona-switcher.ts` now prefers Clerk sign-in tokens when `CLERK_SECRET_KEY` is configured.
- Existing form-based demo sign-in remains the fallback when Clerk server auth is unavailable.

## QA / Validation

- Pass: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- Pass: `npx eslint src/lib/crawl/persona-switcher.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked pending merge/deploy: Meridian/PHS production crawl after this auth fix lands.

## Rollout Plan

Merge to main. GitHub Actions already has `CLERK_SECRET_KEY`, so post-deploy crawls should use ticket auth without any new secret.

## Rollback Plan

Revert the PR. The older demo-password sign-in flow is preserved in the diff and can be restored by rollback.

## Audit Evidence

- Prior failure: post-deploy crawl run `27024701557` failed before any tenant questions with `crawl_sign_in_failed: unknown sign-in error`; the Action environment had no `CRAWL_*` credentials.
- PR URL: pending.
- Post-merge crawl evidence: pending.

## Known Gaps

The ticket auth path requires each crawl persona email to exist in Clerk.
