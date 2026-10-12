# 2026-10-12-tower-source-assertion-story — Explain source plans and unverified results

## Release ID

`2026-10-12-tower-source-assertion-story`

## Status

`candidate`

## Plain-English Summary

Tower can now show more of what the source files actually say without calling those figures approved money or earned value. Program details show source expected value, dates, stage and progress. The Cost view shows prior-year figures, next-year forecasts and possible savings for each recorded spend category. Value Proof keeps outcome measures and separate AI benefit, usage and KPI feed assertions visible under their own source labels. AI case details show the stated benefit idea, approval route and controls. The existing Foundations tab also offers a paged, searchable source inventory for records with declared IDs, kept apart from AI foundation funding.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1–3: no source, loader, canonical object, measure or stored approval change in this release.
- Layer 4 Products: the shared Tower reader and detail views display source assertions already supplied by the registered-intake projection. No source assertion enters approved funding, Finance-cleared, or claimable-dollar calculations.

## Client Applicability

- All clients: shared Tower presentation wherever the additional governed projection fields are served.
- Specific clients: none loaded or selected by this release.
- Internal only: none.
- Public/demo only: no separate route.
- Feature flag: none.

## Changes Included

- Show program source plans and progress in the program detail, with source values kept apart from approved funding and measured benefit.
- Show category-level prior-year, forecast and possible-savings figures in the Cost view without summing them into a new total. Category rows still lack a declared business ID and contract amounts remain a separate population.
- Show outcome measures and benefit, usage and KPI feed claims in separate expandable Value Proof sections. Preserve each feed's source amount and raw status code, and label both as unverified for Tower reporting. No feed reconciliation or AI case identity crosswalk is inferred.
- Show source AI case hypotheses, approval routes and listed controls as intake context, without implying approval or testing occurred.
- Browse exact-ID organization, function, workforce, system, data, infrastructure, process and managed-service source records in the existing Foundations tab. The reader requests one bounded page only when that tab opens; the executive read omits those individual rows. Record details show selected business fields, source identity and quality. Source dollar fields are individual statements, never a sum or approved amount.

## QA / Validation

- PASS (local): four focused reader and rendering suites, 62 tests, including source amounts that must not enter approved or claimable totals and a paged Foundation reader that leaves executive money counts unchanged.
- PASS (local): TypeScript, changed-file lint, diff check and all 11 release gates. Exact-head validation must rerun after the source projection contract is frozen.
- NOT RUN: signed-in review; it requires a normal main deployment and explicit selection of the source-assertion projection.

## Rollout Plan

Merge the underlying registered-intake source-assertion projection first. Squash merge this protected presentation PR only after exact-head QA. The repo-owned ACA main workflow builds and deploys the merged SHA. Verify digest parity and health, then review the signed-in Tower tabs after the selected assessment is promoted through its separate governed data lane. This PR does not load or select an assessment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone may shift shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: capture after the main deploy.
- ACA runtime invariant: web template and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker images must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the affected Tower views after serving selection.

## Rollback Plan

Revert this presentation change by protected PR and redeploy through the repo-owned workflow. No source or database rollback is needed for this presentation-only release.

## Audit Evidence

The PR diff, focused tests, typecheck, lint, release-gate output, later ACA digest readback, and signed-in selected-assessment observations.

## Known Gaps

The source files do not independently prove program budget approval, outcome Finance clearance, AI feed reconciliation, or a case-to-feed identity link. Cost categories lack declared business IDs, and possible savings are not verified. Foundation maturity rows without declared record IDs and raw relationship rows are described as coverage gaps, not assigned to individual objects or shown as verified links. Business segment mapping remains pending, so no segment rollup is shown.
