# 2026-07-17-v3-architecture-status-sunset-record — V3 Architecture Status and Proposed V6/V7 Sunset Record

## Release ID

`2026-07-17-v3-architecture-status-sunset-record`

## Status

`candidate`

## Plain-English Summary

Adds a draft architecture decision record that documents the target V3 data architecture, the current repository status of V3/V6/V7 paths, and a proposed V6/V7 runtime-sunset sequence. This is a documentation/control-plane record only. It does not approve deleting V6/V7 code, migrations, runtime tables, or live read paths.

## Layer Impact

- Governance / architecture documentation: Adds a reviewable architecture status record under `docs/architecture/`.
- Release control: Captures the truth split that V6/V7 sunset is proposed and requires Anand approval plus live-proven V3 replacements before any runtime deprecation.
- Runtime: No runtime behavior changes.
- Data plane: No source files, loaders, Postgres schema, candidates, active tenant access, or module read models are changed.

## Client Applicability

- All clients: Indirectly applicable as future architecture guidance only.
- Specific clients: None.
- Internal only: Yes, this is an internal architecture/control record.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR #4910 adds `docs/architecture/V3_DATA_ARCHITECTURE_STATUS_AND_V6V7_SUNSET_2026-07-17.md`.
- PR #4910 adds this release record.
- No migrations, runtime code, data files, loader jobs, feature flags, or deployment workflows are changed.

## QA / Validation

- `npm run release:check` — Pass expected after this release record is included.
- `git diff --check` — Pass expected.
- CI release-control gate — expected to pass after this record is present.
- Browser proof — Not run; not applicable because this is documentation-only and does not change app runtime behavior.
- ACA deploy proof — Not run; not applicable unless main deploy workflow runs for unrelated reasons after merge.

## Rollout Plan

Merge through the protected PR lane. No Azure Container Apps rollout is required for the documentation itself. If the repo-owned main deploy workflow runs after merge, it should be treated as a normal main deploy, not as proof that any V3 runtime migration occurred.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this documentation-only change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable for this change.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because no runtime behavior changes.

## Rollback Plan

Revert PR #4910 if the architecture record needs to be withdrawn or replaced. Reverting this PR only removes documentation; it does not alter data, runtime behavior, migrations, or tenant state.

## Audit Evidence

- PR #4910.
- CI release-control check for PR #4910.
- Local `npm run release:check` and `git diff --check` output from the PR worktree.

## Known Gaps

- The architecture document is a draft decision note and still requires Anand sign-off before V6/V7 runtime dependencies are deprecated or before any cleanup/deprecation migration is authored.
- This PR does not implement V3 runtime migration, source adapter completion, Tower fact typing, candidate promotion, Active Tenant Access updates, or live browser proof.
