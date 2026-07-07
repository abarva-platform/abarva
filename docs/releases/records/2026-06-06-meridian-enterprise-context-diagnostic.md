# 2026-06-06-meridian-enterprise-context-diagnostic — Meridian Enterprise Context Diagnostic

## Release ID

`2026-06-06-meridian-enterprise-context-diagnostic`

## Status

`candidate`

## Plain-English Summary

Adds a narrow authenticated diagnostic endpoint that proves whether the production serverless runtime can resolve the active Meridian client and read the Enterprise Context counts that the Intelligence page depends on. The endpoint returns only client resolution metadata and aggregate counts; it does not expose uploaded file contents, secrets, PHI, or row payloads.

## Layer Impact

- `internal-admin`: adds an admin diagnostics API used by operators to verify Enterprise Context grounding for a signed-in tenant.
- `client-data-lane`: reads tenant-scoped Enterprise Context aggregate counts for validation only; it does not write, reset, or reload data.

## Client Applicability

- All clients: the route is generic and uses the resolved active client context.
- Specific clients: first used for Meridian Health System production validation.
- Internal only: yes, authenticated diagnostics route.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `GET /api/admin/diagnostics/enterprise-context`.
- The route requires a Clerk-authenticated user.
- Tenant URL overrides are honored only for locked tenant sessions or Anand/admin users.
- The route returns resolved client key, canonical tenant key, aggregate Enterprise Context record/chunk counts, and read-model overview status.

## QA / Validation

- `passed`: `npx eslint src/app/api/admin/diagnostics/enterprise-context/route.ts`.
- `blocked`: `npx tsc --noEmit --pretty false` is blocked by pre-existing optional dependency type gaps for `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; no diagnostic-route type errors were reported before those failures.
- `passed`: `git diff --check`.
- `not run`: production diagnostic call is pending until merge/deploy.
- `not run`: signed-in browser crawl for `/intelligence#enterprise-context` is pending until the diagnostic identifies the runtime gap.

## Rollout Plan

Merge to main, deploy to Vercel production, then call the diagnostic from an authenticated Meridian/Admin session before making any further runtime fix.

## Rollback Plan

Revert the PR or roll back the Vercel deployment. No schema or data changes are included.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.
- Diagnostic JSON output: pending.
- Browser crawl screenshot: pending.

## Known Gaps

This diagnostic does not itself fix the Enterprise Context empty-state render. It exists to identify whether the remaining gap is tenant resolution, serverless database access, or component rendering.
