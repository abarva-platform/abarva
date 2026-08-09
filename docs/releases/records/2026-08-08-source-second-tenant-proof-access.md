# 2026-08-08-source-second-tenant-proof-access — Second-Tenant Source Proof Access

## Release ID

`2026-08-08-source-second-tenant-proof-access`

## Status

`candidate`

## Plain-English Summary

The signed-in automation proof path now includes a second active tenant using the same locked, per-tenant agent-login model as the existing active tenant. This lets operators prove Source, Tower, Home, and related app surfaces with a separate tenant identity without opening cross-tenant query-string access for a human or shared account.

## Layer Impact

- global-control-lane: Updates the non-human automation roster and crawl selector used by post-deploy proof.
- client-data-lane: No tenant data, loaders, migrations, or product facts are changed.
- Products: No user-facing Source logic changes. This only enables same-path signed-in proof for another active tenant.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: Active proof tenants only.
- Internal only: Signed-in proof automation and crawl operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/auth/agent-client-logins.ts`
- `src/lib/crawl/persona-switcher.ts`
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- `docs/runbooks/agent-client-test-login-crawl-auth.md`

## QA / Validation

- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- Pass: `npx eslint src/lib/auth/agent-client-logins.ts src/lib/crawl/persona-switcher.ts scripts/smoke/p21-post-deploy-crawl.spec.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run auth:agent-client-states -- --list`
- Pass: `npm run release:check`
- Not run: signed-in proof-state minting for the second tenant; this requires the deployed roster and the Clerk automation user to exist in the live Clerk instance.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. After deploy, provision or update the second tenant automation user if needed, mint a tenant-scoped storage state, and run Source workspace proof with that identity.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACR build policy: Shared web images must be built only by the repo-owned deploy workflow using the approved Premium ACR and digest-pinned image contract.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live behavior.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. The affected automation user can remain in Clerk but will no longer be selected by the standard proof roster.

## Audit Evidence

- PR URL and CI output.
- Focused roster smoke output.
- Crawl guard test output.
- Post-deploy auth-state report showing the second tenant identity is single-tenant locked.
- Signed-in Source workspace proof for both active tenants.

## Known Gaps

This does not create or load tenant product data. If the second tenant has no current Source dataset loaded, the signed-in proof should show an honest empty or unavailable state until the governed loader path populates it.
