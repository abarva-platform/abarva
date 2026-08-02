# 2026-08-02-home-knowledge-compat-redirect — Home Knowledge Compatibility Redirect

## Release ID

`2026-08-02-home-knowledge-compat-redirect`

## Status

`candidate`

## Plain-English Summary

Redirects the legacy `/home/knowledge` path to the active Home command center. This prevents signed-in users with old bookmarks or stale navigation from landing on a broken Knowledge proof surface when the tenant-scoped Knowledge database is not configured.

## Layer Impact

- Release lane: `global-control-lane`.
- CLIENT INTAKE: no change.
- SOURCE ADAPTERS: no change.
- CANONICAL MODEL: no change.
- PRODUCTS: `/home/knowledge` now redirects to `/home`.

## Client Applicability

- All clients: yes, only for the legacy Home Knowledge path.
- Specific clients: no client data mutation.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Replaces the `/home/knowledge` page render path with a server redirect to `/home`.
- Leaves the primary `/home` AI Success Command Center unchanged.

## QA / Validation

- `npx eslint src/app/(maestro)/home/knowledge/page.tsx` passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false` passed.
- `npm run release:check` required for this release candidate.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, signed-in browser proof should verify `/home/knowledge` redirects to `/home`.

## Deployment Authority

- Repo-owned deploy workflow: required for production.
- Shared runtime mutators: none in this code change.
- ACA runtime invariant: required after deploy.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release commit to restore the previous Knowledge proof route behavior.

## Audit Evidence

- Runtime proof will be attached after the ACA deployment completes.

## Known Gaps

- The Knowledge proof route remains unavailable as a full data surface until the tenant-scoped Knowledge database binding exists and passes API readback.
