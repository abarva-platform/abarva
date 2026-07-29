# 2026-07-29-foundation-proof-access — Knowledge Foundation Proof Access

## Release ID

`2026-07-29-foundation-proof-access`

## Status

`candidate`

## Plain-English Summary

Adds a narrow proof-access path for the new Knowledge foundation tenants so signed-in proof accounts can validate the governed HTTP consumption preview before those tenants are migrated into the legacy product-wide client selector. The route still blocks fixture fallback and still requires the requested foundation tenant to match server-side Clerk metadata.

## Layer Impact

- `global-control-lane`: adds an explicit foundation-preview metadata check for Clerk users. It does not grant Source, Moves, Tower, admin, or production tenant-switch access.
- `client-data-lane`: allows the Knowledge vNext HTTP preview to be proven by tenant-scoped proof users for a governed foundation baseline. No data is written and no baseline is changed.

## Client Applicability

- All clients: No.
- Specific clients: Foundation-preview tenants only.
- Internal only: Yes, for controlled validation and proof.
- Public/demo only: No public route change.
- Feature flag: Existing preview remains off for normal tenant activation.

## Changes Included

- `src/lib/auth/foundation-preview-session.ts`
- `src/app/(maestro)/knowledge-preview/page.tsx`
- `src/app/api/knowledge/consumption/_shared.ts`

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` — passed.
- `NODE_OPTIONS=--max-old-space-size=4096 ./node_modules/.bin/jest src/lib/knowledge/consumption-client/__tests__/vnext-consumption.test.ts --runInBand` — passed, 36/36 tests.
- `npm run release:check` — pending after release record addition.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then provision/update proof Clerk users with matching `foundationTenantKey` metadata. Signed-in browser proof must use the deployed app and the governed HTTP provider path.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior approved ACA image. This removes the foundation proof-access path and returns the Knowledge HTTP preview to platform-admin-only access.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA deploy proof: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

This does not activate the new foundation tenants across legacy Home, Source, Moves, or Tower. It only enables controlled Knowledge HTTP preview proof for tenants whose canonical foundation baseline already exists.
