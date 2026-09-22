# 2026-09-22-source-new-concise-completed-ui - Concise Source New Completed Event Views

## Release ID

`2026-09-22-source-new-concise-completed-ui`

## Status

`candidate`

## Plain-English Summary

The Source New event workspace keeps high-volume Intelligence and Approvals records readable by showing a concise initial set with summary counts and an explicit expand/collapse control. The underlying records are not changed, suppressed upstream, or reclassified; expanding the control shows the full set for the selected view.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. This is a presentation change in the Source New workspace. It does not change intake, adapters, canonical objects, Source projections, approval authority, lifecycle state, vendor contacts, migrations, loaders, or data-plane behavior.

## Client Applicability

- All clients: Source New event workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: adds bounded default rendering with accessible expand/collapse controls for Source New Intelligence lists and the governed decision trail.
- `src/components/source/new-workspace/workspace.css`: styles the compact disclosure controls and decision-trail rows.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`: adds regression coverage for collapsed high-volume review items and collapsed historical approval activity.

## QA / Validation

- RED FIRST: focused Source New workspace tests failed before implementation because the sixth Intelligence review item and seventh decision-trail entry rendered immediately.
- PASS: `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH jest --runInBand src/components/source/new-workspace/SourceNewWorkspace.test.tsx --testNamePattern='high-volume intelligence|historical approval'`
- PASS: `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH jest --runInBand src/components/source/new-workspace/SourceNewWorkspace.test.tsx`
- PASS: `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH eslint src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx`
- PASS: `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck`
- PASS: `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH node scripts/release-check.mjs --base origin/main --head HEAD`
- PASS: `git diff --check`
- Mutation check: temporarily raising both compact-list thresholds to 50 failed the two new regression tests; restoring the thresholds passed them again.

## Rollout Plan

Squash-merge through PR after validation. The repo-owned ACA main deploy workflow publishes the change. No migration, data build, data mutation, feature flag, or approval-state operation is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: yes, after deployment, on a completed Source New event with high-volume Intelligence review items and historical decision-trail activity.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No persisted data changes, approval records, lifecycle records, vendor-contact records, or migrations are involved.

## Audit Evidence

PR link, focused test output, full component test output, mutation-check output, CI, ACA digest/invariant proof, and signed-in Source New proof to be attached when available.

## Known Gaps

- Local validation used the main checkout's dependency tree through an ignored `node_modules` symlink because this fresh worktree had no installed dependencies.
- No deployed or signed-in browser proof is claimed in this release record.
