# 2026-06-23-home-aca-no-fallback — Home KNOW No-Fallback + ACA Named Revision Guard

## Release ID

`2026-06-23-home-aca-no-fallback`

## Status

`candidate`

## Plain-English Summary

This release fixes the observed `/home?client=skyharbor` regression where the shared runtime showed the old static Context Explorer instead of the approved Home KNOW surface. It also closes the deploy gap where Azure Container Apps could create an anonymous `0000xxx` revision during the main deploy before the invariant check ran.

## Layer Impact

`global-control-lane`: Hardens the shared ACA deploy workflow so only a named `m<main-sha>` revision may continue through deployment.

`global-control-lane`: Makes `/home` always mount the React Home KNOW surface through the canonical app shell, with the backend Home KNOW contract still owning intent/retrieval/answer shape.

## Client Applicability

- All five pilot tenants: Apex Retail, First Capital, SkyHarbor, Meridian, Lakeshore.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Removes the legacy iframe fallback from the authenticated `/home` route; the `home_react_surface` flag remains in the registry for historical compatibility but no longer controls the mounted `/home` surface.

## Changes Included

- `/home` now reads the `client` search param using the Next.js App Router `searchParams` prop and passes it to the tenant-safe `getActiveClientRow(requestedClient)` resolver.
- `/home` always renders `HomeSurface` inside `AppShell` instead of falling back to `/api/home/v2-frame`.
- The Home integration test now fails if `/home` mounts the old iframe fallback.
- The ACA main deploy workflow switches the app to Multiple revision mode before image update.
- The ACA main deploy workflow refuses rerun/alternate suffixes and fails if the canonical `m<sha>` revision already exists with a different image.
- Immediately after `az containerapp update`, the workflow verifies Azure actually created the expected named revision. If Azure creates an anonymous revision, it restores the previous 100% traffic revision, deactivates the unexpected revision, and fails.

## QA / Validation

- PASS: `npm run test:integration -- --runTestsByPath src/__tests__/integration/home/home-v2-all-client-binding.test.ts`
- PASS: `npm run release:deploy-authority:check -- --base origin/main --head HEAD`
- PASS: `node --check scripts/deploy/check-aca-runtime-invariant.mjs && node --check scripts/release-control/check-deploy-authority-policy.mjs`
- PASS: `npx eslint 'src/app/(maestro)/home/page.tsx' src/__tests__/integration/home/home-v2-all-client-binding.test.ts`
- FAIL BEFORE THIS PR DEPLOYS: `npm run deploy:aca-runtime-invariant -- --out-dir audit-artifacts/aca-runtime-drift-local`
  - Reason: the cancelled `#3915` post-merge deploy left the ACA template on `sha256:d5a533b4b054fa363b5e96271a01a0c7fc2b57aa990eadbfe344dc4c951578d3` while 100% traffic was restored to `sha256:67812c07215f98662aed720ee38ca7aaa8674bcda267fbdf520b8334fad99e9c`.
  - Expected to pass after this PR deploys a new named `m<sha>` main revision and assigns 100% traffic to it.
- PENDING: `npm run release:check -- --base origin/main --head HEAD`

Live emergency action completed before this PR:

- Restored 100% traffic to `ca-abarva-web-lab-eastus--main-e70ae041`.
- Deactivated unexpected revision `ca-abarva-web-lab-eastus--0000142`.

## Rollout Plan

Merge to `main` and allow the repo-owned ACA main deploy workflow to build and deploy a new named `m<sha>` revision. After deployment, run the ACA runtime invariant checker and browser-check `/home?client=skyharbor` to confirm the canonical nav shell plus React Home KNOW surface render.

## Deployment Authority

- Repo-owned deploy workflow only: `.github/workflows/aca-main-deploy.yml`.
- Allowed production/shared revision shape: `ca-abarva-web-lab-eastus--m<main-sha8>`.
- Forbidden production/shared revision shape: anonymous `0000xxx` revisions and any `source-*`, `codex-*`, `worktree-*`, `preview-*`, or local image tags.
- Drift monitor: `.github/workflows/aca-runtime-drift-monitor.yml`.

## Rollback Plan

Rollback ACA traffic to the prior healthy named main revision. Do not roll back to the legacy iframe route or to an anonymous/non-main ACA revision.

## Audit Evidence

- User-visible regression screenshot: `/home?client=skyharbor` showed the old static Context Explorer and no expected nav toolbar.
- Runtime anomaly: ACA traffic briefly moved to anonymous revision `ca-abarva-web-lab-eastus--0000142`.
- Corrective runtime action: traffic restored to `ca-abarva-web-lab-eastus--main-e70ae041`; `0000142` deactivated.

## Known Gaps

Cloud RBAC reduction remains the outer lock: non-deploy identities with shared ACA or ACR write permission must still be removed by an Azure owner.
