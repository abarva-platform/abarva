# Generated control baseline policy

## Release ID

`2026-09-20-generated-control-baseline-policy`

## Status

`candidate`

## Plain-English Summary

Defines which generated files belong in source control and records ownership for
the test CI coverage census. This prevents runtime proof from being mistaken for
source and makes the existing coverage-shape gate's refresh responsibility clear.

## Layer Impact

- Release lane: `internal-admin`.
- Internal control layer: documents ownership and refresh rules for generated
  baselines and exposes the existing shape check as an operator command.

## Client Applicability

- All clients: No product behavior changes.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add `docs/governance/GENERATED_ARTIFACT_POLICY.md`.
- Add `npm run audit:test-ci-coverage:check`.
- Classify the direct check and writer as operator-owned controls while recording
  that the behavior suite enforces equivalent coverage-shape drift in CI.

## QA / Validation

- The existing behavior cases prove shape drift fails while count-only drift does
  not flap ordinary pull requests.
- Focused census behavior tests pass.
- `npm run audit:test-ci-coverage:write` and
  `npm run audit:test-ci-coverage:check` pass against the refreshed baseline.
- Full behavior, TypeScript, scoped ESLint, and release-control checks run before
  merge.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned ACA workflow
may deploy the resulting image, but this change affects only repository controls
and documentation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned workflow after merge.
- ACA runtime invariant: Required from the workflow artifact if deployed.
- Worker image invariant: Required from the workflow artifact if deployed.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; no product surface changes.

## Rollback Plan

Revert the squash merge. Do not hand-edit the generated census to simulate a
rollback; regenerate it from the reverted repository state.

## Audit Evidence

- Pull request and required-check results.
- Behavior tests covering shape drift, count-only drift, and clean `--check`.
- Operator check output.

## Known Gaps

The test CI coverage census is still a measurement, not a policy deciding which
currently uncovered suites should be wired next.
