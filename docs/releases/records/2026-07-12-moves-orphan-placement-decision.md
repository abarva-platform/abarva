# 2026-07-12-moves-orphan-placement-decision — Moves Orphan Placement Closure

## Release ID

`2026-07-12-moves-orphan-placement-decision`

## Status

`candidate`

## Plain-English Summary

This closes the remaining non-P1 Moves orphan audit item. The retired `MovesExplorer` component is removed because the platform-default Moves workspace route now uses the shared `WorkspaceExplorer`. The placement decision for the remaining real-but-unmounted components is documented so future work mounts them in the right product moment instead of dropping them into an already-dense phase workspace.

## Layer Impact

- Product UI: Removes a dead, unmounted Moves explorer implementation. No live route is removed.
- Product governance: Documents where the Nexus current-state briefing and Move-to-Source handoff should live before they are mounted.
- Data plane: No schema, migration, tenant data, or retrieval changes.

## Client Applicability

- All clients: Yes, but no live UI behavior changes are expected.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `workspace_explorer_moves` remains the shared platform-default workspace route.

## Changes Included

- Deletes `src/components/strategic-moves/MovesExplorer.tsx`.
- Adds `docs/audits/moves-orphan-placement-decision-2026-07-12.md`.
- Adds this release record.

## QA / Validation

- Pass: orphan import scan found no live `MovesExplorer` references in `src` or `tests`.
- Pass: `npx jest src/components/strategic-moves/__tests__/moves-detail-route-sunset.test.ts --runInBand`
- Pass: `git diff --check`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Pass: `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merge SHA. No manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Determined by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment by the ACA main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for the dead-code deletion itself; future briefing/handoff mounts will require signed-in proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: Pending.
- Audit decision doc: `docs/audits/moves-orphan-placement-decision-2026-07-12.md`.
- Deployment proof: Pending until merge and ACA deploy.

## Known Gaps

`NexusCurrentStateBriefingPanel` and `MoveToSourceHandoffCta` are intentionally not mounted in this release. Their required placement and prerequisites are documented in the audit decision.
