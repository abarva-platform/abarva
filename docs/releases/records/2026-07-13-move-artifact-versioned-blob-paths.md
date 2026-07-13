# 2026-07-13-move-artifact-versioned-blob-paths — Move Artifact Versioned Blob Paths

## Release ID

`2026-07-13-move-artifact-versioned-blob-paths`

## Status

`live-proven`

## Plain-English Summary

Move artifact Blob paths now include the artifact row version for uploaded evidence, session artifacts, and approval artifacts. Live Meridian proof confirms uploaded evidence and generated phase packages use independent artifact versioning, current Blob paths, duplicate-generation reuse, and fresh downloads instead of stale bytes from older artifact rows.

Note: "version" in this release refers to the `move_artifacts.version` row version, such as uploaded evidence version 11 or phase package version 5. It is unrelated to Meridian or AbarVa dataset layer names such as V4, V6, or V7. The live proof path `uploads/uploaded_evidence/v11/V7_18_function_system_data_vendor_bridge.csv` shows the distinction explicitly: uploaded evidence category, artifact row version 11, and a V7 data-layer source file name.

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
- Pass: PR checks passed after rerunning a transient Lighthouse TBT miss on the public `/` route.
- Pass: repo-owned ACA main deploy completed for merge SHA `1cae0778917c1c9f898bd81f03ebb0a3d3e47dae`.
- Pass: ACA runtime invariant captured with 100% traffic to `ca-abarva-web-lab-eastus--m1cae0778`.
- Pass: live signed-in Meridian P2 package generation.
- Pass: uploaded evidence persisted at `move_artifacts.version = 11`.
- Pass: P2 phase execution and next-phase readiness artifacts persisted at `move_artifacts.version = 5`.
- Pass: immediate repeat reused version 5 artifacts with `reusedExisting = true`.
- Pass: fresh authenticated downloads returned HTTP 200 and current generated content.

## Rollout Plan

Merged to `main` through PR #4759. The repo-owned Azure Container Apps main deploy workflow built and deployed the merge SHA image, shifted 100% traffic to the new revision, and passed runtime-invariant verification. Live Meridian proof then regenerated the P2 Phase Success Package and verified current downloads.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: No manual ACA traffic, image, env, or flag mutation was used in this release.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:6eab8e477f4c3ef80eb1709f9c5981d33cf9f36f1cbdc3a8572e6c208a13e083`.
- ACA revision: `ca-abarva-web-lab-eastus--m1cae0778`.
- ACA traffic: 100% to `ca-abarva-web-lab-eastus--m1cae0778`.
- ACA runtime invariant: Captured after deployment before live-proof claim.
- Worker image invariant: Deploy workflow completed worker update and invariant verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed for Meridian package generation and download.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous path behavior. Existing rows keep their recorded Blob paths.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4759
- Verification comment: https://github.com/abarva-platform/abarva/pull/4759#issuecomment-4961134865
- Merge SHA: `1cae0778917c1c9f898bd81f03ebb0a3d3e47dae`
- ACA revision: `ca-abarva-web-lab-eastus--m1cae0778`
- Image digest: `sha256:6eab8e477f4c3ef80eb1709f9c5981d33cf9f36f1cbdc3a8572e6c208a13e083`
- Traffic: 100%
- Live proof bundle: `proof/meridian-move-artifact-versioned-blob-paths-postfix-2026-07-13T18-07Z`
- Local validation output: focused Jest, ESLint, TypeScript, and release gate passed in the clean `codex/move-artifact-versioned-blob-paths` worktree.
- ACA deployment proof: `runtime/containerapp-show.json`, `runtime/revisions.json`, and `runtime/traffic.json` in the live proof bundle.
- Live Meridian retry proof: `api/00-summary.json`, `api/02-upload-v7-18-file-cabinet.json`, `api/03-generate-after-v7-18-upload.json`, `api/04-repeat-after-v7-18-upload.json`, `api/06-download-current-v7-18-proof.json`, and `api/07-db-blob-path-proof.json` in the live proof bundle.

## Known Gaps

Rows created before this release keep their historical Blob paths. If a row was inserted while Blob upload failed, the row may still be unavailable; this release prevents new current rows from accidentally resolving to stale bytes at an older shared path.

Access-policy gaps are separate from this artifact-persistence release and did not block live proof:

- Move origination permission for the Meridian CDIO persona.
- P1 approval/signoff authority for automation or service identities.
