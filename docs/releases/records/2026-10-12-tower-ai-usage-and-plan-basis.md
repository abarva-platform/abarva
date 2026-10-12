# 2026-10-12-tower-ai-usage-and-plan-basis — Show recorded usage and source plans accurately

## Release ID

`2026-10-12-tower-ai-usage-and-plan-basis`

## Status

`candidate`

## Plain-English Summary

Tower now says whether an AI row has recorded usage. A case in evaluation, pilot, or pause is no longer counted as an active production case solely because it appears in the portfolio. A program's source-listed planning budget appears in its detail view alongside a clear warning that its fiscal year and approval are unverified. Approved funding and claimable benefit amounts remain separate.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1–3: no intake, loader, canonical object, measure, relationship, or approval change.
- Layer 4 Products: the shared Tower reader derives usage and active-case counts from recorded fields. The program detail displays an existing planning amount without adding it to approved funding.

## Client Applicability

- All clients: shared Tower Command Center reads after the standard web release.
- Specific clients: none loaded or promoted by this release.
- Internal only: none.
- Public/demo only: no separate route.
- Feature flag: none.

## Changes Included

- A numeric usage observation, including a recorded zero, or a recorded adoption rate determines whether Tower calls usage recorded. Separate usage-feed rows explain that no case or dollar benefit is linked by that observation alone.
- The active AI case count requires an explicit source status indicating production or live use. Evaluation, pilot, pause, and missing statuses do not establish active production use. The usage count counts rows with recorded usage, not unique people or linked cases.
- Program details show the source planning budget only when its amount is present. The approved fiscal-year funding amount keeps its independent approval gate and remains unknown when no approval is recorded.

## QA / Validation

- Focused reader and detail tests: 2 suites, 36 tests passed. Cases include a source-listed plan without approval, evaluation/pilot/pause versus production, and a recorded zero user count.
- TypeScript no-emit check with an 8 GiB Node heap, changed-file ESLint, all 11 release gates, and diff check passed. The default 4 GiB TypeScript heap was insufficient for this repository on the local machine.
- Signed-in review: required after the normal main deployment and selected assessment promotion.

## Rollout Plan

Squash merge the protected PR, then let the repo-owned ACA main deploy workflow publish the exact merged image. Verify the approved digest at the web template, 100% traffic revision, and required workers. Then check the signed-in Tower program detail and AI portfolio on the selected assessment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone may shift shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: captured after the main deploy.
- ACA runtime invariant: web template and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker images must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash commit in a protected PR and redeploy through the repo-owned workflow. No data or schema rollback is needed.

## Audit Evidence

The PR diff, focused tests, typecheck, lint and release-gate results, followed by the main deploy digest readback and signed-in Tower observations.

## Known Gaps

The source planning amount has no verified fiscal period or approval. Separate usage rows have no declared link to intake AI cases. Neither source status nor usage establishes a Finance-approved benefit.
