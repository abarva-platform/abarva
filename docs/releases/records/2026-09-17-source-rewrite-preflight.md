# 2026-09-17 Source opportunity rewrite preflight

## Release ID

`2026-09-17-source-rewrite-preflight`

## Status

`candidate`

## Plain-English Summary

The cloud-consumption package can check whether a planned opportunity reload would replace reviewed or progressed actions before any adapter write. The check runs in a read-only database transaction and fails closed when access or a required action query is incomplete.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1: No source evidence changes.
- Layer 2: The apply job now checks the canonical-writer opportunity scope before writing adapter rows.
- Layer 3: The existing rewrite guard remains in place before optimization-spine replacement.
- Layer 4: No projection or UI behavior changes in this release.

## Client Applicability

- All clients: Only those using the governed cloud-consumption package loader.
- Specific clients: No tenant exception.
- Internal only: Operator preflight and load sequencing.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- A read-only `preflight-rewrite` loader mode and named ACA job script.
- Shared scope derivation for preflight, Layer 2, and Layer 3.
- Layer 2 refuses to write when the existing action-history guard rejects the scope.
- No migration, data load, traffic flag, or security relaxation.

## QA / Validation

- Focused guard tests cover every action family, exact tenant/dataset/ID scoping, a read-only transaction, failure rollback, and the Layer 2 before-write ordering.
- Disposable Postgres verifies the read-only preflight passes an untouched scope and rejects a scoped approval record.
- Loader regression, TypeScript, scoped lint, and release gate results are recorded with the PR.

## Rollout Plan

Merge by PR and deploy through the repo-owned ACA main workflow. Verify the web and worker digest invariant. Run the named preflight as a digest-pinned ACA Job with exact tenant, dataset version, package path, run ID and proof bundle. A passing preflight is a necessary condition, not permission to skip the guarded Layer 2/3/4 job sequence or human review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Captured from the deployment artifact after merge.
- ACA runtime invariant: Required before running the operator job.
- Worker image invariant: Required before running the operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after any separate data reload.

## Rollback Plan

Revert the loader change by PR and redeploy through the same workflow. This release itself writes no Azure rows. Do not remove the prior Layer 3 guard during rollback.

## Audit Evidence

Focused test output, PR CI, deployment runtime-invariant artifact, and the preflight ACA Job proof bundle with exact scope, package hash and pass/fail status.

## Known Gaps

A clear preflight does not guarantee that no action changes between Layer 2 and Layer 3 jobs. The Layer 3 guard rechecks and stops the rewrite if that occurs. An interrupted sequence must be reconciled before Layer 4 activation. Signed-in acceptance remains separate.
