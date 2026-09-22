# 2026-09-22-source-intelligence-files-destination — Route evidence review to Files

## Release ID

`2026-09-22-source-intelligence-files-destination`

## Status

`candidate`

## Plain-English Summary

The Source New Intelligence next action now opens the event's Files workspace when it asks an operator to review loaded evidence. The action no longer returns the operator to the default Work view while describing a file-review task.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: changes one mounted Source New navigation target.
- Canonical model: unchanged. No event, evidence, approval, supplier, or lifecycle state is written.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Route the Intelligence next-action link to the current event with `workspace=files`.
- Add a mounted behavior assertion for the exact destination.

## QA / Validation

- PASS: the red-first mounted test received the bare event URL before implementation.
- PASS: the focused workspace suite passes after the navigation change.
- PASS: mutation proof changing the link back to the bare event URL fails the behavior test.
- PASS: Node 24 TypeScript, scoped ESLint, release control, test-coverage census write/check, and diff check.

## Rollout Plan

Squash-merge after applicable checks pass. The repo-owned ACA main workflow builds and deploys the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; click the Intelligence evidence-review action and verify the same event opens in Files.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main workflow. No data rollback is required.

## Audit Evidence

- Signed-in failure recorded in the Source New CPO smoke ledger.
- Focused mounted behavior test and mutation log.
- Pull request checks, repo-owned deployment proof, and post-deploy signed-in replay.

## Known Gaps

This release changes only the action destination. It does not promote evidence, change readiness, or approve an artifact.
