# 2026-09-18-command-palette-tenant-entry — Keep shared shortcuts tenant-neutral

## Release ID

`2026-09-18-command-palette-tenant-entry`

## Status

`candidate`

## Plain-English Summary

The shared command palette offered a shortcut to one specific move in its default results. The label was visible to every signed-in user, even when that move did not belong to their tenant. The palette now offers only generic Moves shortcuts. A future recent-move shortcut must be resolved from the viewer's authorized tenant context rather than embedded in shared chrome.

## Layer Impact

- `global-control-lane`, Products layer: one shared navigation entry and its behavioral test. No intake, adapter, canonical model, schema, or tenant data changes.

## Client Applicability

- All clients: yes, through shared signed-in chrome.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Remove one hard-coded, record-specific move shortcut from `src/components/shell/CommandPalette.tsx`.
- Require the shared Moves results to remain generic in the behavior suite, and use an opaque example ID to test dynamic-route resolution.

## QA / Validation

- The new test failed against the original palette on the specific extra row: 1 failed, 8 passed.
- After removal, the focused suite passed: 9 passed.
- The broader behavior suite passed: 22 suites, 243 tests.
- Scoped ESLint and full TypeScript (`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`) exited 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` exited 0, and `git diff --check` passed.
- PR CI, deployment and signed-in checks are pending at record authoring.

## Rollout Plan

Squash-merge through a PR. The repository-owned ACA main deploy workflow builds the exact merge SHA, updates the web and required workers to a digest-pinned image, and shifts traffic after health checks. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: generated from the merge SHA by the workflow.
- ACA runtime invariant: verify template, 100%-traffic revision and required workers share that digest.
- Worker image invariant: unchanged in code; read back after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, after deploy; confirm no record-specific move label appears in the default or searched palette across tenant sessions.

## Rollback Plan

Revert this PR through the normal release lane. Reintroducing a record-specific shared label would restore the disclosure, so prefer a forward fix if another palette issue appears.

## Audit Evidence

- The focused red/green behavior test, PR and CI checks, exact-SHA ACA run, and later signed-in palette capture.

## Known Gaps

- Signed-in acceptance is reserved for the human operator and remains owed.
- This does not add authorized, tenant-scoped recent moves to the palette.
- The separate Tower lens-label issue is unchanged.
