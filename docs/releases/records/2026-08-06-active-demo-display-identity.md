# 2026-08-06-active-demo-display-identity — Active Demo Display Identity

## Release ID

`2026-08-06-active-demo-display-identity`

## Status

`candidate`

## Plain-English Summary

Aligns the active airline demo workspace display name across shared client-name resolution. The signed-in crawl, automation identity, and current data foundation already expect the active workspace label; this change removes the older generic display label from shared page text so authenticated product surfaces show the same tenant identity.

## Layer Impact

- `global-control-lane`: Shared client display-name resolution now resolves the active airline workspace to the current display label.
- `PRODUCTS`: Source, Tower, Home-adjacent chrome, and other client-name consumers now receive the aligned display name from the shared resolver.
- `CANONICAL MODEL`: No schema, tenant data, or canonical facts are changed. Existing inbound aliases continue to route to the same client key.

## Client Applicability

- All clients: No.
- Specific clients: Active airline demo workspace only.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts`: updates the shared display-name resolver and alias list for the active airline workspace.
- `src/lib/__tests__/client-config-canonical.test.ts`: updates resolver expectations for the active display identity.

## QA / Validation

- `pass` — Targeted client-config test: `npm test -- --runTestsByPath src/lib/__tests__/client-config-canonical.test.ts --runInBand`.
- `pass` — TypeScript check: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- `pass` — Release check: `npm run release:check`.
- `not run` — Signed-in post-deploy crawl for Home, Source Portfolio, and Tower requires deployment.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, rerun the signed-in SkyHarbor crawl against `https://app.abarva.ai` and confirm Home, Source, and Tower are available with the active tenant identity.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Produced by the repo-owned ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the resolver change and redeploy through the same ACA workflow if any product surface depends on the older display label. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI/deploy run: Pending.
- Signed-in crawl output: Pending.

## Known Gaps

Some legacy generated fixtures and historical tests still mention older demo labels. This release updates the shared runtime resolver only; broader fixture cleanup is outside this incident fix.
