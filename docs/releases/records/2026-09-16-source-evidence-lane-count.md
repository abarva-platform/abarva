# 2026-09-16-source-evidence-lane-count — Keep recommendations out of evidence counts

## Release ID

`2026-09-16-source-evidence-lane-count`

## Status

`candidate`

## Plain-English Summary

Contract evidence summaries now count underlying spend, scope, performance, document, and change-order rows. Optimization candidates remain in the Optimize workflow but no longer inflate the number of evidence rows or appear as a required evidence family.

## Layer Impact

- `global-control-lane`, Layer 4 product projection only: changes the Contract 360 Evidence presentation. Canonical facts, adapters, and intake are unchanged.

## Client Applicability

- All clients using the Source Contract 360 workspace.
- No tenant-specific data change or feature flag.

## Changes Included

- Contract 360 Evidence lede and family list.
- Focused unit and rendered-component regression tests.

## QA / Validation

- Confirmed the lede tests failed before the implementation and passed afterward.
- `npx jest --runTestsByPath` on both affected test files: 16 tests passed.
- Scoped ESLint: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- Live signed-in verification: pending deployment.

## Rollout Plan

Merge through a reviewed PR. The repo-owned ACA main deploy workflow builds and promotes the exact merged SHA. No migration, data build, or flag change is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: determined by the deploy workflow.
- ACA runtime invariant: verify before calling the change deployed.
- Worker image invariant: verify before calling the change deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm the Evidence count excludes action candidates while Optimize retains them.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. There is no data or schema rollback.

## Audit Evidence

Review the PR diff, local test output, deploy workflow and signed-in Contract 360 proof when available.

## Known Gaps

The coverage count for sourcing action candidates and the count of contract optimization levers can still differ because they come from distinct read models. Reconcile their identities and labels separately; this release does not claim they are equivalent.
