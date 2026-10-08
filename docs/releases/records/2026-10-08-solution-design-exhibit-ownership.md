# 2026-10-08-solution-design-exhibit-ownership — Required exhibit keys in synthesis

## Release ID

`2026-10-08-solution-design-exhibit-ownership`

## Status

`candidate`

## Plain-English Summary

The solution design authoring pass now receives the exact control-point and data-flow exhibit keys checked by its quality gate. Optional structured rendering happens later in the pipeline, so it cannot supply a missing exhibit to that earlier check.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Shared generated-deliverable prompt construction. Canonical data, intake, and tenant authorization are unchanged.

## Client Applicability

- All clients: Applies to Moves solution design generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing structured-renderer enrollment is unchanged.

## Changes Included

- Include `control_points` and `data_flow` in the solution design synthesis instruction, using their exact quality-contract keys.
- Keep the existing required-exhibit validator, evidence rules, and optional structured renderer unchanged.
- Add a focused regression test for the instruction reaching the synthesis pass.

## QA / Validation

- Focused prompt tests: pass, 17/17.
- Targeted ESLint and TypeScript `tsc --noEmit`: pass.
- `npm run release:check`: pass, all 11 gates.
- Signed-in generated-document proof: not run; pending deployment.

## Rollout Plan

Squash merge through a PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Verify the runtime invariant and a signed-in solution design build before calling this live proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the deploy workflow after merge.
- ACA runtime invariant: Verify the template and 100% traffic revision images match the approved digest.
- Worker image invariant: Verify required worker jobs use that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repository-owned main workflow. No data or schema rollback is needed.

## Audit Evidence

PR and deploy workflow links after merge; focused test results; signed-in build outcome after deployment.

## Known Gaps

The model may still omit or return invalid exhibit content. The unchanged quality gate blocks that output and requires reviewer action.
