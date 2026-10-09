# 2026-10-08-solution-design-brief-alignment — Align the exhibit brief and quality contract

## Release ID

`2026-10-08-solution-design-brief-alignment`

## Status

`candidate`

## Plain-English Summary

The solution-design brief now asks for the same five named visuals that the deliverable profile requires. The generation prompt states each exact exhibit key beside its purpose and required content, so the authoring instruction and quality check describe one contract.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Moves generated-deliverable brief and prompt construction. Canonical data, tenant authorization, exhibit payload rules, and quality thresholds are unchanged.

## Client Applicability

- All clients: Applies to Moves solution-design generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing generation enrollment is unchanged.

## Changes Included

- Align the brief's five exhibit keys with the profile's required keys.
- Include exact keys in the shared expected-exhibit prompt text.
- Test profile-to-brief alignment and prompt delivery of those keys.

## QA / Validation

- Focused brief and prompt suites: pass, 82/82.
- Targeted ESLint: pass.
- Full typecheck: pass.
- `npm run release:check`: pass, all 11 gates.
- Signed-in generation proof: not run; pending merge and deploy.

## Rollout Plan

Squash merge through a PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Rebuild a solution-design artifact on a signed-in Move and inspect all required exhibits before calling this live proven.

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

PR and deploy workflow links after merge; focused test results; signed-in artifact build outcome after deployment.

## Known Gaps

The model may still omit or return invalid exhibit content. The unchanged quality gate blocks that output and requires reviewer action.
