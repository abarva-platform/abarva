# Moves workspace Steps return

## Release ID

`2026-10-11-moves-workspace-steps-return`

## Status

`candidate`

## Plain-English Summary

When a Moves step page opens Files or Record, the older workspace's Steps control now links directly to the appropriate step page. Previously it changed local view state and relied on a later redirect; the signed-in walk showed that route could remain on Record after the person clicked Steps. The global product bar remains in the shared shell.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 (Products — Moves): workspace navigation and its signed-in validation.
- Layers 1–3: unchanged. No tenant data, canonical records, schema, or write path changes.

## Client Applicability

- All clients: applies wherever Moves step pages are enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves step-page flags; no flag change.

## Changes Included

- Desktop Steps and compact Stage controls use a route link when all steps in the phase have pages.
- Phases still using the capture workspace keep their existing local tab behavior, including the explicit legacy route.
- The signed-in walk checks the link target and waits for the visible step route after returning from both Files and Record.
- Styling keeps the link visually consistent with adjacent tabs.

## QA / Validation

- The signed-in walk for the prior release passed the root-causes toolbar scroll check at 1906, 1440, and 390 pixels. Its direct Record-to-Steps traversal remained on the Record URL for 20 seconds; this change addresses that route path.
- Component suite: 346 tests passed, including checks for the desktop and compact route links. The unchanged capture-workspace tests passed.
- Three local Playwright layout fixtures passed.
- Changed-file ESLint and TypeScript typecheck: passed.
- The next deployed signed-in walk must pass the Files and Record return path before this change is called live proven.

## Rollout Plan

Squash merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact image and triggers the read-only signed-in Moves walk. No migration or feature flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: established by the deploy workflow.
- ACA runtime invariant: checked by the deploy workflow.
- Worker image invariant: checked by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for both Files-to-Steps and Record-to-Steps routes.

## Rollback Plan

Revert the PR through the normal release path. No data rollback is needed.

## Audit Evidence

- PR and CI checks for this release candidate.
- Repo-owned ACA deploy artifact and subsequent signed-in Moves walk artifact.

## Known Gaps

- The next deployed signed-in walk has not run yet.
- A separate reference-deck preview request timed out in the prior walk; this release does not change that route.
