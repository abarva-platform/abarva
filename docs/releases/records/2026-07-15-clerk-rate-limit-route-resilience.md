# 2026-07-15-clerk-rate-limit-route-resilience — Clerk Rate-Limit Route Resilience

## Release ID

`2026-07-15-clerk-rate-limit-route-resilience`

## Status

`candidate`

## Plain-English Summary

Hardens signed-in Home Queue, Admin layout, and tenant resolution so a Clerk Users API rate limit during post-deploy crawls does not crash server-rendered pages. The app now prefers session claims already present in the request and treats Clerk `currentUser()` / user-record lookups as optional enrichment.

## Layer Impact

- `global-control-lane`: shared authenticated route resilience for Home Queue, Admin, and tenant resolution.
- `internal-admin`: Admin access checks continue to enforce the same allowlist and tenant-admin policy, but avoid fail-open/fail-crash behavior when Clerk user enrichment is rate-limited.

## Client Applicability

- All clients: yes, because the affected tenant-resolution and authenticated layout paths are shared.
- Specific clients: none.
- Internal only: Admin layout resilience affects internal admin surfaces.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/home/queue/page.tsx`: removes direct `clerk.users.getUser()` dependency and uses session claims plus existing current-user fallback for display/email.
- `src/app/(maestro)/admin/layout.tsx`: reads role/email from session claims first and catches Clerk `currentUser()` enrichment failures.
- `src/lib/tenant/resolveTenant.ts`: reads tenant role/client/email from session claims before falling back to Clerk `currentUser()`.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/tenant/__tests__/resolveTenant.test.ts src/app/'(maestro)'/admin/__tests__/layout-access.test.ts --runInBand`
- Pass: `npx eslint src/app/'(maestro)'/home/queue/page.tsx src/app/'(maestro)'/admin/layout.tsx src/lib/tenant/resolveTenant.ts`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun health, runtime invariant, and signed-in post-deploy crawl. The expected proof target is removal of the Clerk-429-induced 500s on `/home/queue`, `/admin`, and `/admin/data-layer-explorer`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: not used.
- Approved image digest: captured by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required if the deploy workflow reports worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, post-deploy crawl.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image through the repo-owned main deployment path. No schema or data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4828
- ACA deploy run: to be added.
- Post-deploy crawl run: to be added.
- ACA log evidence before fix: Clerk `api_response_error` status `429` during signed-in crawl.

## Known Gaps

This does not change the legacy template purge scope. Remaining compatibility-era scripts/docs with historical v4/v6 naming require a separate, broader compatibility-retirement pass.
