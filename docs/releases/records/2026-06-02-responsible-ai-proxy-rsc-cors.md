# 2026-06-02-responsible-ai-proxy-rsc-cors — Responsible AI proxy RSC CORS fix

## Release ID

`2026-06-02-responsible-ai-proxy-rsc-cors`

## Status

`candidate`

## Plain-English Summary

Responsible AI pages now stay public at the proxy layer so browser-side React
Server Component fetches receive same-origin page responses instead of Clerk
sign-in redirects. This removes a production crawl P0 where the Source page
observed a cross-origin Clerk preflight failure while fetching `/responsible-ai`.

## Layer Impact

- `global-control-lane`: updates the shared auth/proxy route contract for all
  clients.
- Public route layer: keeps `/responsible-ai`, `/responsible-ai/acknowledgment`,
  and `/responsible-ai/training` outside middleware-level Clerk redirects.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: the affected pages are public/acknowledgment surfaces, but
  the fix protects authenticated client crawls as well.
- Feature flag: none.

## Changes Included

- Adds `/responsible-ai(.*)` to `PUBLIC_ROUTE_PATTERNS` in `src/proxy.ts`.
- Adds a proxy contract test covering the Responsible AI route family.

## QA / Validation

- Pass: `git diff --check origin/main..HEAD`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npx jest src/__tests__/unit/proxy-public-routes.test.ts --runInBand --testNamePattern='Responsible AI'`.
- Blocked / unrelated baseline failure:
  `npx jest src/__tests__/unit/proxy-public-routes.test.ts --runInBand`
  currently fails on pre-existing `/product` and `/how-it-works` public-route
  assertions that are unrelated to this Responsible AI route fix.
- Pending post-merge production crawl to confirm the P0 is removed.

## Rollout Plan

Merge to main and deploy through the existing Vercel production path. No data
migration or feature flag is required.

## Rollback Plan

Revert the PR. The previous behavior restores middleware-level Clerk protection
for `/responsible-ai`, but may reintroduce the RSC CORS crawl failure.

## Audit Evidence

- PR URL: pending.
- Production crawl evidence: pending.
- Release record: this file.

## Known Gaps

The acknowledgment and training pages still enforce their subject/session
requirements inside server components and API routes; this release only changes
proxy-level routing to avoid cross-origin Clerk redirects during RSC fetches.
