# 2026-09-22-source-file-use-readiness-language - Clarify File Use Readiness

## Release ID

`2026-09-22-source-file-use-readiness-language`

## Status

`candidate`

## Plain-English Summary

The Source Files workspace now names its file-use count as workflow usability instead of generic readiness. It also explains that availability review and workflow usability are separate checks, so two accurate counts no longer appear contradictory.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: reader-facing Source Files labels only. No canonical data, evidence state, or readiness calculation changes.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Clarify the File use map description and count label.
- Add rendered behavior coverage for the distinction.

## QA / Validation

- Focused rendered component suite: passed, 21 tests.
- Mutation check: passed; restoring generic readiness wording failed 2 rendered assertions.
- TypeScript typecheck: passed with the repository Node 24 runtime.
- Scoped ESLint: passed.
- Release control check: passed.

## Rollout Plan

Squash merge through a pull request. The repo-owned Azure Container Apps main deploy workflow publishes the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, on the Source Files workspace.

## Rollback Plan

Revert the squash commit and redeploy through the same repo-owned workflow. No data rollback is required.

## Audit Evidence

- Pull request and hosted checks after publication.
- Focused rendered test output.
- Repo-owned deployment evidence and signed-in Source Files replay.

## Known Gaps

This change does not parse, index, review, approve, or promote any file. It only makes the two readiness concepts explicit.
