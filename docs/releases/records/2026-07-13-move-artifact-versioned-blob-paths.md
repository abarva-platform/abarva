# 2026-07-13-move-artifact-versioned-blob-paths — Move Artifact Versioned Blob Paths

## Release ID

`2026-07-13-move-artifact-versioned-blob-paths`

## Status

`candidate`

## Plain-English Summary

Move artifact Blob paths now include the artifact version for uploaded evidence, session artifacts, and approval artifacts. This prevents a current version row from downloading stale bytes from an older artifact at the same Blob path.

Note: "version" in this release refers to the `move_artifacts.version` row version, such as artifact version 4 after repeated package generation. It is unrelated to Meridian or AbarVa dataset layer names such as V4, V6, or V7.

## Layer Impact

- `global-control-lane`: Hardens the shared Moves File Cabinet artifact vault for all clients.
- `client-data-lane`: New artifact rows use versioned Blob paths. No schema migration is included.

## Client Applicability

- All clients: Yes, all Moves artifact uploads and generated session artifacts.
- Specific clients: Meridian Health exposed the stale-download risk during live Phase Success Package proof.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/deliverables/move-artifacts.ts`
- `src/lib/programs/deliverables/__tests__/move-artifacts.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/jest src/lib/programs/deliverables/__tests__/move-artifacts.test.ts src/lib/programs/phase-success-package/__tests__/generate.test.ts --runInBand`
- Pass: `./node_modules/.bin/eslint src/lib/programs/deliverables/move-artifacts.ts src/lib/programs/deliverables/__tests__/move-artifacts.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Blocked: live signed-in Meridian download proof requires merge and ACA deployment.

## Rollout Plan

Merge to `main` through PR, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new image. After deploy, regenerate the Meridian Phase Success Package and verify the current package download reflects the new current version.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: No manual ACA traffic, image, env, or flag mutation in this release.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Must be checked after deployment before claiming live proof.
- Worker image invariant: No worker behavior changed; verify invariant if the deploy workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Meridian package generation and download.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous path behavior. Existing rows keep their recorded Blob paths.

## Audit Evidence

- PR URL: Pending.
- Local validation output: focused Jest, ESLint, TypeScript, and release gate passed in the clean `codex/move-artifact-versioned-blob-paths` worktree.
- ACA deployment proof: Pending.
- Live Meridian retry proof: Pending.

## Known Gaps

Rows created before this release keep their historical Blob paths. If a row was inserted while Blob upload failed, the row may still be unavailable; this release prevents new current rows from accidentally resolving to stale bytes at an older shared path.
