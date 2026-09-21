# Execution Queue Toolchain

## Release ID

`2026-09-20-execution-queue-toolchain`

## Status

`candidate`

## Plain-English Summary

The generators that decide which backlog item an execution agent may take are now reviewed repository code with a behavioral CI check. Private operator documents and generated status pages remain outside the repository.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1-4: no client intake, adapter, canonical model, or product behavior changes.
- Internal execution control: generator code and its structure-only map move under repository review. An explicit operator-root boundary keeps private backlog content out of CI and version control.

## Client Applicability

- All clients: No runtime change.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add the board and queue generators under `scripts/exec/`.
- Add the structure-only lifecycle map under repository review.
- Add an operator-root option so executable code and private operating documents do not need to share a directory.
- Replace the prior test's dependency on local documents with synthetic fixtures.
- Add a pull-request workflow that runs the real child-process behavioral suite.
- Ignore generated board and queue outputs if an operator intentionally uses the repository root.

## QA / Validation

- PASS: 13 behavioral child-process checks, including stale-summary refusal, fresh-claim handling, and physical separation between repo code and operator documents.
- PASS: both repo-owned generators executed against the current operator documents and produced the board, summary, and queue outside the repository.
- PASS: focused ESLint for the three executable scripts.
- PASS: CI gate registry audit; the new suite is exercised directly by its dedicated workflow.
- PASS: release control check.
- PASS: workflow YAML parse and diff hygiene.
- PASS: repository TypeScript check.
- Pending before merge: pull-request workflow checks.

## Rollout Plan

Squash-merge through a pull request. Operators invoke the repo-owned scripts with `SOURCE_EXECUTION_HOME` or `--operator-root`. No product runtime rollout, migration, data build, or feature flag is required, although the normal main workflow may rebuild the unchanged application image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` may run after merge; this tool has no runtime entry point.
- Shared runtime mutators: None in this change.
- Approved image digest: Recorded if the normal main deploy runs.
- ACA runtime invariant: Read-only verification only.
- Worker image invariant: Read-only verification only.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this tool is not reachable from a product route.

## Rollback Plan

Revert the pull request. The prior Downloads copies remain operator files until intentionally retired after the repo-owned command has been used successfully.

## Audit Evidence

- Pull request, CI checks, and merge SHA.
- Behavioral suite output.
- Generated command output against the current operator documents.

## Known Gaps

The operator documents remain local by design. Their backup and access policy is outside this release; repository CI proves generator behavior without ingesting their contents.
