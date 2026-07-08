# 2026-07-08-main-typecheck-baseline-health — Restore Main TypeScript Baseline

## Release ID

`2026-07-08-main-typecheck-baseline-health`

## Status

`candidate`

## Plain-English Summary

Restores the repository-wide `npx tsc --noEmit` baseline on a dedicated branch from `origin/main`. This unblocks safety/export PRs from being judged against unrelated, pre-existing TypeScript failures and gives agents one visible baseline-health lane instead of scattered local fixes.

## Layer Impact

- `global-control-lane`: repairs shared compile health across Source, Atlas/Tower, Intelligence advisory, context ingestion, crawl, and export tests. No schema migration or runtime traffic change is included.
- `internal-admin`: restores compile coverage for admin/context ingestion helper paths and release/static truth-gate scripts.

## Client Applicability

- All clients: compile health and shared runtime type safety.
- Specific clients: none.
- Internal only: release and QA operator workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Dedicated branch: `codex/main-typecheck-baseline`
- Restored missing Atlas imports/helpers and retrieved-context prompt wiring.
- Restored Source canvas and Intelligence advisory type contracts.
- Restored compatibility for context-ingestion legacy dimensions still used by loader/tests.
- Restored static script modules used by truth-gate and corpus-status tests.
- Resolved stale export fixture/type imports.
- De-duplicated Source prompt registry keys so canonical artifact prompts compile.

## QA / Validation

- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`

## Rollout Plan

Merge this PR to `main` after review. This is a compile-baseline repair and does not require an immediate Azure Container Apps deployment by itself. Safety/export PRs should wait for this branch to land before claiming full releasability.

## Deployment Authority

- Repo-owned deploy workflow: not invoked by this baseline PR.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, this PR restores compile baseline only.

## Rollback Plan

Revert the squash commit if the baseline repair causes an unexpected test or runtime regression. Because there are no migrations or runtime env changes, rollback is code-only.

## Audit Evidence

- PR: pending creation from `codex/main-typecheck-baseline`.
- Compiler evidence: `npx tsc --noEmit` passes in `/private/tmp/nexus-typecheck-baseline`.
- Freeze scope until merge: `src/components/source/canvas/UniversalCanvasShell.tsx`, `src/lib/atlas/llm.ts`, `src/lib/context-ingestion/*`, `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`, `src/lib/source/agent-generation/prompt-registry.ts`, `src/lib/enterprise-context/intelligence-read-model.ts`.

## Known Gaps

This PR does not deploy, rerun the tenant-safety audit, or complete export/chart rendering work. Those lanes remain pending until the baseline-health PR is merged.
