# Structured Answer Preservation

## Release ID

`2026-09-18-structured-answer-preservation`

## Status

`candidate`

## Plain-English Summary

The shared advisor response shaper now retains an already-structured table, list, or sectioned answer when the calling surface identifies that structure. Label substitution, internal-brand cleanup, raw-ID removal, and output-contract repair still run.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4: Shared answer presentation only. No intake, adapter, canonical, schema, or tenant-data changes.

## Client Applicability

All clients using the shared advisor response shaper. The preservation mode is opt-in; the existing loose-prose compaction path is unchanged.

## Changes Included

- Pass the existing structured-answer decision into the shared shaper.
- Skip chat compaction for that branch while retaining disclosure and identifier controls.
- Add a focused test that a preserved table still replaces display labels and removes stale brands and raw IDs.

## QA / Validation

- Existing real response-shaper regression suite: 8 passed, 2 failed before the fix; 10 passed after.
- Shared-shaper focused suite: 5 passed after.
- Mutation: disabling the preservation handoff restored the same 2 failures.
- Scoped ESLint and TypeScript `tsc --noEmit --incremental false` passed. Release gate and PR CI remain pending.

## Rollout Plan

After reviewed PR merge, use the repository-owned ACA main deploy workflow. Check digest/runtime invariants and signed-in presentation before calling it live-proven.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may update the shared runtime. No manual traffic, env, or worker-template change is part of this candidate.

## Rollback Plan

Revert the change through a PR and redeploy through the repo-owned workflow. No tenant-data rollback is required.

## Audit Evidence

Focused red/green and mutation output are available in the isolated worktree. No deployment or signed-in proof is claimed.

## Known Gaps

Long structured answers may exceed the preferred chat length; the shared shaper still records a length issue rather than silently flattening a table or sectioned answer.
