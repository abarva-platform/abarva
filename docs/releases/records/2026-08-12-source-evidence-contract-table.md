# 2026-08-12-source-evidence-contract-table — Source Stage Evidence Row Contract

## Release ID

`2026-08-12-source-evidence-contract-table`

## Status

`candidate`

## Plain-English Summary

The Source stage workflow now presents evidence requests as a compact row contract: what evidence is needed, which source or owner should provide it, where the parser writes the facts, and what the next action is. This reduces ambiguity before upload without changing any evidence semantics or making missing evidence look complete.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source event workspace presentation only. The stage canvas renders existing view-model fields more clearly.
- Canonical model: no schema or calculation change.
- Source adapters: no parser or upload behavior change.

## Client Applicability

- All clients: yes, any tenant using the shared Source stage workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

Candidate validation status:

- Focused Jest coverage for the Scope evidence ask table: pass.
- ESLint on the changed component and test: pass.
- TypeScript compile check: pass.
- `git diff --check`: pass.
- `npm run release:check`: pass after release-record wording update.
- Signed-in browser proof on a live Source event workspace: not run before merge; required after repo-owned ACA deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the shared web image. No migration or manual data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: required for live activation.
- Shared runtime mutators: none in this change.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before live claim.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event stage workspace.

## Rollback Plan

Revert the PR. Since this is presentation-only, rollback does not require data repair or migration rollback.

## Audit Evidence

- PR URL and merge commit.
- Focused test, lint, typecheck, release check outputs.
- ACA deploy workflow run and runtime invariant proof.
- Signed-in browser screenshot and DOM/readback proof.

## Known Gaps

This does not implement new parsing, new source-system adapters, or artifact quality scoring. It only makes the existing required-evidence contract explicit in the stage UI.
