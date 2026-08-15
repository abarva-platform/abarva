# 2026-08-15-source-reachability-cleanup-s4 — Retire Additional Unreachable Source Components

## Release ID

`2026-08-15-source-reachability-cleanup-s4`

## Status

`candidate`

## Plain-English Summary

This removes another small batch of unreachable Source presentation components that are no longer imported by any product route. The goal is to keep the active Source workflow easier to reason about while the New Event experience is simplified around explicit stage steps, required evidence, and approval readiness.

## Layer Impact

Layer 4 Products: Source presentation code only. No tenant data, adapters, canonical objects, persistence, loaders, migrations, prompt contracts, or runtime data-plane behavior changed.

## Client Applicability

- All clients: Receives the smaller Source code surface after the normal web deployment path.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Removed unreachable Source UI components that had no source-code importers.
- Updated the Source canvas reachability baseline to the new current count.

## QA / Validation

- PASS: `node scripts/audit/source-canvas-reachability.mjs` reports 616 route entry points, 113 unreachable files, and no new unreachable components.
- PASS: `rg "EvaluationCriteriaEditor|GateCriteriaPanel|InstanceComparisonGrid|PatternRecommendationChips|SourcingEventCard|EventIdStrip|SentinelChatProportional" src scripts tests -n || true` returns no active source, script, or test references.
- PASS: `git diff --check`.
- PASS: `npm run release:check`.
- BLOCKED: `npx tsc --noEmit --pretty false --incremental false --skipLibCheck` could not run through `npx` in this clean worktree because local `node_modules` is not installed. A retry using the main checkout's installed TypeScript binary was not valid proof because it produced broad pre-existing workspace/module-resolution failures outside this Source cleanup slice.

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

Historical docs still mention some retired components as prior build artifacts. This release only removes unreachable runtime code; broader historical documentation pruning remains out of scope.
