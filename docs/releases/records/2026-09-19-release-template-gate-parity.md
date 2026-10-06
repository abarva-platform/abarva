# 2026-09-19 Release Template Gate Parity

## Release ID

`2026-09-19-release-template-gate-parity`

## Status

`candidate`

## Plain-English Summary

Makes the standard release-record template and the release gate one enforceable contract. A missing, extra, or reordered section now fails the gate before an author can copy a stale template into a release candidate.

## Layer Impact

- Release lane: `global-control-lane`.
- Repository release-control tooling and its CI workflow only.
- No product runtime, data, schema, model, prompt, or user-interface change.

## Client Applicability

- Internal only. This affects contributors preparing release records for all product lanes.
- No client-specific behavior or data.

## Changes Included

- Validate the standing release-record template against the real gate's required section list on every gate run.
- Fail closed for missing, unexpected, or reordered level-two sections.
- Add a four-case mutation-oriented test that drives the real gate in scratch repositories.
- Execute that test in the release-control workflow.

## QA / Validation

- FAILING FIRST: 0 of 4 template-contract cases passed before the gate enforced the template.
- PASS: 4 of 4 cases pass after the change.
- PASS: existing release lane and tenant-narrative guard suites.
- PASS: release control, TypeScript, scoped ESLint, and whitespace checks.

## Rollout Plan

Merge through the protected pull-request lane. The release-control workflow begins enforcing the contract on subsequent pull requests. No ACA runtime deployment is required for this repository-control change.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; this is CI and repository tooling.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not required.
- Worker image invariant: Not required.
- Feature/env flag update path: None.
- Live signed-in proof required: No product runtime behavior changes.

## Rollback Plan

Revert the template-contract check, its focused test, and the workflow step. Existing release records and product runtimes are unaffected.

## Audit Evidence

- Four-case before/after output from `npm run check:release-record-template-contract`.
- Release-control workflow log showing the new test step executed.
- Existing release-control suite output and `npm run release:check`.

## Known Gaps

The contract checks section presence and order, not the instructional quality of placeholder text inside each template section. Existing per-record validation continues to enforce minimum content and required release-lane, applicability, and QA language.
