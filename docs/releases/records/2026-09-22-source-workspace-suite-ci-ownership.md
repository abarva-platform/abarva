# 2026-09-22 Source Workspace Suite CI Ownership

## Release ID

`2026-09-22-source-workspace-suite-ci-ownership`

## Status

`candidate`

## Plain-English Summary

Seventeen existing Source workspace behavior suites now run on every pull request. The suites were already measured as green; this change gives them a CI owner without changing their assertions or product behavior.

## Layer Impact

- Release lane: `global-control-lane`.
- Release control: the pull-request unit workflow gains one exact-path test step.
- Product layers: no client intake, adapter, canonical-model, or product runtime behavior changes.

## Client Applicability

- All clients: no product behavior changes.
- Specific clients: none.
- Internal only: CI ownership and release assurance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add one exact-path Jest command to `.github/workflows/unit-suites.yml` for the seventeen suites classified `wire_into_ci` by the governed triage record.
- Add a behavior guard that derives the expected suite set from that record and excludes its three `rewrite_as_behavior` entries.

## QA / Validation

- Red-first guard: failed because no workflow command reached the first recorded suite before the workflow change.
- The exact seventeen-suite Jest command must pass with 130 tests and no pending cases.
- The focused ownership guard, TypeScript, ESLint, release check, and test-coverage census are run before the pull request.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned ACA workflow may deploy the unchanged product image; this change is active for subsequent pull requests when the workflow file reaches `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none.
- Approved image digest: recorded by the repo-owned deploy.
- ACA runtime invariant: required before calling the merge deployed.
- Worker image invariant: required by the repo-owned deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no; no product surface changes.

## Rollback Plan

Revert the squash commit through a pull request. That removes the added workflow step and guard without changing product code or data.

## Audit Evidence

- Triage authority: `docs/architecture/t550-stale-suite-triage.json`.
- CI: pull-request checks and the exact-path unit step.
- Deployment: repo-owned ACA run and runtime-invariant artifact after merge.

## Known Gaps

The three suites classified `rewrite_as_behavior` remain outside this CI step and retain their separate owner.
