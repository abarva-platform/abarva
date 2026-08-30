# 2026-08-30-home-executive-story-opening — Home Executive Story Opening Discipline

## Release ID

`2026-08-30-home-executive-story-opening`

## Status

`candidate`

## Plain-English Summary

Home's executive story opening now favors enterprise-shape and operating-model facts over supplier or contract concentration. Commercial concentration remains available deeper in the story, but it cannot become the first boardroom readout simply because it carries a percentage.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates the Home preview Executive Story rendering rules and Home narrative generation contracts.
- Product projection build: Updates the Home narrative job's deterministic signal language so internal guidance does not appear in CXO-visible content.

## Client Applicability

- All clients: Applies to Home preview when served from the ECL Home narrative projection.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home provider routing governs visibility.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts`: keeps supplier concentration out of the opening story claim order.
- `scripts/ecl/build_home_ecl_narrative_layer.ts`: removes visible builder instructions from generated signal/context statements.
- `src/components/home/v4/ExecutiveStoryPage.tsx`: lets enterprise-scale counts qualify as opening numbers and de-prioritizes supplier/contract concentration for the hero metric.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`: adds ordering and visible-language assertions.
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`: asserts the executive story does not open on supplier concentration.

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `npx jest src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand` — passed.
- `npx eslint scripts/ecl/build_home_ecl_narrative_layer.ts scripts/data-build/build-enterprise-thesis.ts src/components/home/v4/ExecutiveStoryPage.tsx scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx` — passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps workflow, then run the Home narrative apply/readback jobs so the published projection rows are regenerated under the new ordering contract. Capture signed-in Home preview proof after the readback passes.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not changed.
- Live signed-in proof required: Yes, Home preview after narrative apply/readback.

## Rollback Plan

Revert the PR and redeploy the prior ACA digest. If regenerated Home narrative rows are unacceptable, rerun the prior digest's Home narrative apply job or roll back the projection rows from the latest accepted readback bundle.

## Audit Evidence

- PR and merge SHA to be recorded after merge.
- ACA deploy workflow run and digest to be recorded after deployment.
- Home narrative apply/readback job IDs to be recorded after data-plane refresh.
- Signed-in Home preview screenshot to be recorded after browser proof.

## Known Gaps

This release does not redesign the full Home visual experience. It closes the opening-ordering defect and visible builder-instruction leakage before the broader CXO design pass.
