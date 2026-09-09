# 2026-09-09-source-terminal-stage-completion - Terminal Stage Completion

## Release ID

`2026-09-09-source-terminal-stage-completion`

## Status

`candidate`

## Plain-English Summary

Source now treats a recorded approval on the terminal workflow stage as completion. The stage shell shows the approval record and audit trail without presenting another approval action.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: Source event Steps and Approvals workspaces derive terminal completion from the existing approval ledger.
- Data model and persistence: unchanged.

## Client Applicability

- All clients: Yes, for Source events whose final-stage approval is recorded.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Expose `stage.approvalRecorded` from the event shell view model.
- Suppress a routed approval card after that stage's ledger row is approved.
- Replace ready-to-approve language with completed-stage language in Steps and Approvals.
- Preserve visible artifact-review gaps as part of an accepted exception without inviting duplicate approval.

## QA / Validation

- Focused Source event shell and stage-approval tests: passed.
- Scoped ESLint and full TypeScript checks: required before release.
- Signed-in terminal-stage Steps and Approvals proof: required after deployment.

## Rollout Plan

Merge through a protected pull request and deploy the exact merge SHA through the repository-owned ACA main workflow. Verify the terminal stage against an event with a real final-stage ledger approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only
- Approved image digest: recorded by the deploy workflow after merge
- ACA runtime invariant: template image and 100% traffic revision must match the approved digest
- Worker image invariant: no worker change in this release
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the pull request and redeploy the resulting main SHA through the repository-owned workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request, merge commit, and ACA main deploy run.
- Focused Jest, scoped ESLint, TypeScript, and release-policy output.
- Signed-in proof that the final stage shows completed state and no approval button while the ledger remains intact.

## Known Gaps

Production proof remains pending until the candidate is merged and the exact SHA is deployed.
