# 2026-09-18-context-manifest-declared-entries

## Release ID

`2026-09-18-context-manifest-declared-entries`

## Status

`draft`

## Plain-English Summary

The admin manifest loader now processes only files declared by the operator-supplied manifest. It no longer adds files from a retired dataset automatically, requires an explicit dataset path instead of selecting a removed default, and rejects a manifest whose tenant key differs from the authorized request.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1/2 intake control: The admin loading route changes manifest selection and tenant identity validation. No template definition, adapter mapping, canonical schema, or tenant data changes.
- Layer 3/4: No read-model or product projection changes.

## Client Applicability

- All clients: Any authorized operator invoking this shared admin route.
- Specific clients: None.
- Internal only: The route is an authenticated admin operation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Remove ten unconditional supplement references whose files and template definitions were retired with an older dataset.
- Require `datasetPath` and use only the supplied manifest's `load_order` entries.
- Compare the manifest tenant key to the authorized requested tenant key before any entry read or write-client creation.
- Add route behavior tests for missing path, declared-only dry run, opposite-tenant refusal, and unknown-template refusal.

## QA / Validation

- Baseline route behavior tests: 0 passed, 2 failed before the fix.
- Opposite-tenant test before its guard: 1 failed.
- Fixed route behavior tests: 4 passed.
- Mutation checks: adding an undeclared entry made the declared-only test fail; disabling the tenant-key comparison made the opposite-tenant test fail. Both mutations were restored.
- Scoped ESLint, TypeScript `tsc --noEmit --incremental false`, and release gate: passed.

## Rollout Plan

After review and merge through a pull request, use the repo-owned ACA main deploy workflow. No migration, data job, or backfill is required. This draft does not authorize a merge or deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Verify during any later deployment.
- Worker image invariant: Verify during any later deployment if required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before calling the route behavior live-proven.

## Rollback Plan

Revert the route change through a pull request and redeploy a previously approved image digest through the repo-owned workflow. The prior implicit dataset path and supplement list would return, so operators should continue using explicit manifests during rollback. No tenant data rollback is part of this candidate.

## Audit Evidence

- Git history records the dataset manifest, ten supplement files, and historical template definitions, followed by retirement of that dataset. The current checkout has no manifest-backed dataset under `datasets/`.
- Focused route tests and mutation output in the worktree.
- Pull request, CI, ACA digest, and signed-in proof: Not yet available.

## Known Gaps

An explicit manifest that names a retired template still returns `manifest_load_unknown_template`; it is not silently skipped or restored. The route does not provide a current default dataset. Supporting a retired dataset again would require a separately governed dataset and template decision. The existing `clientId` fallback to the manifest when no session client ID is available is unchanged; this guard validates tenant key only.
