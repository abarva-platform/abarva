# 2026-09-18-source-tab-visual-alignment - Source navigation presentation

## Release ID

`2026-09-18-source-tab-visual-alignment`

## Status

`candidate`

## Plain-English Summary

Source workspace navigation follows the active Control Tower executive view: equally sized neutral tabs with a filled teal selected state, compact segmented secondary views, lighter heading typography, and restrained control surfaces. The Source command metrics use a flat, divided grid. The initial loading shell follows the same tab treatment, so navigation does not change appearance while data loads.

## Layer Impact

`global-control-lane`: Layer 4 product presentation only. No adapter, canonical data, read model, tenant authorization, or workflow behavior changes.

## Client Applicability

- All clients: Source workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace routing only.

## Changes Included

- Source workspace CSS for primary navigation, secondary views, header type, and control surfaces.
- Source workspace loading shell tab presentation.
- Live executive-view alignment after comparing the deployed Source and Tower pages; the earlier underline treatment is superseded.

## QA / Validation

- Focused Source workspace tests: 58 passed.
- Scoped ESLint: passed.
- Desktop and mobile Playwright style-render checks: no document-width overflow; active tab, header font, and secondary view styles computed as intended.
- TypeScript (`tsc --noEmit`) and release checks: passed.

## Rollout Plan

Squash merge through a PR. The repository-owned ACA main deploy workflow builds and releases the image; no migration or data job is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Capture after deployment.
- ACA runtime invariant: Verify template and 100% traffic revision match the approved digest.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace desktop and mobile navigation.

## Rollback Plan

Revert the presentation commit by PR and redeploy through the same workflow. No data rollback is needed.

## Audit Evidence

PR, CI results, local Playwright desktop/mobile captures, and post-deploy signed-in Source checks.

## Known Gaps

Signed-in post-deploy visual acceptance remains required before calling this live-proven.
