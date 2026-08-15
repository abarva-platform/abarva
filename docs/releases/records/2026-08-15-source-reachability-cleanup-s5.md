# 2026-08-15-source-reachability-cleanup-s5 — Retire Unreachable Source Stage Views

## Release ID

`2026-08-15-source-reachability-cleanup-s5`

## Status

`candidate`

## Plain-English Summary

This removes six unreachable Source presentation files that are no longer imported by active routes, scripts, or tests. The cleanup keeps the Source New Event surface smaller while the active workflow continues to concentrate on clear stage progress, evidence readiness, and approval movement.

## Layer Impact

Layer 4 Products: Source presentation code only. No tenant data, client intake, adapters, canonical objects, prompts, migrations, loaders, persistence, or runtime data-plane behavior changed.

## Client Applicability

- All clients: Receives the smaller Source code surface after normal web deployment.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Removed unreachable Source stage-view presentation files and one unused Source style helper.
- Updated the Source canvas reachability baseline from 113 to 107 known unreachable files.

## QA / Validation

- PASS: `node scripts/audit/source-canvas-reachability.mjs` reports 616 route entry points, 107 unreachable files, and no new unreachable components.
- PASS: `rg "EvaluationStageView|ExecutiveDecisionStageView|PricingStageView|ScopeStageView|TransitionStageView|foundationStyles" src scripts tests -n || true` returns no active source, script, or test references.
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
