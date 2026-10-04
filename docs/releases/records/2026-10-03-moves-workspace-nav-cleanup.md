# 2026-10-03-moves-workspace-nav-cleanup — Moves workspace navigation

## Release ID

`2026-10-03-moves-workspace-nav-cleanup`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace now gives the desktop canvas the room previously used by two navigation columns. A single tab row across the top opens every available workspace view. Within a phase, Inputs and Workflow steps sit in a horizontal selector above the current step detail. aVa remains in the left dock on desktop, and compact controls remain available on narrow screens.

The same phase, capture, evidence, approval, and generated-artifact handlers continue to run. Next-phase preparation appears with the final Approve & Build step in the detail area.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products / Moves: presentation and navigation only. Layers 1–3 and their identity, facts, and evidence contracts are unchanged.

## Client Applicability

- All clients: Yes, in the shared Moves phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing pricing, risk, and solutioning flags still control their respective tabs.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: replaces the redundant workspace rail with one tab row, keeps the All Moves link, and moves P0–P5 step selectors above their detail content. The compact navigation uses the same available view list, with a step picker on phone widths.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: verifies workspace switching, conditional views, phase links, compact controls, and the existing phase behavior against the new navigation.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent` — 119/119 pass.
- `npm run typecheck` — clean.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — no errors; existing unused-symbol warnings in the component.
- `git diff --check` — clean.
- Local static component render in Playwright at 1440, 768, and 390 pixels: no page overflow; desktop and tablet show all step choices; phone shows a compact step picker. This checks layout only, without authentication or a live data read.
- Visual layout at desktop and narrow widths requires a signed-in check after the upstream layout stack deploys.

## Rollout Plan

Merge through a squash PR after the preceding Moves top-stepper and aVa dock changes. The repo-owned ACA main deploy workflow builds and deploys the merged image. No schema, data build, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this release.
- Approved image digest: Assigned by the main deploy workflow.
- ACA runtime invariant: Verify the template and active traffic revision against that digest at deploy.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Walk a Move across P0–P5 at desktop width and a narrow viewport, checking aVa, phase tabs, workspace tabs, step selection, Continue, and Approve & Build placement.

## Rollback Plan

Revert this PR through the main deploy lane. No data or migration rollback is involved.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/8953.
- Local validation: commands and outcomes above.
- CI and signed-in deployment proof: to be recorded when available.

## Known Gaps

- Signed-in visual proof is pending deployment of the upstream layout changes and this release.
