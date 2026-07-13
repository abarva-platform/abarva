# 2026-07-13-phase-success-package-status-persistence — Phase Success Package Persistence Fix

## Release ID

`2026-07-13-phase-success-package-status-persistence`

## Status

`candidate`

## Plain-English Summary

Phase Success Package generation now writes a database-valid Move artifact lifecycle status while preserving the package's real readiness status in metadata. This prevents live generation from failing when the package truth status is `evidence_incomplete`, `ready_for_review`, or `ready_for_gate`.

## Layer Impact

- `global-control-lane`: Fixes shared Moves Phase Success Package persistence for all clients using the Move artifact vault.
- `client-data-lane`: Writes continue to use the existing `move_artifacts` table and Azure Blob path. No schema or migration change is included.

## Client Applicability

- All clients: Yes, any client generating Moves Phase Success Packages.
- Specific clients: Meridian Health was the live proof case that exposed the defect.
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

Merge to `main` through PR, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new image. After deploy, retry the existing Meridian Move Phase Success Package generation in production.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: No manual ACA traffic, image, env, or flag mutation in this release.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Must be checked after deployment before claiming live proof.
- Worker image invariant: No worker behavior changed; verify invariant if the deploy workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Meridian P2 package retry.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous application behavior. Existing package artifacts created by the fixed path remain valid historical rows.

## Audit Evidence

- PR URL: Pending.
- Local validation output: focused Jest, ESLint, TypeScript, and release gate passed in the clean `codex/phase-success-status-fix` worktree.
- ACA deployment proof: Pending.
- Live Meridian retry proof: Pending.

## Known Gaps

The CDIO user still cannot create a Meridian Move directly, and the canonical automation account still cannot sign off P1 charter deliverables. Those access-policy findings are separate from this persistence fix.
