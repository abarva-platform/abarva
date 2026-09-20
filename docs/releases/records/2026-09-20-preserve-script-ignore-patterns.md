# Preserve script ignore patterns in the CI census

## Release ID

`2026-09-20-preserve-script-ignore-patterns`

## Status

`candidate`

## Plain-English Summary

The test coverage census can now read regular-expression ignore patterns from a
workflow-reachable shell script without converting regex escapes into path
separators. Structured script invocations that cannot yet be parsed remain
explicitly reported instead of being treated as successful exclusions.

## Layer Impact

- Release lane: `global-control-lane`.
- Internal control layer: improves the accuracy of the repository's CI coverage
  measurement. Product and tenant data paths are unchanged.

## Client Applicability

- All clients: No product behavior changes.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Preserve regex escapes while extracting Jest invocations from script files.
- Normalize paths only for path matching.
- Parse ignore patterns from the escape-preserving command text.
- Continue to report unsupported structured ignore arguments as unresolved.

## QA / Validation

- Status: PASS.
- Failing-first shell-script fixture proved the excluded suite was previously
  counted as covered.
- A structured invocation fixture proves an unsupported shape stays visible in
  `unresolvedIgnoreArguments`.
- The full census behavior suite, repository census, TypeScript, scoped ESLint,
  and release-control checks run before merge.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned ACA deploy
may build the resulting image; the changed logic is repository tooling only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned workflow after merge.
- ACA runtime invariant: Required from the workflow artifact if deployed.
- Worker image invariant: Required from the workflow artifact if deployed.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; no product surface changes.

## Rollback Plan

Revert the squash merge. The census will return to reporting script-contained
ignore arguments as unresolved rather than applying them.

## Audit Evidence

- Pull request and required-check results.
- Failing-first fixture and final focused suite output.
- Repository census output showing unresolved arguments remain visible.

## Known Gaps

Array-shaped JavaScript process arguments are still reported as unresolved when
their ignore patterns cannot be parsed from command text. They are not silently
credited as exclusions.
