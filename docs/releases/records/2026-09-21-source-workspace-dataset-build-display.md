# 2026-09-21-source-workspace-dataset-build-display - Show the Source Dataset Build

## Release ID

`2026-09-21-source-workspace-dataset-build-display`

## Status

`candidate`

## Plain-English Summary

The Source workspace header now shows the populated dataset version in a separate `Dataset build`
control. Readers can identify which build they are viewing without treating a load timestamp or the
data's own as-of date as a build identifier.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: displays an existing workspace-diagnostics field in the Source header.
- Layers 1-3: no intake, adapter, canonical model, storage, schema, migration, or tenant-data change.

## Client Applicability

- All clients: yes, when the Source workspace payload contains a non-empty dataset version.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Render `workspaceDiagnostics.datasetVersion` as a separate `Dataset build` header control when it
  is populated.
- Add a rendered browser-surface behavior test with an explicit synthetic dataset version.
- Preserve the existing date control without changing the adapter or payload contract.

The current fields answer distinct questions:

- `datasetVersion`: which dataset build is displayed.
- `lastCompletedLoadAtIso`: when a governed package load completed.
- `asOfDateIso`: the date represented by the data.

No field on the Source workspace portfolio payload explicitly expresses a reporting cutoff. This
candidate therefore does not label any value as a reporting cutoff.

## QA / Validation

- Red-first rendered proof: the new assertion failed on the base revision because the real
  workspace header had no `Dataset build` control while the fixture supplied a dataset version.
- The isolated rendered behavior test passes after the display change: 1 passed, 9 skipped by the
  focused test-name filter.
- The existing Source freshness suite passes: 1 suite, 7 tests.
- Mutation proof: replacing the rendered dataset version with `Unavailable` made the rendered test
  fail on the expected fixture value; restoring the implementation returned the test to green.
- Repository TypeScript, focused ESLint, and `npm run release:check` pass.

## Rollout Plan

Merge through a protected pull request. Any later runtime rollout must use the repository-owned
Azure Container Apps main deploy workflow. This candidate does not deploy or change traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: not applicable until a later deploy.
- ACA runtime invariant: required after any later deploy.
- Worker image invariant: required after any later deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, as a separate post-deploy acceptance step; not claimed here.

## Rollback Plan

Revert the squash merge and deploy the resulting `main` revision through the repository-owned
workflow. No data rollback is required.

## Audit Evidence

- Focused rendered Jest output for the Source workspace dataset-build control.
- Existing Source freshness Jest output.
- TypeScript, focused ESLint, release-control, and mutation outputs recorded in the pull request.
- Pull-request checks. No signed-in or deployed proof is claimed by this candidate.

## Known Gaps

- The payload has no explicit reporting-cutoff field, so the header does not show or infer one.
- Signed-in re-acceptance remains outstanding and is intentionally outside this code candidate.
