# 2026-09-19 Streaming Identifier Artifact Cleanup

## Release ID

`2026-09-19-streaming-identifier-artifact-cleanup`

## Status

`candidate`

## Plain-English Summary

Keeps streamed and settled assistant answers visually consistent when an internal identifier appears inside parentheses or after an em dash. The streaming pass now removes the same punctuation fragments as the settled pass, instead of briefly showing a placeholder that disappears when the answer finishes.

## Layer Impact

- Release lane: `global-control-lane`.
- Shared assistant response presentation only.
- Identifier detection and replacement policy are unchanged.

## Client Applicability

- All clients using streamed assistant answers.
- No tenant-specific behavior.
- No data, schema, configuration, or model-prompt change.

## Changes Included

- Add failing-first behavioral coverage for parenthesized and em-dash identifier placeholders.
- Apply the settled response's existing punctuation cleanup to the streaming response pass.

## QA / Validation

- PASS: failing-first behavior was reproduced with 2 failures and 6 passes.
- PASS: corrected focused behavior suite passes 8 of 8 tests.
- PASS: related response-shape coverage passes 3 suites and 58 tests.
- PASS: TypeScript (`npx tsc --noEmit`, Node 24 with an 8 GB heap).
- PASS: scoped ESLint, release control, and whitespace checks.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. A streamed answer should be watched through settlement when a safe fixture exercises the identifier guard.

## Rollback Plan

Revert the three streaming punctuation cleanup rules and their behavioral cases. No data or schema rollback is required.

## Audit Evidence

- Failing-first and corrected behavior output from the real streaming and settled response functions.
- Related response-shape test output.
- TypeScript, lint, release-control, and diff checks.

## Known Gaps

Signed-in streaming-to-settled acceptance remains required after deployment. No authenticated browser claim is made by this release record.
