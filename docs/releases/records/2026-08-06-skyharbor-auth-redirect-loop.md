# 2026-08-06-skyharbor-auth-redirect-loop — SkyHarbor Sign-In Redirect Repair

## Release ID

`2026-08-06-skyharbor-auth-redirect-loop`

## Status

`candidate`

## Plain-English Summary

Signed-in tenant users were being sent from the post-sign-in bridge to protected app routes with a
`?client=` query parameter. The proxy correctly strips client query parameters for locked non-admin
users, but that caused the browser to churn between the auth redirect shell and the destination
route. This release changes locked client and maestro post-sign-in routing to rely on the persisted
active-client cookie/localStorage instead of protected-route query parameters.

## Layer Impact

- Products: Home, Tower, Source, Intelligence, Moves, and other signed-in routes can receive a
  clean post-sign-in navigation for locked tenant users.
- Control plane/auth: The post-sign-in redirect contract now matches the proxy tenant-injection
  guard. Admin tenant-switch URLs keep query parameters.

## Client Applicability

- All clients: yes, for locked `client` and `maestro` users.
- Specific clients: SkyHarbor Global is the incident driver and proof target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/auth/access-routing.ts`: route locked client and maestro users to `/home` or `/tower`
  without `?client=`.
- `src/lib/auth/__tests__/access-routing.test.ts`: locks the query-free client/maestro behavior
  and preserves admin query-param routing.

## QA / Validation

- `npx jest src/lib/auth/__tests__/access-routing.test.ts --runInBand` passed.
- `npx eslint src/lib/auth/access-routing.ts src/lib/auth/__tests__/access-routing.test.ts` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the
digest-pinned image. After deployment, rerun the SkyHarbor signed-in post-deploy crawl.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: resolved by the ACA main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: workflow-managed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, SkyHarbor Global `/home` and broader SkyHarbor-only crawl.

## Rollback Plan

Revert this release and redeploy via the ACA main deploy workflow. The rollback returns client and
maestro post-sign-in destinations to query-param routing.

## Audit Evidence

- PR URL: to be added after opening the PR.
- CI: focused auth unit test, lint, TypeScript.
- Live proof: pending post-deploy SkyHarbor signed-in crawl.

## Known Gaps

Production still uses a Clerk development/test instance; that should be replaced with production
Clerk keys or explicitly accepted as a lab-runtime constraint. The SkyHarbor automation Clerk user
metadata was refreshed operationally before this release.
