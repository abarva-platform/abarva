# 2026-08-31-home-source-tower-design-alignment -- Home Source/Tower Design Alignment

## Release ID

`2026-08-31-home-source-tower-design-alignment`

## Status

`candidate`

## Plain-English Summary

Home's executive story now behaves like an application canvas instead of a long narrative scroll. The left rail selects one executive-story section at a time, and the main canvas redraws around that selected section while preserving the governed story plan, evidence sources, and terminal states.

## Layer Impact

Layer 4 products: changes Home presentation behavior only. It does not change tenant data, source adapters, canonical ECL records, projections, serving views, Claude generation, or data-plane load behavior.

## Client Applicability

- All clients: Applies to the Home preview surface.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Improves the demo Home experience for non-client reference data.
- Feature flag: None.

## Changes Included

- `src/components/home/v4/ExecutiveStoryPage.tsx` keeps the six executive story sections in the rail but renders only the active section's canvas.
- The opening story remains the default initial canvas; selecting another story section updates the browser hash and replaces the main canvas.
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx` now asserts one visible executive-story canvas at a time and verifies rail-driven navigation.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`
- Pending: release control check.
- Pending: GitHub PR checks.
- Pending: deployed signed-in Home browser proof after merge.

## Rollout Plan

Merge through the normal PR path. Deploy through the repo-owned ACA main deployment workflow if this candidate is promoted. Verify the live Home route after deployment with a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: Required for live proof.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be resolved by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home visual behavior.

## Rollback Plan

Revert this PR. Since no data-plane state changes, rollback is code-only and restores the prior long-scroll executive story rendering.

## Audit Evidence

Inspect the PR diff, Home Tier 1 test output, GitHub checks, ACA deploy proof if promoted, and signed-in Home browser screenshots.

## Known Gaps

This release changes the Home executive-story interaction model. It does not regenerate or approve Home narrative content; the narrative quality measurement lane remains the proof path for generated executive prose.
