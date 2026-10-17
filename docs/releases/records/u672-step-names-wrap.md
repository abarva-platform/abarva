# u672 — Step names wrap instead of being cut off

## Release ID

`2026-10-17-moves-step-names-wrap`

## Status

`candidate`

## Plain-English Summary

The step strip at the top of every Moves step page shares its width between the steps (five in P3). Names were cut to one line with an ellipsis, even at desktop width, so the live P3 page read "Root cause →…", "Architecture opt…" and "Operating & ad…". The full name existed only for screen readers.

A step name now wraps to a second line before it is clamped, and each step carries its full name as a hover title. Short names are unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves step pages):** one CSS rule and one attribute. No data, route or behaviour change.

## Client Applicability

- **All clients:** yes.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none (step pages keep their own flag).

## Changes Included

- `src/components/strategic-moves/step-page/MovesStepPage.module.css`: `.step-title` wraps and clamps at two lines, where it used to be one line with an ellipsis.
- `src/components/strategic-moves/step-page/MovesStepPage.tsx`: `title` on each step link and button.
- `src/components/strategic-moves/step-page/__tests__/MovesStepPage.test.tsx`: every step's title equals its full name.

## QA / Validation

- MovesStepPage suite: pass, 20 / 20. ESLint: pass.
- Visual check: a replica of the five-step strip at the live page's width, rendered before and after. Before, three names are cut; after, every name reads in full on at most two lines.

## Rollout Plan

Ships in the next repo-owned ACA main deploy; the post-deploy walk screenshots show the strip.

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

- **A name longer than two lines is still clamped.** None of today's step names is.

## Audit Evidence

- PR URL and CI run; before/after strip render in the PR.
