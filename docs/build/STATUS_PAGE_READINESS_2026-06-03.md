# Status Page Readiness

Date: 2026-06-03

Backlog item: T043

## Summary

Adds a public `/status` foundation for customer pilots and enterprise
procurement review. The page is reachable without Clerk, names the status
components customers care about, and defines the incident communication model
without pretending that monitor-backed uptime is already connected.

## Files

- `src/app/(public)/status/page.tsx`
- `src/proxy.ts`
- `src/lib/public-site/canonical-urls.ts`
- `scripts/ops/verify-status-page-readiness.mjs`
- `docs/runbooks/status-page.md`
- `docs/releases/records/2026-06-03-status-page-readiness.md`

## Controls

- `/status` is explicitly allowlisted as public in `src/proxy.ts`.
- Page copy says live monitor-backed uptime is pending provider activation.
- Incident communication tiers are visible and customer-safe.
- The runbook defines external-provider setup, component taxonomy, posting
  rules, and completion evidence.

## Completion Boundary

Repository-side readiness is complete when the PR merges. T043 remains `In
progress` until the external provider is connected, customer-safe URL approved,
and a synthetic incident or maintenance-window drill is archived.
