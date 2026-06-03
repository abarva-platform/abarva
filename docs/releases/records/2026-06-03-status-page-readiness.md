# 2026-06-03-status-page-readiness — Public Status Page Foundation

## Release ID

`2026-06-03-status-page-readiness`

## Status

`candidate`

## Plain-English Summary

Adds a public `/status` page foundation for customer pilots and enterprise
procurement. The page is accessible without sign-in, names major service
components, and documents the severity-based incident communication model while
remaining truthful that live monitor-backed uptime is not connected yet.

## Layer Impact

- `public-demo` lane: adds a public status page route.
- `internal-admin` lane: adds operator runbook and readiness verifier.

## Client Applicability

- All clients: public status foundation applies to all pilots and buyers.
- Specific clients: none.
- Internal only: runbook and verifier.
- Public/demo only: public route is external-facing.
- Feature flag: none.

## Changes Included

- `src/app/(public)/status/page.tsx`
- `src/proxy.ts`
- `src/lib/public-site/canonical-urls.ts`
- `scripts/ops/verify-status-page-readiness.mjs`
- `docs/runbooks/status-page.md`
- `docs/build/STATUS_PAGE_READINESS_2026-06-03.md`

## QA / Validation

- Pass: `node scripts/ops/verify-status-page-readiness.mjs`
- Pass: `npx eslint src/app/(public)/status/page.tsx src/proxy.ts src/lib/public-site/canonical-urls.ts scripts/ops/verify-status-page-readiness.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. Vercel deploy will publish `/status`; external status-provider
activation remains a separate operator task.

## Rollback Plan

Revert the PR. If an external provider has already been configured, leave the
provider page active or redirect it to the prior approved status destination.

## Audit Evidence

- PR URL and CI run after opening.
- Local verifier output.
- Preview/production `/status` load evidence after deployment.

## Known Gaps

External status provider, uptime monitor feed, subscriber notification setup,
and synthetic incident/maintenance-window drill are not included in this
repository slice.
