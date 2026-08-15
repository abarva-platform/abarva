# 2026-08-15-source-reachability-cleanup-s6 — Retire Unreachable Source Child Panels

## Release ID

`2026-08-15-source-reachability-cleanup-s6`

## Status

`candidate`

## Plain-English Summary

This removes a small follow-on batch of unreachable Source presentation files that had no active route, script, or test references after the prior stage-view cleanup. The cleanup keeps the Source New Event code surface smaller while preserving the active workflow surfaces.

## Layer Impact

Layer 4 Products: Source presentation code only. No tenant data, client intake, adapters, canonical objects, prompts, migrations, loaders, persistence, or runtime data-plane behavior changed.

## Client Applicability

- All clients: Receives the smaller Source code surface after normal web deployment.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Removed unreachable Source presentation panels with no active source, script, or test references.
- Updated the Source canvas reachability baseline from 107 to 96 known unreachable files.

## QA / Validation

- PASS: `node scripts/audit/source-canvas-reachability.mjs` reports 616 route entry points, 96 unreachable files, and no new unreachable components.
- PASS: `rg "NexusEngagementCanvas|BatnaPanel|DissentPanel|WeightedScorecardTable|ExecutiveSummaryHeader|SensitivityRibbon|TcoBridge|TcoIcebergViz|ApplicationInventoryTable|KtPlanTracker|TransitionReadinessScorecard" src scripts tests -n || true` returns no active source, script, or test references.
- PASS: `git diff --check`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge through a pull request. The repo-owned Azure Container Apps main deploy workflow is the only approved path to the shared Product/Lab web runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming the release is live.
- Worker image invariant: Required by deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming user-visible proof, even though this is a code-surface cleanup.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

- Pull request URL after creation.
- Source canvas reachability audit output.
- Release check output.
- GitHub Actions deploy and post-deploy proof after merge.

## Known Gaps

Historical docs may still mention some retired components as prior build artifacts. This release only removes unreachable runtime code; broader historical documentation pruning remains out of scope.
