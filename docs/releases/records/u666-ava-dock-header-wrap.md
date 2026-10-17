# u666 — aVa dock header: wrap the actions instead of drawing them over the wordmark

## Release ID

`2026-10-17-ava-dock-header-wrap`

## Status

`candidate`

## Plain-English Summary

In the docked aVa panel (about 340px wide), the header has three things to hold: the aVa wordmark, the "Chat export" HTML/PDF buttons and the mode controls. They do not fit on one line. The actions could not shrink, but the row holding the wordmark could shrink to nothing, so the wordmark was drawn underneath "Chat export". It read as "aChat export" on every Moves step page in the live walk's screenshots.

The header now wraps. The wordmark's row is never narrower than the wordmark, so when space runs out the actions move to a second line. Nothing is hidden or redrawn; the wordmark asset and the controls are unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (aVa dock, every surface that docks it):** two style values. No data, route or behaviour change.

## Client Applicability

- **All clients:** yes.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none.

## Changes Included

- `src/components/agent/AgentDock.tsx`: the header wraps (`flexWrap: "wrap"`, `rowGap: 8`). The wordmark row's minimum width is the wordmark's 62px, where it used to be 0.
- `src/components/agent/__tests__/AgentDock.test.tsx`: pins both values on the rendered header.

## QA / Validation

- AgentDock suite: 69 / 69 pass. `npm run typecheck` clean; ESLint clean.
- Visual check: a replica of the header, using the real wordmark asset and the same styles at the dock's width, was rendered before and after. Before shows exactly the live overlap; after shows the wordmark and role on one line and the actions on the next.

## Rollout Plan

Ships in the next repo-owned ACA main deploy; the post-deploy walk's screenshots show the header.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's step-page screenshots.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **The header is one line taller in a narrow dock.** That is the cost of showing every control without overlap.

## Audit Evidence

- PR URL and CI run.
- Before/after header render in the PR description.
