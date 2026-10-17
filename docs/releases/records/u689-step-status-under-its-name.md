# u689 — A step's status sits under its own name

## Release ID

`2026-10-17-moves-step-status-under-its-name`

## Status

`candidate`

## Plain-English Summary

The step strip at the top of every Moves step page shows each step's number, name and, when it is not a full step, a short status such as "· open", "· Light" or "· Skipped". Since u672, long names wrap to two lines instead of being cut off. But the status stayed in the same row as the number and name. On the live P3 page, "· open" therefore floated at the right of each wrapped name, centred between its two lines, and read as if it belonged to the gap between steps.

The name and its status now share one column, so the status sits directly under the name it describes. The text is unchanged and so is the phone layout, where only the current step's name shows.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves step pages):** one wrapper element and one CSS rule. No data, route or behaviour change.

## Client Applicability

- **All clients:** yes.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none (step pages keep their own flag).

## Changes Included

- `src/components/strategic-moves/step-page/MovesStepPage.tsx`: a `step-label` column around the name and its status.
- `src/components/strategic-moves/step-page/MovesStepPage.module.css`: `.step-label`.
- `src/components/strategic-moves/step-page/__tests__/MovesStepPage.test.tsx`: the name is followed by its status inside the same label, for an open step and for a light step.

## QA / Validation

- Step-page and phase-client suites: pass, 14 suites, 637 tests. The text the existing tests pin is unchanged.
- Mutation testing: 1 / 1 killed (wrapper removed).
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).
- Visual check: the post-deploy walk's P3 screenshots at 1440 and 390, light and dark.

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

- **The status keeps its leading "·".** Existing tests and assistive text read the name and status as one phrase, so the separator stays even though the two now sit on separate lines.

## Audit Evidence

- PR URL and CI run; the live walk's P3 strip before the change.
