# 2026-06-09-strategic-moves-server-access-parity — Moves Server Access Parity

## Release ID

`2026-06-09-strategic-moves-server-access-parity`

## Status

`candidate`

## Plain-English Summary

Strategic Moves list and detail pages now resolve tenancy through the same shared path as the Programs API, so a tenant-admin/operator session keeps its tenant role when server-rendered pages check move access.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves server access resolution for every client using the Moves portfolio and detail pages.
- `client-data-lane`: No schema or data changes; the change only affects whether existing tenant-scoped Move records can be read by an authorized session.

## Client Applicability

- All clients: Strategic Moves list/detail access now uses the shared tenancy resolver.
- Specific clients: SkyHarbor is the live acceptance case because its operator session could create and read via API while server-rendered pages denied access.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/programs/strategic-moves-context.ts` now delegates to `requireTenancy()` instead of rebuilding a partial context.
- `src/lib/programs/__tests__/strategic-moves-context.test.ts` verifies the tenant-admin signal is preserved, expected tenancy failures return null, and unexpected errors are not hidden.

## QA / Validation

- `npx jest src/lib/programs/__tests__/strategic-moves-context.test.ts --runInBand` passed.
- `npx eslint src/lib/programs/strategic-moves-context.ts src/lib/programs/__tests__/strategic-moves-context.test.ts` passed.
- `git diff --check` passed.

## Rollout Plan

Merge to `main`, build a new Azure Container Registry image from the merged SHA, deploy the pinned digest to Azure Container Apps, wait for the new revision to become ready, and shift 100% traffic to the combined revision.

## Rollback Plan

Roll back Azure Container Apps traffic to the previous known-good revision or revert the PR and redeploy the prior image digest. No data rollback is required.

## Audit Evidence

- PR URL and CI checks.
- Azure Container Apps revision and image digest after deployment.
- Public health check output after deployment.
- Signed-in SkyHarbor browser proof that `/strategic-moves` lists existing Moves and `/strategic-moves/[moveId]` renders the Move instead of denying access.

## Known Gaps

Origination chat people-registration tooling and the hidden name-required UX are separate follow-ups.
