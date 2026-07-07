# 2026-06-05-source-value-proof-tenant-context - Source Value Proof Tenant Context

## Release ID

`2026-06-05-source-value-proof-tenant-context`

## Status

`candidate`

## Plain-English Summary

The standalone Source value proof page now names the active client and sourcing event code at the top of the page. This keeps the value proof visibly tenant-bound when a user opens the route directly from a board pack or browser history.

## Layer Impact

`global-control-lane`: Updates shared Source UI behavior for the value proof route. No schema, ingestion, auth, or value-chain calculation logic changed.

## Client Applicability

- All clients: Source value proof pages receive the context strip.
- Specific clients: Verified locally against the Lakeshore Holdings value proof route contract.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/value/page.tsx`

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check`
- Not run: targeted Lakeshore production smoke after deployment

## Rollout Plan

Merge to `main`; Vercel production deploy makes the route update active.

## Rollback Plan

Revert the release commit or redeploy the previous Vercel production deployment. No data rollback is required.

## Audit Evidence

- Release record: this file.
- Local diff: Source value proof route now renders client name and event code before the page title.
- Production smoke evidence to be captured after deployment.

## Known Gaps

The page still uses its standalone value proof layout rather than the full app shell. This release only closes the missing tenant-context signal.
