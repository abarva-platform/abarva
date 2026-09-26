# 2026-09-26-source-scope-readiness-message - Separate Workflow and Approval Readiness

## Release ID

`2026-09-26-source-scope-readiness-message`

## Status

`candidate`

## Plain-English Summary

An event stage with one remaining workflow input no longer suggests that finishing that input alone will move the stage to approval. The mounted stage view directs the reader to review evidence, artifact status, and gate criteria separately.

## Layer Impact

- `global-control-lane`: Layer 4 product presentation only. No canonical data, approval authority, gate calculation, or notification behavior changes.

## Client Applicability

- All clients: Yes, for the Source New event canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source New event canvas progress message and a mounted rendered regression test.

## QA / Validation

- Pass: the existing 11-stage render smoke, 16/16 tests.
- Pass: the focused stage approval suite, 21/21 tests after the change.
- Pass: the full canvas analytics suite, 31/31 suites and 196/196 tests after preserving the live task-count assertions in two existing cases. The first PR head failed those two cases because they encoded the superseded wording; CI exposed the omission.
- Fail as intended before implementation: the new rendered Scope case could not find the corrected readiness message.
- Fail as intended under mutation: removing the separate approval-readiness clause made the new case fail while leaving the workflow count intact.
- Pass: TypeScript (`npx tsc --noEmit --incremental false`) and scoped ESLint.
- CI and signed-in post-deploy replay: Not run at record creation; record their outcomes before release.

## Rollout Plan

Merge through a reviewed PR. Only the repo-owned ACA main workflow may deploy the resulting image to the shared runtime. No schema, data build, flag, or traffic command is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from this branch.
- Approved image digest: Not assigned until the main workflow builds it.
- ACA runtime invariant: Not run; verify template and 100%-traffic revision after deployment.
- Worker image invariant: Not run; verify both required workers after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, replay the event-stage message and the unchanged governed gate.

## Rollback Plan

Revert the UI change through a PR and the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

- Red-first and mutation test output in the task record; focused Jest command in the PR.
- PR, CI, deployment, runtime, and signed-in evidence to be linked when available.

## Known Gaps

- This copy correction does not supply missing approval evidence, complete a stage, release an RFx package, or close an end-to-end journey.
