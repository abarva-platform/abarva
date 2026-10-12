# 2026-10-12 Tower AI population read

## Release ID

`2026-10-12-tower-ai-population-read`

## Status

`candidate`

## Plain-English Summary

Tower now distinguishes AI use cases, tool rollouts, and use-case usage observations using the declared projection page and canonical object IDs. Counts and charts use the relevant population. A usage observation is no longer presented as a second asset. Missing Finance status and unscored AI posture remain unknown.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no change.
- Layer 4 Tower product projection: the reader classifies existing rows by declared identity and the command center displays separate counting bases. No source values are changed.

## Client Applicability

- All clients: yes, when the governed Tower serving projection is active.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Tower serving selection applies.

## Changes Included

- Tower serving reader, command-center view model, case and rollout selectors, executive and portfolio views, source-backed AI scoring, and focused tests.
- No migration, loader, private data, or runtime configuration change.

## QA / Validation

- Focused reader, view-model, and UI tests: pass.
- TypeScript and changed-file ESLint: pass.
- `npm run release:check`: all 11 gates passed.
- Signed-in runtime validation: required after deployment; not yet performed for this candidate.

## Rollout Plan

Merge the reviewed PR to main. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Confirm the serving projection and signed-in Tower tabs after the approved deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this candidate.
- Approved image digest: supplied by the main deploy workflow after merge.
- ACA runtime invariant: template, 100% traffic revision, and required worker images must match the approved digest before live claims.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: executive rail, Verdict, AI portfolio, Tools, and Decisions by owner.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main workflow. No schema or data rollback is required.

## Audit Evidence

- PR diff and focused test output.
- Post-deploy ACA digest check and signed-in Tower readback, when available.

## Known Gaps

Missing owner assignments, Finance status, funding, rollout targets, and case-to-tool links remain unknown until separately supplied and governed. The UI does not infer them from usage observations.
