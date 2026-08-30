# 2026-08-30-home-enterprise-section-order — Home Enterprise Section Ordering

## Release ID

`2026-08-30-home-enterprise-section-order`

## Status

`candidate`

## Plain-English Summary

Home's first executive-story section now opens on enterprise shape rather than supplier concentration when application, system, data, or operating-model evidence is available. Supplier and contract concentration remain available in the commercial and exposure sections, but they cannot be promoted into the enterprise-identity lead.

## Layer Impact

- Release lane: `global-control-lane`
- Product: Home preview executive story.
- Deterministic content layer: Updates chapter claim routing so regenerated executive opening slices avoid supplier concentration when enterprise-shape claims exist.

## Client Applicability

- All clients: Applies to Home preview when served from governed Home narrative rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home provider routing governs visibility.

## Changes Included

- `src/components/home/v4/ExecutiveStoryPage.tsx`: filters the enterprise section's candidate claims so supplier and contract concentration cannot lead the section when enterprise-shape claims exist.
- `scripts/data-build/build-home-chapters.ts`: applies the same enterprise-opening rule during deterministic chapter assembly.
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`: adds a rendered regression test with a planted supplier-concentration claim.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`: asserts the generator-side guard remains present.

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `npx jest src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand` — passed.
- `npx eslint scripts/data-build/build-home-chapters.ts src/components/home/v4/ExecutiveStoryPage.tsx scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx` — passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps workflow, then verify the Home preview page with a signed-in browser. Regenerate Home narrative rows only if the published rows themselves need to be rewritten; the runtime reader guard protects existing rows.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not changed.
- Live signed-in proof required: Yes, Home preview.

## Rollback Plan

Revert the PR and redeploy the prior ACA digest.

## Audit Evidence

- PR and merge SHA to be recorded after merge.
- ACA deploy workflow run and digest to be recorded after deployment.
- Home preview screenshot and text probe to be recorded after browser proof.

## Known Gaps

This release does not redesign the full Home visual system or rewrite source datasets. It closes the enterprise-opening ordering failure while broader Home UX and prompt-quality work continues.
