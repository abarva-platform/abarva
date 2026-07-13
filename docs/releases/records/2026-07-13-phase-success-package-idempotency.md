# 2026-07-13-phase-success-package-idempotency — Phase Success Package Duplicate-Click Fix

## Release ID

`2026-07-13-phase-success-package-idempotency`

## Status

`candidate`

## Plain-English Summary

Phase Success Package generation now detects duplicate package requests even when the visible generated timestamp changes. A rapid second click with the same evidence and findings should reuse the current package artifacts instead of creating unnecessary version 2 rows.

## Layer Impact

- `global-control-lane`: Fixes shared Moves Phase Success Package generation behavior for all clients.
- `client-data-lane`: Continues writing to the existing `move_artifacts` table and Azure Blob path. Adds a metadata fingerprint on new package artifacts; no schema migration is included.

## Client Applicability

- All clients: Yes, any client generating Moves Phase Success Packages.
- Specific clients: Meridian Health exposed the defect during live P2 proof.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/phase-success-package/generate.ts`
- `src/lib/programs/phase-success-package/__tests__/generate.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/jest src/lib/programs/phase-success-package/__tests__/core.test.ts src/lib/programs/phase-success-package/__tests__/generate.test.ts --runInBand`
- Pass: `./node_modules/.bin/eslint src/lib/programs/phase-success-package/generate.ts src/lib/programs/phase-success-package/__tests__/generate.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Blocked: live signed-in Meridian retry requires merge and ACA deployment.

## Rollout Plan

Merge to `main` through PR, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new image. After deploy, retry the existing Meridian Move Phase Success Package generation twice and confirm the second call reuses the current artifacts.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: No manual ACA traffic, image, env, or flag mutation in this release.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Must be checked after deployment before claiming live proof.
- Worker image invariant: No worker behavior changed; verify invariant if the deploy workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Meridian duplicate-click retry.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous application behavior. Existing package artifacts remain valid historical rows.

## Audit Evidence

- PR URL: Pending.
- Local validation output: focused Jest, ESLint, TypeScript, and release gate passed in the clean `codex/phase-success-idempotency-fix` worktree.
- ACA deployment proof: Pending.
- Live Meridian retry proof: Pending.

## Known Gaps

Existing current Phase Success Package rows created before this release do not contain the new fingerprint. The first generation after deployment may create one new version to add the fingerprint; subsequent identical requests should reuse it.
