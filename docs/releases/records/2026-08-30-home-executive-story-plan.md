# 2026-08-30-home-executive-story-plan — Home Story Plan Contract

## Release ID

`2026-08-30-home-executive-story-plan`

## Status

`candidate`

## Plain-English Summary

Home now has an explicit executive story-plan contract between verified narrative claims and the rendered page. The page no longer chooses its own executive storyline from whichever claim scores highest at render time; it consumes a published plan that names the opening thesis, supporting claims, section order, section states, and evidence boundary.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 canonical context is unchanged.

Layer 4 product projections add a `story_plan` row type to the existing Home projection table. The row references already-published chapter claims and carries ordering/state metadata; it does not introduce new factual claims.

Layer 4 Home rendering now reads the published story plan when available and treats a missing plan as a deferred publication state rather than synthesizing a fallback executive story.

## Client Applicability

- All clients: Yes, for Home preview rendering and Home ECL narrative publication behavior.
- Specific clients: None named in this public record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL default-provider path.

## Changes Included

- Adds `HomeExecutiveStoryPlanV1` type and optional bundle field.
- Writes `row_type = 'story_plan'` from the Home ECL narrative job.
- Anchors the `story_plan` control row under the existing Home executive-brief page key so the writer honors the committed projection page contract.
- Extends Home narrative readback to require exactly one story plan and validate claim references.
- Renders the Executive Story from the story plan instead of render-time claim ranking.
- Removes dead ranking helpers from the Home Executive Story renderer.
- Adds focused unit and static-contract coverage for the new plan seam.

## QA / Validation

- PASS: `npm run test:ecl-home-narrative-layer`
- PASS: `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand`
- PASS: `npx eslint scripts/ecl/build_home_ecl_narrative_layer.ts scripts/ecl/readback_home_ecl_narrative_layer.ts src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/types.ts src/components/home/v4/ExecutiveStoryPage.tsx src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`
- NOT RUN YET: post-merge ACA deploy, Home narrative apply/readback, and signed-in browser proof. These happen after PR merge.

## Rollout Plan

Merge by PR, deploy through the repo-owned Azure Container Apps main workflow, then run the Home ECL narrative apply and independent readback jobs. Browser proof is required after the data job publishes the story plan.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned ACA deployment workflow only.
- Approved image digest: Filled by deployment evidence after merge.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Required before live-proof claim.
- Feature/env flag update path: Existing Home ECL default-provider path.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous digest through the repo-owned ACA workflow. The `story_plan` rows are additive; existing summary and chapter-claim rows remain intact and can be left in place or overwritten by a prior writer run if needed.

## Audit Evidence

- PR URL, merge commit, ACA deploy run, runtime-invariant artifact, Home narrative apply/readback output, and signed-in browser screenshots to be attached after rollout.

## Known Gaps

This release creates and consumes the story-plan contract. It does not redesign every Home visual surface or certify the full eight-chapter CXO experience without the post-merge apply/readback and signed-in proof.
