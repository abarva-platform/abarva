# 2026-08-23 Moves Artifact Cleanliness Refresh Operator

## Release ID

`2026-08-23-moves-artifact-cleanliness-refresh`

## Status

`candidate`

## Plain-English Summary

Adds a scoped operator command for scanning current Moves artifact files and
refreshing persisted Word-equivalent artifact bytes when the current renderer can
rebuild them cleanly from existing structured source. The command refuses to
sanitize by text replacement: it either regenerates from a known source path and
proves the regenerated Office text scans clean, or reports the artifact as not
refreshable.

## Layer Impact

- **Layer 4 — Products:** Affected lane: `internal-admin`. Adds an operator utility for the
  Moves artifact vault. It reads `generated_artifacts`, `move_artifacts`, and
  Azure Blob artifact bytes for one requested Move. It does not change source
  intake, canonical records, projections, registry state, migrations, runtime
  routing, or tenant source files.

## Client Applicability

- All clients: The command can be run for any tenant/Move by an authorized
  operator.
- Specific clients: None hard-coded.
- Internal only: Yes. This is an operator command, not a user-facing workflow.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/moves/refresh-persisted-artifact-cleanliness.ts`.
- Adds `npm run moves:refresh-artifact-cleanliness`.
- The command writes a JSON evidence report under the requested `--out-dir`.
- Dry-run is default. Apply requires both `--apply` and
  `--confirm-refresh-current-move-artifacts`.

## QA / Validation

- PASS: `npx eslint scripts/moves/refresh-persisted-artifact-cleanliness.ts`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- BLOCKED locally as expected: `npm run moves:refresh-artifact-cleanliness -- --move 5dff496f --out-dir /tmp/nexus-moves-artifact-cleanliness-smoke` reached private Azure Postgres DNS and failed with `getaddrinfo ENOTFOUND`; run the command in the deployed/operator network.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow may
build and deploy the resulting image so the command is available in the deployed
operator environment. Run dry-run first for a single Move, inspect the JSON
report, then apply only when all dirty current artifacts are refreshable.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming the runtime is current.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. The proof is the operator JSON report and
  refreshed artifact scan results after a scoped run.

## Rollback Plan

Revert the release commit and redeploy through the repo-owned main workflow.
Already-refreshed `move_artifacts` rows remain versioned artifact history; prior
versions are preserved by the existing supersession chain and can be restored by
artifact selection if needed.

## Audit Evidence

- PR URL: To be added after opening the PR.
- Local validation: eslint and TypeScript commands above.
- Runtime/operator evidence: `moves-artifact-cleanliness-report.json` from the
  scoped dry-run/apply run.

## Known Gaps

- The operator regenerates only artifacts with a supported structured source
  path. It does not fabricate missing source and does not edit Blob bytes in
  place.
- Local development shells without private data-plane DNS cannot run the live
  scan/apply; use the deployed/operator environment.
